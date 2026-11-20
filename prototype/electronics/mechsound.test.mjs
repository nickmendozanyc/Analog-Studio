import test from 'node:test';
import assert from 'node:assert/strict';
import { MechSound, MECH } from './mechsound.js';
import { Transport } from '../reels/physics.js';
const fs = 48000, B = 256;
function run(mode, sec, setup) {
  const tr = new Transport(); if (setup) setup(tr); const ms = new MechSound(fs);
  tr.command(mode); const L = new Float32Array(sec * fs), R = new Float32Array(sec * fs), bl = new Float32Array(B), br = new Float32Array(B);
  for (let k = 0; k + B <= L.length; k += B) { tr.advance(B / fs); ms.update({ v: tr.v, rS: tr.rS, rT: tr.rT, acc: tr.acc, mode: tr.mode, lift: tr.lift, endOfTape: tr.endOfTape }); bl.fill(0); br.fill(0); ms.render(bl, br, 1); L.set(bl, k); }
  return { L, tr };
}
const tone = (x, f, a, b) => { const w = 2 * Math.PI * f / fs, c = 2 * Math.cos(w); let s1 = 0, s2 = 0; for (let i = a; i < b; i++) { const s = x[i] + c * s1 - s2; s2 = s1; s1 = s; } return Math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) * 2 / (b - a); };
test('silent when stopped', () => { const { L } = run('stop', 1); assert.ok(L.every((v) => v === 0)); });
test('fast wind: each motor whines at its reel turns x slots, and the level rises with speed', () => {
  let rS, rT; const { L, tr } = run('ff', 4, (t) => { t.locate(t.total / 4); });
  rS = tr.rS; rT = tr.rT; const v = tr.v, cl = 1 + MECH.rise * (Math.min(1.2, v / MECH.vMax) - 1), fS = v / (2 * Math.PI * rS) * MECH.slots * cl, fT = v / (2 * Math.PI * rT) * MECH.slots * cl;
  const a = 3.5 * fs, b = 4 * fs - 1;
  const atS = tone(L, fS, a, b), off = tone(L, fS * 1.13, a, b);
  assert.ok(atS > 5 * off, `supply motor tone ${atS.toExponential(2)} vs ${off.toExponential(2)}`);
  assert.ok(tone(L, fT, a, b) > 5 * tone(L, fT * 0.89, a, b), 'take-up motor tone');
  let e1 = 0, e2 = 0; for (let i = 0.1 * fs; i < 0.3 * fs; i++) e1 += L[i] * L[i]; for (let i = 3.5 * fs; i < 3.7 * fs; i++) e2 += L[i] * L[i];
  assert.ok(e2 > e1, 'louder at speed than while starting');
});
test('a clunk when the lifters swing out at the start of a wind', () => { const { L } = run('ff', 0.05); let pk = 0; for (let i = 0; i < 0.03 * fs; i++) pk = Math.max(pk, Math.abs(L[i])); assert.ok(pk > 0.05); });

test('the whine climbs with speed and falls as the reels slow', () => {
  const tr = new Transport(); tr.locate(tr.total / 2); const ms = new MechSound(fs); tr.command('ff');
  const f = () => { ms.update({ v: tr.v, rS: tr.rS, rT: tr.rT, acc: tr.acc, mode: tr.mode, lift: tr.lift }); const x = Math.min(1.2, Math.abs(tr.v) / MECH.vMax); return Math.abs(tr.v) / (2 * Math.PI * tr.rS) * (1 + MECH.rise * (x - 1)) * MECH.slots; };
  tr.advance(0.5); const a = f(); tr.advance(3); const b = f(); tr.command('stop'); tr.advance(1); const c = f();
  assert.ok(b > 900 && b < 1400, `full wind ${b.toFixed(0)} Hz`); assert.ok(a < b * 0.6, `rising: ${a.toFixed(0)} -> ${b.toFixed(0)} Hz`); assert.ok(c < b * 0.7, `falling: ${c.toFixed(0)} Hz`);
});
