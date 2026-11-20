// SLS 4000 G console (the SLS studio's board), drawn as one SVG for the console area of the SLS room.
// Strip layout follows the SL 611G I/O module drawings in the SSL G Series operator's manual: routing matrix,
// group output, channel input, dynamics, filters, G Series EQ, cues, monitor input + small fader, quad pans,
// VCA fader with automation status (plus a black VU meter bridge across the top, as on the G+ photos). Strips 72 px. Sized for the app: 32 channels plus the SL 651G-style master section in 3242 x 1446.
// Routing: 24 groups + quad bus (the app's 24 multitrack buses, same engine as the CMI room); the real 611G has 32.

module.exports = function buildSLS(h, { tapeNames, tapeDb }) {
  const { p, rect, text, circle, button, fader, capture, vu } = h;
  const CW = 3242, CH = 1446, N = 32, SW = 72, GAP = 6;
  // split console: channels 1-16, the master section, channels 17-32
  const MX = 24 + 16 * SW + GAP, MW = CW - 18 - 24 - N * SW - 2 * GAP;
  const stripX = (i) => (i < 16 ? 24 + i * SW : MX + MW + GAP + (i - 16) * SW);
  const PANEL = '#a3a5a2', PANEL2 = '#6e716f', LINE = '#7d807e', INK = '#141516', INK2 = '#26282b';   // SSL grey panel, dark legends
  const names = [...tapeNames, '224 L', '224 R', 'SPX L', 'SPX R', 'PCM42 A', 'PCM42 B', 'LIVE 1', 'TALK'];
  let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  // SSL knob: dark grey knurled body, coloured cap insert on top, white pointer line, scale dots round the panel.
  const sk = (cx, cy, r, col, ang = 0, lab = '', labY = null) => {
    if (r >= 6) for (let k = 0; k <= 10; k++) { const a = (-150 + k * 30 - 90) * Math.PI / 180; circle((cx + (r + 3.2) * Math.cos(a)).toFixed(1), (cy + (r + 3.2) * Math.sin(a)).toFixed(1), 0.6, '#2a2b2d'); }
    circle(cx + 0.7, cy + 1.6, r + 0.6, '#000', 'opacity="0.5"');
    circle(cx, cy, r, '#2f3134');
    p(`<circle cx="${cx}" cy="${cy}" r="${(r - 0.6).toFixed(1)}" fill="none" stroke="#56595d" stroke-width="1.2" stroke-dasharray="0.9 1.1"/>`);
    circle(cx, cy, r * 0.64, col);
    circle(cx, cy, r * 0.64, 'url(#capHiDark)');
    const a = (ang - 90) * Math.PI / 180;
    p(`<line x1="${cx}" y1="${cy}" x2="${(cx + r * 0.92 * Math.cos(a)).toFixed(1)}" y2="${(cy + r * 0.92 * Math.sin(a)).toFixed(1)}" stroke="#fff" stroke-width="${Math.max(1, r * 0.14).toFixed(1)}" stroke-linecap="round"/>`);
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
      // SL 611G I/O module, 72 px wide (38 mm module: 1.9 px per mm). Control placement follows the module drawings
      // in the G Series operator's manual (section 2) and the user's close-up photos.
      const x0 = stripX(i), cx = x0 + SW / 2, L = x0 + 19, R = x0 + SW - 19;
      rect(x0 + 1, 4, SW - 2, CH - 8, PANEL, 'rx="3"');
      rect(x0 + 1, 4, 1, CH - 8, '#fff', 'opacity="0.08"'); rect(x0 + SW - 2, 4, 1, CH - 8, '#000', 'opacity="0.18"');
      const led = (lx, ly, on, col = '#ff3b2f') => { circle(lx, ly, 1.9, '#000', 'opacity="0.4"'); circle(lx, ly, 1.6, on ? col : '#4a2a26', on ? 'filter="url(#glowSm)"' : ''); };
      const lab = (lx, ly, s, sz = 4.6, anchor = 'middle') => text(lx, ly, s, sz, INK2, anchor, 700);
      // tall section-routing key with its LED underneath (CH IN / CH OUT / MON style)
      const tall = (kx, ky, l1, l2, on) => { key(kx, ky, 16, 20, 'white', false, '', 4); lab(kx + 8, ky + 9, l1, 3.9); if (l2) lab(kx + 8, ky + 15, l2, 3.9); led(kx + 8, ky + 25, on); };
      // ---- routing matrix: round buttons with an LED above, 4 columns x 6 rows (24 groups), quad bus row, PAN pot + PAN key
      for (let b = 0; b < 24; b++) {
        const bx = x0 + 13 + (b % 4) * 15.5, by = 140 + Math.floor(b / 4) * 14.5, on = i < 24 && b === i;
        led(bx + 3.5, by - 5.5, on);
        circle(bx + 0.5, by + 1, 4.6, '#000', 'opacity="0.45"'); circle(bx, by, 4.6, '#d9d6cc'); circle(bx, by, 4.6, 'url(#capHiDark)');
        lab(bx - 6.5, by - 3.5, String(b + 1), 3.8, 'end');
      }
      ['LF', 'RF', 'LB', 'RB'].forEach((q, k) => { const bx = x0 + 13 + k * 15.5, on = i >= 24 && k < 2; led(bx + 3.5, 223.5, on, '#ffb02e'); circle(bx + 0.5, 230, 4.6, '#000', 'opacity="0.45"'); circle(bx, 229, 4.6, '#d9d6cc'); lab(bx, 241, q, 3.9); });
      sk(L, 256, 7, '#d9dbde', ang()); lab(L - 9, 270, 'ODD', 3.8); lab(L + 9, 270, 'EVEN', 3.8);
      key(R - 10, 250, 22, 12, 'white', i >= 24, 'PAN', 5);
      // ---- group output: TRIM (pull for solo isolate), FLOAT, DIRECT
      sect(x0 + 4, 276, SW - 8, '');
      sk(L, 294, 7, '#d9dbde', 140); lab(L, 309, 'TRIM');
      key(R - 12, 282, 26, 10, 'white', false, 'FLOAT', 4.6); key(R - 12, 296, 26, 10, 'white', false, 'DIRECT', 4.2);
      // ---- channel input: LINE trim (+ green LED), FLIP, SUB GP, phase
      sect(x0 + 4, 314, SW - 8, '');
      sk(L, 332, 7, '#d9dbde', ang()); lab(L, 347, 'LINE'); led(L + 10, 322, true, '#4fe07a');
      key(R - 12, 318, 26, 9, 'white', false, 'FLIP', 4.6); key(R - 12, 330, 26, 9, 'white', false, 'SUB GP', 4.1); key(R - 12, 342, 26, 9, 'white', false, 'Ø', 6);
      // ---- dynamics (drawing: RATIO left, LINK top right, THRESHOLD right, RELEASE left; gate THRESHOLD right, GATE key, RANGE left, RELEASE left; LED ladder; CH IN / CH OUT / MON)
      sect(x0 + 4, 354, SW - 8, 'DYNAMICS');
      sk(L, 376, 8, '#e9eaec', ang()); lab(L, 391, 'RATIO');
      key(R - 11, 364, 22, 9, 'white', false, 'LINK', 4.6);
      sk(R, 392, 8, '#e9eaec', ang()); lab(R, 407, 'THRESH');
      sk(L, 410, 8, '#e9eaec', ang()); lab(L, 425, 'RELEASE');
      rect(x0 + 6, 430, SW - 12, 1, LINE, 'opacity="0.7"');
      sk(R, 446, 8, '#1e1f22', ang()); lab(R, 461, 'THRESH');
      sk(L, 454, 8, '#1e1f22', ang()); lab(L, 469, 'RANGE');
      key(R - 11, 466, 22, 9, 'white', rnd() > 0.8, 'GATE', 4.6);
      sk(L, 488, 8, '#1e1f22', ang()); lab(L, 503, 'RELEASE');
      const gr = Math.floor(rnd() * 4), gg = Math.floor(rnd() * 3);
      ['20', '14', '10', '6', '3'].forEach((v, k) => { const ly = 482 + k * 6; led(R - 6, ly, 4 - k < gr, k < 2 ? '#ff3b2f' : '#ffd23a'); led(R + 6, ly, 4 - k < gg, '#4fe07a'); lab(R, ly + 1.5, v, 3.4); });
      tall(x0 + 8, 510, 'CH', 'IN', i % 5 === 0); tall(x0 + 28, 510, 'CH', 'OUT', false); tall(x0 + 48, 510, 'MON', '', false);
      // ---- filters (drawing: LPF top right in kHz, HPF left in Hz, SPLIT key right)
      sect(x0 + 4, 544, SW - 8, 'FILTERS');
      sk(R, 562, 7, '#c9ccd1', ang()); lab(R, 576, 'kHz');
      sk(L, 572, 7, '#c9ccd1', ang()); lab(L, 586, 'Hz');
      key(R - 12, 580, 24, 9, 'white', false, 'SPLIT', 4.4);
      // ---- G Series EQ (drawing order): HF gain L + x3 key R + HF freq R; HMF gain L, freq R, Q L; insert PRE / IN R;
      //      LMF gain L, freq R, Q L; LF freq R, gain L, ÷3 R; EQUALISER to CH / FLT DYN S-C / MON; OVERLOAD
      sect(x0 + 4, 596, SW - 8, '');
      sk(L, 612, 8, '#c8352a', ang()); lab(L, 627, 'HF');
      key(R - 10, 600, 20, 9, 'white', false, 'x3', 5.4);
      sk(R, 626, 7, '#c8352a', ang()); lab(R, 640, 'kHz');
      sk(L, 646, 8, '#3f9a58', ang()); lab(L, 661, 'HMF');
      sk(R, 664, 7, '#3f9a58', ang()); lab(R, 678, 'kHz');
      sk(L, 682, 6, '#3f9a58', ang()); lab(L, 695, 'Q');
      key(R - 11, 686, 22, 9, 'white', false, 'PRE', 4.6); key(R - 11, 698, 22, 9, 'white', false, 'IN', 4.8); lab(cx, 714, 'INSERT', 3.8);
      sk(L, 728, 8, '#3577c2', ang()); lab(L, 743, 'LMF');
      sk(R, 746, 7, '#3577c2', ang()); lab(R, 760, 'kHz');
      sk(L, 764, 6, '#3577c2', ang()); lab(L, 777, 'Q');
      sk(R, 782, 7, '#1e1f22', ang()); lab(R, 796, 'Hz');
      sk(L, 796, 8, '#1e1f22', ang()); lab(L, 811, 'LF');
      key(R - 10, 800, 20, 9, 'white', false, '÷3', 5.4);
      tall(x0 + 8, 816, 'CH', '', i % 3 !== 2); tall(x0 + 28, 816, 'FLT', 'DYN', false); tall(x0 + 48, 816, 'MON', '', false);
      led(cx - 8, 850, i === 19); lab(cx - 4, 852, 'OVERLOAD', 3.6, 'start');
      // ---- cues (drawing: stereo pan above stereo level; each send knob with PRE and SMALL FADER keys stacked to its right)
      sect(x0 + 4, 858, SW - 8, 'CUES');
      sk(L, 874, 6, '#e0b23a', ang()); lab(L - 9, 884, 'L', 3.8); lab(L + 9, 884, 'R', 3.8);
      const send = (ky, col, l) => { sk(L, ky, 7, col, ang()); lab(L - 13, ky - 6, l, 4.2, 'start'); key(R - 13, ky - 9, 28, 8, 'white', false, 'PRE', 4.2); key(R - 13, ky + 1, 28, 8, 'white', false, 'SM FDR', 3.8); };
      send(900, '#e0b23a', 'ST'); send(926, '#e9eaec', '1'); send(952, '#e9eaec', '2'); send(978, '#e9eaec', '3'); send(1004, '#e9eaec', '4');
      // ---- monitor input: READY GROUP, READY TAPE (square keys), RECORD (large red, track number)
      sect(x0 + 4, 1016, SW - 8, '');
      const rdy = i >= 19 && i <= 21;
      key(x0 + 7, 1020, 28, 16, 'white', false, '', 4); lab(x0 + 21, 1027, 'READY', 3.9); lab(x0 + 21, 1033, 'GROUP', 3.9);
      key(x0 + 37, 1020, 28, 16, 'white', i < 24 && !rdy, '', 4); lab(x0 + 51, 1027, 'READY', 3.9); lab(x0 + 51, 1033, 'TAPE', 3.9);
      key(x0 + 10, 1040, 52, 18, 'red', rdy, i < 24 ? String(i + 1) : 'REC', 8);
      // ---- small fader with INPUT / OUTPUT (+ LED), SOLO and CUT keys with LEDs, F/B pan + IN
      fader(x0 + 17, 1066, 1112, 0.3 + rnd() * 0.35, { capW: 15, capH: 18, scale: false, capFill: 'url(#faderCapWhite)' });
      led(x0 + 17, 1120, i >= 24, '#4fe07a');
      key(x0 + 32, 1062, 34, 8, 'white', false, 'INPUT', 4.2); key(x0 + 32, 1072, 34, 8, 'white', false, 'OUTPUT', 4); led(x0 + 29, 1071, false, '#4fe07a');
      key(x0 + 38, 1084, 28, 9, 'white', false, 'SOLO', 4.4); led(x0 + 34, 1088.5, false, '#ffd23a');
      key(x0 + 38, 1096, 28, 9, 'white', false, 'CUT', 4.6); led(x0 + 34, 1100.5, false);
      sk(x0 + 46, 1114, 5.5, '#d9dbde', 0); lab(x0 + 38, 1116, 'F', 3.8); lab(x0 + 54, 1116, 'B', 3.8); key(x0 + 58, 1108, 10, 8, 'white', false, 'IN', 3.6);
      // ---- large pan, SOLO and CUT at the foot of the module
      sk(L, 1136, 9, '#d9dbde', -20 + rnd() * 40); lab(L - 13, 1146, 'L', 4.2); lab(L + 13, 1146, 'R', 4.2);
      key(R - 12, 1124, 26, 11, 'white', false, 'SOLO', 4.8); key(R - 12, 1138, 26, 11, 'white', i === 2, 'CUT', 4.8);
      // ---- fader panel: VCA group window, automation status keys, VCA fader (100 mm = 190 px), scribble strip
      rect(x0 + 1, 1154, SW - 2, CH - 1158, '#cdcfcc'); rect(x0 + 1, 1154, SW - 2, 1.5, '#fff', 'opacity="0.5"');
      rect(x0 + 6, 1160, 26, 12, '#0b0b0c', 'rx="2"');
      text(x0 + 19, 1169.5, `G${1 + Math.floor(i / 4) % 8}`, 7.5, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`);
      const modes = [['O', 'grey'], ['R', 'green'], ['W', 'red'], ['T', 'amber'], ['L', 'blue'], ['Tr', 'yellow']];
      const m = i % 9 === 4 ? 2 : i % 7 === 3 ? 3 : 1;
      modes.forEach(([lb, col], k) => key(x0 + SW - 17, 1186 + k * 16, 12, 12, col, k === m, lb, 5.4));
      fader(x0 + 28, 1186, 1376, 0.3 + rnd() * 0.25, { capW: 22, capH: 34, scaleColor: '#2a2b2d', capFill: 'url(#faderCapWhite)' });
      rect(x0 + 4, 1394, SW - 8, 22, '#f2eee2', 'rx="2"');
      text(cx, 1409.5, names[i], 8.5, '#1c2a6e', 'middle', 700, `font-family="'Permanent Marker', 'Comic Neue', sans-serif"`);
      text(cx, 1432, String(i + 1), 8.5, INK2, 'middle', 800);
    }

    // =================== VU meter bridge across the top (black, two rows, one meter per channel: odd top, even bottom) ===================
    for (const [a0, a1] of [[0, 15], [16, 31]]) {
      const bx = stripX(a0), bw = stripX(a1) + SW - bx;
      rect(bx, 4, bw, 116, '#16171a', 'rx="3"'); rect(bx, 4, bw, 2, '#fff', 'opacity="0.08"');
      for (let i = a0; i <= a1; i += 2) {
        for (const [k, ch] of [[0, i], [1, i + 1]]) {
          const mx = stripX(i) + 9, my = 12 + k * 54, db = ch < 24 ? tapeDb[ch] : -18 + rnd() * 8;
          vu(mx, my, 2 * SW - 18, 36, db, { brand: '' });
          text(mx + SW - 9, my + 47, String(ch + 1), 8, '#d9d6cc', 'middle', 700);
        }
      }
    }

    // =================== centre section: master facilities (left) + Studio Computer (right) ===================
    // From the user's photo of a 4000 G centre section and the operator's manual (section 4).
    const x = MX, w = MW, LW = 250, RX = x + LW + 8, RW = w - LW - 8;
    rect(x, 4, w, CH - 8, PANEL2, 'rx="4"');
    // ---------- left column: master facilities ----------
    rect(x, 4, LW, CH - 8, PANEL, 'rx="4"'); const lc = x + LW / 2;
    // meter bridge over the master facilities: main L / R VU meters and the bus compression meter
    rect(x, 4, LW, 104, '#16171a', 'rx="3"');
    [['MAIN L', -4], ['MAIN R', -5]].forEach(([l, db], k) => { vu(x + 10 + k * 76, 14, 68, 56, db, { brand: '' }); text(x + 44 + k * 76, 88, l, 7.5, '#d9d6cc', 'middle', 800); });
    rect(x + 164, 14, 66, 56, '#efe6cc', 'rx="3"');
    { const gx = x + 197, gy = 78; for (let k = 0; k <= 8; k++) { const a = (-45 + k * 11.25) * Math.PI / 180; p(`<line x1="${(gx + 40 * Math.sin(a)).toFixed(1)}" y1="${(gy - 40 * Math.cos(a)).toFixed(1)}" x2="${(gx + 46 * Math.sin(a)).toFixed(1)}" y2="${(gy - 46 * Math.cos(a)).toFixed(1)}" stroke="#2a2520" stroke-width="1.1"/>`); }
      p(`<line x1="${gx}" y1="76" x2="${gx + 16}" y2="38" stroke="#b3261b" stroke-width="1.6"/>`); }
    text(x + 197, 88, 'COMP', 7.5, '#d9d6cc', 'middle', 800);
    text(x + 120, 102, 'SLS 4000 G', 7, '#c9a54a', 'middle', 900, 'letter-spacing="3"');
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
    rect(x + 1, 1154, LW - 2, CH - 1158, '#cdcfcc');
    sect(x + 6, 1100, LW - 12, 'GROUP MASTERS');
    const gw = (LW - 20) / 8;
    for (let g = 0; g < 8; g++) {
      const gx = x + 10 + g * gw + gw / 2;
      key(gx - 11, 1118, 22, 14, 'red', g === 5, 'M', 7);
      key(gx - 11, 1136, 22, 14, 'green', g === 1, 'S', 7);
      fader(gx, 1186, 1376, 0.3 + (g % 3) * 0.05, { capW: 22, capH: 38, scale: false, capFill: ['url(#faderCapYellow)', 'url(#faderCapGreen)', 'url(#faderCapWhite)', 'url(#faderCapBlack)'][g % 4] });
      text(gx, 1404, `G${g + 1}`, 9, INK, 'middle', 800);
    }
    // ---------- right column: Studio Computer (layout from the user's G+ photos) ----------
    rect(RX, 4, RW, CH - 8, PANEL, 'rx="4"');
    const SCW = 330, sx0 = RX + 10;
    rect(sx0, 12, SCW, 24, '#d6d7d4', 'rx="2"');
    text(sx0 + 8, 28, 'SLS', 10, '#2a2b2d', 'start', 900, 'font-style="italic"'); text(sx0 + SCW - 8, 28, 'Studio Computer', 10, '#2a2b2d', 'end', 700);
    // screen: cyan on black, live timecode
    rect(sx0, 40, SCW, 250, '#3a3c3f', 'rx="6"');
    rect(sx0 + 12, 50, SCW - 24, 230, '#05070a', 'rx="10"');
    const scx = sx0 + SCW / 2;
    p(`<text id="sls-tc" x="${scx}" y="96" font-family="'JetBrains Mono', monospace" font-size="22" font-weight="700" fill="#38e6e6" text-anchor="middle" letter-spacing="2">01:00:03:42:00</text>`);
    text(scx, 152, 'SLS', 32, '#38e6e6', 'middle', 800, 'font-style="italic"');
    text(scx, 178, 'Studio Computer', 14, '#38e6e6', 'middle', 600);
    p(`<text id="sls-cmd" x="${sx0 + 24}" y="258" font-family="'JetBrains Mono', monospace" font-size="11" fill="#2fc4c4">MIX · TITLE "MIDNIGHT TAPES" · PASS 4</text>`);
    // beside the screen: computer status keys and the round black machine keys
    const px0 = sx0 + SCW + 12, PW2 = RX + RW - 10 - px0;
    sect(px0, 14, PW2, 'COMPUTER STATUS');
    ['MIX ON', 'MOTOR', 'SEARCH', 'TAPE TRACK', 'REC SYNC', 'GROUP'].forEach((l, k) => key(px0 + (k % 2) * (PW2 / 2) + 4, 28 + Math.floor(k / 2) * 28, PW2 / 2 - 8, 22, 'white', k === 0, l, 6.5));
    sect(px0, 116, PW2, 'MACHINE');
    for (const [cx0, cy0] of [[px0 + PW2 * 0.3, 176], [px0 + PW2 * 0.72, 176], [px0 + PW2 * 0.3, 248], [px0 + PW2 * 0.72, 248]]) {
      for (const [dx, dy] of [[0, -18], [-18, 0], [18, 0], [0, 18], [0, 0]]) { circle(cx0 + dx + 0.6, cy0 + dy + 1.4, 9.5, '#000', 'opacity="0.5"'); circle(cx0 + dx, cy0 + dy, 9.5, '#1b1c1e'); circle(cx0 + dx, cy0 + dy, 9.5, 'url(#capHiDark)'); }
    }
    // function keypad (cream) beside a numeric keypad
    const keycap = (bx, by, bw, bh, l, size) => { rect(bx + 1, by + 3, bw, bh, '#000', 'opacity="0.45" rx="3"'); rect(bx, by, bw, bh, '#d8d1b6', 'rx="3"'); rect(bx, by, bw, bh * 0.35, '#fff', 'opacity="0.25" rx="3"'); if (l) text(bx + bw / 2, by + bh / 2 + size * 0.35, l, size, '#2a2620', 'middle', 800); };
    const fk = [['PRINT', 'JOIN', 'NAME', 'REVISE', 'COPY', 'CANCEL'], ['LIST', 'GO TO', 'PLAY', 'CYCLE', 'DELETE', 'REPEAT'], ['TITLE', 'MIX', 'CUE', 'EVENT', 'DROP IN', '←'], ['SET UP', 'PRESET', 'REEL', 'TRACK', 'SYNC', '↑'], ['END', 'FROM', 'HERE', 'TO', 'AT', 'EXECUTE']];
    const FW2 = Math.round((RW - 30) * 0.62), NX = RX + 10 + FW2 + 10, NW = RX + RW - 10 - NX;
    rect(RX + 10, 300, FW2, 186, '#7a7d7b', 'rx="6"');
    fk.forEach((row, r) => row.forEach((l, c) => { const kw = (FW2 - 16) / 6; keycap(RX + 18 + c * kw, 308 + r * 35, kw - 6, 28, l, l.length > 5 ? 6.5 : 7.5); }));
    rect(NX, 300, NW, 186, '#7a7d7b', 'rx="6"');
    [['7', '8', '9', '–'], ['4', '5', '6', '+'], ['1', '2', '3', '.'], ['0', '00', ':', 'ENTER']].forEach((row, r) => row.forEach((l, c) => { const kw = (NW - 16) / 4; keycap(NX + 8 + c * kw, 308 + r * 44, kw - 6, 36, l, l.length > 2 ? 6.5 : 11); }));
    // alphanumeric keyboard
    const kb = ['!"#$%&*()-+=', '1234567890-=', 'QWERTYUIOP[]', 'ASDFGHJKL;\'', 'ZXCVBNM,./'];
    rect(RX + 10, 496, RW - 20, 220, '#7a7d7b', 'rx="6"');
    kb.forEach((row, r) => [...row].forEach((ch, c) => { const kx = (RW - 40) / 12, bx = RX + 20 + c * kx + r * 8; if (bx + kx > RX + RW - 14) return; keycap(bx, 504 + r * 40, kx - 6, 32, ch, 11); }));
    keycap(RX + 20 + 2 * ((RW - 40) / 12), 504 + 5 * 40 - 14, (RW - 40) / 12 * 7, 0, '', 8);
    // multitrack remote, automation, main fader
    sect(RX + 6, 726, RW - 12, 'MULTITRACK REMOTE');
    [['◀◀', 'white'], ['▶▶', 'white'], ['■', 'green'], ['PLAY', 'white'], ['REC', 'red']].forEach(([l, c], k) => key(RX + 14 + k * ((RW - 28) / 5), 740, (RW - 28) / 5 - 10, 30, c, k === 2, l, l.length > 2 ? 8 : 12));
    sect(RX + 6, 782, RW - 12, 'AUTOMATION');
    [['OFF', 'grey'], ['READ', 'green'], ['WRITE', 'red'], ['TOUCH', 'amber'], ['LATCH', 'blue'], ['TRIM', 'yellow']].forEach(([l, c], k) => key(RX + 12 + k * ((RW - 24) / 6), 796, (RW - 24) / 6 - 8, 22, c, k === 1, l, 7.5));
    ['MASTER CUT', 'MONO CHECK', 'FADER START', 'ALL SAFE'].forEach((l, k) => key(RX + 12 + k * ((RW - 24) / 4), 830, (RW - 24) / 4 - 8, 22, k ? 'white' : 'red', false, l, 7));
    rect(RX + 1, 1154, RW - 2, CH - 1158, '#cdcfcc');
    sect(RX + 6, 1158, RW - 12, 'MAIN');
    const mfx = RX + RW / 2;
    fader(mfx, 1186, 1376, 0.22, { capW: 34, capH: 48, scaleColor: '#2a2b2d', capFill: 'url(#faderCapRed)' });
    text(mfx, 1402, 'STEREO', 9, INK, 'middle', 800);
    rect(RX + 14, 1200, 120, 60, '#0b0b0c', 'rx="3"');
    text(RX + 74, 1226, 'MIX', 9, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`); text(RX + 74, 1244, 'PASS 4', 9, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`);
    rect(x + 6, 1414, w - 12, 22, '#2a2b2d', 'rx="3"');
    text(x + w / 2, 1429, 'SLS 4000 G · 32 CHANNEL MASTER STUDIO SYSTEM', 9, '#d9d3c7', 'middle', 800, 'letter-spacing="2"');
    p('</svg>');
  });
};
