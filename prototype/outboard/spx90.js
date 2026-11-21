// Yahaha SPX90II-style multi-effect: mono in, stereo out, one algorithm at a time (see references/spx90ii).
// Algorithm families and their parameters (seconds / ms / Hz / ratios as noted); the presets set these.
//   reverb   rt (s), hf (0.1..1: high-frequency decay ratio), pre (ms), er (ms of the early pattern), dens (0..1),
//            gate: 'none' | 'gate' | 'reverse' with gateMs   (hall / room / vocal / plate / gate reverb / reverse gate)
//   early    pattern 0..3, size (0.1..20), live (0..1), pre (ms)                (early reflections)
//   delay    dl, dr (ms), fb (0..0.99), hd (0.1..1: high damp in the loop)       (delay L,R)
//   echo     dl, dr (ms), fbl, fbr, cross (0..1)                                 (stereo echo)
//   mod      kind 'flange' | 'chorus' | 'symph' | 'vibrato', f (Hz), depth (0..1), dly (ms), fb (-0.95..0.95)
//   phase    f (Hz), depth, offset (0..1)                                        (stereo phasing)
//   trem     f (Hz), depth, shape 'sine' | 'tri' | 'sq', pan (bool: auto-pan)    (tremolo, pan)
//   gate     thr (dB), rel (ms), hold (ms)                                       (ADR noise gate)
//   comp     thr (dB), ratio, att (ms), rel (ms)                                 (compressor)
//   pitch    l, r (semitones), fine (cents), dly (ms), fb                        (pitch change)
//   freeze   mode 'rec' | 'play', len (ms), loop (bool)                          (freeze)
//   eq       lo / mid / hi: { f, g (dB), q }                                    (parametric EQ)
//   dist     drive (dB), tone (Hz)                                               (distortion)
// Common: mix (effect balance 0..1), out (output level, linear).
import { IM90Channel } from './im90.js';

const TAU = 2 * Math.PI;
class Line { constructor(n) { this.b = new Float32Array(n); this.w = 0; this.n = n; }
  push(v) { this.b[this.w] = v; this.w = (this.w + 1) % this.n; }
  at(d) { let p = this.w - 1 - d; while (p < 0) p += this.n; const i = Math.floor(p), f = p - i; return this.b[i % this.n] * (1 - f) + this.b[(i + 1) % this.n] * f; } }
class Biquad {   // RBJ cookbook
  constructor() { this.b0 = 1; this.b1 = this.b2 = this.a1 = this.a2 = 0; this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  set(type, fs, f, g = 0, q = 0.707) {
    const A = 10 ** (g / 40), w = TAU * Math.min(f, fs * 0.45) / fs, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A; }
    else if (type === 'low') { const sq = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) - (A - 1) * c + sq); b1 = 2 * A * ((A - 1) - (A + 1) * c); b2 = A * ((A + 1) - (A - 1) * c - sq); a0 = (A + 1) + (A - 1) * c + sq; a1 = -2 * ((A - 1) + (A + 1) * c); a2 = (A + 1) + (A - 1) * c - sq; }
    else if (type === 'high') { const sq = 2 * Math.sqrt(A) * al; b0 = A * ((A + 1) + (A - 1) * c + sq); b1 = -2 * A * ((A - 1) + (A + 1) * c); b2 = A * ((A + 1) + (A - 1) * c - sq); a0 = (A + 1) - (A - 1) * c + sq; a1 = 2 * ((A - 1) - (A + 1) * c); a2 = (A + 1) - (A - 1) * c - sq; }
    else { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }   // lowpass
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0; return this;
  }
  run(x) { const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
}
// early-reflection patterns: [ms, gain, side (-1 left .. 1 right)] at size 1
const ER = [
  [[7, 0.8, -1], [11, 0.7, 1], [17, 0.6, -0.5], [23, 0.55, 0.6], [31, 0.45, -1], [37, 0.42, 1], [43, 0.35, -0.3], [53, 0.3, 0.4], [61, 0.25, -0.8], [71, 0.2, 0.9]],   // hall
  [[3, 0.9, 1], [5, 0.8, -1], [8, 0.7, 0.4], [11, 0.6, -0.6], [14, 0.5, 1], [18, 0.45, -1], [23, 0.35, 0.2], [27, 0.3, -0.2]],                                       // room
  [[1, 0.6, -1], [3, 0.6, 1], [6, 0.5, -1], [9, 0.5, 1], [13, 0.4, -1], [17, 0.4, 1], [22, 0.3, -1], [28, 0.3, 1], [35, 0.25, -1], [43, 0.2, 1]],                       // random / plate-like
  [[9, 1, -0.2], [19, 0.9, 0.2], [29, 0.8, -0.4], [39, 0.7, 0.4], [49, 0.6, -0.6], [59, 0.5, 0.6], [69, 0.4, -0.8], [79, 0.3, 0.8]],                                   // regular (slap)
];

