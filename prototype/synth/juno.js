// Rowan JUNO-1060 (after the Roland Juno-106, 1984): six voices, one DCO each (saw and pulse at once, PWM from the LFO or
// the slider, a square sub-oscillator an octave down, noise), the 24 dB/oct resonant VCF per voice (cutoff + envelope
// (either polarity) + LFO + keyboard follow), one ADSR shared by VCF and VCA (or a gate on the VCA), a triangle LFO with a
// delay before it fades in, a 4-position HPF after the voices (0 = bass boost, 1 = flat, 2-3 = high-pass) and the stereo
// BBD chorus (I, II, or both). Slider values are 0..1 as on the panel; switches are numbers / booleans.
const JU_TAU = 2 * Math.PI;
export const JUNO_PARAMS = ['lfoRate', 'lfoDelay', 'dcoLfo', 'pwm', 'sub', 'noise', 'hpf', 'cutoff', 'res', 'env', 'vcfLfo', 'kybd', 'vcaLevel', 'a', 'd', 's', 'r'];
export function junoDefaults() {
  return { lfoRate: 0.4, lfoDelay: 0, dcoLfo: 0, pwm: 0.4, pwmLfo: false, range: 8, pulse: true, saw: true, sub: 0.4, noise: 0, hpf: 1,
    cutoff: 0.55, res: 0.15, envPol: 1, env: 0.3, vcfLfo: 0, kybd: 0.5, vcaGate: false, vcaLevel: 0.6, a: 0.02, d: 0.45, s: 0.6, r: 0.35, chorus: 1, bend: 0, bendDco: 0.2, bendVcf: 0, porta: 0 };
}
// slider -> seconds (the Juno's envelope ranges: attack 1.5 ms .. 3 s, decay / release 1.5 ms .. 12 s)
const junoT = (v, max) => 0.0015 * (max / 0.0015) ** v;
const pb = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };   // polyBLEP
export class Juno {
  constructor(fs) {
    this.fs = fs; this.p = junoDefaults(); this.lfoPh = 0; this.lfoAmt = 0; this.held = 0; this.seed = 1060; this.t = 0;
    this.v = Array.from({ length: 6 }, () => ({ on: false, note: -1, gate: false, ph: 0, subPh: 0, env: 0, stage: 'idle', s: [0, 0, 0, 0], age: 0, f: 0 }));
    // chorus: two modulated delay lines (the MN3009 BBDs), ~3 ms around their centre
    this.cN = 2048; this.cBuf = new Float32Array(this.cN); this.cW = 0; this.cPh = 0;
    this.hp = { z: 0, z2: 0 }; this.peak = 0;
  }
  set(o) { Object.assign(this.p, o); return this; }
  noise() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 2147483648 - 1; }
  noteOn(note, vel = 100) {
    let v = this.v.find((x) => x.note === note && x.on) || this.v.find((x) => !x.on) || this.v.reduce((a, b) => (a.gate && !b.gate ? b : !a.gate && b.gate ? a : a.age < b.age ? a : b));
    const glide = this.p.porta > 0 && v.on;
    Object.assign(v, { on: true, note, gate: true, stage: 'a', age: ++this.t, vel });
    v.tf = 440 * 2 ** ((note - 69) / 12); if (!glide || !v.f) v.f = v.tf;
    if (!this.held++) this.lfoT = 0;   // the LFO delay restarts when the first key goes down
  }
  noteOff(note) { for (const v of this.v) if (v.on && v.gate && v.note === note) { v.gate = false; v.stage = 'r'; this.held = Math.max(0, this.held - 1); } }
  allOff() { for (const v of this.v) { v.on = false; v.gate = false; v.stage = 'idle'; v.env = 0; } this.held = 0; }
  process(L, R, n) {
    const fs = this.fs, P = this.p, dt = 1 / fs;
    L.fill(0); if (R !== L) R.fill(0);
    // LFO: triangle, 0.1-30 Hz, faded in over the delay time after the first key
    const lfoHz = 0.1 * 300 ** P.lfoRate, lfoDel = P.lfoDelay * 3;
    const rngMul = { 16: 0.5, 8: 1, 4: 2 }[P.range] || 1, bend = (P.bend || 0) * (P.bendDco || 0) * 2;
    const aT = junoT(P.a, 3), dT = junoT(P.d, 12), rT = junoT(P.r, 12), sus = P.s;
    const aInc = dt / aT, dK = 1 - Math.exp(-dt / (dT / 4)), rK = 1 - Math.exp(-dt / (rT / 4));
    const portaK = P.porta > 0 ? 1 - Math.exp(-dt / (P.porta * 0.6)) : 1;
    const mixSaw = P.saw ? 0.5 : 0, mixPulse = P.pulse ? 0.5 : 0, mixSub = P.sub * 0.5, mixNoise = P.noise * 0.4;
    const resK = P.res * 4.1;   // 4-pole ladder feedback: self-oscillates near the top
    let pk = this.peak * 0.97 ** (n / 128);
    for (let i = 0; i < n; i++) {
      this.lfoPh = (this.lfoPh + lfoHz * dt) % 1; const tri = this.lfoPh < 0.5 ? 4 * this.lfoPh - 1 : 3 - 4 * this.lfoPh;
      if (this.held) this.lfoT = (this.lfoT || 0) + dt;
      const lfoFade = lfoDel <= 0 ? 1 : Math.min(1, Math.max(0, ((this.lfoT || 0) - lfoDel * 0.5) / (lfoDel * 0.5))), lfo = tri * lfoFade;
      const pw = 0.5 - 0.45 * (P.pwmLfo ? P.pwm * (0.5 + 0.5 * lfo) : P.pwm);
      let out = 0;
      for (const v of this.v) {
        if (!v.on) continue;
        // envelope
        if (v.stage === 'a') { v.env += aInc; if (v.env >= 1) { v.env = 1; v.stage = 'd'; } }
        else if (v.stage === 'd') v.env += (sus - v.env) * dK;
        else if (v.stage === 'r') { v.env -= v.env * rK; if (v.env < 1e-4) { v.on = false; v.stage = 'idle'; continue; } }
        // DCO
        v.f += (v.tf - v.f) * portaK;
        const f = v.f * rngMul * 2 ** ((P.dcoLfo * lfo * 0.5 + bend) / 12 * 12 / 12), inc = Math.min(0.45, f * dt);
        v.ph += inc; if (v.ph >= 1) { v.ph -= 1; v.subPh ^= 1; }
        const saw = 2 * v.ph - 1 - pb(v.ph, inc);
        let pul = v.ph < pw ? 1 : -1; pul += pb(v.ph, inc); pul -= pb((v.ph - pw + 1) % 1, inc);
        const sub = v.subPh ? 1 : -1;
        let x = saw * mixSaw + pul * mixPulse + sub * mixSub + this.noise() * mixNoise;
        // VCF: cutoff from the slider (about 8 Hz .. 22 kHz), envelope, LFO, keyboard follow, bender
        const envMod = (P.envPol >= 0 ? v.env : 1 - v.env) * P.env * 9;   // up to 9 octaves
        const oct = P.cutoff * 11.4 + envMod + lfo * P.vcfLfo * 3 + (v.note - 60) / 12 * P.kybd + (P.bend || 0) * (P.bendVcf || 0) * 3;
        const fc = Math.min(fs * 0.42, 8 * 2 ** oct), g = Math.tan(Math.PI * fc / fs), G = g / (1 + g);
        const s = v.s; let yy = Math.tanh(x - resK * (v.y4 || 0));   // 4 trapezoidal one-poles, the last output fed back
        for (let k = 0; k < 4; k++) { const vv = (yy - s[k]) * G, o = vv + s[k]; s[k] = o + vv; yy = o; }
        v.y4 = yy; const y = yy * (1 + P.res * 0.6);
        // VCA: the envelope, or a gate (with a little smoothing against clicks)
        if (P.vcaGate) { v.gl = (v.gl || 0) + ((v.gate ? 1 : 0) - (v.gl || 0)) * 0.01; if (!v.gate && v.gl < 1e-4 && v.stage === 'r') { v.on = false; v.stage = 'idle'; } }
        out += y * (P.vcaGate ? v.gl : v.env) * P.vcaLevel * 0.5;
      }
      // HPF: 0 = bass boost, 1 = flat, 2 / 3 = 240 / 720 Hz high-pass (1-pole, like the board's)
      if (P.hpf !== 1) {
        const fh = P.hpf === 0 ? 120 : P.hpf === 2 ? 240 : 720, k = 1 - Math.exp(-JU_TAU * fh / fs); this.hp.z += k * (out - this.hp.z);
        out = P.hpf === 0 ? out + this.hp.z * 0.8 : out - this.hp.z;
      }
      // chorus: I = 0.5 Hz, shallow; II = 0.8 Hz, deeper; I+II = fast vibrato-like; the two outputs in antiphase
      let l = out, r = out;
      if (P.chorus) {
        const rate = P.chorus === 1 ? 0.513 : P.chorus === 2 ? 0.863 : 9.75, depth = P.chorus === 3 ? 0.0003 : P.chorus === 1 ? 0.0019 : 0.0027;
        this.cPh = (this.cPh + rate * dt) % 1; const ct = this.cPh < 0.5 ? 4 * this.cPh - 1 : 3 - 4 * this.cPh;
        this.cBuf[this.cW] = out; const rd = (d) => { const p = this.cW - d * fs, i0 = Math.floor(p), fr = p - i0, a = this.cBuf[(i0 + this.cN) % this.cN], b = this.cBuf[(i0 + 1 + this.cN) % this.cN]; return a + (b - a) * fr; };
        const c = 0.0035;
        l = out * 0.7 + rd(c + depth * ct) * 0.7; r = out * 0.7 + rd(c - depth * ct) * 0.7;
        this.cW = (this.cW + 1) % this.cN;
      }
      L[i] = l; if (R !== L) R[i] = r;
      const aa = Math.max(Math.abs(l), Math.abs(r)); if (aa > pk) pk = aa;
    }
    this.peak = pk;
  }
  meters() { return { voices: this.v.filter((v) => v.on).length, peakDb: 20 * Math.log10(this.peak + 1e-9), lfo: this.lfoPh }; }
}
// factory patches (written here, in the spirit of the 106's sounds)
export const JUNO_PATCHES = [
  { name: 'STRINGS', saw: true, pulse: false, sub: 0.1, cutoff: 0.62, res: 0.1, env: 0.1, a: 0.55, d: 0.5, s: 0.85, r: 0.6, chorus: 1, kybd: 0.5, hpf: 2, vcaLevel: 0.6 },
  { name: 'BRASS', saw: true, pulse: false, sub: 0.3, cutoff: 0.35, res: 0.2, env: 0.55, a: 0.3, d: 0.45, s: 0.55, r: 0.35, chorus: 0, kybd: 0.6, vcaLevel: 0.65 },
  { name: 'BASS', saw: false, pulse: true, pwm: 0.3, sub: 0.8, cutoff: 0.25, res: 0.45, env: 0.45, a: 0.0, d: 0.4, s: 0.2, r: 0.2, chorus: 0, range: 16, hpf: 0, kybd: 0.3, vcaLevel: 0.75 },
  { name: 'PAD', saw: true, pulse: true, pwm: 0.5, pwmLfo: true, lfoRate: 0.3, sub: 0.2, cutoff: 0.48, res: 0.2, env: 0.2, a: 0.6, d: 0.6, s: 0.8, r: 0.7, chorus: 2, kybd: 0.4, vcaLevel: 0.6 },
  { name: 'PIANO', saw: false, pulse: true, pwm: 0.2, sub: 0.2, cutoff: 0.42, res: 0.1, env: 0.5, a: 0, d: 0.62, s: 0, r: 0.4, chorus: 1, kybd: 0.7, vcaLevel: 0.7 },
  { name: 'LEAD', saw: true, pulse: false, sub: 0.0, cutoff: 0.5, res: 0.6, env: 0.35, a: 0.05, d: 0.4, s: 0.6, r: 0.25, chorus: 0, lfoRate: 0.5, lfoDelay: 0.5, dcoLfo: 0.15, kybd: 0.8, vcaLevel: 0.6, porta: 0.15 },
  { name: 'HOOVER', saw: false, pulse: true, pwm: 0.7, pwmLfo: true, lfoRate: 0.55, sub: 0.6, noise: 0, cutoff: 0.7, res: 0.0, env: 0.0, a: 0.0, d: 0.4, s: 1, r: 0.3, chorus: 3, kybd: 0.2, vcaLevel: 0.55 },
  { name: 'SWEEP', saw: true, pulse: true, pwm: 0.4, pwmLfo: true, lfoRate: 0.25, sub: 0.3, cutoff: 0.3, res: 0.7, env: 0.15, vcfLfo: 0.35, a: 0.4, d: 0.6, s: 0.7, r: 0.6, chorus: 2, kybd: 0.4, vcaLevel: 0.55 },
];
