// JH-Mix console: the audio of each channel and the stereo bus. 32 channels (1-24 tape returns or their inputs, 25-32
// line inputs). Per channel: source, trim, phase, the EQ as drawn on the strip (HI / MID / LOW bands, 18 dB/oct HPF 45 Hz,
// LPF 16 kHz), the fader (the strip's long-throw scale), pan (constant power), mute / solo, and sends 1, 2 (mono), 3-4
// and 5-6 (stereo, with pan), each pre or post fader. The stereo bus sums the channels; MASTER sets it. Levels: 1.0 = full
// scale in the buffers; VU0 is 0 VU on the tape (the console's 0 dB).
const JM_TAU = 2 * Math.PI;
class JmBq {
  constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.z1 = 0; this.z2 = 0; }
  set(type, fs, f0, Q, g) {
    const A = 10 ** (g / 40), w = JM_TAU * Math.min(f0, fs * 0.45) / fs, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * Q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0; return this;
  }
  one(type, fs, fc) { const k = Math.tan(Math.PI * Math.min(fc, fs * 0.45) / fs); if (type === 'hp') { this.b0 = 1 / (1 + k); this.b1 = -this.b0; } else { this.b0 = this.b1 = k / (1 + k); } this.b2 = 0; this.a1 = (k - 1) / (1 + k); this.a2 = 0; return this; }
  run(x) { const y = this.b0 * x + this.z1; this.z1 = this.b1 * x - this.a1 * y + this.z2; this.z2 = this.b2 * x - this.a2 * y; return y; }
}
// the fader scale printed on the strip: position 0 (top) .. 1 (bottom) -> dB
export const JM_FMARK = [[0, 10], [0.2, 0], [0.42, -10], [0.6, -20], [0.82, -40], [1, -Infinity]];
export function jmFaderDb(pos) {
  pos = Math.max(0, Math.min(1, pos));
  for (let i = 0; i < JM_FMARK.length - 1; i++) { const [p0, d0] = JM_FMARK[i], [p1, d1] = JM_FMARK[i + 1]; if (pos <= p1) { if (d1 === -Infinity) return pos >= 0.995 ? -Infinity : d0 - (pos - p0) / (p1 - p0) * 40; return d0 + (pos - p0) / (p1 - p0) * (d1 - d0); } }
  return -Infinity;
}
const dbg = (d) => (d <= -59.9 ? 0 : 10 ** (d / 20));
export function jmChDefaults() {
  return { src: 'tape', trim: 0, phase: false, eq_in: true, hf_f: 10000, hf_g: 0, mf_f: 1500, mf_g: 0, lf_f: 100, lf_g: 0, hpf: false, lpf: false,
    fader: 0.2, pan: 0, mute: false, solo: false, bus: [], panbus: true, oddeven: 0, buslvl: 0, s1: -60, s2: -60, s12pre: false, s34: -60, s34p: 0, s34pre: false, s56: -60, s56p: 0, s56pre: true };
}
export class JHMix {
  constructor(fs, n = 32) {
    this.fs = fs; this.n = n; this.master = 0.2; this.dim = false; this.mono = false; this.cut = false;
    this.ch = Array.from({ length: n }, () => ({ p: jmChDefaults(), f: [new JmBq(), new JmBq(), new JmBq(), new JmBq(), new JmBq(), new JmBq(), new JmBq()], vu: 0, g: 0, gl: 0, gr: 0 }));
    this.ch.forEach((c, i) => this.update(i));
    this.L = new Float32Array(128); this.R = new Float32Array(128); this.sends = Array.from({ length: 6 }, () => new Float32Array(128)); this.tmp = new Float32Array(128);
    this.vuL = 0; this.vuR = 0; this.peakL = 0; this.peakR = 0;
    this.bus = Array.from({ length: 24 }, () => new Float32Array(128)); this.busVu = new Float32Array(24);
  }
  set(i, o) { Object.assign(this.ch[i].p, o); this.update(i); }
  update(i) {
    const c = this.ch[i], P = c.p, fs = this.fs;
    c.f[0].set('peak', fs, P.hf_f, 0.7, P.hf_g); c.f[1].set('peak', fs, P.mf_f, 1.2, P.mf_g); c.f[2].set('peak', fs, P.lf_f, 0.7, P.lf_g);
    c.f[3].one('hp', fs, 45); c.f[4].set('hp', fs, 45, 1, 0); c.f[5].one('lp', fs, 16000); c.f[6].set('lp', fs, 16000, 1, 0);
    c.trimG = 10 ** (P.trim / 20) * (P.phase ? -1 : 1);
    c.g = dbg(jmFaderDb(P.fader)); const a = (P.pan + 1) * Math.PI / 4; c.gl = Math.cos(a) * Math.SQRT2; c.gr = Math.sin(a) * Math.SQRT2;
    c.gl = Math.min(1, c.gl); c.gr = Math.min(1, c.gr);   // centre = unity on both sides (the JH-Mix pan law, -3 dB is too quiet against tape levels)
    const sp = (v) => { const b = (v + 1) * Math.PI / 4; return [Math.cos(b), Math.sin(b)]; };
    c.s = [dbg(P.s1), dbg(P.s2), dbg(P.s34), dbg(P.s56)]; c.s34 = sp(P.s34p); c.s56 = sp(P.s56p);
    // bus assignment: the selected buses (1-24) after the fader, at BUS LVL; with PAN in, ODD / EVEN split by the pan pot.
    // A channel playing its own track back (source TAPE) never feeds that track's bus: no loop tape -> bus -> same tape
    const [po, pe] = sp(P.oddeven), bl = dbg(P.buslvl);
    c.busList = (P.bus || []).filter((b) => b >= 1 && b <= 24 && !(P.src === 'tape' && b - 1 === i)).map((b) => [b - 1, bl * (P.panbus ? (b % 2 ? po : pe) * Math.SQRT2 : 1)]);
  }
  // src(i) -> Float32Array of the channel's source for this block (or null for silence)
  process(src, n) {
    if (this.L.length !== n) { this.L = new Float32Array(n); this.R = new Float32Array(n); this.sends = this.sends.map(() => new Float32Array(n)); this.tmp = new Float32Array(n); }
    const L = this.L, R = this.R, S = this.sends, y = this.tmp; L.fill(0); R.fill(0); for (const s of S) s.fill(0);
    if (this.bus[0].length !== n) this.bus = this.bus.map(() => new Float32Array(n)); for (const b of this.bus) b.fill(0);
    const soloAny = this.ch.some((c) => c.p.solo), kv = 1 / (0.1 * this.fs);
    for (let i = 0; i < this.n; i++) {
      const c = this.ch[i], P = c.p, x = src(i);
      if (!x) { c.vu *= Math.exp(-n * kv); continue; }
      const f = c.f, eq = P.eq_in;
      let v = c.vu;
      for (let k = 0; k < n; k++) {
        let s = x[k] * c.trimG;
        if (P.hpf) s = f[4].run(f[3].run(s));
        if (eq) s = f[2].run(f[1].run(f[0].run(s)));
        if (P.lpf) s = f[6].run(f[5].run(s));
        y[k] = s;
      }
      const on = !P.mute && (!soloAny || P.solo), g = on ? c.g : 0, gl = g * c.gl, gr = g * c.gr;
      const pre = (flag) => (flag ? (P.mute ? 0 : 1) : g);
      const g1 = c.s[0] * pre(P.s12pre), g2 = c.s[1] * pre(P.s12pre), g3 = c.s[2] * pre(P.s34pre), g5 = c.s[3] * pre(P.s56pre);
      for (let k = 0; k < n; k++) {
        const s = y[k]; L[k] += s * gl; R[k] += s * gr;
        if (g1) S[0][k] += s * g1; if (g2) S[1][k] += s * g2;
        if (g3) { S[2][k] += s * g3 * c.s34[0]; S[3][k] += s * g3 * c.s34[1]; }
        if (g5) { S[4][k] += s * g5 * c.s56[0]; S[5][k] += s * g5 * c.s56[1]; }
        v += (Math.abs(s * g) - v) * kv;
      }
      c.vu = v;
      const gb = P.mute ? 0 : c.g;   // the buses follow the fader and the mute (not the solo)
      if (gb) for (const [bi, k0] of c.busList) { const B = this.bus[bi], gg = gb * k0; for (let k = 0; k < n; k++) B[k] += y[k] * gg; }
    }
  }
  // after anything else is summed into L / R: the master fader, DIM / MONO / CUT, the bus meters
  finish(n) {
    const g = this.cut ? 0 : dbg(jmFaderDb(this.master)) * (this.dim ? 0.1 : 1), L = this.L, R = this.R, kv = 1 / (0.1 * this.fs);
    let vl = this.vuL, vr = this.vuR, pl = this.peakL * 0.97 ** (n / 128), pr = this.peakR * 0.97 ** (n / 128);
    for (let k = 0; k < n; k++) {
      let l = L[k] * g, r = R[k] * g; if (this.mono) { const m = (l + r) / 2; l = m; r = m; }
      L[k] = l; R[k] = r; vl += (Math.abs(l) - vl) * kv; vr += (Math.abs(r) - vr) * kv; if (Math.abs(l) > pl) pl = Math.abs(l); if (Math.abs(r) > pr) pr = Math.abs(r);
    }
    this.vuL = vl; this.vuR = vr; this.peakL = pl; this.peakR = pr;
  }
  meters(vu0) { const d = (v) => 20 * Math.log10(Math.max(v, 1e-9) / (0.6366 * vu0)); for (let b = 0; b < 24; b++) { const B = this.bus[b]; let pk = 0; for (let k = 0; k < B.length; k++) pk = Math.max(pk, Math.abs(B[k])); this.busVu[b] = pk; } return { bus: Array.from(this.busVu, (v) => Math.round(20 * Math.log10(v + 1e-9))), ch: this.ch.map((c) => Math.round(d(c.vu) * 10) / 10), L: d(this.vuL), R: d(this.vuR), peakL: 20 * Math.log10(this.peakL + 1e-9), peakR: 20 * Math.log10(this.peakR + 1e-9) }; }
}
