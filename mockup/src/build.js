// Phase 0 static UI mockup generator for Analog Studio.
// Produces a single 3840x2160 SVG (wrapped in HTML) of the tape machine,
// autolocator, tape meter bridge, 32-channel console and outboard rack.
// Run: node mockup/src/build.js && node mockup/src/render.js

const fs = require('fs');
const path = require('path');

const W = 3840, H = 2160;
const out = [];
const p = (s) => out.push(s);

// ---------- deterministic randomness ----------
let seed = 1978;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pick = (a) => a[Math.floor(rnd() * a.length)];

// ---------- primitives ----------
const SANS = "'Helvetica Neue', Helvetica, Arial, 'FreeSans', 'Inter', sans-serif";
const MARKER = "'Permanent Marker', 'Comic Neue', 'FreeSans', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function text(x, y, s, size = 10, fill = '#e8e4d8', anchor = 'middle', weight = 600, extra = '') {
  p(`<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" ${extra}>${esc(s)}</text>`);
}
function rect(x, y, w, h, fill, extra = '') {
  p(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`);
}
function circle(cx, cy, r, fill, extra = '') {
  p(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`);
}
const rad = (deg) => (deg - 90) * Math.PI / 180;
const polar = (cx, cy, r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];

// Rotary knob. ang: -150..150 (0 = 12 o'clock)
function knob(cx, cy, r, cap = '#d9d4c7', ang = 0, opts = {}) {
  const { ticks = r >= 13, skirt = '#1b1c1f', pointer = '#ffffff', label, labelColor = '#cfcabd', labelSize, dark = false, kid, ch } = opts;
  if (kid) p(`<g data-kid="${kid}" data-ch="${ch}" data-a0="${ang.toFixed(1)}" data-cx="${cx}" data-cy="${cy}">`);
  if (ticks) {
    for (let i = 0; i <= 10; i++) {
      const a = -150 + i * 30;
      const [x1, y1] = polar(cx, cy, r * 1.22, a);
      const [x2, y2] = polar(cx, cy, r * 1.38, a);
      p(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${labelColor}" stroke-opacity="0.7" stroke-width="${i % 5 === 0 ? 1.6 : 1}"/>`);
    }
  }
  circle(cx + r * 0.12, cy + r * 0.28, r * 1.18, 'url(#kShadow)');
  circle(cx, cy, r * 1.08, skirt);
  circle(cx, cy, r * 1.08, 'url(#kSkirt)');
  circle(cx, cy, r * 0.8, cap);
  circle(cx, cy, r * 0.8, dark ? 'url(#capHiDark)' : 'url(#capHi)');
  p(`<circle cx="${cx}" cy="${cy}" r="${r * 0.8}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="0.8"/>`);
  const [px1, py1] = polar(cx, cy, r * 0.25, ang);
  const [px2, py2] = polar(cx, cy, r * 1.02, ang);
  p(`<g class="kptr"><line x1="${px1.toFixed(1)}" y1="${py1.toFixed(1)}" x2="${px2.toFixed(1)}" y2="${py2.toFixed(1)}" stroke="${pointer}" stroke-width="${Math.max(1.4, r * 0.13)}" stroke-linecap="round"/></g>`);
  if (kid) p('</g>');
  if (label) text(cx, cy + r * 1.38 + (labelSize || 9) + 1, label, labelSize || 9, labelColor, 'middle', 700, 'letter-spacing="0.6"');
}

// Big silver knob (1176 / monitor style)
function bigKnob(cx, cy, r, ang = 0, opts = {}) {
  const { label, labelColor = '#d8d8d8', capColor = '#1a1a1a', numbered = false } = opts;
  for (let i = 0; i <= 10; i++) {
    const a = -150 + i * 30;
    const [x1, y1] = polar(cx, cy, r * 1.15, a);
    const [x2, y2] = polar(cx, cy, r * 1.3, a);
    p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${labelColor}" stroke-width="1.4"/>`);
    if (numbered && i % 2 === 0) {
      const [tx, ty] = polar(cx, cy, r * 1.5, a);
      text(tx, ty + 3.5, String(i === 10 ? '∞' : i * 2), 9, labelColor, 'middle', 600);
    }
  }
  circle(cx + 3, cy + 7, r * 1.15, 'url(#kShadow)');
  circle(cx, cy, r, 'url(#chrome)');
  circle(cx, cy, r * 0.78, capColor);
  circle(cx, cy, r * 0.78, 'url(#capHiDark)');
  // knurling
  for (let i = 0; i < 48; i++) {
    const [x1, y1] = polar(cx, cy, r * 0.8, i * 7.5);
    const [x2, y2] = polar(cx, cy, r * 0.98, i * 7.5);
    p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-opacity="0.25" stroke-width="1"/>`);
  }
  const [px1, py1] = polar(cx, cy, r * 0.3, ang);
  const [px2, py2] = polar(cx, cy, r * 0.74, ang);
  p(`<line x1="${px1}" y1="${py1}" x2="${px2}" y2="${py2}" stroke="#f2f2f2" stroke-width="${r * 0.09}" stroke-linecap="round"/>`);
  if (label) text(cx, cy + r * 1.3 + 16, label, 10, labelColor, 'middle', 700, 'letter-spacing="1"');
}

// Illuminated push-button
const LIT = {
  red: ['#ff3b2f', '#5a1712'], amber: ['#ffb02e', '#4d3510'], green: ['#59f07a', '#163d20'],
  yellow: ['#ffe14a', '#4a4214'], white: ['#fff6e0', '#4a4740'], blue: ['#5fb4ff', '#16304a'], grey: ['#bfbfbf', '#3a3a3a'],
};
function button(x, y, w, h, color = 'grey', lit = false, label = '', opts = {}) {
  const [on, off] = LIT[color];
  const { labelIn = true, labelColor, size = Math.min(9, h * 0.5), pastel = false } = opts;
  if (pastel && !lit) {
    rect(x - 1, y - 1, w + 2, h + 3, '#000', 'rx="2.5" opacity="0.55"');
    rect(x, y, w, h, on, 'rx="2" opacity="0.78"');
    rect(x, y, w, h, 'url(#btnOff)', 'rx="2"');
    if (label) text(x + w / 2, y + h / 2 + size * 0.36, label, size, '#1a1208', 'middle', 800);
    return;
  }
  rect(x - 1, y - 1, w + 2, h + 3, '#000', 'rx="2.5" opacity="0.55"');
  if (lit) {
    rect(x, y, w, h, on, `rx="2" filter="url(#glow)"`);
    rect(x, y, w, h, 'url(#btnLit)', 'rx="2"');
  } else {
    rect(x, y, w, h, off, 'rx="2"');
    rect(x, y, w, h, 'url(#btnOff)', 'rx="2"');
  }
  if (label) {
    if (labelIn) text(x + w / 2, y + h / 2 + size * 0.36, label, size, lit ? '#1a1208' : (labelColor || '#d6d0c0'), 'middle', 800);
    else text(x + w / 2, y + h + size + 2, label, size, labelColor || '#cfcabd', 'middle', 700);
  }
}

// Long-throw fader. pos: 0 (top, +10dB) .. 1 (bottom, -inf)
const FADER_MARKS = [['+10', 0], ['5', 0.1], ['0', 0.22], ['5', 0.34], ['10', 0.46], ['20', 0.62], ['30', 0.74], ['40', 0.84], ['60', 0.93], ['∞', 1]];
function fader(cx, top, bottom, pos, opts = {}) {
  const { capW = 30, capH = 50, index = '#ffffff', scale = true, scaleColor = '#cfcabd', capFill = 'url(#faderCap)', scaleSize = 8, scaleGap = 9 } = opts;
  if (scale) {
    for (const [lab, f] of FADER_MARKS) {
      const y = top + f * (bottom - top);
      p(`<line x1="${cx - capW / 2 - scaleGap}" y1="${y}" x2="${cx - 6}" y2="${y}" stroke="${scaleColor}" stroke-opacity="${lab === '0' && f === 0.22 ? 1 : 0.55}" stroke-width="${lab === '0' && f === 0.22 ? 1.6 : 1}"/>`);
      text(cx - capW / 2 - scaleGap - 2 * scaleSize / 8, y + scaleSize * 0.36, lab, scaleSize, scaleColor, 'end', 600);
    }
  }
  rect(cx - 3.5, top - 6, 7, bottom - top + 12, '#050505', 'rx="3.5"');
  rect(cx - 1, top - 4, 2, bottom - top + 8, '#2a2a2a');
  const cy = top + pos * (bottom - top);
  rect(cx - capW / 2 + 3, cy - capH / 2 + 8, capW, capH, '#000', 'rx="4" opacity="0.5" filter="url(#soft)"');
  rect(cx - capW / 2, cy - capH / 2, capW, capH, capFill, 'rx="3"');
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const yy = cy + i * (capH / 9);
    p(`<line x1="${cx - capW / 2 + 3}" y1="${yy}" x2="${cx + capW / 2 - 3}" y2="${yy}" stroke="#000" stroke-opacity="0.35" stroke-width="1"/>`);
    p(`<line x1="${cx - capW / 2 + 3}" y1="${yy + 1}" x2="${cx + capW / 2 - 3}" y2="${yy + 1}" stroke="#fff" stroke-opacity="0.12" stroke-width="1"/>`);
  }
  rect(cx - capW / 2 + 2, cy - 1.5, capW - 4, 3, index);
}

// VU meter. db: -20..+3
const VU_MAP = [[-20, -45], [-10, -28], [-7, -18], [-5, -10], [-3, 0], [-2, 6], [-1, 12], [0, 19], [1, 27], [2, 35], [3, 45]];
function vuAngle(db) {
  db = Math.max(-20, Math.min(3, db));
  for (let i = 0; i < VU_MAP.length - 1; i++) {
    const [d0, a0] = VU_MAP[i], [d1, a1] = VU_MAP[i + 1];
    if (db >= d0 && db <= d1) return a0 + (a1 - a0) * (db - d0) / (d1 - d0);
  }
  return 45;
}
let vuId = 0;
function vu(x, y, w, h, db, opts = {}) {
  const { label = '', faceFill = 'url(#vuFace)', bezel = '#0e0e0f', brand = '', fontScale = 0.085 } = opts;
  const id = `vuc${vuId++}`;
  rect(x - 4, y - 4, w + 8, h + 8, bezel, 'rx="5"');
  rect(x - 4, y - 4, w + 8, h + 8, 'url(#bezelHi)', 'rx="5"');
  p(`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/></clipPath>`);
  p(`<g clip-path="url(#${id})">`);
  rect(x, y, w, h, faceFill);
  const cx = x + w / 2, cy = y + h * 1.12, R = h * 0.92;
  // scale arc
  const arc = (r, a0, a1, stroke, sw) => {
    const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
    p(`<path d="M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`);
  };
  arc(R * 0.78, -45, vuAngle(0), '#1b1712', Math.max(1, h * 0.012));
  arc(R * 0.78 + h * 0.025, vuAngle(0), 45, '#c81e12', h * 0.05);
  const fs = Math.max(6, h * fontScale);
  for (const [d] of VU_MAP) {
    const a = vuAngle(d);
    const [x1, y1] = polar(cx, cy, R * 0.78, a), [x2, y2] = polar(cx, cy, R * 0.86, a);
    p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${d > 0 ? '#c81e12' : '#1b1712'}" stroke-width="${Math.max(1, h * 0.014)}"/>`);
    if ([-20, -10, -7, -5, -3, -1, 0, 1, 2, 3].includes(d) && !(h < 90 && [-7, -1, 2].includes(d)) && !(fontScale > 0.1 && [-1, 1, 2].includes(d))) {
      const [tx, ty] = polar(cx, cy, R * 0.93, a);
      text(tx, ty + fs * 0.35, d > 0 ? `+${d}` : String(Math.abs(d)), fs, d > 0 ? '#c81e12' : '#1b1712', 'middle', 700);
    }
  }
  // minor ticks
  for (let a = -45; a <= 45; a += 4.5) {
    const [x1, y1] = polar(cx, cy, R * 0.78, a), [x2, y2] = polar(cx, cy, R * 0.81, a);
    p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1b1712" stroke-opacity="0.6" stroke-width="0.7"/>`);
  }
  text(cx, y + h * 0.66, 'VU', h * 0.15, '#1b1712', 'middle', 800, 'letter-spacing="1"');
  if (brand) text(x + w * 0.08, y + h * 0.9, brand, h * 0.065, '#3a3226', 'start', 700);
  if (label) text(x + w * 0.92, y + h * 0.9, label, h * 0.085, '#3a3226', 'end', 800);
  // needle
  const a = vuAngle(db);
  if (opts.needleId != null) {
    // animatable needle: drawn upright, rotated by the page script (class vuN, data-i = meter index)
    const [nx, ny] = polar(cx, cy, R * 0.9, 0), [bx, by] = polar(cx, cy, R * 0.3, 0);
    p(`<g class="vuN" data-i="${opts.needleId}" data-cx="${cx}" data-cy="${cy}" transform="rotate(${a} ${cx} ${cy})">`);
    p(`<line x1="${bx + 2}" y1="${by + 3}" x2="${nx + 2}" y2="${ny + 3}" stroke="#000" stroke-opacity="0.18" stroke-width="${Math.max(1.2, h * 0.016)}"/>`);
    p(`<line x1="${bx}" y1="${by}" x2="${nx}" y2="${ny}" stroke="#111" stroke-width="${Math.max(1, h * 0.013)}" stroke-linecap="round"/>`);
    p(`</g>`);
  } else {
  const [nx, ny] = polar(cx, cy, R * 0.9, a);
  const [bx, by] = polar(cx, cy, R * 0.3, a);
  p(`<line x1="${bx + 2}" y1="${by + 3}" x2="${nx + 2}" y2="${ny + 3}" stroke="#000" stroke-opacity="0.18" stroke-width="${Math.max(1.2, h * 0.016)}"/>`);
  p(`<line x1="${bx}" y1="${by}" x2="${nx}" y2="${ny}" stroke="#111" stroke-width="${Math.max(1, h * 0.013)}" stroke-linecap="round"/>`);
  }
  // pivot cover
  p(`<path d="M${x} ${y + h} L${x} ${y + h * 0.86} Q${cx} ${y + h * 0.74} ${x + w} ${y + h * 0.86} L${x + w} ${y + h} Z" fill="#1a1714"/>`);
  rect(x, y, w, h, 'url(#vuGlow)');
  rect(x, y, w, h * 0.45, 'url(#glass)');
  p(`</g>`);
  p(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="none" stroke="#000" stroke-opacity="0.6" stroke-width="1.2"/>`);
}

// 7-segment display
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '', P: 'abefg', E: 'adefg', L: 'def', r: 'eg', H: 'bcefg', A: 'abcefg', d: 'bcdeg', C: 'adef', t: 'defg', n: 'ceg', o: 'cdeg', S: 'afgcd', b: 'cdefg' };
function seg7(x, y, h, str, color = '#ff2a1a', opts = {}) {
  const { dim = 0.09, gap = 0.28 } = opts;
  const w = h * 0.55, t = h * 0.12;
  let cx = x;
  p(`<g transform="skewX(-6)" style="transform-box: fill-box">`);
  for (const ch of String(str)) {
    if (ch === ':') {
      circle(cx + t * 0.6, y + h * 0.3, t * 0.55, color, 'filter="url(#glowSm)"');
      circle(cx + t * 0.6, y + h * 0.7, t * 0.55, color, 'filter="url(#glowSm)"');
      cx += t * 2.2; continue;
    }
    if (ch === '.') {
      circle(cx - w * gap * 0.5, y + h - t * 0.5, t * 0.6, color, 'filter="url(#glowSm)"');
      continue;
    }
    const segs = {
      a: [cx + t, y, w - 2 * t, t], b: [cx + w - t, y + t, t, h / 2 - 1.5 * t + t * 0.5], c: [cx + w - t, y + h / 2 + t * 0.5, t, h / 2 - 1.5 * t],
      d: [cx + t, y + h - t, w - 2 * t, t], e: [cx, y + h / 2 + t * 0.5, t, h / 2 - 1.5 * t], f: [cx, y + t, t, h / 2 - 1.5 * t + t * 0.5],
      g: [cx + t, y + h / 2 - t / 2, w - 2 * t, t],
    };
    const on = SEG[ch] || '';
    for (const k of 'abcdefg') {
      const [sx, sy, sw, sh] = segs[k];
      const lit = on.includes(k);
      p(`<rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}" rx="${(t / 2).toFixed(1)}" fill="${color}" ${lit ? 'filter="url(#glowSm)"' : `opacity="${dim}"`}/>`);
    }
    cx += w + w * gap;
  }
  p(`</g>`);
  return cx;
}

