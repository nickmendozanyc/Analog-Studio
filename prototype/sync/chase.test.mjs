import test from 'node:test';
import assert from 'node:assert/strict';
import { CodeTracker, Chaser } from './chase.js';
import { Transport } from '../reels/physics.js';

// The slave: the JH-Tape transport, its track 24 striped with 01:00:00:00 at the counter zero.
function rig() {
  const tr = new Transport(); tr.locate(tr.total * 0.1); tr.zero = tr.take;
  const code = () => 3600 + tr.counter;   // what the synchronizer reads off the slave's track 24
  const apply = (o) => {
    if (o.locate != null) tr.locateTo(tr.zero + (o.locate - 3600) * tr.nominalSpeed, 'stop');
    if (o.play) tr.command('play');
    if (o.stop) tr.command('stop');
    tr.setVarispeed(o.speed || 0);
  };
  const status = () => {
    const ps = tr.playSpeed, atSpeed = tr.mode === 'play' && tr.pinch > 0.5 && Math.abs(tr.v - ps) < 0.01 * ps;
    return { code: code(), playing: atSpeed, starting: tr.mode === 'play' && !atSpeed, stopped: tr.mode === 'stop' && Math.abs(tr.v) < 1e-3 };
  };
  return { tr, code, apply, status };
}
// The master: a DAW sending MTC (quarter frames every 1/120 s, with up to ±1.5 ms of delivery jitter).
function run({ seconds, start = 3630, rate = 1, offset = 0, rollAt = 0.5, stopAt = Infinity, seed = 7, ref = null, jitter = 0.003 }) {
  const R = rig(), trk = new CodeTracker({ fps: 30 }), ch = new Chaser(); ch.offset = offset; ch.ref = ref;
  let rnd = seed; const jit = () => { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return (rnd / 0x7fffffff - 0.5) * jitter; };
  const dt = 0.002, log = []; let nextQF = 0, masterPos = start, nb = Math.ceil(start * 120) / 120;
  for (let t = 0; t < seconds; t += dt) {
    const rolling = t >= rollAt && t < stopAt;
    if (rolling) masterPos += rate * dt;
    // MTC: each quarter frame is sent as the master crosses that quarter-frame boundary (delivery jitter on top)
    while (rolling && masterPos >= nb) { trk.input(t - (masterPos - nb) / rate + jit(), nb); nb += 1 / 120; }   // stamped at the exact crossing, then jittered
    if (!rolling && t >= nextQF && t < rollAt) { trk.input(t, masterPos); nextQF = t + 0.2; }   // a stopped DAW sends a full frame now and then
    const m = trk.read(t);
    R.apply(ch.update(dt, m, R.status()));
    log.push({ t, state: ch.state, err: masterPos + offset - R.code(), speed: R.tr.varispeed, mode: R.tr.mode });   // both measured at the same instant
    R.tr.advance(dt);
  }
  return { log, R, ch };
}
const firstLock = (log) => { const i = log.findIndex((r) => r.state === 'LOCK'); return i < 0 ? Infinity : log[i].t; };

