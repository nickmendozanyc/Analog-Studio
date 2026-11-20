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
  const { ticks = r >= 13, skirt = '#1b1c1f', pointer = '#ffffff', label, labelColor = '#cfcabd', labelSize, dark = false } = opts;
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
  p(`<line x1="${px1.toFixed(1)}" y1="${py1.toFixed(1)}" x2="${px2.toFixed(1)}" y2="${py2.toFixed(1)}" stroke="${pointer}" stroke-width="${Math.max(1.4, r * 0.13)}" stroke-linecap="round"/>`);
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
  const { capW = 30, capH = 50, index = '#ffffff', scale = true, scaleColor = '#cfcabd', capFill = 'url(#faderCap)' } = opts;
  if (scale) {
    for (const [lab, f] of FADER_MARKS) {
      const y = top + f * (bottom - top);
      p(`<line x1="${cx - capW / 2 - 9}" y1="${y}" x2="${cx - 6}" y2="${y}" stroke="${scaleColor}" stroke-opacity="${lab === '0' && f === 0.22 ? 1 : 0.55}" stroke-width="${lab === '0' && f === 0.22 ? 1.6 : 1}"/>`);
      text(cx - capW / 2 - 11, y + 3, lab, 8, scaleColor, 'end', 600);
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
  rect(500, 110, 134, 50, 'none', 'stroke="#f2f4f8" stroke-width="3"');
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
p(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
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
text(500, 34, 'Midnight Tapes — 24 trk · 2" · 30 IPS · loaded from midnight_tapes.mogg', 15, '#e8e4d8', 'start', 500);
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
rect(TX, TY, TW, TH, '#2a2725', 'rx="10"');
p(`</g>`);

// =====================================================================
// AUTOLOCATOR (AL-III) + TAPE METER BRIDGE: CSS 3D scenes; faces drawn with the SVG helpers
// =====================================================================
const capture = (fn) => { const st = out.length; fn(); return out.splice(st).join('\n'); };
const svgWrap = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;overflow:visible">${body}</svg>`;
const B3 = (st) => `position:absolute;transform-style:preserve-3d;${st}`;
const scenes3d = [];
const tapeNames = ['KICK', 'SNR TOP', 'SNR BTM', 'HAT', 'TOM 1', 'TOM 2', 'FL TOM', 'OH L', 'OH R', 'ROOM L', 'ROOM R', 'BASS DI', 'BASS AMP', 'GTR 1', 'GTR 2', 'AC GTR', 'KEYS L', 'KEYS R', 'ORGAN', 'LEAD VOX', 'BGV 1', 'BGV 2', 'PERC', 'TAMB'];
const tapeDb = tapeNames.map((n, i) => (i === 19 ? 1.2 : i === 21 ? -30 : -14 + rnd() * 15));
const readyTracks = new Set([19, 20, 21]);
const LEG = '#ece7dc';   // legend colour on taupe

// ---------------- AL-III autolocator face (400 x 340 units, modelled on the CMI AutoLocator III) ----------------
// live = true draws the clickable pop-up version: every control is a <g data-al="..."> and every lamp a hidden lit copy
const AL_W = 400, AL_H = 340;
function al3(live = false, st = {}) {
  const S = Object.assign({ tape: '03:42', loc: '01:02', ready: readyTracks, lamps: new Set(['auto']), leds: new Set(['ready']) }, st);
  const PANEL = '#4b4845', BAY = '#3a3836', INK = '#e6e1d6';
  const key = (name, x, y, w, h, color, label, size = 6) => {
    if (live) p(`<g data-al="${name}" style="cursor:pointer">`);
    const lit = !live && S.lamps.has(name);
    button(x, y, w, h, color, lit, label, { size, pastel: true });
    if (live) { p(`<g class="al-lamp" data-lamp="${name}" opacity="0" pointer-events="none">`); button(x, y, w, h, color, true, label, { size }); p('</g></g>'); }
  };
  const led = (name, cx, cy, col, w = 5, h = 3) => {
    rect(cx - w / 2, cy - h / 2, w, h, '#160c08', 'rx="0.8"');
    const on = !live && S.leds.has(name);
    rect(cx - w / 2, cy - h / 2, w, h, col, `rx="0.8" ${live ? `class="al-led" data-led="${name}" opacity="0"` : on ? 'filter="url(#glowSm)"' : 'opacity="0"'}`);
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
    if (live) p(`<g id="al-${id}">`);
    seg7(x + 22, 27, 19, val, '#ff3220');
    if (live) p('</g>');
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
  key('aplay', 96, 100, 22, 16, 'white', 'A.PLAY', 4.6);
  key('loc0', 164, 100, 22, 16, 'white', 'LOC 0', 4.6);
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
  [['sto', 'STO'], ['rcl', 'RCL'], ['reh', 'REH']].forEach(([n, l], c) => key(n, 286 + c * 34, 114, 28, 21, 'white', l, 7));
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
const AX = 1408, AY = 76, AW = 400, AH = 816, ALK = 0.723;   // drawn at 816 tall, shown scaled to fit the top row
{
  const FW = 376, FD = Math.round(AL_H * FW / AL_W), LIP = 34, TOP = 150, SLOPE = 30;
  const face = capture(() => { p(`<g transform="scale(${FW / AL_W})">`); al3(false); p('</g>'); });
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
      vu(x + 14, 34, w - 28, 102, tapeDb[i], { fontScale: 0.125 });
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
  const K = (x, y, r, cap, ang, o = {}) => { if (FLAT) knob(x, y, r, cap, ang, { ticks: false, dark: o.dark }); else upKnobs.push(knob3d(x, y, r, cap, ang, o)); };
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
    const blk = (x, y, w, h, label, lit = false, litCol = '#ff3b2f') => {
      rect(x - 0.5, y + 1.5, w + 1, h + 1, '#000', 'rx="2" opacity="0.6"');
      rect(x, y, w, h, lit ? litCol : '#151515', `rx="2" ${lit ? 'filter="url(#glow)"' : ''}`);
      rect(x, y, w, h, 'url(#btnOff)', 'rx="2"');
      tx(x + w / 2, y + h / 2 + 3.4, label, 9.5, lit ? '#1a0c08' : WH, 'middle', 800);
    };
    const wht = (x, y, w, h, label, lit = false) => {
      rect(x - 0.5, y + 1.5, w + 1, h + 1, '#000', 'rx="2" opacity="0.6"');
      rect(x, y, w, h, lit ? '#fff7c8' : '#e9e7e0', `rx="2" ${lit ? 'filter="url(#glow)"' : ''}`);
      rect(x, y, w, h, 'url(#btnOff)', 'rx="2" opacity="0.5"');
      tx(x + w / 2, y + h / 2 + 4, label, 11, '#1b1b1b', 'middle', 800);
    };
    const rnd2 = (cx, cy, r, col) => { circle(cx + 0.8, cy + 1.6, r + 0.8, '#000', 'opacity="0.55"'); circle(cx, cy, r, col); circle(cx, cy, r, 'url(#capHi)', 'opacity="0.7"'); };
    const led = (cx, cy, on) => circle(cx, cy, 2.6, on ? '#ff3b2f' : '#4a1612', on ? 'filter="url(#glow)"' : '');
    // printed knob scale: tick marks plus numerals at given angles
    const scale = (cx, cy, r, marks, col = WH) => {
      for (let i = 0; i <= 10; i++) { const a = -150 + i * 30; const [x1, y1] = polar(cx, cy, r * 1.22, a), [x2, y2] = polar(cx, cy, r * 1.38, a); p(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${GOLD}" stroke-width="0.9"/>`); }
      for (const [a, lab] of marks) { const [mx2, my2] = polar(cx, cy, r * 1.72, a); tx(mx2, my2 + 2.8, lab, 7.5, col, 'middle', 700); }
    };
    const KN = (cx, cy, r, col, ang, marks, dark = false) => { scale(cx, cy, r, marks); K(cx, cy, r, col, ang, { dark }); };
    const BLUE = '#3f8fd9', SAGE = '#7fa392', RED = '#e3452f', YEL = '#ecd03a', BLK = '#1a1a1c';
    const GAIN14 = [[-150, '-14'], [-75, '6'], [0, '0'], [75, '6'], [150, '+14']];
    for (let ch = 0; ch < NCH; ch++) {
      const x0 = ch * STRIP, ret = ch >= 24, cm = x0 + STRIP / 2;
      rect(x0, 0, STRIP, UD, ret ? 'url(#jh600alt)' : 'url(#jh600)');
      rect(x0, 0, STRIP, UD, '#000', 'filter="url(#brushed)" opacity="0.06"');
      rect(x0, 0, 1.5, UD, '#000', 'opacity="0.75"'); rect(x0 + 1.5, 0, 1, UD, '#fff', 'opacity="0.08"');
      for (const sy of [6, UD - 6]) screw(cm, sy, 2.6);
      // bus assign: 24 round black keys in two columns, red LED beside each
      for (let i = 0; i < 12; i++) {
        const y = 16 + i * 12.6;
        for (const [k, bx, lx, nx, an] of [[2 * i + 1, x0 + 20, x0 + 32, x0 + 8, 'middle'], [2 * i + 2, x0 + 52, x0 + 64, x0 + 77, 'middle']]) {
          rnd2(bx, y, 4.8, '#141414'); led(lx, y, readyTracks.has(ch) && ch + 1 === k);
          tx(nx, y + 2.8, String(k), 7.5, WH, an, 700);
        }
      }
      p('<g transform="translate(0 -26)">');
      // INPUT / TAPE source select
      blk(x0 + 4, 186, 37, 15, 'INPUT', readyTracks.has(ch), '#ffb02e'); blk(x0 + 44, 186, 37, 15, 'TAPE', ch < 24 && !readyTracks.has(ch), '#ffb02e');
      p('<g transform="translate(0 -58)">');   // trim through sends move up into the space the mic controls left
      KN(x0 + 22, 274, 11, RED, -30 + rnd() * 60, [[-150, '-'], [150, '+']]);
      tx(x0 + 22, 299, 'TRIM', 8, WH);
      KN(x0 + 60, 290, 10, RED, ch % 2 ? 40 : -40, [[-150, 'O'], [0, 'C'], [150, 'E']]);
      tx(x0 + 60, 314, 'ODD·EVEN', 7, WH, 'middle', 700);
      // pan toggle, direct out level + LED
      rect(x0 + 13, 330, 14, 8, '#0d0d0d', 'rx="4"'); rect(x0 + 17, 320, 6, 14, 'url(#chrome)', 'rx="3"');
      tx(x0 + 20, 348, 'PAN', 7.5, GOLD);
      tx(x0 + 56, 324, 'DIRECT', 7, GOLD);
      K(x0 + 56, 337, 7.5, BLK, -60, { dark: true }); led(x0 + 76, 334, ch < 24 && ch % 7 === 3);
      // DUMP + channel number key
      blk(x0 + 5, 354, 36, 17, 'DUMP'); wht(x0 + 45, 354, 35, 17, String(ch + 1));
      // EQ: three bands in a gold bracket, frequency up-right, gain down-left
      p(`<rect x="${x0 + 3.5}" y="380" width="78" height="252" rx="2" fill="none" stroke="${GOLD}" stroke-width="1.1"/>`);
      const bands = [
        ['HI', BLUE, [[-150, '4.6'], [-100, '6'], [-50, '8'], [0, '11'], [50, '13'], [100, '14'], [150, '16']], 'KHz'],
        ['MID', SAGE, [[-150, '.18'], [-100, '.25'], [-50, '.5'], [-10, '1.5'], [30, '2'], [80, '4'], [120, '8'], [150, '10']], 'KHz'],
        ['LOW', RED, [[-150, '30'], [-60, '75'], [20, '150'], [90, '200'], [150, '250']], 'Hz'],
      ];
      bands.forEach(([bn, col, fm, unit], bi) => {
        const by = 384 + bi * 82;
        tx(x0 + 8, by + 13, bn, 10, WH, 'start', 800);
        if (bi === 0) circle(x0 + 30, by + 9, 2.4, '#0a0a0a');
        KN(x0 + 58, by + 28, 11, col, -100 + rnd() * 200, fm);
        KN(x0 + 25, by + 62, 11, col, (rnd() - 0.5) * 140, GAIN14);
      });
      // EQ in, filters, phase, channel
      const eqOn = ![5, 6, 15, 24, 25, 31].includes(ch);
      rnd2(x0 + 28, 648, 6, eqOn ? '#2a2a2a' : '#141414'); if (eqOn) circle(x0 + 28, 648, 2, '#59f07a', 'filter="url(#glowSm)"');
      rnd2(x0 + 58, 648, 6, '#141414'); rnd2(x0 + 28, 668, 6, ch === 2 ? '#fff8d8' : '#e9e7e0'); rnd2(x0 + 58, 668, 6, '#141414'); rnd2(x0 + 28, 688, 6, '#d8cfae');
      tx(x0 + 9, 651, 'IN', 7.5, WH, 'middle', 800); tx(x0 + 9, 671, 'Ø', 9, WH, 'middle', 800); tx(x0 + 10, 691, 'CHN', 6.5, WH, 'middle', 800);
      p(`<path d="M${x0 + 69} 652 L${x0 + 72} 645 L${x0 + 78} 645" fill="none" stroke="${WH}" stroke-width="1"/><path d="M${x0 + 69} 665 L${x0 + 75} 665 L${x0 + 78} 672" fill="none" stroke="${WH}" stroke-width="1"/>`);
      // sends: 1-2 yellow levels (PRE, WET); 3-4 and 5-6 pan + level (PRE, 2MIX)
      const sendHead = (y, nm) => { rect(x0 + 4, y, 77, 1.1, GOLD); tx(x0 + 80, y + 12, 'SEND', 9, GOLD, 'end', 800); tx(x0 + 80, y + 23, nm, 9, GOLD, 'end', 800); };
      const lv = (on) => (on ? -40 + rnd() * 120 : -150);
      sendHead(702, '1-2');
      KN(x0 + 22, 722, 11, YEL, lv(ch < 24 && [1, 15, 19, 20, 21].includes(ch)), [[-150, '∞'], [0, '1'], [150, '+3']]);
      blk(x0 + 4, 741, 30, 14, 'PRE'); KN(x0 + 56, 752, 11, YEL, lv([13, 14, 19].includes(ch)), [[-150, '∞'], [0, '2'], [150, '+3']]);
      blk(x0 + 4, 759, 30, 14, 'WET');
      sendHead(778, '3-4');
      KN(x0 + 22, 798, 11, BLUE, 0, [[0, 'C'], [-150, '3'], [150, '4']]);
      blk(x0 + 4, 817, 30, 14, 'PRE'); KN(x0 + 56, 828, 11, BLUE, lv(ch < 24), [[-150, '∞'], [0, 'LVL'], [150, '+3']]);
      sendHead(848, '5-6');
      KN(x0 + 22, 868, 11, RED, 0, [[0, 'C'], [-150, '5'], [150, '6']]);
      blk(x0 + 4, 887, 30, 14, 'PRE'); KN(x0 + 56, 898, 11, RED, lv(ch < 24 && ch % 3 === 0), [[-150, '∞'], [0, 'LVL'], [150, '+3']]);
      blk(x0 + 4, 905, 30, 14, '2MIX');
      rect(x0 + 4, 924, 77, 1.1, GOLD);
      p('</g>');
      // BUS level rotary below sends 5-6: feeds the assigned buses through the odd/even pan
      tx(x0 + 5, 880, 'BUS', 10, GOLD, 'start', 800); tx(x0 + 5, 892, 'LVL', 10, GOLD, 'start', 800);
      KN(x0 + 50, 897, 18, '#1d1d1f', 60, [[60, '0']], true);   // black; normally set to 0 dB (2 o'clock)
      tx(x0 + 27, 926, '∞', 8, WH, 'middle', 700); tx(x0 + 74, 926, '+10', 7.5, WH, 'middle', 700);
      // mute + numbered solo key, bus level and channel pan
      blk(x0 + 4, 930, 36, 18, 'MUTE', muted.has(ch)); wht(x0 + 44, 930, 36, 18, String(ch + 1), soloed.has(ch));
      const pan = ch === 7 || ch === 9 ? -110 : ch === 8 || ch === 10 ? 110 : ch % 2 ? 50 * (rnd() - 0.2) : -50 * (rnd() - 0.2);
      KN(x0 + 42, 970, 12, BLK, pan, [[0, 'C'], [-150, 'L'], [150, 'R']], true);
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
  const slotsY = uy + 8; uy += 34;
  unit(1, '#1a1b1e', (w, h) => {
    rect(30, 6, w - 60, h - 12, '#26292e', 'rx="3"');
    text(44, 35, 'VST3', 14, '#7fb0ff', 'start', 800);
    text(96, 35, 'Plate Reverb', 16, '#e8e4d8', 'start', 600);
    text(w - 44, 35, 'AUX 2 ▸', 14, '#e8c34a', 'end', 800);
  });
  for (let k = 0; k < 2; k++) unit(1, '#121315', (w, h) => {
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
  const by0 = uy, bh = RH - 30 - uy, bw = UW;
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
  text(ox + AL_W * K / 2, oy + AL_H * K + 170, 'Keyboard: Space play/stop · ← → wind · L locate · R record · digits enter a locate time', 26, '#a9a293', 'middle', 600);
});
const svg = out.join('\n');
const dir = path.join(__dirname, '..');
fs.writeFileSync(path.join(dir, 'analog-studio-mockup.svg'), svg);
const jh24 = require('./jh24.js')({ TX, TY, TW, TH });
// copy the live reel prototype next to the mockup so the tape machine view can load it
const protoSrc = path.join(__dirname, '..', '..', 'prototype', 'reels', 'dist', 'jh24-reels-local.html');
if (fs.existsSync(protoSrc)) fs.copyFileSync(protoSrc, path.join(__dirname, '..', 'tape-machine.html'));
const hot = (x, y, w, h, view, label) => `<div class="hot" data-open="${view}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" title="${label}"><span>${label}</span></div>`;
const overlay = (view, title, body, extra = '') => `<div class="overlay" id="ov-${view}" data-view="${view}" hidden><div class="ov-bar"><b>${title}</b>${extra}<button class="ov-close" type="button">✕ Close · Esc</button></div><div class="ov-body">${body}</div></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Analog Studio · 4K mockup</title>
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Archivo:wght@500;700;800&family=JetBrains+Mono:wght@700;800&display=block" rel="stylesheet">
<style>
  html,body{margin:0;background:#000;overflow:hidden;height:100%}
  #stage{position:absolute;left:0;top:0;width:3840px;height:2160px;transform-origin:0 0}
  #stage>svg{display:block}
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
</style></head><body><div id="stage">
${svg}
${jh24}
${scenes3d.join('\n')}
${hot(24, 76, 1360, 590, 'tape', 'Open the HJ-24')}
${hot(1408, 76, 290, 590, 'al', 'Open the AutoLocator III')}
${hot(1704, 60, 1578, 606, 'meters', 'Open the meter bridge')}
${hot(3340, 130, 450, 176, '224', 'Open the Leximan 224X')}
${hot(2857, 1280, 296, 462, '224', 'Open the Leximan 224X')}
${hot(3340, Math.round(globalThis.RACK_PB_Y || 1150), 450, 116, 'patchbay', 'Open the patchbay')}
${hot(3480, 8, 160, 40, 'patchbay', 'Open the patchbay')}
${overlay('tape', 'CMI HJ-24 · 24 TRACK', '<iframe title="HJ-24 tape machine" data-src="tape-machine.html"></iframe>')}
${overlay('al', 'CMI AUTOLOCATOR III', `<svg id="alSvg" width="3840" height="${OVH}" viewBox="0 0 3840 ${OVH}" style="display:block;user-select:none">${alView}</svg>`, '<span class="ov-msg" id="al-msg">Ready</span>')}
${overlay('meters', 'HJ-24 METER BRIDGE', `<svg width="3840" height="${OVH}" viewBox="0 0 3840 ${OVH}" style="display:block">${meterView}</svg>`)}
${overlay('224', 'LEXIMAN 224X DIGITAL REVERB', `<svg width="3840" height="${OVH}" viewBox="0 0 3840 ${OVH}" style="display:block">${lexView}</svg>`, '<span class="ov-param">BASS RT</span>')}
${overlay('patchbay', 'PATCHBAY', `<svg id="pbSvg" width="3840" height="${OVH}" viewBox="0 0 3840 ${OVH}" style="display:block;background:#0b0a09;touch-action:none"></svg>`, '<span class="ov-msg">Drag from an output (gold) to an input (blue). Click a cable to pull it.</span><span id="pb-count"></span><button id="pb-reset" type="button">Restore session</button><button id="pb-clear" type="button">Pull all</button>')}
</div>
<script>window.TAPE_DB = ${JSON.stringify(tapeDb.map((v) => Math.round(v * 10) / 10))};</script>
<script>${fs.readFileSync(path.join(__dirname, 'overlays.client.js'), 'utf8')}</script>
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
