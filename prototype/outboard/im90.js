// Publison IM90-style "infernal machine" channel: a 16-bit sampling memory that is, at once, a delay line, a pitch
// shifter and a sampler (see references/im90). Two of these make the unit's independent channels A and B.
//   DELAY   the memory as a delay line: time from two samples up to the whole memory, echo feedback 0..99 %
//   PITCH   a varying-delay read head moving at the pitch ratio (0.25..2); when the delay drifts out of its window
//           (about 15 ms wide) the head jumps by whole periods, the jump point found by comparing waveforms
//           (correlation search) and the jump hidden by a short crossfade: the splice
//   SAMPLE  record on the input signal (threshold trigger) into the memory, then play it: one-shot or loop (with a
//           3 ms loop crossfade), start / end points (start after end = reversed), varispeed playback, retrigger
// The memory runs at the engine's rate; 16-bit storage and a gentle top-end roll-off stand in for the 50 kHz converters.
// No look-ahead in DELAY or SAMPLE; PITCH's latency is its splice window, as on the original.

export const IM90 = { shortSec: 5.24, longSec: 20.93, window: 0.015, minDelay: 0.003, xfade: 0.004, search: 0.012, loopXf: 0.003, trigDb: -40 };

const q16 = (v) => Math.round(Math.max(-1, Math.min(1, v)) * 32767) / 32767;   // 16-bit storage

export class IM90Channel {
  constructor(fs, { long = false } = {}) {
    this.fs = fs; this.N = Math.round(fs * (long ? IM90.longSec : IM90.shortSec));
    this.mem = new Float32Array(this.N); this.w = 0;
    this.mode = 'delay'; this.mix = 1;
    this.delay = 0.25; this.feedback = 0.3;                 // DELAY
    this.ratio = 1;                                         // PITCH
    this.rd = 0; this.rd2 = -1; this.xf = 0;                // pitch heads: current, old (during a splice), crossfade progress
    this.smp = { len: 0, start: 0, end: 0, loop: false, speed: 1, pos: -1, rec: 'idle', trigger: 'input', thresh: 10 ** (IM90.trigDb / 20), retrig: false, hold: 0, quiet: 0 };
    this.lp = 0; this.lp2 = 0; const fc = Math.min(0.45 * fs, 19000); this.lpa = 1 - Math.exp(-2 * Math.PI * fc / fs);   // top-end roll-off
  }
  set(o) { Object.assign(this, o); return this; }
  setSample(o) { Object.assign(this.smp, o); return this; }
  // memory read with linear interpolation, position in samples (wraps)
  at(pos) { const N = this.N; pos = ((pos % N) + N) % N; const i = Math.floor(pos), f = pos - i; return this.mem[i] * (1 - f) + this.mem[(i + 1) % N] * f; }
  arm() { this.smp.rec = 'armed'; this.smp.pos = -1; }                    // sampling: wait for the input to cross the threshold
  play() { const s = this.smp; if (s.len) { s.pos = s.start <= s.end ? s.start : s.start; s.dir = s.start <= s.end ? 1 : -1; } }
  stop() { this.smp.pos = -1; if (this.smp.rec === 'rec') this.endRec(); }
  endRec() { const s = this.smp; s.rec = 'idle'; s.len = s.recN; s.start = 0; s.end = s.len; }

  process(x, y, n) {
    const fs = this.fs, N = this.N, s = this.smp;
    for (let k = 0; k < n; k++) {
      const v = x[k]; let out = 0;
      if (this.mode === 'delay') {
        const d = Math.max(2, Math.min(N - 2, this.delay * fs)), tap = this.at(this.w - d);
        this.mem[this.w] = q16(v + tap * Math.min(0.99, this.feedback)); out = tap;
        this.w = (this.w + 1) % N;
      } else if (this.mode === 'pitch') {
        this.mem[this.w] = q16(v);
        out = this.pitchStep();
        this.w = (this.w + 1) % N;
      } else {   // SAMPLE
        if (s.rec === 'armed' && Math.abs(v) >= s.thresh) { s.rec = 'rec'; s.recN = 0; }
        if (s.rec === 'rec') { this.mem[s.recN++] = q16(v); if (s.recN >= N) this.endRec(); }
        else if (s.trigger === 'input' && s.len && s.rec === 'idle') {   // retrigger from the input: a new attack restarts the sample
          if (Math.abs(v) >= s.thresh) { if (s.quiet > 0.03 * fs) this.play(); s.quiet = 0; } else s.quiet++;
        }
        if (s.pos >= 0) out = this.sampleStep();
      }
      // output: the converters' top-end roll-off (2 poles)
      this.lp += this.lpa * (out - this.lp); this.lp2 += this.lpa * (this.lp - this.lp2);
      y[k] = this.mix * this.lp2 + (1 - this.mix) * v;
    }
  }
  // PITCH: the read head trails the write head by a delay that drifts at (1 - ratio) per sample; out of the window,
  // it jumps by the best-matching whole period, crossfading from the old head
  pitchStep() {
    const fs = this.fs, r = this.ratio, win = IM90.window * fs, dmin = IM90.minDelay * fs, xfN = IM90.xfade * fs;
    let d = this.w - this.rd; if (d < 0) d += this.N;
    if (this.rd2 < 0 && (d < dmin || d > dmin + win)) {
      // jump: up (towards the writer) when slowing, back when speeding up; search the best splice point by correlation
      const target = r > 1 ? d + win * 0.75 : d - win * 0.75, span = IM90.search * fs, L = Math.round(0.004 * fs);
      let best = target, bestC = -Infinity;
      for (let c = target - span / 2; c <= target + span / 2; c += 2) {
        if (c < dmin || c > dmin + win * 1.6) continue;
        let sxy = 0, sxx = 1e-12, syy = 1e-12;
        for (let j = 0; j < L; j += 2) { const a = this.at(this.rd + j * r), b = this.at(this.w - c + j * r); sxy += a * b; sxx += a * a; syy += b * b; }
        const cc = sxy / Math.sqrt(sxx * syy) - Math.abs(c - target) / span * 0.15;   // match the waveform, stay near the target
        if (cc > bestC) { bestC = cc; best = c; }
      }
      this.rd2 = this.rd; this.rd = this.w - best; this.xf = 0;
    }
    let o = this.at(this.rd);
    if (this.rd2 >= 0) { const g = Math.min(1, ++this.xf / xfN), a = Math.sin(g * Math.PI / 2); o = o * a + this.at(this.rd2) * Math.cos(g * Math.PI / 2); this.rd2 += r; if (g >= 1) this.rd2 = -1; }
    this.rd += r; if (this.rd >= this.N) this.rd -= this.N;
    return o;
  }
  // SAMPLE playback: varispeed, forwards or reversed, one-shot or looped with a short crossfade at the loop point
  sampleStep() {
    const s = this.smp, lo = Math.min(s.start, s.end), hi = Math.max(s.start, s.end), sp = s.speed * (s.dir || 1);
    let o = this.at(s.pos);
    if (s.loop) {   // crossfade the last 3 ms into the loop's start
      const xfN = IM90.loopXf * this.fs, left = s.dir > 0 ? hi - s.pos : s.pos - lo;
      if (left < xfN) { const g = 1 - left / xfN; o = o * (1 - g) + this.at(s.dir > 0 ? lo + (xfN - left) : hi - (xfN - left)) * g; }
    }
    s.pos += sp;
    if (s.pos >= hi || s.pos < lo) { if (s.loop) s.pos = s.dir > 0 ? lo + IM90.loopXf * this.fs : hi - IM90.loopXf * this.fs; else s.pos = -1; }
    return o;
  }
}
