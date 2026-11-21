import test from 'node:test';
import assert from 'node:assert/strict';
import { SPX90 } from './spx90.js';

const fs = 48000;
const run = (u, x) => { const L = new Float32Array(x.length), R = new Float32Array(x.length); for (let i = 0; i < x.length; i += 128) u.process(x.subarray(i, i + 128), L.subarray(i, i + 128), R.subarray(i, i + 128), Math.min(128, x.length - i)); return [L, R]; };
const sine = (f, sec, a = 0.5) => Float32Array.from({ length: Math.round(sec * fs) }, (_, k) => a * Math.sin(2 * Math.PI * f * k / fs));
const rmsDb = (y, a, b) => { let s = 0; for (let k = a; k < b; k++) s += y[k] * y[k]; return 10 * Math.log10(s / (b - a) + 1e-20); };
const freq = (y, a, b) => { let z = 0; for (let k = a + 1; k < b; k++) if (y[k - 1] < 0 && y[k] >= 0) z++; return z / ((b - a) / fs); };

test('reverb decays at the set time (−60 dB over RT) and is stereo', () => {
  const u = new SPX90(fs).set({ algo: 'reverb', rt: 2, hf: 1, pre: 10, mix: 1 });
  const x = new Float32Array(4 * fs); x.set(sine(500, 0.3).map((v, k) => v * (Math.random() * 2 - 1)), 0);
  const [L, R] = run(u, x); const a = rmsDb(L, 0.6 * fs, 0.8 * fs), b = rmsDb(L, 1.6 * fs, 1.8 * fs);
  const rt = 60 / ((a - b) / 1.0);
  assert.ok(rt > 1.4 && rt < 2.8, `measured RT ${rt.toFixed(2)} s`);
  let diff = 0; for (let k = fs; k < 1.2 * fs; k++) diff += Math.abs(L[k] - R[k]); assert.ok(diff > 1, 'decorrelated left / right');
});
test('delay L,R: each side repeats at its own time, feedback repeats again', () => {
  const u = new SPX90(fs).set({ algo: 'delay', dl: 100, dr: 150, fb: 0.5, hd: 1, mix: 1 }); const x = new Float32Array(fs); x[0] = 1;
  const [L, R] = run(u, x); const pk = (y, a, b) => { let m = 0, i = 0; for (let k = a; k < b; k++) if (Math.abs(y[k]) > m) { m = Math.abs(y[k]); i = k; } return i / fs * 1000; };
  assert.ok(Math.abs(pk(L, 10, 0.13 * fs) - 100) < 1 && Math.abs(pk(R, 10, 0.2 * fs) - 150) < 1 && Math.abs(pk(L, 0.15 * fs, 0.25 * fs) - 200) < 2, 'taps at 100 / 150 / 200 ms');
});
test('chorus / flange modulate, tremolo and pan move the level, pitch change shifts', () => {
  const ch = new SPX90(fs).set({ algo: 'mod', kind: 'chorus', f: 1, depth: 1, mix: 1 }); const [cl] = run(ch, sine(1000, 1));
  const f1 = freq(cl, 0.1 * fs, 0.35 * fs), f2 = freq(cl, 0.6 * fs, 0.85 * fs); assert.ok(Math.abs(f1 - f2) > 2, `chorus detunes: ${f1.toFixed(1)} vs ${f2.toFixed(1)} Hz`);
  const tr = new SPX90(fs).set({ algo: 'trem', f: 2, depth: 1, pan: true, mix: 1 }); const [tl, trr] = run(tr, sine(500, 1));
  assert.ok(Math.abs(rmsDb(tl, 0.1 * fs, 0.2 * fs) - rmsDb(trr, 0.1 * fs, 0.2 * fs)) > 3, 'auto-pan moves between sides');
  const pc = new SPX90(fs).set({ algo: 'pitch', l: 12, r: -12, mix: 1 }); const [pl, pr] = run(pc, sine(300, 1));
  assert.ok(Math.abs(freq(pl, 0.3 * fs, fs) / 600 - 1) < 0.04 && Math.abs(freq(pr, 0.3 * fs, fs) / 150 - 1) < 0.04, 'octave up left, octave down right');
});
test('noise gate closes below the threshold; compressor reduces the level', () => {
  const g = new SPX90(fs).set({ algo: 'gate', thr: -30, rel: 50 }); const x = new Float32Array(fs); x.set(sine(200, 0.3), 0); x.set(sine(200, 0.5, 0.001), 0.4 * fs);
  const [gl] = run(g, x); assert.ok(rmsDb(gl, 0.7 * fs, 0.9 * fs) < -80, 'quiet signal gated');
  const c = new SPX90(fs).set({ algo: 'comp', thr: -30, ratio: 10, att: 1, rel: 50 }); const [cl] = run(c, sine(200, 1, 0.5));
  assert.ok(rmsDb(cl, 0.5 * fs, fs) < -20, `compressed to ${rmsDb(cl, 0.5 * fs, fs).toFixed(1)} dB`);
});
