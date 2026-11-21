  // ---------------- Rowan TR-9090 on the desk in the racks room: its front panel's working ----------------
  // PATTERN WRITE: INST SELECT then a step key picks the voice (the names under the keys; 12 = ACCENT, 13 = FLAM), then
  // the step keys switch its steps. PATTERN PLAY: the step keys pick the pattern (at the end of the bar while running).
  // LAST STEP then a step key sets the pattern's length. SHUFFLE/FLAM then a step key: 1-8 shuffle 0-7, 9-16 flam 0-7.
  // CLEAR empties the selected voice (write). TAP taps the tempo. SYNC: internal or DIN sync from the SBX-80.
  const T9_SEL = ['BD', 'SD', 'LT', 'MT', 'HT', 'RS', 'CP', 'CH', 'OH', 'CR', 'RD', 'AC', 'FL'];
  function t9Factory() {   // a few patterns to start (written here)
    const P = Array.from({ length: 16 }, tr9EmptyPattern), put = (i, k, st) => { for (const s of st) P[i].steps[k][s] = 1; };
    put(0, 'BD', [0, 4, 8, 12]); put(0, 'CP', [4, 12]); put(0, 'OH', [2, 6, 10, 14]); put(0, 'CH', [0, 4, 8, 12]); put(0, 'AC', [0, 8]);
    put(1, 'BD', [0, 4, 8, 12]); put(1, 'SD', [4, 12]); put(1, 'CH', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]); put(1, 'OH', [6, 14]); put(1, 'RD', [2, 10]); put(1, 'AC', [0, 4, 8, 12]);
    put(2, 'BD', [0, 7, 10]); put(2, 'SD', [4, 12, 15]); put(2, 'CH', [0, 2, 4, 6, 8, 10, 12, 14]); put(2, 'RS', [3, 11]); put(2, 'AC', [4, 12]); put(2, 'FL', [15]);
    put(3, 'BD', [0, 4, 8, 12]); put(3, 'LT', [9, 13]); put(3, 'MT', [10, 14]); put(3, 'HT', [11, 15]); put(3, 'CR', [0]); put(3, 'CP', [4, 12]); put(3, 'AC', [0]);
    return P;
  }
  const T9 = { p: tr9Defaults(), patterns: t9Factory(), pat: 0, write: false, inst: 0, fn: null, node: null, taps: [], show: null };
  try { const sv = JSON.parse(localStorage.getItem('as-tr909') || 'null'); if (sv && sv.p) { for (const k in sv.p) { if (typeof sv.p[k] === 'object') Object.assign(T9.p[k] || (T9.p[k] = {}), sv.p[k]); else T9.p[k] = sv.p[k]; } T9.patterns = sv.patterns || T9.patterns; T9.pat = sv.pat || 0; } } catch (e) { /* storage unavailable */ }
  let t9SaveT = 0; const t9Save = () => { clearTimeout(t9SaveT); t9SaveT = setTimeout(() => { try { localStorage.setItem('as-tr909', JSON.stringify({ p: T9.p, patterns: T9.patterns, pat: T9.pat })); } catch (e) { /* ignore */ } }, 400); };
  const t9Post = (o) => elPost({ type: 'tr909', ...o });
  const t9Say = (t, disp) => { const m = document.getElementById('t9-msg'); if (m) m.textContent = 'TR-9090 · ' + t; if (disp) T9.show = { t: disp, until: performance.now() + 1100 }; };
  const t9Pat = () => t9Post({ patIx: T9.pat, pattern: T9.patterns[T9.pat] });
  const T9_KN = { tempo: [37, 290], master: [0, 1], accent: [0, 1] };
  const t9Get = (k) => (k.includes('.') ? T9.p[k.split('.')[0]][k.split('.')[1]] : T9.p[k]);
  function t9Set(k, v) {
    const [lo, hi] = T9_KN[k] || [0, 1]; v = Math.max(lo, Math.min(hi, v));
    if (k.includes('.')) { const [a, b] = k.split('.'); T9.p[a][b] = v; t9Post({ set: { [a]: { [b]: v } } }); } else { T9.p[k] = v; t9Post({ set: { [k]: v } }); }
    t9Save(); t9Knobs(); t9Say(k === 'tempo' ? `TEMPO ${Math.round(v)}` : `${k.replace('.', ' ').toUpperCase()} ${(v * 10).toFixed(1)}`);
  }
  function t9Knobs() {
    document.querySelectorAll('[data-t9k]').forEach((g) => { const k = g.dataset.t9k, [lo, hi] = T9_KN[k] || [0, 1], v = (t9Get(k) - lo) / (hi - lo), r = g.querySelector('[class^="t9-k-"]'); if (r) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(r.getAttribute('transform') || ''); if (m) r.setAttribute('transform', `rotate(${(-135 + v * 270).toFixed(1)} ${m[1]} ${m[2]})`); } });
    for (const [cls, on] of [['t9-mode', !T9.write], ['t9-sync', T9.p.sync === 'din']]) for (const e of document.querySelectorAll('.' + cls)) { const x0 = +(e.dataset.x0 || (e.dataset.x0 = e.getAttribute('x'))), w = +e.getAttribute('width'); e.setAttribute('x', on ? x0 + w * 1.05 : x0); }
  }
  document.querySelectorAll('[data-t9k]').forEach((g) => {
    const k = g.dataset.t9k, [lo, hi] = T9_KN[k] || [0, 1], span = hi - lo;
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId); const y0 = e.clientY, v0 = t9Get(k);
      const mv = (ev) => t9Set(k, v0 + (y0 - ev.clientY) / (ev.shiftKey ? 900 : 200) * span); const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); });
    g.addEventListener('wheel', (e) => { e.preventDefault(); t9Set(k, t9Get(k) - Math.sign(e.deltaY) * span / (k === 'tempo' ? 253 : 50)); }, { passive: false });
    g.addEventListener('dblclick', () => { const D = tr9Defaults(); t9Set(k, k.includes('.') ? D[k.split('.')[0]][k.split('.')[1]] : D[k]); });
  });
  const t9Run = (on) => { if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER(); if (T9.p.sync === 'din') return t9Say('DIN SYNC: starts and stops with the SBX-80 (play the tape)'); t9Post({ play: on }); t9Say(on ? `START · pattern ${T9.pat + 1}` : 'STOP'); };
  document.querySelectorAll('[data-t9b]').forEach((g) => g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const k = g.dataset.t9b;
    if (k === 'start') t9Run(true);
    else if (k === 'stop') t9Run(false);
    else if (k === 'inst' || k === 'last' || k === 'shuf') { T9.fn = T9.fn === k ? null : k; t9Say({ inst: 'INST SELECT: press a step key (names under the keys)', last: 'LAST STEP: press the last step key', shuf: 'SHUFFLE (keys 1-8) / FLAM (keys 9-16)' }[k] + (T9.fn ? '' : ' · off'), { inst: 'In ', last: 'L' + String(T9.patterns[T9.pat].len).padStart(2, '0'), shuf: 'S' + T9.p.shuffle + T9.p.flam }[k]); }
    else if (k === 'clear') { if (T9.write) { T9.patterns[T9.pat].steps[T9_SEL[T9.inst]].fill(0); t9Pat(); t9Save(); t9Say(`${T9_SEL[T9.inst]} cleared in pattern ${T9.pat + 1}`); } else t9Say('CLEAR works in PATTERN WRITE'); }
    else if (k === 'tap') { const now = performance.now(); T9.taps = T9.taps.filter((t) => now - t < 2500); T9.taps.push(now); if (T9.taps.length >= 2) t9Set('tempo', 60000 / ((T9.taps[T9.taps.length - 1] - T9.taps[0]) / (T9.taps.length - 1))); else t9Say('TAP: keep tapping the beat'); }
    else if (k === 'mode') { T9.write = !T9.write; t9Knobs(); t9Say(T9.write ? `PATTERN WRITE · ${T9_SEL[T9.inst]} on pattern ${T9.pat + 1}` : 'PATTERN PLAY · the step keys pick the pattern'); }
    else if (k === 'sync') { T9.p.sync = T9.p.sync === 'din' ? 'int' : 'din'; t9Post({ set: { sync: T9.p.sync }, sync: null, play: false }); t9Save(); t9Knobs(); t9Say(T9.p.sync === 'din' ? 'SYNC DIN: follows the SBX-80 and the tape' : 'SYNC INTERNAL'); }
  }));
  document.querySelectorAll('[data-t9s]').forEach((g) => g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const i = +g.dataset.t9s, Pt = T9.patterns[T9.pat];
    if (T9.fn === 'inst') { if (T9_SEL[i]) { T9.inst = i; T9.fn = null; t9Say(`INSTRUMENT ${T9_SEL[i]}`, T9_SEL[i]); } return; }
    if (T9.fn === 'last') { Pt.len = i + 1; T9.fn = null; t9Pat(); t9Save(); t9Say(`LAST STEP ${i + 1}`, 'L' + String(i + 1).padStart(2, '0')); return; }
    if (T9.fn === 'shuf') { if (i < 8) { T9.p.shuffle = i; t9Post({ set: { shuffle: i } }); t9Say(`SHUFFLE ${i}`, 'S' + i + ' '); } else { T9.p.flam = i - 8; t9Post({ set: { flam: i - 8 } }); t9Say(`FLAM ${i - 8}`, 'F' + (i - 8) + ' '); } T9.fn = null; t9Save(); return; }
    if (T9.write) { const row = Pt.steps[T9_SEL[T9.inst]]; row[i] = row[i] ? 0 : 1; t9Pat(); t9Save(); if (row[i] && !['AC', 'FL'].includes(T9_SEL[T9.inst])) { if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER(); t9Post({ trig: T9_SEL[T9.inst] }); } }
    else { T9.pat = i; t9Post({ pat: i }); t9Save(); t9Say(`PATTERN ${i + 1}${window.T9_M && window.T9_M.run ? ' (at the end of the bar)' : ''}`, 'P' + String(i + 1).padStart(2, '0')); }
  }));
  function t9Draw() {
    const M = window.T9_M, now = performance.now(), run = M && M.run, blink = Math.floor(now / 250) % 2 === 0, Pt = T9.patterns[T9.pat];
    for (let i = 0; i < 16; i++) {
      let on;
      if (T9.fn === 'inst') on = i === T9.inst;
      else if (T9.fn === 'last') on = i === Pt.len - 1;
      else if (T9.fn === 'shuf') on = i === T9.p.shuffle || i === 8 + T9.p.flam;
      else if (T9.write) on = !!Pt.steps[T9_SEL[T9.inst]][i] !== (!!run && M.step === i);
      else on = run ? M.step === i || (M.next === i && blink) : i === T9.pat;
      c1Lamp(`t9-l${i}`, on);
    }
    c1Lamp('t9-start', !!run); for (const k of ['inst', 'last', 'shuf']) c1Lamp(`t9-${k}`, T9.fn === k && blink);
    sgTxt('.t9-disp', T9.show && T9.show.until > now ? T9.show.t : String(Math.round(run && M ? M.tempo : T9.p.tempo)).padStart(3, ' '));
  }
  function tr909Tick() {
    if (EL.node !== T9.node) { T9.node = EL.node; if (EL.node) t9Post({ set: T9.p, patterns: T9.patterns, pat: T9.pat, sync: null }); }
    if (T9.p.sync === 'din' && EL.node) { const cur = SBX.cur, on = running() && tr.playingMode && cur && cur.beats >= 0; t9Post({ sync: { run: !!on, beats: cur ? cur.beats : 0, bpm: cur ? cur.bpm : T9.p.tempo } }); }
    if (document.body.classList.contains('racksview')) t9Draw();
  }
  t9Knobs();
