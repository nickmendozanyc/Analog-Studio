import test from 'node:test';
import assert from 'node:assert/strict';
import { PCM4x } from './pcm4x.js';

const fs = 48000;
const run = (u, x) => { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i += 128) u.process(x.subarray(i, i + 128), y.subarray(i, i + 128), Math.min(128, x.length - i)); return y; };
const imp = (sec, at = 100, a = 0.5) => { const x = new Float32Array(sec * fs); for (let k = 0; k < 24; k++) x[at + k] = a * Math.sin(Math.PI * k / 24); return x; };
const peakAt = (y, from = 0) => { let m = 0, i = 0; for (let k = from; k < y.length; k++) if (Math.abs(y[k]) > m) { m = Math.abs(y[k]); i = k; } return [i, m]; };
const sine = (f, sec, a = 0.3) => Float32Array.from({ length: Math.round(sec * fs) }, (_, k) => a * Math.sin(2 * Math.PI * f * k / fs));
const freq = (y, a, b) => { let z = 0; for (let k = a + 1; k < b; k++) if (y[k - 1] < 0 && y[k] >= 0) z++; return z / ((b - a) / fs); };

test('PCM41 taps: 100 ms at X1, doubled by DLY X2, and the Delay Multiply knob scales 0.5x .. 2x', () => {
  const ms = (o) => { const u = new PCM4x(fs, 41).set({ mix: 1, ...o }); const [i] = peakAt(run(u, imp(1.2))); return (i - 112) / fs * 1000; };
  const a = ms({ tap: 9 }), b = ms({ tap: 9, x2: true }), c = ms({ tap: 9, mult: 0 }), d = ms({ tap: 9, mult: 1 });
  assert.ok(Math.abs(a - 100) < 2, `X1 ${a.toFixed(1)} ms`); assert.ok(Math.abs(b - 200) < 3, `X2 ${b.toFixed(1)} ms`);
  assert.ok(Math.abs(c - 50) < 2 && Math.abs(d - 200) < 3, `multiply ${c.toFixed(1)} / ${d.toFixed(1)} ms`);
});
test('PCM42: 256 taps over 800 ms; the display reads the live delay; MANUAL scales it 3:1', () => {
  const u = new PCM4x(fs, 42).set({ mix: 1, tap: 128 }); const [i] = peakAt(run(u, imp(1)));
  assert.ok(Math.abs((i - 112) / fs * 1000 - 400) < 3, `tap 128: ${((i - 112) / fs * 1000).toFixed(1)} ms`);
  assert.ok(Math.abs(u.meters().ms - 400) < 1);
  u.set({ mult: 1 }); run(u, new Float32Array(256)); assert.ok(Math.abs(u.meters().ms - 600) < 1);
  u.set({ mult: 0 }); run(u, new Float32Array(256)); assert.ok(Math.abs(u.meters().ms - 200) < 1);
});
test('feedback repeats decay; INV flips the repeats; mix at INPUT is dry; bypass passes the dry signal', () => {
  const u = new PCM4x(fs, 41).set({ mix: 1, tap: 8, fb: 10 }); const y = run(u, imp(0.5));   // 50 ms
  const at = (ms) => { let m = 0, s = 0; const c = Math.round(112 + ms * fs / 1000); for (let k = c - 40; k < c + 40; k++) if (Math.abs(y[k]) > m) { m = Math.abs(y[k]); s = Math.sign(y[k]); } return m * s; };
  const r1 = at(50), r2 = at(100), r3 = at(150); assert.ok(r1 > 0.1 && r2 > 0.3 * r1 && r2 < r1 && r3 < r2, `${r1} ${r2} ${r3}`);
  const v = new PCM4x(fs, 41).set({ mix: 1, tap: 8, fb: 10, fbInv: true }); const z = run(v, imp(0.5));
  let s2 = 0; { const c = Math.round(112 + 100 * fs / 1000); let m = 0; for (let k = c - 40; k < c + 40; k++) if (Math.abs(z[k]) > m) { m = Math.abs(z[k]); s2 = Math.sign(z[k]); } }
  assert.equal(s2, -1, 'second repeat inverted');
  const x = sine(500, 0.2), d = run(new PCM4x(fs, 41).set({ mix: 0, tap: 8 }), x); assert.ok(Math.abs(d[5000] - x[5000]) < 1e-6);
  const b = run(new PCM4x(fs, 42).set({ mix: 1, byp: true }), x); assert.ok(Math.abs(b[5000] - x[5000]) < 1e-6);
});
test('the sweep is a sample-rate change: a sine LFO bends the pitch of the delayed tone', () => {
  const u = new PCM4x(fs, 41).set({ mix: 1, tap: 6, depth: 10, wave: 0, rate: 0.5 }); const y = run(u, sine(1000, 2));   // 1 Hz, full depth
  const fr = []; for (let t = 0.2; t < 1.9; t += 0.05) fr.push(freq(y, Math.round(t * fs), Math.round((t + 0.05) * fs)));
  const lo = Math.min(...fr), hi = Math.max(...fr); assert.ok(hi > 1030 && lo < 970, `pitch swings ${lo.toFixed(0)} .. ${hi.toFixed(0)} Hz`);
});
test('REPEAT (41) and inf RPT (42, on the next clock edge) hold the memory after the input stops', () => {
  const u = new PCM4x(fs, 41).set({ mix: 1, tap: 10 }); run(u, sine(300, 0.5)); u.set({ rpt: true });
  const y = run(u, new Float32Array(fs)); assert.ok(peakAt(y, fs / 2)[1] > 0.1, 'PCM41 loops');
  const v = new PCM4x(fs, 42).set({ mix: 1, tap: 255, clkN: 0, clkD: 1 }); run(v, sine(300, 1)); v.set({ rpt: true });
  const z = run(v, sine(300, 0.45)); assert.equal(v.meters().inf, true, 'latched on the clock edge');
  const q = run(v, new Float32Array(2 * fs)); assert.ok(peakAt(q, fs)[1] > 0.1, 'PCM42 loops');
  void z;
});
test('converter: LEVEL drives the headroom meter; the 41 clips hard, the 42 limits softly', () => {
  const lo = new PCM4x(fs, 41).set({ level: 3 }), hi = new PCM4x(fs, 41).set({ level: 10 }); run(lo, sine(1000, 0.2)); run(hi, sine(1000, 0.2));
  assert.ok(hi.meters().peakDb > lo.meters().peakDb + 20);
  const c = new PCM4x(fs, 41).set({ level: 10, mix: 1, tap: 1 }), l = new PCM4x(fs, 42).set({ level: 10, mix: 1, tap: 1 });
  const yc = run(c, sine(200, 0.3, 0.6)), yl = run(l, sine(200, 0.3, 0.6));
  for (const y of [yc, yl]) assert.ok(y.every(Number.isFinite));
  const flat = (y) => { let f = 0; for (let k = 6000; k < 14000; k++) if (Math.abs(y[k] - y[k - 1]) < 1e-5 && Math.abs(y[k]) > 0.01) f++; return f; };
  assert.ok(flat(yc) > flat(yl), `41 flat-tops ${flat(yc)} vs 42 ${flat(yl)}`);
});
