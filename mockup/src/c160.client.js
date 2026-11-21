  // ---------------- dbk 160X compressors (two 1U units in the rack; the audio runs in the tape machine's engine) ----------
  // Settings live here and go to the worklet; each unit's channel comes from the patchbay (INSERT SEND n -> 160X IN,
  // 160X OUT -> INSERT RETURN n). The panel's LEDs follow the worklet's meters ~30 times a second.
  const C1 = { units: ['A', 'B'], st: [
    { threshold: -20, ratio: 0.38, outGain: 2, overEasy: true, bypass: false, slave: false, display: 'in' },
    { threshold: -16, ratio: 0.27, outGain: 2, overEasy: true, bypass: false, slave: false, display: 'in' }], ch: [null, null], node: null, t: 0 };
  const C1_DEF = JSON.parse(JSON.stringify(C1.st));
  try { const sv = JSON.parse(localStorage.getItem('as-c160') || 'null'); if (Array.isArray(sv)) sv.forEach((o, i) => Object.assign(C1.st[i], o)); } catch (e) { /* storage unavailable */ }
  const c1Save = () => { try { localStorage.setItem('as-c160', JSON.stringify(C1.st)); } catch (e) { /* ignore */ } };
  const c1Send = (u) => elPost({ type: 'c160', unit: u, params: C1.st[u], ch: C1.ch[u] });
  // elements, looked up once (the page is huge)
  const c1Els = {}; const c1All = (cls) => c1Els[cls] || (c1Els[cls] = [...document.querySelectorAll('.' + cls)]);
  const c1Lamp = (cls, on) => { for (const e of c1All(cls)) { const v = on ? 1 : 0; if (e._v !== v) { e._v = v; e.setAttribute('opacity', v); } } };
  const c1Ang = (k, v) => { const K = globalThis.C160_KNOBS ? C160_KNOBS[k] : null; return K ? -K.sweep / 2 + (v - K.min) / (K.max - K.min) * K.sweep : 0; };
  const C1_KN = { threshold: { min: -40, max: 20, sweep: 300 }, ratio: { min: 0, max: 1, sweep: 320 }, outGain: { min: -20, max: 20, sweep: 300 } };
  function c1Knobs(u) {
    const U = C1.units[u];
    for (const k of Object.keys(C1_KN)) {
      const K = C1_KN[k], a = -K.sweep / 2 + (C1.st[u][k] - K.min) / (K.max - K.min) * K.sweep;
      for (const g of c1All(`c160-${U}-k-${k}`)) { const old = g.getAttribute('transform') || ''; const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(old); if (m) g.setAttribute('transform', `rotate(${a.toFixed(1)} ${m[1]} ${m[2]})`); }
    }
  }
  const c1Fmt = (u, k) => { const v = C1.st[u][k]; return k === 'ratio' ? ratioLabel(ratioSlope(v)) : `${v > 0 ? '+' : ''}${v.toFixed(1)} ${k === 'threshold' ? 'dBu' : 'dB'}`; };
  const c1Say = (s) => { const m = document.getElementById('c160-msg'); if (m) m.textContent = s; };
  function c1Set(u, k, v, say = true) {
    const K = C1_KN[k]; if (K) v = Math.max(K.min, Math.min(K.max, v));
    C1.st[u][k] = v; c1Send(u); c1Save(); c1Knobs(u);
    if (say) c1Say(`${C1.units[u]} · ${({ threshold: 'THRESHOLD', ratio: 'RATIO', outGain: 'OUTPUT GAIN' })[k] || k.toUpperCase()} ${K ? c1Fmt(u, k) : (k === 'display' ? (v === 'out' ? 'OUTPUT' : 'INPUT') : v ? 'IN' : 'OUT')}`);
  }
  // knobs: drag up / down (fine with Shift), wheel, double-click resets
  document.querySelectorAll('.ovsync [data-ck]').forEach((g) => {
    const [U, k] = g.dataset.ck.split(':'), u = C1.units.indexOf(U), K = C1_KN[k], span = K.max - K.min;
    g.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId);
      const y0 = e.clientY, v0 = C1.st[u][k];
      const mv = (ev) => c1Set(u, k, v0 + (y0 - ev.clientY) / (ev.shiftKey ? 900 : 220) * span);
      const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up);
    });
    g.addEventListener('wheel', (e) => { e.preventDefault(); c1Set(u, k, C1.st[u][k] - Math.sign(e.deltaY) * span / 120); }, { passive: false });
    g.addEventListener('dblclick', () => c1Set(u, k, C1_DEF[u][k]));
  });
  document.querySelectorAll('.ovsync [data-cb]').forEach((g) => g.addEventListener('click', (e) => {
    e.stopPropagation(); const [U, k] = g.dataset.cb.split(':'), u = C1.units.indexOf(U);
    if (k === 'display') c1Set(u, 'display', C1.st[u].display === 'in' ? 'out' : 'in'); else c1Set(u, k, !C1.st[u][k]);
    if (k === 'slave' && C1.st[u].slave) { if (C1.st[1 - u].slave) c1Set(1 - u, 'slave', false, false); c1Say(`${U} slaved to ${C1.units[1 - u]}: a stereo pair on the louder channel, with ${C1.units[1 - u]}'s controls`); }
  }));
  // routing: which channel each unit is inserted on (both halves of the insert must be patched to the same channel)
  function c1Route() {
    const ch = [null, null];
    C1.units.forEach((U, u) => {
      const send = patches.find((pc) => pc.b === `fxin:160X ${U}` && /^isend:/.test(pc.a)), n = send && +send.a.split(':')[1];
      if (n && n <= 24 && patches.some((pc) => pc.a === `fxout:160X ${U}` && pc.b === `iret:${n}`)) ch[u] = n - 1;
    });
    ch.forEach((c, u) => { if (c !== C1.ch[u]) { C1.ch[u] = c; c1Send(u); } });
    C1.units.forEach((U, u) => sgTxt(`.c160-${U}-route`, C1.ch[u] == null ? 'NOT PATCHED' : `INSERT · CH ${C1.ch[u] + 1}${NAMES[C1.ch[u]] ? ' ' + NAMES[C1.ch[u]] : ''}`));
  }
  function c160Tick() {
    if (EL.node !== C1.node) { C1.node = EL.node; if (EL.node) [0, 1].forEach(c1Send); }   // a fresh audio engine gets the settings
    if (++C1.t % 15 === 0) c1Route();
    const M = window.C160_M;
    C1.units.forEach((U, u) => {
      const s = C1.st[u], m = M && M[u];
      c1Lamp(`c160-${U}-bypass`, s.bypass); c1Lamp(`c160-${U}-slave`, s.slave);
      c1Lamp(`c160-${U}-d-in`, s.display === 'in'); c1Lamp(`c160-${U}-d-out`, s.display === 'out');
      const live = m && C1.ch[u] != null;
      for (let i = 0; i < 19; i++) c1Lamp(`c160-${U}-lv${i}`, live && i < m.level);
      for (let i = 0; i < 12; i++) c1Lamp(`c160-${U}-gr${i}`, live && !s.bypass && i < m.gr);
      c1Lamp(`c160-${U}-th-below`, live && m.th === 'below'); c1Lamp(`c160-${U}-th-knee`, live && m.th === 'knee'); c1Lamp(`c160-${U}-th-above`, live && m.th === 'above');
    });
  }
  [0, 1].forEach(c1Knobs);
