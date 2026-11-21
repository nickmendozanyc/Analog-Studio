  // ---------------- Rowan JUNO-1060: the front panel's working (the voices run in the audio engine, juno.js) ----------------
  const JU_SL = { vol: [0, 1], porta: [0, 1], bendLfo: [0, 1], bendDco: [0, 1], bendVcf: [0, 1], lfoRate: [0, 1], lfoDelay: [0, 1], dcoLfo: [0, 1], pwm: [0, 1], sub: [0, 1], noise: [0, 1], hpf: [0, 3], cutoff: [0, 1], res: [0, 1], env: [0, 1], vcfLfo: [0, 1], kybd: [0, 1], vcaLevel: [0, 1], a: [0, 1], d: [0, 1], s: [0, 1], r: [0, 1] };
  const JU = { p: { ...junoDefaults(), ...JUNO_PATCHES[0], vol: 0.8, tune: 0 }, bank: 0, patch: 0, manual: false, writing: false, user: {}, oct: 4, held: new Set(), node: null, transpose: 0 };
  try { const sv = JSON.parse(localStorage.getItem('as-juno') || 'null'); if (sv) { Object.assign(JU.p, sv.p || {}); JU.bank = sv.bank || 0; JU.patch = sv.patch || 0; JU.user = sv.user || {}; } } catch (e) { /* storage unavailable */ }
  let juSaveT = 0; const juSave = () => { clearTimeout(juSaveT); juSaveT = setTimeout(() => { try { localStorage.setItem('as-juno', JSON.stringify({ p: JU.p, bank: JU.bank, patch: JU.patch, user: JU.user })); } catch (e) { /* ignore */ } }, 400); };
  const juPost = (o) => elPost({ type: 'juno', ...o });
  const juSay = (t) => { const m = document.getElementById('ju-msg'); if (m) m.textContent = t; };
  const juEngine = () => { const { vol, tune, name, ...rest } = JU.p; return rest; };
  const juSend = () => { juPost({ set: juEngine(), vol: JU.p.vol }); };
  const juName = () => (JU.manual ? 'MANUAL' : JU.bank === 0 ? JUNO_PATCHES[JU.patch].name : (JU.user[`${JU.bank}${JU.patch}`] || {}).name || 'EMPTY');
  function juDraw() {
    document.querySelectorAll('[data-jk]').forEach((g) => { const k = g.dataset.jk, [lo, hi] = JU_SL[k], c = g.querySelector(`.ju-s-${k}`); if (!c) return; const v = ((JU.p[k] ?? lo) - lo) / (hi - lo);
      if (c.dataset.knob) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(c.getAttribute('transform')); if (m) c.setAttribute('transform', `rotate(${(-135 + v * 270).toFixed(1)} ${m[1]} ${m[2]})`); } else c.setAttribute('transform', `translate(0 ${((1 - v) * +c.dataset.len).toFixed(2)})`); });
    const swp = (k, down) => document.querySelectorAll(`.ju-w-${k}`).forEach((e) => { const y0 = +(e.dataset.y0 || (e.dataset.y0 = e.getAttribute('y'))), hh = +e.getAttribute('height'); e.setAttribute('y', down ? y0 + hh * 1.3 : y0); });
    swp('pwmLfo', !JU.p.pwmLfo); swp('envPol', JU.p.envPol < 0); swp('vcaGate', JU.p.vcaGate); swp('bendSw', JU.p.bendOn !== false);
    const lamp = (k, on) => document.querySelectorAll(`.ju-l-${k}`).forEach((e) => e.setAttribute('opacity', on ? 1 : 0));
    lamp('pwmLfo', JU.p.pwmLfo); lamp('r16', JU.p.range === 16); lamp('r8', JU.p.range === 8); lamp('r4', JU.p.range === 4); lamp('pulse', JU.p.pulse); lamp('saw', JU.p.saw);
    lamp('choff', !JU.p.chorus); lamp('ch1', JU.p.chorus === 1 || JU.p.chorus === 3); lamp('ch2', JU.p.chorus === 2 || JU.p.chorus === 3);
    for (let i = 0; i < 8; i++) { lamp('b' + i, JU.bank === i); lamp('p' + i, !JU.manual && JU.patch === i); }
    lamp('manual', JU.manual); lamp('write', JU.writing); lamp('transpose', JU.transpose !== 0);
    document.querySelectorAll('.ju-disp').forEach((e) => { e.textContent = JU.manual ? '--' : `${JU.bank + 1}${JU.patch + 1}`; });
    document.querySelectorAll('.ju-name').forEach((e) => { e.textContent = juName(); });
    document.querySelectorAll('.ju-k').forEach((e) => { const n = +e.dataset.jn, on = JU.held.has(n), black = [1, 3, 6, 8, 10].includes(n % 12); e.setAttribute('fill', on ? (black ? '#6a3c12' : '#ffd59a') : black ? '#111' : '#f1ede3'); });
  }
  function juLoad(bank, patch) {
    const P = bank === 0 ? JUNO_PATCHES[patch] : JU.user[`${bank}${patch}`];
    if (!P) return juSay(`${bank + 1}${patch + 1} is empty: set the panel and WRITE it here`);
    JU.p = { ...junoDefaults(), ...P, vol: JU.p.vol, tune: JU.p.tune, bendDco: JU.p.bendDco, bendVcf: JU.p.bendVcf }; JU.bank = bank; JU.patch = patch; JU.manual = false;
    juSend(); juSave(); juDraw(); juSay(`${bank + 1}${patch + 1} ${P.name || ''}`);
  }
  document.querySelectorAll('[data-jk]').forEach((g) => {
    const k = g.dataset.jk, [lo, hi] = JU_SL[k], c = g.querySelector(`.ju-s-${k}`);
    const set = (v) => { v = Math.max(lo, Math.min(hi, v)); if (k === 'hpf') v = Math.round(v); JU.p[k] = v; if (k === 'vol') juPost({ vol: v }); else if (k === 'bendLfo') { /* the bender's LFO depth: shown, applied with the lever */ } else if (k === 'tune') juPost({ set: { tune: v } }); else juPost({ set: { [k]: v } }); juSave(); juDraw(); juSay(`${k.toUpperCase()} ${k === 'hpf' ? v : (v * 10).toFixed(1)}`); };
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId); const r = c.closest('svg').getBoundingClientRect(), sc = r.height / c.closest('svg').viewBox.baseVal.height, len = +c.dataset.len * sc, y0 = e.clientY, v0 = JU.p[k];
      const mv = (ev) => set(v0 + (y0 - ev.clientY) / len * (hi - lo) * (ev.shiftKey ? 0.25 : 1));
      const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); });
    g.addEventListener('wheel', (e) => { e.preventDefault(); set(JU.p[k] - Math.sign(e.deltaY) * (hi - lo) / (k === 'hpf' ? 3 : 50)); }, { passive: false });
    g.addEventListener('dblclick', () => set(k === 'vol' ? 0.8 : k === 'tune' ? 0 : junoDefaults()[k] ?? lo));
  });
  document.querySelectorAll('[data-jb]').forEach((g) => {
    const k = g.dataset.jb;
    if (k === 'bend') {   // the lever: drag left / right, springs back to centre
      const lever = g.querySelector('.ju-bend'), x0a = lever ? +lever.getAttribute('x') : 0;
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId); const r = g.getBoundingClientRect(), cx = e.clientX;
        const mv = (ev) => { const b = Math.max(-1, Math.min(1, (ev.clientX - cx) / (r.width / 2))); JU.p.bend = b; juPost({ set: { bend: b } }); if (lever) lever.setAttribute('x', x0a + b * 18 * (r.width / g.getBBox().width || 1) * 0 + b * (g.getBBox().width / 2 - 6)); };
        const up = () => { JU.p.bend = 0; juPost({ set: { bend: 0 } }); if (lever) lever.setAttribute('x', x0a); g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
        g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); });
      return;
    }
    g.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); const P = JU.p;
      if (k === 'pwmLfo' || k === 'pulse' || k === 'saw' || k === 'vcaGate') { P[k] = !P[k]; juPost({ set: { [k]: P[k] } }); }
      else if (/^r(16|8|4)$/.test(k)) { P.range = +k.slice(1); juPost({ set: { range: P.range } }); }
      else if (k === 'envPol') { P.envPol = -P.envPol; juPost({ set: { envPol: P.envPol } }); }
      else if (k === 'choff') { P.chorus = 0; juPost({ set: { chorus: 0 } }); }
      else if (k === 'bendSw') { P.bendOn = P.bendOn === false; }
      else if (k === 'ch1' || k === 'ch2') { const b = k === 'ch1' ? 1 : 2, on1 = P.chorus === 1 || P.chorus === 3, on2 = P.chorus === 2 || P.chorus === 3, n1 = b === 1 ? !on1 : on1, n2 = b === 2 ? !on2 : on2; P.chorus = n1 && n2 ? 3 : n1 ? 1 : n2 ? 2 : 0; juPost({ set: { chorus: P.chorus } }); }
      else if (/^b\d$/.test(k)) { JU.bank = +k.slice(1); juSay(`BANK ${JU.bank + 1}: press a PATCH key`); }
      else if (/^p\d$/.test(k)) {
        const pi = +k.slice(1);
        if (JU.writing) { if (JU.bank === 0) { juSay('Bank 1 holds the factory sounds: pick bank 2-8 to write'); } else { const { vol, tune, bend, ...rest } = P; JU.user[`${JU.bank}${pi}`] = { ...rest, name: `USER ${JU.bank + 1}${pi + 1}` }; JU.patch = pi; JU.manual = false; juSay(`Written to ${JU.bank + 1}${pi + 1}`); } JU.writing = false; }
        else juLoad(JU.bank, pi);
      }
      else if (k === 'manual') { JU.manual = true; juSay('MANUAL: the panel as it stands'); }
      else if (k === 'write') { JU.writing = !JU.writing; juSay(JU.writing ? 'WRITE: pick a bank (2-8) and press a PATCH key' : 'WRITE cancelled'); }
      else if (k === 'transpose') { JU.transpose = JU.transpose ? 0 : 12; juSay(JU.transpose ? 'KEY TRANSPOSE: up an octave' : 'KEY TRANSPOSE off'); }
      else if (k === 'lfotrig') { juPost({ set: { lfoDelay: P.lfoDelay } }); }
      if (!/^(b\d|p\d|manual|write)$/.test(k) && !JU.manual && k !== 'transpose') JU.manual = true;
      juSave(); juDraw();
    });
  });
  // notes: the drawn keys, the computer keys, a MIDI keyboard
  const juOn = (n, v = 100) => { if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER(); n += JU.transpose + Math.round(JU.p.tune * 0); JU.held.add(n - JU.transpose); juPost({ note: n, vel: v }); juDraw(); };
  const juOff = (n) => { JU.held.delete(n); juPost({ note: n + JU.transpose, vel: 0 }); juDraw(); };
  document.querySelectorAll('#ov-juno svg').forEach((svg) => {
    let down = null;
    const at = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.classList && t.classList.contains('ju-k') ? +t.dataset.jn : null; };
    svg.addEventListener('pointerdown', (e) => { const n = at(e); if (n == null) return; e.preventDefault(); svg.setPointerCapture(e.pointerId); down = n; juOn(n); });
    svg.addEventListener('pointermove', (e) => { if (down == null) return; const n = at(e); if (n != null && n !== down) { juOff(down); down = n; juOn(n); } });
    for (const ev of ['pointerup', 'pointercancel']) svg.addEventListener(ev, () => { if (down != null) juOff(down); down = null; });
  });
  const JU_KEYS = 'awsedftgyhujk', juOpen = () => isOpen('juno');
  addEventListener('keydown', (e) => {
    if (!juOpen() || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName || '')) return;
    const i = JU_KEYS.indexOf(e.key.toLowerCase());
    if (i >= 0) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) juOn(12 * JU.oct + 12 + i); return; }
    if (e.key === 'z' || e.key === 'x') { e.preventDefault(); e.stopPropagation(); JU.oct = Math.max(1, Math.min(7, JU.oct + (e.key === 'x' ? 1 : -1))); juSay(`Computer keys from C${JU.oct - 1}`); }
  }, true);
  addEventListener('keyup', (e) => { if (!juOpen()) return; const i = JU_KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) { e.stopPropagation(); for (let o = 1; o <= 7; o++) { const n = 12 * o + 12 + i; if (JU.held.has(n)) juOff(n); } } }, true);
  const juMidi = document.getElementById('ju-midi');
  if (juMidi && navigator.requestMIDIAccess) {
    let acc = null;
    const fill = () => { const v = juMidi.value; juMidi.innerHTML = '<option value="">MIDI IN · computer keys</option>' + [...acc.inputs.values()].map((p) => `<option value="${p.id}">MIDI IN · ${p.name}</option>`).join(''); juMidi.value = v; };
    juMidi.addEventListener('pointerdown', () => { if (!acc) navigator.requestMIDIAccess().then((a) => { acc = a; fill(); a.onstatechange = fill; }).catch(() => juSay('MIDI is not available here')); });
    juMidi.addEventListener('change', () => { if (!acc) return; for (const p of acc.inputs.values()) p.onmidimessage = p.id === juMidi.value ? (m) => { const [st, n, v] = m.data, t = st & 0xf0; if (t === 0x90 && v > 0) juOn(n, v); else if (t === 0x80 || (t === 0x90 && v === 0)) juOff(n); else if (t === 0xe0) { const b = ((v << 7) | n) / 8192 - 1; JU.p.bend = b; juPost({ set: { bend: b } }); } } : null; });
  }
  function junoTick() { if (EL.node !== JU.node) { JU.node = EL.node; if (EL.node) juSend(); } }
  juDraw();
