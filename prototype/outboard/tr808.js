// Rowan TR-8080 (after the Roland TR-808 Rhythm Composer, 1980): the voices and the sequencer, sample by sample.
// Voices are synthesised the way the circuits work, simplified: the bass drum and toms are ringing resonators (a decaying
// sine whose pitch settles), the snare two resonators plus "snappy" noise, the hand clap a burst of noise bands with a
// tail, the cymbal and hi-hats six square-wave oscillators at odd ratios through band-pass and high-pass filters, the
// cowbell two of those squares. ACCENT adds level on accented steps. The sequencer holds 16 patterns, each with an A and
// a B part of up to 16 steps; it runs on its own tempo or follows a song position (DIN sync from the SBX-80).
export const TR_INST = ['BD', 'SD', 'LT', 'MT', 'HT', 'RS', 'CP', 'CB', 'CY', 'OH', 'CH'];
const TR_TAU = 2 * Math.PI;
const TR_METAL = [205.3, 304.4, 369.6, 522.7, 540, 800];   // the six square-wave oscillators (Hz)
export class TrBp {   // 2-pole band-pass / high-pass / low-pass (state-variable, stable form)
  constructor(fs, f, q) { this.fs = fs; this.s1 = 0; this.s2 = 0; this.set(f, q); }
  set(f, q) { const g = Math.tan(Math.PI * Math.min(f, this.fs * 0.45) / this.fs), k = 1 / q; this.a1 = 1 / (1 + g * (g + k)); this.a2 = g * this.a1; this.a3 = g * this.a2; this.k = k; }
  run(x) { const v3 = x - this.s2, v1 = this.a1 * this.s1 + this.a2 * v3, v2 = this.s2 + this.a2 * this.s1 + this.a3 * v3; this.s1 = 2 * v1 - this.s1; this.s2 = 2 * v2 - this.s2; this.lp = v2; this.bp = v1; this.hp = x - this.k * v1 - v2; return v1; }
}
export function trDefaults() {
  return { master: 0.8, accent: 0.6, tempo: 120, var: 'A', sync: 'int',
    BD: { level: 0.8, tone: 0.4, decay: 0.55 }, SD: { level: 0.7, tone: 0.5, snappy: 0.6 }, LT: { level: 0.6, tune: 0.5, conga: false }, MT: { level: 0.6, tune: 0.5, conga: false }, HT: { level: 0.6, tune: 0.5, conga: false },
    RS: { level: 0.6, claves: false }, CP: { level: 0.7, maracas: false }, CB: { level: 0.5 }, CY: { level: 0.5, tone: 0.5, decay: 0.6 }, OH: { level: 0.55, decay: 0.4 }, CH: { level: 0.6 } };
}
export function trEmptyPattern() { const part = () => ({ len: 16, steps: Object.fromEntries(['AC', ...TR_INST].map((k) => [k, Array(16).fill(0)])) }); return { A: part(), B: part() }; }

