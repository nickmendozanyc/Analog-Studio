  // ---------------- Publizon IM90 (rack unit + remote): the front panel's operating system ----------------
  // After the IM90 user guide: SET A / SET B choose the channels a key acts on; FUNCTIONS + number + PARAMETERS (or
  // ENTER to see its name first) calls a function; + / − step through its parameter pages; a value is typed and ENTERed
  // (numeric mode, PARAMETERS LED steady) or stepped with + / − and ramped with 1–9, 0 stopping (increment mode, LED
  // blinking); the remote's wheel turns the value. MEMORY SELECT / IN / OUT: 400 memories. AUX: the sampler's key.
  // The audio runs in the tape machine's engine (im90.js), on the channels the unit is patched into.
  const IMF = { 1: 'DELAY', 2: 'ECHO', 4: 'PITCH-SHIFTING', 7: 'REVERB PRESETS', 8: 'PARAMETRIC REVERB', 9: 'HANDLING OF MEMORIZED SOUNDS' };
  const IM_ALGO = ['HUMAN VOICE A', 'STRINGS', 'HUMAN VOICE B', 'COMPLEX SOUNDS'];
  const IM_MODES = ['LOOP', 'IF A TRIGGER', 'IF B TRIGGER', 'MIDI KEY SELECT', 'CHROMATIC STACK'];
  const imNew = (fn) => ({ fn, p: 0, delay: 250, echo: 375, fb: 35, ratio: 1.26, pdel: 1, algo: 1, arp: 0, gin: 0, gout: -6, dir: 100,
    smp: { phase: 'setup', by: 2, n: 1, mode: 0, from: 0, to: 0, len: 0, slink: 1, speed: 1, attack: 1 } });
  const IMS = { on: true, sel: { A: true, B: false }, ch: { A: imNew(2), B: imNew(4) }, edit: 'num', entry: '', fEntry: null, fShown: null, guide: false,
    gains: false, msel: false, mout: false, mem: { A: 110, B: 111 }, memEntry: '', ramp: null, msg: { A: null, B: null }, boot: 0, t: 0, node: null, chs: [null, null], blink: false };
  try { const sv = JSON.parse(localStorage.getItem('as-im90') || 'null'); if (sv && sv.ch) { for (const k of ['A', 'B']) Object.assign(IMS.ch[k], sv.ch[k], { smp: { ...IMS.ch[k].smp, ...(sv.ch[k] || {}).smp, phase: 'setup', len: 0 } }); IMS.mem = sv.mem || IMS.mem; } } catch (e) { /* storage unavailable */ }
  const imSave = () => { try { localStorage.setItem('as-im90', JSON.stringify({ ch: IMS.ch, mem: IMS.mem })); } catch (e) { /* ignore */ } };
  const imMemSec = 5.24, imMemMs = imMemSec * 1000, imMs = (n) => n / (EL.ctx ? EL.ctx.sampleRate : 48000) * 1000;   // engine samples -> ms
  const imSel = () => ['A', 'B'].filter((k) => IMS.sel[k]);
  const num = (v, d = 2) => v.toFixed(d).replace('.', ',');   // the unit shows a decimal comma
  // the engine settings for a channel
  function imSend(k) {
    const c = IMS.ch[k], u = k === 'A' ? 0 : 1, db = (x) => 10 ** (x / 20), on = IMS.on;
    const mode = c.fn === 9 ? 'sample' : c.fn === 4 ? 'pitch' : 'delay';
    const set = { mode, inGain: db(c.gin), wet: on ? db(c.gout) : 0, direct: on ? c.dir / 100 : 1, delay: (c.fn === 2 ? c.echo : c.delay) / 1000, feedback: c.fn === 2 ? c.fb / 100 : 0, ratio: c.ratio, pdel: c.pdel / 1000, arp: c.arp / 100 };
    const s = c.smp, smp = { mode: s.mode === 0 ? 'loop' : s.mode <= 2 ? 'trig' : 'aux', trigBy: s.mode === 2 ? 'B' : 'A', speed: s.slink ? s.speed : 1, attack: s.attack / 1000, startBy: ['A', 'B', 'aux'][s.by] };
    if (s.phase === 'play') { smp.fromMs = s.from; smp.toMs = s.to; }
    elPost({ type: 'im90', unit: u, set, smp, ch: IMS.chs[u] });
  }
  const imCmd = (k, cmd, by) => elPost({ type: 'im90', unit: k === 'A' ? 0 : 1, cmd, by });
  // parameter pages: each returns segments of its 32-character line; the one being edited is marked (it blinks)
  function imPages(c) {
    if (IMS.gains) return [
      { key: 'gin', min: -24, max: 24, step: 0.5, seg: (e) => [['IN GAIN=', 0], [`${c.gin >= 0 ? '+' : ''}${num(c.gin, 1)}`, 1], ['dB  OUT=', 0], [`${c.gout >= 0 ? '+' : ''}${num(c.gout, 1)}`, 0], ['dB', 0]] },
      { key: 'gout', min: -60, max: 12, step: 0.5, seg: () => [['IN GAIN=', 0], [`${c.gin >= 0 ? '+' : ''}${num(c.gin, 1)}`, 0], ['dB  OUT=', 0], [`${c.gout >= 0 ? '+' : ''}${num(c.gout, 1)}`, 1], ['dB', 0]] },
      { key: 'dir', min: 0, max: 100, step: 1, seg: () => [['DIRECT SIGNAL=', 0], [String(Math.round(c.dir)).padStart(3), 1], ['%', 0]] }];
    if (c.fn === 1) return [{ key: 'delay', min: 0.04, max: imMemMs, step: 1, seg: () => [['DELAY = ', 0], [num(c.delay), 1], [' ms', 0]] }];
    if (c.fn === 2) return [
      { key: 'echo', min: 0.04, max: imMemMs, step: 1, seg: () => [['ECHO LOOP=', 0], [num(c.echo), 1], ['ms FEEDB=', 0], [`${Math.round(c.fb)}`, 0], ['%', 0]] },
      { key: 'fb', min: 0, max: 99, step: 1, seg: () => [['ECHO LOOP=', 0], [num(c.echo), 0], ['ms FEEDB=', 0], [`${Math.round(c.fb)}`, 1], ['%', 0]] }];
    if (c.fn === 4) return [
      { key: 'ratio', min: 0.25, max: 2, step: 0.001, seg: () => [['PITCH-RATIO=', 0], [num(c.ratio, 3), 1], [' DEL=', 0], [num(c.pdel), 0], ['ms', 0]] },
      { key: 'pdel', min: 1, max: imMemMs, step: 1, seg: () => [['PITCH-RATIO=', 0], [num(c.ratio, 3), 0], [' DEL=', 0], [num(c.pdel), 1], ['ms', 0]] },
      { key: 'algo', min: 1, max: 4, step: 1, seg: () => [['PITCH-ALGO=', 0], [String(c.algo), 1], [` FOR ${IM_ALGO[c.algo - 1]}`, 0]] },
      { key: 'arp', min: 0, max: 99, step: 1, seg: () => [['ARPEGGIO FEEDBACK=', 0], [String(Math.round(c.arp)).padStart(2, '0'), 1], ['%', 0]] }];
    if (c.fn === 9) {
      const s = c.smp;
      if (s.phase === 'setup') return [{ key: 'smp.by', min: 0, max: 2, step: 1, seg: () => [[String(s.by), 1], [`=${['IF A TRIGGER', 'IF B TRIGGER', 'START BY AUX'][s.by]}  RECORD SAMPLE ${s.n}`, 0]] }];
      if (s.phase === 'armed') return [{ seg: () => [[`WAITING ${['INPUT A', 'INPUT B', 'AUX'][s.by]}  SAMPLE ${s.n}`, 0]] }];
      if (s.phase === 'done') return [{ seg: () => [['AUX=NEW SAMPLE  PARAMETER=PLAY', 0]] }];
      if (s.phase === 'rec') return [{ seg: () => [[imGraph(c, true), 0]] }];
      return [
        { key: 'smp.mode', min: 0, max: 4, step: 1, seg: () => [['MODE=', 0], [String(s.mode), 1], [` ${IM_MODES[s.mode]}`, 0]] },
        { key: 'smp.from', min: 0, max: s.len, step: 1, graph: 'S', seg: () => [['MR FROM ', 0], [num(s.from), 1], [' TO ', 0], [num(s.to), 0]] },
        { key: 'smp.to', min: 0, max: s.len, step: 1, graph: 'E', seg: () => [['MR FROM ', 0], [num(s.from), 0], [' TO ', 0], [num(s.to), 1]] },
        { key: 'smp.slink', min: 0, max: 1, step: 1, seg: () => [['S-LINK=', 0], [String(s.slink), 1], [' SPEED=', 0], [num(s.speed, 3), 0]] },
        { key: 'smp.speed', min: 0.25, max: 4, step: 0.001, seg: () => [['S-LINK=', 0], [String(s.slink), 0], [' SPEED=', 0], [num(s.speed, 3), 1]] },
        { key: 'smp.attack', min: 0.1, max: 999.9, step: 0.1, seg: () => [['ATTACK TIME=', 0], [num(s.attack, 1), 1], ['ms', 0]] }];
    }
    return [{ seg: () => [[`${String(c.fn).padStart(2, '0')} = ${IMF[c.fn] || '?'}`, 0]] }];
  }
  // the sampler's graphic map: the memory as 32 cells; S / E points, the sample's area, the moving play cursor
  function imGraph(c, rec) {
    const s = c.smp, M = (window.IM90_M || [])[c === IMS.ch.A ? 0 : 1], L = 30, cell = (ms) => Math.max(0, Math.min(L - 1, Math.floor(ms / imMemMs * L)));
    if (rec) { const done = M ? cell(imMs(M.recN)) : 0; return '▮'.repeat(done) + '·'.repeat(L - done) + String(s.n).padStart(2); }
    const a = cell(Math.min(s.from, s.to)), b = cell(Math.max(s.from, s.to)), cur = M && M.pos >= 0 ? cell(imMs(M.pos)) : -1;
    let out = ''; for (let i = 0; i < L; i++) out += i === cell(s.from) ? 'S' : i === cell(s.to) ? 'E' : i === cur ? '▲' : i > a && i < b ? '|' : i < cell(s.len) ? '-' : '·';
    return out + String(s.n).padStart(2);
  }
  const imGet = (c, key) => key.startsWith('smp.') ? c.smp[key.slice(4)] : c[key];
  function imSet(c, key, v, k) {
    const pg = imPages(c).find((x) => x.key === key); if (!pg) return;
    if (v > pg.max) { v = pg.max; imSay(k, 'TOO HIGH'); } else if (v < pg.min) { v = pg.min; imSay(k, 'TOO LOW'); }
    if (pg.step >= 1 && !/delay|echo|pdel|from|to/.test(key)) v = Math.round(v);
    if (key.startsWith('smp.')) c.smp[key.slice(4)] = v; else c[key] = v;
    if (key === 'smp.mode' || key === 'smp.slink' || key === 'smp.speed' || key === 'smp.attack' || key === 'smp.from' || key === 'smp.to') { /* sent below */ }
    imSend(k); imSave();
  }
  const imSay = (k, t, ms = 1100) => { for (const kk of k ? [k] : imSel()) IMS.msg[kk] = { t, until: performance.now() + ms }; };
  const imPage = (c) => { const P = imPages(c); c.p = Math.max(0, Math.min(P.length - 1, c.p)); return P[c.p]; };
  // what each display line shows
  function imLine(k) {
    if (!IMS.on) return '';
    const now = performance.now(), c = IMS.ch[k];
    if (IMS.boot > now) return k === 'A' ? '            HELLO' : 'I AM THE INFERNAL MACHINE 90';
    const m = IMS.msg[k]; if (m && m.until > now) return m.t;
    if (!IMS.sel[k]) { /* not selected: still shows its function's page */ }
    if (IMS.fEntry != null && IMS.sel[k]) return IMS.fShown != null ? `${String(IMS.fShown).padStart(2, '0')} = ${IMF[IMS.fShown] || 'NOT AVAILABLE'}` : `FUNCTION No ?  ${IMS.fEntry.padEnd(2, '_')}`;
    const pg = imPage(c);
    if (c.fn === 9 && c.smp.phase === 'play' && IMS.edit === 'graph' && pg.graph) return imGraph(c, false);
    let line = '';
    for (const [t, ed] of pg.seg()) {
      if (ed && IMS.sel[k]) {
        if (IMS.entry && IMS.edit === 'num') line += IMS.entry.padEnd(t.length, ' ').slice(0, Math.max(t.length, IMS.entry.length));
        else line += IMS.edit !== 'num' && IMS.blink ? ' '.repeat(t.length) : t;   // the value being edited blinks in increment mode
      } else line += t;
    }
    return line;
  }
  // keys
  function imKey(id) {
    if (id === 'power') { IMS.on = !IMS.on; if (IMS.on) IMS.boot = performance.now() + 2200; ['A', 'B'].forEach(imSend); return; }
    if (!IMS.on) return;
    const sel = imSel(), now = performance.now();
    if (id === 'setA' || id === 'setB') { const k = id.slice(3); IMS.sel[k] = !IMS.sel[k]; return; }
    if (id === 'onlyA' || id === 'onlyB' || id === 'bothAB') { IMS.sel = { A: id !== 'onlyB', B: id !== 'onlyA' }; return; }
    const digit = /^\d$/.test(id) ? +id : null;
    // memory selection: the number blinks; type it and ENTER, or step it
    if (IMS.msel) {
      if (digit != null) { IMS.memEntry = (IMS.memEntry + id).slice(-3); return; }
      if (id === 'enter' || id === 'plus' || id === 'minus') {
        for (const k of sel) { let v = IMS.memEntry ? +IMS.memEntry : IMS.mem[k]; if (id === 'plus') v++; if (id === 'minus') v--; IMS.mem[k] = Math.max(1, Math.min(400, v)); if (IMS.mout) imRecall(k); }
        IMS.memEntry = ''; if (id === 'enter') IMS.msel = false; imSave(); return;
      }
    }
    if (id === 'msel') { IMS.msel = !IMS.msel; IMS.memEntry = ''; return; }
    if (id === 'min') { for (const k of sel) { imStore(k); imSay(k, `MEMORY ${String(IMS.mem[k]).padStart(3, '0')} STORED`); } return; }
    if (id === 'mout') { IMS.mout = !IMS.mout; if (IMS.mout) for (const k of sel) imRecall(k); return; }
    // calling a function
    if (id === 'func') { IMS.fEntry = ''; IMS.fShown = null; IMS.gains = false; IMS.ramp = null; return; }
    if (IMS.fEntry != null) {
      const list = Object.keys(IMF).map(Number);
      if (digit != null) { IMS.fEntry = (IMS.fEntry + id).slice(-2); IMS.fShown = null; return; }
      if (id === 'user' || id === 'plus' || id === 'minus') { const i = list.indexOf(IMS.fShown ?? +IMS.fEntry); IMS.fShown = list[(i + (id === 'minus' ? list.length - 1 : 1)) % list.length]; IMS.fEntry = String(IMS.fShown); return; }
      if (id === 'enter') { IMS.fShown = +IMS.fEntry || 0; return; }
      if (id === 'param') {
        const f = +IMS.fEntry; IMS.fEntry = null; IMS.fShown = null;
        if (!IMF[f]) { imSay(null, 'FUNCTION NOT AVAILABLE'); return; }
        if (f === 7 || f === 8) { imSay(null, 'REVERB BOARD NOT FITTED', 1600); return; }
        for (const k of sel) { const c = IMS.ch[k]; c.fn = f; c.p = 0; if (f === 9) { c.smp.phase = 'setup'; c.smp.by = 2; imCmd(k, 'stop'); } imSend(k); }
        IMS.edit = 'num'; IMS.entry = ''; imSave(); return;
      }
      if (id !== 'aux') return;
    }
    if (id === 'gains') { IMS.gains = !IMS.gains; for (const k of sel) IMS.ch[k].p = 0; IMS.entry = ''; return; }
    if (id === 'user') { for (const k of sel) { const c = IMS.ch[k]; imSay(k, `${String(c.fn).padStart(2, '0')} = ${IMF[c.fn]}`, 1800); } return; }
    if (id === 'aux') { for (const k of sel) imAux(k); return; }
    if (id === 'param') {
      const c = IMS.ch[sel[0] || 'A'];
      if (c && c.fn === 9 && (c.smp.phase === 'done' || c.smp.phase === 'armed')) { for (const k of sel) imToPlay(k); return; }
      IMS.edit = IMS.edit === 'num' ? 'inc' : IMS.edit === 'inc' && c && c.fn === 9 && c.smp.phase === 'play' ? 'graph' : 'num'; IMS.entry = ''; IMS.ramp = null; return;
    }
    // the sampler's record page: 0 / 1 + ENTER arms it on input A / B, 2 waits for AUX
    for (const k of sel) {
      const c = IMS.ch[k];
      if (c.fn === 9 && c.smp.phase === 'setup' && !IMS.gains) {
        if (digit != null && digit <= 2) { c.smp.by = digit; imSend(k); }
        if (id === 'enter' && c.smp.by < 2) { c.smp.phase = 'armed'; imSend(k); imCmd(k, 'arm', ['A', 'B'][c.smp.by]); }
        if (digit != null || id === 'enter') { imSave(); continue; }
      }
    }
    if (sel.some((k) => IMS.ch[k].fn === 9 && IMS.ch[k].smp.phase === 'setup' && !IMS.gains) && (digit != null || id === 'enter')) return;
    // values: numeric entry, increment / decrement, ramps; + / − also step through the pages in numeric mode
    if (IMS.edit === 'num') {
      if (digit != null) { IMS.entry += id; return; }
      if (id === 'enter' || ((id === 'plus' || id === 'minus') && IMS.entry)) { imCommit(); if (id === 'enter') return; }
      if (id === 'plus' || id === 'minus') for (const k of sel) { const c = IMS.ch[k], n = imPages(c).length; c.p = (c.p + (id === 'plus' ? 1 : n - 1)) % n; }
      return;
    }
    if (id === 'plus' || id === 'minus') { if (IMS.ramp) IMS.ramp.dir = id === 'plus' ? 1 : -1; else imStep(id === 'plus' ? 1 : -1); return; }
    if (digit != null) { IMS.ramp = digit === 0 ? null : { speed: digit, dir: IMS.ramp ? IMS.ramp.dir : 1, acc: 0 }; return; }
    if (id === 'enter') { const n0 = (k) => imPages(IMS.ch[k]).length; for (const k of sel) IMS.ch[k].p = (IMS.ch[k].p + 1) % n0(k); }
  }
  function imCommit() {
    const v = parseFloat(IMS.entry); IMS.entry = ''; if (!isFinite(v)) return;
    for (const k of imSel()) { const c = IMS.ch[k], pg = imPage(c); if (pg.key) imSet(c, pg.key, pg.key === 'ratio' || pg.key === 'smp.speed' ? (v >= 10 ? v / 1000 : v) : v, k); }
  }
  function imStep(dir, mult = 1) { for (const k of imSel()) { const c = IMS.ch[k], pg = imPage(c); if (pg.key) imSet(c, pg.key, imGet(c, pg.key) + dir * pg.step * mult, k); } }
  function imAux(k) {
    const c = IMS.ch[k], s = c.smp; if (c.fn !== 9) return;
    if (s.phase === 'setup' && s.by === 2) { s.phase = 'rec'; imSend(k); imCmd(k, 'arm', 'aux'); return; }
    if (s.phase === 'rec' || s.phase === 'armed') { imCmd(k, 'stop'); s.phase = 'done'; return; }
    if (s.phase === 'done') { s.n = Math.min(99, s.n + 1); s.phase = 'setup'; s.by = 2; return; }
    if (s.phase === 'play') imCmd(k, 'play');   // AUX always plays the sample from S
  }
  function imToPlay(k) {
    const c = IMS.ch[k], s = c.smp, M = (window.IM90_M || [])[k === 'A' ? 0 : 1];
    if (M && M.len) s.len = imMs(M.len);
    if (s.len) { s.len = Math.round(s.len * 100) / 100; s.from = 0; s.to = s.len; s.phase = 'play'; c.p = 0; imSend(k); imCmd(k, s.mode === 0 ? 'play' : 'stop'); }
    else { s.phase = 'setup'; imSay(k, 'NO SAMPLE RECORDED'); }
  }
  function imStore(k) { try { const all = JSON.parse(localStorage.getItem('as-im90-mem') || '{}'); const c = IMS.ch[k]; all[IMS.mem[k]] = { ...c, smp: { ...c.smp, phase: 'setup', len: 0 } }; localStorage.setItem('as-im90-mem', JSON.stringify(all)); } catch (e) { /* ignore */ } }
  function imRecall(k) { try { const all = JSON.parse(localStorage.getItem('as-im90-mem') || '{}'), m = all[IMS.mem[k]]; if (m) { Object.assign(IMS.ch[k], m, { smp: { ...IMS.ch[k].smp, ...m.smp, phase: 'setup', len: 0 } }); imSend(k); imSay(k, `MEMORY ${String(IMS.mem[k]).padStart(3, '0')} LOADED`); } else imSay(k, `MEMORY ${String(IMS.mem[k]).padStart(3, '0')} EMPTY`); } catch (e) { /* ignore */ } }
  // keys on both panels (rack pop-up and remote), the wheel
  document.querySelectorAll('.ovsync [data-ik]').forEach((g) => g.addEventListener('click', (e) => { e.stopPropagation(); imKey(g.dataset.ik); imDraw(); }));
  document.querySelectorAll('.ovsync [data-iw]').forEach((g) => {
    let last = null, ang = 0;
    const center = () => { const r = g.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); g.setPointerCapture(e.pointerId); const [cx, cy] = center(); last = Math.atan2(e.clientY - cy, e.clientX - cx); });
    g.addEventListener('pointermove', (e) => { if (last == null) return; const [cx, cy] = center(), a = Math.atan2(e.clientY - cy, e.clientX - cx); let d = a - last; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; ang += d; last = a;
      const steps = Math.trunc(ang / 0.12); if (steps) { ang -= steps * 0.12; if (IMS.entry) imCommit(); imStep(Math.sign(steps), Math.abs(steps)); imWheel(steps); imDraw(); } });
    g.addEventListener('pointerup', () => { last = null; });
    g.addEventListener('wheel', (e) => { e.preventDefault(); const st = -Math.sign(e.deltaY); imStep(st); imWheel(st); imDraw(); }, { passive: false });
  });
  let imWheelA = 0; const imWheel = (st) => { imWheelA += st * 12; for (const w of c1All('im90-wheel')) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(w.getAttribute('transform')); if (m) w.setAttribute('transform', `rotate(${imWheelA} ${m[1]} ${m[2]})`); } };
  // routing from the patchbay, as for the 160X
  function imRoute() {
    const ch = [null, null];
    ['A', 'B'].forEach((U, u) => { const send = patches.find((pc) => pc.b === `fxin:IM90 ${U}` && /^isend:/.test(pc.a)), n = send && +send.a.split(':')[1]; if (n && n <= 24 && patches.some((pc) => pc.a === `fxout:IM90 ${U}` && pc.b === `iret:${n}`)) ch[u] = n - 1; });
    ch.forEach((c, u) => { if (c !== IMS.chs[u]) { IMS.chs[u] = c; imSend(u ? 'B' : 'A'); } });
  }
  function imDraw() {
    const now = performance.now(); IMS.blink = Math.floor(now / 300) % 2 === 0;
    for (const k of ['A', 'B']) {
      sgTxt(`.im90-d${k}`, imLine(k).slice(0, 32).padEnd(32, ' ') || ' ');
      sgTxt(`.im90-m${k}`, !IMS.on ? '' : IMS.msel && IMS.sel[k] && IMS.blink ? (IMS.memEntry ? IMS.memEntry.padStart(3, ' ') : '   ') : String(IMS.mem[k]).padStart(3, '0'));
    }
    const sel = IMS.sel, c0 = IMS.ch[imSel()[0] || 'A'];
    c1Lamp('im90-kl-setA', IMS.on && sel.A); c1Lamp('im90-kl-setB', IMS.on && sel.B);
    c1Lamp('im90-kl-func', IMS.on && IMS.fEntry != null); c1Lamp('im90-kl-gains', IMS.on && IMS.gains); c1Lamp('im90-kl-msel', IMS.on && IMS.msel && IMS.blink); c1Lamp('im90-kl-mout', IMS.on && IMS.mout);
    c1Lamp('im90-kl-param', IMS.on && (IMS.edit === 'num' || IMS.blink)); c1Lamp('im90-kl-aux', IMS.on && c0.fn === 9 && (c0.smp.phase === 'rec' || c0.smp.phase === 'armed') && IMS.blink);
    c1Lamp('im90-kl-user', false); c1Lamp('im90-kl-min', false);
    // level meters: inputs and outputs of both channels (-24 .. +18 dBm, 16 segments)
    const M = window.IM90_M;
    [M && M[0] && M[0].inDb, M && M[0] && M[0].outDb, M && M[1] && M[1].inDb, M && M[1] && M[1].outDb].forEach((db, i) => {
      const lit = IMS.on && db != null ? Math.max(0, Math.min(16, Math.round((db + 8 + 24) / 42 * 16))) : 0;   // 0 VU (VU0 peak sine ~ -11 dBFS) ~ 0 dBm
      for (let j = 0; j < 16; j++) c1Lamp(`im90-lv${i}-${j}`, j < lit);
    });
  }
  function im90Tick() {
    if (EL.node !== IMS.node) { IMS.node = EL.node; if (EL.node) { ['A', 'B'].forEach(imSend); } }
    if (++IMS.t % 15 === 0) imRoute();
    // follow the sampler in the engine: armed -> recording -> done
    const M = window.IM90_M;
    if (M) ['A', 'B'].forEach((k, u) => { const s = IMS.ch[k].smp, m = M[u]; if (!m || IMS.ch[k].fn !== 9) return; if (s.phase === 'armed' && m.rec === 'rec') s.phase = 'rec'; if (s.phase === 'rec' && m.rec === 'idle' && m.len) { s.phase = 'done'; } });
    // ramps (increment mode, 1..9): faster with a higher digit
    if (IMS.ramp) { const r = IMS.ramp; r.acc += r.speed ** 2 / 25; while (r.acc >= 1) { r.acc -= 1; imStep(r.dir); } }
    imDraw();
  }
  IMS.boot = performance.now() + 2200;
  ['A', 'B'].forEach((k) => IMS.chs && imSend(k));
