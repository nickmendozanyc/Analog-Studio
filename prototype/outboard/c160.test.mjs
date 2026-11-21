import test from 'node:test';
import assert from 'node:assert/strict';
import { Comp160, ratioSlope, ratioLabel } from './c160.js';

const fs = 48000;
// a sine at a level in dBu (refPeak 1 = 0 VU = +4 dBu)
const amp = (dbu) => 10 ** ((dbu - 4) / 20);
function run(c, segs) {   // segs: [[seconds, dBu], ...] -> per-sample { gr, out } log
  const log = []; const blk = new Float32Array(128); let ph = 0;
  for (const [sec, dbu] of segs) {
    const N = Math.round(sec * fs), A = amp(dbu);
    for (let i = 0; i < N; i += 128) {
      const n = Math.min(128, N - i);
      for (let k = 0; k < n; k++) { blk[k] = A * Math.sin(ph); ph += 2 * Math.PI * 1000 / fs; }
      c.process(blk, n); for (let k = 0; k < n; k++) log.push(c.gr);
    }
  }
  return log;
}
const rmsDbu = (c, dbu, sec = 1) => { const blk = new Float32Array(fs * sec); for (let k = 0; k < blk.length; k++) blk[k] = amp(dbu) * Math.sin(2 * Math.PI * 1000 * k / fs); for (let i = 0; i < blk.length; i += 128) c.process(blk.subarray(i, i + 128), Math.min(128, blk.length - i)); let p = 0; const tail = blk.subarray(blk.length / 2); for (const v of tail) p += v * v; return 10 * Math.log10(p / tail.length / 0.5) + 4; };

test('ratio dial: 1:1 ... 4:1 near the top ... infinity:1 ... -1:1', () => {
  assert.equal(ratioLabel(ratioSlope(0)), '1:1'); assert.equal(ratioLabel(ratioSlope(0.38)), '4:1');
  assert.equal(ratioLabel(ratioSlope(0.7)), '∞:1'); assert.equal(ratioLabel(ratioSlope(1)), '-1:1');
});
test('static curve, hard knee: 4:1 turns 20 dB over threshold into 5 dB; infinity:1 holds the output; -1:1 pulls it down', () => {
  const at = (ratio, over) => { const c = new Comp160(fs).set({ threshold: -10, ratio }); return rmsDbu(c, -10 + over, 2) + 10; };
  assert.ok(Math.abs(at(0.38, 20) - 5) < 0.6, `4:1 -> ${at(0.38, 20).toFixed(2)} dB over`);
  assert.ok(Math.abs(at(0.7, 20)) < 0.6, `∞:1 -> ${at(0.7, 20).toFixed(2)} dB over`);
  assert.ok(Math.abs(at(1, 10) + 10) < 0.8, `-1:1 at +10 -> ${at(1, 10).toFixed(2)} dB`);
  assert.ok(Math.abs(at(0.38, -10) + 10) < 0.2, 'below threshold: unity');
});
test('Over Easy: about 2 dB of reduction right at threshold (infinity:1), none 12 dB below', () => {
  const c = new Comp160(fs).set({ threshold: -10, ratio: 0.7, overEasy: true });
  const at0 = -10 - rmsDbu(c, -10, 2), cb = new Comp160(fs).set({ threshold: -10, ratio: 0.7, overEasy: true }), below = -22 - rmsDbu(cb, -22, 2);
  assert.ok(at0 > 1.5 && at0 < 3, `reduction at threshold ${at0.toFixed(2)} dB`); assert.ok(below < 0.3, `12 dB below: ${below.toFixed(2)} dB`);
});
test('attack follows the programme: 63 % of the final reduction in about 15 / 5 / 3 ms for 10 / 20 / 30 dB steps', () => {
  for (const [D, spec] of [[10, 15], [20, 5], [30, 3]]) {
    const c = new Comp160(fs).set({ threshold: -10, ratio: 0.7 });
    const log = run(c, [[1, -10], [0.5, -10 + D]]), s0 = fs, fin = log[log.length - 1];
    const i = log.findIndex((g, k) => k > s0 && g >= 0.63 * fin), ms = (i - s0) / fs * 1000;
    assert.ok(Math.abs(ms - spec) < Math.max(2, spec * 0.4), `${D} dB step: ${ms.toFixed(1)} ms (spec ${spec})`);
  }
});
test('release at a constant rate of about 125 dB per second', () => {
  const c = new Comp160(fs).set({ threshold: -30, ratio: 0.7 });
  const log = run(c, [[1, 0], [0.4, -60]]), s0 = fs;
  const t1 = log.findIndex((g, k) => k > s0 && g <= 20), t2 = log.findIndex((g, k) => k > s0 && g <= 10);
  const rate = 10 / ((t2 - t1) / fs);
  assert.ok(rate > 105 && rate < 145, `release ${rate.toFixed(0)} dB/s`);
});
test('bypass is a wire; output gain adds after the gain reduction', () => {
  const c = new Comp160(fs).set({ bypass: true, outGain: 12 }), x = Float32Array.from({ length: 256 }, (_, k) => Math.sin(k / 7) * 0.3), y = x.slice();
  c.process(y, 256); assert.deepEqual(Array.from(y), Array.from(x));
  const g = new Comp160(fs).set({ threshold: 20, outGain: 6 }); assert.ok(Math.abs(rmsDbu(g, -10, 1) - -4) < 0.2, 'unity + 6 dB');
});
test('stereo strapping: the slave follows the louder channel with the master\'s controls', () => {
  const A = new Comp160(fs).set({ threshold: -20, ratio: 0.7 }), B = new Comp160(fs).set({ threshold: 10, ratio: 0, slave: true });
  const a = new Float32Array(128), b = new Float32Array(128);
  for (let i = 0; i < 400; i++) { for (let k = 0; k < 128; k++) { a[k] = amp(0) * Math.sin((i * 128 + k) * 0.13); b[k] = amp(-30) * Math.sin((i * 128 + k) * 0.13); } Comp160.processPair(A, a, B, b, 128); }
  assert.ok(Math.abs(A.gr - B.gr) < 0.01 && A.gr > 15, `master ${A.gr.toFixed(1)} dB, slave ${B.gr.toFixed(1)} dB`);
});
test('meters: level LEDs, gain-reduction LEDs and the threshold lamp', () => {
  const c = new Comp160(fs).set({ threshold: -10, ratio: 0.7 }); rmsDbu(c, 4, 1);
  const m = c.meters(); assert.equal(m.th, 'above'); assert.equal(m.level, 13, `0 VU lights 13 LEDs (to 0), got ${m.level}`); assert.equal(m.gr, 8, `14 dB GR lights 1..10 dB: ${m.gr} LEDs`);
});