function screw(cx, cy, r = 5) {
  circle(cx, cy + 1, r + 1, '#000', 'opacity="0.5"');
  circle(cx, cy, r, 'url(#chrome)');
  const a = rnd() * 180;
  const [x1, y1] = polar(cx, cy, r * 0.8, a), [x2, y2] = polar(cx, cy, r * 0.8, a + 180);
  p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="${r * 0.3}"/>`);
}

function ledLadder(x, y, n, w, h, level, horizontal = true) {
  for (let i = 0; i < n; i++) {
    const col = i >= n - 2 ? 'red' : i >= n - 4 ? 'yellow' : 'green';
    const on = i < level;
    const [c1, c0] = LIT[col];
    const xx = horizontal ? x + i * (w + 3) : x;
    const yy = horizontal ? y : y - i * (h + 3);
    rect(xx, yy, w, h, on ? c1 : c0, `rx="1" ${on ? 'filter="url(#glowSm)"' : ''}`);
  }
}

// Leximan 224X remote, traced from the user's photos (photo coordinates 430..1070 x 62..1062), drawn at scale sc
function remote224(ox, oy, sc, opts = {}) {
      p(`<g transform="translate(${ox} ${oy}) scale(${sc}) translate(-430 -62)">`);
  const T = (x, y, str, size, anchor = 'middle', w = 700, extra = '') => text(x, y, str, size, '#f2f4f8', anchor, w, extra);
  p(`<defs><linearGradient id="l224blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b7cc4"/><stop offset="0.6" stop-color="#2f6db3"/><stop offset="1" stop-color="#245a98"/></linearGradient></defs>`);
  rect(455, 84, 590, 962, 'url(#l224blue)');
  rect(455, 84, 590, 962, '#000', 'filter="url(#brushed)" opacity="0.05"');
  for (const x of [430, 1045]) { rect(x, 62, 25, 1000, '#111214', 'rx="4"'); rect(x + 4, 62, 4, 1000, '#fff', 'opacity="0.12"'); }
  // logo + model
  rect(486, 110, 162, 50, 'none', 'stroke="#f2f4f8" stroke-width="3"');
  T(567, 150, 'leximan', 40, 'middle', 900, 'letter-spacing="-1"');
  T(736, 150, '224X', 34, 'middle', 800); T(1002, 150, 'Digital Reverb', 30, 'end', 700, 'font-style="italic"');
  // display window: headroom bars + red 3-digit readout
  rect(515, 180, 475, 92, '#120404'); rect(515, 180, 260, 92, '#2a0705');
  T(533, 212, 'L', 16); T(533, 247, 'R', 16);
  [['24', 563], ['18', 598], ['12', 633], ['6', 668], ['0dB', 713]].forEach(([l, x]) => T(x, 233, l, 17, 'middle', 700));
  for (let k = 0; k < 6; k++) for (const yy of [200, 242]) rect(552 + k * 35, yy, 22, 6, '#ff3a24', `opacity="${k < (yy === 200 ? 4 : 3) ? 0.9 : 0.12}" ${k < 3 ? 'filter="url(#glowSm)"' : ''}`);
  T(748, 262, 'ovfl', 16);
  rect(778, 186, 138, 80, '#1a0503');
  if (opts.liveDisplay) p(`<text id="d224" x="905" y="252" text-anchor="end" font-family="'JetBrains Mono', monospace" font-weight="800" font-size="62" fill="#ff3a24" filter="url(#glowSm)">2.6</text>`); else seg7(790, 198, 56, '2.6', '#ff3a24');
  [['sec', 203, true], ['ms', 221, false], ['Hz', 239, false], ['kHz', 257, false]].forEach(([u, yy, on]) => { T(932, yy, u, 15, 'middle', 700); circle(966, yy - 5, 3.5, on ? '#ff3a24' : '#4a1612', `class="unit224" data-u="${u}" ${on ? 'filter="url(#glowSm)"' : ''}`); });
  T(638, 291, 'HEADROOM-dB', 13, 'middle', 800); T(753, 307, 'PROGRAM', 17, 'middle', 800);
  const cols = [550, 608, 666, 723, 780, 838, 897, 953];
  cols.forEach((x, i) => T(x, 330, String(i + 1), 17, 'middle', 700));
  // two rows of eight keys with red LEDs
  for (const [y0, litIdx] of [[342, 0], [458, 6]]) {
    rect(517, y0, 468, 90, '#141518');
    cols.forEach((x, i) => {
      rect(x - 25, y0 + 6, 50, 76, '#22252a'); rect(x - 25, y0 + 6, 50, 2, '#fff', 'opacity="0.12"');
      circle(x, y0 + 22, 7, i === litIdx ? '#ff3a24' : '#5a1410', `class="led224" data-row="${y0 === 342 ? 0 : 1}" data-i="${i}" ${i === litIdx ? 'filter="url(#glow)"' : ''}`);
      rect(x - 20, y0 + 40, 40, 36, '#2d3036', `class="key224" data-row="${y0 === 342 ? 0 : 1}" data-i="${i}"`); rect(x - 20, y0 + 40, 40, 36, 'url(#btnOff)', 'pointer-events="none"');
    });
  }
  p(`<path d="M1008 372 Q1022 372 1022 390 L1022 418 M1008 512 Q1022 512 1022 494 L1022 466" fill="none" stroke="#f2f4f8" stroke-width="2.5"/>`);
  T(1016, 438, "ext'd", 13, 'middle', 700); T(1016, 452, 'reg.', 13, 'middle', 700);
  [['PAGE', 553], ['SET', 610], ['CALL', 666], ['SHIFT', 724], ['A', 780], ['B', 838], ['C', 895], ['D', 952]].forEach(([l, x]) => T(x, 568, l, 17, 'middle', 700));
  T(553, 590, 'immed.', 13, 'middle', 700); T(718, 590, 'extended', 13, 'middle', 700);
  p(`<path d="M610 578 Q610 586 618 586 L660 586 Q668 586 668 578 M690 586 L686 586" fill="none" stroke="#f2f4f8" stroke-width="2"/><path d="M780 586 L816 586 M916 586 L952 586" stroke="#f2f4f8" stroke-width="2"/>`);
  T(866, 591, 'REGISTER', 17, 'middle', 700);
  // six long sliders with white tick lines between the slots
  const sl = [553, 632, 712, 791, 870, 950], pos = [0.92, 0.9, 0.55, 0.88, 0.7, 0.86];
  sl.forEach((x, i) => {
    rect(x - 4, 617, 8, 226, '#050505', 'rx="3"');
    if (i < 5) for (const ty of [637, 688, 740, 791]) rect(x + 16, ty, sl[i + 1] - x - 32, 3, '#f2f4f8', 'opacity="0.92"');
    const cy = 640 + pos[i] * 200;
    p(`<g class="sl224" data-i="${i}" data-pos="${pos[i]}" transform="translate(0 ${cy - 640})">`);
    rect(x - 33, 640 - 18, 70, 46, '#000', 'opacity="0.5" filter="url(#soft)"');
    rect(x - 35, 640 - 22, 70, 44, '#0c0c0e', 'rx="3"'); rect(x - 35, 640 - 22, 70, 3, '#3a3b3f'); rect(x - 35, 640 - 22, 70, 44, 'url(#btnOff)', 'rx="3" opacity="0.6"');
    p('</g>');
  });
  T(589, 882, 'REVERB-TIME', 15, 'middle', 800); T(555, 899, 'BASS', 15, 'middle', 800); T(634, 899, 'MID', 15, 'middle', 800);
  T(712, 882, 'CROSS-', 15, 'middle', 800); T(712, 899, 'OVER', 15, 'middle', 800);
  T(791, 882, 'TREBLE', 15, 'middle', 800); T(791, 899, 'DECAY', 15, 'middle', 800);
  T(871, 893, 'DEPTH', 15, 'middle', 800);
  T(949, 882, 'PRE-', 15, 'middle', 800); T(949, 899, 'DELAY', 15, 'middle', 800);
  // bottom row: six keys with LEDs
  rect(513, 905, 479, 82, '#0e0f11');
  sl.forEach((x, i) => {
    rect(x - 36, 910, 74, 72, '#191b1f'); rect(x - 36, 910, 74, 2, '#fff', 'opacity="0.1"');
    circle(x, 926, 6.5, i === 0 ? '#ff3a24' : '#5a1410', `class="led224b" data-i="${i}" ${i === 0 ? 'filter="url(#glow)"' : ''}`);
    rect(x - 36, 910, 74, 72, 'transparent', `class="key224b" data-i="${i}"`);
    T([527, 606, 686, 766, 845, 922][i], 1012, String(i + 1), 17, 'middle', 700);
  });
  p('</g>');
}

// ---------- defs ----------
p(`<svg id="room-svg" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
p(`<defs>
  <radialGradient id="kShadow"><stop offset="0.55" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="kSkirt" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#6a6d73" stop-opacity="0.7"/><stop offset="0.6" stop-color="#2a2b2e" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>
  <radialGradient id="capHi" cx="0.35" cy="0.28" r="0.85"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.12"/><stop offset="0.8" stop-color="#000" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>
  <radialGradient id="capHiDark" cx="0.35" cy="0.28" r="0.85"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="0.4" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
  <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f6"/><stop offset="0.3" stop-color="#9ea2a8"/><stop offset="0.5" stop-color="#e6e8ea"/><stop offset="0.75" stop-color="#6d7178"/><stop offset="1" stop-color="#c9ccd0"/></linearGradient>
  <linearGradient id="btnLit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0.2"/></linearGradient>
  <linearGradient id="btnOff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.02"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></linearGradient>
  <linearGradient id="faderCap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dbdd"/><stop offset="0.12" stop-color="#8d9196"/><stop offset="0.5" stop-color="#5b5f64"/><stop offset="0.88" stop-color="#3a3d41"/><stop offset="1" stop-color="#1e2023"/></linearGradient>
  <linearGradient id="faderCapBlack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b6e72"/><stop offset="0.15" stop-color="#2c2e31"/><stop offset="1" stop-color="#0c0d0e"/></linearGradient>
  <linearGradient id="faderCapYellow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a0"/><stop offset="0.15" stop-color="#e6c02e"/><stop offset="1" stop-color="#7a6010"/></linearGradient>
  <linearGradient id="faderCapGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8e0a0"/><stop offset="0.15" stop-color="#3f8f3a"/><stop offset="1" stop-color="#1a3d18"/></linearGradient>
  <linearGradient id="faderCapWhite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.15" stop-color="#e6e4dc"/><stop offset="1" stop-color="#8f8c84"/></linearGradient>
  <linearGradient id="faderCapRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f08a80"/><stop offset="0.15" stop-color="#b3261b"/><stop offset="1" stop-color="#4a0d08"/></linearGradient>
  <linearGradient id="vuFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdf1d2"/><stop offset="0.6" stop-color="#f4dfa8"/><stop offset="1" stop-color="#ddbd7c"/></linearGradient>
  <radialGradient id="vuGlow" cx="0.5" cy="0.95" r="0.9"><stop offset="0" stop-color="#fff" stop-opacity="0.0"/><stop offset="0.7" stop-color="#000" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></radialGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="bezelHi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.18"/><stop offset="0.1" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.4"/></linearGradient>
  <linearGradient id="deck" x1="0" y1="0" x2="0.2" y2="1"><stop offset="0" stop-color="#7a746d"/><stop offset="0.5" stop-color="#67625c"/><stop offset="1" stop-color="#57524d"/></linearGradient>
  <linearGradient id="deckLower" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f5a55"/><stop offset="1" stop-color="#4c4844"/></linearGradient>
  <linearGradient id="console" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6062"/><stop offset="0.5" stop-color="#5c5355"/><stop offset="1" stop-color="#4e4648"/></linearGradient>
  <linearGradient id="consoleAlt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5556"/><stop offset="0.5" stop-color="#4d4849"/><stop offset="1" stop-color="#413c3d"/></linearGradient>
  <linearGradient id="jh600" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d5650"/><stop offset="0.5" stop-color="#544d47"/><stop offset="1" stop-color="#4a443f"/></linearGradient>
  <linearGradient id="jh600alt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#635a50"/><stop offset="0.5" stop-color="#5a5148"/><stop offset="1" stop-color="#4f4740"/></linearGradient>
  <linearGradient id="consoleMaster" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#564d4f"/><stop offset="1" stop-color="#463f41"/></linearGradient>
  <linearGradient id="faderBay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d7577"/><stop offset="1" stop-color="#6a6365"/></linearGradient>
  <linearGradient id="armrest" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5e3c"/><stop offset="0.12" stop-color="#7a4429"/><stop offset="0.4" stop-color="#6a3a22"/><stop offset="0.7" stop-color="#4e2a18"/><stop offset="1" stop-color="#2a160c"/></linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a5a2c"/><stop offset="0.3" stop-color="#c48a4c"/><stop offset="0.6" stop-color="#b37a3e"/><stop offset="1" stop-color="#7a4c22"/></linearGradient>
  <linearGradient id="oakH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a362"/><stop offset="0.5" stop-color="#b9813f"/><stop offset="1" stop-color="#8a5a2c"/></linearGradient>
  <linearGradient id="laminate" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5232"/><stop offset="0.5" stop-color="#9a6b42"/><stop offset="1" stop-color="#6e482b"/></linearGradient>
  <linearGradient id="woodH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4527"/><stop offset="0.5" stop-color="#5e341d"/><stop offset="1" stop-color="#3a2012"/></linearGradient>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17130f"/><stop offset="1" stop-color="#0d0b09"/></linearGradient>
  <linearGradient id="rackPanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2b2e"/><stop offset="0.5" stop-color="#1d1e20"/><stop offset="1" stop-color="#141516"/></linearGradient>
  <linearGradient id="rackBlack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232323"/><stop offset="0.5" stop-color="#121212"/><stop offset="1" stop-color="#0a0a0a"/></linearGradient>
  <linearGradient id="rackSpx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b4f56"/><stop offset="0.5" stop-color="#3a3d43"/><stop offset="1" stop-color="#2c2e33"/></linearGradient>
  <linearGradient id="rack224" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a544b"/><stop offset="0.5" stop-color="#4a453e"/><stop offset="1" stop-color="#3a3631"/></linearGradient>
  <linearGradient id="silverPanel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8dadc"/><stop offset="0.5" stop-color="#b4b7bb"/><stop offset="1" stop-color="#8d9095"/></linearGradient>
  <linearGradient id="rail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d6066"/><stop offset="0.5" stop-color="#9ca0a6"/><stop offset="1" stop-color="#45484d"/></linearGradient>
  <linearGradient id="displayBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0503"/><stop offset="1" stop-color="#0a0201"/></linearGradient>
  <linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8c46a"/><stop offset="1" stop-color="#7f9a45"/></linearGradient>
  <linearGradient id="tapeMask" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe3c2"/><stop offset="1" stop-color="#d9c99f"/></linearGradient>
  <linearGradient id="topbar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1f22"/><stop offset="1" stop-color="#121315"/></linearGradient>
  <radialGradient id="pack" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#2a1a10"/><stop offset="0.7" stop-color="#3b2516"/><stop offset="0.97" stop-color="#4a2f1c"/><stop offset="1" stop-color="#1e130b"/></radialGradient>
  <radialGradient id="flange" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#e9ebed"/><stop offset="0.45" stop-color="#b7bbc1"/><stop offset="0.8" stop-color="#8a8f96"/><stop offset="1" stop-color="#5c6066"/></radialGradient>
  <radialGradient id="flangeRed" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#ff7a5c"/><stop offset="0.5" stop-color="#e2492f"/><stop offset="1" stop-color="#b3301d"/></radialGradient>
  <radialGradient id="flangeSilver" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#f6f7f8"/><stop offset="0.5" stop-color="#d9dcdf"/><stop offset="1" stop-color="#a9adb2"/></radialGradient>
  <radialGradient id="flangeBack" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#585c62"/><stop offset="1" stop-color="#2c2f33"/></radialGradient>
  <radialGradient id="roomLight" cx="0.45" cy="0.2" r="0.9"><stop offset="0" stop-color="#ffdca8" stop-opacity="0.10"/><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.10"/><stop offset="0.4" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="glowSm" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity="0.7"/></filter>
  <filter id="brushed" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.0015 0.9" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 -0.2"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="woodgrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.25 0.008" numOctaves="3" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.02  0 0 0 0 0.0  0 0 0 1.2 -0.45"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="woodgrainH" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.25" numOctaves="3" seed="5" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.02  0 0 0 0 0.0  0 0 0 1.2 -0.45"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="11" result="n"/><feColorMatrix in="n" type="saturate" values="0" result="g"/><feComponentTransfer in="g"><feFuncA type="table" tableValues="0 0.06"/></feComponentTransfer></filter>
  <filter id="vinyl" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="21" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 -0.15"/><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs>`);

// ---------- room background ----------
rect(0, 0, W, H, 'url(#wall)');
// wood slat wall behind upper zone
for (let x = 0; x < 3290; x += 64) {
  rect(x, 56, 62, 860, 'url(#woodH)', 'opacity="0.35"');
  rect(x + 62, 56, 2, 860, '#000', 'opacity="0.6"');
}
rect(0, 56, 3290, 860, '#000', 'filter="url(#woodgrainH)" opacity="0.6"');
rect(0, 56, 3290, 860, 'url(#roomLight)');

// ---------- top bar ----------
rect(0, 0, W, 56, 'url(#topbar)');
rect(0, 55, W, 1, '#000');
rect(0, 0, W, 1, '#3a3b3f');
rect(24, 12, 300, 32, '#0b0b0c', 'rx="3"');
rect(24, 12, 300, 32, 'url(#bezelHi)', 'rx="3"');
text(42, 34, 'ANALOG STUDIO', 17, '#e9dcc0', 'start', 800, 'letter-spacing="5"');
circle(304, 28, 5, '#ff3b2f', 'filter="url(#glow)"');
text(420, 34, 'SESSION', 11, '#8b8778', 'start', 700, 'letter-spacing="2"');
text(500, 34, 'Midnight Tapes', 15, '#e8e4d8', 'start', 500);   // the tape menus sit beside it
const statusItems = [['INTERFACE', 'TASCAM Studio Bridge · 24 in / 24 out'], ['CONTROL', 'MCU ● transport + rec ready'], ['RATE', '48 kHz'], ['BUFFER', '128 smp · 2.7 ms'], ['DSP', '18 %']];
let sx = 1640;
for (const [k, v] of statusItems) {
  text(sx, 34, k, 11, '#8b8778', 'start', 700, 'letter-spacing="2"');
  text(sx + k.length * 9 + 14, 34, v, 15, k === 'CONTROL' ? '#7ee08f' : '#e8e4d8', 'start', 600);
  sx += k.length * 9 + 14 + v.length * 8.6 + 46;
}
// rack tab (slide-out handle)
rect(3290, 8, 170, 40, '#2a2b2e', 'rx="4"');
rect(3290, 8, 170, 40, 'url(#btnOff)', 'rx="4"');
text(3375, 34, '◀  OUTBOARD RACK', 13, '#e9dcc0', 'middle', 800, 'letter-spacing="1.5"');
rect(3480, 8, 160, 40, '#2a2b2e', 'rx="4"');
text(3560, 34, 'PATCHBAY', 13, '#a9a594', 'middle', 800, 'letter-spacing="1.5"');
rect(3660, 8, 160, 40, '#2a2b2e', 'rx="4"');
text(3740, 34, 'PLUGINS', 13, '#a9a594', 'middle', 800, 'letter-spacing="1.5"');

// =====================================================================
// TAPE MACHINE: rendered as a CSS 3D scene by jh24.js and layered over this SVG
// =====================================================================
const TX = 24, TY = 76, TW = 1360, TH = 590;   // top row trimmed to make room for the console meter bridge
p(`<g filter="url(#shadow)">`);
const TCI = 32;   // the HJ-24 cabinet is inset this much each side to hug its deck plate (checked against jh24.js)
rect(TX, TY, TW - 2 * TCI, TH, '#2a2725', 'rx="10"');
p(`</g>`);

// =====================================================================
// AUTOLOCATOR (AL-III) + TAPE METER BRIDGE: CSS 3D scenes; faces drawn with the SVG helpers
// =====================================================================
const capture = (fn) => { const st = out.length; fn(); return out.splice(st).join('\n'); };
const svgWrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;overflow:visible">${body}</svg>`;
const B3 = (st) => `position:absolute;transform-style:preserve-3d;${st}`;
const scenes3d = [];
const tapeNames = ['KICK', 'SNARE', 'HATS', 'TOMS', 'OH L', 'OH R', 'BASS', 'GUITAR', ...Array(15).fill(''), 'SMPTE'];   // the demo tape (prototype/demo)
const tapeDb = tapeNames.map((n, i) => (!n ? -40 : i === 23 ? -10 : -14 + rnd() * 12));
const readyTracks = new Set();   // nothing armed: the demo tape plays back safely
const LEG = '#ece7dc';   // legend colour on taupe


// ---------------- HJ-24 audio electronics: three roll-out drawers of channel cards (manual section 4) ----------------
const elecView = (() => {
  const trim = (key, lab, ips) => `<div class="tr" data-key="${key}"${ips ? ` data-ips="${ips}"` : ''} title="${lab}${ips ? ` (${ips === 30 ? 'HI speed, 30 ips' : 'LO speed, 15 ips'})` : ''} · drag up / down, double-click resets"><i class="scr"><b></b></i><span class="tl">${lab}</span><span class="tv">0.0</span></div>`;
  const sw = (key, a, b) => `<button type="button" class="sw" data-key="${key}" data-a="${a}" data-b="${b}">${a}</button>`;
  const card = (cls, name, body) => `<div class="cd ${cls}"><div class="cn">${name}</div>${body}</div>`;
  // the cards' front edges as on the real machine (black faces, white legends, trims in access holes, round push
  // switches, the channel tag at the bottom): REPRO, OUTPUT, RECORD / CUE, BIAS. HI / LO = the 30 / 15 ips networks.
  const hole = (key, ips, mark, name) => `<div class="tr${/^&[lg]t;$/.test(mark) ? '' : ' lft'}" data-key="${key}"${ips ? ` data-ips="${ips}"` : ''} data-name="${name}" title="${name} · drag up / down (shift: fine) · double-click realigns this channel"><i class="scr"><b></b></i><span class="mk">${mark}</span><span class="tv"></span></div>`;
  const inert = (mark, name) => `<div class="tr inert" title="${name} (factory set)"><i class="scr"><b></b></i><span class="mk">${mark}</span></div>`;
  const brk = (lab, body) => `<div class="brk"><span class="bl">${lab}</span><span class="bk"></span><div class="bi">${body}</div></div>`;
  const push = (key, a, b, lab, title) => `<button type="button" class="sw push" data-key="${key}" data-a="${a}" data-b="${b}" title="${title}"><span class="pb"></span></button>${lab}`;
  const nabiec = (where) => `<div class="std">${push('std', 'NAB', 'IEC', '', `NAB / IEC equalization (${where}; 15 ips network, 30 ips is AES)`)}<div class="ind"><span class="n"><i></i>NAB</span><span class="i"><i></i>IEC</span></div></div>`;
  const face = (cls, title, body, i) => `<div class="cf ${cls}"><div class="ct">${title}</div>${body}<div class="num">${i + 1}</div></div>`;
  const chan = (i) => `<div class="ch" data-ch="${i}">
    <div class="chh"><b>${i + 1}</b><span class="nm">${tapeNames[i]}</span><span class="src">REP</span></div>
    <div class="vub"><i></i><s></s></div>
    <div class="keys"><button type="button" class="k cue" title="CUE: monitor the record head (sync)">CUE</button><button type="button" class="k solo" title="Solo this channel in the speakers">SOLO</button><button type="button" class="k clr" title="Erase this track (bulk)">ERASE</button></div>
    ${face('rep', 'REPRO', `${nabiec('repro')}${brk('HI', hole('reproHf', 30, '&lt;', `CH ${i + 1} REPRO HI &lt; (30 ips HF)`) + hole('reproLf', 30, '&gt;', `CH ${i + 1} REPRO HI &gt; (30 ips LF)`))}${brk('LO', hole('reproHf', 15, '&lt;', `CH ${i + 1} REPRO LO &lt; (15 ips HF)`) + hole('reproLf', 15, '&gt;', `CH ${i + 1} REPRO LO &gt; (15 ips LF)`))}<div class="row">${hole('reproLvl', 0, 'LVL', `CH ${i + 1} REPRO LVL`)}</div>`, i)}
    ${face('out', 'OUTPUT', `<div class="bd">${push('biasDefeat', 'NORMAL', 'DEFEAT', '<span class="pl">BIAS<br>DEFEAT</span>', 'BIAS DEFEAT: recording only erases (spot erase)')}</div>`, i)}
    ${face('rc', 'RECORD', `<div class="row">${hole('recHf', 30, 'HI &lt;', `CH ${i + 1} RECORD HI &lt; (30 ips HF)`)}</div><div class="row">${hole('recHf', 15, 'LO &lt;', `CH ${i + 1} RECORD LO &lt; (15 ips HF)`)}</div><div class="row">${hole('calRec', 0, 'LVL', `CH ${i + 1} RECORD LVL (CAL REC)`)}</div><div class="row">${hole('inCal', 0, 'IN CAL', `CH ${i + 1} IN CAL (input monitor level)`)}</div><div class="sep"></div>${nabiec('record / cue')}<div class="sep"></div><div class="ct">CUE</div>${brk('HI', hole('cueHf', 30, '&lt;', `CH ${i + 1} CUE HI &lt; (30 ips HF)`) + hole('cueLf', 30, '&gt;', `CH ${i + 1} CUE HI &gt; (30 ips LF)`))}${brk('LO', hole('cueHf', 15, '&lt;', `CH ${i + 1} CUE LO &lt; (15 ips HF)`) + hole('cueLf', 15, '&gt;', `CH ${i + 1} CUE LO &gt; (15 ips LF)`))}<div class="row">${hole('cueLvl', 0, 'LVL', `CH ${i + 1} CUE LVL`)}</div>`, i)}
    ${face('bias', 'BIAS', `${brk('BIAS', hole('bias', 30, 'HI', `CH ${i + 1} BIAS HI (30 ips)`) + hole('bias', 15, 'LO', `CH ${i + 1} BIAS LO (15 ips)`))}${brk('ERASE', inert('', 'ERASE peak'))}`, i)}
  </div>`;
  const drawer = (d) => `<div class="dr"><div class="drh">DRAWER ${d + 1} · CHANNELS ${d * 8 + 1}–${d * 8 + 8}</div><div class="drm">${Array.from({ length: 8 }, (_, k) => meter(d * 8 + k)).join('')}</div><div class="drc">${Array.from({ length: 8 }, (_, k) => chan(d * 8 + k)).join('')}</div></div>`;
  const sel = (id, opts, val) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}"${v === val ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  // the machine's 24 VU meters: each drawer's eight sit right above their channel cards
  const meter = (i) => `<div class="mt"><svg viewBox="-6 -6 282 252">${capture(() => {
    vu(0, 0, 270, 202, -20, { needleId: i, brand: 'CMI' });
    text(4, 238, String(i + 1).padStart(2, '0'), 30, '#f2ead8', 'start', 900);
    text(268, 238, tapeNames[i], 24, '#cfc6b3', 'end', 700, 'letter-spacing="1"');
  })}</svg></div>`;
  return `<div id="elec">
  <div class="eltop">
    <button type="button" id="el-power" class="pw" title="JH-24D audio power supply: starts the audio engine">POWER</button>
    <label>MONITOR <input id="el-gain" type="range" min="0" max="1" step="0.01" value="0.5"></label>
    <button type="button" id="el-mute" class="t">MUTE</button>
    <button type="button" id="el-mech-on" class="t on" title="The machine's own sound in the room: reel motors, tape and air, lifter / brake / pinch solenoids, tail flap">MACHINE</button><input id="el-mech" type="range" min="0" max="1.5" step="0.01" value="0.6" title="Machine sound level">
    <span class="sep"></span>
    <label>OSCILLATOR ${sel('el-osc-f', [['100', '100 Hz'], ['1000', '1 kHz'], ['10000', '10 kHz'], ['15000', '15 kHz']], '1000')} ${sel('el-osc-db', [['-10', '-10 VU'], ['0', '0 VU'], ['4', '+4 VU'], ['12.4', 'MOL +12.4']], '0')} ${sel('el-osc-to', [['off', 'OFF'], ['ready', 'TO READY TRACKS'], ['all', 'TO ALL INPUTS']], 'off')}</label>
    <label>ALIGNMENT TAPE ${sel('el-mrl', [['off', 'OFF'], ['1000', '1 kHz level'], ['10000', '10 kHz'], ['15000', '15 kHz'], ['100', '100 Hz'], ['50', '50 Hz']], 'off')} ${sel('el-mrl-std', [['NAB', 'NAB tape'], ['IEC', 'IEC tape']], 'NAB')}</label>
    <button type="button" id="el-align" class="t" title="Section 7: repro to the alignment tape, bias peak + overbias, record level and HF, on every channel">ALIGN ALL</button>
    <span class="sep"></span>
    <label>OPERATING LEVEL ${sel('el-ol', [['185', '185 nWb/m'], ['250', '250 nWb/m'], ['320', '320 nWb/m'], ['370', '370 nWb/m'], ['400', '400 nWb/m']], '370')}</label>
    <button type="button" id="el-quior" class="t on" title="QUIOR: erase / bias delay and ramps on punch-in and punch-out (bias card jumper)">QUIOR</button>
    <button type="button" id="el-hiss" class="t on">TAPE HISS</button>
    <button type="button" id="el-wf" class="t on">WOW &amp; FLUTTER</button>
    <span class="sep"></span>
    <button type="button" id="el-load" class="t" title="Load a tape transfer: one file per track (numbered names) or one 24-channel file; starts at the counter zero">LOAD TRANSFER</button>
    <button type="button" id="el-live" class="t" title="Your computer's audio input into the record-ready tracks">LIVE IN</button>
    <input id="el-file" type="file" accept="audio/*,.wav,.aif,.aiff,.flac" multiple hidden>
  </div>
  <div class="elmsg" id="el-msg">Power the electronics to hear the tape. Monitoring follows the AutoLocator's TAPE / INPUT / AUTO and the track keys.</div>
  <div class="drs">${[0, 1, 2].map(drawer).join('')}</div>
  <div class="eltr">
    <div class="ctr"><span class="cl">TAPE</span><b id="el-ctr">00:00</b><span id="el-mode">STOP</span></div>
    <div class="grp">${[['rtz', 'RTZ', 'w'], ['rew', '◀◀ REW', 'w'], ['ff', 'F FWD ▶▶', 'w'], ['stop', '■ STOP', 'y'], ['play', '▶ PLAY', 'g'], ['record', '● REC', 'r']].map(([n, l, c]) => `<button type="button" class="tk ${c}" data-tk="${n}">${l}</button>`).join('')}</div>
    <div class="grp"><span class="gl">LOCATE</span><b id="el-loc">00:00</b><button type="button" class="tk b" data-tk="loc">LOC</button></div>
    <div class="grp"><span class="gl">IPS</span>${['7.5', '15', '30'].map((v) => `<button type="button" class="tk s" data-tk="s${v}">${v === '7.5' ? '7½' : v}</button>`).join('')}<button type="button" class="tk s" data-tk="lift">LIFT</button></div>
    <div class="grp"><span class="gl">MONITOR</span>${['tape', 'input', 'auto'].map((v) => `<button type="button" class="tk s" data-tk="${v}">${v.toUpperCase()}</button>`).join('')}</div>
    <div class="ql" id="el-quartz" title="Capstan locked to the crystal reference (FIX). In VAR it is locked to the vari-speed setting"><i></i>QUARTZ LOCK</div>
    <div class="hint">space play / stop · , rewind · . fast forward · Z zero · R record</div>
  </div>
</div>`;
})();
const elecCss = `
  #elec{position:absolute;inset:0;padding:18px 24px;box-sizing:border-box;font-family:Archivo,Arial,sans-serif;color:#e8e2d4;background:linear-gradient(180deg,#24211f,#171514)}
  #elec .eltop{display:flex;flex-wrap:wrap;gap:14px;align-items:center;font-size:17px;font-weight:800;letter-spacing:1px}
  #elec label{display:flex;gap:8px;align-items:center;color:#cfc6b3}
  #elec select{font:700 16px Archivo,Arial;background:#0f0e0d;color:#f0e8d6;border:1px solid #5a534c;border-radius:4px;padding:5px 6px}
  #elec input[type=range]{width:180px}
  #elec .sep{width:1px;height:30px;background:#4a4440}
  #elec button{font:800 16px Archivo,Arial;letter-spacing:1px;border-radius:5px;border:1px solid #6b635b;background:#e9e3d3;color:#1d1a16;padding:8px 14px;cursor:pointer}
  #elec button.t.on{background:#ffcf5a;box-shadow:0 0 12px rgba(255,190,60,.5)}
  #elec button.pw{background:#3a1512;color:#ffb3a6;border-color:#7a2b22;min-width:120px}
  #elec button.pw.on{background:#ff3b2f;color:#fff;box-shadow:0 0 18px rgba(255,60,40,.7)}
  #elec .elmsg{margin:10px 0 12px;font:600 17px Archivo,Arial;color:#ffcf8a;min-height:22px}
  #elec .drs{display:flex;gap:18px}
  #elec .eltr{position:absolute;left:24px;right:24px;bottom:18px;display:flex;gap:26px;align-items:center;padding:16px 22px;border-radius:10px;background:linear-gradient(180deg,#5d5650,#4a443f);border:2px solid #1a1715;box-shadow:inset 0 2px 0 rgba(255,255,255,.12),0 8px 24px rgba(0,0,0,.5)}
  #elec .eltr .ctr{display:flex;align-items:baseline;gap:12px;background:#120404;border:2px solid #050505;border-radius:6px;padding:8px 16px}
  #elec .eltr .ctr b,#elec .eltr .grp>b{font:700 44px 'JetBrains Mono',monospace;color:#ff3a1e;text-shadow:0 0 10px rgba(255,60,30,.7);letter-spacing:2px}
  #elec .eltr .grp>b{font-size:30px;background:#120404;border-radius:5px;padding:4px 10px}
  #elec .eltr .cl,#elec .eltr .gl{font:900 14px Archivo,Arial;letter-spacing:2px;color:#e8e2d4}
  #elec .eltr #el-mode{font:800 16px Archivo,Arial;color:#ffb3a6;letter-spacing:1.5px;min-width:110px}
  #elec .eltr .grp{display:flex;gap:10px;align-items:center}
  #elec .eltr .tk{font:900 20px Archivo,Arial;letter-spacing:1px;padding:16px 22px;border-radius:6px;border:1px solid #111;box-shadow:0 5px 0 #1a1715;color:#1a1208;cursor:pointer}
  #elec .eltr .tk:active{transform:translateY(3px);box-shadow:0 2px 0 #1a1715}
  #elec .eltr .tk.w{background:#efece4}#elec .eltr .tk.y{background:#f4e9c8}#elec .eltr .tk.g{background:#3fc9a0}#elec .eltr .tk.r{background:#e0322a;color:#fff}#elec .eltr .tk.b{background:#3f7fd6;color:#fff}#elec .eltr .tk.s{background:#efece4;padding:12px 16px;font-size:17px}
  #elec .eltr .tk.on{box-shadow:0 0 18px 4px rgba(255,220,120,.85),0 5px 0 #1a1715;filter:brightness(1.15)}
  #elec .eltr .tk.r.on{box-shadow:0 0 22px 6px rgba(255,60,40,.9),0 5px 0 #1a1715}
  #elec .eltr .ql{display:flex;align-items:center;gap:8px;font:900 14px Archivo,Arial;letter-spacing:2px;color:#e8e2d4}
  #elec .eltr .ql i{width:14px;height:14px;border-radius:50%;background:#123d1c}
  #elec .eltr .ql.on i{background:#3dff6a;box-shadow:0 0 12px #3dff6a}
  #elec .eltr .hint{margin-left:auto;font:600 15px Archivo,Arial;color:#e8e2d4;opacity:.8}
  #elec .drm{display:flex;gap:6px;margin-bottom:8px;padding:8px 0;background:#141211;border-radius:5px}
  #elec .drm .mt{flex:1;min-width:0}
  #elec .drm svg{display:block;width:100%;height:auto}
  #elec .dr{flex:1 1 0;min-width:0;background:linear-gradient(180deg,#3a3633,#2a2725);border:2px solid #0c0b0a;border-radius:8px;padding:8px}
  #elec .drh{font:900 20px Archivo,Arial;letter-spacing:2.5px;color:#d9d2c2;margin:2px 4px 8px}
  #elec .drc{display:flex;gap:6px}
  #elec .ch{flex:1;min-width:0;background:#1d1c1a;border-radius:5px;padding:6px;display:flex;flex-direction:column;gap:9px}
  #elec .chh{display:flex;gap:6px;align-items:baseline;font-size:15px}
  #elec .chh b{font-size:28px;color:#fff}
  #elec .chh .nm{flex:1;font-size:16px;color:#bdb4a2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #elec .chh .src{font:800 16px 'JetBrains Mono',monospace;padding:3px 6px;border-radius:3px;background:#2d4a77;color:#dfe9ff}
  #elec .chh .src.in{background:#7a5a12;color:#ffe6a8}#elec .chh .src.cue{background:#1f6b3a;color:#c9ffd9}
  #elec .vub{position:relative;height:14px;background:#0b0a09;border-radius:2px;overflow:hidden}
  #elec .vub i{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#3fbf5c 0 70%,#ffd23a 70% 87%,#ff3b2f 87%)}
  #elec .vub s{position:absolute;left:87%;top:0;bottom:0;width:1px;background:#fff;opacity:.6}
  #elec .keys{display:flex;gap:3px}
  #elec .keys .k{flex:1;min-width:0;padding:8px 0;font-size:12px;letter-spacing:.5px}
  #elec .keys .k.on{background:#7dff9a}#elec .keys .solo.on{background:#ffd23a}
  #elec .cf{position:relative;background:linear-gradient(90deg,#060607,#141416 10%,#0e0e10 50%,#151517 90%,#050506);border:1px solid #000;border-radius:2px;padding:12px 8px 40px;box-shadow:inset 1px 0 0 rgba(255,255,255,.1),inset -1px 0 0 rgba(255,255,255,.05),0 3px 0 #000;color:#f4f4f0;display:flex;flex-direction:column;align-items:center;gap:10px}
  #elec .cf .ct{font:900 20px Archivo,Arial;letter-spacing:.5px;color:#f7f7f3;align-self:center}
  #elec .cf .num{position:absolute;right:16%;bottom:8px;min-width:24px;padding:1px 5px;background:#efe6cc;color:#141210;font:800 16px Archivo,Arial;text-align:center;border:1px solid #9a8d6c;box-shadow:inset 0 -2px 0 rgba(0,0,0,.12)}
  #elec .cf .row{display:flex;justify-content:center;width:100%}
  #elec .cf .sep{width:112%;height:3px;background:#000;box-shadow:0 1px 0 rgba(255,255,255,.08);margin:2px 0}
  #elec .brk{display:grid;grid-template-columns:auto 9px auto;align-items:stretch;column-gap:4px;justify-content:center}
  #elec .brk .bl{font:900 14px Archivo,Arial;color:#f4f4f0;align-self:start;margin-top:4px}
  #elec .brk .bk{border:2px solid #ecece6;border-right:0;margin:10px 0}
  #elec .brk .bi{display:flex;flex-direction:column;align-items:flex-start;gap:8px}
  #elec .tr{position:relative;display:flex;align-items:center;gap:6px;cursor:ns-resize;user-select:none;touch-action:none}
  #elec .tr.lft{flex-direction:row-reverse}
  #elec .tr.inert{cursor:default}
  #elec .scr{width:34px;height:34px;border-radius:50%;background:radial-gradient(circle,#020202 50%,#1c1c1e 58%,#3a3a3c 64%,#0b0b0c 74%);position:relative;box-shadow:inset 0 3px 5px rgba(0,0,0,.95)}
  #elec .scr b{position:absolute;left:11px;top:11px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#8a7638,#3a2f12);box-shadow:0 0 3px 2px rgba(0,0,0,.8)}
  #elec .scr b::after{content:'';position:absolute;left:5px;top:1px;width:2px;height:10px;background:#141006}
  #elec .tr:hover .scr b{background:radial-gradient(circle at 40% 35%,#c9ad5c,#6a5420)}
  #elec .mk{font:900 15px Archivo,Arial;color:#f4f4f0;white-space:nowrap}
  #elec .tv{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:3px;padding:2px 6px;border-radius:3px;background:#ffd23a;color:#1a1208;font:800 13px 'JetBrains Mono',monospace;white-space:nowrap;display:none;z-index:5}
  #elec .tr:hover .tv,#elec .tr.drag .tv{display:block}
  #elec .push{all:unset;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 42% 36%,rgba(255,255,255,.18),rgba(255,255,255,0) 22%),radial-gradient(circle,#1c1c1e,#0a0a0b 52%,#000 56%,#f2f2f4 60%,#8d9095 66%,#d8dadd 71%,#1a1a1c 76%,#000 80%);box-shadow:0 3px 4px #000;cursor:pointer;display:block}
  #elec .push.on{background:radial-gradient(circle at 42% 36%,rgba(255,255,255,.35),rgba(255,255,255,0) 22%),radial-gradient(circle,#ff5a3c,#8a1408 52%,#000 56%,#f2f2f4 60%,#8d9095 66%,#d8dadd 71%,#1a1a1c 76%,#000 80%);box-shadow:0 0 14px rgba(255,60,40,.7),0 3px 4px #000}
  #elec .std{display:flex;flex-direction:column;align-items:center;gap:5px;margin:2px 0}
  #elec .std .ind{display:flex;gap:10px;font:900 13px Archivo,Arial;color:#f4f4f0}
  #elec .std .ind i{display:inline-block;width:9px;height:9px;border-radius:50%;border:2px solid #ecece6;margin-right:4px;vertical-align:-1px}
  #elec .std .ind .on i{background:#ecece6}
  #elec .bd{display:flex;flex-direction:column;align-items:center;gap:6px;margin:6px 0}
  #elec .bd .pl{font:900 13px Archivo,Arial;text-align:center;line-height:1.15}
  .el-plate{position:absolute;z-index:40;display:flex;gap:8px;align-items:center;padding:6px 14px;border-radius:5px;background:#141211;border:1px solid #4a4440;color:#e8e2d4;font:900 15px Archivo,Arial;letter-spacing:2px;cursor:pointer}
  .el-plate i{width:10px;height:10px;border-radius:50%;background:#4a1a14}
  .el-plate.on i{background:#ff3b2f;box-shadow:0 0 10px #ff3b2f}
`;


