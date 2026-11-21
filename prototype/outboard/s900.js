// Akita S900 (after the Akai S900, 1986): the sampler's sound engine. 12-bit linear samples recorded at a selectable rate
// into a fixed memory; 8 voices that read a sample back by stepping through it at their own rate with NO interpolation
// (each voice's DAC ran at a variable clock, so a transposed note is the sample's staircase replayed faster or slower:
// the S900's grit), a low-pass filter and an ADSR on every voice, and loops (forward or alternating), one-shots.
// Programs map keys to samples through keygroups. All in plain numbers so the UI can show and edit them.

const S9_TAU = 2 * Math.PI;
export const S900_RATES = [7500, 10000, 12000, 15000, 20000, 25000, 30000, 32000, 36000, 40000];   // record rates (Hz)
export const S900_WORDS = 460000;   // 12-bit memory, ~11.5 s at 40 kHz, ~61 s at 7.5 kHz
export const S900_VOICES = 8;
const s9q = (x) => Math.round(Math.max(-1, Math.min(1, x)) * 2047) / 2047;   // 12-bit linear, hard clip at full scale

// envelope times: 0..99 -> 1 ms .. ~20 s, exponential
export const s9Time = (v) => 0.001 * 20000 ** (Math.max(0, Math.min(99, v)) / 99);
// filter: 0..99 -> cutoff ~150 Hz .. fully open (above the band)
export const s9Cut = (v) => 150 * 2 ** (Math.max(0, Math.min(99, v)) / 99 * 7.3);

export function s9Sample(name, data, rate, o = {}) {
  const q = new Float32Array(data.length); for (let i = 0; i < data.length; i++) q[i] = s9q(data[i]);
  return { name, data: q, rate, root: 60, tune: 0, start: 0, end: q.length, loopAt: Math.max(0, q.length - Math.round(rate * 0.1)), loopLen: Math.min(q.length, Math.round(rate * 0.1)), mode: 'one', ...o };
}
export function s9Keygroup(o = {}) {
  return { lo: 0, hi: 127, sample: 0, loud: -1, xfade: 64, tune: 0, filter: 99, attack: 0, decay: 50, sustain: 99, release: 15, velLevel: 50, velFilter: 0, out: 1, ...o };
}

class S9Voice {
  constructor() { this.on = false; this.age = 0; this.f1 = 0; this.f2 = 0; }
}

