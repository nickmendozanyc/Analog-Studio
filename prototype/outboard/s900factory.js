// The Akita S900's factory disk: a few sounds made here (synthesised, then stored like any 12-bit sample), and programs
// that map them. Real S900s booted from floppies of sampled sounds; these stand in until you record or load your own.
export function s900Factory() {
  const out = [];
  const mk = (name, rate, sec, fn, o) => { const n = Math.round(rate * sec), d = new Float32Array(n); let st = { r: 12345 }; for (let k = 0; k < n; k++) d[k] = fn(k / rate, k, st); out.push({ name, rate, data: d, o }); };
  const rnd = (st) => { st.r = (st.r * 1103515245 + 12345) & 0x7fffffff; return st.r / 0x7fffffff * 2 - 1; };
  const saw = (f, t) => 2 * ((f * t) % 1) - 1;
  // 0 STRINGS: three detuned saws, softened; loops on its sustain
  mk('STRINGS 1', 30000, 2.4, (t) => { const a = Math.min(1, t / 0.25); return 0.28 * a * (saw(220, t) + saw(220.9, t) + saw(219.2, t)) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 5.2 * t)); }, { root: 57, mode: 'loop', loopAt: 30000, loopLen: 30000 });
  // 1 E.PIANO: two-operator bell, decaying, with a sustain loop near the end
  mk('E.PIANO', 32000, 2.0, (t) => { const e = Math.exp(-t * 2.2), m = Math.sin(2 * Math.PI * 523.25 * t) * 1.6 * Math.exp(-t * 6); return 0.55 * e * Math.sin(2 * Math.PI * 261.63 * t + m); }, { root: 60, mode: 'one' });
  // 2 BASS: saw + sub, short decay, looped tail
  mk('SYN BASS', 25000, 1.2, (t) => { const e = 0.35 + 0.65 * Math.exp(-t * 5); return 0.5 * e * (0.6 * saw(65.41, t) + 0.6 * Math.sin(2 * Math.PI * 32.7 * t)); }, { root: 36, mode: 'loop', loopAt: 15000, loopLen: 15291 });
  // 3 KICK, 4 SNARE, 5 HAT: one-shots
  mk('KICK', 32000, 0.45, (t) => { const f = 48 + 110 * Math.exp(-t * 30); return 0.95 * Math.exp(-t * 9) * Math.sin(2 * Math.PI * (48 * t + 110 * (1 - Math.exp(-t * 30)) / 30)) + 0 * f; }, { root: 36, mode: 'one' });
  mk('SNARE', 32000, 0.35, (t, k, st) => 0.55 * Math.exp(-t * 16) * Math.sin(2 * Math.PI * 185 * t) + 0.5 * Math.exp(-t * 11) * rnd(st), { root: 38, mode: 'one' });
  mk('HATS', 40000, 0.18, (t, k, st) => { const x = rnd(st); st.h = (st.h || 0) * 0.3 + x * 0.7; return 0.45 * Math.exp(-t * 28) * (x - st.h); }, { root: 42, mode: 'one' });
  const kg = (o) => ({ lo: 0, hi: 127, sample: 0, loud: -1, xfade: 64, tune: 0, filter: 99, attack: 0, decay: 50, sustain: 99, release: 15, velLevel: 50, velFilter: 0, out: 1, ...o });
  const programs = [
    { name: 'STRINGS', midiCh: 0, level: 80, tune: 0, kgs: [kg({ sample: 0, attack: 40, release: 50, filter: 80 })] },
    { name: 'E.PIANO', midiCh: 0, level: 85, tune: 0, kgs: [kg({ sample: 1, release: 25, velFilter: 40 })] },
    { name: 'SYN BASS', midiCh: 0, level: 85, tune: 0, kgs: [kg({ sample: 2, filter: 70, velFilter: 50, decay: 40, sustain: 70, release: 8 })] },
    { name: 'DRUM KIT', midiCh: 0, level: 90, tune: 0, kgs: [kg({ lo: 35, hi: 37, sample: 3 }), kg({ lo: 38, hi: 41, sample: 4 }), kg({ lo: 42, hi: 46, sample: 5 })] },
  ];
  return { samples: out, programs };
}
