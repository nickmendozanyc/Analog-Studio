import test from 'node:test';
import assert from 'node:assert/strict';
import { IM90Channel } from './im90.js';

const fs = 48000;
const sine = (f, sec, a = 0.5) => Float32Array.from({ length: Math.round(sec * fs) }, (_, k) => a * Math.sin(2 * Math.PI * f * k / fs));
const run = (ch, x) => { const y = new Float32Array(x.length); for (let i = 0; i < x.length; i += 128) ch.process(x.subarray(i, i + 128), y.subarray(i, i + 128), Math.min(128, x.length - i)); return y; };
// frequency by zero crossings over a stretch
const freq = (y, a, b) => { let z = 0; for (let k = a + 1; k < b; k++) if (y[k - 1] < 0 && y[k] >= 0) z++; return z / ((b - a) / fs); };

test('delay: an impulse comes back after the set time, echoes fall by the feedback', () => {
  const ch = new IM90Channel(fs).set({ mode: 'delay', delay: 0.1, feedback: 0.5 });
  const x = new Float32Array(fs); x[0] = 1; const y = run(ch, x);
  const peak = (a, b) => { let m = 0, i = a; for (let k = a; k < b; k++) if (Math.abs(y[k]) > m) { m = Math.abs(y[k]); i = k; } return [i, m]; };
  const [i1, m1] = peak(1, 0.15 * fs), [i2, m2] = peak(0.15 * fs, 0.25 * fs);
  assert.ok(Math.abs(i1 - 0.1 * fs) < 6, `first echo at ${(i1 / fs * 1000).toFixed(2)} ms`);
  assert.ok(Math.abs(m2 / m1 - 0.5) < 0.08, `second echo ${(m2 / m1).toFixed(2)} of the first`);
});
test('pitch shift: an octave up doubles the frequency, a fifth down follows the ratio, and the level holds', () => {
  for (const r of [2, 0.667, 1.26]) {
    const ch = new IM90Channel(fs).set({ mode: 'pitch', ratio: r }), y = run(ch, sine(220, 1.5));
    const f = freq(y, 0.3 * fs, 1.5 * fs);
    assert.ok(Math.abs(f / 220 - r) < 0.03 * r, `ratio ${r}: ${f.toFixed(1)} Hz (${(f / 220).toFixed(3)})`);
    let p = 0; for (let k = 0.3 * fs; k < 1.5 * fs; k++) p += y[k] * y[k]; const rms = Math.sqrt(p / (1.2 * fs));
    assert.ok(rms > 0.28 && rms < 0.42, `ratio ${r}: rms ${rms.toFixed(3)}`);
  }
});
test('sampling: arms, starts recording when the input arrives, plays it back the same', () => {
  const ch = new IM90Channel(fs).set({ mode: 'sample' }); ch.arm();
  const x = new Float32Array(fs); x.set(sine(330, 0.5), 0.2 * fs);   // silence, then a phrase
  run(ch, x); ch.stop();
  assert.ok(Math.abs(ch.smp.len - 0.8 * fs) < 0.01 * fs, `recorded ${(ch.smp.len / fs).toFixed(3)} s from the attack`);
  ch.setSample({ mode: 'aux' }); ch.play(); const y = run(ch, new Float32Array(0.4 * fs));
  assert.ok(Math.abs(freq(y, 0.05 * fs, 0.35 * fs) - 330) < 5, 'plays back the phrase');
});
test('reverse (start after end), varispeed, and a seamless loop', () => {
  const ch = new IM90Channel(fs).set({ mode: 'sample' }); ch.arm(); run(ch, sine(200, 0.5)); ch.stop();
  ch.setSample({ mode: 'aux', start: ch.smp.len - 1, end: 0, speed: 1.5 }); ch.play();
  const y = run(ch, new Float32Array(0.3 * fs));
  assert.ok(ch.smp.dir === -1 && Math.abs(freq(y, 0.02 * fs, 0.25 * fs) - 300) < 6, 'reversed at 1.5x speed: 300 Hz');
  const L = new IM90Channel(fs).set({ mode: 'sample' }); L.arm(); run(L, sine(250, 0.3)); L.stop(); L.setSample({ mode: 'loop' }); L.play();
  const z = run(L, new Float32Array(fs)); let jump = 0; for (let k = 0.05 * fs; k < fs; k++) jump = Math.max(jump, Math.abs(z[k] - z[k - 1]));
  assert.ok(L.smp.pos >= 0 && jump < 0.06, `loops for a second without a click (largest step ${jump.toFixed(3)})`);
});
test('retrigger from the input: each new attack restarts the sample', () => {
  const ch = new IM90Channel(fs).set({ mode: 'sample' }); ch.arm(); run(ch, sine(440, 0.2)); ch.stop(); ch.setSample({ mode: 'trig' });
  const x = new Float32Array(fs); x.set(sine(100, 0.05, 0.3), 0.1 * fs); x.set(sine(100, 0.05, 0.3), 0.6 * fs);
  const y = run(ch, x); const on = (a, b) => { let m = 0; for (let k = a; k < b; k++) m = Math.max(m, Math.abs(y[k])); return m; };
  assert.ok(on(0.12 * fs, 0.28 * fs) > 0.3 && on(0.35 * fs, 0.55 * fs) < 0.02 && on(0.62 * fs, 0.78 * fs) > 0.3, 'fires on each attack');
});

test('arpeggio: the shifted output fed back through the added delay climbs a step per repeat', () => {
  const ch = new IM90Channel(fs).set({ mode: 'pitch', ratio: 1.122, pdel: 0.1, arp: 0.8 });
  const x = new Float32Array(1.2 * fs); x.set(sine(200, 0.08), 0);
  const y = run(ch, x); const f1 = freq(y, 0.125 * fs, 0.175 * fs), f2 = freq(y, 0.23 * fs, 0.28 * fs);   // repeats every ~100 ms (the added delay)
  assert.ok(Math.abs(f1 / 200 - 1.122) < 0.05 && Math.abs(f2 / f1 - 1.122) < 0.06, `repeats at ${f1.toFixed(0)} then ${f2.toFixed(0)} Hz`);
});
test('gains, attack ramp and recording started by input B', () => {
  const ch = new IM90Channel(fs).set({ mode: 'sample', direct: 0.5, wet: 0 }); const x = sine(300, 0.2), y = run(ch, x);
  assert.ok(Math.abs(y[1000] - 0.5 * x[1000]) < 1e-6, 'direct level');
  const s = new IM90Channel(fs).set({ mode: 'sample' }); s.arm('B'); const a = sine(300, 0.3), b = new Float32Array(a.length); b.fill(0.2, 0.1 * fs);
  const out = new Float32Array(a.length); for (let i = 0; i < a.length; i += 128) s.process(a.subarray(i, i + 128), out.subarray(i, i + 128), Math.min(128, a.length - i), b.subarray(i, i + 128));
  s.stop(); assert.ok(Math.abs(s.smp.len - 0.2 * fs) < 200, `recording began with input B: ${(s.smp.len / fs).toFixed(3)} s`);
  s.setSample({ mode: 'aux', attack: 0.05 }); s.play(); const z = run(s, new Float32Array(0.1 * fs));
  let e1 = 0, e2 = 0; for (let k = 0; k < 200; k++) e1 = Math.max(e1, Math.abs(z[k])); for (let k = 0.06 * fs; k < 0.06 * fs + 400; k++) e2 = Math.max(e2, Math.abs(z[k]));
  assert.ok(e1 < 0.1 && e2 > 0.4, `attack ramp: ${e1.toFixed(2)} at the start, ${e2.toFixed(2)} after 60 ms`);
});
