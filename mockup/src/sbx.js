// Rowan SBX-80 sync box: front and rear panels for the pop-up view.
// Front laid out from the user's photo of an original unit: near-square desktop case in off-white with olive end
// cheeks, red logo, slate-blue "SBX-80" lettering, a slate-blue band holding the display window (song / measure /
// beat, tempo, metronome) and three rows of small square keys (red legends on MANUAL, PLAY / RECORD, EDIT, SAVE),
// METRONOME LEVEL / AUDIO IN LEVEL / TIME BASE knobs, a big TEMPO knob, a beige numeric keypad with a wide ENTER,
// and the TAP RESPONSE slider, START (TAP), SUB TAP and STOP / CONTINUE keys along the bottom.
// Controls are drawn at the photo's positions: X() / Y() map photo pixels to the view.
// Controls are <g data-sbx="name"> groups; lamps are <g data-sbxl="name"> lit copies the page fades in.

module.exports = function buildSBX(h, { W, OVH }) {
  const { p, rect, text, circle, capture } = h;
  const CREAM = '#ebe8de', CHEEK = '#8c8768', BAND = '#556986', SLATE = '#3f5477', RED = '#d23b2c', INKD = '#2b2d30', INKL = '#eef1f5';
  const VFD = '#7dffd6', MONO = "'JetBrains Mono', monospace", SANS = 'Archivo, Arial, sans-serif';
  // photo pixel -> view: the photo's face spans x 130..615, y 25..395
  const S = 3.72, FX = 140, FY = 70, X = (px) => FX + (px - 130) * S, Y = (py) => FY + (py - 25) * S;
  const lbl = (px, py, t, size = 15, fill = INKL, anchor = 'middle', w = 800) => text(X(px).toFixed(0), Y(py).toFixed(0), t, size, fill, anchor, w, 'letter-spacing="0.8"');
  // small square perspex key with optional lamp
  const key = (name, px, py, sz = 11, lamp = '#ffb02e', cap = '#d4d5d1') => {
    const x = X(px) - (sz * S) / 2, y = Y(py) - (sz * S) / 2, s = sz * S;
    p(`<g data-sbx="${name}" style="cursor:pointer">`);
    rect(x + 2, y + 4, s, s, '#000', 'opacity="0.45" rx="3"');
    rect(x, y, s, s, '#9fa2a4', 'rx="3"'); rect(x + 3, y + 3, s - 6, s - 6, cap, 'rx="2"'); rect(x + 3, y + 3, s - 6, (s - 6) * 0.4, '#fff', 'opacity="0.45" rx="2"');
    p(`<g data-sbxl="${name}" opacity="0" pointer-events="none"><rect x="${x + 3}" y="${y + 3}" width="${s - 6}" height="${s - 6}" rx="2" fill="${lamp}" filter="url(#glow)"/><rect x="${x + 3}" y="${y + 3}" width="${s - 6}" height="${(s - 6) * 0.4}" rx="2" fill="#fff" opacity="0.45"/></g>`);
    p('</g>');
  };
  const led = (id, px, py, col) => { circle(X(px), Y(py), 6, '#2a1c1a'); p(`<circle id="${id}" cx="${X(px)}" cy="${Y(py)}" r="5.5" fill="${col}" opacity="0" filter="url(#glow)"/>`); };
  const bracket = (px1, px2, py, t, fill = INKL) => { p(`<polyline points="${X(px1)},${Y(py) - 10} ${X(px1)},${Y(py)} ${X(px2)},${Y(py)} ${X(px2)},${Y(py) - 10}" fill="none" stroke="${fill}" stroke-width="2"/>`); if (t) lbl((px1 + px2) / 2, py + 6, t, 14, fill); };
  const knob = (name, id, px, py, r, ticks = 11) => {
    const cx = X(px), cy = Y(py);
    for (let k = 0; k < ticks; k++) { const a = (-150 + k * 300 / (ticks - 1) - 90) * Math.PI / 180; p(`<line x1="${(cx + (r + 8) * Math.cos(a)).toFixed(1)}" y1="${(cy + (r + 8) * Math.sin(a)).toFixed(1)}" x2="${(cx + (r + 18) * Math.cos(a)).toFixed(1)}" y2="${(cy + (r + 18) * Math.sin(a)).toFixed(1)}" stroke="${INKL}" stroke-width="2.5"/>`); }
    p(`<g data-sbx="${name}" style="cursor:pointer">`);
    circle(cx + 3, cy + 7, r + 3, '#000', 'opacity="0.5"'); circle(cx, cy, r, '#151618');
    p(`<circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="none" stroke="#3a3c40" stroke-width="2" stroke-dasharray="2 2.4"/>`);
    circle(cx, cy, r * 0.7, '#202124'); circle(cx, cy, r * 0.7, 'url(#capHiDark)');
    p(`<line id="${id}" data-cx="${cx}" data-cy="${cy}" x1="${cx}" y1="${cy - r * 0.15}" x2="${cx}" y2="${cy - r * 0.95}" stroke="#f2f2f2" stroke-width="${Math.max(3, r * 0.1)}" stroke-linecap="round"/>`);
    p('</g>');
  };

  return capture(() => {
    rect(0, 0, W, OVH, '#141210');
    // ======================= FRONT (desktop case) =======================
    const fx0 = X(118), fy0 = Y(25), fx1 = X(628), fy1 = Y(398);
    rect(fx0 + 16, fy0 + 30, fx1 - fx0, fy1 - fy0, '#000', 'opacity="0.55" filter="url(#soft)"');
    rect(fx0, fy0, fx1 - fx0, fy1 - fy0, CHEEK, 'rx="10"');                         // olive end cheeks
    rect(X(118), fy0, X(130) - X(118), fy1 - fy0, '#7a7558', 'rx="10"'); rect(X(615), fy0, X(628) - X(615), fy1 - fy0, '#7a7558', 'rx="10"');
    rect(X(130), fy0, X(615) - X(130), fy1 - fy0, CREAM);                             // off-white face
    rect(X(130), fy1 - 18, X(615) - X(130), 18, '#000', 'opacity="0.12"');
    // logo, model, name
    rect(X(220), Y(33), 26, 18, 'none', `stroke="${RED}" stroke-width="3" rx="3"`);
    text(X(228), Y(44), 'Rowan', 44, RED, 'start', 800);
    text(X(172), Y(92), 'SBX-80', 104, SLATE, 'start', 900, 'font-style="italic" letter-spacing="4"');
    text(X(544), Y(92), 'SYNC BOX', 62, SLATE, 'end', 900, 'font-style="italic" letter-spacing="4"');
    // slate-blue band
    rect(X(130), Y(95), X(615) - X(130), Y(233) - Y(95), BAND);
    rect(X(130), Y(95), X(615) - X(130), 3, '#fff', 'opacity="0.25"');
    // display window: one dark window, song / measure / beat left, tempo right, METRONOME beat light
    rect(X(198), Y(97), X(422) - X(198), Y(137) - Y(97), '#0b0c0d', 'rx="4"');
    rect(X(202), Y(100), X(418) - X(202), Y(134) - Y(100), '#061412', 'rx="3"');
    p(`<text id="sbx-ll" x="${X(282)}" y="${Y(105)}" font-family="${SANS}" font-size="15" font-weight="800" fill="#9fb7c9" text-anchor="middle" letter-spacing="3">SONG   MEASURE   BEAT</text>`);
    p(`<text id="sbx-rl" x="${X(372)}" y="${Y(105)}" font-family="${SANS}" font-size="15" font-weight="800" fill="#9fb7c9" text-anchor="middle" letter-spacing="3">TEMPO</text>`);
    p(`<text id="sbx-l" x="${X(214)}" y="${Y(124)}" font-family="${MONO}" font-size="62" font-weight="700" fill="${VFD}" filter="url(#glowSm)" letter-spacing="4">01 001 1</text>`);
    p(`<text id="sbx-r" x="${X(410)}" y="${Y(124)}" font-family="${MONO}" font-size="62" font-weight="700" fill="${VFD}" text-anchor="end" filter="url(#glowSm)" letter-spacing="4">96.0</text>`);
    p(`<text x="${X(346)}" y="${Y(131.5)}" font-family="${SANS}" font-size="13" font-weight="800" fill="#9fb7c9" letter-spacing="2">METRONOME</text>`);
    led('sbx-led-beat', 393, 130, '#ff6a3c');
    p(`<text x="${X(214)}" y="${Y(131.5)}" font-family="${SANS}" font-size="13" font-weight="800" fill="#9fb7c9" letter-spacing="2">SMPTE  HR · MIN · SEC · FR</text>`);
    p(`<text id="sbx-msg" x="${X(140)}" y="${Y(246)}" font-family="${MONO}" font-size="22" font-weight="700" fill="#3f5477">MANUAL</text>`);
    // three small knobs and the TEMPO knob
    lbl(463, 104, 'METRONOME', 14); lbl(463, 109, 'LEVEL', 14); knob('metro', 'sbx-k-metro', 463, 123, 26);
    lbl(505, 104, 'AUDIO IN', 14); lbl(505, 109, 'LEVEL', 14); knob('audio', 'sbx-k-audio', 505, 123, 26);
    lbl(548, 99, 'TIME BASE', 14); knob('tb', 'sbx-k-tb', 548, 121, 28, 9);
    ['1', '2', '3', '4', '24', '48', '64', '96', '120'].forEach((v, k) => { const a = (-150 + k * 300 / 8 - 90) * Math.PI / 180; text((X(548) + 62 * Math.cos(a)).toFixed(0), (Y(121) + 62 * Math.sin(a) + 5).toFixed(0), v, 13, INKL, 'middle', 800); });
    lbl(508, 164, 'TEMPO', 16); knob('tempo', 'sbx-k-tempo', 508, 184, 58); lbl(486, 210, 'SLOW', 14); lbl(530, 210, 'FAST', 14);
    // ---- key row 1: DISPLAY SELECT | SET: SONG MEAS BEAT FRAME TIME SIG | SMPTE OFFSET | TOTAL TIME | BACK FWD (measure)
    key('disp', 213, 153); lbl(213, 166, 'DISPLAY', 13); lbl(213, 171, 'SELECT', 13);
    [['song', 'SONG'], ['meas', 'MEAS'], ['beat', 'BEAT'], ['frame', 'FRAME'], ['sig', 'TIME SIG']].forEach(([n, l], k) => { key(n, 247 + k * 22, 153); lbl(247 + k * 22, 143, l, 12); });
    bracket(243, 340, 163, 'SET');
    [1, 2, 3].forEach((k) => { led(`sbx-led-d${k}`, 222, 145 + k * 5, '#ff6a3c'); lbl(227, 146.5 + k * 5, String(k), 11, INKL, 'start'); });
    key('start', 366, 153); lbl(366, 141, 'SMPTE', 12); lbl(366, 145.5, 'OFFSET', 12);
    key('total', 388, 153); lbl(388, 141, 'TOTAL', 12); lbl(388, 145.5, 'TIME', 12);
    key('left', 410, 153); key('right', 432, 153); lbl(410, 166, 'BACK', 12); lbl(432, 166, 'FWD', 12); lbl(421, 143, 'MEASURE', 12);
    // ---- key row 2: MANUAL | PLAY RECORD | COUNT IN | TIME BASE | SAVE LOAD
    key('manual', 210, 186, 11, '#59f07a'); lbl(210, 176, 'MANUAL', 13, '#ff8a7a');
    key('play', 267, 186, 11, '#59f07a'); key('rec', 290, 186, 11, '#ff3b2f');
    p(`<rect x="${X(258)}" y="${Y(174)}" width="${X(299) - X(258)}" height="${Y(179) - Y(174)}" fill="${RED}" rx="2"/>`); lbl(267, 178.2, 'PLAY', 12, '#fff'); lbl(290, 178.2, 'RECORD', 12, '#fff');
    key('countin', 312, 186); lbl(312, 176, 'COUNT IN', 12);
    key('tbkey', 334, 186); lbl(334, 174, 'TIME', 12); lbl(334, 178.5, 'BASE', 12);
    key('save', 366, 186, 11, '#ffb02e'); lbl(366, 177, 'SAVE', 13, '#ff8a7a');
    key('load', 388, 186); lbl(388, 177, 'LOAD', 12);
    // status LEDs (SAVE VERIFY LOAD SMPTE REC) and EXT / INT
    [['sbx-led-save', 372, 'SAVE', '#ff3b2f'], ['sbx-led-verify', 390, 'VERIFY', '#ff3b2f'], ['sbx-led-load', 409, 'LOAD', '#ff3b2f'], ['sbx-led-gen', 430, 'SMPTE REC', '#ff3b2f']].forEach(([id, px, l, c]) => { led(id, px + 30, 196, c); lbl(px + 30, 203, l, 11); });
    // ---- key row 3: EDIT | COPY DEL INS (SONG END ... BAR LINE) | VERIFY | SMPTE (EXT / INT) | WRITE
    key('edit', 267, 213); lbl(267, 204, 'EDIT', 12, '#ff8a7a');
    key('copy', 290, 213); lbl(290, 204, 'COPY', 12); key('delete', 312, 213); lbl(312, 204, 'DEL', 12); key('insert', 334, 213); lbl(334, 204, 'INS', 12);
    bracket(258, 343, 224, 'SONG END · · · BAR LINE');
    key('verify', 366, 213); lbl(366, 204, 'VERIFY', 12);
    key('smptekey', 387, 213); lbl(387, 204, 'SMPTE', 12); led('sbx-led-ext', 398, 209, '#4fe07a'); led('sbx-led-int', 398, 216, '#ffd23a'); lbl(407, 210.5, 'EXT', 11, INKL, 'start'); lbl(407, 217.5, 'INT', 11, INKL, 'start');
    key('gen', 455, 186, 11, '#ff3b2f'); lbl(455, 175, 'SMPTE', 12, '#ff8a7a'); lbl(455, 179.5, 'WRITE', 12, '#ff8a7a');
    // lock / clock / DIN / tempo-record lights in the band's left corner
    [['sbx-led-lock', 'LOCK', '#4fe07a'], ['sbx-led-clk', 'MIDI CLK', '#ffd23a'], ['sbx-led-din', 'DIN SYNC', '#ffd23a'], ['sbx-led-rec', 'TEMPO REC', '#ff3b2f'], ['sbx-led-smpte', 'SMPTE IN', '#4fe07a']].forEach(([id, l, c], k) => { led(id, 140, 104 + k * 9, c); lbl(146, 105.5 + k * 9, l, 11, INKL, 'start'); });
    // ---- numeric keypad (beige keys, wide ENTER)
    const kp = (n, l, px, py, wpx = 24) => {
      const x = X(px) - 12 * S, y = Y(py) - 12 * S, w = wpx * S, hh = 24 * S;
      p(`<g data-sbx="${n}" style="cursor:pointer">`);
      rect(x + 3, y + 6, w, hh, '#000', 'opacity="0.4" rx="6"'); rect(x, y, w, hh, '#b8aa84', 'rx="6"'); rect(x + 5, y + 5, w - 10, hh - 10, '#cdbf98', 'rx="4"'); rect(x + 5, y + 5, w - 10, (hh - 10) * 0.35, '#fff', 'opacity="0.3" rx="4"');
      text(x + w / 2, y + hh / 2 + 14, l, l.length > 1 ? 28 : 40, INKD, 'middle', 800);
      p('</g>');
    };
    [['7', 486, 246], ['8', 514, 246], ['9', 542, 246], ['4', 486, 274], ['5', 514, 274], ['6', 542, 274], ['1', 486, 302], ['2', 514, 302], ['3', 542, 302], ['0', 486, 330]].forEach(([l, px, py]) => kp(`d${l}`, l, px, py));
    kp('ent', 'ENTER', 514, 330, 52);
    key('clr', 458, 330, 11); lbl(458, 344, 'CLEAR', 12, INKD);
    // ---- TAP RESPONSE slider, START (TAP), SUB TAP, STOP / CONTINUE
    rect(X(173), Y(292), X(222) - X(173), Y(352) - Y(292), BAND, 'rx="4"');
    lbl(197, 300, 'TAP RESPONSE', 13);
    p('<g data-sbx="resp" style="cursor:pointer">');
    rect(X(181), Y(306), X(191) - X(181), Y(342) - Y(306), '#1e1f22', 'rx="3"');
    p(`<rect id="sbx-resp" data-y0="${Y(307)}" data-step="${(Y(330) - Y(307)) / 2}" x="${X(181) + 3}" y="${Y(307)}" width="${X(191) - X(181) - 6}" height="${Y(319) - Y(307)}" rx="2" fill="#d9c79a"/>`);
    p('</g>');
    [['QUICK', 312], ['MEDIUM', 323.5], ['SLOW', 335]].forEach(([l, py]) => lbl(196, py, l, 12, INKL, 'start'));
    const bigKey = (n, px, py, title, under) => {
      if (title) { rect(X(px) - 15 * S, Y(298), 30 * S, Y(307) - Y(298), BAND, 'rx="2"'); lbl(px, 304.5, title, 14, '#fff'); }
      const x = X(px) - 12.5 * S, y = Y(py) - 12.5 * S, s = 25 * S;
      p(`<g data-sbx="${n}" style="cursor:pointer">`);
      rect(x + 3, y + 6, s, s, '#000', 'opacity="0.45" rx="5"'); rect(x, y, s, s, '#9fa2a4', 'rx="5"'); rect(x + 6, y + 6, s - 12, s - 12, '#d8d9d5', 'rx="3"'); rect(x + 6, y + 6, s - 12, (s - 12) * 0.4, '#fff', 'opacity="0.45" rx="3"');
      p(`<g data-sbxl="${n}" opacity="0" pointer-events="none"><rect x="${x + 6}" y="${y + 6}" width="${s - 12}" height="${s - 12}" rx="3" fill="#ffb02e" filter="url(#glow)"/></g>`);
      p('</g>');
      if (under) lbl(px, 345, under, 14, INKD);
    };
    bigKey('tap', 237, 322, 'START', 'TAP'); bigKey('subtap', 280, 322, '', 'SUB TAP'); bigKey('stopcont', 320, 322, 'STOP/CONT', '');
    // ======================= REAR PANEL (beside the front) =======================
    const RX = 2140, RY0 = 90, RW = 1600, RH = 700;
    text(RX, RY0 - 20, 'REAR PANEL', 24, '#9c9384', 'start', 800, 'letter-spacing="4"');
    rect(RX + 14, RY0 + 20, RW, RH, '#000', 'opacity="0.5" filter="url(#soft)"');
    rect(RX, RY0, RW, RH, '#2c2e31', 'rx="10"'); rect(RX, RY0, RW, 4, '#fff', 'opacity="0.1"');
    const din = (cx, cy, l1, l2) => { circle(cx, cy, 44, '#0d0e0f'); circle(cx, cy, 38, '#9a9da2'); circle(cx, cy, 28, '#141516'); for (let k = 0; k < 5; k++) { const a = (200 + k * 35) * Math.PI / 180; circle(cx + 15 * Math.cos(a), cy - 15 * Math.sin(a), 4, '#c9a54a'); } text(cx, cy + 76, l1, 20, '#e6e2d8', 'middle', 800); if (l2) text(cx, cy + 100, l2, 17, '#9c9384', 'middle', 700); };
    const jack = (cx, cy, l1, l2) => { circle(cx, cy, 28, '#0d0e0f'); circle(cx, cy, 22, '#b9bcc0'); circle(cx, cy, 10, '#080808'); text(cx, cy + 60, l1, 19, '#e6e2d8', 'middle', 800); if (l2) text(cx, cy + 84, l2, 16, '#9c9384', 'middle', 700); };
    const grp = (x, y, w, hh, t) => { rect(x, y, w, hh, 'none', 'stroke="#55585c" stroke-width="2" rx="8"'); text(x + 18, y + 32, t, 19, '#e8a84a', 'start', 900, 'letter-spacing="3"'); };
    grp(RX + 30, RY0 + 30, 760, 290, 'MIDI'); din(RX + 150, RY0 + 160, 'MIDI IN', ''); din(RX + 410, RY0 + 160, 'MIDI OUT 1', 'clock · song pos'); din(RX + 670, RY0 + 160, 'MIDI OUT 2', 'clock · song pos');
    grp(RX + 810, RY0 + 30, 760, 290, 'SYNC (DIN)  ·  SMPTE'); din(RX + 920, RY0 + 160, 'SYNC OUT 1', '24 ppq'); din(RX + 1130, RY0 + 160, 'SYNC OUT 2', '24 ppq'); jack(RX + 1320, RY0 + 140, 'SMPTE OUT', '→ TRACK 24'); jack(RX + 1480, RY0 + 140, 'SMPTE IN', '← TRACK 24');
    grp(RX + 30, RY0 + 340, 1000, 330, 'CASSETTE · AUX'); jack(RX + 140, RY0 + 450, 'CASSETTE', 'OUT'); jack(RX + 330, RY0 + 450, 'CASSETTE', 'IN'); jack(RX + 520, RY0 + 450, 'TIME BASE', 'OUT'); jack(RX + 710, RY0 + 450, 'METRONOME', 'OUT'); jack(RX + 900, RY0 + 450, 'AUDIO IN', 'click / tap');
    grp(RX + 1050, RY0 + 340, 520, 330, 'FOOT SWITCH · POWER'); jack(RX + 1150, RY0 + 450, 'START', ''); jack(RX + 1310, RY0 + 450, 'STOP /', 'CONTINUE'); rect(RX + 1420, RY0 + 410, 120, 90, '#0d0e0f', 'rx="8"'); text(RX + 1480, RY0 + 540, 'AC IN', 19, '#e6e2d8', 'middle', 800);
    // ======================= how it's used here =======================
    const wrap = (s, n) => { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; } if (line.trim()) out.push(line.trim()); return out; };
    const hy = 880;
    text(RX, hy, 'IN THIS STUDIO', 24, '#9c9384', 'start', 800, 'letter-spacing="4"');
    const steps = [
      'STRIPE  Press WRITE, arm track 24 on the autolocator (black key 24), then PLAY + RECORD on the tape machine. SMPTE is printed to track 24; re-striping part of the tape continues the code.',
      'PROGRAM  Set the tempo with the TEMPO knob, START (TAP) or the keypad (BPM, ENTER). TIME SIG then two digits sets the meter. EDIT + BACK / FWD steps measures; INS / DEL / COPY edit the tempo map.',
      'LOCK  Press SMPTE for EXT and play the tape. The box reads track 24 and sends a steady MIDI clock, song position and DIN sync to the drum machines and sequencers. Vari-speed bends the clock with the tape.',
      'TAP IN  With EXT SMPTE locked, press RECORD and tap along to the tape: each tap writes the tempo from that measure on, so the machines follow the drummer.',
      'SMPTE OFFSET sets bar 1 to the current SMPTE position (default 00:00:02:00). MANUAL runs the internal clock (COUNT IN gives two measures). SAVE / VERIFY / LOAD keep the tempo map. T taps while this view is open.',
    ];
    let ly = hy + 50;
    steps.forEach((s) => { wrap(s, 96).forEach((l) => { text(RX, ly, l, 22, '#d9d3c7', 'start', 600); ly += 32; }); ly += 12; });
    p(`<text id="sbx-out" x="${RX}" y="${ly + 30}" font-family="${MONO}" font-size="22" font-weight="700" fill="${VFD}">OUTPUTS</text>`);
    p(`<text id="sbx-out2" x="${RX}" y="${ly + 64}" font-family="${MONO}" font-size="22" font-weight="700" fill="${VFD}"></text>`);
  });
};
