import test from 'node:test';
import assert from 'node:assert/strict';
import { Machine, monitorSource, VU0, IPS, HEADS, align, standardOffset } from './jh24audio.js';

const FS = 48000, B = 128;
const dB = (x) => 20 * Math.log10(Math.max(x, 1e-12));
// run the machine for `sec` seconds at speed v with per-sample input function fin(i, t) for channel i
function run(m, sec, { v = 30 * IPS, mode = 'play', fin = null, take = null } = {}) {
  const N = Math.round(sec * FS / B), outs = Array.from({ length: m.n }, () => new Float32Array(N * B));
  const inp = Array.from({ length: m.n }, () => new Float32Array(B)), out = Array.from({ length: m.n }, () => new Float32Array(B));
  let first = true;
  for (let b = 0; b < N; b++) {
    if (fin) for (let i = 0; i < m.n; i++) for (let k = 0; k < B; k++) inp[i][k] = fin(i, m.time + k / FS);
    m.process(inp, out, first ? { v, mode, take: take ?? undefined } : { v, mode });
    first = false;
    for (let i = 0; i < m.n; i++) outs[i].set(out[i], b * B);
  }
  return outs;
}
const sine = (f, db = 0) => (i, t) => VU0 * 10 ** (db / 20) * Math.sin(2 * Math.PI * f * t);
// level of frequency f in x[a..b) (Goertzel), dB re 0 VU
function tone(x, f, a, b) {
  const w = 2 * Math.PI * f / FS, c = 2 * Math.cos(w); let s1 = 0, s2 = 0;
  for (let i = a; i < b; i++) { const s = x[i] + c * s1 - s2; s2 = s1; s1 = s; }
  const p = Math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) * 2 / (b - a);
  return dB(p / VU0);
}
const rms = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / (b - a)); };
const quiet = (opts = {}) => { const m = new Machine(FS, { tracks: 4, hiss: false, wowFlutter: false, ...opts }); return m; };

test('factory alignment: record → repro flat within the spec windows at 15 and 30 ips', () => {
  const m = quiet(), c = m.ch[0];
  m.setSpeed(30); for (const f of [50, 100, 1000, 5000, 10000, 15000, 20000]) assert.ok(Math.abs(c.recordReproDb(f)) < 3, `30 ips ${f} Hz ${c.recordReproDb(f).toFixed(1)} dB`);
  m.setSpeed(15); for (const f of [40, 100, 1000, 5000, 10000, 15000, 18000]) assert.ok(Math.abs(c.recordReproDb(f)) < 2, `15 ips ${f} Hz ${c.recordReproDb(f).toFixed(1)} dB`);
});

test('0 VU in records and reproduces at 0 VU, delayed by the record → repro head distance', () => {
  const m = quiet(); m.st.ready.add(0); m.st.master = { tape: true, input: false, auto: false };
  const burst = (i, t) => (t > 0.3 ? sine(1000)(i, t) : 0);
  const o = run(m, 0.8, { mode: 'rec', fin: burst })[0];
  assert.ok(Math.abs(tone(o, 1000, Math.round(0.55 * FS), Math.round(0.75 * FS))) < 0.5, 'repro at 0 VU');
  const delay = HEADS.recordToRepro / (30 * IPS);   // 50 ms at 30 ips
  assert.ok(rms(o, Math.round((0.3 + delay - 0.008) * FS), Math.round((0.3 + delay - 0.002) * FS)) < 0.02 * VU0, 'silent just before the repro delay');
  assert.ok(rms(o, Math.round((0.3 + delay + 0.01) * FS), Math.round((0.3 + delay + 0.03) * FS)) > 0.5 * VU0, 'tone right after it');
});

