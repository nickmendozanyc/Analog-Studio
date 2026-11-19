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
  }
  function hide() { if (!open) return; open.hidden = true; open = null; stopMeters(); }
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

  // ---------------- Lexicon 224X remote ----------------
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
    { id: 'tin', name: 'TAPE IN', sub: 'JH-24 track inputs', io: 'in', items: L('', 24), normal: 'bus' },
    { id: 'tout', name: 'TAPE OUT', sub: 'JH-24 repro', io: 'out', items: L('', 24) },
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
    ['aux:MIX L', 'ifout:1'], ['aux:MIX R', 'ifout:2'],
    ['aux:CUE1 L', 'ifout:3'], ['aux:CUE1 R', 'ifout:4'], ['aux:CUE2 L', 'ifout:5'], ['aux:CUE2 R', 'ifout:6'],
  ];
  let patches = DEFAULT.map(([a, b], k) => ({ a, b, c: COLS[k % COLS.length] }));
  try { const s = JSON.parse(localStorage.getItem('as-patches-v2') || 'null'); if (Array.isArray(s)) patches = s; } catch (e) { /* storage unavailable */ }
  const save = () => { try { localStorage.setItem('as-patches-v2', JSON.stringify(patches)); } catch (e) { /* ignore */ } };

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
})();
