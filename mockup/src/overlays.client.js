// JH-Studio mockup: fit-to-window scaling, pop-up views, live meters, 224X remote, patchbay.
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
  // Several floating windows can be open together (dragged by their title bars, clicked to the front, closed with ✕;
  // Esc closes the one on top). A full-screen view stands alone: opening one closes the rest.
  let open = null;   // the window on top (keyboard shortcuts go to it)
  let zTop = 100;
  const isOpen = (v) => !!views[v] && !views[v].hidden;
  const isFloat = (o) => o.classList.contains('float');
  const raise = (o) => { o.style.zIndex = String(++zTop); open = o; };
  function show(v) {
    const o = views[v]; if (!o) return;
    for (const x of Object.values(views)) if (!x.hidden && (!isFloat(x) || !isFloat(o)) && x !== o) hide(x);
    if (!o.hidden) { raise(o); return; }
    o.hidden = false; raise(o);
    if (isFloat(o)) {   // a new window steps down-right from the others so it does not hide them exactly
      const n = Object.values(views).filter((x) => !x.hidden && isFloat(x) && x !== o).length, w = o.querySelector('.ov-win');
      if (w && !w.dataset.moved) w.style.transform = `translate(calc(-50% + ${n * 48}px), calc(-50% + ${n * 48}px))`;
    }
    document.body.classList.toggle('fullview', !isFloat(o));   // a full-screen view hides the 4K room behind it
    if (v === 'tape') o.querySelectorAll('.tpv').forEach((d) => { d.hidden = d.dataset.skin !== (document.body.dataset.studio === 'sls' ? 'sls' : 'cmi'); });
    if (v === 'meters') startMeters();
    if (v === 'patchbay') drawPatchbay();
    if (v === 'al') startAL();
    if (v === 'elec') { elShowTrims(); startMeters('#ov-elec'); }
  }
  function hide(o = open) {
    if (!o || o.hidden) return;
    o.hidden = true; const v = o.dataset.view;
    if (!isFloat(o)) document.body.classList.remove('fullview');
    if (v === 'meters' || v === 'elec') stopMeters();
    if (v === 'al') stopAL();
    const rest = Object.values(views).filter((x) => !x.hidden).sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0));
    open = rest[0] || null;
  }
  const hideAll = () => { for (const x of Object.values(views)) if (!x.hidden) hide(x); };
  document.querySelectorAll('[data-open]').forEach((h) => h.addEventListener('click', () => show(h.dataset.open)));
  document.querySelectorAll('.ov-close').forEach((b) => b.addEventListener('click', () => hide(b.closest('.overlay'))));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  // floating windows: click to the front, drag by the title bar (in stage pixels, whatever the window's scale)
  document.querySelectorAll('.overlay.float').forEach((o) => {
    const w = o.querySelector('.ov-win'), bar = o.querySelector('.ov-bar'); if (!w || !bar) return;
    w.addEventListener('pointerdown', () => raise(o), true);
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, input, select, label, a')) return;
      e.preventDefault(); bar.setPointerCapture(e.pointerId);
      const st = document.getElementById('stage').getBoundingClientRect(), k = st.width / 3840, r = w.getBoundingClientRect();
      let x = (r.left - st.left) / k, y = (r.top - st.top) / k; const x0 = e.clientX, y0 = e.clientY, bx = x, by = y;
      Object.assign(w.style, { left: `${x}px`, top: `${y}px`, transform: 'none' }); w.dataset.moved = '1';
      const mv = (ev) => { x = bx + (ev.clientX - x0) / k; y = by + (ev.clientY - y0) / k; w.style.left = `${Math.max(-w.offsetWidth + 120, Math.min(3840 - 120, x))}px`; w.style.top = `${Math.max(0, Math.min(2160 - 60, y))}px`; };
      const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up);
    });
  });
  const svgPt = (svg, e, ref = svg) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(ref.getScreenCTM().inverse()); };

  // ---------------- live tape meters (VU ballistics) ----------------
  const VU = [[-20, -45], [-10, -28], [-7, -18], [-5, -10], [-3, 0], [-2, 6], [-1, 12], [0, 19], [1, 27], [2, 35], [3, 45]];
  const vuAngle = (db) => { db = Math.max(-20, Math.min(3, db)); for (let i = 0; i < VU.length - 1; i++) { const [d0, a0] = VU[i], [d1, a1] = VU[i + 1]; if (db <= d1) return a0 + (a1 - a0) * (db - d0) / (d1 - d0); } return 45; };
  // Needles on their own layer: the meters are drawn inside big pictures (the bridge tiers, the whole 4K room, the meter
  // pop-up), and a needle moved inside one makes the browser repaint all of it, glowing keys and all, every frame. Each
  // needle (with the pivot cover and glass drawn over it) moves to a transparent SVG stacked on top of its picture,
  // composited on its own, so a moving needle repaints only that thin layer.
  (function liftNeedles() {
    const NS = 'http://www.w3.org/2000/svg', layers = new Map();
    for (const n of document.querySelectorAll('.vuN')) {
      const clip = n.parentElement, svg = n.ownerSVGElement; if (!svg || !clip) continue;
      let top = layers.get(svg);
      if (!top) {
        const wrap = document.createElement('div'), abs = svg.style.position === 'absolute';
        wrap.style.cssText = abs ? `position:absolute;left:${svg.style.left || 0};top:${svg.style.top || 0};width:${svg.getAttribute('width')}px;height:${svg.getAttribute('height')}px`
          : `position:relative;width:${svg.getAttribute('width')}px;height:${svg.getAttribute('height')}px`;
        svg.parentNode.insertBefore(wrap, svg); wrap.appendChild(svg);
        if (abs) { svg.style.left = '0'; svg.style.top = '0'; }
        top = document.createElementNS(NS, 'svg');
        for (const k of ['width', 'height', 'viewBox']) if (svg.getAttribute(k)) top.setAttribute(k, svg.getAttribute(k));
        top.setAttribute('class', 'vu-layer'); top.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;will-change:transform';
        wrap.appendChild(top); layers.set(svg, top);
      }
      // keep the transforms of the groups between the picture and the meter, and the meter window's clip
      const tf = []; for (let e = clip.parentElement; e && e !== svg; e = e.parentElement) if (e.getAttribute('transform')) tf.unshift(e.getAttribute('transform'));
      const g = document.createElementNS(NS, 'g'); if (tf.length) g.setAttribute('transform', tf.join(' '));
      const c = document.createElementNS(NS, 'g'); if (clip.getAttribute('clip-path')) c.setAttribute('clip-path', clip.getAttribute('clip-path'));
      g.appendChild(c); top.appendChild(g);
      const move = [n]; for (let e = n.nextElementSibling; e; e = e.nextElementSibling) move.push(e);   // needle, pivot cover, glow, glass
      for (const e of move) c.appendChild(e);
    }
  })();
  let raf = 0;
  function startMeters(sel = '#ov-meters') {
    const needles = [...document.querySelectorAll(`${sel} .vuN`)].map((g) => ({ g, i: +g.dataset.i, cx: +g.dataset.cx, cy: +g.dataset.cy, a: -45, ph: Math.random() * 10 }));
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      for (const n of needles) {
        // the tape machine's real line-output levels while its electronics are on, needles at rest when off (as the studio bridge)
        const live = window.JH24_VU, lvl = live ? live[n.i] ?? -40 : -40;
        const target = vuAngle(lvl);
        n.a += (target - n.a) * (1 - Math.exp(-dt / 0.065));   // ~300 ms to 99%, like a VU movement
        n.g.setAttribute('transform', `rotate(${n.a.toFixed(2)} ${n.cx} ${n.cy})`);
      }
      raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  function stopMeters() { cancelAnimationFrame(raf); raf = 0; }
  // the meter bridges in the studio view (JH-Tape bridge in the JH room, the A827's amber bridge in SLS): the real line-out
  // levels of the tape machine when its electronics are on, needles at rest when off
  const roomNeedles = { cmi: [], sls: [] };
  document.querySelectorAll('.vuN').forEach((g) => { if (g.closest('.overlay')) return; const n = { g, i: +g.dataset.i, cx: +g.dataset.cx, cy: +g.dataset.cy, a: -45 }; (g.closest('#sls') ? roomNeedles.sls : roomNeedles.cmi).push(n); });
  let roomLast = performance.now();
  function roomMeters(now) {
    const dt = Math.min(0.05, (now - roomLast) / 1000); roomLast = now;
    const live = window.JH24_VU, k = 1 - Math.exp(-dt / 0.065);
    for (const n of roomNeedles[document.body.dataset.studio === 'sls' ? 'sls' : 'cmi']) {
      const a = n.a + (vuAngle(live ? live[n.i] ?? -40 : -40) - n.a) * k;
      if (Math.abs(a - n.a) > 0.05 || n.a === -45 && a !== -45) { n.a = a; n.g.setAttribute('transform', `rotate(${a.toFixed(2)} ${n.cx} ${n.cy})`); } else n.a = a;
    }
  }

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
  const FX = ['224 L', '224 R', '160X A', '160X B', 'IM90 A', 'IM90 B', 'H949', 'RMX16', 'SPX A L', 'SPX A R', 'SPX B L', 'SPX B R', 'PCM41 A', 'PCM41 B', 'PCM42 A', 'PCM42 B', 'SLOT1 L', 'SLOT1 R', 'SLOT2 L', 'SLOT2 R', 'SLOT3 L', 'SLOT3 R'];
  // rows come in output / input pairs; "normal" means the pair is wired through until you patch the input
  const ROWS = [
    { id: 'ifin', name: 'INTERFACE IN', sub: 'Studio Bridge inputs', io: 'out', items: L('', 24) },
    { id: 'chin', name: 'CONSOLE LINE IN', sub: 'channels 1–24', io: 'in', items: L('', 24), normal: 'ifin' },
    { id: 'bus', name: 'BUS OUT', sub: 'console buses', io: 'out', items: L('', 24) },
    { id: 'tin', name: 'TAPE IN', sub: 'JH-Tape track inputs', io: 'in', items: L('', 24), normal: 'bus' },
    { id: 'tout', name: 'TAPE OUT', sub: 'JH-Tape repro', io: 'out', items: L('', 24) },
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
    ['isend:1', 'fxin:160X A'], ['fxout:160X A', 'iret:1'], ['isend:7', 'fxin:160X B'], ['fxout:160X B', 'iret:7'],
    ['isend:8', 'fxin:IM90 A'], ['fxout:IM90 A', 'iret:8'],
    ['isend:6', 'fxin:H949'], ['fxout:H949', 'iret:6'], ['isend:5', 'fxin:RMX16'], ['fxout:RMX16', 'iret:5'],
    ['aux:SEND 1', 'fxin:224 L'], ['fxout:224 L', 'lin:LINE 25'], ['fxout:224 R', 'lin:LINE 26'],
    ['isend:3', 'fxin:PCM41 A'], ['fxout:PCM41 A', 'iret:3'], ['isend:9', 'fxin:PCM41 B'], ['fxout:PCM41 B', 'iret:9'],
    ['isend:10', 'fxin:PCM42 A'], ['fxout:PCM42 A', 'iret:10'], ['isend:11', 'fxin:PCM42 B'], ['fxout:PCM42 B', 'iret:11'],
    ['isend:2', 'fxin:SPX A L'], ['fxout:SPX A L', 'iret:2'], ['isend:4', 'fxin:SPX B L'], ['fxout:SPX B L', 'iret:4'],
    ['aux:MIX L', 'ifout:1'], ['aux:MIX R', 'ifout:2'],
    ['aux:CUE1 L', 'ifout:3'], ['aux:CUE1 R', 'ifout:4'], ['aux:CUE2 L', 'ifout:5'], ['aux:CUE2 R', 'ifout:6'],
  ];
  let patches = DEFAULT.map(([a, b], k) => ({ a, b, c: COLS[k % COLS.length] }));
  try {
    const s = JSON.parse(localStorage.getItem('as-patches-v4') || 'null');
    if (Array.isArray(s)) { patches = s.filter((pc) => !/1176/.test(pc.a + pc.b));   // the 1176s left the rack: their cables go too
      // the SPX90IIs work on channel inserts now: their old aux-send / line-return cables give way to the new defaults
      if (!patches.some((pc) => /^isend:/.test(pc.a) && /SPX/.test(pc.b))) { patches = patches.filter((pc) => !/SPX/.test(pc.a + pc.b)); for (const [a2, b2] of [['isend:2', 'fxin:SPX A L'], ['fxout:SPX A L', 'iret:2'], ['isend:4', 'fxin:SPX B L'], ['fxout:SPX B L', 'iret:4']]) if (!patches.some((pc) => pc.a === a2 || pc.b === b2)) patches.push({ a: a2, b: b2, c: COLS[patches.length % COLS.length] }); }
      if (!localStorage.getItem('as-units-pcm')) { localStorage.setItem('as-units-pcm', '1'); patches = patches.filter((pc) => !(pc.a === 'aux:SEND 2' && pc.b === 'fxin:PCM42 A') && !(pc.a === 'fxout:PCM42 A' && pc.b === 'lin:LINE 29')); for (const [a2, b2] of [['isend:3', 'fxin:PCM41 A'], ['fxout:PCM41 A', 'iret:3'], ['isend:9', 'fxin:PCM41 B'], ['fxout:PCM41 B', 'iret:9'], ['isend:10', 'fxin:PCM42 A'], ['fxout:PCM42 A', 'iret:10'], ['isend:11', 'fxin:PCM42 B'], ['fxout:PCM42 B', 'iret:11']]) if (!patches.some((pc) => pc.a === a2 || pc.b === b2)) patches.push({ a: a2, b: b2, c: COLS[patches.length % COLS.length] }); }   // the PCMs now work on inserts
      if (!localStorage.getItem('as-units-h949rmx')) { localStorage.setItem('as-units-h949rmx', '1'); for (const [a2, b2] of [['isend:6', 'fxin:H949'], ['fxout:H949', 'iret:6'], ['isend:5', 'fxin:RMX16'], ['fxout:RMX16', 'iret:5']]) if (!patches.some((pc) => pc.a === a2 || pc.b === b2)) patches.push({ a: a2, b: b2, c: COLS[patches.length % COLS.length] }); }   // the new units join a saved layout, once
      if (!patches.some((pc) => /IM90/.test(pc.a + pc.b))) for (const [a, b] of [['isend:8', 'fxin:IM90 A'], ['fxout:IM90 A', 'iret:8']]) if (!patches.some((pc) => pc.a === a || pc.b === b)) patches.push({ a, b, c: COLS[patches.length % COLS.length] }); }   // the IM90 joins an existing session
  } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem('as-patches-v4', JSON.stringify(patches)); } catch (e) { /* ignore */ } };

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
  // both machines follow the same transport: the JH-Tape (JH room, prefix jh) and the Stauder A827 (SLS room, prefix a8)
  const reels = [['jh', window.JH_LIVE], ['a8', window.A8_LIVE], ['jhp', window.JH_LIVE], ['a8p', window.A8_LIVE]].filter(([, L]) => L).flatMap(([pre, L]) => ['s', 't'].map((k) => ({
    pre, k, d: L[k], rotors: [...document.querySelectorAll(`.${pre}-rotor[data-reel="${k}"]`)], blurs: [...document.querySelectorAll(`.${pre}-blur[data-reel="${k}"]`)], blurOp: 0, labs: [...document.querySelectorAll(`.${pre}-lab[data-reel="${k}"]`)], smears: [...document.querySelectorAll(`.${pre}-smear[data-reel="${k}"]`)], lights: [...document.querySelectorAll(`.${pre}-light[data-reel="${k}"]`)], smKey: '', smOp: -1,
    packs: [...document.querySelectorAll(`.${pre}-pack-${k}`)], strand: document.getElementById(`${pre}-strand-${k}`), lastR: -1,
  })));
  // A827 front panel: live tape timer and key lamps
  const a8ctr = document.getElementById('a8-tctr');
  const a8lamp = (n, on) => { for (const p of ['a8', 'a8p']) { const g = document.getElementById(`${p}-lk-${n}`); if (g) g.setAttribute('opacity', on ? 1 : 0); } };   // studio deck and its pop-up
  const slsTc = document.getElementById('sls-tc');
  // A827 remote: keys drive the shared transport and the autolocator's track states
  const a8r = document.querySelector('#sls');
  if (a8r) a8r.addEventListener('click', (e) => {
    const g = e.target.closest('[data-a8r]'); if (!g) return;
    let n = g.dataset.a8r.replace(/2$/, '');
    const t = /^(rdy|inp|safe)(\d+)$/.exec(n);
    if (t) { const i = +t[2]; if (t[1] === 'rdy') AS_PRESS(`ready${i}`); else if (t[1] === 'inp') AS_PRESS(`input${i}`); else if (AL.ready.has(i)) AS_PRESS(`ready${i}`); return; }
    if (n === 'all') { const any = AL.ready.size > 0; for (let i = 0; i < 24; i++) if (AL.ready.has(i) === any) AS_PRESS(`ready${i}`); return; }
    if (n === 'rec') n = 'record';
    if (['rew', 'ff', 'play', 'stop', 'record'].includes(n)) AS_PRESS(n);
    else if (n === 'f-u0') AS_PRESS('loc0'); else if (n === 'f-l1') tr.locateTo(tr.zero);
  });
  const a8rOn = (id, on) => { const e = document.getElementById(`a8r-l-${id}`); if (e) e.setAttribute('opacity', on ? 0.9 : 0); };
  function drawA827() {
    const rtc = document.getElementById('a8r-tc');
    if (rtc) { const c = Math.max(0, tr.counter), fr = Math.floor((c % 1) * 30); rtc.textContent = `${String(Math.floor(c / 3600)).padStart(2, '0')}:${String(Math.floor(c / 60) % 60).padStart(2, '0')}:${String(Math.floor(c) % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
      const m = tr.mode; for (const sfx of ['', '2']) { a8rOn(`play${sfx}`, m === 'play' || m === 'rec'); a8rOn(`stop${sfx}`, m === 'stop'); a8rOn(`rec${sfx}`, m === 'rec'); a8rOn(`ff${sfx}`, m === 'ff' || (m === 'locate' && tr.v > 0)); a8rOn(`rew${sfx}`, m === 'rew' || (m === 'locate' && tr.v < 0)); }
      for (let i = 0; i < 24; i++) { a8rOn(`rdy${i}`, AL.ready.has(i)); a8rOn(`inp${i}`, AL.inMon.has(i)); a8rOn(`safe${i}`, !AL.ready.has(i)); }
      const sh = document.getElementById('a8r-shuttle'); if (sh) sh.setAttribute('x', 290 + Math.max(-1, Math.min(1, tr.v / 13)) * 48);
      for (const p of ['a8', 'a8p']) { const lcd = document.getElementById(`${p}-lcd`); if (lcd) lcd.textContent = `${tr.speedIPS} IPS ${tr.varispeed ? 'VAR' : 'NAB'}`; }
    }
    if (slsTc) {   // Studio Computer screen: timecode from the tape position (01:00:00:00 at zero, 30 fps)
      const t = Math.max(0, 3600 + tr.counter), fr = Math.floor((t % 1) * 30);
      slsTc.textContent = `${String(Math.floor(t / 3600)).padStart(2, '0')}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}:${String(Math.floor(t) % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
    }
    if (!a8ctr) return;
    const c = tr.counter, a = Math.abs(c), hh = Math.floor(a / 3600), mm = Math.floor(a / 60) % 60, ss = Math.floor(a % 60);
    const ctrTxt = `${c < -0.5 ? '-' : ''}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    a8ctr.textContent = ctrTxt; const a8pc = document.getElementById('a8p-tctr'); if (a8pc) a8pc.textContent = ctrTxt;
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
  // conic gradients for one reel's exposure smear (reel frame; angles clockwise from the top, as CSS conic-gradient)
  function smearBg(el, S, dir) {
    // a natural exposure: each point's colour is the reel's appearance averaged over the last S degrees of turn, weighted
    // by a smooth (Hann) shutter so streaks fade in and out at their ends, with soft-edged slots and label
    const d = el.dataset, slots = d.slots.split(',').map(Number), sw = +d.slotw, las = d.lab.split(',').map(Number), lw = +d.labw, lk = +d.labk;
    const M = Math.max(6, Math.min(40, Math.round(S / 5))), wts = [], offs = []; let wsum = 0;
    for (let m = 0; m < M; m++) { const t = (m + 0.5) / M, wgt = Math.sin(Math.PI * t) ** 2; wts.push(wgt); offs.push(t * S); wsum += wgt; }
    const fe = 1.6;   // degrees of edge softness
    const inside = (x, wd) => { let u = ((x % 360) + 540) % 360 - 180; return Math.max(0, Math.min(1, (wd / 2 + fe - Math.abs(u)) / (2 * fe))); };
    const N = 180, hole = [], lab = [];
    for (let i = 0; i <= N; i++) {
      const th = i * 360 / N; let ch = 0, cl = 0;
      for (let m = 0; m < M; m++) { const at = th - dir * offs[m]; let h = 0, l = 0; for (const s2 of slots) h += inside(at - s2, sw); for (const l2 of las) l += inside(at - l2, lw); ch += wts[m] * Math.min(1, h); cl += wts[m] * Math.min(1, l); }
      ch /= wsum; cl /= wsum;
      hole.push(`rgba(${d.hole},${(ch * 0.97).toFixed(3)}) ${th.toFixed(1)}deg`);
      lab.push(`rgba(${d.labc},${(cl * lk).toFixed(3)}) ${th.toFixed(1)}deg`);
    }
    return `conic-gradient(${hole.join(',')}), conic-gradient(${lab.join(',')}), ${d.avg}`;
  }
  // only the reels on screen are drawn: the studio deck of the room you're in, or the tape view's copy while it's open
  function reelVisible(pre) {
    const sls = document.body.dataset.studio === 'sls', tapeOpen = isOpen('tape');
    if (pre === 'jhp' || pre === 'a8p') return tapeOpen && (pre === 'a8p') === sls;
    return !document.body.classList.contains('fullview') && (pre === 'a8') === sls;
  }
  function drawConsoleReels() {
    const vis = {}; for (const p of ['jh', 'a8', 'jhp', 'a8p']) vis[p] = reelVisible(p);
    for (const rl of reels) {
      if (!vis[rl.pre]) { rl.lastR = -1; rl.smKey = rl.smOp = null; continue; }   // redrawn in full when it comes back on screen
      const ang = (rl.k === 's' ? tr.angleS : tr.angleT) * 180 / Math.PI;
      for (const r of rl.rotors) r.style.transform = `rotateZ(${f2(-ang)}deg)`;   // seen from above both reels turn CCW in play
      // the smeared image turns with the reel, so each streak trails its own slot (moved by the GPU, never repainted)
      for (const el of rl.smears) if (el.dataset.slots) { if (el.dataset.tz == null) { el.dataset.tz = el.style.transform; el.style.willChange = 'transform'; } el.style.transform = `${el.dataset.tz} rotateZ(${f2(-ang)}deg)`; }
      // motion blur, modelled as a camera exposure of ~1/30 s: in that time the reel turns S degrees, so each slot and the
      // label drag an arc S long behind them (coverage = how long each point spent under them). Short arcs at play
      // speed, long arcs while spooling up, and past a full turn a uniform smear (the static ring disc takes over).
      const w = (rl.k === 's' ? tr.v / tr.rS : tr.v / tr.rT);   // rad/s, signed
      const Sx = Math.abs(w) / 50 * 180 / Math.PI, S = Math.min(360, Sx), dir = w >= 0 ? 1 : -1;   // degrees turned in an eye-like 1/50 s exposure
      // below ~25° (play speed) the real reel shows and the label stays readable
      // the blur builds gradually: it starts just above play speed and is complete only near full wind speed; the smooth
      // disc look arrives last
      // the exposure image is right at every speed (short streaks look just like the reel), so it takes over as soon as
      // the reel turns faster than play speed; the blur itself grows with the streaks' length as the reels gather speed
      const o1 = Math.min(1, Math.max(0, (S - 19) / 14)),   /* above any reel in play: an empty take-up at 30 ips turns ~2 rev/s (15 deg) and still looks sharp */ o2 = Math.min(1, Math.max(0, (Sx - 200) / 260)), ease = (x) => x * x * (3 - 2 * x);
      const key = `${S < 60 ? Math.round(S) : Math.round(S / 3) * 3}|${dir}`;   // redraw the streaks as the speed changes (coarser when fast)
      if (o1 > 0 && key !== rl.smKey) { rl.smKey = key; for (const el of rl.smears) if (el.dataset.slots) el.style.background = smearBg(el, Math.max(1, Math.round(S)), dir); }
      const opKey = `${ease(o1).toFixed(2)}|${ease(o2).toFixed(2)}`;
      if (opKey !== rl.smOp) {
        rl.smOp = opKey;
        for (const el of rl.smears) el.style.opacity = ease(o1).toFixed(3);
        for (const el of rl.lights) el.style.opacity = ease(o1).toFixed(3);
        for (const b of rl.blurs) b.style.opacity = ease(o2).toFixed(3);
      }
      const r = packPx(rl.k === 's' ? tr.rS : tr.rT);
      if (Math.abs(r - rl.lastR) < 0.25) continue;
      rl.lastR = r;
      const { cx, cy } = rl.d;
      for (const el of rl.packs) {
        el.style.left = `${f2(cx - r)}px`; el.style.top = `${f2(cy - r)}px`; el.style.width = el.style.height = `${f2(2 * r)}px`;
        if (el.classList.contains('jh-packtop')) el.style.background = `radial-gradient(circle, transparent ${f2(LIVE.hubR - 1)}px, #1a110b ${f2(LIVE.hubR)}px, #2a1b11 ${f2(LIVE.hubR + 8)}px, #21150d ${f2(r * 0.7)}px, #332216 ${f2(r - 3)}px, #110b07 ${f2(r)}px), repeating-radial-gradient(circle, rgba(0,0,0,0.18) 0 1px, transparent 1px 6px)`;
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
  let trkEls = null;
  const AL = { loc: 62, entry: '', apl: false, rep: false, tvi: false, reh: false, rehPunch: false, pending: null, ready: new Set(), inMon: new Set(), mon: 'auto', vari: 0, varOn: false, mem: [0, 21, 62, 167, null, null, null, null, null, null], last: 2 };
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
  const fmt = (t) => { const a = Math.abs(t); const m = Math.min(99, Math.floor(a / 60)), sec = Math.floor(a % 60); return `${String(m).padStart(2, '0')}${String(sec).padStart(2, '0')}`; };
  const segLast = {};
  // dec: the colon shows as a decimal point (its lower dot only), for TVI's 30.00 ips and 1.25 semitones
  // the autolocator's 7-segment displays (pop-up + studio-view mirror): elements looked up once; only segments
  // that change are touched (the glow filter is costly to re-rasterize while the counter races in a fast wind)
  const segEls = {};
  function setSeg(id, digits, dec = false) {
    if (segLast[id] === digits + dec) return; segLast[id] = digits + dec;
    const E = segEls[id] || (segEls[id] = (() => { const gs = [alSvg.querySelector(`#al-${id}`), ...document.querySelectorAll(`.alm-${id}`)].filter(Boolean);
      return { dots: gs.map((g) => g.querySelector('circle')).filter(Boolean), rects: gs.map((g) => [...g.querySelectorAll('rect')]) }; })());
    for (const c of E.dots) if (c._dec !== dec) { c._dec = dec; c.setAttribute('opacity', dec ? 0.09 : 1); }
    for (const rs of E.rects)
      [...digits].forEach((ch, d) => { const on = SEG[ch] || ''; 'abcdefg'.split('').forEach((k, i) => { const r = rs[d * 7 + i]; if (!r) return; const v = on.includes(k); if (r._on === v) return; r._on = v; if (v) { r.setAttribute('opacity', '1'); r.setAttribute('filter', 'url(#glowSm)'); } else { r.setAttribute('opacity', '0.09'); r.removeAttribute('filter'); } }); });
  }
  const lampEls = {}, ledEls = {};   // the pop-up's element and the studio-view face's mirror of it
  const lamp = (n, on) => { const els = lampEls[n] || (lampEls[n] = [alSvg && alSvg.querySelector(`[data-lamp="${n}"]`), ...document.querySelectorAll(`[data-mlamp="${n}"]`)].filter(Boolean)); for (const g of els) if (g._on !== on) { g._on = on; g.setAttribute('opacity', on ? 1 : 0); } };
  const led = (n, on) => { const els = ledEls[n] || (ledEls[n] = [alSvg && alSvg.querySelector(`[data-led="${n}"]`), ...document.querySelectorAll(`[data-mled="${n}"]`)].filter(Boolean)); for (const r of els) if (r._on !== on) { r._on = on; r.setAttribute('opacity', on ? 1 : 0); if (on) r.setAttribute('filter', 'url(#glowSm)'); else r.removeAttribute('filter'); } };
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
    if (['play', 'record', 'rew', 'ff'].includes(n) && window.AS_AUTOPOWER) window.AS_AUTOPOWER();   // a key press may start the audio engine
    if (AL.rep && n !== 'rep' && n !== 'tvi') { AL.rep = false; if (n !== 'stop' && n !== 'play' && n !== 'rew' && n !== 'ff') alMsg('Repeat cancelled'); }
    const d = /^d(\d)$/.exec(n);
    if (d) {
      const k = +d[1];
      if (AL.pending === 'sto') { AL.mem[k] = AL.loc; AL.entry = '';   // STO stores the LOCATE position (manual 2.2.4)
        AL.last = k; AL.pending = null; alMsg(`Stored ${show2(fmt(AL.mem[k]))} in memory ${k}`); drawMem(); return; }
      if (AL.pending === 'rcl') { AL.pending = null; if (AL.mem[k] == null) { alMsg(`Memory ${k} is empty`); return; } AL.loc = AL.mem[k]; AL.entry = ''; AL.last = k; drawMem(); alMsg(`Recalled memory ${k}: ${show2(fmt(AL.loc))} · press LOC`); return; }
      AL.entry = (AL.entry + k).slice(-4); const e = AL.entry.padStart(4, '0'); AL.loc = +e.slice(0, 2) * 60 + Math.min(59, +e.slice(2)); return;
    }
    switch (n) {
      // manual 2.2.4: ← shifts the locate position to the tape position; → shifts the tape position to the locate position
      case 'left': AL.entry = ''; tr.zero = tr.take - AL.loc * tr.nominalSpeed; alMsg(`Tape position set to ${show2(fmt(AL.loc))}`); break;
      case 'right': AL.entry = ''; AL.loc = Math.max(0, Math.floor(tr.counter)); alMsg(`Locate position ${show2(fmt(AL.loc))}`); break;
      case 'rep':   // 8/9/REP: locate to memory 8, play to memory 9, again, until any other key
        if (AL.mem[8] == null || AL.mem[9] == null || AL.mem[9] <= AL.mem[8]) { alMsg('REP needs memory 8 (start) before memory 9 (end): STO 8, STO 9'); break; }
        AL.rep = true; tr.locateTo(counterTake(AL.mem[8]), 'play'); alMsg(`Repeat ${show2(fmt(AL.mem[8]))} → ${show2(fmt(AL.mem[9]))}`); break;
      case 'mode': AL.varOn = !AL.varOn; tr.setVarispeed(AL.varOn ? AL.vari : 0); alMsg(AL.varOn ? `VAR: tape speed ${AL.vari >= 0 ? '+' : ''}${(AL.vari * 100).toFixed(1)} % (TAPE SPEED knob)` : 'FIX: crystal reference'); break;
      case 'tvi': break;   // held, see the pointer handlers
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
    if (AL.tvi) {   // TVI held: tape velocity in ips, pitch change in ¼ semitones (blank when not a multiple)
      const ips = Math.min(99.99, Math.abs(tr.v) / IPS);
      setSeg('tape', String(Math.round(ips * 100)).padStart(4, '0'), true);
      const semis = 12 * Math.log2(1 + (AL.varOn ? AL.vari : 0)), q = semis * 4;
      if (Math.abs(q - Math.round(q)) > 0.08) setSeg('loc', '    ', true);
      else { const v = Math.round(Math.abs(Math.round(q) / 4) * 100); setSeg('loc', (q < -0.5 ? '-' : ' ') + String(v).padStart(3, '0'), true); }
    } else {
      setSeg('tape', c < -0.5 ? '-' + fmt(c).slice(1) : fmt(c));
      setSeg('loc', AL.entry ? AL.entry.padStart(4, ' ') : fmt(AL.loc));
    }
    const blink = Math.floor(now / 250) % 2 === 0, rec = recording(), punch = rec || AL.rehPunch;
    // tape meter bridge (studio view and pop-up): READY / SAFE keys and record lamps follow the armed tracks
    if (!trkEls) trkEls = [...document.querySelectorAll('.trk-on[data-t], .trk-off[data-t]')].map((e) => ({ e, t: +e.dataset.t, on: e.classList.contains('trk-on'), v: -1 }));
    for (const k of trkEls) { const v = AL.ready.has(k.t) === k.on ? 1 : 0; if (k.v !== v) { k.v = v; k.e.setAttribute('opacity', v); } }
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
    lamp('record', rec); lamp('loc', m === 'locate'); lamp('rep', AL.rep); lamp('tvi', AL.tvi); lamp('mode', false); lamp('sto', AL.pending === 'sto'); lamp('rcl', AL.pending === 'rcl');
    const ptr = document.getElementById('al-vari-ptr'); if (ptr) ptr.setAttribute('transform', `rotate(${AL.vari * 675} 29 102)`);   // the pot stays where it was set; MODE decides whether it is used
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
        g.addEventListener('pointermove', (e) => { if (y0 == null) return; const dy = y0 - e.clientY; if (Math.abs(dy) > 4) moved = true; if (moved) { AL.vari = Math.max(-0.2, Math.min(0.2, v0 + dy / 600)); if (AL.varOn) tr.setVarispeed(AL.vari); alMsg(`TAPE SPEED ${AL.vari >= 0 ? '+' : ''}${(AL.vari * 100).toFixed(1)} %${AL.varOn ? '' : ' · press MODE for VAR'}`); } });
        g.addEventListener('pointerup', () => { if (!moved) alMsg('Drag TAPE SPEED up or down · MODE switches FIX / VAR'); y0 = null; });
        return;
      }
      if (n === 'tvi') {   // TVI works while held
        g.addEventListener('pointerdown', (e) => { AL.tvi = true; g.setPointerCapture(e.pointerId); alMsg('TVI: tape velocity (ips) · pitch (semitones)'); });
        const up = () => { AL.tvi = false; };
        g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
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
  // Works like the original (from the user's photos and the 1985 reviews): SMPTE INT generates code (striped to track 24
  // when the tape records with track 24 armed: SMPTE REC light), SMPTE EXT reads track 24 back off the moving tape and
  // turns it into song / measure / beat, MIDI clock (24 ppq), song position, DIN sync and time base through the tempo map.
  const sbxSvg = document.getElementById('sbxSvg');
  const FRS = [[24, '24'], [25, '25'], [30, '30'], [29.97, '30DF']];
  const TBS = [1, 2, 3, 4, 12, 24, 48, 96, 120];
  const SBX = {
    src: 'smpte', manual: false, disp: 1, frI: 2, tbI: 5, resp: 0, taps: [], tempo: 96, entry: '', entryT: 0, mode: '', rec: false,
    intRun: false, intT: 0, offset: 2, editMode: false, editBar: 0, seg: null, locked: false, beatIx: -1, beatFlash: 0, msg: '', msgT: 0,
    metro: 0.6, audio: 0.5, sigBuf: '', totalT: 0, offT: 0, song: 1, countIn: true, repeat: false, tapeOp: '', ledT: 0,
    bars: Array.from({ length: 160 }, () => ({ bpm: 96, num: 4, den: 4 })),
    // the session reel came already striped, 01:00:00:00 at the counter's zero point (as session reels are), so the
    // wall clock and the autolocator agree; re-zeroing the counter later doesn't move the code (it's on the tape)
    stripes: [{ take0: 0, take1: tr.total, code0: -tr.zero / (30 * IPS), speed: 30 * IPS }],
  };
  try { const sv = JSON.parse(localStorage.getItem('as-sbx-map') || 'null'); if (sv && sv.bars) { SBX.bars = sv.bars; SBX.offset = sv.offset ?? 2; } } catch (e) {}
  const sbxMsg = (t, sec = 2.2) => { SBX.msg = t; SBX.msgT = sec; };
  const fps = () => FRS[SBX.frI][0];
  const wallClocks = [...document.querySelectorAll('.smpte-clock')].map((el) => ({ tc: el.querySelector('.wc-tc'), lock: el.querySelector('.wc-lock'), fps: el.querySelector('.wc-fps') }));
  let wcLast = {};
  const tapeCode = (take) => { for (const s of SBX.stripes) if (take >= s.take0 && take <= s.take1) return s.code0 + (take - s.take0) / s.speed; return null; };
  const barLen = (b) => b.num * (60 / b.bpm) * (4 / b.den);
  // song time (s from bar 1) -> position in the tempo map (or at the MANUAL tempo)
  function where(t) {
    const B = SBX.bars;
    if (SBX.manual) {
      const b = B[0], bl = 60 / SBX.tempo * (4 / b.den), beats = t / bl;
      if (t < 0) return { bar: 0, beat: Math.floor(((beats % b.num) + b.num) % b.num) + 1, beats, bpm: SBX.tempo, num: b.num, den: b.den };
      return { bar: Math.floor(beats / b.num) + 1, beat: Math.floor(beats % b.num) + 1, beats, bpm: SBX.tempo, num: b.num, den: b.den };
    }
    if (t < 0) { const b = B[0], bl = 60 / b.bpm * (4 / b.den), beats = t / bl; return { bar: 0, beat: Math.floor(((beats % b.num) + b.num) % b.num) + 1, beats, bpm: b.bpm, num: b.num, den: b.den }; }
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
  const curBar = () => (SBX.cur && SBX.cur.bar > 0 ? SBX.cur.bar - 1 : 0);
  const running = () => (SBX.src === 'smpte' ? SBX.locked : SBX.intRun);
  function sbxTap(now) {
    const n = [2, 3, 4][SBX.resp];
    if (SBX.taps.length && now - SBX.taps[SBX.taps.length - 1] > 2000) SBX.taps = [];
    SBX.taps.push(now); if (SBX.taps.length > n) SBX.taps.shift();
    SBX.beatFlash = 0.08;
    if (SBX.taps.length < n) { sbxMsg(`TAP ${SBX.taps.length}/${n}`); return; }
    const d = (SBX.taps[SBX.taps.length - 1] - SBX.taps[0]) / (SBX.taps.length - 1), bpm = Math.max(30, Math.min(250, 60000 / d));
    SBX.tempo = Math.round(bpm * 10) / 10;
    if (SBX.rec && running()) { const b = curBar(); for (let i = b; i < SBX.bars.length; i++) SBX.bars[i].bpm = SBX.tempo; sbxMsg(`REC M${String(b + 1).padStart(3, '0')} ${SBX.tempo.toFixed(1)}`); }
    else { if (!SBX.manual) SBX.bars.forEach((b) => { b.bpm = SBX.tempo; }); sbxMsg(`TEMPO ${SBX.tempo.toFixed(1)}`); }
  }
  function tapeRun(op) {
    SBX.ledT = 2.5;
    if (op === 'save') { try { localStorage.setItem('as-sbx-map', JSON.stringify({ bars: SBX.bars, offset: SBX.offset })); } catch (e) {} sbxMsg('SAVE · · · · · OK', 3); }
    if (op === 'verify') { let ok = false; try { ok = localStorage.getItem('as-sbx-map') === JSON.stringify({ bars: SBX.bars, offset: SBX.offset }); } catch (e) {} sbxMsg(ok ? 'VERIFY · · · · · OK' : 'VERIFY · ERROR', 3); }
    if (op === 'load') { try { const sv = JSON.parse(localStorage.getItem('as-sbx-map') || 'null'); if (sv) { SBX.bars = sv.bars; SBX.offset = sv.offset ?? 2; sbxMsg('LOAD · · · · · OK', 3); } else sbxMsg('LOAD · NO DATA', 3); } catch (e) {} }
  }
  function sbxPress(n, now = performance.now()) {
    const d = /^d(\d)$/.exec(n);
    if (d) {
      if (SBX.mode === 'sig') { SBX.sigBuf += d[1]; if (SBX.sigBuf.length >= 2) { const num = +SBX.sigBuf[0] || 4, den = +SBX.sigBuf.slice(1) || 4, b = SBX.editMode ? SBX.editBar : curBar(); for (let i = b; i < SBX.bars.length; i++) { SBX.bars[i].num = num; SBX.bars[i].den = [2, 4, 8, 16].includes(den) ? den : 4; } SBX.mode = SBX.editMode ? 'edit' : ''; SBX.sigBuf = ''; sbxMsg(`TIME SIGN ${num}/${den} FROM M${b + 1}`); } else sbxMsg(`TIME SIGN ${SBX.sigBuf}/_`); return; }
      SBX.entry = (SBX.entry + d[1]).slice(-4); SBX.entryT = 6; sbxMsg(`ENTRY ${SBX.entry}`, 6); return;
    }
    const setField = (k) => {
      const v = +SBX.entry; SBX.entry = '';
      const f = fps(), hh = Math.floor(SBX.offset / 3600), mm = Math.floor(SBX.offset / 60) % 60, ss = Math.floor(SBX.offset) % 60, fr = Math.floor((SBX.offset % 1) * f), bt = Math.floor(((SBX.offset * f) % 1) * 80);
      const parts = { hr: hh, min: mm, sec: ss, frm: fr, bit: bt }; parts[k] = Math.min({ hr: 23, min: 59, sec: 59, frm: Math.ceil(f) - 1, bit: 79 }[k], v);
      SBX.offset = parts.hr * 3600 + parts.min * 60 + parts.sec + (parts.frm + parts.bit / 80) / f;
      SBX.offT = 3; const [a, b] = smpteStr(SBX.offset); sbxMsg(`SMPTE OFFSET ${a}:${b}`);
    };
    switch (n) {
      case 'set-hr': case 'set-min': case 'set-sec': case 'set-frm': case 'set-bit': setField(n.slice(4)); break;
      case 'ent': {
        if (!SBX.entry && SBX.tapeOp) { tapeRun(SBX.tapeOp); break; }
        const v = +SBX.entry; SBX.entry = '';
        if (!v) { sbxMsg('ENTER A VALUE'); break; }
        if (SBX.editMode) { SBX.bars[SBX.editBar].bpm = Math.max(30, Math.min(250, v)); sbxMsg(`M${SBX.editBar + 1} = ${SBX.bars[SBX.editBar].bpm} BPM`); }
        else { SBX.tempo = Math.max(30, Math.min(250, v)); if (!SBX.manual) SBX.bars.forEach((b) => { b.bpm = SBX.tempo; }); sbxMsg(`TEMPO ${SBX.tempo}${SBX.manual ? '' : ' · ALL MEASURES'}`); }
        break;
      }
      case 'smptekey': SBX.src = SBX.src === 'smpte' ? 'int' : 'smpte'; SBX.intRun = false; SBX.locked = false; sbxMsg(SBX.src === 'smpte' ? 'SMPTE EXT · PLAY THE TAPE' : 'SMPTE INT · ARM TRACK 24 + RECORD TO STRIPE'); break;
      case 'manual': SBX.manual = !SBX.manual; sbxMsg(SBX.manual ? `MANUAL · ${SBX.tempo.toFixed(1)} BPM FROM THE KNOB` : 'MANUAL OFF · TEMPO MAP'); break;
      case 'offset': {
        const c = tapeCode(tr.take);
        if (!SBX.entry && c != null && tr.mode === 'stop' && SBX.offT > 0) { SBX.offset = c; sbxMsg('BAR 1 = TAPE POSITION'); }
        SBX.offT = 3; const [a, b] = smpteStr(SBX.offset); sbxMsg(`SMPTE OFFSET ${a}:${b} · PRESS AGAIN TO TAKE TAPE POS`, 3); break;
      }
      case 'play': if (SBX.src === 'int') { SBX.intRun = true; SBX.intT = SBX.countIn ? -2 * barLen(SBX.bars[0]) : 0; sbxMsg(SBX.countIn ? 'COUNT IN · 2 MEASURES' : 'PLAY'); } else sbxMsg('ROLL THE TAPE TO LOCK'); break;
      case 'tap': if (SBX.src === 'int' && !SBX.intRun && !SBX.rec) sbxPress('play'); else sbxTap(now); break;   // START, then TAP
      case 'subtap': sbxTap(now); break;
      case 'stopcont': if (SBX.src === 'int') { SBX.intRun = !SBX.intRun; sbxMsg(SBX.intRun ? 'CONTINUE' : 'STOP'); } else sbxMsg('SMPTE EXT · THE TAPE IS IN CHARGE'); break;
      case 'rec': SBX.rec = !SBX.rec; sbxMsg(SBX.rec ? 'TEMPO RECORD · TAP ALONG' : 'RECORD OFF'); break;
      case 'countin': SBX.countIn = !SBX.countIn; sbxMsg(SBX.countIn ? 'COUNT IN ON · 2 MEASURES' : 'COUNT IN OFF'); break;
      case 'repeat': SBX.repeat = !SBX.repeat; sbxMsg(SBX.repeat ? 'REPEAT ON' : 'REPEAT OFF'); break;
      case 'tape': SBX.tapeOp = { '': 'save', save: 'verify', verify: 'load', load: '' }[SBX.tapeOp]; sbxMsg(SBX.tapeOp ? `TAPE ${SBX.tapeOp.toUpperCase()} · PRESS ENTER` : 'TAPE OFF', 4); break;
      case 'edit': SBX.editMode = !SBX.editMode; SBX.mode = SBX.editMode ? 'edit' : ''; if (SBX.editMode) SBX.editBar = curBar(); sbxMsg(SBX.editMode ? `EDIT M${SBX.editBar + 1}` : 'EDIT OFF'); break;
      case 'left': case 'right':
        if (SBX.editMode) { SBX.editBar = Math.max(0, Math.min(SBX.bars.length - 1, SBX.editBar + (n === 'left' ? -1 : 1))); sbxMsg(`EDIT M${SBX.editBar + 1}`); }
        else if (SBX.src === 'int') { const w = SBX.cur || where(0); SBX.intT = Math.max(0, SBX.intT + (n === 'left' ? -1 : 1) * 60 / w.bpm * (4 / w.den)); sbxMsg(n === 'left' ? 'BEAT BACK' : 'BEAT FWD'); }
        else sbxMsg('SMPTE EXT · LOCATE THE TAPE');
        break;
      case 'insert': { const b = SBX.editMode ? SBX.editBar : curBar(); SBX.bars.splice(b, 0, { ...SBX.bars[b] }); sbxMsg(`INS M${b + 1}`); break; }
      case 'delete': { const b = SBX.editMode ? SBX.editBar : curBar(); if (SBX.bars.length > 1) SBX.bars.splice(b, 1); sbxMsg(`DEL M${b + 1}`); break; }
      case 'copy': { const b = SBX.editMode ? SBX.editBar : curBar(); for (let i = b + 1; i < SBX.bars.length; i++) SBX.bars[i] = { ...SBX.bars[b] }; sbxMsg(`COPY M${b + 1} TO SONG END`); break; }
      case 'sig': SBX.mode = 'sig'; SBX.sigBuf = ''; sbxMsg('TIME SIGN: TWO DIGITS'); break;
      case 'total': SBX.totalT = 3; break;
      case 'disp': SBX.disp = SBX.disp % 3 + 1; break;
      case 'tb': SBX.tbI = (SBX.tbI + 1) % TBS.length; sbxMsg(`TIME BASE ${TBS[SBX.tbI]} / QUARTER`); break;
      case 'resp': SBX.resp = (SBX.resp + 1) % 3; sbxMsg(`TAP RESPONSE ${['QUICK (2)', 'MEDIUM (3)', 'SLOW (4)'][SBX.resp]}`); break;
      case 'metro': SBX.metro = (SBX.metro + 0.2) % 1.2; break;
      case 'audio': SBX.audio = (SBX.audio + 0.2) % 1.2; break;
    }
  }
  function sbxTick(dt, now) {
    // ---- SMPTE INT: the generator prints code to track 24 while the machine records with track 24 armed
    const writing = SBX.src === 'int' && tr.mode === 'rec' && AL.ready.has(23) && tr.v > 0;
    if (writing) { if (!SBX.seg) SBX.seg = { take0: tr.take, take1: tr.take, code0: tapeCode(tr.take) ?? 0, speed: tr.nominalSpeed }; SBX.seg.take1 = tr.take; }
    else if (SBX.seg) {
      const s = SBX.seg; SBX.seg = null;
      SBX.stripes = SBX.stripes.flatMap((o) => (o.take1 < s.take0 || o.take0 > s.take1) ? [o] : [...(o.take0 < s.take0 ? [{ ...o, take1: s.take0 }] : []), ...(o.take1 > s.take1 ? [{ ...o, take0: s.take1, code0: o.code0 + (s.take1 - o.take0) / o.speed }] : [])]).concat([s]);
      sbxMsg('SMPTE REC DONE', 3);
    }
    // ---- reader (EXT) or internal clock (INT)
    const code = SBX.seg ? SBX.seg.code0 + (tr.take - SBX.seg.take0) / SBX.seg.speed : tapeCode(tr.take);
    // SMPTE wall clocks (above the autolocator in both rooms): the code read off track 24; dashes on uncoded tape
    if (wallClocks.length) {
      const F = fps(), rate = F === 29.97 ? 30 : Math.round(F);
      let txt = '--:--:--:--';
      if (code != null) { const c = 3600 + code, n = Math.floor(c * rate + 1e-6), fr = n % rate, sec = Math.floor(n / rate); txt = `${String(Math.floor(sec / 3600) % 24).padStart(2, '0')}:${String(Math.floor(sec / 60) % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`; }
      const lock = code != null && Math.abs(tr.v) > 0.05;
      if (txt !== wcLast.txt || lock !== wcLast.lock || F !== wcLast.F) {
        wcLast = { txt, lock, F };
        for (const w of wallClocks) { w.tc.textContent = txt; if (w.lock) w.lock.setAttribute('fill', lock ? '#3dff6a' : '#123d1c'); if (w.fps) w.fps.textContent = F === 29.97 ? '29.97 DF' : `${F} FPS`; }
      }
    }
    const fwd = (tr.mode === 'play' || tr.mode === 'rec') && tr.v > 0.5 * tr.nominalSpeed;
    let ratio = 1, run = false;
    if (SBX.src === 'smpte') {
      const was = SBX.locked;
      SBX.locked = code != null && fwd;
      if (SBX.locked) { ratio = tr.v / tr.nominalSpeed; run = true; }
      SBX.cur = where((code ?? SBX.offset) - SBX.offset);
      if (SBX.locked && !was) sbxMsg(`LOCK · SONG POS ${Math.floor(Math.max(0, SBX.cur.beats) * 4)} · CONTINUE`);
      if (!SBX.locked && was) sbxMsg('NO CODE · CLOCK STOPPED');
    } else {
      SBX.locked = false;
      if (SBX.intRun) { SBX.intT += dt; run = true; }
      SBX.cur = where(SBX.intT);
      if (SBX.cur.end && SBX.intRun) { if (SBX.repeat) SBX.intT = 0; else { SBX.intRun = false; sbxMsg('SONG END'); } }
    }
    const w = SBX.cur, bi = Math.floor(w.beats);
    if (run && bi !== SBX.beatIx) SBX.beatFlash = w.beat === 1 ? 0.14 : 0.08;
    SBX.beatIx = run ? bi : -1;
    SBX.beatFlash = Math.max(0, SBX.beatFlash - dt);
    const clkRate = run ? w.bpm / 60 * 24 * ratio : 0, tbRate = run ? w.bpm / 60 * TBS[SBX.tbI] * ratio : 0;
    if (SBX.clock) SBX.clock.update(now, { running: run, beats: w.beats * 4 / (w.den || 4), qps: w.bpm / 60 * ratio * 4 / (w.den || 4) });
    SBX.msgT = Math.max(0, SBX.msgT - dt); SBX.totalT = Math.max(0, SBX.totalT - dt); SBX.offT = Math.max(0, SBX.offT - dt); SBX.ledT = Math.max(0, SBX.ledT - dt);
    SBX.entryT = Math.max(0, SBX.entryT - dt); if (SBX.entry && SBX.entryT === 0) SBX.entry = '';
    // ---- rack readout
    const [hms, frb] = smpteStr(code);
    const bbStr = w.bar > 0 ? `${String(SBX.song).padStart(2, '0')} ${String(w.bar).padStart(3, '0')} ${w.beat}` : `${String(SBX.song).padStart(2, '0')} -${String(Math.ceil(-w.beats / (w.num || 4))).padStart(2, '0')} ${w.beat}`;
    sbxSet('rk-sbx-l', SBX.disp === 3 ? hms : bbStr); sbxSet('rk-sbx-r', SBX.disp === 3 ? frb : (w.bpm || 0).toFixed(1));
    sbxOn('rk-sbx-lock', SBX.locked || SBX.intRun); sbxOn('rk-sbx-beat', SBX.beatFlash > 0);
    if (!open || open.dataset.view !== 'sbx') return;
    // ---- front panel
    let L, R, mi = SBX.disp;
    if (SBX.totalT > 0) { const T = songLen(); L = `   ${String(Math.floor(T / 60)).padStart(2, '0')}:${String(Math.floor(T % 60)).padStart(2, '0')}`; R = `${SBX.bars.length}`; mi = 3; }
    else if (SBX.offT > 0) { [L, R] = smpteStr(SBX.offset); mi = 3; }
    else if (SBX.editMode) { const b = SBX.bars[SBX.editBar]; L = `${String(SBX.song).padStart(2, '0')} ${String(SBX.editBar + 1).padStart(3, '0')} ${b.num}`; R = SBX.entry || b.bpm.toFixed(1); mi = 1; }
    else if (SBX.disp === 3) { L = hms; R = frb; }
    else if (SBX.disp === 2) { L = bbStr; R = code == null ? '--.--' : frb; }
    else { L = bbStr; R = SBX.entry || (w.bpm || 0).toFixed(1); }
    sbxSet('sbx-l', L); sbxSet('sbx-r', R);
    [1, 2, 3].forEach((k) => sbxOn(`sbx-mi${k}`, mi === k));
    sbxSet('sbx-msg', SBX.msgT > 0 ? SBX.msg : SBX.src === 'smpte' ? (SBX.locked ? `SMPTE EXT · LOCKED ${FRS[SBX.frI][1]} fps` : code == null ? 'SMPTE EXT · NO CODE' : 'SMPTE EXT · WAITING FOR TAPE') : (writing ? 'SMPTE INT · RECORDING CODE TO TRACK 24' : SBX.intRun ? 'SMPTE INT · RUNNING' : 'SMPTE INT'));
    sbxOn('sbx-led-beat', SBX.beatFlash > 0); sbxOn('sbx-taplight', SBX.beatFlash > 0);
    sbxOn('sbx-led-gen', writing || (SBX.src === 'int' && AL.ready.has(23) && Math.floor(now / 400) % 2 === 0));
    ['save', 'verify', 'load'].forEach((k) => sbxOn(`sbx-led-${k}`, SBX.tapeOp === k && (SBX.ledT === 0 || Math.floor(now / 150) % 2 === 0)));
    sbxOn('sbx-led-ext', SBX.src === 'smpte'); sbxOn('sbx-led-int', SBX.src === 'int');
    sbxLamp('manual', SBX.manual); sbxLamp('play', run); sbxLamp('rec', SBX.rec); sbxLamp('countin', SBX.countIn); sbxLamp('sig', SBX.mode === 'sig'); sbxLamp('tape', !!SBX.tapeOp);
    sbxLamp('edit', SBX.editMode); sbxLamp('repeat', SBX.repeat); sbxLamp('total', SBX.totalT > 0); sbxLamp('offset', SBX.offT > 0); sbxLamp('disp', false);
    const knobAt = (id, frac) => { const e = sbxEl(id); if (e) e.setAttribute('transform', `rotate(${(-150 + 300 * frac).toFixed(1)} ${e.dataset.cx} ${e.dataset.cy})`); };
    knobAt('sbx-k-tempo', (SBX.tempo - 40) / 210); knobAt('sbx-k-tb', SBX.tbI / 8); knobAt('sbx-k-metro', SBX.metro); knobAt('sbx-k-audio', SBX.audio);
    const rs = sbxEl('sbx-resp'); if (rs) rs.setAttribute('y', +rs.dataset.y0 + SBX.resp * +rs.dataset.step);
    sbxSet('sbx-out', `OUTPUTS  MIDI CLOCK ${clkRate.toFixed(1)}/s (${SBX.clock ? SBX.clock.sent.clocks : 0} sent)  SONG POS ${Math.max(0, Math.floor(w.beats * 4))}  SYNC ${run ? 'RUN' : 'STOP'}`);
    sbxSet('sbx-out2', `TIME BASE ${TBS[SBX.tbI]}/q = ${tbRate.toFixed(1)}/s  SMPTE ${hms}:${frb.slice(0, 2)} @ ${FRS[SBX.frI][1]} fps`);
    const st = sbxEl('sbx-status'); if (st) st.textContent = SBX.locked ? `Locked to track 24 · ${(w.bpm * ratio).toFixed(1)} BPM at the tape's speed` : SBX.src === 'smpte' ? 'SMPTE EXT · roll the tape (Space) to lock' : 'SMPTE INT · internal clock and code generator';
  }
  if (sbxSvg) {
    sbxSvg.querySelectorAll('[data-sbx]').forEach((g) => {
      const n = g.dataset.sbx;
      if (n === 'tempo') {
        let y0 = null, t0 = 0;
        g.addEventListener('pointerdown', (e) => { y0 = e.clientY; t0 = SBX.tempo; g.setPointerCapture(e.pointerId); });
        g.addEventListener('pointermove', (e) => { if (y0 == null) return; SBX.tempo = Math.round(Math.max(40, Math.min(250, t0 + (y0 - e.clientY) / 2)) * 10) / 10; if (!SBX.manual && SBX.src === 'int') SBX.bars.forEach((b) => { b.bpm = SBX.tempo; }); sbxMsg(`TEMPO ${SBX.tempo.toFixed(1)}`); });
        g.addEventListener('pointerup', () => { y0 = null; });
        return;
      }
      g.addEventListener('pointerdown', (e) => { if (n === 'tap' || n === 'subtap') { e.preventDefault(); sbxPress(n, performance.now()); } });
      g.addEventListener('click', () => { if (n !== 'tap' && n !== 'subtap') sbxPress(n); });
    });
  }
  window.SBX = SBX; window.SBX_PRESS = sbxPress;
  // ---- track 24 from a tape transfer: decode its SMPTE and use it as the stripe on the loaded reel
  function useDecoded(r, name) {
    const NS = tr.nominalSpeed, fwd = r.segments.filter((s) => s.dir > 0);
    if (!fwd.length) { sbxMsg('NO SMPTE FOUND ON THAT FILE', 4); sbxSet('sbx-file', `${name}: no timecode found`); return; }
    SBX.stripes = fwd.map((s) => ({ take0: s.t0 * NS, take1: Math.min(tr.total, s.t1 * NS + 0.5 * NS), code0: s.code0, speed: NS / s.speed }));
    SBX.frI = r.df ? 3 : Math.max(0, FRS.findIndex(([f]) => f === Math.round(r.fps)));
    const first = fwd[0].code0, last = fwd[fwd.length - 1].code1, f = Math.round(r.fps);
    if (SBX.offset < first || SBX.offset > last) SBX.offset = Math.ceil(first);
    const t0 = tcString(framesToTc(Math.round(first * (r.df ? 30000 / 1001 : f)), f, r.df), r.df), t1 = tcString(framesToTc(Math.round(last * (r.df ? 30000 / 1001 : f)), f, r.df), r.df);
    const sp = fwd.reduce((a, s) => a + s.speed * (s.t1 - s.t0), 0) / fwd.reduce((a, s) => a + (s.t1 - s.t0), 0);
    sbxSet('sbx-file', `${name}: ${t0} → ${t1} · ${r.df ? '29.97 DF' : r.fps + ' fps'} · ${fwd.length} run${fwd.length > 1 ? 's' : ''} · speed ${(sp * 100).toFixed(2)} % · ${r.dropouts} dropouts`);
    SBX.src = 'smpte'; sbxMsg(`TRACK 24 READ · ${t0}`, 4);
  }
  const sbxIn = document.getElementById('sbx-in');
  if (sbxIn) sbxIn.addEventListener('change', async () => {
    const f = sbxIn.files[0]; if (!f) return;
    sbxSet('sbx-file', `reading ${f.name} …`);
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      const buf = await ac.decodeAudioData(await f.arrayBuffer());
      const ch = buf.numberOfChannels >= 24 ? 23 : 0;   // a 24-channel interleaved file: track 24; otherwise the track 24 stem
      useDecoded(decode(buf.getChannelData(ch), buf.sampleRate), f.name); ac.close();
    } catch (e) { sbxSet('sbx-file', `${f.name}: could not read (${e.message})`); }
    sbxIn.value = '';
  });
  window.SBX_USE_LTC = (samples, sr, name = 'track24') => useDecoded(decode(samples, sr), name);   // for tests
  // ---- MIDI OUT: a real, steady MIDI clock to external gear (Web MIDI; the Mac app uses CoreMIDI)
  let midiOut = null, midiAcc = null;
  const midiSel = document.getElementById('sbx-midi');
  SBX.clock = new ClockOut((bytes, t) => { if (midiOut) try { midiOut.send(bytes, t); } catch (e) {} SBX.midiFlash = 0.05; });
  async function midiInit() {
    if (!navigator.requestMIDIAccess) { if (midiSel) midiSel.options[0].text = 'MIDI OUT · not available in this browser'; return; }
    try {
      midiAcc = await navigator.requestMIDIAccess();
      const fill = () => { const cur = midiSel.value; midiSel.length = 1; for (const o of midiAcc.outputs.values()) midiSel.add(new Option(`MIDI OUT · ${o.name}`, o.id)); midiSel.value = cur; };
      fill(); midiAcc.onstatechange = fill;
    } catch (e) { midiSel.options[0].text = 'MIDI OUT · access refused'; }
  }
  if (midiSel) { midiSel.addEventListener('focus', () => { if (!midiAcc) midiInit(); }, { once: true }); midiSel.addEventListener('change', () => { midiOut = midiAcc && midiSel.value ? midiAcc.outputs.get(midiSel.value) : null; sbxMsg(midiOut ? `MIDI OUT → ${midiOut.name}` : 'MIDI OUT OFF'); }); }


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
    if (!tapeFrame || !isOpen('tape') || !tapeFrame.contentWindow) return;
    const st = {}; for (const k of STATE_KEYS) st[k] = tr[k];
    tapeFrame.contentWindow.postMessage({ as: 'state', s: st }, '*');
  }

  // ---------------- studio modes: JH / SLS (the rack stays; console, tape machine and autolocator swap) ----------------
  const slsLayer = document.getElementById('sls');
  const modeKeys = [...document.querySelectorAll('.modes button')];
  function setStudio(mode) {
    if (mode !== 'sls') mode = 'cmi';
    if (slsLayer) slsLayer.hidden = mode !== 'sls';
    modeKeys.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    document.body.dataset.studio = mode;
    try { localStorage.setItem('as-studio', mode); } catch (e) {}
  }
  modeKeys.forEach((b) => b.addEventListener('click', () => { hideAll(); setStudio(b.dataset.mode); }));
  let savedMode = 'cmi'; try { savedMode = localStorage.getItem('as-studio') || 'cmi'; } catch (e) {}
  setStudio(savedMode);
  window.AS_SET_STUDIO = setStudio;

  // ---------------- the studio clock ----------------
  let last = performance.now();
  function studio(now) {
    const dt = Math.min(1, (now - last) / 1000); last = now;   // tape time keeps up with real time, even through a slow frame (the quartz-locked audio never waits)
    sgTick(dt, now); syncAdvance(dt, now);   // the synchronizer's servo steps the transport at 100 Hz while it chases
    const full = document.body.classList.contains('fullview');   // the studio is hidden behind a full-screen view: skip its drawing
    drawConsoleReels();   // draws only the reels on screen (the tape view's own copy while it is open)
    sbxTick(dt, now);
    dzTick(dt);
    c160Tick();
    im90Tick();
    spxTick();
    h949Tick(); rmxTick(); pcmTick();
    if (document.body.dataset.studio === 'sls') drawA827();   // also drives the A827 pop-up's display and lamps
    postState();
    if (AL.rep) {   // 8/9/REP loop: at memory 9, back to memory 8 and play again; anything else cancels it
      if (tr.mode === 'play' && tr.counter >= AL.mem[9]) tr.locateTo(counterTake(AL.mem[8]), 'play');
      else if (tr.mode !== 'play' && tr.mode !== 'locate') AL.rep = false;
    }
    if (isOpen('al') || (!full && document.body.dataset.studio !== 'sls')) alRender(now);   // the studio-view face mirrors it too
    elecTick();
    if (!full) roomMeters(now);
    requestAnimationFrame(studio);
  }
  window.AS_PRESS = press;   // for tests
  // READY / SAFE keys on the meter bridge pop-up arm and disarm tracks, as the autolocator's track keys do
  document.querySelectorAll('[data-arm]').forEach((el) => el.addEventListener('click', (e) => {
    e.stopPropagation(); const t = +el.dataset.arm, armed = AL.ready.has(t);
    if ((el.dataset.k === 'ready') !== armed) press(`ready${t}`);
  }));
  requestAnimationFrame(studio);
})();
