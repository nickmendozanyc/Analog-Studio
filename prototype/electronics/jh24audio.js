// HJ-24 (MCI JH-24) audio electronics model: every channel's Record/Cue, Reproduce, Output and Bias boards, the
// erase / record / reproduce heads and the tape between them. Renderer-independent: plain sample loops over
// Float32Arrays, so the same code runs in an AudioWorklet in the mockup, in Node tests, and ports 1:1 to the C++ engine.
//
// Signal flow follows the manual's block diagrams (JH-24 manual, section 4, figures 4-1 and 4-2):
//   LINE IN ─ balanced input amp ─┬─ IN CAL ─────────────────────────────────────────────────┐
//                                 └─ CAL REC ─ record HF EQ (<, per speed) ─ bias / tape ─ RECORD HEAD   │
//   ERASE HEAD (105 kHz)  ←  QUIOR: erase on, bias delayed by the erase→record head distance, both ramped │
//   RECORD/CUE HEAD (sync) ─ cue relay ─ cue preamp (+ cross-feed cancel) ─ cue EQ (<, >) ─ CUE LVL ──┤ output module:
//   REPRO HEAD ─ repro preamp ─ repro EQ (<, >, per speed) ─ REPRO LVL ────────────────────────────────┤ FET select
//                                                                                                       └─ line out, VU
// Units: audio samples where 0 VU (line level, +4 dBu) is -18 dBFS rms. On tape, 1.0 = the peak flux of a 0 VU sine
// at the machine's operating level (default 250 nWb/m). Numbers marked (approx) are plausible values, not MCI data.

export const VU0 = 10 ** (-18 / 20) * Math.SQRT2;   // peak amplitude of a 0 VU sine in the audio buffers
export const IPS = 0.0254;
// head stack geometry: distances along the tape path (m), erase → record → reproduce (approx)
export const HEADS = { eraseToRecord: 0.0381, recordToRepro: 0.0381 };
// per speed: losses and responses of heads and tape (approx; tuned so a factory-aligned channel is flat 30 Hz–20 kHz)
export const SPEED = {
  7.5: { gap: 18000, cueGap: 8000, tape: 13000, bump: 32, bumpDb: 2.5, shelf: 6000, hissDb: -50, overbias: 3.5, ramp: 0.04 },
  15: { gap: 30000, cueGap: 12000, tape: 22000, bump: 50, bumpDb: 2.5, shelf: 8000, hissDb: -54, overbias: 3.0, ramp: 0.03 },
  30: { gap: 40000, cueGap: 18000, tape: 30000, bump: 85, bumpDb: 2.0, shelf: 10000, hissDb: -58, overbias: 2.0, ramp: 0.015 },
};
export const SPEEDS = [7.5, 15, 30];
// tape formulations (made-up brand names). ol: recommended operating level, mol: 3 % third harmonic at 1 kHz (nWb/m),
// ft: length on the reel (5000 ft only on the 14" GP9), noise: hiss relative to the reference tape (dB), sens: 1 kHz sensitivity (dB), bias: extra bias it wants for the
// same overbias (dB), hf: 10 kHz sensitivity (dB). Relative to a 456-type tape; all (approx).
export const TAPES = {
  a456: { short: 'Amtex 456', name: 'Amtex 456 Grand Master', reel: 'a456', ol: 320, mol: 1040, noise: 0, sens: 0, bias: 0, hf: 0, ft: 2500 },
  a499: { short: 'Amtex 499', name: 'Amtex 499 Gold Master', reel: 'a499', ol: 370, mol: 1300, noise: -1, sens: 0.5, bias: 0.5, hf: 0.5, ft: 2500 },
  gp9: { short: 'Quantica GP9', name: 'Quantica GP9 Grand Master Platinum', reel: 'gp9', ol: 400, mol: 1550, noise: -2, sens: 1, bias: 1, hf: 0.5, ft: 2500 },
  gp9_14: { short: 'Quantica GP9 14"', name: 'Quantica GP9 Grand Master Platinum on a 14" reel', reel: 'gp14', ol: 400, mol: 1550, noise: -2, sens: 1, bias: 1, hf: 0.5, ft: 5000 },
  maxwell: { short: 'Maxwell UD', name: 'Maxwell UD Studio', reel: 'maxwell', ol: 320, mol: 1150, noise: -1, sens: 0.3, bias: 0.3, hf: 1, ft: 2500 },
  scotia: { short: 'Scotia 250', name: 'Scotia 250', reel: 'scotia', ol: 250, mol: 1000, noise: 1, sens: -0.5, bias: -0.5, hf: -0.5, ft: 2500 },
  atx: { short: 'ATX Master', name: 'ATX Magnetics Master Tape', reel: 'atx', ol: 400, mol: 1650, noise: -2, sens: 1.5, bias: 1.5, hf: 0, ft: 2500 },
  bafs: { short: 'BAFS SM 900', name: 'BAFS Studio Master 900 maxima', reel: 'bafs', ol: 370, mol: 1500, noise: -2.5, sens: 1, bias: 2, hf: -0.5, ft: 2500 },
};
// equalisation standards, playback time constants (s). The JH-24's HI speed (30 ips) is AES; LO switches NAB / IEC.
export const STANDARD = {
  NAB: { 7.5: [50e-6, 3180e-6], 15: [50e-6, 3180e-6], 30: [17.5e-6, 0] },
  IEC: { 7.5: [70e-6, 0], 15: [35e-6, 0], 30: [17.5e-6, 0] },
};
// level of an alignment-tape tone recorded to standard A, reproduced by a machine set to standard B (dB)
export function standardOffset(a, b, ips, f) {
  const c = (std) => { const [th, tl] = STANDARD[std][ips], w = 2 * Math.PI * f, w1 = 2 * Math.PI * 1000; const g = (w) => Math.sqrt(1 + (w * th) ** 2) / (tl ? Math.sqrt(1 + 1 / (w * tl) ** 2) : 1); return g(w) / g(w1); };
  return 20 * Math.log10(c(b) / c(a));
}

