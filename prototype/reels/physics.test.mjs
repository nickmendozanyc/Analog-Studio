import test from 'node:test';
import assert from 'node:assert/strict';
import { Transport, TAPE, MACHINE, IPS, FT, ROLL_FT, VARI_RANGE, packRadius, capacity } from './physics.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);

test('pack radius grows with the square root of tape length', () => {
  close(packRadius(0), TAPE.hubR, 1e-12, 'empty hub');
  const r = packRadius(ROLL_FT * FT);
  assert.ok(r > TAPE.hubR && r < TAPE.flangeR, 'a full 2500 ft reel fits inside the flange');
  close(packRadius(capacity()), TAPE.flangeR, 1e-9, 'capacity fills the flange exactly');
});

test('reel angular speed equals tape speed over pack radius', () => {
  const t = new Transport();
  t.command('play'); t.advance(2);
  close(t.v, 30 * IPS, 1e-4, 'play speed reached');
  close(t.wS, t.v / t.rS, 1e-12, 'supply');
  close(t.wT, t.v / t.rT, 1e-12, 'take-up');
  assert.ok(t.wT > t.wS * 1.8, 'near-empty take-up spins about twice as fast as a full 2500 ft supply');
});

test('play reaches speed quickly through the capstan', () => {
  const t = new Transport();
  t.command('play'); t.advance(1.5);
  assert.ok(t.capstanDriving, 'pinch roller engaged');
  close(t.v, 30 * IPS, 0.01, 'at speed within 1.5 s, eased in smoothly');
});

test('15 IPS halves the play speed', () => {
  const t = new Transport({ speedIPS: 15 });
  t.command('play'); t.advance(1.5);
  close(t.v, 15 * IPS, 1e-3, '15 ips');
});

test('a full reel carries more inertia; the servo ramps winds the same way regardless', () => {
  const full = new Transport(), mid = new Transport({ onTakeup: (ROLL_FT / 2) * FT });
  assert.ok(full.effectiveMass() > mid.effectiveMass(), 'a full supply reel is heavier at the tape than balanced packs');
  const t = new Transport(); t.command('ff'); t.advance(6); close(t.v, MACHINE.windSpeed, 0.05, 'reaches wind speed');
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

test('a full reel is 2500 feet', () => {
  const t = new Transport();
  close(t.total / FT, 2500, 1e-9, 'reel length');
  close(t.supply / FT, 2500, 1e-9, 'all on the supply at the head');
});

test('a stopped transport at the head or tail is not end of tape', () => {
  for (const at of [0, ROLL_FT * FT]) {
    const t = new Transport({ onTakeup: at }); t.advance(1);
    assert.equal(t.endOfTape, false, `at ${at} m`);
  }
});

test('7.5 IPS runs at a quarter of 30 IPS', () => {
  const t = new Transport({ speedIPS: 7.5 });
  t.command('play'); t.advance(2);
  close(t.v, 7.5 * IPS, 1e-3, '7.5 ips');
});

test('vari-speed changes play speed but not the tape counter rate', () => {
  const t = new Transport({ speedIPS: 30 });
  t.setVarispeed(0.1); t.command('play'); t.advance(3);
  close(t.v, 33 * IPS, 1e-3, '+10 % plays at 33 ips');
  close(t.semitones, 12 * Math.log2(1.1), 1e-9, 'about +1.65 semitones');
  const c0 = t.counter; t.advance(1);
  close(t.counter - c0, 1.1, 0.01, 'counter advances 1.1 s of tape per second');
  t.setVarispeed(5); close(t.varispeed, VARI_RANGE, 1e-12, 'clamped to the range');
});

test('the transport ramps smoothly (jerk limited) and comes to rest', () => {
  const t = new Transport({ onTakeup: 1000 * FT }); let last = 0, peak = 0;
  t.command('ff');
  for (let i = 0; i < 12000; i++) { if (i === 4000) t.command('stop'); t.step(0.001); peak = Math.max(peak, Math.abs(t.acc - last) / 0.001); last = t.acc; }
  assert.ok(peak <= MACHINE.jerk * 3, `jerk stays near ${MACHINE.jerk} m/s^3 (${peak.toFixed(1)})`);
  close(t.v, 0, 1e-9, 'at rest');
});

test('reverse play runs the tape backwards at play speed through the capstan', () => {
  const t = new Transport({ onTakeup: 1000 * FT });
  const c0 = t.counter;
  t.command('rplay'); t.advance(3);
  assert.ok(t.capstanDriving, 'pinch engaged in reverse');
  close(t.v, -30 * IPS, 1e-3, 'reverse at 30 ips');
  assert.ok(t.counter < c0, 'counter runs backwards');
  assert.ok(t.lift < 0.01, 'tape stays on the heads');
  assert.ok(t.wS < 0 && t.wT < 0, 'both reels turn the other way');
  t.command('play'); t.advance(4); close(t.v, 30 * IPS, 1e-3, 'back to forward play');
});

test('the autolocator winds to a cue point and stops on it', () => {
  for (const [from, to] of [[0, 600], [800, 30], [300, 305], [300, 299.5]]) {
    const t = new Transport({ onTakeup: from });
    t.locateTo(to); let s = 0;
    while (t.mode === 'locate' && s < 120) { t.advance(0.1); s += 0.1; }
    assert.equal(t.mode, 'stop', `arrived from ${from} to ${to} in ${s.toFixed(1)} s`);
    close(t.take, to, 0.01, 'parked on the cue point');
    close(t.v, 0, 1e-9, 'at rest');
  }
});

test('auto play after locate starts playing at the cue point', () => {
  const t = new Transport({ onTakeup: 0 });
  t.locateTo(200, 'play'); t.advance(60);
  assert.equal(t.mode, 'play'); assert.ok(t.capstanDriving, 'playing through the capstan');
});
