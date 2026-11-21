import test from 'node:test';
import assert from 'node:assert/strict';
import { H949Unit, h949Ratio } from './h949.js';

const fs = 48000;
const run = (u, x) => { const L = new Float32Array(x.length), R = new Float32Array(x.length); for (let i = 0; i < x.length; i += 128) u.process(x.subarray(i, i + 128), L.subarray(i, i + 128), R.subarray(i, i + 128), Math.min(128, x.length - i)); return [L, R]; };
const sine = (f, sec, a = 0.4) => Float32Array.from({ length: Math.round(sec * fs) }, (_, k) => a * Math.sin(2 * Math.PI * f * k / fs));
const freq = (y, a, b) => { let z = 0; for (let k = a + 1; k < b; k++) if (y[k - 1] < 0 && y[k] >= 0) z++; return z / ((b - a) / fs); };
// the strongest frequency (a scan of single-bin DFTs around the expected pitch): robust to the crossfade's warble
const peak = (y, a, b, f0) => { let best = 0, bf = 0; for (let f = f0 * 0.8; f <= f0 * 1.2; f += 0.5) { let re = 0, im = 0; for (let k = a; k < b; k += 2) { const ph = 2 * Math.PI * f * k / fs; re += y[k] * Math.cos(ph); im += y[k] * Math.sin(ph); } const m = re * re + im * im; if (m > best) { best = m; bf = f; } } return bf; };

test('pitch change: both algorithms follow the ratio (octave up, fifth down)', () => {
  for (const alg of [1, 2]) for (const r of [2, 0.667]) {
    const u = new H949Unit(fs).set({ func: 'norm', alg, ratio: r }); const [L] = run(u, sine(220, 1.2));
    const f = peak(L, 0.3 * fs, 1.2 * fs, 220 * r); assert.ok(Math.abs(f / 220 / r - 1) < (alg === 1 ? 0.06 : 0.01), `alg ${alg} ratio ${r}: ${f.toFixed(1)} Hz`);   // algorithm 1 splits a pure tone into sidebands either side (its blind crossfade)
  }
});
test('the delay keys add up: DELAY ONLY 6.25 + 50 ms; MAIN in DELAY mode', () => {
  const u = new H949Unit(fs).set({ func: 'delay', mainMs: 100, dlyMs: 56.25 }); const x = new Float32Array(0.4 * fs); x[100] = 0.8;
  const [L, R] = run(u, x); const pk = (y) => { let m = 0, i = 0; for (let k = 0; k < y.length; k++) if (Math.abs(y[k]) > m) { m = Math.abs(y[k]); i = k; } return (i - 100) / fs * 1000; };
  assert.ok(Math.abs(pk(L) - 100) < 1.5 && Math.abs(pk(R) - 56.25) < 1.5, `main ${pk(L).toFixed(2)} ms, delay only ${pk(R).toFixed(2)} ms`);
});
test('µPC fine ratios, the MANUAL knob maps, REPEAT holds the sound after the input stops', () => {
  assert.ok(Math.abs(h949Ratio('sharp', 1) - 1.07) < 1e-9 && Math.abs(h949Ratio('flat', 1) - 0.93) < 1e-9 && Math.abs(h949Ratio('norm', 1) - 2) < 1e-9 && Math.abs(h949Ratio('norm', 0) - 0.25) < 1e-9);
  const u = new H949Unit(fs).set({ func: 'delay', mainMs: 50 }); run(u, sine(300, 0.6)); u.set({ repeat: true });
  const [L] = run(u, new Float32Array(fs)); let e = 0; for (let k = 0.5 * fs; k < fs; k++) e = Math.max(e, Math.abs(L[k]));
  assert.ok(e > 0.2, `still playing the frozen memory: ${e.toFixed(2)}`);
});
test('flange and random move the delay; reverse plays segments backwards; LINE bypasses', () => {
  const fl = new H949Unit(fs).set({ func: 'flange', rate: 0.5 }); const [a] = run(fl, sine(1000, 1)); assert.ok(Number.isFinite(a[1000]));
  const rv = new H949Unit(fs).set({ func: 'reverse', mainMs: 100 }); const ramp = Float32Array.from({ length: 0.3 * fs }, (_, k) => ((k % (0.1 * fs)) / (0.1 * fs)) * 0.5);
  const [rl] = run(rv, ramp); let down = 0, up = 0; for (let k = 0.15 * fs; k < 0.29 * fs; k++) { if (rl[k] < rl[k - 1] - 1e-6) down++; else if (rl[k] > rl[k - 1] + 1e-6) up++; } assert.ok(down > up, `mostly falling while the input rises (${down} vs ${up})`);
  const ln = new H949Unit(fs).set({ line: true }); const x = sine(500, 0.1), [ll] = run(ln, x); assert.ok(Math.abs(ll[500] - x[500]) < 1e-9, 'line bypass');
});
