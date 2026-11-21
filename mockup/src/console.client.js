  // ---------------- the JH-Mix console, live: channel strips, faders, the stereo bus (audio in jhmix.js, in the worklet) ----
  // Each strip's settings (the section pop-ups and the drawing's keys and knobs) go to the engine as they change; the faders
  // on the desk drag; the bridge VUs read the channels after their faders and the stereo bus. Sends 1-6 are the aux buses
  // at the patchbay (SEND 1 feeds the 224X to start with, its returns come back on channels 25 / 26).
  const CON = { fader: [], master: 0.2, node: null, t: 0 };
  const fdrEls = [...document.querySelectorAll('.cmi-fdr')], mfdr = document.querySelector('.cmi-mfdr'), FB = { top: 96, bot: 346 };
  fdrEls.forEach((g) => { CON.fader[+g.dataset.ch] = +g.dataset.pos; });
  try { const sv = JSON.parse(localStorage.getItem('as-con') || 'null'); if (sv) { if (sv.fader) sv.fader.forEach((v, i) => { if (v != null) CON.fader[i] = v; }); if (sv.master != null) CON.master = sv.master; } } catch (e) { /* storage unavailable */ }
  let conSaveT = 0; const conSave = () => { clearTimeout(conSaveT); conSaveT = setTimeout(() => { try { localStorage.setItem('as-con', JSON.stringify({ fader: CON.fader, master: CON.master })); } catch (e) { /* ignore */ } }, 300); };
  const conPost = (o) => elPost({ type: 'con', ...o });
  // a strip's state -> the engine's channel parameters
  function conParams(ch) {
    const s = chState('cmi', ch);
    return { src: s.src_in ? 'in' : 'tape', trim: s.trim ?? 0, phase: !!s.phase, eq_in: s.eq_in !== false, hf_f: s.hf_f, hf_g: s.hf_g, mf_f: s.mf_f, mf_g: s.mf_g, lf_f: s.lf_f, lf_g: s.lf_g, hpf: !!s.hpf, lpf: !!s.lpf,
      pan: s.pan ?? 0, mute: !!s.mute, solo: !!s.solo, fader: CON.fader[ch] ?? 0.2,
      s1: s.s1 ?? -60, s2: s.s2 ?? -60, s12pre: !!s.s12pre, s34: s.s34 ?? -60, s34p: s.s34p ?? 0, s34pre: !!s.s34pre, s56: s.s56 ?? -60, s56p: s.s56p ?? 0, s56pre: s.s56pre !== false };
  }
  window.CON_CHANGED = (con, ch) => { if (con === 'cmi' && EL.node) conPost({ ch, set: conParams(ch) }); };
  function conRoute() {   // line inputs 25-32 and the 224X's send, from the patchbay
    const lineSrc = Array.from({ length: 8 }, (_, j) => { const pc = patches.find((q) => q.b === `lin:LINE ${25 + j}` && /^fxout:/.test(q.a)); return pc ? pc.a.slice(6) : null; });
    const sp = patches.find((q) => q.b === 'fxin:224 L' && /^aux:SEND \d$/.test(q.a)), rvSend = sp ? +sp.a.slice(9) - 1 : -1;
    const key = JSON.stringify([lineSrc, rvSend]); if (key !== CON.route) { CON.route = key; conPost({ lineSrc, rvSend }); }
  }
  function conSendAll() { CON.route = ''; conPost({ all: Array.from({ length: 32 }, (_, i) => conParams(i)), master: CON.master }); conRoute(); }
  // faders: drag, wheel, double-click = 0 dB
  const capPos = (g, pos) => { const y = FB.top + pos * (FB.bot - FB.top) - +g.dataset.y0; g.setAttribute('transform', `translate(0 ${y.toFixed(2)})`); };
  const conDb = (pos) => { const d = jmFaderDb(pos); return d === -Infinity ? '−∞' : `${d > 0 ? '+' : ''}${d.toFixed(1)} dB`; };
  function setFader(ch, pos) {
    pos = Math.max(0, Math.min(1, pos));
    if (ch === 'm') { CON.master = pos; if (mfdr) capPos(mfdr, pos); conPost({ master: pos }); }
    else { CON.fader[ch] = pos; const g = fdrEls[ch]; if (g) capPos(g, pos); conPost({ ch, set: { fader: pos } }); }
    conSave();
  }
  fdrEls.forEach((g) => capPos(g, CON.fader[+g.dataset.ch])); if (mfdr) capPos(mfdr, CON.master);
  const hot = document.getElementById('cmi-fdr-hot');
  if (hot) {
    const B = globalThis.CMI_FB || null;
    const local = (e) => { const r = hot.getBoundingClientRect(), k = r.width / hot.offsetWidth; return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, k }; };
    const pick = (x) => { const st = 85, ch = Math.floor(x / st); if (ch >= 0 && ch < 32 && Math.abs(x - (ch * st + 45)) < 30) return ch; const mx = 32 * st + (hot.offsetWidth - 32 * st) - 54; return Math.abs(x - mx) < 44 ? 'm' : null; };
    let drag = null, tip = null;
    const say = (ch, pos) => { if (!tip) { tip = document.createElement('div'); tip.style.cssText = 'position:absolute;z-index:9;padding:6px 10px;background:#111;color:#ffe9b0;font:700 18px JetBrains Mono,monospace;border-radius:4px;pointer-events:none'; hot.appendChild(tip); }
      tip.textContent = `${ch === 'm' ? 'STEREO' : 'CH ' + (ch + 1) + (NAMES[ch] ? ' ' + NAMES[ch] : '')} ${conDb(pos)}`; const x = ch === 'm' ? hot.offsetWidth - 300 : ch * 85 + 70; tip.style.left = Math.min(hot.offsetWidth - 280, x) + 'px'; tip.style.top = (FB.top + pos * (FB.bot - FB.top) - 50) + 'px'; tip.hidden = false; };
    hot.addEventListener('pointerdown', (e) => {
      const q = local(e), ch = pick(q.x); if (ch == null) return; e.preventDefault(); hot.setPointerCapture(e.pointerId);
      const p0 = ch === 'm' ? CON.master : CON.fader[ch];
      const capY = FB.top + p0 * (FB.bot - FB.top);
      drag = { ch, y: q.y, p0: Math.abs(q.y - capY) < 30 ? p0 : (q.y - FB.top) / (FB.bot - FB.top) };   // grab the cap, or jump to where you clicked
      if (drag.p0 !== p0) setFader(ch, drag.p0); say(ch, drag.p0);
    });
    hot.addEventListener('pointermove', (e) => { if (!drag) return; const q = local(e), pos = drag.p0 + (q.y - drag.y) / (FB.bot - FB.top) * (e.shiftKey ? 0.25 : 1); setFader(drag.ch, pos); say(drag.ch, Math.max(0, Math.min(1, pos))); });
    hot.addEventListener('pointerup', () => { drag = null; if (tip) tip.hidden = true; });
    hot.addEventListener('dblclick', (e) => { const ch = pick(local(e).x); if (ch != null) { setFader(ch, 0.2); say(ch, 0.2); setTimeout(() => { if (tip) tip.hidden = true; }, 700); } });
    hot.addEventListener('wheel', (e) => { const ch = pick(local(e).x); if (ch == null) return; e.preventDefault(); const p0 = ch === 'm' ? CON.master : CON.fader[ch]; setFader(ch, p0 + Math.sign(e.deltaY) * 0.01); say(ch, Math.max(0, Math.min(1, p0 + Math.sign(e.deltaY) * 0.01))); clearTimeout(hot._t); hot._t = setTimeout(() => { if (tip) tip.hidden = true; }, 800); }, { passive: false });
    void B;
  }
  function consoleTick() {
    if (EL.node !== CON.node) { CON.node = EL.node; if (EL.node) conSendAll(); }
    if (++CON.t % 20 === 0) conRoute();
  }
