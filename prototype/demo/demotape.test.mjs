import test from 'node:test';
import assert from 'node:assert/strict';
import { demoTape } from './demotape.js';
import { encode, decode, tcString } from '../sync/ltc.js';
const fs = 48000, d = demoTape(fs, encode);
test('one minute, 8 music tracks + SMPTE on 24, levels near 0 VU and no clipping', () => {
  for (let i = 0; i < 24; i++) {
    const x = d.tracks[i];
    if (i < 8 || i === 23) { assert.equal(x.length, 60 * fs); let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); assert.ok(pk > 0.05 && pk < 0.99, `track ${i + 1} peak ${pk}`); }
    else assert.equal(x, null);
  }
});
test('track 24 decodes as 30 fps SMPTE from 01:00:00:00', () => {
  const r = decode(d.tracks[23], fs);
  assert.equal(r.fps, 30);
  // the decoder locks on the first or second frame; frame n (from 01:00:00:00) ends at (n + 1) / 30 s on the tape
  const f0 = r.frames[0], n = f0.tc.f; assert.equal(tcString(f0.tc).slice(0, 9), '01:00:00:'); assert.ok(n <= 1);
  assert.ok(Math.abs(f0.sample / fs - (n + 1) / 30) < 0.001, `frame ${n} ends at ${(f0.sample / fs).toFixed(4)} s`);
  assert.ok(r.frames.length > 60 * 30 - 5);
});