// ---------------- AL-III autolocator face (400 x 340 units, modelled on the CMI AutoLocator III) ----------------
// live = true draws the clickable pop-up version: every control is a <g data-al="..."> and every lamp a hidden lit copy
const AL_W = 400, AL_H = 340;
function al3(live = false, st = {}) {
  const S = Object.assign({ tape: '03:42', loc: '01:02', ready: readyTracks, lamps: new Set(['auto']), leds: new Set(['ready']) }, st);
  const PANEL = '#4b4845', BAY = '#3a3836', INK = '#e6e1d6';
  // live: the pop-up (clickable). mirror: the studio-view face, same lamps / LEDs / displays driven from the pop-up's state
  const mirror = live === 'mirror'; if (mirror) live = false;
  const key = (name, x, y, w, h, color, label, size = 6) => {
    if (live) p(`<g data-al="${name}" style="cursor:pointer">`);
    const lit = !live && !mirror && S.lamps.has(name);
    button(x, y, w, h, color, lit, label, { size, pastel: true });
    if (live) { p(`<g class="al-lamp" data-lamp="${name}" opacity="0" pointer-events="none">`); button(x, y, w, h, color, true, label, { size }); p('</g></g>'); }
    if (mirror) { p(`<g data-mlamp="${name}" opacity="0">`); button(x, y, w, h, color, true, label, { size }); p('</g>'); }
  };
  const led = (name, cx, cy, col, w = 5, h = 3) => {
    rect(cx - w / 2, cy - h / 2, w, h, '#160c08', 'rx="0.8"');
    const on = !live && !mirror && S.leds.has(name);
    rect(cx - w / 2, cy - h / 2, w, h, col, `rx="0.8" ${live ? `class="al-led" data-led="${name}" opacity="0"` : mirror ? `data-mled="${name}" opacity="0"` : on ? 'filter="url(#glowSm)"' : 'opacity="0"'}`);
  };
  const roundKey = (name, cx, cy, r, fill, hi) => {
    if (live) p(`<g data-al="${name}" style="cursor:pointer">`);
    circle(cx + 0.6, cy + 1.2, r + 0.6, '#000', 'opacity="0.55"');
    circle(cx, cy, r + 0.8, '#222'); circle(cx, cy, r, fill); circle(cx - r * 0.25, cy - r * 0.3, r * 0.55, hi, 'opacity="0.35"');
    if (live) p('</g>');
  };
  const display = (id, x, label, val) => {
    text(x + 55, 15, label, 7, INK, 'middle', 800, 'letter-spacing="0.6"');
    rect(x, 20, 110, 33, '#060606', 'rx="2"'); rect(x + 3, 23, 104, 27, 'url(#displayBg)', 'rx="1.5"');
    if (live) p(`<g id="al-${id}">`); else if (mirror) p(`<g class="alm-${id}">`);
    seg7(x + 22, 27, 19, val, '#ff3220');
    if (live || mirror) p('</g>');
    rect(x + 3, 23, 104, 10, 'url(#glass)', 'rx="1.5"');
    text(x + 33, 62, 'MINUTES', 5, INK, 'middle', 700, 'letter-spacing="0.4"'); text(x + 80, 62, 'SECONDS', 5, INK, 'middle', 700, 'letter-spacing="0.4"');
  };
  // housing: control head, three track bays, transport bay
  rect(-4, -4, AL_W + 8, AL_H + 8, '#232120', 'rx="7"');
  rect(0, 0, AL_W, 148, PANEL, 'rx="5"'); rect(0, 0, AL_W, 1.5, '#fff', 'opacity="0.18"');
  for (let r = 0; r < 3; r++) {
    const y0 = 151 + r * 45;
    rect(0, y0, AL_W, 42, BAY, 'rx="2"'); rect(0, y0, AL_W, 1.2, '#fff', 'opacity="0.14"'); rect(0, y0 + 40.5, AL_W, 1.5, '#000', 'opacity="0.5"');
    rect(6, y0 + 3, AL_W - 12, 11, '#2c2a29', 'rx="1"');
    for (let k = 0; k < 8; k++) {
      const t = r * 8 + k, cx = 32 + k * 48;
      led(`r${t}`, cx - 10, y0 + 8.5, '#ff3b2f'); led(`i${t}`, cx + 10, y0 + 8.5, '#59f07a');
      text(cx, y0 + 11.5, String(t + 1), 7, INK, 'middle', 800);
      roundKey(`ready${t}`, cx - 8, y0 + 27, 6.5, '#151515', '#9a9a9a');
      roundKey(`input${t}`, cx + 8, y0 + 27, 6.5, '#d9d6cf', '#ffffff');
      if (!live && S.ready.has(t)) rect(cx - 12.5, y0 + 7, 5, 3, '#ff3b2f', 'rx="0.8" filter="url(#glowSm)"');
    }
  }
  rect(0, 289, AL_W, 51, PANEL, 'rx="5"'); rect(0, 289, AL_W, 1.2, '#fff', 'opacity="0.15"');
  // displays
  display('tape', 22, 'TAPE POSITION', S.tape);
  display('loc', 150, 'LOCATE POSITION', S.loc);
  key('rsttape', 66, 72, 22, 16, 'red', 'RST', 6);
  key('rstloc', 194, 72, 22, 16, 'red', 'RST', 6);
  key('loc', 130, 84, 22, 16, 'blue', 'LOC', 6);
  key('mode', 96, 100, 22, 16, 'white', 'MODE', 5);   // fixed / variable capstan reference (manual 2.2.5)
  key('tvi', 164, 100, 22, 16, 'white', 'TVI', 6);     // hold: tape velocity (ips) and pitch (¼ semitones)
  // tape speed
  if (live) p('<g data-al="vari" style="cursor:pointer">');
  circle(30, 104, 11, '#000', 'opacity="0.4"'); circle(29, 102, 10, '#171717'); circle(29, 102, 10, 'url(#capHiDark)');
  p(`<line ${live ? 'id="al-vari-ptr" ' : ''}x1="29" y1="102" x2="29" y2="94" stroke="#f2f2f2" stroke-width="1.6" stroke-linecap="round" transform="rotate(0 29 102)"/>`);
  if (live) p('</g>');
  led('var', 48, 97, '#ff3b2f', 4, 4); led('fix', 48, 107, '#59f07a', 4, 4);
  text(53, 99, 'VAR', 4.8, INK, 'start', 700); text(53, 109, 'FIX', 4.8, INK, 'start', 700);
  text(29, 124, 'TAPE', 5, INK, 'middle', 800); text(29, 130, 'SPEED', 5, INK, 'middle', 800);
  // badges
  rect(16, 134, 42, 11, '#0d0d0e', 'rx="1.5"'); text(37, 142.6, 'CMI', 8.5, '#e3e5e8', 'middle', 900, 'font-style="italic" letter-spacing="1.4"');
  rect(180, 136, 22, 9, '#0d0d0e', 'rx="1"'); text(191, 143.3, 'CMI', 6, '#e3e5e8', 'middle', 900, 'font-style="italic"');
  text(270, 145, 'AutoLocator III', 8.5, INK, 'end', 700);
  // keypad
  const pad = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['◀', '0', '▶']];
  pad.forEach((row, r) => row.forEach((k, c) => key(k === '◀' ? 'left' : k === '▶' ? 'right' : `d${k}`, 286 + c * 34, 10 + r * 26, 28, 21, k.length === 1 && /\d/.test(k) ? 'grey' : 'blue', k, 10)));
  [['sto', 'STO'], ['rcl', 'RCL'], ['rep', 'REP']].forEach(([n, l], c) => key(n, 286 + c * 34, 114, 28, 21, 'white', l, 7));
  p(`<path d="M318 57 H383 V139 H350" fill="none" stroke="${INK}" stroke-opacity="0.7" stroke-width="0.9"/>`);
  // transport bay
  led('ready', 12, 297, '#ffd23a', 4, 4); text(18, 299, 'RECORD READY', 4.8, INK, 'start', 700);
  led('rec', 70, 297, '#ff3b2f', 4, 4); text(76, 299, 'RECORD', 4.8, INK, 'start', 700);
  led('cue', 106, 297, '#59f07a', 4, 4); text(112, 299, 'CUE', 4.8, INK, 'start', 700);
  [['tape', 'TAPE'], ['input', 'INPUT'], ['auto', 'AUTO']].forEach(([n, l], i) => {
    const cx = 18 + i * 24;
    roundKey(n, cx, 317, 7, '#141414', '#999');
    led(`m${n}`, cx, 306.5, '#ffb02e', 4, 2.4);
    text(cx, 334, l, 4.8, INK, 'middle', 700);
  });
  [['rew', 'RWD', 'white'], ['ff', 'FWD', 'white'], ['stop', 'STOP', 'yellow'], ['play', 'PLAY', 'green']].forEach(([n, l, c], i) => {
    const x = 134 + i * 42;
    text(x + 16, 300, l, 5.5, INK, 'middle', 800);
    key(n, x, 304, 32, 28, c, '', 6);
    if (n === 'rew' || n === 'ff' || n === 'stop' || n === 'play') text(x + 16, 322, n === 'rew' ? '◀◀' : n === 'ff' ? '▶▶' : n === 'stop' ? '■' : '▶', 9, '#1a1208', 'middle', 800, 'pointer-events="none" opacity="0.75"');
  });
  text(349, 297, 'RECORD', 5.5, INK, 'middle', 800);
  rect(323, 300, 52, 36, '#161514', 'rx="3"'); rect(323, 300, 52, 1, '#fff', 'opacity="0.15"');
  key('record', 333, 305, 32, 26, 'red', '●', 10);
  // cables out of the bottom right (as on the real unit)
  for (let k = 0; k < 3; k++) rect(AL_W + 2, 160 + k * 46, 8, 14, '#2a2a2c', 'rx="2"');
}

