import test from 'node:test';
import assert from 'node:assert/strict';
import { S900, s9Sample, s9Keygroup, S900_WORDS } from './s900.js';

const fs = 48000;
const run = (u, sec, x = null) => { const N = Math.round(sec * fs), L = new Float32Array(N), R = new Float32Array(N); for (let i = 0; i < N; i += 128) { const m = Math.min(128, N - i); u.process(x ? x.subarray(i, i + m) : null, L.subarray(i, i + m), R.subarray(i, i + m), m); } return L; };
const zc = (y, a, b) => { let z = 0; for (let k = a + 1; k < b; k++) if (y[k - 1] < 0 && y[k] >= 0) z++; return z / ((b - a) / fs); };
const sine = (f, rate, sec) => Float32Array.from({ length: Math.round(rate * sec) }, (_, k) => 0.5 * Math.sin(2 * Math.PI * f * k / rate));
const unit = (o = {}, kg = {}) => { const u = new S900(fs); u.addSample(s9Sample('SINE', sine(440, 40000, 1), 40000, { root: 69, ...o })); u.program().kgs.push(s9Keygroup(kg)); return u; };

test('12-bit storage and the root note plays at pitch; an octave up doubles it (no interpolation)', () => {
  const u = unit(); const d = u.samples[0].data; assert.ok(d.every((v) => Math.abs(v * 2047 - Math.round(v * 2047)) < 1e-3), '12-bit words');
  u.noteOn(69, 127); const y = run(u, 0.5); const f = zc(y, 4800, 24000); assert.ok(Math.abs(f - 440) < 4, `root ${f}`);
  const v = unit(); v.noteOn(81, 127); const z = run(v, 0.4); const f2 = zc(z, 4800, 16000); assert.ok(Math.abs(f2 - 880) < 8, `octave ${f2}`);
});
test('loop sustains while the key is held, release ends it; a one-shot ignores note off', () => {
  const u = unit({ mode: 'loop', loopAt: 20000, loopLen: 400 * 100 / 44 | 0 }); u.noteOn(69, 127); const y = run(u, 2.5);
  let e = 0; for (let k = Math.round(2.3 * fs); k < 2.5 * fs; k++) e = Math.max(e, Math.abs(y[k])); assert.ok(e > 0.1, `held loop ${e}`);
  u.noteOff(69); const z = run(u, 1.5); let e2 = 0; for (let k = Math.round(1.3 * fs); k < 1.5 * fs; k++) e2 = Math.max(e2, Math.abs(z[k])); assert.ok(e2 < 0.01, `released ${e2}`);
  const o = unit({ mode: 'one' }); o.noteOn(69, 127); run(o, 0.05); o.noteOff(69); const w = run(o, 0.5); let e3 = 0; for (let k = Math.round(0.3 * fs); k < 0.5 * fs; k++) e3 = Math.max(e3, Math.abs(w[k])); assert.ok(e3 > 0.1, 'one-shot plays on');
});
test('8 voices: a ninth note steals the oldest', () => {
  const u = unit({ mode: 'loop', loopAt: 1000, loopLen: 30000 }); for (let k = 0; k < 9; k++) { u.noteOn(60 + k, 100); run(u, 0.01); }
  assert.equal(u.voices.filter((v) => v.on).length, 8); assert.ok(!u.voices.some((v) => v.on && v.note === 60), 'note 60 stolen');
});
test('recording: waits for the threshold, samples at the chosen rate, stores a new sample; memory limits it', () => {
  const u = new S900(fs); u.armRecord({ rate: 20000, len: 0.5, thresh: 0.1, name: 'REC' });
  const x = new Float32Array(fs); for (let k = 12000; k < fs; k++) x[k] = 0.4 * Math.sin(2 * Math.PI * 1000 * k / fs);
  run(u, 1, x); assert.equal(u.rec.state, 'done'); const S = u.samples[0]; assert.equal(S.rate, 20000); assert.equal(S.data.length, 10000);
  assert.ok(Math.abs(S.data[0]) < 0.45 && Math.abs(S.data[50]) > 0.05, 'starts at the sound');
  assert.ok(u.free() === S900_WORDS - 10000);
  const big = new S900(fs); assert.equal(big.armRecord({ rate: 40000, len: 60 }), true); assert.equal(big.rec.buf.length, S900_WORDS);
});
test('filter darkens; velocity sets the level', () => {
  const rms = (y) => Math.sqrt(y.reduce((a, b) => a + b * b, 0) / y.length);
  const hi = (f) => { const u = new S900(fs); u.addSample(s9Sample('N', sine(6000, 40000, 0.5), 40000, { root: 60 })); u.program().kgs.push(s9Keygroup({ filter: f })); u.noteOn(60, 127); return rms(run(u, 0.3)); };
  assert.ok(hi(30) < hi(99) * 0.3);
  const lo = unit({}, { velLevel: 99 }); lo.noteOn(69, 30); const a = rms(run(lo, 0.2)); const hv = unit({}, { velLevel: 99 }); hv.noteOn(69, 127); const b = rms(run(hv, 0.2)); assert.ok(a < b * 0.4);
});