test('chases from 30 s away, locks, and holds within a fraction of a frame with steady tape speed', () => {
  const { log } = run({ seconds: 40 });
  const tl = firstLock(log);
  assert.ok(tl < 25, `locked after ${tl.toFixed(1)} s`);
  const tail = log.filter((r) => r.t > tl + 5);
  const maxErr = Math.max(...tail.map((r) => Math.abs(r.err))), sp = tail.map((r) => r.speed);
  const mean = sp.reduce((a, b) => a + b, 0) / sp.length, sd = Math.sqrt(sp.reduce((a, b) => a + (b - mean) ** 2, 0) / sp.length);
  assert.ok(tail.every((r) => r.state === 'LOCK'), 'stays locked');
  assert.ok(maxErr < 0.1 / 30, `error ${(maxErr * 1000).toFixed(2)} ms (< a tenth of a frame)`);
  assert.ok(sd < 0.0005, `speed wobble ${(sd * 100).toFixed(4)} % (resolved, not hunting)`);
});
test('master stops: the slave parks on the same frame', () => {
  const { log, R, ch } = run({ seconds: 30, stopAt: 20 });
  const end = log[log.length - 1];   // parked a learned start-up distance ahead of the master
  assert.equal(R.tr.mode, 'stop'); assert.ok(Math.abs(end.err + ch.parkAhead) < 2 / 30, `parked ${((end.err + ch.parkAhead) * 30).toFixed(2)} frames off the park point`);
});
test('follows a master running 0.1 % fast (pull-down / vari-speed)', () => {
  const { log } = run({ seconds: 40, rate: 1.001 });
  const tl = firstLock(log), tail = log.filter((r) => r.t > tl + 5);
  assert.ok(tl < 25 && tail.every((r) => Math.abs(r.err) < 0.25 / 30), 'locked within a quarter frame');
  const sp = tail.reduce((a, r) => a + r.speed, 0) / tail.length;
  assert.ok(Math.abs(sp - 0.001) < 0.0003, `capstan settles at ${(sp * 100).toFixed(3)} %`);
});
test('offset: slave runs 10 s ahead of the master', () => {
  const { log } = run({ seconds: 40, offset: 10 });
  const tl = firstLock(log); assert.ok(tl < 25, `locked after ${tl.toFixed(1)} s`); assert.ok(log.filter((r) => r.t > tl + 5).every((r) => Math.abs(r.err) < 0.25 / 30));
});
test('the master position tracker smooths MTC jitter and coasts through a dropout', () => {
  const trk = new CodeTracker(); let e = 0;
  for (let t = 0; t < 3; t += 1 / 120) trk.input(t + (Math.sin(t * 77) * 0.0015), 100 + t);   // quarter frames on their boundaries, jittered
  for (let t = 1; t < 3; t += 0.01) e = Math.max(e, Math.abs(trk.read(3).pos - (100 + 3)));
  assert.ok(e < 0.004, `position error ${(e * 1000).toFixed(2)} ms`);
  const r = trk.read(3.3); assert.ok(r.running && Math.abs(r.pos - 103.3) < 0.01, 'coasts 0.3 s without code');
  assert.ok(!trk.read(4).running, 'stops after the flywheel runs out');
});

test('house reference: with master and slave on one sync generator, lock is steadier still, even with bad MTC jitter', () => {
  const stats = (o) => { const { log } = run({ seconds: 40, ...o }); const tl = firstLock(log), tail = log.filter((r) => r.t > tl + 5), sp = tail.map((r) => r.speed), m = sp.reduce((a, b) => a + b, 0) / sp.length;
    return { tl, maxErr: Math.max(...tail.map((r) => Math.abs(r.err))), sd: Math.sqrt(sp.reduce((a, b) => a + (b - m) ** 2, 0) / sp.length) }; };
  const free = stats({ jitter: 0.008 }), ref = stats({ jitter: 0.008, ref: 1 });
  assert.ok(ref.maxErr < 0.1 / 30, `error with reference ${(ref.maxErr * 1000).toFixed(2)} ms`);
  assert.ok(ref.sd < free.sd * 0.5, `speed wobble ${(ref.sd * 100).toFixed(4)} % with reference vs ${(free.sd * 100).toFixed(4)} % without`);
});

test('rolling from park: the slave parked ahead learns its start-up and locks quickly the next time', () => {
  // master parks, the slave parks with it; the master rolls, stops, rolls again: the second lock is faster
  const R = rig(), trk = new CodeTracker(), ch = new Chaser(); let pos = 3610, nb = 0, locks = [], lockedAt = null;
  const dt = 0.002;
  for (let t = 0; t < 60; t += dt) {
    const rolling = (t > 8 && t < 25) || t > 35;
    if (rolling) { pos += dt; if (!nb) nb = Math.ceil(pos * 120) / 120; while (pos >= nb) { trk.input(t - (pos - nb), nb); nb += 1 / 120; } }
    else { nb = 0; if (Math.round(t / dt) % 100 === 0) trk.input(t, pos); }
    R.apply(ch.update(dt, trk.read(t), R.status())); R.tr.advance(dt);
    if (rolling && ch.state === 'LOCK' && lockedAt == null) { lockedAt = t; locks.push(t - (t < 30 ? 8 : 35)); }
    if (!rolling) lockedAt = null;
  }
  assert.equal(locks.length, 2, 'locked both times');
  assert.ok(locks[1] < locks[0] * 0.75, `second lock ${locks[1].toFixed(1)} s vs first ${locks[0].toFixed(1)} s after the master rolls`);
});
