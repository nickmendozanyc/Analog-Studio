// LTC (SMPTE linear timecode) encoder / decoder for the SBX-80 sync engine.
// Renderer- and platform-independent: works on Float32Array samples, so the same code reads track 24 of a tape transfer
// in the browser mockup, in Node tests, and ports 1:1 to the C++ engine.
//
// LTC: 80-bit frames, biphase-mark coded (a transition at every bit-cell boundary, an extra one mid-cell for a 1),
// least-significant bit first, ending with the sync word 0011 1111 1111 1101 (bits 64..79). Read backwards (tape
// rewinding past the head) the sync word arrives reversed, which tells us the direction.
//
// The decoder is built for real transfers of old 2" tape: it tracks the bit rate adaptively (transfer speed error,
// vari-speed, wow), ignores dropouts and freewheels across them, reads forward and reverse, and auto-detects
// 24 / 25 / 30 fps and 29.97 drop-frame.

const SYNC_FWD = [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1];
const SYNC_REV = [...SYNC_FWD].reverse();

// --- timecode <-> seconds -------------------------------------------------------------------------------------
export function tcToFrames({ h, m, s, f }, fps, df) {
  if (!df) return ((h * 60 + m) * 60 + s) * Math.round(fps) + f;
  const tm = h * 60 + m;
  return 108000 * h + 1800 * m + 30 * s + f - 2 * (tm - Math.floor(tm / 10));
}
export function tcToSeconds(tc, fps, df) { return tcToFrames(tc, fps, df) / (df ? 30000 / 1001 : fps); }
export function framesToTc(n, fps, df) {
  if (df) {   // SMPTE drop-frame: skip frames 0 and 1 at the start of every minute except multiples of 10
    const d = Math.floor(n / 17982), mm = n % 17982;
    n += 18 * d + (mm > 1 ? 2 * Math.floor((mm - 2) / 1798) : 0);
    fps = 30;
  }
  const F = Math.round(fps);
  return { h: Math.floor(n / (F * 3600)) % 24, m: Math.floor(n / (F * 60)) % 60, s: Math.floor(n / F) % 60, f: n % F };
}
export const tcString = ({ h, m, s, f }, df = false) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${df ? ';' : ':'}${String(f).padStart(2, '0')}`;

// --- frame bits -----------------------------------------------------------------------------------------------
function putBCD(bits, at, v, n) { for (let i = 0; i < n; i++) bits[at + i] = (v >> i) & 1; }
function getBCD(bits, at, n) { let v = 0; for (let i = 0; i < n; i++) v |= bits[at + i] << i; return v; }
export function frameBits({ h, m, s, f }, df = false) {
  const b = new Array(80).fill(0);
  putBCD(b, 0, f % 10, 4); putBCD(b, 8, Math.floor(f / 10), 2); b[10] = df ? 1 : 0;
  putBCD(b, 16, s % 10, 4); putBCD(b, 24, Math.floor(s / 10), 3);
  putBCD(b, 32, m % 10, 4); putBCD(b, 40, Math.floor(m / 10), 3);
  putBCD(b, 48, h % 10, 4); putBCD(b, 56, Math.floor(h / 10), 2);
  // biphase polarity correction bit (bit 27 at 25 fps is different; 27 is used for 24/30) keeps each frame's
  // transition count even, as real generators do
  let ones = b.reduce((a, x) => a + x, 0) + SYNC_FWD.reduce((a, x) => a + x, 0);
  if (ones % 2) b[27] = 1;
  for (let i = 0; i < 16; i++) b[64 + i] = SYNC_FWD[i];
  return b;
}
export function parseBits(b) {
  const f = getBCD(b, 0, 4) + 10 * getBCD(b, 8, 2), s = getBCD(b, 16, 4) + 10 * getBCD(b, 24, 3);
  const m = getBCD(b, 32, 4) + 10 * getBCD(b, 40, 3), h = getBCD(b, 48, 4) + 10 * getBCD(b, 56, 2);
  if (f > 29 || s > 59 || m > 59 || h > 23) return null;
  return { h, m, s, f, df: !!b[10] };
}

// --- encoder (test signals and the box's SMPTE OUT) -------------------------------------------------------------
// start: { h, m, s, f }; seconds of code; speed: playback speed factor (1.08 = 8 % fast); level 0..1
export function encode({ start, seconds, fps = 30, df = false, sampleRate = 48000, speed = 1, level = 0.5 }) {
  const rate = df ? 30000 / 1001 : fps, bitDur = sampleRate / (rate * 80 * speed);
  const nFrames = Math.ceil(seconds * rate);
  const out = new Float32Array(Math.ceil(nFrames * 80 * bitDur) + 8);
  let n0 = tcToFrames(start, fps, df), pol = 1, t = 0;
  const half = (len) => { const a = Math.round(t), b = Math.round(t + len); for (let i = a; i < b && i < out.length; i++) out[i] = pol * level; t += len; };
  for (let k = 0; k < nFrames; k++) {
    const bits = frameBits(framesToTc(n0 + k, fps, df), df);
    for (const bit of bits) { pol = -pol; if (bit) { half(bitDur / 2); pol = -pol; half(bitDur / 2); } else half(bitDur); }
  }
  // a touch of rise-time smoothing, like a real tape head
  for (let i = 1; i < out.length; i++) out[i] = out[i - 1] + (out[i] - out[i - 1]) * 0.6;
  return out;
}

// --- decoder ----------------------------------------------------------------------------------------------------
// Returns { frames: [{ sample, tc, df, dir }], fps, df, segments, dropouts }.
// sample is the index at the end of the frame's sync word (forward) or its start (reverse).
export function decode(x, sampleRate, opts = {}) {
  const { fpsHint = null } = opts;
  // DC removal + level detect for hysteresis
  let dc = 0, env = 0; const N = x.length;
  const y = new Float32Array(N);
  for (let i = 0; i < N; i++) { dc += (x[i] - dc) * 0.001; y[i] = x[i] - dc; env = Math.max(env * 0.9995, Math.abs(y[i])); y[i] /= Math.max(env, 1e-4); }
  // zero crossings with hysteresis -> transition times (interpolated)
  const tr = []; let state = y[0] >= 0 ? 1 : -1;
  for (let i = 1; i < N; i++) {
    if (state > 0 && y[i] < -0.15) { state = -1; tr.push(i - 1 + y[i - 1] / (y[i - 1] - y[i] || 1)); }
    else if (state < 0 && y[i] > 0.15) { state = 1; tr.push(i - 1 + y[i - 1] / (y[i - 1] - y[i] || 1)); }
  }
  if (tr.length < 200) return { frames: [], fps: null, df: false, segments: [], dropouts: 0 };
  // initial bit period: the long intervals of the first stretch
  const iv0 = []; for (let i = 1; i < Math.min(tr.length, 4000); i++) iv0.push(tr[i] - tr[i - 1]);
  iv0.sort((a, b) => a - b); let T = iv0[Math.floor(iv0.length * 0.9)];
  // intervals -> bits (two halves = 1, one full = 0), adaptive T; long gaps reset (dropout)
  const frames = []; const bits = []; const bitAt = []; let pendingHalf = false, dropouts = 0;
  const check = () => {
    const L = bits.length; if (L < 80) return;
    const tail = bits.slice(L - 16).join(''), fwd = SYNC_FWD.join(''), rev = SYNC_REV.join('');
    if (tail === fwd) { const fb = bits.slice(L - 80); const tc = parseBits(fb); if (tc) frames.push({ sample: bitAt[L - 1], tc, df: tc.df, dir: 1 }); }
    else if (bits.slice(L - 80, L - 64).join('') === rev) { const fb = bits.slice(L - 80).reverse(); const tc = parseBits(fb); if (tc) frames.push({ sample: bitAt[L - 80], tc, df: tc.df, dir: -1 }); }
    if (L > 4000) { bits.splice(0, L - 200); bitAt.splice(0, L - 200); }
  };
  for (let i = 1; i < tr.length; i++) {
    const d = tr[i] - tr[i - 1];
    if (d > T * 3) { dropouts++; pendingHalf = false; bits.length = 0; bitAt.length = 0; continue; }   // signal lost
    if (d < T * 0.75) {
      if (pendingHalf) { bits.push(1); bitAt.push(tr[i]); pendingHalf = false; T += (2 * d - T) * 0.05; check(); } else pendingHalf = true;
    } else {
      if (pendingHalf) { pendingHalf = false; }   // a lone half: resync on the next full cell
      bits.push(0); bitAt.push(tr[i]); T += (d - T) * 0.05; check();
    }
  }
  // frame rate: highest frame number seen, drop-frame flag, else the measured frame period
  let maxF = 0, dfVotes = 0; for (const fr of frames) { maxF = Math.max(maxF, fr.tc.f); if (fr.df) dfVotes++; }
  const df = dfVotes > frames.length / 2;
  let fps = fpsHint || (df ? 29.97 : maxF >= 29 ? 30 : maxF >= 24 ? 25 : 24);
  if (!fpsHint && fps === 30 && !df) {   // 30 vs 29.97 non-drop: compare code time to file time over a clean run
    const a = frames[0], b = frames[frames.length - 1];
    const codeSec = (tcToFrames(b.tc, 30, false) - tcToFrames(a.tc, 30, false)) / 30, fileSec = (b.sample - a.sample) / sampleRate;
    if (codeSec > 10 && Math.abs(fileSec / codeSec - 1.001) < 0.0004) fps = 29.97;
  }
  // continuous runs (segments): same direction, each frame one frame on from the last (allowing short dropouts)
  const rate = df ? 30000 / 1001 : fps, segs = [];
  let cur = null;
  for (const fr of frames) {
    const sec = tcToFrames(fr.tc, Math.round(fps), df) / rate;
    if (cur && fr.dir === cur.dir) {
      const dt = (fr.sample - cur.s1) / sampleRate, dc = (sec - cur.c1) * fr.dir;
      if (dc > 0 && dc < 0.5 && Math.abs(dc - dt * cur.ratio) < 0.25) { cur.s1 = fr.sample; cur.c1 = sec; cur.n++; cur.ratio = Math.abs(cur.c1 - cur.c0) / Math.max(1e-6, (cur.s1 - cur.s0) / sampleRate); continue; }
    }
    cur = { dir: fr.dir, s0: fr.sample, s1: fr.sample, c0: sec, c1: sec, n: 1, ratio: 1 };
    segs.push(cur);
  }
  const segments = segs.filter((s) => s.n >= 3).map((s) => ({ dir: s.dir, t0: s.s0 / sampleRate, t1: s.s1 / sampleRate, code0: s.c0, code1: s.c1, speed: s.ratio }));
  return { frames, fps, df, segments, dropouts };
}

// code (seconds) at file time t (seconds), interpolating within segments and freewheeling up to `flywheel` seconds
// past a segment's end (the SBX keeps counting through short dropouts).
export function codeAt(segments, t, flywheel = 0.5) {
  for (const s of segments) {
    if (t >= s.t0 - 1e-9 && t <= s.t1 + flywheel) return s.code0 + (t - s.t0) * s.speed * s.dir;
  }
  return null;
}
