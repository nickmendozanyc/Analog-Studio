// E-mew SP-1200 (after the E-mu SP-1200, 1987): the sampler-sequencer's sound and its sequencer, sample by sample.
// 12-bit words at 26.04 kHz, 10 s of memory in all, 32 sounds (banks A-D x 8 pads). A pad plays on its own output
// channel (1-8, one voice each; a retrigger restarts it). Pitch (TUNE) is a change of the replay rate with no
// interpolation, so the words are held and the images alias: the machine's grit. Channels 1-2 have a low-pass that closes
// as the sound decays (the SSM2044s), 3-6 a fixed low-pass, 7-8 none. The sequencer runs at 96 ppq: patterns of 1-8
// bars, AUTO CORRECT (quantise) as notes go in, SWING on the off 16ths, TAP / REPEAT, ERASE.
export const SP_FS = 26040, SP_WORDS = 10 * 26040, SP_PPQ = 96;
const sp12 = (x) => Math.round(Math.max(-1, Math.min(1, x)) * 2047) / 2047;
export function spSound(data, name = 'SOUND') { const q = new Float32Array(data.length); for (let i = 0; i < data.length; i++) q[i] = sp12(data[i]); return { name, data: q, tune: 0, decay: 1, level: 0.8, start: 0, end: q.length }; }
export function spPattern(bars = 2) { return { bars, events: [] }; }   // events: { t (ticks), pad (0-31), v }
export const SP_QUANT = { '1/8': 48, '1/8T': 32, '1/16': 24, '1/16T': 16, '1/32': 12, '1/32T': 8, OFF: 1 };

