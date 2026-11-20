// SLS 4000 G console (the SLS studio's board), drawn as one SVG for the console area of the SLS room.
// Strip layout follows the SL 611G I/O module drawings in the SSL G Series operator's manual: routing matrix,
// group output, channel input, dynamics, filters, G Series EQ, cues, monitor input + small fader, quad pans,
// VCA fader with automation status (plus a short channel bargraph on top). Sized for the app: 32 channels plus the SL 651G-style master section in 3242 x 1446.
// Routing: 24 groups + quad bus (the app's 24 multitrack buses, same engine as the CMI room); the real 611G has 32.

module.exports = function buildSLS(h, { tapeNames }) {
  const { p, rect, text, circle, button, fader, capture } = h;
  const CW = 3242, CH = 1446, N = 32, SW = 82, GAP = 6;
  // split console: channels 1-16, the master section, channels 17-32
  const MX = 24 + 16 * SW + GAP, MW = CW - 18 - 24 - N * SW - 2 * GAP;
  const stripX = (i) => (i < 16 ? 24 + i * SW : MX + MW + GAP + (i - 16) * SW);
  const PANEL = '#33363b', PANEL2 = '#2a2c30', LINE = '#4b5058', INK = '#e9eaec', INK2 = '#aeb2b9';
  const names = [...tapeNames, '224 L', '224 R', 'SPX L', 'SPX R', 'PCM42 A', 'PCM42 B', 'LIVE 1', 'TALK'];
  let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  // SSL-style knob: coloured cap, dark skirt, white pointer. ang -150..150
  const sk = (cx, cy, r, col, ang = 0, lab = '', labY = null) => {
    circle(cx + 0.8, cy + 1.8, r + 1.6, '#000', 'opacity="0.55"');
    circle(cx, cy, r + 1.6, '#16171a');
    circle(cx, cy, r, col);
    circle(cx, cy, r, 'url(#capHiDark)');
    const a = (ang - 90) * Math.PI / 180;
    p(`<line x1="${(cx + r * 0.25 * Math.cos(a)).toFixed(1)}" y1="${(cy + r * 0.25 * Math.sin(a)).toFixed(1)}" x2="${(cx + r * 0.95 * Math.cos(a)).toFixed(1)}" y2="${(cy + r * 0.95 * Math.sin(a)).toFixed(1)}" stroke="#fff" stroke-width="${Math.max(1.4, r * 0.16).toFixed(1)}" stroke-linecap="round"/>`);
    if (lab) text(cx, labY ?? cy + r + 9, lab, 6.5, INK2, 'middle', 700, 'letter-spacing="0.3"');
  };
  const key = (x, y, w, hh, col, lit, lab, size = 6) => button(x, y, w, hh, col, lit, lab, { size, pastel: !lit && col !== 'red' && col !== 'yellow' });
  const sect = (x, y, w, lab) => { rect(x, y, w, 1, LINE); if (lab) text(x + w / 2, y + 9, lab, 6.2, '#8d939c', 'middle', 800, 'letter-spacing="1.2"'); };
  const ang = () => -120 + rnd() * 240;

  return capture(() => {
    p(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" style="position:absolute;left:24px;top:634px;overflow:visible">`);
    // console body: dark grey frame, wooden end cheeks
    rect(0, 0, CW, CH, '#1b1c1f', 'rx="10"');
    rect(0, 0, 18, CH, 'url(#woodH)', 'rx="6"'); rect(CW - 18, 0, 18, CH, 'url(#woodH)', 'rx="6"');
    rect(18, 0, CW - 36, CH, PANEL2);

    for (let i = 0; i < N; i++) {
      // Layout from the SL 611G I/O module drawings in the G Series operator's manual (section 2), top to bottom.
      const x0 = stripX(i), cx = x0 + SW / 2, L = x0 + 22, R = x0 + SW - 22;
      rect(x0 + 1, 4, SW - 2, CH - 8, PANEL, 'rx="3"');
      rect(x0 + 1, 4, 1, CH - 8, '#fff', 'opacity="0.06"');
      const led = (lx, ly, on, col = '#ff3b2f') => circle(lx, ly, 2.2, on ? col : '#3a2420', on ? 'filter="url(#glowSm)"' : '');
      // ---- channel bargraph (meter bridge strip, shortened)
      rect(x0 + 8, 8, SW - 16, 90, '#0b0b0c', 'rx="3"');
      text(x0 + 14, 20, String(i + 1), 8.5, INK, 'start', 800);
      const lvl = i < 24 ? 0.35 + rnd() * 0.5 : 0.2 + rnd() * 0.3;
      // meter scale (dB) and a 28-segment bar: room freed by the 24-group matrix
      [['+10', 27], ['0', 22], ['-10', 17], ['-20', 12], ['-40', 4]].forEach(([l, s]) => text(cx - 1, 93 - s * 2.95 + 2, l, 5, '#8d939c', 'end', 700));
      for (let s = 0; s < 28; s++) {
        const y = 91 - s * 2.95, on = s / 28 < lvl, col = s >= 25 ? '#ff3b2f' : s >= 21 ? '#ffd23a' : '#4fe07a';
        rect(cx + 2, y, 16, 2.0, col, on ? '' : 'opacity="0.13"');
      }
      // ---- routing matrix: 24 groups (the app's 24 multitrack buses), quad bus LF RF LB RB, PAN pot (odd / even) and PAN key
      for (let b = 0; b < 24; b++) {
        const bx = x0 + 9 + (b % 4) * 17, by = 106 + Math.floor(b / 4) * 13;
        const on = i < 24 && b === i;
        rect(bx, by, 14, 9, on ? '#ff5a3c' : '#5a5e66', `rx="1.5" ${on ? 'filter="url(#glowSm)"' : ''}`);
        text(bx + 7, by + 6.8, String(b + 1), 5.2, on ? '#1a0a05' : '#e3e5e8', 'middle', 800);
      }
      ['LF', 'RF', 'LB', 'RB'].forEach((q, k) => { const bx = x0 + 9 + k * 17, on = i >= 24 && k < 2; rect(bx, 186, 14, 9, on ? '#ffb02e' : '#6b6f77', `rx="1.5" ${on ? 'filter="url(#glowSm)"' : ''}`); text(bx + 7, 193, q, 5, on ? '#1a1208' : '#e3e5e8', 'middle', 800); });
      sk(L, 210, 7.5, '#8a8f97', ang(), ''); text(L - 10, 224, 'ODD', 4.8, INK2, 'middle', 700); text(L + 10, 224, 'EVEN', 4.8, INK2, 'middle', 700);
      key(R - 13, 204, 26, 11, 'white', i >= 24, 'PAN', 5.4);
      // ---- group output: TRIM (pull for solo isolate), FLOAT, DIRECT
      sect(x0 + 4, 230, SW - 8, '');
      sk(L, 246, 8.5, '#8a8f97', 140, 'TRIM', 262);
      key(R - 15, 236, 30, 10, 'white', false, 'FLOAT', 5.2); key(R - 15, 250, 30, 10, 'white', false, 'DIRECT', 4.8);
      // ---- channel input: LINE trim, FLIP, SUB GP, phase (mic preamps are external in this app)
      sect(x0 + 4, 268, SW - 8, '');
      sk(L, 286, 8.5, '#e6e7e9', ang(), 'LINE', 302); led(L + 12, 276, true, '#4fe07a');
      key(R - 15, 274, 30, 9, 'white', false, 'FLIP', 5.2); key(R - 15, 286, 30, 9, 'white', false, 'SUB GP', 4.6); key(R - 15, 298, 30, 9, 'white', false, 'Ø', 6.5);
      // ---- dynamics: compressor (RATIO, THRESHOLD, RELEASE + LINK), expander/gate (RANGE, THRESHOLD, RELEASE + GATE)
      sect(x0 + 4, 312, SW - 8, 'DYNAMICS');
      sk(L, 334, 9.5, '#e6e7e9', ang(), 'RATIO'); sk(R, 334, 9.5, '#e6e7e9', ang(), 'THRESH');
      sk(L, 366, 9.5, '#e6e7e9', ang(), 'RELEASE'); key(R - 13, 358, 26, 10, 'white', false, 'LINK', 5.4);
      const gr = Math.floor(rnd() * 4);
      [20, 14, 10, 6, 3].forEach((v, k) => { led(R - 8 + (k % 3) * 7 - 7, 375 + Math.floor(k / 3) * 6, k < gr, k < 2 ? '#ff3b2f' : '#ffd23a'); });
      rect(x0 + 8, 390, SW - 16, 1, LINE, 'opacity="0.6"');
      sk(L, 410, 9.5, '#1e1f22', ang(), 'RANGE'); sk(R, 410, 9.5, '#1e1f22', ang(), 'THRESH');
      sk(L, 442, 9.5, '#1e1f22', ang(), 'RELEASE'); key(R - 13, 434, 26, 10, 'white', rnd() > 0.8, 'GATE', 5.4);
      [0, 1, 2, 3, 4].forEach((k) => led(R - 14 + k * 6, 452, k < Math.floor(rnd() * 3), '#4fe07a'));
      [['CH IN', i % 5 === 0], ['CH OUT', false], ['MON', false]].forEach(([l, on], k) => key(x0 + 7 + k * 23, 462, 21, 10, 'white', on, l, 4.4));
      // ---- filters: HPF (Hz), LPF (kHz), SPLIT
      sect(x0 + 4, 478, SW - 8, 'FILTERS');
      sk(L, 498, 8.5, '#b9bcc2', ang(), 'Hz'); sk(R, 498, 8.5, '#b9bcc2', ang(), 'kHz');
      key(cx - 14, 514, 28, 9, 'white', false, 'SPLIT', 5);
      // ---- G Series equaliser: HF shelf, HMF (Q, x3), LMF (Q, ÷3), LF shelf, insert PRE / IN, routing CH / FLT DYN S-C / MON, overload
      sect(x0 + 4, 528, SW - 8, '');
      sk(L, 546, 9.5, '#c8352a', ang(), 'HF'); sk(R, 546, 8, '#c8352a', ang(), 'kHz');
      sk(L, 580, 9.5, '#3f9a58', ang(), 'HMF'); sk(R, 580, 8, '#3f9a58', ang(), 'kHz');
      sk(L, 610, 7, '#3f9a58', ang(), 'Q', 622); key(R - 12, 604, 24, 9, 'white', false, 'x3', 6);
      key(x0 + 10, 628, 28, 9, 'white', false, 'PRE', 5); key(x0 + 44, 628, 28, 9, 'white', false, 'IN', 5.4); text(cx, 645, 'INSERT', 4.8, '#8d939c', 'middle', 800, 'letter-spacing="0.8"');
      sk(L, 664, 9.5, '#3577c2', ang(), 'LMF'); sk(R, 664, 8, '#3577c2', ang(), 'kHz');
      sk(L, 694, 7, '#3577c2', ang(), 'Q', 706); key(R - 12, 688, 24, 9, 'white', false, '÷3', 6);
      sk(L, 726, 9.5, '#1e1f22', ang(), 'LF'); sk(R, 726, 8, '#1e1f22', ang(), 'Hz');
      [['CH', i % 3 !== 2], ['FLT S-C', false], ['MON', false]].forEach(([l, on], k) => key(x0 + 7 + k * 23, 748, 21, 10, 'white', on, l, k === 1 ? 3.8 : 4.6));
      led(cx, 768, i === 19, '#ff3b2f'); text(cx + 6, 770, 'OVLD', 4.6, INK2, 'start', 700);
      // ---- cues: stereo (level + pan) and 1-4, each with PRE and SMALL FADER keys
      sect(x0 + 4, 776, SW - 8, 'CUES');
      sk(L, 796, 8.5, '#e0b23a', ang(), 'STEREO', 811); sk(R, 796, 7, '#e0b23a', ang(), 'L·R', 811);
      sk(L, 828, 8, '#d9dbde', ang(), '1', 843); sk(R, 828, 8, '#d9dbde', ang(), '2', 843);
      sk(L, 858, 8, '#d9dbde', ang(), '3', 873); sk(R, 858, 8, '#d9dbde', ang(), '4', 873);
      for (let k = 0; k < 5; k++) { const kx = x0 + 6 + k * 14.4; rect(kx, 878, 12, 6, k === 0 ? '#c9b26a' : '#9a9ea6', 'rx="1"'); rect(kx, 886, 12, 6, '#6b6f77', 'rx="1"'); }
      text(x0 + 6, 900, 'PRE / SMALL FADER', 4.4, '#8d939c', 'start', 700);
      // ---- monitor input: READY GROUP, READY TAPE, RECORD (track number)
      sect(x0 + 4, 904, SW - 8, '');
      const rdy = i >= 19 && i <= 21;
      key(x0 + 8, 910, 32, 13, 'white', false, 'R.GRP', 5); key(x0 + 42, 910, 32, 13, 'white', rdy || i < 24, 'R.TAPE', 4.8);
      key(x0 + 12, 928, 58, 18, 'red', rdy, i < 24 ? `REC ${i + 1}` : 'RECORD', 6.5);
      // ---- small fader with INPUT / OUTPUT, SOLO and CUT
      fader(x0 + 22, 956, 1030, 0.25 + rnd() * 0.4, { capW: 18, capH: 22, scale: false, capFill: 'url(#faderCapBlack)' });
      led(x0 + 22, 1040, i >= 24, '#4fe07a');
      key(x0 + 40, 952, 34, 10, 'white', false, 'INPUT', 5.2); key(x0 + 40, 965, 34, 10, 'white', false, 'OUTPUT', 4.8);
      key(x0 + 40, 984, 34, 11, 'yellow', false, 'SOLO', 5.4); key(x0 + 40, 999, 34, 11, 'red', false, 'CUT', 5.4);
      // ---- quad pans: front/back + IN, large L/R pan, large SOLO and CUT
      sk(x0 + 57, 1024, 6.5, '#8a8f97', 0, ''); text(x0 + 47, 1026, 'F', 4.8, INK2, 'middle', 700); text(x0 + 67, 1026, 'B', 4.8, INK2, 'middle', 700);
      key(x0 + 48, 1036, 18, 8, 'white', false, 'IN', 4.8);
      sect(x0 + 4, 1050, SW - 8, '');
      sk(cx, 1070, 12.5, '#c9ccd1', -20 + rnd() * 40, ''); text(cx - 17, 1086, 'L', 5.4, INK2, 'middle', 700); text(cx + 17, 1086, 'R', 5.4, INK2, 'middle', 700);
      key(x0 + 7, 1092, 33, 14, 'yellow', false, 'SOLO', 6); key(x0 + 42, 1092, 33, 14, 'red', i === 2, 'CUT', 6);
      // ---- VCA group window, VCA fader and automation status keys (Off Read Write Touch Latch Trim)
      rect(x0 + 8, 1112, 30, 13, '#0b0b0c', 'rx="2"');
      text(x0 + 23, 1122, `G${1 + Math.floor(i / 4) % 8}`, 8, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`);
      const modes = [['O', 'grey'], ['R', 'green'], ['W', 'red'], ['T', 'amber'], ['L', 'blue'], ['Tr', 'yellow']];
      const m = i % 9 === 4 ? 2 : i % 7 === 3 ? 3 : 1;
      modes.forEach(([lab, col], k) => key(x0 + 62, 1136 + k * 17, 14, 13, col, k === m, lab, 6));
      fader(x0 + 32, 1136, 1380, 0.3 + rnd() * 0.25, { capW: 24, capH: 38, scaleColor: '#aeb2b9' });
      // ---- scribble strip
      rect(x0 + 5, 1396, SW - 10, 22, '#e9e4d6', 'rx="2"');
      text(cx, 1411.5, names[i], 9.5, '#1c2a6e', 'middle', 700, `font-family="'Permanent Marker', 'Comic Neue', sans-serif"`);
      text(cx, 1434, String(i + 1), 9, INK2, 'middle', 800);
    }

    // =================== master section (SL 651G style) ===================
    const x = MX, w = MW, c = x + w / 2;
    rect(x, 4, w, CH - 8, PANEL, 'rx="4"');
    // stereo bargraph + bus compressor gain-reduction meter
    rect(x + 12, 10, w - 24, 108, '#0b0b0c', 'rx="3"');
    for (const [k, lab] of [[0, 'L'], [1, 'R']]) {
      const mx = x + 40 + k * 36;
      for (let s = 0; s < 24; s++) rect(mx, 106 - s * 3.6, 22, 2.4, s >= 21 ? '#ff3b2f' : s >= 17 ? '#ffd23a' : '#4fe07a', s < 18 - k ? '' : 'opacity="0.13"');
      text(mx + 11, 116, lab, 7, INK2, 'middle', 800);
    }
    // gain reduction meter (needle) for the bus compressor
    rect(x + 140, 18, w - 164, 92, '#efe6cc', 'rx="4"');
    for (let k = 0; k <= 10; k++) { const a = (-50 + k * 10) * Math.PI / 180, gx = x + 140 + (w - 164) / 2, gy = 120; p(`<line x1="${(gx + 74 * Math.sin(a)).toFixed(1)}" y1="${(gy - 74 * Math.cos(a)).toFixed(1)}" x2="${(gx + 84 * Math.sin(a)).toFixed(1)}" y2="${(gy - 84 * Math.cos(a)).toFixed(1)}" stroke="#2a2520" stroke-width="1.4"/>`); }
    { const gx = x + 140 + (w - 164) / 2; text(gx, 66, 'COMPRESSION', 9, '#2a2520', 'middle', 800, 'letter-spacing="1.5"'); p(`<line x1="${gx}" y1="118" x2="${gx + 34}" y2="42" stroke="#b3261b" stroke-width="2"/>`); text(gx - 70, 104, '0', 8, '#2a2520', 'middle', 700); text(gx + 70, 104, '20', 8, '#2a2520', 'middle', 700); }
    // stereo bus compressor
    sect(x + 8, 128, w - 16, 'STEREO BUS COMPRESSOR');
    const bc = [['THRESHOLD', '#e6e7e9', -30], ['RATIO', '#e6e7e9', -60], ['ATTACK', '#e6e7e9', -40], ['RELEASE', '#e6e7e9', 60], ['MAKE-UP', '#c8352a', 20]];
    bc.forEach(([lab, col, a], k) => sk(x + 50 + k * ((w - 100) / 4), 172, 17, col, a, lab, 202));
    key(x + 30, 218, 70, 18, 'red', true, 'COMP IN', 7.5); key(x + 110, 218, 70, 18, 'white', false, 'S/C', 7.5);
    text(x + w - 30, 232, 'SLS', 18, INK, 'end', 900, 'font-style="italic" letter-spacing="2"');
    // cue masters
    sect(x + 8, 248, w - 16, 'CUE MASTERS');
    ['ST CUE', 'CUE 1', 'CUE 2', 'CUE 3', 'CUE 4'].forEach((lab, k) => sk(x + 50 + k * ((w - 100) / 4), 288, 14, k ? '#d9dbde' : '#e0b23a', -20 + k * 15, lab, 314));
    ['FX RTN 1', 'FX RTN 2', 'FX RTN 3', 'FX RTN 4'].forEach((lab, k) => sk(x + 70 + k * ((w - 140) / 3), 346, 12, '#8a8f97', 10 * k, lab, 370));
    // monitor section
    sect(x + 8, 384, w - 16, 'MONITOR');
    sk(c, 452, 48, '#1e1f22', 40, 'MONITOR LEVEL', 516);
    ['LARGE', 'SMALL', 'MINI'].forEach((lab, k) => key(x + 24, 404 + k * 28, 76, 22, 'amber', k === 0, lab, 8));
    ['MIX', '2TR A', '2TR B'].forEach((lab, k) => key(x + w - 100, 404 + k * 28, 76, 22, 'white', k === 0, lab, 8));
    ['DIM', 'MONO', 'CUT', 'ALT'].forEach((lab, k) => key(x + 24 + k * ((w - 48 - 76) / 3), 530, 76, 22, k === 2 ? 'red' : 'white', false, lab, 8));
    // talkback / oscillator / slate
    sect(x + 8, 566, w - 16, 'TALKBACK · OSCILLATOR');
    key(x + 24, 584, 100, 34, 'red', false, 'TALK', 11);
    key(x + 134, 584, 80, 34, 'white', false, 'SLATE', 9);
    sk(x + 246, 601, 12, '#8a8f97', 0, 'TB LVL', 624);
    ['100', '1k', '10k'].forEach((lab, k) => key(x + 284 + k * 54, 586, 48, 22, 'green', k === 1, lab, 8));
    sk(x + w - 36, 597, 12, '#8a8f97', -30, 'OSC', 624);
    // automation master
    sect(x + 8, 640, w - 16, 'AUTOMATION');
    [['OFF', 'grey'], ['READ', 'green'], ['WRITE', 'red'], ['TOUCH', 'amber'], ['LATCH', 'blue'], ['TRIM', 'yellow']].forEach(([lab, col], k) => key(x + 24 + k * ((w - 48 - 70) / 5), 656, 70, 22, col, k === 1, lab, 8));
    // group (VCA) masters and the main mix fader
    sect(x + 8, 694, w - 16, 'GROUP MASTERS');
    const gw = (w - 150) / 8;
    for (let g = 0; g < 8; g++) {
      const gx = x + 24 + g * gw + gw / 2;
      key(gx - 13, 710, 26, 16, 'red', g === 5, 'M', 8);
      key(gx - 13, 730, 26, 16, 'green', g === 1, 'S', 8);
      fader(gx, 770, 1376, 0.3 + (g % 3) * 0.05, { capW: 26, capH: 42, scale: false, scaleColor: '#aeb2b9', capFill: ['url(#faderCapYellow)', 'url(#faderCapGreen)', 'url(#faderCapWhite)', 'url(#faderCapBlack)'][g % 4] });
      text(gx, 1400, `G${g + 1}`, 10, INK, 'middle', 800);
    }
    const mfx = x + w - 60;
    text(mfx, 724, 'MAIN', 10, INK, 'middle', 900, 'letter-spacing="2"');
    fader(mfx, 770, 1376, 0.22, { capW: 34, capH: 48, scaleColor: '#aeb2b9', capFill: 'url(#faderCapRed)' });
    text(mfx, 1400, 'STEREO', 9, INK, 'middle', 800);
    rect(x + 12, 1414, w - 24, 22, '#0d0d0e', 'rx="3"');
    text(c, 1429, 'SLS 4000 G · 32 CHANNEL', 10, '#d9d3c7', 'middle', 800, 'letter-spacing="3"');
    p('</svg>');
  });
};
