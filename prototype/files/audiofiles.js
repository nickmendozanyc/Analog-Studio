// Audio and session file writers for JH-Studio. Plain JS, no dependencies: runs in the page, in Node tests, and
// ports to the native app. Input samples are Float32Array, full scale ±1.

const clampI = (x, max) => Math.max(-max - 1, Math.min(max, Math.round(x * max)));
const toInt = (x, bits) => { const max = bits === 16 ? 32767 : 8388607, o = new Int32Array(x.length); for (let i = 0; i < x.length; i++) o[i] = clampI(x[i], max); return o; };

// ---- WAV (PCM 16 / 24 bit or 32-bit float), mono
export function wav(x, fs, bits = 24) {
  const fl = bits === 32, bps = bits / 8, n = x.length, b = new ArrayBuffer(44 + n * bps), v = new DataView(b);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * bps, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, fl ? 3 : 1, true); v.setUint16(22, 1, true); v.setUint32(24, fs, true); v.setUint32(28, fs * bps, true); v.setUint16(32, bps, true); v.setUint16(34, bits, true);
  str(36, 'data'); v.setUint32(40, n * bps, true);
  if (fl) for (let i = 0; i < n; i++) v.setFloat32(44 + i * 4, x[i], true);
  else { const q = toInt(x, bits); for (let i = 0; i < n; i++) { const o = 44 + i * bps; if (bits === 16) v.setInt16(o, q[i], true); else { v.setUint8(o, q[i] & 255); v.setUint8(o + 1, (q[i] >> 8) & 255); v.setUint8(o + 2, (q[i] >> 16) & 255); } } }
  return new Uint8Array(b);
}

// ---- AIFF (PCM 16 / 24 bit, big-endian), mono
export function aiff(x, fs, bits = 24) {
  const bps = bits / 8, n = x.length, ssnd = 8 + n * bps, b = new ArrayBuffer(12 + 26 + 8 + ssnd), v = new DataView(b);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'FORM'); v.setUint32(4, b.byteLength - 8); str(8, 'AIFF');
  str(12, 'COMM'); v.setUint32(16, 18); v.setUint16(20, 1); v.setUint32(22, n); v.setUint16(26, bits);
  // sample rate as an 80-bit IEEE extended float
  const e = Math.floor(Math.log2(fs)), m = fs / 2 ** e; v.setUint16(28, 16383 + e); v.setUint32(30, Math.floor(m * 2 ** 31) >>> 0); v.setUint32(34, 0);
  str(38, 'SSND'); v.setUint32(42, ssnd); v.setUint32(46, 0); v.setUint32(50, 0);
  const q = toInt(x, bits);
  for (let i = 0; i < n; i++) { const o = 54 + i * bps; if (bits === 16) v.setInt16(o, q[i]); else { v.setUint8(o, (q[i] >> 16) & 255); v.setUint8(o + 1, (q[i] >> 8) & 255); v.setUint8(o + 2, q[i] & 255); } }
  return new Uint8Array(b);
}

