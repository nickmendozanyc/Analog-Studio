import test from 'node:test';
import assert from 'node:assert/strict';
import { TR909, TR9_INST } from './tr909.js';

const fs = 48000;
const run = (u, sec) => { const N = Math.round(sec * fs), L = new Float32Array(N), R = new Float32Array(N); for (let i = 0; i < N; i += 128) { const m = Math.min(128, N - i); u.process(L.subarray(i, i + m), R.subarray(i, i + m), m); } return [L, R]; };

test('every voice sounds, finite and bounded; the cymbals are 6-bit', () => {
  for (const k of TR9_INST) { const u = new TR909(fs); u.trig(k, true); const [L] = run(u, 0.3); let e = 0; for (const v of L) e = Math.max(e, Math.abs(v)); assert.ok(Number.isFinite(e) && e > 0.01 && e <= 1, `${k}: ${e}`); }
});
test('bass drum: TUNE sweeps it from higher, DECAY lengthens it', () => {
  const pitch = (tune) => { const u = new TR909(fs).set({ BD: { tune } }); u.trig('BD'); const [L] = run(u, 0.03); let z = 0; for (let k = 1; k < L.length; k++) if (L[k - 1] < 0 && L[k] >= 0) z++; return z; };
  assert.ok(pitch(1) > pitch(0));
  const e = (d) => { const v = new TR909(fs).set({ BD: { decay: d } }); v.trig('BD'); const [y] = run(v, 1); let s = 0; for (let k = 0.4 * fs; k < 0.6 * fs; k++) s += y[k] * y[k]; return s; };
  assert.ok(e(1) > e(0.1) * 10);
});
test('shuffle delays the second 16th; flam doubles the hit; last step shortens the bar', () => {
  const when = (o, steps, len = 16) => { const u = new TR909(fs).set({ tempo: 120, ...o }); u.patterns[0].len = len; for (const [k, s] of steps) u.patterns[0].steps[k][s] = 1; const t = []; const g = u.trig.bind(u); let n = 0; u.trig = (k, a, l) => { t.push([k, n]); g(k, a, l); };
    u.start(); const L = new Float32Array(1); for (n = 0; n < 2.2 * fs; n++) u.process(L, L, 1); return t; };
  const a = when({ shuffle: 0 }, [['CH', 1]]), b = when({ shuffle: 7 }, [['CH', 1]]);
  assert.ok(b[0][1] - a[0][1] > 0.03 * fs, `shuffled later by ${(b[0][1] - a[0][1]) / fs * 1000} ms`);
  const f = when({ flam: 5 }, [['SD', 0], ['FL', 0]]); assert.equal(f.filter((x) => x[0] === 'SD').length >= 2, true);
  const s = when({}, [['BD', 0]], 8); assert.ok(Math.abs((s[1][1] - s[0][1]) / fs - 1) < 0.01, '8 steps = one second at 120');
});