test('sync (cue) playback comes off the record head with no delay', () => {
  const m = quiet(); m.st.ready.add(0); m.st.master = { tape: true, input: false, auto: false };
  run(m, 1.0, { mode: 'rec', fin: (i, t) => (t > 0.2 && t < 0.25 ? VU0 : 0) });   // a 50 ms pulse at 0.2 s
  m.st.ready.clear(); m.st.cue.add(0);
  const start = m.take - 0.9 * 30 * IPS;
  const o = run(m, 0.6, { mode: 'play', take: start })[0];
  // the pulse was written when the record head was at the coordinate it passes again 0.1 s into this replay
  const edge = o.findIndex((x) => Math.abs(x) > 0.3 * VU0) / FS;
  assert.ok(Math.abs(edge - 0.1) < 0.012, `sync edge at ${edge.toFixed(3)} s`);
});

test('monitor switching follows the manual (TAPE / INPUT / AUTO, INPUT+AUTO, individual input, CUE)', () => {
  const st = (master, mode, extra = {}) => ({ master, mode, ready: new Set([0]), cue: new Set(extra.cue || []), inputs: new Set(extra.inputs || []) });
  const AUTO = { tape: false, input: false, auto: true }, TAPE = { tape: true, input: false, auto: false }, INPUT = { tape: false, input: true, auto: false }, IA = { tape: false, input: true, auto: true };
  assert.equal(monitorSource(0, st(AUTO, 'stop')), 'input'); assert.equal(monitorSource(0, st(AUTO, 'play')), 'cue'); assert.equal(monitorSource(0, st(AUTO, 'rec')), 'input');
  assert.equal(monitorSource(1, st(AUTO, 'play')), 'cue'); assert.equal(monitorSource(1, st(AUTO, 'stop')), 'cue');
  assert.equal(monitorSource(0, st(TAPE, 'play')), 'repro'); assert.equal(monitorSource(0, st(TAPE, 'rec')), 'repro'); assert.equal(monitorSource(1, st(TAPE, 'play', { cue: [1] })), 'cue');
  assert.equal(monitorSource(1, st(INPUT, 'play')), 'input');
  assert.equal(monitorSource(0, st(IA, 'play')), 'input'); assert.equal(monitorSource(1, st(IA, 'play')), 'cue');
  assert.equal(monitorSource(1, st(TAPE, 'play', { inputs: [1] })), 'input');
});

// record tone A, then punch in tone B in the middle; reproduce and look for a hole or a doubled region at the edits
function punchTest(quior) {
  const m = quiet({ quior }); m.st.ready.add(0); m.st.master = { tape: true, input: false, auto: false };
  const t0 = m.take;
  run(m, 2.0, { mode: 'rec', fin: sine(1000) });
  run(m, 0.2, { mode: 'stop', v: 0 });
  // replay from the start; punch in from 0.6 s to 1.2 s with 2 kHz
  m.time = 0; run(m, 0.6, { mode: 'play', take: t0 });
  run(m, 0.6, { mode: 'rec', fin: sine(2000) });
  run(m, 0.6, { mode: 'play', fin: sine(2000) });   // the source keeps playing past the punch-out
  const o = run(m, 2.2, { mode: 'play', take: t0 })[0];
  let worst = 0;
  for (let a = Math.round(0.2 * FS); a < Math.round(1.9 * FS); a += 120) worst = Math.min(worst, dB(rms(o, a, a + 240) / (VU0 * Math.SQRT1_2)));
  return worst;
}
test('QUIOR: punch-in and punch-out leave no hole', () => { const w = punchTest(true); assert.ok(w > -10, `deepest dip ${w.toFixed(1)} dB`); });
test('without QUIOR the erase / record head distance leaves a hole at the punch-out', () => { const w = punchTest(false); assert.ok(w < -20, `deepest dip ${w.toFixed(1)} dB`); });

test('MOL: about 3 % third harmonic at 1040 nWb/m (+12.4 dB over 250 nWb/m)', () => {
  const m = quiet(); m.st.ready.add(0); m.st.master = { tape: true, input: false, auto: false };
  const o = run(m, 0.8, { mode: 'rec', fin: sine(1000, 12.4) })[0];
  const a = Math.round(0.4 * FS), b = Math.round(0.7 * FS), h3 = tone(o, 3000, a, b) - tone(o, 1000, a, b);
  assert.ok(h3 > dB(0.015) && h3 < dB(0.06), `third harmonic ${(100 * 10 ** (h3 / 20)).toFixed(1)} %`);
});

