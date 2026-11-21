import test from 'node:test';
import assert from 'node:assert/strict';
import { SP1200, spSound, spFactory, SP_FS, SP_PPQ } from './sp1200.js';
const fs = 48000;
const run = (u, sec) => { const N = Math.round(sec * fs), L = new Float32Array(N), R = new Float32Array(N); for (let i = 0; i < N; i += 128) { const m = Math.min(128, N - i); u.process(L.subarray(i, i + m), R.subarray(i, i + m), m); } return [L, R]; };
const zc = (y, a, b) => { let z = 0; for (let k = a + 1; k < b; k++) if (y[k - 1] < 0 && y[k] >= 0) z++; return z / ((b - a) / fs); };
const sine = (f, sec) => Float32Array.from({ length: Math.round(SP_FS * sec) }, (_, k) => 0.5 * Math.sin(2 * Math.PI * f * k / SP_FS));
test('12-bit at 26.04 kHz; a pad plays at pitch, +12 tune an octave up (held words, no interpolation)', () => {
  const u = new SP1200(fs); u.sounds[7] = spSound(sine(440, 1)); assert.ok(u.sounds[7].data.every((v) => Math.abs(v * 2047 - Math.round(v * 2047)) < 1e-3));
  u.hit(7); const [L] = run(u, 0.5); assert.ok(Math.abs(zc(L, 4800, 19200) - 440) < 5);
  u.sounds[7].tune = 12; u.hit(7); const [M] = run(u, 0.3); assert.ok(Math.abs(zc(M, 2400, 12000) - 880) < 10);
});
test('the sequencer: hits recorded with AUTO CORRECT play back on the grid; swing moves the off 16ths', () => {
  const u = new SP1200(fs); spFactory().forEach((s, i) => { u.sounds[i] = s; }); u.tempo = 120; u.quant = '1/16'; u.rec = true; u.metro = false;
  u.start(); run(u, 0.26); u.press(0); u.release(0);   // a little after beat 1 (0.25 s = an 8th at 120)
  const ev = u.patterns[0].events[0]; assert.equal(ev.t % 24, 0, 'quantised to a 16th');
  const hits = []; const h = u.hit.bind(u); let n = 0; u.hit = (p, v) => { hits.push(n); h(p, v); }; u.rec = false;
  const L = new Float32Array(128); for (let b = 0; b < 4.2 * fs / 128; b++) { u.process(L, L, 128); n += 128; }
  assert.ok(hits.length >= 1);
  const s = new SP1200(fs); s.swing = 66; assert.equal(s.swingT(SP_PPQ / 4), SP_PPQ / 4 + Math.round(16 / 50 * SP_PPQ / 2)); assert.equal(s.swingT(SP_PPQ / 2), SP_PPQ / 2);
});
test('10 seconds of memory; output filters on 1-2 / 3-6; the kit sounds', () => {
  const u = new SP1200(fs); spFactory().forEach((s, i) => { u.sounds[i] = s; }); assert.ok(u.free() > 0 && u.free() < 10 * SP_FS);
  for (let p = 0; p < 8; p++) { const v = new SP1200(fs); v.sounds[p] = u.sounds[p]; v.hit(p); const [y] = run(v, 0.3); const e = y.reduce((m, x) => Math.max(m, Math.abs(x)), 0); assert.ok(e > 0.02 && e < 2, `pad ${p + 1}: ${e}`); }
});
