import test from 'node:test';
import assert from 'node:assert/strict';
import { Juno, JUNO_PATCHES, junoDefaults } from './juno.js';
const fs = 48000;
const run = (u, sec) => { const N = Math.round(sec * fs), L = new Float32Array(N), R = new Float32Array(N); for (let i = 0; i < N; i += 128) { const m = Math.min(128, N - i); u.process(L.subarray(i, i + m), R.subarray(i, i + m), m); } return [L, R]; };
const rms = (y, a = 0, b = y.length) => { let s = 0; for (let k = a; k < b; k++) s += y[k] * y[k]; return Math.sqrt(s / (b - a)); };
const zc = (y, a, b) => { let z = 0; for (let k = a + 1; k < b; k++) if (y[k - 1] < 0 && y[k] >= 0) z++; return z / ((b - a) / fs); };
test('a note plays at pitch (8\'), an octave down at 16\'; six voices, the seventh steals', () => {
  const u = new Juno(fs).set({ chorus: 0, saw: true, pulse: false, sub: 0, cutoff: 1, env: 0 }); u.noteOn(57); const [L] = run(u, 0.4);
  assert.ok(Math.abs(zc(L, 4800, 19200) - 220) < 4, `${zc(L, 4800, 19200)}`);
  const d = new Juno(fs).set({ chorus: 0, saw: true, pulse: false, sub: 0, cutoff: 1, env: 0, range: 16 }); d.noteOn(57); const [M] = run(d, 0.4); assert.ok(Math.abs(zc(M, 4800, 19200) - 110) < 3);
  const p = new Juno(fs); for (let k = 0; k < 7; k++) p.noteOn(60 + k); run(p, 0.05); assert.equal(p.v.filter((v) => v.on).length, 6); assert.ok(!p.v.some((v) => v.note === 60));
});
test('the filter darkens with cutoff; resonance self-oscillates; release ends the note', () => {
  const bright = (c) => { const u = new Juno(fs).set({ chorus: 0, cutoff: c, env: 0, res: 0 }); u.noteOn(48); const [L] = run(u, 0.3); let d = 0; for (let k = 1; k < L.length; k++) d += Math.abs(L[k] - L[k - 1]); return d / rms(L); };
  assert.ok(bright(0.9) > bright(0.3) * 2);
  const s = new Juno(fs).set({ chorus: 0, saw: false, pulse: false, sub: 0, noise: 0, res: 1, cutoff: 0.6, env: 0, kybd: 0 }); s.noteOn(60); s.v[0].y4 = 0.1; const [O] = run(s, 0.5); assert.ok(rms(O, 12000) > 0.01, 'rings on its own');
  const r = new Juno(fs).set({ r: 0.1 }); r.noteOn(60); run(r, 0.2); r.noteOff(60); const [Z] = run(r, 0.5); assert.ok(rms(Z, 12000) < 1e-3 && r.v.every((v) => !v.on));
});
test('chorus makes the two sides differ; every factory patch sounds', () => {
  const u = new Juno(fs).set({ chorus: 2 }); u.noteOn(60); const [L, R] = run(u, 0.4); let d = 0; for (let k = 4800; k < L.length; k++) d += Math.abs(L[k] - R[k]); assert.ok(d / (L.length - 4800) > 0.005);
  for (const P of JUNO_PATCHES) { const v = new Juno(fs).set({ ...junoDefaults(), ...P }); v.noteOn(60); v.noteOn(64); const [a] = run(v, 0.6); const e = a.reduce((m, x) => Math.max(m, Math.abs(x)), 0); assert.ok(Number.isFinite(e) && e > 0.01 && e < 2, `${P.name} ${e}`); }
});