export class SP1200 {
  constructor(fs) {
    this.fs = fs; this.sounds = Array(32).fill(null); this.patterns = Array.from({ length: 100 }, () => spPattern(2)); this.pat = 0;
    this.tempo = 90; this.swing = 50; this.quant = '1/16'; this.run = false; this.rec = false; this.tick = 0; this.ph = 0; this.metro = true;
    this.ch = Array.from({ length: 8 }, () => ({ on: false, S: null, pos: 0, step: 1, env: 1, dec: 0, g: 0, lp: [0, 0], cut: 1 }));
    this.held = new Set(); this.repeat = false; this.erase = new Set(); this.sync = null; this.peak = 0; this.clickT = 0;
  }
  used() { return this.sounds.reduce((a, s) => a + (s ? s.data.length : 0), 0); }
  free() { return SP_WORDS - this.used(); }
  // play a pad now (0-31: bank * 8 + pad); v 0..1 (the pads are velocity sensitive)
  hit(pad, v = 1) {
    const S = this.sounds[pad]; if (!S) return;
    const c = this.ch[pad % 8], rate = SP_FS * 2 ** ((S.tune || 0) / 12) / this.fs;
    Object.assign(c, { on: true, S, pos: S.start || 0, step: rate, env: 1, g: v * (S.level ?? 0.8), dec: S.decay >= 0.999 ? 0 : 1 - Math.exp(-1 / (this.fs * (0.03 + S.decay * 1.6))), cut: 1 });
  }
  // MULTI PITCH: one sound across the eight channels, each at its own tune
  hitWith(si, ch, tune, v = 1) {
    const S = this.sounds[si]; if (!S) return;
    const c = this.ch[ch], rate = SP_FS * 2 ** (tune / 12) / this.fs;
    Object.assign(c, { on: true, S, pos: S.start || 0, step: rate, env: 1, g: v * (S.level ?? 0.8), dec: S.decay >= 0.999 ? 0 : 1 - Math.exp(-1 / (this.fs * (0.03 + S.decay * 1.6))), cut: 1 });
  }
  // the sequencer: record a hit at the current position (quantised)
  record(pad, v) {
    const P = this.patterns[this.pat], len = P.bars * 4 * SP_PPQ, q = SP_QUANT[this.quant] || 1;
    let t = Math.round(this.tick / q) * q; if (t >= len) t -= len;
    if (!P.events.some((e) => e.t === t && e.pad === pad)) P.events.push({ t, pad, v });
  }
  press(pad, v = 1) { this.hit(pad, v); this.held.add(pad); if (this.run && this.rec) this.record(pad, v); }
  release(pad) { this.held.delete(pad); }
  start() { this.run = true; this.tick = -1; this.ph = 0.999; }
  stop() { this.run = false; }
  swingT(t) {   // the off 16ths move late by the swing %
    if (this.swing <= 50) return t; const s16 = SP_PPQ / 4, k = t % (2 * s16);
    return k === s16 ? t + Math.round((this.swing - 50) / 50 * 2 * s16) - 0 * s16 : t;
  }
  advance() {
    const P = this.patterns[this.pat], len = P.bars * 4 * SP_PPQ;
    this.tick = (this.tick + 1) % len;
    const t = this.tick;
    for (const e of P.events) {
      if (this.erase.has(e.pad) && this.rec) continue;
      if (this.swingT(e.t) % len === t) this.hit(e.pad, e.v);
    }
    if (this.erase.size && this.rec) P.events = P.events.filter((e) => !(this.erase.has(e.pad) && Math.abs(e.t - t) < 2));
    const q = SP_QUANT[this.quant] || 24;
    if (this.repeat && t % q === 0) for (const p of this.held) { this.hit(p, 0.9); if (this.rec) this.record(p, 0.9); }
    if (this.metro && this.rec && t % SP_PPQ === 0) this.clickT = Math.round(this.fs * 0.012) * (t % (4 * SP_PPQ) === 0 ? 2 : 1);
  }
  process(L, R, n) {
    const fs = this.fs; L.fill(0); if (R !== L) R.fill(0);
    if (this.sync && this.sync.run !== undefined) {   // DIN sync / tape: follow the song position
      if (!this.sync.run) { if (this.run) this.stop(); } else { const len = this.patterns[this.pat].bars * 4 * SP_PPQ, want = Math.floor(this.sync.beats * SP_PPQ) % len; if (!this.run) { this.run = true; this.tick = want - 1; } this.tempo = this.sync.bpm; }
    }
    const inc = this.tempo / 60 * SP_PPQ / fs;
    let pk = this.peak * 0.97 ** (n / 128);
    const PAN = [-0.15, 0.15, -0.35, 0.35, -0.55, 0.55, -0.25, 0.25];
    for (let i = 0; i < n; i++) {
      if (this.run) { this.ph += inc; while (this.ph >= 1) { this.ph -= 1; this.advance(); } }
      let l = 0, r = 0;
      for (let k = 0; k < 8; k++) {
        const c = this.ch[k]; if (!c.on) continue;
        const d = c.S.data, p = c.pos | 0; if (p >= (c.S.end || d.length) || p >= d.length) { c.on = false; continue; }
        let x = d[p]; c.pos += c.step;   // held word: no interpolation
        if (c.dec) { c.env -= c.env * c.dec; if (c.env < 1e-4) { c.on = false; continue; } }
        // output filters: 1-2 dynamic (closing with the envelope), 3-6 fixed, 7-8 none
        if (k < 6) { const fc = k < 2 ? 1200 + 11000 * c.env * c.env : 11500, a = 1 - Math.exp(-2 * Math.PI * fc / fs); c.lp[0] += a * (x - c.lp[0]); c.lp[1] += a * (c.lp[0] - c.lp[1]); x = c.lp[1]; }
        const y = x * c.env * c.g; l += y * (1 - PAN[k]); r += y * (1 + PAN[k]);
      }
      if (this.clickT > 0) { const c = (this.clickT-- % 20 < 10 ? 0.15 : -0.15); l += c; r += c; }
      L[i] = l; if (R !== L) R[i] = r; const a = Math.max(Math.abs(l), Math.abs(r)); if (a > pk) pk = a;
    }
    this.peak = pk;
  }
  meters() { return { run: this.run, tick: this.tick, bar: Math.floor(Math.max(0, this.tick) / (4 * SP_PPQ)) + 1, beat: Math.floor(Math.max(0, this.tick) / SP_PPQ) % 4 + 1, peakDb: 20 * Math.log10(this.peak + 1e-9), on: this.ch.map((c) => c.on), tempo: this.tempo }; }
}
// a starter kit, synthesised here and stored as 12-bit, 26.04 kHz sounds (bank A)
export function spFactory() {
  const mk = (sec, fn) => { const n = Math.round(SP_FS * sec), d = new Float32Array(n); const st = { r: 1200 }; for (let k = 0; k < n; k++) d[k] = fn(k / SP_FS, st); return d; };
  const rnd = (st) => { st.r = (st.r * 1103515245 + 12345) & 0x7fffffff; return st.r / 0x7fffffff * 2 - 1; };
  return [
    ['KICK', mk(0.5, (t) => 0.95 * Math.tanh(1.8 * Math.sin(2 * Math.PI * (52 * t + 90 * (1 - Math.exp(-t * 28)) / 28))) * Math.exp(-t * 6.5))],
    ['SNARE', mk(0.32, (t, st) => 0.5 * Math.sin(2 * Math.PI * 195 * t) * Math.exp(-t * 18) + 0.55 * rnd(st) * Math.exp(-t * 13))],
    ['CL HAT', mk(0.09, (t, st) => { const x = rnd(st); st.h = (st.h || 0) * 0.35 + x * 0.65; return 0.5 * (x - st.h) * Math.exp(-t * 45); })],
    ['OP HAT', mk(0.45, (t, st) => { const x = rnd(st); st.h = (st.h || 0) * 0.35 + x * 0.65; return 0.42 * (x - st.h) * Math.exp(-t * 7); })],
    ['CLAP', mk(0.35, (t, st) => { const x = rnd(st), b = t < 0.03 ? Math.exp(-((t % 0.009) / 0.002)) : Math.exp(-(t - 0.03) * 11); return 0.6 * x * b; })],
    ['RIM', mk(0.08, (t) => 0.7 * (Math.sin(2 * Math.PI * 1700 * t) + 0.6 * Math.sin(2 * Math.PI * 480 * t)) * Math.exp(-t * 70))],
    ['BASS', mk(1.2, (t) => 0.55 * Math.tanh(2.2 * Math.sin(2 * Math.PI * 55 * t)) * Math.exp(-t * 1.6))],
    ['STAB', mk(0.7, (t) => 0.32 * [261.6, 311.1, 392, 466.2].reduce((a, f) => a + (2 * ((f * t) % 1) - 1), 0) / 2 * Math.exp(-t * 3.5))],
  ].map(([nm, d]) => spSound(d, nm));
}
