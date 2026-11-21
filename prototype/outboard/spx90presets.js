// The SPX90II's 30 factory programs (references/spx90ii, from the operating manual): each parameter as the LCD shows
// it, with its factory value and range, and how a program's values map onto the engine (spx90.js).
// Values the OCR left uncertain are marked (?) in the reference; the most likely reading is used here.

const HPF = ['THRU', 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000];
const LPF = [1.0, 1.25, 1.6, 2.0, 2.5, 3.2, 4.0, 5.0, 6.3, 8.0, 10, 11, 'THRU'];
const MIDF = [315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1100, 1250, 1400, 1600, 1800, 2000, 2200, 2500, 2800, 3200, 3600, 4000];
const HIF = [800, 900, 1000, 1100, 1250, 1400, 1600, 1800, 2000, 2200, 2500, 2800, 3200, 3600, 4000, 4500, 5000, 5600, 6300, 7100, 8000];
const KEYS = ['OFF', ...[1, 2, 3, 4, 5, 6].flatMap((o) => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((n) => n + o)).filter((k, i) => i <= 60)];
// parameter makers: number (with display decimals and unit) or list
const N = (id, label, min, max, step, def, unit = '', dec = 1) => ({ id, label, min, max, step, def, unit, dec });
const L = (id, label, list, def) => ({ id, label, list, def: list.indexOf(def) });
const A = (id, label) => ({ id, label, action: true });   // FREEZE's RECORD / OVER DUB / PLAY pages: DATA ▲ does it
const ms = (id, label, def, max = 1000, min = 0.1) => N(id, label, min, max, 0.1, def, 'ms', 1);
const trgP = (lvl, dly, msk) => [N('trg', 'TRG. LEVEL', 1, 100, 1, lvl, '', 0), N('tdly', 'TRG. DLY', -100, 100, 1, dly, 'ms', 0), N('msk', 'TRG. MSK', 5, 32000, 5, msk, 'ms', 0)];
const midiTrg = L('midi', 'MIDI TRG', ['OFF', 'ON'], 'OFF');
const revP = (rt, high, dly, hpf, lpf) => [N('rt', 'REV TIME', 0.3, 99, 0.1, rt, 's', 1), N('high', 'HIGH', 0.1, 1, 0.1, high, '', 1), ms('dly', 'DELAY', dly), L('hpf', 'HPF', HPF, hpf), L('lpf', 'LPF', LPF, lpf)];
const erP = (type, size, live, dly, lpf) => [L('type', 'TYPE', ['HALL', 'RANDOM', 'REVERSE', 'PLATE'], type), N('size', 'ROOM SIZE', 0.1, 20, 0.1, size, '', 1), N('live', 'LIVENESS', 0, 10, 1, live, '', 0), ms('dly', 'DELAY', dly, 1800), L('lpf', 'LPF', LPF, lpf)];
const dlyP = (max, dl, fbl, dr, fbr, high) => [ms('dl', 'Lch DLY', dl, max), N('fbl', 'Lch F.B', -99, 99, 1, fbl, '%', 0), ms('dr', 'Rch DLY', dr, max), N('fbr', 'Rch F.B', -99, 99, 1, fbr, '%', 0), N('high', 'HIGH', 0.1, 1, 0.1, high, '', 1)];
const frq = (def, max = 40) => N('frq', 'MOD. FRQ', 0.1, max, 0.1, def, 'Hz', 1);
const pct = (id, label, def) => N(id, label, 0, 100, 1, def, '%', 0);
const pitchP = (p, fine, dly, fb, key) => [N('pitch', 'PITCH', -12, 12, 1, p, '', 0), N('fine', 'FINE', -100, 100, 1, fine, '', 0), ms('dly', 'DELAY', dly, 1800), N('fb', 'F.B GAIN', 0, 99, 1, fb, '%', 0), L('key', 'BASE KEY', KEYS, key)];
const hz = (v) => (v === 'THRU' ? 0 : v);
const khz = (v) => (v === 'THRU' ? 0 : v * 1000);

