// Leximan PCM41 / PCM42 digital delays: the sound engine (see references/pcm41-42/README.md, sections 1.6 and 2.6).
//
// Both units are a 12-bit companded memory written and read by a VOLTAGE-CONTROLLED SAMPLE CLOCK. A delay tap is a fixed
// number of memory words, so the delay time is words / clock rate, and every sweep (manual knob, LFO, envelope) is a real
// sample-rate change: pitch bends, and on the PCM41 the slow clock settings alias. This engine runs the memory on its own
// virtual clock, inside the host's sample stream:
//   input -> [PCM42: 5:1 compressor] -> + feedback -> [PCM42: soft limiter] -> anti-alias LPF -> pre-emphasis
//   -> compander + 12-bit quantiser (hard clip at full scale) -> memory (written at the virtual clock)
//   memory (read at the virtual clock, held between ticks) -> reconstruction LPF -> de-emphasis -> wet
//   wet -> feedback filters (41: LO 80 Hz, HI 4 kHz; 42: HI CUT 4 kHz), polarity, gain -> back to the input
//   out = (1 - mix) * dry + mix * (+/- wet)
// Levels: the unit's converter full scale is 1.0 after the LEVEL knob. LEVEL changes the drive only: the output is
// scaled back, as the rear output trim would be set, so turning it up adds headroom-meter action and grit, not volume.

const PCM_TAU = 2 * Math.PI;
class PcmBq {   // RBJ low-pass biquad (or a 1st-order section when q is 0)
  constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
  lp(fs, f, q) {
    f = Math.min(f, fs * 0.45);
    if (!q) { const k = Math.tan(Math.PI * f / fs); this.b0 = this.b1 = k / (1 + k); this.b2 = 0; this.a1 = (k - 1) / (1 + k); this.a2 = 0; return this; }
    const w = PCM_TAU * f / fs, al = Math.sin(w) / (2 * q), c = Math.cos(w), a0 = 1 + al;
    this.b0 = this.b2 = (1 - c) / 2 / a0; this.b1 = (1 - c) / a0; this.a1 = -2 * c / a0; this.a2 = (1 - al) / a0; return this;
  }
  hp1(fs, f) { const k = Math.tan(Math.PI * f / fs); this.b0 = 1 / (1 + k); this.b1 = -this.b0; this.b2 = 0; this.a1 = (k - 1) / (1 + k); this.a2 = 0; return this; }
  shelf(fs, fz, fp) {   // 1st-order (1 + s/wz) / (1 + s/wp), bilinear: emphasis (fz < fp) and its inverse
    const K = 2 * fs, wz = PCM_TAU * fz, wp = PCM_TAU * fp, n0 = 1 + K / wz, n1 = 1 - K / wz, d0 = 1 + K / wp, d1 = 1 - K / wp;
    this.b0 = n0 / d0; this.b1 = n1 / d0; this.b2 = 0; this.a1 = d1 / d0; this.a2 = 0; return this;
  }
  run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
}

// the PCM41's 11 taps, in steps of 32 memory words (0, 0.8, 1.6, 2.4, 4, 7, 13, 26, 50, 100, 200 ms at the nominal clock)
export const PCM41_TAPS = [0, 1, 2, 3, 5, 9, 17, 33, 64, 128, 256];
export const PCM41_TAP_MS = [0, 0.8, 1.6, 2.4, 4, 7, 13, 26, 50, 100, 200];
export const PCM42_CLK_N = [1, 3, 5, 7, 9], PCM42_CLK_D = [1, 2, 4, 8, 16, 32, 64];
const PCM_MU = 16, PCM_LMU = Math.log(1 + PCM_MU), PCM_Q = 2047;

