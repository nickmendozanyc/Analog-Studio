// Demo tape: one minute of synthesized dummy audio for the HJ-24, plus 30 fps SMPTE on track 24.
// 96 BPM in 4/4, bar 1 at 2 s after the counter zero (01:00:02:00, the SBX-80's default offset and tempo).
// Tracks: 1 kick, 2 snare, 3 hats, 4 toms, 5 / 6 overheads L / R, 7 bass, 8 guitar, 24 SMPTE.
// Deterministic (seeded noise), so every machine makes the same tape. Needs `encode` from prototype/sync/ltc.js.

export function demoTape(fs, encodeLTC) {
  const SEC = 60, N = SEC * fs, BPM = 96, beat = 60 / BPM, bar = 4 * beat, t0 = 2;
  const bars = Math.floor((SEC - t0 - 2.5) / bar);   // the last bar rings out before the minute
  const tr = {}; const mk = (k) => (tr[k] = new Float32Array(N));
  ['kick', 'snare', 'hats', 'toms', 'ohl', 'ohr', 'bass', 'gtr'].forEach(mk);
  let seed = 22222; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
  const add = (a, t, fn, len) => { const i0 = Math.round(t * fs), n = Math.min(Math.round(len * fs), N - i0); for (let i = 0; i < n; i++) a[i0 + i] += fn(i / fs); };
  // one-pole filters, run in place
  const lp = (x, f) => { const k = 1 - Math.exp(-2 * Math.PI * f / fs); let y = 0; for (let i = 0; i < x.length; i++) { y += k * (x[i] - y); x[i] = y; } return x; };
  const hp = (x, f) => { const k = 1 - Math.exp(-2 * Math.PI * f / fs); let y = 0; for (let i = 0; i < x.length; i++) { y += k * (x[i] - y); x[i] -= y; } return x; };

  // ---- drums
  const kick = (t, v = 1) => { let ph = 0; add(tr.kick, t, (s) => { ph += 2 * Math.PI * (45 + 90 * Math.exp(-s * 28)) / fs; return v * (Math.sin(ph) * Math.exp(-s * 7) + (s < 0.004 ? 0.5 * rnd() : 0)); }, 0.5); };
  const snare = (t, v = 1) => add(tr.snare, t, (s) => v * (0.55 * Math.sin(2 * Math.PI * 185 * s) * Math.exp(-s * 22) + 0.6 * rnd() * Math.exp(-s * 13)), 0.35);
  const hat = (t, open) => add(tr.hats, t, (s) => (rnd() * 0.5 + 0.5 * Math.sign(Math.sin(2 * Math.PI * 5410 * s) * Math.sin(2 * Math.PI * 7930 * s))) * Math.exp(-s * (open ? 7 : 45)) * (open ? 0.5 : 0.4), open ? 0.6 : 0.12);
  const tom = (t, f) => { let ph = 0; add(tr.toms, t, (s) => { ph += 2 * Math.PI * f * (1 + 0.5 * Math.exp(-s * 30)) / fs; return Math.sin(ph) * Math.exp(-s * 6) + 0.15 * rnd() * Math.exp(-s * 40); }, 0.6); };
  const crashes = [];
  for (let b = 0; b < bars; b++) {
    const T = t0 + b * bar, fill = b % 4 === 3 && b < bars - 1;
    kick(T); kick(T + 2 * beat); if (b % 2) kick(T + 2.5 * beat, 0.7);
    snare(T + beat); if (!fill) snare(T + 3 * beat);
    for (let e = 0; e < (fill ? 6 : 8); e++) hat(T + e * beat / 2, e === 7);
    if (fill) [0, 1, 2, 3].forEach((k) => tom(T + 3 * beat + k * beat / 4, [196, 164, 123, 98][k]));
    if (b % 4 === 0) crashes.push(T);
  }
  kick(t0 + bars * bar); crashes.push(t0 + bars * bar);
  hp(tr.hats, 4000);
  // overheads: the kit from above (cymbals bright, drums softer), crashes, a little different left and right
  const crash = new Float32Array(N); for (const T of crashes) add(crash, T, (s) => rnd() * Math.exp(-s * 1.6), 2.4);
  hp(crash, 3000);
  for (let i = 0; i < N; i++) {
    const j = Math.max(0, i - Math.round(0.0006 * fs)), kit = 0.25 * tr.kick[i] + 0.6 * tr.snare[i] + 0.45 * tr.toms[i];
    tr.ohl[i] = kit + 0.9 * tr.hats[i] + 0.55 * crash[i];
    tr.ohr[j] += 0.8 * kit + 0.5 * tr.hats[i] + 0.7 * crash[i];
  }
  hp(tr.ohl, 120); hp(tr.ohr, 120);

  // ---- bass and guitar: Am - F - C - G, one chord per bar
  const roots = [45, 41, 48, 43], chords = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]];
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  for (let b = 0; b <= bars; b++) {
    const T = t0 + b * bar, r = hz(roots[b % 4] - 12), end = b === bars;
    [0, 1.5, 2, 3, 3.5].forEach((p, k) => {
      if (end && p > 0) return;
      const f = k === 4 ? r * 2 : r, len = end ? 2.2 : 0.45;
      let ph = 0; add(tr.bass, T + p * beat, (s) => { ph += f / fs; const saw = 2 * (ph % 1) - 1; return 0.8 * (saw * 0.6 + Math.sin(2 * Math.PI * ph)) * Math.min(1, s * 200) * Math.exp(-s * (end ? 1.5 : 3)); }, len);
    });
    // guitar: Karplus-Strong strums on 1, the and of 2, and 4
    for (const p of end ? [0] : [0, 1.5, 3]) chords[b % 4].forEach((m, k) => {
      const P = Math.round(fs / hz(m)), buf = new Float32Array(P).map(() => rnd()); let idx = 0;
      add(tr.gtr, T + p * beat + k * 0.012, () => { const y = buf[idx], z = buf[(idx + 1) % P]; buf[idx] = 0.4985 * (y + z); idx = (idx + 1) % P; return y * 0.35; }, end ? 3 : 1.2);
    });
  }
  lp(tr.bass, 900);
  for (let i = 0; i < N; i++) tr.gtr[i] = Math.tanh(2.2 * tr.gtr[i]) * 0.5;   // a little amp drive
  hp(tr.gtr, 90);

  // levels: each track's loudest stretch near 0 VU (-18 dBFS rms), peaks below -4 dBFS
  const VU0rms = 10 ** (-18 / 20);
  for (const k of Object.keys(tr)) {
    const x = tr[k]; let peakRms = 0;
    for (let w = 0; w + 0.3 * fs < N; w += Math.round(0.1 * fs)) { let s = 0; for (let i = w; i < w + 0.3 * fs; i++) s += x[i] * x[i]; peakRms = Math.max(peakRms, Math.sqrt(s / (0.3 * fs))); }
    let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(x[i]));
    const g = Math.min(VU0rms / Math.max(peakRms, 1e-9), 0.63 / Math.max(pk, 1e-9));
    for (let i = 0; i < N; i++) x[i] *= g;
  }
  // ---- track 24: SMPTE LTC, 30 fps non-drop, 01:00:00:00 at the counter zero, recorded around -10 VU (as is usual: low, so it can't bleed)
  const ltc = encodeLTC({ start: { h: 1, m: 0, s: 0, f: 0 }, seconds: SEC, fps: 30, sampleRate: fs, level: 0.07 }).subarray(0, N);
  const out = Array.from({ length: 24 }, () => null);
  ['kick', 'snare', 'hats', 'toms', 'ohl', 'ohr', 'bass', 'gtr'].forEach((k, i) => { out[i] = tr[k]; });
  out[23] = ltc;
  return { tracks: out, names: ['KICK', 'SNARE', 'HATS', 'TOMS', 'OH L', 'OH R', 'BASS', 'GUITAR'], seconds: SEC, bpm: BPM, bar1: t0 };
}