export class S900 {
  constructor(fs) {
    this.fs = fs; this.samples = []; this.programs = [{ name: 'PROGRAM 1', kgs: [], midiCh: 0, level: 80, tune: 0 }]; this.prog = 0;
    this.voices = Array.from({ length: S900_VOICES }, () => new S9Voice()); this.t = 0;
    this.rec = { state: 'idle', rate: 40000, len: 2, thresh: 0.05, gain: 1, ph: 0, buf: null, n: 0, name: 'SAMPLE', lp: [0, 0, 0, 0], peak: 0 };
    this.level = 0.8; this.peak = 0;
  }
  used() { return this.samples.reduce((a, s) => a + s.data.length, 0); }
  free() { return S900_WORDS - this.used(); }
  addSample(s) { if (s.data.length > this.free()) return -1; this.samples.push(s); return this.samples.length - 1; }
  program() { return this.programs[this.prog]; }
  // ---- recording: the input is band-limited to rate * 0.45, sampled at the record rate, then stored at 12 bits ----
  armRecord(o = {}) {
    Object.assign(this.rec, o); const r = this.rec;
    const n = Math.min(Math.round(r.len * r.rate), this.free()); if (n < 64) { r.state = 'full'; return false; }
    r.buf = new Float32Array(n); r.n = 0; r.ph = 0; r.state = r.thresh > 0 ? 'armed' : 'rec'; return true;
  }
  stopRecord() { if (this.rec.state === 'rec') this.finishRecord(); else this.rec.state = 'idle'; }
  finishRecord() {
    const r = this.rec; r.state = 'done';
    const s = s9Sample(r.name, r.buf.subarray(0, r.n), r.rate); s.loopAt = Math.max(0, r.n - Math.round(r.rate * 0.25)); s.loopLen = r.n - s.loopAt;
    r.last = this.addSample(s); r.buf = null; return r.last;
  }
  recIn(x, n) {
    const r = this.rec; if (r.state !== 'armed' && r.state !== 'rec') { for (let i = 0; i < n; i++) { const a = Math.abs(x[i] * r.gain); if (a > r.peak) r.peak = a; } return; }
    const fc = Math.min(r.rate * 0.45, this.fs * 0.45), k = 1 - Math.exp(-S9_TAU * fc / this.fs), step = r.rate / this.fs, lp = r.lp;
    for (let i = 0; i < n; i++) {
      let s = x[i] * r.gain; const a = Math.abs(s); if (a > r.peak) r.peak = a;
      for (let j = 0; j < 4; j++) { lp[j] += k * (s - lp[j]); s = lp[j]; }   // 4-pole anti-alias filter at the band edge
      if (r.state === 'armed') { if (Math.abs(x[i] * r.gain) >= r.thresh) r.state = 'rec'; else continue; }
      r.ph += step;
      while (r.ph >= 1) { r.ph -= 1; r.buf[r.n++] = s; if (r.n >= r.buf.length) { this.finishRecord(); return; } }
    }
  }
  // ---- playing ----
  noteOn(note, vel = 100) {
    const P = this.program();
    for (const kg of P.kgs) {
      if (note < kg.lo || note > kg.hi) continue;
      const si = kg.loud >= 0 && vel >= kg.xfade ? kg.loud : kg.sample, S = this.samples[si]; if (!S) continue;
      let v = this.voices.find((x) => !x.on) || this.voices.reduce((a, b) => (a.stage === 'rel' && b.stage !== 'rel' ? a : b.stage === 'rel' && a.stage !== 'rel' ? b : a.age < b.age ? a : b));   // a free voice, else a releasing one, else the oldest
      const semis = note - S.root + (S.tune + kg.tune + P.tune) / 100;   // tunes in cents
      Object.assign(v, { on: true, note, kg, S, pos: S.start, dir: 1, step: S.rate * 2 ** (semis / 12) / this.fs, env: 0, stage: 'att', held: true, vel, age: ++this.t, f1: 0, f2: 0,
        gain: (1 - kg.velLevel / 99 * (1 - vel / 127)), cut: Math.min(this.fs * 0.45, s9Cut(kg.filter) * 2 ** (kg.velFilter / 99 * 2 * (vel / 127 - 0.5))) });
    }
  }
  noteOff(note) { for (const v of this.voices) if (v.on && v.note === note && v.held) { v.held = false; if (v.S.mode !== 'one') v.stage = 'rel'; } }
  allOff() { for (const v of this.voices) v.on = false; }
  process(x, L, R, n) {
    if (x) this.recIn(x, n);
    L.fill(0); if (R !== L) R.fill(0);
    const fs = this.fs, P = this.program(), lv = this.level * (P.level / 99);
    let pk = this.peak * 0.97 ** (n / 128);
    for (const v of this.voices) {
      if (!v.on) continue;
      const S = v.S, d = S.data, kg = v.kg, end = Math.min(S.end, d.length), la = S.loopAt, le = Math.min(end, la + S.loopLen), loops = S.mode !== 'one' && S.loopLen > 16;
      const att = 1 / (s9Time(kg.attack) * fs), dec = 1 - Math.exp(-1 / (s9Time(kg.decay) * fs / 4)), rel = 1 - Math.exp(-1 / (s9Time(kg.release) * fs / 4)), sus = kg.sustain / 99;
      const g = Math.tan(Math.PI * Math.min(v.cut, fs * 0.45) / fs), kq = 1.2, a1 = 1 / (1 + g * (g + kq)), a2 = g * a1, a3 = g * a2;   // 2-pole low-pass (stable state-variable form), gentle resonance
      for (let i = 0; i < n; i++) {
        // envelope
        if (v.stage === 'att') { v.env += att; if (v.env >= 1) { v.env = 1; v.stage = 'dec'; } }
        else if (v.stage === 'dec') { v.env += (sus - v.env) * dec; }
        else if (v.stage === 'rel') { v.env -= v.env * rel; if (v.env < 1e-4) { v.on = false; break; } }
        // the staircase: no interpolation between words
        let p = v.pos | 0; if (p >= end || p < 0) { v.on = false; break; }
        const s = d[p];
        v.pos += v.step * v.dir;
        if (loops && v.held) {
          if (S.mode === 'alt') { if (v.dir > 0 && v.pos >= le) { v.dir = -1; v.pos = 2 * le - v.pos; } else if (v.dir < 0 && v.pos < la) { v.dir = 1; v.pos = 2 * la - v.pos; } }
          else if (v.pos >= le) v.pos -= S.loopLen;
        } else if (v.dir < 0) { v.dir = 1; }
        // per-voice filter
        const v3 = s - v.f2, v1 = a1 * v.f1 + a2 * v3, v2 = v.f2 + a2 * v.f1 + a3 * v3; v.f1 = 2 * v1 - v.f1; v.f2 = 2 * v2 - v.f2;
        const y = v2 * v.env * v.gain * lv;
        L[i] += y; if (R !== L) R[i] += y;
        const a = Math.abs(y); if (a > pk) pk = a;
      }
    }
    this.peak = pk;
  }
  meters() {
    const r = this.rec;
    const m = { voices: this.voices.filter((v) => v.on).length, peakDb: 20 * Math.log10(this.peak + 1e-9), rec: r.state, recDb: 20 * Math.log10(r.peak + 1e-9), recPct: r.buf ? r.n / r.buf.length : 0, used: this.used(), free: this.free(), nSamples: this.samples.length, last: r.last };
    r.peak *= 0.8; return m;
  }
}
