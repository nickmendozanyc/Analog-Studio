// SLS 4000 G console (the SLS studio's board), drawn as one SVG for the console area of the SLS room.
// Strip layout follows the SL 611G I/O module drawings in the SSL G Series operator's manual: routing matrix,
// group output, channel input, dynamics, filters, G Series EQ, cues, monitor input + small fader, quad pans,
// VCA fader with automation status (plus a black VU meter bridge across the top, as on the G+ photos). Strips 72 px. Sized for the app: 32 channels plus the SL 651G-style master section in 3242 x 1446.
// Routing: 24 groups + quad bus (the app's 24 multitrack buses, same engine as the CMI room); the real 611G has 32.

module.exports = function buildSLS(h, { tapeNames, tapeDb }) {
  const { p, rect, text, circle, button, fader, capture, vu, remote224 } = h;
  const CW = 3242, CH = 1446, N = 32, SW = 72, GAP = 6;
  // split console: channels 1-16, the master section, channels 17-32
  const MX = 24 + 16 * SW + GAP, MW = CW - 18 - 24 - N * SW - 2 * GAP;
  const stripX = (i) => (i < 16 ? 24 + i * SW : MX + MW + GAP + (i - 16) * SW);
  // SSL G-Series greys (RAL): module panels RAL 7042 Traffic Grey A, frame RAL 7037 Dusty Grey, light panels RAL 7040 Window Grey
  const RAL7042 = '#8f9695', RAL7037 = '#7d7f7d', RAL7040 = '#9da1aa';
  const PANEL = RAL7042, PANEL2 = RAL7037, LINE = '#6f7574', INK = '#111213', INK2 = '#1e2022';
  const names = [...tapeNames, '224 L', '224 R', 'SPX L', 'SPX R', 'PCM42 A', 'PCM42 B', 'LIVE 1', 'TALK'];
  let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  // SSL knob: white knurled body, coloured cap insert on top (E-channel colour code), white pointer line down the body.
  // Cap colours: light grey for filters / compressor / utility, red HF, green HMF + expander/gate, blue LMF, black LF.
  const KCOL = { '#e9eaec': '#d9d9d4', '#d9dbde': '#d9d9d4', '#c9ccd1': '#d9d9d4', '#c8352a': '#c8262b', '#3f9a58': '#1d8a55', '#3577c2': '#2a8fc2', '#1e1f22': '#2c2d31', '#8a8f97': '#d9d9d4', '#e0b23a': '#e2b43a' };
  const sk = (cx, cy, r0, col0, ang = 0, lab = '', labY = null) => {
    const r = r0 * KS, col = KCOL[col0] || col0, light = col === '#d9d9d4' || col === '#e2b43a';
    if (r >= 6) for (let k = 0; k <= 10; k++) { const a = (-150 + k * 30 - 90) * Math.PI / 180; circle((cx + (r + 3.4) * Math.cos(a)).toFixed(1), (cy + (r + 3.4) * Math.sin(a)).toFixed(1), 0.65, '#1e2022'); }
    circle(cx + 1.3, cy + 2, r * 1.02, '#000', 'opacity="0.45"');                     // cast shadow
    circle(cx, cy, r, '#efefea');                                                      // white body
    p(`<circle cx="${cx}" cy="${cy}" r="${(r - 0.7).toFixed(1)}" fill="none" stroke="#b9bab4" stroke-width="1.3" stroke-dasharray="0.9 1.1"/>`);   // knurling
    p(`<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="url(#capHiDark)" opacity="0.35"/>`);
    circle(cx, cy, r * 0.6, col === '#d9d9d4' ? '#bdbdb6' : col);                                                      // coloured cap
    circle(cx - r * 0.16, cy - r * 0.2, r * 0.22, '#fff', 'opacity="0.25"');          // gloss
    const a = (ang - 90) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    p(`<line x1="${(cx + r * 0.6 * ca).toFixed(1)}" y1="${(cy + r * 0.6 * sa).toFixed(1)}" x2="${(cx + r * 0.94 * ca).toFixed(1)}" y2="${(cy + r * 0.94 * sa).toFixed(1)}" stroke="#141416" stroke-width="${Math.max(1, r * 0.15).toFixed(1)}" stroke-linecap="round"/>`);
    p(`<line x1="${cx}" y1="${cy}" x2="${(cx + r * 0.56 * ca).toFixed(1)}" y2="${(cy + r * 0.56 * sa).toFixed(1)}" stroke="${light ? '#141416' : '#ffffff'}" stroke-width="${Math.max(1, r * 0.13).toFixed(1)}" stroke-linecap="round"/>`);
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

    KS = 1.4;
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
      p('<g transform="translate(0 178) scale(1 0.944) translate(0 -120)">');   // module controls sit below the taller meter bridge
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
      sk(R, 446, 8, '#3f9a58', ang()); lab(R, 461, 'THRESH');
      sk(L, 454, 8, '#3f9a58', ang()); lab(L, 469, 'RANGE');
      key(R - 11, 466, 22, 9, 'white', rnd() > 0.8, 'GATE', 4.6);
      sk(L, 488, 8, '#3f9a58', ang()); lab(L, 503, 'RELEASE');
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
      p('</g>');
      // ---- fader panel: VCA group window, automation status keys, VCA fader (100 mm = 190 px), scribble strip
      rect(x0 + 1, 1154, SW - 2, CH - 1158, RAL7040); rect(x0 + 1, 1154, SW - 2, 1.5, '#fff', 'opacity="0.5"');
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

    KS = 1;
    // =================== VU meter bridge: SSL VU modules (black panel, 8 meters = 4 across x 2 rows, screws between rows) ===================
    // Meter face as on the user's SSL VU module photo: wide cream face, dB scale over the arc with a thick red 0..+3 band,
    // 0-100 % scale under it, "VU" in the corners. Needle angle follows a real VU (linear in voltage).
    let svuN = 0;
    const sslVu = (vx, vy, vw, vh, db, num) => {
      const id = `svu${svuN++}`, cx = vx + vw / 2, cy = vy + vh * 2.25, R = vh * 1.95;
      const ang = (d) => { const pct = Math.pow(10, d / 20) * 100; return (-31 + 60 * Math.min(pct, 141) / 141) * Math.PI / 180; };
      const pt = (a, r) => [(cx + r * Math.sin(a)).toFixed(1), (cy - r * Math.cos(a)).toFixed(1)];
      rect(vx - 2, vy - 2, vw + 4, vh + 4, '#050505', 'rx="2"');
      p(`<clipPath id="${id}"><rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="1.5"/></clipPath><g clip-path="url(#${id})">`);
      p(`<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="#ecdfae"/><rect x="${vx}" y="${vy}" width="${vw}" height="${vh * 0.45}" fill="#fff" opacity="0.18"/>`);
      // arc, red band, ticks and dB legends
      const [ax0, ay0] = pt(ang(-20), R), [ax1, ay1] = pt(ang(0), R), [ax2, ay2] = pt(ang(3), R);
      p(`<path d="M${ax0} ${ay0} A${R} ${R} 0 0 1 ${ax1} ${ay1}" fill="none" stroke="#2a2520" stroke-width="1"/>`);
      const [rx1, ry1] = pt(ang(0), R + 3), [rx2, ry2] = pt(ang(3), R + 3);
      p(`<path d="M${rx1} ${ry1} A${R + 3} ${R + 3} 0 0 1 ${rx2} ${ry2}" fill="none" stroke="#c8261b" stroke-width="3.5"/>`);
      [[-20, '20'], [-10, '10'], [-7, '7'], [-5, '5'], [-3, '3'], [-2, ''], [-1, '1'], [0, '0'], [1, '1'], [2, ''], [3, '3']].forEach(([d, l]) => {
        const a = ang(d), [t1x, t1y] = pt(a, R), [t2x, t2y] = pt(a, R + (l ? 7 : 5)), [lx, ly] = pt(a, R + 13);
        p(`<line x1="${t1x}" y1="${t1y}" x2="${t2x}" y2="${t2y}" stroke="${d > 0 ? '#c8261b' : '#2a2520'}" stroke-width="1"/>`);
        if (l) text(+lx, +ly + 2.5, (d > 0 ? '+' : d < 0 ? '-' : '') + l, 6.5, d > 0 ? '#c8261b' : '#2a2520', 'middle', 700);
      });
      // percent scale under the arc
      [0, 20, 40, 60, 80, 100].forEach((v) => { const d = v ? 20 * Math.log10(v / 100) : -40; const a = ang(Math.max(d, -26)), [tx, ty] = pt(a, R - 4), [lx, ly] = pt(a, R - 12); p(`<line x1="${pt(a, R)[0]}" y1="${pt(a, R)[1]}" x2="${tx}" y2="${ty}" stroke="#2a2520" stroke-width="0.8"/>`); if (v >= 20) text(+lx, +ly + 2, String(v), 5.2, '#2a2520', 'middle', 600); });
      text(vx + 6, vy + 10, 'VU', 6.5, '#2a2520', 'start', 800); text(vx + vw - 6, vy + 10, 'VU', 6.5, '#2a2520', 'end', 800);
      text(vx + 7, vy + vh - 6, String(num), 13, '#2a2520', 'start', 900);   // track number on the face
      // needle
      const [nx, ny] = pt(ang(Math.max(-22, Math.min(3.2, db))), R + 6);
      p(`<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#141210" stroke-width="1.2"/>`);
      p('</g>');
      rect(vx, vy, vw, 1.5, '#000', 'opacity="0.35"');
    };
    for (const [a0, a1] of [[0, 15], [16, 31]]) {
      const bx = stripX(a0), bw = stripX(a1) + SW - bx;
      rect(bx, 4, bw, 172, '#121213', 'rx="3"'); rect(bx, 4, bw, 2, '#fff', 'opacity="0.08"');
      for (let m8 = a0; m8 <= a1; m8 += 8) {   // one SSL VU module per 8 channels
        const px = stripX(m8), pw = 8 * SW;
        rect(px + 1, 6, pw - 2, 168, '#18181a', 'rx="2"'); rect(px + pw - 1, 6, 1, 168, '#000');
        for (const [sx3, sy3] of [[px + pw * 0.25, 13], [px + pw * 0.75, 13], [px + pw * 0.25, 167], [px + pw * 0.75, 167]]) { circle(sx3, sy3, 4, '#8f9296'); circle(sx3 - 0.8, sy3 - 0.8, 1.6, '#d9dbde'); }
        for (let k = 1; k < 4; k++) { const sx3 = px + k * (pw / 4); circle(sx3, 90, 3.6, '#8f9296'); circle(sx3 - 0.7, 89.3, 1.4, '#d9dbde'); }
      }
      for (let i = a0; i <= a1; i += 2) {
        for (const [k, ch] of [[0, i], [1, i + 1]]) {
          const vw = 132, vh = 58, mx = stripX(i) + SW - vw / 2, my = 24 + k * 80, db = ch < 24 ? tapeDb[ch] : -18 + rnd() * 8;
          sslVu(mx, my, vw, vh, db, ch + 1);
        }
      }
    }

    // =================== centre section, laid out from the user's G+ photos ===================
    // Studio Computer on the left (next to channel 16), the SL 651G master module as a narrow strip on the right
    // (next to channel 17). Faders continue along the front: group masters under the computer, stereo VCAs under the master.
    const x = MX, w = MW, CC = 540, RX = x, MXM = x + CC + 8, MWM = w - CC - 8;
    rect(x, 4, w, CH - 8, PANEL2, 'rx="4"');
    const keycap = (bx, by, bw, bh, l, size) => { rect(bx + 1, by + 3, bw, bh, '#000', 'opacity="0.45" rx="3"'); rect(bx, by, bw, bh, '#d8d1b6', 'rx="3"'); rect(bx, by, bw, bh * 0.35, '#fff', 'opacity="0.25" rx="3"'); if (l) text(bx + bw / 2, by + bh / 2 + size * 0.35, l, size, '#2a2620', 'middle', 800); };
    const ckey = (bx, by, bw, bh, l, size = 6.5, on = false, col = 'white') => key(bx, by, bw, bh, col, on, l, size);
    // ---- meter bridge over the centre: SLS badge, main L / R, compression meter
    rect(x, 4, w, 172, '#16171a', 'rx="3"'); rect(x, 4, w, 2, '#fff', 'opacity="0.08"');
    text(x + 30, 84, 'SLS', 46, '#c9a54a', 'start', 900, 'font-style="italic" letter-spacing="2"');
    for (let k = 0; k < 9; k++) rect(x + 16, 46 + k * 5, 60 - k * 5, 2, '#c9a54a', 'opacity="0.8"');
    text(x + 32, 110, '4000 G · 32 CHANNEL', 11, '#c9a54a', 'start', 800, 'letter-spacing="3"');
    [['MAIN L', -4], ['MAIN R', -5]].forEach(([l, db], k) => { sslVu(x + 330 + k * 160, 20, 148, 70, db, ''); text(x + 404 + k * 160, 112, l, 9, '#d9d6cc', 'middle', 800, 'letter-spacing="1"'); });
    rect(MXM + 120, 14, 150, 82, '#efe6cc', 'rx="4"');
    { const gx = MXM + 195, gy = 108; for (let k = 0; k <= 10; k++) { const a = (-50 + k * 10) * Math.PI / 180; p(`<line x1="${(gx + 66 * Math.sin(a)).toFixed(1)}" y1="${(gy - 66 * Math.cos(a)).toFixed(1)}" x2="${(gx + 76 * Math.sin(a)).toFixed(1)}" y2="${(gy - 76 * Math.cos(a)).toFixed(1)}" stroke="#2a2520" stroke-width="1.3"/>`); }
      text(gx, 70, 'COMPRESSION', 8, '#2a2520', 'middle', 800, 'letter-spacing="1"'); p(`<line x1="${gx}" y1="104" x2="${gx + 30}" y2="40" stroke="#b3261b" stroke-width="2"/>`); text(gx, 116, 'BUS COMP', 9, '#d9d6cc', 'middle', 800, 'letter-spacing="1"'); }

    // ================= Studio Computer column =================
    rect(RX, 178, CC, CH - 182, PANEL, 'rx="4"');
    // outboard remotes sitting on the console, as in the photos: Leximan 224X remote + a machine controller with jog wheel
    rect(RX + 12, 186, 180, 276, '#000', 'opacity="0.35" rx="6"');
    remote224(RX + 14, 184, 0.27);
    const jx = RX + 206, jy = 186;
    rect(jx + 3, jy + 4, 170, 272, '#000', 'opacity="0.4" rx="8"'); rect(jx, jy, 170, 272, '#1d1e21', 'rx="8"'); rect(jx, jy, 170, 3, '#fff', 'opacity="0.1"');
    rect(jx + 16, jy + 16, 138, 54, '#0a1418', 'rx="3"');
    p(`<text x="${jx + 85}" y="${jy + 50}" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="700" fill="#5fd7e6" text-anchor="middle">LOC 01:02</text>`);
    for (let k = 0; k < 8; k++) { const bx = jx + 18 + (k % 4) * 35, by = jy + 82 + Math.floor(k / 4) * 22; rect(bx, by, 28, 15, '#3a3c40', 'rx="3"'); rect(bx, by, 28, 5, '#fff', 'opacity="0.1" rx="3"'); }
    circle(jx + 85, jy + 194, 52, '#0c0c0d'); circle(jx + 85, jy + 194, 48, '#e9eaec'); circle(jx + 85, jy + 194, 48, 'url(#capHiDark)'); circle(jx + 108, jy + 178, 9, '#b9bcc2');
    text(jx + 85, jy + 266, 'MACHINE CONTROL', 7.5, '#9aa0a8', 'middle', 800, 'letter-spacing="1.5"');
    // computer status keys (two rows of five) to the right of the remotes
    const sx2 = RX + 392, sw2 = CC - 404;
    sect(sx2, 190, sw2, 'COMPUTER STATUS');
    ['MIX ON', 'MOTOR', 'SEARCH', 'TAPE TRK', 'REC SYNC', 'GROUP', 'MATCH', 'UPDATE', 'MERGE', 'RECALL'].forEach((l, k) => ckey(sx2 + (k % 2) * (sw2 / 2) + 3, 204 + Math.floor(k / 2) * 30, sw2 / 2 - 6, 22, l, 6.5, k === 0));
    // header plate and the square screen with live timecode; status keys beside it
    rect(RX + 12, 474, 300, 22, RAL7040, 'rx="2"');
    text(RX + 20, 489, 'SLS', 9.5, '#2a2b2d', 'start', 900, 'font-style="italic"'); text(RX + 304, 489, 'Studio Computer', 9.5, '#2a2b2d', 'end', 700);
    rect(RX + 12, 500, 300, 250, '#3a3c3f', 'rx="5"');
    rect(RX + 26, 512, 272, 226, '#05070a', 'rx="10"');
    const scx = RX + 162;
    p(`<text id="sls-tc" x="${scx}" y="556" font-family="'JetBrains Mono', monospace" font-size="21" font-weight="700" fill="#38e6e6" text-anchor="middle" letter-spacing="2">01:00:03:42:00</text>`);
    text(scx, 612, 'SLS', 32, '#38e6e6', 'middle', 800, 'font-style="italic"');
    text(scx, 638, 'Studio Computer', 13, '#38e6e6', 'middle', 600);
    p(`<text id="sls-cmd" x="${RX + 40}" y="716" font-family="'JetBrains Mono', monospace" font-size="10" fill="#2fc4c4">MIX · "MIDNIGHT TAPES" · PASS 4</text>`);
    const tx2 = RX + 324, tw2 = CC - 336;
    for (let k = 0; k < 10; k++) keycap(tx2 + (k % 5) * (tw2 / 5) + 2, 586 + Math.floor(k / 5) * 40, tw2 / 5 - 8, 30, '', 6);
    ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].forEach((l, k) => text(tx2 + (k % 5) * (tw2 / 5) + tw2 / 10 - 2, 604 + Math.floor(k / 5) * 40, l, 7.5, '#2a2620', 'middle', 800));
    // cream keyboard
    const kb = ['1234567890-=', 'QWERTYUIOP[]', "ASDFGHJKL;'", 'ZXCVBNM,./'];
    rect(RX + 12, 760, CC - 24, 190, RAL7037, 'rx="6"');
    kb.forEach((row, r) => [...row].forEach((ch, c) => { const kx = (CC - 48) / 12.5, bx = RX + 22 + c * kx + r * 10; if (bx + kx > RX + CC - 16) return; keycap(bx, 768 + r * 36, kx - 6, 30, ch, 11); }));
    keycap(RX + 22 + 3 * ((CC - 48) / 12.5), 914, ((CC - 48) / 12.5) * 6, 26, '', 8);
    // function keypad (6 x 5), numeric keypad, round black keys
    const fk = [['PRINT', 'JOIN', 'NAME', 'REVISE', 'COPY', 'CANCEL'], ['LIST', 'GO TO', 'PLAY', 'CYCLE', 'DELETE', 'REPEAT'], ['TITLE', 'MIX', 'CUE', 'EVENT', 'DROP IN', '←'], ['SET UP', 'PRESET', 'REEL', 'TRACK', 'SYNC', '↑'], ['END', 'FROM', 'HERE', 'TO', 'AT', 'EXECUTE']];
    rect(RX + 12, 958, 300, 186, RAL7037, 'rx="6"');
    fk.forEach((row, r) => row.forEach((l, c) => keycap(RX + 20 + c * 48.5, 966 + r * 35, 42, 28, l, l.length > 5 ? 6 : 7)));
    rect(RX + 320, 958, 150, 186, RAL7037, 'rx="6"');
    [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], ['0', '.', 'ENT']].forEach((row, r) => row.forEach((l, c) => keycap(RX + 328 + c * 46, 966 + r * 44, 40, 36, l, l.length > 1 ? 7 : 11)));
    for (const [cx0, cy0] of [[RX + 505, 1000], [RX + 505, 1096]]) for (const [dx, dy] of [[0, -18], [-14, 0], [14, 0], [0, 18], [0, 0]]) { circle(cx0 + dx + 0.6, cy0 + dy + 1.4, 8.5, '#000', 'opacity="0.5"'); circle(cx0 + dx, cy0 + dy, 8.5, '#1b1c1e'); circle(cx0 + dx, cy0 + dy, 8.5, 'url(#capHiDark)'); }
    // group masters on the front fader panel, under the computer
    rect(RX + 1, 1154, CC - 2, CH - 1158, RAL7040); rect(RX + 1, 1154, CC - 2, 1.5, '#fff', 'opacity="0.5"');
    const gw = (CC - 24) / 8;
    for (let g = 0; g < 8; g++) {
      const gx = RX + 12 + g * gw + gw / 2;
      key(gx - 22, 1162, 20, 13, 'red', g === 5, 'M', 7); key(gx + 2, 1162, 20, 13, 'green', g === 1, 'S', 7);
      fader(gx, 1192, 1376, 0.3 + (g % 3) * 0.05, { capW: 26, capH: 38, scale: g === 0, scaleColor: '#2a2b2d', capFill: ['url(#faderCapYellow)', 'url(#faderCapGreen)', 'url(#faderCapWhite)', 'url(#faderCapBlack)'][g % 4] });
      rect(gx - 28, 1394, 56, 22, '#f2eee2', 'rx="2"');
      text(gx, 1409, ['DRUMS', 'BASS', 'KEYS', 'GTRS', 'VOCALS', 'BGVS', 'FX', 'PERC'][g], 8.5, '#1c2a6e', 'middle', 700, `font-family="'Permanent Marker', 'Comic Neue', sans-serif"`);
      text(gx, 1432, `G${g + 1}`, 8.5, INK2, 'middle', 800);
    }

    // ================= SL 651G master module: narrow strip, knobs on the left, a long key column on the right =================
    const M = MXM, MWd = MWM, KC = M + MWd - 78;
    rect(M, 178, MWd, CH - 182, PANEL, 'rx="4"');
    rect(M + 6, 184, MWd - 12, 18, RAL7040, 'rx="2"'); text(M + MWd / 2, 197, 'SLS 4000 G+ · MASTER', 8, '#2a2b2d', 'middle', 900, 'letter-spacing="2"');
    const kl = (cx0, cy0, r, col, a, l) => { sk(cx0, cy0, r, col, a); text(cx0, cy0 + r + 9, l, 5.6, INK2, 'middle', 700); };
    const c4 = (k) => M + 26 + k * ((KC - M - 52) / 3);
    // bus compressor
    sect(M + 6, 210, KC - M - 10, 'BUS COMPRESSOR');
    [['THRESH', -30], ['RATIO', -60], ['ATTACK', -40], ['RELEASE', 60]].forEach(([l, a], k) => kl(c4(k), 236, 10, '#e9eaec', a, l));
    kl(c4(0), 278, 10, '#c8352a', 20, 'MAKE-UP'); ckey(c4(1) - 18, 270, 36, 16, 'IN', 7, true, 'red'); ckey(c4(2) - 18, 270, 36, 16, 'S/C', 7); ckey(c4(3) - 18, 270, 36, 16, 'LINK', 6.5);
    // cue masters and echo returns
    sect(M + 6, 300, KC - M - 10, 'CUES · RETURNS');
    [['ST CUE', '#e0b23a'], ['CUE 1', '#e9eaec'], ['CUE 2', '#e9eaec'], ['CUE 3', '#e9eaec']].forEach(([l, col], k) => kl(c4(k), 326, 9.5, col, -20 + k * 15, l));
    [['CUE 4', '#e9eaec'], ['RTN 1', '#d9dbde'], ['RTN 2', '#d9dbde'], ['RTN 3', '#d9dbde']].forEach(([l, col], k) => kl(c4(k), 366, 9.5, col, 10 * k, l));
    [['RTN 4', '#d9dbde'], ['EXT A', '#3577c2'], ['EXT B', '#3577c2'], ['TB LVL', '#c8352a']].forEach(([l, col], k) => kl(c4(k), 406, 9.5, col, -10 * k, l));
    // status
    sect(M + 6, 428, KC - M - 10, 'STATUS');
    [['RECORD', 'red', false], ['REPLAY', 'white', false], ['MIX', 'green', true]].forEach(([l, c, on], k) => ckey(M + 10 + k * ((KC - M - 16) / 3), 440, (KC - M - 16) / 3 - 6, 20, l, 7, on, c));
    [['VCA→MON', false], ['CH FLIP', false], ['AFL', false]].forEach(([l, on], k) => ckey(M + 10 + k * ((KC - M - 16) / 3), 464, (KC - M - 16) / 3 - 6, 16, l, 6, on));
    // monitor level (large knob), dim / mono / cut
    sect(M + 6, 490, KC - M - 10, 'MONITORS');
    sk(M + (KC - M) / 2, 548, 36, '#d9dbde', 40); text(M + (KC - M) / 2, 600, 'MONITOR LEVEL', 6.5, INK2, 'middle', 800);
    [['DIM', 'white'], ['MONO', 'white'], ['CUT', 'red']].forEach(([l, c], k) => ckey(M + 10 + k * ((KC - M - 16) / 3), 610, (KC - M - 16) / 3 - 6, 18, l, 7, false, c));
    // communications
    sect(M + 6, 636, KC - M - 10, 'COMMUNICATIONS');
    ckey(M + 10, 648, 70, 24, 'TALK', 8.5, false, 'red'); ckey(M + 86, 648, 60, 24, 'SLATE', 7); kl(M + 176, 660, 9, '#8a8f97', 0, 'OSC');
    ['100', '1k', '10k'].forEach((l, k) => ckey(M + 10 + k * 46, 680, 40, 16, l, 7, k === 1, 'green'));
    // master fader in its slot, with keys beside it (as on the master module in the photos)
    rect(M + 8, 708, KC - M - 14, 300, RAL7037, 'rx="4"'); rect(M + 8, 708, KC - M - 14, 2, '#000', 'opacity="0.25"');
    text(M + 20, 724, 'MAIN', 8, INK, 'start', 900, 'letter-spacing="2"');
    fader(M + 74, 744, 934, 0.22, { capW: 30, capH: 44, scaleColor: '#2a2b2d', capFill: 'url(#faderCapWhite)' });
    text(M + 74, 960, 'STEREO', 7.5, INK, 'middle', 800);
    [['MASTER CUT', 'red'], ['MONO CHK', 'white'], ['FDR START', 'white'], ['ALL SAFE', 'white'], ['STATUS LOCK', 'white']].forEach(([l, c], k) => ckey(M + 124, 740 + k * 30, KC - M - 136, 22, l, 6.5, false, c));
    rect(M + 124, 900, KC - M - 136, 46, '#0b0b0c', 'rx="3"');
    text(M + 124 + (KC - M - 136) / 2, 920, 'MIX', 8.5, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`); text(M + 124 + (KC - M - 136) / 2, 936, 'PASS 4', 8.5, '#ff6a50', 'middle', 800, `font-family="'JetBrains Mono', monospace"`);
    // automation modes
    sect(M + 6, 1016, KC - M - 10, 'AUTOMATION');
    [['OFF', 'grey'], ['READ', 'green'], ['WRITE', 'red'], ['TOUCH', 'amber'], ['LATCH', 'blue'], ['TRIM', 'yellow']].forEach(([l, c], k) => ckey(M + 10 + (k % 3) * ((KC - M - 16) / 3), 1028 + Math.floor(k / 3) * 26, (KC - M - 16) / 3 - 6, 20, l, 7, k === 1, c));
    ckey(M + 10, 1084, KC - M - 20, 20, 'SLS MULTITRACK · ◀◀  ▶▶  ■  ▶  ●', 6.5);
    // the long column of cream keys down the right side: speakers, sources, cue / external selects
    rect(KC - 2, 210, 74, 934, RAL7040, 'rx="3"');
    text(KC + 35, 222, 'MONITOR', 6, INK, 'middle', 900, 'letter-spacing="1"');
    ['LARGE', 'SMALL', 'MINI', 'ALT', 'MIX', '2TR A', '2TR B', '2TR C', 'EXT 1', 'EXT 2', 'CUE 1', 'CUE 2', 'ST CUE', 'STUDIO', 'TB→CUE', 'TB→STU', 'SOLO', 'AFL', 'PFL', 'SPLIT'].forEach((l, k) => {
      const on = l === 'LARGE' || l === 'MIX';
      ckey(KC + 4, 230 + k * 44, 62, 30, l, 6.5, on, 'white');
    });
    // stereo VCA faders under the master module
    rect(M + 1, 1154, MWd - 2, CH - 1158, RAL7040); rect(M + 1, 1154, MWd - 2, 1.5, '#fff', 'opacity="0.5"');
    [['ST VCA 1', 'FRONT BUS'], ['ST VCA 2', 'REMIX BUS']].forEach(([l, n], k) => { const fx2 = M + 60 + k * 110; fader(fx2, 1192, 1376, 0.3, { capW: 26, capH: 38, scale: k === 0, scaleColor: '#2a2b2d', capFill: 'url(#faderCapWhite)' }); text(fx2, 1170, l, 7, INK, 'middle', 800); rect(fx2 - 34, 1394, 68, 22, '#f2eee2', 'rx="2"'); text(fx2, 1409, n, 8.5, '#1c2a6e', 'middle', 700, `font-family="'Permanent Marker', 'Comic Neue', sans-serif"`); });
    p('</svg>');
  });
};