// ---------------------------------------------------------------- filters (RBJ biquads, direct form 1)
export class Biquad {
  constructor() { this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0; this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  set(type, fs, f, q = 0.707, db = 0) {
    f = Math.min(f, fs * 0.45);
    const A = 10 ** (db / 40), w = 2 * Math.PI * f / fs, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
    else if (type === 'hs' || type === 'ls') {
      const s = type === 'hs' ? 1 : -1, sq = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) + s * (A - 1) * cs + sq); b1 = -2 * s * A * ((A - 1) + s * (A + 1) * cs); b2 = A * ((A + 1) + s * (A - 1) * cs - sq);
      a0 = (A + 1) - s * (A - 1) * cs + sq; a1 = 2 * s * ((A - 1) - s * (A + 1) * cs); a2 = (A + 1) - s * (A - 1) * cs - sq;
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  run(x) { const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
  mag(f, fs) {   // |H(e^jw)|
    const w = 2 * Math.PI * f / fs, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    const nr = this.b0 + this.b1 * c1 + this.b2 * c2, ni = -(this.b1 * s1 + this.b2 * s2), dr = 1 + this.a1 * c1 + this.a2 * c2, di = -(this.a1 * s1 + this.a2 * s2);
    return Math.sqrt((nr * nr + ni * ni) / (dr * dr + di * di));
  }
}
const chainMag = (fl, f, fs) => fl.reduce((m, b) => m * b.mag(f, fs), 1);
const dB = (x) => 20 * Math.log10(Math.max(x, 1e-12));
const gain = (d) => 10 ** (d / 20);

// ---------------------------------------------------------------- tape: per track, pieces of recorded flux by position
// A piece is a run of samples written while the tape moved at du metres per sample, starting at coordinate u0 (metres
// from the head of the tape; the point under the repro head is the transport's `take`). lo / hi clip it where it was
// erased later, with linear fades (the erase head's ramp). `post` pieces are transfers loaded from audio files: they hold
// what the tape already sounds like reproduced, so they skip the head / EQ models.
class Piece {
  constructor(u0, du, post = false) { this.u0 = u0; this.du = du; this.post = post; this.chunks = [new Float32Array(1 << 15)]; this.n = 0; this.lo = -Infinity; this.hi = Infinity; this.fadeLo = 0; this.fadeHi = 0; }
  push(x) { const c = this.n >> 15; if (c >= this.chunks.length) this.chunks.push(new Float32Array(1 << 15)); this.chunks[c][this.n & 32767] = x; this.n++; }
  get end() { return this.u0 + this.n * this.du; }
  set(i, x) { this.chunks[i >> 15][i & 32767] = x; }
  // write the flux under the head at coordinate u: the piece is indexed by position (du per cell), so speed changes
  // (vari-speed, the transport easing) just write cells faster or slower, linearly filled between samples
  write(u, x) {
    const j = Math.round((u - this.u0) / this.du);
    if (j < 0) return;
    if (this.n === 0 || j < this.n) { while (this.n <= j) this.push(x); this.set(j, x); return; }
    const last = this.at(this.n - 1), from = this.n - 1, span = j - from;
    for (let q = 1; q <= span; q++) this.push(last + (x - last) * q / span);
  }
  at(i) { return this.chunks[i >> 15][i & 32767]; }
  read(u) {
    if (u < this.lo || u > this.hi) return 0;
    const p = (u - this.u0) / this.du; if (p < 0 || p > this.n - 1) return 0;
    const i = Math.floor(p), fr = p - i, x = this.at(i) + (i + 1 < this.n ? (this.at(i + 1) - this.at(i)) * fr : 0);
    let w = 1;
    if (this.fadeLo > 0 && u < this.lo + this.fadeLo) w *= (u - this.lo) / this.fadeLo;
    if (this.fadeHi > 0 && u > this.hi - this.fadeHi) w *= (this.hi - u) / this.fadeHi;
    return x * w;
  }
  clone() { const q = Object.assign(Object.create(Piece.prototype), this); return q; }
}
export class Track {
  constructor() { this.pieces = []; }
  read(u, post) { let s = 0; for (const p of this.pieces) if (p.post === post && u >= p.lo && u <= p.hi && u >= p.u0 && u <= p.end) s += p.read(u); return s; }
  // erase [a, b): pieces fade out over `ramp` after a and fade back in over `ramp` before b (the erase head's ramps)
  erase(a, b, ramp, except = null) {
    if (b < a + ramp) return;   // still inside the erase head's ramp-up: nothing fully erased yet
    const out = [];
    for (const p of this.pieces) {
      if ((except && p.owner === except) || p.end <= a || p.u0 >= b || p.hi <= a || p.lo >= b) { out.push(p); continue; }
      if (p.lo < a) { const l = p.clone(); l.hi = Math.min(p.hi, a + ramp); l.fadeHi = ramp; out.push(l); }
      if (p.hi > b) { const r = p.clone(); r.lo = Math.max(p.lo, b - ramp); r.fadeLo = ramp; out.push(r); }
    }
    this.pieces = out;
  }
}

// ---------------------------------------------------------------- one channel's boards
// trims (the 18-turn pots and switches on the cards), per speed where the board switches networks with HI EQ / LO EQ
export function defaultTrims() {
  const per = (v) => ({ 7.5: v, 15: v, 30: v });
  return {
    std: 'NAB',                 // NAB / IEC button on the Record/Cue and Reproduce cards (LO speed only; HI is AES)
    inCal: 0, calRec: 0,        // Record/Cue card: IN CAL (input monitor), CAL REC (record level), dB
    recHf: per(0),              // record HF EQ  < (dB)
    cueLvl: 0, cueHf: per(0), cueLf: per(0),
    reproLvl: 0, reproHf: per(0), reproLf: per(0),
    bias: per(0),               // bias relative to the 10 kHz peak (dB); aligned = the speed's overbias
    biasDefeat: false,          // Output module: spot erase (erase only, nothing recorded)
    crossfeed: 1,               // cross-feed cancel amount (1 = matched)
  };
}

export class Channel {
  constructor(fs, index) {
    this.fs = fs; this.i = index; this.t = defaultTrims();
    this.fl = { rec: [new Biquad(), new Biquad()], tape: new Biquad(), rep: [new Biquad(), new Biquad(), new Biquad(), new Biquad(), new Biquad()], cue: [new Biquad(), new Biquad(), new Biquad(), new Biquad(), new Biquad()], aa: [new Biquad(), new Biquad()] };
    this.ips = 30; this.sel = 'repro'; this.mix = { input: 0, cue: 0, repro: 1 }; this.vu = 0; this.lastRec = 0;
    this.configure(30);
  }
  // build the networks for a speed (the speed switch's HI EQ / LO EQ lines)
  configure(ips, opLevel = this.opLevel ?? 250) {
    const S = SPEED[ips], t = this.t, fs = this.fs, tp = this.tape || TAPES.a456; this.ips = ips; this.S = S; this.opLevel = opLevel;
    const b = t.bias[ips] - tp.bias;   // bias relative to what this tape wants   // dB from peak: >0 overbias (less HF, cleaner), <0 underbias (less output, distortion)
    const hfBias = b >= 0 ? -b : -1.2 * b * b, lfBias = b >= 0 ? -0.12 * b : -0.4 * b * b;
    this.recGain = gain(t.calRec + lfBias + tp.sens) / VU0;
    this.fl.rec[0].set('hs', fs, S.shelf, 0.7, t.recHf[ips]);
    this.fl.rec[1].set('hs', fs, 7000, 0.7, hfBias + tp.hf);
    this.fl.tape.set('lp', fs, S.tape, 0.6);
    const mol = tp.mol / opLevel;   // 3 % third harmonic at the tape's MOL (1040 nWb/m for the spec table's tape)
    this.sat = (0.6 / mol) * (b < 0 ? 1 + 0.35 * -b : 1 - 0.03 * Math.min(b, 6));
    const head = (fl, gap, hf, lf, lvl) => {
      fl[0].set('hp', fs, S.bump * 0.28, 0.6); fl[1].set('peak', fs, S.bump, 1.1, S.bumpDb); fl[2].set('lp', fs, gap, 0.6);
      fl[3].set('hs', fs, S.shelf * 1.6, 0.7, hf); fl[4].set('ls', fs, S.bump * 1.3, 0.7, lf);
      return gain(lvl) * VU0;
    };
    this.repGain = head(this.fl.rep, S.gap, t.reproHf[ips], t.reproLf[ips], t.reproLvl);
    this.cueGain = head(this.fl.cue, S.cueGap, t.cueHf[ips], t.cueLf[ips], t.cueLvl);
    this.inGain = gain(t.inCal);
    this.hiss = gain(S.hissDb + tp.noise + 20 * Math.log10(510 / opLevel)) * Math.SQRT1_2;
  }
  // analytic responses (dB re 1 kHz) for alignment and the test bench
  recordReproDb(f) { const fs = this.fs; const r = (f) => chainMag(this.fl.rec, f, fs) * this.fl.tape.mag(f, fs) * chainMag(this.fl.rep, f, fs); return dB(r(f) / r(1000)); }
  reproDb(f) { const fs = this.fs, r = (f) => chainMag(this.fl.rep, f, fs); return dB(r(f) / r(1000)); }
  cueDb(f) { const fs = this.fs, r = (f) => chainMag(this.fl.cue, f, fs); return dB(r(f) / r(1000)); }
  // gain of each path at 1 kHz relative to unity (dB): repro of a flat-flux tape, and record → repro of a 0 VU input
  reproLevelDb() { return dB(chainMag(this.fl.rep, 1000, this.fs) * this.repGain / VU0); }
  overallDb(f = 1000) { return dB(chainMag(this.fl.rec, f, this.fs) * this.fl.tape.mag(f, this.fs) * this.recGain * VU0 * chainMag(this.fl.rep, f, this.fs) * this.repGain / VU0); }
}

// factory alignment, the way section 7 does it on a machine: repro to the alignment tape (level 1 kHz, HF 10 kHz,
// LF 50 / 100 Hz), cue the same, bias peak + overbias, then record level and record HF for a flat record → repro.
export function align(ch, ips, opLevel = 250) {
  const t = ch.t, lfF = ips === 30 ? 100 : 50;
  t.bias[ips] = SPEED[ips].overbias + (ch.tape || TAPES.a456).bias;
  for (let it = 0; it < 30; it++) {
    ch.configure(ips, opLevel);
    t.reproHf[ips] -= ch.reproDb(10000) * 0.8; t.reproLf[ips] -= ch.reproDb(lfF) * 0.8;
    t.cueHf[ips] -= ch.cueDb(10000) * 0.8; t.cueLf[ips] -= ch.cueDb(lfF) * 0.8;
    ch.configure(ips, opLevel);
    t.reproLvl -= ch.reproLevelDb() * 0.8;
    t.cueLvl -= dB(chainMag(ch.fl.cue, 1000, ch.fs) * ch.cueGain / VU0) * 0.8;
    ch.configure(ips, opLevel);
    t.recHf[ips] -= ch.recordReproDb(10000) * 0.8;
    ch.configure(ips, opLevel);
    t.calRec -= ch.overallDb(1000) * 0.8;
  }
  ch.configure(ips, opLevel);
}

// ---------------------------------------------------------------- monitor switching (output module FETs)
// st: { master: { tape, input, auto } (INPUT and AUTO may both be down), ready: Set, cue: Set, inputs: Set (individual
// input), mode: transport mode }. Returns 'input' | 'cue' | 'repro' for channel i. Manual sections 2.2.3 and 2.3.2.
export function monitorSource(i, st) {
  const ready = st.ready.has(i), rec = st.mode === 'rec' && ready, playing = st.mode === 'play' || st.mode === 'rec';
  if (st.inputs && st.inputs.has(i)) return 'input';
  if (st.master.input && st.master.auto) return ready ? 'input' : 'cue';
  if (st.master.input) return 'input';
  if (st.master.auto) { if (!ready) return 'cue'; return rec ? 'input' : playing ? 'cue' : 'input'; }
  if (rec) return 'repro';                                     // TAPE: recording channels monitor the repro head
  return st.cue && st.cue.has(i) ? 'cue' : 'repro';
}

// ---------------------------------------------------------------- the machine: 24 channels, tape, heads, QUIOR
export class Machine {
  constructor(fs, { tracks = 24, opLevel = 250, quior = true, hiss = true, wowFlutter = true } = {}) {
    this.fs = fs; this.n = tracks; this.opLevel = opLevel; this.quior = quior; this.hiss = hiss; this.wf = wowFlutter;
    this.tape = TAPES.a456;
    this.ch = Array.from({ length: tracks }, (_, i) => { const c = new Channel(fs, i); c.tape = this.tape; return c; });
    this.tracks = Array.from({ length: tracks }, () => new Track());
    this.take = 0; this.v = 0; this.lift = 0; this.ips = 30; this.time = 0;
    this.st = { master: { tape: false, input: false, auto: true }, ready: new Set(), cue: new Set(), inputs: new Set(), mode: 'stop' };
    this.pass = Array(tracks).fill(null);    // per track: active record pass (erase / bias timing)
    this.rng = 0x1234567;
    for (const s of SPEEDS) for (const c of this.ch) align(c, s, opLevel);
    this.setSpeed(30);
  }
  setSpeed(ips) { this.ips = ips; for (const c of this.ch) c.configure(ips, this.opLevel); }
  setOpLevel(ol) { this.opLevel = ol; for (const s of SPEEDS) for (const c of this.ch) align(c, s, ol); this.setSpeed(this.ips); }
  // thread a different tape: its formulation changes level, headroom, noise and the bias it wants. The machine keeps
  // its alignment (realign for the new tape, as you would); `tracks` are what is recorded on that reel.
  setTape(tape, tracks = null) {
    this.tape = tape; for (const c of this.ch) c.tape = tape;
    this.pass = Array(this.n).fill(null);
    if (tracks) this.tracks = tracks;
    this.setSpeed(this.ips);
  }
  noise() { this.rng ^= this.rng << 13; this.rng ^= this.rng >>> 17; this.rng ^= this.rng << 5; return ((this.rng >>> 0) / 4294967296 - 0.5) * 3.4641; }   // unit-variance
  // load a transfer (already reproduced audio) onto a track, starting at tape coordinate u0, recorded at `ips`
  loadTransfer(track, samples, u0, ips = 30, fsFile = this.fs) {
    const p = new Piece(u0, ips * IPS / fsFile, true);
    for (let i = 0; i < samples.length; i++) p.push(samples[i]);
    this.tracks[track].erase(u0, p.end, 0);
    this.tracks[track].pieces.push(p);
  }
  // process one block. inp[i] / out[i]: Float32Array per channel (line in / line out). ctl: { take, v, lift, mode, ips }
  // (transport at the start of the block; v in m/s, + toward the take-up reel).
  process(inp, out, ctl) {
    const fs = this.fs, N = out[0].length, st = this.st;
    if (ctl && ctl.take != null && Math.abs(ctl.take - this.take) > 0.005) {   // the tape jumped (locate): end any record pass
      for (let i = 0; i < this.n; i++) { const ps = this.pass[i]; if (ps) { this.tracks[i].erase(ps.ua, ps.ub ?? this.take + HEADS.recordToRepro + HEADS.eraseToRecord, ps.ramp, ps); this.pass[i] = null; } }
    }
    if (ctl) { if (ctl.ips && ctl.ips !== this.ips) this.setSpeed(ctl.ips); if (ctl.take != null) this.take = ctl.take; if (ctl.v != null) this.v = ctl.v; if (ctl.lift != null) this.lift = ctl.lift; if (ctl.mode) st.mode = ctl.mode; }
    const v = this.v, dt = 1 / fs, vn = this.ips * IPS, dER = HEADS.eraseToRecord, dRR = HEADS.recordToRepro;
    const contact = 1 - Math.min(1, this.lift), moving = Math.min(1, Math.abs(v) / vn);
    const recording = st.mode === 'rec' && v > 0.5 * vn;
    // anti-alias the heads while winding with the lifters out (the "spooling" sound)
    const ratio = Math.max(1, Math.abs(v) / vn);
    if (ratio > 1.01) for (const c of this.ch) { c.fl.aa[0].set('lp', fs, 18000 / ratio, 0.7); c.fl.aa[1].set('lp', fs, 18000 / ratio, 0.7); }
    // monitor sources and their crossfades (FET switching, ~2 ms)
    const src = this.ch.map((c, i) => monitorSource(i, st));
    // record passes: QUIOR timing at the head positions. A tape that has slowed below play speed ends the pass (the
    // record relays drop out with the transport)
    if (Math.abs(v) < 0.3 * vn) for (let i = 0; i < this.n; i++) { const ps = this.pass[i]; if (ps) { this.tracks[i].erase(ps.ua, ps.ub ?? this.take + dRR + dER, ps.ramp, ps); this.pass[i] = null; } }
    for (let i = 0; i < this.n; i++) {
      const want = recording && st.ready.has(i);
      let ps = this.pass[i];
      const ramp = this.ch[i].S.ramp * Math.max(v, 1e-3), delay = this.quior ? dER / Math.max(v, 1e-3) : 0;
      if (want && !ps) ps = this.pass[i] = { eraseOn: this.time, eraseOff: null, biasOn: this.time + delay, biasOff: null, ua: this.take + dRR + dER, ramp, piece: null, env: 0 };
      if (!want && ps && ps.eraseOff == null) { ps.eraseOff = this.time; ps.biasOff = this.time + delay; ps.ub = this.take + dRR + dER; }
    }
    for (let k = 0; k < N; k++) {
      const take = this.take;
      // wow and flutter: small periodic + random displacement of what each head reads (0.03-0.04 %)
      const wf = this.wf ? (0.0003 * v) * (Math.sin(2 * Math.PI * 0.7 * this.time) / (2 * Math.PI * 0.7) * 0.6 + Math.sin(2 * Math.PI * 5.3 * this.time) / (2 * Math.PI * 5.3)) : 0;
      const uRep = take + wf, uRec = take + dRR + wf * 0.9, uEr = take + dRR + dER;
      for (let i = 0; i < this.n; i++) {
        const c = this.ch[i], tr = this.tracks[i], x = inp && inp[i] ? inp[i][k] : 0, ps = this.pass[i];
        // ---- record: erase head then bias at the record head (QUIOR ramps)
        let recOut = 0;
        if (ps) {
          // erase window: everything between ua and the erase head now is erased (ramped at both ends)
          const eraseNow = ps.eraseOff == null || this.time < ps.eraseOff;
          if (eraseNow && k % 32 === 0) tr.erase(ps.ua, uEr, ps.ramp, ps);
          const biasLive = this.time >= ps.biasOn && (ps.biasOff == null || this.time < ps.biasOff + c.S.ramp);
          if (biasLive && !c.t.biasDefeat && v > 0.3 * vn) {
            if (!ps.piece) { const pc = new Piece(uRec, vn * dt); pc.owner = ps; tr.pieces.push(pc); ps.piece = pc; }
            const up = (this.time - ps.biasOn) / c.S.ramp, down = ps.biasOff == null ? 1 : 1 - (this.time - ps.biasOff) / c.S.ramp;
            ps.env = Math.max(0, Math.min(1, up, down));
            let r = c.fl.rec[1].run(c.fl.rec[0].run(x * c.recGain));
            r = Math.tanh(c.sat * r) / c.sat;
            recOut = r;
            ps.piece.write(uRec, c.fl.tape.run(r) * ps.env);
          }
          if (ps.eraseOff != null && this.time >= ps.biasOff + c.S.ramp) {   // pass over: final erase with the ramp back
            tr.erase(ps.ua, ps.ub, ps.ramp, ps); this.pass[i] = null;
          }
        }
        c.lastRec = recOut;
        // ---- reproduce and cue (sync) heads
        const h = this.hiss ? this.noise() * c.hiss * Math.sqrt(moving) : 0;
        let rep = 0, cue = 0;
        if (contact > 0.001 && Math.abs(v) > 1e-5) {
          const fr = tr.read(uRep, false) + h, fc = tr.read(uRec, false) + h;
          let a = fr, b = fc;
          if (ratio > 1.01) { a = c.fl.aa[0].run(a); b = c.fl.aa[1].run(b); }
          // only the heads being monitored (or fading out) are run through their electronics
          if (c.mix.repro > 0 || src[i] === 'repro') for (const f of c.fl.rep) a = f.run(a);
          if (c.mix.cue > 0 || src[i] === 'cue') for (const f of c.fl.cue) b = f.run(b);
          rep = (a * c.repGain + tr.read(uRep, true)) * contact;
          // cue: the record head can't play while its own track records; adjacent recording tracks leak in
          // (≈ -32 dB) and the cross-feed cancels it out of phase
          let xt = 0;
          for (const j of [i - 1, i + 1]) if (j >= 0 && j < this.n && this.pass[j]) xt += this.ch[j].lastRec * VU0 * gain(-32) * (1 - c.t.crossfeed);
          cue = ps ? 0 : (b * c.cueGain + tr.read(uRec, true) * 0.97 + xt) * contact;
        }
        // ---- output module: FET select with a short crossfade, balanced output amp
        const m = c.mix, s = src[i], step = 1 / (0.002 * fs);
        for (const key of ['input', 'cue', 'repro']) m[key] += Math.max(-step, Math.min(step, (key === s ? 1 : 0) - m[key]));
        const y = m.input * x * c.inGain + m.cue * cue + m.repro * rep;
        out[i][k] = y;
        // VU ballistics (≈300 ms)
        c.vu += (Math.abs(y) - c.vu) * (1 / (0.3 * fs / 3));
      }
      this.take += v * dt; this.time += dt;
    }
  }
}