// ---- FLAC (16 / 24 bit), mono, fixed linear prediction (orders 0-4 per frame) with Rice-coded residuals
class Bits {
  constructor(cap = 1 << 16) { this.b = new Uint8Array(cap); this.n = 0; this.acc = 0; this.k = 0; }
  grow() { const c = new Uint8Array(this.b.length * 2); c.set(this.b); this.b = c; }
  byte(x) { if (this.n >= this.b.length) this.grow(); this.b[this.n++] = x; }
  put(v, k) {   // k <= 32 bits, v as unsigned in its low k bits
    for (let i = k - 1; i >= 0; i--) { this.acc = (this.acc << 1) | (Math.floor(v / 2 ** i) & 1); if (++this.k === 8) { this.byte(this.acc); this.acc = 0; this.k = 0; } }
  }
  bit(x) { this.acc = (this.acc << 1) | x; if (++this.k === 8) { this.byte(this.acc); this.acc = 0; this.k = 0; } }
  zeros(q) { while (q > 0) { if (this.k === 0 && q >= 8) { this.byte(0); q -= 8; } else { this.bit(0); q--; } } }
  align() { while (this.k) this.bit(0); }
  bytes() { return this.b.subarray(0, this.n); }
}
const CRC8 = (() => { const t = new Uint8Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 0x80 ? ((c << 1) ^ 0x07) & 255 : (c << 1) & 255; t[i] = c; } return t; })();
const CRC16 = (() => { const t = new Uint16Array(256); for (let i = 0; i < 256; i++) { let c = i << 8; for (let k = 0; k < 8; k++) c = c & 0x8000 ? ((c << 1) ^ 0x8005) & 0xffff : (c << 1) & 0xffff; t[i] = c; } return t; })();
export function flac(x, fs, bits = 24) {
  const N = 4096, q = toInt(x, bits), total = q.length, out = [];
  const head = new Bits(64);
  for (const c of 'fLaC') head.put(c.charCodeAt(0), 8);
  head.put(1, 1); head.put(0, 7); head.put(34, 24);   // last metadata block: STREAMINFO
  head.put(N, 16); head.put(N, 16); head.put(0, 24); head.put(0, 24);
  head.put(fs, 20); head.put(0, 3); head.put(bits - 1, 5); head.put(Math.floor(total / 2 ** 32), 4); head.put(total >>> 0, 32);
  for (let i = 0; i < 16; i++) head.put(0, 8);   // MD5 unknown (allowed)
  out.push(head.bytes().slice());
  const res = new Int32Array(N);
  for (let f = 0, s0 = 0; s0 < total; f++, s0 += N) {
    const n = Math.min(N, total - s0), bk = new Bits(n * 4 + 64);
    bk.put(0xfff8, 16);
    const full = n === N; bk.put(full ? 12 : 7, 4); bk.put(0, 4); bk.put(0, 4); bk.put(bits === 16 ? 4 : 6, 3); bk.put(0, 1);
    // frame number, UTF-8 style
    if (f < 0x80) bk.put(f, 8); else if (f < 0x800) { bk.put(0xc0 | (f >> 6), 8); bk.put(0x80 | (f & 63), 8); } else if (f < 0x10000) { bk.put(0xe0 | (f >> 12), 8); bk.put(0x80 | ((f >> 6) & 63), 8); bk.put(0x80 | (f & 63), 8); } else { bk.put(0xf0 | (f >> 18), 8); bk.put(0x80 | ((f >> 12) & 63), 8); bk.put(0x80 | ((f >> 6) & 63), 8); bk.put(0x80 | (f & 63), 8); }
    if (!full) bk.put(n - 1, 16);
    let c8 = 0; const hb = bk.bytes(); for (let i = 0; i < hb.length; i++) c8 = CRC8[c8 ^ hb[i]]; bk.put(c8, 8);
    // pick the fixed predictor order with the smallest residual
    const s = (i) => q[s0 + i];
    const pred = [(i) => 0, (i) => s(i - 1), (i) => 2 * s(i - 1) - s(i - 2), (i) => 3 * s(i - 1) - 3 * s(i - 2) + s(i - 3), (i) => 4 * s(i - 1) - 6 * s(i - 2) + 4 * s(i - 3) - s(i - 4)];
    let order = 0, best = Infinity;
    for (let o = 0; o <= Math.min(4, n - 1); o++) { let sum = 0; for (let i = o; i < n; i++) sum += Math.abs(s(i) - pred[o](i)); if (sum < best) { best = sum; order = o; } }
    bk.put(0, 1); bk.put(8 | order, 6); bk.put(0, 1);   // FIXED subframe, no wasted bits
    for (let i = 0; i < order; i++) bk.put(s(i) < 0 ? s(i) + 2 ** bits : s(i), bits);
    const m = n - order; let um = 0;
    for (let i = 0; i < m; i++) { const r = s(i + order) - pred[order](i + order); res[i] = r >= 0 ? 2 * r : -2 * r - 1; um += res[i]; }
    let k = 0, kb = Infinity;
    for (let kk = 0; kk <= 30; kk++) { let b = m * (kk + 1); for (let i = 0; i < m; i++) b += Math.floor(res[i] / 2 ** kk); if (b < kb) { kb = b; k = kk; } }
    if (k <= 14) { bk.put(0, 2); bk.put(0, 4); bk.put(k, 4); }   // Rice, partition order 0, 4-bit parameter
    else { bk.put(1, 2); bk.put(0, 4); bk.put(k, 5); }            // RICE2: 5-bit parameter for loud 24-bit material
    for (let i = 0; i < m; i++) { const u = res[i], hi = Math.floor(u / 2 ** k); bk.zeros(hi); bk.bit(1); if (k) bk.put(u - hi * 2 ** k, k); }
    bk.align();
    let c16 = 0; const fb = bk.bytes(); for (let i = 0; i < fb.length; i++) c16 = ((c16 << 8) & 0xffff) ^ CRC16[(c16 >> 8) ^ fb[i]];
    bk.put(c16, 16);
    out.push(bk.bytes().slice());
  }
  return concat(out);
}

