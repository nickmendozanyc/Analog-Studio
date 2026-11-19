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
  const { label = '', faceFill = 'url(#vuFace)', bezel = '#0e0e0f', brand = '' } = opts;
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
  const fs = Math.max(6, h * 0.085);
  for (const [d] of VU_MAP) {
    const a = vuAngle(d);
    const [x1, y1] = polar(cx, cy, R * 0.78, a), [x2, y2] = polar(cx, cy, R * 0.86, a);
    p(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${d > 0 ? '#c81e12' : '#1b1712'}" stroke-width="${Math.max(1, h * 0.014)}"/>`);
    if ([-20, -10, -7, -5, -3, -1, 0, 1, 2, 3].includes(d) && !(h < 90 && [-7, -1, 2].includes(d))) {
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
  const [nx, ny] = polar(cx, cy, R * 0.9, a);
  const [bx, by] = polar(cx, cy, R * 0.3, a);
  p(`<line x1="${bx + 2}" y1="${by + 3}" x2="${nx + 2}" y2="${ny + 3}" stroke="#000" stroke-opacity="0.18" stroke-width="${Math.max(1.2, h * 0.016)}"/>`);
  p(`<line x1="${bx}" y1="${by}" x2="${nx}" y2="${ny}" stroke="#111" stroke-width="${Math.max(1, h * 0.013)}" stroke-linecap="round"/>`);
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
const statusItems = [['INTERFACE', 'Apogee Symphony'], ['RATE', '96 kHz'], ['BUFFER', '128 smp · 2.7 ms'], ['DSP', '18 %'], ['DISK', 'OK']];
let sx = 2280;
for (const [k, v] of statusItems) {
  text(sx, 34, k, 11, '#8b8778', 'start', 700, 'letter-spacing="2"');
  text(sx + k.length * 9 + 14, 34, v, 15, '#e8e4d8', 'start', 600);
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
// TAPE MACHINE (MCI JH-24 style)
// =====================================================================
const TX = 24, TY = 76, TW = 1360, TH = 816;
p(`<g filter="url(#shadow)">`);
rect(TX, TY, TW, TH, '#3d3936', 'rx="10"');
rect(TX, TY + TH - 18, TW, 18, 'url(#laminate)', 'rx="4"');
rect(TX, TY + TH - 18, TW, 18, '#000', 'filter="url(#woodgrainH)" opacity="0.7" rx="4"');
p(`</g>`);
rect(TX + 8, TY + 8, TW - 16, 650, 'url(#deck)', 'rx="6"');
rect(TX + 8, TY + 8, TW - 16, 650, '#000', 'filter="url(#brushed)" opacity="0.10" rx="6"');
rect(TX + 8, TY + 8, TW - 16, 650, 'url(#sheen)', 'rx="6"');
rect(TX + 8, TY + 666, TW - 16, TH - 692, 'url(#deckLower)', 'rx="6"');
// trim
rect(TX + 8, TY + 658, TW - 16, 8, 'url(#chrome)', 'opacity="0.7"');
for (const [sx2, sy2] of [[TX + 24, TY + 24], [TX + TW - 24, TY + 24], [TX + 24, TY + 640], [TX + TW - 24, TY + 640]]) screw(sx2, sy2, 6);

// reels
const R = 240;
const supply = { cx: TX + 300, cy: TY + 300, pack: 200, rot: 18, style: 'a499' };
const takeup = { cx: TX + TW - 300, cy: TY + 300, pack: 138, rot: -27, style: 'gp9' };
// Reel styles from the user's reference photos: Quantegy GP9 (red anodized) and Ampex 499 (silver)
const REEL_STYLES = {
  gp9: { face: 'url(#flangeRed)', back: '#6e1c12', edge: '#7a2216', sheenOp: 0.18 },
  a499: { face: 'url(#flangeSilver)', back: '#5a5d62', edge: '#55585d', sheenOp: 0.22 },
};
function slotPath(cx, cy, rIn, rOut, w, ang, c) {
  // rounded radial slot, local coords: x across, y outward (negative = up), rotated by ang
  const pts = [];
  const rot = (x, y) => { const t = (ang) * Math.PI / 180; return [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)]; };
  const hw = w / 2, y0 = -rOut, y1 = -rIn;
  const seq = [['M', -hw + c, y0], ['L', hw - c, y0], ['A', hw, y0 + c], ['L', hw, y1 - c], ['A', hw - c, y1], ['L', -hw + c, y1], ['A', -hw, y1 - c], ['L', -hw, y0 + c], ['A', -hw + c, y0]];
  let d = '';
  for (const [cmd, x, y] of seq) {
    const [X, Y] = rot(x, y);
    d += cmd === 'A' ? `A${c} ${c} 0 0 1 ${X.toFixed(1)} ${Y.toFixed(1)} ` : `${cmd}${X.toFixed(1)} ${Y.toFixed(1)} `;
  }
  return d + 'Z ';
}
function reel({ cx, cy, pack, rot, style }) {
  const st = REEL_STYLES[style];
  // motor plate + shadow
  circle(cx, cy, R + 14, '#3a3633');
  circle(cx, cy, R + 14, 'url(#bezelHi)', 'opacity="0.5"');
  circle(cx + 8, cy + 14, R + 4, 'url(#kShadow)', 'opacity="0.8"');
  // back flange seen through the slots
  circle(cx, cy, R, st.back);
  circle(cx, cy, R, 'url(#capHiDark)', 'opacity="0.6"');
  // tape pack
  circle(cx, cy, pack, 'url(#pack)');
  for (let r = R * 0.38; r < pack; r += 7) p(`<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="#000" stroke-opacity="${(0.08 + rnd() * 0.1).toFixed(2)}" stroke-width="1"/>`);
  p(`<circle cx="${cx}" cy="${cy}" r="${pack}" fill="none" stroke="#7a5a3c" stroke-opacity="0.7" stroke-width="1.5"/>`);
  // front flange: solid disc with two radial slots and the hub opening
  const hubR = R * 0.36;
  let d = `M${cx - R} ${cy} A${R} ${R} 0 1 0 ${cx + R} ${cy} A${R} ${R} 0 1 0 ${cx - R} ${cy} Z `;
  d += `M${cx - hubR} ${cy} A${hubR} ${hubR} 0 1 0 ${cx + hubR} ${cy} A${hubR} ${hubR} 0 1 0 ${cx - hubR} ${cy} Z `;
  for (const k of [0, 180]) d += slotPath(cx, cy, R * 0.5, R * 0.84, R * 0.17, rot + k, R * 0.035);
  p(`<path d="${d}" fill="${st.face}" fill-rule="evenodd" stroke="${st.edge}" stroke-width="1.5"/>`);
  p(`<path d="${d}" fill="#000" fill-rule="evenodd" filter="url(#brushed)" opacity="0.08"/>`);
  p(`<circle cx="${cx}" cy="${cy}" r="${R - 2}" fill="none" stroke="#fff" stroke-opacity="${st.sheenOp + 0.1}" stroke-width="2.5"/>`);
  p(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#sheen)" opacity="0.9" pointer-events="none"/>`);
  // slot inner edge shading
  for (const k of [0, 180]) p(`<path d="${slotPath(cx, cy, R * 0.5, R * 0.84, R * 0.17, rot + k, R * 0.035)}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="3"/>`);
  // black plastic hub ring with key notches; spindle visible through the centre
  circle(cx, cy, hubR, '#131315');
  circle(cx, cy, hubR, 'url(#capHiDark)', 'opacity="0.7"');
  const holeR = R * 0.27;
  circle(cx, cy, holeR, '#2b2826');
  circle(cx, cy, holeR, 'url(#kShadow)', 'opacity="0.9"');
  for (let k = 0; k < 3; k++) {
    const a0 = rot + 30 + k * 120;
    const [x1, y1] = polar(cx, cy, holeR + 1, a0 - 6), [x2, y2] = polar(cx, cy, holeR - 12, a0 - 4), [x3, y3] = polar(cx, cy, holeR - 12, a0 + 4), [x4, y4] = polar(cx, cy, holeR + 1, a0 + 6);
    p(`<path d="M${x1} ${y1} L${x2} ${y2} L${x3} ${y3} L${x4} ${y4} Z" fill="#131315"/>`);
  }
  // turntable spindle
  circle(cx, cy, 30, '#1a1c22'); circle(cx, cy, 22, 'url(#chrome)'); circle(cx, cy, 8, '#2a2c30');
  // 6 flange screws
  for (let k = 0; k < 6; k++) { const [sx3, sy3] = polar(cx, cy, R * 0.42, rot + 30 + k * 60); circle(sx3, sy3 + 0.8, 4.2, '#000', 'opacity="0.5"'); circle(sx3, sy3, 3.6, '#1b1b1d'); }
  // printed label between the slots
  const [lx, ly] = polar(cx, cy, R * 0.66, rot + 90);
  p(`<g transform="rotate(${rot} ${lx} ${ly})">`);
  if (style === 'gp9') {
    text(lx + 4, ly - 30, 'QUANTEGY', 15, '#1b1b1b', 'middle', 900, 'letter-spacing="0.5"');
    p(`<ellipse cx="${lx - 4}" cy="${ly + 2}" rx="58" ry="20" fill="#f3f1ec" transform="rotate(-12 ${lx} ${ly})"/>`);
    text(lx + 2, ly + 14, 'GP9', 40, '#3a3a3c', 'middle', 900, 'font-style="italic" letter-spacing="-1"');
    text(lx + 2, ly + 34, 'GRAND MASTER PLATINUM', 8.5, '#1b1b1b', 'middle', 800);
  } else {
    text(lx, ly - 26, 'AMPEX', 18, '#141414', 'middle', 900, 'letter-spacing="1"');
    text(lx, ly + 12, '499', 38, '#a9802f', 'middle', 900, 'letter-spacing="-1"');
    text(lx, ly + 26, 'GRAND MASTER™ GOLD', 8.5, '#141414', 'middle', 800);
    text(lx, ly + 38, 'Studio Mastering Audio Tape', 8, '#a9802f', 'middle', 600);
  }
  p(`</g>`);
}
// tape path
const gy = TY + 528;
const guideL = [TX + 150, gy + 40], armL = [TX + 330, gy + 4], headX = TX + TW / 2, capX = TX + 900, armR = [TX + TW - 330, gy + 4], guideR = [TX + TW - 150, gy + 40];
// tape (brown ribbon)
const tape = `M${supply.cx - 120} ${supply.cy + 150} L${guideL[0] - 16} ${guideL[1] + 6} L${armL[0] - 4} ${armL[1] + 34} L${headX - 230} ${gy + 52} L${capX + 30} ${gy + 52} L${armR[0] + 4} ${armR[1] + 34} L${guideR[0] + 16} ${guideR[1] + 6} L${takeup.cx + 90} ${takeup.cy + 100}`;
p(`<path d="${tape}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="9" transform="translate(3 5)"/>`);
p(`<path d="${tape}" fill="none" stroke="#5a3a22" stroke-width="7" stroke-linejoin="round"/>`);
p(`<path d="${tape}" fill="none" stroke="#8a5f3e" stroke-width="1.5" stroke-linejoin="round" opacity="0.6"/>`);
reel(supply);
reel(takeup);
function guide(cx, cy, r = 18) {
  circle(cx + 3, cy + 5, r + 4, 'url(#kShadow)');
  circle(cx, cy, r + 3, '#0f0f10');
  circle(cx, cy, r, '#1d1d1f');
  circle(cx, cy, r, 'url(#capHiDark)');
  circle(cx, cy, r * 0.45, 'url(#chrome)');
}
// tension arms
for (const [ax, ay, pivotX] of [[...armL, TX + 270], [...armR, TX + TW - 270]]) {
  p(`<line x1="${pivotX}" y1="${gy + 80}" x2="${ax}" y2="${ay + 20}" stroke="url(#chrome)" stroke-width="12" stroke-linecap="round"/>`);
  circle(pivotX, gy + 80, 14, '#1c1d20'); circle(pivotX, gy + 80, 9, 'url(#chrome)');
  guide(ax, ay + 20, 15);
}
guide(...guideL); guide(...guideR);

// motion hint arcs
for (const rl of [supply, takeup]) {
  const [ax0, ay0] = polar(rl.cx, rl.cy, R + 26, -40), [ax1, ay1] = polar(rl.cx, rl.cy, R + 26, 40);
  p(`<path d="M${ax0} ${ay0} A${R + 26} ${R + 26} 0 0 1 ${ax1} ${ay1}" fill="none" stroke="#ffcf6b" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="4 8"/>`);
}

// head block
const hbX = headX - 230, hbY = gy + 52;
rect(hbX - 10, hbY - 4, 440, 76, '#000', 'rx="8" opacity="0.5" filter="url(#soft)"');
rect(hbX, hbY - 2, 420, 66, '#24262a', 'rx="6"');
rect(hbX, hbY - 2, 420, 66, 'url(#bezelHi)', 'rx="6"');
// head cover: black housing, brushed silver lid (per photos)
rect(headX - 196, hbY - 112, 392, 112, '#000', 'rx="6" opacity="0.55" filter="url(#soft)" transform="translate(6 10)"');
rect(headX - 196, hbY - 112, 392, 106, '#141416', 'rx="6"');
rect(headX - 184, hbY - 104, 368, 74, 'url(#silverPanel)', 'rx="3"');
rect(headX - 184, hbY - 104, 368, 74, '#000', 'filter="url(#brushed)" opacity="0.18" rx="3"');
for (let k = 0; k < 7; k++) rect(headX - 170 + k * 50, hbY - 24, 30, 10, '#2a2a2c', 'rx="2"');
text(headX, hbY - 60, 'HEAD ASSEMBLY', 10, '#3a3633', 'middle', 800, 'letter-spacing="3"');
const heads = [['ERASE', hbX + 70], ['RECORD', hbX + 210], ['REPRO', hbX + 350]];
for (const [lab, hx] of heads) {
  rect(hx - 34, hbY - 10, 68, 28, 'url(#chrome)', 'rx="6"');
  rect(hx - 30, hbY - 6, 60, 6, '#2a2b2e', 'rx="2"');
  for (let k = 0; k < 6; k++) rect(hx - 27 + k * 10, hbY + 4, 6, 10, '#6b6f75', 'rx="1"');
  text(hx, hbY + 46, lab, 11, '#ece7dc', 'middle', 800, 'letter-spacing="1.5"');
}
// head shield
// capstan + pinch roller
circle(capX + 30, gy + 52, 12, 'url(#chrome)');
circle(capX + 30, gy + 52 + 37, 26, '#0e0e0f'); circle(capX + 30, gy + 89, 22, '#1b1b1d'); circle(capX + 30, gy + 89, 8, 'url(#chrome)');
text(capX + 66, gy + 94, 'CAPSTAN', 9, '#ece7dc', 'start', 800, 'letter-spacing="1.5"');
// logo plate
rect(headX - 120, TY + 40, 240, 70, '#0f1012', 'rx="4"');
rect(headX - 120, TY + 40, 240, 70, 'url(#bezelHi)', 'rx="4"');
text(headX - 62, TY + 88, 'MCI', 38, '#e9e3d0', 'middle', 900, 'font-style="italic" letter-spacing="2"');
text(headX + 46, TY + 72, 'JH-24', 22, '#e9e3d0', 'middle', 800, 'letter-spacing="2"');
text(headX + 46, TY + 94, '24 TRACK · 2"', 11, '#ece7dc', 'middle', 700, 'letter-spacing="2"');
// tape timer / tach window between reels
rect(headX - 90, TY + 150, 180, 58, '#0a0202', 'rx="4"');
rect(headX - 90, TY + 150, 180, 58, 'url(#bezelHi)', 'rx="4"');
seg7(headX - 76, TY + 162, 34, '03:42', '#ff3220');
text(headX, TY + 228, 'TAPE TIME', 10, '#ece7dc', 'middle', 800, 'letter-spacing="2"');
// tension / status lamps
const lamps = [['TENSION', 'green', true], ['SERVO', 'green', true], ['REC', 'red', true], ['VARI', 'amber', false]];
lamps.forEach(([lab, col, on], i) => {
  const lx = headX - 100 + i * 52;
  button(lx, TY + 260, 36, 16, col, on);
  text(lx + 18, TY + 292, lab, 9, '#ece7dc', 'middle', 800, 'letter-spacing="1"');
});

// transport controls on lower panel
const ly0 = TY + 680;
rect(TX + 28, ly0 + 30, 610, 92, '#000', 'rx="5" opacity="0.5" filter="url(#soft)" transform="translate(3 6)"');
rect(TX + 28, ly0 + 30, 610, 92, 'url(#silverPanel)', 'rx="5"');
rect(TX + 28, ly0 + 30, 610, 92, '#000', 'filter="url(#brushed)" opacity="0.15" rx="5"');
rect(TX + 34, ly0 + 36, 598, 80, 'none', 'rx="4" stroke="#6d6a66" stroke-width="1"');
text(TX + 40, ly0 + 22, 'TRANSPORT', 11, '#d9d3c7', 'start', 800, 'letter-spacing="3"');
// red lamp + two black knobs at the left of the strip, as on the deck
circle(TX + 60, ly0 + 64, 11, '#c8231a', 'filter="url(#glow)"'); circle(TX + 60, ly0 + 64, 11, 'url(#capHi)');
text(TX + 60, ly0 + 104, 'POWER', 8.5, '#2a2624', 'middle', 800);
knob(TX + 108, ly0 + 64, 12, '#1d1d1f', -30, { ticks: false, dark: true });
text(TX + 108, ly0 + 104, 'VARI', 8.5, '#2a2624', 'middle', 800);
knob(TX + 152, ly0 + 64, 12, '#1d1d1f', 20, { ticks: false, dark: true });
text(TX + 152, ly0 + 104, 'EDIT', 8.5, '#2a2624', 'middle', 800);
const tbtns = [['◀◀', 'REW', 'white', false], ['▶▶', 'F FWD', 'white', false], ['■', 'STOP', 'grey', false], ['▶', 'PLAY', 'green', true], ['●', 'RECORD', 'red', true], ['▲', 'LIFT', 'blue', false], ['✂', 'EDIT', 'amber', false]];
tbtns.forEach(([g, lab, col, on], i) => {
  const bx = TX + 186 + i * 63;
  button(bx, ly0 + 44, 52, 46, col, on, '', { pastel: true });
  text(bx + 26, ly0 + 74, g, 18, '#1a1208', 'middle', 800);
  text(bx + 26, ly0 + 108, lab, 9, '#2a2624', 'middle', 800, 'letter-spacing="1"');
});
// speed
const spX = TX + 660;
text(spX, ly0 + 22, 'SPEED', 11, '#d9d3c7', 'start', 800, 'letter-spacing="3"');
button(spX, ly0 + 44, 64, 34, 'amber', false, '15 IPS', { size: 11 });
button(spX + 74, ly0 + 44, 64, 34, 'amber', true, '30 IPS', { size: 11 });
text(spX, ly0 + 104, 'EQ', 10, '#d9d3c7', 'start', 800, 'letter-spacing="2"');
button(spX + 30, ly0 + 92, 52, 20, 'white', true, 'AES', { size: 9 });
button(spX + 88, ly0 + 92, 52, 20, 'white', false, 'NAB', { size: 9 });
// tape character
const fxX = TX + 880;
text(fxX, ly0 + 22, 'TAPE CHARACTER', 11, '#d9d3c7', 'start', 800, 'letter-spacing="3"');
knob(fxX + 40, ly0 + 70, 20, '#c9a24a', 40, { label: 'SATURATION' });
knob(fxX + 140, ly0 + 70, 20, '#c9a24a', -60, { label: 'WOW/FLUTTER' });
knob(fxX + 240, ly0 + 70, 20, '#c9a24a', -90, { label: 'HISS' });
button(fxX + 310, ly0 + 52, 120, 34, 'amber', false, 'BYPASS ALL', { size: 11 });
text(fxX + 370, ly0 + 110, 'AMOUNT · GLOBAL BYPASS', 9, '#d9d3c7', 'middle', 700, 'letter-spacing="1"');

// =====================================================================
// AUTOLOCATOR REMOTE
// =====================================================================
const AX = 1408, AY = 96, AW = 400, AH = 776;
p(`<g filter="url(#shadow)">`);
rect(AX, AY, AW, AH, '#3d3936', 'rx="10"');
p(`</g>`);
rect(AX + 8, AY + 8, AW - 16, AH - 16, 'url(#deck)', 'rx="6"');
rect(AX + 8, AY + 8, AW - 16, AH - 16, '#000', 'filter="url(#brushed)" opacity="0.1" rx="6"');
text(AX + 28, AY + 44, 'AUTOLOCATOR', 15, '#e9e3d0', 'start', 800, 'letter-spacing="3"');
text(AX + AW - 28, AY + 44, 'AL-III', 13, '#ece7dc', 'end', 800, 'letter-spacing="2"');
// counter
rect(AX + 24, AY + 64, AW - 48, 104, '#000', 'rx="6"');
rect(AX + 30, AY + 70, AW - 60, 92, 'url(#displayBg)', 'rx="4"');
seg7(AX + 46, AY + 86, 56, '03:42.1', '#ff3220');
rect(AX + 30, AY + 70, AW - 60, 40, 'url(#glass)', 'rx="4"');
text(AX + 40, AY + 186, 'MIN', 9, '#d9d3c7', 'start', 800);
text(AX + 150, AY + 186, 'SEC', 9, '#d9d3c7', 'start', 800);
text(AX + 286, AY + 186, 'TENTHS', 9, '#d9d3c7', 'start', 800);
// locate points
text(AX + 28, AY + 222, 'LOCATE POINTS', 11, '#d9d3c7', 'start', 800, 'letter-spacing="2"');
const locs = [['1', 'INTRO', '00:00.0'], ['2', 'VERSE 1', '00:21.4'], ['3', 'CHORUS', '01:02.8'], ['4', 'SOLO', '02:47.3']];
locs.forEach(([n, nm, tm], i) => {
  const ry = AY + 236 + i * 46;
  button(AX + 28, ry, 48, 36, 'amber', i === 2, `LOC ${n}`, { size: 10 });
  rect(AX + 86, ry, AW - 114, 36, '#0b0b0c', 'rx="3"');
  text(AX + 98, ry + 23, nm, 13, '#e9dcc0', 'start', 600);
  text(AX + AW - 40, ry + 24, tm, 15, '#ff6a50', 'end', 700, `font-family="'JetBrains Mono', monospace"`);
});
// keypad
const kx = AX + 28, ky = AY + 438;
const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'CLR', '0', 'ENT'];
keys.forEach((k, i) => {
  const c = i % 3, r = Math.floor(i / 3);
  button(kx + c * 62, ky + r * 48, 54, 40, 'blue', false, k, { size: 13, pastel: true });
});
const sideKeys = [['STORE', 'amber', false], ['RECALL', 'amber', false], ['LOCATE', 'green', false], ['ZERO', 'white', false]];
sideKeys.forEach(([k, col, on], i) => button(kx + 200, ky + i * 48, 144, 40, col, on, k, { size: 12 }));
// punch + track arm group
const py = ky + 206;
text(AX + 28, py, 'PUNCH', 11, '#d9d3c7', 'start', 800, 'letter-spacing="2"');
button(AX + 28, py + 12, 106, 38, 'red', true, 'PUNCH IN', { size: 11 });
button(AX + 144, py + 12, 106, 38, 'red', false, 'PUNCH OUT', { size: 11 });
button(AX + 260, py + 12, 84, 38, 'amber', false, 'AUTO', { size: 11 });
text(AX + 28, py + 78, 'TRACKS', 11, '#d9d3c7', 'start', 800, 'letter-spacing="2"');
button(AX + 28, py + 90, 156, 34, 'red', false, 'ALL READY', { size: 11 });
button(AX + 192, py + 90, 152, 34, 'white', false, 'ALL SAFE', { size: 11 });

// =====================================================================
// TAPE METER BRIDGE (24 VU + READY/SAFE)
// =====================================================================
const MX = 1830, MY = 76, MW = 1440, MH = 816;
p(`<g filter="url(#shadow)">`);
rect(MX, MY, MW, MH, '#3d3936', 'rx="10"');
p(`</g>`);
rect(MX + 8, MY + 8, MW - 16, MH - 16, 'url(#deck)', 'rx="6"');
rect(MX + 8, MY + 8, MW - 16, MH - 16, '#000', 'filter="url(#brushed)" opacity="0.08" rx="6"');
text(MX + 30, MY + 42, 'TAPE METER BRIDGE', 13, '#e9e3d0', 'start', 800, 'letter-spacing="3"');
text(MX + MW - 30, MY + 42, 'REPRO  ·  INPUT  ·  SYNC', 11, '#d9d3c7', 'end', 800, 'letter-spacing="2"');
button(MX + MW - 330, MY + 26, 66, 22, 'green', true, 'REPRO', { size: 9 });
const tapeNames = ['KICK', 'SNR TOP', 'SNR BTM', 'HAT', 'TOM 1', 'TOM 2', 'FL TOM', 'OH L', 'OH R', 'ROOM L', 'ROOM R', 'BASS DI', 'BASS AMP', 'GTR 1', 'GTR 2', 'AC GTR', 'KEYS L', 'KEYS R', 'ORGAN', 'LEAD VOX', 'BGV 1', 'BGV 2', 'PERC', 'TAMB'];
const tapeDb = tapeNames.map((n, i) => (i === 19 ? 1.2 : i === 21 ? -30 : -14 + rnd() * 15));
const readyTracks = new Set([19, 20, 21]);
for (let i = 0; i < 24; i++) {
  const c = i % 8, r = Math.floor(i / 8);
  const cx0 = MX + 24 + c * 174, cy0 = MY + 66 + r * 246;
  rect(cx0, cy0, 166, 234, '#4c4743', 'rx="4"');
  rect(cx0, cy0, 166, 234, 'url(#bezelHi)', 'rx="4" opacity="0.6"');
  const lampOn = readyTracks.has(i);
  circle(cx0 + 148, cy0 + 11, 4.5, lampOn ? '#ff3b2f' : '#4a1612', lampOn ? 'filter="url(#glow)"' : '');
  circle(cx0 + 134, cy0 + 11, 4.5, i === 23 ? '#5fb4ff' : '#16304a', i === 23 ? 'filter="url(#glow)"' : '');
  vu(cx0 + 11, cy0 + 24, 144, 100, tapeDb[i], { label: String(i + 1), brand: 'MCI' });
  // track number + name
  text(cx0 + 12, cy0 + 150, String(i + 1).padStart(2, '0'), 20, '#e9e3d0', 'start', 800);
  rect(cx0 + 50, cy0 + 132, 104, 24, 'url(#tapeMask)', 'rx="1" transform="rotate(-0.6 ' + (cx0 + 100) + ' ' + (cy0 + 144) + ')"');
  text(cx0 + 102, cy0 + 150, tapeNames[i], 13, '#1c2a6e', 'middle', 700, `font-family="${MARKER}"`);
  const ready = lampOn;
  button(cx0 + 12, cy0 + 168, 68, 30, 'red', ready, 'READY', { size: 10 });
  button(cx0 + 86, cy0 + 168, 68, 30, 'white', !ready, 'SAFE', { size: 10 });
  // rec lamp
  circle(cx0 + 20, cy0 + 218, 5, ready ? '#ff3b2f' : '#3a1210', ready ? 'filter="url(#glow)"' : '');
  text(cx0 + 32, cy0 + 222, ready ? 'REC' : 'IN ' + (i + 1), 10, ready ? '#ff8a7a' : '#d9d3c7', 'start', 800, 'letter-spacing="1"');
  text(cx0 + 154, cy0 + 222, ready ? 'INPUT' : 'REPRO', 10, '#d9d3c7', 'end', 800, 'letter-spacing="1"');
}

// =====================================================================
// CONSOLE (MCI JH-600 style)
// =====================================================================
const CX = 12, CY = 916, CW = 3266, CH = 1244;
// console back edge / meter hood shadow
rect(CX, CY - 8, CW, 16, '#000', 'opacity="0.7" filter="url(#soft)"');
rect(CX + 34, CY - 6, CW - 68, 8, 'url(#oakH)');
// wood end cheeks
for (const wx of [CX, CX + CW - 34]) {
  rect(wx, CY, 34, CH, 'url(#wood)', 'rx="4"');
  rect(wx, CY, 34, CH, '#000', 'filter="url(#woodgrain)" opacity="0.8" rx="4"');
}
const SX0 = CX + 34, STRIP = 85, NCH = 32;
const MASTER_X = SX0 + NCH * STRIP, MASTER_W = CX + CW - 34 - MASTER_X;
const consoleNames = [...tapeNames, '224 L', '224 R', 'SPX L', 'SPX R', 'PCM42 A', 'PCM42 B', 'LIVE 1', 'TALK'];
const busLit = (i) => (i < 11 ? [0] : i < 13 ? [2] : i < 19 ? [4] : i < 23 ? [6] : []);
const muted = new Set([2, 22, 31]);
const soloed = new Set([19]);
const faderPos = consoleNames.map((n, i) => (i === 19 ? 0.2 : i === 31 ? 0.98 : 0.24 + rnd() * 0.2));

for (let ch = 0; ch < NCH; ch++) {
  const x = SX0 + ch * STRIP;
  const ret = ch >= 24;
  rect(x, CY, STRIP, 1174 - 330, ret ? 'url(#consoleAlt)' : 'url(#console)');
  rect(x, CY, STRIP, 844, '#000', 'filter="url(#brushed)" opacity="0.07"');
  rect(x, CY, 1, 1174, '#000', 'opacity="0.7"');
  rect(x + 1, CY, 1, 1174, '#fff', 'opacity="0.06"');
  const c1 = x + 23, c2 = x + 62, cm = x + STRIP / 2;
  const L = '#d9d3c2';
  // scribble strip
  text(cm, CY + 30, String(ch + 1), 16, '#f0ece4', 'middle', 800);
  // bus assign 1-8
  let y = CY + 52;
  const lit = busLit(ch);
  for (let b = 0; b < 8; b++) {
    const bx = x + 7 + (b % 4) * 18.5, by = y + Math.floor(b / 4) * 20;
    button(bx, by, 15, 15, 'amber', lit.includes(b) || (lit.includes(b - 1) && b % 2 === 1), String(b + 1), { size: 8 });
  }
  y += 44;
  button(x + 7, y, 34, 16, 'white', ch === 31, 'MIC', { size: 8 });
  button(x + 45, y, 34, 16, 'white', ch !== 31, 'LINE', { size: 8 });
  text(cm, y + 30, ret ? 'RETURN' : 'TAPE', 8, '#a9a493', 'middle', 700, 'letter-spacing="1"');
  // input
  y = CY + 160;
  knob(c1, y, 14, '#1d1d1f', -20 + rnd() * 60, { label: 'TRIM', labelColor: L, labelSize: 8, dark: true });
  button(c2 - 14, y - 22, 28, 15, 'red', ch === 0, 'PAD', { size: 8 });
  button(c2 - 14, y + 2, 28, 15, 'white', ch === 2, 'Ø', { size: 9 });
  // HPF
  y = CY + 222;
  knob(c1, y, 13, '#ecebe4', -120 + rnd() * 50, { label: 'HPF', labelColor: L, labelSize: 8 });
  button(c2 - 14, y - 8, 28, 15, 'white', [0, 2, 3, 19, 20, 21].includes(ch), 'IN', { size: 8 });
  // EQ
  const bands = [['HF', '#c8302a'], ['HMF', '#e6c02e'], ['LMF', '#2f62b0'], ['LF', '#ecebe4']];
  rect(x + 4, CY + 256, STRIP - 8, 1, '#000', 'opacity="0.5"');
  text(cm, CY + 270, 'EQUALIZER', 8, '#a9a493', 'middle', 800, 'letter-spacing="1"');
  bands.forEach(([bn, col], bi) => {
    const yy = CY + 300 + bi * 62;
    knob(c1, yy, 11, '#1d1d1f', -80 + rnd() * 160, { label: bn + ' FREQ', labelColor: L, labelSize: 7, ticks: true });
    knob(c2, yy, 14, col, (rnd() - 0.5) * 140, { label: 'GAIN', labelColor: L, labelSize: 7 });
  });
  const eqOn = ![5, 6, 15, 24, 25, 31].includes(ch);
  button(x + 14, CY + 534, STRIP - 28, 18, 'green', eqOn, 'EQ IN', { size: 9 });
  // aux
  rect(x + 4, CY + 562, STRIP - 8, 1, '#000', 'opacity="0.5"');
  text(cm, CY + 576, 'AUX SENDS', 8, '#a9a493', 'middle', 800, 'letter-spacing="1"');
  const auxCols = ['#c8302a', '#c8302a', '#e6c02e', '#e6c02e'];
  for (let a = 0; a < 4; a++) {
    const ax = a % 2 === 0 ? c1 : c2, ay = CY + 604 + Math.floor(a / 2) * 56;
    const active = (a === 0 && ch < 24 && [1, 19, 20, 21, 15].includes(ch)) || (a === 1 && [19, 13, 14].includes(ch)) || (a >= 2 && ch < 24);
    knob(ax, ay, 12, auxCols[a], active ? -40 + rnd() * 120 : -150, { label: `AUX ${a + 1}`, labelColor: L, labelSize: 7 });
  }
  // insert + pre
  y = CY + 704;
  button(x + 7, y, 34, 16, 'blue', [0, 1, 12, 19].includes(ch), 'INS', { size: 8 });
  button(x + 45, y, 34, 16, 'white', ch >= 2 && ch < 24 && ch % 5 === 0, 'PRE', { size: 8 });
  // pan
  knob(cm, CY + 754, 16, '#1d1d1f', ch === 7 || ch === 9 ? -110 : ch === 8 || ch === 10 ? 110 : ch % 2 ? 50 * (rnd() - 0.2) : -50 * (rnd() - 0.2), { label: 'PAN', labelColor: L, labelSize: 8, dark: true });
  // mute / solo
  y = CY + 800;
  button(x + 6, y, 35, 26, 'red', muted.has(ch), 'MUTE', { size: 8 });
  button(x + 44, y, 35, 26, 'yellow', soloed.has(ch), 'SOLO', { size: 8 });
  // fader bay
  rect(x, CY + 844, STRIP, 330, 'url(#faderBay)');
  rect(x, CY + 844, STRIP, 2, '#000', 'opacity="0.6"');
  rect(x, CY + 846, STRIP, 30, '#f3f1ea');
  rect(x, CY + 846, 1, 30, '#bdb8ad');
  text(cm, CY + 868, consoleNames[ch], consoleNames[ch].length > 7 ? 12 : 14, '#1c2a6e', 'middle', 700, `font-family="${MARKER}"`);
  fader(x + 52, CY + 900, CY + 1130, faderPos[ch], { capW: 30, capH: 48, index: ret ? '#e6c02e' : '#ffffff', capFill: 'url(#faderCapBlack)', scaleColor: '#1e1a1b' });
  text(cm, CY + 1162, String(ch + 1), 13, '#1e1a1b', 'middle', 800);
}
// group dividers (every 8 channels)
for (let g = 1; g < 4; g++) rect(SX0 + g * 8 * STRIP - 1, CY, 3, 1174, '#0a0a0b');

// ---- master section ----
const mx = MASTER_X;
rect(mx, CY, MASTER_W, 1174, 'url(#consoleMaster)');
rect(mx, CY, MASTER_W, 1174, '#000', 'filter="url(#brushed)" opacity="0.07"');
rect(mx, CY, 3, 1174, '#000');
text(mx + MASTER_W / 2, CY + 30, 'MASTER', 15, '#e9e3d0', 'middle', 800, 'letter-spacing="5"');
vu(mx + 22, CY + 48, 196, 140, 0.4, { label: 'L', brand: 'MCI' });
vu(mx + MASTER_W - 218, CY + 48, 196, 140, -0.6, { label: 'R', brand: 'MCI' });
// aux masters + returns
let my = CY + 236;
text(mx + 20, my, 'AUX MASTERS', 9, '#a9a493', 'start', 800, 'letter-spacing="1.5"');
text(mx + MASTER_W / 2 + 10, my, 'AUX RETURNS', 9, '#a9a493', 'start', 800, 'letter-spacing="1.5"');
for (let a = 0; a < 4; a++) {
  knob(mx + 40 + a * 50, my + 38, 14, a < 2 ? '#e8c34a' : '#e8e0cc', 20 + a * 10, { label: String(a + 1), labelSize: 8 });
  knob(mx + MASTER_W / 2 + 30 + a * 50, my + 38, 14, '#8f8a7c', -10 + a * 15, { label: `R${a + 1}`, labelSize: 8 });
}
// monitor section
my = CY + 330;
rect(mx + 12, my - 14, MASTER_W - 24, 1, '#000', 'opacity="0.5"');
text(mx + 20, my + 6, 'CONTROL ROOM', 10, '#a9a493', 'start', 800, 'letter-spacing="1.5"');
const srcs = [['MIX', true], ['2-TRK', false], ['CUE 1', false], ['CUE 2', false]];
srcs.forEach(([s, on], i) => button(mx + 20 + i * 64, my + 20, 56, 26, 'white', on, s, { size: 9 }));
button(mx + 20, my + 58, 56, 26, 'amber', false, 'DIM', { size: 9 });
button(mx + 84, my + 58, 56, 26, 'amber', false, 'MONO', { size: 9 });
button(mx + 148, my + 58, 56, 26, 'red', false, 'CUT', { size: 9 });
button(mx + 212, my + 58, 56, 26, 'white', false, 'ALT SPK', { size: 8 });
bigKnob(mx + MASTER_W - 80, my + 70, 46, 40, { label: 'MONITOR LEVEL', capColor: '#242628' });
// cue / studio
my = CY + 470;
text(mx + 20, my, 'CUE / STUDIO', 10, '#a9a493', 'start', 800, 'letter-spacing="1.5"');
knob(mx + 46, my + 40, 15, '#e8c34a', 30, { label: 'CUE 1', labelSize: 8 });
knob(mx + 106, my + 40, 15, '#e8c34a', 10, { label: 'CUE 2', labelSize: 8 });
knob(mx + 166, my + 40, 15, '#8f8a7c', -40, { label: 'STUDIO', labelSize: 8 });
button(mx + 210, my + 26, 66, 26, 'white', true, 'CUE→CR', { size: 8 });
button(mx + 286, my + 26, 66, 26, 'white', false, 'CUE→ST', { size: 8 });
button(mx + 362, my + 26, 66, 26, 'yellow', true, 'SOLO CLR', { size: 8 });
// talkback
my = CY + 580;
rect(mx + 12, my - 14, MASTER_W - 24, 1, '#000', 'opacity="0.5"');
text(mx + 20, my + 6, 'TALKBACK', 10, '#a9a493', 'start', 800, 'letter-spacing="1.5"');
button(mx + 20, my + 20, 140, 56, 'red', false, 'TALK', { size: 16 });
knob(mx + 200, my + 46, 15, '#c8c2b0', -20, { label: 'TB LEVEL', labelSize: 8 });
button(mx + 240, my + 26, 70, 26, 'white', false, 'SLATE', { size: 9 });
button(mx + 320, my + 26, 70, 26, 'white', false, 'TB→CUE', { size: 9 });
// talkback mic grille
for (let gx = 0; gx < 7; gx++) for (let gy2 = 0; gy2 < 3; gy2++) circle(mx + 410 + gx * 8 - 24, my + 66 + gy2 * 8, 2, '#0a0a0a');
// oscillator
my = CY + 690;
text(mx + 20, my + 6, 'OSCILLATOR', 10, '#a9a493', 'start', 800, 'letter-spacing="1.5"');
button(mx + 20, my + 18, 56, 22, 'green', false, '100', { size: 9 });
button(mx + 82, my + 18, 56, 22, 'green', false, '1k', { size: 9 });
button(mx + 144, my + 18, 56, 22, 'green', false, '10k', { size: 9 });
knob(mx + 236, my + 30, 13, '#8f8a7c', -150, { label: 'OSC LVL', labelSize: 7 });
button(mx + 290, my + 18, 140, 22, 'amber', false, 'BOUNCE MIX → WAV', { size: 9 });
// master fader bay
rect(mx, CY + 844, MASTER_W, 330, 'url(#faderBay)');
rect(mx, CY + 844, MASTER_W, 2, '#000', 'opacity="0.6"');
rect(mx, CY + 846, MASTER_W, 30, '#f3f1ea');
text(mx + MASTER_W / 2, CY + 867, 'GROUPS 1–8  ·  STEREO MASTER', 12, '#3a3436', 'middle', 800, 'letter-spacing="2"');
for (let g = 0; g < 8; g++) {
  const gx = mx + 40 + g * 40;
  fader(gx, CY + 900, CY + 1130, 0.22 + (g % 3) * 0.03, { capW: 24, capH: 40, scale: g === 0, capFill: ['url(#faderCapYellow)', 'url(#faderCapGreen)', 'url(#faderCapWhite)', 'url(#faderCapBlack)'][g % 4], index: '#111', scaleColor: '#1e1a1b' });
  text(gx, CY + 1162, `G${g + 1}`, 11, '#1e1a1b', 'middle', 800);
}
const mfx = mx + MASTER_W - 64;
fader(mfx, CY + 900, CY + 1130, 0.22, { capW: 52, capH: 56, scale: true, capFill: 'url(#faderCapRed)', index: '#ffffff', scaleColor: '#1e1a1b' });
text(mfx, CY + 1162, 'STEREO', 11, '#1e1a1b', 'middle', 800, 'letter-spacing="1"');

// armrest
const ary = CY + 1174;
rect(CX + 34, ary, CW - 68, 14, 'url(#oakH)');
rect(CX + 34, ary, CW - 68, 14, '#000', 'filter="url(#woodgrainH)" opacity="0.5"');
rect(CX + 34, ary + 14, CW - 68, 56, 'url(#armrest)');
rect(CX + 34, ary + 14, CW - 68, 56, '#000', 'filter="url(#vinyl)" opacity="0.35"');
rect(CX + 34, ary + 6, CW - 68, 2, '#fff', 'opacity="0.06"');
for (let sxx = CX + 140; sxx < CX + CW - 80; sxx += 420) rect(sxx, ary + 4, 1, 64, '#000', 'opacity="0.4"');

// =====================================================================
// OUTBOARD RACK
// =====================================================================
const RX = 3290, RY = 60, RW = 550, RH = 2100;
rect(RX, RY, RW, RH, '#0b0a09');
// cabinet sides
for (const wx of [RX, RX + RW - 26]) {
  rect(wx, RY, 26, RH, 'url(#wood)');
  rect(wx, RY, 26, RH, '#000', 'filter="url(#woodgrain)" opacity="0.8"');
}
const rl = RX + 26, rr = RX + RW - 26;
rect(rl, RY, 22, RH, 'url(#rail)');
rect(rr - 22, RY, 22, RH, 'url(#rail)');
for (let yy = RY + 10; yy < RY + RH; yy += 15.2) {
  rect(rl + 8, yy, 7, 5, '#151515', 'rx="1"');
  rect(rr - 15, yy, 7, 5, '#151515', 'rx="1"');
}
text(RX + RW / 2, RY + 30, 'OUTBOARD RACK', 14, '#e9e3d0', 'middle', 800, 'letter-spacing="4"');
text(RX + RW / 2, RY + 50, 'drag a unit to a channel insert or aux send', 11, '#d9d3c7', 'middle', 600);
const U = 50, UX = rl + 2, UW = rr - rl - 4;
let uy = RY + 70;

function rackUnit(units, fill, draw) {
  const h = units * U - 4;
  rect(UX + 3, uy + 6, UW, h, '#000', 'opacity="0.6" filter="url(#soft)"');
  rect(UX, uy, UW, h, fill, 'rx="2"');
  rect(UX, uy, UW, 2, '#fff', 'opacity="0.12"');
  rect(UX, uy + h - 2, UW, 2, '#000', 'opacity="0.5"');
  // rack ears + screws
  for (const ex of [UX + 12, UX + UW - 12]) {
    screw(ex, uy + 13, 5);
    if (units > 1) screw(ex, uy + h - 13, 5);
  }
  draw(UX, uy, UW, h);
  // insert routing tag
  uy += units * U;
}
function routeTag(x, y, s, col = '#e8c34a') {
  rect(x, y, s.length * 6.4 + 14, 16, '#000', 'rx="8" opacity="0.6"');
  text(x + 7, y + 12, s, 9.5, col, 'start', 800, 'letter-spacing="0.5"');
}

// Lexicon 224 (3U)
rackUnit(3, 'url(#rack224)', (x, y, w, h) => {
  text(x + 30, y + 38, 'lexicon', 26, '#efe9da', 'start', 900, 'letter-spacing="-0.5"');
  text(x + 30, y + 58, '224 DIGITAL REVERBERATOR', 10, '#d6cfbe', 'start', 800, 'letter-spacing="1.5"');
  rect(x + 30, y + 70, 150, 50, '#000', 'rx="3"');
  rect(x + 34, y + 74, 142, 42, 'url(#displayBg)', 'rx="2"');
  seg7(x + 42, y + 81, 28, '4.1', '#ff3220');
  seg7(x + 106, y + 81, 28, '2.4', '#ff3220');
  text(x + 60, y + 134, 'PROG', 8, '#d6cfbe', 'middle', 800); text(x + 140, y + 134, 'RT60', 8, '#d6cfbe', 'middle', 800);
  const sl = ['BASS RT', 'MID RT', 'X-OVER', 'HF CUT', 'DEPTH', 'PREDLY'];
  sl.forEach((s, i) => {
    const fx = x + 204 + i * 34;
    rect(fx - 2, y + 26, 4, 84, '#0b0b0b', 'rx="2"');
    const cy2 = y + 36 + (0.2 + rnd() * 0.6) * 64;
    rect(fx - 10, cy2 - 7, 20, 14, 'url(#faderCapBlack)', 'rx="2"');
    rect(fx - 8, cy2 - 1, 16, 2, '#e8e0cc');
    text(fx, y + 126, s, 7, '#d6cfbe', 'middle', 800);
  });
  for (let b = 0; b < 4; b++) button(x + w - 74 + (b % 2) * 28, y + 30 + Math.floor(b / 2) * 26, 22, 18, 'red', b === 0, String(b + 1), { size: 8 });
  text(x + w - 60, y + 100, 'BANK', 8, '#d6cfbe', 'middle', 800);
  routeTag(x + w - 106, y + h - 24, 'AUX 1 → 25/26');
});
// UA 1176 x2 (2U)
for (let k = 0; k < 2; k++) {
  rackUnit(2, 'url(#rackBlack)', (x, y, w, h) => {
    text(x + 32, y + 26, 'UNIVERSAL AUDIO', 8, '#cfcfcf', 'start', 800, 'letter-spacing="1"');
    text(x + 32, y + 52, '1176LN', 22, '#f2f2f2', 'start', 800);
    text(x + 32, y + 68, 'PEAK LIMITER', 8, '#cfcfcf', 'start', 800, 'letter-spacing="1.5"');
    bigKnob(x + 160, y + 44, 22, k ? 10 : 40, { label: '', capColor: '#101010' });
    text(x + 160, y + 88, 'INPUT', 7, '#cfcfcf', 'middle', 800);
    bigKnob(x + 226, y + 44, 22, -10, { label: '', capColor: '#101010' });
    text(x + 226, y + 88, 'OUTPUT', 7, '#cfcfcf', 'middle', 800);
    knob(x + 272, y + 32, 9, '#cfd2d6', 60, { ticks: false, dark: true });
    knob(x + 272, y + 64, 9, '#cfd2d6', -40, { ticks: false, dark: true });
    text(x + 290, y + 35, 'ATK', 7, '#cfcfcf', 'start', 800);
    text(x + 290, y + 67, 'REL', 7, '#cfcfcf', 'start', 800);
    ['20', '12', '8', '4'].forEach((r, i) => {
      rect(x + 318, y + 12 + i * 18, 22, 14, i === 3 - k ? '#f4f0e6' : '#9a978f', 'rx="1"');
      text(x + 346, y + 23 + i * 18, r, 8, '#cfcfcf', 'start', 800);
    });
    vu(x + 368, y + 14, 82, 60, k ? -6 : -3.5, {});
    text(x + 409, y + 88, k ? 'INS · VOX' : 'INS · BASS', 7, '#e8c34a', 'middle', 800);
  });
}
// Yamaha SPX90 x2 (1U)
for (let k = 0; k < 2; k++) {
  rackUnit(1, 'url(#rackSpx)', (x, y, w, h) => {
    text(x + 30, y + 18, 'YAMAHA', 10, '#f0f0f0', 'start', 900, 'letter-spacing="1"');
    text(x + 30, y + 32, 'SPX90 DIGITAL MULTI-EFFECT', 6.5, '#d0d0d0', 'start', 700);
    knob(x + 148, y + 23, 8, '#202124', -30, { ticks: false, dark: true });
    text(x + 148, y + 44, 'IN', 6, '#d0d0d0', 'middle', 700);
    rect(x + 170, y + 8, 40, 30, '#000', 'rx="2"');
    seg7(x + 176, y + 12, 21, k ? '12' : '03', '#ff3220');
    rect(x + 216, y + 10, 92, 26, 'url(#lcd)', 'rx="2"');
    text(x + 222, y + 22, k ? 'PITCH CHANGE A' : 'REV 1 HALL', 8, '#1f2a10', 'start', 700, `font-family="'JetBrains Mono', monospace"`);
    text(x + 222, y + 32, k ? 'L -8  R +8' : 'RT=2.6s', 8, '#1f2a10', 'start', 700, `font-family="'JetBrains Mono', monospace"`);
    ['MEM', 'PARAM', '▲', '▼', 'STORE', 'RECALL'].forEach((b, i) => button(x + 316 + i * 21, y + 13, 18, 14, 'grey', false, '', {}));
    text(x + 380, y + 40, 'MEMORY · PARAM', 6, '#d0d0d0', 'middle', 700);
    knob(x + 454, y + 23, 8, '#202124', 10, { ticks: false, dark: true });
  });
}
// Lexicon PCM41 x2 (1U)
for (let k = 0; k < 2; k++) {
  rackUnit(1, 'url(#rackBlack)', (x, y, w, h) => {
    text(x + 30, y + 20, 'lexicon', 13, '#f0f0f0', 'start', 900);
    text(x + 30, y + 34, 'PCM 41 DIGITAL DELAY', 6.5, '#cfcfcf', 'start', 700, 'letter-spacing="0.5"');
    ledLadder(x + 132, y + 18, 6, 6, 8, k ? 3 : 4);
    const labs = ['INPUT', 'RANGE', 'DELAY', 'DEPTH', 'SWEEP', 'FDBK', 'MIX', 'OUTPUT'];
    labs.forEach((l, i) => {
      const kx2 = x + 196 + i * 31;
      knob(kx2, y + 19, 8, i === 2 ? '#c83a2c' : '#d8d8d8', -100 + rnd() * 200, { ticks: false, dark: i !== 2 });
      text(kx2, y + 41, l, 5.8, '#cfcfcf', 'middle', 700);
    });
    button(x + w - 52, y + 14, 22, 14, 'red', false, '', {});
  });
}
// Lexicon PCM42 x2 (1U)
for (let k = 0; k < 2; k++) {
  rackUnit(1, 'url(#rackBlack)', (x, y, w, h) => {
    text(x + 30, y + 20, 'lexicon', 13, '#f0f0f0', 'start', 900);
    text(x + 30, y + 34, 'PCM 42 DIGITAL DELAY', 6.5, '#cfcfcf', 'start', 700, 'letter-spacing="0.5"');
    rect(x + 132, y + 8, 64, 30, '#000', 'rx="2"');
    seg7(x + 137, y + 13, 20, k ? '375' : '250', '#ff3220', { gap: 0.25 });
    text(x + 208, y + 22, 'ms', 7, '#cfcfcf', 'start', 700);
    const labs = ['INPUT', 'MANUAL', 'VCO', 'FDBK', 'MIX', 'OUTPUT'];
    labs.forEach((l, i) => {
      const kx2 = x + 232 + i * 30;
      knob(kx2, y + 19, 8, i === 1 ? '#c83a2c' : '#d8d8d8', -100 + rnd() * 200, { ticks: false, dark: i !== 1 });
      text(kx2, y + 41, l, 5.8, '#cfcfcf', 'middle', 700);
    });
    ['×2', 'HOLD', 'BYP'].forEach((b, i) => button(x + w - 80 + i * 21, y + 14, 18, 14, i === 0 && k === 1 ? 'red' : 'grey', i === 0 && k === 1, '', {}));
  });
}
// free plugin slots
uy += 6;
text(RX + RW / 2, uy + 4, 'PLUGIN SLOTS', 10, '#d9d3c7', 'middle', 800, 'letter-spacing="3"');
uy += 14;
rackUnit(1, '#1a1b1e', (x, y, w, h) => {
  rect(x + 28, y + 6, w - 56, h - 12, '#26292e', 'rx="3"');
  text(x + 44, y + 22, 'VST3', 9, '#7fb0ff', 'start', 800);
  text(x + 44, y + 36, 'Plate Reverb', 12, '#e8e4d8', 'start', 600);
  ledLadder(x + 220, y + 18, 8, 6, 8, 5);
  text(x + w - 40, y + 28, 'AUX 2 · open ▸', 9, '#e8c34a', 'end', 800);
});
for (let k = 0; k < 2; k++) {
  rackUnit(1, '#121315', (x, y, w, h) => {
    rect(x + 28, y + 6, w - 56, h - 12, 'none', 'rx="3" stroke="#4a4c50" stroke-width="1.5" stroke-dasharray="6 5"');
    text(x + w / 2, y + 28, '+  drop a VST3 / AU plugin here', 11, '#7a776c', 'middle', 700);
  });
}
// patchbay (2U)
uy += 10;
rackUnit(2, 'url(#rackBlack)', (x, y, w, h) => {
  text(x + w / 2, y + 12, 'PATCHBAY · INSERTS', 7, '#cfcfcf', 'middle', 800, 'letter-spacing="2"');
  for (let row = 0; row < 2; row++) {
    for (let j = 0; j < 24; j++) {
      const jx = x + 34 + j * 18.2, jy = y + 30 + row * 40;
      circle(jx, jy, 5.2, '#5d6066'); circle(jx, jy, 3.2, '#050505');
      if (row === 0) text(jx, jy - 9, String(j + 1), 5.5, '#bdbdbd', 'middle', 700);
    }
    rect(x + 26, y + 40 + row * 40, w - 52, 8, '#e9dfc6', 'opacity="0.85"');
    text(x + 30, y + 46 + row * 40, row ? 'INSERT RETURN' : 'INSERT SEND', 5.5, '#333', 'start', 800);
  }
});
// patch cables
const cable = (x1, y1, x2, y2, sag, col) => {
  const d = `M${x1} ${y1} C${x1} ${y1 + sag} ${x2} ${y2 + sag} ${x2} ${y2}`;
  p(`<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="7" transform="translate(3 6)"/>`);
  p(`<path d="${d}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"/>`);
  p(`<path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="1.5" transform="translate(-1 -1)"/>`);
  for (const [cx, cy] of [[x1, y1], [x2, y2]]) { circle(cx, cy, 6.5, 'url(#chrome)'); circle(cx, cy, 3, '#222'); }
};
const pbY = uy - 2 * U;
cable(UX + 34, pbY + 30, UX + 34 + 12 * 18.2, pbY + 70, 70, '#c0392b');
cable(UX + 34 + 19 * 18.2, pbY + 30, UX + 34 + 1 * 18.2, pbY + 70, 90, '#2f6fb3');
cable(UX + 34 + 6 * 18.2, pbY + 30, UX + 34 + 20 * 18.2, pbY + 70, 60, '#e8c34a');

// plugin browser
uy += 20;
const bx0 = UX + 2, bw = UW - 4, by0 = uy, bh = RY + RH - 24 - uy;
rect(bx0, by0, bw, bh, '#141517', 'rx="6"');
rect(bx0, by0, bw, bh, 'none', 'rx="6" stroke="#2c2e32" stroke-width="1.5"');
text(bx0 + 20, by0 + 34, 'PLUGINS', 14, '#e9e3d0', 'start', 800, 'letter-spacing="3"');
button(bx0 + bw - 110, by0 + 16, 90, 28, 'amber', false, 'SCAN', { size: 11 });
rect(bx0 + 20, by0 + 56, bw - 40, 34, '#0b0b0c', 'rx="4"');
text(bx0 + 34, by0 + 78, 'Search plugins…', 13, '#6f6c62', 'start', 500);
text(bx0 + 20, by0 + 118, 'BUILT-IN VINTAGE', 10, '#d9d3c7', 'start', 800, 'letter-spacing="2"');
const builtins = ['224 Digital Reverb', '1176LN Peak Limiter', 'SPX90 Multi-Effect', 'PCM41 Digital Delay', 'PCM42 Digital Delay'];
builtins.forEach((b, i) => {
  const ry = by0 + 130 + i * 40;
  rect(bx0 + 20, ry, bw - 40, 34, i % 2 ? '#17181b' : '#1c1d20', 'rx="3"');
  rect(bx0 + 30, ry + 9, 26, 16, '#3a3226', 'rx="2"');
  text(bx0 + 43, ry + 21, 'IN', 8, '#e8c34a', 'middle', 800);
  text(bx0 + 68, ry + 22, b, 13, '#e8e4d8', 'start', 600);
  text(bx0 + bw - 34, ry + 22, i === 0 ? '1 in rack' : '2 in rack', 10, '#d9d3c7', 'end', 600);
});
const tp = by0 + 350;
text(bx0 + 20, tp, 'THIRD-PARTY · 14 FOUND', 10, '#d9d3c7', 'start', 800, 'letter-spacing="2"');
const third = [['Plate Reverb', 'VST3'], ['Tape Echo', 'AU'], ['Bus Compressor', 'VST3'], ['Vintage EQ', 'AU'], ['Spring Reverb', 'VST3'], ['De-Esser', 'VST3'], ['Chorus Ensemble', 'AU'], ['Room Reverb', 'VST3'], ['Opto Leveler', 'AU'], ['Saturator', 'VST3'], ['Gate', 'AU'], ['Flanger', 'VST3']];
third.forEach(([n, f], i) => {
  const ry = tp + 12 + i * 40;
  if (ry + 34 > by0 + bh - 70) return;
  rect(bx0 + 20, ry, bw - 40, 34, i % 2 ? '#17181b' : '#1c1d20', 'rx="3"');
  rect(bx0 + 30, ry + 9, 34, 16, f === 'VST3' ? '#1c2a44' : '#2a1c3a', 'rx="2"');
  text(bx0 + 47, ry + 21, f, 8, f === 'VST3' ? '#7fb0ff' : '#c49bff', 'middle', 800);
  text(bx0 + 76, ry + 22, n, 13, '#e8e4d8', 'start', 600);
  text(bx0 + bw - 34, ry + 22, '⠿ drag', 10, '#6f6c62', 'end', 600);
});
text(bx0 + bw / 2, by0 + bh - 26, 'Scan · list · drag into a rack slot', 11, '#6f6c62', 'middle', 600);

// rack edge shadow over console + room lighting
rect(RX - 30, RY, 30, RH, 'url(#sheen)', 'opacity="0"');
p(`<rect x="${RX - 24}" y="${RY}" width="24" height="${RH}" fill="#000" opacity="0.5" filter="url(#soft)"/>`);
// global grain
rect(0, 0, W, H, '#808080', 'filter="url(#grain)"');
// vignette
p(`<radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient>`);
rect(0, 0, W, H, 'url(#vig)');

p(`</svg>`);

const svg = out.join('\n');
const dir = path.join(__dirname, '..');
fs.writeFileSync(path.join(dir, 'analog-studio-mockup.svg'), svg);
const html = `<!doctype html><html><head><meta charset="utf-8"><title>Analog Studio · 4K mockup</title>
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=block" rel="stylesheet">
<style>html,body{margin:0;background:#000;}svg{display:block;}</style></head><body>
${svg}
</body></html>`;
fs.writeFileSync(path.join(dir, 'analog-studio-mockup.html'), html);
console.log('wrote', svg.length, 'bytes');
