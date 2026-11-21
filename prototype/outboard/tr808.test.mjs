import test from 'node:test';
import assert from 'node:assert/strict';
import { TR808, TR_INST } from './tr808.js';

const fs = 48000;
const run = (u, sec) => { const N = Math.round(sec * fs), L = new Float32Array(N), R = new Float32Array(N); for (let i = 0; i < N; i += 128) { const m = Math.min(128, N - i); u.process(L.subarray(i, i + m), R.subarray(i, i + m), m); } return [L, R]; };
const zc = (y, a, b) => { let z = 0; for (let k = a + 1; k < b; k++) if (y[k - 1] < 0 && y[k] >= 0) z++; return z / ((b - a) / fs); };

test('every voice sounds, finite and bounded', () => {
  for (const k of TR_INST) { const u = new TR808(fs); u.trig(k, true); const [L] = run(u, 0.3); let e = 0; for (const v of L) e = Math.max(e, Math.abs(v)); assert.ok(Number.isFinite(e) && e > 0.01 && e <= 1, `${k}: ${e}`); }
});
test('bass drum rings near 50 Hz; decay knob lengthens it', () => {
  const u = new TR808(fs); u.trig('BD'); const [L] = run(u, 0.4); const f = zc(L, 0.05 * fs, 0.3 * fs); assert.ok(f > 44 && f < 62, `${f} Hz`);
  const e = (d) => { const v = new TR808(fs).set({ BD: { decay: d } }); v.trig('BD'); const [y] = run(v, 1); let s = 0; for (let k = 0.4 * fs; k < 0.6 * fs; k++) s += y[k] * y[k]; return s; };
  assert.ok(e(1) > e(0.2) * 10);
});
test('the sequencer: 16ths at the tempo, A/B alternation, accent louder', () => {
  const u = new TR808(fs).set({ tempo: 120, var: 'AB' }); const P = u.patterns[0]; P.A.steps.BD[0] = 1; P.B.steps.SD[0] = 1; P.A.steps.CH[4] = 1;
  const hits = []; const orig = u.trig.bind(u); u.trig = (k, a) => { hits.push([k, u.part, Math.round((u.t || 0) * 1000)]); orig(k, a); };
  u.start(); let t = 0; const L = new Float32Array(128), R = new Float32Array(128); for (let i = 0; i < 4.1 * fs / 128; i++) { u.t = t; u.process(L, R, 128); t += 128 / fs; }
  const bd = hits.filter((h) => h[0] === 'BD'), sd = hits.filter((h) => h[0] === 'SD'), chh = hits.filter((h) => h[0] === 'CH');
  assert.equal(bd.length, 2); assert.equal(sd.length, 1); assert.ok(bd.every((h) => h[1] === 'A') && sd.every((h) => h[1] === 'B'));
  assert.ok(Math.abs(chh[0][2] - bd[0][2] - 500) < 10, `step 5 lands a beat later: ${chh[0][2] - bd[0][2]} ms`);
  const lvl = (acc) => { const v = new TR808(fs); v.trig('SD', acc); const [y] = run(v, 0.1); let e = 0; for (const s of y) e = Math.max(e, Math.abs(s)); return e; };
  assert.ok(lvl(true) > lvl(false) * 1.2);
});
test('closed hat chokes the open hat; DIN sync follows the song position', () => {
  const u = new TR808(fs); u.trig('OH'); run(u, 0.05); u.trig('CH'); run(u, 0.1); assert.equal(u.v.OH.on, false);
  const s = new TR808(fs).set({ sync: 'din' }); s.patterns[0].A.steps.BD[8] = 1; s.sync = { run: true, beats: 1.9, bpm: 100 };
  const fired = []; const o = s.trig.bind(s); s.trig = (k, a) => { fired.push(k); o(k, a); };
  const L = new Float32Array(128); for (let i = 0; i < 0.3 * fs / 128; i++) { s.sync = { run: true, beats: 1.9 + i * 128 / fs * 100 / 60, bpm: 100 }; s.process(L, L, 128); }
  assert.ok(fired.includes('BD'), 'step 9 (beat 3) fires as the song passes beat 2'); assert.equal(s.p.tempo, 100);
  s.sync = { run: false }; run(s, 0.01); assert.equal(s.run, false);
});
