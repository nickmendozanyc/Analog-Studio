// HJ-24 tape machine as a CSS 3D scene (true perspective, operator's viewpoint).
// Everything is laid out in "deck units" on the flat top deck (x right, y toward the
// operator, z up out of the deck). Chromium renders the perspective; cylinders are
// stacked discs, boxes are planes, the tape is a 2" ribbon standing on edge.

const SANS = "'Helvetica Neue', Helvetica, Arial, 'FreeSans', 'Inter', sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const f = (n) => Number(n).toFixed(2);

module.exports = function buildJH24({ TX, TY, TW, TH, skin = 'hj24' }) {
  const A8 = skin === 'a827';   // Stauder A827 skin: same transport geometry and physics, its own look
  const DW = TW, DD = 720;            // original deck size (deck units = px before tilt)
  // Layout for 14" reels: the reels sit 2" further apart and 2" further back, the transport 2" further forward.
  // The deck grows to fit and is scaled back into the same screen space. (1" = 250 / 7 deck units.)
  const IN = 250 / 7, DZ = 2 * IN, OX = 44;
  // deck plate: 2" (at 10.5" reel scale) of clearance around the reels; OX fixes the drawing scale, so it stays
  const U = 250 / 5.25, REEL_CX = 300 + IN, REEL_CY = 292 - 2 * IN;
  const PL = REEL_CX - 250 - 2 * U, PT = REEL_CY - 250 - 2 * U, PR = DW - PL;
  const OY = Math.ceil(-PT);
  const DW2 = DW + 2 * OX, DD2 = DD + OY + DZ, DSCALE = DW / DW2;
  const FRONT = 560;
  const PW = PR - PL, PH = DD + DZ - PT, CI = Math.round((PL + OX) * DW / (DW + 2 * OX));   // plate size; cabinet inset to match the plate's front edge
  if (!A8) globalThis.JH_CI = CI;                  // screen y (scene coords) of the deck's front edge
  const TILT = 59;                    // degrees the deck is tilted away from the viewer
  const out = [];
  const add = (s) => out.push(s);

  // ---------- 3D primitives (children of the deck) ----------
  const box = (style) => `position:absolute;transform-style:preserve-3d;${style}`;
  function disc(cx, cy, r, z, bg, extra = '', cls = '') {
    add(`<div${cls ? ` class="${cls}" data-z="${f(z)}"` : ''} style="${box(`left:${f(cx - r)}px;top:${f(cy - r)}px;width:${f(2 * r)}px;height:${f(2 * r)}px;border-radius:50%;background:${bg};transform:translateZ(${f(z)}px);${extra}`)}"></div>`);
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
  function wall(x1, y1, x2, y2, z0, z1, bg, id = '') {
    const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    add(`<div${id ? ` id="${id}"` : ''} style="${box(`left:${f(x1)}px;top:${f(y1)}px;width:${f(L + 0.6)}px;height:${f(z1 - z0)}px;transform-origin:0 0;transform:translateZ(${f(z0)}px) rotateZ(${f(a)}deg) rotateX(90deg);background:${bg}`)}"></div>`);
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
  const RS = process.env.REEL14 ? 14 / 10.5 : 1;   // 10.5" reels; REEL14=1 draws 14" reels on the same hubs for a fitment check
  const R = 250 * RS, hubR = 250 * 0.36, holeR = 250 * 0.27;
  const supply = { cx: 300 + IN, cy: 292 - 2 * IN, pack: 213 * RS, rot: 18, labelAt: 198 * RS, style: 'a499' };   // 2500 ft on a 10.5" reel, 03:42 in at 30 IPS
  const takeup = { cx: DW - 300 - IN, cy: 292 - 2 * IN, pack: 145 * RS, rot: -27, style: 'gp9' };
  // Transport layout from the user's HJ-24 photos: tape runs across the FRONT of the head block.
  const TAPE_Y = 548 + DZ;                                         // tape line across the head faces
  const guideL = { cx: 440, cy: TAPE_Y + 24, r: 24 };         // tall black roller, in front of the tape
  const lifterPin = { cx: 410, cy: TAPE_Y - 18, r: 5 };       // thin chrome lifter pin
  const capstan = { cx: 905, cy: TAPE_Y - 20, r: 20 };        // black ribbed capstan, behind the tape
  const pinch = { cx: 917, cy: TAPE_Y + 13, r: 13 };          // slim cream pinch roller, in front
  const guideR = { cx: 1012, cy: TAPE_Y - 26, r: 26 };        // chunky black take-up guide, behind the tape
  // spring-loaded tension arms (as on the JH-24): chrome roller on a black arm from a pivot boss
  const armL = { cx: 290, cy: TAPE_Y - 58, r: 18, px: 365, py: TAPE_Y + 41 };
  const armR = { cx: 1128, cy: TAPE_Y - 66, r: 22, px: 1053, py: TAPE_Y + 37 };
  const head = { x: 478, y: 412 + DZ, w: 384, d: 126, h: 140 };    // head assembly box
  const STRIP = { x: 40, y: 606 + DZ, w: DW - 80, d: 100, zFront: 14, slope: -8 };

  // ---------- flat deck surface (plan-view SVG) ----------
  let deckSvg = '';
  deckSvg += `<defs>
    ${A8 ? `<linearGradient id="dk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4d6d9"/><stop offset="0.5" stop-color="#c3c6c9"/><stop offset="1" stop-color="#b3b6ba"/></linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b3f22"/><stop offset="0.04" stop-color="#9a6438"/><stop offset="0.06" stop-color="#a7abaf"/><stop offset="0.94" stop-color="#a7abaf"/><stop offset="0.96" stop-color="#9a6438"/><stop offset="1" stop-color="#6b3f22"/></linearGradient>` : `<linearGradient id="dk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f4943"/><stop offset="0.55" stop-color="#57514b"/><stop offset="1" stop-color="#5d5650"/></linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#433d38"/><stop offset="1" stop-color="#504a44"/></linearGradient>`}
    <filter id="dsh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="dsh2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="tex"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer></filter>
  </defs>`;
  deckSvg += `<rect x="${PL}" y="${PT}" width="${PW}" height="${PH}" rx="10" fill="url(#rim)"/>`;
  deckSvg += `<rect x="${16 + PL}" y="${16 + PT}" width="${PW - 32}" height="${PH - 30}" rx="6" fill="url(#dk)"/>`;
  deckSvg += `<rect x="${16 + PL}" y="${16 + PT}" width="${PW - 32}" height="${PH - 30}" rx="6" filter="url(#tex)"/>`;
  deckSvg += `<rect x="${16.5 + PL}" y="${16.5 + PT}" width="${PW - 33}" height="${PH - 31}" rx="6" fill="none" stroke="#2f2b28" stroke-width="2"/>`;
  // head plate seam
  deckSvg += `<rect x="${headX - 330}" y="${392 + DZ}" width="700" height="210" rx="10" fill="none" stroke="#4a4541" stroke-width="2.5"/><rect x="${headX - 328}" y="${394 + DZ}" width="696" height="206" rx="9" fill="none" stroke="#fff" stroke-opacity="0.10"/>`;
  // shadows (light from upper-front-left -> shadows fall back and right)
  for (const rl of [supply, takeup]) deckSvg += `<ellipse cx="${rl.cx + 30}" cy="${rl.cy - 14}" rx="${R + 18}" ry="${R + 10}" fill="#000" opacity="0.38" filter="url(#dsh)"/>`;
  deckSvg += `<rect x="${head.x + 26}" y="${head.y - 30}" width="${head.w + 30}" height="${head.d + 10}" rx="12" fill="#000" opacity="0.45" filter="url(#dsh)"/>`;
  for (const c of [guideL, capstan, pinch, guideR, lifterPin, armL, armR]) deckSvg += `<ellipse cx="${c.cx + 22}" cy="${c.cy - 26}" rx="${c.r + 14}" ry="${c.r + 26}" fill="#000" opacity="0.4" filter="url(#dsh2)"/>`;
  // screws
  const screwSvg = (x, y, r = 5, a = 30) => `<circle cx="${x}" cy="${y + 0.8}" r="${r + 1}" fill="#000" opacity="0.45"/><circle cx="${x}" cy="${y}" r="${r}" fill="#a9a59e"/><line x1="${x - r * 0.75 * Math.cos(a)}" y1="${y - r * 0.75 * Math.sin(a)}" x2="${x + r * 0.75 * Math.cos(a)}" y2="${y + r * 0.75 * Math.sin(a)}" stroke="#3a3633" stroke-width="1.6"/>`;
  for (const [x, y] of [[PL + 34, PT + 34], [PR - 34, PT + 34], [PL + 34, DD + DZ - 36], [PR - 34, DD + DZ - 36], [headX - 316, 406 + DZ], [headX + 356, 406 + DZ], [headX - 316, 588 + DZ], [headX + 356, 588 + DZ]]) deckSvg += screwSvg(x, y, 5, x * 0.7);
  // engraved legends on the head plate
  // reel table hint rings
  for (const rl of [supply, takeup]) deckSvg += `<circle cx="${rl.cx}" cy="${rl.cy}" r="96" fill="#5f5a55" stroke="#3f3b37" stroke-width="2"/><circle cx="${rl.cx}" cy="${rl.cy}" r="96" fill="none" stroke="#fff" stroke-opacity="0.12" stroke-width="1" transform="translate(0 1.5)"/>`;

  add(`<div class="jh-deck" style="${box(`left:${-OX}px;top:${FRONT - DD2}px;width:${DW2}px;height:${DD2}px;transform-origin:50% 100%;transform:scale(${DSCALE}) rotateX(${TILT}deg)`)}">`);
  add(`<div style="${box(`left:${OX}px;top:${OY}px;width:${DW}px;height:${DD}px`)}">`);
  add(svg(DW, DD, deckSvg));

  // ---------- reels ----------
  // reel skins: each tape's reel as photographed (made-up brand names; designs after the user's photos). Windows: n
  // trapezoids from rIn to rOut (fractions of R), widths wIn / wOut, first at a0 degrees from the reel's own rotation.
  // Labels: art drawn upright at (0, 0), placed at the given angles (clockwise from the top of the reel).
  const silver = (base, a, b, c2) => `radial-gradient(circle at 38% 30%, rgba(255,255,255,0.75), rgba(255,255,255,0) 45%), conic-gradient(from 200deg, rgba(255,255,255,0.35), rgba(0,0,0,0.10) 25%, rgba(255,255,255,0.30) 50%, rgba(0,0,0,0.12) 75%, rgba(255,255,255,0.35)), repeating-conic-gradient(from 0deg, ${a} 0deg 0.35deg, ${b} 0.35deg 0.8deg, ${c2} 0.8deg 1.1deg), ${base}`;
  const SILVER = { face: silver('#dfe2e5', '#e4e6e9', '#d9dce0', '#eceef0'), edge: 'linear-gradient(90deg,#8f9398,#e9ebee 40%,#7c8085)', back: '#9a9ea3' };
  const T = (x, y, str, size, fill, extra = '') => `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" fill="${fill}" text-anchor="middle" font-weight="900" ${extra}>${esc(str)}</text>`;
  const amtex = (num) => (rl, lx, ly, la) => [txt(lx, ly - 26, 'AMTEX', 19, '#141414', 'middle', 900, 'letter-spacing="1"'), txt(lx, ly + 13, num, 40, '#a9802f', 'middle', 900, 'letter-spacing="-1"'), txt(lx, ly + 27, num === '499' ? 'GOLD MASTER' : 'GRAND MASTER', 8.8, '#141414', 'middle', 800), txt(lx, ly + 39, 'Studio Mastering Audio Tape', 8.2, '#a9802f', 'middle', 600)].join('');
  const GP9FACE = `radial-gradient(circle at 38% 30%, rgba(255,190,170,0.75), rgba(255,120,90,0) 48%), conic-gradient(from 200deg, rgba(255,210,190,0.30), rgba(0,0,0,0.10) 25%, rgba(255,210,190,0.25) 50%, rgba(0,0,0,0.12) 75%, rgba(255,210,190,0.30)), repeating-conic-gradient(from 0deg, #dc4529 0deg 0.35deg, #d33e24 0.35deg 0.8deg, #e14d31 0.8deg 1.1deg), #d8432a`;
  const REEL = {
    a499: { name: 'Amtex 499', ...SILVER, win: { n: 2, rIn: 0.5, rOut: 0.84, wIn: 0.17, wOut: 0.17, c: 0.035, a0: 0 }, legacy: amtex('499') },
    a456: { name: 'Amtex 456', ...SILVER, win: { n: 2, rIn: 0.5, rOut: 0.84, wIn: 0.17, wOut: 0.17, c: 0.035, a0: 0 }, legacy: amtex('456') },
    gp9: {
      name: 'Quantica GP9', face: GP9FACE, edge: 'linear-gradient(90deg,#8a2414,#e85a3e 40%,#7a1e10)', back: '#9c2e1b',
      win: { n: 2, rIn: 0.5, rOut: 0.84, wIn: 0.17, wOut: 0.17, c: 0.035, a0: 0 },
      legacy: (rl, lx, ly) => [txt(lx + 4, ly - 30, 'QUANTICA', 15.5, '#1b1b1b', 'middle', 900, 'letter-spacing="0.5"'), `<ellipse cx="${f(lx - 4)}" cy="${f(ly + 2)}" rx="60" ry="21" fill="#f3f1ec" transform="rotate(-12 ${f(lx)} ${f(ly)})"/>`, txt(lx + 2, ly + 14, 'GP9', 42, '#3a3a3c', 'middle', 900, 'font-style="italic" letter-spacing="-1"'), txt(lx + 2, ly + 35, 'PLATINUM MASTER', 8.8, '#1b1b1b', 'middle', 800)].join(''),
      smearSlot: 'rgba(40,10,4,A)', smearLabel: 'rgba(255,236,228,A)', holeRGB: '40,12,6', labRGB: '246,240,232', labK: 0.8,
    },
    gp14: {
      // the 14" GP9 as photographed: solid red flange, two narrow slots, a small white sticker near the rim
      name: 'Quantica GP9 14"', size: 14, face: GP9FACE, edge: 'linear-gradient(90deg,#8a2414,#e85a3e 40%,#7a1e10)', back: '#9c2e1b',
      win: { n: 2, rIn: 0.52, rOut: 0.86, wIn: 0.1, wOut: 0.1, c: 0.03, a0: 30 },
      labels: [[105, () => `<g transform="translate(0 28) rotate(-90)"><rect x="-58" y="-30" width="116" height="60" rx="4" fill="#f6f4ef" stroke="#c9c2b6" stroke-width="1"/>${T(-12, -14, 'QUANTICA', 11, '#d23a24', 'letter-spacing="0.6"')}<ellipse cx="2" cy="6" rx="46" ry="14" fill="#e94f2f" transform="rotate(-10 2 6)"/>${T(4, 15, 'GP9', 28, '#ffffff', 'font-style="italic"')}${T(0, 26, 'GRAND MASTER PLATINUM', 5.6, '#2a2a2a')}</g>`]],
      smearSlot: 'rgba(40,10,4,A)', holeRGB: '40,12,6', labRGB: '246,240,232', labK: 0.4,
    },
    maxwell: {
      name: 'Maxwell', ...SILVER, face: silver('#e3e5e7', '#e8e9eb', '#dcdee1', '#eff0f2'),
      win: { n: 2, rIn: 0.43, rOut: 0.86, wIn: 0.32, wOut: 0.36, c: 0.025, a0: 90 },
      labels: [0, 180].map((a) => [a, () => `<g>${T(0, 44, 'm', 150, '#111', 'transform="scale(1.18 1)" letter-spacing="-4"')}<text transform="translate(-86 -6) rotate(-90)" font-family="${SANS}" font-size="15" font-weight="800" fill="#111" text-anchor="middle">maxwell</text></g>`]),
      labRGB: '30,30,30', labK: 0.35,
    },
    scotia: {
      name: 'Scotia', ...SILVER, face: silver('#dcdfe2', '#e1e3e6', '#d5d8dc', '#e8eaed'),
      win: { n: 3, rIn: 0.44, rOut: 0.87, wIn: 0.28, wOut: 0.56, c: 0.07, a0: 60 },
      labels: [[0, () => `<g>${T(0, 16, 'Scotia', 50, 'rgba(255,255,255,0.45)', 'font-style="italic" stroke="#8a8e93" stroke-width="1.6" letter-spacing="1"')}${T(78, -6, '®', 12, '#8a8e93')}</g>`]],
      labRGB: '150,154,160', labK: 0.25,
    },
    atx: {
      name: 'ATX Magnetics', ...SILVER, face: silver('#e1e3e5', '#e6e7e9', '#dadcdf', '#edeef0'),
      win: { n: 3, rIn: 0.44, rOut: 0.86, wIn: 0.26, wOut: 0.48, c: 0.06, a0: 30 },
      labels: [[90, () => `<g transform="rotate(-90)"><rect x="-62" y="-36" width="124" height="72" rx="3" fill="#fbfbf8" stroke="#141414" stroke-width="3"/><rect x="-40" y="-31" width="80" height="28" fill="none" stroke="#141414" stroke-width="2"/>${T(0, -9, 'ATX', 25, '#141414', 'letter-spacing="2"')}${T(0, 9, 'MAGNETICS', 11, '#141414', 'letter-spacing="1.5"')}<rect x="-57" y="15" width="114" height="17" fill="#141414"/>${T(0, 28, 'MASTER TAPE', 12.5, '#fbfbf8', 'letter-spacing="1"')}</g>`]],
      labRGB: '120,120,118', labK: 0.4,
    },
    bafs: {
      name: 'BAFS Studio Master 900', face: silver('#cfd1cf', '#d4d6d4', '#c8cac8', '#dadcda'), edge: 'linear-gradient(90deg,#86898a,#dcdedd 40%,#76797a)', back: '#8e9192',
      win: { n: 3, rIn: 0.46, rOut: 0.87, wIn: 0.34, wOut: 0.58, c: 0.09, a0: 60 },
      labels: [[0, () => `<g><rect x="-74" y="-40" width="148" height="80" rx="3" fill="#121212"/><rect x="-66" y="-33" width="18" height="18" fill="#e3321f"/><circle cx="-57" cy="-24" r="5" fill="none" stroke="#fff" stroke-width="2"/>${T(12, -15, 'BAFS', 26, '#ffffff', 'letter-spacing="1"')}${T(8, 2, 'STUDIO MASTER', 12, '#ffffff', 'letter-spacing="0.8"')}${T(30, 26, '900', 24, '#e3321f')}${T(30, 37, 'maxima', 10, '#e3321f', 'font-style="italic"')}${T(-38, 22, 'HIGH OUTPUT', 6.5, '#e3321f')}</g>`]],
      labRGB: '30,30,30', labK: 0.45,
    },
  };
  globalThis.JH_REEL_NAMES = Object.fromEntries(Object.entries(REEL).map(([k, v]) => [k, v.name]));
  // a window: rounded trapezoid from rIn to rOut, centred on the direction `ang` (degrees clockwise from the top)
  const slot = (cx, cy, w, ang, R) => {
    const t = ang * Math.PI / 180, rot = ([x, y]) => [cx + x * Math.cos(t) - y * Math.sin(t), cy + x * Math.sin(t) + y * Math.cos(t)];
    const P = [[-w.wOut * R / 2, -w.rOut * R], [w.wOut * R / 2, -w.rOut * R], [w.wIn * R / 2, -w.rIn * R], [-w.wIn * R / 2, -w.rIn * R]].map(rot), c = w.c * R;
    let d = '';
    for (let i = 0; i < 4; i++) {
      const p0 = P[(i + 3) % 4], p1 = P[i], p2 = P[(i + 1) % 4];
      const u = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); return [dx / L, dy / L]; };
      const a = u(p1, p0), b = u(p1, p2), s1 = [p1[0] + a[0] * c, p1[1] + a[1] * c], s2 = [p1[0] + b[0] * c, p1[1] + b[1] * c];
      d += `${i === 0 ? 'M' : 'L'}${f(s1[0])} ${f(s1[1])} Q${f(p1[0])} ${f(p1[1])} ${f(s2[0])} ${f(s2[1])} `;
    }
    return d + 'Z ';
  };
  const winAngles = (st, rot) => Array.from({ length: st.win.n }, (_, k) => rot + st.win.a0 + k * 360 / st.win.n);
  function reelMask(st, rot, R) {
    const c = R;
    let d = `M0 ${c} A${c} ${c} 0 1 0 ${2 * c} ${c} A${c} ${c} 0 1 0 0 ${c} Z M${c - hubR} ${c} A${hubR} ${hubR} 0 1 0 ${c + hubR} ${c} A${hubR} ${hubR} 0 1 0 ${c - hubR} ${c} Z `;
    for (const a of winAngles(st, rot)) d += slot(c, c, st.win, a, R);
    return { d };
  }
  // everything about one reel that changes with the skin (also handed to the page so it can swap reels live)
  const R10 = R;
  function skin(styleKey, rl) {
    const st = REEL[styleKey], R = st.size === 14 ? 250 * 14 / 10.5 : R10, { d } = reelMask(st, rl.rot, R), c = R;
    const bandMask = `radial-gradient(circle, transparent ${f(R * 0.375)}px, #000 ${f(R * 0.385)}px, #000 ${f(R * 0.93)}px, transparent ${f(R * 0.96)}px)`;
    const lab = [];
    let labAngles;
    if (st.legacy) {
      const la = rl.labelAt ?? rl.rot;
      const [lx, ly] = [c + R * 0.62 * Math.cos(la * Math.PI / 180), c + R * 0.62 * Math.sin(la * Math.PI / 180)];
      lab.push(`<g transform="rotate(${la + (rl.labelAt != null ? 180 : 0)} ${f(lx)} ${f(ly)})">${st.legacy(rl, lx, ly, la)}</g>`);
      labAngles = [la + 90];
    } else {
      labAngles = st.labels.map(([a]) => rl.rot + a);
      for (const [a, art] of st.labels) { const A = rl.rot + a, r = A * Math.PI / 180; lab.push(`<g transform="translate(${f(c + R * 0.64 * Math.sin(r))} ${f(c - R * 0.64 * Math.cos(r))}) rotate(${f(A)})">${art(R)}</g>`); }
    }
    for (let k = 0; k < 6; k++) { const a = (rl.rot + 30 + k * 60) * Math.PI / 180; lab.push(`<circle cx="${f(c + R * 0.42 * Math.cos(a))}" cy="${f(c + R * 0.42 * Math.sin(a))}" r="3.8" fill="#111"/><circle cx="${f(c + R * 0.42 * Math.cos(a) - 0.8)}" cy="${f(c + R * 0.42 * Math.sin(a) - 0.8)}" r="1.4" fill="#555"/>`); }
    lab.push(`<path d="${d}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2"/>`);
    lab.push(`<circle cx="${c}" cy="${c}" r="${R - 1.5}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="2"/>`);
    lab.push(`<circle cx="${c}" cy="${c}" r="${hubR}" fill="none" stroke="#0d0d0e" stroke-width="8"/>`);
    const layers = (() => { const out = []; let dd = 0, cur = ''; for (const ch of st.face) { if (ch === '(') dd++; if (ch === ')') dd--; if (ch === ',' && dd === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out; })();
    const faceAvg = layers[layers.length - 1], faceLight = layers.filter((l) => !l.startsWith('repeating') && l !== faceAvg).join(', ');
    const base = st.face.replace(/repeating-conic-gradient\([^()]*\),\s*/, '');
    const pr = (x) => f(R * x), band = (col, a, b, fa, fb) => `${col.replace('A', 0)} ${pr(a)}px, ${col.replace('A', fa)} ${pr(a + 0.03)}px, ${col.replace('A', fb)} ${pr(b - 0.03)}px, ${col.replace('A', 0)} ${pr(b)}px`;
    const open = Math.min(0.35, st.win.n * ((st.win.wIn + st.win.wOut) / 2) / (2 * Math.PI * 0.67));   // fraction of the circle that is window
    const ring = [
      `radial-gradient(circle, transparent ${pr(0.36)}px, ${band('rgba(0,0,0,A)', 0.385, 0.455, 0.16, 0.16)}, transparent ${pr(0.46)}px)`,
      `radial-gradient(circle, transparent ${pr(st.win.rIn - 0.03)}px, ${band(st.smearSlot || 'rgba(26,18,12,A)', st.win.rIn - 0.02, st.win.rOut + 0.02, (open * 1.6).toFixed(3), (open * 1.4).toFixed(3))}, transparent ${pr(st.win.rOut + 0.03)}px)`,
      `radial-gradient(circle, transparent ${pr(0.49)}px, ${band(st.smearLabel || `rgba(${st.labRGB || '150,118,62'},A)`, 0.5, 0.78, 0.16 * (st.labK || 0.4) / 0.4, 0.14 * (st.labK || 0.4) / 0.4)}, transparent ${pr(0.79)}px)`,
    ].join(', ');
    return {
      r: R, cx: rl.cx, cy: rl.cy, bandMask, d, face: st.face, edge: st.edge, back: st.back, faceAvg, faceLight, label: lab.join(''),
      lightBg: `radial-gradient(circle, transparent ${f(R * 0.395)}px, rgba(20,20,22,0.16) ${f(R * 0.412)}px, rgba(20,20,22,0.16) ${f(R * 0.428)}px, transparent ${f(R * 0.445)}px), ${faceLight}`,
      slots: winAngles(st, rl.rot).map((a) => f(a)).join(','), slotW: f(((st.win.wIn + st.win.wOut) / 2) / 0.67 * 180 / Math.PI),
      labs: labAngles.map((a) => f(a)).join(','), labW: f(2 * Math.atan(58 / (R * 0.62)) * 180 / Math.PI),
      hole: st.holeRGB || '24,16,11', labc: st.labRGB || '150,120,64', labk: st.labK || 0.4,
      ringBg: `radial-gradient(circle, transparent ${f(hubR - 1)}px, #0d0d0e ${f(hubR)}px, #0d0d0e ${f(hubR + 4)}px, transparent ${f(hubR + 5)}px), ${ring}, radial-gradient(circle, transparent ${f(R - 2.6)}px, rgba(255,255,255,0.45) ${f(R - 1.6)}px, transparent ${f(R - 0.4)}px), ${base}`,
      backBg: `radial-gradient(circle, transparent ${pr(st.win.rIn - 0.03)}px, rgba(0,0,0,0.12) ${pr(st.win.rIn + 0.01)}px, rgba(0,0,0,0.1) ${pr(st.win.rOut - 0.01)}px, transparent ${pr(st.win.rOut + 0.03)}px), ${st.back}`,
    };
  }
  function reel(rl) {
    const key = rl === supply ? 's' : 't';
    const sk = skin(rl.style, rl), d = sk.d;
    // every skin of this reel, so the page can swap tapes without rebuilding the deck
    (globalThis.JH_SKINS = globalThis.JH_SKINS || {})[key] = Object.fromEntries(Object.keys(REEL).map((k) => [k, skin(k, rl)]));
    const { cx, cy } = rl;
    // turntable + spindle
    cylinder(cx, cy, 92, 0, 18, 'linear-gradient(90deg,#2a2725,#55504b 40%,#1e1c1a)', '#3c3835', 3);
    const rotor = () => add(`<div class="jh-rotor" data-reel="${key}" style="${box(`left:0;top:0;width:${DW}px;height:${DD}px;transform-origin:${f(cx)}px ${f(cy)}px`)}">`);
    // back flange (3 layers)
    rotor();
    const flange = (z, layer) => add(`<div class="jh-fl" data-reel="${key}" data-layer="${layer}" style="${box(`left:${f(cx - R)}px;top:${f(cy - R)}px;width:${2 * R}px;height:${2 * R}px;transform:translateZ(${f(z)}px);background:${sk[layer]};clip-path:path(evenodd,'${d}')`)}"></div>`);
    flange(20, 'edge'); flange(21.5, 'edge'); flange(23, 'back');
    add(`<div class="jh-smear jh-smearback" data-reel="${key}" style="${box(`left:${f(cx - R)}px;top:${f(cy - R)}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;opacity:0;transform:translateZ(23.3px);background:${sk.backBg}`)}"></div>`);   // back flange smears too
    add('</div>');
    // hub ring (black plastic) between the flanges
    for (let z = 23; z <= 100; z += 2.5) ring(cx, cy, hubR, hubR - holeR, z, z > 98 ? '#141416' : '#0b0b0c');
    // tape pack: outer wraps are matte black back-coating; top edge shows the wound edges
    const packMask = `-webkit-mask-image:radial-gradient(circle, transparent ${f(hubR - 1)}px, #000 ${f(hubR)}px);mask-image:radial-gradient(circle, transparent ${f(hubR - 1)}px, #000 ${f(hubR)}px)`;
    for (let z = TAPE_Z0; z < TAPE_Z1; z += 2.4) disc(cx, cy, rl.pack, z, 'linear-gradient(90deg,#0b0705,#24160e 35%,#110b07 70%,#080504)', packMask, `jh-pack jh-pack-${key}`);
    disc(cx, cy, rl.pack, TAPE_Z1, `radial-gradient(circle, transparent ${f(hubR - 1)}px, #1a110b ${f(hubR)}px, #2a1b11 ${f(hubR + 8)}px, #21150d ${f(rl.pack * 0.7)}px, #332216 ${f(rl.pack - 3)}px, #110b07 ${f(rl.pack)}px), repeating-radial-gradient(circle, rgba(0,0,0,0.18) 0 1px, transparent 1px 6px)`, '', `jh-pack jh-pack-${key} jh-packtop`);
    rotor();
    // front flange (3 layers, the top one with the finish)
    flange(100, 'edge'); flange(101.5, 'edge'); flange(103, 'face');
    // exposure smear (rotates with the reel): each window and the label drag an arc behind them whose length is the
    // angle the reel turns during one exposure; the client writes the conic gradients from the reel speed
    const bandMask = `-webkit-mask-image:radial-gradient(circle, transparent ${f(R * 0.375)}px, #000 ${f(R * 0.385)}px, #000 ${f(R * 0.93)}px, transparent ${f(R * 0.96)}px);mask-image:radial-gradient(circle, transparent ${f(R * 0.375)}px, #000 ${f(R * 0.385)}px, #000 ${f(R * 0.93)}px, transparent ${f(R * 0.96)}px)`;
    add(`<div class="jh-smear" data-reel="${key}" data-slots="${sk.slots}" data-slotw="${sk.slotW}" data-lab="${sk.labs}" data-labw="${sk.labW}" data-hole="${sk.hole}" data-labc="${sk.labc}" data-labk="${sk.labk}" data-avg="${sk.faceAvg}" style="${box(`left:${f(cx - R)}px;top:${f(cy - R)}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;opacity:0;transform:translateZ(104.6px);background:${sk.faceAvg};${bandMask}`)}"></div>`);
    add(`<div class="jh-lab" data-reel="${key}" style="${box(`left:${f(cx - R)}px;top:${f(cy - R)}px;width:${2 * R}px;height:${2 * R}px;transform:translateZ(103.6px)`)}">${svg(2 * R, 2 * R, sk.label)}</div>`);
    // black hold-down knob on the spindle
    cylinder(cx, cy, 30, 100, 128, 'linear-gradient(90deg,#050505,#3a3a3c 35%,#0b0b0c 70%,#000)', 'radial-gradient(circle at 40% 35%, #4a4a4d, #111 60%)', 2);
    const lobes = [0, 1, 2].map((k) => { const a = (rl.rot + k * 120) * Math.PI / 180; return `<circle cx="${f(44 + 26 * Math.cos(a))}" cy="${f(44 + 26 * Math.sin(a))}" r="13" fill="#0e0e0f"/>`; }).join('');
    add(`<div class="jh-blur" data-reel="${key}" style="${box(`left:${f(cx - 44)}px;top:${f(cy - 44)}px;width:88px;height:88px;border-radius:50%;opacity:0;transform:translateZ(128.8px);background:radial-gradient(circle, #c9ccd0 0 5px, #3a3a3d 7.5px, #17171a 13px, #141416 28px, rgba(14,14,15,0.7) 31px, rgba(14,14,15,0.32) 37px, rgba(14,14,15,0) 41px)`)}"></div>`);
    const staticAfter = `<div class="jh-light" data-reel="${key}" style="${box(`left:${f(cx - R)}px;top:${f(cy - R)}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;opacity:0;transform:translateZ(104.9px);background:radial-gradient(circle, transparent ${f(R * 0.395)}px, rgba(20,20,22,0.16) ${f(R * 0.412)}px, rgba(20,20,22,0.16) ${f(R * 0.428)}px, transparent ${f(R * 0.445)}px), ${sk.faceLight};${bandMask}`)}"></div>`
      + `<div class="jh-blur jh-ring" data-reel="${key}" style="${box(`left:${f(cx - R)}px;top:${f(cy - R)}px;width:${2 * R}px;height:${2 * R}px;border-radius:50%;opacity:0;transform:translateZ(105.2px);-webkit-mask-image:radial-gradient(circle, transparent ${f(hubR + 3)}px, #000 ${f(hubR + 4)}px);mask-image:radial-gradient(circle, transparent ${f(hubR + 3)}px, #000 ${f(hubR + 4)}px);background:${sk.ringBg}`)}"></div>`;
    add(`<div style="${box(`left:${f(cx - 44)}px;top:${f(cy - 44)}px;width:88px;height:88px;transform:translateZ(128.5px)`)}">${svg(88, 88, `${lobes}<circle cx="44" cy="44" r="30" fill="#141416"/><circle cx="38" cy="36" r="18" fill="#fff" opacity="0.08"/><circle cx="44" cy="44" r="7" fill="#c9ccd0"/><circle cx="43" cy="43" r="3" fill="#fff" opacity="0.7"/>`)}</div>`);
    add('</div>');
    add(staticAfter);   // non-rotating blur layers
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
    for (const sa of [1, -1]) for (const sb of [1, -1]) tangent(A, B, sa, sb).forEach(([pa, pb], j) => {
      const s = ((pa[0] - A.cx) * hintA[0] + (pa[1] - A.cy) * hintA[1]) / A.r + ((pb[0] - B.cx) * hintB[0] + (pb[1] - B.cy) * hintB[1]) / B.r;
      if (s > bs) { bs = s; best = [pa, pb]; best.sig = { sa, sb, sg: j === 0 ? 1 : -1 }; }
    });
    return best;
  };
  const N = [0, -1], S = [0, 1], E = [1, 0], W = [-1, 0], SW = [-0.7, 0.7], SE = [0.7, 0.7];
  const sPack = { cx: supply.cx, cy: supply.cy, r: supply.pack }, tPack = { cx: takeup.cx, cy: takeup.cy, r: takeup.pack };
  const chain = [
    [sPack, SW, null], [armL, W, S], [guideL, N, N], [capstan, S, S], [guideR, S, S], [armR, S, E], [tPack, E, null],
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
  const TAPE_BG = 'linear-gradient(180deg,#26180f 0%,#180f09 30%,#1f140c 55%,#0f0905 100%)';
  // live data for the console page: reel centres, pack scale and the two strands that leave the packs
  const sig0 = pickTangent(sPack, armL, SW, W).sig, sig5 = pickTangent(armR, tPack, E, E).sig;
  globalThis[A8 ? 'A8_LIVE' : 'JH_LIVE'] = {
    R, hubR, TAPE_Z0, TAPE_Z1,
    s: { cx: supply.cx, cy: supply.cy, pack: supply.pack, other: armL, sig: sig0, packFirst: true },
    t: { cx: takeup.cx, cy: takeup.cy, pack: takeup.pack, other: armR, sig: sig5, packFirst: false },
  };

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
    lid.push(A8 ? `<defs><linearGradient id="lidg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eceef0"/><stop offset="0.5" stop-color="#d3d6d9"/><stop offset="1" stop-color="#b9bdc1"/></linearGradient></defs>` : `<defs><linearGradient id="lidg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e4e5e7"/><stop offset="0.5" stop-color="#b9bcc0"/><stop offset="1" stop-color="#9da1a6"/></linearGradient></defs>`);
    lid.push(`<rect x="0" y="0" width="${w}" height="${d}" rx="6" fill="#151517"/><rect x="12" y="10" width="${w - 24}" height="${d - 22}" rx="3" fill="url(#lidg)"/>`);
    if (A8) { lid.push(`<rect x="26" y="22" width="${w - 52}" height="${d - 46}" rx="4" fill="none" stroke="#4c5055" stroke-width="2"/>`); for (let k = 0; k < 3; k++) lid.push(`<line x1="${w * 0.42 + k * 18}" y1="20" x2="${w * 0.36 + k * 18}" y2="${d - 20}" stroke="#9a9ea3" stroke-width="1.5"/>`); }
    else for (let k = 0; k < 10; k++) lid.push(`<rect x="${34 + k * 35}" y="28" width="18" height="${d - 60}" rx="3" fill="#5c5f63" opacity="0.65"/>`);
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
      <linearGradient id="fp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d5650"/><stop offset="1" stop-color="#4a443f"/></linearGradient>
      <linearGradient id="bt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0.35"/></linearGradient>
      <radialGradient id="kn" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#55555a"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient>
      <filter id="gl" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="bs" x="-30%" y="-30%" width="160%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>`);
    // panel in deck colour with the light outline that steps back on the right (as on the HJ-24)
    const stepA = w * 0.55, stepB = w * 0.61;
    const outline = `M12 ${d - 10} L12 30 L${stepA} 30 L${stepB} 8 L${w - 12} 8 L${w - 12} ${d - 10} Z`;
    s.push(`<rect x="0" y="0" width="${w}" height="${d}" rx="6" fill="url(#fp)"/>`);
    s.push(`<path d="${outline}" fill="#544d47" stroke="#000" stroke-opacity="0.35" stroke-width="5" transform="translate(1 2)"/>`);
    s.push(`<path d="${outline}" fill="#544d47" stroke="#e6e1d8" stroke-width="3" stroke-linejoin="round"/>`);
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
    btn(492, ty, 40, 30, '#3fc9a0', false, '◀', 'REV PLAY');
    btn(546, ty, 40, 30, '#3fc9a0', true, '▶', 'PLAY');
    btn(610, ty - 4, 44, 30, '#e0322a', true, '●', 'REC', true);
    // stepped-back section: blue, orange, then speed / EQ and the app's tape-character trims
    const ry = 22;
    btn(stepB + 22, ry, 36, 28, '#3f7fd6', false, '▲', 'LIFT');
    btn(stepB + 72, ry, 36, 28, '#ea8a2a', false, '✂', 'EDIT');
    btn(stepB + 124, ry + 2, 32, 24, '#efece4', false, '7½', ''); btn(stepB + 160, ry + 2, 32, 24, '#efece4', false, '15', ''); btn(stepB + 196, ry + 2, 32, 24, '#ffb02e', true, '30', ''); s.push(txt(stepB + 176, ry + 44, 'IPS', 7.5, '#e9e4da'));
    btn(stepB + 244, ry + 2, 32, 24, '#fff6e0', true, '', ''); s.push(txt(stepB + 260, ry + 18, 'AES', 8, '#1a1208'));
    btn(stepB + 280, ry + 2, 32, 24, '#efece4', false, '', ''); s.push(txt(stepB + 296, ry + 18, 'NAB', 8, '#1a1208'));
    s.push(txt(stepB + 278, ry + 44, 'EQ', 7.5, '#e9e4da'));
    knobS(stepB + 342, ry + 14, 10, 40, 'SAT'); knobS(stepB + 378, ry + 14, 10, -60, 'W/F'); knobS(stepB + 414, ry + 14, 10, -90, 'HISS');
    btn(stepB + 436, ry + 2, 40, 24, '#2f8f5a', false, '▤', 'ELECTRONICS');   // opens the audio electronics cards
    add(`<div style="${box(`left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform-origin:50% 100%;transform:translateZ(${zFront}px) rotateX(${slope}deg)`)}">${svg(w, d, s.join(''))}</div>`);
    const zBack = zFront + d * Math.sin(-slope * Math.PI / 180);
    front(x, y + d, w, 0, zFront, 'linear-gradient(180deg,#5d5650,#4a443f)');
    side(x, y, d, 0, zBack, 'linear-gradient(180deg,#5d5650,#4a443f)');
    side(x + w, y, d, 0, zBack, 'linear-gradient(180deg,#5d5650,#4a443f)');
  }

  // ---------- A827 front panel: tape timer, transport keys with lamps, speed keys, big shuttle wheel ----------
  function a827Strip() {
    // A827 front strip as photographed: brushed silver, black STUDER plate, "A 827 MULTICHANNEL RECORDER",
    // light-grey keys < > PLAY STOP REC EDIT, red LED counter, two rows of small function keys / lamps, green LCD
    const { x, y, w, d, zFront, slope } = STRIP;
    const s = [];
    s.push(`<defs>
      <linearGradient id="fp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e4e6"/><stop offset="1" stop-color="#b8bbbf"/></linearGradient>
      <linearGradient id="bt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0.25"/></linearGradient>
      <filter id="gl" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="bs" x="-30%" y="-30%" width="160%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>`);
    s.push(`<rect x="0" y="0" width="${w}" height="${d}" rx="4" fill="url(#fp)"/><rect x="0" y="0" width="${w}" height="2" fill="#fff" opacity="0.8"/>`);
    const key = (name, bx, by, bw, bh, on, glyph, gcol = '#1a1a1a', gsize = 13) => {
      s.push(`<rect x="${bx + 1}" y="${by + 3}" width="${bw}" height="${bh}" rx="2" fill="#000" opacity="0.45" filter="url(#bs)"/>`);
      s.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="#e9eaec" stroke="#8d9095" stroke-width="1"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="url(#bt)"/>`);
      s.push(`<g id="lk-${name}" opacity="0"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="${on}" filter="url(#gl)"/><rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="url(#bt)"/></g>`);
      if (glyph) s.push(txt(bx + bw / 2, by + bh / 2 + gsize * 0.36, glyph, gsize, gcol, 'middle', 900));
    };
    // STUDER plate and model line
    s.push(`<rect x="28" y="10" width="150" height="30" rx="2" fill="#1c1d20"/>`); s.push(txt(103, 31, 'STAUDER', 18, '#eceef0', 'middle', 900, 'letter-spacing="4"'));
    s.push(txt(28, 56, 'A 827   MULTICHANNEL RECORDER', 9, '#2a2c30', 'start', 800, 'letter-spacing="1.2"'));
    // transport keys
    [['rew', '◁'], ['ff', '▷'], ['play', 'PLAY'], ['stop', 'STOP'], ['rec', 'REC'], ['edit', 'EDIT']].forEach(([n, g], i) => key(n, 28 + i * 58, 64, 52, 30, n === 'rec' ? '#ff5a3c' : n === 'play' ? '#7dff9a' : '#fff4d6', g, n === 'rec' ? '#c8261b' : '#1a1a1a', g.length > 1 ? 12 : 16));
    // red LED counter
    s.push(`<rect x="420" y="40" width="190" height="44" rx="3" fill="#1a0806"/><rect x="420" y="40" width="190" height="14" rx="3" fill="#fff" opacity="0.05"/>`);
    s.push(`<text id="tctr" x="515" y="74" font-family="'JetBrains Mono', monospace" font-size="30" font-weight="800" fill="#ff3b2f" text-anchor="middle" filter="url(#gl)">00:03:42</text>`);
    // two rows of small function keys with lamps (speed, vari, lift and locator functions)
    const smk = (name, bx, by, lab, lamp = '#ff3b2f') => { s.push(`<rect x="${bx}" y="${by}" width="34" height="11" rx="1.5" fill="#2a2b2e"/>`); s.push(`<g id="lk-${name}" opacity="0"><rect x="${bx}" y="${by}" width="34" height="11" rx="1.5" fill="${lamp}" filter="url(#gl)"/></g>`); if (lab) s.push(txt(bx + 17, by + 22, lab, 7, '#2a2c30', 'middle', 800)); };
    [['ips7.5', '7½'], ['ips15', '15'], ['ips30', '30'], ['vari', 'VAR'], ['lift', 'LIFT'], ['', ''], ['elec', 'ELEC']].forEach(([n, l], i) => smk(n || `fx${i}`, 640 + i * 42, 34, l, n.startsWith('ips') || n === 'vari' ? '#59f07a' : '#ff3b2f'));
    for (let i = 0; i < 7; i++) smk(`fy${i}`, 640 + i * 42, 66, ['LOC', 'STORE', 'ZERO', 'RTZ', 'AUTO', 'SAFE', 'MON'][i]);
    // green LCD
    s.push(`<rect x="${w - 170}" y="34" width="130" height="40" rx="3" fill="#13180e"/><rect x="${w - 164}" y="39" width="118" height="30" rx="2" fill="#8ccf3a"/><rect x="${w - 164}" y="39" width="118" height="10" rx="2" fill="#fff" opacity="0.2"/>`);
    s.push(`<text id="a8-lcd" x="${w - 105}" y="60" font-family="'JetBrains Mono', monospace" font-size="13" font-weight="700" fill="#22300f" text-anchor="middle">30 IPS  NAB</text>`);
    add(`<div style="${box(`left:${x}px;top:${y}px;width:${w}px;height:${d}px;transform-origin:50% 100%;transform:translateZ(${zFront}px) rotateX(${slope}deg)`)}">${svg(w, d, s.join(''))}</div>`);
    const zBack = zFront + d * Math.sin(-slope * Math.PI / 180);
    front(x, y + d, w, 0, zFront, 'linear-gradient(180deg,#c9ccd0,#9a9ea3)');
    side(x, y, d, 0, zBack, 'linear-gradient(180deg,#c9ccd0,#9a9ea3)');
    side(x + w, y, d, 0, zBack, 'linear-gradient(180deg,#c9ccd0,#9a9ea3)');
  }

  // ---------- draw, roughly back to front (preserve-3d sorts by depth anyway) ----------
  reel(supply);
  reel(takeup);
  headAssembly();
  const BLK = A8 ? 'linear-gradient(90deg,#4a4e54,#c9ccd1 32%,#80858b 62%,#3a3d42)' : 'linear-gradient(90deg,#060606,#3a3a3d 30%,#141416 62%,#040404)';
  const BLK_TOP = A8 ? 'radial-gradient(circle at 40% 35%, #eceef0, #8a8f95 70%)' : 'radial-gradient(circle at 40% 35%, #3a3a3d, #0d0d0e 70%)';
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
  if (A8) cylinder(pinch.cx, pinch.cy, pinch.r, 10, 150, 'linear-gradient(90deg,#050505,#3a3a3d 32%,#141416 62%,#030303)', 'radial-gradient(circle at 40% 35%, #c9ccd1, #3a3d42 70%)');
  else cylinder(pinch.cx, pinch.cy, pinch.r, 10, 150, 'linear-gradient(90deg,#8f8672,#f3ecdb 32%,#d6ccb4 62%,#8a816c)', 'radial-gradient(circle at 40% 35%, #fffaf0, #cfc4ab 70%)');
  // tension arms: pivot boss, black arm, chrome roller with flanges spanning the tape
  const CHR = 'linear-gradient(90deg,#6d7178,#f7f8f9 35%,#8e9298 65%,#4a4d52)';
  const CHR_TOP = 'radial-gradient(circle at 40% 35%, #fafafa, #9ea2a8 60%)';
  for (const a of [armL, armR]) {
    cylinder(a.px, a.py, 30, 0, 40, BLK, BLK_TOP, 2);
    disc(a.px, a.py, 12, 40.5, CHR_TOP);
    const L = Math.hypot(a.cx - a.px, a.cy - a.py), ang = Math.atan2(a.cy - a.py, a.cx - a.px) * 180 / Math.PI;
    plate(a.px, a.py - 11, L, 22, 34, 'linear-gradient(180deg,#2a2a2d,#0c0c0d)', `transform-origin:0 50%;transform:translateZ(34px) rotateZ(${ang.toFixed(2)}deg)`);
    cylinder(a.cx, a.cy, 6, 0, TAPE_Z0, CHR, CHR_TOP, 3);
    cylinder(a.cx, a.cy, a.r + 9, TAPE_Z0 - 6, TAPE_Z0 - 2, CHR, CHR_TOP, 2);
    cylinder(a.cx, a.cy, a.r, TAPE_Z0 - 2, TAPE_Z1 + 2, CHR, CHR_TOP, 2.2);
    cylinder(a.cx, a.cy, a.r + 9, TAPE_Z1 + 2, TAPE_Z1 + 6, CHR, CHR_TOP, 2);
  }
  // right take-up guide: chunky flared black base, tall ribbed black roller (tape wraps its front and right side)
  cylinder(guideR.cx, guideR.cy, guideR.r + 20, 0, 8, BLK, '#1a1a1c', 2);
  cylinder(guideR.cx, guideR.cy, guideR.r + 12, 8, 18, BLK, '#161618', 2);
  cylinder(guideR.cx, guideR.cy, guideR.r + 6, 18, 26, BLK, '#141416', 2);
  ribbed(guideR, 26, 156, guideR.r);
  // the tape itself
  tapeSegs.forEach(([[x1, y1], [x2, y2]], i) => wall(x1, y1, x2, y2, TAPE_Z0, TAPE_Z1, TAPE_BG, i === 0 ? 'jh-strand-s' : i === chain.length - 2 ? 'jh-strand-t' : ''));
  if (A8) a827Strip(); else transportStrip();
  add(`</div>`);
  add(`</div>`);

  // ---------- cabinet front (vertical, faces the operator) ----------
  const cab = [];
  const LIPH = 44, WOODY = FRONT + LIPH;
  cab.push(`<defs>
    ${A8 ? '<linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6e8ea"/><stop offset="0.15" stop-color="#cfd2d5"/><stop offset="1" stop-color="#a3a7ab"/></linearGradient>' : '<linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d5650"/><stop offset="0.15" stop-color="#4a443f"/><stop offset="1" stop-color="#36312d"/></linearGradient>'}
    <linearGradient id="lam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e482b"/><stop offset="0.35" stop-color="#9a6b42"/><stop offset="0.7" stop-color="#875a36"/><stop offset="1" stop-color="#5e3d24"/></linearGradient>
    <filter id="grainV"><feTurbulence type="fractalNoise" baseFrequency="0.0025 0.21" numOctaves="5" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.035  0 0 0 0 0.0  0 0 0 2.4 -0.85"/><feComposite in2="SourceGraphic" operator="in"/></filter>
    <linearGradient id="shadeTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  </defs>`);
  cab.push(`<rect x="${CI}" y="${FRONT - 2}" width="${TW - 2 * CI}" height="${LIPH + 2}" fill="url(#lip)"/><rect x="${CI}" y="${FRONT - 2}" width="${TW - 2 * CI}" height="1.5" fill="#fff" opacity="0.25"/>`);
  if (A8) {   // maker's badge (the HJ-24 carries none)
    cab.push(`<rect x="${CI + 44}" y="${FRONT + 12}" width="96" height="22" rx="2" fill="#0c0c0d"/><rect x="${CI + 44}" y="${FRONT + 12}" width="96" height="2" fill="#fff" opacity="0.15"/>`);
    cab.push(txt(CI + 92, FRONT + 29, 'STAUDER', 13, '#e3e5e8', 'middle', 900, 'letter-spacing="3"'));
  }
  // drawer front: woodgrain laminate inside a dark frame (A827: Studer-grey panel), small model tag at right
  if (A8) {
    cab.push(`<rect x="${CI}" y="${WOODY}" width="${TW - 2 * CI}" height="${Math.max(0, TH - WOODY)}" fill="#2c2d30"/><rect x="${CI + 30}" y="${WOODY + 8}" width="${TW - 2 * CI - 60}" height="${Math.max(0, TH - WOODY - 8)}" fill="#3a3c40"/><rect x="${CI + 30}" y="${WOODY + 8}" width="${TW - 2 * CI - 60}" height="2" fill="#fff" opacity="0.12"/><rect x="${CI}" y="${WOODY}" width="${TW - 2 * CI}" height="6" fill="#000" opacity="0.35"/>`);
    cab.push(`<rect x="${TW - CI - 118}" y="${TH - 32}" width="62" height="22" rx="2" fill="#2a2c30"/>`);
    cab.push(txt(TW - CI - 87, TH - 17, 'A827', 10, '#e6e7e9', 'middle', 800, 'letter-spacing="1"'));
  } else {
  cab.push(`<rect x="${CI}" y="${WOODY}" width="${TW - 2 * CI}" height="${Math.max(0, TH - WOODY)}" fill="#3a3633"/>`);
  cab.push(`<rect x="${CI + 22}" y="${WOODY + 14}" width="${TW - 2 * CI - 44}" height="${Math.max(0, TH - WOODY - 14)}" fill="url(#lam)"/>`);
  cab.push(`<rect x="${CI + 22}" y="${WOODY + 14}" width="${TW - 2 * CI - 44}" height="${Math.max(0, TH - WOODY - 14)}" fill="#000" filter="url(#grainV)"/>`);
  cab.push(`<rect x="${CI + 22}" y="${WOODY + 14}" width="${TW - 2 * CI - 44}" height="${Math.max(0, TH - WOODY - 14)}" fill="none" stroke="#1e1b19" stroke-width="3"/>`);
  cab.push(`<rect x="${CI + 22}" y="${WOODY + 14}" width="${TW - 2 * CI - 44}" height="36" fill="url(#shadeTop)"/>`);
  cab.push(`<rect x="${TW - CI - 118}" y="${TH - 32}" width="62" height="22" rx="2" fill="#2a2725"/>`);
  cab.push(txt(TW - CI - 87, TH - 17, 'HJ-24', 10, '#d9d3c7', 'middle', 800, 'letter-spacing="1"'));
  }
  // cabinet side frames
  cab.push(`<rect x="${CI}" y="${FRONT - 2}" width="22" height="${TH - FRONT + 2}" fill="${A8 ? '#7a4a28' : '#3a3633'}"/><rect x="${TW - CI - 22}" y="${FRONT - 2}" width="22" height="${TH - FRONT + 2}" fill="${A8 ? '#6d4122' : '#33302d'}"/>`);

  let html = `<div id="jh24" style="position:absolute;left:${TX}px;top:${TY}px;width:${TW}px;height:${TH}px;overflow:hidden;perspective:1650px;perspective-origin:50% -20%;">
  ${svg(TW, TH, cab.join(''))}
  ${out.join('\n')}
</div>`;
  if (A8) {   // second machine on the page: its own ids and classes
    html = html.replace('<div id="jh24"', '<div id="a827"').replace(/jh-/g, 'a8-');
    const ids = new Set([...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]).filter((id) => !id.startsWith('a8') && id !== 'a827'));
    for (const id of ids) html = html.split(`id="${id}"`).join(`id="a8-${id}"`).split(`url(#${id})`).join(`url(#a8-${id})`);
  }
  return html;
};