// ---------------- AL-III autolocator on its pedestal ----------------
const AX = TX + TW - 2 * TCI + 22, AW = 400, ALK = Math.min((1692 - AX) / AW, 590 / 676), ALDROP = 40, AY = 76 + ALDROP, AH = 676 - Math.round(ALDROP / ALK);   // dropped under the SMPTE wall clock   // fills the gap between the tape machine and the meter bridge
{
  const FW = 376, FD = Math.round(AL_H * FW / AL_W), LIP = 34, TOP = 60, SLOPE = 30;
  const face = capture(() => { p(`<g transform="scale(${FW / AL_W})">`); al3('mirror'); p('</g>'); });
  // side planes (wedge)
  const depth = FD * Math.sin(SLOPE * Math.PI / 180), rise = FD * Math.cos(SLOPE * Math.PI / 180);
  const yb = TOP + FD;            // bottom edge of the face (rotation origin)
  const side = (x) => `<div style="${B3(`left:${x}px;top:${yb - rise}px;width:${depth}px;height:${rise + LIP}px;transform-origin:0 0;transform:rotateY(90deg);background:linear-gradient(180deg,#5a5550,#3a3633);clip-path:polygon(${depth}px 0, 0 ${rise}px, 0 ${rise + LIP}px, ${depth}px ${rise + LIP}px)`)}"></div>`;
  const cable = `<svg width="${AW}" height="${AH}" style="position:absolute;left:0;top:0;overflow:visible">
    <defs><linearGradient id="cab" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d7078"/><stop offset="0.4" stop-color="#b9bcc2"/><stop offset="1" stop-color="#55585e"/></linearGradient>
    <linearGradient id="pole" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2c2926"/><stop offset="0.35" stop-color="#7a746d"/><stop offset="0.6" stop-color="#4a4541"/><stop offset="1" stop-color="#1e1c1a"/></linearGradient>
    <linearGradient id="foot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a746d"/><stop offset="1" stop-color="#2c2926"/></linearGradient>
    <filter id="cs"><feGaussianBlur stdDeviation="8"/></filter></defs>
    <ellipse cx="200" cy="${AH - 18}" rx="170" ry="16" fill="#000" opacity="0.55" filter="url(#cs)"/>
    <rect x="186" y="${yb + LIP - 6}" width="30" height="${AH - yb - LIP - 22}" fill="url(#pole)"/>
    <rect x="176" y="${yb + LIP - 8}" width="50" height="16" rx="3" fill="url(#foot)"/>
    <path d="M40 ${AH - 34} L360 ${AH - 34} L372 ${AH - 20} L28 ${AH - 20} Z" fill="url(#foot)"/>
    <rect x="22" y="${AH - 22}" width="40" height="14" rx="3" fill="#1e1c1a"/><rect x="338" y="${AH - 22}" width="40" height="14" rx="3" fill="#1e1c1a"/>
    <rect x="186" y="${AH - 46}" width="30" height="16" rx="2" fill="url(#pole)"/>
    ${[0, 1, 2].map((k) => `<path d="M${300 + k * 8} ${yb + 30} C${330 + k * 8} ${yb + 120} ${250 + k * 10} ${AH - 120} ${410} ${AH - 40 - k * 10}" fill="none" stroke="url(#cab)" stroke-width="9" stroke-linecap="round"/>`).join('')}
  </svg>`;
  scenes3d.push(`<div style="position:absolute;left:${AX}px;top:${AY}px;width:${AW}px;height:${AH}px;transform:scale(${ALK});transform-origin:0 0;perspective:2600px;perspective-origin:50% 30%;">
    ${cable}
    <div style="${B3(`left:12px;top:0;width:${FW}px;height:${AH}px`)}">
      ${side(0)}${side(FW)}
      <div style="${B3(`left:0;top:${yb}px;width:${FW}px;height:${LIP}px;background:linear-gradient(180deg,#4e4945,#2e2a27);border-radius:0 0 6px 6px`)}"><div style="position:absolute;left:14px;top:12px;font:800 14px ${SANS};color:${LEG};letter-spacing:2px">AL-III</div></div>
      <div style="${B3(`left:0;top:${TOP}px;width:${FW}px;height:${FD}px;transform-origin:50% 100%;transform:rotateX(${SLOPE}deg);filter:drop-shadow(0 10px 18px rgba(0,0,0,0.5))`)}">${svgWrap(FW, FD, face)}</div>
    </div>
  </div>`);
}

// ---------------- Tape meter bridge: three stepped tiers of 8 VU meters ----------------
// logical size MW x MH, shown scaled by MBK so it fills the top row from the autolocator to the rack
const MX = 1704, MY = 60, MH = 8 + 3 * 236 + 52, MBK = (666 - MY) / MH, MW = Math.round((3282 - MX) / MBK);
{
  const TW3 = MW - 40, FH = 236, STEP = 58, X0 = 20, Y0 = 8, PITCH = TW3 / 8, CW = PITCH - 16, PLH = 52;
  const tierFace = (tier) => capture(() => {
    rect(0, 0, TW3, FH, 'url(#deck)');
    rect(0, 0, TW3, FH, '#000', 'opacity="0.38"');
    rect(0, 0, TW3, FH, '#000', 'filter="url(#brushed)" opacity="0.08"');
    rect(0, 0, TW3, 2, '#fff', 'opacity="0.18"');
    rect(0, FH - 3, TW3, 3, '#000', 'opacity="0.5"');
    for (let c = 0; c < 8; c++) {
      const i = (2 - tier) * 8 + c, x = c * PITCH + 8, w = CW;
      const on = readyTracks.has(i);
      // lamps above each meter: red record, blue status
      circle(x + w - 14, 14, 5.5, on ? '#ff3b2f' : '#4a1612', on ? 'filter="url(#glow)"' : '');
      circle(x + w - 32, 14, 5.5, i === 23 ? '#5fb4ff' : '#16304a', i === 23 ? 'filter="url(#glow)"' : '');
      // recessed meter window, wide like the HJ-24 bridge meters
      rect(x + 4, 26, w - 8, 118, '#0a0908', 'rx="6"');
      rect(x + 4, 26, w - 8, 118, 'url(#bezelHi)', 'rx="6"');
      vu(x + 14, 34, w - 28, 102, -20, { fontScale: 0.125, needleId: i });   // live: the page drives the needle
      rect(x + 10, 30, w - 20, 10, '#000', 'opacity="0.35"');        // recess shadow, top
      rect(x + 10, 30, 6, 110, '#000', 'opacity="0.25"');            // recess shadow, left
      // number, masking-tape name, READY / SAFE
      text(x + 6, 172, String(i + 1).padStart(2, '0'), 18, LEG, 'start', 800);
      rect(x + 40, 154, w - 42, 26, 'url(#tapeMask)', `rx="1" transform="rotate(${(((i * 37) % 7) - 3) * 0.25} ${x + w / 2} ${167})"`);
      text(x + 40 + (w - 42) / 2, 173, tapeNames[i], 14, '#1c2a6e', 'middle', 700, `font-family="${MARKER}"`);
      const bw = (w - 10) / 2;
      button(x + 2, 190, bw, 30, 'red', on, 'READY', { size: 14, pastel: false });
      button(x + 8 + bw, 190, bw, 30, 'white', !on, 'SAFE', { size: 14 });
    }
  });
  const faces = [0, 1, 2].map((t) => {
    const top = Y0 + (2 - t) * FH, z = -t * STEP;
    const ledge = t < 2 ? `<div style="${B3(`left:${X0}px;top:${top}px;width:${TW3}px;height:${STEP}px;transform-origin:50% 0;transform:translateZ(${z}px) rotateX(-90deg);background:linear-gradient(0deg,#5a5550,#3e3a37)`)}"></div>` : '';
    return `<div style="${B3(`left:${X0}px;top:${top}px;width:${TW3}px;height:${FH}px;transform:translateZ(${z}px)`)}">${svgWrap(TW3, FH, tierFace(t))}</div>${ledge}`;
  }).join('\n');
  // top cap and stepped end caps
  const topCap = `<div style="${B3(`left:${X0}px;top:${Y0}px;width:${TW3}px;height:${STEP + 40}px;transform-origin:50% 0;transform:translateZ(${-2 * STEP}px) rotateX(-90deg);background:linear-gradient(0deg,#625c56,#3a3633)`)}"></div>`;
  const yb = Y0 + 3 * FH, D = 2 * STEP + 40;
  const poly = `0 ${yb - Y0}px, 0 ${2 * FH}px, ${STEP}px ${2 * FH}px, ${STEP}px ${FH}px, ${2 * STEP}px ${FH}px, ${2 * STEP}px 0, ${D}px 0, ${D}px ${yb - Y0}px`;
  const endCap = (x) => `<div style="${B3(`left:${x}px;top:${Y0}px;width:${D}px;height:${yb - Y0}px;transform-origin:0 0;transform:rotateY(90deg);background:linear-gradient(90deg,#4a4541,#2c2926);clip-path:polygon(${poly})`)}"></div>`;
  // plinth with the monitor-mode keys
  const plinth = capture(() => {
    rect(0, 0, TW3 + 24, PLH, 'url(#deck)'); rect(0, 0, TW3 + 24, 2, '#fff', 'opacity="0.25"');
    rect(0, 0, TW3 + 24, PLH, '#000', 'opacity="0.15"');
    rect(18, 12, 70, 26, '#0c0c0d', 'rx="2"'); text(53, 31, 'CMI', 16, '#e3e5e8', 'middle', 900, 'font-style="italic" letter-spacing="2"');
    text(104, 31, 'HJ-24 METER BRIDGE', 16, LEG, 'start', 800, 'letter-spacing="2"');
    text(TW3 - 330, 31, 'MONITOR', 14, LEG, 'end', 800, 'letter-spacing="2"');
    [['REPRO', true], ['INPUT', false], ['SYNC', false]].forEach(([k, on], i) => button(TW3 - 314 + i * 108, 9, 96, 32, 'green', on, k, { size: 14 }));
  });
  scenes3d.push(`<div style="position:absolute;left:${MX}px;top:${MY}px;width:${MW}px;height:${MH}px;transform:scale(${MBK});transform-origin:0 0;perspective:2400px;perspective-origin:50% -25%;">
    <div style="${B3(`left:0;top:0;width:${MW}px;height:${MH}px;transform-origin:50% 100%;transform:rotateX(6deg)`)}">
      ${endCap(X0)}${endCap(X0 + TW3)}
      ${topCap}
      ${faces}
      <div style="${B3(`left:${X0 - 12}px;top:${yb}px;width:${TW3 + 24}px;height:${PLH}px;transform:translateZ(14px)`)}">${svgWrap(TW3 + 24, PLH, plinth)}</div>
    </div>
  </div>`);
}

// =====================================================================
// CONSOLE (CMI HJ-632 / HJ-600 style) — CSS 3D: knob panel + fader panel + armrest
// Faces are drawn with the SVG helpers (capture); knobs and fader caps are real 3D solids.
// Text is 14 px or larger (50" 4K legibility rule).
// =====================================================================
const disc3 = (x, y, r, z, bg, extra = '') => `<div style="${B3(`left:${(x - r).toFixed(1)}px;top:${(y - r).toFixed(1)}px;width:${(2 * r).toFixed(1)}px;height:${(2 * r).toFixed(1)}px;border-radius:50%;transform:translateZ(${z.toFixed(1)}px);background:${bg};${extra}`)}"></div>`;
const SIDE_BLK = 'linear-gradient(90deg,#050505,#3a3a3d 32%,#141416 65%,#020202)';
function knob3d(x, y, r, cap, ang, opts = {}) {
  const { dark = false, h = Math.max(9, r * 0.95), skirt = true, ptr = '#ffffff' } = opts;
  let s = '';
  if (skirt) { s += disc3(x, y, r * 1.16, 0, SIDE_BLK); s += disc3(x, y, r * 1.16, 1.6, 'radial-gradient(circle at 40% 35%, #4a4a4e, #141416 70%)'); }
  for (let z = skirt ? 2.4 : 0; z < h; z += 2) s += disc3(x, y, r * 0.84, z, SIDE_BLK);
  const cr = r * 0.84, pw = Math.max(2, r * 0.14);
  s += `<div style="${B3(`left:${(x - cr).toFixed(1)}px;top:${(y - cr).toFixed(1)}px;width:${(2 * cr).toFixed(1)}px;height:${(2 * cr).toFixed(1)}px;border-radius:50%;transform:translateZ(${h.toFixed(1)}px);background:radial-gradient(circle at 36% 30%, rgba(255,255,255,${dark ? 0.32 : 0.7}), rgba(255,255,255,0) 46%), radial-gradient(circle, rgba(0,0,0,0) 58%, rgba(0,0,0,0.45) 100%), ${cap}`)}"><div style="position:absolute;left:50%;top:5%;width:${pw.toFixed(1)}px;height:45%;margin-left:-${(pw / 2).toFixed(1)}px;background:${ptr};border-radius:2px;transform-origin:50% 100%;transform:rotate(${ang}deg)"></div></div>`;
  return s;
}
// knob scale ticks drawn into the face texture
function ticks(cx, cy, r, col = '#d9d3c2') {
  for (let i = 0; i <= 10; i++) {
    const a = -150 + i * 30;
    const [x1, y1] = polar(cx, cy, r * 1.25, a), [x2, y2] = polar(cx, cy, r * 1.42, a);
    p(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-opacity="0.75" stroke-width="${i % 5 === 0 ? 1.8 : 1.1}"/>`);
  }
  circle(cx + 2, cy + 4, r * 1.25, 'url(#kShadow)');
}
// 3D fader cap (box) centred at x,y on the fader plane
function cap3d(x, y, w, d, h, topBg, idx = '#ffffff') {
  const L = (x - w / 2).toFixed(1), T = (y - d / 2).toFixed(1);
  let s = '';
  s += `<div style="${B3(`left:${L}px;top:${T}px;width:${w}px;height:${d}px;border-radius:3px;transform:translateZ(${h}px);background:repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 5px, rgba(0,0,0,0.35) 5px 6px, rgba(255,255,255,0.12) 6px 7px), ${topBg}`)}"><div style="position:absolute;left:2px;right:2px;top:50%;height:3px;margin-top:-1.5px;background:${idx}"></div></div>`;
  s += `<div style="${B3(`left:${L}px;top:${(y + d / 2 - h).toFixed(1)}px;width:${w}px;height:${h}px;transform-origin:50% 100%;transform:rotateX(-90deg);background:linear-gradient(180deg,#2a2a2c,#050505)`)}"></div>`;
  s += `<div style="${B3(`left:${L}px;top:${(y - d / 2 - h).toFixed(1)}px;width:${w}px;height:${h}px;transform-origin:50% 100%;transform:rotateX(-90deg);background:#111`)}"></div>`;
  for (const sx of [x - w / 2, x + w / 2]) s += `<div style="${B3(`left:${(sx - h).toFixed(1)}px;top:${T}px;width:${h}px;height:${d}px;transform-origin:100% 50%;transform:rotateY(90deg);background:linear-gradient(90deg,#060606,#1c1c1e)`)}"></div>`;
  return s;
}
const CAP_TOP = {
  black: 'linear-gradient(180deg,#5b5e62,#2a2c2f 40%,#111214)',
  yellow: 'linear-gradient(180deg,#fff1a0,#e6c02e 40%,#8a6c12)',
  green: 'linear-gradient(180deg,#a8e0a0,#3f8f3a 40%,#1a3d18)',
  white: 'linear-gradient(180deg,#ffffff,#e6e4dc 40%,#9a978f)',
  red: 'linear-gradient(180deg,#f08a80,#b3261b 40%,#4a0d08)',
};

const CX = 12, CY = 794, CW = 3266, CH = 2160 - 794, BRIDGE = 120;   // CY = top of the channel strips; the meter bridge sits above
{
  const PW = CW - 68;                 // panel width between the wood cheeks
  const STRIP = 85, NCH = 32, MXL = NCH * STRIP, MWD = PW - MXL;   // master section x / width
  const UD = 964, FD = 370, YF = 1146;   // knob-panel depth, fader-panel depth, screen y of the fader front edge
  const consoleNames = [...tapeNames, '224 L', '224 R', 'SPX L', 'SPX R', 'PCM42 A', 'PCM42 B', 'LIVE 1', 'TALK'];
  const busLit = (i) => (i < 11 ? [0, 1] : i < 13 ? [2, 3] : i < 19 ? [4, 5] : i < 23 ? [6, 7] : []);
  const muted = new Set([2, 22, 31]), soloed = new Set([19]);
  const faderPos = consoleNames.map((n, i) => (i === 19 ? 0.2 : i === 31 ? 0.98 : 0.24 + rnd() * 0.2));
  const L = '#ece7dc';
  const upKnobs = [], fdCaps = [];
  // FLAT = true: the console is drawn as a flat front view (2D shaded knobs and caps) in the main SVG
  const FLAT = true;
  let CH_NOW = 0;
  const K = (x, y, r, cap, ang, o = {}) => { if (FLAT) knob(x, y, r, cap, ang, { ticks: false, dark: o.dark, kid: o.kid, ch: CH_NOW }); else upKnobs.push(knob3d(x, y, r, cap, ang, o)); };
  const CAP_SVG = { black: 'url(#faderCapBlack)', yellow: 'url(#faderCapYellow)', green: 'url(#faderCapGreen)', white: 'url(#faderCapWhite)', red: 'url(#faderCapRed)' };
  const capFlat = (x, y, w, d, key, idx) => {
    rect(x - w / 2 + 3, y - d / 2 + 8, w, d, '#000', 'rx="4" opacity="0.5" filter="url(#soft)"');
    rect(x - w / 2, y - d / 2, w, d, CAP_SVG[key], 'rx="3"');
    for (let i = -3; i <= 3; i++) { if (!i) continue; const yy = y + i * (d / 9); p(`<line x1="${x - w / 2 + 3}" y1="${yy}" x2="${x + w / 2 - 3}" y2="${yy}" stroke="#000" stroke-opacity="0.35"/><line x1="${x - w / 2 + 3}" y1="${yy + 1}" x2="${x + w / 2 - 3}" y2="${yy + 1}" stroke="#fff" stroke-opacity="0.12"/>`); }
    rect(x - w / 2 + 2, y - 1.5, w - 4, 3, idx);
  };
  const CAP = (x, y, w, d, h, key, idx) => { if (FLAT) capFlat(x, y, w, d, key, idx); else fdCaps.push(cap3d(x, y, w, d, h, CAP_TOP[key], idx)); };

  // ---------------- knob panel texture ----------------
  const upper = capture(() => {
    // HJ-600 series channel strip, laid out from the user's reference photos (top to bottom)
    const GOLD = '#d8c27c', WH = '#ece6da';
    const tx = (x, y, s2, size, col = WH, anchor = 'middle', w = 800) => text(x, y, s2, size, col, anchor, w);
    const blk = (x, y, w, h, label, lit = false, litCol = '#ff3b2f', bid) => {
      if (bid) p(`<g data-bid="${bid}" data-ch="${CH_NOW}" data-on="${lit ? 1 : 0}">`);
      rect(x - 0.5, y + 1.5, w + 1, h + 1, '#000', 'rx="2" opacity="0.6"');
      rect(x, y, w, h, '#151515', 'rx="2"'); rect(x, y, w, h, 'url(#btnOff)', 'rx="2"'); tx(x + w / 2, y + h / 2 + 3.4, label, 9.5, WH, 'middle', 800);
      p(`<g class="klit" opacity="${lit ? 1 : 0}">`); rect(x, y, w, h, litCol, 'rx="2" filter="url(#glow)"'); rect(x, y, w, h, 'url(#btnOff)', 'rx="2"'); tx(x + w / 2, y + h / 2 + 3.4, label, 9.5, '#1a0c08', 'middle', 800); p('</g>');
      if (bid) p('</g>');
    };
    const wht = (x, y, w, h, label, lit = false) => {
      rect(x - 0.5, y + 1.5, w + 1, h + 1, '#000', 'rx="2" opacity="0.6"');
      rect(x, y, w, h, lit ? '#fff7c8' : '#e9e7e0', `rx="2" ${lit ? 'filter="url(#glow)"' : ''}`);
      rect(x, y, w, h, 'url(#btnOff)', 'rx="2" opacity="0.5"');
      tx(x + w / 2, y + h / 2 + 4, label, 11, '#1b1b1b', 'middle', 800);
    };
    const rnd2 = (cx, cy, r, col) => { circle(cx + 0.8, cy + 1.6, r + 0.8, '#000', 'opacity="0.55"'); circle(cx, cy, r, col); circle(cx, cy, r, 'url(#capHi)', 'opacity="0.7"'); };
    // round key with a lit layer (green dot, cream cap or red LED) for the pop-ups to switch
    const rkey = (bid, cx, cy, r, col, on, litKind) => {
      p(`<g data-bid="${bid}" data-ch="${CH_NOW}" data-on="${on ? 1 : 0}">`); rnd2(cx, cy, r, col);
      p(`<g class="klit" opacity="${on ? 1 : 0}">`);
      if (litKind === 'cream') { circle(cx, cy, r, '#fff8d8', 'filter="url(#glow)"'); circle(cx, cy, r, 'url(#capHi)', 'opacity="0.7"'); } else circle(cx, cy, 2, '#59f07a', 'filter="url(#glowSm)"');
      p('</g></g>');
    };
    const led = (cx, cy, on) => circle(cx, cy, 2.6, on ? '#ff3b2f' : '#4a1612', on ? 'filter="url(#glow)"' : '');
    // printed knob scale: tick marks plus numerals at given angles
    const scale = (cx, cy, r, marks, col = WH) => {
      for (let i = 0; i <= 10; i++) { const a = -150 + i * 30; const [x1, y1] = polar(cx, cy, r * 1.22, a), [x2, y2] = polar(cx, cy, r * 1.38, a); p(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${GOLD}" stroke-width="0.9"/>`); }
      const FS = 6.8, tw = (t) => [...t].reduce((w, c) => w + (c === '.' ? 0.3 : /[A-Z∞]/.test(c) ? 0.7 : 0.58), 0) * FS;
      for (const [a, lab] of marks) {   // numerals clear of the tick ring: ring + gap + the label's half-extent along that direction
        const sa = Math.sin(a * Math.PI / 180), ca = Math.cos(a * Math.PI / 180), d = r * 1.38 + 0.8 + 2.4 * Math.abs(sa * ca) + Math.abs(sa) * tw(lab) / 2 + Math.abs(ca) * FS * 0.36;
        tx(cx + d * sa, cy - d * ca + FS * 0.36, lab, FS, col, 'middle', 700);
      }
    };
    const KN = (cx, cy, r, col, ang, marks, dark = false, kid) => { scale(cx, cy, r, marks); K(cx, cy, r, col, ang, { dark, kid }); };
    const BLUE = '#3f8fd9', SAGE = '#7fa392', RED = '#e3452f', YEL = '#ecd03a', BLK = '#1a1a1c';
    const GAIN14 = [[-150, '-14'], [-75, '6'], [0, '0'], [75, '6'], [150, '+14']];
    for (let ch = 0; ch < NCH; ch++) {
      const x0 = ch * STRIP, ret = ch >= 24, cm = x0 + STRIP / 2; CH_NOW = ch;
      rect(x0, 0, STRIP, UD, ret ? 'url(#jh600alt)' : 'url(#jh600)');
      rect(x0, 0, STRIP, UD, '#000', 'filter="url(#brushed)" opacity="0.06"');
      rect(x0, 0, 1.5, UD, '#000', 'opacity="0.75"'); rect(x0 + 1.5, 0, 1, UD, '#fff', 'opacity="0.08"');
      for (const sy of [6, UD - 6]) screw(cm, sy, 2.6);
      // bus assign: 24 round black keys in two columns, red LED beside each
      for (let i = 0; i < 12; i++) {
        const y = 12 + i * 12.6;   // clear of the INPUT / TAPE keys below
        for (const [k, bx, lx, nx, an] of [[2 * i + 1, x0 + 20, x0 + 32, x0 + 8, 'middle'], [2 * i + 2, x0 + 52, x0 + 64, x0 + 77, 'middle']]) {
          { const on = (busLit(ch).includes(k - 1)); p(`<g data-bid="bus${k}" data-ch="${ch}" data-on="${on ? 1 : 0}">`); rnd2(bx, y, 4.8, '#141414'); led(lx, y, false); p(`<g class="klit" opacity="${on ? 1 : 0}">`); led(lx, y, true); p('</g></g>'); }
          tx(nx, y + 2.8, String(k), 7.5, WH, an, 700);
        }
      }
      p('<g transform="translate(0 -26)">');
      // INPUT / TAPE source select
      blk(x0 + 4, 187, 37, 15, 'INPUT', readyTracks.has(ch), '#ffb02e', 'src_in'); blk(x0 + 44, 187, 37, 15, 'TAPE', ch < 24 && !readyTracks.has(ch), '#ffb02e', 'src_tape');
      p('<g transform="translate(0 -58)">');   // trim through sends move up into the space the mic controls left
      KN(x0 + 22, 274, 11, RED, -30 + rnd() * 60, [[-125, '-'], [125, '+']], false, 'trim');
      tx(x0 + 22, 299, 'TRIM', 8, WH);
      KN(x0 + 60, 290, 10, RED, ch % 2 ? 40 : -40, [[-150, 'O'], [0, 'C'], [150, 'E']], false, 'oddeven');
      tx(x0 + 60, 317, 'ODD·EVEN', 6.6, WH, 'middle', 700);
      // pan toggle, direct out level + LED
      rect(x0 + 13, 330, 14, 8, '#0d0d0d', 'rx="4"'); rect(x0 + 17, 320, 6, 14, 'url(#chrome)', 'rx="3"');
      tx(x0 + 20, 348, 'PAN', 7.5, GOLD);
      tx(x0 + 56, 324, 'DIRECT', 7, GOLD);
      K(x0 + 56, 337, 7.5, BLK, -60, { dark: true, kid: 'direct' }); led(x0 + 76, 334, ch < 24 && ch % 7 === 3);
      // DUMP + channel number key
      blk(x0 + 5, 354, 36, 17, 'DUMP', false, '#ff3b2f', 'dump'); wht(x0 + 45, 354, 35, 17, String(ch + 1));
      // EQ: three bands in a gold bracket, frequency up-right, gain down-left
      p(`<rect x="${x0 + 3.5}" y="380" width="78" height="252" rx="2" fill="none" stroke="${GOLD}" stroke-width="1.1"/>`);
      const bands = [
        ['HI', BLUE, [[-150, '4.6'], [-100, '6'], [-50, '8'], [0, '11'], [50, '13'], [100, '14'], [150, '16']], 'KHz'],
        ['MID', SAGE, [[-150, '.18'], [-100, '.25'], [-50, '.5'], [-10, '1.5'], [30, '2'], [80, '4'], [120, '8'], [150, '10']], 'KHz'],
        ['LOW', RED, [[-150, '30'], [-60, '75'], [5, '150'], [60, '200'], [150, '250']], 'Hz'],
      ];
      bands.forEach(([bn, col, fm, unit], bi) => {
        const by = 384 + bi * 82;
        tx(x0 + 8, by + 13, bn, 10, WH, 'start', 800);
        if (bi === 0) circle(x0 + 30, by + 9, 2.4, '#0a0a0a');
        KN(x0 + 58 - (bi === 2 ? 2 : 0), by + 28, 11, col, -100 + rnd() * 200, fm, false, ['hf_f', 'mf_f', 'lf_f'][bi]);
        KN(x0 + 25, by + 62, 11, col, (rnd() - 0.5) * 140, GAIN14, false, ['hf_g', 'mf_g', 'lf_g'][bi]);
      });
      // EQ in, filters, phase, channel
      const eqOn = ![5, 6, 15, 24, 25, 31].includes(ch);
      rkey('eq_in', x0 + 28, 648, 6, '#2a2a2a', eqOn, 'dot');
      rkey('hpf', x0 + 58, 648, 6, '#141414', false, 'dot'); rkey('phase', x0 + 28, 668, 6, '#e9e7e0', ch === 2, 'cream'); rkey('lpf', x0 + 58, 668, 6, '#141414', false, 'dot'); rkey('chn', x0 + 28, 688, 6, '#d8cfae', false, 'cream');
      tx(x0 + 9, 651, 'IN', 7.5, WH, 'middle', 800); tx(x0 + 9, 671, 'Ø', 9, WH, 'middle', 800); tx(x0 + 10, 691, 'CHN', 6.5, WH, 'middle', 800);
      p(`<path d="M${x0 + 69} 652 L${x0 + 72} 645 L${x0 + 78} 645" fill="none" stroke="${WH}" stroke-width="1"/><path d="M${x0 + 69} 665 L${x0 + 75} 665 L${x0 + 78} 672" fill="none" stroke="${WH}" stroke-width="1"/>`);
      // sends: 1-2 yellow levels (PRE, WET); 3-4 and 5-6 pan + level (PRE, 2MIX)
      const sendHead = (y, nm) => { rect(x0 + 4, y, 77, 1.1, GOLD); tx(x0 + 80, y + 12, 'SEND', 9, GOLD, 'end', 800); tx(x0 + 80, y + 23, nm, 9, GOLD, 'end', 800); };
      const lv = (on) => (on ? -40 + rnd() * 120 : -150);
      sendHead(702, '1-2');
      KN(x0 + 23.5, 725, 11, YEL, lv(ch < 24 && [1, 15, 19, 20, 21].includes(ch)), [[-122, '∞'], [0, '1'], [122, '+3']], false, 's1');
      blk(x0 + 4, 742.5, 30, 14, 'PRE', false, '#ff3b2f', 's12pre'); KN(x0 + 56, 752, 11, YEL, lv([13, 14, 19].includes(ch)), [[-135, '∞'], [0, '2'], [135, '+3']], false, 's2');
      blk(x0 + 4, 760.5, 30, 14, 'WET', false, '#ff3b2f', 's12wet');
      sendHead(778, '3-4');
      KN(x0 + 22, 801, 11, BLUE, 0, [[0, 'C'], [-125, '3'], [125, '4']], false, 's34p');
      blk(x0 + 4, 817, 30, 14, 'PRE', false, '#ff3b2f', 's34pre'); KN(x0 + 56, 828, 11, BLUE, lv(ch < 24), [[-135, '∞'], [0, 'LVL'], [135, '+3']], false, 's34');
      sendHead(848, '5-6');
      KN(x0 + 22, 871, 11, RED, 0, [[0, 'C'], [-125, '5'], [125, '6']], false, 's56p');
      blk(x0 + 4, 887, 30, 14, 'PRE', false, '#ff3b2f', 's56pre'); KN(x0 + 56, 898, 11, RED, lv(ch < 24 && ch % 3 === 0), [[-135, '∞'], [0, 'LVL'], [135, '+3']], false, 's56');
      blk(x0 + 4, 905, 30, 14, '2MIX', false, '#ff3b2f', 's562mix');
      rect(x0 + 4, 924, 77, 1.1, GOLD);
      p('</g>');
      // BUS level rotary below sends 5-6: feeds the assigned buses through the odd/even pan
      tx(x0 + 5, 880, 'BUS', 10, GOLD, 'start', 800); tx(x0 + 5, 892, 'LVL', 10, GOLD, 'start', 800);
      KN(x0 + 50, 897, 18, '#1d1d1f', 60, [[60, '0']], true, 'buslvl');   // black; normally set to 0 dB (2 o'clock)
      tx(x0 + 27, 926, '∞', 8, WH, 'middle', 700); tx(x0 + 74, 926, '+10', 7.5, WH, 'middle', 700);
      // mute + numbered solo key, bus level and channel pan
      blk(x0 + 4, 928, 36, 18, 'MUTE', muted.has(ch)); wht(x0 + 44, 928, 36, 18, String(ch + 1), soloed.has(ch));
      const pan = ch === 7 || ch === 9 ? -110 : ch === 8 || ch === 10 ? 110 : ch % 2 ? 50 * (rnd() - 0.2) : -50 * (rnd() - 0.2);
      KN(x0 + 42, 972, 12, BLK, pan, [[0, 'C'], [-122, 'L'], [122, 'R']], true);
      p('</g>');
    }
    for (let g = 1; g < 4; g++) rect(g * 8 * STRIP - 1.5, 0, 3, UD, '#0a0a0b');
    // ---- master section ----
    const mx = MXL, mw = MWD;
    rect(mx, 0, mw, UD, 'url(#jh600)'); rect(mx, 0, mw, UD, '#000', 'filter="url(#brushed)" opacity="0.06"'); rect(mx, 0, 3, UD, '#000');
    rect(mx + 14, 472, mw - 28, 484, '#3e3934', 'rx="3"'); for (let ry = 482; ry < 950; ry += 9) { rect(mx + 22, ry, mw - 44, 4, '#2a2622', 'rx="2"'); rect(mx + 22, ry + 4, mw - 44, 1, '#fff', 'opacity="0.08"'); }
    text(mx + mw / 2, 34, 'MASTER', 18, '#f0ece4', 'middle', 800, 'letter-spacing="5"');
    p(`<g transform="translate(${mx + 52} 0) scale(0.78) translate(${-mx} -150)">`);
    let y = 226;
    text(mx + 18, y, 'SEND MASTERS', 14, '#c9c2b2', 'start', 800, 'letter-spacing="1"');
    text(mx + mw - 18, y, 'RETURNS', 14, '#c9c2b2', 'end', 800, 'letter-spacing="1"');
    for (let a = 0; a < 4; a++) {
      const kx = mx + 36 + a * 50, rx = mx + mw - 186 + a * 50;
      if (a < 3) { const sx = mx + 46 + a * 64; ticks(sx, y + 34, 14); K(sx, y + 34, 14, a < 2 ? '#ecd03a' : '#3f8fd9', 20 + a * 10); text(sx, y + 66, a < 2 ? `SEND ${a + 1}` : 'SEND 3-4', 14, L, 'middle', 800); }
      if (a === 2) { // sends 3-4 mode: stereo effect send (FX) or Cue 1 (CUE)
        rect(mx + 194, y + 17, 34, 15, '#000', 'rx="2" opacity="0.6"'); rect(mx + 194, y + 15.5, 34, 15, '#ffb02e', 'rx="2" filter="url(#glowSm)"'); rect(mx + 194, y + 15.5, 34, 15, 'url(#btnLit)', 'rx="2"'); text(mx + 211, y + 27, 'FX', 11, '#1a1208', 'middle', 800);
        rect(mx + 194, y + 37, 34, 15, '#000', 'rx="2" opacity="0.6"'); rect(mx + 194, y + 35.5, 34, 15, '#151515', 'rx="2"'); rect(mx + 194, y + 35.5, 34, 15, 'url(#btnOff)', 'rx="2"'); text(mx + 211, y + 47, 'CUE', 10, '#ece6da', 'middle', 800);
      }
      ticks(rx, y + 34, 14); K(rx, y + 34, 14, '#1d1d1f', -10 + a * 15, { dark: true });
      text(rx, y + 66, `R${a + 1}`, 14, L, 'middle', 800);
    }
    y = 320; rect(mx + 12, y - 14, mw - 24, 1.5, '#000', 'opacity="0.55"');
    text(mx + 18, y + 6, 'CONTROL ROOM', 14, '#c9c2b2', 'start', 800, 'letter-spacing="1"');
    ['MIX', '2-TRK', 'CUE 1', 'CUE 2'].forEach((s2, i) => button(mx + 16 + i * 70, y + 18, 64, 30, 'white', i === 0, s2, { size: 14 }));
    [['DIM', 'amber'], ['MONO', 'amber'], ['CUT', 'red'], ['ALT', 'white']].forEach(([s2, c], i) => button(mx + 16 + i * 70, y + 58, 64, 30, c, false, s2, { size: 14 }));
    ticks(mx + mw - 64, y + 70, 40, '#d9d3c2');
    if (FLAT) bigKnob(mx + mw - 64, y + 70, 40, 40, { capColor: '#1c1c1e' }); else upKnobs.push(knob3d(mx + mw - 64, y + 70, 40, 'radial-gradient(circle, #2a2a2c, #0c0c0d)', 40, { dark: true, h: 30 }));
    text(mx + mw - 64, y + 142, 'MONITOR', 14, L, 'middle', 800, 'letter-spacing="1"');
    y = 488; rect(mx + 12, y - 14, mw - 24, 1.5, '#000', 'opacity="0.55"');
    text(mx + 18, y + 6, 'CUE / STUDIO', 14, '#c9c2b2', 'start', 800, 'letter-spacing="1"');
    [['CUE 1', '#3f8fd9', 30], ['CUE 2', '#e3452f', 10], ['STUDIO', '#1d1d1f', -40]].forEach(([s2, c, a], i) => {
      const kx = mx + 40 + i * 64; ticks(kx, y + 38, 14); K(kx, y + 38, 14, c, a, { dark: c === '#1d1d1f' });
      text(kx, y + 72, s2, 14, L, 'middle', 800);
    });
    button(mx + 226, y + 20, 112, 30, 'white', true, 'CUE → CR', { size: 14 });
    button(mx + 346, y + 20, 112, 30, 'yellow', true, 'SOLO CLR', { size: 14 });
    y = 596; rect(mx + 12, y - 14, mw - 24, 1.5, '#000', 'opacity="0.55"');
    text(mx + 18, y + 6, 'TALKBACK', 14, '#c9c2b2', 'start', 800, 'letter-spacing="1"');
    button(mx + 16, y + 18, 140, 54, 'red', false, 'TALK', { size: 20 });
    ticks(mx + 196, y + 44, 14); K(mx + 196, y + 44, 14, '#ecebe4', -20);
    text(mx + 196, y + 78, 'TB LVL', 14, L, 'middle', 800);
    button(mx + 236, y + 24, 104, 30, 'white', false, 'SLATE', { size: 14 });
    button(mx + 348, y + 24, 112, 30, 'white', false, 'TB → CUE', { size: 14 });
    y = 700; rect(mx + 12, y - 14, mw - 24, 1.5, '#000', 'opacity="0.55"');
    text(mx + 18, y + 6, 'OSCILLATOR · BOUNCE', 14, '#c9c2b2', 'start', 800, 'letter-spacing="1"');
    ['100', '1k', '10k'].forEach((s2, i) => button(mx + 16 + i * 62, y + 20, 56, 30, 'green', false, s2, { size: 14 }));
    ticks(mx + 222, y + 36, 13); K(mx + 222, y + 36, 13, '#1d1d1f', -150, { dark: true });
    text(mx + 222, y + 70, 'OSC', 14, L, 'middle', 800);
    button(mx + 262, y + 20, 196, 34, 'amber', false, 'BOUNCE MIX → WAV', { size: 14 });
    p('</g>');
    // ---- Leximan 224X remote resting on the master section (layout traced from the user's photos) ----
    {
      const RWd = 296, RHt = 462, rx = mx + (mw - RWd) / 2, ry = 486, sc = RWd / 640;
      p(`<rect x="${rx + 10}" y="${ry + 16}" width="${RWd}" height="${RHt}" rx="8" fill="#000" opacity="0.6" filter="url(#soft)"/>`);
      // grey DB25 cable out of the remote's right side, toward the 224X mainframe in the rack
      { const sx = rx + RWd - 6, sy = ry + 60, d = `M${sx} ${sy} C${sx + 40} ${sy - 4} ${mx + mw - 30} ${sy - 30} ${mx + mw + 40} ${sy - 46}`;
        p(`<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="12" transform="translate(3 6)"/><path d="${d}" fill="none" stroke="#9fa3a8" stroke-width="10"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2.5" transform="translate(-1 -2)"/>`);
        rect(sx - 6, sy - 20, 16, 40, '#c9ccd0', 'rx="3"'); }
      remote224(rx, ry, sc);
    }
    // oak top trim
    rect(0, 0, PW, 6, 'url(#oakH)');
  });

  // ---------------- fader panel texture ----------------
  const MARKS = [['+10', 0], ['0', 0.22], ['10', 0.46], ['20', 0.62], ['40', 0.84], ['∞', 1]];
  const lower = capture(() => {
    rect(0, 0, PW, FD, 'url(#faderBay)');
    rect(0, 0, PW, FD, '#000', 'filter="url(#brushed)" opacity="0.06"');
    const top = 96, bot = 346;   // 250 px travel on an 85 px strip (long-throw moving fader)
    // automation modes (moving faders): demo states across the desk
    const AUTO = { off: ['OFF', '#8a8580'], read: ['READ', '#4fd46a'], write: ['WRITE', '#ff3b2f'], touch: ['TOUCH', '#ffb02e'], latch: ['LATCH', '#5aa0ff'], trim: ['TRIM', '#ffe14a'] };
    const modeOf = (ch) => (ch >= 24 ? 'off' : ch === 8 ? 'write' : ch === 11 ? 'touch' : ch === 14 ? 'latch' : ch === 19 ? 'trim' : 'read');
    const touched = (ch) => ch === 11 || ch === 8;
    const WH2 = '#ece6da';
    const FMARK = [['10', 0], ['0', 0.2], ['10', 0.42], ['20', 0.6], ['40', 0.82], ['∞', 1]];
    for (let ch = 0; ch < NCH; ch++) {
      const x0 = ch * STRIP, cm = x0 + STRIP / 2, fx = x0 + 45;   // fader set left to leave room for the automation keys
      rect(x0, 0, STRIP, FD, 'url(#jh600)'); rect(x0, 0, 1.5, FD, '#000', 'opacity="0.75"');
      // REV / PFL keys and the EQ / CHN / SOLO / TAPE status LEDs
      for (const [k, yy, lit] of [['REV', 6, false], ['PFL', 24, soloed.has(ch)]]) {
        rect(x0 + 4, yy + 1.5, 32, 15, '#000', 'rx="2" opacity="0.6"'); rect(x0 + 4, yy, 32, 14, lit ? '#ffe14a' : '#151515', `rx="2" ${lit ? 'filter="url(#glow)"' : ''}`); rect(x0 + 4, yy, 32, 14, 'url(#btnOff)', 'rx="2"');
        text(x0 + 20, yy + 10.5, k, 9, lit ? '#1a1208' : WH2, 'middle', 800);
      }
      const eqOn = ![5, 6, 15, 24, 25, 31].includes(ch);
      [['EQ', eqOn], ['CHN', false], ['SOLO', soloed.has(ch)], ['TAPE', ch < 24]].forEach(([k, on], i) => {
        const ly = 9 + i * 9.5;
        circle(x0 + 44, ly, 2.5, on ? (k === 'SOLO' ? '#ffe14a' : '#ff3b2f') : '#4a1612', on ? 'filter="url(#glowSm)"' : '');
        text(x0 + 50, ly + 2.6, k, 7, WH2, 'start', 700);
      });
      // scribble strip
      rect(x0 + 3, 48, STRIP - 6, 20, 'url(#tapeMask)', `rx="1" transform="rotate(${((ch * 37) % 7 - 3) * 0.2} ${cm} 58)"`);
      text(cm, 63, consoleNames[ch], consoleNames[ch].length > 8 ? 10 : 11.5, '#1c2a6e', 'middle', 700, `font-family="${MARKER}"`);
      for (const [lab, fr] of FMARK) {
        const yy = top + fr * (bot - top);
        p(`<line x1="${fx - 20}" y1="${yy}" x2="${fx - 7}" y2="${yy}" stroke="${WH2}" stroke-opacity="${fr === 0.2 ? 1 : 0.55}" stroke-width="${fr === 0.2 ? 1.6 : 1}"/>`);
        text(fx - 22, yy + 3, lab, 7.5, WH2, 'end', 700);
      }
      rect(fx - 3.5, top - 6, 7, bot - top + 12, '#050505', 'rx="3.5"'); rect(fx - 1, top - 4, 2, bot - top + 8, '#2a2a2a');
      // automation: one small key per mode beside the fader; the active mode's key lights in its colour
      { const m = modeOf(ch), kx = x0 + 68;
        circle(kx + 7, top + 2, 2.6, touched(ch) ? '#7fd0ff' : '#18303e', touched(ch) ? 'filter="url(#glowSm)"' : '');   // touch-sense LED
        [['off', 'O'], ['read', 'R'], ['write', 'W'], ['touch', 'T'], ['latch', 'L'], ['trim', 'Tr']].forEach(([k, l], n) => {
          const ky = top + 14 + n * 22, on = k === m, col = AUTO[k][1];
          rect(kx, ky + 1.2, 14, 16, '#000', 'rx="1.5" opacity="0.6"');
          rect(kx, ky, 14, 16, on ? col : '#151515', `rx="1.5" ${on && k !== 'off' ? 'filter="url(#glowSm)"' : ''}`);
          rect(kx, ky, 14, 16, on ? 'url(#btnLit)' : 'url(#btnOff)', 'rx="1.5"');
          circle(kx + 7, ky + 4, 1.7, on ? '#fff' : col, on ? '' : 'opacity="0.45"');
          text(kx + 7, ky + 13.5, l, l.length > 1 ? 6.5 : 7.5, on ? '#10140f' : '#cfc9bd', 'middle', 900);
        });
      }
      const cy = top + faderPos[ch] * (bot - top);
      p(`<ellipse cx="${fx + 6}" cy="${cy + 10}" rx="22" ry="30" fill="#000" opacity="0.35" filter="url(#soft)"/>`);
      CAP(fx, cy, 34, 48, 18, 'white', ch >= 24 ? '#c89a20' : '#222');
      text(x0 + 76, FD - 8, String(ch + 1), 9, WH2, 'end', 800);
      // VCA group selector readout (click cycles –, G1–G8)
      { const grp = ch < 11 ? 1 : ch < 13 ? 2 : ch < 16 ? 3 : ch < 19 ? 4 : ch < 22 ? 5 : ch < 24 ? 6 : ch < 30 ? 7 : 0;
        rect(x0 + 3, FD - 20, 23, 15, '#000', 'rx="2" opacity="0.6"'); rect(x0 + 3, FD - 21, 23, 15, '#0a0302', 'rx="2"');
        text(x0 + 14.5, FD - 9.5, grp ? `G${grp}` : '–', 10, grp ? '#ff3a24' : '#5a1410', 'middle', 800, `font-family="'JetBrains Mono', monospace" ${grp ? 'filter="url(#glowSm)"' : ''}`); }
    }
    const mx = MXL, mw = MWD;
    rect(mx, 0, 3, FD, '#000', 'opacity="0.4"');
    rect(mx, 0, mw, FD, 'url(#jh600)');
    // global automation: set every channel and group at once; tape-locked data status
    text(mx + 10, 18, 'AUTO', 10, '#d8c27c', 'start', 800, 'letter-spacing="1"');
    Object.entries(AUTO).forEach(([k, [nm, col]], i) => {
      const bx = mx + 50 + i * 55, on = k === 'read';
      rect(bx, 6, 50, 18, '#000', 'rx="2" opacity="0.6"'); rect(bx, 4.5, 50, 18, on ? col : '#151515', `rx="2" ${on ? 'filter="url(#glow)"' : ''}`); rect(bx, 4.5, 50, 18, on ? 'url(#btnLit)' : 'url(#btnOff)', 'rx="2"');
      text(bx + 25, 17.5, nm, 9, on ? '#10140f' : col, 'middle', 800);
    });
    circle(mx + 388, 38, 3.2, '#4fd46a', 'filter="url(#glowSm)"'); text(mx + 396, 42, 'TAPE SYNC', 9, '#ece6da', 'start', 800);
    circle(mx + 388, 54, 3.2, '#ffb02e', 'filter="url(#glowSm)"'); text(mx + 396, 58, 'DATA 03:42', 9, '#ece6da', 'start', 800);
    circle(mx + 388, 70, 3.2, '#ff3b2f', 'filter="url(#glowSm)"'); text(mx + 396, 74, 'PASS 4', 9, '#ece6da', 'start', 800);
    const gc = ['yellow', 'green', 'white', 'black'];
    for (let g = 0; g < 8; g++) {
      const gx = mx + 44 + g * 40, cy = top + (0.22 + (g % 3) * 0.03) * (bot - top);
      if (g === 0) for (const [lab, fr] of MARKS) text(gx - 16, top + fr * (bot - top) + 4, lab, 9, '#ece6da', 'end', 700);
      rect(gx - 4, top - 8, 8, bot - top + 16, '#050505', 'rx="4"');
      CAP(gx, cy, 30, 44, 18, gc[g % 4], '#111');
      { const gm = g === 3 ? 'touch' : 'read'; circle(gx, 86, 3, AUTO[gm][1], 'filter="url(#glowSm)"'); }   // group automation mode LED
      // group mute (red) and solo (green) keys above each group fader
      for (const [k, yy, col, on] of [['M', 34, '#d63a2c', g === 5], ['S', 58, '#3fae5a', g === 1]]) {
        rect(gx - 14, yy + 2, 28, 20, '#000', 'rx="3" opacity="0.6"');
        rect(gx - 14, yy, 28, 20, col, `rx="3" ${on ? 'filter="url(#glow)"' : 'opacity="0.62"'}`);
        rect(gx - 14, yy, 28, 20, on ? 'url(#btnLit)' : 'url(#btnOff)', 'rx="3"');
        text(gx, yy + 15, k, 13, on ? '#fff' : '#f3eee4', 'middle', 900);
      }
      text(gx, FD - 6, `G${g + 1}`, 12, '#ece6da', 'middle', 800);
    }
    const mfx = mx + mw - 54;
    for (const [lab, fr] of MARKS) text(mfx - 34, top + fr * (bot - top) + 4, lab, 9, '#ece6da', 'end', 700);
    for (const ox of [-18, 18]) rect(mfx + ox - 4, top - 8, 8, bot - top + 16, '#050505', 'rx="4"');
    CAP(mfx - 18, top + 0.22 * (bot - top), 32, 48, 22, 'yellow', '#111'); CAP(mfx + 18, top + 0.22 * (bot - top), 32, 48, 22, 'green', '#111');
    text(mfx, FD - 6, 'STEREO', 12, '#ece6da', 'middle', 800, 'letter-spacing="1"');
  });

  // ---------------- assemble the 3D console ----------------
  const woodBg = 'linear-gradient(90deg,#8a5a2c,#c48a4c 40%,#a06c34 70%,#6e4420)';
  const cheek = (x, d, h) => `<div style="${B3(`left:${x - h}px;top:0;width:${h}px;height:${d}px;transform-origin:100% 50%;transform:rotateY(90deg);background:${woodBg}`)}"></div>`;
  const cheekTop = (x, d, h) => `<div style="${B3(`left:${x}px;top:0;width:34px;height:${d}px;transform:translateZ(0.5px);background:linear-gradient(90deg,#8a5a2c,#d9a362 45%,#b9813f 70%,#7a4c22)`)}"></div>`;
  const leather = 'linear-gradient(180deg,#a8694a 0%,#86492c 18%,#6a3a22 45%,#4e2a18 75%,#2a160c 100%)';
  const armrest = `
    <div style="${B3(`left:-34px;top:${FD - 16}px;width:${PW + 68}px;height:16px;transform:translateZ(8px);background:linear-gradient(180deg,#d9a362,#a8763e)`)}"></div>
    <div style="${B3(`left:-34px;top:${FD}px;width:${PW + 68}px;height:78px;transform:translateZ(46px);background:${leather};border-radius:0 0 30px 30px`)}"></div>
    <div style="${B3(`left:-34px;top:${FD + 78 - 46}px;width:${PW + 68}px;height:46px;transform-origin:50% 100%;transform:rotateX(-90deg);background:linear-gradient(180deg,#3a1f12,#140a05)`)}"></div>
    <div style="${B3(`left:-34px;top:${FD - 46}px;width:${PW + 68}px;height:46px;transform-origin:50% 100%;transform:rotateX(-90deg);background:#1a0e07`)}"></div>`;
  if (FLAT) {
    // flat front view: knob panel, fader panel, oak cheeks, oak rail and leather armrest
    const X = CX + 34, Y = CY;
    rect(CX, CY - BRIDGE - 14, CW, 16, '#000', 'opacity="0.7" filter="url(#soft)"');
    // console meter bridge (HJ-600 style): two staggered rows of VUs, one per channel, stereo pair over the master
    const BY = Y - BRIDGE;
    rect(X, BY, PW, BRIDGE, 'url(#jh600)'); rect(X, BY, PW, BRIDGE, '#000', 'opacity="0.22"');
    rect(X, BY - 8, PW, 10, 'url(#oakH)');
    rect(X + 4, BY + 4, 40, 14, '#0c0c0d', 'rx="2"'); text(X + 24, BY + 15, 'CMI', 10, '#e3e5e8', 'middle', 900, 'font-style="italic" letter-spacing="2"');
    for (let j = 0; j < 16; j++) {
      const cx = X + j * 2 * 85 + 85;
      for (const [row, n] of [[0, 2 * j + 1], [1, 2 * j + 2]]) {
        const my = BY + 8 + row * 55;
        rect(cx - 56, my - 3, 112, 52, '#0d0c0b', 'rx="4"');
        vu(cx - 51, my + 1, 102, 46, Math.min(1, (tapeDb[(n - 1) % 24] ?? -12) + (n > 24 ? -4 : 0)), { label: String(n), fontScale: 0.13 });
      }
    }
    for (let g = 1; g < 4; g++) rect(X + g * 8 * 85 - 1.5, BY, 3, BRIDGE, '#0a0a0b');
    { const mx = X + 32 * 85, mw = PW - 32 * 85; rect(mx, BY, 3, BRIDGE, '#000');
      vu(mx + 50, BY + 10, 156, 100, 0.4, { label: 'L', fontScale: 0.12 }); vu(mx + mw - 206, BY + 10, 156, 100, -0.6, { label: 'R', fontScale: 0.12 }); }
    rect(X, Y - 3, PW, 3, '#000', 'opacity="0.6"');
    p(`<g transform="translate(${X} ${Y})">${upper}</g>`);
    p(`<g transform="translate(${X} ${Y + UD})">${lower.replace(/<rect x="0" y="0" width="${PW}" height="${FD}" fill="url\(#faderBay\)"\/>/, `<rect x="0" y="0" width="${PW}" height="${FD}" fill="url(#faderBay)"/>`)}</g>`);
    rect(X, Y + UD, PW, 2, '#000', 'opacity="0.6"');
    for (const wx of [CX, CX + CW - 34]) { rect(wx, CY - BRIDGE - 8, 34, CH + BRIDGE + 8, 'url(#wood)', 'rx="4"'); rect(wx, CY - BRIDGE - 8, 34, CH + BRIDGE + 8, '#000', 'filter="url(#woodgrain)" opacity="0.8" rx="4"'); }
    const ary = Y + UD + FD;
    rect(X, ary, PW, 10, 'url(#oakH)');
    rect(X, ary + 10, PW, CY + CH - ary - 10, 'url(#armrest)');
    rect(X, ary + 10, PW, CY + CH - ary - 10, '#000', 'filter="url(#vinyl)" opacity="0.35"');
    rect(X, ary + 14, PW, 2, '#fff', 'opacity="0.08"');
    for (let sxx = X + 130; sxx < X + PW - 40; sxx += 150) { rect(sxx, ary + 10, 2, CY + CH - ary - 10, '#000', 'opacity="0.45"'); rect(sxx + 2, ary + 10, 1, CY + CH - ary - 10, '#fff', 'opacity="0.08"'); }
  } else scenes3d.push(`<div style="position:absolute;left:${CX}px;top:${CY}px;width:${CW}px;height:${CH}px;perspective:6500px;perspective-origin:50% -45%;">
    <div style="${B3(`left:34px;top:${YF - FD}px;width:${PW}px;height:${FD}px;transform-origin:50% 100%;transform:rotateX(54deg)`)}">
      ${svgWrap(PW, FD, lower)}
      ${fdCaps.join('')}
      ${cheek(-34, FD, 30)}${cheek(PW + 34, FD, 30)}${cheekTop(-34, FD, 40)}${cheekTop(PW, FD, 40)}
      ${armrest}
      <div style="${B3(`left:0;top:${-UD}px;width:${PW}px;height:${UD}px;transform-origin:50% 100%;transform:rotateX(-34deg)`)}">
        ${svgWrap(PW, UD, upper)}
        ${upKnobs.join('')}
        ${cheek(-34, UD, 30)}${cheek(PW + 34, UD, 30)}${cheekTop(-34, UD, 40)}${cheekTop(PW, UD, 40)}
        <div style="${B3(`left:-34px;top:-30px;width:${PW + 68}px;height:30px;transform-origin:50% 100%;transform:translateZ(0) rotateX(-90deg);background:linear-gradient(180deg,#d9a362,#8a5a2c)`)}"></div>
      </div>
    </div>
  </div>`);
}

// =====================================================================
// OUTBOARD RACK — CSS 3D cabinet, seen from the left; units with 3D knobs
// =====================================================================

// ---------------- house sync generator + synchronizer faces (450 x 56, used in the rack and, magnified, in the pop-ups)
const MONO2 = `'JetBrains Mono', monospace`;
function sgFace(w, h) {
  rect(0, 0, w, h, 'url(#rackBlack)');
  text(24, 22, 'HOLLIS', 13, '#e9e4d6', 'start', 900, 'letter-spacing="2"');
  text(24, 36, 'SG-24', 12, '#e8a33a', 'start', 900); text(24, 47, 'MASTER SYNC', 6.5, '#a9a594', 'start', 800, 'letter-spacing="1"');
  rect(104, 8, 150, 40, '#120905', 'rx="2"'); rect(106, 10, 146, 36, '#1c0d06', 'rx="1.5"');
  p(`<text class="sg-d1" x="112" y="24" font-family="${MONO2}" font-size="10" font-weight="700" fill="#ffb347" filter="url(#glowSm)">48k 30</text>`);
  p(`<text class="sg-d2" x="112" y="40" font-family="${MONO2}" font-size="12" font-weight="700" fill="#ffb347" filter="url(#glowSm)">01:00:00:00</text>`);
  [['REF', 'ref', '#4fe07a'], ['WC', 'wc', '#4fe07a'], ['BB', 'bb', '#ffd23a'], ['TRI', 'tri', '#ffd23a'], ['LTC', 'ltc', '#ff6a3c'], ['MTC', 'mtc', '#ff6a3c'], ['CAP', 'cap', '#59a8ff']].forEach(([l, c, col], i) => {
    const x = 268 + i * 24; circle(x, 18, 3.4, '#1d1512'); p(`<circle class="sg-l-${c}" cx="${x}" cy="18" r="3.4" fill="${col}" opacity="0" filter="url(#glowSm)"/>`);
    text(x, 33, l, 6, '#cfc8b8', 'middle', 800);
  });
  for (let k = 0; k < 4; k++) { circle(268 + k * 24, 45, 4.2, '#0b0b0c'); circle(268 + k * 24, 45, 2.4, '#8d8f94'); }
  text(364, 47, 'WORD · BB · TRI', 5.5, '#77746a', 'start', 700);
}
function dzFace(w, h) {
  // after the Zeta-Three manual: five status LEDs, 20-character display, blue primary / red shifted legends, a SHIFT per half
  rect(0, 0, w, h, '#cfcdc7'); rect(0, 0, w, 2, '#fff', 'opacity="0.5"'); rect(0, h - 2, w, 2, '#000', 'opacity="0.25"');
  [['XREF', 'xref', '#ffb02e'], ['MTC', 'mtc', '#4fe07a'], ['STC', 'stc', '#4fe07a'], ['CHASE', 'chase', '#ffb02e'], ['LOCK', 'lock', '#ff3b2f']].forEach(([l, c, col], i) => {
    const y = 11 + i * 8.4; circle(18, y, 2.2, '#5a5652'); p(`<circle class="dz-l-${c}" cx="18" cy="${y}" r="2.2" fill="${col}" opacity="0" filter="url(#glowSm)"/>`); text(23, y + 1.7, l, 4.4, '#3a3632', 'start', 800);
  });
  const BLUE = '#1d4f9a', RED = '#c4231a';
  // key: id for the pop-up (data-dzk), shifted legend (red, top), primary legend (blue, under it), optional LED on the cap
  const key = (x, ww, col, sh, pr, id, led) => {
    const y = 28, hh = 15;
    p(`<g class="dzk" data-dzk="${id}" style="cursor:pointer">`);
    rect(x + 0.6, y + 1.2, ww, hh, '#000', 'opacity="0.35" rx="1.5"'); rect(x, y, ww, hh, col, 'rx="1.5"'); rect(x, y, ww, hh * 0.35, '#fff', 'opacity="0.2" rx="1.5"');
    if (led) { circle(x + ww / 2, y + 4, 1.5, '#4a2a22'); p(`<circle class="${led}" cx="${x + ww / 2}" cy="${y + 4}" r="1.5" fill="#ffd23a" opacity="0" filter="url(#glowSm)"/>`); }
    if (sh) text(x + ww / 2, y - 6.6, sh, 3.4, RED, 'middle', 900);
    if (pr) text(x + ww / 2, y - 2, pr, 3.4, BLUE, 'middle', 900);
    p(`<rect x="${x - 1}" y="${y - 11}" width="${ww + 2}" height="${hh + 12}" fill="transparent"/></g>`);
  };
  const group = (x0, x1, l) => { text((x0 + x1) / 2, 9, l, 4.2, '#2a2622', 'middle', 900, 'letter-spacing="0.6"'); rect(x0, 10.6, x1 - x0, 0.7, '#2a2622'); };
  group(42, 88, 'ENABLE');
  key(42, 13, '#9a9a96', 'M-REC', 'MASTER', 'master', 'dz-k-master'); key(58.5, 13, '#9a9a96', 'S-REC', 'SLAVE', 'slave', 'dz-k-slave'); key(75, 13, '#9a9a96', 'LEARN', 'MIDI', 'midi', 'dz-k-midi');
  key(91.5, 12, '#e0392c', '', 'SHIFT', 'shiftL', 'dz-k-shl');
  group(106, 118, 'GEN'); key(106, 12, '#9a9a96', 'COPY', 'RUN', 'run', 'dz-k-run');
  group(121, 137, 'SYSTEM'); key(122, 15, '#9a9a96', 'GOTO', 'STOP·CONT', 'stop', 'dz-k-hold');
  // the display: 20 red characters over the field legends
  text(226, 9, 'ADDISON•SMYTH  DELTA-THREE', 5.6, '#1e3c74', 'middle', 900, 'letter-spacing="0.4"');
  rect(144, 14, 164, 18, '#1a0503', 'rx="1"'); rect(145, 15, 162, 16, '#2a0806', 'rx="1"');
  p(`<text class="dz-disp" x="148" y="26.4" font-family="${MONO2}" font-size="9.4" font-weight="700" fill="#ff3a24" filter="url(#glowSm)" letter-spacing="0.42" xml:space="preserve">M_TC  01:00:00:00   </text>`);
  ['IDENT', 'BPM', 'HOURS', 'MINUTES', 'SECONDS/BAR', 'FRAMES/BEAT'].forEach((l, i) => text(155 + i * 28.4, 37, l, 3.1, '#3a3632', 'middle', 800));
  text(226, 49, 'AUDIO · VIDEO · MIDI SYNCHRONIZER / CONTROLLER', 3.7, '#3a3632', 'middle', 800, 'letter-spacing="0.3"');
  group(314, 344, 'DISPLAY'); key(314, 14, '#2f7fd0', 'GROUP', 'SELECT', 'select'); key(331, 13, '#9a9a96', '', 'INDEX', 'index', 'dz-k-tight');
  key(349, 12, '#e0392c', '', 'SHIFT', 'shiftR', 'dz-k-shr');
  group(365, 389, 'CURSOR'); key(365, 11, '#9a9a96', '', '◀', 'left'); key(378, 11, '#9a9a96', '', '▶', 'right');
  key(393, 14, '#2f7fd0', 'MENU', 'PREV', 'prev'); key(410, 15, '#9a9a96', 'CAPTURE', 'CLEAR', 'clear');
  for (const [sx, sy] of [[7, 8], [7, 48], [w - 7, 8], [w - 7, 48]]) circle(sx, sy, 2.4, '#8a8780');
}
const RX = 3290, RY = 60, RW = 550, RH = 2100;
{
  const U = 60, UX = 50, UW = RW - 100, DEPTH = 70;
  const units = [];      // { y, h, html }
  let uy = 70;
  const rackKnobs = [];
  const RK = (x, y, r, cap, ang, o = {}) => rackKnobs.push(knob3d(x, y, r, cap, ang, o));
  const LW = '#e6e2d8';
  function unit(n, fill, draw) {
    const h = n * U - 4, y0 = uy, kStart = rackKnobs.length;
    const face = capture(() => {
      rect(0, 0, UW, h, fill, 'rx="2"');
      rect(0, 0, UW, 2, '#fff', 'opacity="0.14"'); rect(0, h - 2, UW, 2, '#000', 'opacity="0.55"');
      for (const ex of [14, UW - 14]) { screw(ex, 15, 5); if (n > 1) screw(ex, h - 15, 5); }
      draw(UW, h);
    });
    const kn = rackKnobs.splice(kStart).join('');
    units.push(`<div style="${B3(`left:${UX}px;top:${y0}px;width:${UW}px;height:${h}px;transform:translateZ(2px);box-shadow:0 8px 14px rgba(0,0,0,0.6)`)}">${svgWrap(UW, h, face)}${kn}</div>`);
    uy += n * U;
  }
  // Leximan 224 (3U)
  unit(3, 'url(#rack224)', (w, h) => {
    text(26, 42, 'leximan', 30, '#efe9da', 'start', 900, 'letter-spacing="-0.5"');
    text(26, 64, '224 DIGITAL REVERB', 14, '#d6cfbe', 'start', 800, 'letter-spacing="1"');
    rect(26, 80, 150, 56, '#000', 'rx="3"'); rect(30, 84, 142, 48, 'url(#displayBg)', 'rx="2"');
    seg7(38, 92, 30, '4.1', '#ff3220'); seg7(104, 92, 30, '2.4', '#ff3220');
    text(60, 158, 'PROG', 14, '#d6cfbe', 'middle', 800); text(140, 158, 'RT60', 14, '#d6cfbe', 'middle', 800);
    ['BASS', 'MID', 'XOVR', 'HF', 'DPTH'].forEach((s2, i) => {
      const fx = 206 + i * 36;
      rect(fx - 2.5, 24, 5, 104, '#0b0b0b', 'rx="2.5"');
      const cy = 34 + (0.2 + rnd() * 0.6) * 84;
      rect(fx - 11, cy - 8, 22, 16, 'url(#faderCapBlack)', 'rx="2"'); rect(fx - 9, cy - 1, 18, 2, '#e8e0cc');
      text(fx, 156, s2, 14, '#d6cfbe', 'middle', 800);
    });
    for (let b = 0; b < 4; b++) button(w - 86 + (b % 2) * 32, 30 + Math.floor(b / 2) * 30, 26, 22, 'red', b === 0, String(b + 1), { size: 14 });
    text(w - 57, 110, 'BANK', 14, '#d6cfbe', 'middle', 800);
    text(w - 57, 156, 'AUX 1', 14, '#e8c34a', 'middle', 800);
  });
  // Unified Audio 1176LN x2 (2U)
  for (let k = 0; k < 2; k++) unit(2, 'url(#rackBlack)', (w, h) => {
    text(26, 30, 'UNIFIED AUDIO', 14, '#cfcfcf', 'start', 800);
    text(26, 64, '1176LN', 28, '#f2f2f2', 'start', 800);
    text(26, 88, k ? 'INS · VOX' : 'INS · BASS', 14, '#e8c34a', 'start', 800);
    for (const [kx, lab, a] of [[184, 'IN', k ? 10 : 40], [246, 'OUT', -10]]) {
      ticks(kx, 48, 24, '#cfcfcf');
      RK(kx, 48, 24, 'radial-gradient(circle, #1a1a1a, #050505)', a, { dark: true, h: 16 });
      text(kx, 104, lab, 14, '#cfcfcf', 'middle', 800);
    }
    RK(298, 34, 10, '#cfd2d6', 60, { h: 9 }); text(314, 39, 'ATK', 14, '#cfcfcf', 'start', 800);
    RK(298, 76, 10, '#cfd2d6', -40, { h: 9 }); text(314, 81, 'REL', 14, '#cfcfcf', 'start', 800);
    vu(w - 98, 10, 76, 52, k ? -6 : -3.5, { fontScale: 0.14 });
    ['20', '12', '8', '4'].forEach((r, i) => button(w - 100 + i * 20, 70, 18, 20, 'white', i === 3 - k, r, { size: 12 }));
  });
  // Yahaha SPX90 x2 (1U)
  for (let k = 0; k < 2; k++) unit(1, 'url(#rackSpx)', (w, h) => {
    text(26, 26, 'YAHAHA', 16, '#f0f0f0', 'start', 900, 'letter-spacing="1"');
    text(26, 46, 'SPX90', 14, '#d0d0d0', 'start', 800);
    RK(130, 22, 10, '#202124', -30, { dark: true }); text(130, 52, 'IN', 14, '#d0d0d0', 'middle', 800);
    rect(156, 8, 46, 40, '#000', 'rx="2"'); seg7(162, 14, 26, k ? '12' : '03', '#ff3220');
    rect(210, 8, 168, 40, 'url(#lcd)', 'rx="2"');
    text(218, 25, k ? 'PITCH CHANGE A' : 'REV 1 HALL', 14, '#1f2a10', 'start', 700, `font-family="'JetBrains Mono', monospace"`);
    text(218, 42, k ? 'L -8  R +8' : 'RT = 2.6 s', 14, '#1f2a10', 'start', 700, `font-family="'JetBrains Mono', monospace"`);
    RK(w - 48, 22, 10, '#202124', 10, { dark: true }); text(w - 48, 52, 'OUT', 14, '#d0d0d0', 'middle', 800);
  });
  // Leximan PCM41 x2 (1U)
  for (let k = 0; k < 2; k++) unit(1, 'url(#rackBlack)', (w, h) => {
    text(26, 26, 'leximan', 18, '#f0f0f0', 'start', 900);
    text(26, 46, 'PCM 41', 14, '#cfcfcf', 'start', 800);
    ['IN', 'RNG', 'DLY', 'DEP', 'SWP', 'FB', 'MIX', 'OUT'].forEach((l, i) => {
      const kx = 128 + i * 38;
      RK(kx, 20, 9, i === 2 ? '#c83a2c' : '#d8d8d8', -100 + rnd() * 200, { dark: i !== 2, h: 8 });
      text(kx, 52, l, 14, '#cfcfcf', 'middle', 800);
    });
  });
  // Leximan PCM42 x2 (1U)
  for (let k = 0; k < 2; k++) unit(1, 'url(#rackBlack)', (w, h) => {
    text(26, 26, 'leximan', 18, '#f0f0f0', 'start', 900);
    text(26, 46, 'PCM 42', 14, '#cfcfcf', 'start', 800);
    rect(112, 8, 72, 40, '#000', 'rx="2"'); seg7(118, 14, 26, k ? '375' : '250', '#ff3220', { gap: 0.22 });
    text(190, 34, 'ms', 14, '#cfcfcf', 'start', 700);
    ['IN', 'MAN', 'VCO', 'FB', 'MIX', 'OUT'].forEach((l, i) => {
      const kx = 232 + i * 35;
      RK(kx, 20, 9, i === 1 ? '#c83a2c' : '#d8d8d8', -100 + rnd() * 200, { dark: i !== 1, h: 8 });
      text(kx, 52, l, 14, '#cfcfcf', 'middle', 800);
    });
  });
  // Rowan SBX-80 sync box (1U): two-tone grey, orange legends, green VFD readouts that follow the sync engine
  globalThis.RACK_SBX_Y = RY + uy;
  unit(1, '#ebe8de', (w, h) => {
    rect(0, 0, 10, h, '#8c8768'); rect(w - 10, 0, 10, h, '#8c8768');
    rect(128, 4, 230, h - 8, '#556986', 'rx="3"');
    rect(20, 9, 13, 10, 'none', 'stroke="#d23b2c" stroke-width="2" rx="2"');
    text(37, 19, 'Rowan', 13, '#d23b2c', 'start', 800);
    text(20, 44, 'SBX-80', 22, '#3f5477', 'start', 900, 'font-style="italic"');
    rect(136, 9, 214, 30, '#061412', 'rx="2"');
    p(`<text id="rk-sbx-l" x="144" y="31" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="700" fill="#7dffd6" filter="url(#glowSm)">01 001 1</text>`);
    p(`<text id="rk-sbx-r" x="342" y="31" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="700" fill="#7dffd6" text-anchor="end" filter="url(#glowSm)">96.0</text>`);
    text(243, 50, 'SONG · MEASURE · BEAT · TEMPO', 8, '#eef1f5', 'middle', 800, 'letter-spacing="1"');
    [['LOCK', 'rk-sbx-lock', '#4fe07a'], ['BEAT', 'rk-sbx-beat', '#ff6a3c']].forEach(([l, id, c], k) => { circle(378 + k * 30, 18, 4, '#2a1c1a'); p(`<circle id="${id}" cx="${378 + k * 30}" cy="18" r="4" fill="${c}" opacity="0" filter="url(#glowSm)"/>`); text(378 + k * 30, 34, l, 8, '#3f5477', 'middle', 800); });
    text(w - 20, 50, 'SYNC BOX', 10, '#3f5477', 'end', 900, 'font-style="italic" letter-spacing="1"');
  });
  globalThis.RACK_SG_Y = RY + uy; unit(1, '#000', (w, h) => sgFace(w, h));
  globalThis.RACK_DZ_Y = RY + uy; unit(1, '#000', (w, h) => dzFace(w, h));
  const slotsY = uy + 8; uy += 34;
  unit(1, '#1a1b1e', (w, h) => {
    rect(30, 6, w - 60, h - 12, '#26292e', 'rx="3"');
    text(44, 35, 'VST3', 14, '#7fb0ff', 'start', 800);
    text(96, 35, 'Plate Reverb', 16, '#e8e4d8', 'start', 600);
    text(w - 44, 35, 'AUX 2 ▸', 14, '#e8c34a', 'end', 800);
  });
  for (let k = 0; k < 1; k++) unit(1, '#121315', (w, h) => {
    rect(30, 6, w - 60, h - 12, 'none', 'rx="3" stroke="#5a5c60" stroke-width="1.5" stroke-dasharray="6 5"');
    text(w / 2, 35, '+ drop a VST3 / AU plugin', 14, '#8a877c', 'middle', 700);
  });
  uy += 10;
  const pbY = uy; globalThis.RACK_PB_Y = RY + pbY;
  unit(2, 'url(#rackBlack)', (w, h) => {
    text(w / 2, 22, 'PATCHBAY · INSERTS', 14, '#cfcfcf', 'middle', 800, 'letter-spacing="2"');
    for (let row = 0; row < 2; row++) {
      for (let j = 0; j < 24; j++) {
        const jx = 34 + j * 16.5, jy = 46 + row * 40;
        circle(jx, jy, 5.6, '#5d6066'); circle(jx, jy, 3.4, '#050505');
      }
      text(18, 50 + row * 40, row ? 'R' : 'S', 14, '#e8c34a', 'middle', 800);
    }
  });
  // patch cables in front of the patchbay
  const cab = (x1, y1, x2, y2, sag, col) => `<path d="M${x1} ${y1} C${x1} ${y1 + sag} ${x2} ${y2 + sag} ${x2} ${y2}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="8" transform="translate(3 7)"/><path d="M${x1} ${y1} C${x1} ${y1 + sag} ${x2} ${y2 + sag} ${x2} ${y2}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round"/><path d="M${x1} ${y1} C${x1} ${y1 + sag} ${x2} ${y2 + sag} ${x2} ${y2}" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="2" transform="translate(-1 -1)"/><circle cx="${x1}" cy="${y1}" r="7" fill="#c9ccd0"/><circle cx="${x2}" cy="${y2}" r="7" fill="#c9ccd0"/>`;
  const jx = (j) => UX + 34 + j * 16.5;
  const cables = `<svg width="${RW}" height="${RH}" style="position:absolute;left:0;top:0;overflow:visible">${cab(jx(12), pbY + 46, jx(0), pbY + 86, 80, '#c0392b')}${cab(jx(19), pbY + 46, jx(1), pbY + 86, 100, '#2f6fb3')}${cab(jx(6), pbY + 46, jx(20), pbY + 86, 70, '#e8c34a')}</svg>`;
  // plugin browser drawer
  uy += 24;
  const by0 = uy, bh = RH - 30 - uy - 92, bw = UW;
  globalThis.RACK_FILES = { x: RX + UX, y: RY + by0 + bh + 14, w: bw };
  const browser = capture(() => {
    rect(0, 0, bw, bh, '#141517', 'rx="6"'); rect(0, 0, bw, bh, 'none', 'rx="6" stroke="#2c2e32" stroke-width="1.5"');
    text(20, 38, 'PLUGINS', 18, '#e9e3d0', 'start', 800, 'letter-spacing="3"');
    button(bw - 112, 16, 92, 32, 'amber', false, 'SCAN', { size: 14 });
    rect(20, 62, bw - 40, 38, '#0b0b0c', 'rx="4"'); text(34, 87, 'Search plugins…', 15, '#77746a', 'start', 500);
    text(20, 132, 'BUILT-IN VINTAGE', 14, '#d9d3c7', 'start', 800, 'letter-spacing="2"');
    ['224 Digital Reverb', '1176LN Peak Limiter', 'SPX90 Multi-Effect', 'PCM41 Digital Delay', 'PCM42 Digital Delay'].forEach((b, i) => {
      const ry = 146 + i * 44;
      rect(20, ry, bw - 40, 38, i % 2 ? '#17181b' : '#1c1d20', 'rx="3"');
      text(34, ry + 25, b, 15, '#e8e4d8', 'start', 600);
      text(bw - 34, ry + 25, i === 0 ? '1 in rack' : '2 in rack', 14, '#a9a594', 'end', 600);
    });
    const tp = 390;
    text(20, tp, 'THIRD-PARTY · 14 FOUND', 14, '#d9d3c7', 'start', 800, 'letter-spacing="2"');
    [['Plate Reverb', 'VST3'], ['Tape Echo', 'AU'], ['Bus Compressor', 'VST3'], ['Vintage EQ', 'AU'], ['Spring Reverb', 'VST3'], ['De-Esser', 'VST3'], ['Chorus Ensemble', 'AU'], ['Room Reverb', 'VST3'], ['Opto Leveler', 'AU'], ['Saturator', 'VST3']].forEach(([n, f], i) => {
      const ry = tp + 14 + i * 44;
      if (ry + 38 > bh - 60) return;
      rect(20, ry, bw - 40, 38, i % 2 ? '#17181b' : '#1c1d20', 'rx="3"');
      rect(30, ry + 9, 46, 20, f === 'VST3' ? '#1c2a44' : '#2a1c3a', 'rx="2"');
      text(53, ry + 24, f, 14, f === 'VST3' ? '#7fb0ff' : '#c49bff', 'middle', 800);
      text(88, ry + 25, n, 15, '#e8e4d8', 'start', 600);
      text(bw - 34, ry + 25, '⠿ drag', 14, '#77746a', 'end', 600);
    });
    text(bw / 2, bh - 24, 'Scan · list · drag into a rack slot', 14, '#77746a', 'middle', 600);
  });
  const header = `<div style="position:absolute;left:0;top:14px;width:${RW}px;text-align:center;font:800 18px ${SANS};letter-spacing:4px;color:#e9e3d0">OUTBOARD RACK</div><div style="position:absolute;left:0;top:40px;width:${RW}px;text-align:center;font:600 14px ${SANS};color:#bdb8aa">drag a unit to an insert or aux send</div>`;
  // cabinet: back panel, side walls (wood), rails with holes
  const rails = capture(() => {
    for (const rx of [26, RW - 48]) {
      rect(rx, 0, 22, RH, 'url(#rail)');
      for (let yy = 10; yy < RH; yy += 15.2) rect(rx + 8, yy, 7, 5, '#151515', 'rx="1"');
    }
  });
  const woodV = 'linear-gradient(90deg,#6e4420,#b37a3e 40%,#8a5a2c 70%,#4a2c14)';
  scenes3d.push(`<div style="position:absolute;left:${RX}px;top:${RY}px;width:${RW}px;height:${RH}px;perspective:2200px;perspective-origin:-60% 40%;">
    <div style="${B3(`left:0;top:0;width:${RW}px;height:${RH}px`)}">
      <div style="${B3(`left:0;top:0;width:${RW}px;height:${RH}px;transform:translateZ(-${DEPTH}px);background:#0b0a09`)}"></div>
      <div style="${B3(`left:26px;top:0;width:${DEPTH}px;height:${RH}px;transform-origin:0 50%;transform:rotateY(90deg);background:linear-gradient(90deg,#3a2414,#1a0f08)`)}"></div>
      <div style="${B3(`left:${RW - 26}px;top:0;width:${DEPTH}px;height:${RH}px;transform-origin:0 50%;transform:rotateY(90deg);background:linear-gradient(90deg,#2a190c,#120a05)`)}"></div>
      <div style="${B3(`left:0;top:0;width:${RW}px;height:${RH}px;transform:translateZ(-4px)`)}">${svgWrap(RW, RH, rails)}</div>
      <div style="${B3(`left:0;top:0;width:26px;height:${RH}px;transform:translateZ(8px);background:${woodV}`)}"></div>
      <div style="${B3(`left:${RW - 26}px;top:0;width:26px;height:${RH}px;transform:translateZ(8px);background:${woodV}`)}"></div>
      <div style="${B3(`left:0;top:0;width:8px;height:${RH}px;transform-origin:0 50%;transform:translateZ(8px) rotateY(90deg);background:#4a2c14`)}"></div>
      ${header}
      ${units.join('\n')}
      <div style="${B3(`left:0;top:${slotsY}px;width:${RW}px;transform:translateZ(2px);text-align:center;font:800 14px ${SANS};letter-spacing:3px;color:#d9d3c7`)}">PLUGIN SLOTS</div>
      <div style="${B3(`left:0;top:0;width:${RW}px;height:${RH}px;transform:translateZ(12px)`)}">${cables}</div>
      <div style="${B3(`left:${UX}px;top:${by0}px;width:${bw}px;height:${bh}px;transform:translateZ(2px)`)}">${svgWrap(bw, bh, browser)}</div>
    </div>
  </div>`);
}

// rack edge shadow over console + room lighting
rect(RX - 30, RY, 30, RH, 'url(#sheen)', 'opacity="0"');
p(`<rect x="${RX - 24}" y="${RY}" width="24" height="${RH}" fill="#000" opacity="0.5" filter="url(#soft)"/>`);
// global grain
rect(0, 0, W, H, '#808080', 'filter="url(#grain)"');
// vignette
p(`<radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>`);
rect(0, 0, W, H, 'url(#vig)');

p(`</svg>`);

// =====================================================================
// POP-UP VIEWS (opened by clicking the tape machine, the tape meter bridge, the 224 or the patchbay)
// =====================================================================
const OVH = 2104;   // view height below the 56 px title bar
const meterView = capture(() => {
  rect(0, 0, W, OVH, 'url(#deck)'); rect(0, 0, W, OVH, '#000', 'opacity="0.45"'); rect(0, 0, W, OVH, '#000', 'filter="url(#brushed)" opacity="0.06"');
  for (let i = 0; i < 24; i++) {
    const c = i % 8, r = Math.floor(i / 8), x = c * 480, y = 24 + r * 690, on = readyTracks.has(i);
    rect(x + 10, y, 460, 660, '#2c2926', 'rx="10"'); rect(x + 10, y, 460, 660, 'url(#bezelHi)', 'rx="10" opacity="0.5"');
    circle(x + 430, y + 30, 11, on ? '#ff3b2f' : '#4a1612', on ? 'filter="url(#glow)"' : '');
    circle(x + 396, y + 30, 11, i === 23 ? '#5fb4ff' : '#16304a', i === 23 ? 'filter="url(#glow)"' : '');
    rect(x + 24, y + 54, 432, 330, '#0a0908', 'rx="10"'); rect(x + 24, y + 54, 432, 330, 'url(#bezelHi)', 'rx="10"');
    vu(x + 42, y + 70, 396, 296, tapeDb[i], { needleId: i, brand: 'CMI' });
    text(x + 30, y + 452, String(i + 1).padStart(2, '0'), 46, '#ece7dc', 'start', 800);
    rect(x + 112, y + 410, 344, 58, 'url(#tapeMask)', `rx="2" transform="rotate(${(((i * 37) % 7) - 3) * 0.25} ${x + 284} ${y + 439})"`);
    text(x + 284, y + 452, tapeNames[i], 34, '#1c2a6e', 'middle', 700, `font-family="${MARKER}"`);
    button(x + 30, y + 500, 200, 72, 'red', on, 'READY', { size: 26 });
    button(x + 250, y + 500, 200, 72, 'white', !on, 'SAFE', { size: 26 });
    text(x + 240, y + 626, on ? 'RECORD READY · MONITORING INPUT' : 'SAFE · MONITORING REPRO', 20, on ? '#ff8a7a' : '#b8b1a5', 'middle', 800, 'letter-spacing="1.5"');
  }
});
const lexView = capture(() => {
  rect(0, 0, W, OVH, 'url(#wall)'); for (let x = 0; x < W; x += 96) { rect(x, 0, 94, OVH, 'url(#woodH)', 'opacity="0.3"'); rect(x + 94, 0, 2, OVH, '#000', 'opacity="0.6"'); }
  rect(0, 0, W, OVH, '#000', 'opacity="0.35"');
  // 224X mainframe (4U, 19"): black chassis with the blue name band
  const fx = 1900, fy = 640, fw = 1760, fh = Math.round(1760 * 7 / 19);
  rect(fx + 20, fy + 40, fw, fh, '#000', 'opacity="0.6" filter="url(#soft)"');
  rect(fx, fy, fw, fh, '#161718', 'rx="6"'); rect(fx, fy, fw, 6, '#fff', 'opacity="0.1"');
  for (let k = 0; k < 6; k++) rect(fx + 380 + k * 70, fy + 40, 40, 14, '#0b0b0c', 'rx="3"');
  for (let k = 0; k < 6; k++) rect(fx + fw - 760 + k * 70, fy + 40, 40, 14, '#0b0b0c', 'rx="3"');
  for (const [sx, sy] of [[fx + 40, fy + 50], [fx + fw - 40, fy + 50], [fx + 40, fy + fh - 50], [fx + fw - 40, fy + fh - 50], [fx + fw / 2, fy + 34], [fx + fw / 2, fy + fh - 34]]) screw(sx, sy, 12);
  rect(fx + 220, fy + fh * 0.4, fw - 440, fh * 0.17, '#2f6db3');
  rect(fx + 260, fy + fh * 0.4 + 20, 220, fh * 0.17 - 40, 'none', 'stroke="#f2f4f8" stroke-width="4"');
  text(fx + 370, fy + fh * 0.4 + fh * 0.17 / 2 + 22, 'leximan', 60, '#f2f4f8', 'middle', 900);
  text(fx + fw - 260, fy + fh * 0.4 + fh * 0.17 / 2 + 22, 'Digital Reverberator', 56, '#f2f4f8', 'end', 700, 'font-style="italic"');
  text(fx + fw - 860, fy + fh * 0.4 + fh * 0.17 / 2 + 22, '224X', 64, '#f2f4f8', 'end', 900);
  circle(fx + 280, fy + fh * 0.78, 9, '#ff3b2f', 'filter="url(#glow)"'); text(fx + 280, fy + fh * 0.78 + 40, 'POWER', 18, '#cfcfcf', 'middle', 800);
  circle(fx + 380, fy + fh * 0.78, 9, '#4a1612'); text(fx + 380, fy + fh * 0.78 + 40, 'OVL', 18, '#cfcfcf', 'middle', 800);
  rect(fx + 460, fy + fh * 0.78 - 12, 26, 24, '#2a2b2e', 'rx="3"'); text(fx + 473, fy + fh * 0.78 + 40, 'RESET', 18, '#cfcfcf', 'middle', 800);
  text(fx + fw - 640, fy + fh * 0.7, 'INPUT LEVEL', 18, '#cfcfcf', 'middle', 800); text(fx + fw - 440, fy + fh * 0.7, 'LEFT', 18, '#cfcfcf', 'middle', 800); text(fx + fw - 300, fy + fh * 0.7, 'RIGHT', 18, '#cfcfcf', 'middle', 800);
  for (let k = 0; k < 4; k++) circle(fx + fw - 680 + k * 120, fy + fh * 0.8, 10, k % 2 ? '#2a2b2e' : '#ff3b2f', k % 2 ? '' : 'filter="url(#glow)"');
  // DB25 cable from the remote to the mainframe
  const d = `M${1500} ${520} C${1650} ${420} ${1780} ${700} ${fx} ${fy + fh * 0.62}`;
  p(`<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="26" transform="translate(6 14)"/><path d="${d}" fill="none" stroke="#c4c7cb" stroke-width="22"/><path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="5" transform="translate(-3 -4)"/>`);
  rect(fx - 40, fy + fh * 0.62 - 34, 54, 68, '#d6d9dc', 'rx="6"');
  // the remote, full size and working
  rect(500 + 30, 210 + 40, 1024, 1600, '#000', 'opacity="0.55" filter="url(#soft)"');
  remote224(500, 210, 1.6, { liveDisplay: true });
  text(1012, 1900, 'Drag a slider to change it · press a lower key to show its value · press a program key to load a program', 26, '#d9d3c7', 'middle', 600);
});
const alView = capture(() => {
  rect(0, 0, W, OVH, 'url(#wall)'); for (let x = 0; x < W; x += 96) { rect(x, 0, 94, OVH, 'url(#woodH)', 'opacity="0.3"'); rect(x + 94, 0, 2, OVH, '#000', 'opacity="0.6"'); }
  rect(0, 0, W, OVH, '#000', 'opacity="0.4"');
  const K = 4.6, ox = 900, oy = 150;
  rect(ox + 40, oy + 60, AL_W * K, AL_H * K, '#000', 'opacity="0.6" filter="url(#soft)"');
  p(`<g transform="translate(${ox} ${oy}) scale(${K})">`); al3(true); p('</g>');
  // locate memory card
  const mx = 2900, my = 300;
  rect(mx, my, 640, 900, '#efe9da', 'rx="8"'); rect(mx, my, 640, 90, '#2f2b28', 'rx="8"'); rect(mx, my + 80, 640, 10, '#2f2b28');
  text(mx + 320, my + 58, 'LOCATE MEMORIES', 34, '#efe9da', 'middle', 800, 'letter-spacing="3"');
  p(`<g id="al-mem" font-family="'JetBrains Mono', monospace"></g>`);
  text(ox + AL_W * K / 2, oy + AL_H * K + 120, 'Type a time on the keypad (MMSS) · LOC locates · STO then 0–9 stores the tape position · RCL then 0–9 recalls it · arm tracks with the black keys, then PLAY + RECORD', 28, '#d9d3c7', 'middle', 600);
  text(ox + AL_W * K / 2, oy + AL_H * K + 170, 'Keyboard: Space play/stop · , rewind · . fast forward · Z return to zero · R record · digits + L locate', 26, '#a9a293', 'middle', 600);
});
const sbxView = require('./sbx.js')({ p, rect, text, circle, capture }, { W, OVH });
const SBX_BOX = globalThis.SBX_BOX;   // the front panel's box: the pop-up shows just the machine
const svg = out.join('\n');
const dir = path.join(__dirname, '..');
fs.writeFileSync(path.join(dir, 'analog-studio-mockup.svg'), svg);
const jh24 = require('./jh24.js')({ TX: TX - TCI, TY, TW, TH });
const TAPE_LIST = (() => { const src = fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'electronics', 'jh24audio.js'), 'utf8'); const m = /export const TAPES = (\{[\s\S]*?\n\});/.exec(src); return Function(`return ${m[1]}`)(); })();
if (globalThis.JH_CI !== TCI) throw new Error(`cabinet inset is ${globalThis.JH_CI}, expected ${TCI}`);
// copy the live reel prototype next to the mockup so the tape machine view can load it
const protoSrc = path.join(__dirname, '..', '..', 'prototype', 'reels', 'dist', 'jh24-reels-local.html');
if (fs.existsSync(protoSrc)) fs.copyFileSync(protoSrc, path.join(__dirname, '..', 'tape-machine.html'));
const a827 = require('./jh24.js')({ TX: 24 - TCI, TY: 20, TW, TH, skin: 'a827' });

// ---------------- tape machine pop-up: the studio-view deck itself, magnified, with working panel keys ----------------
// The same CSS-3D drawing as the studio (jh24.js) under its own ids (jhp- / a8p-), so the page script drives its reels,
// packs and blur exactly like the studio's. Panel key positions are the studio-view ones (stage coordinates).
const tapeView = (() => {
  const clone = (html, rootFrom, rootTo, pre, from) => {
    let h = html.replace(`<div id="${rootFrom}"`, `<div id="${rootTo}"`).split(`${from}-`).join(`${pre}-`);
    const ids = new Set([...h.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]).filter((id) => !id.startsWith(pre) && id !== rootTo));
    for (const id of ids) h = h.split(`id="${id}"`).join(`id="${pre}-${id}"`).split(`url(#${id})`).join(`url(#${pre}-${id})`);
    return h;
  };
  const K = 3840 / 1296, OY = Math.round((OVH - 590 * K) / 2);
  const view = (skin, html, y0, keys) => `<div class="tpv" data-skin="${skin}" hidden>
    <div style="position:absolute;left:0;top:0;transform-origin:0 0;transform:translate(0px,${OY}px) scale(${K.toFixed(4)}) translate(-24px,${-y0}px)">${html}</div>
    ${keys.map(([n, x, y, w, h, t]) => `<button type="button" class="tpk" data-tk="${n}" title="${t}" style="left:${((x - w / 2 - 24) * K).toFixed(0)}px;top:${((y - h / 2 - y0) * K + OY).toFixed(0)}px;width:${(w * K).toFixed(0)}px;height:${(h * K).toFixed(0)}px"></button>`).join('')}
  </div>`;
  const hjKeys = [['rew', 405, 578, 40, 30, 'REWIND (,)'], ['ff', 455, 578, 40, 30, 'FAST FORWARD (.)'], ['stop', 505, 578, 40, 30, 'STOP (space)'], ['rplay', 554, 578, 40, 30, 'REVERSE PLAY'], ['play', 604, 578, 40, 30, 'PLAY (space)'], ['record', 664, 575, 46, 32, 'RECORD (R): the record-ready tracks'],
    ['lift', 836, 560, 38, 28, 'LIFT: tape lifters defeated (hear the tape while winding)'], ['edit', 880, 560, 38, 28, 'EDIT'], ['s7.5', 928, 560, 32, 24, '7½ ips'], ['s15', 960, 560, 32, 24, '15 ips'], ['s30', 992, 560, 32, 24, '30 ips'], ['elec', 1213, 560, 42, 26, 'ELECTRONICS: the channel cards']];
  const a8Keys = [['rew', 128, 541, 50, 30, 'REWIND (,)'], ['ff', 181, 541, 50, 30, 'FAST FORWARD (.)'], ['play', 235, 541, 50, 30, 'PLAY (space)'], ['stop', 290, 541, 50, 30, 'STOP (space)'], ['record', 343, 541, 50, 30, 'RECORD (R): the record-ready tracks'], ['edit', 397, 541, 50, 30, 'EDIT'],
    ['s7.5', 686, 507, 32, 14, '7½ ips'], ['s15', 726, 507, 32, 14, '15 ips'], ['s30', 765, 507, 32, 14, '30 ips'], ['vari', 803, 507, 32, 14, 'VARI-SPEED on / off'], ['lift', 840, 507, 32, 14, 'LIFT: lifters defeated'], ['elec', 918, 507, 34, 14, 'ELECTRONICS: the channel cards'],
    ['loc', 686, 535, 32, 14, 'LOC: locate to the locate position'], ['sto', 726, 535, 32, 14, 'STORE: then a memory number on the autolocator'], ['rsttape', 765, 535, 32, 14, 'ZERO: tape position zeroed here'], ['rtz', 803, 535, 32, 14, 'RTZ: return to zero (Z)'], ['auto', 840, 535, 32, 14, 'AUTO monitoring'], ['safe', 878, 535, 32, 14, 'SAFE: all tracks out of record ready'], ['mon', 918, 535, 32, 14, 'MON: monitor TAPE / INPUT / AUTO']];
  return `<div id="tapeview">${view('cmi', clone(jh24, 'jh24', 'jh24p', 'jhp', 'jh'), 76, hjKeys)}${view('sls', clone(a827, 'a827', 'a827p', 'a8p', 'a8'), 20, a8Keys)}</div>`;
})();

// A827 meter bridge: Studer-grey housing, 24 VU meters in two rows with track ready / safe lamps
// A827 meter bridge as photographed: charcoal housing with wood cheeks, 24 amber-lit meters in three rows of 8,
// "- n -" track legends, STAUDER logo bottom right
const a827Bridge = capture(() => {
  const BX = 1788, BW = 1478, BH = 590;
  p(`<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}" style="position:absolute;left:${BX}px;top:20px">`);
  p(`<defs><linearGradient id="a8amb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.55" stop-color="#f6a63c"/><stop offset="1" stop-color="#d9811e"/></linearGradient></defs>`);
  rect(0, 0, BW, BH, '#6d4122', 'rx="8"'); rect(0, 0, 22, BH, 'url(#woodH)', 'rx="6"'); rect(BW - 22, 0, 22, BH, 'url(#woodH)', 'rx="6"');
  rect(22, 0, BW - 44, BH, '#1e1f22'); rect(22, 0, BW - 44, 3, '#fff', 'opacity="0.1"');
  const mw = (BW - 44 - 60) / 8, mh = 124;
  for (let i = 0; i < 24; i++) {
    const c = i % 8, r = Math.floor(i / 8), x = 52 + c * mw, y = 26 + r * 172;
    rect(x, y, mw - 14, mh + 34, '#141416', 'rx="4"');
    vu(x + 8, y + 8, mw - 30, mh - 16, -20, { faceFill: 'url(#a8amb)', bezel: '#0c0c0d', fontScale: 0.11, needleId: i });
    p(`<rect x="${x + 8}" y="${y + 8}" width="${mw - 30}" height="${mh - 16}" fill="#ffb547" opacity="0.12" filter="url(#glow)"/>`);
    text(x + (mw - 14) / 2, y + mh + 22, `–  ${i + 1}  –`, 16, '#d9dbde', 'middle', 800, 'letter-spacing="1"');
  }
  rect(BW - 210, BH - 46, 170, 30, '#141416', 'rx="3"'); text(BW - 125, BH - 25, 'STAUDER', 18, '#c9ccd0', 'middle', 900, 'letter-spacing="4"');
  circle(BW - 22 - 18, BH - 31, 9, '#2a2b2e');
  p('</svg>');
});
// SMPTE wall clock: hangs on the wall above the autolocator (both rooms), red LED time code read off track 24
function wallClock(cx, top) {
  const W = 330, H = 104;
  const segs = '88:88:88:88';
  return `<svg class="smpte-clock" width="${W}" height="${H + 14}" viewBox="0 0 ${W} ${H + 14}" style="position:absolute;left:${cx - W / 2}px;top:${top}px;overflow:visible" aria-label="SMPTE time code wall clock">
    <defs><linearGradient id="wcCase" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3b3e"/><stop offset="0.08" stop-color="#202124"/><stop offset="1" stop-color="#0d0d0f"/></linearGradient>
    <filter id="wcGlow" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="wcSh"><feGaussianBlur stdDeviation="7"/></filter></defs>
    <rect x="10" y="14" width="${W - 10}" height="${H}" rx="8" fill="#000" opacity="0.55" filter="url(#wcSh)"/>
    <rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="url(#wcCase)" stroke="#000" stroke-width="2"/>
    <rect x="1.5" y="1.5" width="${W - 3}" height="2" rx="1" fill="#fff" opacity="0.12"/>
    <rect x="14" y="22" width="${W - 28}" height="${H - 40}" rx="4" fill="#160404" stroke="#050505" stroke-width="2"/>
    <rect x="14" y="22" width="${W - 28}" height="${H - 40}" rx="4" fill="#5a0d08" opacity="0.18"/>
    <text x="${W / 2}" y="${H / 2 + 19}" text-anchor="middle" font-family="'DSEG7 Classic','JetBrains Mono',monospace" font-size="43" font-weight="700" fill="#ff2a14" opacity="0.08" letter-spacing="1">${segs}</text>
    <text class="wc-tc" x="${W / 2}" y="${H / 2 + 19}" text-anchor="middle" font-family="'DSEG7 Classic','JetBrains Mono',monospace" font-size="43" font-weight="700" fill="#ff3a1e" filter="url(#wcGlow)" letter-spacing="1">01:00:00:00</text>
    <text x="16" y="15" font-family="Archivo,Arial,sans-serif" font-size="9.5" font-weight="900" fill="#d9d6cc" letter-spacing="2.5">SMPTE TIME CODE</text>
    <circle class="wc-lock" cx="${W - 96}" cy="11.5" r="3.4" fill="#123d1c"/><text x="${W - 89}" y="15" font-family="Archivo,Arial,sans-serif" font-size="8.5" font-weight="800" fill="#9c9790" letter-spacing="1">LOCK</text>
    <text class="wc-fps" x="${W - 16}" y="15" text-anchor="end" font-family="Archivo,Arial,sans-serif" font-size="8.5" font-weight="800" fill="#9c9790" letter-spacing="1">30 FPS</text>
    <text x="16" y="${H - 7}" font-family="Archivo,Arial,sans-serif" font-size="7.5" font-weight="800" fill="#6f6b66" letter-spacing="2">HRS</text>
    <text x="${W / 2 - 52}" y="${H - 7}" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-size="7.5" font-weight="800" fill="#6f6b66" letter-spacing="2">MIN</text>
    <text x="${W / 2 + 26}" y="${H - 7}" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-size="7.5" font-weight="800" fill="#6f6b66" letter-spacing="2">SEC</text>
    <text x="${W - 16}" y="${H - 7}" text-anchor="end" font-family="Archivo,Arial,sans-serif" font-size="7.5" font-weight="800" fill="#6f6b66" letter-spacing="2">FRM</text>
    <text class="wc-src" x="${W / 2}" y="${H - 7}" text-anchor="middle" font-family="Archivo,Arial,sans-serif" font-size="7.5" font-weight="800" fill="#6f6b66" letter-spacing="2" opacity="0"></text>
  </svg>`;
}

// A827 remote controller (autolocator slot), from the user's photo: black two-tier panel on a wood pedestal with a leather
// armrest. Upper tier: ALL, 24 track keys in three coloured rows (ready / input / safe), transport keys. Lower tier: red
// LED tape-time display, function keys, keypad, transport keys, shuttle. Keys are live: data-a8r drives the tape transport.
const a827Remote = capture(() => {
  const RX = 1344, RW = 420, RH = 590;
  const RS8 = 0.84;   // scaled and lowered under the SMPTE wall clock
  p(`<svg xmlns="http://www.w3.org/2000/svg" width="${RW * RS8}" height="${RH * RS8}" viewBox="0 0 ${RW} ${RH}" style="position:absolute;left:${RX + RW * (1 - RS8) / 2}px;top:${610 - RH * RS8}px">`);
  rect(0, 0, RW, RH, '#6d4122', 'rx="8"'); rect(0, 0, 14, RH, 'url(#woodH)', 'rx="6"'); rect(RW - 14, 0, 14, RH, 'url(#woodH)', 'rx="6"');
  rect(14, 0, RW - 28, 250, '#202124'); rect(14, 254, RW - 28, 268, '#1b1c1e'); rect(14, 250, RW - 28, 4, '#000');
  rect(14, RH - 66, RW - 28, 66, '#7a3f22', 'rx="0"'); rect(14, RH - 66, RW - 28, 8, '#000', 'opacity="0.35"');
  for (const [sx, sy] of [[26, 10], [RW - 26, 10], [26, 240], [RW - 26, 240], [26, 264], [RW - 26, 264], [26, 510], [RW - 26, 510]]) { circle(sx, sy, 3.5, '#3a3c40'); }
  text(24, 22, 'STAUDER', 8, '#9a9ea3', 'start', 900, 'letter-spacing="1.5"'); text(RW - 24, 22, 'MULTI-CHANNEL REMOTE', 6.5, '#9a9ea3', 'end', 800);
  const k = (name, x, y, w, h, fill, lab, lit = '#fff4d6', lsize = 7) => {
    p(`<g data-a8r="${name}" style="cursor:pointer">`);
    rect(x + 0.5, y + 1.5, w, h, '#000', 'opacity="0.55" rx="1.5"'); rect(x, y, w, h, fill, 'rx="1.5"'); rect(x, y, w, h * 0.4, '#fff', 'opacity="0.18" rx="1.5"');
    p(`<rect id="a8r-l-${name}" x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${lit}" opacity="0" filter="url(#glowSm)"/>`);
    if (lab) text(x + w / 2, y + h / 2 + lsize * 0.36, lab, lsize, fill === '#e9eaec' || fill === '#d8d9d5' ? '#1a1a1a' : '#eef0f2', 'middle', 900);
    p('</g>');
  };
  // ALL + 24 tracks, three rows: green (ready), blue (input), orange (safe)
  k('all', 22, 34, 22, 14, '#d8d9d5', 'ALL', '#fff4d6', 6);
  const tx = (t) => 52 + t * 14.4 + Math.floor(t / 8) * 6;
  for (let t = 0; t < 24; t++) {
    text(tx(t) + 6, 32, String(t + 1), 6.5, '#d9dbde', 'middle', 800);
    k(`rdy${t}`, tx(t), 36, 12, 10, '#1f5b33', '', '#ff3b2f');
    k(`inp${t}`, tx(t), 52, 12, 10, '#24477a', '', '#5fb4ff');
    k(`safe${t}`, tx(t), 68, 12, 10, '#a14e1c', '', '#ffb02e');
  }
  text(48, 45, 'RDY', 6, '#9a9ea3', 'end', 800); text(48, 61, 'INP', 6, '#9a9ea3', 'end', 800); text(48, 77, 'SAFE', 6, '#9a9ea3', 'end', 800);
  // function keys, upper tier
  [['MON', 'mon'], ['SYNC', 'sync'], ['REPRO', 'repro'], ['', ''], ['AUTO', 'auto'], ['', '']].forEach(([l, n], i) => n && k(`f-${n}`, 54 + i * 34, 104, 26, 14, '#3a3c40', l, '#ffb02e', 6));
  [['rew', '◁'], ['ff', '▷'], ['play', 'PLAY'], ['stop', 'STOP'], ['rec', 'REC']].forEach(([n, l], i) => k(n, 24 + i * 44, 150, 38, 30, '#e9eaec', l, n === 'rec' ? '#ff5a3c' : n === 'play' ? '#7dff9a' : '#fff4d6', l.length > 1 ? 8 : 12));
  for (let i = 0; i < 4; i++) k(`f-u${i}`, 250 + (i % 2) * 34, 140 + Math.floor(i / 2) * 22, 26, 14, '#3a3c40', ['LOC1', 'LOC2', 'STO', 'RCL'][i], '#ffb02e', 5.5);
  rect(320, 132, 70, 56, '#111214', 'rx="2"'); text(355, 146, 'LOCATOR', 6, '#9a9ea3', 'middle', 800);
  // lower tier: red LED display, function keys, keypad, transport, shuttle
  rect(24, 272, 200, 40, '#120403', 'rx="2"');
  p(`<text id="a8r-tc" x="124" y="300" font-family="'JetBrains Mono', monospace" font-size="22" font-weight="800" fill="#ff3b2f" text-anchor="middle" filter="url(#glowSm)">00:03:42:00</text>`);
  for (let i = 0; i < 12; i++) k(`f-l${i}`, 24 + (i % 6) * 34, 326 + Math.floor(i / 6) * 22, 26, 14, '#3a3c40', ['ZERO', 'RTZ', 'LOOP', 'AUTO', 'SPD', 'VAR', 'IN', 'OUT', 'MEM', 'TC', 'CLR', 'ENT'][i], '#ffb02e', 5.5);
  for (let i = 0; i < 12; i++) { const l = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', 'E'][i]; k(`kp${l}`, 250 + (i % 3) * 32, 272 + Math.floor(i / 3) * 26, 26, 20, '#3a3c40', l, '#ffb02e', 9); }
  [['rew2', '◁'], ['ff2', '▷'], ['play2', 'PLAY'], ['stop2', 'STOP'], ['rec2', 'REC']].forEach(([n, l], i) => k(n, 24 + i * 40, 420, 34, 26, '#e9eaec', l, n === 'rec2' ? '#ff5a3c' : n === 'play2' ? '#7dff9a' : '#fff4d6', l.length > 1 ? 7.5 : 11));
  rect(240, 428, 120, 26, '#0d0d0e', 'rx="3"'); p('<rect id="a8r-shuttle" x="290" y="424" width="20" height="34" rx="3" fill="#d8d9d5"/>'); text(300, 470, 'SHUTTLE', 6.5, '#9a9ea3', 'middle', 800);
  p('</svg>');
});
const slsConsole = require('./sls.js')({ p, rect, text, circle, button, fader, capture, vu, remote224 }, { tapeNames, tapeDb });
const hot = (x, y, w, h, view, label) => `<div class="hot" data-open="${view}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" title="${label}"><span>${label}</span></div>`;
const overlay = (view, title, body, extra = '', float = false) => float
  ? `<div class="overlay float" id="ov-${view}" data-view="${view}" hidden><div class="ov-win"><div class="ov-bar"><b>${title}</b>${extra}<button class="ov-close" type="button">✕</button></div><div class="ov-body">${body}</div></div></div>`
  : `<div class="overlay" id="ov-${view}" data-view="${view}" hidden><div class="ov-bar"><b>${title}</b>${extra}<button class="ov-close" type="button">✕ Close · Esc</button></div><div class="ov-body">${body}</div></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Analog Studio · 4K mockup</title>
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Archivo:wght@500;700;800&family=JetBrains+Mono:wght@700;800&display=block" rel="stylesheet">
<style>
  html,body{margin:0;background:#000;overflow:hidden;height:100%}
  #stage{position:absolute;left:0;top:0;width:3840px;height:2160px;transform-origin:0 0}
  #stage>svg{display:block}
  .hot.elkey{z-index:56}
  #tapeview{position:absolute;inset:0;overflow:hidden;background:#1c1916}
  #tapeview .tpv{position:absolute;inset:0}
  #tapeview .tpk{position:absolute;background:transparent;border:0;border-radius:10px;cursor:pointer;outline:0 solid rgba(255,214,140,0);transition:outline-color .15s, background .15s}
  #tapeview .tpk:hover{outline:4px solid rgba(255,214,140,.75);background:rgba(255,214,140,.08)}
  #tapeview .tpk.dn{background:rgba(255,255,255,.18)}
  .hot{position:absolute;z-index:50;cursor:pointer;border-radius:10px;outline:0 solid rgba(255,214,140,0);transition:outline-color .15s, background .15s}
  .hot span{position:absolute;left:50%;top:14px;transform:translateX(-50%);padding:8px 16px;border-radius:6px;background:rgba(20,18,16,.85);color:#f1ece3;font:700 20px Archivo,Arial,sans-serif;letter-spacing:1px;white-space:nowrap;opacity:0;transition:opacity .15s;pointer-events:none}
  .hot:hover{outline:4px solid rgba(255,214,140,.75);background:rgba(255,214,140,.05)} .hot:hover span{opacity:1}
  .overlay{position:absolute;inset:0;z-index:100;background:#0e0c0b}
  .overlay[hidden]{display:none}
  .ov-bar{height:56px;display:flex;align-items:center;gap:28px;padding:0 24px;background:linear-gradient(#1e1f22,#121315);border-bottom:1px solid #000;color:#e9dcc0;font:800 20px Archivo,Arial,sans-serif;letter-spacing:3px}
  .ov-bar b{font-weight:800}
  .ov-bar .ov-msg,.ov-bar .ov-param{flex:1;letter-spacing:.5px;font-weight:600;color:#cfc8b8}
  .ov-bar button{font:800 18px Archivo,Arial,sans-serif;color:#1a1208;background:#efece4;border:0;border-radius:4px;padding:8px 16px;cursor:pointer}
  .ov-bar button.ov-close{margin-left:auto}
  .ov-body{position:absolute;left:0;top:56px;width:3840px;height:2104px}
  .ov-body iframe{width:100%;height:100%;border:0;display:block}
  .overlay.float{background:rgba(8,6,5,.5)}
  .overlay.float .ov-win{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:12px;overflow:hidden;border:2px solid #000;background:#141210;box-shadow:0 30px 90px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.06)}
  .overlay.float .ov-bar{height:auto;min-height:52px;flex-wrap:wrap;gap:14px 18px;padding:6px 16px;font-size:17px;letter-spacing:2px}
  .overlay.float .ov-bar button.ov-close{padding:6px 12px}
  .overlay.float .ov-body{position:relative;left:auto;top:auto;width:auto;height:auto}
  .overlay.float .ov-body>svg{display:block}
  .ovsync{padding:0 0 18px;background:#141210}.ovsync>svg{display:block}
  .ovsync .sk{display:flex;flex-wrap:wrap;gap:10px;padding:16px 22px 6px;align-items:center}
  .ovsync .sk button{font:900 17px Archivo,Arial;letter-spacing:1.2px;padding:12px 16px;border-radius:6px;border:1px solid #000;background:#e9e3d3;color:#1a1612;cursor:pointer;box-shadow:0 4px 0 #0c0b0a}
  .ovsync .sk button.on{background:#ffcf5a;box-shadow:0 0 14px rgba(255,190,60,.6),0 4px 0 #0c0b0a}
  .ovsync .sk button .v{font-family:'JetBrains Mono',monospace;color:#7a4a10;margin-left:6px}
  .ovsync .sk .gap{width:16px}
  .ovsync .note{margin:8px 22px 0;max-width:1400px;font:600 16px Archivo,Arial;color:#cfc6b6;line-height:1.5}
  .ovsync .rd{display:flex;gap:34px;padding:10px 22px 0;font:800 15px Archivo,Arial;letter-spacing:1.5px;color:#a9a594}
  .ovsync .rd b{font:700 22px 'JetBrains Mono',monospace;color:#7dffd6;margin-left:8px;letter-spacing:0}
  .ov-pick{font:800 18px Archivo,Arial,sans-serif;color:#1a1208;background:#ffb02e;border:0;border-radius:4px;padding:8px 16px;cursor:pointer;letter-spacing:1px}
  select.ov-pick{background:#efece4}
  .shot{position:absolute;z-index:50}
  .shot[hidden]{display:none}
  #strip-hot-sls{z-index:66}
  #strip-hl{position:absolute;z-index:67;pointer-events:none;will-change:transform;contain:layout paint;border:3px solid #ffb02e;border-radius:4px;background:rgba(255,176,46,.12);box-shadow:0 0 18px rgba(255,176,46,.5)}
  #strip-hl[hidden]{display:none}
  #strip-hl span{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);white-space:nowrap;padding:6px 12px;border-radius:5px;background:rgba(20,18,16,.92);color:#ffd27a;font:800 18px Archivo,Arial,sans-serif;letter-spacing:1px}
  #files-bar{position:absolute;z-index:72;font-family:Archivo,Arial,sans-serif}
  #files-bar .fbtns{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
  #files-bar .fbtns button{font:900 16px Archivo,Arial;letter-spacing:2px;padding:14px 0;border-radius:6px;border:1px solid #000;background:linear-gradient(#ece6d6,#cfc7b2);color:#1a1612;cursor:pointer;box-shadow:0 4px 0 #0c0b0a}
  #files-bar .fbtns button:active{transform:translateY(3px);box-shadow:0 1px 0 #0c0b0a}
  #files-msg{margin-top:9px;font:600 13px Archivo,Arial;color:#a9a594;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #files-bar .fmenu{position:absolute;left:0;right:0;bottom:100%;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;padding:12px;background:#1c1a18;border:1px solid #4a4440;border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,.6)}
  #files-bar .fmenu[hidden]{display:none}
  #files-bar .fmenu button{text-align:left;font:900 16px Archivo,Arial;letter-spacing:1.5px;padding:10px 12px;border-radius:5px;border:1px solid #000;background:#e9e3d3;color:#1a1612;cursor:pointer}
  #files-bar .fmenu button i{font-style:normal;color:#9a5a1c;margin-left:6px}
  #files-bar .fmenu button small{display:block;font:600 12px Archivo,Arial;letter-spacing:0;color:#5a544c;margin-top:3px}
  #files-bar .fmenu label{display:flex;justify-content:space-between;align-items:center;font:800 13px Archivo,Arial;letter-spacing:1.5px;color:#cfc6b3}
  #files-bar .fmenu select{font:700 15px Archivo,Arial;background:#121110;color:#f0e8d6;border:1px solid #5a534c;border-radius:5px;padding:5px;width:240px}
  .tapesel{position:absolute;left:632px;top:8px;height:40px;display:flex;align-items:center;gap:10px;z-index:70;font:800 15px Archivo,Arial,sans-serif;letter-spacing:1.5px;color:#a9a594}
  .tapesel label{display:flex;align-items:center;gap:8px}
  .tapesel button{font:900 13px Archivo,Arial;letter-spacing:1px;padding:6px 9px;border-radius:5px;border:1px solid #6b635b;background:#e9e3d3;color:#1d1a16;cursor:pointer}
  .tapesel button.done{background:#7dff9a}
  .tapesel .auto{font-size:13px;gap:5px}
  .tapesel select{font:700 14px Archivo,Arial;background:#121110;color:#f0e8d6;border:1px solid #5a534c;border-radius:5px;padding:4px 5px;width:190px}
  .tapesel #takeup-sel{width:122px}
  .modes .lbl{display:none}
  .modes{position:absolute;left:1300px;top:8px;height:40px;display:flex;align-items:center;gap:10px;z-index:70;font-family:Archivo,Arial,sans-serif}
  .modes .lbl{color:#8b8778;font-size:11px;font-weight:700;letter-spacing:2px;margin-right:4px}
  .modes button{width:112px;height:40px;border-radius:4px;border:1px solid #000;cursor:pointer;font:900 17px Archivo,Arial,sans-serif;letter-spacing:3px;color:#d8d0c0;background:linear-gradient(#3a3b3f,#232427);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 2px 3px rgba(0,0,0,.6)}
  .modes button:hover{color:#fff}
  .modes button[aria-pressed="true"]{color:#1a1208;background:linear-gradient(#ffd27a,#ffb02e);box-shadow:0 0 14px rgba(255,176,46,.55),inset 0 1px 0 rgba(255,255,255,.5)}
  .modes button:focus-visible{outline:3px solid #5fb4ff;outline-offset:2px}
  #sls{position:absolute;left:0;top:56px;width:3290px;height:2104px;z-index:60;background:#171615}
  #sls[hidden]{display:none}
  .sls-area{position:absolute;border:2px dashed #4a4744;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#cfc8b8;font-family:Archivo,Arial,sans-serif;text-align:center;background:rgba(255,255,255,.02)}
  .sls-area b{font-size:44px;font-weight:900;letter-spacing:4px;color:#ece6da}
  .sls-area span{font-size:22px;font-weight:600;color:#9c9384;max-width:80%}
${elecCss}
</style></head><body><div id="stage">
${svg}
${jh24}
${scenes3d.join('\n')}
${wallClock(AX + (12 + 376 / 2) * ALK, 66)}
<div id="files-bar" style="left:${globalThis.RACK_FILES.x}px;top:${globalThis.RACK_FILES.y}px;width:${globalThis.RACK_FILES.w}px">
  <div class="fbtns"><button type="button" data-f="load" title="Open a .TAP tape or a .MIX mix">LOAD</button><button type="button" data-f="save" title="Save the tape (.TAP) or the mix (.MIX)">SAVE</button><button type="button" data-f="import" title="Audio files onto tape tracks (WAV, AIFF, FLAC, MP3, AAC, OGG, CAF … numbered stems or one multichannel file), or a .TAP / .MIX">IMPORT</button><button type="button" data-f="export" title="The tape's tracks out as audio files">EXPORT</button></div>
  <div class="fmenu" id="fm-save" hidden><button type="button" data-f="save-tap">TAPE <i>.TAP</i><small>the reel: its recordings, SMPTE, tempo map, locate points, alignment</small></button><button type="button" data-f="save-mix">MIX <i>.MIX</i><small>both consoles' channel settings and the patchbay</small></button></div>
  <div class="fmenu" id="fm-export" hidden><label>FORMAT <select id="fx-fmt"><option value="wav:24">WAV 24-bit</option><option value="wav:16">WAV 16-bit</option><option value="wav:32">WAV 32-bit float</option><option value="aiff:24">AIFF 24-bit</option><option value="aiff:16">AIFF 16-bit</option><option value="flac:24">FLAC 24-bit</option><option value="flac:16">FLAC 16-bit</option><option value="mp3:16">MP3 320 kbps</option></select></label><label>TRACKS <select id="fx-which"><option value="rec">recorded tracks</option><option value="all">all 24</option></select></label><button type="button" data-f="go-export">EXPORT STEMS</button></div>
  <div id="files-msg">Tapes, mixes and audio</div>
</div>
<div class="tapesel"><label>TAPE <select id="tape-sel" title="Thread a different tape: its reel goes on the machine, its formulation into the electronics (realign for it)">${Object.entries(TAPE_LIST).map(([k, t]) => `<option value="${k}" title="${t.name.replace(/"/g, '&quot;')}"${k === 'a499' ? ' selected' : ''}>${t.short.replace(/"/g, '&quot;')} · ${t.ol} nWb/m</option>`).join('')}</select></label><button type="button" id="tape-align" title="Realign the machine for this tape: its operating level, then repro, sync, bias, record level and HF on every channel (manual section 7)">ALIGN</button><label class="auto" title="Realign automatically whenever a tape is threaded"><input type="checkbox" id="tape-auto" checked> AUTO</label><label>TAKE-UP <select id="takeup-sel" title="The empty reel on the take-up side">${Object.entries(globalThis.JH_REEL_NAMES).map(([k, n]) => `<option value="${k}"${k === 'gp9' ? ' selected' : ''}>${n.replace(/"/g, '&quot;')}</option>`).join('')}</select></label></div>
<div class="modes" role="group" aria-label="Studio"><span class="lbl">STUDIO</span><button type="button" data-mode="cmi" aria-pressed="true" title="CMI room: HJ-24, AutoLocator III, HJ-632 console">CMI</button><button type="button" data-mode="sls" aria-pressed="false" title="SLS room: Stauder A827, SLS 4000 G console">SLS</button></div>
<div id="sls" hidden aria-label="SLS studio">
  <div style="position:absolute;left:24px;top:20px;width:1296px;height:590px;background:#232427;border-radius:10px"></div>
  ${a827}
  ${a827Remote}
  <div class="hot elkey" data-open="elec" style="left:898px;top:494px;width:40px;height:28px" title="ELEC: open the channel cards to tweak the tape machine"><span>ELEC</span></div>
  ${wallClock(1554, 4)}
  ${a827Bridge}
  ${slsConsole}
</div>
<div id="strip-hot-cmi" class="shot" style="left:46px;top:800px;width:2720px;height:900px" title="Click a section of any channel"></div>
<div id="strip-hot-sls" class="shot" hidden style="left:24px;top:860px;width:3242px;height:860px" title="Click a section of any channel"></div>
<div id="strip-hl" hidden><span></span></div>
${hot(TX, 76, TW - 2 * TCI, 590, 'tape', 'Open the HJ-24')}
${hot(AX, AY + 60, Math.round(AW * ALK), 590 - 60 - ALDROP, 'al', 'Open the AutoLocator III')}
${hot(1704, 60, 1578, 606, 'meters', 'Open the meter bridge')}
${hot(3340, 130, 450, 176, '224', 'Open the Leximan 224X')}
${hot(2857, 1280, 296, 462, '224', 'Open the Leximan 224X')}
${hot(3340, Math.round(globalThis.RACK_PB_Y || 1150), 450, 116, 'patchbay', 'Open the patchbay')}
${hot(3340, Math.round(globalThis.RACK_SBX_Y || 1000), 450, 56, 'sbx', 'Open the SBX-80 sync box')}
${hot(3340, Math.round(globalThis.RACK_SG_Y), 450, 56, 'sg', 'Open the SG-24 master sync generator')}
${hot(3340, Math.round(globalThis.RACK_DZ_Y), 450, 56, 'dz', 'Open the Delta-Three synchronizer')}
<div class="hot elkey" data-open="elec" style="left:1184px;top:540px;width:58px;height:38px" title="ELECTRONICS: open the channel cards to tweak the tape machine"><span>ELECTRONICS</span></div>
<div class="el-plate" data-open="elec" id="el-plate" style="left:${TX + 640}px;top:${76 + 548}px" title="Open the HJ-24 audio electronics (the three drawers under the transport)"><i></i>AUDIO ELECTRONICS</div>
${hot(3480, 8, 160, 40, 'patchbay', 'Open the patchbay')}
${overlay('tape', 'TAPE MACHINE · 24 TRACK', tapeView, '<span class="ov-msg" id="tp-msg"></span>')}
${overlay('elec', 'CMI HJ-24 · AUDIO ELECTRONICS', elecView)}
${overlay('al', 'CMI AUTOLOCATOR III', `<svg id="alSvg" width="${Math.round((AL_W * 4.6 + 76) * 0.86)}" height="${Math.round((AL_H * 4.6 + 92) * 0.86)}" viewBox="${900 - 26} ${150 - 26} ${AL_W * 4.6 + 76} ${AL_H * 4.6 + 92}" style="display:block;user-select:none">${alView}</svg>`, '<span class="ov-msg" id="al-msg">Ready</span>', true)}
${overlay('sbx', 'ROWAN SBX-80 SYNC BOX', `<svg id="sbxSvg" width="${Math.round(SBX_BOX[2] * 0.82)}" height="${Math.round(SBX_BOX[3] * 0.82)}" viewBox="${SBX_BOX.join(' ')}" style="display:block;user-select:none">${sbxView}</svg>`, '<span class="ov-msg" id="sbx-status">SMPTE on track 24 · MIDI clock + DIN sync out</span><span id="sbx-file" class="ov-param"></span><span id="sbx-out" hidden></span><span id="sbx-out2" hidden></span><label class="ov-pick">LOAD TRACK 24 AUDIO<input id="sbx-in" type="file" accept="audio/*,.wav,.aif,.aiff,.flac" hidden></label><select id="sbx-midi" class="ov-pick"><option value="">MIDI OUT · off</option></select>', true)}
${overlay('sg', 'HOLLIS SG-24 MASTER SYNC GENERATOR', `<div class="ovsync"><svg width="1500" height="187" viewBox="0 0 450 56">${capture(() => sgFace(450, 56))}</svg>
  <div class="sk"><button type="button" data-sg="rate">RATE <span class="v"></span></button><button type="button" data-sg="pull">PULL <span class="v"></span></button><button type="button" data-sg="video">VIDEO / TC <span class="v"></span></button><span class="gap"></span><button type="button" data-sg="run">TC RUN</button><button type="button" data-sg="reset">TC RESET</button><span class="gap"></span><button type="button" data-sg="cap" title="The 19.2 kHz capstan reference into the HJ-24's EXT input (the MCI-style machines take 19.2 kHz)">CAPSTAN REF → HJ-24</button><button type="button" data-sg="mtcout" title="Send the generator's time code to your DAW as MIDI time code">MTC OUT</button></div>
  <p class="note">Outputs: word clock ×4 (at the rate shown, pulled with PULL), black burst ×4 (NTSC / PAL), tri-level ×2, LTC and MTC from the time-code generator, and a 19.2 kHz capstan reference (what the HJ-24's capstan servo locks to). Clock your interface and your DAW from the word clock, and the tape machine from the capstan reference, and nothing can drift.</p></div>`, '<span class="ov-msg" id="sg-msg"></span>', true)}
${overlay('dz', 'ADDISON-SMYTH DELTA-THREE SYNCHRONIZER', `<div class="ovsync"><svg width="1500" height="187" viewBox="0 0 450 56">${capture(() => dzFace(450, 56))}</svg>
  <div class="sk"><button type="button" data-dz="chase" title="Slave the HJ-24 to the master">CHASE</button><button type="button" data-dz="src" title="Where the master time code comes from">MASTER <span class="v"></span></button><button type="button" data-dz="ref" title="Master and slave share the SG-24 reference: resolve to it">HOUSE REF</button><span class="gap"></span><button type="button" data-dz="capture" title="Take the current difference between slave and master as the offset">CAPTURE OFFSET</button><button type="button" data-dz="nudge-">◀ ¼ FR</button><button type="button" data-dz="nudge+">¼ FR ▶</button><button type="button" data-dz="zero">OFFSET 0</button></div>
  <div class="rd"><span>STATE <b id="dz-state">OFF</b></span><span>OFFSET <b id="dz-off">+00:00:00:00</b></span><span>ERROR <b id="dz-err">—</b></span><span>CAPSTAN <b id="dz-spd">0.000 %</b></span></div>
  <p class="note">The front panel works: click its keys. MASTER and SLAVE enable the chase · RUN starts the generator · STOP·CONT holds the system · SELECT steps the display (G_TC, M_TC, S_TC, S_OFS, S_ERR, S_SPD; the last two letters show the chase: PK park, CU cue, WT wait, PL pull-in, LK lock, TL tight lock, HD held) · ◀ ▶ trim the offset a quarter frame · CLEAR zeroes it · INDEX switches the LOCK lamp between the wide (0.05 frame) and tight (0.003 frame) windows. A red SHIFT reaches the red legends on its half: CAPTURE takes the offset, GOTO parks the slave on the master, LEARN relearns the slave's start-up, COPY resets the generator. MIDI (MTC IN) is an extension: the original read master LTC and only sent MTC.</p></div>`, '<span class="ov-msg" id="dz-msg"></span>', true)}
${overlay('strip', 'CHANNEL', '<svg id="stripSvg" width="400" height="1200" viewBox="0 0 400 1200" style="display:block;user-select:none;touch-action:none"></svg>', '<span class="ov-msg" id="strip-title"></span><span class="ov-msg" id="strip-val"></span>', true)}
${overlay('meters', 'HJ-24 METER BRIDGE', `<svg width="3840" height="${OVH}" viewBox="0 0 3840 ${OVH}" style="display:block">${meterView}</svg>`)}
${overlay('224', 'LEXIMAN 224X', `<svg width="${Math.round(1070 * 0.95)}" height="${Math.round(1640 * 0.95)}" viewBox="480 190 1070 1640" style="display:block">${lexView}</svg>`, '<span class="ov-param">BASS RT</span>', true)}
${overlay('patchbay', 'PATCHBAY', `<svg id="pbSvg" width="3840" height="${OVH}" viewBox="0 0 3840 ${OVH}" style="display:block;background:#0b0a09;touch-action:none"></svg>`, '<span class="ov-msg">Drag from an output (gold) to an input (blue). Click a cable to pull it.</span><span id="pb-count"></span><button id="pb-reset" type="button">Restore session</button><button id="pb-clear" type="button">Pull all</button>')}
</div>
<script>window.TAPE_DB = ${JSON.stringify(tapeDb.map((v) => Math.round(v * 10) / 10))}; window.JH_LIVE = ${JSON.stringify(globalThis.JH_LIVE)}; window.A8_LIVE = ${JSON.stringify(globalThis.A8_LIVE)};</script>
<script>${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'reels', 'physics.js'), 'utf8').replace(/^export /gm, '')}
// one transport for the whole studio: console reels, autolocator and the tape machine view all use it
window.AS_TRANSPORT = new Transport({ totalLength: ROLL_FT * FT, onTakeup: 222 * 30 * IPS, speedIPS: 30 }); window.AS_TRANSPORT.zero = 0;</script>
<script>window.JH_SKINS = ${JSON.stringify(globalThis.JH_SKINS)}; window.JH_TAPES = ${JSON.stringify(TAPE_LIST)};</script>
<script>window.JH24M = (() => { ${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'electronics', 'jh24audio.js'), 'utf8').replace(/^export /gm, '')}
return { Machine, Track, Piece, TAPES, SPEEDS, align, IPS, VU0 }; })();
window.DEMO = (() => { ${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'demo', 'demotape.js'), 'utf8').replace(/^export /gm, '')}
return demoTape; })();
window.ASF = (() => { ${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'files', 'audiofiles.js'), 'utf8').replace(/^export /gm, '')}
return { wav, aiff, flac, zip, concat, writeTap, readTap, crc32 }; })();</script>
<script type="text/plain" id="jh24-worklet-src">${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'electronics', 'jh24audio.js'), 'utf8').replace(/^export /gm, '') + '\n' + fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'electronics', 'mechsound.js'), 'utf8').replace(/^export /gm, '') + '\n' + fs.readFileSync(path.join(__dirname, 'elec-worklet.js'), 'utf8')}</script>
<script>${['ltc.js', 'midiclock.js', 'chase.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'sync', f), 'utf8').replace(/^export /gm, '')).join('\n')}</script>
<script>${fs.readFileSync(path.join(__dirname, 'overlays.client.js'), 'utf8').replace('  // ---------------- the studio clock ----------------', fs.readFileSync(path.join(__dirname, 'strip.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'electronics.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'files.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'syncgen.client.js'), 'utf8') + '  // ---------------- the studio clock ----------------')}</script>
</body></html>`;
fs.writeFileSync(path.join(dir, 'analog-studio-mockup.html'), html);
// artifact version: the same page without the document wrapper (the host adds it), title first
{
  const head = html.slice(html.indexOf('<link href='), html.indexOf('</head>'));
  const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
  fs.mkdirSync(path.join(dir, 'artifact'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'artifact', 'index.html'), `<title>Analog Studio Console</title>\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n${body}`);
  if (fs.existsSync(path.join(dir, 'tape-machine.html'))) fs.copyFileSync(path.join(dir, 'tape-machine.html'), path.join(dir, 'artifact', 'tape-machine.html'));
}
console.log('wrote', svg.length, 'bytes');
