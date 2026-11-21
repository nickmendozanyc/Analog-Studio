// Rowan TR-9090 (after the Roland TR-909 Rhythm Composer, 1983): voices and sequencer, sample by sample.
// The drums are analog-style: the bass drum a sine swept down from a high start (TUNE = how far, ATTACK = the click,
// DECAY), snare two tuned oscillators plus noise (TONE filters it, SNAPPY sets it), toms swept sines, rim shot and hand
// clap from noise and resonators. The hi-hats, crash and ride were 6-bit samples on the original: here they are made from
// metallic oscillators and noise and then reduced to 6 bits, so they carry the same grit. The sequencer: 16 patterns of
// up to 16 steps (LAST STEP), an accent row (TOTAL ACCENT), a flam row (FLAM amount), SHUFFLE (delays every second 16th),
// internal tempo or DIN sync (the song position from the SBX-80).
import { TrBp } from './tr808.js';
export const TR9_INST = ['BD', 'SD', 'LT', 'MT', 'HT', 'RS', 'CP', 'CH', 'OH', 'CR', 'RD'];
const T9_TAU = 2 * Math.PI, q6 = (x) => Math.round(Math.max(-1, Math.min(1, x)) * 31) / 31;
export function tr9Defaults() {
  return { master: 0.8, accent: 0.6, tempo: 125, shuffle: 0, flam: 5, sync: 'int', spb: 4,
    BD: { tune: 0.5, level: 0.85, attack: 0.5, decay: 0.5 }, SD: { tune: 0.5, level: 0.7, tone: 0.5, snappy: 0.6 },
    LT: { tune: 0.5, level: 0.6, decay: 0.5 }, MT: { tune: 0.5, level: 0.6, decay: 0.5 }, HT: { tune: 0.5, level: 0.6, decay: 0.5 },
    RS: { level: 0.6 }, CP: { level: 0.7 }, CH: { level: 0.6, decay: 0.3 }, OH: { level: 0.55, decay: 0.5 }, CR: { level: 0.5, tune: 0.5 }, RD: { level: 0.5, tune: 0.5 } };
}
export function tr9EmptyPattern() { return { len: 16, steps: Object.fromEntries(['AC', 'FL', ...TR9_INST].map((k) => [k, Array(16).fill(0)])) }; }

