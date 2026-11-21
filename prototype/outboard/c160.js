// dbk 160X compressor / limiter: a model of the classic 1981 single-channel 1U unit (see references/dbx160x).
// Feed-forward: a true-RMS detector (one pole on the signal's power, the same ~35 ms both ways, which gives the
// unit's programme-dependent attack of 15 / 5 / 3 ms for 10 / 20 / 30 dB steps and its constant ~125 dB/s release),
// a gain computer in dB (hard knee or the soft "Over Easy" knee; ratio from 1:1 through infinity:1 to -1:1), and a
// VCA that applies the gain sample by sample, then the output gain. No look-ahead: zero added latency.
// Plain JS, no dependencies: runs in the AudioWorklet, in Node tests and in the native engine.
//
// Levels: refPeak is the peak of a sine at 0 VU (+4 dBu); thresholds and meters are in dBu, as on the panel.

// ratio knob (0..1) -> slope s = 1/ratio: 1:1 (s = 1) ... infinity:1 (s = 0) ... -1:1 (s = -1), after the dial
export const C160_RATIO = [[0, 1], [0.13, 1 / 2], [0.27, 1 / 3], [0.38, 1 / 4], [0.5, 1 / 6], [0.62, 1 / 10], [0.7, 0], [0.79, -0.2], [0.9, -0.5], [1, -1]];
export function ratioSlope(pos) {
  pos = Math.max(0, Math.min(1, pos));
  for (let i = 0; i < C160_RATIO.length - 1; i++) {
    const [p0, s0] = C160_RATIO[i], [p1, s1] = C160_RATIO[i + 1];
    if (pos <= p1) return s0 + (s1 - s0) * (pos - p0) / (p1 - p0);
  }
  return -1;
}
export function ratioLabel(s) {
  if (Math.abs(s) < 0.005) return '∞:1';
  const r = 1 / s; return `${Math.abs(r) >= 9.95 ? r.toFixed(0) : r.toFixed(1).replace(/\.0$/, '')}:1`;
}
// the panel's meters: level LEDs (dB re +4 dBu) and gain-reduction LEDs (dB)
export const C160_LEVEL_LEDS = [-40, -30, -20, -15, -10, -8, -6, -5, -4, -3, -2, -1, 0, 1, 2, 4, 6, 10, 20];
export const C160_GR_LEDS = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40];

export const C160 = { tau: 0.035, knee: 3.2, maxGR: 70, clipDbu: 24, meterTau: 0.05 };

export class Comp160 {
  constructor(fs, refPeak = 1) {
    this.fs = fs; this.ref2 = refPeak * refPeak / 2;   // power of a 0 VU (+4 dBu) sine
    this.a = 1 - Math.exp(-1 / (C160.tau * fs)); this.am = 1 - Math.exp(-1 / (C160.meterTau * fs));
    this.clip = refPeak * 10 ** ((C160.clipDbu - 4) / 20);
    this.p = 1e-12; this.pin = 1e-12; this.pout = 1e-12;
    this.set({ threshold: -10, ratio: 0.38, outGain: 0, overEasy: false, bypass: false, slave: false, display: 'in' });
    this.gr = 0; this.L = -120; this.e = -120;
  }
  set(o) { this.params = { ...(this.params || {}), ...o }; this.s = ratioSlope(this.params.ratio); return this; }
  dbu(p) { return 10 * Math.log10(p / this.ref2 + 1e-30) + 4; }
  // gain computer: e = detector level - threshold (dB); returns gain change in dB (<= 0 for s < 1)
  static gain(e, s, overEasy) {
    const g = overEasy ? (s - 1) * C160.knee * (e / C160.knee > 30 ? e / C160.knee : Math.log1p(Math.exp(e / C160.knee))) : (s - 1) * Math.max(0, e);
    return Math.max(-C160.maxGR, g);
  }
  // one unit, in place on buffer x (n samples); link: a master unit whose detector this one follows (SLAVE)
  process(x, n) { Comp160.processPair(this, x, null, null, n); }
  // a master and an optional slave (stereo strapping: both follow the louder detector, with the master's controls)
  static processPair(A, xa, B, xb, n) {
    const linked = B && xb && B.params.slave;
    const PA = A.params, PB = B ? (linked ? A.params : B.params) : null;
    const units = B && xb ? [[A, xa, PA], [B, xb, PB]] : [[A, xa, PA]];
    const ogA = 10 ** (PA.outGain / 20), ogB = PB ? 10 ** (PB.outGain / 20) : 1;
    for (let k = 0; k < n; k++) {
      // detectors (true RMS, one pole on power)
      for (const [U, x] of units) { const v = x[k]; U.p += U.a * (v * v - U.p); U.pin += U.am * (v * v - U.pin); }
      let LA = A.dbu(A.p), LB = B && xb ? B.dbu(B.p) : -200;
      if (linked) LA = LB = Math.max(LA, LB);   // the 160X strapping: the louder channel controls both
      for (let u = 0; u < units.length; u++) {
        const [U, x, P] = units[u], L = u ? LB : LA, og = u ? ogB : ogA;
        const e = L - P.threshold, s = U === B && linked ? A.s : U.s;
        const G = Comp160.gain(e, s, P.overEasy);
        let y = x[k];
        if (!P.bypass) {
          y *= 10 ** (G / 20) * og;
          const c = U.clip; if (Math.abs(y) > 0.8 * c) y = Math.sign(y) * (0.8 * c + 0.2 * c * Math.tanh((Math.abs(y) - 0.8 * c) / (0.2 * c)));   // output stage near +24 dBu
        }
        x[k] = y; U.pout += U.am * (y * y - U.pout);
        U.gr = P.bypass ? 0 : -G; U.L = L; U.e = e;
      }
    }
  }
  // what the panel shows: level LEDs lit (input or output), gain-reduction LEDs lit, threshold LED
  meters() {
    const P = this.params, lvl = this.dbu(P.display === 'out' ? this.pout : this.pin) - 4;
    const knee = P.overEasy ? (this.e < -5 ? 'below' : this.e > 5 ? 'above' : 'knee') : (this.e < 0 ? 'below' : 'above');
    return { level: C160_LEVEL_LEDS.filter((d) => lvl >= d).length, levelDb: lvl, gr: C160_GR_LEDS.filter((d) => this.gr >= d - 0.25).length, grDb: this.gr, th: knee };
  }
}
