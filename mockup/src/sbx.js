// Rowan SBX-80 sync box: front and rear panels for the pop-up view, drawn from the user's photos of an original.
// Front: off-white desktop case with olive end cheeks, orange logo, dark "SBX-80" / "SYNC BOX" lettering, slate band with
// the display window (SONG - MEASURE - BEAT / TEMPO, EX FRM - BIT, SMPTE - HR - MIN - SEC - FRM - BIT, METRONOME light),
// DISPLAY SELECT, five SET keys (one per SMPTE field), SMPTE OFFSET, TOTAL TIME, BEAT BACK / FWD, MANUAL, PLAY - RECORD,
// COUNT IN, TIME SIGN, TAPE (+ SAVE / VERIFY / LOAD / SMPTE REC lights), EDIT, COPY, DEL, INS (SONG END - BAR LINE),
// REPEAT, SMPTE (EXT / INT), METRONOME LEVEL / AUDIO IN LEVEL / TIME BASE knobs, TEMPO knob, keypad with wide ENTER,
// TAP RESPONSE slider, START (TAP), SUB TAP, STOP/CONT.
// Rear: REMOTE (DP-2) START, STOP/CONT; INPUT AUDIO IN, SMPTE/LOAD; OUTPUT SMPTE/SAVE, TIME BASE, METRONOME;
// MIDI IN, OUT, OUT; SYNC OUT, OUT; option cover, labels, POWER, AC.
// X() / Y() map the photo's pixels to the view. Controls are <g data-sbx="name">; lamps are <g data-sbxl="name">.

