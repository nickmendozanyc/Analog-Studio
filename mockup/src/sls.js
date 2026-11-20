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
  const PANEL = '#a3a5a2', PANEL2 = '#6e716f', LINE = '#7d807e', INK = '#141516', INK2 = '#26282b';   // SSL grey panel, dark legends
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
  const sect = (x, y, w, lab) => { rect(x, y, w, 1, LINE); if (lab) text(x + w / 2, y + 9, lab, 6.2, '#3a3c40', 'middle', 800, 'letter-spacing="1.2"'); };
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
      text(x0 + 14, 20, String(i + 1), 8.5, '#e9eaec', 'start', 800);
      const lvl = i < 24 ? 0.35 + rnd() * 0.5 : 0.2 + rnd() * 0.3;
      // meter scale (dB) and a 28-segment bar: room freed by the 24-group matrix
      [['+10', 27], ['0', 22], ['-10', 17], ['-20', 12], ['-40', 4]].forEach(([l, s]) => text(cx - 1, 93 - s * 2.95 + 2, l, 5, '#9aa0a8', 'end', 700));
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
      key(x0 + 10, 628, 28, 9, 'white', false, 'PRE', 5); key(x0 + 44, 628, 28, 9, 'white', false, 'IN', 5.4); text(cx, 645, 'INSERT', 4.8, '#3a3c40', 'middle', 800, 'letter-spacing="0.8"');
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
      text(x0 + 6, 900, 'PRE / SMALL FADER', 4.4, '#3a3c40', 'start', 700);
      // ---- monitor input: READY GROUP, READY TAPE, RECORD (track number)
      sect(x0 + 4, 904, SW - 8, '');
      const rdy = i >= 19 && i <= 21;
      key(x0 + 8, 910, 32, 13, 'white', false, 'R.GRP', 5); key(x0 + 42, 910, 32, 13, 'white', rdy || i < 24, 'R.TAPE', 4.8);
      key(x0 + 12, 928, 58, 18, 'red', rdy, i < 24 ? `REC ${i + 1}` : 'RECORD', 6.5);
      // ---- small fader with INPUT / OUTPUT, SOLO and CUT
      fader(x0 + 22, 956, 1058, 0.25 + rnd() * 0.4, { capW: 18, capH: 22, scale: false, capFill: 'url(#faderCapBlack)' });
      p('<g transform="translate(0 28)">');   // everything below the small fader moves down with it
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
      p('</g>');
      // VCA fader: 100 mm travel at the module's scale (38 mm wide = 82 px, so 100 mm = 216 px)
      const modes = [['O', 'grey'], ['R', 'green'], ['W', 'red'], ['T', 'amber'], ['L', 'blue'], ['Tr', 'yellow']];
      const m = i % 9 === 4 ? 2 : i % 7 === 3 ? 3 : 1;
      modes.forEach(([lab, col], k) => key(x0 + 62, 1164 + k * 17, 14, 13, col, k === m, lab, 6));
      fader(x0 + 32, 1164, 1380, 0.3 + rnd() * 0.25, { capW: 24, capH: 38, scaleColor: '#2a2b2d' });
      // ---- scribble strip
      rect(x0 + 5, 1396, SW - 10, 22, '#e9e4d6', 'rx="2"');
      text(cx, 1411.5, names[i], 9.5, '#1c2a6e', 'middle', 700, `font-family="'Permanent Marker', 'Comic Neue', sans-serif"`);
      text(cx, 1434, String(i + 1), 9, INK2, 'middle', 800);
    }

    // =================== centre section: master facilities (left) + Studio Computer (right) ===================
    // From the user's photo of a 4000 G centre section and the operator's manual (section 4).
    const x = MX, w = MW, LW = 240, RX = x + LW + 8, RW = w - LW - 8;
    rect(x, 4, w, CH - 8, PANEL2, 'rx="4"');
    // ---------- left column: master facilities ----------
    rect(x, 4, LW, CH - 8, PANEL, 'rx="4"'); const lc = x + LW / 2;
    // stereo bargraph + compressor meter
    rect(x + 10, 10, LW - 20, 96, '#0b0b0c', 'rx="3"');
    for (const [k, lab] of [[0, 'L'], [1, 'R']]) {
      const mx = x + 20 + k * 26;
      for (let s = 0; s < 26; s++) rect(mx, 96 - s * 3.2, 18, 2.2, s >= 23 ? '#ff3b2f' : s >= 19 ? '#ffd23a' : '#4fe07a', s < 19 - k ? '' : 'opacity="0.13"');
      text(mx + 9, 104, lab, 6.5, '#aeb2b9', 'middle', 800);
    }
    rect(x + 80, 18, LW - 100, 80, '#efe6cc', 'rx="3"');
    { const gx = x + 80 + (LW - 100) / 2, gy = 108; for (let k = 0; k <= 10; k++) { const a = (-50 + k * 10) * Math.PI / 180; p(`<line x1="${(gx + 60 * Math.sin(a)).toFixed(1)}" y1="${(gy - 60 * Math.cos(a)).toFixed(1)}" x2="${(gx + 68 * Math.sin(a)).toFixed(1)}" y2="${(gy - 68 * Math.cos(a)).toFixed(1)}" stroke="#2a2520" stroke-width="1.3"/>`); }
      text(gx, 64, 'COMPRESSION', 7.5, '#2a2520', 'middle', 800, 'letter-spacing="1"'); p(`<line x1="${gx}" y1="106" x2="${gx + 26}" y2="44" stroke="#b3261b" stroke-width="1.8"/>`); }
    // quad / stereo bus compressor
    sect(x + 6, 114, LW - 12, 'BUS COMPRESSOR');
    [['THRESH', '#e6e7e9', -30], ['RATIO', '#e6e7e9', -60], ['ATTACK', '#e6e7e9', -40], ['RELEASE', '#e6e7e9', 60]].forEach(([lab, col, a], k) => sk(x + 32 + k * 58, 144, 13, col, a, lab, 166));
    sk(x + 32, 190, 13, '#c8352a', 20, 'MAKE-UP', 212); key(x + 64, 180, 52, 18, 'red', true, 'IN', 7.5); key(x + 122, 180, 52, 18, 'white', false, 'S/C', 7.5);
    text(x + LW - 14, 196, 'SLS', 15, INK, 'end', 900, 'font-style="italic" letter-spacing="2"');
    // status: RECORD / REPLAY / MIX, VCAs to monitor, input flip
    sect(x + 6, 222, LW - 12, 'STATUS');
    [['RECORD', 'red', false], ['REPLAY', 'white', false], ['MIX', 'green', true]].forEach(([l, c, on], k) => key(x + 12 + k * 74, 236, 68, 22, c, on, l, 8));
    [['VCA→MON', false], ['CH FLIP', false], ['AFL', false]].forEach(([l, on], k) => key(x + 12 + k * 74, 264, 68, 16, 'white', on, l, 6.5));
    // cue masters + echo returns
    sect(x + 6, 290, LW - 12, 'CUES · RETURNS');
    ['ST', '1', '2', '3', '4'].forEach((l, k) => sk(x + 26 + k * 47, 316, 11, k ? '#d9dbde' : '#e0b23a', -20 + k * 12, `CUE ${l}`, 336));
    ['RTN 1', 'RTN 2', 'RTN 3', 'RTN 4'].forEach((l, k) => sk(x + 36 + k * 56, 360, 10, '#8a8f97', 10 * k, l, 378));
    // monitoring: speakers, sources, big monitor level, dim / mono / cut
    sect(x + 6, 388, LW - 12, 'MONITORS');
    ['LARGE', 'SMALL', 'MINI'].forEach((l, k) => key(x + 12, 400 + k * 24, 58, 19, 'amber', k === 0, l, 7));
    ['MIX', '2TR A', '2TR B'].forEach((l, k) => key(x + LW - 70, 400 + k * 24, 58, 19, 'white', k === 0, l, 7));
    sk(lc, 448, 34, '#d9dbde', 40, 'MONITOR LEVEL', 496);
    ['DIM', 'MONO', 'CUT', 'ALT'].forEach((l, k) => key(x + 12 + k * 56, 504, 50, 18, k === 2 ? 'red' : 'white', false, l, 7));
    // communications: talkback, slate, oscillator
    sect(x + 6, 530, LW - 12, 'COMMUNICATIONS');
    key(x + 12, 542, 74, 26, 'red', false, 'TALK', 9); key(x + 92, 542, 60, 26, 'white', false, 'SLATE', 7.5); sk(x + 186, 555, 10, '#8a8f97', 0, 'TB', 574);
    ['100', '1k', '10k'].forEach((l, k) => key(x + 12 + k * 44, 584, 40, 18, 'green', k === 1, l, 7)); sk(x + 186, 593, 10, '#8a8f97', -30, 'OSC', 612);
    // group (VCA) masters: 8 faders with M / S
    // local (split) aux sends panel, as in the G Series centre section
    sect(x + 6, 622, LW - 12, 'LOCAL AUX SENDS');
    ['ST', '1', '2', '3', '4', '5'].forEach((l, k) => { const kx = x + 30 + (k % 3) * 90, ky = 664 + Math.floor(k / 3) * 120; sk(kx, ky, 15, k ? '#d9dbde' : '#e0b23a', -30 + k * 14, `AUX ${l}`, ky + 28); key(kx - 20, ky + 40, 40, 16, 'white', k === 1, 'SPLIT', 6.5); });
    [['FOLDBACK A', false], ['FOLDBACK B', false], ['AUX TO CUE', true]].forEach(([l, on], k) => key(x + 12 + k * 74, 920, 68, 20, 'white', on, l, 6));
    ['CUE 1', 'CUE 2', 'STUDIO'].forEach((l, k) => sk(x + 46 + k * 74, 980, 13, '#8a8f97', 10 - k * 20, l, 1002));
    ['PHONES A', 'PHONES B'].forEach((l, k) => key(x + 12 + k * 110, 1022, 104, 20, 'amber', false, l, 7));
    sect(x + 6, 1100, LW - 12, 'GROUP MASTERS');
    const gw = (LW - 20) / 8;
    for (let g = 0; g < 8; g++) {
      const gx = x + 10 + g * gw + gw / 2;
      key(gx - 11, 1118, 22, 14, 'red', g === 5, 'M', 7);
      key(gx - 11, 1136, 22, 14, 'green', g === 1, 'S', 7);
      fader(gx, 1164, 1380, 0.3 + (g % 3) * 0.05, { capW: 22, capH: 38, scale: false, capFill: ['url(#faderCapYellow)', 'url(#faderCapGreen)', 'url(#faderCapWhite)', 'url(#faderCapBlack)'][g % 4] });
      text(gx, 1404, `G${g + 1}`, 9, INK, 'middle', 800);
    }
    // ---------- right column: Studio Computer ----------
    rect(RX, 4, RW, CH - 8, PANEL, 'rx="4"'); const rc = RX + RW / 2;
    rect(RX + 10, 12, RW - 20, 24, '#d6d7d4', 'rx="2"');
    text(RX + 18, 28, 'SLS', 10, '#2a2b2d', 'start', 900, 'font-style="italic"'); text(RX + RW - 18, 28, 'Studio Computer', 10, '#2a2b2d', 'end', 700);
    // CRT: cyan on black, live timecode
    rect(RX + 10, 40, RW - 20, 250, '#3a3c3f', 'rx="6"');
    rect(RX + 22, 50, RW - 44, 230, '#05070a', 'rx="10"');
    p(`<text id="sls-tc" x="${rc}" y="96" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="700" fill="#38e6e6" text-anchor="middle" letter-spacing="2">01:00:03:42:00</text>`);
    text(rc, 150, 'SLS', 30, '#38e6e6', 'middle', 800, 'font-style="italic"');
    text(rc, 176, 'Studio Computer', 14, '#38e6e6', 'middle', 600);
    p(`<text id="sls-cmd" x="${RX + 34}" y="258" font-family="'JetBrains Mono', monospace" font-size="11" fill="#2fc4c4">MIX · TITLE "MIDNIGHT TAPES" · PASS 4</text>`);
    rect(RX + 22, 50, RW - 44, 60, '#fff', 'opacity="0.03" rx="10"');
    // computer status keys
    sect(RX + 6, 298, RW - 12, 'COMPUTER STATUS');
    ['MIX ON', 'MOTOR', 'SEARCH', 'TAPE TRACK', 'REC SYNC'].forEach((l, k) => key(RX + 12 + k * ((RW - 24) / 5), 312, (RW - 24) / 5 - 6, 22, 'white', k === 0, l, 6));
    // function keypad (black keys)
    const fk = [['PRINT', 'JOIN', 'NAME', 'REVISE', 'COPY', 'CANCEL'], ['LIST', 'GO TO', 'PLAY', 'CYCLE', 'DELETE', 'REPEAT'], ['TITLE', 'MIX', 'CUE', 'EVENT', 'DROP IN', '←'], ['SET UP', 'PRESET', 'REEL', 'TRACK', 'SYNC', '↑'], ['END', 'FROM', 'HERE', 'TO', 'AT', 'EXECUTE']];
    rect(RX + 10, 344, RW - 20, 186, '#55585c', 'rx="6"');
    const kw = (RW - 40) / 6;
    fk.forEach((row, r) => row.forEach((l, c) => {
      const bx = RX + 20 + c * kw, by = 352 + r * 35;
      rect(bx + 1, by + 3, kw - 6, 28, '#000', 'opacity="0.5" rx="3"'); rect(bx, by, kw - 6, 28, '#17181a', 'rx="3"'); rect(bx, by, kw - 6, 10, '#fff', 'opacity="0.07" rx="3"');
      text(bx + (kw - 6) / 2, by + 18, l, l.length > 5 ? 6.5 : 7.5, '#e6e7e9', 'middle', 800);
    }));
    // alphanumeric keyboard
    const kb = ['!"#$%&*()-+', '1234567890', 'QWERTYUIOP', 'ASDFGHJKL;', 'ZXCVBNM,./'];
    rect(RX + 10, 540, RW - 20, 196, '#55585c', 'rx="6"');
    kb.forEach((row, r) => [...row].slice(0, 10).forEach((ch, c) => {
      const kx = (RW - 40) / 10, bx = RX + 20 + c * kx + (r === 3 ? 6 : r === 4 ? 12 : 0), by = 548 + r * 37;
      if (bx + kx - 4 > RX + RW - 12) return;
      rect(bx + 1, by + 3, kx - 5, 30, '#000', 'opacity="0.5" rx="3"'); rect(bx, by, kx - 5, 30, '#17181a', 'rx="3"'); rect(bx, by, kx - 5, 10, '#fff', 'opacity="0.07" rx="3"');
      text(bx + (kx - 5) / 2, by + 20, ch, 10, '#e6e7e9', 'middle', 700);
    }));
    // transport keys under the keyboard
    sect(RX + 6, 744, RW - 12, 'MULTITRACK REMOTE');
    [['◀◀', 'white'], ['▶▶', 'white'], ['■', 'green'], ['PLAY', 'white'], ['REC', 'red']].forEach(([l, c], k) => key(RX + 14 + k * ((RW - 28) / 5), 758, (RW - 28) / 5 - 8, 30, c, k === 2, l, l.length > 2 ? 8 : 12));
    // automation modes and the main mix fader
    sect(RX + 6, 800, RW - 12, 'AUTOMATION');
    [['OFF', 'grey'], ['READ', 'green'], ['WRITE', 'red'], ['TOUCH', 'amber'], ['LATCH', 'blue'], ['TRIM', 'yellow']].forEach(([l, c], k) => key(RX + 12 + (k % 3) * ((RW - 24) / 3), 814 + Math.floor(k / 3) * 26, (RW - 24) / 3 - 8, 20, c, k === 1, l, 7.5));
    sect(RX + 6, 872, RW - 12, 'MAIN');
    const mfx = RX + RW - 60;
    fader(mfx, 1164, 1380, 0.22, { capW: 34, capH: 48, scaleColor: '#2a2b2d', capFill: 'url(#faderCapRed)' });
    text(mfx, 1404, 'STEREO', 9, INK, 'middle', 800);
    ['MASTER CUT', 'MONO CHECK', 'FADER START'].forEach((l, k) => key(RX + 18, 910 + k * 34, 110, 24, k ? 'white' : 'red', false, l, 7));
    rect(RX + 18, 1020, 110, 60, '#0b0b0c', 'rx="3"');
    text(RX + 73, 1046, 'MIX', 9, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`); text(RX + 73, 1064, 'PASS 4', 9, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`);
    rect(x + 6, 1414, w - 12, 22, '#2a2b2d', 'rx="3"');
    text(x + w / 2, 1429, 'SLS 4000 G · 32 CHANNEL MASTER STUDIO SYSTEM', 9, '#d9d3c7', 'middle', 800, 'letter-spacing="2"');
    p('</svg>');
  });
};
