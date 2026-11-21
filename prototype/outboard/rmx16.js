// AXS RMX16 digital reverberation system (references/rmx16): mono in, two outputs. 18 programs (the 9 standard plus the
// 9 "expanded"), each with PREDELAY (ms), DECAY (0.0..9.9 s), LOW (-4..+4: decay at 350 Hz x 2^(v/2)) and HIGH (0..-9:
// where the decay halves, 18 kHz .. 1 kHz). Character: ~18 kHz band, 12-bit gain-ranged converter (noise rides with level).
const TAU = 2 * Math.PI;
export const RMX_PROGRAMS = [
  // name, family, max predelay (ms), uses LOW, uses HIGH, factory predelay / decay (assumed: the manual gives none)
  ['AMBIENCE', 'amb', 200, 1, 1, 0, 4.0], ['ROOM A1', 'room', 300, 0, 1, 10, 1.2], ['HALL C1', 'hallC', 300, 1, 1, 20, 2.6], ['PLATE A1', 'plate', 300, 1, 1, 0, 1.8],
  ['HALL B3', 'hallB', 300, 1, 1, 20, 3.0], ['CHORUS', 'chorus', 50, 0, 1, 12, 3.0], ['ECHO', 'echo', 650, 0, 1, 250, 4.0], ['NONLIN 2', 'nonlin', 300, 0, 1, 0, 3.0],
  ['REVERSE 1', 'reverse', 300, 0, 1, 0, 4.0], ['HALL A1', 'hallA', 300, 1, 1, 20, 2.4], ['PLATE B1', 'plateB', 300, 1, 1, 0, 2.4], ['ROOM A0', 'roomA0', 300, 0, 1, 10, 1.2],
  ['ROOM B1', 'roomB', 300, 0, 1, 10, 0.7], ['NONLIN 1', 'nonlin1', 300, 0, 1, 0, 3.0], ['REVERSE 2', 'reverse2', 300, 0, 1, 0, 4.0], ['DELAY', 'delay', 810, 0, 1, 300, 3.0],
  ['FREEZE', 'freeze', 0, 0, 0, 0, 0.2], ['IMAGE P1', 'image', 300, 0, 1, 0, 3.0],
].map(([name, fam, preMax, low, high, pre, decay], i) => ({ n: i + 1, name, fam, preMax, low: !!low, high: !!high, pre, decay }));

class Line { constructor(n) { this.b = new Float32Array(n); this.n = n; this.w = 0; } push(v) { this.b[this.w] = v; this.w = (this.w + 1) % this.n; } at(d) { let p = this.w - 1 - d; while (p < 0) p += this.n; const i = Math.floor(p), f = p - i; return this.b[i % this.n] * (1 - f) + this.b[(i + 1) % this.n] * f; } }
// early-reflection / burst tap patterns per family: [ms, gain, side -1..1]
function taps(fam, decay) {
  let s = 31; const r = () => (s = (s * 16807) % 2147483647) / 2147483647, out = [];
  if (fam === 'nonlin' || fam === 'nonlin1' || fam === 'reverse' || fam === 'reverse2' || fam === 'image') {
    const len = Math.max(30, 70 * decay), n = 48;   // a burst about 0.07 s per decay step long
    for (let i = 0; i < n; i++) { const t = (i + r()) / n; let g;
      if (fam === 'nonlin') g = t < 0.85 ? 0.55 + 0.1 * r() : (1 - t) / 0.15 * 0.55;   // flat, then a steep cut
      else if (fam === 'nonlin1') g = 0.7 * Math.exp(-t * 1.2) * (t < 0.9 ? 1 : (1 - t) * 10);
      else if (fam === 'image') g = 0.5 + 0.1 * r();
      else g = 0.08 + 0.75 * t ** 1.6;   // reverse: rising, then it stops
      out.push([t * len, g * (fam === 'image' ? 1 : 0.9), fam === 'image' ? -1 + 2 * t : (i % 2 ? 1 : -1) * (0.3 + 0.7 * r())]); }
    return out;
  }
  const pat = { amb: [2, 14, 0.9], room: [4, 10, 0.7], roomA0: [4, 10, 0.75], roomB: [3, 8, 0.6], hallC: [12, 14, 0.9], hallB: [12, 14, 0.45], hallA: [10, 12, 0.6], plate: [1, 10, 0.4], plateB: [1, 10, 0.4] }[fam] || [5, 8, 0.5];
  for (let i = 0; i < pat[1]; i++) out.push([pat[0] + i * (fam.startsWith('hall') ? 7.5 : fam === 'amb' ? 2.2 : 3.4) * (0.7 + 0.6 * r()), pat[2] * Math.exp(-i / pat[1] * 1.5), i % 2 ? 1 : -1]);
  return out;
}

