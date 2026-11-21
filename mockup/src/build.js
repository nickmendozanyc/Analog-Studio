// Phase 0 static UI mockup generator for JH-Studio by NMAudiowerks.
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

// Track READY / SAFE keys and the record lamp, drawn in both states: the SAFE state as the base, the READY state in a
// .trk-on layer the page shows while the autolocator has the track armed. Clicking a key arms / disarms (pop-up).
function readySafe(i, xr, xs, y, bw, h, size) {
  button(xr, y, bw, h, 'red', false, 'READY', { size }); button(xs, y, bw, h, 'white', true, 'SAFE', { size });
  p(`<g class="trk-on" data-t="${i}" opacity="0">`); button(xr, y, bw, h, 'red', true, 'READY', { size }); button(xs, y, bw, h, 'white', false, 'SAFE', { size }); p('</g>');
  p(`<rect data-arm="${i}" data-k="ready" x="${xr}" y="${y}" width="${bw}" height="${h}" fill="transparent" style="cursor:pointer"><title>Track ${i + 1}: record ready</title></rect>`);
  p(`<rect data-arm="${i}" data-k="safe" x="${xs}" y="${y}" width="${bw}" height="${h}" fill="transparent" style="cursor:pointer"><title>Track ${i + 1}: safe</title></rect>`);
}
function recLamp(i, cx, cy, r) {
  circle(cx, cy, r, '#4a1612'); p(`<circle class="trk-on" data-t="${i}" cx="${cx}" cy="${cy}" r="${r}" fill="#ff3b2f" opacity="0" filter="url(#glow)"/>`);
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
text(40, 34, 'JH-STUDIO', 17, '#e9dcc0', 'start', 800, 'letter-spacing="4"'); text(176, 33, 'by NMAudiowerks', 10.5, '#a9a594', 'start', 700, 'letter-spacing="1.2"');
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
const TCI = 32;   // the JH-Tape cabinet is inset this much each side to hug its deck plate (checked against jh24.js)
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


// ---------------- JH-Tape audio electronics: three roll-out drawers of channel cards (manual section 4) ----------------
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
    vu(0, 0, 270, 202, -20, { needleId: i });
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
    <label>OPERATING LEVEL ${sel('el-ol', [['185', '185 nWb/m'], ['250', '250 nWb/m'], ['320', '320 nWb/m'], ['370', '370 nWb/m'], ['400', '400 nWb/m']], '400')}</label>
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


// ---------------- AL-III autolocator face (400 x 340 units, modelled on the AutoLocator III) ----------------
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
      // lamps above each meter: red record (live), blue status
      recLamp(i, x + w - 14, 14, 5.5);
      circle(x + w - 32, 14, 5.5, i === 23 ? '#5fb4ff' : '#16304a', i === 23 ? 'filter="url(#glow)"' : '');
      // recessed meter window, wide like the JH-Tape bridge meters
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
      readySafe(i, x + 2, x + 8 + bw, 190, bw, 30, 14);
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
    text(20, 31, 'JH-TAPE METER BRIDGE', 16, LEG, 'start', 800, 'letter-spacing="2"');
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
// CONSOLE (JH-Mix / JH-Mix style) — CSS 3D: knob panel + fader panel + armrest
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
  const consoleNames = [...tapeNames, '224 L', '224 R', 'S900', '', '', '', 'LIVE 1', 'TALK'];
  const busLit = (i) => (i < 24 ? [i] : []);   // channel n -> bus n (tracks 1-24); 25-32 unassigned
  const muted = new Set([23, 31]), soloed = new Set();   // the console is live: what it shows is what you hear (SMPTE on 24 and talkback muted)
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
    // JH-Mix series channel strip, laid out from the user's reference photos (top to bottom)
    const GOLD = '#d8c27c', WH = '#ece6da';
    const tx = (x, y, s2, size, col = WH, anchor = 'middle', w = 800) => text(x, y, s2, size, col, anchor, w);
    const blk = (x, y, w, h, label, lit = false, litCol = '#ff3b2f', bid) => {
      if (bid) p(`<g data-bid="${bid}" data-ch="${CH_NOW}" data-on="${lit ? 1 : 0}">`);
      rect(x - 0.5, y + 1.5, w + 1, h + 1, '#000', 'rx="2" opacity="0.6"');
      rect(x, y, w, h, '#151515', 'rx="2"'); rect(x, y, w, h, 'url(#btnOff)', 'rx="2"'); tx(x + w / 2, y + h / 2 + 3.4, label, 9.5, WH, 'middle', 800);
      p(`<g class="klit" opacity="${lit ? 1 : 0}">`); rect(x, y, w, h, litCol, 'rx="2" filter="url(#glow)"'); rect(x, y, w, h, 'url(#btnOff)', 'rx="2"'); tx(x + w / 2, y + h / 2 + 3.4, label, 9.5, '#1a0c08', 'middle', 800); p('</g>');
      if (bid) p('</g>');
    };
    const wht = (x, y, w, h, label, lit = false, bid) => {
      if (bid) p(`<g data-bid="${bid}" data-ch="${CH_NOW}" data-on="${lit ? 1 : 0}">`);
      rect(x - 0.5, y + 1.5, w + 1, h + 1, '#000', 'rx="2" opacity="0.6"');
      rect(x, y, w, h, '#e9e7e0', 'rx="2"');
      p(`<g class="klit" opacity="${lit ? 1 : 0}">`); rect(x, y, w, h, '#ffe14a', 'rx="2" filter="url(#glow)"'); p('</g>');
      rect(x, y, w, h, 'url(#btnOff)', 'rx="2" opacity="0.5"');
      tx(x + w / 2, y + h / 2 + 4, label, 11, '#1b1b1b', 'middle', 800);
      if (bid) p('</g>');
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
      KN(x0 + 23.5, 725, 11, YEL, lv([3, 7].includes(ch)), [[-122, '∞'], [0, '1'], [122, '+3']], false, 's1');
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
      KN(x0 + 50, 897, 18, '#1d1d1f', 107, [[107, '0']], true, 'buslvl');   // black; normally set to 0 dB (its 0 mark, about 4 o'clock on the -60 .. +10 scale)
      tx(x0 + 27, 926, '∞', 8, WH, 'middle', 700); tx(x0 + 74, 926, '+10', 7.5, WH, 'middle', 700);
      // mute + numbered solo key, bus level and channel pan
      blk(x0 + 4, 928, 36, 18, 'MUTE', muted.has(ch), '#ff3b2f', 'mute'); wht(x0 + 44, 928, 36, 18, String(ch + 1), soloed.has(ch), 'solo');
      const pan = ch === 24 ? -150 : ch === 25 ? 150 : ch === 4 ? -90 : ch === 5 ? 90 : ch === 7 || ch === 9 ? -110 : ch === 8 || ch === 10 ? 110 : ch % 2 ? 50 * (rnd() - 0.2) : -50 * (rnd() - 0.2);
      KN(x0 + 42, 972, 12, BLK, pan, [[0, 'C'], [-122, 'L'], [122, 'R']], true, 'pan');
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
      p(`<g class="cmi-fdr" data-ch="${ch}" data-y0="${cy.toFixed(2)}" data-pos="${faderPos[ch].toFixed(4)}">`);
      p(`<ellipse cx="${fx + 6}" cy="${cy + 10}" rx="22" ry="30" fill="#000" opacity="0.35" filter="url(#soft)"/>`);
      CAP(fx, cy, 34, 48, 18, 'white', ch >= 24 ? '#c89a20' : '#222');
      p('</g>');
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
    p(`<g class="cmi-mfdr" data-y0="${(top + 0.2 * (bot - top)).toFixed(2)}">`); CAP(mfx - 18, top + 0.2 * (bot - top), 32, 48, 22, 'yellow', '#111'); CAP(mfx + 18, top + 0.2 * (bot - top), 32, 48, 22, 'green', '#111'); p('</g>');
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
    // console meter bridge (JH-Mix style): two staggered rows of VUs, one per channel, stereo pair over the master
    const BY = Y - BRIDGE;
    rect(X, BY, PW, BRIDGE, 'url(#jh600)'); rect(X, BY, PW, BRIDGE, '#000', 'opacity="0.22"');
    rect(X, BY - 8, PW, 10, 'url(#oakH)');
    for (let j = 0; j < 16; j++) {
      const cx = X + j * 2 * 85 + 85;
      for (const [row, n] of [[0, 2 * j + 1], [1, 2 * j + 2]]) {
        const my = BY + 8 + row * 55;
        rect(cx - 56, my - 3, 112, 52, '#0d0c0b', 'rx="4"');
        vu(cx - 51, my + 1, 102, 46, -20, { label: String(n), fontScale: 0.13, needleId: 'c' + (n - 1) });
      }
    }
    for (let g = 1; g < 4; g++) rect(X + g * 8 * 85 - 1.5, BY, 3, BRIDGE, '#0a0a0b');
    { const mx = X + 32 * 85, mw = PW - 32 * 85; rect(mx, BY, 3, BRIDGE, '#000');
      vu(mx + 50, BY + 10, 156, 100, -20, { label: 'L', fontScale: 0.12, needleId: 'mL' }); vu(mx + mw - 206, BY + 10, 156, 100, -20, { label: 'R', fontScale: 0.12, needleId: 'mR' }); }
    rect(X, Y - 3, PW, 3, '#000', 'opacity="0.6"');
    p(`<g transform="translate(${X} ${Y})">${upper}</g>`);
    globalThis.CMI_FB = { x: X, y: Y + UD, w: PW, h: FD, top: 96, bot: 346, strip: STRIP, mfx: MXL + MWD - 54 };
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
// dbk 160X compressor / limiter (1U, after the 160X manual's panel drawing: logo, BYPASS, SLAVE, THRESHOLD, the three
// threshold lamps over OVER EASY, RATIO, OUTPUT GAIN, DISPLAY, 19-LED level meter over a 12-LED gain-reduction row)
const C160_LV = [-40, -30, -20, -15, -10, -8, -6, -5, -4, -3, -2, -1, 0, 1, 2, 4, 6, 10, 20];
const C160_KNOBS = { threshold: { min: -40, max: 20, sweep: 300, ticks: [[-40, '-40 dBm'], [-30, '-30'], [-20, '-20'], [-10, '-10'], [0, '0'], [10, '+10'], [20, '+20 dBm']] },
  ratio: { min: 0, max: 1, sweep: 320, ticks: [[0, '1:1'], [0.13, '2:1'], [0.27, '3:1'], [0.38, '4:1'], [0.5, '6:1'], [0.62, '10:1'], [0.7, '∞:1'], [0.79, '-5:1'], [0.9, '-2:1'], [1, '-1:1']] },
  outGain: { min: -20, max: 20, sweep: 300, ticks: [[-20, '-20 dB'], [-10, '-10'], [0, '0'], [10, '+10'], [20, '+20 dB']] } };
globalThis.C160_KNOBS = C160_KNOBS;
function c160Face(w, h, u) {
  // laid out from a photo of the real 160X: positions measured across the photographed panel (ear to ear, 945 x 83 px)
  // and mapped onto this one, which has the same 19 x 1.75 in proportions
  const W = '#e4e3e6', id = (k) => `c160-${u}-${k}`, X = (px) => (px - 40) * w / 945, Y = (py) => (py - 45) * h / 83;
  rect(0, 0, w, h, '#232127'); for (let yy = 1; yy < h; yy += 1.3) rect(0, yy, w, 0.35, '#fff', `opacity="${(0.015 + 0.02 * ((yy * 7.3) % 1)).toFixed(3)}"`);   // brushed
  rect(0, 0, w, 1.2, '#fff', 'opacity="0.1"'); rect(0, h - 1.5, w, 1.5, '#000', 'opacity="0.5"');
  for (const ex of [0, w - 22]) { rect(ex, 0, 22, h, '#1b1a1e'); rect(ex + (ex ? 0 : 21.2), 0, 0.8, h, '#000', 'opacity="0.5"'); for (const ey of [6.6, h - 6.6]) { rect(ex + 4, ey - 3, 14, 6, '#070707', 'rx="3"'); screw(ex + 11, ey, 3.6); } }
  text(X(155), Y(85), 'dbk', 17, '#cfcfd4', 'middle', 700, 'letter-spacing="0.5" font-stretch="125%"'); text(X(155), Y(102), '160X', 8.5, '#cfcfd4', 'middle', 900, 'letter-spacing="0.4"');
  const led = (x, y, col, dim, cls, r = 1.45) => { circle(x, y, r, dim); p(`<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="0" filter="url(#glowSm)"/>`); };
  const btn = (x, k, label) => { const y = Y(88); p(`<g data-cb="${u}:${k}" style="cursor:pointer">`); rect(x - 7.5, y, 15, 7, '#000', 'rx="0.8"'); rect(x - 6.9, y + 0.4, 13.8, 5.9, '#1c1c1e', 'rx="0.6"'); rect(x - 6.9, y + 0.4, 13.8, 1.4, '#fff', 'opacity="0.13" rx="0.6"'); p('</g>'); text(x, Y(116), label, 3.6, W, 'middle', 900, 'letter-spacing="0.3"'); };
  led(X(240), Y(70), '#ff3b2f', '#3a1412', id('bypass')); btn(X(240), 'bypass', 'BYPASS');
  led(X(287), Y(70), '#ffd23a', '#33301a', id('slave')); btn(X(287), 'slave', 'SLAVE');
  const COL = { threshold: '#d93a2e', ratio: '#2381da', outGain: '#33894f' };
  const knob = (cx, k, l1, l2) => {
    const K = C160_KNOBS[k], cy = Y(81), r = 6.3, ang = (v) => -K.sweep / 2 + (v - K.min) / (K.max - K.min) * K.sweep;
    const P = (a, rr) => [cx + rr * Math.sin(a * Math.PI / 180), cy - rr * Math.cos(a * Math.PI / 180)];
    if (k === 'ratio') { const [x0, y0] = P(ang(0.7), r + 2.1), [x1, y1] = P(ang(1), r + 2.1); p(`<path d="M${x0} ${y0} A${r + 2.1} ${r + 2.1} 0 0 1 ${x1} ${y1}" fill="none" stroke="#b9b8bd" stroke-width="2.2"/>`); }
    for (const [v, lab] of K.ticks) {
      const a = ang(v); const [x1, y1] = P(a, r + 1), [x2, y2] = P(a, r + 3.2), [tx, ty] = P(a, r + (k === 'ratio' ? 6.4 : 5.6));
      p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${W}" stroke-width="0.55"/>`);
      text(tx, ty + 0.9, lab, 2.6, W, 'middle', 700);
    }
    p(`<g data-ck="${u}:${k}" style="cursor:ns-resize">`);
    circle(cx + 0.5, cy + 0.9, r + 0.3, '#000', 'opacity="0.55"'); circle(cx, cy, r, COL[k]); circle(cx - r * 0.28, cy - r * 0.32, r * 0.62, '#fff', 'opacity="0.16"'); circle(cx, cy, r, 'none', 'stroke="#000" stroke-opacity="0.35" stroke-width="0.5"');
    p(`<g class="${id('k-' + k)}" transform="rotate(${ang(k === 'ratio' ? 0.38 : k === 'threshold' ? -10 : 0)} ${cx} ${cy})"><rect x="${cx - 0.45}" y="${cy - r + 0.5}" width="0.9" height="${r * 0.9}" rx="0.45" fill="#f4f4f4"/></g>`);
    p(`<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="transparent"/></g>`);
    text(cx, l2 ? Y(115) : Y(119), l1, 3.3, W, 'middle', 900, 'letter-spacing="0.3"'); if (l2) text(cx, Y(123), l2, 3.3, W, 'middle', 900, 'letter-spacing="0.3"');
  };
  knob(X(345), 'threshold', 'THRESHOLD');
  const tx = X(410); text(tx, Y(62), 'THRESHOLD', 3.4, W, 'middle', 900);
  led(tx - 6, Y(70), '#4fe07a', '#16301e', id('th-below'), 1.25); led(tx, Y(70), '#ffb02e', '#33281a', id('th-knee'), 1.25); led(tx + 6, Y(70), '#ff3b2f', '#3a1412', id('th-above'), 1.25);
  text(tx - 7, Y(79), 'BELOW', 2.5, W, 'middle', 800); text(tx + 7, Y(79), 'ABOVE', 2.5, W, 'middle', 800);
  btn(tx, 'overEasy', 'OVER EASY');
  knob(X(485), 'ratio', 'COMPRESSION', 'RATIO');
  knob(X(568), 'outGain', 'OUTPUT', 'GAIN');
  const dx = X(622); text(dx, Y(61), 'INPUT', 2.7, W, 'middle', 800); led(dx, Y(67), '#ff3b2f', '#3a1412', id('d-in'), 1.15); led(dx, Y(75), '#ff3b2f', '#3a1412', id('d-out'), 1.15); text(dx, Y(83), 'OUTPUT', 2.7, W, 'middle', 800);
  const lx = (i) => X(655) + i * (X(800) - X(655)) / 18, ly = Y(73), gy = Y(90);
  p(`<path d="M${dx + 2} ${Y(67)} H${dx + 6} V${ly} H${lx(0) - 2} M${dx + 2} ${Y(75)} H${dx + 6} V${ly}" fill="none" stroke="${W}" stroke-width="0.4"/>`);
  btn(dx, 'display', 'DISPLAY');
  // meters: 19 round LEDs (12 yellow, 7 red), the scale under them, then 12 red gain-reduction LEDs under the left 12
  C160_LV.forEach((d, i) => { led(lx(i), ly, d < 0 ? '#ffd23a' : '#ff3b2f', d < 0 ? '#35331c' : '#3a1614', id('lv' + i), 1.3); text(lx(i), Y(82), i === 0 ? '−40' : i === 18 ? '20+' : String(Math.abs(d)), 2.35, W, 'middle', 800); });
  text(lx(18) + 4, ly + 1.2, 'LEVEL', 3.2, W, 'start', 900);
  for (let j = 0; j < 12; j++) led(lx(j), gy, '#ff3b2f', '#3a1614', id('gr' + (11 - j)), 1.3);
  p(`<line x1="${lx(11) + 2.5}" y1="${gy}" x2="${lx(15)}" y2="${gy}" stroke="${W}" stroke-width="0.5"/>`); text(lx(15) + 2, gy + 1.2, 'GAIN REDUCTION', 3.2, W, 'start', 900);
  text(X(735), Y(108), 'COMPRESSOR/LIMITER', 3.8, W, 'middle', 900, 'letter-spacing="0.4"');
  p(`<text class="${id('route')}" x="${X(735)}" y="${Y(123)}" font-family="'JetBrains Mono', monospace" font-size="3.2" font-weight="700" fill="#e8a33a" text-anchor="middle">NOT PATCHED</text>`);
  text(w - 21, Y(123), u, 4, '#8e8c92', 'end', 900);
}
// A 19-inch panel: 498 x (46n - 2) units, ears with slotted holes and rack screws at the EIA positions. Faces drawn for
// the old 450 x (60n - 4) size are scaled evenly and centred between the ears; native faces are drawn at full size.
// exact EIA-310 proportions: 1U = 1.75 in on a 19 in panel; a panel is 1/32 in shorter than its rack space
const PNL = { U: 498 * 1.75 / 19, GAP: 498 * (1 / 32) / 19, PW: 498, UW: 450, EAR: 22 };
function panelBase(n, fill, h) {
  const { PW, EAR, U } = PNL;
  rect(0, 0, PW, h, fill, 'rx="1.5"');
  rect(0, 0, PW, 1.5, '#fff', 'opacity="0.14"'); rect(0, h - 1.5, PW, 1.5, '#000', 'opacity="0.55"');
  for (const ex of [0, PW - EAR]) {
    rect(ex, 0, EAR, h, '#000', 'opacity="0.18"'); rect(ex + (ex ? 0 : EAR - 0.8), 0, 0.8, h, '#000', 'opacity="0.45"');
    for (let u = 0; u < n; u++) for (const hy of [6.6, U - 8.6]) { const cy = u * U + hy; rect(ex + 4, cy - 3, EAR - 8, 6, '#070707', 'rx="3"'); screw(ex + EAR / 2, cy, 3.6); }
  }
}
// the whole panel as SVG markup, for a pop-up: 19 in shown 19 in wide on a 60-inch 4K screen (73.4 px per inch)
const PX_PER_IN = 3840 / (60 * 16 / Math.hypot(16, 9));
function panelSVG(n, fill, draw, o = {}) {
  const h = n * PNL.U - PNL.GAP, nh = n * 60 - 4, k = h / nh, ox = (PNL.PW - PNL.UW * k) / 2, wpx = Math.round(19 * PX_PER_IN * 1.5);   // 1.5 x the real 19 inches on a 60-inch screen: easier to work
  const art = capture(() => { if (o.native) { draw(PNL.PW, h); return; } panelBase(n, fill, h); p(`<g transform="translate(${ox.toFixed(2)} 0) scale(${k.toFixed(4)})">`); draw(PNL.UW, nh); p('</g>'); });
  return `<svg width="${wpx}" height="${Math.round(wpx * h / PNL.PW)}" viewBox="0 0 ${PNL.PW} ${h.toFixed(3)}" style="display:block;margin:0 auto">${art}</svg>`;
}
// ---------------- Publizon IM90 "Infernal Machine 90" (3U) and its remote, drawn from photos of the originals ----------------
const IM_KEYS = [['user', 'USER GUIDE'], ['aux', 'AUX'], ['gains', 'GAINS'], ['min', 'MEMORY IN'], ['mout', 'MEMORY OUT'], ['msel', 'MEMORY SELECT'], ['param', 'PARAMETERS'], ['func', 'FUNCTIONS']];
const IM_PAD = [['7', '7'], ['8', '8'], ['9', '9'], ['4', '4'], ['5', '5'], ['6', '6'], ['1', '1'], ['2', '2'], ['3', '3'], ['minus', '−'], ['0', '0'], ['plus', '+']];
const imMeterSeg = (x0, y0, w, hh, cls, n = 16) => { for (let i = 0; i < n; i++) { const sw = w / n, col = i < 10 ? '#59e05a' : i < 12 ? '#f2d33a' : '#ff4a2e'; rect(x0 + i * sw + 0.2, y0, sw - 0.4, hh, '#2a2a2a'); p(`<rect class="${cls}-${i}" x="${(x0 + i * sw + 0.2).toFixed(2)}" y="${y0}" width="${(sw - 0.4).toFixed(2)}" height="${hh}" fill="${col}" opacity="0"/>`); } };
function im90Face(w, h) {
  // the photographed panel (rack ears at 22..100 px, content to 1180, height 205..515) mapped onto this 3U panel
  const X = (px) => 26 + (px - 100) * (w - 52) / 1080, Y = (py) => (py - 205) * h / 310, IV = '#ece6d6', RED = '#e2553c', SERIF = `'Times New Roman', Georgia, serif`;
  rect(0, 0, w, h, '#16161a', 'rx="1.5"'); rect(0, 0, w, 1.2, '#fff', 'opacity="0.12"'); rect(0, h - 1.4, w, 1.4, '#000', 'opacity="0.5"');
  for (const ex of [0, w - 22]) { rect(ex, 0, 22, h, '#0d0d10'); rect(ex + (ex ? 0 : 21.2), 0, 0.8, h, '#000', 'opacity="0.6"'); for (let u = 0; u < 3; u++) for (const hy of [6.6, PNL.U - 8.6]) { const cy = u * PNL.U + hy; rect(ex + 4, cy - 3, 14, 6, '#050505', 'rx="3"'); screw(ex + 11, cy, 3.6); } }
  const frame = (x0, y0, x1, y1) => p(`<rect x="${X(x0)}" y="${Y(y0)}" width="${X(x1) - X(x0)}" height="${Y(y1) - Y(y0)}" rx="2.2" fill="none" stroke="#cfcac0" stroke-width="0.6"/>`);
  const T = (px, py, t, sz, col = IV, anchor = 'middle', wt = 800, ex = '') => text(X(px), Y(py), t, sz, col, anchor, wt, ex);
  T(230, 236, 'PUBLIZON', 7.4, IV, 'middle', 700, `font-family="${SERIF}" letter-spacing="0.9"`); T(535, 236, 'INFERNAL MACHINE 90', 7.4, IV, 'middle', 700, `font-family="${SERIF}" letter-spacing="0.9"`); T(940, 236, 'STEREO AUDIO COMPUTER', 7.4, IV, 'middle', 700, `font-family="${SERIF}" letter-spacing="0.9"`);
  // the four level meters, -24 .. +18 dBm
  [['A  INPUT', 260], ['A1 A2 OUTPUTS', 296], ['B  INPUT', 332], ['B1 B2 OUTPUTS', 368]].forEach(([l, y0], i) => {
    frame(145, y0, 282, y0 + 32); T(213, y0 + 8.5, '-24 -18 -12  -6   0   6  12  18', 2.2, IV, 'middle', 700, 'xml:space="preserve"');
    imMeterSeg(X(152), Y(y0 + 11), X(275) - X(152), 1.8, `im90-lv${i}`); T(213, y0 + 27, l, 3.3, RED, 'middle', 800, 'font-style="italic"');
  });
  p(`<path d="M${X(160)} ${Y(400)} L${X(170)} ${Y(410)} M${X(268)} ${Y(400)} L${X(258)} ${Y(410)}" stroke="#cfcac0" stroke-width="0.6" fill="none"/>`);
  frame(145, 476, 282, 505); T(213, 494, 'AUDIO LEVELS  dBm', 3.4, IV, 'middle', 800, 'font-style="italic" xml:space="preserve"');
  // displays, memory numbers, SET keys
  frame(295, 257, 978, 432);
  for (const [k, y0, mc] of [['A', 280, '#ff3b2f'], ['B', 368, '#ffb02e']]) {
    rect(X(330), Y(y0), X(785) - X(330), Y(y0 + 33) - Y(y0), '#041210', 'rx="1"');
    p(`<text class="im90-d${k}" x="${X(336)}" y="${Y(y0 + 24)}" font-family="${MONO2}" font-size="8.6" font-weight="700" fill="#5df0c2" filter="url(#glowSm)" xml:space="preserve" textLength="${(X(780) - X(336)).toFixed(1)}" lengthAdjust="spacingAndGlyphs"> </text>`);
    rect(X(812), Y(y0), X(872) - X(812), Y(y0 + 33) - Y(y0), '#120404', 'rx="1"');
    p(`<text class="im90-m${k}" x="${X(842)}" y="${Y(y0 + 25)}" font-family="${MONO2}" font-size="10" font-weight="700" fill="${mc}" filter="url(#glowSm)" text-anchor="middle">000</text>`);
    const ky = k === 'A' ? 296 : 385, col = k === 'A' ? '#f06a3a' : '#e6ea5c';
    p(`<g data-ik="set${k}" style="cursor:pointer"><ellipse cx="${X(918)}" cy="${Y(ky) + 0.8}" rx="${X(948) - X(918)}" ry="${Y(ky + 18) - Y(ky)}" fill="#000" opacity="0.5"/><ellipse cx="${X(918)}" cy="${Y(ky)}" rx="${X(948) - X(918)}" ry="${Y(ky + 18) - Y(ky)}" fill="${col}"/><ellipse cx="${X(910)}" cy="${Y(ky - 6)}" rx="${(X(948) - X(918)) * 0.55}" ry="${(Y(ky + 18) - Y(ky)) * 0.4}" fill="#fff" opacity="0.25"/></g>`);
    p(`<circle class="im90-kl-set${k}" cx="${X(942)}" cy="${Y(ky - 2)}" r="1.2" fill="#fff" opacity="0" filter="url(#glowSm)"/>`);
  }
  T(557, 326, 'A CHANNEL DISPLAY', 2.6, RED); T(842, 326, 'A  MEMORY', 2.6, IV, 'middle', 800, 'xml:space="preserve"'); T(918, 326, 'SET A', 2.8, IV);
  T(557, 361, 'B CHANNEL DISPLAY', 2.6, RED); T(842, 361, 'B  MEMORY', 2.6, IV, 'middle', 800, 'xml:space="preserve"'); T(918, 361, 'SET B', 2.8, IV);
  // the eight function keys
  frame(297, 443, 978, 507);
  const ok = (cx, cy, rx, ry, id, col = '#f07040') => { p(`<g data-ik="${id}" style="cursor:pointer"><ellipse cx="${cx}" cy="${cy + 0.7}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.5"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${col}"/><ellipse cx="${cx - rx * 0.2}" cy="${cy - ry * 0.35}" rx="${rx * 0.6}" ry="${ry * 0.4}" fill="#fff" opacity="0.22"/></g>`); };
  IM_KEYS.forEach(([id, l], i) => { const cx = X(355 + i * 80.4), cy = Y(466); ok(cx, cy, X(383) - X(355), Y(482) - Y(466), id); circle(cx + (X(383) - X(355)) * 0.85, cy - 0.3, 1.25, '#8e8e8e'); p(`<circle class="im90-kl-${id}" cx="${cx + (X(383) - X(355)) * 0.85}" cy="${cy - 0.3}" r="1.25" fill="#ffd23a" opacity="0" filter="url(#glowSm)"/>`); T(355 + i * 80.4, 496, l, 2.7, IV, 'middle', 800); });
  // keypad, ENTER, ON / OFF
  frame(992, 257, 1132, 462);
  IM_PAD.forEach(([id, l], i) => { const cx = X(1025 + (i % 3) * 40), cy = Y(288 + Math.floor(i / 3) * 35); ok(cx, cy, X(1041) - X(1025), Y(299) - Y(288), id); text(cx, cy + 1.6, l, 4.6, '#2a1208', 'middle', 900); });
  ok(X(1065), Y(428), X(1077) - X(1065), Y(436) - Y(428), 'enter'); T(1065, 449, 'ENTER', 2.6, IV);
  frame(992, 474, 1132, 506); T(1018, 494, 'ON', 3.2, IV); ok(X(1062), Y(490), X(1078) - X(1062), Y(499) - Y(490), 'power'); T(1105, 494, 'OFF', 3.2, IV);
}
function im90Remote(w, h) {
  // the photographed remote (body 95..1130 x 290..565 px) mapped onto w x h
  const X = (px) => (px - 95) * w / 1035, Y = (py) => (py - 290) * h / 275, IV = '#e6e2d8', RED = '#e03a2c', SERIF = `'Times New Roman', Georgia, serif`;
  rect(0, 0, w, h, '#2b4fb4', 'rx="6"'); rect(0, 0, w, 2, '#fff', 'opacity="0.18" rx="6"'); rect(X(108), Y(303), X(1117) - X(108), Y(553) - Y(303), '#141416', 'rx="4"');
  const ln = (d) => p(`<path d="${d}" stroke="#bdb8ae" stroke-width="0.7" fill="none"/>`);
  ln(`M${X(312)} ${Y(312)} V${Y(545)} M${X(835)} ${Y(312)} V${Y(545)} M${X(312)} ${Y(365)} H${X(835)} M${X(312)} ${Y(492)} H${X(835)}`);
  const key = (cx, cy, ww, hh, id, col, lab, labCol = '#1a0c08', sz = 5.6) => { p(`<g data-ik="${id}" style="cursor:pointer"><rect x="${cx - ww / 2}" y="${cy - hh / 2 + 0.8}" width="${ww}" height="${hh}" rx="2.4" fill="#000" opacity="0.5"/><rect x="${cx - ww / 2}" y="${cy - hh / 2}" width="${ww}" height="${hh}" rx="2.4" fill="${col}"/><rect x="${cx - ww / 2}" y="${cy - hh / 2}" width="${ww}" height="${hh * 0.4}" rx="2.4" fill="#fff" opacity="0.14"/></g>`); if (lab) { const L = lab.split('\n'); L.forEach((t, j) => text(cx, cy + sz * 0.36 + (j - (L.length - 1) / 2) * sz * 1.05, t, sz, labCol, 'middle', 900)); } };
  IM_PAD.forEach(([id, l], i) => key(X(160 + (i % 3) * 50), Y(352 + Math.floor(i / 3) * 43.5), X(208) - X(160), Y(378) - Y(352), id, '#d8342c', l, '#1a0c08', 7));
  key(X(224), Y(525), X(298) - X(150), Y(538) - Y(512), 'enter', '#d8342c', 'ENTER', '#1a0c08', 4.6);
  [['INPUT A', 320, 435], ['OUTPUTS A1 A2', 450, 565], ['INPUT B', 578, 690], ['OUTPUTS B1 B2', 705, 820]].forEach(([l, x0, x1], i) => {
    text((X(x0) + X(x1)) / 2, Y(327), '-18  -12   -6    0    6   12   18', 3, IV, 'middle', 700, 'xml:space="preserve"');
    imMeterSeg(X(x0), Y(333), X(x1) - X(x0), Y(341) - Y(333), `im90-lv${i}`, 14); text((X(x0) + X(x1)) / 2, Y(357), l, 4.2, RED, 'middle', 800, 'font-style="italic"');
  });
  text(X(572), Y(390), 'PUBLIZON  IM90  REMOTE CONTROL', 8.2, IV, 'middle', 700, `font-family="${SERIF}" font-style="italic" letter-spacing="0.8" xml:space="preserve"`);
  text(X(520), Y(405), 'A CHANNEL  DISPLAY', 3.4, RED, 'middle', 800, 'font-style="italic" xml:space="preserve"'); text(X(520), Y(472), 'B CHANNEL  DISPLAY', 3.4, '#e2b23a', 'middle', 800, 'font-style="italic" xml:space="preserve"');
  rect(X(330), Y(410), X(725) - X(330), Y(458) - Y(410), '#04101a', 'rx="1.5"');
  for (const [k, yy] of [['A', 430], ['B', 451]]) p(`<text class="im90-d${k}" x="${X(338)}" y="${Y(yy)}" font-family="${MONO2}" font-size="7.6" font-weight="700" fill="#6ad8ff" filter="url(#glowSm)" xml:space="preserve" textLength="${(X(718) - X(338)).toFixed(1)}" lengthAdjust="spacingAndGlyphs"> </text>`);
  text(X(793), Y(405), 'MEMORY A', 3.4, RED, 'middle', 800, 'font-style="italic"'); text(X(793), Y(472), 'MEMORY B', 3.4, '#e2b23a', 'middle', 800, 'font-style="italic"');
  rect(X(765), Y(410), X(822) - X(765), Y(458) - Y(410), '#04101a', 'rx="1.5"');
  for (const [k, yy] of [['A', 430], ['B', 451]]) p(`<text class="im90-m${k}" x="${X(793)}" y="${Y(yy)}" font-family="${MONO2}" font-size="7.6" font-weight="700" fill="#6ad8ff" filter="url(#glowSm)" text-anchor="middle">000</text>`);
  IM_KEYS.forEach(([id, l], i) => { const cx = X(355 + i * 62); rect(cx - 2.2, Y(495), 4.4, 2.4, '#8a8a8a', 'rx="0.6"'); p(`<rect class="im90-kl-${id}" x="${cx - 2.2}" y="${Y(495)}" width="4.4" height="2.4" rx="0.6" fill="#ffb02e" opacity="0" filter="url(#glowSm)"/>`); key(cx, Y(524), X(404) - X(355), Y(536) - Y(512), id, '#d8342c', l.replace(' ', '\n').replace('PARAMETERS', 'PARA\nMETERS'), '#1a0c08', 3); });
  // the wheel, and the channel keys
  text(X(860), Y(347), '−', 9, IV, 'middle', 900); text(X(1030), Y(347), '+', 9, IV, 'middle', 900); rect(X(852), Y(330), 7, 1.6, '#bdb8ae'); rect(X(1022), Y(330), 7, 1.6, '#bdb8ae');
  p(`<g data-iw="1" style="cursor:grab"><circle cx="${X(945)}" cy="${Y(412) + 1.5}" r="${X(1005) - X(945)}" fill="#000" opacity="0.5"/><circle cx="${X(945)}" cy="${Y(412)}" r="${X(1005) - X(945)}" fill="#0c0c0d" stroke="#3c3c40" stroke-width="1.4"/><circle cx="${X(945)}" cy="${Y(412)}" r="${X(1005) - X(945) - 4}" fill="none" stroke="#1f1f22" stroke-width="0.8"/><circle cx="${X(945)}" cy="${Y(412)}" r="${X(1005) - X(945)}" fill="url(#bezelHi)" opacity="0.35"/>`);
  p(`<g class="im90-wheel" transform="rotate(0 ${X(945)} ${Y(412)})"><circle cx="${X(945)}" cy="${Y(452)}" r="${X(960) - X(945)}" fill="#050505" stroke="#2a2a2a" stroke-width="0.6"/></g></g>`);
  for (const [k, xx, col] of [['setA', 865, '#ff3b2f'], ['setB', 985, '#ffb02e']]) { rect(X(xx) - 3, Y(495), 6, 2.6, '#5a5a5a', 'rx="0.8"'); p(`<rect class="im90-kl-${k}" x="${X(xx) - 3}" y="${Y(495)}" width="6" height="2.6" rx="0.8" fill="${col}" opacity="0" filter="url(#glowSm)"/>`); }
  key(X(865), Y(527), X(911) - X(865), Y(539) - Y(515), 'onlyA', '#d8342c', 'A', '#1a0c08', 6.4); key(X(925), Y(527), X(971) - X(925), Y(539) - Y(515), 'bothAB', '#d8342c', 'A&B', '#1a0c08', 5.4); key(X(985), Y(527), X(1031) - X(985), Y(539) - Y(515), 'onlyB', '#e6d23a', 'B', '#1a0c08', 6.4);
}
// Yahaha SPX90II (1U), after the operating manual's panel: POWER, INPUT, the smoked window (logo, 7-LED meter, 2-digit
// memory number, 16 x 2 LCD), then PARAMETER, DATA, BALANCE, STORE, MEMORY, RECALL, UTILITY, FOOT TRIGGER / BYPASS
function spxFace(w, h, u) {
  // drawn from photos of the real unit: the teal-outlined display window (logo, green LED meter, big red memory number,
  // dark LCD with amber characters), and keys in teal-outlined groups with their legends printed on them
  const W = '#e8e6e0', T = '#3cc98a', id = (k) => `spx-${u}-${k}`, X = (pct) => pct / 100 * w;
  rect(0, 0, w, h, '#141416'); rect(0, 0, w, 1.2, '#fff', 'opacity="0.12"'); rect(0, h - 1.4, w, 1.4, '#000', 'opacity="0.5"');
  for (const ex of [0, w - 22]) { rect(ex, 0, 22, h, '#101012'); rect(ex + (ex ? 0 : 21.2), 0, 0.8, h, '#000', 'opacity="0.6"'); for (const ey of [6.6, h - 6.6]) { rect(ex + 4, ey - 3, 14, 6, '#060606', 'rx="3"'); screw(ex + 11, ey, 3.6); } }
  const box = (x0, y0, x1, y1) => p(`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="1.2" fill="none" stroke="${T}" stroke-width="0.6"/>`);
  const key = (cx, cy, k, label, ww = 11, hh = 9, arrow = 0) => {
    p(`<g data-sk="${u}:${k}" style="cursor:pointer">`); rect(cx - ww / 2, cy - hh / 2 + 0.5, ww, hh, '#000', 'rx="0.8"'); rect(cx - ww / 2, cy - hh / 2, ww, hh, '#1b1b1e', `rx="0.8" stroke="${T}" stroke-width="0.45"`); rect(cx - ww / 2, cy - hh / 2, ww, hh * 0.3, '#fff', 'opacity="0.07" rx="0.8"');
    if (arrow) p(`<path d="M${cx - 4} ${cy + arrow * 2.6} L${cx} ${cy - arrow * 3} L${cx + 4} ${cy + arrow * 2.6} Z" fill="none" stroke="${W}" stroke-width="0.5"/>`);
    p('</g>');
    if (label) label.split('\n').forEach((t, j, a) => text(cx, cy + 1 + (j - (a.length - 1) / 2) * 2.9, t, 2.35, W, 'middle', 800, 'letter-spacing="0.15"'));
  };
  const led = (x, y, cls, col = '#ff3b2f') => { circle(x, y, 0.95, '#3a1412'); p(`<circle class="${cls}" cx="${x}" cy="${y}" r="0.95" fill="${col}" opacity="0" filter="url(#glowSm)"/>`); };
  // positions measured across the photographed panel (ears included)
  text(X(5.6), 11.5, 'POWER', 2.3, W, 'middle', 800); key(X(5.6), 21.5, 'power', '', 7, 9); text(X(5.6), 30.5, 'ON ⇵ OFF', 2, W, 'middle', 700);
  p(`<g data-sk="${u}:input" style="cursor:ns-resize"><circle cx="${X(9.2)}" cy="21" r="3.8" fill="#0a0a0b"/><circle cx="${X(9.2)}" cy="21" r="3.1" fill="#2a2a2e"/><g class="${id('in')}" transform="rotate(60 ${X(9.2)} 21)"><rect x="${X(9.2) - 0.35}" y="18" width="0.7" height="2.2" fill="${W}"/></g><circle cx="${X(9.2)}" cy="21" r="6.5" fill="transparent"/></g>`);
  text(X(9.2), 11.5, 'INPUT', 2.3, W, 'middle', 800); text(X(9.2) - 3.6, 28.5, '0', 1.9, W, 'middle', 700); text(X(9.2) + 3.6, 28.5, '10', 1.9, W, 'middle', 700);
  // the display window: logo, LED meter, memory number, LCD
  const wx0 = X(12), wx1 = X(41);
  rect(wx0, 6.5, wx1 - wx0, h - 13, '#08090a', 'rx="1"'); box(wx0, 6.5, wx1, h - 6.5);
  text(X(13.4), 18.5, 'YAHAHA', 3.3, W, 'start', 900, 'letter-spacing="0.6"');
  text(X(13.4), 26.5, 'SPX90II', 5.4, 'none', 'start', 900, `stroke="${T}" stroke-width="0.45" letter-spacing="0.3"`);
  const MV = [[0, '#ff4a2e'], [-3, '#ffd23a'], [-6, '#59e05a'], [-10, '#59e05a'], [-15, '#59e05a'], [-20, '#59e05a'], [-30, '#59e05a']];
  MV.forEach(([l, col], i) => { const y = 10.6 + i * 3.25; rect(X(20.6), y - 1.1, 2.6, 2.2, '#2a2d2a'); p(`<rect class="${id('m' + i)}" x="${X(20.6)}" y="${y - 1.1}" width="2.6" height="2.2" fill="${col}" opacity="0" filter="url(#glowSm)"/>`); text(X(20.6) + 3.6, y + 0.8, String(l), 1.8, W, 'start', 800); });
  p(`<text class="${id('mem')}" x="${X(25.6)}" y="25.5" font-family="${MONO2}" font-size="12" font-weight="700" fill="#ff2a1a" filter="url(#glowSm)" text-anchor="middle" letter-spacing="0.6">01</text>`);
  text(X(25.6), 32.5, 'MEMORY', 2.2, W, 'middle', 800);
  rect(X(29.2), 11, X(40.2) - X(29.2), 21, '#1f2418', 'rx="0.6"');
  for (const [k2, y] of [['l1', 19.8], ['l2', 28.4]]) p(`<text class="${id(k2)}" x="${X(29.6)}" y="${y}" font-family="${MONO2}" font-size="6.6" font-weight="700" fill="#e6c43a" filter="url(#glowSm)" xml:space="preserve" textLength="${(X(39.8) - X(29.6)).toFixed(1)}" lengthAdjust="spacingAndGlyphs"> </text>`);
  // the keys: black squares outlined in green, arrows stacked
  const K = 12.6, A2 = 13.6;
  key(X(44), 22, 'param', 'PARAM-\nETER', K, K); led(X(44), 17.2, id('led-param'));
  key(X(47.7), 22 - A2 / 2, 'dup', '', A2, A2, 1); key(X(47.7), 22 + A2 / 2, 'ddn', '', A2, A2, -1);
  key(X(51.4), 22, 'bal', 'BALANCE', K, K);
  key(X(56), 22, 'store', 'STORE', K, K);
  key(X(60.2), 22 - A2 / 2, 'mup', '', A2, A2, 1); key(X(60.2), 22 + A2 / 2, 'mdn', '', A2, A2, -1);
  key(X(64.5), 22, 'recall', 'RECALL', K, K);
  key(X(69.8), 22, 'util', 'UTILITY', K, K); led(X(69.8), 17.2, id('led-util'));
  key(X(74.3), 22 - A2 / 2, 'ftrg', 'FOOT\nTRIGGER', A2, A2); led(X(74.3), 22 - A2 / 2 - 4.6, id('led-ftrg'));
  key(X(74.3), 22 + A2 / 2, 'byp', 'BYPASS', A2, A2); led(X(74.3) + 5, 22 + A2 / 2 - 4.6, id('led-byp'));
  for (const [k2, y, l] of [['foot', 22 - A2 / 2, 'MEMORY\nTRIGGER'], ['footb', 22 + A2 / 2, 'BYPASS']]) {
    p(`<line x1="${X(74.3) + A2 / 2}" y1="${y}" x2="${X(80.8) - 3}" y2="${y}" stroke="${W}" stroke-width="0.35"/>`);
    p(`<g data-sk="${u}:${k2}" style="cursor:pointer"><circle cx="${X(80.8)}" cy="${y}" r="2.9" fill="#9a9da3"/><circle cx="${X(80.8)}" cy="${y}" r="1.6" fill="#050505"/><circle cx="${X(80.8)}" cy="${y}" r="4.4" fill="transparent"/></g>`);
    l.split('\n').forEach((t, j, a3) => text(X(83.2), y + 0.8 + (j - (a3.length - 1) / 2) * 2.7, t, 2.3, W, 'start', 800));
  }
  text(X(92.4), h - 3.2, u, 3, '#8e8c92', 'middle', 900);
  p(`<text class="${id('route')}" x="${X(26.5)}" y="${h - 1.6}" font-family="${MONO2}" font-size="2.3" font-weight="700" fill="#e8a33a" text-anchor="middle">NOT PATCHED</text>`);
}
// Evertide H949 Harmonizer (2U), drawn from the user's photo (panel 10..770 x 113..234 px)
const H949_KEYS = [6.25, 12.5, 25, 50, 100, 200];
function h949Face(w, h) {
  const W = '#ece8de', X = (px) => (px - 10) * w / 760, Y = (py) => (py - 113) * h / 121, id = (k) => `h949-${k}`;
  rect(0, 0, w, h, '#151517', 'rx="1.5"'); rect(0, 0, w, 1.2, '#fff', 'opacity="0.1"'); rect(0, h - 1.5, w, 1.5, '#000', 'opacity="0.5"');
  for (const ex of [0, w - 22]) { rect(ex, 0, 22, h, '#111113'); for (const ey of [6.6, PNL.U - 8.6, PNL.U + 6.6, h - 6.6]) { rect(ex + 4, ey - 3, 14, 6, '#060606', 'rx="3"'); screw(ex + 11, ey, 3.6); } }
  const frame = (x0, y0, x1, y1) => p(`<rect x="${X(x0)}" y="${Y(y0)}" width="${X(x1) - X(x0)}" height="${Y(y1) - Y(y0)}" rx="1.4" fill="none" stroke="#d8d4ca" stroke-width="0.55"/>`);
  const T = (px, py, t, sz, col = W, a = 'middle', wt = 800, ex = '') => text(X(px), Y(py), t, sz, col, a, wt, ex);
  const knob = (px, py, r, k, big) => { p(`<g data-hk="${k}" style="cursor:ns-resize"><circle cx="${X(px)}" cy="${Y(py) + 0.6}" r="${r}" fill="#000" opacity="0.6"/><circle cx="${X(px)}" cy="${Y(py)}" r="${r}" fill="#1c1c1e"/><circle cx="${X(px)}" cy="${Y(py)}" r="${r * 0.8}" fill="#262628"/><g class="${id('k-' + k)}" transform="rotate(0 ${X(px)} ${Y(py)})"><rect x="${X(px) - 0.4}" y="${Y(py) - r + 0.6}" width="0.8" height="${r * 0.55}" fill="${W}"/></g><circle cx="${X(px)}" cy="${Y(py)}" r="${r + 4}" fill="transparent"/></g>`); if (big) for (let a = -150; a <= 150; a += 30) { const s2 = Math.sin(a * Math.PI / 180), c2 = -Math.cos(a * Math.PI / 180); p(`<line x1="${X(px) + s2 * (r + 1)}" y1="${Y(py) + c2 * (r + 1)}" x2="${X(px) + s2 * (r + 2.4)}" y2="${Y(py) + c2 * (r + 2.4)}" stroke="${W}" stroke-width="0.4"/>`); } };
  const ckey = (px, py, k, lamp) => { const s2 = 4.6; p(`<g data-hk="${k}" style="cursor:pointer"><rect x="${X(px) - s2 / 2}" y="${Y(py) - s2 / 2 + 0.5}" width="${s2}" height="${s2}" rx="0.5" fill="#000"/><rect x="${X(px) - s2 / 2}" y="${Y(py) - s2 / 2}" width="${s2}" height="${s2}" rx="0.5" fill="#e9e1cc"/><rect class="${id('kd-' + k)}" x="${X(px) - s2 / 2}" y="${Y(py) - s2 / 2}" width="${s2}" height="${s2}" rx="0.5" fill="#000" opacity="0"/></g>`); if (lamp) { circle(X(px), Y(py) - 5, 0.9, '#3a1412'); p(`<circle class="${id('l-' + k)}" cx="${X(px)}" cy="${Y(py) - 5}" r="0.9" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); } };
  T(395, 127, 'E V E R T I D E   H A R M O N I Z E R ™', 4.2, W, 'middle', 900, 'xml:space="preserve"'); T(612, 128, 'MODEL H949', 2.8, W);
  // input level
  frame(58, 131, 178, 193); T(100, 140, 'INPUT LEVEL', 2.7, W);
  [['LIMIT', '#ff3b2f'], ['', '#59e05a'], ['NOMINAL', '#59e05a'], ['', '#59e05a'], ['PRESENT', '#ffd23a']].forEach(([l, col], i) => { const y = Y(150 + i * 8); circle(X(95), y, 1.1, '#2a2a2a'); p(`<circle class="${id('m' + i)}" cx="${X(95)}" cy="${y}" r="1.1" fill="${col}" opacity="0" filter="url(#glowSm)"/>`); if (l) text(X(88), y + 0.8, l, 2, col === '#ffd23a' ? '#ffd23a' : col, 'end', 800); });
  knob(133, 172, 4.4, 'input', true); T(133, 190, 'MIN    MAX', 1.8, W, 'middle', 700, 'xml:space="preserve"');
  ckey(162, 152, 'repeat', true); T(162, 160, 'REPEAT', 1.8, W);
  // feedback
  frame(182, 131, 350, 193); T(266, 140, 'FEEDBACK', 2.9, W);
  T(228, 147, 'LEVEL', 2.2, W); T(305, 147, 'EQ', 2.2, W);
  [['fbm', 210, 'MAIN', 'OFF   MAX'], ['fbd', 248, 'DLY ONLY', 'OFF   MAX'], ['eql', 288, 'LOW', 'CUT  BOOST'], ['eqh', 323, 'HIGH', 'CUT  BOOST']].forEach(([k, px, l, sc]) => { T(px, 155, l, 2.1, W); knob(px, 172, 3.4, k); T(px, 188, sc, 1.6, W, 'middle', 700, 'xml:space="preserve"'); });
  // pitch ratio display, MANUAL, CONTROL MODE
  frame(352, 131, 670, 193); T(440, 141, 'PITCH RATIO', 2.7, W);
  rect(X(395), Y(149), X(490) - X(395), Y(183) - Y(149), '#160304', 'rx="0.8"');
  p(`<text class="${id('disp')}" x="${X(442)}" y="${Y(176)}" font-family="${MONO2}" font-size="11" font-weight="700" fill="#ff2a1a" filter="url(#glowSm)" text-anchor="middle" letter-spacing="1">1.000</text>`);
  T(545, 141, 'MANUAL', 2.7, W); knob(545, 168, 7.6, 'manual', true);
  T(615, 141, 'CONTROL MODE', 2.5, W);
  ['MANUAL', 'KEYBOARD', 'CV + MAN'].forEach((l, i) => { const py = 153 + i * 13; ckey(590, py, 'cm' + i); circle(X(578), Y(py), 0.9, '#3a1412'); p(`<circle class="${id('lc' + i)}" cx="${X(578)}" cy="${Y(py)}" r="0.9" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); T(604, py + 1, l, 2, W, 'start'); });
  // bottom row: LINE, DELAY ONLY keys, FUNCTION SELECT + the four function keys, ALGORITHM, MAIN keys, POWER
  ckey(66, 208, 'line'); T(66, 220, 'LINE', 1.9, W); T(66, 223.6, 'IN/OUT', 1.6, W);
  H949_KEYS.forEach((v, i) => { ckey(152 + i * 20, 208, 'd' + i); T(152 + i * 20, 201, String(v), 1.9, W); });
  p(`<path d="M${X(146)} ${Y(216)} H${X(258)}" stroke="${W}" stroke-width="0.35"/>`); T(202, 222, 'DELAY ONLY OUTPUT (M SEC)', 2, W);
  ckey(297, 208, 'fsel', true); T(297, 218, 'FUNCTION', 1.7, W); T(297, 221.4, 'SELECT', 1.7, W);
  [['DELAY', 'NORM'], ['RANDOM', 'EXTEND'], ['FLANGE', 'µPC SHARP'], ['REVERSE', 'µPC FLAT']].forEach(([g, r], i) => { const px = 323 + i * 27; ckey(px, 208, 'f' + i); circle(X(px), Y(199), 1, '#2a2a2a'); p(`<circle class="${id('lf' + i)}" cx="${X(px)}" cy="${Y(199)}" r="1" fill="#59e05a" opacity="0" filter="url(#glowSm)"/>`); T(px, 216.6, g, 1.6, '#7be07b'); T(px, 220.2, r, 1.6, '#ff6a5a'); });
  p(`<rect x="${X(312)}" y="${Y(194)}" width="${X(415) - X(312)}" height="${Y(224) - Y(194)}" rx="1" fill="none" stroke="#ff6a5a" stroke-width="0.35" opacity="0.7"/>`);
  ckey(428, 208, 'alg'); T(428, 201, '1/2', 1.8, W); T(428, 218, 'ALGORITHM', 1.6, W); T(428, 221.4, 'SELECT', 1.6, W);
  H949_KEYS.forEach((v, i) => { ckey(457 + i * 20, 208, 'm' + i); T(457 + i * 20, 201, String(v), 1.9, W); });
  p(`<path d="M${X(451)} ${Y(216)} H${X(563)}" stroke="${W}" stroke-width="0.35"/>`); T(507, 222, 'MAIN OUTPUT (M SEC)', 2, W);
  T(633, 199, 'POWER', 2, W); p(`<g data-hk="power" style="cursor:pointer"><rect x="${X(633) - 1}" y="${Y(204)}" width="2" height="6" rx="1" fill="#c9ccd0"/><circle class="${id('pw')}" cx="${X(633)}" cy="${Y(204)}" r="1.4" fill="#e9eaec"/><circle cx="${X(633)}" cy="${Y(208)}" r="5" fill="transparent"/></g>`); T(633, 222, 'OFF   ON', 1.8, W, 'middle', 700, 'xml:space="preserve"');
  p(`<text class="${id('route')}" x="${X(395)}" y="${h - 1.6}" font-family="${MONO2}" font-size="2.3" font-weight="700" fill="#e8a33a" text-anchor="middle">NOT PATCHED</text>`);
}
// AXS RMX16 (2U), drawn from the user's photo (panel 98..1150 x 402..592 px)
const RMX_PAD = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'];
function rmxFace(w, h) {
  const W = '#e6e3dc', X = (px) => (px - 98) * w / 1052, Y = (py) => (py - 402) * h / 190, id = (k) => `rmx-${k}`;
  rect(0, 0, w, h, '#18191b', 'rx="1.5"'); rect(0, 0, w, 1.2, '#fff', 'opacity="0.1"'); rect(0, h - 1.5, w, 1.5, '#000', 'opacity="0.5"');
  for (const [ex, ey] of [[X(112), Y(411)], [X(112), Y(583)], [X(1135), Y(411)], [X(1135), Y(583)]]) { rect(ex - 6, ey - 3, 12, 6, '#060606', 'rx="3"'); screw(ex, ey, 3.4); }
  for (const [sx, sy] of [[150, 420], [150, 575], [1095, 420], [1095, 575]]) circle(X(sx), Y(sy), 2, '#55575c');
  const frame = (x0, y0, x1, y1) => p(`<rect x="${X(x0)}" y="${Y(y0)}" width="${X(x1) - X(x0)}" height="${Y(y1) - Y(y0)}" fill="none" stroke="#cfcbc2" stroke-width="0.55"/>`);
  const T = (px, py, t, sz, col = W, a = 'middle', wt = 700, ex = '') => text(X(px), Y(py), t, sz, col, a, wt, ex);
  const silver = (px, py, r, k) => { p(`<g data-rk="${k}" style="cursor:ns-resize"><circle cx="${X(px)}" cy="${Y(py) + 0.7}" r="${r}" fill="#000" opacity="0.6"/><circle cx="${X(px)}" cy="${Y(py)}" r="${r}" fill="#9a9ca1"/><circle cx="${X(px)}" cy="${Y(py)}" r="${r * 0.72}" fill="#d9dbde"/><g class="${id('k-' + k)}" transform="rotate(0 ${X(px)} ${Y(py)})"><rect x="${X(px) - 0.45}" y="${Y(py) - r + 0.4}" width="0.9" height="${r * 0.6}" fill="#2a2a2c"/></g><circle cx="${X(px)}" cy="${Y(py)}" r="${r + 4}" fill="transparent"/></g>`); for (let i = 0; i <= 9; i++) { const a = (-150 + i * 33.3) * Math.PI / 180; text(X(px) + Math.sin(a) * (r + 3.4), Y(py) - Math.cos(a) * (r + 3.4) + 1, String(i), 2.3, W, 'middle', 700); } };
  const key = (px, py, k, lamp = true) => { const s2 = 9; p(`<g data-rk="${k}" style="cursor:pointer"><rect x="${X(px) - s2 / 2}" y="${Y(py) - s2 / 2 + 0.6}" width="${s2}" height="${s2}" rx="0.6" fill="#000"/><rect x="${X(px) - s2 / 2}" y="${Y(py) - s2 / 2}" width="${s2}" height="${s2}" rx="0.6" fill="#2a2b2e" stroke="#000" stroke-width="0.4"/><rect x="${X(px) - s2 / 2}" y="${Y(py) - s2 / 2}" width="${s2}" height="${s2 * 0.3}" rx="0.6" fill="#fff" opacity="0.08"/></g>`); if (lamp) { circle(X(px), Y(py) - 1.6, 0.9, '#3a1412'); p(`<circle class="${id('l-' + k)}" cx="${X(px)}" cy="${Y(py) - 1.6}" r="0.9" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); } };
  // logo box and in / out
  frame(168, 405, 314, 482); rect(X(178), Y(414), X(304) - X(178), Y(472) - Y(414), 'none', 'stroke="#e6e3dc" stroke-width="1.2" rx="1"');
  T(241, 457, 'axs', 17, 'none', 'middle', 900, 'stroke="#e6e3dc" stroke-width="0.9" letter-spacing="1.5"');
  frame(168, 485, 314, 568); T(198, 497, 'in', 2.8, W); T(282, 497, 'out', 2.8, W); T(240, 497, 'o/flo', 2.6, W);
  silver(198, 540, 5, 'in'); silver(282, 540, 5, 'out');
  ['#ff3b2f', '#ff3b2f', '#ffb02e', '#59e05a'].forEach((col, i) => { const y = Y(510 + i * 14.5); circle(X(240), y, 1.2, '#2a2a2a'); p(`<circle class="${id('m' + i)}" cx="${X(240)}" cy="${y}" r="1.2" fill="${col}" opacity="0" filter="url(#glowSm)"/>`); });
  // pot
  frame(318, 405, 387, 568); silver(352, 440, 5, 'pot'); T(352, 497, 'pot', 2.8, W); key(352, 524, 'potk');
  // display and the function keys
  frame(390, 405, 877, 568); rect(X(410), Y(424), X(866) - X(410), Y(470) - Y(424), '#120607');
  const fld = (k2, px, t, sz = 7.4, anchor = 'middle') => p(`<text class="${id(k2)}" x="${X(px)}" y="${Y(455)}" font-family="${MONO2}" font-size="${sz}" font-weight="700" fill="#ff2a1a" filter="url(#glowSm)" text-anchor="${anchor}" xml:space="preserve">${t}</text>`);
  fld('prog', 437, ' 1'); fld('pre', 505, '  0'); fld('dec', 548, '4.0'); fld('low', 599, ' 0'); fld('high', 636, '-4'); fld('store', 715, ' t'); fld('name', 812, 'AMBIENCE', 5, 'middle');
  [['program', 433, '', 'program'], ['predelay', 488, '', 'predelay'], ['decay', 545, '', 'decay time'], ['low', 603, 'decay filter', 'low'], ['high', 643, '', 'high'], ['save', 697, 'store control', 'save'], ['recall', 737, '', 'recall'], ['ndn', 793, 'nudge', 'down'], ['nup', 833, '', 'up']].forEach(([k2, px, top, l]) => { key(px, 525, k2); T(px, 504, l, 2.6, W); if (top) T(px + 20, 497, top, 2.6, W); });
  // keypad
  rect(X(882), Y(406), X(1025) - X(882), Y(563) - Y(406), '#0c0c0d', 'rx="2"');
  RMX_PAD.forEach((c, i) => { const px = 920 + (i % 4) * 28.5, py = 443 + Math.floor(i / 4) * 27.6; p(`<g data-rk="pad${c}" style="cursor:pointer"><rect x="${X(px) - 3.3}" y="${Y(py) - 3}" width="6.6" height="6" rx="0.6" fill="#e7e0c9"/><rect x="${X(px) - 3.3}" y="${Y(py) - 3}" width="6.6" height="1.6" rx="0.6" fill="#fff" opacity="0.35"/></g>`); text(X(px), Y(py) + 1.2, c === '*' ? '✱' : c, 3.1, '#1a1814', 'middle', 800); });
  // power
  frame(1033, 405, 1080, 568); T(1057, 427, 'on', 2.6, W); T(1057, 470, 'off', 2.6, W);
  p(`<g data-rk="power" style="cursor:pointer"><rect x="${X(1057) - 1.4}" y="${Y(437)}" width="2.8" height="7" rx="1.4" fill="#c9ccd0"/><circle class="${id('sw')}" cx="${X(1057)}" cy="${Y(439)}" r="1.6" fill="#eef0f2"/><circle cx="${X(1057)}" cy="${Y(445)}" r="6" fill="transparent"/></g>`);
  circle(X(1057), Y(528), 1.5, '#3a0a10'); p(`<circle class="${id('pw')}" cx="${X(1057)}" cy="${Y(528)}" r="1.5" fill="#ff2a5a" opacity="1" filter="url(#glowSm)"/>`); T(1057, 557, 'power', 2.6, W);
  frame(168, 570, 1080, 589); T(624, 584, 'model rmx16 : digital reverberation system : advanced axis systems : burnley, england', 3.6, W, 'middle', 700, 'letter-spacing="0.2"');
  p(`<text class="${id('route')}" x="${X(624)}" y="${Y(600)}" font-family="${MONO2}" font-size="2.3" font-weight="700" fill="#e8a33a" text-anchor="middle">NOT PATCHED</text>`);
}
function spBody(w, h) {
  // E-mew SP-1200 (after the E-mu SP-1200), seen from above: grey case, the 2 x 16 display, the function keys in their
  // groups, the keypad, eight sliders and eight pads. Units: millimetres of the real one (about 520 x 340), scaled.
  const X = (mm) => mm * w / 520, Y = (mm) => mm * h / 340, s = w / 520, K = '#1c1c1e', W = '#f2f0ea', G = '#5a5a5c';
  const T = (x, y, t, sz, col = K, a = 'middle', wt = 800, ex = '') => text(X(x), Y(y), t, sz * s, col, a, wt, ex);
  rect(0, 0, w, h, '#7d7f82', `rx="${6 * s}"`); rect(X(4), Y(4), X(512), Y(332), '#a9abaf', `rx="${4 * s}"`);
  rect(X(4), Y(4), X(512), Y(2), '#fff', 'opacity="0.35"');
  // name
  T(500, 26, 'SP·1200', 16, '#202022', 'end', 900, 'font-style="italic" letter-spacing="1"'); T(500, 36, 'SAMPLING PERCUSSION', 4, '#202022', 'end', 900, 'letter-spacing="1.4"');
  rect(X(14), Y(14), 9 * s, 7 * s, 'none', `stroke="#c22a24" stroke-width="${1.4 * s}"`); T(26, 21, 'E-mew', 8, '#c22a24', 'start', 900);
  // display
  rect(X(14), Y(30), X(140), Y(34), '#232426', `rx="${2 * s}"`); rect(X(20), Y(35), X(128), Y(24), '#9fc23a', `rx="${1 * s}"`);
  for (const [cls, yy] of [['sp-l1', 46], ['sp-l2', 56]]) p(`<text class="${cls}" x="${X(23)}" y="${Y(yy)}" font-family="${MONO2}" font-size="${8.6 * s}" font-weight="700" fill="#1d2a08" style="white-space:pre" textLength="${X(122).toFixed(1)}" lengthAdjust="spacingAndGlyphs"> </text>`);
  // a key: grey square with a legend above and an LED in some
  const key = (x, y, k, lab, col = '#d8d9dc', led = false, kw = 13, kh = 9) => {
    if (lab) lab.split('\n').forEach((t, j, a) => T(x, y - kh / 2 - 2.2 - (a.length - 1 - j) * 3.4, t, 2.6, K, 'middle', 900));
    p(`<g data-spb="${k}" style="cursor:pointer">`); rect(X(x - kw / 2), Y(y - kh / 2) + 0.8 * s, X(kw), Y(kh), '#000', `rx="${1 * s}" opacity="0.45"`); rect(X(x - kw / 2), Y(y - kh / 2), X(kw), Y(kh), col, `rx="${1 * s}"`); rect(X(x - kw / 2), Y(y - kh / 2), X(kw), Y(kh * 0.3), '#fff', `rx="${1 * s}" opacity="0.35"`); p('</g>');
    if (led) { circle(X(x + kw / 2 - 2), Y(y - kh / 2 + 2), 0.9 * s, '#3a1412'); p(`<circle class="sp-l-${k}" cx="${X(x + kw / 2 - 2)}" cy="${Y(y - kh / 2 + 2)}" r="${0.9 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); }
  };
  const box = (x0, y0, x1, y1, t) => { p(`<rect x="${X(x0)}" y="${Y(y0)}" width="${X(x1 - x0)}" height="${Y(y1 - y0)}" fill="none" stroke="${G}" stroke-width="${0.5 * s}" rx="${1 * s}"/>`); T(x0 + 2, y0 + 4, t, 2.6, G, 'start', 900, 'letter-spacing="0.6"'); };
  // function groups
  box(162, 28, 262, 66, 'PROGRAMMING'); key(176, 52, 'tempo', 'TEMPO', undefined, true); key(194, 52, 'swing', 'SWING', undefined, true); key(212, 52, 'quant', 'AUTO\nCORRECT', undefined, true); key(230, 52, 'metro', 'METRO-\nNOME', undefined, true); key(248, 52, 'pattern', 'PATTERN', undefined, true);
  box(268, 28, 382, 66, 'SOUND'); key(282, 52, 'sample', 'SAMPLE', undefined, true); key(300, 52, 'bank', 'BANK', undefined, true); key(318, 52, 'mix', 'MIX', undefined, true); key(336, 52, 'tune', 'TUNE', undefined, true); key(354, 52, 'decay', 'DECAY', undefined, true); key(372, 52, 'multi', 'MULTI\nPITCH', undefined, true);
  box(388, 44, 512, 66, 'DISK · SYNC'); key(402, 58, 'load', 'LOAD', undefined, false); key(420, 58, 'save', 'SAVE', undefined, false); key(440, 58, 'sync', 'SYNC', undefined, true);
  // keypad
  box(14, 72, 150, 140, 'ENTRY'); ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].forEach((d, i) => key(30 + (i % 5) * 18, 92 + Math.floor(i / 5) * 18, 'k' + d, d));
  key(124, 92, 'no', 'NO / −', '#c9cacd'); key(124, 110, 'yes', 'YES / +', '#c9cacd'); key(124, 128, 'enter', 'ENTER', '#c9cacd'); key(30, 128, 'kdot', '', '#c9cacd', false, 0.1, 0.1);
  // transport
  box(14, 146, 150, 196, 'TRANSPORT'); key(36, 174, 'run', 'RUN / STOP', '#e9e7df', true, 26, 13); key(76, 174, 'rec', 'RECORD', '#d6453a', true, 22, 13); key(112, 174, 'tap', 'TAP / REPEAT', '#e9e7df', true, 24, 13); key(140, 174, 'erase', 'ERASE', '#e9e7df', true, 14, 13);
  // eight sliders over eight pads
  for (let i = 0; i < 8; i++) {
    const x = 186 + i * 40;
    T(x, 82, String(i + 1), 3.2, K, 'middle', 900);
    rect(X(x) - 0.9 * s, Y(88), 1.8 * s, Y(56), '#202022', `rx="${0.6 * s}"`);
    for (let t = 0; t <= 10; t++) p(`<line x1="${X(x - 5)}" y1="${Y(88 + t * 5.6)}" x2="${X(x - 3)}" y2="${Y(88 + t * 5.6)}" stroke="${G}" stroke-width="${0.3 * s}"/>`);
    p(`<g data-spk="${i}" style="cursor:ns-resize"><rect x="${X(x - 9)}" y="${Y(84)}" width="${X(18)}" height="${Y(64)}" fill="transparent"/><g class="sp-s${i}" data-len="${Y(56).toFixed(2)}" data-y0="${Y(88).toFixed(2)}" transform="translate(0 0)"><rect x="${X(x - 5)}" y="${Y(88) - 3 * s}" width="${X(10)}" height="${6 * s}" rx="${0.8 * s}" fill="#e8e5da" stroke="#555" stroke-width="${0.4 * s}"/><rect x="${X(x - 5)}" y="${Y(88) - 0.4 * s}" width="${X(10)}" height="${0.8 * s}" fill="#333"/></g></g>`);
    p(`<g data-spp="${i}" style="cursor:pointer">`); rect(X(x - 15), Y(168) + 1.4 * s, X(30), Y(30), '#000', `rx="${2 * s}" opacity="0.5"`); p(`<rect class="sp-pad${i}" x="${X(x - 15)}" y="${Y(168)}" width="${X(30)}" height="${Y(30)}" rx="${2 * s}" fill="#5d6064"/>`); rect(X(x - 15), Y(168), X(30), Y(6), '#fff', `rx="${2 * s}" opacity="0.12"`); p('</g>');
    p(`<text class="sp-pn${i}" x="${X(x)}" y="${Y(206)}" font-family="${MONO2}" font-size="${3.4 * s}" font-weight="700" fill="#202022" text-anchor="middle"> </text>`);
  }
  T(326, 158, 'PADS · VELOCITY: HIT LOW FOR LOUD', 2.6, G, 'middle', 900);
  // the lower half: the case with its vents and outputs legend
  rect(X(4), Y(216), X(512), Y(116), '#8e9094', `rx="${3 * s}"`);
  for (let i = 0; i < 14; i++) rect(X(30 + i * 34), Y(232), X(20), Y(80), '#7a7c80', `rx="${2 * s}"`);
  T(260, 326, 'OUTPUTS 1-2 DYNAMIC FILTER · 3-6 FIXED FILTER · 7-8 FULL BANDWIDTH · 12-BIT · 26.04 kHz', 3.2, '#2a2a2c', 'middle', 900);
}
function junoBody(w, h) {
  // Rowan JUNO-1060, drawn from the user's photo of a real Juno-106 (straight down): positions are the photo's pixels
  // (the instrument spans x 28-1160, y 370-726 there), mapped onto the body
  const X = (px) => (px - 28) * w / 1132, Y = (py) => (py - 370) * h / 356, s = w / 1132, W = '#e9e6dc', G = '#a9a59a', RED = '#b72a26', BLUE = '#2f7fd0';
  const T = (x, y, t, sz, col = W, a = 'middle', wt = 800, ex = '') => text(X(x), Y(y), t, sz * s, col, a, wt, ex);
  rect(0, 0, w, h, '#0b0b0c', `rx="${4 * s}"`);
  for (const [x0, x1] of [[28, 68], [1120, 1160]]) { rect(X(x0), 0, X(x1) - X(x0), h, '#141415', `rx="${4 * s}"`); rect(X(x0) + 2 * s, 0, 3 * s, h, '#fff', 'opacity="0.05"'); }
  rect(X(68), Y(372), X(1120) - X(68), Y(565) - Y(372), '#26272a');
  // rear-panel label strip along the top
  rect(X(68), Y(372), X(1120) - X(68), Y(388) - Y(372), '#1c1c1e');
  [['LEVEL', 92], ['MONO · STEREO', 128], ['PHONES', 176], ['PEDAL HOLD', 196], ['PITCH SHIFT', 216], ['SAVE  LOAD', 245], ['TUNE', 285]].forEach(([t, x]) => T(x, 380, t, 1.8, G));
  T(160, 386, 'OUTPUT', 1.8, G); T(245, 386, 'TAPE', 1.8, G);
  [['FUNCTION', 905], ['IN', 958], ['OUT', 985], ['THRU', 1010], ['MEMORY PROTECT', 1040], ['POWER', 1080]].forEach(([t, x]) => T(x, 380, t, 1.8, G)); T(985, 386, 'MIDI', 1.8, G);
  // left panel: cream stripe, logo, rule
  rect(X(70), Y(394), X(305) - X(70), Y(404) - Y(394), '#e4e0d4');
  rect(X(92), Y(406), 9 * s, 7 * s, 'none', `stroke="${W}" stroke-width="${1.2 * s}"`); T(104, 418, 'Rowan', 11.5, W, 'start', 600);
  rect(X(70), Y(470), X(305) - X(70), 0.8 * s, '#e4e0d4');
  // section headers (red) and the blue line
  [['LFO', 308, 352], ['DCO', 355, 557], ['HPF', 560, 585], ['VCF', 588, 696], ['VCA', 699, 738], ['ENV', 741, 816], ['CHORUS', 819, 880]].forEach(([n, a, b]) => { rect(X(a), Y(390), X(b) - X(a), Y(404) - Y(390), RED); T((a + b) / 2, 401, n, 5.2, '#fff2ea', 'middle', 900); });
  rect(X(882), Y(397), X(1110) - X(882), 2.6 * s, BLUE);
  rect(X(308), Y(470), X(880) - X(308), 1.6 * s, RED);
  const slider = (x, k, lab, y0 = 425, len = 38) => {
    if (lab) T(x, y0 - 8, lab, 2.1, W);
    for (let i = 0; i <= 10; i++) p(`<line x1="${X(x - 3.8)}" y1="${Y(y0 + len - i * len / 10)}" x2="${X(x - 2.4)}" y2="${Y(y0 + len - i * len / 10)}" stroke="${G}" stroke-width="${0.25 * s}"/>`);
    rect(X(x) - 0.7 * s, Y(y0), 1.4 * s, Y(y0 + len) - Y(y0), '#000', `rx="${0.6 * s}"`);
    p(`<g data-jk="${k}" style="cursor:ns-resize"><rect x="${X(x - 7)}" y="${Y(y0 - 5)}" width="${X(x + 7) - X(x - 7)}" height="${Y(y0 + len + 5) - Y(y0 - 5)}" fill="transparent"/>`);
    p(`<g class="ju-s-${k}" data-len="${(Y(y0 + len) - Y(y0)).toFixed(2)}" transform="translate(0 0)"><rect x="${X(x) - 4.2 * s}" y="${Y(y0) - 3 * s}" width="${8.4 * s}" height="${6 * s}" rx="${0.6 * s}" fill="#18181a" stroke="#000" stroke-width="${0.4 * s}"/><rect x="${X(x) - 4.2 * s}" y="${Y(y0) - 0.4 * s}" width="${8.4 * s}" height="${0.8 * s}" fill="#f2efe6"/></g></g>`);
  };
  const btn = (x, y, k, col, lab, led = true, bw = 14) => {
    if (led) { circle(X(x), Y(y - 10), 1.2 * s, '#3a1412'); p(`<circle class="ju-l-${k}" cx="${X(x)}" cy="${Y(y - 10)}" r="${1.2 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); }
    p(`<g data-jb="${k}" style="cursor:pointer">`); rect(X(x) - bw / 2 * s, Y(y) - 4.2 * s, bw * s, 8.4 * s, '#000', `rx="${0.6 * s}"`); rect(X(x) - (bw / 2 - 0.6) * s, Y(y) - 3.6 * s, (bw - 1.2) * s, 7.2 * s, col, `rx="${0.5 * s}"`); rect(X(x) - (bw / 2 - 0.6) * s, Y(y) - 3.6 * s, (bw - 1.2) * s, 2 * s, '#fff', `opacity="0.25" rx="${0.5 * s}"`); p('</g>');
    if (lab) T(x, y - 14, lab, 1.9, W);
  };
  const sw = (x, y, k, a, b) => { p(`<g data-jb="${k}" style="cursor:pointer">`); rect(X(x) - 2.4 * s, Y(y) - 7 * s, 4.8 * s, 14 * s, '#000', `rx="${0.8 * s}"`); p(`<rect class="ju-w-${k}" x="${X(x) - 1.8 * s}" y="${Y(y) - 6.2 * s}" width="${3.6 * s}" height="${5.6 * s}" rx="${0.5 * s}" fill="#c9c5b8"/>`); p('</g>'); T(x + 7, y - 4, a, 1.7, W, 'start'); T(x + 7, y + 7, b, 1.7, W, 'start'); };
  const CREAM = '#e6dcc0', ORANGE = '#f09a2a', TEAL = '#6fb3a8';
  // LFO
  slider(325, 'lfoRate', 'RATE'); slider(344, 'lfoDelay', 'DELAY TIME');
  // DCO
  T(387, 416, 'RANGE', 2.1); btn(370, 440, 'r16', CREAM, ''); btn(387, 440, 'r8', CREAM, ''); btn(404, 440, 'r4', CREAM, '');
  T(370, 427, "16'", 1.7, G); T(387, 427, "8'", 1.7, G); T(404, 427, "4'", 1.7, G);
  slider(430, 'dcoLfo', 'LFO'); slider(447, 'pwm', 'PWM'); sw(465, 446, 'pwmLfo', 'LFO', 'MAN');
  btn(486, 440, 'pulse', CREAM, '⊓'); btn(502, 440, 'saw', CREAM, '◿');
  slider(528, 'sub', 'SUB'); slider(546, 'noise', 'NOISE');
  // HPF
  slider(572, 'hpf', 'FREQ');
  // VCF
  slider(598, 'cutoff', 'FREQ'); slider(615, 'res', 'RES'); sw(632, 446, 'envPol', '+', '−'); slider(652, 'env', 'ENV'); slider(669, 'vcfLfo', 'LFO'); slider(687, 'kybd', 'KYBD');
  // VCA
  sw(708, 446, 'vcaGate', 'ENV', 'GATE'); slider(727, 'vcaLevel', 'LEVEL');
  // ENV
  slider(751, 'a', 'A'); slider(768, 'd', 'D'); slider(785, 's', 'S'); slider(802, 'r', 'R');
  // CHORUS
  btn(832, 440, 'choff', CREAM, 'OFF'); btn(849, 440, 'ch1', ORANGE, 'I'); btn(866, 440, 'ch2', ORANGE, 'II');
  // programmer row
  T(325, 494, 'KEY', 1.9); T(325, 500, 'TRANSPOSE', 1.9); btn(325, 520, 'transpose', ORANGE, '', false);
  T(350, 494, 'POLY', 1.9); btn(342, 520, 'poly1', CREAM, '', false); btn(358, 520, 'poly2', CREAM, '', false);
  T(386, 500, 'MIDI CH', 1.9, '#7fb6e0'); btn(386, 520, 'midich', TEAL, '', false);
  T(410, 490, 'SELECT', 1.9); T(410, 496, 'GROUP A', 1.9); T(410, 502, 'GROUP B', 1.9); btn(410, 520, 'group', TEAL, '', false);
  rect(X(430), Y(490), X(565) - X(430), 4.4 * s, BLUE); T(497, 493.6, 'BANK', 2, '#fff');
  rect(X(628), Y(490), X(763) - X(628), 4.4 * s, BLUE); T(696, 493.6, 'PATCH NUMBER', 2, '#fff'); T(602, 496, 'PATCH', 1.8); T(602, 501, 'BANK  NUMBER', 1.6);
  for (let i = 0; i < 8; i++) { T(437 + i * 17, 508, String(i + 1), 1.9); btn(437 + i * 17, 520, 'b' + i, TEAL, '', false); T(640 + i * 17, 508, String(i + 1), 1.9); btn(640 + i * 17, 520, 'p' + i, TEAL, '', false); }
  for (let i = 0; i < 8; i++) { T(437 + i * 17, 536, String(i + 1), 1.6, G); T(640 + i * 17, 536, String(i + 9), 1.6, G); }
  rect(X(590), Y(506), X(615) - X(590), Y(530) - Y(506), '#180303', `rx="${0.8 * s}"`);
  p(`<text x="${X(602.5)}" y="${Y(524)}" font-family="${MONO2}" font-size="${12 * s}" font-weight="700" fill="#ff2a14" opacity="0.08" text-anchor="middle">88</text>`);
  p(`<text class="ju-disp" x="${X(602.5)}" y="${Y(524)}" font-family="${MONO2}" font-size="${12 * s}" font-weight="700" fill="#ff2a14" filter="url(#glowSm)" text-anchor="middle">11</text>`);
  T(780, 500, 'MANUAL', 1.9); btn(780, 520, 'manual', ORANGE, '', true); T(806, 500, 'WRITE', 1.9); btn(806, 520, 'write', ORANGE, '', true);
  T(830, 500, 'SAVE', 1.9); btn(830, 520, 'save', CREAM, '', false); T(848, 500, 'VERIFY', 1.9); btn(848, 520, 'verify', ORANGE, '', false); T(866, 500, 'LOAD', 1.9); btn(866, 520, 'load', ORANGE, '', false);
  // the name
  T(1008, 466, 'JUNO-1060', 22, W, 'middle', 900, 'font-stretch="125%" letter-spacing="0.5"'); T(1008, 481, 'PROGRAMMABLE POLYPHONIC SYNTHESIZER', 3.4, W, 'middle', 900);
  p(`<text class="ju-name" x="${X(1008)}" y="${Y(520)}" font-family="${MONO2}" font-size="${7 * s}" font-weight="700" fill="#ffb02e" text-anchor="middle">STRINGS</text>`);
  // front-left module: VOLUME, PORTAMENTO, bender sliders, switch, lever
  rect(X(68), Y(566), X(160) - X(68), Y(726) - Y(566), '#26272a');
  const knob = (x, y, k, lab) => { T(x, y - 12, lab, 2, W); for (let i = 0; i <= 10; i++) { const a = (-135 + i * 27) * Math.PI / 180; circle(X(x) + Math.sin(a) * 10 * s, Y(y) - Math.cos(a) * 10 * s, 0.4 * s, G); }
    p(`<g data-jk="${k}" style="cursor:ns-resize"><circle cx="${X(x)}" cy="${Y(y)}" r="${12 * s}" fill="transparent"/><circle cx="${X(x)}" cy="${Y(y)}" r="${7.5 * s}" fill="#101011"/><g class="ju-s-${k}" data-len="${30 * s}" data-knob="1" transform="rotate(0 ${X(x)} ${Y(y)})"><rect x="${X(x) - 0.5 * s}" y="${Y(y) - 7.5 * s}" width="${1 * s}" height="${4 * s}" fill="#f2efe6"/></g></g>`); };
  knob(95, 596, 'vol', 'VOLUME'); knob(136, 596, 'porta', 'PORTAMENTO');
  slider(92, 'bendDco', 'DCO', 627, 30); slider(110, 'bendVcf', 'VCF', 627, 30); slider(128, 'bendLfo', 'LFO', 627, 30); sw(146, 642, 'bendSw', 'OFF', 'ON');
  T(110, 676, 'LFO TRIG', 1.9); T(110, 712, 'BENDER', 2);
  p(`<g data-jb="bend" style="cursor:ew-resize"><rect x="${X(90)}" y="${Y(684)}" width="${X(132) - X(90)}" height="${Y(702) - Y(684)}" fill="#000" rx="${1.5 * s}"/><rect class="ju-bend" x="${X(108)}" y="${Y(680)}" width="${X(112) - X(108)}" height="${Y(706) - Y(680)}" fill="#4a4a4e" rx="${0.8 * s}"/></g>`);
  // the keyboard: 61 notes (36 .. 96), from x 160 to 1118
  const kx0 = 160, kx1 = 1118, ky0 = 568, ky1 = 724, whites = []; for (let n = 36; n <= 96; n++) if (![1, 3, 6, 8, 10].includes(n % 12)) whites.push(n);
  const ww = (kx1 - kx0) / whites.length;
  rect(X(kx0 - 2), Y(ky0 - 2), X(kx1 + 2) - X(kx0 - 2), Y(ky1 + 2) - Y(ky0 - 2), '#000');
  whites.forEach((n, i) => p(`<rect class="ju-k" data-jn="${n}" x="${X(kx0 + i * ww) + 0.3 * s}" y="${Y(ky0)}" width="${X(kx0 + ww) - X(kx0) - 0.6 * s}" height="${Y(ky1) - Y(ky0)}" rx="${0.8 * s}" fill="#f1ede3" stroke="#8d8a82" stroke-width="${0.3 * s}" style="cursor:pointer"/>`));
  for (let n = 36; n <= 96; n++) if ([1, 3, 6, 8, 10].includes(n % 12)) { const i = whites.indexOf(n - 1); p(`<rect class="ju-k" data-jn="${n}" x="${X(kx0 + (i + 1) * ww - ww * 0.3)}" y="${Y(ky0)}" width="${X(kx0 + ww * 0.6) - X(kx0)}" height="${(Y(ky1) - Y(ky0)) * 0.63}" rx="${0.6 * s}" fill="#111" style="cursor:pointer"/>`); }
}
function tr909Body(bw, bh) {
  // Rowan TR-9090 (after the Roland TR-909), drawn from the user's straight-on photo: the off-white panel with grey end
  // trims, the logo, the big model name and "RHYTHM COMPOSER", the slate header band with the orange section names over
  // the dark knobs, START / STOP, the red MEAS/TEMPO display, TEMPO, the small grey mode keys with their orange labels,
  // CARTRIDGE/ENTER, VOLUME, and the boxed step section: function keys, the slate note bars, 16 cream step keys.
  // Positions are the photo's pixels (800 x 475 picture; the unit spans x 22-780, y 12-465) mapped onto the body.
  const X = (px) => (px - 22) / 758 * bw, Y = (py) => (py - 12) / 453 * bh, s = bw / 484, O = '#e8762a', D = '#38454d', K = '#2b2f33', P = '#e8e7e2';
  const T = (x, y, t, sz, col = K, a = 'middle', wt = 800, ex = '') => text(x, y, t, sz * s, col, a, wt, ex);
  rect(0, 0, bw, bh, '#9d9c96', `rx="${3 * s}"`); rect(X(30), 0, X(772) - X(30), bh, P);
  for (const ex of [X(22), X(772)]) rect(ex, 0, X(30) - X(22), bh, '#a9a8a1');
  // name
  rect(X(70), Y(43), 9 * s, 6 * s, 'none', `stroke="${O}" stroke-width="${0.9 * s}"`); T(X(70) + 11 * s, Y(56), 'Rowan', 10.5, O, 'start', 600, 'letter-spacing="0.3"');
  T(X(68), Y(158), 'TR-9090', 21, D, 'start', 900, 'letter-spacing="0.2"');
  T(X(700), Y(155), 'RHYTHM COMPOSER', 8.6, D, 'end', 900, 'letter-spacing="1.1" font-stretch="125%"');
  // header band with the section names, dividers
  const SEC = [[70, 125, 'TOTAL ACCENT'], [128, 195, 'BASS DRUM'], [198, 262, 'SNARE DRUM'], [265, 335, 'LOW TOM'], [338, 405, 'MID TOM'], [408, 472, 'HI TOM'], [476, 548, 'RIM SHOT  HAND CLAP'], [552, 620, 'HI HAT'], [624, 715, 'CYMBAL']];
  for (const [a, b, n] of SEC) { rect(X(a), Y(165), X(b) - X(a), Y(173) - Y(165), D); T((X(a) + X(b)) / 2, Y(171.6), n, 2.6, O, 'middle', 900, 'letter-spacing="0.2"'); p(`<line x1="${X(a) - 1.5 * s}" y1="${Y(165)}" x2="${X(a) - 1.5 * s}" y2="${Y(247)}" stroke="${K}" stroke-width="${0.45 * s}"/>`); }
  p(`<line x1="${X(717)}" y1="${Y(165)}" x2="${X(717)}" y2="${Y(247)}" stroke="${K}" stroke-width="${0.45 * s}"/>`);
  // knobs: dark grey, a lighter top, a white line; tick marks round them
  const knob = (px, py, r, k, lab, labAbove = true) => {
    const cx = X(px), cy = Y(py);
    for (let i = 0; i <= 10; i++) { const a = (-135 + i * 27) * Math.PI / 180; p(`<line x1="${cx + Math.sin(a) * (r + 0.6 * s)}" y1="${cy - Math.cos(a) * (r + 0.6 * s)}" x2="${cx + Math.sin(a) * (r + 1.8 * s)}" y2="${cy - Math.cos(a) * (r + 1.8 * s)}" stroke="${K}" stroke-width="${0.3 * s}"/>`); }
    p(`<g data-t9k="${k}" style="cursor:ns-resize">`); circle(cx + 0.4 * s, cy + 0.9 * s, r, '#000', 'opacity="0.3"'); circle(cx, cy, r, '#3f4246'); circle(cx, cy, r * 0.74, '#53575b');
    p(`<g class="t9-k-${k.replace('.', '-')}" transform="rotate(0 ${cx} ${cy})"><rect x="${cx - 0.45 * s}" y="${cy - r}" width="${0.9 * s}" height="${r * 0.55}" fill="#f2efe6"/></g>`); circle(cx, cy, r + 3.5 * s, 'transparent'); p('</g>');
    if (lab) T(cx, labAbove ? cy - r - 2.6 * s : cy + r + 4.4 * s, lab, 2.1, K, 'middle', 800);
  };
  const r = 4.6 * s;
  knob(95, 233, r, 'accent', '');
  knob(140, 201, r, 'BD.tune', 'TUNE'); knob(174, 201, r, 'BD.level', 'LEVEL'); knob(140, 233, r, 'BD.attack', 'ATTACK'); knob(174, 233, r, 'BD.decay', 'DECAY');
  knob(213, 201, r, 'SD.tune', 'TUNE'); knob(246, 201, r, 'SD.level', 'LEVEL'); knob(213, 233, r, 'SD.tone', 'TONE'); knob(246, 233, r, 'SD.snappy', 'SNAPPY');
  for (const [k, x0] of [['LT', 285], ['MT', 356], ['HT', 426]]) { knob(x0, 201, r, `${k}.tune`, 'TUNE'); knob(x0 + 32, 201, r, `${k}.level`, 'LEVEL'); knob(x0, 232, r, `${k}.decay`, 'DECAY'); }
  knob(498, 201, r, 'RS.level', 'LEVEL'); knob(531, 201, r, 'CP.level', 'LEVEL');
  knob(604, 199, r, 'CH.level', 'LEVEL'); knob(571, 232, r, 'CH.decay', 'CH DECAY'); knob(604, 232, r, 'OH.decay', 'OH DECAY');
  knob(645, 199, r, 'CR.level', 'LEVEL'); knob(680, 199, r, 'RD.level', 'LEVEL'); knob(645, 232, r, 'CR.tune', 'CRASH  TUNE'); knob(680, 232, r, 'RD.tune', 'RIDE  TUNE');
  // a cream key (START, STOP/CONT, CARTRIDGE/ENTER) and the small grey mode keys with a light window
  const cream = (px, py, w, h, k, lab) => { const cx = X(px), cy = Y(py); T(cx, cy - h / 2 - 2.6 * s, lab, 2.4, K, 'middle', 800); p(`<g data-t9b="${k}" style="cursor:pointer">`); rect(cx - w / 2 - 0.8 * s, cy - h / 2 - 0.8 * s, w + 1.6 * s, h + 1.6 * s, '#5b5c5e', `rx="${0.8 * s}"`); rect(cx - w / 2, cy - h / 2, w, h, '#f1ebd2', `rx="${0.6 * s}"`); rect(cx - w / 2, cy - h / 2, w, h * 0.3, '#fff', `opacity="0.6" rx="${0.6 * s}"`); p('</g>'); };
  const small = (px, py, k, cls) => { const cx = X(px), cy = Y(py), w = 4.6 * s; p(`<g data-t9b="${k || ''}" style="cursor:${k ? 'pointer' : 'default'}">`); rect(cx - w / 2 - 0.5 * s, cy - w / 2 - 0.5 * s, w + 1 * s, w + 1 * s, '#7b7c7e', `rx="${0.4 * s}"`); rect(cx - w / 2, cy - w / 2, w, w, '#c9c8c3', `rx="${0.3 * s}"`); rect(cx - 1.2 * s, cy - 1.6 * s, 2.4 * s, 1.2 * s, '#8a8a88'); if (cls) p(`<rect class="${cls}" x="${cx - 1.2 * s}" y="${cy - 1.6 * s}" width="${2.4 * s}" height="${1.2 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); p('</g>'); };
  cream(92, 292, 11 * s, 10 * s, 'start', 'START'); cream(130, 292, 11 * s, 10 * s, 'stop', 'STOP/CONT');
  for (const [lx, cls] of [[92, 't9-start']]) { circle(X(lx) + 7 * s, Y(281), 0.8 * s, '#3a1412'); p(`<circle class="${cls}" cx="${X(lx) + 7 * s}" cy="${Y(281)}" r="${0.8 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); }
  T(X(188), Y(276), 'MEAS/TEMPO', 2.4, K); rect(X(160), Y(281), X(215) - X(160), Y(305) - Y(281), '#4a1018', `rx="${0.5 * s}"`);
  p(`<text x="${X(187.5)}" y="${Y(300)}" font-family="${MONO2}" font-size="${8.2 * s}" font-weight="700" fill="#ff2a14" opacity="0.1" text-anchor="middle">888</text>`);
  p(`<text class="t9-disp" x="${X(187.5)}" y="${Y(300)}" font-family="${MONO2}" font-size="${8.2 * s}" font-weight="700" fill="#ff2a14" filter="url(#glowSm)" text-anchor="middle">125</text>`);
  T(X(262), Y(262), 'TEMPO', 2.6, K, 'middle', 900); knob(262, 293, 11.5 * s, 'tempo', ''); T(X(240), Y(318), 'SLOW', 1.9, K); T(X(285), Y(318), 'FAST', 1.9, K);
  // the small keys: TRACK PLAY (looks), PATTERN PLAY (write / play), TEMPO / BACK=TAP / FWD / MEAS, CYCLE, TAPE SYNC (= DIN sync)
  T(X(339), Y(259), 'TRACK PLAY', 2.1, K); [306, 327, 348, 369].forEach((x, i) => { small(x, 270, 'trk' + i, 't9-trk' + i); T(X(x), Y(286), String(i + 1), 2, K); });
  rect(X(296), Y(294), X(382) - X(296), Y(306) - Y(294), O, `rx="${0.4 * s}"`); T(X(339), Y(302.6), 'TRACK  WRITE', 2, '#fff', 'middle', 900);
  T(X(426), Y(259), 'PATTERN PLAY', 2.1, K); [395, 416, 437, 458].forEach((x, i) => { small(x, 270, i < 3 ? 'grp' + i : '', i < 3 ? 't9-grp' + i : ''); if (i < 3) T(X(x), Y(286), ['I', 'II', 'III'][i], 2, K); });
  rect(X(384), Y(294), X(455) - X(384), Y(306) - Y(294), O, `rx="${0.4 * s}"`); T(X(419.5), Y(302.6), 'PATTERN  WRITE', 2, '#fff', 'middle', 900);
  rect(X(457), Y(281), X(478) - X(457), Y(306) - Y(281), O, `rx="${0.4 * s}"`); T(X(467.5), Y(292), 'EXT', 1.9, '#fff', 'middle', 900); T(X(467.5), Y(299), 'INST', 1.9, '#fff', 'middle', 900);
  [['TEMPO', 'STEP', 497, 'tempo'], ['BACK', 'TAP', 518, 'tap'], ['FWD', 'I', 539, 'fwd'], ['AVAILABLE', 'II', 560, 'meas']].forEach(([a, b, x, k]) => { T(X(x), Y(a === 'AVAILABLE' ? 255 : 259), a, 1.8, K); if (a === 'AVAILABLE') T(X(x), Y(260), 'MEAS', 1.8, K); small(x, 270, k, 't9-' + k + 'L'); T(X(x), Y(286), b, 1.9, K); });
  rect(X(486), Y(291), X(532) - X(486), Y(306) - Y(291), O, `rx="${0.4 * s}"`); T(X(509), Y(297.6), 'PATTERN WRITE', 1.7, '#fff', 'middle', 900); T(X(509), Y(303.4), 'MODE', 1.7, '#fff', 'middle', 900);
  rect(X(535), Y(291), X(575) - X(535), Y(306) - Y(291), O, `rx="${0.4 * s}"`); T(X(555), Y(300.5), 'BANK', 1.9, '#fff', 'middle', 900);
  T(X(582), Y(255), 'CYCLE', 1.8, K); T(X(582), Y(260), '/GUIDE', 1.8, K); small(582, 270); T(X(603), Y(255), 'TAPE', 1.8, K); T(X(603), Y(260), 'SYNC', 1.8, K); small(603, 270, 'sync', 't9-syncL');
  rect(X(576), Y(291), X(592) - X(576), Y(306) - Y(291), O, `rx="${0.4 * s}"`); T(X(584), Y(297.6), 'LAST', 1.6, '#fff', 'middle', 900); T(X(584), Y(303.4), 'MEAS', 1.6, '#fff', 'middle', 900);
  rect(X(595), Y(291), X(613) - X(595), Y(306) - Y(291), O, `rx="${0.4 * s}"`); T(X(604), Y(297.6), 'TEMPO', 1.6, '#fff', 'middle', 900); T(X(604), Y(303.4), 'MODE', 1.6, '#fff', 'middle', 900);
  cream(631, 292, 9 * s, 9 * s, 'enter', ''); T(X(631), Y(272), 'CARTRIDGE', 2.2, K); T(X(631), Y(278.5), '/ENTER', 2.2, K); T(X(631), Y(312), 'TOTAL ACCENT', 1.9, K);
  T(X(680), Y(262), 'VOLUME', 2.6, K, 'middle', 900); knob(680, 293, 10 * s, 'master', ''); T(X(659), Y(315), 'MIN', 1.8, K); T(X(702), Y(315), 'MAX', 1.8, K);
  // the boxed step section
  p(`<rect x="${X(68)}" y="${Y(318)}" width="${X(722) - X(68)}" height="${Y(452) - Y(318)}" fill="none" stroke="${K}" stroke-width="${0.5 * s}"/>`);
  p(`<line x1="${X(121)}" y1="${Y(318)}" x2="${X(121)}" y2="${Y(410)}" stroke="${K}" stroke-width="${0.5 * s}"/>`);
  [[85, 340, 'last', 'LAST STEP', 't9-last'], [110, 340, 'scale', 'SCALE', 't9-scale'], [85, 372, 'shuf', 'SHUFFLE', 't9-shuf'], [110, 372, 'clear', 'CLEAR', 't9-clear'], [85, 397, 'inst', 'INSTRUMENT', 't9-inst'], [110, 397, 'shift', 'SHIFT', 't9-shift']].forEach(([x, y, k, lab, cls]) => {
    small(x, y, k, cls); if (lab === 'SHIFT') { rect(X(x) - 4 * s, Y(y) + 3.4 * s, 8 * s, 2.8 * s, O); T(X(x), Y(y) + 5.5 * s, lab, 1.7, '#fff', 'middle', 900); } else T(X(x), Y(y) + 5.6 * s, lab, 1.7, K, 'middle', 800);
    if (lab === 'SHUFFLE') T(X(x), Y(y) + 7.8 * s, '/FLAM', 1.7, K); if (lab === 'INSTRUMENT') T(X(x), Y(y) + 7.8 * s, 'SELECT', 1.7, K);
  });
  // note bars (four rows of slate bars with notes)
  const rowsB = [[[122, 427], [430, 570], [573, 722]], [[122, 270], [273, 422], [425, 570], [573, 722]], [[122, 422], [425, 722]], [[122, 270], [273, 422], [425, 570], [573, 722]]];
  rowsB.forEach((row, ri) => row.forEach(([a, b]) => { const y = Y(322 + ri * 12.4); rect(X(a), y, X(b) - X(a) - 1 * s, Y(331) - Y(322) - 1 * s, D); for (let xx = X(a) + 3 * s; xx < X(b) - 3 * s; xx += Math.max(16 * s, (X(b) - X(a)) / 4)) T(xx, y + 2.9 * s, '♪', 2.6, '#e8e7e2', 'middle', 700); }));
  // 16 step keys: cream with a light window, numbers above; the labels row under them, then the instrument boxes
  const KX = [141, 175, 210, 244, 283, 318, 353, 388, 424, 459, 494, 529, 565, 600, 637, 671];
  KX.forEach((kx, i) => {
    const cx = X(kx), cy = Y(401), w = 13 * s;
    T(cx, Y(381), String(i + 1), 2.4, K, 'middle', 800);
    p(`<g data-t9s="${i}" style="cursor:pointer">`); rect(cx - w / 2 - 0.8 * s, cy - w / 2 - 0.8 * s, w + 1.6 * s, w + 1.6 * s, '#5b5c5e', `rx="${0.8 * s}"`); rect(cx - w / 2, cy - w / 2, w, w, '#eee8d4', `rx="${0.6 * s}"`); rect(cx - w / 2, cy + w * 0.2, w, w * 0.3, '#000', `opacity="0.08" rx="${0.6 * s}"`); p('</g>');
    rect(cx - 2.6 * s, cy - w / 2 + 1.4 * s, 5.2 * s, 1.8 * s, '#9a9890'); p(`<rect class="t9-l${i}" x="${cx - 2.6 * s}" y="${cy - w / 2 + 1.4 * s}" width="${5.2 * s}" height="${1.8 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`);
  });
  rect(X(122), Y(414), X(722) - X(122), Y(424) - Y(414), D);
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'COPY', 'INS', 'DEL', 'SAVE', 'VERIFY', 'LOAD'].forEach((t, i) => T(X(KX[i]), Y(422), t, 2.1, '#f2efe6', 'middle', 800));
  [[122, 190, 'BASS DRUM'], [193, 262, 'SNARE DRUM'], [265, 332, 'LOW TOM'], [335, 402, 'MID TOM'], [405, 472, 'HI TOM'], [475, 545, 'RIM SHOT   HAND CLAP'], [548, 615, 'CLOSED  OPEN  CLOSED'], [618, 690, 'CRASH       RIDE']].forEach(([a, b, t]) => { p(`<rect x="${X(a)}" y="${Y(428)}" width="${X(b) - X(a)}" height="${Y(440) - Y(428)}" fill="none" stroke="${K}" stroke-width="${0.4 * s}"/>`); T((X(a) + X(b)) / 2, Y(436.6), t, 2, K, 'middle', 800); });
}
function tr808Body(bw, bh) {
  // Rowan TR-8080, laid out from the user's photos of a real one: black end caps, a dark charcoal top panel with the
  // controls in thin grey-outlined boxes, yellow-capped LEVEL knobs, black knobs for tone / tuning / decay, cream tags
  // with the instrument names, an orange logo and "Rhythm Composer", and the lighter grey lower panel with START/STOP,
  // the note-value bars and the 16 coloured step keys. Positions are measured on the photo (% of the panel between the
  // end caps; y = % of its height).
  const cap = bw * 0.058, pw = bw - 2 * cap, s = bw / 528;
  const X = (pc) => cap + pc / 100 * pw, Y = (pc) => pc / 100 * bh, O = '#e0782a', W = '#e8e4da', G = '#a9a7a1', CR = '#efe3b4';
  const T = (x, y, t, sz, col = G, a = 'middle', wt = 800, ex = '') => text(x, y, t, sz * s, col, a, wt, ex);
  // end caps, panel, the lower section
  for (const ex of [0, bw - cap]) { rect(ex, Y(-1), cap, Y(102), '#111112', `rx="${4 * s}"`); rect(ex + cap * 0.15, Y(1), cap * 0.7, Y(98), '#1b1b1c', `rx="${3 * s}"`); }
  rect(cap, 0, pw, bh, '#2c2c2e'); rect(cap, 0, pw, 1 * s, '#fff', 'opacity="0.08"');
  rect(X(0.5), Y(63.4), X(99) - X(0.5), Y(35.4), '#8f8e8b', `rx="${2 * s}"`); rect(X(0.5), Y(63.4), X(99) - X(0.5), 0.8 * s, '#c8c7c2', 'opacity="0.6"');
  for (const [sx, sy] of [[1.5, 2.5], [98.5, 2.5], [1.5, 97], [98.5, 97], [21, 2.5], [60, 2.5], [21, 60.5], [60, 60.5]]) circle(X(sx), Y(sy), 1.4 * s, '#4a4a4c');
  // name: logo, Rhythm Composer, Computer Controlled
  rect(X(67.8), Y(7.4), 7 * s, 6 * s, 'none', `stroke="${O}" stroke-width="${1.2 * s}"`); T(X(67.8) + 9 * s, Y(13.2), 'Rowan', 15, O, 'start', 600, 'letter-spacing="0.2"');
  rect(X(22), Y(59.9), X(88) - X(22), 0.5 * s, O); T(X(74.2), Y(58.4), 'Rhythm Composer', 11, O, 'end', 500); T(X(85.6), Y(58.2), 'TR-8080', 7.6, O, 'end', 700);
  T(X(85.6), Y(62.6), 'Computer Controlled', 6.2, '#c9c6be', 'end', 500);
  // power
  T(X(6.6), Y(3.6), 'POWER', 2.4); rect(X(6.6) - 4 * s, Y(5.3), 8 * s, 5 * s, '#0b0b0c', `rx="${0.6 * s}"`); rect(X(6.6) - 3.2 * s, Y(5.6), 3.6 * s, 3.6 * s, '#3a3a3d'); T(X(6.6) + 6 * s, Y(6.8), 'ON', 1.8); T(X(6.6) + 6.2 * s, Y(9.8), 'OFF', 1.8);
  // knobs: LEVEL = yellow cap on a black skirt; the others black with a white pointer; ticks round them
  const ticks = (cx, cy, r) => { for (let i = 0; i <= 10; i++) { const a = (-135 + i * 27) * Math.PI / 180; p(`<line x1="${cx + Math.sin(a) * (r + 0.8 * s)}" y1="${cy - Math.cos(a) * (r + 0.8 * s)}" x2="${cx + Math.sin(a) * (r + 2.2 * s)}" y2="${cy - Math.cos(a) * (r + 2.2 * s)}" stroke="${G}" stroke-width="${0.35 * s}"/>`); } };
  const knob = (cx, cy, r, k, yellow) => {
    ticks(cx, cy, r);
    p(`<g data-trk="${k}" style="cursor:ns-resize">`); circle(cx + 0.4 * s, cy + 0.8 * s, r, '#000', 'opacity="0.55"'); circle(cx, cy, r, '#0e0e0f');
    if (yellow) { circle(cx, cy, r * 0.62, '#f2d23a'); circle(cx - r * 0.15, cy - r * 0.18, r * 0.3, '#fff', 'opacity="0.25"'); }
    p(`<g class="tr-k-${k.replace('.', '-')}" transform="rotate(0 ${cx} ${cy})"><rect x="${cx - 0.4 * s}" y="${cy - r}" width="${0.8 * s}" height="${r * (yellow ? 0.42 : 0.6)}" fill="${yellow ? '#ff5a2a' : '#f4f2ec'}"/></g>`); circle(cx, cy, r + 3.5 * s, 'transparent'); p('</g>');
  };
  // cream tag with the 808's mixed-size capitals (an upper-case letter is full size, a lower-case one a smaller capital)
  const tag = (cx, cy, w, t, sz = 3.2) => {
    rect(cx - w / 2, cy - 2.8 * s, w, 5.6 * s, CR, `rx="${0.5 * s}"`);
    let sp = ''; for (const ch of t) sp += ch === ' ' ? ' ' : ch === ch.toUpperCase() ? `<tspan font-size="${(sz * s).toFixed(2)}">${ch}</tspan>` : `<tspan font-size="${(sz * 0.72 * s).toFixed(2)}">${ch.toUpperCase()}</tspan>`;
    p(`<text x="${cx}" y="${cy + 1.1 * s}" font-family="Archivo,Arial" font-weight="700" fill="#2a2522" text-anchor="middle" letter-spacing="${0.1 * s}">${sp}</text>`);
  };
  // the instrument columns
  const CX = Array.from({ length: 12 }, (_, i) => 26.4 + i * 6.21), cw = X(6.21) - X(0);   // measured on a straight-on photo
  const COL = [['AC', 'ACcent', []], ['BD', 'BassDrum', [['tone', 'TONE'], ['decay', 'DECAY']]], ['SD', 'SnareDrum', [['tone', 'TONE'], ['snappy', 'SNAPPY']]],
    ['LT', 'LowTom', [['tune', 'TUNING']], 'conga', 'LowConga'], ['MT', 'MidTom', [['tune', 'TUNING']], 'conga', 'MidConga'], ['HT', 'HiTom', [['tune', 'TUNING']], 'conga', 'HiConga'],
    ['RS', 'RimShot', [], 'claves', 'CLaves'], ['CP', 'handClaP', [], 'maracas', 'MAracas'], ['CB', 'CowBell', []], ['CY', 'CYmbal', [['tone', 'TONE'], ['decay', 'DECAY']]], ['OH', 'OpenHihat', [['decay', 'DECAY']]], ['CH', 'ClsdHihat', []]];
  rect(X(23.3), Y(20.5) - 9 * s, X(97.3) - X(23.3), Y(53.6) - Y(20.5) + 9 * s, 'none', `stroke="#5a5a5d" stroke-width="${0.5 * s}"`);
  COL.forEach(([k, name, ks, sw, alt], i) => {
    const cx = X(CX[i]);
    if (i) p(`<line x1="${cx - cw / 2}" y1="${Y(20.5) - 9 * s}" x2="${cx - cw / 2}" y2="${Y(53.6)}" stroke="#5a5a5d" stroke-width="${0.5 * s}"/>`);
    T(cx, Y(16.8), 'LEVEL', 2.3); knob(cx, Y(19.9), 3.2 * s, k === 'AC' ? 'accent' : `${k}.level`, true);
    ks.forEach(([pk, lab], j) => { const ry = k === 'OH' || (k === 'CY' && j === 1) ? Y(41.2) : j === 0 ? Y(30.1) : Y(41.2); T(cx, ry - 3.6 * s - 1 * s, lab, 2.3); knob(cx, ry, 3 * s, `${k}.${pk}`, false); });
    if (sw) { tag(cx, Y(40.9), cw * 0.86, alt, 2.9); p(`<g data-trw="${k}.${sw}" style="cursor:pointer">`); rect(cx - 1.8 * s, Y(44.2), 3.6 * s, 6.4 * s, '#0b0b0c', `rx="${0.5 * s}"`); p(`<rect class="tr-w-${k}" x="${cx - 1.3 * s}" y="${Y(44.2) + 0.5 * s}" width="${2.6 * s}" height="${2.6 * s}" fill="#3e3e41"/>`); rect(cx - 5 * s, Y(43), 10 * s, 10 * s, 'transparent'); p('</g>'); }
    tag(cx, Y(50.3), cw * 0.86, name, 2.9);
  });
  // top-left block: PATTERN WRITE / mode rotary, INSTRUMENT-SELECT, the small red button, MEASURES
  rect(X(1.6), Y(13.2), X(21.3) - X(1.6), Y(35) - Y(13.2), 'none', `stroke="#b8b5ad" stroke-width="${0.5 * s}" rx="${1 * s}"`);
  rect(X(3.6), Y(14.6), 17 * s, 3 * s, 'none', `stroke="#b8b5ad" stroke-width="${0.4 * s}"`); T(X(3.6) + 8.5 * s, Y(14.6) + 2.3 * s, 'PATTERN WRITE', 1.9, W);
  rect(X(11.6), Y(14.2), 19 * s, 5.2 * s, 'none', `stroke="${O}" stroke-width="${0.4 * s}"`); T(X(11.6) + 9.5 * s, Y(14.2) + 2.1 * s, 'INSTRUMENT-SELECT', 1.6, W); T(X(11.6) + 9.5 * s, Y(14.2) + 4.4 * s, 'RHYTHM TRACK', 1.6, O);
  const rotary = (cx, cy, r, k, labs, tags) => {
    labs.forEach((l, i) => {
      if (tags) { const h = labs.length / 2, left = i < h, j = left ? i : i - h, lx = cx + (left ? -1 : 1) * 0.036 * pw, ly = left ? Y(28.8) - j * (Y(28.8) - Y(18.2)) / 5 : Y(18.2) + j * (Y(28.8) - Y(18.2)) / 5;
        rect(lx - 4.2 * s, ly - 2.3 * s, 8.4 * s, 4.6 * s, '#f2d23a', `rx="${0.4 * s}"`); T(lx, ly + 1.1 * s, l, 2.9, '#1a1a1a', 'middle', 900); }
      else { const a = (-120 + i * 240 / (labs.length - 1)) * Math.PI / 180; T(cx + Math.sin(a) * (r + 5.2 * s), cy - Math.cos(a) * (r + 5.2 * s) + 0.7 * s, l, 1.6, W, 'middle', 800); } });
    p(`<g data-trr="${k}" style="cursor:pointer">`); circle(cx + 0.4 * s, cy + 0.9 * s, r, '#000', 'opacity="0.6"'); circle(cx, cy, r, '#101011'); for (let i = 0; i < 16; i++) { const a = i * 22.5 * Math.PI / 180; p(`<line x1="${cx + Math.sin(a) * r * 0.72}" y1="${cy - Math.cos(a) * r * 0.72}" x2="${cx + Math.sin(a) * r * 0.98}" y2="${cy - Math.cos(a) * r * 0.98}" stroke="#2c2c2e" stroke-width="${0.6 * s}"/>`); }
    p(`<g class="tr-r-${k}" transform="rotate(-120 ${cx} ${cy})"><rect x="${cx - 0.5 * s}" y="${cy - r}" width="${1 * s}" height="${r * 0.5}" fill="#f4f2ec"/></g>`); circle(cx, cy, r + 5 * s, 'transparent'); p('</g>');
  };
  rotary(X(6.8), Y(23.9), 4.6 * s, 'mode', ['P.CLEAR', '1st PART', '2nd PART', 'MANUAL', 'PLAY', 'COMPOSE'], false);
  rotary(X(16.6), Y(23.9), 4.6 * s, 'inst', ['AC', 'BD', 'SD', 'LT', 'MT', 'HT', 'RS', 'CP', 'CB', 'CY', 'OH', 'CH'], true);
  T(X(6.8), Y(29), 'PATTERN CLEAR', 1.8, W);
  p(`<g data-trb="stepno" style="cursor:pointer">`); circle(X(6.8), Y(32), 2.2 * s, '#0b0b0c'); circle(X(6.8), Y(32), 1.7 * s, '#d0352b'); circle(X(6.8), Y(32), 5 * s, 'transparent'); p('</g>');
  T(X(3.2), Y(31.4), 'STEP', 1.6, W); T(X(3.2), Y(33.6), 'NUMBER', 1.6, W); T(X(11), Y(31.4), 'TRACK', 1.6, O); T(X(11), Y(33.6), 'CLEAR', 1.6, O);
  // MEASURES / AUTO FILL IN (looks only), TEMPO dial + FINE, MASTER VOLUME
  rotary(X(16.6), Y(38.5), 3.6 * s, 'fill', ['MAN', '2', '4', '8', '12', '16'], false); T(X(16.6), Y(44.3), 'MEASURES', 1.8, W); T(X(16.6), Y(46.5), 'AUTO FILL IN', 1.8, W);
  T(X(7.3), Y(40.6), 'TEMPO', 2.6, W);
  circle(X(7.3), Y(52), 13 * s, '#a3a19b'); circle(X(7.3), Y(52), 11.4 * s, '#c4c2bc'); for (let i = 0; i <= 10; i++) { const a = (-150 + i * 30) * Math.PI / 180; T(X(7.3) + Math.sin(a) * 12.2 * s, Y(52) - Math.cos(a) * 12.2 * s + 0.7 * s, String(i), 1.9, '#2a2a2a', 'middle', 900); }
  knob(X(7.3), Y(52), 8.6 * s, 'tempo', false);
  T(X(17.2), Y(51.5), 'FINE', 2.2, W); knob(X(17.2), Y(57), 2.9 * s, 'fine', false); T(X(14.4), Y(61.6), 'SLOW', 1.6); T(X(20), Y(61.6), 'FAST', 1.6);
  knob(X(93.2), Y(57.6), 3.6 * s, 'master', false); T(X(93.2), Y(62.6), 'MASTER VOLUME', 1.9, W); T(X(90), Y(61.4), 'MIN', 1.5); T(X(96.4), Y(61.4), 'MAX', 1.5);
  // lower section: BASIC-VARIATION + LEDs, START/STOP, PRE-SCALE, the note bars, I/F-VARIATION, TAP
  rect(X(2.2), Y(65), X(12.6) - X(2.2), Y(76.5) - Y(65), 'none', `stroke="#6c6b68" stroke-width="${0.4 * s}" rx="${0.6 * s}"`);
  T(X(7.4), Y(67.5), 'BASIC - VARIATION', 1.9, '#232323', 'middle', 900);
  p(`<g data-trb="var" style="cursor:pointer">`); rect(X(4.6), Y(68.6), X(10.2) - X(4.6), Y(2.6), '#141415', `rx="${1.2 * s}"`); p(`<rect class="tr-var" x="${X(4.8)}" y="${Y(68.8)}" width="${(X(10.2) - X(4.6)) / 3}" height="${Y(2.2)}" rx="${1 * s}" fill="#e5e2da"/>`); p('</g>');
  T(X(5.2), Y(73.6), 'A', 1.6, '#232323'); T(X(7.4), Y(73.6), 'AB', 1.6, '#232323'); T(X(9.6), Y(73.6), 'B', 1.6, '#232323');
  for (const [lx, cls] of [[X(5.8), 'tr-va'], [X(9), 'tr-vb']]) { circle(lx, Y(75.2) + 1.2 * s, 0.9 * s, '#3a1412'); p(`<circle class="${cls}" cx="${lx}" cy="${Y(75.2) + 1.2 * s}" r="${0.9 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); }
  p(`<g data-trb="start" style="cursor:pointer">`); rect(X(2.1), Y(79.8), X(11.2) - X(2.1), Y(9.9), '#4a4a48', `rx="${1 * s}"`); rect(X(2.5), Y(80.5), X(10.8) - X(2.5), Y(8.5), '#efe8d2', `rx="${0.8 * s}"`); rect(X(2.5), Y(80.5), X(10.8) - X(2.5), Y(2.6), '#fff', `opacity="0.4" rx="${0.8 * s}"`); T(X(6.6), Y(84.2), 'START', 2.6, '#2a2522', 'middle', 900); T(X(6.6), Y(87.4), 'STOP', 2.6, '#2a2522', 'middle', 900); p('</g>');
  circle(X(7), Y(78), 0.9 * s, '#3a1412'); p(`<circle class="tr-run" cx="${X(7)}" cy="${Y(78)}" r="${0.9 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`);
  T(X(16.4), Y(66.8), 'PRE-SCALE', 1.8, '#232323', 'middle', 900); p(`<g data-trb="pre" style="cursor:pointer">`); rect(X(16.4) - 1.3 * s, Y(68.2), 2.6 * s, Y(8), '#141415', `rx="${0.5 * s}"`); p(`<rect class="tr-pre" x="${X(16.4) - 1 * s}" y="${Y(68.4)}" width="${2 * s}" height="${Y(1.9)}" fill="#d8d5cc"/>`); rect(X(16.4) - 4 * s, Y(67), 8 * s, Y(10.5), 'transparent'); p('</g>');
  ['1', '2', '3', '4'].forEach((t, i) => T(X(16.4) + 2.6 * s, Y(69.6 + i * 2), t, 1.5, '#232323', 'start', 900));
  const bars = [[[22.3, 33.5], [34.5, 45.7], [46.8, 58], [59, 70.3], [71.3, 82.5], [83.5, 87.6]], [[22.3, 45.7], [46.8, 70.3], [71.3, 82.5]], [[22.3, 37], [38, 58]], [[22.3, 58], [59, 82.5]]];
  bars.forEach((row, r) => row.forEach(([a, b]) => { rect(X(a), Y(64.8 + r * 3.3), X(b) - X(a), Y(2.6), '#b9b7b1', `rx="${0.6 * s}"`); for (let x = X(a) + 3 * s; x < X(b) - 2 * s; x += Math.max(10 * s, (X(b) - X(a)) / 3)) T(x, Y(64.8 + r * 3.3) + 2.1 * s, '♪', 2.2, '#3a3a3a', 'middle', 700); }));
  T(X(93.5), Y(66), '1/F - VARIATION', 1.7, '#232323', 'middle', 900); p(`<g data-trb="ifv" style="cursor:pointer">`); rect(X(91.5), Y(67.5), X(95.5) - X(91.5), Y(2.6), '#141415', `rx="${1.2 * s}"`); p(`<rect class="tr-ifv" x="${X(91.7)}" y="${Y(67.7)}" width="${(X(95.5) - X(91.5)) / 2.2}" height="${Y(2.2)}" rx="${1 * s}" fill="#e5e2da"/>`); p('</g>'); T(X(92.4), Y(72.4), 'A', 1.5, '#232323'); T(X(94.6), Y(72.4), 'B', 1.5, '#232323');
  T(X(93.5), Y(76.5), 'INTRO SET', 1.6, '#232323', 'middle', 900); T(X(93.5), Y(78.6), 'FILL IN TRIGGER', 1.6, '#232323', 'middle', 900);
  p(`<g data-trb="tap" style="cursor:pointer">`); rect(X(90.6), Y(80), X(96.4) - X(90.6), Y(10.5), '#4a4a48', `rx="${0.8 * s}"`); rect(X(91), Y(80.8), X(96) - X(91), Y(8.9), '#efe8d2', `rx="${0.6 * s}"`); T(X(93.5), Y(86.2), 'TAP', 2.3, '#2a2522', 'middle', 900); p('</g>');
  // step keys: 1-4 red-orange, 5-8 orange, 9-12 yellow, 13-16 cream; the light sits in the key; numbers above and below
  const KX = [362, 409, 455, 501, 547, 594, 640, 686, 731, 777, 822, 868, 917, 963, 1009, 1055].map((v) => (v - 128) / 1062 * 100), KC = ['#e8553a', '#f39a3a', '#f3dc5a', '#efe9d6'];
  rect(X(20.8), Y(76.6), X(89.6) - X(20.8), Y(19.5), '#7f7e7b', `rx="${1 * s}"`);
  rect(X(14.4), Y(76.2), X(20.6) - X(14.4), Y(3), '#e9e6dd'); T(X(17.5), Y(78.4), 'STEP NO ➜', 2, '#232323', 'middle', 900);
  T(X(17.2), Y(83), '1st PART', 2, '#232323', 'start'); T(X(17.2), Y(88.8), '2nd PART', 2, '#232323', 'start');
  for (const [ly, cls] of [[Y(81), 'tr-p1'], [Y(85.9), 'tr-p2']]) { circle(X(16.2), ly, 0.8 * s, '#3a1412'); p(`<circle class="${cls}" cx="${X(16.2)}" cy="${ly}" r="${0.8 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); }
  KX.forEach((kx, i) => {
    const cx = X(kx), w = 0.0358 * pw, h = Y(88.3) - Y(79.2);
    T(cx, Y(77.9), String(i + 1), 2.5, '#1d1d1d', 'middle', 900);
    p(`<g data-trs="${i}" style="cursor:pointer">`); rect(cx - w / 2 - 0.5 * s, Y(79.2) - 0.5 * s, w + 1 * s, h + 1 * s, '#3a3a38', `rx="${0.8 * s}"`); rect(cx - w / 2, Y(79.2), w, h, KC[Math.floor(i / 4)], `rx="${0.6 * s}"`); rect(cx - w / 2, Y(79.2) + h * 0.75, w, h * 0.25, '#000', `opacity="0.1" rx="${0.6 * s}"`); p('</g>');
    circle(cx, Y(80.8), 0.95 * s, '#5a1a12'); p(`<circle class="tr-l${i}" cx="${cx}" cy="${Y(80.8)}" r="${0.95 * s}" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`);
    T(cx, Y(93.4), String(i < 12 ? i + 1 : i - 11), 4.6, '#1d1d1d', 'middle', 500);
  });
  rect(X(KX[12]) - 0.0358 * pw / 2, Y(89.6), X(KX[15]) - X(KX[12]) + 0.0358 * pw, 0.5 * s, '#1d1d1d');
  rect(X(7.2), Y(90.2), X(19.6) - X(7.2), Y(3.2), '#e9e6dd'); T(X(13.4), Y(92.6), 'BASIC RHYTHM ➜', 2.2, '#1d1d1d', 'middle', 900); T(X(99.3), Y(93), '⟵ INTRO/FILL IN', 2.2, '#1d1d1d', 'end', 900);
}
function tr808Shelf(w, h) {
  // a 6U black rack shelf (ears, screws, a front lip) with the 808 sitting on it, tilted toward you
  rect(0, 0, w, h, '#141415'); rect(0, h - 12, w, 12, '#1d1d1f'); rect(0, h - 12, w, 1, '#3a3a3d');
  for (const ex of [0, w - 22]) { rect(ex, 0, 22, h, '#101011'); for (const ey of [6.6, 52, h - 52, h - 6.6]) { rect(ex + 4, ey - 3, 14, 6, '#050505', 'rx="3"'); screw(ex + 11, ey, 3.6); } }
  const bw = w - 52, bh = Math.min(h - 18, bw * 300 / 528);
  p(`<g transform="translate(26 ${(h - 12 - bh) / 2})">`); tr808Body(bw, bh); p('</g>');
}
function s900Face(w, h) {
  // Akita S900 (after the Akai S900), 3U: positions from references/s900 section 2 (x = % of the full width ear to ear,
  // y = % of the panel height from the top). Light silver-grey panel, black legends, cream keys, aqua 40 x 2 LCD.
  const X = (pc) => pc / 100 * w, Y = (pc) => pc / 100 * h, K = '#151515', id = (k) => `s9-${k}`;
  rect(0, 0, w, h, '#dddcd7'); for (let yy = 1; yy < h; yy += 1.4) rect(0, yy, w, 0.3, '#fff', `opacity="${(0.04 + 0.03 * ((yy * 5.1) % 1)).toFixed(3)}"`);
  rect(0, 0, w, 1.2, '#fff', 'opacity="0.5"'); rect(0, h - 1.5, w, 1.5, '#000', 'opacity="0.35"');
  for (const ex of [X(5.3), X(94.7)]) rect(ex - 0.3, 0, 0.6, h, '#000', 'opacity="0.18"');
  for (const ex of [X(1.7), X(98.3)]) for (const ey of [Y(28.5), Y(73)]) { rect(ex - X(1.25), ey - Y(2), X(2.5), Y(4), '#2a2a2a', 'rx="2.5"'); screw(ex, ey, 2.6); }
  const T = (x, y, t, sz, col = K, a = 'middle', wt = 800, ex = '') => text(x, y, t, sz, col, a, wt, ex);
  // logos
  T(X(9.7), Y(11.5), 'AKITA', 6.4, '#c8202a', 'middle', 900, 'font-family="Georgia,serif" letter-spacing="0.3"');
  T(X(14.6), Y(11.5), 'professional', 4.2, '#c8202a', 'middle', 600, 'font-style="italic" font-family="Georgia,serif"');
  T(X(21.8), Y(7.5), 'MIDI', 2.6, K, 'middle', 900, 'letter-spacing="0.8"'); T(X(21.8), Y(11.5), 'DIGITAL SAMPLER', 2.6, K, 'middle', 900, 'letter-spacing="0.5"');
  p(`<text x="${X(33.8)}" y="${Y(11)}" font-family="Archivo,Arial" font-size="9" font-weight="900" fill="none" stroke="#3a3a3a" stroke-width="0.55" text-anchor="middle" letter-spacing="0.6">S900</text>`);
  // POWER
  p(`<g data-s9="power" style="cursor:pointer">`); rect(X(9.8) - X(2.2), Y(15), X(4.4), Y(20), '#2a2a2a', 'rx="1.2"'); rect(X(9.8) - X(2.0), Y(16), X(4.0), Y(18), '#3b3b3d', 'rx="1"'); rect(X(9.8) - X(2.0), Y(16), X(4.0), Y(5), '#fff', 'opacity="0.1" rx="1"'); T(X(9.8), Y(31.5), 'POWER', 2.4, '#e0352b', 'middle', 900); p('</g>');
  // CONTRAST
  T(X(23.7), Y(19.5), 'CONTRAST', 2.2, K, 'middle', 800, 'letter-spacing="0.3"');
  for (let i = 0; i < 11; i++) { const a = (-135 + i * 27) * Math.PI / 180; circle(X(23.7) + Math.sin(a) * 5.4, Y(28) - Math.cos(a) * 5.4, 0.35, K); }
  circle(X(23.7), Y(28), 3.6, '#3a3a3c'); circle(X(23.7), Y(28), 2.6, '#4a4a4d');
  // floppy drive
  T(X(18.2), Y(60), 'FLOPPY DISK DRIVE', 2.2, K, 'middle', 800, 'letter-spacing="1.2"');
  rect(X(7.6), Y(64.5), X(21.4), Y(26), '#121213', 'rx="1.5"'); rect(X(9.5), Y(67.2), X(17.4), Y(1.8), '#000'); rect(X(9.5), Y(67.2), X(17.4), Y(0.5), '#333');
  p(`<g data-s9="eject" style="cursor:pointer">`); rect(X(12.5), Y(78), X(3.4), Y(6), '#232325', 'rx="0.6"'); p('</g>');
  p(`<rect class="${id('disk')}" x="${X(9.5)}" y="${Y(66.6)}" width="${X(17.4)}" height="${Y(3)}" fill="#2b2d31" opacity="0"/>`);
  circle(X(28.4), Y(83), 0.9, '#3a1412'); p(`<circle class="${id('dled')}" cx="${X(28.4)}" cy="${Y(83)}" r="0.9" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`);
  // LCD window, glass, MIDI LED
  rect(X(30.4), Y(13.5), X(43.1), Y(21), '#0c0c0d', 'rx="1"');
  p(`<rect class="${id('lcdbg')}" x="${X(32.6)}" y="${Y(17.2)}" width="${X(30.9)}" height="${Y(14.4)}" fill="#2a62e8" rx="0.6"/>`);
  for (const [k, yy] of [['l1', Y(23.1)], ['l2', Y(29.6)]]) p(`<text class="${id(k)}" x="${X(33.0)}" y="${yy}" font-family="${MONO2}" font-size="5.75" font-weight="700" fill="#dfe9ff" style="white-space:pre" textLength="${X(30.1).toFixed(1)}" lengthAdjust="spacingAndGlyphs"> </text>`);
  T(X(69.9), Y(20), 'MIDI RECEIVE', 1.9, '#e8e8e8', 'middle', 700); rect(X(69.9) - 0.15, Y(21), 0.3, Y(3), '#bbb');
  rect(X(69.9) - 1, Y(26), 2, 1.6, '#3a1412'); p(`<rect class="${id('midi')}" x="${X(69.9) - 1}" y="${Y(26)}" width="2" height="1.6" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`);
  // the cream key
  const key = (x, y, k, ww = X(2.2), hh = Y(6)) => { p(`<g data-s9="${k}" style="cursor:pointer">`); rect(x - ww / 2 - 0.8, y - hh / 2 - 0.8, ww + 1.6, hh + 1.6, '#3b3b3d', 'rx="1"'); rect(x - ww / 2, y - hh / 2, ww, hh, '#e4dccb', 'rx="0.7"'); rect(x - ww / 2, y - hh / 2, ww, hh * 0.35, '#fff', 'opacity="0.35" rx="0.7"'); p('</g>'); };
  // 8 mode keys
  [['play', 'PLAY'], ['rec', 'REC'], ['esmp', 'EDIT\nSAMPLE'], ['eprg', 'EDIT\nPRGRM'], ['midi', 'MIDI'], ['util', 'UTILITY'], ['disk', 'DISK'], ['tune', 'MASTER\nTUNE']].forEach(([k, l], i) => {
    const x = X(31.6 + i * 3.33); l.split('\n').forEach((t, j, a) => T(x, Y(43) + (j - a.length + 1) * 2.6, t, 1.9, K, 'middle', 900));
    if (i < 7) { rect(x - X(0.6), Y(47.5) - 0.7, X(1.2), 1.4, '#3a1412'); p(`<rect class="${id('m-' + k)}" x="${x - X(0.6)}" y="${Y(47.5) - 0.7}" width="${X(1.2)}" height="1.4" fill="#ff3b2f" opacity="0" filter="url(#glowSm)"/>`); }
    key(x, Y(53), 'm:' + k);
  });
  // page table
  const PT = [['EDIT SAMPLE', [['SAMPLE NAME', '01'], ['REPLAY MODE', '04'], ['START POINT', '06'], ['END POINT', '07'], ['LOOP LENGTH', '08'], ['SPLICE X-FADE', '10']]],
    ['EDIT PROGRAM', [['PROGRAM NAME', '01'], ['SAMPLE NAME', '05'], ['A.D.S.R.', '09'], ['VLCTY.SENS.', '10'], ['PITCH WARP', '11'], ['LFO', '12']]],
    ['DISK', [['LOAD FROM DISK', '01'], ['SAVE TO DISK', '04'], ['ERASE FROM DISK', '07'], ['DISK FORMAT', '08'], ['', ''], ['', '']]]];
  PT.forEach(([hd, rows], b) => {
    const x0 = X(30.6 + b * 8.47), bw = X(8.47), rh = Y(3.9);
    rect(x0, Y(64.5), bw, Y(4.6), '#555754'); T(x0 + bw / 2, Y(67.9), hd, 1.8, '#f2f2f0', 'middle', 900, 'letter-spacing="0.3"');
    rows.forEach(([n, pg], r) => { const yy = Y(69.1) + r * rh; p(`<rect x="${x0}" y="${yy}" width="${bw}" height="${rh}" fill="none" stroke="#222" stroke-width="0.25"/>`); p(`<line x1="${x0 + bw - X(1.4)}" y1="${yy}" x2="${x0 + bw - X(1.4)}" y2="${yy + rh}" stroke="#222" stroke-width="0.25"/>`); T(x0 + 0.8, yy + rh * 0.72, n, 1.6, K, 'start', 800); T(x0 + bw - X(0.7), yy + rh * 0.72, pg, 1.6, K, 'middle', 900); });
  });
  // keypad
  rect(X(57.5), Y(39), X(16), Y(54), '#55575a', 'rx="1"');
  T(X(62), Y(44.5), 'PARAMETER / KEY', 1.8, '#f2f2f0', 'middle', 900); T(X(70.2), Y(44.5), 'ARROW / CURSOR', 1.8, '#f2f2f0', 'middle', 900);
  const KP = [[['7', '7'], ['8', '8'], ['9', '9'], ['◄', 'left'], ['►', 'right']], [['4', '4'], ['5', '5'], ['6', '6'], ['▲ PAGE', 'pup'], ['PAGE ▼', 'pdn']], [['1', '1'], ['2', '2'], ['3', '3'], ['SPACE', 'space'], ['LETTER', 'letter']], [['0', '0'], ['ON/+', 'plus'], ['OFF/−', 'minus'], ['ENT', 'ent'], ['P.B', 'pb']]];
  const cx = [58.6, 61.4, 64.3, 67.9, 71.2], ry = [55, 65.5, 76, 86.5];
  KP.forEach((row, r) => row.forEach(([l, k], c) => { T(X(cx[c]), Y(ry[r] - 4.4), l, 1.8, '#f2f2f0', 'middle', 900); key(X(cx[c]), Y(ry[r]), 'k:' + k, X(1.85), Y(4.5)); }));
  // CONTROL encoder
  T(X(84.2), Y(9.5), 'CONTROL', 2.4, K, 'middle', 900, 'letter-spacing="0.8"');
  p(`<g data-s9="control" style="cursor:ns-resize">`); circle(X(84.2), Y(27.5) + 1, X(4.15), '#000', 'opacity="0.35"'); circle(X(84.2), Y(27.5), X(4.15), '#111'); circle(X(84.2), Y(27.5), X(3.85), '#6f7072'); circle(X(84.2), Y(27.5), X(3.3), '#77787a'); circle(X(84.2) - 4, Y(27.5) - 4, X(1.8), '#fff', 'opacity="0.08"');
  p(`<g class="${id('ctl')}" transform="rotate(0 ${X(84.2)} ${Y(27.5)})"><circle cx="${X(84.2)}" cy="${Y(27.5) - X(3.0)}" r="0.8" fill="#5a5b5d"/></g>`); circle(X(84.2), Y(27.5), X(4.6), 'transparent'); p('</g>');
  // audio knobs + jacks
  const knob = (x, k, lab, cap, sub) => {
    T(x, Y(50.5), lab, 2, K, 'middle', 900); if (sub) T(x, Y(55.5), sub, 1.5, K, 'middle', 800);
    for (let i = 0; i < 11; i++) { const a = (-135 + i * 27) * Math.PI / 180; circle(x + Math.sin(a) * 6.6, Y(64.5) - Math.cos(a) * 6.6, 0.32, K); }
    T(x - 5, Y(73.5), 'MIN', 1.4, K, 'middle', 800); T(x + 5, Y(73.5), 'MAX', 1.4, K, 'middle', 800);
    p(`<g data-s9="${k}" style="cursor:ns-resize">`); circle(x, Y(64.5) + 0.6, 5.2, '#000', 'opacity="0.4"'); circle(x, Y(64.5), 5, '#a9aaad'); for (let i = 0; i < 24; i++) { const a = i * 15 * Math.PI / 180; p(`<line x1="${x + Math.sin(a) * 4.2}" y1="${Y(64.5) - Math.cos(a) * 4.2}" x2="${x + Math.sin(a) * 5}" y2="${Y(64.5) - Math.cos(a) * 5}" stroke="#6d6e72" stroke-width="0.35"/>`); }
    circle(x, Y(64.5), 3.4, cap); p(`<g class="${id('k-' + k)}" transform="rotate(0 ${x} ${Y(64.5)})"><rect x="${x - 0.3}" y="${Y(64.5) - 3.3}" width="0.6" height="2.4" fill="#222"/></g>`); circle(x, Y(64.5), 7, 'transparent'); p('</g>');
  };
  knob(X(78.7), 'rlev', 'REC LEVEL', '#b8403c'); knob(X(83.8), 'mon', 'MONITOR', '#e4dccb'); knob(X(89.6), 'out', 'OUTPUT', '#e4dccb', 'LEFT ⊙ RIGHT');
  T(X(80.8), Y(78.5), 'MIC —— INPUT —— LINE', 1.6, K, 'middle', 800); T(X(89.3), Y(78.5), 'REC/P.B TRIGGER', 1.6, K, 'middle', 800);
  for (const jx of [78.1, 83.5, 89.3]) { circle(X(jx), Y(87), X(1.15), '#111'); circle(X(jx), Y(87), X(0.95), '#b9babd'); circle(X(jx), Y(87), X(0.6), '#050505'); }
  p(`<g data-s9="foot" style="cursor:pointer"><circle cx="${X(89.3)}" cy="${Y(87)}" r="${X(1.3)}" fill="transparent"/></g>`);
}
function furmanFace(w, h, i) {
  // Fermann PL-8 C power conditioner (after the Furman PL-8 C): black 1U panel, the lamp drawers at both ends (the rack
  // lights pull out of the top), a red rocker, a voltmeter and an 8-LED amp bar, a front outlet, LIGHTS and a dimmer
  const W = '#e8e6e0', id = (k) => `fm${i}-${k}`, X = (pct) => pct / 100 * w;
  rect(0, 0, w, h, '#121213'); rect(0, 0, w, 1.2, '#fff', 'opacity="0.12"'); rect(0, h - 1.4, w, 1.4, '#000', 'opacity="0.55"');
  for (const ex of [0, w - 22]) { rect(ex, 0, 22, h, '#0d0d0e'); rect(ex + (ex ? 0 : 21.2), 0, 0.8, h, '#000', 'opacity="0.6"'); for (const ey of [6.6, h - 6.6]) { rect(ex + 4, ey - 3, 14, 6, '#050505', 'rx="3"'); screw(ex + 11, ey, 3.6); } }
  // the lamp drawers: a slot in the top edge with a finger pull at each end
  for (const lx of [X(5.2), X(87.6)]) { rect(lx, 0, X(7.2), 6, '#050505', 'rx="1"'); rect(lx + 2, 1.5, X(7.2) - 4, 2.4, '#2a2a2c', 'rx="1"'); rect(lx + X(3.6) - 6, 6.5, 12, 3, '#2b2b2e', 'rx="1.5"'); text(lx + X(3.6), 18, 'LAMP', 2.6, '#9b988f', 'middle', 800, 'letter-spacing="0.6"'); }
  // power rocker
  rect(X(15) - 6, h / 2 - 9, 12, 18, '#060606', 'rx="1.5"'); p(`<rect class="${id('pw')}" x="${X(15) - 5}" y="${h / 2 - 8}" width="10" height="16" rx="1" fill="#c8261c"/>`); rect(X(15) - 5, h / 2 - 8, 10, 6, '#fff', 'opacity="0.18" rx="1"');
  text(X(15), h - 5, 'POWER', 2.6, W, 'middle', 800, 'letter-spacing="0.6"');
  // badge
  text(X(27), h / 2 + 2, 'Fermann', 11, W, 'middle', 800, 'font-style="italic" letter-spacing="-0.2"');
  text(X(27), h / 2 + 9, 'POWER CONDITIONER · PL-8 C', 2.5, '#a9a69c', 'middle', 800, 'letter-spacing="0.5"');
  // front outlet
  rect(X(42) - 9, h / 2 - 11, 18, 22, '#d8d4c8', 'rx="3"'); for (const sx of [-3.5, 3.5]) rect(X(42) + sx - 0.8, h / 2 - 7, 1.6, 6, '#222', 'rx="0.5"'); circle(X(42), h / 2 + 5, 1.6, '#222');
  text(X(42), h - 3.5, '15A 125V', 2.3, '#9b988f', 'middle', 800);
  // voltmeter + amp bar
  rect(X(52), 7, X(13), h - 14, '#160302', 'rx="1.5"');
  p(`<text x="${X(55.6)}" y="${h / 2 + 4.5}" font-family="${MONO2}" font-size="12" font-weight="700" fill="#ff2a14" opacity="0.07" text-anchor="middle">888</text>`);
  p(`<text class="${id('v')}" x="${X(55.6)}" y="${h / 2 + 4.5}" font-family="${MONO2}" font-size="12" font-weight="700" fill="#ff2a14" filter="url(#glowSm)" text-anchor="middle">120</text>`);
  text(X(55.6), h - 9, 'VOLTS', 2.2, '#c9563f', 'middle', 800);
  for (let k = 0; k < 8; k++) { const ax = X(59.6) + k * 3.6, c = k < 5 ? '#4fe07a' : k < 7 ? '#ffc928' : '#ff3b2f'; circle(ax, h / 2 - 1, 1.1, '#1c0e0b'); p(`<circle class="${id('a' + k)}" cx="${ax}" cy="${h / 2 - 1}" r="1.1" fill="${c}" opacity="0" filter="url(#glowSm)"/>`); }
  text(X(59.6) + 12.6, h - 9, 'AMPS', 2.2, '#c9563f', 'middle', 800);
  // LIGHTS button + dimmer
  rect(X(71) - 6, h / 2 - 6, 12, 12, '#050505', 'rx="1"'); rect(X(71) - 5.2, h / 2 - 5.2, 10.4, 10.4, '#2b2b2e', 'rx="1"'); p(`<circle class="${id('lt')}" cx="${X(71)}" cy="${h / 2 - 9.5}" r="1" fill="#ffd27a" opacity="1" filter="url(#glowSm)"/>`);
  text(X(71), h - 5, 'LIGHTS', 2.6, W, 'middle', 800, 'letter-spacing="0.6"');
  const kx = X(79), ky = h / 2 - 1; circle(kx + 0.4, ky + 0.8, 6.4, '#000', 'opacity="0.6"'); circle(kx, ky, 6.2, '#2e2f33'); circle(kx, ky, 4.6, '#3c3d42');
  p(`<g class="${id('dim')}" transform="rotate(60 ${kx} ${ky})"><rect x="${kx - 0.45}" y="${ky - 5.8}" width="0.9" height="3.6" fill="#e8e6e0"/></g>`);
  text(kx, h - 5, 'DIMMER', 2.6, W, 'middle', 800, 'letter-spacing="0.6"');
}
function pcmFace(w, h, u) {
  // Leximan PCM41 / PCM42 (1U), laid out from photos of the real panels: positions are the centre of each control as a
  // percentage of the full 19-inch width (references/pcm41-42 README, sections 1.3 and 2.3)
  const is41 = u.startsWith('41'), W = '#ecebe6', id = (k) => `pcm${u}-${k}`, X = (pct) => pct / 100 * w;
  const ink = is41 ? '#8fa58a' : '#7fa6e0', inset = is41 ? '#7f957a' : '#2f5d9e';   // sage-green (41) / blue (42) inset bands
  rect(0, 0, w, h, is41 ? '#111112' : '#0d0f16'); rect(0, 0, w, 1.2, '#fff', 'opacity="0.1"'); rect(0, h - 1.4, w, 1.4, '#000', 'opacity="0.5"');
  for (const ex of [0, w - 22]) { rect(ex, 0, 22, h, is41 ? '#0c0c0d' : '#0a0b11'); rect(ex + (ex ? 0 : 21.2), 0, 0.8, h, '#000', 'opacity="0.6"'); for (const ey of [6.6, h - 6.6]) { rect(ex + 4, ey - 3, 14, 6, '#050505', 'rx="3"'); screw(ex + 11, ey, 3.6); } }
  const band = (x0, x1, lab) => { rect(X(x0), 4.5, X(x1) - X(x0), h - 9, inset, 'rx="3.5" opacity="0.9"'); if (lab) text((X(x0) + X(x1)) / 2, h - 6.2, lab, 2.4, '#0b0b0c', 'middle', 900, 'letter-spacing="0.6"'); };
  const led = (x, y, col, cls, r = 1.05, on = 0) => { circle(x, y, r + 0.35, '#000'); circle(x, y, r, '#2a1210'); p(`<circle class="${cls}" cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="${on}" filter="url(#glowSm)"/>`); };
  const btn = (x, y, k, lab, sub) => {
    p(`<g data-pb="${u}:${k}" style="cursor:pointer">`); rect(x - 3.6, y - 3.1, 7.2, 6.8, '#000', 'rx="0.7"'); rect(x - 3.2, y - 3.1, 6.4, 6, '#26272b', 'rx="0.6" stroke="#000" stroke-width="0.3"'); rect(x - 3.2, y - 3.1, 6.4, 1.6, '#fff', 'opacity="0.12" rx="0.6"'); p('</g>');
    if (lab) text(x, y - 5, lab, 2.15, '#0b0b0c', 'middle', 900); if (sub) text(x, y + 7.2, sub, 2.0, '#0b0b0c', 'middle', 900);
  };
  const knob = (x, k, lab, cap, ticks, v0) => {
    const cy = h / 2 - 1, r = 5.4, a0 = -150 + v0 * 300;
    for (let i = 0; i <= 10; i++) { const a = (-150 + i * 30) * Math.PI / 180; p(`<line x1="${x + Math.sin(a) * (r + 1)}" y1="${cy - Math.cos(a) * (r + 1)}" x2="${x + Math.sin(a) * (r + 2.2)}" y2="${cy - Math.cos(a) * (r + 2.2)}" stroke="#0b0b0c" stroke-width="0.4"/>`); }
    if (ticks) ticks.forEach(([v, t]) => { const a = (-150 + v * 300) * Math.PI / 180; text(x + Math.sin(a) * (r + 4.3), cy - Math.cos(a) * (r + 4.3) + 0.8, t, 1.9, '#0b0b0c', 'middle', 900); });
    p(`<g data-pk="${u}:${k}" style="cursor:ns-resize">`);
    circle(x + 0.4, cy + 0.8, r + 0.2, '#000', 'opacity="0.6"'); circle(x, cy, r, cap); circle(x, cy, r * 0.74, '#fff', 'opacity="0.13"'); circle(x, cy, r, 'none', 'stroke="#000" stroke-opacity="0.45" stroke-width="0.5"');
    p(`<g class="${id('k-' + k)}" transform="rotate(${a0.toFixed(1)} ${x} ${cy})"><rect x="${x - 0.4}" y="${cy - r + 0.4}" width="0.8" height="${r * 0.75}" rx="0.4" fill="${cap === '#c8352b' ? '#f5f0e6' : '#1a1a1a'}"/></g>`);
    p(`<circle cx="${x}" cy="${cy}" r="${r + 4}" fill="transparent"/></g>`);
    text(x, h - 4.6, lab, 2.15, '#0b0b0c', 'middle', 900);
  };
  const CREAM = '#e9e1cc', RED = '#c8352b', N10 = [[0, '0'], [1, '10']];
  const logo = (m) => { text(24, 17, 'pcm', 6.4, W, 'start', 800); text(24, 27.5, m, 9, W, 'start', 800); text(24, 33.5, 'DIGITAL DELAY', 1.55, ink, 'start', 800, 'letter-spacing="0.2"'); };
  if (is41) {
    band(10.8, 42.1); band(42.6, 65.6); band(66.4, 88);
    logo('41');
    ['#ff3b2f', '#ffc928', '#4fe07a', '#4fe07a', '#4fe07a'].forEach((c, i) => { led(X(8.3), 9 + i * 6.2, c, id('hr' + i)); text(X(8.3) + 2, 9.8 + i * 6.2, ['0dB', '6', '12', '18', '24'][i], 1.9, W, 'start', 800); });
    p(`<text x="${X(10.15)}" y="${h / 2}" transform="rotate(90 ${X(10.15)} ${h / 2})" font-size="1.9" font-weight="900" fill="${W}" text-anchor="middle" letter-spacing="0.4">HEADROOM</text>`);
    btn(X(14), h / 2 - 1, 'x2', 'DLY', 'X1/X2');
    knob(X(18), 'level', 'LEVEL', CREAM, N10, 0.7); knob(X(23), 'fb', 'FEEDBACK', CREAM, N10, 0);
    text(X(30.8), 7.6, 'FILTER', 2.0, '#0b0b0c', 'middle', 900);
    btn(X(27.5), h / 2, 'fbInv', 'INV'); btn(X(30.5), h / 2, 'lo', 'LO'); btn(X(34), h / 2, 'hi', 'HI');
    for (const [k, x] of [['fbInv', 27.5], ['lo', 30.5], ['hi', 34]]) led(X(x), h / 2 + 7.4, '#ff3b2f', id('l-' + k), 0.85);
    led(X(37), h / 2 - 1, '#4fe07a', id('byp')); text(X(37), h / 2 + 5, 'BYPASS', 1.8, '#0b0b0c', 'middle', 900);
    knob(X(39.9), 'mix', 'OUTPUT MIX', CREAM, [[0, 'IN'], [0.5, '='], [1, 'DLY']], 0.5);
    btn(X(44), h / 2, 'dlyInv', 'INV'); led(X(44), h / 2 + 7.4, '#ff3b2f', id('l-dlyInv'), 0.85);
    const X1 = ['0', '.8', '1.6', '2.4', '4', '7', '13', '26', '50', '100', '200'], X2 = ['0', '1.6', '3.2', '4.8', '8', '14', '26', '52', '100', '200', '400'];
    for (let i = 0; i < 11; i++) { const lx = X(46.4 + i * 1.5); text(lx, 8.6, X1[i], 1.75, W, 'middle', 800); led(lx, 12.6, '#ff3b2f', id('t' + i), 0.95); text(lx, 17.6, X2[i], 1.75, '#0b0b0c', 'middle', 900); }
    text(X(55), 22.4, 'DELAY (ms)', 1.9, '#0b0b0c', 'middle', 900);
    btn(X(50.5), 30.5, 'left'); btn(X(57), 30.5, 'right'); text(X(50.5), 31.4, '◀', 2.6, W, 'middle', 900); text(X(57), 31.4, '▶', 2.6, W, 'middle', 900);
    text(X(53.75), h - 4.6, 'DELAY SELECT', 2.0, '#0b0b0c', 'middle', 900);
    led(X(63.6), 13, '#ffa21f', id('x2')); text(X(63.6), 19, 'X2', 1.9, '#0b0b0c', 'middle', 900); led(X(63.6), 26, '#ffa21f', id('rpt')); text(X(63.6), 32, 'REPEAT', 1.8, '#0b0b0c', 'middle', 900);
    knob(X(68.5), 'mult', 'DELAY MULTIPLY', RED, [[0, 'X.5'], [0.5, 'X1'], [1, 'X2']], 0.5);
  } else {
    band(10.4, 41.2); band(41.6, 66.6); band(67, 87.6);
    logo('42');
    ['#ff3b2f', '#ffc928', '#4fe07a', '#4fe07a', '#4fe07a'].forEach((c, i) => { led(X(8), 9 + i * 6.2, c, id('hr' + i)); text(X(8) + 2, 9.8 + i * 6.2, ['0dB', '-6', '-12', '-18', '-24'][i], 1.8, W, 'start', 800); });
    btn(X(13), h / 2 - 1, 'x2', 'DELAY', 'X2');
    knob(X(17.5), 'level', 'LEVEL', CREAM, N10, 0.7); knob(X(22), 'fb', 'FEEDBACK', CREAM, N10, 0);
    text(X(27), 7.6, 'FILTER', 2.0, '#0b0b0c', 'middle', 900); text(X(31.5), 7.6, 'PHASE', 2.0, '#0b0b0c', 'middle', 900);
    btn(X(27), h / 2, 'hi', '', 'HI CUT'); btn(X(30), h / 2, 'fbInv', '', 'FB INV'); btn(X(33), h / 2, 'dlyInv', '', 'DLY INV');
    for (const [k, x] of [['hi', 27], ['fbInv', 30], ['dlyInv', 33]]) led(X(x), 12.2, '#ff3b2f', id('l-' + k), 0.85);
    led(X(35.6), h / 2 - 1, '#4fe07a', id('byp')); text(X(35.6), h / 2 + 5, 'BYPASS', 1.8, '#0b0b0c', 'middle', 900);
    knob(X(38.5), 'mix', 'OUTPUT MIX', CREAM, [[0, 'IN'], [0.5, '='], [1, 'DLY']], 0.5);
    btn(X(43), h / 2, 'rpt', '∞', 'RPT');
    btn(X(47), h / 2, 'down', '', 'DOWN'); text(X(47), h / 2 + 1, '▼', 2.4, W, 'middle', 900);
    btn(X(51.6), h / 2, 'up', '', 'UP'); text(X(51.6), h / 2 + 1, '▲', 2.4, W, 'middle', 900);
    p(`<g data-pb="${u}:mode" style="cursor:pointer">`); rect(X(49.3) - 1.6, h / 2 - 5.5, 3.2, 11, '#050505', 'rx="0.8"'); p(`<rect class="${id('slide')}" x="${X(49.3) - 1.3}" y="${h / 2 - 5.2}" width="2.6" height="4.6" rx="0.5" fill="#3a3b40"/>`); p('</g>');
    text(X(49.3), 8, 'DLY', 1.7, '#0b0b0c', 'middle', 900); text(X(49.3), h - 7.4, 'CLK', 1.7, '#0b0b0c', 'middle', 900); text(X(49.3), h - 4.6, 'SET-MODE', 1.7, '#0b0b0c', 'middle', 900);
    text(X(59), 8.2, 'DELAY-ms', 2.1, '#0b0b0c', 'middle', 900);
    rect(X(54.4), 10.5, X(9.2), 18, '#1a0402', 'rx="1"'); rect(X(54.4), 10.5, X(9.2), 18, 'none', 'rx="1" stroke="#000" stroke-width="0.6"');
    p(`<text x="${X(59)}" y="25" font-family="${MONO2}" font-size="13" font-weight="700" fill="#ff2a14" opacity="0.07" text-anchor="middle">8888</text>`);
    p(`<text class="${id('disp')}" x="${X(59)}" y="25" font-family="${MONO2}" font-size="13" font-weight="700" fill="#ff2a14" filter="url(#glowSm)" text-anchor="middle">0</text>`);
    text(X(59), h - 4.6, 'DELAY', 2.0, '#0b0b0c', 'middle', 900);
    [['clk', 'CLK'], ['inf', '∞'], ['k6', '6KHz']].forEach(([k, l], i) => { led(X(64.3), 12 + i * 8, '#ff3b2f', id(k), 0.95); text(X(64.3) + 2.2, 12.8 + i * 8, l, 1.8, '#0b0b0c', 'start', 900); });
    knob(X(68.6), 'mult', 'MANUAL', RED, [[0, 'X.5'], [0.5, 'X1'], [1, 'X1.5']], 0.5);
  }
  knob(X(73.5), 'depth', 'DEPTH', RED, N10, 0);
  knob(X(is41 ? 79.2 : 78.6), 'wave', 'WAVEFORM', RED, [[0, '∿'], [0.5, 'ENV'], [1, '⊓']], 0);
  knob(X(84.4), 'rate', 'RATE', RED, [[0, '.1'], [1, '10']], 0.5);
  led(X(86.8), 9.5, '#4fe07a', id('lfo'), 0.95);
  p(`<g data-pb="${u}:power" style="cursor:pointer">`); rect(X(89.4) - 3.6, h / 2 - 4, 7.2, 8, '#000', 'rx="0.8"'); rect(X(89.4) - 3.2, h / 2 - 3.8, 6.4, 7, '#b52a22', 'rx="0.7"'); rect(X(89.4) - 3.2, h / 2 - 3.8, 6.4, 2, '#fff', 'opacity="0.18" rx="0.7"'); p('</g>');
  p(`<circle class="${id('pw')}" cx="${X(89.4)}" cy="${h / 2 - 7}" r="0.8" fill="#ff3b2f" opacity="1" filter="url(#glowSm)"/>`);
  text(X(89.4), h - 4.6, 'POWER', 1.9, W, 'middle', 900);
  text(X(93.3), h / 2 - 1, 'leximan', 4.2, W, 'middle', 800, 'font-style="italic"');
  text(X(93.3), h / 2 + 4.5, u.slice(2) === 'A' ? 'UNIT A' : 'UNIT B', 1.8, ink, 'middle', 900, 'letter-spacing="0.4"');
  p(`<text class="${id('route')}" x="${X(93.3)}" y="${h - 4}" font-family="${MONO2}" font-size="1.7" font-weight="700" fill="#e8a33a" text-anchor="middle">NOT PATCHED</text>`);
}
const RX = 3290, RY = 60, RW = 550, RH = 2100;
const PX_PER_IN19 = 1395 / 19;   // the pop-ups' 19-inch scale (a 60-inch 4K screen)
{
  // Real 19-inch proportions: every panel spans the rails (its ears, with their rack screws, cover them) and one rack
  // unit is 1.75 in tall: 498 px wide x 46 px per U (10.9 : 1). Faces drawn for the old 450 x (60n - 4) size are
  // scaled evenly (never stretched) and centred between the ears; a face marked native is drawn at the panel's size.
  const U = PNL.U, UX = 50, UW = RW - 100, PX = 26, PW = RW - 52, EAR = 22, DEPTH = 70;
  const units = [];      // { y, h, html }
  let uy = 70;
  const rackKnobs = [];
  const RK = (x, y, r, cap, ang, o = {}) => rackKnobs.push(knob3d(x, y, r, cap, ang, o));
  const LW = '#e6e2d8';
  function unit(n, fill, draw, o = {}) {
    const h = n * U - PNL.GAP, y0 = uy, kStart = rackKnobs.length, nh = n * 60 - 4, k = h / nh, ox = (PW - UW * k) / 2;
    // the panel: full width, ears with slotted holes and rack screws over the rails (EIA hole positions)
    const base = capture(() => { if (o.native) draw(PW, h); else panelBase(n, fill, h); });
    const face = o.native ? '' : capture(() => draw(UW, nh));
    const kn = rackKnobs.splice(kStart).join('');
    const inner = o.native ? '' : `<div style="${B3(`left:${ox.toFixed(2)}px;top:0;width:${UW}px;height:${nh}px;transform-origin:0 0;transform:scale(${k.toFixed(4)})`)}">${svgWrap(UW, nh, face)}${kn}</div>`;
    units.push(`<div style="${B3(`left:${PX}px;top:${y0}px;width:${PW}px;height:${h}px;transform:translateZ(2px);box-shadow:0 6px 12px rgba(0,0,0,0.6)`)}">${svgWrap(PW, h, base)}${inner}</div>`);
    uy += n * U;
    return { y: RY + y0, h, k, x: PX + ox, map: (fx, fy) => [PX + ox + fx * k, y0 + fy * k] };   // face coordinates -> rack coordinates
  }
  globalThis.RACK_HOT = {};
  globalThis.RACK_HOT.fm0 = unit(1, '#121213', (w, h) => furmanFace(w, h, 0), { native: true });   // Fermann PL-8 C on top: the rack lights
  // Leximan 224X mainframe (4U): the same drawing as in its pop-up, scaled to the panel
  globalThis.RACK_HOT['224'] = unit(4, '#161718', (w, h) => { p(`<g transform="scale(${(w / 1760).toFixed(5)} ${(h / Math.round(1760 * 7 / 19)).toFixed(5)})">`); lex224Frame(0, 0, 1760, Math.round(1760 * 7 / 19)); p('</g>'); }, { native: true });
  // dbk 160X x2 (1U each): compressors on channel inserts (patchbay), live in the audio engine
  for (const u of ['A', 'B']) globalThis.RACK_HOT['c160' + u] = unit(1, '#232127', (w, h) => c160Face(w, h, u), { native: true });
  globalThis.RACK_HOT.im90 = unit(3, '#16161a', (w, h) => im90Face(w, h), { native: true });   // Publizon IM90 (3U)
  // Yahaha SPX90II x2 (1U each): working multi-effects, each on its own patch point
  for (const u of ['A', 'B']) globalThis.RACK_HOT['spx' + u] = unit(1, '#161618', (w, h) => spxFace(w, h, u), { native: true });
  globalThis.RACK_HOT.h949 = unit(2, '#151517', (w, h) => h949Face(w, h), { native: true });   // Evertide H949 Harmonizer (2U)
  globalThis.RACK_HOT.rmx = unit(2, '#18191b', (w, h) => rmxFace(w, h), { native: true });   // AXS RMX16 (2U)
  // Leximan PCM41 x2 and PCM42 x2 (1U each): working delays, each on its own patch point
  for (const u of ['41A', '41B', '42A', '42B']) globalThis.RACK_HOT['pcm' + u] = unit(1, '#111112', (w, h) => pcmFace(w, h, u), { native: true });
  // Rowan SBX-80 sync box (1U): two-tone grey, orange legends, green VFD readouts that follow the sync engine
  globalThis.RACK_HOT.sbx = unit(1, '#ebe8de', (w, h) => {
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
  globalThis.RACK_HOT.sg = unit(1, '#0d0d0e', (w, h) => sgFace(w, h));
  globalThis.RACK_HOT.dz = unit(1, '#cfcdc7', (w, h) => dzFace(w, h));
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
  const PB = globalThis.RACK_HOT.patchbay = unit(2, 'url(#rackBlack)', (w, h) => {
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
  const PJ = (j, row) => PB.map(34 + j * 16.5, 46 + row * 40);   // a jack on the patchbay face, in rack coordinates
  const cables = `<svg width="${RW}" height="${RH}" style="position:absolute;left:0;top:0;overflow:visible">${cab(...PJ(12, 0), ...PJ(0, 1), 63, '#c0392b')}${cab(...PJ(19, 0), ...PJ(1, 1), 79, '#2f6fb3')}${cab(...PJ(6, 0), ...PJ(20, 1), 55, '#e8c34a')}</svg>`;
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
    ['224 Digital Reverb', '160X Compressor', 'IM90 Infernal Machine', 'SPX90 Multi-Effect', 'PCM41 Digital Delay', 'PCM42 Digital Delay'].forEach((b, i) => {
      const ry = 146 + i * 44;
      rect(20, ry, bw - 40, 38, i % 2 ? '#17181b' : '#1c1d20', 'rx="3"');
      text(34, ry + 25, b, 15, '#e8e4d8', 'start', 600);
      text(bw - 34, ry + 25, i === 0 || i === 2 ? '1 in rack' : '2 in rack', 14, '#a9a594', 'end', 600);
    });
    const tp = 146 + 6 * 44 + 22;   // below the built-in list
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
  // the Fermann's two lamps pulled out of its top edge, leaning over the rack, and the warm light they throw down it
  const fmTop = 70, fmH = U - PNL.GAP;
  const lampsHtml = (n) => `<div class="fm-lamps" data-fm="${n}" data-on="1" style="--dim:0.85;${B3(`left:0;top:0;width:${RW}px;height:${RH}px;pointer-events:none`)}">${[5.2, 87.6].map((pc) => { const lx = 26 + pc / 100 * PW; return `<div class="fm-lamp" style="${B3(`left:${(lx - 8).toFixed(1)}px;top:${fmTop - 14}px;width:${(7.2 / 100 * PW + 16).toFixed(1)}px;height:16px;transform:translateZ(30px)`)}"><i></i></div>`; }).join('')}</div>`;
  globalThis.FM_LAMPS = lampsHtml;
  // the light itself: a flat layer over each rack's face (2D: big translucent layers inside the 3D scene draw unreliably)
  const lightHtml = (n, x, keep) => `<div class="fm-light${keep ? ' rk-keep' : ''}" data-fm="${n}" data-on="1" style="--dim:0.85;left:${x + 26}px;top:${RY + fmTop - 4}px;width:${RW - 52}px;height:${RH - fmTop - 16}px">${[5.2, 87.6].map((pc) => `<b class="fm-beam" style="left:${(pc / 100 * PW + 3.6 / 100 * PW).toFixed(1)}px"></b>`).join('')}<i class="fm-glow"></i><i class="fm-dark"></i></div>`;
  globalThis.FM_LIGHT = lightHtml;
  const fmPanel = (n) => `<div style="${B3(`left:${PX}px;top:${fmTop}px;width:${PW}px;height:${fmH}px;transform:translateZ(2px);box-shadow:0 6px 12px rgba(0,0,0,0.6)`)}">${svgWrap(PW, fmH, capture(() => furmanFace(PW, fmH, n)))}</div>`;
  scenes3d.push(`<div id="rack-main" class="rk-keep" style="position:absolute;left:${RX}px;top:${RY}px;width:${RW}px;height:${RH}px;perspective:2200px;perspective-origin:-60% 40%;">
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
      ${lampsHtml(0)}
      <div style="${B3(`left:${UX}px;top:${by0}px;width:${bw}px;height:${bh}px;transform:translateZ(2px)`)}">${svgWrap(bw, bh, browser)}</div>
    </div>
  </div>`);
  // ---- the racks room (RACKS button): the outboard rack where it stands, and three more cabinets to its left, empty for
  // now (audio and MIDI gear to come). Same cabinet, same rails and the same 19-inch unit pitch as the outboard rack.
  // the Akita S900 (3U) in RACK 3, under its Fermann
  const s9H = 3 * U - PNL.GAP;
  const s9Panel = () => `<div style="${B3(`left:${PX}px;top:${fmTop + U}px;width:${PW}px;height:${s9H}px;transform:translateZ(2px);box-shadow:0 6px 12px rgba(0,0,0,0.6)`)}">${svgWrap(PW, s9H, capture(() => s900Face(PW, s9H)))}</div>`;
  globalThis.S9_HOT = { x: RX - (RW + 40) + 26, y: RY + fmTop + U, w: RW - 52, h: s9H };
  // the Rowan TR-8080 on a 6U shelf in RACK 1, under its Fermann
  const trH = 6 * U - PNL.GAP;
  const trPanel = () => `<div style="${B3(`left:${PX}px;top:${fmTop + U}px;width:${PW}px;height:${trH}px;transform:translateZ(2px);box-shadow:0 6px 12px rgba(0,0,0,0.6)`)}">${svgWrap(PW, trH, capture(() => tr808Shelf(PW, trH)))}</div>`;
  globalThis.TR_HOT = { x: RX - 3 * (RW + 40) + 26, y: RY + fmTop + U, w: RW - 52, h: trH };
  const RACK_USED = { 3: 3 };
  const rackCab = (x, title, sub, n) => `<div class="rk-cab" data-rack="${n}" style="position:absolute;left:${x}px;top:${RY}px;width:${RW}px;height:${RH}px;perspective:2200px;perspective-origin:-60% 40%;">
    <div style="${B3(`left:0;top:0;width:${RW}px;height:${RH}px`)}">
      <div style="${B3(`left:0;top:0;width:${RW}px;height:${RH}px;transform:translateZ(-${DEPTH}px);background:#0b0a09`)}"></div>
      <div style="${B3(`left:26px;top:0;width:${DEPTH}px;height:${RH}px;transform-origin:0 50%;transform:rotateY(90deg);background:linear-gradient(90deg,#3a2414,#1a0f08)`)}"></div>
      <div style="${B3(`left:${RW - 26}px;top:0;width:${DEPTH}px;height:${RH}px;transform-origin:0 50%;transform:rotateY(90deg);background:linear-gradient(90deg,#2a190c,#120a05)`)}"></div>
      <div style="${B3(`left:0;top:0;width:${RW}px;height:${RH}px;transform:translateZ(-4px)`)}">${svgWrap(RW, RH, rails)}</div>
      <div style="${B3(`left:0;top:0;width:26px;height:${RH}px;transform:translateZ(8px);background:${woodV}`)}"></div>
      <div style="${B3(`left:${RW - 26}px;top:0;width:26px;height:${RH}px;transform:translateZ(8px);background:${woodV}`)}"></div>
      <div style="${B3(`left:0;top:0;width:8px;height:${RH}px;transform-origin:0 50%;transform:translateZ(8px) rotateY(90deg);background:#4a2c14`)}"></div>
      <div style="position:absolute;left:0;top:14px;width:${RW}px;text-align:center;font:800 18px ${SANS};letter-spacing:4px;color:#e9e3d0">${title}</div>
      <div style="position:absolute;left:0;top:40px;width:${RW}px;text-align:center;font:600 14px ${SANS};color:#bdb8aa">${sub}</div>
      ${fmPanel(n)}
      ${n === 3 ? s9Panel() : ''}
      <div class="rk-empty" style="${B3(`left:${UX}px;top:${fmTop + (1 + (RACK_USED[n] || 0)) * U + 6}px;width:${UW}px;height:${RH - 116 - (1 + (RACK_USED[n] || 0)) * U}px;transform:translateZ(1px)`)}"><span>EMPTY</span><small>${Math.floor((RH - 116 - (1 + (RACK_USED[n] || 0)) * U) / U)} U · 19-inch rails</small></div>
      ${lampsHtml(n)}
    </div>
  </div>`;
  const ROOM_RACKS = [1, 2, 3].map((k) => rackCab(RX - k * (RW + 40), `RACK ${4 - k}`, 'audio &amp; MIDI gear · to come', 4 - k));
  // the desk left of the racks: the TR-8080 and the TR-9090 as small desktop units (their lights still follow the music);
  // click one to open it in its large pop-up, where it is played
  const t8H9 = Math.round(484 * 453 / 758), deskL = 70, deskR = RX - 3 * (RW + 40) - 50, deskY = 560, gap = 70;
  const d8W = Math.round((deskR - deskL - gap) * 0.52), d8H = Math.round(d8W * 300 / 528), d9W = deskR - deskL - gap - d8W, d9H = Math.round(d9W * t8H9 / 484);
  const unitBox = (x, y, w, h, vb, body, view, title) => `<div class="rr-unit" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"><svg width="${w}" height="${h}" viewBox="${vb}" style="display:block;pointer-events:none">${capture(body)}</svg></div><div class="hot rr-open" data-open="${view}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" title="${title}"><span>${title}</span></div>`;
  const desk = `<div class="rr-desk" style="left:${deskL - 40}px;top:${deskY - 70}px;width:${deskR - deskL + 80}px;height:${2160 - deskY + 70}px"></div>`
    + unitBox(deskL, deskY + Math.max(0, (d9H - d8H) / 2), d8W, d8H, '0 0 528 300', () => tr808Body(528, 300), 'tr808', 'Open the Rowan TR-8080')
    + unitBox(deskL + d8W + gap, deskY, d9W, d9H, `0 0 484 ${t8H9}`, () => tr909Body(484, t8H9), 'tr909', 'Open the Rowan TR-9090')
    + `<div class="rr-909cap" style="left:${deskL}px;top:${deskY + Math.max(d8H, d9H) + 28}px;width:${deskR - deskL}px">ROWAN TR-8080 · ROWAN TR-9090 · click one to play it</div>`;
  const juW = deskR - deskL, juH = Math.round(juW * 356 / 1132), juY = deskY + Math.max(d8H, d9H) + 110;
  const juDesk = unitBox(deskL, juY, juW, juH, '0 0 1132 356', () => junoBody(1132, 356), 'juno', 'Open the Rowan JUNO-1060') + `<div class="rr-909cap" style="left:${deskL}px;top:${juY + juH + 24}px;width:${juW}px">ROWAN JUNO-1060 · click it to play</div>`;
  const spW = Math.round(juW * 0.48), spH = Math.round(spW * 340 / 520), spY = juY + juH + 110;
  const spDesk = unitBox(deskL, spY, spW, spH, '0 0 520 340', () => spBody(520, 340), 'sp1200', 'Open the E-mew SP-1200') + `<div class="rr-909cap" style="left:${deskL}px;top:${spY + spH + 20}px;width:${spW}px">E-MEW SP-1200 · click it to play</div>`;
  scenes3d.unshift(`<div id="racks-room"><div class="rr-title">RACKS</div>${desk}${juDesk}${spDesk}<div class="rr-sub">The outboard rack and three more, for the audio and MIDI gear to come. Click a unit in the outboard rack to open it.</div><button type="button" class="rr-back" data-f="racks">◀ STUDIO</button>${ROOM_RACKS.reverse().join('')}${[1, 2, 3].map((k) => lightHtml(4 - k, RX - k * (RW + 40), false)).join('')}<div class="hot" data-open="s900" style="left:${globalThis.S9_HOT.x}px;top:${Math.round(globalThis.S9_HOT.y)}px;width:${globalThis.S9_HOT.w}px;height:${Math.round(globalThis.S9_HOT.h)}px" title="Open the Akita S900 sampler"><span>Open the Akita S900 sampler</span></div>${[1, 2, 3].map((k) => `<div class="fm-hot" data-fm="${4 - k}" style="left:${RX - k * (RW + 40) + 26}px;top:${RY + fmTop}px;width:${RW - 52}px;height:${Math.round(fmH)}px" title="Fermann PL-8 C: click to pull the rack lights out or push them in; drag up / down or scroll for the dimmer"></div>`).join('')}</div>`);
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
    const c = i % 8, r = Math.floor(i / 8), x = c * 480, y = 24 + r * 690;
    rect(x + 10, y, 460, 660, '#2c2926', 'rx="10"'); rect(x + 10, y, 460, 660, 'url(#bezelHi)', 'rx="10" opacity="0.5"');
    recLamp(i, x + 430, y + 30, 11);
    circle(x + 396, y + 30, 11, i === 23 ? '#5fb4ff' : '#16304a', i === 23 ? 'filter="url(#glow)"' : '');
    rect(x + 24, y + 54, 432, 330, '#0a0908', 'rx="10"'); rect(x + 24, y + 54, 432, 330, 'url(#bezelHi)', 'rx="10"');
    vu(x + 42, y + 70, 396, 296, tapeDb[i], { needleId: i });
    text(x + 30, y + 452, String(i + 1).padStart(2, '0'), 46, '#ece7dc', 'start', 800);
    rect(x + 112, y + 410, 344, 58, 'url(#tapeMask)', `rx="2" transform="rotate(${(((i * 37) % 7) - 3) * 0.25} ${x + 284} ${y + 439})"`);
    text(x + 284, y + 452, tapeNames[i], 34, '#1c2a6e', 'middle', 700, `font-family="${MARKER}"`);
    readySafe(i, x + 30, x + 250, y + 500, 200, 72, 26);
    p(`<g class="trk-off" data-t="${i}">`); text(x + 240, y + 626, 'SAFE · MONITORING REPRO', 20, '#b8b1a5', 'middle', 800, 'letter-spacing="1.5"'); p('</g>');
    p(`<g class="trk-on" data-t="${i}" opacity="0">`); text(x + 240, y + 626, 'RECORD READY · MONITORING INPUT', 20, '#ff8a7a', 'middle', 800, 'letter-spacing="1.5"'); p('</g>');
  }
});
// Leximan 224X mainframe (4U, 19"): black chassis with the blue name band (rack unit and the 224X pop-up)
function lex224Frame(fx, fy, fw, fh) {
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
}
const lexView = capture(() => {
  rect(0, 0, W, OVH, 'url(#wall)'); for (let x = 0; x < W; x += 96) { rect(x, 0, 94, OVH, 'url(#woodH)', 'opacity="0.3"'); rect(x + 94, 0, 2, OVH, '#000', 'opacity="0.6"'); }
  rect(0, 0, W, OVH, '#000', 'opacity="0.35"');
  // 224X mainframe (4U, 19"): black chassis with the blue name band
  const fx = 1900, fy = 640, fw = 1760, fh = Math.round(1760 * 7 / 19);
  rect(fx + 20, fy + 40, fw, fh, '#000', 'opacity="0.6" filter="url(#soft)"');
  lex224Frame(fx, fy, fw, fh);
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
// a rack unit's hot area, from where unit() put it (full panel width, over the rails)
const rhot = (key, view, title) => { const H = globalThis.RACK_HOT[key]; return hot(RX + 26, Math.round(H.y), RW - 52, Math.round(H.h), view, title).replace('class="hot', 'class="hot rk-keep'); };
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>JH-Studio by NMAudiowerks · 4K mockup</title>
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
  body.fullview #stage>:not(.overlay){visibility:hidden}
  /* OldTools splash: a centred window over the studio while it loads; click to skip */
  #splash{position:absolute;inset:0;z-index:900;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);transition:opacity .9s ease}
  #splash.gone{opacity:0;pointer-events:none}
  #splash .card{position:relative;width:1880px;height:1060px;border-radius:14px;overflow:hidden;background:radial-gradient(120% 90% at 70% 30%,#2a2620 0%,#16140f 55%,#0d0c0a 100%);box-shadow:0 40px 140px rgba(0,0,0,.8),0 0 0 2px rgba(255,255,255,.05);font-family:Archivo,Arial,sans-serif;color:#efe6d2;cursor:pointer}
  #splash .hero{position:absolute;left:0;right:0;top:0;height:636px;background-size:cover;background-position:center 40%;-webkit-mask-image:linear-gradient(180deg,#000 62%,transparent 100%),linear-gradient(90deg,transparent 0,#000 8%,#000 92%,transparent 100%);-webkit-mask-composite:source-in;mask-image:linear-gradient(180deg,#000 62%,transparent 100%);opacity:.96;filter:brightness(.74)}   /* the machine dimmed, so the name leads */
  #splash .presents{position:absolute;left:130px;top:560px;font:800 30px Archivo,Arial;letter-spacing:9px;text-transform:uppercase;color:#cfc4ae}
  #splash .word{position:absolute;left:118px;top:596px;font:900 196px/1 Archivo,Arial;letter-spacing:-6px;color:#f2eadb}
  #splash .word i{font-style:normal;color:#e8a33a}
  #splash .edition{position:absolute;left:1010px;top:648px;font:800 44px Archivo,Arial;letter-spacing:6px;text-transform:uppercase;color:#e8a33a}
  #splash .tag{position:absolute;left:1012px;top:706px;font:600 30px/1.35 Archivo,Arial;color:#b9ad95;letter-spacing:1px}
  #splash .bar{position:absolute;left:134px;right:134px;bottom:118px;height:6px;border-radius:3px;background:#2c2822;overflow:hidden}
  #splash .bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#c9862c,#f0b04a);box-shadow:0 0 18px rgba(240,176,74,.6);transition:width .35s ease}
  #splash .status{position:absolute;left:134px;bottom:146px;font:600 28px 'JetBrains Mono',monospace;color:#cfc4ae}
  #splash .foot{position:absolute;left:134px;right:134px;bottom:50px;display:flex;justify-content:space-between;font:600 24px Archivo,Arial;color:#8f867a;letter-spacing:1px}
  .overlay.float{background:transparent;pointer-events:none}   /* the studio stays usable around floating windows */
  .overlay.float .ov-win{pointer-events:auto}
  .overlay.float .ov-bar{cursor:move;user-select:none}   /* the studio stays as it is behind a floating window (clicking it still closes the window) */
  .overlay.float .ov-win{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border-radius:12px;overflow:hidden;border:2px solid #000;background:#141210;box-shadow:0 30px 90px rgba(0,0,0,.75),0 0 0 1px rgba(255,255,255,.06)}
  .overlay.float .ov-bar{height:auto;min-height:52px;flex-wrap:wrap;gap:14px 18px;padding:6px 16px;font-size:17px;letter-spacing:2px}
  .overlay.float .ov-bar button.ov-close{padding:6px 12px}
  .overlay.float .ov-body{position:relative;left:auto;top:auto;width:auto;height:auto}
  .overlay.float .ov-body>svg{display:block}
  #ov-strip .ov-bar{flex-wrap:nowrap;justify-content:space-between;min-height:0;height:40px;padding:0 10px 0 16px;font-size:18px}
  #ov-strip .ov-bar button.ov-close{padding:4px 10px}
  .ovsync{padding:0 0 18px;background:#141210}.ovsync>svg{display:block}
  .ovsync svg text{pointer-events:none}   /* legends never swallow a click meant for the key under them */
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
  #files-bar .fbtns .rk-btn{grid-column:1 / -1;background:linear-gradient(#e8b54a,#c8902c)}
  body.racksview #files-bar .fbtns .rk-btn{background:linear-gradient(#cfe0c2,#9fb88f)}
  #racks-room{position:absolute;left:0;top:0;width:3840px;height:2160px;display:none;background:radial-gradient(ellipse at 60% 35%,#2c2622,#141110 70%),#141110}
  #racks-room::after{content:'';position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(#1b1512,#0d0a08);border-top:2px solid #2e241c;z-index:-1}
  body.racksview #racks-room{display:block}
  body.racksview #stage>*:not(.rk-keep):not(.overlay):not(#racks-room){visibility:hidden}
  #racks-room .rr-title{position:absolute;left:90px;top:80px;font:900 64px Archivo,Arial;letter-spacing:14px;color:#efe6d2}
  #racks-room .rr-sub{position:absolute;left:94px;top:170px;width:1200px;font:600 24px Archivo,Arial;color:#a9a294;line-height:1.5}
  #racks-room .rr-back{position:absolute;left:94px;top:260px;font:900 20px Archivo,Arial;letter-spacing:3px;padding:16px 30px;border-radius:6px;border:1px solid #000;background:linear-gradient(#ece6d6,#cfc7b2);color:#1a1612;cursor:pointer;box-shadow:0 4px 0 #0c0b0a}
  .fm-hot{position:absolute;cursor:pointer;z-index:5}
  .pg-wrap{position:relative;display:block}
  .pg-veil{position:absolute;inset:0;background:rgba(8,8,10,.42);display:flex;align-items:flex-end;justify-content:center;cursor:not-allowed;z-index:4}
  .pg-veil span{margin-bottom:6px;padding:4px 12px;background:rgba(20,10,6,.85);color:#ffb02e;font:800 15px 'JetBrains Mono',monospace;letter-spacing:1px;border-radius:3px}
  body[data-studio="sls"] #cmi-fdr-hot{display:none}
  .rr-desk{position:absolute;border-radius:10px 10px 0 0;background:linear-gradient(180deg,#6b4527,#57361d 30%,#4a2d17);box-shadow:inset 0 2px 0 rgba(255,220,180,.18),0 -6px 30px rgba(0,0,0,.6)}
  .rr-desk::before{content:'';position:absolute;inset:0;border-radius:inherit;background:repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 3px,rgba(255,255,255,.025) 3px 9px,rgba(0,0,0,.04) 9px 17px);opacity:.9}
  .rr-unit{position:absolute;filter:drop-shadow(0 18px 22px rgba(0,0,0,.65)) drop-shadow(0 3px 4px rgba(0,0,0,.5))}
  .rr-open{border-radius:6px}
  .rr-909cap{position:absolute;text-align:center;font:700 20px 'JetBrains Mono',monospace;color:#e7d6b8;letter-spacing:1px}
  .s9kb{position:relative;height:200px;margin:10px auto 4px;width:2093px;user-select:none;touch-action:none}
  .s9kb i{position:absolute;top:0;height:200px;background:linear-gradient(#f4f1ea,#ddd8cc);border:1px solid #444;border-radius:0 0 5px 5px;box-sizing:border-box;cursor:pointer}
  .s9kb i.b{height:124px;background:linear-gradient(#2a2a2c,#0d0d0e);border-color:#000;z-index:2}
  .s9kb i.on{background:linear-gradient(#ffd59a,#e0a95a)}
  .s9kb i.b.on{background:linear-gradient(#a8692a,#6a3c12)}
  .s9kb i span{position:absolute;bottom:6px;left:0;right:0;text-align:center;font:700 11px Archivo,Arial;color:#777}
  .fm-lamp{transition:transform .5s ease,opacity .5s ease}
  .fm-lamp i{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:4px 4px 2px 2px;background:linear-gradient(#8a8c92,#4a4c52 45%,#26272b);border:1px solid #111;box-shadow:0 4px 8px rgba(0,0,0,.8)}
  .fm-lamp i::before{content:'';position:absolute;left:50%;top:100%;width:6px;height:12px;margin-left:-3px;background:linear-gradient(90deg,#2a2b2e,#6a6c71,#2a2b2e)}
  .fm-lamp i::after{content:'';position:absolute;left:5px;right:5px;bottom:-3px;height:4px;border-radius:2px;background:#fff6e0;box-shadow:0 2px calc(26px * var(--dim)) calc(9px * var(--dim)) rgba(255,214,150,calc(0.95 * var(--dim))),0 0 4px #fff}
  .fm-light{position:absolute;pointer-events:none;z-index:4}
  .fm-light .fm-glow,.fm-light .fm-dark{position:absolute;left:0;top:0;width:100%;height:100%;transition:opacity .6s ease}
  .fm-light .fm-glow{background:radial-gradient(ellipse 120% 70% at 50% 0%,rgba(255,214,150,calc(0.3 * var(--dim))),rgba(255,206,140,calc(0.1 * var(--dim))) 45%,rgba(255,200,130,0) 85%)}
  .fm-light .fm-dark{background:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.62));opacity:0}
  .fm-beam{position:absolute;top:0;width:180px;height:640px;margin-left:-90px;background:radial-gradient(ellipse 50% 100% at 50% 0%,rgba(255,230,180,calc(0.22 * var(--dim))),rgba(255,220,160,0) 72%);transition:opacity .6s ease}
  .fm-light[data-on="0"] .fm-glow,.fm-light[data-on="0"] .fm-beam{opacity:0}
  .fm-light[data-on="0"] .fm-dark{opacity:1}
  .fm-lamps[data-on="0"] .fm-lamp{opacity:0}
  .rk-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border:2px dashed rgba(233,227,208,0.16);border-radius:6px;color:rgba(233,227,208,0.32);font:900 30px Archivo,Arial;letter-spacing:10px}
  .rk-empty small{font:700 16px Archivo,Arial;letter-spacing:3px}
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
<div id="splash" role="dialog" aria-label="OldTools is starting"><div class="card"><div class="hero" style="background-image:url(data:image/jpeg;base64,${fs.readFileSync(path.join(__dirname, 'assets', 'splash-reels.jpg')).toString('base64')})"></div><div class="presents">NMAudiowerks presents</div><div class="word">Old<i>T</i>ools</div><div class="edition">JH-Studio · NYC 80<span style="text-transform:none">s</span> Edition</div><div class="tag">The tools we used.<br>The way things worked.</div><div class="status" id="spl-status">Starting…</div><div class="bar"><b id="spl-bar"></b></div><div class="foot"><span>Version 1.0 · © NMAudiowerks</span><span>Click to continue</span></div></div></div>
${svg}
${jh24}
${scenes3d.join('\n')}
${wallClock(AX + (12 + 376 / 2) * ALK, 66)}
<div id="files-bar" class="rk-keep" style="left:${globalThis.RACK_FILES.x}px;top:${globalThis.RACK_FILES.y}px;width:${globalThis.RACK_FILES.w}px">
  <div class="fbtns"><button type="button" data-f="load" title="Open a .TAP tape or a .MIX mix">LOAD</button><button type="button" data-f="save" title="Save the tape (.TAP) or the mix (.MIX)">SAVE</button><button type="button" data-f="import" title="Audio files onto tape tracks (WAV, AIFF, FLAC, MP3, AAC, OGG, CAF … numbered stems or one multichannel file), or a .TAP / .MIX">IMPORT</button><button type="button" data-f="export" title="The tape's tracks out as audio files">EXPORT</button><button type="button" data-f="racks" class="rk-btn" title="The racks room: the outboard rack and three more racks for audio and MIDI gear">RACKS</button></div>
  <div class="fmenu" id="fm-save" hidden><button type="button" data-f="save-tap">TAPE <i>.TAP</i><small>the reel: its recordings, SMPTE, tempo map, locate points, alignment</small></button><button type="button" data-f="save-mix">MIX <i>.MIX</i><small>both consoles' channel settings and the patchbay</small></button></div>
  <div class="fmenu" id="fm-export" hidden><label>FORMAT <select id="fx-fmt"><option value="wav:24">WAV 24-bit</option><option value="wav:16">WAV 16-bit</option><option value="wav:32">WAV 32-bit float</option><option value="aiff:24">AIFF 24-bit</option><option value="aiff:16">AIFF 16-bit</option><option value="flac:24">FLAC 24-bit</option><option value="flac:16">FLAC 16-bit</option><option value="mp3:16">MP3 320 kbps</option></select></label><label>TRACKS <select id="fx-which"><option value="rec">recorded tracks</option><option value="all">all 24</option></select></label><button type="button" data-f="go-export">EXPORT STEMS</button></div>
  <div id="files-msg">Tapes, mixes and audio</div>
</div>
<div class="tapesel"><label>TAPE <select id="tape-sel" title="Thread a different tape: its reel goes on the machine, its formulation into the electronics (realign for it)">${Object.entries(TAPE_LIST).map(([k, t]) => `<option value="${k}" title="${t.name.replace(/"/g, '&quot;')}"${k === 'm996' ? ' selected' : ''}>${t.short.replace(/"/g, '&quot;')} · ${t.ol} nWb/m</option>`).join('')}</select></label><button type="button" id="tape-align" title="Realign the machine for this tape: its operating level, then repro, sync, bias, record level and HF on every channel (manual section 7)">ALIGN</button><label class="auto" title="Realign automatically whenever a tape is threaded"><input type="checkbox" id="tape-auto" checked> AUTO</label><label>TAKE-UP <select id="takeup-sel" title="The empty reel on the take-up side">${Object.entries(globalThis.JH_REEL_NAMES).map(([k, n]) => `<option value="${k}"${k === 'a456' ? ' selected' : ''}>${n.replace(/"/g, '&quot;')}</option>`).join('')}</select></label></div>
<div class="modes" role="group" aria-label="Studio"><span class="lbl">STUDIO</span><button type="button" data-mode="cmi" aria-pressed="true" title="JH room: JH-Tape, AutoLocator III, JH-Mix console">JH</button><button type="button" data-mode="sls" aria-pressed="false" title="SLS room: Stauder A827, SLS 4000 G console">SLS</button></div>
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
<div id="cmi-fdr-hot" style="position:absolute;left:${globalThis.CMI_FB.x}px;top:${globalThis.CMI_FB.y}px;width:${globalThis.CMI_FB.w}px;height:${globalThis.CMI_FB.h}px;z-index:3;cursor:ns-resize" title="Drag a fader (double-click: 0 dB)"></div>
<div id="strip-hot-sls" class="shot" hidden style="left:24px;top:860px;width:3242px;height:860px" title="Click a section of any channel"></div>
<div id="strip-hl" hidden><span></span></div>
${hot(TX, 76, TW - 2 * TCI, 590, 'tape', 'Open the JH-Tape')}
${hot(AX, AY + 60, Math.round(AW * ALK), 590 - 60 - ALDROP, 'al', 'Open the AutoLocator III')}
${hot(1704, 60, 1578, 606, 'meters', 'Open the meter bridge')}
${rhot('224', '224', 'Open the Leximan 224X')}
${hot(2857, 1280, 296, 462, '224', 'Open the Leximan 224X')}
${rhot('patchbay', 'patchbay', 'Open the patchbay')}
${rhot('sbx', 'sbx', 'Open the SBX-80 sync box')}
${rhot('sg', 'sg', 'Open the SG-24 master sync generator')}
${rhot('dz', 'dz', 'Open the Delta-Three synchronizer')}
${rhot('c160A', 'c160', 'Open the dbk 160X compressors')}
${rhot('c160B', 'c160', 'Open the dbk 160X compressors')}
${rhot('im90', 'im90', 'Open the Publizon IM90')}
${rhot('spxA', 'spx', 'Open the Yahaha SPX90II units')}
${rhot('spxB', 'spx', 'Open the Yahaha SPX90II units')}
${rhot('h949', 'h949', 'Open the Evertide H949 Harmonizer')}
${rhot('rmx', 'rmx', 'Open the AXS RMX16')}
${globalThis.FM_LIGHT(0, RX, true)}
<div class="fm-hot rk-keep" data-fm="0" style="left:${RX + 26}px;top:${Math.round(globalThis.RACK_HOT.fm0.y)}px;width:${RW - 52}px;height:${Math.round(globalThis.RACK_HOT.fm0.h)}px" title="Fermann PL-8 C: click to pull the rack lights out or push them in; drag up / down or scroll for the dimmer"></div>
${['41A', '41B', '42A', '42B'].map((u) => rhot('pcm' + u, 'pcm', 'Open the Leximan PCM41 / PCM42 delays')).join('\n')}
<div class="hot elkey" data-open="elec" style="left:1184px;top:540px;width:58px;height:38px" title="ELECTRONICS: open the channel cards to tweak the tape machine"><span>ELECTRONICS</span></div>
<div class="el-plate" data-open="elec" id="el-plate" style="left:${TX + 640}px;top:${76 + 548}px" title="Open the JH-Tape audio electronics (the three drawers under the transport)"><i></i>AUDIO ELECTRONICS</div>
${hot(3480, 8, 160, 40, 'patchbay', 'Open the patchbay')}
${overlay('tape', 'TAPE MACHINE · 24 TRACK', tapeView, '<span class="ov-msg" id="tp-msg"></span>')}
${overlay('elec', 'JH-TAPE · AUDIO ELECTRONICS', elecView)}
${overlay('al', 'AUTOLOCATOR III', `<svg id="alSvg" width="${Math.round((AL_W * 4.6 + 76) * 0.86)}" height="${Math.round((AL_H * 4.6 + 92) * 0.86)}" viewBox="${900 - 26} ${150 - 26} ${AL_W * 4.6 + 76} ${AL_H * 4.6 + 92}" style="display:block;user-select:none">${alView}</svg>`, '<span class="ov-msg" id="al-msg">Ready</span>', true)}
${overlay('sbx', 'ROWAN SBX-80 SYNC BOX', `<svg id="sbxSvg" width="${Math.round(SBX_BOX[2] * 0.82)}" height="${Math.round(SBX_BOX[3] * 0.82)}" viewBox="${SBX_BOX.join(' ')}" style="display:block;user-select:none">${sbxView}</svg>`, '<span class="ov-msg" id="sbx-status">SMPTE on track 24 · MIDI clock + DIN sync out</span><span id="sbx-file" class="ov-param"></span><span id="sbx-out" hidden></span><span id="sbx-out2" hidden></span><label class="ov-pick">LOAD TRACK 24 AUDIO<input id="sbx-in" type="file" accept="audio/*,.wav,.aif,.aiff,.flac" hidden></label><select id="sbx-midi" class="ov-pick"><option value="">MIDI OUT · off</option></select>', true)}
${overlay('sg', 'HOLLIS SG-24 MASTER SYNC GENERATOR', `<div class="ovsync">${panelSVG(1, '#0d0d0e', (w, h) => sgFace(w, h))}
  <div class="sk"><button type="button" data-sg="rate">RATE <span class="v"></span></button><button type="button" data-sg="pull">PULL <span class="v"></span></button><button type="button" data-sg="video">VIDEO / TC <span class="v"></span></button><span class="gap"></span><button type="button" data-sg="run">TC RUN</button><button type="button" data-sg="reset">TC RESET</button><span class="gap"></span><button type="button" data-sg="cap" title="The 19.2 kHz capstan reference into the JH-Tape's EXT input (the MCI-style machines take 19.2 kHz)">CAPSTAN REF → JH-Tape</button><button type="button" data-sg="mtcout" title="Send the generator's time code to your DAW as MIDI time code">MTC OUT</button></div>
  <p class="note">Outputs: word clock ×4 (at the rate shown, pulled with PULL), black burst ×4 (NTSC / PAL), tri-level ×2, LTC and MTC from the time-code generator, and a 19.2 kHz capstan reference (what the JH-Tape's capstan servo locks to). Clock your interface and your DAW from the word clock, and the tape machine from the capstan reference, and nothing can drift.</p></div>`, '<span class="ov-msg" id="sg-msg"></span>', true)}
${overlay('c160', 'DBK 160X COMPRESSOR / LIMITER · A + B', `<div class="ovsync">${['A', 'B'].map((u) => panelSVG(1, '#232127', (w, h) => c160Face(w, h, u), { native: true })).join('<div style="height:6px"></div>')}
  <p class="note">Drag a knob up or down (double-click resets it); click the buttons. Each unit works on the channel it is patched into at the patchbay (INSERT SEND → 160X IN, 160X OUT → INSERT RETURN): B is on the bass to start with (A is free: patch it where you want it). SLAVE on one unit links it to the other as a stereo pair: the louder channel drives both, with the other unit's controls. You hear it once the tape machine's electronics are on.</p></div>`, '<span class="ov-msg" id="c160-msg"></span>', true)}
${overlay('im90', 'PUBLIZON IM90 REMOTE CONTROL', `<div class="ovsync"><svg width="3000" height="798" viewBox="0 0 500 133" style="display:block;margin:0 auto">${capture(() => im90Remote(500, 133))}</svg>
  <p class="note">Like the original: choose the channel with SET A / SET B (or A, A&amp;B, B on the remote), call a function with FUNCTIONS, its number and PARAMETERS (01 DELAY, 02 ECHO, 04 PITCH-SHIFTING, 09 SAMPLER), step through its pages with + and −, type a value and ENTER, or press PARAMETERS for increment mode, where + / − step it and 1–9 ramp it (0 stops). Turn the wheel to change a value. Sampling: 09, PARAMETERS, 0 ENTER arms it to record on input A, then it records from the first sound; AUX stops, AUX again records the next, PARAMETERS plays. MEMORY SELECT + number, MEMORY IN stores, MEMORY OUT recalls. GAINS sets input, effect and direct levels. Patch it at the patchbay (IM90 A / B on a channel insert): A is on the guitar to start with.</p></div>`, '<span class="ov-msg" id="im90-msg"></span>', true)}
${overlay('spx', 'YAHAHA SPX90II DIGITAL MULTI-EFFECT PROCESSOR · A + B', `<div class="ovsync">${['A', 'B'].map((u) => panelSVG(1, '#161618', (w, h) => spxFace(w, h, u), { native: true })).join('<div style="height:6px"></div>')}
  <p class="note">Each unit runs on its own: MEMORY ▲▼ picks a program (the number flashes) and RECALL loads it (1–30 factory, 31–90 yours). PARAMETER steps through the program's parameters, DATA ▲▼ changes the one shown; BALANCE switches to BALANCE and OUTPUT LEVEL. STORE saves to 31–90. UTILITY shows title and MIDI pages. FOOT TRIGGER makes the footswitch jack (click it) fire the gate, pan, vibrato and freeze programs instead of stepping memories. On FREEZE, the RECORD and PLAY pages run with DATA ▲. BYPASS passes the dry signal. Drag INPUT to set the level. Patch each at the patchbay (SPX A / B on a channel insert; the effect returns through that channel's fader): B starts on the toms with REV 4 PLATE (A is free: patch it where you want it).</p></div>`, '<span class="ov-msg" id="spx-msg"></span>', true)}
${overlay('h949', 'EVERTIDE H949 HARMONIZER', `<div class="ovsync">${panelSVG(2, '#151517', (w, h) => h949Face(w, h), { native: true })}
  <p class="note">The keys latch like the original's: the DELAY ONLY and MAIN rows add up (6.25 to 200 ms each, up to 393.75 ms). FUNCTION SELECT switches the four function keys between the green set (DELAY, RANDOM, FLANGE, REVERSE) and the red set (NORM, EXTEND, µPC SHARP, µPC FLAT). In pitch functions the main keys 50 / 100 / 200 add delay (and set EXTEND's window). MANUAL sets the pitch ratio (or RANDOM / FLANGE speed); 1/2 picks the algorithm (2 = de-glitched). REPEAT freezes the memory; LINE IN/OUT bypasses. Drag the knobs. Patched alongside a channel (H949 at the patchbay): it starts on overhead R, adding to the dry sound like an effect send.</p></div>`, '<span class="ov-msg" id="h949-msg"></span>', true)}
${overlay('rmx', 'AXS RMX16 DIGITAL REVERBERATION SYSTEM', `<div class="ovsync">${panelSVG(2, '#18191b', (w, h) => rmxFace(w, h), { native: true })}
  <p class="note">Press a function key (its lamp lights), then type on the keypad and press # (✱ is the decimal point for decay and the minus sign for the filters), or step with nudge down / up. program + number + # changes program (1–18: AMBIENCE, ROOM A1, HALL C1, PLATE A1, HALL B3, CHORUS, ECHO, NONLIN 2, REVERSE 1, then HALL A1, PLATE B1, ROOM A0, ROOM B1, NONLIN 1, REVERSE 2, DELAY, FREEZE, IMAGE P1). save / recall + 1–9 + # store and recall. The pot key hands decay time to the pot knob. On ECHO, A and B pick which delay you edit. An illegal entry shows E. It starts on overhead L, adding to the dry sound like an effect send.</p></div>`, '<span class="ov-msg" id="rmx-msg"></span>', true)}
${overlay('pcm', 'LEXIMAN PCM41 × 2 · PCM42 × 2 DIGITAL DELAY PROCESSORS', `<div class="ovsync">${['41A', '41B', '42A', '42B'].map((u) => panelSVG(1, '#111112', (w, h) => pcmFace(w, h, u), { native: true })).join('<div style="height:6px"></div>')}
  <div class="sk">${['41A', '41B', '42A', '42B'].map((u) => `<button type="button" data-pf="${u}:byp" title="The bypass footswitch (rear jack)">PCM${u.slice(0, 2)} ${u[2]} · BYPASS</button>${u[1] === '1' ? `<button type="button" data-pf="${u}:rpt" title="The repeat footswitch (rear jack)">REPEAT</button>` : ''}<span class="gap"></span>`).join('')}</div>
  <p class="note">Drag the knobs (Shift for fine; double-click resets), click the buttons. PCM41: ◀ ▶ DELAY SELECT steps the eleven taps (0 to 200 ms; DLY X2 doubles them at 6 kHz bandwidth), DELAY MULTIPLY stretches any tap from half to double. The sweep (DEPTH, WAVEFORM: sine, ENV follower, square; RATE) changes the sample clock itself, so the pitch bends, and at slow clock settings the PCM41 aliases. FILTER INV / LO / HI shape the repeats; INV by the mix inverts the delay. Bypass and repeat are footswitches on the real PCM41: use the buttons under the panels. PCM42: SET-MODE on DLY, UP / DOWN step 256 taps up to 800 ms (hold to repeat, hold both to slew fast), and the display shows the real delay as it sweeps; on CLK, DOWN sets the beat's numerator and UP its denominator. ∞ RPT holds the whole memory, starting and stopping on the clock's beat. Each unit replaces its channel on the insert it is patched to (PCM41 A on the hats, B on ch 9, PCM42 A on ch 10, B on ch 11 to start).</p></div>`, '<span class="ov-msg" id="pcm-msg"></span>', true)}
${overlay('sp1200', 'E-MEW SP-1200 SAMPLING PERCUSSION', `<div class="ovsync"><svg width="2400" height="${Math.round(2400 * 340 / 520)}" viewBox="0 0 520 340" style="display:block;margin:0 auto;user-select:none;touch-action:none">${capture(() => spBody(520, 340))}</svg>
  <div class="sk"><label class="ov-pick">LOAD AUDIO ONTO THE SELECTED PAD<input id="sp-file" type="file" accept="audio/*,.wav,.aif,.aiff,.flac,.mp3" hidden></label><select id="sp-midi" class="ov-pick"><option value="">MIDI IN · computer keys</option></select><span class="gap"></span><span class="v" style="font:700 14px JetBrains Mono,monospace;color:#c9c2b0">OUT: STEREO MIX</span></div>
  <p class="note">Hit the pads (lower on a pad = harder), or your computer keys A S D F G H J K for pads 1-8. BANK steps A-D (32 sounds). The sliders set what MIX / TUNE / DECAY selects for the bank's eight pads; MULTI PITCH spreads the selected sound over the eight pads, each slider its pitch. RUN / STOP plays the pattern; RECORD + RUN records what you play, AUTO CORRECT quantises it (press it to step 1/8 .. 1/32T, OFF); SWING 50-75 %; TEMPO with YES / NO or the keypad; hold TAP / REPEAT with a pad for repeats; hold ERASE and a pad while recording to wipe that pad. PATTERN + keypad + ENTER picks one of 99. SAMPLE records the channel patched to SP-1200 IN at the patchbay onto the selected pad (12-bit, 26.04 kHz, 10 s of memory in all); the button below loads an audio file instead. SYNC follows the SBX-80 (DIN sync).</p></div>`, '<span class="ov-msg" id="sp-msg"></span>', true)}
${overlay('juno', 'ROWAN JUNO-1060 PROGRAMMABLE POLYPHONIC SYNTHESIZER', `<div class="ovsync"><svg width="3200" height="${Math.round(3200 * 356 / 1132)}" viewBox="0 0 1132 356" style="display:block;margin:0 auto;user-select:none;touch-action:none">${capture(() => junoBody(1132, 356))}</svg>
  <div class="sk"><select id="ju-midi" class="ov-pick"><option value="">MIDI IN · computer keys</option></select><span class="gap"></span><span class="v" style="font:700 14px JetBrains Mono,monospace;color:#c9c2b0">OUT: STEREO MIX</span></div>
  <p class="note">Play it on the keys (click or drag), on your computer keyboard (A W S E D F T G Y H U J K: one octave, Z / X shift it) or from a MIDI keyboard. Drag the sliders (double-click resets one). PATCH 1-8 calls a sound from the bank shown (bank 1: STRINGS, BRASS, BASS, PAD, PIANO, LEAD, HOOVER, SWEEP); BANK picks the bank, MANUAL plays what the sliders show, WRITE then a PATCH key stores the panel there (banks 2-8). Chorus I and II as on the original: both off, either, or both together. Drag the bender left / right (its DCO and VCF sliders set how far it bends).</p></div>`, '<span class="ov-msg" id="ju-msg"></span>', true)}
${overlay('tr909', 'ROWAN TR-9090 RHYTHM COMPOSER', `<div class="ovsync"><svg width="2600" height="${Math.round(2600 * 453 / 758)}" viewBox="0 0 484 ${Math.round(484 * 453 / 758)}" style="display:block;margin:0 auto;user-select:none;touch-action:none">${capture(() => tr909Body(484, Math.round(484 * 453 / 758)))}</svg>
  <p class="note">PATTERN PLAY I / II / III pick the group, the step keys the pattern; SHIFT + a group key = PATTERN WRITE: INSTRUMENT SELECT then a step key picks the voice (the two keys under a drum: normal / accented; CARTRIDGE/ENTER = total accent), the step keys enter it, BACK/TAP enters it in time, SHUFFLE/FLAM marks flams, LAST STEP sets the length, CLEAR empties the voice (SHIFT + CLEAR the pattern). TRACK PLAY 1-4 play a track; SHIFT + one writes it (a step key picks the pattern, CARTRIDGE/ENTER adds the measure). SCALE: step length. TAPE SYNC: follow the SBX-80. Drag the knobs (double-click resets).</p></div>`, '<span class="ov-msg" id="t9-msg"></span>', true)}
${overlay('tr808', 'ROWAN TR-8080 RHYTHM COMPOSER', `<div class="ovsync"><svg width="2600" height="${Math.round(2600 * 300 / 528)}" viewBox="0 0 528 300" style="display:block;margin:0 auto;user-select:none;touch-action:none">${capture(() => tr808Body(528, 300))}</svg>
  <div class="sk"><button type="button" data-trx="sync">SYNC <span class="v">INTERNAL</span></button><span class="gap"></span><button type="button" data-trx="copy">COPY PART → NEXT PATTERN</button><span class="gap"></span><span class="v" id="tr-out" style="font:700 14px JetBrains Mono,monospace;color:#c9c2b0">OUT: STEREO MIX</span></div>
  <p class="note">MODE: 1st / 2nd PART write part A / B (INSTRUMENT-SELECT picks the voice, the step keys enter it, TAP enters it in time while running, the red STEP NUMBER button then a key sets the last step). MANUAL PLAY: keys 1-12 pick the pattern, 13-16 the intro / fill-in; TAP plays a fill-in (running) or sets an intro (stopped); MEASURES / AUTO FILL IN: a fill every 2-16 measures. COMPOSE: a step key picks a pattern, TAP writes it as the next measure of the rhythm track (INSTRUMENT-SELECT AC / BD / SD / LT = tracks 1-4; the red button = TRACK CLEAR); PLAY plays the track. PATTERN CLEAR: a step key empties that pattern. BASIC-VARIATION A / AB / B, I/F-VARIATION A / B, PRE-SCALE: step length. Drag the knobs (Shift for fine, double-click resets); click the conga / claves / maracas switches. SYNC: INTERNAL, or DIN sync from the SBX-80.</p></div>`, '<span class="ov-msg" id="tr-msg"></span>', true)}
${overlay('s900', 'AKITA S900 MIDI DIGITAL SAMPLER', `<div class="ovsync">${panelSVG(3, '#cfcfcb', (w, h) => s900Face(w, h), { native: true })}
  <div class="s9kb" id="s9kb"></div>
  <div class="sk"><label class="ov-pick">LOAD AUDIO FILE AS A SAMPLE<input id="s9-file" type="file" accept="audio/*,.wav,.aif,.aiff,.flac,.mp3" hidden></label><select id="s9-midi" class="ov-pick"><option value="">MIDI IN · computer keys</option></select><span class="gap"></span><button type="button" data-s9b="save">SAVE SAMPLE AS WAV</button></div>
  <p class="note">Like the original: press a mode key (PLAY, REC, EDIT SAMPLE, EDIT PRGRM, MIDI, UTILITY, DISK, MASTER TUNE), then choose a page by typing two digits or with PAGE ▲ ▼. ◄ ► move the arrow between parameters; turn CONTROL (drag or scroll it) or type digits to change one; ON/+ and OFF/− for yes/no and sign; ENT confirms. LETTER names the selected item (type on your keyboard). P.B auditions. Play it from the keys below, your computer keyboard (A W S E D F T G Y H U J K: one octave, Z / X shift it) or a MIDI keyboard. REC records from the channel patched to S900 IN at the patchbay (it starts on the snare's direct out); DISK page 01 loads the factory disk, page 03 a sample from your computer. Its output plays into the mix.</p></div>`, '<span class="ov-msg" id="s9-msg"></span>', true)}
${overlay('dz', 'ADDISON-SMYTH DELTA-THREE SYNCHRONIZER', `<div class="ovsync">${panelSVG(1, '#cfcdc7', (w, h) => dzFace(w, h))}
  <div class="sk"><button type="button" data-dz="chase" title="Slave the JH-Tape to the master">CHASE</button><button type="button" data-dz="src" title="Where the master time code comes from">MASTER <span class="v"></span></button><button type="button" data-dz="ref" title="Master and slave share the SG-24 reference: resolve to it">HOUSE REF</button><span class="gap"></span><button type="button" data-dz="capture" title="Take the current difference between slave and master as the offset">CAPTURE OFFSET</button><button type="button" data-dz="nudge-">◀ ¼ FR</button><button type="button" data-dz="nudge+">¼ FR ▶</button><button type="button" data-dz="zero">OFFSET 0</button></div>
  <div class="rd"><span>STATE <b id="dz-state">OFF</b></span><span>OFFSET <b id="dz-off">+00:00:00:00</b></span><span>ERROR <b id="dz-err">—</b></span><span>CAPSTAN <b id="dz-spd">0.000 %</b></span></div>
  <p class="note">The front panel works: click its keys. MASTER and SLAVE enable the chase · RUN starts the generator · STOP·CONT holds the system · SELECT steps the display (G_TC, M_TC, S_TC, S_OFS, S_ERR, S_SPD; the last two letters show the chase: PK park, CU cue, WT wait, PL pull-in, LK lock, TL tight lock, HD held) · ◀ ▶ trim the offset a quarter frame · CLEAR zeroes it · INDEX switches the LOCK lamp between the wide (0.05 frame) and tight (0.003 frame) windows. A red SHIFT reaches the red legends on its half: CAPTURE takes the offset, GOTO parks the slave on the master, LEARN relearns the slave's start-up, COPY resets the generator. MIDI (MTC IN) is an extension: the original read master LTC and only sent MTC.</p></div>`, '<span class="ov-msg" id="dz-msg"></span>', true)}
${overlay('strip', '<span id="strip-title">CH 1</span>', '<svg id="stripSvg" width="400" height="1200" viewBox="0 0 400 1200" style="display:block;user-select:none;touch-action:none"></svg>', '', true)}
${overlay('meters', 'JH-TAPE METER BRIDGE', `<svg width="3840" height="${OVH}" viewBox="0 0 3840 ${OVH}" style="display:block">${meterView}</svg>`)}
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
<script type="text/plain" id="jh24-worklet-src">${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'electronics', 'jh24audio.js'), 'utf8').replace(/^export /gm, '') + '\n' + fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'electronics', 'mechsound.js'), 'utf8').replace(/^export /gm, '') + '\n' + fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', 'c160.js'), 'utf8').replace(/^export /gm, '') + '\n' + fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', 'im90.js'), 'utf8').replace(/^export /gm, '') + '\n' + fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', 'spx90.js'), 'utf8').replace(/^import .*$/gm, '').replace(/^export /gm, '') + '\n' + ['h949.js', 'rmx16.js', 'pcm4x.js', 's900.js', 'tr808.js', 'tr909.js', '../console/jhmix.js', '../synth/juno.js', '../sp1200/sp1200.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', f), 'utf8').replace(/^import .*$/gm, '').replace(/^export /gm, '').replace(/\bclass Line\b/g, 'class RmxLine').replace(/new Line\(/g, 'new RmxLine(').replace(/\bTAU\b/g, f === 'h949.js' ? 'H_TAU' : 'R_TAU')).join('\n') + '\n' + fs.readFileSync(path.join(__dirname, 'elec-worklet.js'), 'utf8')}</script>
<script>${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', 'c160.js'), 'utf8').replace(/^export /gm, '')}</script>
<script>${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', 'spx90presets.js'), 'utf8').replace(/^export /gm, '')}</script>
<script>${['s900.js', 's900factory.js', 'tr808.js', 'tr909.js', '../console/jhmix.js', '../synth/juno.js', '../sp1200/sp1200.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', f), 'utf8').replace(/^import .*$/gm, '').replace(/^export /gm, '')).join('\n')}</script>
<script>const RMX_PROGRAMS_UI = (() => { ${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', 'rmx16.js'), 'utf8').replace(/^export /gm, '')}; return RMX_PROGRAMS; })(); const h949Ratio = (() => { ${fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'outboard', 'h949.js'), 'utf8').replace(/^import .*$/gm, '').replace(/^export /gm, '')}; return h949Ratio; })();</script>
<script>${['ltc.js', 'midiclock.js', 'chase.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', '..', 'prototype', 'sync', f), 'utf8').replace(/^export /gm, '')).join('\n')}</script>
<script>${fs.readFileSync(path.join(__dirname, 'overlays.client.js'), 'utf8').replace('  // ---------------- the studio clock ----------------', fs.readFileSync(path.join(__dirname, 'strip.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'electronics.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'files.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'syncgen.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'c160.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'im90.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'spx.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'h949rmx.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'pcm.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'furman.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 's900.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'tr808.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'tr909.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'console.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'patchgate.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'juno.client.js'), 'utf8') + fs.readFileSync(path.join(__dirname, 'sp1200.client.js'), 'utf8') + '  // ---------------- the studio clock ----------------')}</script>
<script>(() => {   // the OldTools splash: names what is coming up, then fades
  const el = document.getElementById('splash'); if (!el) return;
  const steps = ['Spooling the JH-Tape transport', 'Warming up the JH-Tape electronics: 24 channels', 'Aligning heads for 4M 996', 'Powering the JH-Mix console: 32 inputs', 'Racking the Leximan 224X', 'Racking the dbk 160X compressors', 'Racking the Publizon IM90', 'Racking the Yahaha SPX90IIs', 'Racking the Leximan PCM41s and PCM42s', 'Pulling out the rack lights', 'Booting the Akita S900', 'Tuning the Rowan TR-8080', 'Setting the TR-9090 on the desk', 'Tuning the JUNO-1060', 'Loading the SP-1200 disk', 'Locking the SG-24 house sync', 'Patching the patchbay', 'Ready'];
  const st = document.getElementById('spl-status'), bar = document.getElementById('spl-bar'); let i = 0, done = false;
  const close = () => { if (done) return; done = true; el.classList.add('gone'); setTimeout(() => el.remove(), 1000); };
  const tick = () => { if (done) return; st.textContent = steps[i] + (i < steps.length - 1 ? '…' : ''); bar.style.width = Math.round((i + 1) / steps.length * 100) + '%'; if (++i < steps.length) setTimeout(tick, 260 + Math.random() * 180); else setTimeout(close, 700); };
  el.addEventListener('click', close); addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') close(); }, { once: true });
  setTimeout(tick, 250);
})();</script>
</body></html>`;
fs.writeFileSync(path.join(dir, 'analog-studio-mockup.html'), html);
// the audio engine's code is several files joined into one AudioWorklet: make sure it loads (a clash of names there
// would silently stop all the audio in the browser)
{
  const wsrc = /<script type="text\/plain" id="jh24-worklet-src">([\s\S]*?)<\/script>/.exec(html)[1];
  const g = { AudioWorkletProcessor: class { constructor() { this.port = { postMessage() {}, onmessage: null }; } }, registerProcessor: (n, c) => { g.P = c; }, sampleRate: 48000 };
  try { new Function('AudioWorkletProcessor', 'registerProcessor', 'sampleRate', wsrc)(g.AudioWorkletProcessor, g.registerProcessor, g.sampleRate); new g.P(); }
  catch (e) { console.error('AUDIO ENGINE (worklet) FAILS TO LOAD: ' + e.message); process.exit(1); }
}
// artifact version: the same page without the document wrapper (the host adds it), title first
{
  const head = html.slice(html.indexOf('<link href='), html.indexOf('</head>'));
  const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
  fs.mkdirSync(path.join(dir, 'artifact'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'artifact', 'index.html'), `<title>JH-Studio Console</title>\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n${body}`);
  if (fs.existsSync(path.join(dir, 'tape-machine.html'))) fs.copyFileSync(path.join(dir, 'tape-machine.html'), path.join(dir, 'artifact', 'tape-machine.html'));
}
console.log('wrote', svg.length, 'bytes');
