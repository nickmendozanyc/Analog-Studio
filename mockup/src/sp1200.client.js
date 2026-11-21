  // ---------------- E-mew SPU-1200: the front panel's working (the sound and the sequencer run in the audio engine) ----------
  const SP_QL = ['1/8', '1/8T', '1/16', '1/16T', '1/32', '1/32T', 'OFF'];
  const SPU = { sounds: spFactory().concat(Array(24).fill(null)), patterns: Array.from({ length: 100 }, () => spPattern(2)), pat: 0, bank: 0, sel: 0, mode: 'mix', entry: null, typed: '',
    tempo: 90, swing: 50, quant: '1/16', rec: false, metro: true, sync: false, multi: false, multiTune: [-12, -7, -5, -2, 0, 3, 5, 7], msg: null, node: null, held: new Set() };
  // a demo beat on pattern 1 (written here): kick, snare, hats
  { const ev = SPU.patterns[0].events, at = (b, s16) => (b * 4 * 96) + s16 * 24; for (let b = 0; b < 2; b++) { for (const k of [0, 7, 10]) ev.push({ t: at(b, k), pad: 0, v: 1 }); for (const k of [4, 12]) ev.push({ t: at(b, k), pad: 1, v: 1 }); for (let k = 0; k < 16; k += 2) ev.push({ t: at(b, k), pad: 2, v: k % 4 ? 0.6 : 0.85 }); } ev.push({ t: at(1, 14), pad: 3, v: 0.8 }); }
  try { const sv = JSON.parse(localStorage.getItem('as-sp1200') || 'null'); if (sv) { if (sv.patterns) SPU.patterns = sv.patterns; for (const k of ['pat', 'tempo', 'swing', 'quant', 'metro', 'mode']) if (sv[k] != null) SPU[k] = sv[k]; if (sv.sets) sv.sets.forEach((o, i) => { if (o && SPU.sounds[i]) Object.assign(SPU.sounds[i], o); }); } } catch (e) { /* storage unavailable */ }
  let spSaveT = 0; const spSave = () => { clearTimeout(spSaveT); spSaveT = setTimeout(() => { try { localStorage.setItem('as-sp1200', JSON.stringify({ patterns: SPU.patterns, pat: SPU.pat, tempo: SPU.tempo, swing: SPU.swing, quant: SPU.quant, metro: SPU.metro, mode: SPU.mode, sets: SPU.sounds.map((x) => x && { tune: x.tune, decay: x.decay, level: x.level }) })); } catch (e) { /* ignore */ } }, 500); };
  const spPost = (o) => elPost({ type: 'sp1200', ...o });
  const spSay = (l1, l2 = '', ms = 1500) => { SPU.msg = { l: [l1, l2], until: performance.now() + ms }; };
  const spName = (i) => (SPU.sounds[i] ? SPU.sounds[i].name : '-empty-');
  const spPad = (p) => SPU.bank * 8 + p;
  function spSendAll() {
    SPU.sounds.forEach((x, i) => { if (x) spPost({ sound: { i, data: x.data, name: x.name, o: { tune: x.tune, decay: x.decay, level: x.level } } }); });
    spPost({ patterns: SPU.patterns, pat: SPU.pat, tempo: SPU.tempo, swing: SPU.swing, quant: SPU.quant, metro: SPU.metro, rec: SPU.rec });
  }
  window.SP_RECV = (d) => {
    if (d.sampled != null) { if (d.empty) return spSay('SAMPLE: NOTHING', 'PATCHED TO SPU-IN'); SPU.sounds[d.sampled] = Object.assign(spSound(d.data, 'SAMPLE ' + (d.sampled + 1)), { data: d.data }); spSay(`SAMPLED ${'ABCD'[Math.floor(d.sampled / 8)]}${d.sampled % 8 + 1}`, `${(d.data.length / SP_FS).toFixed(2)} SEC`); }
    if (d.patterns) { SPU.patterns = d.patterns; spSave(); }
  };
  // ---- sliders: the bank's eight pads (MIX / TUNE / DECAY), or the eight pitches of MULTI PITCH ----
  const spSl = (i) => { const x = SPU.sounds[spPad(i)]; if (SPU.multi) return (SPU.multiTune[i] + 12) / 24; if (!x) return 0; return SPU.mode === 'tune' ? (x.tune + 12) / 24 : SPU.mode === 'decay' ? x.decay : x.level; };
  function spSetSl(i, v) {
    v = Math.max(0, Math.min(1, v));
    if (SPU.multi) { SPU.multiTune[i] = Math.round(v * 24 - 12); spSay(`MULTI PITCH ${i + 1}`, `TUNE ${SPU.multiTune[i] > 0 ? '+' : ''}${SPU.multiTune[i]}`); }
    else { const pi = spPad(i), x = SPU.sounds[pi]; if (!x) return; if (SPU.mode === 'tune') x.tune = Math.round(v * 24 - 12); else if (SPU.mode === 'decay') x.decay = v; else x.level = v;
      spPost({ soundSet: { i: pi, set: { tune: x.tune, decay: x.decay, level: x.level } } }); spSay(`${'ABCD'[SPU.bank]}${i + 1} ${x.name}`.slice(0, 16), SPU.mode === 'tune' ? `TUNE ${x.tune > 0 ? '+' : ''}${x.tune}` : SPU.mode === 'decay' ? `DECAY ${(v * 100).toFixed(0)}` : `MIX ${(v * 100).toFixed(0)}`); }
    spSave(); spDraw();
  }
  document.querySelectorAll('[data-spk]').forEach((g) => {
    const i = +g.dataset.spk, c = g.querySelector(`.sp-s${i}`);
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId); const svg = g.closest('svg'), sc = svg.getBoundingClientRect().height / svg.viewBox.baseVal.height, len = +c.dataset.len * sc, y0 = e.clientY, v0 = spSl(i);
      const mv = (ev) => spSetSl(i, v0 + (y0 - ev.clientY) / len); const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); });
    g.addEventListener('wheel', (e) => { e.preventDefault(); spSetSl(i, spSl(i) - Math.sign(e.deltaY) * 0.02); }, { passive: false });
  });
  // ---- pads: velocity from where you hit (lower = harder) ----
  function spHit(i, v = 1) {
    if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER();
    SPU.held.add(i); SPU.lastHit = { i, t: performance.now() }; SPU.sel = spPad(i);
    if (SPU.erasing) { spPost({ erase: [...SPU.held].map(spPad) }); return; }
    if (SPU.multi) spPost({ hitWith: { s: SPU.multiSound ?? SPU.sel, ch: i, tune: SPU.multiTune[i], v } });
    else spPost({ hit: spPad(i), v });
  }
  function spUp(i) { SPU.held.delete(i); spPost({ up: spPad(i) }); if (SPU.erasing) spPost({ erase: [...SPU.held].map(spPad) }); }
  document.querySelectorAll('[data-spp]').forEach((g) => {
    const i = +g.dataset.spp;
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); const r = g.getBoundingClientRect(); spHit(i, Math.max(0.3, Math.min(1, 0.3 + 0.7 * (e.clientY - r.top) / r.height))); });
    for (const ev of ['pointerup', 'pointerleave']) g.addEventListener(ev, () => { if (SPU.held.has(i)) spUp(i); });
  });
  // ---- keys ----
  function spEntry(kind) { SPU.entry = SPU.entry === kind ? null : kind; SPU.typed = ''; }
  function spEnter() {
    const v = +SPU.typed;
    if (SPU.entry === 'tempo' && SPU.typed) { SPU.tempo = Math.max(30, Math.min(250, v)); spPost({ tempo: SPU.tempo }); }
    if (SPU.entry === 'swing' && SPU.typed) { SPU.swing = Math.max(50, Math.min(75, v)); spPost({ swing: SPU.swing }); }
    if (SPU.entry === 'pattern' && SPU.typed) { SPU.pat = Math.max(1, Math.min(99, v)) - 1; spPost({ pat: SPU.pat }); }
    SPU.typed = ''; spSave();
  }
  document.querySelectorAll('[data-spb]').forEach((g) => g.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const k = g.dataset.spb, M = window.SP_M;
    if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER();
    if (k === 'run') { if (SPU.sync) return spSay('SYNC: FOLLOWS', 'THE SBX-80 / TAPE'); const on = !(M && M.run); spPost({ play: on }); spSay(on ? `RUN PATTERN ${SPU.pat + 1}` : 'STOP', on && SPU.rec ? 'RECORDING' : ''); }
    else if (k === 'rec') { SPU.rec = !SPU.rec; spPost({ rec: SPU.rec }); spSay(SPU.rec ? 'RECORD READY' : 'RECORD OFF', SPU.rec ? `AUTOCORRECT ${SPU.quant}` : ''); }
    else if (k === 'tap') { SPU.repeat = true; spPost({ repeat: true }); }
    else if (k === 'erase') { SPU.erasing = true; spSay('ERASE: HOLD A PAD', 'WHILE RECORDING'); }
    else if (k === 'tempo' || k === 'swing' || k === 'pattern') { spEntry(k); }
    else if (k === 'quant') { SPU.quant = SP_QL[(SP_QL.indexOf(SPU.quant) + 1) % SP_QL.length]; spPost({ quant: SPU.quant }); spSay('AUTO CORRECT', SPU.quant === 'OFF' ? 'OFF (96 PPQ)' : `${SPU.quant} NOTE`); spSave(); }
    else if (k === 'metro') { SPU.metro = !SPU.metro; spPost({ metro: SPU.metro }); spSay('METRONOME', SPU.metro ? 'ON (RECORDING)' : 'OFF'); spSave(); }
    else if (k === 'bank') { SPU.bank = (SPU.bank + 1) % 4; SPU.sel = spPad(SPU.sel % 8); spSay(`BANK ${'ABCD'[SPU.bank]}`, ''); }
    else if (k === 'mix' || k === 'tune' || k === 'decay') { SPU.mode = k; SPU.multi = false; spSay(`SLIDERS: ${k.toUpperCase()}`, `BANK ${'ABCD'[SPU.bank]}`); spSave(); }
    else if (k === 'multi') { SPU.multi = !SPU.multi; SPU.multiSound = SPU.sel; spSay(SPU.multi ? 'MULTI PITCH' : 'MULTI PITCH OFF', SPU.multi ? spName(SPU.sel).slice(0, 16) : ''); }
    else if (k === 'sample') {
      const ch = SPU.inCh; if (ch == null) return spSay('SAMPLE: PATCH A', 'CHANNEL TO SPU-IN');
      const sec = Math.min(2.5, SP_WORDS / SP_FS - (SPU.sounds.reduce((a, x, i) => a + (x && i !== SPU.sel ? x.data.length : 0), 0) / SP_FS));
      if (sec < 0.1) return spSay('MEMORY FULL', '');
      spPost({ sample: { pad: SPU.sel, sec, thresh: 0.02 } }); spSay(`SAMPLING ${'ABCD'[Math.floor(SPU.sel / 8)]}${SPU.sel % 8 + 1}`, `WAITING FOR SOUND`, 4000);
    }
    else if (k === 'sync') { SPU.sync = !SPU.sync; spPost({ sync: null, play: false }); spSay('SYNC', SPU.sync ? 'SBX-80 (DIN)' : 'INTERNAL'); }
    else if (k === 'load' || k === 'save') { if (k === 'load') document.getElementById('sp-file').click(); else spSay('SAVE: PATTERNS', 'KEPT AUTOMATICALLY'); }
    else if (/^k\d$/.test(k)) { if (SPU.entry) SPU.typed = (SPU.typed + k[1]).slice(-3); }
    else if (k === 'yes' || k === 'no') {
      const d = k === 'yes' ? 1 : -1;
      if (SPU.entry === 'tempo') { SPU.tempo = Math.max(30, Math.min(250, SPU.tempo + d)); spPost({ tempo: SPU.tempo }); }
      else if (SPU.entry === 'swing') { SPU.swing = Math.max(50, Math.min(75, SPU.swing + (d > 0 ? 4 : -4) - (SPU.swing === 50 && d > 0 ? 0 : 0))); spPost({ swing: SPU.swing }); }
      else if (SPU.entry === 'pattern') { SPU.pat = (SPU.pat + d + 99) % 99; spPost({ pat: SPU.pat }); }
      spSave();
    }
    else if (k === 'enter') spEnter();
    spDraw();
  }));
  document.querySelectorAll('[data-spb="tap"], [data-spb="erase"]').forEach((g) => g.addEventListener('pointerup', () => { if (g.dataset.spb === 'tap') { SPU.repeat = false; spPost({ repeat: false }); } else { SPU.erasing = false; spPost({ erase: [] }); } }));
  // ---- loading audio onto the selected pad ----
  const spFile = document.getElementById('sp-file');
  if (spFile) spFile.addEventListener('change', async () => {
    const f = spFile.files[0]; spFile.value = ''; if (!f) return;
    try {
      const ctx = EL.ctx || new (window.AudioContext || window.webkitAudioContext)(), buf = await ctx.decodeAudioData(await f.arrayBuffer());
      const room = SP_WORDS - SPU.sounds.reduce((a, x, i) => a + (x && i !== SPU.sel ? x.data.length : 0), 0), n = Math.min(Math.floor(buf.duration * SP_FS), room);
      if (n < 100) return spSay('MEMORY FULL', '');
      const off = new OfflineAudioContext(1, n, SP_FS), src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start(); const r = await off.startRendering();
      const x = spSound(r.getChannelData(0), f.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 10)); SPU.sounds[SPU.sel] = x;
      spPost({ sound: { i: SPU.sel, data: x.data, name: x.name } }); spSay(`LOADED ${'ABCD'[Math.floor(SPU.sel / 8)]}${SPU.sel % 8 + 1}`, `${(n / SP_FS).toFixed(2)} SEC ${n < buf.duration * SP_FS ? 'CUT' : ''}`);
    } catch (e) { spSay('CANNOT READ', 'THAT FILE'); }
  });
  // ---- the computer keys (A S D F G H J K = pads 1-8) and MIDI (notes 36-43 = pads 1-8) ----
  const SP_KEYS = 'asdfghjk';
  addEventListener('keydown', (e) => { if (!isOpen('sp1200') || e.ctrlKey || e.metaKey || /INPUT|SELECT/.test(e.target.tagName || '')) return; const i = SP_KEYS.indexOf(e.key.toLowerCase()); if (i < 0) return; e.preventDefault(); e.stopPropagation(); if (!e.repeat) spHit(i, 0.9); spDraw(); }, true);
  addEventListener('keyup', (e) => { if (!isOpen('sp1200')) return; const i = SP_KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) { e.stopPropagation(); spUp(i); } }, true);
  const spMidi = document.getElementById('sp-midi');
  if (spMidi && navigator.requestMIDIAccess) {
    let acc = null; const fill = () => { const v = spMidi.value; spMidi.innerHTML = '<option value="">MIDI IN · computer keys</option>' + [...acc.inputs.values()].map((p) => `<option value="${p.id}">MIDI IN · ${p.name}</option>`).join(''); spMidi.value = v; };
    spMidi.addEventListener('pointerdown', () => { if (!acc) navigator.requestMIDIAccess().then((a) => { acc = a; fill(); a.onstatechange = fill; }).catch(() => {}); });
    spMidi.addEventListener('change', () => { if (!acc) return; for (const p of acc.inputs.values()) p.onmidimessage = p.id === spMidi.value ? (m) => { const [st, n, v] = m.data, t = st & 0xf0, i = n - 36; if (i < 0 || i > 7) return; if (t === 0x90 && v > 0) spHit(i, v / 127); else if (t === 0x80 || (t === 0x90 && v === 0)) spUp(i); } : null; });
  }
  // ---- display and lights ----
  function spDraw() {
    const M = window.SP_M, now = performance.now(), run = M && M.run;
    let l1, l2;
    if (SPU.msg && SPU.msg.until > now) [l1, l2] = SPU.msg.l;
    else if (SPU.entry === 'tempo') { l1 = 'TEMPO'; l2 = SPU.typed ? `${SPU.typed}_  (ENTER)` : `${SPU.tempo.toFixed(1)} BPM`; }
    else if (SPU.entry === 'swing') { l1 = 'SWING'; l2 = SPU.typed ? `${SPU.typed}_  (ENTER)` : `${SPU.swing} %`; }
    else if (SPU.entry === 'pattern') { l1 = 'SELECT PATTERN'; l2 = SPU.typed ? `${SPU.typed}_  (ENTER)` : `PATTERN ${String(SPU.pat + 1).padStart(2, '0')}`; }
    else { l1 = `P${String(SPU.pat + 1).padStart(2, '0')} ${run ? `BAR ${M.bar} BEAT ${M.beat}` : `${SPU.tempo.toFixed(0)} BPM`}`; l2 = `${SPU.rec ? 'REC ' : ''}${'ABCD'[SPU.bank]}${SPU.sel % 8 + 1} ${spName(SPU.sel)}`; }
    sgTxt('.sp-l1', (l1 || '').padEnd(16).slice(0, 16)); sgTxt('.sp-l2', (l2 || '').padEnd(16).slice(0, 16));
    for (const [k, on] of [['tempo', SPU.entry === 'tempo'], ['swing', SPU.entry === 'swing' || SPU.swing > 50], ['quant', SPU.quant !== 'OFF'], ['metro', SPU.metro], ['pattern', SPU.entry === 'pattern'], ['bank', SPU.bank > 0], ['mix', !SPU.multi && SPU.mode === 'mix'], ['tune', !SPU.multi && SPU.mode === 'tune'], ['decay', !SPU.multi && SPU.mode === 'decay'], ['multi', SPU.multi], ['run', !!run], ['rec', SPU.rec], ['tap', !!SPU.repeat], ['erase', !!SPU.erasing], ['sync', SPU.sync], ['sample', false]]) c1Lamp(`sp-l-${k}`, on);
    for (let i = 0; i < 8; i++) {
      for (const g of c1All(`sp-s${i}`)) { const v = spSl(i), y = (1 - v) * +g.dataset.len; if (g._y !== y) { g._y = y; g.setAttribute('transform', `translate(0 ${y.toFixed(2)})`); } }
      const lit = M && M.on && M.on[i], col = lit ? '#8f959b' : SPU.held.has(i) ? '#7a8086' : '#5d6064';
      for (const e of c1All(`sp-pad${i}`)) if (e._c !== col) { e._c = col; e.setAttribute('fill', col); }
      sgTxt(`.sp-pn${i}`, (SPU.multi ? `${SPU.multiTune[i] > 0 ? '+' : ''}${SPU.multiTune[i]}` : spName(spPad(i))).slice(0, 8));
    }
  }
  function spTick() {
    if (EL.node !== SPU.node) { SPU.node = EL.node; if (EL.node) spSendAll(); }
    if (SPU.sync && EL.node) { const cur = SBX.cur, on = running() && tr.playingMode && cur && cur.beats >= 0; spPost({ sync: { run: !!on, beats: cur ? cur.beats : 0, bpm: cur ? cur.bpm : SPU.tempo } }); }
    const pc = patches.find((q) => q.b === 'fxin:SP1200' && /^(isend|dir|tout):\d+$/.test(q.a)), n = pc && +pc.a.split(':')[1], ch = n && n <= 24 ? n - 1 : null;
    if (ch !== SPU.inCh) { SPU.inCh = ch; spPost({ sampleCh: ch }); }
    if (isOpen('sp1200') || document.body.classList.contains('racksview')) spDraw();
  }