export class PCM4x {
  constructor(fs, model = 41) {
    this.fs = fs; this.model = model;
    this.N = model === 41 ? 8192 : 49152;            // memory words
    this.fsNom = model === 41 ? 40960 : 61440;       // the clock at the manual knob's centre (X1)
    this.mem = new Float32Array(this.N); this.w = 0; this.ph = 0;
    this.p = { power: true, level: 7, fb: 0, fbInv: false, lo: false, hi: false, mix: 0.5, dlyInv: false, x2: false, tap: model === 41 ? 7 : 64, mult: 0.5, depth: 0, wave: 0, rate: 0.5, byp: false, rpt: false, clkN: 0, clkD: 1 };
    this.aa = [new PcmBq(), new PcmBq()]; this.rc = [new PcmBq(), new PcmBq()];
    this.pre = new PcmBq(); this.de = new PcmBq();
    this.fLo = new PcmBq().hp1(fs, 80); this.fHi = new PcmBq().lp(fs, 4000, 0);
    this.pre.shelf(fs, 1 / (PCM_TAU * 50e-6), 1 / (PCM_TAU * 12.5e-6)); this.de.shelf(fs, 1 / (PCM_TAU * 12.5e-6), 1 / (PCM_TAU * 50e-6));
    this.xPrev = 0; this.hold = 0; this.wet = 0; this.env = 0; this.cenv = 0; this.lfo = 0; this.D = 1; this.Dt = 1;
    this.peak = 0; this.frozen = false; this.rptWant = false; this.ticks = 0; this.clk = false; this.clkT = 0; this.frWords = 0;
    this.setFilters(false);
  }
  setFilters(x2) {
    const f = x2 ? 5800 : (this.model === 41 ? 17300 : 16500);
    this.aa[0].lp(this.fs, f, 0.54); this.aa[1].lp(this.fs, f, 1.31); this.rc[0].lp(this.fs, f, 0.54); this.rc[1].lp(this.fs, f, 1.31); this.x2f = x2;
  }
  set(o) { Object.assign(this.p, o); if (this.p.x2 !== this.x2f) this.setFilters(this.p.x2); return this; }
  // the delay factor D for a control voltage 0..1 (41: 0.5 -> 1 -> 2 over the two halves; 42: 0.5 .. 1.5, linear)
  dOf(cv) { return this.model === 41 ? (cv < 0.5 ? 0.5 + cv : 1 + (cv - 0.5) * 2) : 0.5 + cv; }
  rateHz() { return 0.1 * 100 ** this.p.rate; }
  tapWords() { return this.model === 41 ? Math.max(4, PCM41_TAPS[this.p.tap] * 32) : Math.max(4, this.p.tap * 192); }
  clockWords() { return Math.max(64, Math.round(this.N * PCM42_CLK_N[this.p.clkN] / PCM42_CLK_D[this.p.clkD])); }
  fsv() { return this.fsNom / this.D / (this.p.x2 ? 2 : 1); }
  delayMs() { return this.tapWords() / this.fsv() * 1000 + (this.model === 41 ? 0.1 : 0.05); }
  // memory word in: compander, 12 bits (symmetrical hard clip), expander. Signal-correlated grain
  static q(x) {
    const a = Math.min(1, Math.abs(x)), c = Math.round(Math.log(1 + PCM_MU * a) / PCM_LMU * PCM_Q) / PCM_Q;
    return (x < 0 ? -1 : 1) * (Math.exp(c * PCM_LMU) - 1) / PCM_MU;
  }
  process(x, y, n) {
    const P = this.p, fs = this.fs;
    if (!P.power) { y.fill(0); return; }
    const g = 10 ** ((P.level - 7) * 4 / 20), ig = 1 / g;
    // the control voltage, once per block: (1 - depth) * manual + depth * wave
    const rate = this.rateHz(); this.lfo = (this.lfo + rate * n / fs) % 1;
    const sine = 0.5 - 0.5 * Math.cos(PCM_TAU * this.lfo), sq = this.lfo < 0.5 ? 1 : 0;
    const envCv = 1 - Math.min(1, this.cenv * 3), wv = P.wave;
    const wave = wv < 0.5 ? sine + (envCv - sine) * wv * 2 : envCv + (sq - envCv) * (wv - 0.5) * 2, dep = P.depth / 10;
    const cv = Math.max(0, Math.min(1, (1 - dep) * P.mult + dep * wave));
    const D0 = this.D, D1 = this.dOf(cv); this.D = D1;
    const tap = this.tapWords(), N = this.N, fbG = (P.fb / 10) * (this.model === 41 ? 0.8 : 0.85) * (P.fbInv ? -1 : 1);
    const mix = P.mix, wetS = P.dlyInv ? -1 : 1, x2 = P.x2 ? 2 : 1;
    const rlE = Math.exp(-1 / (0.1 * fs)), atE = Math.exp(-1 / (0.002 * fs)), cRel = Math.exp(-1 / (0.1 * fs)), cAt = Math.exp(-1 / (0.001 * fs));
    const clkW = this.model === 42 ? this.clockWords() : 0; this.rptWant = !!P.rpt;
    let pk = this.peak * 0.97 ** (n / 128);
    for (let i = 0; i < n; i++) {
      const dry = x[i];
      let s = dry * g;
      // envelope (for the ENV waveform): fast attack, ~100 ms release
      const a = Math.abs(s); this.cenv = a > this.cenv ? a + (this.cenv - a) * atE : this.cenv * rlE;
      if (this.model === 42) {   // 5:1 compression from -3 dBFS (peak detector), before the feedback joins
        this.env = Math.abs(s) > this.env ? Math.abs(s) + (this.env - Math.abs(s)) * cAt : this.env * cRel;
        const th = 0.708; if (this.env > th) s *= (th * (this.env / th) ** 0.2) / this.env;
      }
      if (P.byp && this.model === 42) s = 0;   // PCM42 bypass also cuts the feed into the delay
      let fb = this.wet;
      if (this.model === 41) { if (P.lo) fb = this.fLo.run(fb); else this.fLo.run(fb); if (P.hi) fb = this.fHi.run(fb); else this.fHi.run(fb); }
      else if (P.hi) fb = this.fHi.run(fb); else this.fHi.run(fb);
      s += fb * fbG;
      if (this.model === 42) { const t = Math.abs(s); if (t > 0.7) s = Math.sign(s) * (0.7 + 0.3 * Math.tanh((t - 0.7) / 0.3)); }   // soft limiter
      s = this.aa[1].run(this.aa[0].run(s));
      s = this.pre.run(s);
      const sa = Math.abs(s); if (sa > pk) pk = sa;
      // the virtual clock: tick at fsv, writing (interpolated) input words and reading the tap
      const D = D0 + (D1 - D0) * (i + 1) / n, step = this.fsNom / D / x2 / fs;
      let ph = this.ph + step, acc = 0, cnt = 0;
      while (ph >= 1) {
        ph -= 1;
        const fr = 1 - ph / step, xin = this.xPrev + (s - this.xPrev) * Math.min(1, Math.max(0, fr));
        if (this.model === 42 && clkW) {   // the metronome: an edge every clkW words; inf repeat starts / stops on one
          if (++this.ticks >= clkW) { this.ticks = 0; this.clkT = 0.06 * fs; if (this.rptWant !== this.frozen) this.frozen = this.rptWant; }
        }
        const fz = this.model === 41 ? P.rpt : this.frozen;
        const r = (this.w - (fz ? N : tap) + N) % N, out = this.mem[r];
        if (!fz) this.mem[this.w] = PCM4x.q(xin);
        this.w = (this.w + 1) % N;
        acc += out; cnt++;
      }
      this.ph = ph; this.xPrev = s;
      if (cnt) this.hold = acc / cnt;
      let wv2 = this.de.run(this.rc[1].run(this.rc[0].run(this.hold)));
      this.wet = wv2;
      wv2 *= ig;
      y[i] = P.byp ? dry : (1 - mix) * dry + mix * wetS * wv2;
    }
    if (this.clkT > 0) this.clkT -= n;
    this.peak = pk;
  }
  meters() {
    return { peakDb: 20 * Math.log10(this.peak + 1e-9), ms: this.delayMs(), lfo: this.lfo, clk: this.clkT > 0, inf: this.model === 41 ? this.p.rpt : this.frozen };
  }
}
