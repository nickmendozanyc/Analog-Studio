// Analog Studio mockup: fit-to-window scaling, pop-up views, live meters, 224X remote, patchbay.
(() => {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const stage = document.getElementById('stage');
  function fit() {
    const s = Math.min(innerWidth / 3840, innerHeight / 2160);
    stage.style.transform = `scale(${s})`;
    stage.style.left = `${(innerWidth - 3840 * s) / 2}px`;
    stage.style.top = `${(innerHeight - 2160 * s) / 2}px`;
  }
  addEventListener('resize', fit); fit();

  // ---------------- pop-up views ----------------
  const views = {};
  document.querySelectorAll('.overlay').forEach((o) => { views[o.dataset.view] = o; });
  let open = null;
  function show(v) {
    if (open) hide();
    const o = views[v]; if (!o) return;
    o.hidden = false; open = o;
    if (v === 'tape') { const f = o.querySelector('iframe'); if (!f.getAttribute('src')) f.setAttribute('src', f.dataset.src); }
    if (v === 'meters') startMeters();
    if (v === 'patchbay') drawPatchbay();
    if (v === 'al') startAL();
  }
  function hide() { if (!open) return; open.hidden = true; open = null; stopMeters(); stopAL(); }
  document.querySelectorAll('[data-open]').forEach((h) => h.addEventListener('click', () => show(h.dataset.open)));
  document.querySelectorAll('.ov-close').forEach((b) => b.addEventListener('click', hide));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  const svgPt = (svg, e, ref = svg) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(ref.getScreenCTM().inverse()); };

  // ---------------- live tape meters (VU ballistics) ----------------
  const VU = [[-20, -45], [-10, -28], [-7, -18], [-5, -10], [-3, 0], [-2, 6], [-1, 12], [0, 19], [1, 27], [2, 35], [3, 45]];
  const vuAngle = (db) => { db = Math.max(-20, Math.min(3, db)); for (let i = 0; i < VU.length - 1; i++) { const [d0, a0] = VU[i], [d1, a1] = VU[i + 1]; if (db <= d1) return a0 + (a1 - a0) * (db - d0) / (d1 - d0); } return 45; };
  let raf = 0;
  function startMeters() {
    const needles = [...document.querySelectorAll('#ov-meters .vuN')].map((g) => ({ g, i: +g.dataset.i, cx: +g.dataset.cx, cy: +g.dataset.cy, a: -45, ph: Math.random() * 10 }));
    const base = window.TAPE_DB || [];
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
      for (const n of needles) {
        const b = base[n.i] ?? -12;
        // program-like level: phrases, beats and a little noise around the track's level
        const lvl = b < -25 ? -40 : b + 3.2 * Math.sin(t * 0.7 + n.ph) + 2.4 * Math.sin(t * 2.9 + n.ph * 2) + 1.8 * Math.max(0, Math.sin(t * 7.8 + n.ph)) + (Math.random() - 0.5) * 1.2;
        const target = vuAngle(lvl);
        n.a += (target - n.a) * (1 - Math.exp(-dt / 0.065));   // ~300 ms to 99%, like a VU movement
        n.g.setAttribute('transform', `rotate(${n.a.toFixed(2)} ${n.cx} ${n.cy})`);
      }
      raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  function stopMeters() { cancelAnimationFrame(raf); raf = 0; }

  // ---------------- Leximan 224X remote ----------------
  const ov224 = document.getElementById('ov-224');
  if (ov224) {
    const svg = ov224.querySelector('svg');
    const PARAMS = [
      { n: 'BASS RT', min: 0.6, max: 70, unit: 'sec', log: true }, { n: 'MID RT', min: 0.6, max: 70, unit: 'sec', log: true },
      { n: 'CROSSOVER', min: 100, max: 10000, unit: 'Hz', log: true }, { n: 'TREBLE DECAY', min: 1500, max: 20000, unit: 'Hz', log: true },
      { n: 'DEPTH', min: 0, max: 99, unit: '', log: false }, { n: 'PRE-DELAY', min: 0, max: 200, unit: 'ms', log: false },
    ];
    const sliders = [...svg.querySelectorAll('.sl224')];
    const pos = sliders.map((g) => +g.dataset.pos);
    let selected = 0;
    const valueOf = (i) => { const p = PARAMS[i], u = 1 - pos[i]; return p.log ? p.min * Math.pow(p.max / p.min, u) : p.min + (p.max - p.min) * u; };
    const lit = (el, on) => { el.setAttribute('fill', on ? '#ff3a24' : '#5a1410'); if (on) el.setAttribute('filter', 'url(#glow)'); else el.removeAttribute('filter'); };
    function display(i) {
      const p = PARAMS[i]; let v = valueOf(i), unit = p.unit, txt;
      if (unit === 'Hz' && v >= 1000) { v /= 1000; unit = 'kHz'; }
      txt = unit === 'sec' ? (v < 10 ? v.toFixed(1) : v.toFixed(0)) : unit === 'kHz' ? v.toFixed(1) : String(Math.round(v));
      const d = svg.querySelector('#d224'); if (d) d.textContent = txt;
      svg.querySelectorAll('.unit224').forEach((u) => lit(u, u.dataset.u === unit));
      const lbl = ov224.querySelector('.ov-param'); if (lbl) lbl.textContent = `${p.n}: ${txt} ${unit}`.trim();
    }
    svg.querySelectorAll('.key224').forEach((k) => k.addEventListener('click', () => {
      svg.querySelectorAll(`.led224[data-row="${k.dataset.row}"]`).forEach((l) => lit(l, l.dataset.i === k.dataset.i));
      if (k.dataset.row === '0') { const lbl = ov224.querySelector('.ov-param'); if (lbl) lbl.textContent = `Program ${+k.dataset.i + 1} loaded`; }
    }));
    svg.querySelectorAll('.key224b').forEach((k) => k.addEventListener('click', () => {
      selected = +k.dataset.i;
      svg.querySelectorAll('.led224b').forEach((l) => lit(l, +l.dataset.i === selected));
      display(selected);
    }));
    sliders.forEach((g, i) => {
      g.style.cursor = 'grab';
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault(); g.setPointerCapture(e.pointerId);
        const move = (ev) => {
          const pt = svgPt(svg, ev, g.parentNode);
          pos[i] = Math.max(0, Math.min(1, (pt.y - 640) / 200));
          g.setAttribute('transform', `translate(0 ${pos[i] * 200})`);
          selected = i; svg.querySelectorAll('.led224b').forEach((l) => lit(l, +l.dataset.i === i));
          display(i);
        };
        move(e);
        g.addEventListener('pointermove', move);
        g.addEventListener('pointerup', () => g.removeEventListener('pointermove', move), { once: true });
      });
    });
    display(0);
  }

  // ---------------- patchbay ----------------
  const L = (pre, n, from = 1) => Array.from({ length: n }, (_, k) => `${pre}${k + from}`);
  const FX = ['224 L', '224 R', '1176 A', '1176 B', 'SPX A L', 'SPX A R', 'SPX B L', 'SPX B R', 'PCM41 A', 'PCM41 B', 'PCM42 A', 'PCM42 B', 'SLOT1 L', 'SLOT1 R', 'SLOT2 L', 'SLOT2 R', 'SLOT3 L', 'SLOT3 R'];
  // rows come in output / input pairs; "normal" means the pair is wired through until you patch the input
  const ROWS = [
    { id: 'ifin', name: 'INTERFACE IN', sub: 'Studio Bridge inputs', io: 'out', items: L('', 24) },
    { id: 'chin', name: 'CONSOLE LINE IN', sub: 'channels 1–24', io: 'in', items: L('', 24), normal: 'ifin' },
    { id: 'bus', name: 'BUS OUT', sub: 'console buses', io: 'out', items: L('', 24) },
    { id: 'tin', name: 'TAPE IN', sub: 'HJ-24 track inputs', io: 'in', items: L('', 24), normal: 'bus' },
    { id: 'tout', name: 'TAPE OUT', sub: 'HJ-24 repro', io: 'out', items: L('', 24) },
    { id: 'tret', name: 'TAPE RETURN', sub: 'console channels 1–24', io: 'in', items: L('', 24), normal: 'tout' },
    { id: 'isend', name: 'INSERT SEND', sub: 'channels 1–32', io: 'out', items: L('', 32) },
    { id: 'iret', name: 'INSERT RETURN', sub: 'channels 1–32', io: 'in', items: L('', 32), normal: 'isend' },
    { id: 'aux', name: 'SENDS · MIX', sub: 'aux sends, mix, cue, osc', io: 'out', items: [...L('SEND ', 6), 'MIX L', 'MIX R', 'CUE1 L', 'CUE1 R', 'CUE2 L', 'CUE2 R', 'OSC'] },
    { id: 'fxin', name: 'OUTBOARD IN', sub: 'rack units and plugin slots', io: 'in', items: FX },
    { id: 'fxout', name: 'OUTBOARD OUT', sub: 'rack units and plugin slots', io: 'out', items: FX },
    { id: 'lin', name: 'LINE IN · RET', sub: 'channels 25–32 and returns', io: 'in', items: [...L('LINE ', 8, 25), 'RET1 L', 'RET1 R', 'RET2 L', 'RET2 R', 'RET3 L', 'RET3 R', 'RET4 L', 'RET4 R'] },
    { id: 'dir', name: 'DIRECT OUT', sub: 'channels 1–24', io: 'out', items: L('', 24) },
    { id: 'ifout', name: 'INTERFACE OUT', sub: 'Studio Bridge outputs', io: 'in', items: L('', 24) },
  ];
  const COLS = ['#c0392b', '#2f6fb3', '#e8c34a', '#3f8f3a', '#1b1b1b', '#e9e5da', '#e07b28', '#8e44ad'];
  const DEFAULT = [
    ['isend:20', 'fxin:1176 A'], ['fxout:1176 A', 'iret:20'], ['isend:13', 'fxin:1176 B'], ['fxout:1176 B', 'iret:13'],
    ['aux:SEND 1', 'fxin:224 L'], ['fxout:224 L', 'lin:LINE 25'], ['fxout:224 R', 'lin:LINE 26'],
    ['aux:SEND 2', 'fxin:PCM42 A'], ['fxout:PCM42 A', 'lin:LINE 29'],
    ['aux:SEND 3', 'fxin:SPX A L'], ['aux:SEND 4', 'fxin:SPX A R'], ['fxout:SPX A L', 'lin:LINE 27'], ['fxout:SPX A R', 'lin:LINE 28'],
    ['aux:MIX L', 'ifout:1'], ['aux:MIX R', 'ifout:2'],
    ['aux:CUE1 L', 'ifout:3'], ['aux:CUE1 R', 'ifout:4'], ['aux:CUE2 L', 'ifout:5'], ['aux:CUE2 R', 'ifout:6'],
  ];
  let patches = DEFAULT.map(([a, b], k) => ({ a, b, c: COLS[k % COLS.length] }));
  try { const s = JSON.parse(localStorage.getItem('as-patches-v3') || 'null'); if (Array.isArray(s)) patches = s; } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem('as-patches-v3', JSON.stringify(patches)); } catch (e) { /* ignore */ } };

  const PB = { x0: 430, pitch: 104, top: 70, rowH: 128, pairGap: 22 };
  const jackPos = {};
  function layout() {
    let y = PB.top;
    ROWS.forEach((r, ri) => {
      r.y = y + 48;
      r.items.forEach((it, k) => { jackPos[`${r.id}:${it}`] = { x: PB.x0 + k * PB.pitch, y: r.y, row: r, item: it }; });
      y += PB.rowH + (ri % 2 ? PB.pairGap : 0);
    });
  }
  layout();
  const el = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const cablePath = (p, q) => { const d = Math.hypot(q.x - p.x, q.y - p.y), sag = 60 + d * 0.22; return `M${p.x} ${p.y} C${p.x} ${p.y + sag} ${q.x} ${q.y + sag} ${q.x} ${q.y}`; };
  let drawn = false, svgPB, gCables, gTemp, msg;
  function drawPatchbay() {
    svgPB = document.getElementById('pbSvg'); if (!svgPB) return;
    msg = document.querySelector('#ov-patchbay .ov-msg');
    if (!drawn) {
      drawn = true;
      ROWS.forEach((r, ri) => {
        if (ri % 2 === 0) {
          const h = PB.rowH * 2 - 8;
          el('rect', { x: 40, y: r.y - 66, width: 3760, height: h, rx: 8, fill: '#151515', stroke: '#2a2a2a' }, svgPB);
          el('rect', { x: 40, y: r.y - 66, width: 3760, height: 3, fill: '#fff', opacity: 0.08 }, svgPB);
          for (const sx of [64, 3776]) for (const sy of [r.y - 40, r.y + h - 96]) { el('circle', { cx: sx, cy: sy, r: 9, fill: '#9ea2a8' }, svgPB); }
        }
        const t = el('text', { x: 96, y: r.y - 6, fill: r.io === 'out' ? '#e8c34a' : '#7fd0ff', 'font-size': 26, 'font-weight': 800, 'font-family': 'Archivo, Arial, sans-serif', 'letter-spacing': 1 }, svgPB); t.textContent = r.name;
        const st = el('text', { x: 96, y: r.y + 26, fill: '#b8b1a5', 'font-size': 18, 'font-family': 'Archivo, Arial, sans-serif' }, svgPB); st.textContent = `${r.io === 'out' ? 'Outputs' : 'Inputs'} · ${r.sub}${r.normal ? ' · normalled' : ''}`;
        el('rect', { x: PB.x0 - 46, y: r.y - 56, width: Math.max(r.items.length, 1) * PB.pitch + 4, height: 26, fill: '#e9dfc6', opacity: 0.9 }, svgPB);
        r.items.forEach((it, k) => {
          const x = PB.x0 + k * PB.pitch, lab = el('text', { x, y: r.y - 36, 'text-anchor': 'middle', fill: '#222', 'font-size': it.length > 3 ? 15 : 18, 'font-weight': 800, 'font-family': 'Archivo, Arial, sans-serif' }, svgPB); lab.textContent = it;
          const g = el('g', { class: 'jack', 'data-k': `${r.id}:${it}` }, svgPB);
          el('circle', { cx: x, cy: r.y, r: 22, fill: '#6b6f75' }, g); el('circle', { cx: x, cy: r.y, r: 17, fill: '#a8acb2' }, g); el('circle', { cx: x, cy: r.y, r: 10, fill: '#050505' }, g);
        });
      });
      gCables = el('g', {}, svgPB); gTemp = el('g', {}, svgPB);
      // dragging a new cable from any jack
      svgPB.addEventListener('pointerdown', (e) => {
        const j = e.target.closest('.jack'); if (!j) return;
        e.preventDefault();
        const from = j.dataset.k, p = jackPos[from], col = COLS[patches.length % COLS.length];
        const path = el('path', { fill: 'none', stroke: col, 'stroke-width': 11, 'stroke-linecap': 'round', opacity: 0.9 }, gTemp);
        const move = (ev) => { const q = svgPt(svgPB, ev); path.setAttribute('d', cablePath(p, q)); };
        const up = (ev) => {
          svgPB.removeEventListener('pointermove', move); gTemp.innerHTML = '';
          const q = svgPt(svgPB, ev); let to = null, best = 30;
          for (const k in jackPos) { const jp = jackPos[k]; const d = Math.hypot(jp.x - q.x, jp.y - q.y); if (d < best) { best = d; to = k; } }
          if (!to || to === from) return;
          const A = jackPos[from], B = jackPos[to];
          if (A.row.io === B.row.io) { say(`Patch an output (gold rows) to an input (blue rows). ${A.row.io === 'out' ? 'Both ends are outputs.' : 'Both ends are inputs.'}`); return; }
          const [a, b] = A.row.io === 'out' ? [from, to] : [to, from];
          patches.push({ a, b, c: col }); save(); renderCables(); say(`Patched ${label(a)} → ${label(b)}`);
        };
        move(e);
        svgPB.addEventListener('pointermove', move);
        svgPB.addEventListener('pointerup', up, { once: true });
      });
      document.getElementById('pb-clear').addEventListener('click', () => { patches = []; save(); renderCables(); say('All cables pulled.'); });
      document.getElementById('pb-reset').addEventListener('click', () => { patches = DEFAULT.map(([a, b], k) => ({ a, b, c: COLS[k % COLS.length] })); save(); renderCables(); say('Session patches restored.'); });
    }
    renderCables();
  }
  const label = (k) => { const [id, it] = k.split(':'); const r = ROWS.find((x) => x.id === id); return `${r.name} ${it}`; };
  function say(t) { if (msg) msg.textContent = t; }
  function renderCables() {
    gCables.innerHTML = '';
    patches.forEach((pc, n) => {
      const p = jackPos[pc.a], q = jackPos[pc.b]; if (!p || !q) return;
      const d = cablePath(p, q);
      el('path', { d, fill: 'none', stroke: '#000', 'stroke-opacity': 0.45, 'stroke-width': 14, transform: 'translate(4 9)' }, gCables);
      const c = el('path', { d, fill: 'none', stroke: pc.c, 'stroke-width': 11, 'stroke-linecap': 'round', class: 'cable' }, gCables);
      el('path', { d, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.28, 'stroke-width': 3, transform: 'translate(-2 -2)', 'pointer-events': 'none' }, gCables);
      for (const e of [p, q]) { el('circle', { cx: e.x, cy: e.y, r: 15, fill: '#d9dbde', stroke: '#777', 'pointer-events': 'none' }, gCables); el('circle', { cx: e.x, cy: e.y, r: 7, fill: pc.c, 'pointer-events': 'none' }, gCables); }
      c.style.cursor = 'pointer';
      c.addEventListener('click', () => { patches.splice(n, 1); save(); renderCables(); say(`Pulled ${label(pc.a)} → ${label(pc.b)}`); });
    });
    const cnt = document.getElementById('pb-count'); if (cnt) cnt.textContent = `${patches.length} cable${patches.length === 1 ? '' : 's'}`;
  }

  // ---------------- one transport for everything ----------------
  // window.AS_TRANSPORT (physics.js) is stepped here every frame. The console reels, the AutoLocator III and the
  // tape machine view (which reads the same object from its iframe) all follow it, so they stay in sync.
  const tr = window.AS_TRANSPORT, LIVE = window.JH_LIVE;
  const TAPE = tr.tape;
  const packPx = (r) => LIVE.hubR + (r - TAPE.hubR) / (TAPE.flangeR - TAPE.hubR) * (LIVE.R - LIVE.hubR);
  // both machines follow the same transport: the HJ-24 (CMI room, prefix jh) and the Stauder A827 (SLS room, prefix a8)
  const reels = [['jh', window.JH_LIVE], ['a8', window.A8_LIVE]].filter(([, L]) => L).flatMap(([pre, L]) => ['s', 't'].map((k) => ({
    k, d: L[k], rotors: [...document.querySelectorAll(`.${pre}-rotor[data-reel="${k}"]`)],
    packs: [...document.querySelectorAll(`.${pre}-pack-${k}`)], strand: document.getElementById(`${pre}-strand-${k}`), lastR: -1,
  })));
  // A827 front panel: live tape timer and key lamps
  const a8ctr = document.getElementById('a8-tctr');
  const a8lamp = (n, on) => { const g = document.getElementById(`a8-lk-${n}`); if (g) g.setAttribute('opacity', on ? 1 : 0); };
  const slsTc = document.getElementById('sls-tc');
  function drawA827() {
    if (slsTc) {   // Studio Computer screen: timecode from the tape position (01:00:00:00 at zero, 30 fps)
      const t = Math.max(0, 3600 + tr.counter), fr = Math.floor((t % 1) * 30);
      slsTc.textContent = `${String(Math.floor(t / 3600)).padStart(2, '0')}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(Math.floor(t) % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
    }
    if (!a8ctr) return;
    const c = tr.counter, a = Math.abs(c), hh = Math.floor(a / 3600), mm = Math.floor(a / 60) % 60, ss = Math.floor(a % 60);
    a8ctr.textContent = `${c < -0.5 ? '-' : ''}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    const m = tr.mode;
    a8lamp('play', m === 'play' || m === 'rec'); a8lamp('rplay', m === 'rplay'); a8lamp('stop', m === 'stop'); a8lamp('rec', m === 'rec');
    a8lamp('ff', m === 'ff' || (m === 'locate' && tr.v > 0) || (m === 'shuttle' && tr.v > 0)); a8lamp('rew', m === 'rew' || (m === 'locate' && tr.v < 0) || (m === 'shuttle' && tr.v < 0));
    a8lamp('ips7.5', tr.speedIPS === 7.5); a8lamp('ips15', tr.speedIPS === 15); a8lamp('ips30', tr.speedIPS === 30);
    a8lamp('vari', tr.varispeed !== 0); a8lamp('lift', tr.liftDefeat);
  }
  // tangent between a pack (circle) and the roller the strand runs to, with the sides chosen at build time
  function tangent(A, B, { sa, sb, sg }) {
    const dx = B.cx - A.cx, dy = B.cy - A.cy, D = Math.hypot(dx, dy), ra = sa * A.r, rb = sb * B.r, k = (ra - rb) / D;
    const ux = dx / D, uy = dy / D, h = Math.sqrt(Math.max(0, 1 - k * k)), nx = k * ux - sg * h * uy, ny = k * uy + sg * h * ux;
    return [[A.cx + ra * nx, A.cy + ra * ny], [B.cx + rb * nx, B.cy + rb * ny]];
  }
  const f2 = (v) => v.toFixed(2);
  function drawConsoleReels() {
    for (const rl of reels) {
      const ang = (rl.k === 's' ? tr.angleS : tr.angleT) * 180 / Math.PI;
      for (const r of rl.rotors) r.style.transform = `rotateZ(${f2(-ang)}deg)`;   // seen from above both reels turn CCW in play
      const r = packPx(rl.k === 's' ? tr.rS : tr.rT);
      if (Math.abs(r - rl.lastR) < 0.25) continue;
      rl.lastR = r;
      const { cx, cy } = rl.d;
      for (const el of rl.packs) {
        el.style.left = `${f2(cx - r)}px`; el.style.top = `${f2(cy - r)}px`; el.style.width = el.style.height = `${f2(2 * r)}px`;
        if (el.classList.contains('jh-packtop')) el.style.background = `radial-gradient(circle, transparent ${f2(LIVE.hubR - 1)}px, #2d2119 ${f2(LIVE.hubR)}px, #4a3727 ${f2(LIVE.hubR + 8)}px, #3a2b1f ${f2(r * 0.7)}px, #5a4532 ${f2(r - 3)}px, #1d150f ${f2(r)}px), repeating-radial-gradient(circle, rgba(0,0,0,0.18) 0 1px, transparent 1px 6px)`;
      }
      if (rl.strand) {
        const pack = { cx, cy, r }, o = rl.d.other;
        const [p1, p2] = rl.d.packFirst ? tangent(pack, o, rl.d.sig) : tangent(o, pack, rl.d.sig);
        const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), a = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
        Object.assign(rl.strand.style, { left: `${f2(p1[0])}px`, top: `${f2(p1[1])}px`, width: `${f2(L + 0.6)}px`, transform: `translateZ(${LIVE.TAPE_Z0}px) rotateZ(${f2(a)}deg) rotateX(90deg)` });
      }
    }
  }

  // ---------------- AutoLocator III (drives the transport) ----------------
  const alSvg = document.getElementById('alSvg');
  const AL = { loc: 62, entry: '', apl: false, reh: false, rehPunch: false, pending: null, ready: new Set([19, 20, 21]), inMon: new Set(), mon: 'auto', vari: 0, varOn: false, mem: [0, 21, 62, 167, null, null, null, null, null, null], last: 2 };
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
  const fmt = (t) => { const a = Math.abs(t); const m = Math.min(99, Math.floor(a / 60)), sec = Math.floor(a % 60); return `${String(m).padStart(2, '0')}${String(sec).padStart(2, '0')}`; };
  function setSeg(id, digits) {
    const rs = alSvg.querySelectorAll(`#al-${id} rect`);
    [...digits].forEach((ch, d) => { const on = SEG[ch] || ''; 'abcdefg'.split('').forEach((k, i) => { const r = rs[d * 7 + i]; if (!r) return; if (on.includes(k)) { r.setAttribute('opacity', '1'); r.setAttribute('filter', 'url(#glowSm)'); } else { r.setAttribute('opacity', '0.09'); r.removeAttribute('filter'); } }); });
  }
  const lamp = (n, on) => { const g = alSvg && alSvg.querySelector(`[data-lamp="${n}"]`); if (g) g.setAttribute('opacity', on ? 1 : 0); };
  const led = (n, on) => { const r = alSvg && alSvg.querySelector(`[data-led="${n}"]`); if (r) { r.setAttribute('opacity', on ? 1 : 0); if (on) r.setAttribute('filter', 'url(#glowSm)'); else r.removeAttribute('filter'); } };
  const alMsg = (t) => { const m = document.getElementById('al-msg'); if (m) m.textContent = t; };
  const show2 = (t) => `${t.slice(0, 2)}:${t.slice(2)}`;
  const counterTake = (sec) => tr.zero + sec * tr.nominalSpeed;   // tape counter seconds -> tape position
  function drawMem() {
    const g = document.getElementById('al-mem'); if (!g) return;
    g.innerHTML = AL.mem.map((m, i) => {
      const y = 300 + 150 + i * 76, hi = i === AL.last;
      return `${hi ? `<rect x="2920" y="${y - 50}" width="600" height="68" rx="6" fill="#ffd9a0"/>` : ''}<text x="2960" y="${y}" font-size="40" font-weight="800" fill="#2f2b28">${i}</text><text x="3480" y="${y}" font-size="44" font-weight="800" fill="${m == null ? '#b3ab9a' : '#b3261e'}" text-anchor="end">${m == null ? '--:--' : (m < 0 ? '-' : '') + show2(fmt(m))}</text>`;
    }).join('');
  }
  function locate(sec, why) { AL.rehPunch = false; tr.locateTo(counterTake(sec), AL.apl ? 'play' : 'stop'); alMsg(`Locating ${why || ''} ${show2(fmt(sec))}`); }
  const recording = () => tr.mode === 'rec';
  function press(n) {
    const d = /^d(\d)$/.exec(n);
    if (d) {
      const k = +d[1];
      if (AL.pending === 'sto') { AL.mem[k] = tr.counter; AL.last = k; AL.pending = null; alMsg(`Stored ${show2(fmt(AL.mem[k]))} in memory ${k}`); drawMem(); return; }
      if (AL.pending === 'rcl') { AL.pending = null; if (AL.mem[k] == null) { alMsg(`Memory ${k} is empty`); return; } AL.loc = AL.mem[k]; AL.entry = ''; AL.last = k; drawMem(); alMsg(`Recalled memory ${k}: ${show2(fmt(AL.loc))} · press LOC`); return; }
      AL.entry = (AL.entry + k).slice(-4); const e = AL.entry.padStart(4, '0'); AL.loc = +e.slice(0, 2) * 60 + Math.min(59, +e.slice(2)); return;
    }
    switch (n) {
      case 'left': case 'right': AL.loc = Math.max(0, AL.loc + (n === 'left' ? -1 : 1)); AL.entry = ''; break;
      case 'sto': AL.pending = AL.pending === 'sto' ? null : 'sto'; alMsg(AL.pending ? 'STO: press a memory number 0–9' : 'Ready'); break;
      case 'rcl': AL.pending = AL.pending === 'rcl' ? null : 'rcl'; alMsg(AL.pending ? 'RCL: press a memory number 0–9' : 'Ready'); break;
      case 'reh': AL.reh = !AL.reh; AL.rehPunch = false; alMsg(AL.reh ? 'Rehearse: RECORD switches the monitors but does not record' : 'Rehearse off'); break;
      case 'rsttape': tr.zero = tr.take; alMsg('Tape position zeroed here'); break;
      case 'rstloc': AL.entry = ''; AL.loc = 0; break;
      case 'loc': AL.entry = ''; locate(AL.loc); break;
      case 'loc0': locate(0, 'to zero'); break;
      case 'aplay': AL.apl = !AL.apl; alMsg(AL.apl ? 'Auto play after locate' : 'Auto play off'); break;
      case 'tape': case 'input': case 'auto': AL.mon = n; alMsg(`Monitor: ${n.toUpperCase()}`); break;
      case 'rew': case 'ff': AL.rehPunch = false; tr.command(n); alMsg(n === 'ff' ? 'Fast forward' : 'Rewind'); break;
      case 'stop': AL.rehPunch = false; tr.command('stop'); alMsg('Stop'); break;
      case 'play':
        if (recording() || AL.rehPunch) { AL.rehPunch = false; tr.command('play'); alMsg('Punch out'); }
        else { tr.command('play'); alMsg('Play'); }
        break;
      case 'record':
        if (!AL.ready.size) { alMsg('No tracks ready: arm tracks with the black keys'); break; }
        if (AL.reh) { if (!tr.playingMode) tr.command('play'); AL.rehPunch = true; alMsg('Rehearse punch in (not recording)'); break; }
        tr.command('rec'); alMsg(`Recording on ${[...AL.ready].sort((a, b) => a - b).map((t) => t + 1).join(', ')}`); break;
      default: {
        const r = /^(ready|input)(\d+)$/.exec(n); if (!r) break;
        const set = r[1] === 'ready' ? AL.ready : AL.inMon, t = +r[2];
        if (set.has(t)) set.delete(t); else set.add(t);
        if (r[1] === 'ready' && recording()) alMsg(`Track ${t + 1} ${set.has(t) ? 'punched in' : 'punched out'}`);
      }
    }
  }
  function alRender(now) {
    const c = tr.counter;
    setSeg('tape', c < -0.5 ? '-' + fmt(c).slice(1) : fmt(c));
    setSeg('loc', AL.entry ? AL.entry.padStart(4, ' ') : fmt(AL.loc));
    const blink = Math.floor(now / 250) % 2 === 0, rec = recording(), punch = rec || AL.rehPunch;
    for (let t = 0; t < 24; t++) {
      const r = AL.ready.has(t);
      led(`r${t}`, r && (rec ? true : blink));
      led(`i${t}`, AL.mon === 'input' || AL.inMon.has(t) || (AL.mon === 'auto' && r && (tr.mode === 'stop' || punch)));
    }
    const m = tr.mode;
    led('ready', AL.ready.size > 0); led('rec', rec || (AL.rehPunch && blink)); led('cue', m === 'locate');
    ['tape', 'input', 'auto'].forEach((k) => led(`m${k}`, AL.mon === k));
    led('var', AL.varOn); led('fix', !AL.varOn);
    lamp('play', tr.playingMode && m !== 'rplay'); lamp('stop', m === 'stop'); lamp('ff', m === 'ff' || (m === 'locate' && tr.v > 0)); lamp('rew', m === 'rew' || (m === 'locate' && tr.v < 0));
    lamp('record', rec); lamp('loc', m === 'locate'); lamp('aplay', AL.apl); lamp('reh', AL.reh); lamp('sto', AL.pending === 'sto'); lamp('rcl', AL.pending === 'rcl');
    const ptr = document.getElementById('al-vari-ptr'); if (ptr) ptr.setAttribute('transform', `rotate(${AL.varOn ? AL.vari * 675 : 0} 29 102)`);
    if (tr.endOfTape && !AL.eotShown) { alMsg('Tape ran off the reel: press RWD'); AL.eotShown = true; } else if (!tr.endOfTape) AL.eotShown = false;
  }
  function startAL() { drawMem(); }
  function stopAL() {}
  if (alSvg) {
    alSvg.querySelectorAll('[data-al]').forEach((g) => {
      const n = g.dataset.al;
      if (n === 'vari') {
        let y0 = null, v0 = 0, moved = false;
        g.addEventListener('pointerdown', (e) => { y0 = e.clientY; v0 = AL.vari; moved = false; g.setPointerCapture(e.pointerId); });
        g.addEventListener('pointermove', (e) => { if (y0 == null) return; const dy = y0 - e.clientY; if (Math.abs(dy) > 4) moved = true; if (moved) { AL.varOn = true; AL.vari = Math.max(-0.2, Math.min(0.2, v0 + dy / 600)); tr.setVarispeed(AL.vari); alMsg(`Vari-speed ${AL.vari >= 0 ? '+' : ''}${(AL.vari * 100).toFixed(1)} %`); } });
        g.addEventListener('pointerup', () => { if (!moved) { AL.varOn = !AL.varOn; tr.setVarispeed(AL.varOn ? AL.vari : 0); alMsg(AL.varOn ? `Vari-speed ${(AL.vari * 100).toFixed(1)} % · drag the knob` : 'Fixed speed'); } y0 = null; });
        return;
      }
      g.addEventListener('click', () => press(n));
    });
  }
  // studio shortcuts, everywhere in the console: Space play/stop · , rewind · . fast forward · Z return to zero · R record
  function shortcut(k) {
    if (k === ' ') press(tr.mode === 'stop' ? 'play' : 'stop');
    else if (k === ',') press('rew');
    else if (k === '.') press('ff');
    else if (k === 'z') { AL.rehPunch = false; tr.locateTo(tr.zero, 'stop'); alMsg('Return to zero'); }
    else if (k === 'r') press('record');
    else return false;
    return true;
  }
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (shortcut(k)) { e.preventDefault(); return; }
    if (open && open.dataset.view === 'sbx') { if (k === 't') sbxPress('tap', performance.now()); else if (/^\d$/.test(k)) sbxPress(`d${k}`); else if (k === 'enter') sbxPress('ent'); return; }
    if (!open || open.dataset.view !== 'al') return;   // keypad entry when the autolocator is open
    if (/^\d$/.test(k)) press(`d${k}`);
    else if (k === 'l' || k === 'enter') press('loc');
  });

  // ---------------- Rowan SBX-80 sync box ----------------
  // SMPTE is striped to track 24 of whichever machine is loaded (generator + track 24 armed + RECORD), read back off the
  // moving tape, and turned into song / measure / beat, MIDI clock (24 ppq), song position and DIN sync via the tempo map.
  const sbxSvg = document.getElementById('sbxSvg');
  const FRS = [[24, '24'], [25, '25'], [30, '30'], [29.97, '30DF']];
  const TBS = [1, 2, 3, 4, 24, 48, 64, 96, 120];
  const SBX = {
    src: 'smpte', disp: 1, frI: 1, tbI: 4, resp: 0, taps: [], tempo: 96, entry: '', mode: '', rec: false, gen: false,
    intRun: false, intBeats: 0, offset: 2, editBar: 0, seg: null, locked: false, beatIx: -1, beatFlash: 0, clocks: 0, msg: '', msgT: 0,
    metro: 0.6, audio: 0.5, sigBuf: '', totalT: 0, song: 1,
    bars: Array.from({ length: 160 }, () => ({ bpm: 96, num: 4, den: 4 })),
    stripes: [{ take0: 0, take1: tr.total, code0: 0, speed: 30 * IPS }],   // the session reel came already striped
  };
  try { const sv = JSON.parse(localStorage.getItem('as-sbx-map') || 'null'); if (sv && sv.bars) { SBX.bars = sv.bars; SBX.offset = sv.offset ?? 2; } } catch (e) {}
  const sbxMsg = (t, sec = 2.2) => { SBX.msg = t; SBX.msgT = sec; };
  const fps = () => FRS[SBX.frI][0];
  const tapeCode = (take) => { for (const s of SBX.stripes) if (take >= s.take0 && take <= s.take1) return s.code0 + (take - s.take0) / s.speed; return null; };
  const barLen = (b) => b.num * (60 / b.bpm) * (4 / b.den);
  // song time (s from bar 1) -> position in the tempo map
  function where(t) {
    const B = SBX.bars;
    if (t < 0) { const b = B[0], bl = 60 / b.bpm; return { bar: 0, beat: Math.floor((t + barLen(b)) / bl) + 1, beats: t / bl, bpm: b.bpm, num: b.num, den: b.den }; }
    let acc = 0, beats = 0;
    for (let i = 0; i < B.length; i++) {
      const b = B[i], L = barLen(b), bl = L / b.num;
      if (t < acc + L) { const into = (t - acc) / bl; return { bar: i + 1, beat: Math.floor(into) + 1, beats: beats + into, bpm: b.bpm, num: b.num, den: b.den }; }
      acc += L; beats += b.num;
    }
    const b = B[B.length - 1]; return { bar: B.length, beat: b.num, beats, bpm: b.bpm, num: b.num, den: b.den, end: true };
  }
  const songLen = () => SBX.bars.reduce((a, b) => a + barLen(b), 0);
  const smpteStr = (c) => { if (c == null) return ['--:--:--', '--.--']; c = Math.max(0, c); const f = fps(), fr = Math.floor((c % 1) * f), bit = Math.floor(((c * f) % 1) * 80); return [`${String(Math.floor(c / 3600)).padStart(2, '0')}:${String(Math.floor(c / 60) % 60).padStart(2, '0')}:${String(Math.floor(c) % 60).padStart(2, '0')}`, `${String(fr).padStart(2, '0')}${FRS[SBX.frI][1] === '30DF' ? ';' : '.'}${String(bit).padStart(2, '0')}`]; };
  const sbxEl = (id) => document.getElementById(id);
  const sbxSet = (id, v) => { const e = sbxEl(id); if (e && e.textContent !== v) e.textContent = v; };
  const sbxOn = (id, on) => { const e = sbxEl(id); if (e) e.setAttribute('opacity', on ? 1 : 0); };
  const sbxLamp = (n, on) => { const g = sbxSvg && sbxSvg.querySelector(`[data-sbxl="${n}"]`); if (g) g.setAttribute('opacity', on ? 1 : 0); };
  function curBar() { const w = SBX.cur; return w && w.bar > 0 ? w.bar - 1 : 0; }
  function sbxTap(now) {
    const n = [2, 3, 4][SBX.resp];
    if (SBX.taps.length && now - SBX.taps[SBX.taps.length - 1] > 2000) SBX.taps = [];
    SBX.taps.push(now); if (SBX.taps.length > n) SBX.taps.shift();
    if (SBX.src === 'int' && !SBX.intRun && SBX.taps.length === 1 && !SBX.rec) { /* first tap also arms START */ }
    if (SBX.taps.length < n) { sbxMsg(`TAP ${SBX.taps.length}/${n}`); return; }
    const d = (SBX.taps[SBX.taps.length - 1] - SBX.taps[0]) / (SBX.taps.length - 1), bpm = Math.max(30, Math.min(250, 60000 / d));
    SBX.tempo = Math.round(bpm * 10) / 10;
    if (SBX.rec && (SBX.locked || SBX.intRun)) { const b = curBar(); for (let i = b; i < SBX.bars.length; i++) SBX.bars[i].bpm = SBX.tempo; sbxMsg(`REC M${String(b + 1).padStart(3, '0')} ${SBX.tempo.toFixed(1)}`); }
    else { if (SBX.src === 'int') SBX.bars.forEach((b) => { b.bpm = SBX.tempo; }); sbxMsg(`TEMPO ${SBX.tempo.toFixed(1)}`); }
  }
  function sbxPress(n, now = performance.now()) {
    const d = /^d(\d)$/.exec(n);
    if (d) {
      if (SBX.mode === 'sig') { SBX.sigBuf += d[1]; if (SBX.sigBuf.length >= 2) { const num = +SBX.sigBuf[0] || 4, den = +SBX.sigBuf.slice(1) || 4; const b = SBX.mode === 'sig' ? (SBX.editMode ? SBX.editBar : curBar()) : 0; for (let i = b; i < SBX.bars.length; i++) { SBX.bars[i].num = num; SBX.bars[i].den = [2, 4, 8, 16].includes(den) ? den : 4; } SBX.mode = SBX.editMode ? 'edit' : ''; SBX.sigBuf = ''; sbxMsg(`TIME SIG ${num}/${den} FROM M${b + 1}`); } else sbxMsg(`TIME SIG ${SBX.sigBuf}/_`); return; }
      SBX.entry = (SBX.entry + d[1]).slice(-4); sbxMsg(`ENTRY ${SBX.entry}`, 4); return;
    }
    switch (n) {
      case 'clr': SBX.entry = ''; SBX.sigBuf = ''; if (SBX.mode === 'sig') SBX.mode = SBX.editMode ? 'edit' : ''; sbxMsg('CLEAR'); break;
      case 'ent': {
        const v = +SBX.entry; SBX.entry = '';
        if (!v) { sbxMsg('ENTER A VALUE'); break; }
        if (SBX.editMode) { SBX.bars[SBX.editBar].bpm = Math.max(30, Math.min(250, v)); sbxMsg(`M${SBX.editBar + 1} = ${SBX.bars[SBX.editBar].bpm} BPM`); }
        else { SBX.tempo = Math.max(30, Math.min(250, v)); SBX.bars.forEach((b) => { b.bpm = SBX.tempo; }); sbxMsg(`TEMPO ${SBX.tempo} ALL MEASURES`); }
        break;
      }
      case 'manual': SBX.src = 'int'; SBX.locked = false; sbxMsg('MANUAL · INTERNAL CLOCK'); break;
      case 'smpte': SBX.src = 'smpte'; SBX.intRun = false; sbxMsg('EXT SMPTE · PLAY THE TAPE'); break;
      case 'gen': SBX.gen = !SBX.gen; sbxMsg(SBX.gen ? 'SMPTE WRITE · ARM TRK 24 + REC' : 'SMPTE WRITE OFF'); break;
      case 'start': { const c = tapeCode(tr.take); if (c == null) { sbxMsg('NO CODE HERE'); break; } SBX.offset = c; const [h] = smpteStr(c); sbxMsg(`BAR 1 = ${h}`); break; }
      case 'play': if (SBX.src === 'int') { SBX.intRun = true; SBX.intBeats = -2 * SBX.bars[0].num; sbxMsg('COUNT IN · 2 MEASURES'); } else sbxMsg('ROLL THE TAPE TO LOCK'); break;
      case 'stop': SBX.intRun = false; sbxMsg('STOP'); break;
      case 'cont': if (SBX.src === 'int') { SBX.intRun = true; sbxMsg('CONTINUE'); } break;
      case 'rec': SBX.rec = !SBX.rec; sbxMsg(SBX.rec ? 'TEMPO RECORD · TAP ALONG' : 'RECORD OFF'); break;
      case 'edit': SBX.editMode = !SBX.editMode; SBX.mode = SBX.editMode ? 'edit' : ''; if (SBX.editMode) SBX.editBar = curBar(); sbxMsg(SBX.editMode ? `EDIT M${SBX.editBar + 1}` : 'EDIT OFF'); break;
      case 'left': case 'right':
        if (SBX.editMode) { SBX.editBar = Math.max(0, Math.min(SBX.bars.length - 1, SBX.editBar + (n === 'left' ? -1 : 1))); sbxMsg(`EDIT M${SBX.editBar + 1}`); }
        else if (SBX.src === 'int') { const b = SBX.bars[0]; SBX.intBeats = Math.max(0, SBX.intBeats + (n === 'left' ? -b.num : b.num)); }
        break;
      case 'insert': { const b = SBX.editMode ? SBX.editBar : curBar(); SBX.bars.splice(b, 0, { ...SBX.bars[b] }); sbxMsg(`INSERT AT M${b + 1}`); break; }
      case 'delete': { const b = SBX.editMode ? SBX.editBar : curBar(); if (SBX.bars.length > 1) SBX.bars.splice(b, 1); sbxMsg(`DELETE M${b + 1}`); break; }
      case 'copy': { const b = SBX.editMode ? SBX.editBar : curBar(); for (let i = b + 1; i < SBX.bars.length; i++) SBX.bars[i] = { ...SBX.bars[b] }; sbxMsg(`COPY M${b + 1} TO END`); break; }
      case 'sig': SBX.mode = 'sig'; SBX.sigBuf = ''; sbxMsg('TIME SIG: TWO DIGITS'); break;
      case 'total': SBX.totalT = 3; break;
      case 'save': try { localStorage.setItem('as-sbx-map', JSON.stringify({ bars: SBX.bars, offset: SBX.offset })); } catch (e) {} sbxMsg('SAVE ········ OK', 3); break;
      case 'verify': { const c0 = tapeCode(0), cov = SBX.stripes.reduce((a, s) => a + (s.take1 - s.take0), 0) / tr.total; sbxMsg(c0 == null ? 'VERIFY · NO CODE AT HEAD' : `VERIFY OK · ${Math.round(cov * 100)}% STRIPED`, 3); break; }
      case 'load': try { const sv = JSON.parse(localStorage.getItem('as-sbx-map') || 'null'); if (sv) { SBX.bars = sv.bars; SBX.offset = sv.offset ?? 2; sbxMsg('LOAD ········ OK', 3); } else sbxMsg('LOAD · NO DATA', 3); } catch (e) {} break;
      case 'disp': SBX.disp = SBX.disp % 3 + 1; break;
      case 'frame': SBX.frI = (SBX.frI + 1) % FRS.length; sbxMsg(`FRAME RATE ${FRS[SBX.frI][1]}`); break;
      case 'tb': SBX.tbI = (SBX.tbI + 1) % TBS.length; sbxMsg(`TIME BASE ${TBS[SBX.tbI]} PULSES / QUARTER`); break;
      case 'resp': SBX.resp = (SBX.resp + 1) % 3; sbxMsg(`TAP RESPONSE ${['QUICK (2)', 'MEDIUM (3)', 'SLOW (4)'][SBX.resp]}`); break;
      case 'metro': SBX.metro = (SBX.metro + 0.2) % 1.2; break;
      case 'audio': SBX.audio = (SBX.audio + 0.2) % 1.2; break;
      case 'tap': sbxTap(now); break;
    }
  }
  function sbxTick(dt, now) {
    // ---- generator: print SMPTE to track 24 while the machine records with track 24 armed
    const writing = SBX.gen && tr.mode === 'rec' && AL.ready.has(23) && tr.v > 0;
    if (writing) { if (!SBX.seg) SBX.seg = { take0: tr.take, take1: tr.take, code0: tapeCode(tr.take) ?? 0, speed: tr.nominalSpeed }; /* continues the code already on tape, else 00:00:00:00 */ SBX.seg.take1 = tr.take; }
    else if (SBX.seg) {
      const s = SBX.seg; SBX.seg = null;
      SBX.stripes = SBX.stripes.flatMap((o) => (o.take1 < s.take0 || o.take0 > s.take1) ? [o] : [...(o.take0 < s.take0 ? [{ ...o, take1: s.take0 }] : []), ...(o.take1 > s.take1 ? [{ ...o, take0: s.take1, code0: o.code0 + (s.take1 - o.take0) / o.speed }] : [])]).concat([s]);
      if (s.take0 <= 0.5 && s.take1 >= tr.total * 0.9) SBX.stripes = [{ ...s, take0: 0 }];
      sbxMsg('STRIPE DONE · VERIFY', 3);
    }
    // ---- reader / internal clock
    const code = SBX.seg ? SBX.seg.code0 + (tr.take - SBX.seg.take0) / SBX.seg.speed : tapeCode(tr.take);
    const fwd = (tr.mode === 'play' || tr.mode === 'rec') && tr.v > 0.5 * tr.nominalSpeed;
    let ratio = 1, running = false;
    if (SBX.src === 'smpte') {
      const was = SBX.locked;
      SBX.locked = code != null && fwd && !SBX.seg;
      if (SBX.locked) { ratio = tr.v / tr.nominalSpeed; running = true; }
      SBX.cur = where((code ?? SBX.offset) - SBX.offset);
      if (SBX.locked && !was) sbxMsg(`LOCK · SONG POS ${Math.floor(Math.max(0, SBX.cur.beats) * 4)} · CONTINUE`);
      if (!SBX.locked && was) sbxMsg('NO CODE · CLOCK STOPPED');
    } else {
      SBX.locked = false;
      const b = SBX.bars[0];
      if (SBX.intRun) { SBX.intBeats += dt * SBX.tempo / 60; running = true; }
      const t = SBX.intBeats * 60 / SBX.tempo;
      SBX.cur = SBX.intBeats < 0 ? { bar: 0, beat: Math.floor(SBX.intBeats + 2 * b.num) % b.num + 1, beats: SBX.intBeats, bpm: SBX.tempo, num: b.num, den: b.den } : { ...where(t), bpm: SBX.tempo };
    }
    const w = SBX.cur, bi = Math.floor(w.beats);
    if (running && bi !== SBX.beatIx) { SBX.beatFlash = w.beat === 1 ? 0.14 : 0.08; }
    SBX.beatIx = running ? bi : -1;
    SBX.beatFlash = Math.max(0, SBX.beatFlash - dt);
    const clkRate = running ? w.bpm / 60 * 24 * ratio : 0, tbRate = running ? w.bpm / 60 * TBS[SBX.tbI] * ratio : 0;
    SBX.msgT = Math.max(0, SBX.msgT - dt); SBX.totalT = Math.max(0, SBX.totalT - dt);
    // ---- rack readout
    const [hms, frb] = smpteStr(code);
    const bbStr = w.bar > 0 ? `${String(SBX.song).padStart(2, '0')} ${String(w.bar).padStart(3, '0')} ${w.beat}` : `${String(SBX.song).padStart(2, '0')} -${String(-Math.floor(w.beats / (w.num || 4)) || 0).padStart(2, '0')} ${w.beat}`;
    sbxSet('rk-sbx-l', SBX.disp === 3 ? hms : bbStr); sbxSet('rk-sbx-r', SBX.disp === 3 ? frb : (w.bpm || 0).toFixed(1));
    sbxOn('rk-sbx-lock', SBX.locked || SBX.intRun); sbxOn('rk-sbx-beat', SBX.beatFlash > 0);
    if (!open || open.dataset.view !== 'sbx') return;
    // ---- front panel
    let L, R, LL, RL;
    if (SBX.totalT > 0) { const T = songLen(); L = `${String(Math.floor(T / 60)).padStart(2, '0')}:${(T % 60).toFixed(1).padStart(4, '0')}`; R = `${SBX.bars.length}`; LL = 'TOTAL TIME   MIN : SEC'; RL = 'MEASURES'; }
    else if (SBX.editMode) { const b = SBX.bars[SBX.editBar]; L = `E ${String(SBX.editBar + 1).padStart(3, '0')} ${b.num}/${b.den}`; R = SBX.entry ? SBX.entry : b.bpm.toFixed(1); LL = 'EDIT   MEASURE   TIME SIG'; RL = SBX.entry ? 'ENTRY' : 'TEMPO'; }
    else if (SBX.disp === 3) { L = hms; R = frb; LL = 'HOUR    MIN    SEC'; RL = 'FRAME   BIT'; }
    else if (SBX.disp === 2) { L = bbStr; R = `${w.num}/${w.den}`; LL = 'SONG   MEASURE   BEAT'; RL = 'TIME SIG'; }
    else { L = bbStr; R = SBX.entry ? SBX.entry : (w.bpm || 0).toFixed(1); LL = 'SONG   MEASURE   BEAT'; RL = SBX.entry ? 'ENTRY' : 'TEMPO'; }
    sbxSet('sbx-l', L); sbxSet('sbx-r', R); sbxSet('sbx-ll', LL); sbxSet('sbx-rl', RL);
    sbxSet('sbx-msg', SBX.msgT > 0 ? SBX.msg : SBX.src === 'smpte' ? (SBX.locked ? `EXT SMPTE · LOCKED ${FRS[SBX.frI][1]} fps` : code == null ? 'EXT SMPTE · NO CODE' : 'EXT SMPTE · WAITING FOR TAPE') : (SBX.intRun ? 'MANUAL · RUNNING' : 'MANUAL'));
    sbxSet('sbx-fr', FRS[SBX.frI][1]);
    sbxOn('sbx-led-lock', SBX.locked); sbxOn('sbx-led-smpte', code != null && Math.abs(tr.v) > 0.05); sbxOn('sbx-led-gen', SBX.gen && (writing || Math.floor(now / 400) % 2 === 0));
    sbxOn('sbx-led-clk', running && Math.floor(w.beats * 4) % 2 === 0); sbxOn('sbx-led-din', running && Math.floor(w.beats * 4) % 2 === 0); sbxOn('sbx-led-beat', SBX.beatFlash > 0); sbxOn('sbx-led-rec', SBX.rec && (running || Math.floor(now / 300) % 2 === 0));
    [1, 2, 3].forEach((k) => sbxOn(`sbx-led-d${k}`, SBX.disp === k));
    sbxLamp('manual', SBX.src === 'int'); sbxLamp('smpte', SBX.src === 'smpte'); sbxLamp('gen', SBX.gen); sbxLamp('play', running); sbxLamp('rec', SBX.rec); sbxLamp('stop', !running); sbxLamp('edit', SBX.editMode); sbxLamp('sig', SBX.mode === 'sig'); sbxLamp('total', SBX.totalT > 0); sbxLamp('tap', SBX.beatFlash > 0);
    const knobAt = (id, frac) => { const e = sbxEl(id); if (e) e.setAttribute('transform', `rotate(${(-150 + 300 * frac).toFixed(1)} ${e.dataset.cx} ${e.dataset.cy})`); };
    knobAt('sbx-k-tempo', (SBX.tempo - 40) / 210); knobAt('sbx-k-tb', SBX.tbI / 8); knobAt('sbx-k-metro', SBX.metro); knobAt('sbx-k-audio', SBX.audio);
    const rs = sbxEl('sbx-resp'); if (rs) rs.setAttribute('y', 604 + SBX.resp * 50);
    sbxSet('sbx-out', `OUTPUTS   MIDI CLOCK ${clkRate.toFixed(1)} /s   SONG POS ${Math.max(0, Math.floor(w.beats * 4))}   DIN SYNC ${running ? 'RUN' : 'STOP'}   TIME BASE ${TBS[SBX.tbI]} ppq = ${tbRate.toFixed(1)} /s   SMPTE ${hms}:${frb.slice(0, 2)}`);
    const st = sbxEl('sbx-status'); if (st) st.textContent = SBX.locked ? `Locked to track 24 · ${(w.bpm * ratio).toFixed(1)} BPM at the tape's speed` : SBX.src === 'smpte' ? 'EXT SMPTE · roll the tape (Space) to lock' : 'MANUAL · internal clock';
  }
  if (sbxSvg) {
    sbxSvg.querySelectorAll('[data-sbx]').forEach((g) => {
      const n = g.dataset.sbx;
      if (n === 'tempo') {
        let y0 = null, t0 = 0;
        g.addEventListener('pointerdown', (e) => { y0 = e.clientY; t0 = SBX.tempo; g.setPointerCapture(e.pointerId); });
        g.addEventListener('pointermove', (e) => { if (y0 == null) return; SBX.tempo = Math.round(Math.max(40, Math.min(250, t0 + (y0 - e.clientY) / 2)) * 10) / 10; SBX.bars.forEach((b) => { if (SBX.src === 'int') b.bpm = SBX.tempo; }); sbxMsg(`TEMPO ${SBX.tempo.toFixed(1)}`); });
        g.addEventListener('pointerup', () => { y0 = null; });
        return;
      }
      g.addEventListener('pointerdown', (e) => { if (n === 'tap') { e.preventDefault(); sbxPress('tap', performance.now()); } });
      g.addEventListener('click', () => { if (n !== 'tap') sbxPress(n); });
    });
  }
  window.SBX = SBX; window.SBX_PRESS = sbxPress;

  // ---------------- tape machine view (iframe) mirrors this transport ----------------
  const STATE_KEYS = ['take', 'total', 'v', 'acc', 'mode', 'speedIPS', 'varispeed', 'shuttle', 'liftDefeat', 'pinch', 'lift', 'angleS', 'angleT', 'zero', 'endOfTape', 'locTarget'];
  const tapeFrame = document.querySelector('#ov-tape iframe');
  const CMDS = {
    command: (m) => { if (['stop', 'play', 'rec', 'rplay', 'ff', 'rew', 'shuttle'].includes(m)) { AL.rehPunch = false; tr.command(m); } },
    setSpeed: (ips) => tr.setSpeed(+ips), setVarispeed: (x) => { tr.setVarispeed(+x); AL.varOn = +x !== 0; if (AL.varOn) AL.vari = +x; },
    setShuttle: (x) => tr.setShuttle(+x), key: (k) => shortcut(String(k)), locate: (pos) => tr.locate(+pos), setLift: (on) => { tr.liftDefeat = !!on; }, setZero: (z) => { tr.zero = +z; },
  };
  addEventListener('message', (e) => {
    if (!tapeFrame || e.source !== tapeFrame.contentWindow) return;
    const d = e.data;
    if (d && d.as === 'cmd' && Object.prototype.hasOwnProperty.call(CMDS, d.fn)) CMDS[d.fn](...(d.args || []));
  });
  function postState() {
    if (!tapeFrame || !open || open.dataset.view !== 'tape' || !tapeFrame.contentWindow) return;
    const st = {}; for (const k of STATE_KEYS) st[k] = tr[k];
    tapeFrame.contentWindow.postMessage({ as: 'state', s: st }, '*');
  }

  // ---------------- studio modes: CMI / SLS (the rack stays; console, tape machine and autolocator swap) ----------------
  const slsLayer = document.getElementById('sls');
  const modeKeys = [...document.querySelectorAll('.modes button')];
  function setStudio(mode) {
    if (mode !== 'sls') mode = 'cmi';
    if (slsLayer) slsLayer.hidden = mode !== 'sls';
    modeKeys.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    document.body.dataset.studio = mode;
    try { localStorage.setItem('as-studio', mode); } catch (e) {}
  }
  modeKeys.forEach((b) => b.addEventListener('click', () => { if (open) hide(); setStudio(b.dataset.mode); }));
  let savedMode = 'cmi'; try { savedMode = localStorage.getItem('as-studio') || 'cmi'; } catch (e) {}
  setStudio(savedMode);
  window.AS_SET_STUDIO = setStudio;

  // ---------------- the studio clock ----------------
  let last = performance.now();
  function studio(now) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now;   // tape time keeps up with real time even on a slow frame
    tr.advance(dt);
    drawConsoleReels();
    sbxTick(dt, now);
    if (document.body.dataset.studio === 'sls') drawA827();
    postState();
    if (open && open.dataset.view === 'al') alRender(now);
    requestAnimationFrame(studio);
  }
  window.AS_PRESS = press;   // for tests
  requestAnimationFrame(studio);
})();
