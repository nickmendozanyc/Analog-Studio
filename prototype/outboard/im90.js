// Publison IM90-style "infernal machine" channel: a 16-bit sampling memory that is, at once, a delay line, a pitch
// shifter and a sampler (see references/im90). Two of these make the unit's independent channels A and B.
//   DELAY / ECHO   (functions 01 / 02) the memory as a delay line: two samples up to the whole memory; echo feedback 0..99 %
//   PITCH  (04)    a varying-delay read head moving at the pitch ratio (0.25..2); when the delay drifts out of its window
//                  (about 15 ms wide) the head jumps by whole periods, the jump point found by comparing waveforms
//                  (correlation search) and hidden by a short crossfade: the splice. Added delay, and ARPEGGIO feedback
//                  (the shifted output fed back through the delay: each repeat one more pitch step)
//   SAMPLER (09)   record from the first signal on input A or B (or by AUX), stop by AUX or when the memory is full; play
//                  looped (3 ms crossfade at the joint) or retriggered by input A / B, or by AUX; start / end points
//                  (start after end = reversed), varispeed (speed-link), a linear attack ramp
// The memory runs at the engine's rate; 16-bit storage and a gentle top-end roll-off stand in for the 50 kHz converters.

export const IM90 = { shortSec: 5.24, longSec: 20.93, window: 0.015, minDelay: 0.003, xfade: 0.004, search: 0.012, loopXf: 0.003, trigDb: -40 };

const q16 = (v) => Math.round(Math.max(-1, Math.min(1, v)) * 32767) / 32767;   // 16-bit storage

