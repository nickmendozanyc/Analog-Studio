// Evertide H949 Harmonizer model (references/h949): mono in, two outputs (MAIN and DELAY ONLY).
// Memory: 400 ms of 11-bit samples behind a 2:1 compander (the original's character), ~15 kHz bandwidth.
// MAIN functions: pitch change NORM (25 ms window) / EXTEND (400 ms, or 200 / 100 / 50 ms with the main keys),
// µPC SHARP / FLAT (fine ratios near 1), DELAY (the main keys' sum), RANDOM (delay drifting 0..25 ms), FLANGE (0..10 ms
// sweep), REVERSE (segments read backwards). Algorithm 1: two read heads, blind crossfade (its chorus-y colour);
// algorithm 2: the de-glitched splice (a correlation search picks the splice, as in the patent). DELAY ONLY: a plain
// delay of up to 393.75 ms. MAIN and DLY ONLY feedback through LOW / HIGH shelving EQ. REPEAT freezes the memory.
import { IM90Channel } from './im90.js';

const TAU = 2 * Math.PI;
export const H949 = { mem: 0.8, loop: 0.4, bw: 15000, bits: 11 };

class Shelf {   // first-order shelving pair (low and high), gains in dB
  constructor(fs) { this.fs = fs; this.lo = 0; this.hi = 0; this.gl = 1; this.gh = 1; this.al = 1 - Math.exp(-TAU * 250 / fs); this.ah = 1 - Math.exp(-TAU * 3000 / fs); }
  set(low, high) { this.gl = 10 ** (low / 20); this.gh = 10 ** (high / 20); }
  run(x) { this.lo += this.al * (x - this.lo); this.hi += this.ah * (x - this.hi); const mid = this.hi - this.lo, top = x - this.hi; return this.lo * this.gl + mid + top * this.gh; }
}