export class SPX90 {
  constructor(fs) {
    this.fs = fs; this.p = { algo: 'reverb', mix: 0.5, out: 1 };
    const ms = (x) => Math.round(x * fs / 1000);
    this.pre = new Line(ms(600)); this.dl = new Line(ms(2100)); this.dr = new Line(ms(2100));
    // reverb: 8-line feedback delay network (Householder), damped per line
    this.fdnLen = [1031, 1327, 1523, 1801, 2063, 2341, 2593, 2917].map((n) => Math.round(n * fs / 44100));
    this.fdn = this.fdnLen.map((n) => new Line(n + 2)); this.damp = new Float32Array(8);
    this.ap = [new Line(ms(5)), new Line(ms(8)), new Line(ms(12)), new Line(ms(17))];   // input diffusers
    this.mod = [new Line(ms(60)), new Line(ms(60))]; this.ph = 0; this.ph2 = 0;
    this.aps = Array.from({ length: 2 }, () => Array.from({ length: 6 }, () => ({ x: 0, y: 0 })));
    this.env = 0; this.gainS = 1; this.hold = 0; this.gateT = 0;
    this.pitchL = new IM90Channel(fs).set({ mode: 'pitch' }); this.pitchR = new IM90Channel(fs).set({ mode: 'pitch' });
    this.frz = new IM90Channel(fs).set({ mode: 'sample' });
    this.eq = [new Biquad(), new Biquad(), new Biquad()]; this.tone = new Biquad(); this.hdl = 0; this.hdr = 0;
    this.tmpL = new Float32Array(128); this.tmpR = new Float32Array(128); this.one = new Float32Array(128);
    this.pin = 0; this.pout = 0; this.am = 1 - Math.exp(-1 / (0.05 * fs));
    this.set({});
  }
  set(o) {
    Object.assign(this.p, o); const p = this.p, fs = this.fs;
    if (p.algo === 'reverb') { const g = (n) => 10 ** (-3 * n / fs / Math.max(0.1, p.rt || 2)); this.fb = this.fdnLen.map(g); this.dampK = 1 - Math.max(0.1, Math.min(1, p.hf ?? 0.5)) * 0.85; }
    if (p.algo === 'eq') ['lo', 'mid', 'hi'].forEach((b, i) => { const q = p[b] || { f: [100, 1000, 8000][i], g: 0, q: 1 }; this.eq[i].set(i === 0 ? 'low' : i === 2 ? 'high' : 'peak', fs, q.f, q.g, q.q || 0.9); });
    if (p.algo === 'dist') this.tone.set('lp', fs, p.tone || 4000);
    if (p.algo === 'pitch') { const st = (s, c) => 2 ** ((s + (c || 0) / 100) / 12); this.pitchL.set({ ratio: st(p.l || 0, p.fine), pdel: (p.dly || 1) / 1000, arp: p.fb || 0 }); this.pitchR.set({ ratio: st(p.r || 0, -(p.fine || 0)), pdel: (p.dly || 1) / 1000, arp: p.fb || 0 }); }
    if (p.algo === 'freeze') { if (o.mode === 'rec') this.frz.arm('A'); if (o.mode === 'play') { this.frz.stop(); this.frz.setSample({ mode: p.loop ? 'loop' : 'aux' }); this.frz.play(); } }
    return this;
  }
  trigger() { if (this.p.algo === 'freeze') { this.frz.play(); } this.gateT = 0; }   // the trigger / foot switch
  // x: mono input; L, R: stereo output (n samples)
  process(x, L, R, n) {
    const p = this.p, fs = this.fs, mix = p.mix ?? 0.5, out = p.out ?? 1, ms = fs / 1000;
    if (this.tmpL.length < n) { this.tmpL = new Float32Array(n); this.tmpR = new Float32Array(n); this.one = new Float32Array(n); }
    if (p.algo === 'pitch') { this.pitchL.process(x, this.tmpL, n); this.pitchR.process(x, this.tmpR, n); }
    if (p.algo === 'freeze') { this.frz.process(x, this.tmpL, n); }
    for (let k = 0; k < n; k++) {
      const v = x[k]; let l = 0, r = 0;
      this.pin += this.am * (v * v - this.pin);
      switch (p.algo) {
        case 'reverb': {
          this.pre.push(v); const pv = this.pre.at(Math.max(1, (p.pre || 20) * ms));
          let d = pv; for (let i = 0; i < 4; i++) { const ln = this.ap[i], y = ln.at(ln.n - 2) , g = 0.6 * (p.dens ?? 0.7); const w = d + g * y; ln.push(w); d = y - g * w; }
          const o = this.fdn.map((ln, i) => ln.at(this.fdnLen[i]));
          let sum = 0; for (let i = 0; i < 8; i++) { this.damp[i] += (o[i] - this.damp[i]) * (1 - this.dampK); sum += this.damp[i]; }
          const h = sum * 2 / 8;
          for (let i = 0; i < 8; i++) this.fdn[i].push((this.damp[i] - h) * this.fb[i] + d * 0.35);
          // early reflections from the pre-delayed signal
          const pat = ER[p.erPat ?? 0], sz = (p.er || 30) / 40; let el = 0, er = 0;
          for (const [t, g, sd] of pat) { const tv = this.pre.at(Math.max(1, (p.pre || 20) * ms + t * sz * ms)) * g; el += tv * (1 - sd) / 2; er += tv * (1 + sd) / 2; }
          let wl = (o[0] + o[2] + o[4] + o[6]) * 0.3 + el * 0.4, wr = (o[1] + o[3] + o[5] + o[7]) * 0.3 + er * 0.4;
          if (p.gate === 'gate' || p.gate === 'reverse') {
            const a = Math.abs(v); this.env = Math.max(a, this.env * 0.9995);
            if (a > 10 ** ((p.thr ?? -30) / 20) && this.gateT > (p.gateMs || 200) * ms * 1.2) this.gateT = 0;
            this.gateT++; const t = this.gateT / ((p.gateMs || 200) * ms);
            const g = p.gate === 'gate' ? (t < 1 ? 1 : Math.max(0, 1 - (t - 1) * 20)) : (t < 1 ? t * t : Math.max(0, 1 - (t - 1) * 20));
            wl *= g * 1.6; wr *= g * 1.6;
          }
          l = wl; r = wr; break;
        }
        case 'early': {
          this.pre.push(v); const pat = ER[p.pattern || 0], sz = p.size || 1, live = p.live ?? 0.5;
          for (const [t, g, sd] of pat) { const tv = this.pre.at(Math.max(1, ((p.pre || 0) + t * sz) * ms)) * g * (0.5 + live * 0.5); l += tv * (1 - sd) / 2; r += tv * (1 + sd) / 2; }
          break;
        }
        case 'delay': {
          const yl = this.dl.at((p.dl || 250) * ms), yr = this.dr.at((p.dr || 375) * ms), hd = 1 - (p.hd ?? 1) * 0.9 + 0.1;
          this.hdl += (yl - this.hdl) * (1 - (1 - hd)); this.hdr += (yr - this.hdr) * (1 - (1 - hd));
          this.dl.push(v + this.hdl * (p.fb || 0)); this.dr.push(v + this.hdr * (p.fb || 0)); l = yl; r = yr; break;
        }
        case 'echo': {
          const yl = this.dl.at((p.dl || 250) * ms), yr = this.dr.at((p.dr || 375) * ms), c = p.cross || 0;
          this.dl.push(v + yl * (p.fbl || 0) * (1 - c) + yr * (p.fbr || 0) * c); this.dr.push(v + yr * (p.fbr || 0) * (1 - c) + yl * (p.fbl || 0) * c); l = yl; r = yr; break;
        }
        case 'mod': {
          this.ph = (this.ph + (p.f || 0.5) / fs) % 1;
          const kind = p.kind || 'chorus', dep = p.depth ?? 0.5, base = (p.dly || (kind === 'flange' ? 2 : 8)) * ms;
          const sw = (ph) => Math.sin(TAU * ph), span = (kind === 'flange' ? 2 : kind === 'vibrato' ? 3 : 6) * ms * dep;
          const d1 = base + span * (0.5 + 0.5 * sw(this.ph)), d2 = base + span * (0.5 + 0.5 * sw(this.ph + (kind === 'symph' ? 0.33 : 0.25)));
          const y1 = this.mod[0].at(d1), y2 = this.mod[1].at(d2), fb = p.fb || 0;
          this.mod[0].push(v + y1 * fb); this.mod[1].push(v + y2 * fb);
          if (kind === 'vibrato') { l = r = y1; } else if (kind === 'symph') { const y3 = this.mod[0].at(base + span * (0.5 + 0.5 * sw(this.ph + 0.66))); l = (y1 + y3) * 0.6; r = (y2 + y3) * 0.6; } else { l = y1; r = y2; }
          break;
        }
        case 'phase': {
          this.ph = (this.ph + (p.f || 0.5) / fs) % 1;
          for (let c = 0; c < 2; c++) {
            const m = 0.5 + 0.5 * Math.sin(TAU * (this.ph + c * 0.25)), fc = 200 * 2 ** ((p.offset ?? 0.3) * 4 + m * (p.depth ?? 0.7) * 4), t = Math.tan(Math.PI * fc / fs), a = (t - 1) / (t + 1);
            let y = v; for (const st of this.aps[c]) { const o2 = a * y + st.x - a * st.y; st.x = y; st.y = o2; y = o2; }
            if (c === 0) l = (v + y) * 0.5; else r = (v + y) * 0.5;
          }
          break;
        }
        case 'trem': {
          this.ph = (this.ph + (p.f || 4) / fs) % 1;
          const sh = p.shape === 'tri' ? 1 - 4 * Math.abs(this.ph - 0.5) : p.shape === 'sq' ? (this.ph < 0.5 ? 1 : -1) : Math.sin(TAU * this.ph), dep = p.depth ?? 0.6;
          if (p.pan) { const pan = 0.5 + 0.5 * sh * dep; l = v * Math.cos(pan * Math.PI / 2) * 1.41; r = v * Math.sin(pan * Math.PI / 2) * 1.41; }
          else { l = r = v * (1 - dep * (0.5 - 0.5 * sh)); }
          break;
        }
        case 'gate': {
          const a = Math.abs(v), thr = 10 ** ((p.thr ?? -40) / 20); this.env = Math.max(a, this.env * Math.exp(-1 / (0.01 * fs)));
          if (this.env > thr) { this.hold = (p.hold || 20) * ms; this.gainS += (1 - this.gainS) * 0.05; }
          else if (this.hold > 0) this.hold--; else this.gainS *= Math.exp(-1 / ((p.rel || 200) * ms / 5));
          l = r = v * this.gainS; break;
        }
        case 'comp': {
          const a = v * v; const at = a > this.env ? 1 - Math.exp(-1 / ((p.att || 5) * ms)) : 1 - Math.exp(-1 / ((p.rel || 200) * ms)); this.env += (a - this.env) * at;
          const lv = 10 * Math.log10(this.env + 1e-12), over = lv - (p.thr ?? -20), g = over > 0 ? -over * (1 - 1 / (p.ratio || 4)) : 0;
          l = r = v * 10 ** (g / 20); this.gr = -g; break;
        }
        case 'pitch': l = this.tmpL[k]; r = this.tmpR[k]; break;
        case 'freeze': l = r = this.tmpL[k]; break;
        case 'eq': { let y = v; for (const b of this.eq) y = b.run(y); l = r = y; break; }
        case 'dist': { const g = 10 ** ((p.drive || 20) / 20); const y = this.tone.run(Math.tanh(v * g) / Math.tanh(g) * 0.6); l = r = y; break; }
      }
      const dry = (p.algo === 'comp' || p.algo === 'gate' || p.algo === 'eq' || p.algo === 'dist' || p.algo === 'trem') ? 0 : 1;   // in-line effects replace the signal
      const m = dry ? mix : 1;
      L[k] = out * (v * (1 - m) * dry + l * m); R[k] = out * (v * (1 - m) * dry + r * m);
      const o = (L[k] + R[k]) * 0.5; this.pout += this.am * (o * o - this.pout);
    }
  }
  meters() { const db = (q) => 10 * Math.log10(q + 1e-12); return { inDb: db(this.pin), outDb: db(this.pout) }; }
}