test('underbias raises distortion, overbias trades high end for cleaner tape', () => {
  const m = quiet(), c = m.ch[0];
  m.setSpeed(30); const hf0 = c.recordReproDb(10000), s0 = c.sat;
  c.t.bias[30] += 2; c.configure(30); const hf1 = c.recordReproDb(10000);
  assert.ok(hf0 - hf1 > 1.5 && hf0 - hf1 < 2.5, `2 dB more bias costs ${(hf0 - hf1).toFixed(1)} dB at 10 kHz`);
  c.t.bias[30] = -2; c.configure(30); assert.ok(c.sat > s0 * 1.5, 'underbias drives the tape harder into distortion');
});

test('cross-feed cancels record-head crosstalk into the adjacent tracks\' sync playback', () => {
  const leak = (crossfeed) => {
    const m = quiet(); m.ch[1].t.crossfeed = crossfeed; m.st.ready.add(0); m.st.master = { tape: true, input: false, auto: false }; m.st.cue.add(1);
    const o = run(m, 0.5, { mode: 'rec', fin: (i, t) => (i === 0 ? sine(1000)(i, t) : 0) })[1];
    return tone(o, 1000, Math.round(0.2 * FS), Math.round(0.45 * FS));
  };
  const off = leak(0), on = leak(0.98);
  assert.ok(off > -40 && off < -25, `crosstalk without cancel ${off.toFixed(1)} dB`);
  assert.ok(off - on > 20, `cross-feed reduces it by ${(off - on).toFixed(1)} dB`);
});

test('bias defeat (spot erase): erases the track and records nothing', () => {
  const m = quiet(); m.st.ready.add(0); m.st.master = { tape: true, input: false, auto: false };
  const t0 = m.take; run(m, 1.0, { mode: 'rec', fin: sine(1000) });
  m.ch[0].t.biasDefeat = true; run(m, 1.0, { mode: 'rec', take: t0, fin: sine(2000) });
  m.ch[0].t.biasDefeat = false;
  const o = run(m, 1.0, { mode: 'play', take: t0 })[0];
  assert.ok(rms(o, Math.round(0.2 * FS), Math.round(0.8 * FS)) < 0.01 * VU0, 'nothing left on the track');
});

test('lifters out during a wind: the heads hear almost nothing', () => {
  const m = quiet(); m.st.ready.add(0); m.st.master = { tape: true, input: false, auto: false };
  const t0 = m.take; run(m, 1.0, { mode: 'rec', fin: sine(1000) });
  m.lift = 1; const o = run(m, 0.2, { mode: 'ff', v: 13, take: t0 })[0];
  assert.ok(rms(o, 0, o.length) < 0.01 * VU0);
});

test('standards: an NAB alignment tape on an IEC-set machine plays HF low at 15 ips, the same at 30 ips (AES)', () => {
  assert.ok(standardOffset('NAB', 'IEC', 15, 10000) < -1);
  assert.ok(Math.abs(standardOffset('NAB', 'IEC', 30, 10000)) < 0.01);
});

test('loaded transfers play back at their level and are erased by recording over them', () => {
  const m = quiet(); m.st.master = { tape: true, input: false, auto: false };
  const t0 = m.take, x = new Float32Array(FS); for (let i = 0; i < FS; i++) x[i] = VU0 * Math.sin(2 * Math.PI * 440 * i / FS);
  m.loadTransfer(0, x, t0, 30);
  const o = run(m, 0.8, { mode: 'play', take: t0 })[0];
  assert.ok(Math.abs(tone(o, 440, Math.round(0.2 * FS), Math.round(0.7 * FS))) < 0.5);
});