export function concat(parts) { const t = parts.reduce((a, p) => a + p.length, 0), o = new Uint8Array(t); let k = 0; for (const p of parts) { o.set(p, k); k += p.length; } return o; }

// ---- ZIP (stored, no compression): bundles the stems into one download
const CRC32 = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
export const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC32[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function zip(files) {   // files: [{ name, data: Uint8Array }]
  const enc = new TextEncoder(), parts = [], dir = []; let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), c = crc32(f.data), h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint32(14, c, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, nm.length, true);
    parts.push(new Uint8Array(h.buffer), nm, f.data);
    const d = new DataView(new ArrayBuffer(46));
    d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint32(16, c, true); d.setUint32(20, f.data.length, true); d.setUint32(24, f.data.length, true); d.setUint16(28, nm.length, true); d.setUint32(42, off, true);
    dir.push(new Uint8Array(d.buffer), nm);
    off += 30 + nm.length + f.data.length;
  }
  const dsz = dir.reduce((a, p) => a + p.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, dsz, true); e.setUint32(16, off, true);
  return concat([...parts, ...dir, new Uint8Array(e.buffer)]);
}

// ---- .TAP: one reel of tape. "ASTAP1" + JSON length + JSON (everything but the audio) + the recorded flux as float32
export function writeTap(meta, tracks) {   // tracks[i] = [{ ...piece fields, data: Float32Array }]
  const blobs = [], json = { ...meta, tracks: tracks.map((t) => t.map(({ data, ...rest }) => { blobs.push(data); return { ...rest, lo: isFinite(rest.lo) ? rest.lo : null, hi: isFinite(rest.hi) ? rest.hi : null, n: data.length }; })) };
  const js = new TextEncoder().encode(JSON.stringify(json)), h = new DataView(new ArrayBuffer(10));
  'ASTAP1'.split('').forEach((c, i) => h.setUint8(i, c.charCodeAt(0))); h.setUint32(6, js.length, true);
  const pad = (4 - ((10 + js.length) % 4)) % 4;
  return concat([new Uint8Array(h.buffer), js, new Uint8Array(pad), ...blobs.map((b) => new Uint8Array(b.buffer, b.byteOffset, b.byteLength))]);
}
export function readTap(u8) {
  const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (String.fromCharCode(...u8.subarray(0, 6)) !== 'ASTAP1') throw new Error('not a JH-Studio .TAP file');
  const L = v.getUint32(6, true), meta = JSON.parse(new TextDecoder().decode(u8.subarray(10, 10 + L)));
  let off = 10 + L; off += (4 - (off % 4)) % 4;
  meta.tracks = meta.tracks.map((t) => t.map((p) => { const data = new Float32Array(u8.buffer.slice(u8.byteOffset + off, u8.byteOffset + off + p.n * 4)); off += p.n * 4; return { ...p, lo: p.lo ?? -Infinity, hi: p.hi ?? Infinity, data }; }));
  return meta;
}