export class RMX16 {
  constructor(fs) {
    this.fs = fs; const ms = (x) => Math.round(x * fs / 1000);
    this.pre = new Line(ms(2100)); this.in2 = new Line(ms(1700));
    this.len = [1103, 1307, 1499, 1723, 1949, 2207, 2459, 2749].map((n) => Math.round(n * fs / 40000));
    this.fdn = this.len.map((n) => new Line(n + 2)); this.lo = new Float32Array(8); this.hi = new Float32Array(8);
    this.ap = [4.1, 6.3, 9.7, 13.9].map((x) => new Line(ms(x) + 2));
    this.ch = Array.from({ length: 5 }, () => new Line(ms(120))); this.ph = 0;
    this.frz = new Float32Array(Math.round(1.63 * fs)); this.frzW = 0; this.frzLen = this.frz.length;
    this.bl = 0; this.bl2 = 0; this.br = 0; this.br2 = 0; this.bwa = 1 - Math.exp(-TAU * 17000 / fs);
    this.mute = 0; this.pin = 0; this.am = 1 - Math.exp(-1 / (0.01 * fs)); this.peak = 0;
    this.p = { prog: 1, pre: 0, decay: 4.0, low: 0, high: 0, inGain: 1, outGain: 1, echoB: 120 };
    this.set({});
  }
  set(o) {
    const progChanged = o.prog != null && o.prog !== this.p.prog; Object.assign(this.p, o); const p = this.p, P = RMX_PROGRAMS[p.prog - 1], fs = this.fs;
    if (progChanged) this.mute = Math.round(0.05 * fs);   // changing program mutes the output briefly, as on the unit
    this.fam = P.fam; this.taps = taps(P.fam, p.decay);
    // decay: mid band = DECAY (s); low band x 2^(LOW/2); the high band halves its decay above the HIGH frequency
    const rt = Math.max(0.1, p.decay) * (P.fam === 'plate' || P.fam === 'plateB' ? 1 : P.fam === 'amb' ? 0.6 : 1);
    this.infinite = P.fam === 'amb' && p.decay >= 9.9 && p.low === 0 && p.high === 0;   // Ambience freezes at 9.9 with flat filters
    const rtLo = rt * 2 ** ((P.low ? p.low : 0) / 2), fHi = 18000 * 2 ** (-(Math.abs(p.high || 0)) * Math.log2(18) / 9);
    this.gm = this.len.map((n) => (this.infinite ? 1 : 10 ** (-3 * n / fs / rt)));
    this.gl = this.len.map((n) => (this.infinite ? 1 : 10 ** (-3 * n / fs / rtLo)));
    this.gh = this.len.map((n) => (this.infinite ? 1 : 10 ** (-3 * n / fs / (rt / 2))));
    this.aLo = 1 - Math.exp(-TAU * 350 / fs); this.aHi = 1 - Math.exp(-TAU * Math.min(16000, fHi) / fs);
    this.bwa = 1 - Math.exp(-TAU * Math.min(17000, (P.high ? fHi * 1.4 : 17000)) / fs);
    if (P.fam === 'freeze' && o.decay != null) { if (p.decay <= 0.05) { this.frz.fill(0); this.frzW = 0; } }
    return this;
  }
  // 12-bit gain-ranged conversion: quantise relative to a range picked from the level (x1/2/4/8)
  adc(x) { const a = Math.abs(x), g = a < 0.125 ? 8 : a < 0.25 ? 4 : a < 0.5 ? 2 : 1, q = 2048; return Math.round(x * g * q) / q / g; }
  process(x, L, R, n) {
    const p = this.p, fs = this.fs, ms = fs / 1000, fam = this.fam, pre = Math.max(1, (p.pre || 0) * ms);
    for (let k = 0; k < n; k++) {
      let v = this.adc(x[k] * p.inGain); this.pin += this.am * (v * v - this.pin); this.peak = Math.max(this.peak * 0.9993, Math.abs(v));
      if (this.infinite) v = 0;   // a frozen Ambience takes no more input
      this.pre.push(v); const pv = this.pre.at(pre);
      let l = 0, r = 0;
      if (fam === 'chorus') {   // five voices spaced by PREDELAY, depth from DECAY
        this.ph = (this.ph + 0.6 / fs) % 1;
        for (let i = 0; i < 5; i++) { const d = (1 + (p.pre || 12) * (i + 1) / 5 + (p.decay / 9.9) * 3 * (1 + Math.sin(TAU * (this.ph + i / 5)))) * ms; this.ch[i].push(v); const y = this.ch[i].at(d) * 0.45; if (i % 2) r += y; else l += y; if (i === 4) { l += y * 0.5; r += y * 0.5; } }
      } else if (fam === 'echo' || fam === 'delay') {   // ECHO: A (left) and B (right), DECAY sets feedback; DELAY: output 2 only
        const fb = Math.min(0.95, p.decay / 10.4);
        const a = this.pre.at(Math.max(1, (p.pre || 250) * ms)), b = this.in2.at(Math.max(1, (fam === 'delay' ? p.pre || 300 : p.echoB || 120) * ms));
        this.pre.b[(this.pre.w - 1 + this.pre.n) % this.pre.n] = v + a * fb; this.in2.push(v + b * fb);
        if (fam === 'delay') { l = 0; r = b; } else { l = a; r = b; }
      } else if (fam === 'freeze') {   // DECAY 0.0 clears, 0.1 adds to the loop, 0.2+ holds it (input muted)
        const i2 = this.frzW; const y = this.frz[i2]; const hold = p.decay >= 0.15, add = p.decay >= 0.05 && !hold;
        this.frz[i2] = hold ? y : add ? y + v : v; this.frzW = (i2 + 1) % this.frzLen; l = r = hold || add ? y : 0;
      } else if (fam === 'nonlin' || fam === 'nonlin1' || fam === 'reverse' || fam === 'reverse2' || fam === 'image') {
        for (const [t, g, sd] of this.taps) { const y = this.pre.at(pre + t * ms) * g; l += y * (1 - sd) / 2; r += y * (1 + sd) / 2; }
        if (fam === 'reverse') { r = (r + l) * 0.5; }   // REVERSE 1: output 1 diffuse, output 2 discrete
        l *= 0.5; r *= 0.5;
      } else {   // the reverbs: early pattern + an 8-line network with two-band decay
        let d = pv; for (const ln of this.ap) { const y = ln.at(ln.n - 2), g = 0.62; const w2 = d + g * y; ln.push(w2); d = y - g * w2; }
        const o = this.fdn.map((ln, i) => ln.at(this.len[i]));
        let sum = 0; for (let i = 0; i < 8; i++) { this.lo[i] += this.aLo * (o[i] - this.lo[i]); this.hi[i] += this.aHi * (o[i] - this.hi[i]); const lowB = this.lo[i], midB = this.hi[i] - this.lo[i], hiB = o[i] - this.hi[i]; o[i] = lowB * this.gl[i] + midB * this.gm[i] + hiB * this.gh[i]; sum += o[i]; }
        const h = sum * 2 / 8; for (let i = 0; i < 8; i++) this.fdn[i].push(o[i] - h + d * 0.3);
        let el = 0, er = 0; for (const [t, g, sd] of this.taps) { const y = this.pre.at(pre + t * ms) * g; el += y * (1 - sd) / 2; er += y * (1 + sd) / 2; }
        l = (o[0] + o[2] + o[4] + o[6]) * 0.32 + el * 0.35; r = (o[1] + o[3] + o[5] + o[7]) * 0.32 + er * 0.35;
      }
      if (this.mute > 0) { this.mute--; l = r = 0; }
      this.bl += this.bwa * (l - this.bl); this.bl2 += this.bwa * (this.bl - this.bl2); this.br += this.bwa * (r - this.br); this.br2 += this.bwa * (this.br - this.br2);
      L[k] = this.bl2 * p.outGain; R[k] = this.br2 * p.outGain;
    }
  }
  meters() { return { inDb: 10 * Math.log10(this.pin + 1e-12), peakDb: 20 * Math.log10(this.peak + 1e-9) }; }
}
