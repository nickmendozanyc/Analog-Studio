  // ---------------- Rowan TR-8080: the front panel's working (after the TR-808 owner's manual, in short) ----------------
  // MODE: CLEAR / 1st PART / 2nd PART (write) / MANUAL / PLAY. INSTRUMENT SELECT picks the voice to write (AC = accent).
  // The voices and the sequencer run in the tape machine's audio engine (tr808.js), sample-accurate; this side holds the
  // patterns and the knobs and sends them over. SYNC: internal, or DIN sync from the SBX-80 (locked to the tape).
  const TR_SEL = ['AC', ...TR_INST];
  function trFactory() {   // a few patterns to start with (written here)
    const pats = Array.from({ length: 16 }, trEmptyPattern);
    const put = (pt, part, k, steps) => { for (const s of steps) pats[pt][part].steps[k][s] = 1; };
    // 1: a slow electro groove
    put(0, 'A', 'BD', [0, 10]); put(0, 'A', 'SD', [4, 12]); put(0, 'A', 'CH', [0, 2, 4, 6, 8, 10, 12]); put(0, 'A', 'OH', [14]); put(0, 'A', 'AC', [4, 12]);
    put(0, 'B', 'BD', [0, 7, 10]); put(0, 'B', 'SD', [4, 12, 15]); put(0, 'B', 'CH', [0, 2, 4, 6, 8, 10, 12, 14]); put(0, 'B', 'CP', [12]); put(0, 'B', 'AC', [4, 12]);
    // 2: four on the floor
    for (const part of ['A', 'B']) { put(1, part, 'BD', [0, 4, 8, 12]); put(1, part, 'CP', [4, 12]); put(1, part, 'OH', [2, 6, 10, 14]); put(1, part, 'AC', [0, 8]); }
    put(1, 'B', 'CB', [3, 7, 11]); put(1, 'B', 'CY', [0]);
    // 3: busy hats, cowbell
    put(2, 'A', 'BD', [0, 3, 6, 10]); put(2, 'A', 'SD', [4, 12]); put(2, 'A', 'CH', [...Array(16).keys()]); put(2, 'A', 'CB', [2, 9]); put(2, 'A', 'AC', [0, 4, 8, 12]);
    put(2, 'B', 'BD', [0, 3, 6, 11]); put(2, 'B', 'SD', [4, 12, 14]); put(2, 'B', 'CH', [...Array(16).keys()]); put(2, 'B', 'RS', [7, 15]); put(2, 'B', 'AC', [0, 4, 8, 12]);
    // 4: congas and claves
    for (const part of ['A', 'B']) { put(3, part, 'BD', [0, 8]); put(3, part, 'RS', [0, 3, 6, 10, 12]); put(3, part, 'LT', [2, 10]); put(3, part, 'MT', [6, 14]); put(3, part, 'HT', [4, 7, 12]); put(3, part, 'CH', [0, 4, 8, 12]); }
    // 13 / 14: intro / fill-in patterns (A and B)
    put(12, 'A', 'SD', [8, 10, 12, 13, 14, 15]); put(12, 'A', 'BD', [0, 6]); put(12, 'A', 'AC', [12, 14]); put(12, 'B', 'HT', [8, 9]); put(12, 'B', 'MT', [10, 11]); put(12, 'B', 'LT', [12, 13, 14]); put(12, 'B', 'BD', [0]);
    put(13, 'A', 'BD', [0, 4]); put(13, 'A', 'CY', [0]); put(13, 'A', 'CP', [8, 10, 11, 12, 14]); put(13, 'B', 'CY', [0]); put(13, 'B', 'RS', [2, 5, 8, 11, 14]);
    return pats;
  }
  // MODE (as on the real one): 0 PATTERN CLEAR, 1 1st PART, 2 2nd PART (write A / B), 3 MANUAL PLAY, 4 PLAY (a rhythm track), 5 COMPOSE (write one)
  const TR_MODES = ['PATTERN CLEAR', '1st PART (write A)', '2nd PART (write B)', 'MANUAL PLAY', 'PLAY (rhythm track)', 'COMPOSE (rhythm track)'], TR_FILLS = [0, 2, 4, 8, 12, 16], TR_PRE = [6, 8, 4, 3];
  const TR = { p: trDefaults(), patterns: trFactory(), pat: 0, mode: 3, inst: 1, fillPos: 0, pre: 3, tracks: [[], [], [], []], cPat: 0, stepno: false, node: null, t: 0 };
  try { const sv = JSON.parse(localStorage.getItem('as-tr808') || 'null'); if (sv && sv.p) { for (const k in sv.p) { if (typeof sv.p[k] === 'object') Object.assign(TR.p[k] || (TR.p[k] = {}), sv.p[k]); else TR.p[k] = sv.p[k]; } TR.patterns = sv.patterns || TR.patterns; TR.pat = sv.pat || 0; TR.tracks = sv.tracks || TR.tracks; TR.fillPos = sv.fillPos || 0; TR.pre = sv.pre || 3; } } catch (e) { /* storage unavailable */ }
  let trSaveT = 0; const trSave = () => { clearTimeout(trSaveT); trSaveT = setTimeout(() => { try { localStorage.setItem('as-tr808', JSON.stringify({ p: TR.p, patterns: TR.patterns, pat: TR.pat, tracks: TR.tracks, fillPos: TR.fillPos, pre: TR.pre })); } catch (e) { /* ignore */ } }, 400); };
  const trPost = (o) => elPost({ type: 'tr808', ...o });
  const trSay = (t) => { const m = document.getElementById('tr-msg'); if (m) m.textContent = t; };
  const trTrackNo = () => Math.min(TR.inst, 3);   // in PLAY / COMPOSE the INSTRUMENT-SELECT picks rhythm track 1-4
  const trWrite = () => TR.mode === 1 || TR.mode === 2, trPart = () => (TR.mode === 2 ? 'B' : 'A');
  const trSendTrack = () => trPost({ track: TR.tracks[trTrackNo()], trackMode: TR.mode === 4 });
  const trSendAll = () => { trPost({ set: { ...TR.p, autoFill: TR_FILLS[TR.fillPos], spb: TR_PRE[TR.pre - 1] }, patterns: TR.patterns, pat: TR.pat, sync: null }); trSendTrack(); };
  const TR_KN = { tempo: [40, 300], fine: [-1, 1], master: [0, 1], accent: [0, 1] };
  const trGet = (k) => { if (k.includes('.')) { const [a, b] = k.split('.'); return TR.p[a][b]; } return k === 'fine' ? (TR.fine || 0) : TR.p[k]; };
  function trSetK(k, v) {
    const [lo, hi] = TR_KN[k] || [0, 1]; v = Math.max(lo, Math.min(hi, v));
    if (k === 'fine') { const d = v - (TR.fine || 0); TR.fine = v; TR.p.tempo = Math.max(40, Math.min(300, TR.p.tempo + d * 4)); trPost({ set: { tempo: TR.p.tempo } }); }
    else if (k.includes('.')) { const [a, b] = k.split('.'); TR.p[a][b] = v; trPost({ set: { [a]: { [b]: v } } }); }
    else { TR.p[k] = v; trPost({ set: { [k]: v } }); }
    trSave(); trKnobs(); trSay(k === 'tempo' || k === 'fine' ? `TEMPO ${TR.p.tempo.toFixed(1)} BPM` : `${k.replace('.', ' ').toUpperCase()} ${(v * 10).toFixed(1)}`);
  }
  const rot = (el, deg) => { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(el.getAttribute('transform') || ''); if (m) el.setAttribute('transform', `rotate(${deg.toFixed(1)} ${m[1]} ${m[2]})`); };
  function trKnobs() {
    document.querySelectorAll('[data-trk]').forEach((g) => { const k = g.dataset.trk, [lo, hi] = TR_KN[k] || [0, 1], r = g.querySelector('[class^="tr-k-"]'); if (r) rot(r, -135 + (trGet(k) - lo) / (hi - lo) * 270); });
    for (const [cls, v, n] of [['tr-r-mode', TR.mode, 6], ['tr-r-inst', TR.inst, 12], ['tr-r-fill', TR.fillPos, 6]]) for (const r of document.querySelectorAll('.' + cls)) rot(r, -120 + v * 240 / (n - 1));
    for (const [k, sw] of [['LT', 'conga'], ['MT', 'conga'], ['HT', 'conga'], ['RS', 'claves'], ['CP', 'maracas']]) for (const e of document.querySelectorAll(`.tr-w-${k}`)) { const y0 = +(e.dataset.y0 || (e.dataset.y0 = e.getAttribute('y'))), h = +e.getAttribute('height'); e.setAttribute('y', TR.p[k][sw] ? y0 + h * 1.2 : y0); }
    for (const e of document.querySelectorAll('.tr-var')) { const x0 = +(e.dataset.x0 || (e.dataset.x0 = e.getAttribute('x'))), w = +e.getAttribute('width'); e.setAttribute('x', x0 + ({ A: 0, AB: 1, B: 2 })[TR.p.var] * w * 0.97); }
    for (const e of document.querySelectorAll('.tr-ifv')) { const x0 = +(e.dataset.x0 || (e.dataset.x0 = e.getAttribute('x'))), w = +e.getAttribute('width'); e.setAttribute('x', TR.p.ifVar === 'B' ? x0 + w * 1.1 : x0); }
    for (const e of document.querySelectorAll('.tr-pre')) { const y0 = +(e.dataset.y0 || (e.dataset.y0 = e.getAttribute('y'))), h = +e.getAttribute('height'); e.setAttribute('y', y0 + (TR.pre - 1) * h * 1.05); }
    const sb = document.querySelector('[data-trx="sync"] .v'); if (sb) sb.textContent = TR.p.sync === 'din' ? 'DIN SYNC · SBX-80' : 'INTERNAL';
  }
  document.querySelectorAll('[data-trk]').forEach((g) => {
    const k = g.dataset.trk, [lo, hi] = TR_KN[k] || [0, 1], span = hi - lo;
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId); const y0 = e.clientY, v0 = trGet(k);
      const mv = (ev) => trSetK(k, v0 + (y0 - ev.clientY) / (ev.shiftKey ? 900 : 200) * span);
      const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); if (k === 'fine') TR.fine = 0; };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); });
    g.addEventListener('wheel', (e) => { e.preventDefault(); trSetK(k, trGet(k) - Math.sign(e.deltaY) * span / (k === 'tempo' ? 260 : 50)); }, { passive: false });
    g.addEventListener('dblclick', () => { const D = trDefaults(); trSetK(k, k.includes('.') ? D[k.split('.')[0]][k.split('.')[1]] : k === 'fine' ? 0 : D[k]); });
  });
  document.querySelectorAll('[data-trw]').forEach((g) => g.addEventListener('click', (e) => { e.stopPropagation(); const [a, b] = g.dataset.trw.split('.'); TR.p[a][b] = !TR.p[a][b]; trPost({ set: { [a]: { [b]: TR.p[a][b] } } }); trSave(); trKnobs(); trSay(`${a}: ${TR.p[a][b] ? { conga: 'CONGA', claves: 'CLAVES', maracas: 'MARACAS' }[b] : { conga: 'TOM', claves: 'RIM SHOT', maracas: 'HAND CLAP' }[b]}`); }));
  function trSetMode(v) {
    TR.mode = (v + 6) % 6; TR.stepno = false; if (window.TR_M && window.TR_M.run) trPost({ play: false });
    trSendTrack(); trKnobs();
    trSay(`MODE: ${TR_MODES[TR.mode]}` + (TR.mode === 4 || TR.mode === 5 ? ` · rhythm track ${trTrackNo() + 1} (${TR.tracks[trTrackNo()].length} measures; INSTRUMENT-SELECT AC/BD/SD/LT = tracks 1-4)` : TR.mode === 3 ? ` · pattern ${TR.pat + 1}` : ''));
  }
  document.querySelectorAll('[data-trr]').forEach((g) => {
    const k = g.dataset.trr, n = { mode: 6, inst: 12, fill: 6 }[k];
    const set = (v) => {
      if (k === 'mode') return trSetMode(v);
      if (k === 'inst') { TR.inst = (v + n) % n; trKnobs(); if (TR.mode >= 4) { trSendTrack(); trSay(`RHYTHM TRACK ${trTrackNo() + 1} · ${TR.tracks[trTrackNo()].length} measures`); } else trSay(`INSTRUMENT: ${TR_SEL[TR.inst]}`); return; }
      TR.fillPos = (v + n) % n; trPost({ set: { autoFill: TR_FILLS[TR.fillPos] } }); trSave(); trKnobs(); trSay(TR.fillPos ? `AUTO FILL IN every ${TR_FILLS[TR.fillPos]} measures` : 'FILL IN: MANUAL (TAP)');
    };
    g.addEventListener('click', (e) => { e.stopPropagation(); set((k === 'mode' ? TR.mode : k === 'inst' ? TR.inst : TR.fillPos) + (e.shiftKey ? -1 : 1)); });
    g.addEventListener('wheel', (e) => { e.preventDefault(); set((k === 'mode' ? TR.mode : k === 'inst' ? TR.inst : TR.fillPos) - Math.sign(e.deltaY)); }, { passive: false });
  });
  function trRun(on) {
    if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER();
    if (TR.p.sync === 'din') return trSay('DIN SYNC: it starts and stops with the SBX-80 (play the tape)');
    if (TR.mode === 0 || TR.mode === 5) return trSay(`START works in 1st / 2nd PART, MANUAL PLAY and PLAY`);
    if (TR.mode === 4 && !TR.tracks[trTrackNo()].length) return trSay(`Rhythm track ${trTrackNo() + 1} is empty: write it in COMPOSE`);
    trPost({ play: on }); trSay(on ? (TR.mode === 4 ? `PLAY · rhythm track ${trTrackNo() + 1}` : `PLAY · pattern ${TR.pat + 1}`) : 'STOP');
  }
  document.querySelectorAll('[data-trb]').forEach((g) => g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const k = g.dataset.trb, M = window.TR_M, run = M && M.run;
    if (k === 'start') trRun(!run);
    if (k === 'var') { TR.p.var = { A: 'AB', AB: 'B', B: 'A' }[TR.p.var]; trPost({ set: { var: TR.p.var } }); trSave(); trKnobs(); trSay(`BASIC VARIATION ${TR.p.var}`); }
    if (k === 'ifv') { TR.p.ifVar = TR.p.ifVar === 'A' ? 'B' : 'A'; trPost({ set: { ifVar: TR.p.ifVar } }); trSave(); trKnobs(); trSay(`INTRO / FILL IN VARIATION ${TR.p.ifVar}`); }
    if (k === 'pre') { TR.pre = TR.pre % 4 + 1; trPost({ set: { spb: TR_PRE[TR.pre - 1] } }); trSave(); trKnobs(); trSay(`PRE-SCALE ${TR.pre}: ${['16th-note triplets', '32nd notes', '16th notes', '8th-note triplets'][TR.pre - 1]} per step`); }
    if (k === 'stepno') {   // STEP NUMBER (write: then a step key = the last step) / TRACK CLEAR (compose)
      if (TR.mode === 5) { TR.tracks[trTrackNo()] = []; trSendTrack(); trSave(); trSay(`TRACK CLEAR: rhythm track ${trTrackNo() + 1} is empty`); }
      else if (trWrite()) { TR.stepno = !TR.stepno; trSay(TR.stepno ? 'STEP NUMBER: press the last step key' : 'STEP NUMBER off'); }
      else trSay('STEP NUMBER works in 1st / 2nd PART; TRACK CLEAR in COMPOSE');
    }
    if (k === 'tap') {
      if (trWrite()) { if (run && M.step >= 0) { const key = TR_SEL[TR.inst], S = TR.patterns[TR.pat][trPart()].steps; S[key][M.step] = 1; trPost({ patIx: TR.pat, pattern: TR.patterns[TR.pat] }); trSave(); if (key !== 'AC') trPost({ trig: key }); } else trSay('TAP writes in time: START the pattern first'); }
      else if (TR.mode === 3) { if (run) { trPost({ fillReq: true }); trSay(`FILL IN: pattern ${TR.p.fill - 11} next measure`); } else { trPost({ introReq: true }); trSay(`INTRO SET: pattern ${TR.p.fill - 11} plays first`); } }
      else if (TR.mode === 5) { const tr2 = TR.tracks[trTrackNo()]; if (tr2.length >= 64) return trSay('Rhythm track full (64 measures)'); tr2.push({ pat: TR.cPat, part: TR.p.var === 'B' ? 'B' : 'A' }); trSendTrack(); trSave(); trSay(`Track ${trTrackNo() + 1}: measure ${tr2.length} = pattern ${TR.cPat < 12 ? TR.cPat + 1 : 'I/F ' + (TR.cPat - 11)} ${TR.p.var === 'B' ? 'B' : 'A'}`); }
    }
  }));
  document.querySelectorAll('[data-trs]').forEach((g) => g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const i = +g.dataset.trs, M = window.TR_M;
    if (trWrite()) {
      const P = TR.patterns[TR.pat][trPart()];
      if (TR.stepno) { P.len = i + 1; TR.stepno = false; trPost({ patIx: TR.pat, pattern: TR.patterns[TR.pat] }); trSave(); return trSay(`Last step ${i + 1} (pattern ${TR.pat + 1} ${trPart()})`); }
      const key = TR_SEL[TR.inst]; P.steps[key][i] = P.steps[key][i] ? 0 : 1; trPost({ patIx: TR.pat, pattern: TR.patterns[TR.pat] }); trSave();
    } else if (TR.mode === 3) {
      if (i < 12) { TR.pat = i; trPost({ pat: i }); trSave(); trSay(`BASIC RHYTHM ${i + 1}${M && M.run ? ' (from the next measure)' : ''}`); }
      else { TR.p.fill = i; trPost({ set: { fill: i } }); trSave(); trSay(`INTRO / FILL IN ${i - 11} (TAP: fill in while playing, intro while stopped)`); }
    } else if (TR.mode === 5) { TR.cPat = i; trSay(`COMPOSE: pattern ${i < 12 ? i + 1 : 'I/F ' + (i - 11)} · TAP writes it as measure ${TR.tracks[trTrackNo()].length + 1}`); }
    else if (TR.mode === 0) { TR.patterns[i] = trEmptyPattern(); trPost({ patIx: i, pattern: TR.patterns[i] }); trSave(); trSay(`PATTERN ${i + 1} cleared`); }
    else trSay('PLAY: the rhythm track plays (START / STOP)');
  }));
  document.querySelectorAll('[data-trx]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.trx === 'sync') { TR.p.sync = TR.p.sync === 'din' ? 'int' : 'din'; trPost({ set: { sync: TR.p.sync }, sync: null, play: false }); trSave(); trKnobs(); trSay(TR.p.sync === 'din' ? 'DIN SYNC: follows the SBX-80 (its tempo map), starts and stops with the tape' : 'INTERNAL: START / STOP and TEMPO'); }
    if (b.dataset.trx === 'copy') { const nx = (TR.pat + 1) % 16; TR.patterns[nx] = JSON.parse(JSON.stringify(TR.patterns[TR.pat])); trPost({ patIx: nx, pattern: TR.patterns[nx] }); trSave(); trSay(`Pattern ${TR.pat + 1} copied to ${nx + 1}`); }
  }));
  function trDraw() {
    const M = window.TR_M, now = performance.now(), run = M && M.run, blink = Math.floor(now / 250) % 2 === 0;
    const S = TR.patterns[TR.pat][trPart()].steps, key = TR_SEL[TR.inst];
    for (let i = 0; i < 16; i++) {
      let on = false;
      if (trWrite()) on = TR.stepno ? blink && i === TR.patterns[TR.pat][trPart()].len - 1 : !!S[key][i] !== (!!run && M.step === i && M.part === trPart());
      else if (TR.mode === 3) on = run ? M.step === i || (i === TR.p.fill && (M.inFill || (M.fillReq && blink))) || (i === TR.pat && !M.inFill && blink) : i === TR.pat || (i === TR.p.fill && M && M.fillReq);
      else if (TR.mode === 4) on = run ? M.step === i : false;
      else if (TR.mode === 5) on = i === TR.cPat;
      else on = blink && i === TR.pat;
      c1Lamp(`tr-l${i}`, on);
    }
    c1Lamp('tr-run', !!run && (M.step % 4 === 0));
    c1Lamp('tr-va', run ? M.part === 'A' : TR.p.var !== 'B'); c1Lamp('tr-vb', run ? M.part === 'B' : TR.p.var !== 'A');
    c1Lamp('tr-p1', TR.mode === 1); c1Lamp('tr-p2', TR.mode === 2);
  }
  function tr808Tick() {
    if (EL.node !== TR.node) { TR.node = EL.node; if (EL.node) trSendAll(); }
    if (TR.p.sync === 'din' && EL.node) { const cur = SBX.cur, on = running() && tr.playingMode && cur && cur.beats >= 0; trPost({ sync: { run: !!on, beats: cur ? cur.beats : 0, bpm: cur ? cur.bpm : TR.p.tempo } }); }
    if (isOpen('tr808') || document.body.classList.contains('racksview')) trDraw();
  }
  trKnobs();
