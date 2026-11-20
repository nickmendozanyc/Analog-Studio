// Rowan SBX-80 sync box: full-size front and rear panels for the pop-up view.
// Modelled on the 1985 reviews of the original: 19" rack unit, two-tone grey with orange legends, two green
// fluorescent display windows (9-digit left, tempo / frames right), illuminated perspex keys, TEMPO knob,
// START/TAP with a QUICK / MEDIUM / SLOW response switch, numeric keypad, three small knobs (metronome level,
// audio-in level, time-base select), cassette SAVE / VERIFY / LOAD, TOTAL TIME. Rear: MIDI IN, 2 MIDI OUT,
// 2 DIN SYNC OUT, SMPTE IN / OUT, cassette IN / OUT, time-base out, metronome out, audio in, footswitches.
// Controls are <g data-sbx="name"> groups; lamps are <g data-sbxl="name"> lit copies the page fades in.

module.exports = function buildSBX(h, { W, OVH }) {
  const { p, rect, text, circle, capture } = h;
  const OR = '#f0a040', DARK = '#3a3c40', LIGHT = '#8e9093', VFD = '#7dffd6', MONO = "'JetBrains Mono', monospace";
  const PX = 120, PY = 120, PW = 3600, PH = 820;
  const key = (name, x, y, w, hh, l1, l2 = '', lamp = '#ff6a3c', onDark = true) => {
    p(`<g data-sbx="${name}" style="cursor:pointer">`);
    rect(x + 2, y + 5, w, hh, '#000', 'opacity="0.55" rx="5"');
    rect(x, y, w, hh, '#cfd2d4', 'rx="5"'); rect(x + 4, y + 4, w - 8, hh - 8, '#e9ebec', 'rx="3"'); rect(x + 4, y + 4, w - 8, (hh - 8) * 0.4, '#fff', 'opacity="0.5" rx="3"');
    p(`<g data-sbxl="${name}" opacity="0" pointer-events="none"><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${hh - 8}" rx="3" fill="${lamp}" filter="url(#glow)"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${(hh - 8) * 0.4}" rx="3" fill="#fff" opacity="0.45"/></g>`);
    p('</g>');
    const lc = onDark ? OR : '#1e1f22';
    text(x + w / 2, y + hh + 26, l1, 20, lc, 'middle', 800, 'letter-spacing="1"');
    if (l2) text(x + w / 2, y + hh + 50, l2, 20, lc, 'middle', 800, 'letter-spacing="1"');
  };
  const led = (id, x, y, col, label, onDark = true) => {
    circle(x, y, 9, '#1a1414'); p(`<circle id="${id}" cx="${x}" cy="${y}" r="8" fill="${col}" opacity="0" filter="url(#glow)"/>`);
    if (label) text(x, y + 34, label, 18, onDark ? OR : '#1e1f22', 'middle', 800, 'letter-spacing="1"');
  };
  const knob = (name, id, cx, cy, r, label, ticks = 11, onDark = true, labelY = null) => {
    for (let k = 0; k < ticks; k++) { const a = (-150 + k * 300 / (ticks - 1) - 90) * Math.PI / 180; p(`<line x1="${(cx + (r + 10) * Math.cos(a)).toFixed(1)}" y1="${(cy + (r + 10) * Math.sin(a)).toFixed(1)}" x2="${(cx + (r + 22) * Math.cos(a)).toFixed(1)}" y2="${(cy + (r + 22) * Math.sin(a)).toFixed(1)}" stroke="${onDark ? OR : '#1e1f22'}" stroke-width="3"/>`); }
    p(`<g data-sbx="${name}" style="cursor:pointer">`);
    circle(cx + 4, cy + 8, r + 3, '#000', 'opacity="0.5"'); circle(cx, cy, r, '#111214'); circle(cx, cy, r, 'url(#capHiDark)'); circle(cx, cy, r * 0.62, '#1d1e21');
    p(`<line id="${id}" data-cx="${cx}" data-cy="${cy}" x1="${cx}" y1="${cy - r * 0.2}" x2="${cx}" y2="${cy - r * 0.92}" stroke="#f2f2f2" stroke-width="${Math.max(4, r * 0.12)}" stroke-linecap="round" transform="rotate(0 ${cx} ${cy})"/>`);
    p('</g>');
    text(cx, labelY ?? cy + r + 56, label, 20, onDark ? OR : '#1e1f22', 'middle', 800, 'letter-spacing="1"');
  };
  const vfd = (x, y, w, hh, id, size, anchor = 'start') => {
    rect(x - 10, y - 10, w + 20, hh + 20, '#0c0d0e', 'rx="8"');
    rect(x, y, w, hh, '#041311', 'rx="4"'); rect(x, y, w, hh * 0.35, '#fff', 'opacity="0.04" rx="4"');
    p(`<text id="${id}" x="${anchor === 'end' ? x + w - 24 : x + 24}" y="${y + hh * 0.72}" font-family="${MONO}" font-size="${size}" font-weight="700" fill="${VFD}" text-anchor="${anchor}" filter="url(#glowSm)" letter-spacing="6">--</text>`);
  };

  return capture(() => {
    rect(0, 0, W, OVH, '#141210');
    // ======================= FRONT PANEL =======================
    p(`<g transform="translate(${PX} ${PY})">`);
    rect(14, 24, PW, PH, '#000', 'opacity="0.5" filter="url(#soft)"');
    rect(0, 0, PW, PH, DARK, 'rx="10"'); rect(0, 500, PW, PH - 500, LIGHT, 'rx="10"'); rect(0, 500, PW, 20, LIGHT);
    rect(0, 498, PW, 4, '#000', 'opacity="0.35"'); rect(0, 0, PW, 4, '#fff', 'opacity="0.12"');
    for (const [sx, sy] of [[40, 40], [PW - 40, 40], [40, PH - 40], [PW - 40, PH - 40]]) { circle(sx, sy, 14, '#9a9da2'); circle(sx, sy, 14, 'url(#capHiDark)'); p(`<line x1="${sx - 9}" y1="${sy}" x2="${sx + 9}" y2="${sy}" stroke="#333" stroke-width="3"/>`); }
    // brand
    text(90, 110, 'Rowan', 64, OR, 'start', 900, 'font-style="italic"');
    text(92, 152, 'SBX-80', 40, '#f2f2f2', 'start', 900, 'letter-spacing="3"');
    text(92, 186, 'SYNC BOX', 22, OR, 'start', 800, 'letter-spacing="6"');
    // display windows: left 9-digit, right tempo / frames; labels change with the display mode
    p(`<text id="sbx-ll" x="420" y="74" font-family="Archivo, Arial, sans-serif" font-size="20" font-weight="800" fill="${OR}" letter-spacing="3">SONG   MEASURE   BEAT</text>`);
    p(`<text id="sbx-rl" x="2210" y="74" font-family="Archivo, Arial, sans-serif" font-size="20" font-weight="800" fill="${OR}" letter-spacing="3" text-anchor="end">TEMPO</text>`);
    vfd(420, 92, 1220, 150, 'sbx-l', 108);
    vfd(1700, 92, 510, 150, 'sbx-r', 108, 'end');
    p(`<text id="sbx-msg" x="420" y="290" font-family="${MONO}" font-size="24" font-weight="700" fill="${VFD}" opacity="0.9">MANUAL</text>`);
    // status LEDs
    [['sbx-led-lock', '#4fe07a', 'LOCK'], ['sbx-led-smpte', '#4fe07a', 'SMPTE IN'], ['sbx-led-gen', '#ff3b2f', 'SMPTE OUT'], ['sbx-led-clk', '#ffd23a', 'MIDI CLOCK'], ['sbx-led-din', '#ffd23a', 'DIN SYNC'], ['sbx-led-beat', '#ff6a3c', 'BEAT'], ['sbx-led-rec', '#ff3b2f', 'REC']].forEach(([id, c, l], k) => led(id, 1300 + k * 130, 262, c, l));
    // display / frame-rate keys under the windows
    key('disp', 2290, 100, 110, 70, 'DISPLAY'); ['1', '2', '3'].forEach((n, k) => { led(`sbx-led-d${n}`, 2300 + k * 45, 222, '#ff6a3c', ''); text(2300 + k * 45, 250, n, 18, OR, 'middle', 800); });
    key('frame', 2450, 100, 110, 70, 'FRAME'); p(`<text id="sbx-fr" x="2505" y="236" font-family="${MONO}" font-size="24" font-weight="700" fill="${VFD}" text-anchor="middle">25</text>`);
    // three small knobs top right: metronome level, audio in level, time base
    knob('metro', 'sbx-k-metro', 2720, 150, 42, 'METRONOME');
    knob('audio', 'sbx-k-audio', 2940, 150, 42, 'AUDIO IN');
    knob('tb', 'sbx-k-tb', 3200, 140, 52, 'TIME BASE (PPQ)', 9, true, 300);
    ['1', '2', '3', '4', '24', '48', '64', '96', '120'].forEach((v, k) => { const a = (-150 + k * 300 / 8 - 90) * Math.PI / 180; text((3200 + 104 * Math.cos(a)).toFixed(0), (140 + 104 * Math.sin(a) + 7).toFixed(0), v, 18, OR, 'middle', 800); });
    // function keys (top half, below the displays)
    const fy = 350;
    [['manual', 'MANUAL', ''], ['smpte', 'EXT', 'SMPTE'], ['gen', 'SMPTE', 'WRITE'], ['start', 'START', 'TIME'], ['play', 'PLAY', ''], ['rec', 'RECORD', ''], ['stop', 'STOP', ''], ['cont', 'CONT', ''], ['edit', 'EDIT', ''], ['insert', 'INSERT', ''], ['delete', 'DELETE', ''], ['copy', 'COPY', ''], ['sig', 'TIME', 'SIG'], ['total', 'TOTAL', 'TIME'], ['save', 'SAVE', ''], ['verify', 'VERIFY', ''], ['load', 'LOAD', '']].forEach(([n, a, b], k) => {
      const x = 420 + k * 188 + (k >= 4 ? 30 : 0) + (k >= 8 ? 30 : 0) + (k >= 14 ? 30 : 0);
      key(n, x, fy, 130, 64, a, b, n === 'rec' || n === 'gen' ? '#ff3b2f' : n === 'play' || n === 'smpte' || n === 'manual' ? '#59f07a' : '#ffb02e');
    });
    text(420, 338, 'SYNC SOURCE', 16, OR, 'start', 800, 'letter-spacing="3"');
    text(1210, 338, 'TEMPO PROGRAM', 16, OR, 'start', 800, 'letter-spacing="3"');
    text(1970, 338, 'EDIT', 16, OR, 'start', 800, 'letter-spacing="3"');
    text(3082, 338, 'CASSETTE', 16, OR, 'start', 800, 'letter-spacing="3"');
    // ---- lower (light) half: TEMPO knob, START/TAP with response switch, measure keys, keypad, power
    knob('tempo', 'sbx-k-tempo', 300, 650, 92, 'TEMPO', 11, false);
    text(190, 548, 'SLOW', 18, '#1e1f22', 'end', 800); text(410, 548, 'FAST', 18, '#1e1f22', 'start', 800);
    key('tap', 560, 570, 240, 150, 'START / TAP', '', '#ffb02e', false);
    p('<g data-sbx="resp" style="cursor:pointer">');
    rect(860, 600, 46, 150, '#1e1f22', 'rx="6"');
    p(`<rect id="sbx-resp" x="864" y="604" width="38" height="44" rx="4" fill="#d9dbde"/>`);
    p('</g>');
    [['QUICK', 626], ['MEDIUM', 676], ['SLOW', 726]].forEach(([l, y]) => text(920, y + 6, l, 18, '#1e1f22', 'start', 800));
    text(883, 790, 'TAP RESPONSE', 16, '#1e1f22', 'middle', 800);
    key('left', 1120, 600, 110, 90, '◀ MEAS', '', '#ffb02e', false);
    key('right', 1250, 600, 110, 90, 'MEAS ▶', '', '#ffb02e', false);
    const kx0 = 1500;
    [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['0', 'CLR', 'ENT']].forEach((row, r) => row.forEach((l, c) => {
      const n = l === 'CLR' ? 'clr' : l === 'ENT' ? 'ent' : `d${l}`, x = kx0 + c * 128 + r * 0, y = 540 + r * 0;
      const cx2 = kx0 + (r * 3 + c) * 116;
      key(n, cx2, 600, 96, 90, l, '', '#ffb02e', false);
    }));
    text(kx0, 570, 'NUMERIC ENTRY  ·  BPM, MEASURES, TIME SIGNATURE', 16, '#1e1f22', 'start', 800, 'letter-spacing="2"');
    // power switch
    rect(3320, 590, 180, 120, '#1e1f22', 'rx="8"'); rect(3340, 610, 140, 80, '#c8352a', 'rx="4"'); rect(3340, 610, 140, 30, '#fff', 'opacity="0.2" rx="4"');
    text(3410, 750, 'POWER', 18, '#1e1f22', 'middle', 800, 'letter-spacing="2"');
    p('</g>');

    // ======================= REAR PANEL =======================
    const RY = 1060, RH = 420;
    p(`<g transform="translate(${PX} ${RY})">`);
    text(0, -20, 'REAR PANEL', 24, '#9c9384', 'start', 800, 'letter-spacing="4"');
    rect(14, 20, PW, RH, '#000', 'opacity="0.5" filter="url(#soft)"');
    rect(0, 0, PW, RH, '#2c2e31', 'rx="10"'); rect(0, 0, PW, 4, '#fff', 'opacity="0.1"');
    const din = (cx, cy, l1, l2) => { circle(cx, cy, 46, '#0d0e0f'); circle(cx, cy, 40, '#9a9da2'); circle(cx, cy, 30, '#141516'); for (let k = 0; k < 5; k++) { const a = (180 + k * 45) * Math.PI / 180; circle(cx + 16 * Math.cos(a), cy - 16 * Math.sin(a) * -1 * -1, 4, '#c9a54a'); } rect(cx - 6, cy - 34, 12, 8, '#9a9da2'); text(cx, cy + 82, l1, 20, '#e6e2d8', 'middle', 800); if (l2) text(cx, cy + 106, l2, 18, '#9c9384', 'middle', 700); };
    const jack = (cx, cy, l1, l2) => { circle(cx, cy, 30, '#0d0e0f'); circle(cx, cy, 24, '#b9bcc0'); circle(cx, cy, 11, '#080808'); text(cx, cy + 66, l1, 20, '#e6e2d8', 'middle', 800); if (l2) text(cx, cy + 90, l2, 18, '#9c9384', 'middle', 700); };
    rect(60, 60, 920, 300, 'none', 'stroke="#55585c" stroke-width="2" rx="8"'); text(80, 92, 'MIDI', 20, OR, 'start', 900, 'letter-spacing="3"');
    din(200, 190, 'MIDI IN', ''); din(480, 190, 'MIDI OUT 1', 'clock · song pos'); din(760, 190, 'MIDI OUT 2', 'clock · song pos');
    rect(1020, 60, 640, 300, 'none', 'stroke="#55585c" stroke-width="2" rx="8"'); text(1040, 92, 'SYNC (DIN)', 20, OR, 'start', 900, 'letter-spacing="3"');
    din(1180, 190, 'SYNC OUT 1', '24 ppq'); din(1480, 190, 'SYNC OUT 2', '24 ppq');
    rect(1700, 60, 640, 300, 'none', 'stroke="#55585c" stroke-width="2" rx="8"'); text(1720, 92, 'SMPTE', 20, OR, 'start', 900, 'letter-spacing="3"');
    jack(1840, 180, 'SMPTE OUT', '→ TAPE TRACK 24 IN'); jack(2180, 180, 'SMPTE IN', '← TAPE TRACK 24 OUT');
    rect(2380, 60, 520, 300, 'none', 'stroke="#55585c" stroke-width="2" rx="8"'); text(2400, 92, 'CASSETTE · AUX', 20, OR, 'start', 900, 'letter-spacing="3"');
    jack(2480, 160, 'CASSETTE', 'OUT'); jack(2640, 160, 'CASSETTE', 'IN'); jack(2800, 160, 'TIME BASE', 'OUT');
    jack(2480, 290, 'METRONOME', 'OUT'); jack(2640, 290, 'AUDIO IN', 'click / tap');
    rect(2940, 60, 400, 300, 'none', 'stroke="#55585c" stroke-width="2" rx="8"'); text(2960, 92, 'FOOT SWITCH', 20, OR, 'start', 900, 'letter-spacing="3"');
    jack(3040, 180, 'START', ''); jack(3240, 180, 'STOP /', 'CONTINUE');
    rect(3400, 140, 140, 120, '#0d0e0f', 'rx="10"'); text(3470, 300, 'AC IN', 20, '#e6e2d8', 'middle', 800);
    p('</g>');
    // ======================= hookup + how-to =======================
    const hy = 1620;
    text(PX, hy, 'IN THIS STUDIO', 24, '#9c9384', 'start', 800, 'letter-spacing="4"');
    const steps = [
      '1  STRIPE   Press SMPTE WRITE, arm track 24 on the autolocator (black key 24), then PLAY + RECORD on the tape machine. Code is printed to track 24 from the head of the tape.',
      '2  PROGRAM  Set the tempo with the TEMPO knob, START/TAP or the keypad (type BPM, ENT). TIME SIG then two digits sets the meter. EDIT + ◀ ▶ steps measures; INSERT / DELETE / COPY edit the tempo map.',
      '3  LOCK     Select EXT SMPTE and play the tape. The box reads track 24 and sends a steady MIDI clock, song position and DIN sync to the drum machines and sequencers. Vari-speed bends the clock with the tape.',
      '4  TAP IN   With EXT SMPTE locked, press RECORD and tap along to the tape: every tap writes the tempo into that measure, so the machines follow the drummer.',
      'START TIME sets bar 1 to the current SMPTE position (default 00:00:02:00).  SAVE / VERIFY / LOAD keep the tempo map.  T taps while this view is open.',
    ];
    steps.forEach((t, k) => text(PX, hy + 50 + k * 46, t, 24, '#d9d3c7', 'start', 600));
    // live outputs readout
    p(`<text id="sbx-out" x="${PX}" y="${hy + 50 + steps.length * 46 + 36}" font-family="${MONO}" font-size="24" font-weight="700" fill="${VFD}">OUTPUTS</text>`);
  });
};
