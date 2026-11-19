// MCI JH-24 tape machine as a CSS 3D scene (true perspective, operator's viewpoint).
// Everything is laid out in "deck units" on the flat top deck (x right, y toward the
// operator, z up out of the deck). Chromium renders the perspective; cylinders are
// stacked discs, boxes are planes, the tape is a 2" ribbon standing on edge.

const SANS = "'Helvetica Neue', Helvetica, Arial, 'FreeSans', 'Inter', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const f = (n) => Number(n).toFixed(2);

module.exports = function buildJH24({ TX, TY, TW, TH }) {
  const DW = TW, DD = 720;            // deck size (deck units = px before tilt)
  const FRONT = 560;                  // screen y (scene coords) of the deck's front edge
  const TILT = 54;                    // degrees the deck is tilted away from the viewer
  const out = [];
  const add = (s) => out.push(s);

  // ---------- 3D primitives (children of the deck) ----------
  const box = (style) => `position:absolute;transform-style:preserve-3d;${style}`;
  function disc(cx, cy, r, z, bg, extra = '') {
    add(`<div style="${box(`left:${f(cx - r)}px;top:${f(cy - r)}px;width:${f(2 * r)}px;height:${f(2 * r)}px;border-radius:50%;background:${bg};transform:translateZ(${f(z)}px);${extra}`)}"></div>`);
  }
  // solid cylinder from z0 to z1; side shading comes from a left-to-right gradient on each layer
  function cylinder(cx, cy, r, z0, z1, side, top, step = 2.2) {
    for (let z = z0; z < z1; z += step) disc(cx, cy, r, z, side);
    disc(cx, cy, r, z1, top);
  }
  function ring(cx, cy, r, w, z, color) {
    add(`<div style="${box(`left:${f(cx - r)}px;top:${f(cy - r)}px;width:${f(2 * r)}px;height:${f(2 * r)}px;border-radius:50%;box-sizing:border-box;border:${f(w)}px solid ${color};transform:translateZ(${f(z)}px)`)}"></div>`);
  }
  // vertical plane standing on the deck along the segment (x1,y1)->(x2,y2), from z0 to z1
  function wall(x1, y1, x2, y2, z0, z1, bg) {
    const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    add(`<div style="${box(`left:${f(x1)}px;top:${f(y1)}px;width:${f(L + 0.6)}px;height:${f(z1 - z0)}px;transform-origin:0 0;transform:translateZ(${f(z0)}px) rotateZ(${f(a)}deg) rotateX(90deg);background:${bg}`)}"></div>`);
  }
  // horizontal plane at height z
  function plate(x, y, w, h, z, bg, extra = '') {
    add(`<div style="${box(`left:${f(x)}px;top:${f(y)}px;width:${f(w)}px;height:${f(h)}px;transform:translateZ(${f(z)}px);background:${bg};${extra}`)}"></div>`);
  }
  // front-facing vertical plane (faces the operator) at deck y, spanning x..x+w, z0..z1 ; html content allowed
  function front(x, y, w, z0, z1, bg, html = '', extra = '') {
    const h = z1 - z0;
    add(`<div style="${box(`left:${f(x)}px;top:${f(y - h)}px;width:${f(w)}px;height:${f(h)}px;transform-origin:50% 100%;transform:translateZ(${f(z0)}px) rotateX(-90deg);background:${bg};${extra}`)}">${html}</div>`);
  }
  // side plane (faces left/right) at deck x, spanning y..y+d, z0..z1
  function side(x, y, d, z0, z1, bg) {
    const h = z1 - z0;
    add(`<div style="${box(`left:${f(x - h)}px;top:${f(y)}px;width:${f(h)}px;height:${f(d)}px;transform-origin:100% 50%;transform:translateZ(${f(z0)}px) rotateY(90deg);background:${bg}`)}"></div>`);
  }
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;overflow:visible">${body}</svg>`;
  const txt = (x, y, s, size, fill, anchor = 'middle', weight = 800, extra = '') => `<text x="${f(x)}" y="${f(y)}" font-family="${SANS}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" ${extra}>${esc(s)}</text>`;

  // ---------- geometry ----------
  const headX = DW / 2;
  const TAPE_Z0 = 26, TAPE_Z1 = 98;            // 2" tape = 72 units
  const R = 250, hubR = R * 0.36, holeR = R * 0.27;
  const supply = { cx: 300, cy: 292, pack: 212, rot: 18, labelAt: 198, style: 'a499' };
  const takeup = { cx: DW - 300, cy: 292, pack: 146, rot: -27, style: 'gp9' };
  const TAPE_Y = 566;                           // tape front line across the heads
  const postL = { cx: 112, cy: 578, r: 22 }, postR = { cx: DW - 112, cy: 578, r: 22 };
  const rollG = { cx: 420, cy: TAPE_Y + 12, r: 12 };
  const capstan = { cx: 952, cy: TAPE_Y - 11, r: 11 };
  const pinch = { cx: 952, cy: TAPE_Y + 26, r: 26 };
  const idler = { cx: 1022, cy: TAPE_Y + 15, r: 15 };
  const head = { x: headX - 205, y: 418, w: 410, d: 124, h: 150 };   // head assembly box
  const STRIP = { x: 84, y: 628, w: DW - 168, d: 82, zFront: 16, slope: -15 };

  // ---------- flat deck surface (plan-view SVG) ----------
  let deckSvg = '';
  deckSvg += `<defs>
    <linearGradient id="dk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f6963"/><stop offset="0.55" stop-color="#7d7770"/><stop offset="1" stop-color="#8a847c"/></linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4541"/><stop offset="1" stop-color="#5a5550"/></linearGradient>
    <filter id="dsh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="dsh2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="tex"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer></filter>
  </defs>`;
  deckSvg += `<rect x="0" y="0" width="${DW}" height="${DD}" rx="10" fill="url(#rim)"/>`;
  deckSvg += `<rect x="16" y="16" width="${DW - 32}" height="${DD - 30}" rx="6" fill="url(#dk)"/>`;
  deckSvg += `<rect x="16" y="16" width="${DW - 32}" height="${DD - 30}" rx="6" filter="url(#tex)"/>`;
  deckSvg += `<rect x="16.5" y="16.5" width="${DW - 33}" height="${DD - 31}" rx="6" fill="none" stroke="#2f2b28" stroke-width="2"/>`;
  // head plate seam
  deckSvg += `<rect x="${headX - 340}" y="396" width="680" height="226" rx="10" fill="none" stroke="#4a4541" stroke-width="2.5"/><rect x="${headX - 338}" y="398" width="676" height="222" rx="9" fill="none" stroke="#fff" stroke-opacity="0.10"/>`;
  // shadows (light from upper-front-left -> shadows fall back and right)
  for (const rl of [supply, takeup]) deckSvg += `<ellipse cx="${rl.cx + 30}" cy="${rl.cy - 14}" rx="${R + 18}" ry="${R + 10}" fill="#000" opacity="0.38" filter="url(#dsh)"/>`;
  deckSvg += `<rect x="${head.x + 26}" y="${head.y - 30}" width="${head.w + 30}" height="${head.d + 10}" rx="12" fill="#000" opacity="0.45" filter="url(#dsh)"/>`;
  for (const c of [postL, postR, rollG, capstan, pinch, idler]) deckSvg += `<ellipse cx="${c.cx + 22}" cy="${c.cy - 26}" rx="${c.r + 14}" ry="${c.r + 26}" fill="#000" opacity="0.4" filter="url(#dsh2)"/>`;
  // screws
  const screwSvg = (x, y, r = 5, a = 30) => `<circle cx="${x}" cy="${y + 0.8}" r="${r + 1}" fill="#000" opacity="0.45"/><circle cx="${x}" cy="${y}" r="${r}" fill="#a9a59e"/><line x1="${x - r * 0.75 * Math.cos(a)}" y1="${y - r * 0.75 * Math.sin(a)}" x2="${x + r * 0.75 * Math.cos(a)}" y2="${y + r * 0.75 * Math.sin(a)}" stroke="#3a3633" stroke-width="1.6"/>`;
  for (const [x, y] of [[34, 34], [DW - 34, 34], [34, DD - 36], [DW - 34, DD - 36], [headX - 326, 410], [headX + 326, 410], [headX - 326, 608], [headX + 326, 608]]) deckSvg += screwSvg(x, y, 5, x * 0.7);
  // engraved legends on the head plate
  for (const [lab, hx] of [['ERASE', headX - 125], ['RECORD / SYNC', headX], ['REPRO', headX + 125]]) deckSvg += txt(hx, 604, lab, 11, '#2f2b28', 'middle', 800, 'letter-spacing="2"');
  // reel table hint rings
  for (const rl of [supply, takeup]) deckSvg += `<circle cx="${rl.cx}" cy="${rl.cy}" r="96" fill="#5f5a55" stroke="#3f3b37" stroke-width="2"/><circle cx="${rl.cx}" cy="${rl.cy}" r="96" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1" transform="translate(0 1.5)"/>`;

  add(`<div class="jh-deck" style="${box(`left:0;top:${FRONT - DD}px;width:${DW}px;height:${DD}px;transform-origin:50% 100%;transform:rotateX(${TILT}deg)`)}">`);
  add(svg(DW, DD, deckSvg));

  // ---------- reels ----------
  const REEL = {
    a499: {
      face: `radial-gradient(circle at 38% 30%, rgba(255,255,255,0.75), rgba(255,255,255,0) 45%), conic-gradient(from 200deg, rgba(255,255,255,0.35), rgba(0,0,0,0.10) 25%, rgba(255,255,255,0.30) 50%, rgba(0,0,0,0.12) 75%, rgba(255,255,255,0.35)), repeating-conic-gradient(from 0deg, #e4e6e9 0deg 0.35deg, #d9dce0 0.35deg 0.8deg, #eceef0 0.8deg 1.1deg), #dfe2e5`,
      edge: 'linear-gradient(90deg,#8f9398,#e9ebee 40%,#7c8085)', back: '#9a9ea3', ink: '#141414',
    },
    gp9: {
      face: `radial-gradient(circle at 38% 30%, rgba(255,190,170,0.75), rgba(255,120,90,0) 48%), conic-gradient(from 200deg, rgba(255,210,190,0.30), rgba(0,0,0,0.10) 25%, rgba(255,210,190,0.25) 50%, rgba(0,0,0,0.12) 75%, rgba(255,210,190,0.30)), repeating-conic-gradient(from 0deg, #dc4529 0deg 0.35deg, #d33e24 0.35deg 0.8deg, #e14d31 0.8deg 1.1deg), #d8432a`,
      edge: 'linear-gradient(90deg,#8a2414,#e85a3e 40%,#7a1e10)', back: '#9c2e1b', ink: '#1b1b1b',
    },
  };
  const slot = (cx, cy, rIn, rOut, w, ang, c) => {
    const t = ang * Math.PI / 180, rot = (x, y) => [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)];
    const hw = w / 2, y0 = -rOut, y1 = -rIn;
    const seq = [['M', -hw + c, y0], ['L', hw - c, y0], ['A', hw, y0 + c], ['L', hw, y1 - c], ['A', hw - c, y1], ['L', -hw + c, y1], ['A', -hw, y1 - c], ['L', -hw, y0 + c], ['A', -hw + c, y0]];
    return seq.map(([cmd, x, y]) => { const [X, Y] = rot(x, y); return cmd === 'A' ? `A${c} ${c} 0 0 1 ${f(X)} ${f(Y)}` : `${cmd}${f(X)} ${f(Y)}`; }).join(' ') + ' Z ';
  };
  function reelMask(rot) {
    const c = R;
    let d = `M0 ${c} A${c} ${c} 0 1 0 ${2 * c} ${c} A${c} ${c} 0 1 0 0 ${c} Z M${c - hubR} ${c} A${hubR} ${hubR} 0 1 0 ${c + hubR} ${c} A${hubR} ${hubR} 0 1 0 ${c - hubR} ${c} Z `;
    for (const k of [0, 180]) d += slot(c, c, R * 0.5, R * 0.84, R * 0.17, rot + k, R * 0.035);
    const s = `<svg xmlns='http://www.w3.org/2000/svg' width='${2 * c}' height='${2 * c}'><path d='${d}' fill='black' fill-rule='evenodd'/></svg>`;
    return { url: `url("data:image/svg+xml;utf8,${encodeURIComponent(s)}")`, d };
  }
  function reel(rl) {
    const st = REEL[rl.style];
    const { url, d } = reelMask(rl.rot);
    const { cx, cy } = rl;
    // turntable + spindle
    cylinder(cx, cy, 92, 0, 18, 'linear-gradient(90deg,#2a2725,#55504b 40%,#1e1c1a)', '#3c3835', 3);
    // back flange (3 layers)
    const flange = (z, bg) => add(`<div style="${box(`left:${f(cx - R)}px;top:${f(cy - R)}px;width:${2 * R}px;height:${2 * R}px;transform:translateZ(${f(z)}px);background:${bg};clip-path:path(evenodd,'${d}')`)}"></div>`);
    flange(20, st.edge); flange(21.5, st.edge); flange(23, st.back);
    // hub ring (black plastic) between the flanges
    for (let z = 23; z <= 100; z += 2.5) ring(cx, cy, hubR, hubR - holeR, z, z > 98 ? '#141416' : '#0b0b0c');
    // tape pack: outer wraps are matte black back-coating; top edge shows the wound edges
    const packMask = `-webkit-mask-image:radial-gradient(circle, transparent ${f(hubR - 1)}px, #000 ${f(hubR)}px);mask-image:radial-gradient(circle, transparent ${f(hubR - 1)}px, #000 ${f(hubR)}px)`;
    for (let z = TAPE_Z0; z < TAPE_Z1; z += 2.4) disc(cx, cy, rl.pack, z, 'linear-gradient(90deg,#120e0b,#3a2c22 35%,#1a140f 70%,#0e0b09)', packMask);
    disc(cx, cy, rl.pack, TAPE_Z1, `radial-gradient(circle, transparent ${f(hubR - 1)}px, #2d2119 ${f(hubR)}px, #4a3727 ${f(hubR + 8)}px, #3a2b1f ${f(rl.pack * 0.7)}px, #5a4532 ${f(rl.pack - 3)}px, #1d150f ${f(rl.pack)}px), repeating-radial-gradient(circle, rgba(0,0,0,0.18) 0 1px, transparent 1px 6px)`);
    // front flange (3 layers, the top one with the finish)
    flange(100, st.edge); flange(101.5, st.edge);
    flange(103, st.face);
    // printed label + screws + hub detail on the front flange
    const lab = [];
    const c = R;
    const la = rl.labelAt ?? rl.rot;
    const [lx, ly] = [c + R * 0.62 * Math.cos(la * Math.PI / 180), c + R * 0.62 * Math.sin(la * Math.PI / 180)];
    lab.push(`<g transform="rotate(${la + (rl.labelAt != null ? 180 : 0)} ${f(lx)} ${f(ly)})">`);
    if (rl.style === 'gp9') {
      lab.push(txt(lx + 4, ly - 30, 'QUANTEGY', 15.5, '#1b1b1b', 'middle', 900, 'letter-spacing="0.5"'));
      lab.push(`<ellipse cx="${f(lx - 4)}" cy="${f(ly + 2)}" rx="60" ry="21" fill="#f3f1ec" transform="rotate(-12 ${f(lx)} ${f(ly)})"/>`);
      lab.push(txt(lx + 2, ly + 14, 'GP9', 42, '#3a3a3c', 'middle', 900, 'font-style="italic" letter-spacing="-1"'));
      lab.push(txt(lx + 2, ly + 35, 'GRAND MASTER PLATINUM', 8.8, '#1b1b1b', 'middle', 800));
    } else {
      lab.push(txt(lx, ly - 26, 'AMPEX', 19, '#141414', 'middle', 900, 'letter-spacing="1"'));
      lab.push(txt(lx, ly + 13, '499', 40, '#a9802f', 'middle', 900, 'letter-spacing="-1"'));
      lab.push(txt(lx, ly + 27, 'GRAND MASTER™ GOLD', 8.8, '#141414', 'middle', 800));
      lab.push(txt(lx, ly + 39, 'Studio Mastering Audio Tape', 8.2, '#a9802f', 'middle', 600));
    }
    lab.push(`</g>`);
    for (let k = 0; k < 6; k++) { const a = (rl.rot + 30 + k * 60) * Math.PI / 180; lab.push(`<circle cx="${f(c + R * 0.42 * Math.cos(a))}" cy="${f(c + R * 0.42 * Math.sin(a))}" r="3.8" fill="#111"/><circle cx="${f(c + R * 0.42 * Math.cos(a) - 0.8)}" cy="${f(c + R * 0.42 * Math.sin(a) - 0.8)}" r="1.4" fill="#555"/>`); }
    lab.push(`<path d="${d}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2"/>`);
    lab.push(`<circle cx="${c}" cy="${c}" r="${R - 1.5}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2"/>`);
    lab.push(`<circle cx="${c}" cy="${c}" r="${hubR}" fill="none" stroke="#0d0d0e" stroke-width="8"/>`);
    add(`<div style="${box(`left:${f(cx - R)}px;top:${f(cy - R)}px;width:${2 * R}px;height:${2 * R}px;transform:translateZ(103.6px)`)}">${svg(2 * R, 2 * R, lab.join(''))}</div>`);
    // black hold-down knob on the spindle
    cylinder(cx, cy, 30, 100, 128, 'linear-gradient(90deg,#050505,#3a3a3c 35%,#0b0b0c 70%,#000)', 'radial-gradient(circle at 40% 35%, #4a4a4d, #111 60%)', 2);
    const lobes = [0, 1, 2].map((k) => { const a = (rl.rot + k * 120) * Math.PI / 180; return `<circle cx="${f(44 + 26 * Math.cos(a))}" cy="${f(44 + 26 * Math.sin(a))}" r="13" fill="#0e0e0f"/>`; }).join('');
    add(`<div style="${box(`left:${f(cx - 44)}px;top:${f(cy - 44)}px;width:88px;height:88px;transform:translateZ(128.5px)`)}">${svg(88, 88, `${lobes}<circle cx="44" cy="44" r="30" fill="#141416"/><circle cx="44" cy="44" r="30" fill="url(#none)"/><circle cx="38" cy="36" r="18" fill="#fff" opacity="0.08"/><circle cx="44" cy="44" r="7" fill="#c9ccd0"/><circle cx="43" cy="43" r="3" fill="#fff" opacity="0.7"/>`)}</div>`);
  }

  // ---------- tape path (tangent lines between rollers, wraps as arcs) ----------
  const tangent = (A, B, sa, sb) => {
    const dx = B.cx - A.cx, dy = B.cy - A.cy, D = Math.hypot(dx, dy);
    const ra = sa * A.r, rb = sb * B.r, k = (ra - rb) / D;
    const ux = dx / D, uy = dy / D, h = Math.sqrt(Math.max(0, 1 - k * k));
    const out = [];
    for (const sg of [1, -1]) {
      const nx = k * ux - sg * h * uy, ny = k * uy + sg * h * ux;
      out.push([[A.cx + ra * nx, A.cy + ra * ny], [B.cx + rb * nx, B.cy + rb * ny]]);
    }
    return out;
  };
  // pick the tangent whose contact points best match the hinted sides
  const pickTangent = (A, B, hintA, hintB) => {
    let best, bs = -1e9;
    for (const sa of [1, -1]) for (const sb of [1, -1]) for (const [pa, pb] of tangent(A, B, sa, sb)) {
      const s = ((pa[0] - A.cx) * hintA[0] + (pa[1] - A.cy) * hintA[1]) / A.r + ((pb[0] - B.cx) * hintB[0] + (pb[1] - B.cy) * hintB[1]) / B.r;
      if (s > bs) { bs = s; best = [pa, pb]; }
    }
    return best;
  };
  const N = [0, -1], S = [0, 1], E = [1, 0], W = [-1, 0], SW = [-0.7, 0.7], SE = [0.7, 0.7];
  const sPack = { cx: supply.cx, cy: supply.cy, r: supply.pack }, tPack = { cx: takeup.cx, cy: takeup.cy, r: takeup.pack };
  const chain = [
    [sPack, W], [postL, SW], [rollG, N], [capstan, S], [idler, N], [postR, SE], [tPack, E],
  ];
  const tapeSegs = [];
  const contacts = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const [A, ha] = chain[i], [B, hb] = chain[i + 1];
    const [pa, pb] = pickTangent(A, B, i === 0 ? W : (A === postL ? S : ha), B === postR ? S : hb);
    tapeSegs.push([pa, pb]);
    contacts.push([pa, pb]);
  }
  // wraps around intermediate rollers
  for (let i = 1; i < chain.length - 1; i++) {
    const C = chain[i][0], pin = contacts[i - 1][1], pout = contacts[i][0];
    let a0 = Math.atan2(pin[1] - C.cy, pin[0] - C.cx), a1 = Math.atan2(pout[1] - C.cy, pout[0] - C.cx);
    let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    const n = Math.max(2, Math.ceil(Math.abs(da) / 0.25));
    for (let k = 0; k < n; k++) {
      const t0 = a0 + da * k / n, t1 = a0 + da * (k + 1) / n;
      tapeSegs.push([[C.cx + C.r * Math.cos(t0), C.cy + C.r * Math.sin(t0)], [C.cx + C.r * Math.cos(t1), C.cy + C.r * Math.sin(t1)]]);
    }
  }
  const TAPE_BG = 'linear-gradient(180deg,#3b2c21 0%,#2a1f17 30%,#33261c 55%,#1c1510 100%)';

  // ---------- head assembly (box) ----------
  function headAssembly() {
    const { x, y, w, d, h } = head;
    // sides
    side(x, y, d, 0, h, 'linear-gradient(90deg,#0c0c0d,#1c1c1e)');
    side(x + w, y, d, 0, h, 'linear-gradient(90deg,#1c1c1e,#0c0c0d)');
    // front face (black) with model legend
    front(x, y + d, w, 0, h, 'linear-gradient(180deg,#232325 0%,#141416 60%,#0c0c0d 100%)',
      svg(w, h, `<rect x="0" y="0" width="${w}" height="3" fill="#555" opacity="0.6"/>`));
    // lid (brushed silver) with vents and screws
    const lid = [];
    lid.push(`<defs><linearGradient id="lidg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4e5e7"/><stop offset="0.5" stop-color="#b9bcc0"/><stop offset="1" stop-color="#9da1a6"/></linearGradient></defs>`);
    lid.push(`<rect x="0" y="0" width="${w}" height="${d}" rx="6" fill="#151517"/><rect x="12" y="10" width="${w - 24}" height="${d - 22}" rx="3" fill="url(#lidg)"/>`);
    for (let k = 0; k < 10; k++) lid.push(`<rect x="${34 + k * 35}" y="28" width="18" height="${d - 60}" rx="3" fill="#5c5f63" opacity="0.65"/>`);
    for (const [sx, sy] of [[24, 22], [w - 24, 22], [24, d - 24], [w - 24, d - 24]]) lid.push(`<circle cx="${sx}" cy="${sy}" r="4" fill="#777"/><line x1="${sx - 3}" y1="${sy}" x2="${sx + 3}" y2="${sy}" stroke="#333" stroke-width="1.4"/>`);
    add(`<div style="${box(`left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform:translateZ(${h}px)`)}">${svg(w, d, lid.join(''))}</div>`);
    // head stacks (erase, record/sync, repro) protruding toward the tape
    for (const hx of [headX - 125, headX, headX + 125]) {
      const hw = 66, hd = TAPE_Y - (y + d) - 1, z0 = 14, z1 = 112;
      plate(hx - hw / 2, y + d, hw, hd, z1, 'linear-gradient(180deg,#9a9da2,#d9dbde)');
      side(hx - hw / 2, y + d, hd, z0, z1, '#7d8086');
      side(hx + hw / 2, y + d, hd, z0, z1, '#5f6268');
      const stack = [];
      stack.push(`<rect x="0" y="0" width="${hw}" height="${z1 - z0}" rx="4" fill="#c9ccd0"/><rect x="5" y="${(z1 - z0) - (TAPE_Z1 - z0) - 2}" width="${hw - 10}" height="${TAPE_Z1 - TAPE_Z0 + 4}" rx="3" fill="#1d2a3c"/>`);
      for (let t = 0; t < 24; t++) stack.push(`<rect x="9" y="${f((z1 - z0) - (TAPE_Z1 - z0) + t * 3)}" width="${hw - 18}" height="1.4" fill="#5d7392" opacity="0.9"/>`);
      stack.push(`<rect x="${hw / 2 - 1}" y="${(z1 - z0) - (TAPE_Z1 - z0) - 2}" width="2" height="${TAPE_Z1 - TAPE_Z0 + 4}" fill="#e9ecef"/>`);
      front(hx - hw / 2, TAPE_Y - 1, hw, z0, z1, '#b5b8bc', svg(hw, z1 - z0, stack.join('')));
    }
  }

  // ---------- transport strip (raised, sloping down toward the operator) ----------
  function transportStrip() {
    const { x, y, w, d, zFront, slope } = STRIP;
    const s = [];
    const ink = '#2a2624';
    s.push(`<defs>
      <linearGradient id="fp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfcac1"/><stop offset="1" stop-color="#a39e95"/></linearGradient>
      <linearGradient id="bt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
      <radialGradient id="kn" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#55555a"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient>
      <filter id="gl" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="bs" x="-30%" y="-30%" width="160%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>`);
    s.push(`<rect x="0" y="0" width="${w}" height="${d}" rx="5" fill="url(#fp)"/><rect x="0" y="0" width="${w}" height="1.5" fill="#fff" opacity="0.6"/>`);
    s.push(`<rect x="7" y="7" width="${w - 14}" height="${d - 14}" rx="4" fill="none" stroke="#7b766f"/>`);
    const btn = (bx, by, bw, bh, col, lit, glyph, label) => {
      s.push(`<rect x="${bx + 2}" y="${by + 5}" width="${bw}" height="${bh}" rx="3" fill="#000" opacity="0.55" filter="url(#bs)"/>`);
      s.push(`<rect x="${bx}" y="${by + 4}" width="${bw}" height="${bh}" rx="3" fill="#000" opacity="0.5"/>`);
      s.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="3" fill="${col}" ${lit ? 'filter="url(#gl)"' : ''}/>`);
      s.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="3" fill="url(#bt)"/>`);
      if (glyph) s.push(txt(bx + bw / 2, by + bh / 2 + 6, glyph, 16, '#1a1208', 'middle', 800));
      if (label) s.push(txt(bx + bw / 2, d - 13, label, 8.5, ink, 'middle', 800, 'letter-spacing="0.8"'));
    };
    const knobS = (kx, ky, r, ang, label) => {
      s.push(`<circle cx="${kx + 2}" cy="${ky + 4}" r="${r + 2}" fill="#000" opacity="0.45" filter="url(#bs)"/><circle cx="${kx}" cy="${ky}" r="${r}" fill="url(#kn)"/>`);
      const a = (ang - 90) * Math.PI / 180; s.push(`<line x1="${kx}" y1="${ky}" x2="${f(kx + r * 0.9 * Math.cos(a))}" y2="${f(ky + r * 0.9 * Math.sin(a))}" stroke="#eee" stroke-width="2" stroke-linecap="round"/>`);
      if (label) s.push(txt(kx, d - 13, label, 8.5, ink, 'middle', 800));
    };
    const by = 16, bh = 36;
    // power / record-safe lamp, vari-speed + shuttle knobs, tape-lifter lever
    s.push(`<circle cx="44" cy="${by + 18}" r="11" fill="#d42a1e" filter="url(#gl)"/><circle cx="41" cy="${by + 14}" r="4" fill="#fff" opacity="0.5"/>`); s.push(txt(44, d - 13, 'POWER', 8.5, ink));
    knobS(92, by + 18, 13, -40, 'VARI SPD'); knobS(140, by + 18, 13, 30, 'SHUTTLE');
    s.push(`<rect x="176" y="${by + 13}" width="46" height="10" rx="5" fill="#2a2624"/><rect x="184" y="${by + 3}" width="14" height="28" rx="3" fill="#d9dbde" stroke="#777"/>`); s.push(txt(199, d - 13, 'LIFTERS', 8.5, ink));
    const T = [['◀◀', 'REW', '#efece4', 0], ['▶▶', 'F FWD', '#efece4', 0], ['■', 'STOP', '#efece4', 0], ['▶', 'PLAY', '#59f07a', 1], ['●', 'REC', '#ff3b2f', 1], ['▲', 'LIFT', '#5aa0e6', 0], ['✂', 'EDIT', '#e8962e', 0]];
    T.forEach(([g, l, c, lit], i) => btn(250 + i * 60, by, 48, bh + 6, c, lit, g, l));
    let x2 = 690;
    s.push(`<line x1="${x2 - 14}" y1="14" x2="${x2 - 14}" y2="${d - 14}" stroke="#7b766f"/>`);
    btn(x2, by + 4, 40, 30, '#efece4', 0, '15', ''); btn(x2 + 46, by + 4, 40, 30, '#ffb02e', 1, '30', ''); s.push(txt(x2 + 43, d - 13, 'SPEED IPS', 8.5, ink));
    btn(x2 + 104, by + 4, 40, 30, '#fff6e0', 1, '', ''); s.push(txt(x2 + 124, by + 24, 'AES', 10, '#1a1208')); btn(x2 + 150, by + 4, 40, 30, '#efece4', 0, '', ''); s.push(txt(x2 + 170, by + 24, 'NAB', 10, '#1a1208')); s.push(txt(x2 + 147, d - 13, 'EQ', 8.5, ink));
    x2 = 912;
    s.push(`<line x1="${x2 - 18}" y1="14" x2="${x2 - 18}" y2="${d - 14}" stroke="#7b766f"/>`);
    knobS(x2 + 14, by + 18, 14, 40, 'SATURATION'); knobS(x2 + 78, by + 18, 14, -60, 'WOW / FLUT'); knobS(x2 + 140, by + 18, 14, -90, 'HISS');
    btn(x2 + 184, by + 4, 70, 30, '#e8a840', 0, '', 'TAPE CHAR'); s.push(txt(x2 + 219, by + 24, 'BYPASS', 10, '#1a1208'));
    // top face sloped: origin at the front edge, raised at the back
    add(`<div style="${box(`left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform-origin:50% 100%;transform:translateZ(${zFront}px) rotateX(${slope}deg)`)}">${svg(w, d, s.join(''))}</div>`);
    const zBack = zFront + d * Math.sin(-slope * Math.PI / 180);
    front(x, y + d, w, 0, zFront, 'linear-gradient(180deg,#8a857d,#6b665f)');
    side(x, y, d, 0, zBack, 'linear-gradient(180deg,#8a857d,#6b665f)');
    side(x + w, y, d, 0, zBack, 'linear-gradient(180deg,#8a857d,#6b665f)');
  }

  // ---------- draw, roughly back to front (preserve-3d sorts by depth anyway) ----------
  reel(supply);
  reel(takeup);
  headAssembly();
  // guide posts: tall black, chrome cap
  for (const pst of [postL, postR]) {
    cylinder(pst.cx, pst.cy, pst.r + 6, 0, 12, 'linear-gradient(90deg,#0a0a0a,#3a3a3c 35%,#0b0b0c)', '#1a1a1c', 3);
    cylinder(pst.cx, pst.cy, pst.r, 12, 150, 'linear-gradient(90deg,#060606,#3d3d40 32%,#151517 60%,#050505)', 'radial-gradient(circle at 40% 35%, #f2f3f5, #9ea2a8 45%, #4a4d52)');
  }
  // flanged roller guide
  cylinder(rollG.cx, rollG.cy, rollG.r + 8, 0, 20, 'linear-gradient(90deg,#0a0a0a,#3a3a3c 35%,#0b0b0c)', '#1a1a1c', 3);
  cylinder(rollG.cx, rollG.cy, rollG.r, 20, TAPE_Z1 + 6, 'linear-gradient(90deg,#6d7178,#f0f1f3 35%,#8e9298 65%,#55585e)', '#ccc', 2.2);
  cylinder(rollG.cx, rollG.cy, rollG.r + 7, TAPE_Z1 + 6, TAPE_Z1 + 12, 'linear-gradient(90deg,#6d7178,#f0f1f3 35%,#55585e)', 'radial-gradient(circle at 40% 35%, #fafafa, #9ea2a8 60%)', 2);
  // capstan: motor boss + thin chrome shaft
  cylinder(capstan.cx, capstan.cy, 30, 0, 16, 'linear-gradient(90deg,#0a0a0a,#3a3a3c 35%,#0b0b0c)', '#161618', 3);
  cylinder(capstan.cx, capstan.cy, capstan.r, 16, 122, 'linear-gradient(90deg,#6d7178,#f7f8f9 35%,#8e9298 65%,#4a4d52)', 'radial-gradient(circle at 40% 35%, #fafafa, #9ea2a8 60%)', 2);
  // pinch roller on its arm
  wall(pinch.cx, pinch.cy, pinch.cx + 92, pinch.cy + 22, 6, 22, '#121214');
  plate(pinch.cx, pinch.cy - 9, 94, 18, 22, '#1a1a1c', `transform-origin:0 50%;transform:translateZ(22px) rotateZ(${f(Math.atan2(22, 92) * 180 / Math.PI)}deg)`);
  cylinder(pinch.cx + 92, pinch.cy + 22, 12, 0, 30, 'linear-gradient(90deg,#0a0a0a,#3a3a3c 35%,#0b0b0c)', 'radial-gradient(circle, #c9ccd0 4px, #111 5px)', 3);
  cylinder(pinch.cx, pinch.cy, pinch.r, 22, TAPE_Z1 + 8, 'linear-gradient(90deg,#030303,#2c2c2e 30%,#0d0d0e 60%,#020202)', 'radial-gradient(circle, #c9ccd0 6px, #222 7px, #111 60%, #1c1c1e)', 2.2);
  // cream idler / tach roller
  cylinder(idler.cx, idler.cy, idler.r + 7, 0, 14, 'linear-gradient(90deg,#0a0a0a,#3a3a3c 35%,#0b0b0c)', '#161618', 3);
  cylinder(idler.cx, idler.cy, idler.r, 14, 128, 'linear-gradient(90deg,#9b917c,#f1ead8 35%,#c9bfa6 65%,#8a816c)', 'radial-gradient(circle at 40% 35%, #fffaf0, #d2c8b0 60%)', 2.2);
  // the tape itself
  for (const [[x1, y1], [x2, y2]] of tapeSegs) wall(x1, y1, x2, y2, TAPE_Z0, TAPE_Z1, TAPE_BG);
  transportStrip();
  add(`</div>`);

  // ---------- cabinet front (vertical, faces the operator) ----------
  const cab = [];
  const LIPH = 44, WOODY = FRONT + LIPH;
  cab.push(`<defs>
    <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c5752"/><stop offset="0.15" stop-color="#4a4541"/><stop offset="1" stop-color="#36322f"/></linearGradient>
    <linearGradient id="lam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e482b"/><stop offset="0.35" stop-color="#9a6b42"/><stop offset="0.7" stop-color="#875a36"/><stop offset="1" stop-color="#5e3d24"/></linearGradient>
    <filter id="grainV"><feTurbulence type="fractalNoise" baseFrequency="0.0025 0.21" numOctaves="5" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.035  0 0 0 0 0.0  0 0 0 2.4 -0.85"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <linearGradient id="shadeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  </defs>`);
  cab.push(`<rect x="0" y="${FRONT - 2}" width="${TW}" height="${LIPH + 2}" fill="url(#lip)"/><rect x="0" y="${FRONT - 2}" width="${TW}" height="1.5" fill="#fff" opacity="0.25"/>`);
  cab.push(`<rect x="44" y="${FRONT + 12}" width="96" height="22" rx="2" fill="#0c0c0d"/><rect x="44" y="${FRONT + 12}" width="96" height="2" fill="#fff" opacity="0.15"/>`);
  cab.push(txt(92, FRONT + 29, 'MCI', 17, '#e3e5e8', 'middle', 900, 'font-style="italic" letter-spacing="4"'));
  // drawer front: woodgrain laminate inside a dark frame, small model tag at right
  cab.push(`<rect x="0" y="${WOODY}" width="${TW}" height="${TH - WOODY}" fill="#3a3633"/>`);
  cab.push(`<rect x="22" y="${WOODY + 14}" width="${TW - 44}" height="${TH - WOODY - 14}" fill="url(#lam)"/>`);
  cab.push(`<rect x="22" y="${WOODY + 14}" width="${TW - 44}" height="${TH - WOODY - 14}" fill="#000" filter="url(#grainV)"/>`);
  cab.push(`<rect x="22" y="${WOODY + 14}" width="${TW - 44}" height="${TH - WOODY - 14}" fill="none" stroke="#1e1b19" stroke-width="3"/>`);
  cab.push(`<rect x="22" y="${WOODY + 14}" width="${TW - 44}" height="36" fill="url(#shadeTop)"/>`);
  cab.push(`<rect x="${TW - 118}" y="${WOODY + 150}" width="62" height="22" rx="2" fill="#2a2725"/>`);
  cab.push(txt(TW - 87, WOODY + 165, 'JH-24', 10, '#d9d3c7', 'middle', 800, 'letter-spacing="1"'));
  // cabinet side frames
  cab.push(`<rect x="0" y="${FRONT - 2}" width="22" height="${TH - FRONT + 2}" fill="#3a3633"/><rect x="${TW - 22}" y="${FRONT - 2}" width="22" height="${TH - FRONT + 2}" fill="#33302d"/>`);

  return `<div id="jh24" style="position:absolute;left:${TX}px;top:${TY}px;width:${TW}px;height:${TH}px;overflow:hidden;perspective:1650px;perspective-origin:50% -20%;">
  ${svg(TW, TH, cab.join(''))}
  ${out.join('\n')}
</div>`;
};
