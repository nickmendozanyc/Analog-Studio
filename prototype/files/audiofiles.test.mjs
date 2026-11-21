import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wav, aiff, flac, zip, writeTap, readTap, crc32 } from './audiofiles.js';

const dir = mkdtempSync(join(tmpdir(), 'asf-'));
const fs = 48000, N = 48000 * 2 + 1234;   // not a multiple of the FLAC block
const x = new Float32Array(N); for (let i = 0; i < N; i++) x[i] = 0.5 * Math.sin(2 * Math.PI * 440 * i / fs) + 0.2 * Math.sin(2 * Math.PI * 7000 * i / fs) + (i > 30000 && i < 31000 ? 0.25 : 0) + ((i * 2654435761) % 1000) / 1e5;
// decode any file with ffmpeg to raw float, compare with the quantised source
function decode(bytes, ext) { const f = join(dir, `t.${ext}`); writeFileSync(f, bytes); const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', f, '-f', 'f32le', '-acodec', 'pcm_f32le', '-ar', String(fs), '-']); return new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4); }
const probe = (bytes, ext) => { const f = join(dir, `p.${ext}`); writeFileSync(f, bytes); return execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels,bits_per_raw_sample,bits_per_sample', '-of', 'compact', f]).toString(); };
const maxErr = (a, b) => { assert.equal(a.length, b.length, 'length'); let e = 0; for (let i = 0; i < a.length; i++) e = Math.max(e, Math.abs(a[i] - b[i])); return e; };

for (const bits of [16, 24]) {
  const lsb = bits === 16 ? 1 / 32767 : 1 / 8388607;
  test(`WAV ${bits}-bit decodes to the same samples`, () => assert.ok(maxErr(decode(wav(x, fs, bits), 'wav'), x) <= lsb * 2.01));
  test(`AIFF ${bits}-bit decodes to the same samples`, () => assert.ok(maxErr(decode(aiff(x, fs, bits), 'aiff'), x) <= lsb * 2.01));
  test(`FLAC ${bits}-bit is lossless and valid (ffmpeg decodes it, CRCs check)`, () => {
    const b = flac(x, fs, bits);
    assert.match(probe(b, 'flac'), /codec_name=flac\|sample_rate=48000\|channels=1/);
    const y = decode(b, 'flac'), q = (v) => Math.round(v * (bits === 16 ? 32767 : 8388607)), qd = (v) => Math.round(v * (bits === 16 ? 32768 : 8388608));
    for (let i = 0; i < N; i++) assert.equal(qd(y[i]) | 0, q(x[i]) | 0, `sample ${i}`);
    assert.ok(b.length < N * bits / 8, `compressed (${b.length} bytes)`);
  });
}
test('WAV 32-bit float is exact', () => assert.equal(maxErr(decode(wav(x, fs, 32), 'wav'), x), 0));
test('ZIP: stored entries with good CRCs', () => {
  const f = join(dir, 'z.zip'); writeFileSync(f, zip([{ name: 'a.wav', data: wav(x, fs, 16) }, { name: 'b.txt', data: new TextEncoder().encode('hi') }]));
  const out = execFileSync('python3', ['-I', '-c', `import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);print(z.testzip(),[i.filename for i in z.infolist()])`, f]).toString();
  assert.match(out, /None \['a.wav', 'b.txt'\]/);
});
test('.TAP round trip', () => {
  const tr = [[{ u0: 1.5, du: 0.0001, post: false, lo: -Infinity, hi: 3, fadeLo: 0, fadeHi: 0.01, data: x.slice(0, 1000) }], [], [{ u0: 0, du: 1, post: true, lo: -Infinity, hi: Infinity, fadeLo: 0, fadeHi: 0, data: x.slice(5, 9) }]];
  const m = readTap(writeTap({ format: 'jh-studio-tap', tape: 'gp9' }, tr));
  assert.equal(m.tape, 'gp9'); assert.equal(m.tracks.length, 3); assert.equal(m.tracks[0][0].hi, 3); assert.equal(m.tracks[0][0].lo, -Infinity);
  assert.deepEqual([...m.tracks[0][0].data], [...x.slice(0, 1000)]); assert.deepEqual([...m.tracks[2][0].data], [...x.slice(5, 9)]);
});
