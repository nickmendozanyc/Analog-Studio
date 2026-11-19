import test from 'node:test';
import assert from 'node:assert/strict';
import { Transport, TAPE, MACHINE, IPS, FT, ROLL_FT, packRadius, capacity } from './physics.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);

test('pack radius grows with the square root of tape length', () => {
  close(packRadius(0), TAPE.hubR, 1e-12, 'empty hub');
  const r = packRadius(ROLL_FT * FT);
  assert.ok(r > TAPE.hubR && r < TAPE.flangeR, 'a full 1800 ft roll fits inside the flange');
  close(packRadius(capacity()), TAPE.flangeR, 1e-9, 'capacity fills the flange exactly');
});

test('reel angular speed equals tape speed over pack radius', () => {
  const t = new Transport();
  t.command('play'); t.advance(2);
  close(t.v, 30 * IPS, 1e-4, 'play speed reached');
  close(t.wS, t.v / t.rS, 1e-12, 'supply');
  close(t.wT, t.v / t.rT, 1e-12, 'take-up');
  assert.ok(t.wT > t.wS * 1.6, 'near-empty take-up spins about 1.7x faster than a full 1800 ft supply');
});

test('play reaches speed quickly through the capstan', () => {
  const t = new Transport();
  t.command('play'); t.advance(0.5);
  assert.ok(t.capstanDriving, 'pinch roller engaged');
  close(t.v, 30 * IPS, 0.01, 'at speed within half a second');
});

test('15 IPS halves the play speed', () => {
  const t = new Transport({ speedIPS: 15 });
  t.command('play'); t.advance(1.5);
  close(t.v, 15 * IPS, 1e-3, '15 ips');
});

test('winds are force limited: a full reel spools up more slowly than a balanced one', () => {
  const full = new Transport(); full.command('ff'); full.advance(0.5);
  const mid = new Transport({ onTakeup: (ROLL_FT / 2) * FT }); mid.command('ff'); mid.advance(0.5);
  assert.ok(full.v > 0.5, 'full reel is accelerating');
  assert.ok(mid.v > full.v, `balanced packs accelerate faster (${mid.v.toFixed(2)} > ${full.v.toFixed(2)})`);
  full.advance(4); close(full.v, MACHINE.windSpeed, 0.05, 'reaches wind speed');
});

test('stop from wind brakes over a visible time, not instantly', () => {
  const t = new Transport({ onTakeup: 1000 * FT });
  t.command('ff'); t.advance(5);
  t.command('stop'); t.advance(0.2);
  assert.ok(t.v > 1, 'still moving 0.2 s after STOP');
  t.advance(4); close(t.v, 0, 1e-3, 'stopped');
});

test('PLAY during a wind brakes first, then the pinch roller engages near play speed', () => {
  const t = new Transport({ onTakeup: 1000 * FT });
  t.command('rew'); t.advance(5);
  assert.ok(t.v < -5, 'rewinding');
  t.command('play'); t.advance(0.1);
  assert.ok(t.pinch < 0.1, 'pinch stays off while the reels are still winding');
  t.advance(5);
  assert.ok(t.capstanDriving, 'pinch engaged');
  close(t.v, 30 * IPS, 1e-3, 'playing forward');
});

test('lifters lift the tape at wind speed and drop for play', () => {
  const t = new Transport({ onTakeup: 1000 * FT });
  t.command('ff'); t.advance(3);
  assert.ok(t.lift > 0.99, 'lifted during wind');
  t.command('play'); t.advance(6);
  assert.ok(t.lift < 0.01, 'on the heads during play');
  const d = new Transport({ onTakeup: 1000 * FT }); d.liftDefeat = true; d.command('ff'); d.advance(3);
  assert.ok(d.lift < 0.01, 'LIFT defeat keeps tape on the heads');
});

test('tape running off the supply stops the transport', () => {
  const t = new Transport({ onTakeup: ROLL_FT * FT - 20 });
  t.command('ff'); t.advance(10);
  assert.equal(t.mode, 'stop'); assert.ok(t.endOfTape); close(t.supply, 0, 1e-9, 'supply empty');
});

test('tape length is conserved', () => {
  const t = new Transport({ onTakeup: 1234 });
  t.command('ff'); t.advance(3); t.command('rew'); t.advance(3); t.command('play'); t.advance(3);
  close(t.supply + t.take, t.total, 1e-6, 'supply + take-up');
});

test('counter reads tape time at the selected speed', () => {
  const t = new Transport();
  t.command('play'); t.advance(10.5);
  assert.ok(t.counter > 9.8 && t.counter < 10.5, `about 10 s of tape (${t.counter.toFixed(2)})`);
});

test('a full roll is 1800 feet', () => {
  const t = new Transport();
  close(t.total / FT, 1800, 1e-9, 'roll length');
  close(t.supply / FT, 1800, 1e-9, 'all on the supply at the head');
});
