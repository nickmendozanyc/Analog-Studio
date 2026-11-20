import test from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, codeAt, tcToSeconds, framesToTc, tcToFrames, tcString } from './ltc.js';

const SR = 48000;
const noise = (x, amt) => { let s = 7; for (let i = 0; i < x.length; i++) { s = (s * 16807) % 2147483647; x[i] += (s / 2147483647 - 0.5) * amt; } return x; };

test('30 fps non-drop: every frame decoded in order', () => {
  const x = encode({ start: { h: 1, m: 0, s: 0, f: 0 }, seconds: 10, fps: 30, sampleRate: SR });
  const r = decode(x, SR);
  assert.equal(r.fps, 30); assert.equal(r.df, false);
  assert.ok(r.frames.length >= 298, `frames ${r.frames.length}`);
  assert.ok(['01:00:00:00', '01:00:00:01'].includes(tcString(r.frames[0].tc)), 'locks on the first or second frame');
  for (let i = 1; i < r.frames.length; i++) assert.equal(tcToFrames(r.frames[i].tc, 30) - tcToFrames(r.frames[i - 1].tc, 30), 1);
  assert.equal(r.segments.length, 1);
});

test('25 fps and 24 fps are detected', () => {
  for (const fps of [25, 24]) {
    const r = decode(encode({ start: { h: 0, m: 59, s: 50, f: 0 }, seconds: 4, fps, sampleRate: SR }), SR);
    assert.equal(r.fps, fps, `fps ${fps}`);
  }
});

test('29.97 drop-frame across a minute boundary', () => {
  const x = encode({ start: { h: 0, m: 0, s: 58, f: 0 }, seconds: 4, fps: 30, df: true, sampleRate: SR });
  const r = decode(x, SR);
  assert.equal(r.df, true); assert.equal(r.fps, 29.97);
  const names = r.frames.map((f) => tcString(f.tc, true));
  assert.ok(names.includes('00:00:59;29') && names.includes('00:01:00;02') && !names.includes('00:01:00;00'), 'frames 00 and 01 dropped at the minute');
});

test('noisy, 8 % fast transfer with wow still decodes and reports the speed', () => {
  const x = noise(encode({ start: { h: 10, m: 0, s: 0, f: 0 }, seconds: 8, fps: 30, sampleRate: SR, speed: 1.08, level: 0.4 }), 0.25);
  const r = decode(x, SR);
  assert.ok(r.frames.length >= 230, `frames ${r.frames.length}`);
  assert.equal(r.segments.length, 1);
  assert.ok(Math.abs(r.segments[0].speed - 1.08) < 0.01, `speed ${r.segments[0].speed}`);
});

test('a dropout is bridged: code continues on the far side', () => {
  const x = encode({ start: { h: 1, m: 0, s: 0, f: 0 }, seconds: 6, fps: 30, sampleRate: SR });
  for (let i = 2 * SR; i < 2.1 * SR; i++) x[i] = 0;   // 100 ms of nothing
  const r = decode(x, SR);
  assert.ok(r.dropouts >= 1);
  const c = codeAt(r.segments, 4.0);
  assert.ok(Math.abs(c - (3600 + 4.0)) < 0.05, `code at 4 s = ${c}`);
});

test('reverse (rewinding) code is read with direction -1', () => {
  const x = encode({ start: { h: 1, m: 0, s: 10, f: 0 }, seconds: 3, fps: 30, sampleRate: SR }).reverse();
  const r = decode(x, SR);
  assert.ok(r.frames.length > 60, `frames ${r.frames.length}`);
  assert.ok(r.frames.every((f) => f.dir === -1));
  assert.ok(tcToSeconds(r.frames[0].tc, 30) > tcToSeconds(r.frames[r.frames.length - 1].tc, 30), 'code runs backwards');
});

test('codeAt maps file time to SMPTE time', () => {
  const r = decode(encode({ start: { h: 0, m: 0, s: 2, f: 0 }, seconds: 10, fps: 30, sampleRate: SR }), SR);
  assert.ok(Math.abs(codeAt(r.segments, 5) - 7) < 0.04, `${codeAt(r.segments, 5)}`);
  assert.equal(codeAt(r.segments, 30), null, 'no code past the end');
});

test('drop-frame frame counting round-trips', () => {
  for (const n of [0, 1799, 1800, 17981, 17982, 107892]) assert.equal(tcToFrames(framesToTc(n, 29.97, true), 29.97, true), n);
});