export class IM90Channel {
  constructor(fs, { long = false } = {}) {
    this.fs = fs; this.N = Math.round(fs * (long ? IM90.longSec : IM90.shortSec));
    this.mem = new Float32Array(this.N); this.w = 0;
    this.mode = 'delay';
    this.inGain = 1; this.wet = 1; this.direct = 0;          // GAINS: input gain, effect level, direct (dry) level
    this.delay = 0.25; this.feedback = 0;                    // DELAY / ECHO
    this.ratio = 1; this.pdel = 0.001; this.arp = 0;         // PITCH: ratio, added delay (s), arpeggio feedback
    this.rd = 0; this.rd2 = -1; this.xf = 0; this.last = 0;
    this.smp = { len: 0, recN: 0, start: 0, end: 0, mode: 'loop', speed: 1, pos: -1, dir: 1, rec: 'idle', startBy: 'A', thresh: 10 ** (IM90.trigDb / 20), quiet: 1e9, attack: 0.001, env: 1 };
    this.lp = 0; this.lp2 = 0; const fc = Math.min(0.45 * fs, 19000); this.lpa = 1 - Math.exp(-2 * Math.PI * fc / fs);   // top-end roll-off
    this.pin = 0; this.pout = 0; this.am = 1 - Math.exp(-1 / (0.05 * fs));   // meters (mean square)
  }
  set(o) { Object.assign(this, o); return this; }
  setSample(o) { Object.assign(this.smp, o); return this; }
  at(pos) { const N = this.N; pos = ((pos % N) + N) % N; const i = Math.floor(pos), f = pos - i; return this.mem[i] * (1 - f) + this.mem[(i + 1) % N] * f; }
  // sampler keys
  arm(startBy) { const s = this.smp; if (startBy) s.startBy = startBy; s.pos = -1; s.recN = 0; if (s.startBy === 'aux') { s.rec = 'rec'; } else s.rec = 'armed'; }
  play() { const s = this.smp; if (!s.len) return; s.dir = s.start <= s.end ? 1 : -1; s.pos = s.start; s.env = s.attack > 0 ? 0 : 1; }
  stop() { const s = this.smp; s.pos = -1; if (s.rec === 'rec') this.endRec(); else if (s.rec === 'armed') s.rec = 'idle'; }
  endRec() { const s = this.smp; s.rec = 'idle'; s.len = s.recN; s.start = 0; s.end = s.len; }
  // x: this channel's input, y: output, trig: the input that triggers it (A or B), n samples
  process(x, y, n, trig = x) {
    const fs = this.fs, N = this.N, s = this.smp, g = this.inGain;
    for (let k = 0; k < n; k++) {
      const v = x[k] * g, tv = trig[k] * g; let out = 0;
      this.pin += this.am * (v * v - this.pin);
      if (this.mode === 'delay') {
        const d = Math.max(2, Math.min(N - 2, this.delay * fs)), tap = this.at(this.w - d);
        this.mem[this.w] = q16(v + tap * Math.min(0.99, this.feedback)); out = tap;
        this.w = (this.w + 1) % N;
      } else if (this.mode === 'pitch') {
        this.mem[this.w] = q16(v + this.last * Math.min(0.99, this.arp));
        out = this.last = this.pitchStep();
        this.w = (this.w + 1) % N;
      } else {   // SAMPLER
        if (s.rec === 'armed' && Math.abs(tv) >= s.thresh) { s.rec = 'rec'; s.recN = 0; }
        if (s.rec === 'rec') { this.mem[s.recN++] = q16(v); if (s.recN >= N) { this.endRec(); this.play(); } }
        else if ((s.mode === 'trig') && s.len && s.rec === 'idle') {   // input trigger: a new attack restarts the sample
          if (Math.abs(tv) >= s.thresh) { if (s.quiet > 0.03 * fs) this.play(); s.quiet = 0; } else s.quiet++;
        }
        if (s.pos >= 0) out = this.sampleStep();
      }
      this.lp += this.lpa * (out - this.lp); this.lp2 += this.lpa * (this.lp - this.lp2);
      const o = this.wet * this.lp2 + this.direct * x[k];
      this.pout += this.am * (o * o - this.pout);
      y[k] = o;
    }
  }
  pitchStep() {
    const fs = this.fs, r = this.ratio, win = IM90.window * fs, dmin = IM90.minDelay * fs + Math.max(0, this.pdel - 0.001) * fs, xfN = IM90.xfade * fs;
    let d = this.w - this.rd; if (d < 0) d += this.N;
    if (this.rd2 < 0 && (d < dmin || d > dmin + win)) {
      const target = r > 1 ? dmin + win * 0.875 : dmin + win * 0.125, span = IM90.search * fs, L = Math.round(0.004 * fs);
      let best = target, bestC = -Infinity;
      for (let c = target - span / 2; c <= target + span / 2; c += 2) {
        if (c < dmin || c > dmin + win * 1.6) continue;
        let sxy = 0, sxx = 1e-12, syy = 1e-12;
        for (let j = 0; j < L; j += 2) { const a = this.at(this.rd + j * r), b = this.at(this.w - c + j * r); sxy += a * b; sxx += a * a; syy += b * b; }
        const cc = sxy / Math.sqrt(sxx * syy) - Math.abs(c - target) / span * 0.15;
        if (cc > bestC) { bestC = cc; best = c; }
      }
      this.rd2 = this.rd; this.rd = this.w - best; this.xf = 0;
    }
    let o = this.at(this.rd);
    if (this.rd2 >= 0) { const g = Math.min(1, ++this.xf / xfN); o = o * Math.sin(g * Math.PI / 2) + this.at(this.rd2) * Math.cos(g * Math.PI / 2); this.rd2 += r; if (g >= 1) this.rd2 = -1; }
    this.rd += r; if (this.rd >= this.N) this.rd -= this.N;
    return o;
  }
  sampleStep() {
    const s = this.smp, lo = Math.min(s.start, s.end), hi = Math.max(s.start, s.end), sp = s.speed * s.dir;
    let o = this.at(s.pos);
    if (s.mode === 'loop') {
      const xfN = IM90.loopXf * this.fs, left = s.dir > 0 ? hi - s.pos : s.pos - lo;
      if (left < xfN) { const g = 1 - left / xfN; o = o * (1 - g) + this.at(s.dir > 0 ? lo + (xfN - left) : hi - (xfN - left)) * g; }
    }
    if (s.env < 1) { s.env = Math.min(1, s.env + 1 / Math.max(1, s.attack * this.fs)); o *= s.env; }
    s.pos += sp;
    if (s.pos >= hi || s.pos < lo) { if (s.mode === 'loop') s.pos = s.dir > 0 ? lo + IM90.loopXf * this.fs : hi - IM90.loopXf * this.fs; else s.pos = -1; }
    return o;
  }
  meters() {
    const s = this.smp, db = (p) => 10 * Math.log10(p + 1e-12);
    return { inDb: db(this.pin), outDb: db(this.pout), rec: s.rec, recN: s.recN, len: s.len, pos: s.pos, start: s.start, end: s.end, N: this.N };
  }
}