export class TR909 {
  constructor(fs) {
    this.fs = fs; this.p = tr9Defaults(); this.patterns = Array.from({ length: 48 }, tr9EmptyPattern); this.pat = 0; this.next = null; this.track = []; this.trackMode = false; this.meas = 0;
    this.run = false; this.ph = 0; this.step = -1; this.sync = null; this.pend = []; this.peak = 0; this.seed = 90909;
    this.v = {}; for (const k of TR9_INST) this.v[k] = { on: false, t: 0, acc: 1, ph: 0 };
    this.mph = new Float64Array(6);
    this.f = { sdN: new TrBp(fs, 5000, 0.6), cp: new TrBp(fs, 1200, 2), cpT: new TrBp(fs, 1000, 1.6), hhH: new TrBp(fs, 8000, 0.9), hhB: new TrBp(fs, 9500, 1.1), cr: new TrBp(fs, 6000, 0.7), rdB: new TrBp(fs, 4200, 2.5), rdH: new TrBp(fs, 7000, 0.9), rs: new TrBp(fs, 1500, 1), bd: new TrBp(fs, 3000, 0.7) };
    this.pan = { BD: 0, SD: 0, LT: -0.3, MT: -0.05, HT: 0.25, RS: -0.2, CP: 0.08, CH: -0.25, OH: -0.3, CR: 0.35, RD: 0.3 };
  }
  noise() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 2147483648 - 1; }
  set(o) { for (const k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && this.p[k]) Object.assign(this.p[k], o[k]); else this.p[k] = o[k]; } return this; }
  trig(k, acc = false, lvl = 1) {
    const v = this.v[k]; if (!v) return;
    v.on = true; v.t = 0; v.ph = 0; v.acc = (acc ? 1 + this.p.accent * 0.8 : 1) * lvl; v.g = 1;
    if (k === 'CH' && this.v.OH.on) this.v.OH.choke = true; if (k === 'OH') this.v.OH.choke = false;
  }
  start() { this.run = true; this.step = -1; this.ph = 0.999999; this.pend = []; this.meas = 0; if (this.trackMode) { if (this.track.length) this.pat = this.track[0]; else this.run = false; } }
  stop() { this.run = false; this.step = -1; this.pend = []; }
  advance() {
    this.step++;
    const P = this.patterns[this.pat];
    if (this.step >= (P.len || 16)) { this.step = 0; if (this.trackMode) { if (!this.track.length) { this.run = false; return; } this.meas = (this.meas + 1) % this.track.length; this.pat = this.track[this.meas]; } else if (this.next != null) { this.pat = this.next; this.next = null; } }
    const Q = this.patterns[this.pat], S = Q.steps, st = this.step, tot = !!S.AC[st], fl = !!S.FL[st];
    // shuffle: every second 16th comes late (up to a third of a step at 7)
    const stepLen = 60 / this.p.tempo / (this.p.spb || 4) * this.fs, late = st % 2 ? Math.round(this.p.shuffle / 7 * stepLen / 3) : 0;
    for (const k of TR9_INST) if (S[k][st]) {
      const acc = tot || S[k][st] === 2;   // a strong step (2) or the total-accent row
      this.pend.push({ at: late, k, acc, lvl: 1 });
      if (fl) this.pend.push({ at: late + Math.round((2 + this.p.flam * 2.2) * this.fs / 1000), k, acc, lvl: 1 });   // flam: a softer first, then the hit
    }
    if (fl) for (const q of this.pend) if (q.at === late) q.lvl = 0.55;
  }
  process(L, R, n) {
    const fs = this.fs, P = this.p, dt = 1 / fs;
    L.fill(0); if (R !== L) R.fill(0);
    const sy = this.sync;
    if (sy && P.sync === 'din') {
      if (!sy.run) { if (this.run) this.stop(); }
      else {
        const want = sy.beats * (P.spb || 4), len = this.patterns[this.pat].len || 16;
        if (!this.run) { this.run = true; const k = Math.floor(want); this.step = (k - 1 + len * 64) % len; this.ph = want - k; this.abs = k - 1; }
        else if (Math.abs(want - ((this.abs ?? want) + this.ph)) > 0.5) { const k = Math.floor(want); this.step = (k - 1 + len * 64) % len; this.ph = want - k; this.abs = k - 1; }
        P.tempo = sy.bpm;
      }
    }
    const inc = P.tempo / 60 * (P.spb || 4) / fs, lv = (k) => P[k].level * P.master * 0.5;
    let pk = this.peak * 0.97 ** (n / 128);
    for (let i = 0; i < n; i++) {
      if (this.run) { this.ph += inc; if (this.ph >= 1) { this.ph -= 1; this.advance(); this.abs = (this.abs ?? -1) + 1; } }
      if (this.pend.length) { for (const q of this.pend) if (q.at-- <= 0) { this.trig(q.k, q.acc, q.lvl); q.done = true; } this.pend = this.pend.filter((q) => !q.done); }
      let l = 0, r = 0; const add = (k, y) => { const pn = this.pan[k]; l += y * (1 - pn); r += y * (1 + pn); };
      // metal for the hats and the ride (six squares, higher than the 808's)
      let metal = 0; const mph = this.mph, MF = [263, 400, 421, 474, 587, 845];
      for (let j = 0; j < 6; j++) { mph[j] = (mph[j] + MF[j] * dt) % 1; metal += mph[j] < 0.5 ? 1 : -1; } metal /= 6;
      // BD: swept sine, a click (attack) and a little noise at the start
      let v = this.v.BD; if (v.on) { const B = P.BD, f0 = 50, sweep = 1.5 + B.tune * 4, D = 0.12 + B.decay * 0.9, f = f0 * (1 + sweep * Math.exp(-v.t / 0.018)); v.ph += f * dt;
        let y = Math.sin(T9_TAU * v.ph); y = Math.tanh(y * 1.6) * Math.exp(-v.t / (D * 0.33)); y += this.f.bd.run(v.t < 0.002 ? this.noise() + 1 : 0) * B.attack * 0.6;
        add('BD', y * lv('BD') * 1.7 * v.acc); v.t += dt; if (v.t > D * 3) v.on = false; }
      // SD: two tuned oscillators (180 / 330 Hz x tune), noise low-passed by TONE, SNAPPY level
      v = this.v.SD; if (v.on) { const S = P.SD, t = v.t, k = 0.85 + S.tune * 0.4; let y = (Math.sin(T9_TAU * 190 * k * t) + 0.7 * Math.sin(T9_TAU * 340 * k * t)) * Math.exp(-t / 0.05) * 0.55;
        this.f.sdN.set(2500 + S.tone * 7000, 0.6); const nz = this.f.sdN.run(this.noise()); y += (this.f.sdN.lp * 0.6 + nz) * Math.exp(-t / (0.06 + S.snappy * 0.12)) * S.snappy * 0.9;
        add('SD', y * lv('SD') * v.acc); v.t += dt; if (t > 0.5) v.on = false; }
      for (const [k, base] of [['LT', 95], ['MT', 135], ['HT', 190]]) {
        v = this.v[k]; if (!v.on) continue; const T = P[k], f0 = base * (0.8 + T.tune * 0.4), D = 0.12 + T.decay * 0.5;
        v.ph += f0 * (1 + 0.6 * Math.exp(-v.t / 0.02)) * dt; const y = Math.sin(T9_TAU * v.ph) * Math.exp(-v.t / (D * 0.4)) + this.noise() * 0.05 * Math.exp(-v.t / 0.015);
        add(k, y * lv(k) * v.acc); v.t += dt; if (v.t > D * 3) v.on = false;
      }
      v = this.v.RS; if (v.on) { const t = v.t, y = this.f.rs.run((Math.sin(T9_TAU * 500 * t) + Math.sin(T9_TAU * 1750 * t) + this.noise() * 0.5) * Math.exp(-t / 0.005)) * 2; add('RS', y * lv('RS') * v.acc); v.t += dt; if (t > 0.1) v.on = false; }
      v = this.v.CP; if (v.on) { const t = v.t, nz = this.noise(), b = this.f.cp.run(nz), burst = t < 0.034 ? Math.exp(-((t % 0.0085) / 0.0022)) : 0, tail = this.f.cpT.run(nz) * Math.exp(-(t - 0.034) / 0.13) * (t >= 0.034 ? 1 : 0); add('CP', (b * burst * 1.3 + tail * 1.2) * lv('CP') * v.acc); v.t += dt; if (t > 0.8) v.on = false; }
      // hats: metal + noise, high-passed, 6-bit; CH decay / OH decay; CH chokes OH
      const oh = this.v.OH, ch = this.v.CH;
      if (oh.on || ch.on) { this.f.hhB.run(metal * 0.7 + this.noise() * 0.3); this.f.hhH.run(this.f.hhB.bp); const h = q6(this.f.hhH.hp * 1.5) / 1.5;
        if (oh.on) { const D = oh.choke ? 0.008 : 0.08 + P.OH.decay * 0.7; oh.g *= Math.exp(-dt / (D * 0.5)); add('OH', h * oh.g * lv('OH') * 2.1 * oh.acc); oh.t += dt; if (oh.g < 1e-4) oh.on = false; }
        if (ch.on) { const D = 0.02 + P.CH.decay * 0.08; ch.g *= Math.exp(-dt / (D * 0.5)); add('CH', h * ch.g * lv('CH') * 2.1 * ch.acc); ch.t += dt; if (ch.g < 1e-4) ch.on = false; } }
      // crash: noise + metal, long, TUNE sets the brightness (the original's sample rate), 6-bit
      v = this.v.CR; if (v.on) { const t = v.t; this.f.cr.set(3500 + P.CR.tune * 6000, 0.7); this.f.cr.run(this.noise() * 0.7 + metal * 0.5); const y = q6(this.f.cr.hp * 1.2) / 1.2 * Math.exp(-t / 0.55); add('CR', y * lv('CR') * 1.6 * v.acc); v.t += dt; if (t > 3) v.on = false; }
      // ride: the bell of the metal through a resonant band, plus a wash, 6-bit
      v = this.v.RD; if (v.on) { const t = v.t; this.f.rdB.set(3000 + P.RD.tune * 3000, 2.5); const b = this.f.rdB.run(metal); this.f.rdH.run(metal * 0.5 + this.noise() * 0.25); const y = q6((b * 1.2 * Math.exp(-t / 0.25) + this.f.rdH.hp * Math.exp(-t / 0.9)) * 0.9) / 0.9; add('RD', y * lv('RD') * 1.4 * v.acc); v.t += dt; if (t > 3) v.on = false; }
      l = Math.tanh(l); r = Math.tanh(r); L[i] = l; if (R !== L) R[i] = r;
      const a = Math.max(Math.abs(l), Math.abs(r)); if (a > pk) pk = a;
    }
    this.peak = pk;
  }
  meters() { return { run: this.run, step: this.step, pat: this.pat, next: this.next, meas: this.meas, tempo: this.p.tempo, peakDb: 20 * Math.log10(this.peak + 1e-9), hits: TR9_INST.filter((k) => this.v[k].on && this.v[k].t < 0.05) }; }
}
