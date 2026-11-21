import test from 'node:test';
import assert from 'node:assert/strict';
import { JHMix, jmFaderDb } from './jhmix.js';
const fs = 48000;
const sine = (f, n, a = 0.2) => Float32Array.from({ length: n }, (_, k) => a * Math.sin(2 * Math.PI * f * k / fs));
const rms = (y) => Math.sqrt(y.reduce((a, b) => a + b * b, 0) / y.length);
const runCh = (m, i, x, blocks = 40) => { let L, R; for (let b = 0; b < blocks; b++) { m.process((j) => (j === i ? x : null), x.length); m.finish(x.length); L = m.L.slice(); R = m.R.slice(); } return [L, R]; };
test('fader scale: 0 dB at the 0 mark, +10 at the top, off at the bottom', () => {
  assert.equal(jmFaderDb(0.2), 0); assert.equal(jmFaderDb(0), 10); assert.equal(jmFaderDb(1), -Infinity); assert.ok(Math.abs(jmFaderDb(0.42) + 10) < 1e-9);
});
test('unity through a channel at 0 dB, centre pan; pan hard left; mute; solo', () => {
  const x = sine(1000, 1024), m = new JHMix(fs); m.set(0, {}); const [L, R] = runCh(m, 0, x);
  assert.ok(Math.abs(rms(L) / rms(x) - 1) < 0.02 && Math.abs(rms(R) / rms(x) - 1) < 0.02);
  m.set(0, { pan: -1 }); const [l2, r2] = runCh(m, 0, x); assert.ok(rms(r2) < 1e-6 && rms(l2) > rms(x) * 0.98);
  m.set(0, { pan: 0, mute: true }); const [l3] = runCh(m, 0, x); assert.ok(rms(l3) < 1e-9);
  const n = new JHMix(fs); n.set(1, { solo: true }); n.process((j) => (j === 0 ? x : null), 1024); n.finish(1024); assert.ok(rms(n.L) < 1e-9, 'another channel is soloed');
});
test('EQ: +12 dB HI at 10 kHz lifts 10 kHz, not 100 Hz; HPF cuts 30 Hz', () => {
  const m = new JHMix(fs); m.set(0, { hf_g: 12, hf_f: 10000 });
  const hi = rms(runCh(m, 0, sine(10000, 2048))[0]) / rms(sine(10000, 2048)), lo = rms(runCh(m, 0, sine(100, 2048))[0]) / rms(sine(100, 2048));
  assert.ok(hi > 3 && Math.abs(lo - 1) < 0.1, `hi ${hi} lo ${lo}`);
  const h = new JHMix(fs); h.set(0, { hpf: true }); const r = rms(runCh(h, 0, sine(30, 4096), 30)[0]) / rms(sine(30, 4096)); assert.ok(r < 0.6, `30 Hz ${r}`);
});
test('sends: post-fader follows the fader, pre does not; 3-4 pans; the master scales the bus', () => {
  const x = sine(500, 1024), m = new JHMix(fs); m.set(0, { s1: 0, s34: 0, s34p: 1, fader: 1 }); m.process((j) => (j === 0 ? x : null), 1024);
  assert.ok(rms(m.sends[0]) < 1e-9, 'post send with the fader down'); m.set(0, { s12pre: true }); m.process((j) => (j === 0 ? x : null), 1024); assert.ok(rms(m.sends[0]) > 0.1);
  m.set(0, { s34pre: true }); m.process((j) => (j === 0 ? x : null), 1024); assert.ok(rms(m.sends[2]) < 1e-6 && rms(m.sends[3]) > 0.1, '3-4 panned to 4');
  const b = new JHMix(fs); b.master = 0.42; const [L] = runCh(b, 0, x); assert.ok(Math.abs(rms(L) / rms(x) - 10 ** (-10 / 20)) < 0.01);
});

test('buses: channel 1 on bus 3 (PAN in, centre) feeds bus 3 after the fader; PAN odd / even; no self-feed from tape', () => {
  const x = sine(500, 1024), m = new JHMix(fs); m.set(0, { bus: [3, 4], panbus: false, src: 'in' }); m.process((j) => (j === 0 ? x : null), 1024);
  assert.ok(Math.abs(rms(m.bus[2]) / rms(x) - 1) < 0.02 && Math.abs(rms(m.bus[3]) / rms(x) - 1) < 0.02);
  m.set(0, { panbus: true, oddeven: -1 }); m.process((j) => (j === 0 ? x : null), 1024); assert.ok(rms(m.bus[2]) > rms(x) * 1.3 && rms(m.bus[3]) < 1e-6, 'all odd');
  m.set(0, { fader: 1 }); m.process((j) => (j === 0 ? x : null), 1024); assert.ok(rms(m.bus[2]) < 1e-9, 'post fader');
  const t = new JHMix(fs); t.set(2, { bus: [3, 5], panbus: false, src: 'tape' }); t.process((j) => (j === 2 ? x : null), 1024); assert.ok(rms(t.bus[2]) < 1e-9 && rms(t.bus[4]) > 0.1, 'track 3 bounces to 5, never back to 3');
});
