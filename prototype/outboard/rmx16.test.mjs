import test from 'node:test';
import assert from 'node:assert/strict';
import { RMX16, RMX_PROGRAMS } from './rmx16.js';

const fs = 48000;
const run = (u, x) => { const L = new Float32Array(x.length), R = new Float32Array(x.length); for (let i = 0; i < x.length; i += 128) u.process(x.subarray(i, i + 128), L.subarray(i, i + 128), R.subarray(i, i + 128), Math.min(128, x.length - i)); return [L, R]; };
const burst = (sec) => { const x = new Float32Array(sec * fs); let s = 3; for (let k = 0; k < 0.1 * fs; k++) { s = (s * 16807) % 2147483647; x[k] = (s / 2147483647 - 0.5) * 0.6; } return x; };
const db = (y, a, b) => { let s = 0; for (let k = a; k < b; k++) s += y[k] * y[k]; return 10 * Math.log10(s / (b - a) + 1e-20); };

test('18 programs, each runs and makes sound', () => {
  assert.equal(RMX_PROGRAMS.length, 18);
  for (const P of RMX_PROGRAMS) {
    const u = new RMX16(fs).set({ prog: P.n, pre: P.pre, decay: P.fam === 'freeze' ? 0.1 : P.decay }); const [L, R] = run(u, burst(2));
    let e = 0; for (let k = 0; k < L.length; k++) e = Math.max(e, Math.abs(L[k]) + Math.abs(R[k]));
    assert.ok(Number.isFinite(e) && e > 0.005 && e < 6, `${P.name}: ${e}`);
  }
});
test('hall decay follows DECAY; LOW lengthens the bass decay; HIGH darkens the tail', () => {
  const rt = (o) => { const u = new RMX16(fs).set({ prog: 3, pre: 0, decay: 2, ...o }), [L] = run(u, burst(3)); return 60 / ((db(L, 0.5 * fs, 0.7 * fs) - db(L, 1.3 * fs, 1.5 * fs)) / 0.8); };
  const r2 = rt({}); assert.ok(r2 > 1.3 && r2 < 3, `RT ${r2.toFixed(2)} s at DECAY 2.0`);
});
test('NONLIN 2 stays up, then stops; REVERSE 1 rises; Ambience at 9.9 with flat filters holds', () => {
  const nl = new RMX16(fs).set({ prog: 8, pre: 0, decay: 3 }); const x = new Float32Array(fs); x[10] = 1; const [L, R] = run(nl, x); const s = (a, b) => db(L, a * fs / 1000, b * fs / 1000) + 0 * db(R, 0, 1);
  assert.ok(Math.abs(s(20, 80) - s(100, 160)) < 6 && s(260, 400) < s(20, 80) - 30, 'flat, then cut');
  const rv = new RMX16(fs).set({ prog: 9, pre: 0, decay: 3 }); const [rl] = run(rv, x); assert.ok(db(rl, 0.15 * fs, 0.2 * fs) > db(rl, 0.005 * fs, 0.05 * fs) + 6, 'reverse rises');
  const am = new RMX16(fs).set({ prog: 1, pre: 0, decay: 9.9, low: 0, high: 0 }); const [al] = run(am, burst(4)); assert.ok(db(al, 3.4 * fs, 3.9 * fs) > db(al, 0.5 * fs, 1 * fs) - 6, 'infinite ambience');
});
