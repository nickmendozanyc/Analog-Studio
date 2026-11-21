  // ---------------- Rowan TR-9090 on the desk in the racks room: its front panel's working ----------------
  // PATTERN WRITE: INST SELECT then a step key picks the voice (the names under the keys; 12 = ACCENT, 13 = FLAM), then
  // the step keys switch its steps. PATTERN PLAY: the step keys pick the pattern (at the end of the bar while running).
  // LAST STEP then a step key sets the pattern's length. SHUFFLE/FLAM then a step key: 1-8 shuffle 0-7, 9-16 flam 0-7.
  // CLEAR empties the selected voice (write). TAP taps the tempo. SYNC: internal or DIN sync from the SBX-80.
  // As on the real one. PATTERN PLAY keys I / II / III pick the pattern group (16 each, 48 in all); SHIFT + one = PATTERN
  // WRITE. TRACK PLAY 1-4 play a track; SHIFT + one = TRACK WRITE (step keys pick a pattern, CARTRIDGE/ENTER writes it as
  // the next measure, CLEAR empties the track). In PATTERN WRITE: INSTRUMENT SELECT then a step key picks the voice (the
  // two keys under a drum: normal / accented entry; 11 RIM SHOT, 12 HAND CLAP, 13 CLOSED HAT, 14 OPEN HAT, 15 CRASH,
  // 16 RIDE; INSTRUMENT SELECT then CARTRIDGE/ENTER = TOTAL ACCENT); the step keys then enter it (again to remove);
  // BACK/TAP enters it in time while running; SHUFFLE/FLAM then step keys mark flam steps; LAST STEP then a key = length;
  // CLEAR empties the voice (SHIFT + CLEAR the pattern). In PATTERN PLAY: SHUFFLE/FLAM then 1-7 = shuffle 0-6 (SHIFT +
  // SHUFFLE/FLAM then a key = flam time); SCALE steps the four step lengths; TEMPO shows the tempo; TAPE SYNC = DIN sync.
  const T9_KEYSEL = [['BD', 1], ['BD', 2], ['SD', 1], ['SD', 2], ['LT', 1], ['LT', 2], ['MT', 1], ['MT', 2], ['HT', 1], ['HT', 2], ['RS', 1], ['CP', 1], ['CH', 1], ['OH', 1], ['CR', 1], ['RD', 1]];
  const T9_SCALES = [6, 8, 4, 3], T9_SCALE_N = ['16th-note triplets', '32nd notes', '16th notes', '8th-note triplets'];
  function t9Factory() {   // a few patterns to start (written here); group I
    const P = Array.from({ length: 48 }, tr9EmptyPattern), put = (i, k, st, v = 1) => { for (const s of st) P[i].steps[k][s] = v; };
    put(0, 'BD', [0, 4, 8, 12], 2); put(0, 'CP', [4, 12]); put(0, 'OH', [2, 6, 10, 14]); put(0, 'CH', [0, 4, 8, 12]);
    put(1, 'BD', [0, 4, 8, 12], 2); put(1, 'SD', [4, 12]); put(1, 'CH', [...Array(16).keys()]); put(1, 'CH', [2, 6, 10, 14], 2); put(1, 'OH', [6, 14]); put(1, 'RD', [2, 10]);
    put(2, 'BD', [0, 7, 10], 2); put(2, 'SD', [4, 12, 15]); put(2, 'SD', [4, 12], 2); put(2, 'CH', [0, 2, 4, 6, 8, 10, 12, 14]); put(2, 'RS', [3, 11]); put(2, 'FL', [15]);
    put(3, 'BD', [0, 4, 8, 12], 2); put(3, 'LT', [9, 13]); put(3, 'MT', [10, 14]); put(3, 'HT', [11, 15]); put(3, 'CR', [0], 2); put(3, 'CP', [4, 12]);
    return P;
  }
  const T9 = { p: tr9Defaults(), patterns: t9Factory(), grp: 0, pat: 0, write: false, sel: 0, selAC: false, fn: null, shift: false, flamEntry: false,
    tracks: [[], [], [], []], trk: 0, trackMode: false, trackWrite: false, twPat: 0, scale: 3, disp: 'tempo', node: null, taps: [], show: null };
  try { const sv = JSON.parse(localStorage.getItem('as-tr909') || 'null'); if (sv && sv.p) { for (const k in sv.p) { if (typeof sv.p[k] === 'object') Object.assign(T9.p[k] || (T9.p[k] = {}), sv.p[k]); else T9.p[k] = sv.p[k]; } if (sv.patterns && sv.patterns.length === 48) T9.patterns = sv.patterns; T9.pat = sv.pat || 0; T9.grp = Math.floor(T9.pat / 16); T9.tracks = sv.tracks || T9.tracks; T9.scale = sv.scale || 3; } } catch (e) { /* storage unavailable */ }
  let t9SaveT = 0; const t9Save = () => { clearTimeout(t9SaveT); t9SaveT = setTimeout(() => { try { localStorage.setItem('as-tr909', JSON.stringify({ p: T9.p, patterns: T9.patterns, pat: T9.pat, tracks: T9.tracks, scale: T9.scale })); } catch (e) { /* ignore */ } }, 400); };
  const t9Post = (o) => elPost({ type: 'tr909', ...o });
  const t9Say = (t, disp) => { const m = document.getElementById('t9-msg'); if (m) m.textContent = 'TR-9090 · ' + t; if (disp) T9.show = { t: disp, until: performance.now() + 1200 }; };
  const t9Pat = () => t9Post({ patIx: T9.pat, pattern: T9.patterns[T9.pat] });
  const t9Track = () => t9Post({ track: T9.tracks[T9.trk], trackMode: T9.trackMode && !T9.trackWrite });
  const t9Sel = () => (T9.selAC ? ['AC', 1] : T9_KEYSEL[T9.sel]);
  const T9_KN = { tempo: [37, 290], master: [0, 1], accent: [0, 1] };
  const t9Get = (k) => (k.includes('.') ? T9.p[k.split('.')[0]][k.split('.')[1]] : T9.p[k]);
  function t9Set(k, v) {
    const [lo, hi] = T9_KN[k] || [0, 1]; v = Math.max(lo, Math.min(hi, v));
    if (k.includes('.')) { const [a, b] = k.split('.'); T9.p[a][b] = v; t9Post({ set: { [a]: { [b]: v } } }); } else { T9.p[k] = v; t9Post({ set: { [k]: v } }); }
    t9Save(); t9Knobs(); t9Say(k === 'tempo' ? `TEMPO ${Math.round(v)}` : `${k.replace('.', ' ').toUpperCase()} ${(v * 10).toFixed(1)}`);
  }
  function t9Knobs() { document.querySelectorAll('[data-t9k]').forEach((g) => { const k = g.dataset.t9k, [lo, hi] = T9_KN[k] || [0, 1], v = (t9Get(k) - lo) / (hi - lo), r = g.querySelector('[class^="t9-k-"]'); if (r) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(r.getAttribute('transform') || ''); if (m) r.setAttribute('transform', `rotate(${(-135 + v * 270).toFixed(1)} ${m[1]} ${m[2]})`); } }); }
  document.querySelectorAll('[data-t9k]').forEach((g) => {
    const k = g.dataset.t9k, [lo, hi] = T9_KN[k] || [0, 1], span = hi - lo;
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId); const y0 = e.clientY, v0 = t9Get(k);
      const mv = (ev) => t9Set(k, v0 + (y0 - ev.clientY) / (ev.shiftKey ? 900 : 200) * span); const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); });
    g.addEventListener('wheel', (e) => { e.preventDefault(); t9Set(k, t9Get(k) - Math.sign(e.deltaY) * span / (k === 'tempo' ? 253 : 50)); }, { passive: false });
    g.addEventListener('dblclick', () => { const D = tr9Defaults(); t9Set(k, k.includes('.') ? D[k.split('.')[0]][k.split('.')[1]] : D[k]); });
  });
  const t9Run = (on) => {
    if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER(); if (T9.p.sync === 'din') return t9Say('TAPE SYNC: starts and stops with the SBX-80 (play the tape)');
    if (on && T9.trackMode && !T9.trackWrite && !T9.tracks[T9.trk].length) return t9Say(`Track ${T9.trk + 1} is empty: SHIFT + TRACK ${T9.trk + 1} to write it`);
    t9Post({ play: on }); t9Say(on ? (T9.trackMode ? `START · track ${T9.trk + 1}` : `START · pattern ${t9Name(T9.pat)}`) : 'STOP');
  };
  const t9Name = (i) => `${['I', 'II', 'III'][Math.floor(i / 16)]}-${(i % 16) + 1}`;
  document.querySelectorAll('[data-t9b]').forEach((g) => { if (!g.dataset.t9b) return; g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const k = g.dataset.t9b, sh = T9.shift; if (k !== 'shift') T9.shift = false;
    const M = window.T9_M, run = M && M.run;
    if (k === 'shift') { T9.shift = !T9.shift; return; }
    if (k === 'start') return t9Run(true);
    if (k === 'stop') return t9Run(false);
    if (/^grp\d$/.test(k)) { const gI = +k[3]; T9.grp = gI; T9.trackMode = false; T9.trackWrite = false; T9.write = sh; T9.fn = null; T9.flamEntry = false; T9.pat = gI * 16 + (T9.pat % 16); t9Post({ pat: T9.pat }); t9Track(); t9Save(); return t9Say(sh ? `PATTERN WRITE · group ${['I', 'II', 'III'][gI]} · pattern ${t9Name(T9.pat)} · ${t9Sel()[0]}` : `PATTERN PLAY · group ${['I', 'II', 'III'][gI]} (step keys pick the pattern)`, 'P' + (gI + 1) + ' '); }
    if (/^trk\d$/.test(k)) { T9.trk = +k[3]; T9.trackMode = true; T9.trackWrite = sh; T9.write = false; T9.fn = null; t9Track(); return t9Say(sh ? `TRACK WRITE ${T9.trk + 1}: step keys pick a pattern, CARTRIDGE/ENTER writes it (${T9.tracks[T9.trk].length} measures)` : `TRACK PLAY ${T9.trk + 1} · ${T9.tracks[T9.trk].length} measures`, 't' + (T9.trk + 1) + ' '); }
    if (k === 'enter') {
      if (T9.fn === 'inst') { T9.selAC = true; T9.fn = null; return t9Say('INSTRUMENT: TOTAL ACCENT', 'AC '); }
      if (T9.trackWrite) { const t = T9.tracks[T9.trk]; if (t.length >= 99) return t9Say('Track full'); t.push(T9.twPat); t9Track(); t9Save(); return t9Say(`Track ${T9.trk + 1}: measure ${t.length} = pattern ${t9Name(T9.twPat)}`, String(t.length).padStart(3, ' ')); }
      return t9Say('CARTRIDGE/ENTER: writes a measure in TRACK WRITE; after INSTRUMENT SELECT it picks TOTAL ACCENT');
    }
    if (k === 'tap') { if (T9.write && run && M.step >= 0) { const [key, lv] = t9Sel(); T9.patterns[T9.pat].steps[key][M.step] = lv; t9Pat(); t9Save(); if (key !== 'AC') t9Post({ trig: key, acc: lv === 2 }); } else t9Say('TAP enters the selected voice in time in PATTERN WRITE while running'); return; }
    if (k === 'tempo') { T9.disp = 'tempo'; return t9Say(`TEMPO ${Math.round(T9.p.tempo)}`); }
    if (k === 'meas') { T9.disp = 'meas'; return t9Say(`Track ${T9.trk + 1}: ${T9.tracks[T9.trk].length} measures`, String(T9.tracks[T9.trk].length).padStart(3, ' ')); }
    if (k === 'fwd') return t9Say('FWD steps measures in TRACK WRITE (not in this version)');
    if (k === 'scale') { T9.scale = T9.scale % 4 + 1; t9Post({ set: { spb: T9_SCALES[T9.scale - 1] } }); t9Save(); return t9Say(`SCALE ${T9.scale}: ${T9_SCALE_N[T9.scale - 1]}`, 'Sc' + T9.scale); }
    if (k === 'shuf') { if (T9.write && !sh) { T9.flamEntry = !T9.flamEntry; return t9Say(T9.flamEntry ? 'FLAM: the step keys mark flam steps (SHUFFLE/FLAM again to finish)' : 'FLAM entry off'); } T9.fn = T9.fn === (sh ? 'flam' : 'shuf') ? null : (sh ? 'flam' : 'shuf'); return t9Say(sh ? 'FLAM TIME: press a step key (1-16)' : 'SHUFFLE: press a step key 1-7', sh ? 'FL ' : 'SH '); }
    if (k === 'last') { T9.fn = T9.fn === 'last' ? null : 'last'; return t9Say('LAST STEP: press the last step key', 'L' + String(T9.patterns[T9.pat].len).padStart(2, '0')); }
    if (k === 'inst') { if (!T9.write) return t9Say('INSTRUMENT SELECT works in PATTERN WRITE (SHIFT + PATTERN key)'); T9.fn = T9.fn === 'inst' ? null : 'inst'; return t9Say('INSTRUMENT SELECT: press a step key (or CARTRIDGE/ENTER for TOTAL ACCENT)', 'In '); }
    if (k === 'clear') {
      if (T9.trackWrite) { T9.tracks[T9.trk] = []; t9Track(); t9Save(); return t9Say(`Track ${T9.trk + 1} cleared`); }
      if (!T9.write) return t9Say('CLEAR works in PATTERN WRITE / TRACK WRITE');
      if (sh) { T9.patterns[T9.pat] = tr9EmptyPattern(); t9Pat(); t9Save(); return t9Say(`Pattern ${t9Name(T9.pat)} cleared`); }
      const [key] = t9Sel(); T9.patterns[T9.pat].steps[key].fill(0); t9Pat(); t9Save(); return t9Say(`${key} cleared in ${t9Name(T9.pat)}`);
    }
    if (k === 'sync') { T9.p.sync = T9.p.sync === 'din' ? 'int' : 'din'; t9Post({ set: { sync: T9.p.sync }, sync: null, play: false }); t9Save(); return t9Say(T9.p.sync === 'din' ? 'TAPE SYNC: follows the SBX-80 and the tape' : 'internal clock'); }
  }); });
  document.querySelectorAll('[data-t9s]').forEach((g) => g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const i = +g.dataset.t9s, Pt = T9.patterns[T9.pat]; T9.shift = false;
    if (T9.fn === 'inst') { T9.sel = i; T9.selAC = false; T9.fn = null; const [k, lv] = T9_KEYSEL[i]; return t9Say(`INSTRUMENT ${k}${lv === 2 ? ' (accented)' : ''}`, k + (lv === 2 ? '>' : ' ')); }
    if (T9.fn === 'last') { Pt.len = i + 1; T9.fn = null; t9Pat(); t9Save(); return t9Say(`LAST STEP ${i + 1}`, 'L' + String(i + 1).padStart(2, '0')); }
    if (T9.fn === 'shuf') { if (i < 7) { T9.p.shuffle = i; t9Post({ set: { shuffle: i } }); t9Save(); t9Say(`SHUFFLE ${i}`, 'SH' + i); } T9.fn = null; return; }
    if (T9.fn === 'flam') { T9.p.flam = i; t9Post({ set: { flam: i } }); t9Save(); T9.fn = null; return t9Say(`FLAM ${i}`, 'F' + String(i).padStart(2, '0')); }
    if (T9.trackWrite) { T9.twPat = T9.grp * 16 + i; return t9Say(`TRACK WRITE: pattern ${t9Name(T9.twPat)} · CARTRIDGE/ENTER writes it`, 'P' + String(i + 1).padStart(2, '0')); }
    if (T9.write) {
      if (T9.flamEntry) { Pt.steps.FL[i] = Pt.steps.FL[i] ? 0 : 1; t9Pat(); t9Save(); return; }
      const [key, lv] = t9Sel(), row = Pt.steps[key]; row[i] = row[i] === lv ? 0 : lv; t9Pat(); t9Save();
      if (row[i] && key !== 'AC') { if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER(); t9Post({ trig: key, acc: lv === 2 }); } return;
    }
    if (T9.trackMode) return t9Say('TRACK PLAY: START / STOP (PATTERN PLAY I-III to pick patterns)');
    T9.pat = T9.grp * 16 + i; t9Post({ pat: T9.pat }); t9Save(); t9Say(`PATTERN ${t9Name(T9.pat)}${window.T9_M && window.T9_M.run ? ' (from the next measure)' : ''}`, 'P' + String(i + 1).padStart(2, '0'));
  }));
  function t9Draw() {
    const M = window.T9_M, now = performance.now(), run = M && M.run, blink = Math.floor(now / 250) % 2 === 0, slow = Math.floor(now / 500) % 2 === 0, Pt = T9.patterns[T9.pat];
    for (let i = 0; i < 16; i++) {
      let on;
      if (T9.fn === 'inst') on = i === T9.sel && !T9.selAC;
      else if (T9.fn === 'last') on = i === Pt.len - 1;
      else if (T9.fn === 'shuf') on = i === T9.p.shuffle;
      else if (T9.fn === 'flam') on = i === T9.p.flam;
      else if (T9.trackWrite) on = i === T9.twPat % 16;
      else if (T9.write) { const v = T9.flamEntry ? Pt.steps.FL[i] : Pt.steps[t9Sel()[0]][i]; on = (v === 2 ? slow : !!v) !== (!!run && M.step === i); }
      else if (T9.trackMode) on = !!run && M.step === i;
      else on = run ? M.step === i || (M.next != null && M.next === T9.grp * 16 + i && blink) : i === T9.pat % 16 && Math.floor(T9.pat / 16) === T9.grp;
      c1Lamp(`t9-l${i}`, on);
    }
    for (let gI = 0; gI < 3; gI++) c1Lamp(`t9-grp${gI}`, !T9.trackMode && T9.grp === gI && (!T9.write || blink));
    for (let t = 0; t < 4; t++) c1Lamp(`t9-trk${t}`, T9.trackMode && T9.trk === t && (!T9.trackWrite || blink));
    c1Lamp('t9-start', !!run); c1Lamp('t9-syncL', T9.p.sync === 'din'); c1Lamp('t9-shift', T9.shift); c1Lamp('t9-scale', T9.scale !== 3); c1Lamp('t9-tempoL', T9.disp === 'tempo'); c1Lamp('t9-measL', T9.disp === 'meas'); c1Lamp('t9-clear', false);
    for (const k of ['inst', 'last']) c1Lamp(`t9-${k}`, T9.fn === k && blink); c1Lamp('t9-shuf', (T9.fn === 'shuf' || T9.fn === 'flam') ? blink : T9.flamEntry);
    const txt = T9.show && T9.show.until > now ? T9.show.t : T9.trackMode && run ? String((M.meas || 0) + 1).padStart(3, ' ') : T9.disp === 'meas' ? String(T9.tracks[T9.trk].length).padStart(3, ' ') : String(Math.round(run && M ? M.tempo : T9.p.tempo)).padStart(3, ' ');
    sgTxt('.t9-disp', txt);
  }
  function tr909Tick() {
    if (EL.node !== T9.node) { T9.node = EL.node; if (EL.node) { t9Post({ set: { ...T9.p, spb: T9_SCALES[T9.scale - 1] }, patterns: T9.patterns, pat: T9.pat, sync: null }); t9Track(); } }
    if (T9.p.sync === 'din' && EL.node) { const cur = SBX.cur, on = running() && tr.playingMode && cur && cur.beats >= 0; t9Post({ sync: { run: !!on, beats: cur ? cur.beats : 0, bpm: cur ? cur.bpm : T9.p.tempo } }); }
    if (isOpen('tr909') || document.body.classList.contains('racksview')) t9Draw();
  }
  t9Knobs();
