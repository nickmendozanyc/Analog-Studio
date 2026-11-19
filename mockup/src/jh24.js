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
  // Transport layout from the user's JH-24 photos: tape runs across the FRONT of the head block.
  const TAPE_Y = 548;                                         // tape line across the head faces
  const guideL = { cx: 440, cy: TAPE_Y + 24, r: 24 };         // tall black roller, in front of the tape
  const lifterPin = { cx: 410, cy: TAPE_Y - 18, r: 5 };       // thin chrome lifter pin
  const capstan = { cx: 905, cy: TAPE_Y - 20, r: 20 };        // black ribbed capstan, behind the tape
  const pinch = { cx: 917, cy: TAPE_Y + 13, r: 13 };          // slim cream pinch roller, in front
  const guideR = { cx: 1012, cy: TAPE_Y - 26, r: 26 };        // chunky black take-up guide, behind the tape
  const head = { x: 478, y: 412, w: 384, d: 126, h: 140 };    // head assembly box
  const STRIP = { x: 40, y: 606, w: DW - 80, d: 100, zFront: 14, slope: -8 };

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
  deckSvg += `<rect x="${headX - 330}" y="392" width="700" height="210" rx="10" fill="none" stroke="#4a4541" stroke-width="2.5"/><rect x="${headX - 328}" y="394" width="696" height="206" rx="9" fill="none" stroke="#fff" stroke-opacity="0.10"/>`;
  // shadows (light from upper-front-left -> shadows fall back and right)
  for (const rl of [supply, takeup]) deckSvg += `<ellipse cx="${rl.cx + 30}" cy="${rl.cy - 14}" rx="${R + 18}" ry="${R + 10}" fill="#000" opacity="0.38" filter="url(#dsh)"/>`;
  deckSvg += `<rect x="${head.x + 26}" y="${head.y - 30}" width="${head.w + 30}" height="${head.d + 10}" rx="12" fill="#000" opacity="0.45" filter="url(#dsh)"/>`;
  for (const c of [guideL, capstan, pinch, guideR, lifterPin]) deckSvg += `<ellipse cx="${c.cx + 22}" cy="${c.cy - 26}" rx="${c.r + 14}" ry="${c.r + 26}" fill="#000" opacity="0.4" filter="url(#dsh2)"/>`;
  // screws
  const screwSvg = (x, y, r = 5, a = 30) => `<circle cx="${x}" cy="${y + 0.8}" r="${r + 1}" fill="#000" opacity="0.45"/><circle cx="${x}" cy="${y}" r="${r}" fill="#a9a59e"/><line x1="${x - r * 0.75 * Math.cos(a)}" y1="${y - r * 0.75 * Math.sin(a)}" x2="${x + r * 0.75 * Math.cos(a)}" y2="${y + r * 0.75 * Math.sin(a)}" stroke="#3a3633" stroke-width="1.6"/>`;
  for (const [x, y] of [[34, 34], [DW - 34, 34], [34, DD - 36], [DW - 34, DD - 36], [headX - 316, 406], [headX + 356, 406], [headX - 316, 588], [headX + 356, 588]]) deckSvg += screwSvg(x, y, 5, x * 0.7);
  // engraved legends on the head plate
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
    [sPack, SE, null], [guideL, N, N], [capstan, S, S], [guideR, S, E], [tPack, E, null],
  ];
  const tapeSegs = [];
  const contacts = [];
  for (let i = 0; i < chain.length - 1; i++) {
    const [A, ha] = chain[i], [B, hb] = chain[i + 1];
    const [pa, pb] = pickTangent(A, B, chain[i][2] || chain[i][1], chain[i + 1][1]);
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
    for (const hx of [headX - 120, headX, headX + 120]) {
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
      <linearGradient id="fp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7e7871"/><stop offset="1" stop-color="#6a645e"/></linearGradient>
      <linearGradient id="bt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
      <radialGradient id="kn" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#55555a"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient>
      <filter id="gl" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="bs" x="-30%" y="-30%" width="160%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>`);
    // panel in deck colour with the light outline that steps back on the right (as on the JH-24)
    const stepA = w * 0.55, stepB = w * 0.61;
    const outline = `M12 ${d - 10} L12 30 L${stepA} 30 L${stepB} 8 L${w - 12} 8 L${w - 12} ${d - 10} Z`;
    s.push(`<rect x="0" y="0" width="${w}" height="${d}" rx="6" fill="url(#fp)"/>`);
    s.push(`<path d="${outline}" fill="#77716a" stroke="#000" stroke-opacity="0.35" stroke-width="5" transform="translate(1 2)"/>`);
    s.push(`<path d="${outline}" fill="#77716a" stroke="#e6e1d8" stroke-width="3" stroke-linejoin="round"/>`);
    const btn = (bx, by, bw, bh, col, lit, glyph, label, bezel = false) => {
      if (bezel) s.push(`<rect x="${bx - 6}" y="${by - 6}" width="${bw + 12}" height="${bh + 14}" rx="4" fill="#111"/><rect x="${bx - 6}" y="${by - 6}" width="${bw + 12}" height="2" fill="#555"/>`);
      s.push(`<rect x="${bx + 2}" y="${by + 5}" width="${bw}" height="${bh}" rx="3" fill="#000" opacity="0.55" filter="url(#bs)"/>`);
      s.push(`<rect x="${bx}" y="${by + 4}" width="${bw}" height="${bh}" rx="3" fill="#000" opacity="0.55"/>`);
      s.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="3" fill="${col}" ${lit ? 'filter="url(#gl)"' : ''}/>`);
      s.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="3" fill="url(#bt)"/>`);
      if (glyph) s.push(txt(bx + bw / 2, by + bh / 2 + 5, glyph, 13, '#1a1208', 'middle', 800));
      if (label) s.push(txt(bx + bw / 2, by + bh + (bezel ? 18 : 16), label, 7.5, '#e9e4da', 'middle', 800, 'letter-spacing="0.6"'));
    };
    const knobS = (kx, ky, r, ang, label) => {
      s.push(`<circle cx="${kx + 2}" cy="${ky + 4}" r="${r + 2}" fill="#000" opacity="0.5" filter="url(#bs)"/><circle cx="${kx}" cy="${ky}" r="${r}" fill="url(#kn)"/><circle cx="${kx}" cy="${ky}" r="${r * 0.55}" fill="#1c1c1e"/>`);
      const a = (ang - 90) * Math.PI / 180; s.push(`<line x1="${f(kx + r * 0.3 * Math.cos(a))}" y1="${f(ky + r * 0.3 * Math.sin(a))}" x2="${f(kx + r * 0.95 * Math.cos(a))}" y2="${f(ky + r * 0.95 * Math.sin(a))}" stroke="#eee" stroke-width="2" stroke-linecap="round"/>`);
      if (label) s.push(txt(kx, ky + r + 15, label, 7.5, '#e9e4da', 'middle', 800));
    };
    // left group: white indicator pin, red pushbutton, two black knobs, tape-lifter toggle
    const ly = 58;
    s.push(`<circle cx="34" cy="${ly + 2}" r="5" fill="#000" opacity="0.5"/><circle cx="34" cy="${ly}" r="4.5" fill="#efece4"/>`);
    btn(52, ly - 12, 24, 22, '#d42a1e', true, '', 'POWER');
    knobS(118, ly, 12, -40, 'VARI SPD'); knobS(166, ly, 12, 30, 'SHUTTLE');
    s.push(`<rect x="204" y="${ly - 3}" width="44" height="7" rx="3.5" fill="#1c1a18"/><rect x="218" y="${ly - 14}" width="9" height="22" rx="3" fill="#d9dbde" stroke="#666"/>`); s.push(txt(226, ly + 27, 'LIFTERS', 7.5, '#e9e4da'));
    // transport keys: white, white, white, green, red in a black bezel
    const ty = 42;
    [['◀◀', 'REW'], ['▶▶', 'F FWD'], ['■', 'STOP']].forEach(([g, l], i) => btn(330 + i * 54, ty, 40, 30, '#efece4', false, g, l));
    btn(492, ty, 40, 30, '#3fc9a0', true, '▶', 'PLAY');
    btn(556, ty - 4, 44, 30, '#e0322a', true, '●', 'REC', true);
    // stepped-back section: blue, orange, then speed / EQ and the app's tape-character trims
    const ry = 22;
    btn(stepB + 22, ry, 36, 28, '#3f7fd6', false, '▲', 'LIFT');
    btn(stepB + 72, ry, 36, 28, '#ea8a2a', false, '✂', 'EDIT');
    btn(stepB + 136, ry + 2, 32, 24, '#efece4', false, '15', ''); btn(stepB + 172, ry + 2, 32, 24, '#ffb02e', true, '30', ''); s.push(txt(stepB + 170, ry + 44, 'IPS', 7.5, '#e9e4da'));
    btn(stepB + 224, ry + 2, 32, 24, '#fff6e0', true, '', ''); s.push(txt(stepB + 240, ry + 18, 'AES', 8, '#1a1208'));
    btn(stepB + 260, ry + 2, 32, 24, '#efece4', false, '', ''); s.push(txt(stepB + 276, ry + 18, 'NAB', 8, '#1a1208'));
    s.push(txt(stepB + 258, ry + 44, 'EQ', 7.5, '#e9e4da'));
    knobS(stepB + 330, ry + 14, 10, 40, 'SAT'); knobS(stepB + 370, ry + 14, 10, -60, 'W/F'); knobS(stepB + 410, ry + 14, 10, -90, 'HISS');
    btn(stepB + 440, ry + 2, 32, 24, '#e8a840', false, '', 'BYPASS');
    add(`<div style="${box(`left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform-origin:50% 100%;transform:translateZ(${zFront}px) rotateX(${slope}deg)`)}">${svg(w, d, s.join(''))}</div>`);
    const zBack = zFront + d * Math.sin(-slope * Math.PI / 180);
    front(x, y + d, w, 0, zFront, 'linear-gradient(180deg,#77716a,#5a554f)');
    side(x, y, d, 0, zBack, 'linear-gradient(180deg,#77716a,#5a554f)');
    side(x + w, y, d, 0, zBack, 'linear-gradient(180deg,#77716a,#5a554f)');
  }

  // ---------- draw, roughly back to front (preserve-3d sorts by depth anyway) ----------
  reel(supply);
  reel(takeup);
  headAssembly();
  const BLK = 'linear-gradient(90deg,#060606,#3a3a3d 30%,#141416 62%,#040404)';
  const BLK_TOP = 'radial-gradient(circle at 40% 35%, #3a3a3d, #0d0d0e 70%)';
  // ribbed black cylinder: alternating light/dark layers read as grooves
  const ribbed = (c, z0, z1, rr) => { for (let z = z0; z < z1; z += 2) disc(c.cx, c.cy, rr + ((Math.floor(z / 6) % 2) ? 0 : -1.2), z, (Math.floor(z / 6) % 2) ? BLK : 'linear-gradient(90deg,#030303,#26262a 30%,#0a0a0b 62%,#020202)'); disc(c.cx, c.cy, rr, z1, BLK_TOP); };
  // left supply guide: flanged base, tall black roller (tape wraps its back side)
  cylinder(guideL.cx, guideL.cy, guideL.r + 12, 0, 8, BLK, '#1a1a1c', 2);
  cylinder(guideL.cx, guideL.cy, guideL.r + 6, 8, 18, BLK, '#161618', 2);
  cylinder(guideL.cx, guideL.cy, guideL.r, 18, 150, BLK, BLK_TOP);
  disc(guideL.cx, guideL.cy, 7, 150.5, 'radial-gradient(circle at 40% 35%, #fafafa, #8d9196)');
  // thin chrome tape-lifter pin beside it
  cylinder(lifterPin.cx, lifterPin.cy, lifterPin.r + 5, 0, 8, BLK, '#161618', 2);
  cylinder(lifterPin.cx, lifterPin.cy, lifterPin.r, 8, 136, 'linear-gradient(90deg,#6d7178,#f7f8f9 35%,#8e9298 65%,#4a4d52)', 'radial-gradient(circle, #fff, #9ea2a8)');
  // capstan: black motor boss + tall black ribbed capstan behind the tape
  cylinder(capstan.cx, capstan.cy, capstan.r + 14, 0, 14, BLK, '#151517', 2);
  ribbed(capstan, 14, 136, capstan.r);
  disc(capstan.cx, capstan.cy, 6, 136.5, 'radial-gradient(circle at 40% 35%, #fafafa, #8d9196)');
  // pinch roller: slim cream roller in front of the tape, on a black boxy arm housing to its right
  const armX = pinch.cx + 14, armY = TAPE_Y + 4, armW = 60, armD = 30, armH = 30;
  plate(armX, armY, armW, armD, armH, 'linear-gradient(135deg,#2a2a2d,#0c0c0d)');
  front(armX, armY + armD, armW, 0, armH, 'linear-gradient(180deg,#1b1b1d,#060606)');
  side(armX, armY, armD, 0, armH, '#101012'); side(armX + armW, armY, armD, 0, armH, '#0a0a0b');
  cylinder(pinch.cx, pinch.cy, pinch.r + 5, 0, 10, BLK, '#151517', 2);
  cylinder(pinch.cx, pinch.cy, pinch.r, 10, 150, 'linear-gradient(90deg,#8f8672,#f3ecdb 32%,#d6ccb4 62%,#8a816c)', 'radial-gradient(circle at 40% 35%, #fffaf0, #cfc4ab 70%)');
  // right take-up guide: chunky flared black base, tall ribbed black roller (tape wraps its front and right side)
  cylinder(guideR.cx, guideR.cy, guideR.r + 20, 0, 8, BLK, '#1a1a1c', 2);
  cylinder(guideR.cx, guideR.cy, guideR.r + 12, 8, 18, BLK, '#161618', 2);
  cylinder(guideR.cx, guideR.cy, guideR.r + 6, 18, 26, BLK, '#141416', 2);
  ribbed(guideR, 26, 156, guideR.r);
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
