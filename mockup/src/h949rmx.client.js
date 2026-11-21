  // ---------------- Evertide H949 Harmonizer and AXS RMX16: their front panels ----------------
  const H949_KEYS = [6.25, 12.5, 25, 50, 100, 200];   // the delay keys, in ms (both rows)
  const hrDrag = (g, get, set, done) => {   // a knob: drag up / down, wheel
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId); const y0 = e.clientY, v0 = get();
      const mv = (ev) => set(Math.max(0, Math.min(1, v0 + (y0 - ev.clientY) / 220))); const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); done && done(); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); });
    g.addEventListener('wheel', (e) => { e.preventDefault(); set(Math.max(0, Math.min(1, get() - Math.sign(e.deltaY) * 0.02))); done && done(); }, { passive: false });
  };
  const hrRot = (cls, v, sweep = 300) => { for (const g of c1All(cls)) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(g.getAttribute('transform')); if (m) g.setAttribute('transform', `rotate(${(-sweep / 2 + v * sweep).toFixed(1)} ${m[1]} ${m[2]})`); } };
  const hrRoute = (jack) => { const send = patches.find((pc) => pc.b === `fxin:${jack}` && /^isend:/.test(pc.a)), n = send && +send.a.split(':')[1]; return n && n <= 24 && patches.some((pc) => pc.a === `fxout:${jack}` && pc.b === `iret:${n}`) ? n - 1 : null; };

  // ---- H949: keys latch; the DELAY ONLY and MAIN rows add up; FUNCTION SELECT flips the four keys between sets
  const H9 = { on: true, line: false, repeat: false, fsel: false, func: 0, alg: 2, cm: 0, d: [0, 0, 0, 0, 0, 0], m: [0, 0, 0, 0, 0, 0], input: 0.7, manual: 0.333, fbm: 0, fbd: 0, eql: 0.5, eqh: 0.5, ch: null, node: null, t: 0 };
  try { Object.assign(H9, JSON.parse(localStorage.getItem('as-h949') || '{}'), { ch: null, node: null, t: 0 }); } catch (e) { /* storage */ }
  const h9Save = () => { try { const { ch, node, t, ...st } = H9; localStorage.setItem('as-h949', JSON.stringify(st)); } catch (e) { /* ignore */ } };
  const H9_GREEN = ['delay', 'random', 'flange', 'reverse'], H9_RED = ['norm', 'extend', 'sharp', 'flat'];
  const h9Func = () => (H9.fsel ? H9_RED : H9_GREEN)[H9.func];
  const h9Sum = (row) => row.reduce((a, on, i) => a + (on ? H949_KEYS[i] : 0), 0);
  const h9RatioNow = () => h949Ratio(h9Func(), H9.manual);
  function h9Send() {
    const f = h9Func(), pitch = H9.fsel;
    elPost({ type: 'h949', ch: H9.ch, set: { on: H9.on, line: H9.line, repeat: H9.repeat, func: f, alg: H9.alg, ratio: pitch ? h9RatioNow() : 1, rate: H9.manual, mainMs: h9Sum(H9.m), dlyMs: h9Sum(H9.d),
      fbMain: H9.fbm * 0.95, fbDly: H9.fbd * 0.95, eqLow: (H9.eql - 0.5) * 24, eqHigh: (H9.eqh - 0.5) * 24, inGain: (H9.input * 1.43) ** 2 } });
  }
  function h9Key(k) {
    if (k === 'power') H9.on = !H9.on;
    else if (!H9.on) return;
    else if (k === 'line') H9.line = !H9.line;
    else if (k === 'repeat') H9.repeat = !H9.repeat;
    else if (k === 'fsel') H9.fsel = !H9.fsel;
    else if (k === 'alg') H9.alg = H9.alg === 1 ? 2 : 1;
    else if (/^f\d$/.test(k)) H9.func = +k[1];
    else if (/^cm\d$/.test(k)) H9.cm = +k[2];
    else if (/^d\d$/.test(k)) H9.d[+k[1]] ^= 1;
    else if (/^m\d$/.test(k)) H9.m[+k[1]] ^= 1;
    h9Send(); h9Save();
  }
  document.querySelectorAll('.ovsync [data-hk]').forEach((g) => {
    const k = g.dataset.hk;
    if (['input', 'manual', 'fbm', 'fbd', 'eql', 'eqh'].includes(k)) hrDrag(g, () => H9[k], (v) => { H9[k] = v; h9Send(); }, h9Save);
    else g.addEventListener('click', (e) => { e.stopPropagation(); h9Key(k); });
  });
  function h949Tick() {
    if (EL.node !== H9.node) { H9.node = EL.node; if (EL.node) h9Send(); }
    if (++H9.t % 15 === 0) { const ch = hrRoute('H949'); if (ch !== H9.ch) { H9.ch = ch; h9Send(); } sgTxt('.h949-route', ch == null ? 'NOT PATCHED' : `ALONGSIDE CH ${ch + 1}${NAMES[ch] ? ' ' + NAMES[ch] : ''}`); }
    const on = H9.on, f = h9Func(), flick = Math.floor(performance.now() / 180) % 3;
    // the display: the pitch ratio (it keeps reading in DELAY too), the last digit flickering by one
    const r = H9.fsel ? h9RatioNow() : h949Ratio('norm', H9.manual), last = Math.round(r * 1000) + (H9.fsel && on ? [0, 1, -1][flick] * (f === 'sharp' || f === 'flat' ? 0 : 1) : 0);
    sgTxt('.h949-disp', on ? (Math.max(0, last) / 1000).toFixed(3) : '');
    for (const k of ['input', 'manual', 'fbm', 'fbd', 'eql', 'eqh']) hrRot(`h949-k-${k}`, H9[k]);
    const dn = (k, v) => { for (const e of c1All(`h949-kd-${k}`)) { const o = v ? 0.28 : 0; if (e._o !== o) { e._o = o; e.setAttribute('opacity', o); } } };   // a latched key sits darker
    H9.d.forEach((v, i) => dn('d' + i, v)); H9.m.forEach((v, i) => dn('m' + i, v)); dn('line', H9.line); dn('repeat', H9.repeat); dn('fsel', H9.fsel); dn('alg', H9.alg === 1); [0, 1, 2, 3].forEach((i) => dn('f' + i, i === H9.func)); [0, 1, 2].forEach((i) => dn('cm' + i, i === H9.cm));
    c1Lamp('h949-l-repeat', on && H9.repeat); c1Lamp('h949-l-fsel', on && H9.fsel);
    for (let i = 0; i < 4; i++) for (const e of c1All(`h949-lf${i}`)) { const lit = on && i === H9.func, col = H9.fsel ? '#ff3b2f' : '#59e05a'; if (e._c !== col + lit) { e._c = col + lit; e.setAttribute('fill', col); e.setAttribute('opacity', lit ? 1 : 0); } }
    for (let i = 0; i < 3; i++) c1Lamp(`h949-lc${i}`, on && i === H9.cm);
    const M = window.H949_M, pk = M && H9.ch != null && on ? M.peakDb : -99;   // LIMIT, NOMINAL x3, PRESENT
    [-1, -6, -12, -20, -40].forEach((t, i) => c1Lamp(`h949-m${i}`, pk >= t));
    for (const e of c1All('h949-pw')) { const y = on ? 'translate(0,0)' : 'translate(0,5)'; if (e._y !== y) { e._y = y; e.setAttribute('transform', y); } }
  }

  // ---- RMX16: function key, then keypad + # (or nudge); save / recall + digit + #
  const RMXS = { on: true, prog: 1, pre: 0, decay: 4.0, low: 0, high: -4, store: 't', fn: null, entry: '', err: null, pot: false, potV: 0.4, inK: 0.7, outK: 0.7, echoSel: 'A', echoB: 120, ch: null, node: null, t: 0 };
  try { Object.assign(RMXS, JSON.parse(localStorage.getItem('as-rmx') || '{}'), { fn: null, entry: '', err: null, ch: null, node: null, t: 0 }); } catch (e) { /* storage */ }
  const rxSave = () => { try { const { ch, node, t, fn, entry, err, ...st } = RMXS; localStorage.setItem('as-rmx', JSON.stringify(st)); } catch (e) { /* ignore */ } };
  const rxP = () => RMX_PROGRAMS_UI[RMXS.prog - 1];
  const rxSend = () => elPost({ type: 'rmx', ch: RMXS.ch, set: { prog: RMXS.prog, pre: RMXS.pre, decay: RMXS.decay, low: RMXS.low, high: RMXS.high, echoB: RMXS.echoB, inGain: RMXS.on ? (RMXS.inK * 1.43) ** 2 : 0, outGain: RMXS.on ? (RMXS.outK * 1.43) ** 2 : 0 } });
  const rxLimits = { predelay: () => [0, rxP().fam === 'echo' && RMXS.echoSel === 'B' ? 150 : rxP().preMax || 0, 10], decay: () => [0, 9.9, 0.1], low: () => [-4, 4, 1], high: () => [-9, 0, 1], program: () => [1, 18, 1] };
  const rxGet = (fn) => fn === 'predelay' ? (rxP().fam === 'echo' && RMXS.echoSel === 'B' ? RMXS.echoB : RMXS.pre) : fn === 'decay' ? RMXS.decay : fn === 'low' ? RMXS.low : fn === 'high' ? RMXS.high : RMXS.prog;
  function rxSet(fn, v) {
    const [lo, hi] = rxLimits[fn](); if (!(v >= lo && v <= hi) || ((fn === 'low') && !rxP().low) || (fn === 'high' && !rxP().high)) { RMXS.err = fn; return false; }
    if (fn === 'program') { RMXS.prog = Math.round(v); const P = rxP(); RMXS.pre = Math.min(P.preMax, P.pre); RMXS.decay = P.decay; RMXS.low = 0; RMXS.high = P.high ? -4 : 0; RMXS.store = 't'; RMXS.echoSel = 'A'; }
    else if (fn === 'predelay') { if (rxP().fam === 'echo' && RMXS.echoSel === 'B') RMXS.echoB = Math.round(v); else RMXS.pre = Math.round(v); }
    else if (fn === 'decay') RMXS.decay = Math.round(v * 10) / 10; else RMXS[fn] = Math.round(v);
    RMXS.err = null; rxSend(); rxSave(); return true;
  }
  function rxKey(k) {
    if (k === 'power') { RMXS.on = !RMXS.on; rxSend(); rxSave(); return; }
    if (!RMXS.on) return;
    if (['program', 'predelay', 'decay', 'low', 'high', 'save', 'recall'].includes(k)) { RMXS.fn = RMXS.fn === k ? null : k; RMXS.entry = ''; RMXS.err = null; return; }
    if (k === 'potk') { RMXS.pot = !RMXS.pot; return; }
    if (k === 'ndn' || k === 'nup') { const fn = RMXS.fn || 'program'; if (!rxLimits[fn]) return; const [, , st] = rxLimits[fn](); rxSet(fn, rxGet(fn) + (k === 'nup' ? st : -st)); return; }
    if (!k.startsWith('pad')) return;
    const c = k.slice(3);
    if ((c === 'A' || c === 'B') && rxP().fam === 'echo') { RMXS.echoSel = c; return; }
    if (!RMXS.fn) return;
    if (c === '#') {   // enter
      const fn = RMXS.fn, t = RMXS.entry; RMXS.entry = '';
      if (fn === 'save' || fn === 'recall') {
        const n = +t; if (!(n >= 1 && n <= 9)) { RMXS.err = 'store'; return; }
        const all = (() => { try { return JSON.parse(localStorage.getItem('as-rmx-store') || '{}'); } catch (e) { return {}; } })();
        if (fn === 'save') { all[n] = { prog: RMXS.prog, pre: RMXS.pre, decay: RMXS.decay, low: RMXS.low, high: RMXS.high, echoB: RMXS.echoB }; try { localStorage.setItem('as-rmx-store', JSON.stringify(all)); } catch (e) { /* ignore */ } RMXS.store = String(n); }
        else { const m = all[n]; if (!m) { RMXS.err = 'store'; return; } const changed = m.prog !== RMXS.prog; Object.assign(RMXS, m); RMXS.store = String(n); if (changed) rxSend(); else rxSend(); }
        RMXS.fn = null; rxSave(); return;
      }
      const v = parseFloat(t.replace(/\*/g, fn === 'decay' ? '.' : '-'));
      if (t === '' || !isFinite(v) || !rxSet(fn, v)) { RMXS.err = fn; return; }
      RMXS.fn = null; return;
    }
    if (/^[0-9*]$/.test(c)) RMXS.entry = (RMXS.entry + c).slice(-4);
  }
  document.querySelectorAll('.ovsync [data-rk]').forEach((g) => {
    const k = g.dataset.rk;
    if (k === 'in' || k === 'out') hrDrag(g, () => RMXS[k + 'K'], (v) => { RMXS[k + 'K'] = v; rxSend(); }, rxSave);
    else if (k === 'pot') hrDrag(g, () => RMXS.potV, (v) => { RMXS.potV = v; if (RMXS.pot) rxSet('decay', Math.round(v * 99) / 10); }, rxSave);
    else { let rpt = null; const go = () => rxKey(k);
      g.addEventListener('pointerdown', (e) => { e.stopPropagation(); go(); if (k === 'ndn' || k === 'nup') { let n = 0; rpt = setInterval(() => { if (++n > 4) go(); }, 90); } });
      for (const ev of ['pointerup', 'pointerleave']) g.addEventListener(ev, () => { clearInterval(rpt); rpt = null; }); }
  });
  function rmxTick() {
    if (EL.node !== RMXS.node) { RMXS.node = EL.node; if (EL.node) rxSend(); }
    if (++RMXS.t % 15 === 0) { const ch = hrRoute('RMX16'); if (ch !== RMXS.ch) { RMXS.ch = ch; rxSend(); } sgTxt('.rmx-route', ch == null ? 'NOT PATCHED' : `ALONGSIDE CH ${ch + 1}${NAMES[ch] ? ' ' + NAMES[ch] : ''}`); }
    const on = RMXS.on, P = rxP(), blink = Math.floor(performance.now() / 300) % 2 === 0;
    const show = (fn, txt, w2) => { if (!on) return ''; if (RMXS.err === fn) return 'E'.padStart(w2); if (RMXS.fn === fn && RMXS.entry) return RMXS.entry.replace(/\*/g, fn === 'decay' ? '.' : '-').padStart(w2).slice(-w2); return txt; };
    const sg = (n2) => (n2 > 0 ? '+' + n2 : n2 < 0 ? String(n2) : ' 0');
    sgTxt('.rmx-prog', show('program', String(RMXS.prog).padStart(2), 2));
    sgTxt('.rmx-pre', show('predelay', P.preMax ? String(P.fam === 'echo' && RMXS.echoSel === 'B' ? RMXS.echoB : RMXS.pre).padStart(3) : '   ', 3));
    sgTxt('.rmx-dec', show('decay', RMXS.decay.toFixed(1), 3));
    sgTxt('.rmx-low', show('low', P.low ? sg(RMXS.low) : '  ', 2)); sgTxt('.rmx-high', show('high', P.high ? sg(RMXS.high) : '  ', 2));
    sgTxt('.rmx-store', on ? (RMXS.err === 'store' ? ' E' : (RMXS.fn === 'save' || RMXS.fn === 'recall') && RMXS.entry ? ' ' + RMXS.entry.slice(-1) : RMXS.store.padStart(2)) : '');
    sgTxt('.rmx-name', on ? (P.fam === 'echo' ? `ECHO ${RMXS.echoSel}` : P.name) : '');
    for (const k of ['program', 'predelay', 'decay', 'low', 'high', 'save', 'recall']) c1Lamp(`rmx-l-${k}`, on && (RMXS.fn === k) && (RMXS.err !== k && RMXS.err !== 'store' || blink));
    c1Lamp('rmx-l-potk', on && RMXS.pot); c1Lamp('rmx-l-ndn', false); c1Lamp('rmx-l-nup', false);
    for (const k of ['in', 'out', 'pot']) hrRot(`rmx-k-${k}`, k === 'pot' ? RMXS.potV : RMXS[k + 'K']);
    const M = window.RMX_M, pk = M && RMXS.ch != null && on ? M.peakDb : -99;   // o/flo: red overflow, then -6 / -12 / -18 dB
    [-0.5, -6, -12, -18].forEach((t, i) => c1Lamp(`rmx-m${i}`, pk >= t));
    for (const e of c1All('rmx-pw')) { const o = on ? 1 : 0; if (e._o !== o) { e._o = o; e.setAttribute('opacity', o); } }
    for (const e of c1All('rmx-sw')) { const y = on ? 'translate(0,0)' : 'translate(0,5)'; if (e._y !== y) { e._y = y; e.setAttribute('transform', y); } }
  }