export const SPX_PROGRAMS = [
  { name: 'REV 1 HALL', params: revP(2.6, 0.6, 30, 'THRU', 8.0), to: (v) => ({ algo: 'reverb', rt: v.rt, hf: v.high, pre: v.dly, hpf: hz(v.hpf), lpf: khz(v.lpf), erPat: 0, er: 40, dens: 0.8 }) },
  { name: 'REV 2 ROOM', params: revP(1.5, 0.7, 20, 'THRU', 8.0), to: (v) => ({ algo: 'reverb', rt: v.rt, hf: v.high, pre: v.dly, hpf: hz(v.hpf), lpf: khz(v.lpf), erPat: 1, er: 25, dens: 0.75 }) },
  { name: 'REV 3 VOCAL', params: revP(2.4, 0.5, 45, 80, 8.0), to: (v) => ({ algo: 'reverb', rt: v.rt, hf: v.high, pre: v.dly, hpf: hz(v.hpf), lpf: khz(v.lpf), erPat: 0, er: 30, dens: 0.7 }) },
  { name: 'REV 4 PLATE', params: revP(1.8, 0.7, 10, 40, 10), to: (v) => ({ algo: 'reverb', rt: v.rt, hf: v.high, pre: v.dly, hpf: hz(v.hpf), lpf: khz(v.lpf), erPat: 2, er: 15, dens: 0.95 }) },
  { name: 'EARLY REF. 1', params: erP('HALL', 2.0, 5, 10, 'THRU'), to: (v) => ({ algo: 'er', type: v.type.toLowerCase(), size: v.size, live: v.live, pre: v.dly, dense: false, lpf: khz(v.lpf) }) },
  { name: 'EARLY REF. 2', params: erP('HALL', 2.0, 5, 10, 'THRU'), to: (v) => ({ algo: 'er', type: v.type.toLowerCase(), size: v.size, live: v.live, pre: v.dly, dense: true, lpf: khz(v.lpf) }) },
  { name: 'DELAY L,R', params: dlyP(2000, 100, 0, 200, 0, 1.0), to: (v) => ({ algo: 'delay', dl: v.dl, dr: v.dr, fbl: v.fbl / 100, fbr: v.fbr / 100, hd: v.high }) },
  { name: 'STEREO ECHO', params: dlyP(1000, 170, 60, 178, 58, 0.9), to: (v) => ({ algo: 'echo', dl: v.dl, dr: v.dr, fbl: v.fbl / 100, fbr: v.fbr / 100, cross: 0.3 }) },
  { name: 'STEREO FLANGE A', bal: 50, params: [frq(2.5), pct('depth', 'MOD. DEPTH', 50), ms('dly', 'MOD. DLY', 1.2, 100), N('fb', 'F.B GAIN', 0, 99, 1, 35, '%', 0)], to: (v) => ({ algo: 'mod', kind: 'flange', f: v.frq, depth: v.depth / 100, dly: v.dly, fb: v.fb / 100 }) },
  { name: 'STEREO FLANGE B', bal: 75, params: [frq(0.5), pct('depth', 'MOD. DEPTH', 90), ms('dly', 'MOD. DLY', 1.0, 100), N('fb', 'F.B GAIN', 0, 99, 1, 40, '%', 0)], to: (v) => ({ algo: 'mod', kind: 'flange', f: v.frq, depth: v.depth / 100, dly: v.dly, fb: v.fb / 100 }) },
  { name: 'CHORUS A', params: [frq(0.2), pct('dm', 'DM DEPTH', 50), pct('am', 'AM DEPTH', 40)], to: (v) => ({ algo: 'mod', kind: 'chorus', f: v.frq, depth: v.dm / 100, am: v.am / 100, dly: 8, fb: 0 }) },
  { name: 'CHORUS B', params: [frq(0.6), pct('dm', 'DM DEPTH', 50), pct('am', 'AM DEPTH', 10)], to: (v) => ({ algo: 'mod', kind: 'chorus', f: v.frq, depth: v.dm / 100, am: v.am / 100, dly: 8, fb: 0 }) },
  { name: 'STEREO PHASING', params: [frq(1.1), pct('depth', 'MOD. DEPTH', 100), ms('dly', 'MOD. DLY', 3.0, 8)], to: (v) => ({ algo: 'phase', f: v.frq, depth: v.depth / 100, offset: Math.max(0, 1 - v.dly / 8) }) },
  { name: 'TREMOLO', params: [frq(6.0), pct('depth', 'MOD. DEPTH', 50)], to: (v) => ({ algo: 'mod', kind: 'chorus', f: v.frq, depth: Math.min(1, v.depth / 100 * 1.6), am: v.depth / 100 * 0.5, dly: 6, fb: 0 }) },   // a deep, wide chorus on the SPX
  { name: 'SYMPHONIC', params: [frq(0.7), pct('depth', 'MOD. DEPTH', 50)], to: (v) => ({ algo: 'mod', kind: 'symph', f: v.frq, depth: v.depth / 100, dly: 10, fb: 0 }) },
  { name: 'GATE REVERB', params: erP('RANDOM', 2.0, 5, 20, 6.3), to: (v) => ({ algo: 'er', type: v.type.toLowerCase(), size: v.size, live: v.live, pre: v.dly, dense: true, lpf: khz(v.lpf) }) },
  { name: 'REVERSE GATE', params: erP('REVERSE', 3.3, 5, 29, 'THRU'), to: (v) => ({ algo: 'er', type: v.type.toLowerCase(), size: v.size, live: v.live, pre: v.dly, dense: true, lpf: khz(v.lpf) }) },
  { name: 'ADR-NOISE GATE', trig: true, params: [...trgP(65, -7, 5), N('att', 'ATTACK', 5, 32000, 5, 5, 'ms', 0), N('dec', 'DECAY', 5, 32000, 5, 5, 'ms', 0), pct('decLvl', 'DECAY LVL', 100), N('hold', 'HOLD', 1, 30000, 1, 90, 'ms', 0), N('rel', 'RELEASE', 5, 32000, 5, 5, 'ms', 0), midiTrg],
    to: (v) => ({ algo: 'adr', trg: v.trg, tdly: v.tdly, msk: v.msk, att: v.att, dec: v.dec, decLvl: v.decLvl, hold: v.hold, rel: v.rel, holdLvl: 0, rev: false }) },
  { name: 'COMPRESSOR', trig: true, params: [...trgP(89, -25, 420), N('att', 'ATTACK', 5, 32000, 5, 22, 'ms', 0), N('hold', 'HOLD', 1, 30000, 1, 28, 'ms', 0), pct('holdLvl', 'HOLD LEVEL', 1), N('rel', 'RELEASE', 5, 32000, 5, 525, 'ms', 0), midiTrg],
    to: (v) => ({ algo: 'adr', trg: v.trg, tdly: v.tdly, msk: v.msk, att: v.att, dec: 5, decLvl: 100, hold: v.hold, rel: v.rel, holdLvl: v.holdLvl, rev: false }) },
  { name: 'REVERB & GATE', trig: true, params: [...revP(2.0, 0.6, 10, 'THRU', 'THRU'), N('trg', 'TRG. LEVEL', 1, 100, 1, 65, '', 0), N('hold', 'HOLD', 1, 30000, 1, 150, 'ms', 0), N('rel', 'RELEASE', 5, 32000, 5, 5, 'ms', 0), midiTrg],
    to: (v) => ({ algo: 'adr', rev: true, rt: v.rt, hf: v.high, pre: v.dly, hpf: hz(v.hpf), lpf: khz(v.lpf), trg: v.trg, tdly: 0, msk: 5, att: 5, dec: 5, decLvl: 100, hold: v.hold, rel: v.rel, holdLvl: 0 }) },
  { name: 'PITCH CHANGE A', params: pitchP(6, 0, 0.1, 0, 'C3'), to: (v) => ({ algo: 'pitch', voices: 'one', l: v.pitch, finel: v.fine, dly: v.dly, fb: v.fb / 100 }) },
  { name: 'PITCH CHANGE B', params: [N('p1', '1 PITCH', -12, 12, 1, 0, '', 0), N('f1', '1 FINE', -100, 100, 1, 8, '', 0), ms('d1', '1 DLY', 0.1, 1800), N('p2', '2 PITCH', -12, 12, 1, 0, '', 0), N('f2', '2 FINE', -100, 100, 1, -8, '', 0), ms('d2', '2 DLY', 20, 1800)],
    to: (v) => ({ algo: 'pitch', voices: 'center', l: v.p1, finel: v.f1, dly: v.d1, r: v.p2, finer: v.f2, dlyr: v.d2, fb: 0 }) },
  { name: 'PITCH CHANGE C', params: [N('p1', 'L PITCH', -12, 12, 1, 0, '', 0), N('f1', 'L FINE', -100, 100, 1, 8, '', 0), ms('d1', 'L DLY', 0.1, 900), N('p2', 'R PITCH', -12, 12, 1, 0, '', 0), N('f2', 'R FINE', -100, 100, 1, -8, '', 0), ms('d2', 'R DLY', 0.1, 900)],
    to: (v) => ({ algo: 'pitch', voices: 'lr', l: v.p1, finel: v.f1, dly: v.d1, r: v.p2, finer: v.f2, dlyr: v.d2, fb: 0 }) },
  { name: 'PITCH CHANGE D', params: pitchP(0, 0, 0.1, 0, 'C3'), to: (v) => ({ algo: 'pitch', voices: 'one', l: v.pitch, finel: v.fine, dly: v.dly, fb: v.fb / 100 }) },
  { name: 'FREEZE A', trig: true, params: [L('rec', 'REC MODE', ['MANUAL', 'AUTO'], 'AUTO'), N('tdly', 'TRG. DLY', -2000, 2000, 1, -5, 'ms', 0), A('record', 'RECORD'), A('overdub', 'OVER DUB'), A('play', 'PLAY'), ms('start', 'START', 0, 2000, 0), ms('end', 'END', 2000, 2000, 0), L('intrg', 'INPUT TRG', ['OFF', 'ON'], 'OFF'), N('msk', 'TRG. MSK', 10, 2000, 1, 80, 'ms', 0)],
    to: (v) => ({ algo: 'freeze', auto: v.rec === 'AUTO', start: Math.min(v.start, v.end), end: Math.max(v.start, v.end), loop: false }) },
  { name: 'FREEZE B', trig: true, params: [L('rec', 'REC MODE', ['MANUAL', 'AUTO'], 'MANUAL'), N('tdly', 'TRG. DLY', -2000, 2000, 1, -50, 'ms', 0), A('record', 'RECORD'), A('overdub', 'OVER DUB'), A('play', 'PLAY'), N('pitch', 'PITCH', -12, 12, 1, 0, '', 0), N('fine', 'FINE', -100, 100, 1, 0, '', 0), L('key', 'BASE KEY', KEYS, 'C3')],
    to: (v) => ({ algo: 'freeze', auto: v.rec === 'AUTO', pitch: v.pitch, fine: v.fine, loop: false }) },
  { name: 'PAN', params: [N('frq', 'PAN SPEED', 0.1, 40, 0.1, 0.7, 'Hz', 1), L('dir', 'DIRECTION', ['L→R', 'L←R', 'L↔R'], 'L↔R'), pct('depth', 'DEPTH', 75)], to: (v) => ({ algo: 'trem', pan: true, f: v.frq, depth: v.depth / 100, shape: v.dir === 'L→R' ? 'saw' : v.dir === 'L←R' ? 'rsaw' : 'sine' }) },
  { name: 'TRIGGERED PAN', trig: true, params: [...trgP(65, -10, 1000), N('att', 'ATTACK', 5, 32000, 5, 22, 'ms', 0), N('pan', 'PANNING', 5, 32000, 5, 525, 'ms', 0), N('rel', 'RELEASE', 5, 32000, 5, 840, 'ms', 0), L('dir', 'DIRECTION', ['L→R', 'L←R'], 'L→R'), pct('bal', 'L/R BALANCE', 30), midiTrg],
    to: (v) => ({ algo: 'tpan', trg: v.trg, tdly: v.tdly, msk: v.msk, att: v.att, pan: v.pan, rel: v.rel, dir: v.dir === 'L→R' ? 1 : -1, bal: v.bal }) },
  { name: 'DELAY VIBRATO', trig: true, params: [N('trg', 'TRG. LEVEL', 1, 100, 1, 100, '', 0), N('vdly', 'VIB DLY', 1, 30000, 1, 400, 'ms', 0), N('rise', 'VIB RISE', 5, 32000, 5, 1400, 'ms', 0), N('frq', 'VIB FRQ', 0.1, 20, 0.1, 7.0, 'Hz', 1), pct('depth', 'VIB DEPTH', 40), midiTrg],
    to: (v) => ({ algo: 'dvib', trg: v.trg, tdly: 0, msk: 5, vdly: v.vdly, rise: v.rise, f: v.frq, depth: v.depth }) },
  { name: 'PARAMETRIC EQ.', params: [L('hpf', 'HPF', HPF, 'THRU'), L('mf', 'MID FRQ', MIDF, 500), N('mg', 'MID GAIN', -15, 15, 1, 0, 'dB', 0), N('mq', 'MID Q', 0.5, 5, 0.1, 1.0, '', 1), L('hf', 'HI FRQ', HIF, 2000), N('hg', 'HI GAIN', -15, 15, 1, 0, 'dB', 0), N('hq', 'HI Q', 0.5, 5, 0.1, 1.6, '', 1), L('lpf', 'LPF', LPF, 'THRU'), ms('dly', 'DELAY', 0.1, 1000)],
    to: (v) => ({ algo: 'peq', hpf: hz(v.hpf), lpf: khz(v.lpf), mid: { f: v.mf, g: v.mg, q: v.mq }, hi: { f: v.hf, g: v.hg, q: v.hq }, dly: v.dly }) },
];
// a program's values: { paramId: value } (list parameters hold the list item), plus BALANCE and OUT LVL (0..100 %)
export function spxDefaults(n) {
  const P = SPX_PROGRAMS[n - 1], v = { bal: P.bal ?? 100, out: 100 };
  for (const q of P.params) if (!q.action) v[q.id] = q.list ? q.list[q.def] : q.def;
  return v;
}
export function spxEngine(n, v) { const P = SPX_PROGRAMS[n - 1]; return { ...P.to(v), mix: (v.bal ?? 100) / 100, out: (v.out ?? 100) / 100 }; }
// the LCD's second line for a parameter: "REV TIME= 2.6s", "HPF=THRU", "LPF= 8.0kHz"
export function spxShow(q, val) {
  if (q.action) return q.label;
  let t;
  if (q.list) t = typeof val === 'number' ? (q.id === 'lpf' ? `${val >= 10 ? val : val.toFixed(1)}kHz` : val >= 1000 ? `${(val / 1000).toFixed(1)}kHz` : `${val}Hz`) : val;
  else t = `${q.dec ? val.toFixed(q.dec) : Math.round(val)}${q.unit}`;
  return `${q.label}=${String(t).padStart(Math.max(String(t).length, 15 - q.label.length))}`.slice(0, 16);   // the value ends at the right edge
}
