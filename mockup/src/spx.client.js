  // ---------------- Yahaha SPX90II x2: each unit's own operating system (after the operating manual) ----------------
  // MEMORY ▲▼ picks a number (it flashes until RECALL loads it); PARAMETER steps through the program's parameters and
  // DATA ▲▼ changes the one on the LCD's second line; BALANCE shows BALANCE and OUT LVL; STORE writes to 31–90 (1–30 are
  // read only); UTILITY pages; FOOT TRIGGER sets what the footswitch does (step memories or fire the trigger programs);
  // BYPASS passes the dry signal. The audio runs in the tape machine's engine (spx90.js) on each unit's patch point.
  const SPXU = ['A', 'B'];
  const spxNew = (n) => ({ on: true, mem: n, sel: n, prog: n, vals: spxDefaults(n), title: SPX_PROGRAMS[n - 1].name, page: -1, bal: 0, util: -1, byp: false, ftrg: false, inK: 0.7, ch: null, msg: null, held: 0, rec: false });
  const SPX = { u: [spxNew(16), spxNew(4)], node: null, t: 0 };
  try { const sv = JSON.parse(localStorage.getItem('as-spx') || 'null'); if (sv && sv.u) sv.u.forEach((o, i) => { if (o && o.prog) Object.assign(SPX.u[i], o, { sel: o.mem, page: -1, bal: 0, util: -1, msg: null, ch: null }); }); } catch (e) { /* storage unavailable */ }
  const spxUser = () => { try { return JSON.parse(localStorage.getItem('as-spx-user') || '{}'); } catch (e) { return {}; } };
  const spxSave = () => { try { localStorage.setItem('as-spx', JSON.stringify({ u: SPX.u.map((x) => ({ on: x.on, mem: x.mem, prog: x.prog, vals: x.vals, title: x.title, byp: x.byp, ftrg: x.ftrg, inK: x.inK })) })); } catch (e) { /* ignore */ } };
  const spxSay = (U, t, ms = 1300) => { U.msg = { t, until: performance.now() + ms }; };
  function spxSend(i) {
    const U = SPX.u[i], e = spxEngine(U.prog, U.vals);
    if (!U.on || U.byp) { e.mix = 0; }
    if (!U.on) e.out = 0;
    e.inGain = (U.inK * 1.43) ** 2;   // INPUT knob: unity at about 7 / 10
    elPost({ type: 'spx', unit: i, set: e, ch: U.ch });
  }
  const spxP = (U) => SPX_PROGRAMS[U.prog - 1];
  function spxLines(U) {
    if (!U.on) return ['', ''];
    const now = performance.now(), blink = Math.floor(now / 350) % 2 === 0;
    if (U.msg && U.msg.until > now) return U.msg.t;
    if (U.util >= 0) return [['EDIT TITLE', 'MIDI CONTROL', 'MIDI PGM CHANGE', 'F.SW MEMORY RCL'][U.util], [U.title, 'CH= 1  BANK= A', `PGM ${U.sel} = MEM ${U.sel}`, 'RANGE  1 TO 30'][U.util]];
    if (U.sel !== U.mem) { const um = spxUser()[U.sel]; return [U.sel <= 30 ? SPX_PROGRAMS[U.sel - 1].name : um ? um.title : '', U.sel > 30 && !um ? '    NO DATA' : '']; }
    if (U.bal) return [U.title, U.bal === 1 ? `BALANCE=${String(U.vals.bal).padStart(6)}%` : `OUT LVL=${String(U.vals.out).padStart(6)}%`];
    if (U.page >= 0) { const q = spxP(U).params[U.page]; return [U.title, q.action && U.rec && q.id === 'record' && blink ? '' : spxShow(q, U.vals[q.id])]; }
    return [U.title, U.byp ? '     BYPASS' : ''];
  }
  function spxStep(U, dir) {
    if (U.bal) { const k = U.bal === 1 ? 'bal' : 'out'; U.vals[k] = Math.max(0, Math.min(100, U.vals[k] + dir)); return true; }
    if (U.page < 0) return false;
    const q = spxP(U).params[U.page];
    if (q.action) { if (dir > 0) spxAction(U, q.id); return false; }
    if (q.list) { const i = q.list.indexOf(U.vals[q.id]); U.vals[q.id] = q.list[Math.max(0, Math.min(q.list.length - 1, i + dir))]; return true; }
    const st = q.step * (Math.abs(U.vals[q.id]) >= 100 && q.step < 1 ? 10 : 1);   // coarser steps on long times
    U.vals[q.id] = Math.max(q.min, Math.min(q.max, Math.round((U.vals[q.id] + dir * st) / q.step) * q.step)); return true;
  }
  function spxAction(U, a) {   // FREEZE: RECORD (manual: now; auto: on the next sound), OVER DUB, PLAY
    const i = SPX.u.indexOf(U);
    if (a === 'record') { U.rec = true; elPost({ type: 'spx', unit: i, set: { ...spxEngine(U.prog, U.vals), mode: 'rec' } }); spxSay(U, [U.title, U.vals.rec === 'AUTO' ? ' REC: WAIT INPUT' : '   RECORDING']); setTimeout(() => { U.rec = false; }, 2000); }
    if (a === 'play') { U.rec = false; elPost({ type: 'spx', unit: i, set: { ...spxEngine(U.prog, U.vals), mode: 'play' } }); spxSay(U, [U.title, '     PLAY'], 800); }
    if (a === 'overdub') spxSay(U, [U.title, ' OVER DUB: N/A'], 1200);
  }
  function spxRecall(U) {
    if (U.sel <= 30) { U.prog = U.sel; U.vals = spxDefaults(U.sel); U.title = SPX_PROGRAMS[U.sel - 1].name; }
    else { const m = spxUser()[U.sel]; if (!m) { spxSay(U, ['MEMORY ' + U.sel, '    NO DATA']); U.sel = U.mem; return; } U.prog = m.prog; U.vals = { ...m.vals }; U.title = m.title; }
    U.mem = U.sel; U.page = -1; U.bal = 0; U.util = -1;
  }
  function spxKey(i, k) {
    const U = SPX.u[i];
    if (k === 'power') { U.on = !U.on; U.sel = U.mem; spxSend(i); spxSave(); return; }
    if (!U.on) return;
    switch (k) {
      case 'mup': case 'mdn': U.sel = Math.max(1, Math.min(90, U.sel + (k === 'mup' ? 1 : -1))); U.util = -1; U.bal = 0; break;
      case 'recall': spxRecall(U); break;
      case 'param': if (U.sel !== U.mem) U.sel = U.mem; U.bal = 0; U.util = -1; U.page = (U.page + 1) % spxP(U).params.length; break;
      case 'dup': case 'ddn': if (U.util >= 0) break; if (spxStep(U, k === 'dup' ? 1 : -1)) U.title = U.mem > 30 ? U.title : U.title; break;
      case 'bal': U.util = -1; U.bal = (U.bal + 1) % 3; if (U.bal) U.page = -1; break;
      case 'store': {
        const to = U.sel; if (to <= 30) { spxSay(U, ['#1~#30', '   READ ONLY']); break; }
        const all = spxUser(); all[to] = { prog: U.prog, vals: U.vals, title: U.title }; try { localStorage.setItem('as-spx-user', JSON.stringify(all)); } catch (e) { /* ignore */ }
        U.mem = to; spxSay(U, [U.title, `  STORED IN ${to}`]); break;
      }
      case 'util': U.bal = 0; U.page = -1; U.util = U.util >= 3 ? -1 : U.util + 1; break;
      case 'ftrg': U.ftrg = !U.ftrg; break;
      case 'byp': case 'footb': U.byp = !U.byp; break;
      case 'foot':   // the footswitch: fire the trigger, or step to the next memory
        if (U.ftrg) { if (spxP(U).trig) { if (/FREEZE/.test(U.title) || /^FREEZE/.test(spxP(U).name)) spxAction(U, 'play'); else elPost({ type: 'spx', unit: i, cmd: 'trig' }); } }
        else { U.sel = U.mem >= 30 ? 1 : U.mem + 1; spxRecall(U); }
        break;
    }
    spxSend(i); spxSave();
  }
  document.querySelectorAll('.ovsync [data-sk]').forEach((g) => {
    const [u, k] = g.dataset.sk.split(':'), i = SPXU.indexOf(u);
    if (k === 'input') {   // drag the INPUT knob
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); g.setPointerCapture(e.pointerId); const y0 = e.clientY, v0 = SPX.u[i].inK;
        const mv = (ev) => { SPX.u[i].inK = Math.max(0, Math.min(1, v0 + (y0 - ev.clientY) / 200)); spxSend(i); spxDraw(); };
        const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); spxSave(); };
        g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); });
      return;
    }
    let rpt = null;   // DATA and MEMORY keys repeat while held
    const go = () => { spxKey(i, k); spxDraw(); };
    g.addEventListener('pointerdown', (e) => { e.stopPropagation(); go(); if (/^(dup|ddn|mup|mdn)$/.test(k)) { let n = 0; rpt = setInterval(() => { if (++n > 4) go(); }, 90); } });
    for (const ev of ['pointerup', 'pointerleave']) g.addEventListener(ev, () => { clearInterval(rpt); rpt = null; });
  });
  function spxRoute() {
    SPXU.forEach((u, i) => {
      const send = patches.find((pc) => /^isend:/.test(pc.a) && (pc.b === `fxin:SPX ${u} L` || pc.b === `fxin:SPX ${u} R`)), n = send && +send.a.split(':')[1];
      const ch = n && n <= 24 && patches.some((pc) => (pc.a === `fxout:SPX ${u} L` || pc.a === `fxout:SPX ${u} R`) && pc.b === `iret:${n}`) ? n - 1 : null;
      if (ch !== SPX.u[i].ch) { SPX.u[i].ch = ch; spxSend(i); }
      sgTxt(`.spx-${u}-route`, ch == null ? 'NOT PATCHED' : `INSERT · CH ${ch + 1}${NAMES[ch] ? ' ' + NAMES[ch] : ''}`);
    });
  }
  function spxDraw() {
    const now = performance.now(), blink = Math.floor(now / 350) % 2 === 0, M = window.SPX_M;
    SPXU.forEach((u, i) => {
      const U = SPX.u[i], [l1, l2] = spxLines(U);
      sgTxt(`.spx-${u}-l1`, (l1 || '').padEnd(16).slice(0, 16)); sgTxt(`.spx-${u}-l2`, (l2 || '').padEnd(16).slice(0, 16));
      sgTxt(`.spx-${u}-mem`, !U.on ? '' : U.sel !== U.mem && !blink ? '' : String(U.sel).padStart(2, '0'));
      c1Lamp(`spx-${u}-led-param`, U.on && U.page >= 0); c1Lamp(`spx-${u}-led-util`, U.on && U.util >= 0); c1Lamp(`spx-${u}-led-ftrg`, U.on && U.ftrg); c1Lamp(`spx-${u}-led-byp`, U.on && U.byp);
      const db = M && M[i] && U.ch != null && U.on ? M[i].inDb + 12 : -99;   // 0 on the meter ~ -12 dBFS
      [0, -3, -6, -10, -15, -20, -30].forEach((t, j) => c1Lamp(`spx-${u}-m${j}`, db >= t));
      for (const g of c1All(`spx-${u}-in`)) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(g.getAttribute('transform')); if (m) g.setAttribute('transform', `rotate(${(-150 + U.inK * 300).toFixed(1)} ${m[1]} ${m[2]})`); }
    });
  }
  function spxTick() {
    if (EL.node !== SPX.node) { SPX.node = EL.node; if (EL.node) SPXU.forEach((u, i) => spxSend(i)); }
    if (++SPX.t % 15 === 0) spxRoute();
    spxDraw();
  }