export class H949Unit {
  constructor(fs) {
    this.fs = fs; this.N = Math.round(fs * H949.mem); this.mem = new Float32Array(this.N); this.w = 0;
    this.p = { func: 'norm', alg: 2, ratio: 1, rate: 0.5, mainMs: 0, dlyMs: 0, fbMain: 0, fbDly: 0, eqLow: 0, eqHigh: 0, repeat: false, line: false, on: true, inGain: 1 };
    this.ph = 0; this.lfo = 0; this.rnd = 0; this.rndT = 0; this.seed = 7; this.revT = 0;
    this.eqM = new Shelf(fs); this.eqD = new Shelf(fs); this.lastM = 0; this.lastD = 0;
    this.deg = new IM90Channel(fs).set({ mode: 'pitch' });   // the de-glitched splice (algorithm 2)
    this.degOut = new Float32Array(128); this.degIn = new Float32Array(128);
    this.lpM = 0; this.lpM2 = 0; this.lpD = 0; this.lpa = 1 - Math.exp(-TAU * H949.bw / fs);
    this.loop = null; this.loopPos = 0;
    this.pin = 0; this.am = 1 - Math.exp(-1 / (0.01 * fs)); this.peak = 0;
  }
  set(o) {
    const wasRep = this.p.repeat; Object.assign(this.p, o); const p = this.p;
    this.eqM.set(p.eqLow, p.eqHigh); this.eqD.set(p.eqLow, p.eqHigh);
    if (p.repeat && !wasRep) { const L = Math.round(H949.loop * this.fs); this.loop = new Float32Array(L); for (let i = 0; i < L; i++) this.loop[i] = this.at(L - i); this.loop.reverse(); this.loopPos = 0; }
    if (!p.repeat) this.loop = null;
    return this;
  }
  at(d) { const N = this.N; let pos = this.w - 1 - d; while (pos < 0) pos += N; const i = Math.floor(pos), f = pos - i; return this.mem[i % N] * (1 - f) + this.mem[(i + 1) % N] * f; }
  // the 2:1 compander around 11-bit conversion: quantisation noise rides under the signal
  codec(x) { const c = Math.sign(x) * Math.sqrt(Math.min(1, Math.abs(x))), q = 2 ** (H949.bits - 1); const cq = Math.round(c * q) / q; return Math.sign(cq) * cq * cq; }
  window() { const p = this.p; if (p.func !== 'extend' && p.func !== 'reverse') return 0.025; const m = p.mainMs; return m >= 350 ? 0.4 : m >= 200 && m < 300 ? 0.2 : m >= 100 && m < 200 ? 0.1 : m >= 50 && m < 100 ? 0.05 : 0.4; }
  // x: input; L: MAIN output; R: DELAY ONLY output
  process(x, L, R, n) {
    const p = this.p, fs = this.fs, ms = fs / 1000;
    if (p.line || !p.on) { for (let k = 0; k < n; k++) { L[k] = p.line && p.on ? x[k] : 0; R[k] = p.line && p.on ? x[k] : 0; } return; }   // LINE IN/OUT: a hardware bypass
    const pitchFn = p.func === 'norm' || p.func === 'extend' || p.func === 'sharp' || p.func === 'flat';
    const useDeg = pitchFn && p.alg === 2 && p.func !== 'extend';
    if (useDeg) {   // the de-glitch path runs on its own memory, fed with the same (fed-back) input
      if (this.degIn.length < n) { this.degIn = new Float32Array(n); this.degOut = new Float32Array(n); }
      for (let k = 0; k < n; k++) this.degIn[k] = x[k] * p.inGain;
      this.deg.set({ ratio: p.ratio, pdel: Math.max(0.001, (p.mainMs >= 50 ? p.mainMs : 0) / 1000), arp: Math.min(0.95, p.fbMain) });
      this.deg.process(this.degIn, this.degOut, n);
    }
    const W = this.window() * fs;
    for (let k = 0; k < n; k++) {
      const v = x[k] * p.inGain; this.pin += this.am * (v * v - this.pin); this.peak = Math.max(this.peak * 0.9995, Math.abs(v));
      if (!this.loop) { this.mem[this.w] = this.codec(v + this.eqM.run(this.lastM) * p.fbMain * (useDeg ? 0 : 1) + this.eqD.run(this.lastD) * p.fbDly); this.w = (this.w + 1) % this.N; }
      const rd = (d) => this.loop ? this.loop[((Math.round(this.loopPos - d) % this.loop.length) + this.loop.length) % this.loop.length] : this.at(d);
      let m = 0;
      if (useDeg) m = this.degOut[k];
      else if (pitchFn) {   // algorithm 1 (and EXTEND): two heads half a window apart, crossfaded
        const extra = p.func === 'extend' ? 0 : (p.mainMs >= 50 ? p.mainMs : 0) * ms;
        this.ph = (this.ph + (1 - p.ratio) / W + 1) % 1;
        const d1 = this.ph * W, d2 = ((this.ph + 0.5) % 1) * W, g1 = 0.5 - 0.5 * Math.cos(TAU * this.ph), g2 = 1 - g1;
        m = rd(extra + d1 + 2) * g1 + rd(extra + d2 + 2) * g2;
      } else if (p.func === 'delay') m = rd(Math.max(1, p.mainMs * ms));
      else if (p.func === 'random') {   // the delay wanders between 0 and 25 ms at a rate set by MANUAL
        if (Math.abs(this.rnd - this.rndT) < 0.05 * ms) { this.seed = (this.seed * 16807) % 2147483647; this.rndT = (this.seed / 2147483647) * 25 * ms; }
        this.rnd += Math.sign(this.rndT - this.rnd) * Math.min(Math.abs(this.rndT - this.rnd), (0.2 + p.rate * 40) * ms / fs * 40);
        m = rd(Math.max(1, this.rnd + (p.mainMs || 0) * ms));
      } else if (p.func === 'flange') { this.lfo = (this.lfo + (0.05 + p.rate * 4) / fs) % 1; m = rd(Math.max(1, (0.1 + 5 * (1 - Math.cos(TAU * this.lfo))) * ms)); }
      else if (p.func === 'reverse') {   // each segment is played backwards
        this.revT = (this.revT + 1) % W; const d = 2 * this.revT + 2, edge = Math.min(this.revT, W - this.revT) / (0.004 * fs);
        m = rd(d) * Math.min(1, edge);
      }
      const dly = p.dlyMs > 0 ? rd(p.dlyMs * ms) : 0;
      if (this.loop) this.loopPos = (this.loopPos + 1) % this.loop.length;
      this.lastM = m; this.lastD = dly;
      this.lpM += this.lpa * (m - this.lpM); this.lpM2 += this.lpa * (this.lpM - this.lpM2); this.lpD += this.lpa * (dly - this.lpD);
      L[k] = this.lpM2; R[k] = p.dlyMs > 0 ? this.lpD : 0;
    }
  }
  meters() { return { inDb: 10 * Math.log10(this.pin + 1e-12), peakDb: 20 * Math.log10(this.peak + 1e-9) }; }
}
// the MANUAL knob (0..1) as a pitch ratio for each function, finest near 1:1 on µPC
export function h949Ratio(func, k) {
  if (func === 'sharp') return 1 + 0.07 * k ** 2;
  if (func === 'flat') return 1 - 0.07 * k ** 2;
  return 0.25 * 8 ** k;   // NORM / EXTEND: 0.25 .. 2.0, an octave per third of the turn
}
