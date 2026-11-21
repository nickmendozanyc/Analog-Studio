  // ---------------- Rowan TR-8080: the front panel's working (after the TR-808 owner's manual, in short) ----------------
  // MODE: CLEAR / 1st PART / 2nd PART (write) / MANUAL / PLAY. INSTRUMENT SELECT picks the voice to write (AC = accent).
  // The voices and the sequencer run in the tape machine's audio engine (tr808.js), sample-accurate; this side holds the
  // patterns and the knobs and sends them over. SYNC: internal, or DIN sync from the SBX-80 (locked to the tape).
  const TR_SEL = ['AC', ...TR_INST], TR_MODES = ['CLEAR', '1st PART', '2nd PART', 'MANUAL', 'PLAY'];
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
    return pats;
  }
  const TR = { p: trDefaults(), patterns: trFactory(), pat: 0, mode: 4, inst: 1, node: null, t: 0, taps: [], flash: new Map() };
  Object.assign(TR.p, { LT: { ...TR.p.LT, conga: false }, MT: { ...TR.p.MT, conga: false }, HT: { ...TR.p.HT, conga: false } });
  for (const k of ['LT', 'MT', 'HT']) TR.p[k].conga = false;
  try { const sv = JSON.parse(localStorage.getItem('as-tr808') || 'null'); if (sv && sv.p) { for (const k in sv.p) { if (typeof sv.p[k] === 'object') Object.assign(TR.p[k] || (TR.p[k] = {}), sv.p[k]); else TR.p[k] = sv.p[k]; } TR.patterns = sv.patterns || TR.patterns; TR.pat = sv.pat || 0; } } catch (e) { /* storage unavailable */ }
  // factory congas / claves on pattern 4 sound best with the switches over; leave the user's choice alone
  let trSaveT = 0; const trSave = () => { clearTimeout(trSaveT); trSaveT = setTimeout(() => { try { localStorage.setItem('as-tr808', JSON.stringify({ p: TR.p, patterns: TR.patterns, pat: TR.pat })); } catch (e) { /* ignore */ } }, 400); };
  const trPost = (o) => elPost({ type: 'tr808', ...o });
  const trSay = (t) => { const m = document.getElementById('tr-msg'); if (m) m.textContent = t; };
  const trSendAll = () => trPost({ set: TR.p, patterns: TR.patterns, pat: TR.pat, sync: null });
  const trPart = () => (TR.mode === 2 ? 'B' : 'A');
  // ---- knobs ----
  const TR_KN = { tempo: [40, 300], fine: [-1, 1], master: [0, 1], accent: [0, 1] };
  const trGet = (k) => { if (k.includes('.')) { const [a, b] = k.split('.'); return TR.p[a][b]; } return k === 'fine' ? (TR.fine || 0) : TR.p[k]; };
  function trSetK(k, v) {
    const [lo, hi] = TR_KN[k] || [0, 1]; v = Math.max(lo, Math.min(hi, v));
    if (k === 'fine') { const d = v - (TR.fine || 0); TR.fine = v; TR.p.tempo = Math.max(40, Math.min(300, TR.p.tempo + d * 4)); trPost({ set: { tempo: TR.p.tempo } }); }
    else if (k.includes('.')) { const [a, b] = k.split('.'); TR.p[a][b] = v; trPost({ set: { [a]: { [b]: v } } }); }
    else { TR.p[k] = v; trPost({ set: { [k]: v } }); }
    trSave(); trKnobs();
    trSay(k === 'tempo' || k === 'fine' ? `TEMPO ${TR.p.tempo.toFixed(1)} BPM` : `${k.replace('.', ' ').toUpperCase()} ${Math.round(v * 10 * 10) / 10}`);
  }
  function trKnobs() {
    document.querySelectorAll('[data-trk]').forEach((g) => {
      const k = g.dataset.trk, [lo, hi] = TR_KN[k] || [0, 1], v = (trGet(k) - lo) / (hi - lo), r = g.querySelector('[class^="tr-k-"]');
      if (r) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(r.getAttribute('transform') || ''); if (m) r.setAttribute('transform', `rotate(${(-135 + v * 270).toFixed(1)} ${m[1]} ${m[2]})`); }
    });
    for (const [k, n] of [['mode', 5], ['inst', 12]]) for (const r of document.querySelectorAll(`.tr-r-${k}`)) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(r.getAttribute('transform') || ''); if (m) r.setAttribute('transform', `rotate(${(-120 + TR[k] * 240 / (n - 1)).toFixed(1)} ${m[1]} ${m[2]})`); }
    for (const [k, sw] of [['LT', 'conga'], ['MT', 'conga'], ['HT', 'conga'], ['RS', 'claves'], ['CP', 'maracas']]) for (const e of document.querySelectorAll(`.tr-w-${k}`)) { const y0 = +(e.dataset.y0 || (e.dataset.y0 = e.getAttribute('y'))), h = +e.getAttribute('height'); e.setAttribute('y', TR.p[k][sw] ? y0 + h * 1.2 : y0); }
    for (const e of document.querySelectorAll('.tr-var')) { const x0 = +(e.dataset.x0 || (e.dataset.x0 = e.getAttribute('x'))), w = +e.getAttribute('width'); e.setAttribute('x', x0 + ({ A: 0, AB: 1, B: 2 })[TR.p.var] * w * 0.97); }
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
  document.querySelectorAll('[data-trr]').forEach((g) => {
    const k = g.dataset.trr, n = k === 'mode' ? 5 : 12;
    const set = (v) => { TR[k] = (v + n) % n; trKnobs(); trSay(k === 'mode' ? `MODE: ${TR_MODES[TR.mode]}` : `INSTRUMENT: ${TR_SEL[TR.inst]}`); };
    g.addEventListener('click', (e) => { e.stopPropagation(); set(TR[k] + (e.shiftKey ? -1 : 1)); });
    g.addEventListener('wheel', (e) => { e.preventDefault(); set(TR[k] - Math.sign(e.deltaY)); }, { passive: false });
  });
  function trRun(on) {
    if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER();
    if (TR.p.sync === 'din') return trSay('DIN SYNC: it starts and stops with the SBX-80 (play the tape)');
    trPost({ play: on }); TR.run = on; trSay(on ? `PLAY · pattern ${TR.pat + 1}` : 'STOP');
  }
  document.querySelectorAll('[data-trb]').forEach((g) => g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const k = g.dataset.trb, M = window.TR_M;
    if (k === 'start') trRun(!(M && M.run));
    if (k === 'var') { TR.p.var = { A: 'AB', AB: 'B', B: 'A' }[TR.p.var]; trPost({ set: { var: TR.p.var } }); trSave(); trKnobs(); trSay(`BASIC VARIATION ${TR.p.var}`); }
    if (k === 'tap') { const now = performance.now(); TR.taps = TR.taps.filter((t) => now - t < 2500); TR.taps.push(now); if (TR.taps.length >= 2) { const d = (TR.taps[TR.taps.length - 1] - TR.taps[0]) / (TR.taps.length - 1); trSetK('tempo', 60000 / d); } else trSay('TAP: keep tapping the beat'); }
    if (k === 'clear') { if (TR.mode === 1 || TR.mode === 2) { const S = TR.patterns[TR.pat][trPart()].steps, key = TR_SEL[TR.inst]; S[key].fill(0); trPost({ patIx: TR.pat, pattern: TR.patterns[TR.pat] }); trSave(); trSay(`${key} cleared in pattern ${TR.pat + 1} ${trPart()}`); } else trSay('CLEAR works in 1st / 2nd PART'); }
  }));
  document.querySelectorAll('[data-trs]').forEach((g) => g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const i = +g.dataset.trs;
    if (TR.mode === 1 || TR.mode === 2) { const S = TR.patterns[TR.pat][trPart()].steps, key = TR_SEL[TR.inst]; S[key][i] = S[key][i] ? 0 : 1; trPost({ patIx: TR.pat, pattern: TR.patterns[TR.pat] }); trSave(); if (S[key][i] && key !== 'AC') trPost({ trig: key }); }
    else if (TR.mode === 4) { TR.pat = i; trPost({ pat: i }); trSave(); trSay(`PATTERN ${i + 1}${window.TR_M && window.TR_M.run ? ' (at the end of the bar)' : ''}`); }
    else if (TR.mode === 3) { const k = ['BD', 'SD', 'LT', 'MT', 'HT', 'RS', 'CP', 'CB', 'CY', 'OH', 'CH'][i]; if (k) { if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER(); trPost({ trig: k, acc: e.shiftKey }); TR.flash.set(i, performance.now() + 120); } }
    else if (TR.mode === 0) { TR.patterns[i] = trEmptyPattern(); trPost({ patIx: i, pattern: TR.patterns[i] }); trSave(); trSay(`PATTERN ${i + 1} cleared`); }
  }));
  document.querySelectorAll('[data-trx]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.trx === 'sync') { TR.p.sync = TR.p.sync === 'din' ? 'int' : 'din'; trPost({ set: { sync: TR.p.sync }, sync: null, play: false }); trSave(); trKnobs(); trSay(TR.p.sync === 'din' ? 'DIN SYNC: follows the SBX-80 (its tempo map), starts and stops with the tape' : 'INTERNAL: START / STOP and TEMPO'); }
    if (b.dataset.trx === 'copy') { const nx = (TR.pat + 1) % 16; TR.patterns[nx] = JSON.parse(JSON.stringify(TR.patterns[TR.pat])); trPost({ patIx: nx, pattern: TR.patterns[nx] }); trSave(); trSay(`Pattern ${TR.pat + 1} copied to ${nx + 1}`); }
  }));
  // ---- lights ----
  function trDraw() {
    const M = window.TR_M, now = performance.now(), run = M && M.run, blink = Math.floor(now / 250) % 2 === 0;
    const part = run ? M.part : trPart(), pat = run ? M.pat : TR.pat, S = TR.patterns[TR.pat][trPart()].steps, key = TR_SEL[TR.inst];
    for (let i = 0; i < 16; i++) {
      let on = false;
      if (TR.mode === 1 || TR.mode === 2) on = !!S[key][i] !== (run && M.step === i && M.part === trPart());
      else if (TR.mode === 4) on = run ? M.step === i || (M.next != null && M.next === i && blink) : i === TR.pat;
      else if (TR.mode === 3) on = (TR.flash.get(i) || 0) > now || (M && M.hits && M.hits.includes(['BD', 'SD', 'LT', 'MT', 'HT', 'RS', 'CP', 'CB', 'CY', 'OH', 'CH'][i]));
      else on = blink && i === TR.pat;
      c1Lamp(`tr-l${i}`, on);
    }
    c1Lamp('tr-run', !!run && (M.step % 4 === 0));
    c1Lamp('tr-va', run ? M.part === 'A' : TR.p.var !== 'B'); c1Lamp('tr-vb', run ? M.part === 'B' : TR.p.var !== 'A');   // which part plays
    c1Lamp('tr-p1', TR.mode === 1); c1Lamp('tr-p2', TR.mode === 2);
    sgTxt('.tr-pat', `P${String(pat + 1).padStart(2, '0')} ${(TR.mode === 1 || TR.mode === 2) && !run ? trPart() + '*' : part}`);
  }
  function tr808Tick() {
    if (EL.node !== TR.node) { TR.node = EL.node; if (EL.node) trSendAll(); }
    if (TR.p.sync === 'din' && EL.node) {   // DIN sync: the SBX-80's song position and tempo, while its code is locked
      const cur = SBX.cur, on = running() && tr.playingMode && cur && cur.beats >= 0;
      trPost({ sync: { run: !!on, beats: cur ? cur.beats : 0, bpm: cur ? cur.bpm : TR.p.tempo } });
    }
    if (isOpen('tr808') || document.body.classList.contains('racksview')) trDraw();
  }
  trKnobs();
