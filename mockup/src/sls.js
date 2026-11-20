// SLS 4000 G console (the SLS studio's board), drawn as one SVG for the console area of the SLS room.
// Strip layout follows the SL 611G I/O module top to bottom: bargraph meter, channel routing, dynamics,
// filters, four-band equaliser, cue sends, small fader (monitor path), pan / solo / cut, VCA fader with
// automation status. Sized for the app: 32 channels plus the SL 651G-style master section in 3242 x 1446.
// Audio routing and matrices match the CMI room (24 multitrack buses, VCA groups, same automation modes).

module.exports = function buildSLS(h, { tapeNames }) {
  const { p, rect, text, circle, button, fader, capture } = h;
  const CW = 3242, CH = 1446, N = 32, SW = 82, MX = 24 + N * SW + 10, MW = CW - MX - 14;
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
  const key = (x, y, w, hh, col, lit, lab, size = 6) => button(x, y, w, hh, col, lit, lab, { size, pastel: !lit });
  const sect = (x, y, w, lab) => { rect(x, y, w, 1, LINE); if (lab) text(x + w / 2, y + 9, lab, 6.2, '#8d939c', 'middle', 800, 'letter-spacing="1.2"'); };
  const ang = () => -120 + rnd() * 240;

  return capture(() => {
    p(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}" style="position:absolute;left:24px;top:634px;overflow:visible">`);
    // console body: dark grey frame, wooden end cheeks
    rect(0, 0, CW, CH, '#1b1c1f', 'rx="10"');
    rect(0, 0, 18, CH, 'url(#woodH)', 'rx="6"'); rect(CW - 18, 0, 18, CH, 'url(#woodH)', 'rx="6"');
    rect(18, 0, CW - 36, CH, PANEL2);

    for (let i = 0; i < N; i++) {
      const x0 = 24 + i * SW, cx = x0 + SW / 2, L = x0 + 22, R = x0 + SW - 22;
      rect(x0 + 1, 4, SW - 2, CH - 8, PANEL, 'rx="3"');
      rect(x0 + 1, 4, 1, CH - 8, '#fff', 'opacity="0.06"');
      // ---- bargraph meter (SL 674E style)
      rect(x0 + 8, 10, SW - 16, 108, '#0b0b0c', 'rx="3"');
      text(cx, 22, String(i + 1), 9, INK, 'middle', 800);
      const lvl = i < 24 ? 0.35 + rnd() * 0.5 : 0.2 + rnd() * 0.3;
      for (let s = 0; s < 24; s++) {
        const y = 110 - s * 3.6, on = s / 24 < lvl, col = s >= 21 ? '#ff3b2f' : s >= 17 ? '#ffd23a' : '#4fe07a';
        rect(cx - 7, y, 14, 2.4, col, on ? '' : 'opacity="0.13"');
      }
      // ---- channel routing: 24 bus keys, PAN key and routing pan
      sect(x0 + 4, 124, SW - 8, 'ROUTING');
      for (let b = 0; b < 24; b++) {
        const bx = x0 + 8 + (b % 4) * 17, by = 138 + Math.floor(b / 4) * 13;
        const on = (i < 24 && b === i) || (i >= 24 && false);
        rect(bx, by, 15, 10, on ? '#ff5a3c' : '#5a5e66', `rx="1.5" ${on ? 'filter="url(#glow)"' : ''}`);
        text(bx + 7.5, by + 7.4, String(b + 1), 5.6, on ? '#1a0a05' : '#e3e5e8', 'middle', 800);
      }
      key(x0 + 8, 220, 26, 11, 'white', false, 'PAN', 5.6);
      sk(R + 4, 226, 7, '#8a8f97', ang());
      // ---- dynamics: compressor / limiter and expander / gate with gain-reduction LEDs
      sect(x0 + 4, 240, SW - 8, 'DYNAMICS');
      sk(L, 266, 10.5, '#e6e7e9', ang(), 'RATIO'); sk(R, 266, 10.5, '#e6e7e9', ang(), 'THRESH');
      sk(L, 302, 10.5, '#e6e7e9', ang(), 'RELEASE');
      key(R - 13, 294, 26, 10, 'white', rnd() > 0.7, 'F.ATT', 5.4); key(R - 13, 307, 26, 10, 'white', false, 'PK', 5.4);
      for (let k = 0; k < 5; k++) circle(x0 + 76, 258 + k * 9, 2.2, k < Math.floor(rnd() * 4) ? '#ffd23a' : '#3a3220');
      rect(x0 + 8, 322, SW - 16, 1, LINE, 'opacity="0.6"');
      sk(L, 344, 10.5, '#3f9a58', ang(), 'RANGE'); sk(R, 344, 10.5, '#3f9a58', ang(), 'THRESH');
      sk(L, 380, 10.5, '#3f9a58', ang(), 'RELEASE');
      key(R - 13, 372, 26, 10, 'white', rnd() > 0.8, 'GATE', 5.4); key(R - 13, 385, 26, 10, 'white', false, 'F.ATT', 5.4);
      key(x0 + 8, 404, 30, 11, 'green', i % 5 === 0, 'DYN', 5.6); key(x0 + 44, 404, 30, 11, 'white', false, 'S/C', 5.6);
      // ---- filters
      sect(x0 + 4, 422, SW - 8, 'FILTERS');
      sk(L, 446, 9.5, '#b9bcc2', ang(), 'HPF'); sk(R, 446, 9.5, '#b9bcc2', ang(), 'LPF');
      key(x0 + 8, 470, 20, 10, 'white', false, 'Ø', 7); key(x0 + 31, 470, 20, 10, 'white', false, 'DYN', 5); key(x0 + 54, 470, 20, 10, 'white', false, 'EQ', 5);
      // ---- equaliser: HF red, HMF green, LMF blue, LF black
      sect(x0 + 4, 486, SW - 8, 'EQUALISER');
      sk(L, 512, 10.5, '#c8352a', ang(), 'HF'); sk(R, 512, 8.5, '#c8352a', ang(), 'kHz');
      key(x0 + 26, 532, 30, 9, 'white', false, 'BELL', 5.2);
      rect(x0 + 8, 546, SW - 16, 1, LINE, 'opacity="0.6"');
      sk(L, 566, 10.5, '#3f9a58', ang(), 'HMF'); sk(R, 566, 8.5, '#3f9a58', ang(), 'kHz'); sk(cx, 596, 7.5, '#3f9a58', ang(), 'Q');
      rect(x0 + 8, 616, SW - 16, 1, LINE, 'opacity="0.6"');
      sk(L, 636, 10.5, '#3577c2', ang(), 'LMF'); sk(R, 636, 8.5, '#3577c2', ang(), 'kHz'); sk(cx, 666, 7.5, '#3577c2', ang(), 'Q');
      rect(x0 + 8, 686, SW - 16, 1, LINE, 'opacity="0.6"');
      sk(L, 706, 10.5, '#1e1f22', ang(), 'LF'); sk(R, 706, 8.5, '#1e1f22', ang(), 'Hz');
      key(x0 + 8, 726, 30, 9, 'white', false, 'BELL', 5.2); key(x0 + 44, 726, 30, 9, 'green', i % 3 !== 2, 'EQ IN', 5.2);
      // ---- cue sends: stereo cue (level + pan) and cues 1-4
      sect(x0 + 4, 744, SW - 8, 'CUES');
      sk(L, 768, 9.5, '#e0b23a', ang(), 'ST CUE'); sk(R, 768, 8, '#e0b23a', ang(), 'PAN');
      sk(L, 804, 9, '#d9dbde', ang(), 'CUE 1'); sk(R, 804, 9, '#d9dbde', ang(), 'CUE 2');
      sk(L, 840, 9, '#d9dbde', ang(), 'CUE 3'); sk(R, 840, 9, '#d9dbde', ang(), 'CUE 4');
      key(x0 + 8, 862, 20, 9, 'white', false, 'PRE', 5); key(x0 + 31, 862, 20, 9, 'white', false, 'PRE', 5); key(x0 + 54, 862, 20, 9, 'white', false, 'PRE', 5);
      // ---- small fader (monitor path) with FLIP and monitor keys
      sect(x0 + 4, 878, SW - 8, 'MONITOR');
      fader(x0 + 22, 896, 966, 0.25 + rnd() * 0.4, { capW: 18, capH: 22, scale: false, capFill: 'url(#faderCapBlack)' });
      key(x0 + 40, 892, 34, 11, 'amber', false, 'FLIP', 5.6);
      key(x0 + 40, 908, 34, 11, 'white', false, 'M.SOLO', 5.2);
      key(x0 + 40, 924, 34, 11, 'red', false, 'M.CUT', 5.4);
      key(x0 + 40, 940, 16, 11, 'white', false, 'G', 5.6); key(x0 + 58, 940, 16, 11, 'white', i < 24, 'T', 5.6);
      sk(x0 + 57, 966, 7, '#8a8f97', ang(), 'M.PAN', 980);
      // ---- channel pan, solo, cut, record status
      sect(x0 + 4, 988, SW - 8, '');
      sk(x0 + 24, 1012, 12, '#c9ccd1', -20 + rnd() * 40, 'PAN');
      key(x0 + 44, 1000, 30, 12, 'yellow', false, 'SOLO', 5.6);
      key(x0 + 44, 1016, 30, 12, 'red', i === 2, 'CUT', 5.6);
      const rdy = i >= 19 && i <= 21;
      key(x0 + 8, 1036, 20, 9, 'red', rdy, 'RDY', 4.8); key(x0 + 31, 1036, 20, 9, 'white', false, 'GRP', 4.8); key(x0 + 54, 1036, 20, 9, 'white', false, 'TAPE', 4.6);
      // ---- VCA group window, VCA fader and automation status keys (Off Read Write Touch Latch Trim)
      rect(x0 + 8, 1052, 30, 14, '#0b0b0c', 'rx="2"');
      text(x0 + 23, 1063, `G${1 + Math.floor(i / 4) % 8}`, 8.5, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`);
      const modes = [['O', 'grey'], ['R', 'green'], ['W', 'red'], ['T', 'amber'], ['L', 'blue'], ['Tr', 'yellow']];
      const m = i % 9 === 4 ? 2 : i % 7 === 3 ? 3 : 1;
      modes.forEach(([lab, col], k) => key(x0 + 62, 1084 + k * 18, 14, 14, col, k === m, lab, 6));
      fader(x0 + 32, 1084, 1376, 0.3 + rnd() * 0.25, { capW: 24, capH: 40, scaleColor: '#aeb2b9' });
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