module.exports = function buildSBX(h, { W, OVH }) {
  const { p, rect, text, circle, capture } = h;
  const CREAM = '#ebe8df', CHEEK = '#8e8b74', BAND = '#636974', DARK = '#45484f', ORG = '#ee7a32', WH = '#f1f2f4';
  const VFD = '#7dffd6', MONO = "'JetBrains Mono', monospace";
  const S = 1.33, FX = 60, FY = 70, X = (px) => FX + (px - 55) * S, Y = (py) => FY + (py - 75) * S;
  const lbl = (px, py, t, size = 17, fill = WH, anchor = 'middle', w = 800) => text(X(px).toFixed(0), Y(py).toFixed(0), t, size, fill, anchor, w, 'letter-spacing="0.4"');
  // small square key: dark bezel, translucent window that lights
  const key = (name, px, py, lamp = '#ff5a3a', win = '#cdb9b5') => {
    const s = 40 * S, x = X(px) - s / 2, y = Y(py) - s / 2;
    p(`<g data-sbx="${name}" style="cursor:pointer">`);
    rect(x + 2, y + 5, s, s, '#000', 'opacity="0.45" rx="4"');
    rect(x, y, s, s, '#9a9ea6', 'rx="4"'); rect(x + 4, y + 4, s - 8, s - 8, '#55585f', 'rx="3"');
    rect(x + 12, y + 11, s - 24, s - 22, win, 'rx="3"'); rect(x + 12, y + 11, s - 24, (s - 22) * 0.4, '#fff', 'opacity="0.35" rx="3"');
    p(`<g data-sbxl="${name}" opacity="0" pointer-events="none"><rect x="${x + 12}" y="${y + 11}" width="${s - 24}" height="${s - 22}" rx="3" fill="${lamp}" filter="url(#glow)"/></g>`);
    p('</g>');
  };
  const led = (id, px, py, col) => { circle(X(px), Y(py), 6, '#3a1612'); p(`<circle id="${id}" cx="${X(px)}" cy="${Y(py)}" r="5.5" fill="${col}" opacity="0" filter="url(#glow)"/>`); };
  const ln = (pts, col = WH, w = 2) => p(`<polyline points="${pts.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${w}"/>`);
  const knob = (name, id, px, py, r, ticks = 11, scale = null) => {
    const cx = X(px), cy = Y(py);
    for (let k = 0; k < ticks; k++) { const a = (-150 + k * 300 / (ticks - 1) - 90) * Math.PI / 180; p(`<line x1="${(cx + (r + 7) * Math.cos(a)).toFixed(1)}" y1="${(cy + (r + 7) * Math.sin(a)).toFixed(1)}" x2="${(cx + (r + 18) * Math.cos(a)).toFixed(1)}" y2="${(cy + (r + 18) * Math.sin(a)).toFixed(1)}" stroke="${WH}" stroke-width="2.5"/>`); }
    if (scale) scale.forEach((v, k) => { if (!v) return; const a = (-150 + k * 300 / (scale.length - 1) - 90) * Math.PI / 180; text((cx + (r + 34) * Math.cos(a)).toFixed(0), (cy + (r + 34) * Math.sin(a) + 6).toFixed(0), v, 16, WH, 'middle', 800); });
    p(`<g data-sbx="${name}" style="cursor:pointer">`);
    circle(cx + 3, cy + 7, r + 2, '#000', 'opacity="0.5"'); circle(cx, cy, r, '#3b3d42');
    p(`<circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="none" stroke="#2a2c30" stroke-width="2.5" stroke-dasharray="2 2.6"/>`);
    circle(cx, cy, r * 0.82, '#45474d'); circle(cx, cy, r * 0.82, 'url(#capHiDark)', 'opacity="0.6"');
    p(`<line id="${id}" data-cx="${cx}" data-cy="${cy}" x1="${cx}" y1="${cy - r * 0.15}" x2="${cx}" y2="${cy - r * 0.92}" stroke="#f0a040" stroke-width="${Math.max(3, r * 0.1)}" stroke-linecap="round"/>`);
    p('</g>');
  };

  return capture(() => {
    rect(0, 0, W, OVH, '#141210');
    // ======================= FRONT =======================
    rect(X(55) + 16, Y(75) + 30, X(1560) - X(55), Y(1395) - Y(75), '#000', 'opacity="0.55" filter="url(#soft)"');
    rect(X(55), Y(75), X(1560) - X(55), Y(1395) - Y(75), CHEEK, 'rx="8"');
    rect(X(90), Y(75), X(1528) - X(90), Y(1395) - Y(75), CREAM);
    rect(X(90), Y(1380), X(1528) - X(90), Y(1395) - Y(1380), '#000', 'opacity="0.1"');
    // logo, model, name
    p(`<rect x="${X(176)}" y="${Y(119)}" width="${62 * S}" height="${34 * S}" rx="7" fill="none" stroke="${ORG}" stroke-width="4"/><path d="M${X(188)} ${Y(146)} V${Y(127)} H${X(212)} a${6 * S} ${5 * S} 0 0 1 0 ${10 * S} H${X(196)} L${X(226)} ${Y(146)}" fill="none" stroke="${ORG}" stroke-width="4"/>`);
    text(X(250), Y(150), 'Rowan', 50, ORG, 'start', 700);
    text(X(168), Y(342), 'SBX-80', 94, DARK, 'start', 900, 'letter-spacing="2"');
    text(X(1440), Y(342), 'SYNC BOX', 58, DARK, 'end', 900, 'letter-spacing="4"');
    // slate band
    rect(X(90), Y(357), X(1528) - X(90), Y(862) - Y(357), BAND);
    // display window
    rect(X(203), Y(385), X(962) - X(203), Y(523) - Y(385), '#0b0c0e', 'rx="3"');
    lbl(402, 424, 'SONG', 15); lbl(488, 424, 'MEASURE', 15); lbl(555, 424, 'BEAT', 15); lbl(668, 406, 'TEMPO', 15);
    ln([[262, 419], [380, 419]], '#8f949c', 1.5); ln([[425, 419], [455, 419]], '#8f949c', 1.5); ln([[522, 419], [535, 419]], '#8f949c', 1.5); ln([[575, 419], [605, 419], [605, 401], [640, 401]], '#8f949c', 1.5);
    lbl(655, 428, 'EX FRM', 15, ORG); lbl(731, 428, 'BIT', 15, ORG); ln([[262, 425], [290, 425], [290, 423], [620, 423]], ORG, 1.5); ln([[690, 423], [718, 423]], ORG, 1.5);
    lbl(313, 513, 'SMPTE', 15); lbl(396, 513, 'HR', 15); lbl(471, 513, 'MIN', 15); lbl(548, 513, 'SEC', 15); lbl(640, 513, 'FRM', 15); lbl(727, 513, 'BIT', 15);
    ln([[262, 492], [262, 508], [285, 508]], '#8f949c', 1.5); ln([[340, 508], [380, 508]], '#8f949c', 1.5); ln([[412, 508], [455, 508]], '#8f949c', 1.5); ln([[488, 508], [530, 508]], '#8f949c', 1.5); ln([[566, 508], [620, 508]], '#8f949c', 1.5); ln([[660, 508], [710, 508]], '#8f949c', 1.5);
    // display-mode marks at the left of the window (one per row)
    [[1, 419], [2, 425], [3, 500]].forEach(([k, py]) => p(`<rect id="sbx-mi${k}" x="${X(232)}" y="${Y(py) - 3}" width="${28 * S}" height="6" fill="${ORG}" opacity="0" filter="url(#glowSm)"/>`));
    // VFD readouts
    rect(X(360), Y(440), X(592) - X(360), Y(496) - Y(440), '#061412', 'rx="2"'); rect(X(615), Y(440), X(782) - X(615), Y(496) - Y(440), '#061412', 'rx="2"');
    p(`<text id="sbx-l" x="${X(366)}" y="${Y(486)}" font-family="${MONO}" font-size="54" font-weight="700" fill="${VFD}" filter="url(#glowSm)" letter-spacing="3">01 001 1</text>`);
    p(`<text id="sbx-r" x="${X(776)}" y="${Y(486)}" font-family="${MONO}" font-size="54" font-weight="700" fill="${VFD}" text-anchor="end" filter="url(#glowSm)" letter-spacing="3">96.0</text>`);
    lbl(868, 492, 'METRONOME', 18, '#d8dbe0', 'middle', 600); p(`<polygon points="${X(925)},${Y(482)} ${X(933)},${Y(486)} ${X(925)},${Y(490)}" fill="#8f949c"/>`);
    led('sbx-led-beat', 945, 486, '#ff5a3a');
    // row 1: DISPLAY SELECT, SET x5 (leader lines up to HR MIN SEC FRM BIT), SMPTE OFFSET, TOTAL TIME, BEAT BACK / FWD
    key('disp', 248, 593); lbl(246, 627, 'DISPLAY', 15); lbl(246, 641, 'SELECT', 15);
    [['set-hr', 358, 396], ['set-min', 432, 471], ['set-sec', 505, 548], ['set-frm', 578, 640], ['set-bit', 652, 727]].forEach(([n, px, tx]) => { key(n, px, 593); ln([[px, 571], [px, 560], [tx - 22, 525]], WH, 1.5); });
    ln([[358, 615], [358, 625], [652, 625], [652, 615]], WH, 1.5); lbl(505, 630, 'SET', 15);
    key('offset', 763, 593); lbl(763, 552, 'SMPTE', 15); lbl(763, 566, 'OFFSET', 15);
    key('total', 838, 593); lbl(838, 552, 'TOTAL', 15); lbl(838, 566, 'TIME', 15);
    key('left', 912, 593, '#9dff9a', '#d9e6cf'); key('right', 987, 593, '#9dff9a', '#d9e6cf'); lbl(912, 566, 'BACK', 15); lbl(987, 566, 'FWD', 15); lbl(950, 551, 'BEAT', 15); ln([[912, 551], [928, 547]], WH, 1.5); ln([[970, 547], [987, 551]], WH, 1.5);
    // row 2: MANUAL, PLAY - RECORD, COUNT IN, TIME SIGN, TAPE, lights
    key('manual', 248, 718); lbl(246, 690, 'MANUAL', 15, ORG);
    key('play', 430, 718, '#5cff7a'); key('rec', 505, 718); lbl(430, 690, 'PLAY', 15, ORG); lbl(505, 690, 'RECORD', 15, ORG); ln([[450, 686], [470, 686]], ORG, 1.5);
    key('countin', 579, 718); lbl(579, 676, 'COUNT', 15); lbl(579, 690, 'IN', 15);
    key('sig', 652, 718); lbl(652, 676, 'TIME', 15); lbl(652, 690, 'SIGN', 15);
    key('tape', 764, 718, '#9dff9a', '#d9e6cf'); lbl(764, 690, 'TAPE', 15, ORG);
    [['sbx-led-save', 838, 'SAVE'], ['sbx-led-verify', 890, 'VERIFY'], ['sbx-led-load', 940, 'LOAD'], ['sbx-led-gen', 992, 'REC']].forEach(([id, px, l]) => { led(id, px, 720, '#ff3b2f'); lbl(px, 702, l, 15); });
    lbl(992, 688, 'SMPTE', 15);
    ln([[410, 755], [672, 755]], ORG, 2); ln([[410, 755], [410, 790]], ORG, 2);
    // row 3: EDIT, COPY, DEL, INS (SONG END - BAR LINE), REPEAT, SMPTE EXT / INT
    key('edit', 430, 812); lbl(430, 782, 'EDIT', 15, ORG);
    key('copy', 505, 812); lbl(505, 782, 'COPY', 15); key('delete', 579, 812); lbl(579, 782, 'DEL', 15); key('insert', 652, 812); lbl(652, 782, 'INS', 15);
    ln([[430, 832], [430, 842], [455, 842]], WH, 1.5); lbl(505, 847, 'SONG  END', 15); ln([[545, 842], [600, 842]], WH, 1.5); lbl(652, 847, 'BAR  LINE', 15);
    key('repeat', 764, 812); lbl(764, 782, 'REPEAT', 15);
    key('smptekey', 838, 812); lbl(838, 782, 'SMPTE', 15);
    rect(X(868), Y(796), 13, 13, '#3a1612'); p(`<rect id="sbx-led-ext" x="${X(868)}" y="${Y(796)}" width="13" height="13" fill="${ORG}" opacity="0" filter="url(#glowSm)"/>`); lbl(884, 805, 'EXT', 15, WH, 'start');
    rect(X(868), Y(815), 13, 13, '#2a2a2a', 'stroke="#e0e0e0" stroke-width="1.5"'); p(`<rect id="sbx-led-int" x="${X(868)}" y="${Y(815)}" width="13" height="13" fill="#f2f2f2" opacity="0" filter="url(#glowSm)"/>`); lbl(884, 824, 'INT', 15, WH, 'start');
    // knobs
    lbl(1105, 397, 'METRONOME', 17); lbl(1105, 412, 'LEVEL', 17); knob('metro', 'sbx-k-metro', 1105, 485, 36, 11); lbl(1076, 540, '0', 15); lbl(1135, 540, '10', 15);
    lbl(1245, 397, 'AUDIO IN', 17); lbl(1245, 412, 'LEVEL', 17); knob('audio', 'sbx-k-audio', 1245, 485, 36, 11); lbl(1216, 540, '0', 15); lbl(1275, 540, '10', 15);
    lbl(1385, 397, 'TIME BASE', 17); knob('tb', 'sbx-k-tb', 1385, 485, 36, 9, ['1', '2', '3', '4', '12', '24', '48', '96', '120']);
    lbl(1245, 628, 'TEMPO', 19); knob('tempo', 'sbx-k-tempo', 1245, 718, 66, 11); lbl(1185, 803, 'SLOW', 15); lbl(1303, 803, 'FAST', 15);
    // keypad
    rect(X(1113), Y(893), X(1382) - X(1113), Y(1248) - Y(893), '#141416', 'rx="4"');
    const kp = (n, l, px, py, wpx = 84) => {
      const x = X(px) - 42 * S, y = Y(py) - 42 * S, w = wpx * S, hh = 84 * S;
      p(`<g data-sbx="${n}" style="cursor:pointer">`);
      rect(x, y, w, hh, '#9a978d', 'rx="5"'); rect(x + 7, y + 5, w - 14, hh - 16, '#cfccc2', 'rx="5"'); rect(x + 7, y + 5, w - 14, (hh - 16) * 0.35, '#fff', 'opacity="0.3" rx="5"');
      text(x + w / 2, y + hh / 2 + 10, l, l.length > 1 ? 26 : 44, '#3a3a3a', 'middle', 500);
      p('</g>');
    };
    [['7', 1158, 938], ['8', 1248, 938], ['9', 1336, 938], ['4', 1158, 1027], ['5', 1248, 1027], ['6', 1336, 1027], ['1', 1158, 1117], ['2', 1248, 1117], ['3', 1336, 1117], ['0', 1158, 1205]].forEach(([l, px, py]) => kp(`d${l}`, l, px, py));
    kp('ent', 'ENTER', 1248, 1205, 174);
    // TAP RESPONSE, START (TAP), SUB TAP, STOP/CONT
    rect(X(205), Y(1098), X(332) - X(205), Y(1262) - Y(1098), BAND); rect(X(330), Y(1236), X(552) - X(330), Y(1262) - Y(1236), BAND);
    lbl(245, 1111, 'TAP', 14); lbl(245, 1124, 'RESPONSE', 14);
    p('<g data-sbx="resp" style="cursor:pointer">');
    rect(X(232), Y(1160), X(258) - X(232), Y(1222) - Y(1160), '#1c1d20', 'rx="2"');
    p(`<rect id="sbx-resp" data-y0="${Y(1162)}" data-step="${(Y(1197) - Y(1162)) / 2}" x="${X(232) + 3}" y="${Y(1162)}" width="${X(258) - X(232) - 6}" height="${Y(1186) - Y(1162)}" rx="2" fill="#cfccc2"/>`);
    p('</g>');
    lbl(271, 1166, 'QUICK', 14, WH, 'start'); lbl(271, 1184, 'MEDIUM', 14, WH, 'start'); lbl(271, 1202, 'SLOW', 14, WH, 'start');
    const big = (n, px, cap, title) => {
      if (title) { rect(X(px) - 45 * S, Y(1100), 90 * S, Y(1128) - Y(1100), DARK); lbl(px, 1119, title, 15, ORG); }
      const s = 86 * S, x = X(px) - s / 2, y = Y(1180) - s / 2;
      p(`<g data-sbx="${n}" style="cursor:pointer">`);
      rect(x - 4, y - 4, s + 8, s + 8, '#2c2d31', 'rx="4"'); rect(x, y, s, s, cap, 'rx="4"'); rect(x + 8, y + 8, s - 16, (s - 16) * 0.35, '#fff', 'opacity="0.3" rx="3"');
      if (n === 'tap') { rect(X(px) - 14, y + 18, 28, 10, '#3a3c40', 'rx="2"'); p(`<rect id="sbx-taplight" x="${X(px) - 14}" y="${y + 18}" width="28" height="10" rx="2" fill="#ff5a3a" opacity="0" filter="url(#glowSm)"/>`); }
      p('</g>');
    };
    big('tap', 386, '#cdcbc4', 'START'); big('subtap', 510, '#d9cfb3', ''); big('stopcont', 634, '#d9cfb3', 'STOP/CONT');
    lbl(386, 1253, 'TAP', 14); lbl(510, 1253, 'SUB TAP', 14);
    p(`<text id="sbx-msg" x="${X(110)}" y="${Y(1345)}" font-family="${MONO}" font-size="22" font-weight="700" fill="#55606f">MANUAL</text>`);

    // ======================= REAR (photo 2) =======================
    const RX0 = 2160, RY0 = 110, RXf = (px) => RX0 + (px - 55), RYf = (py) => RY0 + (py - 75);
    const rl = (px, py, t, size = 14, fill = '#2b2d31', anchor = 'middle') => text(RXf(px).toFixed(0), RYf(py).toFixed(0), t, size, fill, anchor, 800);
    text(RX0, RY0 - 30, 'REAR PANEL', 22, '#9c9384', 'start', 800, 'letter-spacing="4"');
    rect(RXf(55) + 12, RYf(180) + 24, RXf(1560) - RXf(55), RYf(620) - RYf(180), '#000', 'opacity="0.5" filter="url(#soft)"');
    rect(RXf(55), RYf(180), RXf(1560) - RXf(55), RYf(620) - RYf(180), CHEEK, 'rx="6"');
    rect(RXf(95), RYf(180), RXf(1525) - RXf(95), RYf(615) - RYf(180), '#e6e2d7');
    rect(RXf(95), RYf(505), RXf(1525) - RXf(95), 3, '#000', 'opacity="0.15"');
    for (const vx of [300, 480, 660]) for (let k = 0; k < 6; k++) rect(RXf(vx + k * 18), RYf(545), 7, 50, '#2a2622', 'rx="2"');
    const jack = (px, py) => { circle(RXf(px), RYf(py), 25, '#1b1b1d'); circle(RXf(px), RYf(py), 18, '#0b0b0c'); circle(RXf(px), RYf(py), 7, '#2c2c2e'); };
    const din = (px, py) => { circle(RXf(px), RYf(py), 34, '#1b1b1d'); circle(RXf(px), RYf(py), 27, '#0e0e0f'); for (let k = 0; k < 5; k++) { const a = (210 + k * 30) * Math.PI / 180; circle(RXf(px) + 13 * Math.cos(a), RYf(py) - 13 * Math.sin(a), 3, '#8f8f8f'); } rect(RXf(px) - 4, RYf(py) - 30, 8, 7, '#6a6a6a'); };
    const br = (x1, x2, py, t) => { p(`<polyline points="${RXf(x1)},${RYf(py) + 8} ${RXf(x1)},${RYf(py)} ${RXf(x2)},${RYf(py)} ${RXf(x2)},${RYf(py) + 8}" fill="none" stroke="#2b2d31" stroke-width="1.5"/>`); rect(RXf((x1 + x2) / 2) - t.length * 5 - 6, RYf(py) - 9, t.length * 10 + 12, 18, '#e6e2d7'); rl((x1 + x2) / 2, py + 5, t); };
    br(255, 340, 222, 'REMOTE'); rl(297, 240, '(DP-2)'); br(410, 505, 222, 'INPUT'); br(590, 760, 222, 'OUTPUT'); br(240, 470, 368, 'MIDI'); br(590, 720, 368, 'SYNC');
    [['START', '', 257], ['STOP', '/CONT', 337], ['AUDIO', 'IN', 424], ['SMPTE', '/LOAD', 503], ['SMPTE', '/SAVE', 590], ['TIME', 'BASE', 672], ['METRONOME', '', 757]].forEach(([a, b, px]) => { rl(px, 272, a); if (b) rl(px, 286, b); jack(px, 322); });
    [['IN', 255], ['OUT', 355], ['OUT', 455], ['OUT', 595], ['OUT', 722]].forEach(([l, px]) => { rl(px, 390, l); din(px, 440); });
    rect(RXf(795), RYf(375), RXf(1048) - RXf(795), RYf(492) - RYf(375), '#151516', 'rx="3"');
    rect(RXf(780), RYf(180), RXf(1005) - RXf(780), RYf(260) - RYf(180), '#151516');
    ['Complies with the limits', 'for a Class B computing device', 'pursuant to Subpart J', 'of Part 15 of FCC Rules'].forEach((t, k) => rl(892, 198 + k * 18, t, 11, '#c9c9c9'));
    rect(RXf(1022), RYf(206), RXf(1190) - RXf(1022), RYf(345) - RYf(206), 'none', 'stroke="#2b2d31" stroke-width="2"');
    ['WARNING:', 'SHOCK HAZARD', '-DO NOT OPEN', 'AVIS: RISQUE', 'DE CHOC ELECTRIQUE', '-NE PAS OUVRIR'].forEach((t, k) => rl(1036, 232 + k * 20, t, k === 0 || k === 3 ? 17 : 14, '#2b2d31', 'start'));
    rect(RXf(1068), RYf(440), RXf(1226) - RXf(1068), RYf(492) - RYf(440), '#d9dde2');
    ['The SMPTE code of', 'this SBX-80 is set', 'to 30 frames/sec.'].forEach((t, k) => rl(1147, 457 + k * 15, t, 12));
    rl(1385, 236, 'POWER', 15); rl(1360, 258, 'ON', 13); rl(1406, 258, 'OFF', 13);
    rect(RXf(1338), RYf(268), RXf(1430) - RXf(1338), RYf(318) - RYf(268), '#1b1b1d', 'rx="3"'); rect(RXf(1350), RYf(276), 40, 34, '#3a3a3c', 'rx="2"');
    rl(1392, 378, 'AC', 15); rect(RXf(1250), RYf(388), RXf(1460) - RXf(1250), RYf(470) - RYf(388), '#1b1b1d', 'rx="8"'); rect(RXf(1290), RYf(402), RXf(1420) - RXf(1290), RYf(456) - RYf(402), '#0b0b0c', 'rx="4"'); rect(RXf(1330), RYf(415), 8, 26, '#9a9a9a'); rect(RXf(1372), RYf(415), 8, 26, '#9a9a9a');
    // ======================= how it's used here =======================
    const wrap = (s, n) => { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; };
    const hy = 700;
    text(RX0, hy, 'IN THIS STUDIO', 22, '#9c9384', 'start', 800, 'letter-spacing="4"');
    const steps = [
      'STRIPE  Set SMPTE to INT (the box generates code), arm track 24 on the autolocator (black key 24), then PLAY + RECORD the tape machine: SMPTE/SAVE prints to track 24 and the SMPTE REC light comes on. Re-striping part of the tape continues the code.',
      'LOCK  Set SMPTE to EXT and play the tape. SMPTE/LOAD reads track 24; MIDI OUT sends a steady clock and song position, SYNC OUT drives DIN-sync machines, TIME BASE clocks the rest. Vari-speed bends the clock with the tape.',
      'TEMPO  TEMPO knob, START/TAP or the keypad (BPM, ENTER). TIME SIGN then two digits sets the meter. EDIT + BEAT BACK / FWD steps measures; INS / DEL / COPY edit the map. MANUAL plays the knob tempo instead of the map.',
      'TAP IN  Locked to the tape, press RECORD and tap along: each tap writes the tempo from that measure on, so the machines follow the drummer.',
      'SMPTE OFFSET + SET  Type a number and press a SET key (HR MIN SEC FRM BIT) to set where bar 1 falls; SMPTE OFFSET alone takes the tape position. TAPE picks SAVE / VERIFY / LOAD, ENTER runs it. REPEAT loops the song. T taps while this view is open.',
    ];
    let ly = hy + 48;
    steps.forEach((s) => { wrap(s, 104).forEach((l) => { text(RX0, ly, l, 21, '#d9d3c7', 'start', 600); ly += 30; }); ly += 12; });
    p(`<text id="sbx-out" x="${RX0}" y="${ly + 30}" font-family="${MONO}" font-size="22" font-weight="700" fill="${VFD}">OUTPUTS</text>`);
    p(`<text id="sbx-out2" x="${RX0}" y="${ly + 64}" font-family="${MONO}" font-size="22" font-weight="700" fill="${VFD}"></text>`);
  });
};