export class TR808 {
  constructor(fs) {
    this.fs = fs; this.p = trDefaults(); this.patterns = Array.from({ length: 16 }, trEmptyPattern); this.pat = 0; this.next = null;
    this.run = false; this.ph = 0; this.step = -1; this.part = 'A'; this.sync = null;
    this.v = {}; for (const k of TR_INST) this.v[k] = { on: false, t: 0, acc: 1 };
    this.metalPh = new Float64Array(6); this.seed = 22222; this.peak = 0;
    this.f = { sdN: new TrBp(fs, 6000, 0.5), cp: new TrBp(fs, 1100, 2.2), cpT: new TrBp(fs, 1100, 2), ma: new TrBp(fs, 7000, 0.7), cyB: new TrBp(fs, 3440, 1.2), cyH: new TrBp(fs, 7100, 0.8), hhB: new TrBp(fs, 3440, 1.2), hhH: new TrBp(fs, 7500, 0.8), cb: new TrBp(fs, 2640, 3.5), bd: new TrBp(fs, 2500, 0.7), rs: new TrBp(fs, 1200, 0.8) };
    this.pan = { BD: 0, SD: 0.05, LT: -0.35, MT: -0.1, HT: 0.2, RS: -0.25, CP: 0.1, CB: 0.3, CY: 0.35, OH: -0.3, CH: -0.25 };
  }
  noise() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 2147483648 - 1; }
  set(o) { for (const k in o) { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) && this.p[k]) Object.assign(this.p[k], o[k]); else this.p[k] = o[k]; } return this; }
  trig(k, acc = false) {
    const v = this.v[k]; if (!v) return;
    v.on = true; v.t = 0; v.ph = 0; v.acc = acc ? 1 + this.p.accent * 0.9 : 1;
    if (k === 'CH' && this.v.OH.on) this.v.OH.choke = true;   // the closed hat cuts the open one
    if (k === 'OH') this.v.OH.choke = false;
  }
  start() { this.run = true; this.step = -1; this.ph = 0.999999; this.part = this.p.var === 'B' ? 'B' : 'A'; }
  stop() { this.run = false; this.step = -1; }
  partLen() { return this.patterns[this.pat][this.part].len || 16; }
  advance() {   // the next 16th: fire its instruments
    this.step++;
    if (this.step >= this.partLen()) {
      this.step = 0;
      if (this.p.var === 'AB') this.part = this.part === 'A' ? 'B' : 'A'; else this.part = this.p.var === 'B' ? 'B' : 'A';
      if (this.next != null && this.part === (this.p.var === 'B' ? 'B' : 'A')) { this.pat = this.next; this.next = null; }
    }
    const S = this.patterns[this.pat][this.part].steps, acc = !!S.AC[this.step];
    for (const k of TR_INST) if (S[k][this.step]) this.trig(k, acc);
  }
  process(L, R, n) {
    const fs = this.fs, P = this.p, dt = 1 / fs;
    L.fill(0); if (R !== L) R.fill(0);
    // the clock: 4 steps a beat. DIN sync: follow the song position (snap if it is more than a little off)
    const sy = this.sync;
    if (sy && P.sync === 'din') {
      if (!sy.run) { if (this.run) this.stop(); }
      else {
        const want = sy.beats * 4;   // steps since bar 1
        if (!this.run) { this.run = true; this.part = P.var === 'B' ? 'B' : 'A'; const k = Math.floor(want); this.step = (k - 1 + 16 * 64) % this.partLen(); this.ph = want - k; }
        else { const have = this.absStep != null ? this.absStep + this.ph : want, err = want - have; if (Math.abs(err) > 0.5) { const k = Math.floor(want); this.step = (k - 1 + 16 * 64) % this.partLen(); this.ph = want - k; this.absStep = k - 1; } }
        P.tempo = sy.bpm;
      }
    }
    const inc = P.tempo / 60 * 4 / fs;
    const lv = (k) => P[k].level * P.master * 0.5;
    let pk = this.peak * 0.97 ** (n / 128);
    for (let i = 0; i < n; i++) {
      if (this.run) { this.ph += inc; if (this.ph >= 1) { this.ph -= 1; this.advance(); this.absStep = (this.absStep ?? -1) + 1; } }
      let l = 0, r = 0;
      const add = (k, y) => { const pan = this.pan[k]; l += y * (1 - pan); r += y * (1 + pan); };
      // metal: six squares, shared by the cymbal, hats and (two of them) the cowbell
      let metal = 0; const mph = this.metalPh;
      for (let j = 0; j < 6; j++) { mph[j] = (mph[j] + TR_METAL[j] * dt) % 1; metal += mph[j] < 0.5 ? 1 : -1; }
      metal /= 6;
      // BD: bridged-T: a sine settling from ~2.2x to its pitch, decay knob; tone = the click
      let v = this.v.BD; if (v.on) { const D = 0.08 + P.BD.decay * 0.9, f0 = 49 + P.BD.tone * 8, f = f0 * (1 + 1.2 * Math.exp(-v.t / 0.006)); v.ph += f * dt; let y = Math.sin(TR_TAU * v.ph) * Math.exp(-v.t / (D * 0.35)); y += this.f.bd.run(v.t < 0.0015 ? 1 : 0) * (0.2 + P.BD.tone * 1.4) * 0.5; add('BD', y * lv('BD') * 1.6 * v.acc); v.t += dt; if (v.t > D * 3) v.on = false; }
      // SD: resonators at ~180 / 330 Hz (tone balances them) and high-passed noise (snappy)
      v = this.v.SD; if (v.on) { v.ph += dt; const t = v.t, y = (Math.sin(TR_TAU * 180 * t) * (1 - P.SD.tone * 0.6) + Math.sin(TR_TAU * 330 * t) * (0.4 + P.SD.tone * 0.6)) * Math.exp(-t / 0.045) * 0.6; this.f.sdN.run(this.noise()); const nz = this.f.sdN.hp * Math.exp(-t / (0.05 + P.SD.snappy * 0.12)) * P.SD.snappy; add('SD', (y + nz * 0.9) * lv('SD') * v.acc); v.t += dt; if (t > 0.5) v.on = false; }
      // toms / congas: a sine with a little pitch drop; congas higher, shorter, no noise
      for (const [k, base, cbase] of [['LT', 87, 165], ['MT', 130, 250], ['HT', 175, 370]]) {
        v = this.v[k]; if (!v.on) continue; const c = P[k].conga, f0 = (c ? cbase : base) * (0.85 + P[k].tune * 0.3), D = c ? 0.12 : 0.25 + (k === 'LT' ? 0.12 : 0);
        v.ph += f0 * (1 + 0.15 * Math.exp(-v.t / 0.01)) * dt; let y = Math.sin(TR_TAU * v.ph) * Math.exp(-v.t / (D * 0.5)); if (!c) y += this.noise() * 0.04 * Math.exp(-v.t / 0.02);
        add(k, y * lv(k) * v.acc); v.t += dt; if (v.t > D * 3) v.on = false;
      }
      // RS / claves
      v = this.v.RS; if (v.on) { const t = v.t, y = P.RS.claves ? Math.sin(TR_TAU * 2500 * t) * Math.exp(-t / 0.012) : this.f.rs.run((Math.sin(TR_TAU * 455 * t) + Math.sin(TR_TAU * 1667 * t)) * Math.exp(-t / 0.006)) * 1.8; add('RS', y * lv('RS') * v.acc); v.t += dt; if (t > 0.12) v.on = false; }
      // CP: four quick noise bursts, then a reverb-like tail; maracas: short high noise
      v = this.v.CP; if (v.on) { const t = v.t, nz = this.noise(); let y;
        if (P.CP.maracas) { this.f.ma.run(nz); y = this.f.ma.hp * Math.exp(-t / 0.018); }
        else { const b = this.f.cp.run(nz), burst = t < 0.03 ? Math.exp(-((t % 0.0095) / 0.0025)) : 0, tail = this.f.cpT.run(nz) * Math.exp(-(t - 0.03) / 0.09) * (t >= 0.03 ? 1 : 0); y = b * burst * 1.4 + tail * 1.1; }
        add('CP', y * lv('CP') * v.acc); v.t += dt; if (t > 0.6) v.on = false; }
      // CB: two of the squares (540, 800) through a band-pass, a quick then slower decay
      v = this.v.CB; if (v.on) { const t = v.t, sq = ((mph[4] < 0.5 ? 1 : -1) + (mph[5] < 0.5 ? 1 : -1)) * 0.5, y = this.f.cb.run(sq) * (0.6 * Math.exp(-t / 0.012) + 0.4 * Math.exp(-t / 0.11)); add('CB', y * lv('CB') * 2 * v.acc); v.t += dt; if (t > 0.7) v.on = false; }
      // CY: the six squares, band-passed and high-passed, long decay; tone tilts to the high band
      v = this.v.CY; if (v.on) { const t = v.t, b = this.f.cyB.run(metal); this.f.cyH.run(metal); const y = (b * (1 - P.CY.tone) * 0.7 + this.f.cyH.hp * (0.4 + P.CY.tone)) * Math.exp(-t / (0.18 + P.CY.decay * 0.6)); add('CY', y * lv('CY') * 1.4 * v.acc); v.t += dt; if (t > 3) v.on = false; }
      // hats: the six squares band-passed then high-passed; OH decay knob; CH short; CH chokes OH
      const oh = this.v.OH, ch = this.v.CH;
      if (oh.on || ch.on) { this.f.hhB.run(metal); this.f.hhH.run(this.f.hhB.bp); const h = this.f.hhH.hp;
        if (oh.on) { const D = oh.choke ? 0.01 : 0.06 + P.OH.decay * 0.5; oh.g = (oh.t === 0 ? 1 : oh.g) * Math.exp(-dt / (D * 0.6)); add('OH', h * oh.g * lv('OH') * 2.2 * oh.acc); oh.t += dt; if (oh.g < 1e-4) oh.on = false; }
        if (ch.on) { add('CH', h * Math.exp(-ch.t / 0.018) * lv('CH') * 2.2 * ch.acc); ch.t += dt; if (ch.t > 0.15) ch.on = false; } }
      l = Math.tanh(l); r = Math.tanh(r);   // the mix amp: gentle
      L[i] = l; if (R !== L) R[i] = r;
      const a = Math.abs(l) > Math.abs(r) ? Math.abs(l) : Math.abs(r); if (a > pk) pk = a;
    }
    this.peak = pk;
  }
  meters() { return { run: this.run, step: this.step, part: this.part, pat: this.pat, next: this.next, tempo: this.p.tempo, peakDb: 20 * Math.log10(this.peak + 1e-9), hits: TR_INST.filter((k) => this.v[k].on && this.v[k].t < 0.05) }; }
}
