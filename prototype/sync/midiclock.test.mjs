import test from 'node:test';
import assert from 'node:assert/strict';
import { ClockOut } from './midiclock.js';

const run = (fn) => { const ev = []; const c = new ClockOut((b, t) => ev.push({ b, t })); fn(c, ev); return ev; };

test('steady 24 ppq at 120 BPM from a running tape (frame-rate updates, jittery 60 fps)', () => {
  const ev = run((c) => { let beats = 8; for (let now = 0, k = 0; now < 4000; k++) { const dt = 1000 / 60 + ((k * 37) % 7 - 3); now += dt; beats += dt / 1000 * 2; c.update(now, { running: true, beats, qps: 2 }); } });
  const ticks = ev.filter((e) => e.b[0] === 0xF8).map((e) => e.t);
  const gaps = ticks.slice(1).map((t, i) => t - ticks[i]);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length, jitter = Math.max(...gaps.map((g) => Math.abs(g - mean)));
  assert.ok(Math.abs(mean - 1000 / 48) < 0.2, `mean gap ${mean.toFixed(3)} ms (expect 20.833)`);
  assert.ok(jitter < 0.6, `jitter ${jitter.toFixed(3)} ms`);
  assert.deepEqual(ev[0].b, [0xF2, 32, 0], 'song position = bar 3 (32 sixteenths)'); assert.deepEqual(ev[1].b, [0xFB]);
});

test('starts with Start at bar 1, stops with Stop when code is lost', () => {
  const ev = run((c) => { c.update(0, { running: true, beats: 0, qps: 2 }); c.update(500, { running: false, beats: 1, qps: 2 }); });
  assert.deepEqual(ev[0].b, [0xFA]); assert.deepEqual(ev[ev.length - 1].b, [0xFC]);
});

test('a locate re-cues with a new song position', () => {
  const ev = run((c) => { let now = 0; for (; now < 1000; now += 16) c.update(now, { running: true, beats: 4 + now / 500, qps: 2 }); c.update(now, { running: true, beats: 40, qps: 2 }); });
  const spps = ev.filter((e) => e.b[0] === 0xF2);
  assert.equal(spps.length, 2); assert.deepEqual(spps[1].b, [0xF2, 160, 0].map((v, i) => (i === 1 ? 160 & 0x7f : i === 2 ? 160 >> 7 : v)));
});

test('follows vari-speed (tape 5 % fast) without drifting', () => {
  const ev = run((c) => { let beats = 4; for (let now = 0; now < 8000; now += 16) { beats += 0.016 * 2 * 1.05; c.update(now, { running: true, beats, qps: 2 * 1.05 }); } });
  const ticks = ev.filter((e) => e.b[0] === 0xF8).length;
  assert.ok(Math.abs(ticks - 8 * 2 * 1.05 * 24) < 4, `ticks ${ticks}`);
});
