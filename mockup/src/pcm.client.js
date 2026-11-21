  // ---------------- Leximan PCM41 x2 + PCM42 x2: each unit's front panel (after the manuals) ----------------
  // PCM41: ◀ ▶ step the 11 delay taps (one LED lit), DLY X1/X2 doubles them at 6 kHz bandwidth, Delay Multiply scales
  // 0.5x..2x; INV / LO / HI shape the feedback; INV by the mix inverts the delay. BYPASS and REPEAT are footswitches
  // only (the buttons under the panels). PCM42: SET-MODE DLY: UP / DOWN step 256 taps (hold to repeat, hold both for
  // fast), the display shows the live delay; SET-MODE CLK: DOWN steps the clock numerator (1 3 5 7 9), UP the
  // denominator (1..64); ∞ RPT holds the whole memory on the next clock beat. The audio runs in the tape machine's engine.
  const PCMU = ['41A', '41B', '42A', '42B'];
  const pcmNew = (u, o) => ({ power: true, level: 7, fb: 0, fbInv: false, lo: false, hi: false, mix: 0.5, dlyInv: false, x2: false, tap: u[1] === '1' ? 7 : 64, mult: 0.5, depth: 0, wave: 0, rate: 0.5, byp: false, rpt: false, clkN: 0, clkD: 1, ...o });
  const PCM = { st: [pcmNew('41A', { tap: 8, fb: 3.5, mix: 0.35, level: 4.5 }), pcmNew('41B', { tap: 3, depth: 4, rate: 0.35, fb: 5, mix: 0.5 }), pcmNew('42A', { tap: 9, fb: 4, hi: true, mix: 0.35 }), pcmNew('42B', { tap: 26, fb: 2, mix: 0.3, depth: 1.5, rate: 0.3 })], ch: [null, null, null, null], mode: ['dly', 'dly', 'dly', 'dly'], node: null, t: 0 };
  const PCM_DEF = JSON.parse(JSON.stringify(PCM.st));
  try { const sv = JSON.parse(localStorage.getItem('as-pcm') || 'null'); if (Array.isArray(sv)) sv.forEach((o, i) => { if (o) Object.assign(PCM.st[i], o, { rpt: false }); }); } catch (e) { /* storage unavailable */ }
  const pcmSave = () => { try { localStorage.setItem('as-pcm', JSON.stringify(PCM.st)); } catch (e) { /* ignore */ } };
  const pcmSend = (i) => elPost({ type: 'pcm', unit: i, set: PCM.st[i], ch: PCM.ch[i] });
  const pcmSay = (s) => { const m = document.getElementById('pcm-msg'); if (m) m.textContent = s; };
  const PCM_KN = { level: [0, 10], fb: [0, 10], mix: [0, 1], mult: [0, 1], depth: [0, 10], wave: [0, 1], rate: [0, 1] };
  const PCM_NAME = { level: 'LEVEL', fb: 'FEEDBACK', mix: 'OUTPUT MIX', mult: 'DELAY MULTIPLY', depth: 'DEPTH', wave: 'WAVEFORM', rate: 'RATE' };
  const pcmFmt = (i, k) => {
    const v = PCM.st[i][k], is41 = PCMU[i][1] === '1';
    if (k === 'mix') return Math.abs(v - 0.5) < 0.02 ? '=' : v < 0.5 ? `${Math.round((0.5 - v) * 200)}% INPUT` : `${Math.round((v - 0.5) * 200)}% DELAY`;
    if (k === 'mult') return 'X' + (is41 ? (v < 0.5 ? 0.5 + v : 1 + (v - 0.5) * 2) : 0.5 + v).toFixed(2);
    if (k === 'wave') return v < 0.04 ? 'SINE' : Math.abs(v - 0.5) < 0.04 ? 'ENV' : v > 0.96 ? 'SQUARE' : v < 0.5 ? 'SINE / ENV' : 'ENV / SQUARE';
    if (k === 'rate') return (0.1 * 100 ** v).toFixed(2) + ' Hz';
    return v.toFixed(1);
  };
  function pcmKnobs(i) {
    const u = PCMU[i];
    for (const k of Object.keys(PCM_KN)) {
      const [lo, hi] = PCM_KN[k], a = -150 + (PCM.st[i][k] - lo) / (hi - lo) * 300;
      for (const g of c1All(`pcm${u}-k-${k}`)) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(g.getAttribute('transform') || ''); if (m) g.setAttribute('transform', `rotate(${a.toFixed(1)} ${m[1]} ${m[2]})`); }
    }
  }
  function pcmSet(i, k, v) {
    const K = PCM_KN[k]; if (K) { v = Math.max(K[0], Math.min(K[1], v)); if ((k === 'mix' || k === 'mult' || k === 'wave') && Math.abs(v - 0.5) < 0.025) v = 0.5; }   // centre detents
    PCM.st[i][k] = v; pcmSend(i); pcmSave(); pcmKnobs(i);
    pcmSay(`PCM${PCMU[i].slice(0, 2)} ${PCMU[i][2]} · ${PCM_NAME[k] || k} ${pcmFmt(i, k)}`);
  }
  document.querySelectorAll('.ovsync [data-pk]').forEach((g) => {
    const [u, k] = g.dataset.pk.split(':'), i = PCMU.indexOf(u), [lo, hi] = PCM_KN[k];
    g.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId);
      const y0 = e.clientY, v0 = PCM.st[i][k];
      const mv = (ev) => pcmSet(i, k, v0 + (y0 - ev.clientY) / (ev.shiftKey ? 900 : 220) * (hi - lo));
      const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up);
    });
    g.addEventListener('wheel', (e) => { e.preventDefault(); pcmSet(i, k, PCM.st[i][k] - Math.sign(e.deltaY) * (hi - lo) / 100); }, { passive: false });
    g.addEventListener('dblclick', () => pcmSet(i, k, PCM_DEF[i][k]));
  });
  const pcmHeld = {};   // PCM42 UP / DOWN: which are down right now
  function pcmKey(i, k) {
    const S = PCM.st[i], u = PCMU[i], is41 = u[1] === '1', name = `PCM${u.slice(0, 2)} ${u[2]}`;
    if (k === 'power') { S.power = !S.power; S.rpt = false; pcmSay(`${name} · POWER ${S.power ? 'ON' : 'OFF'}`); }
    if (!S.power && k !== 'power') return;
    if (k === 'left' || k === 'right') S.tap = Math.max(0, Math.min(10, S.tap + (k === 'right' ? 1 : -1)));
    if (k === 'x2') { S.x2 = !S.x2; pcmSay(`${name} · ${is41 ? 'DLY' : 'DELAY'} X${S.x2 ? 2 : 1}${S.x2 ? ' (6 kHz bandwidth)' : ''}`); }
    if (k === 'fbInv' || k === 'lo' || k === 'hi' || k === 'dlyInv') S[k] = !S[k];
    if (k === 'byp') { S.byp = !S.byp; pcmSay(`${name} · BYPASS ${S.byp ? 'ON' : 'OFF'} (footswitch)`); }
    if (k === 'rpt') { S.rpt = !S.rpt; pcmSay(`${name} · ${is41 ? 'REPEAT' : '∞ RPT'} ${S.rpt ? (is41 ? 'ON: the whole memory loops' : 'ARMED: holds on the next clock beat') : 'OFF'}`); }
    if (k === 'mode') PCM.mode[i] = PCM.mode[i] === 'dly' ? 'clk' : 'dly';
    if (k === 'up' || k === 'down') {
      if (PCM.mode[i] === 'clk') { if (k === 'down') S.clkN = (S.clkN + 1) % 5; else S.clkD = (S.clkD + 1) % 7; }
      else S.tap = Math.max(0, Math.min(255, S.tap + (k === 'up' ? 1 : -1)));
    }
    pcmSend(i); pcmSave();
  }
  document.querySelectorAll('.ovsync [data-pb], .ovsync [data-pf]').forEach((g) => {
    const [u, k] = (g.dataset.pb || g.dataset.pf).split(':'), i = PCMU.indexOf(u);
    if (k === 'up' || k === 'down') {   // a tap per press; held: about once a second; with the other one held too: fast
      let rpt = null, t0 = 0;
      g.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); pcmHeld[u + k] = true;
        const other = k === 'up' ? 'down' : 'up';
        if (pcmHeld[u + other]) return;   // the second button only speeds up the first
        pcmKey(i, k); t0 = performance.now(); let last = t0;
        rpt = setInterval(() => { const now = performance.now(), fast = pcmHeld[u + other]; if (now - t0 > 600 && now - last > (fast ? 25 : 1000)) { last = now; pcmKey(i, k); } }, 20);
      });
      for (const ev of ['pointerup', 'pointerleave']) g.addEventListener(ev, () => { pcmHeld[u + k] = false; clearInterval(rpt); rpt = null; });
      return;
    }
    g.addEventListener('click', (e) => { e.stopPropagation(); pcmKey(i, k); });
  });
  function pcmRoute() {
    PCMU.forEach((u, i) => {
      const jack = `PCM${u.slice(0, 2)} ${u[2]}`, send = patches.find((pc) => /^isend:/.test(pc.a) && pc.b === `fxin:${jack}`), n = send && +send.a.split(':')[1];
      const ch = n && n <= 24 && patches.some((pc) => pc.a === `fxout:${jack}` && pc.b === `iret:${n}`) ? n - 1 : null;
      if (ch !== PCM.ch[i]) { PCM.ch[i] = ch; pcmSend(i); }
      sgTxt(`.pcm${u}-route`, ch == null ? 'NOT PATCHED' : `CH ${ch + 1}${NAMES[ch] ? ' ' + NAMES[ch] : ''}`);
    });
  }
  function pcmDraw() {
    const M = window.PCM_M;
    PCMU.forEach((u, i) => {
      const S = PCM.st[i], on = S.power, m = M && M[i], live = on && m && PCM.ch[i] != null, is41 = u[1] === '1';
      c1Lamp(`pcm${u}-pw`, on);
      const pk = live ? m.peakDb : -99;   // headroom: 0 dB lamp ~1 dB under clip
      (is41 ? [-1, -6, -12, -18, -24] : [-1, -6, -12, -18, -24]).forEach((t, j) => c1Lamp(`pcm${u}-hr${j}`, pk >= t));
      for (const k of ['fbInv', 'lo', 'hi', 'dlyInv']) c1Lamp(`pcm${u}-l-${k}`, on && S[k]);
      c1Lamp(`pcm${u}-byp`, on && S.byp);
      const lph = m ? m.lfo : 0; c1Lamp(`pcm${u}-lfo`, on && S.depth > 0 && Math.abs(S.wave - 0.5) > 0.04 && lph < 0.5);
      if (is41) {
        for (let t = 0; t < 11; t++) c1Lamp(`pcm${u}-t${t}`, on && S.tap === t);
        c1Lamp(`pcm${u}-x2`, on && S.x2); c1Lamp(`pcm${u}-rpt`, on && S.rpt);
      } else {
        c1Lamp(`pcm${u}-k6`, on && S.x2); c1Lamp(`pcm${u}-inf`, on && !!(m && m.inf)); c1Lamp(`pcm${u}-clk`, on && !!(m && m.clk));
        const ms = m ? m.ms : S.tap * 192 / 61440 / (S.x2 ? 0.5 : 1) * 1000;
        sgTxt(`.pcm${u}-disp`, !on ? '' : PCM.mode[i] === 'clk' ? `${[1, 3, 5, 7, 9][S.clkN]}  ${[1, 2, 4, 8, 16, 32, 64][S.clkD]}` : String(Math.round(ms)));
        for (const e of c1All(`pcm${u}-slide`)) { const y = PCM.mode[i] === 'clk' ? '23.1' : '17.3'; if (e._y !== y) { e._y = y; e.setAttribute('y', y); } }
      }
    });
  }
  function pcmTick() {
    if (EL.node !== PCM.node) { PCM.node = EL.node; if (EL.node) PCMU.forEach((u, i) => pcmSend(i)); }
    if (++PCM.t % 15 === 0) pcmRoute();
    pcmDraw();
  }
  PCMU.forEach((u, i) => pcmKnobs(i));
