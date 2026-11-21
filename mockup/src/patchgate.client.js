  // ---------------- rack units work only when patched in (the patchbay) ----------------
  // Each unit's engine is off while nothing is patched to it (the audio engine skips it); its panel stays powered (power
  // lights on) but a veil blocks its controls and says so. Inserts need both halves (send in, return out); the 224X its
  // send or a return; the S900 its input or its output.
  const GATE = [
    ['#ov-c160', 0, ['160X A'], true], ['#ov-c160', 1, ['160X B'], true],
    ['#ov-im90', 0, ['IM90 A', 'IM90 B'], true],
    ['#ov-spx', 0, ['SPX A L', 'SPX A R'], true], ['#ov-spx', 1, ['SPX B L', 'SPX B R'], true],
    ['#ov-h949', 0, ['H949'], true], ['#ov-rmx', 0, ['RMX16'], true],
    ['#ov-pcm', 0, ['PCM41 A'], true], ['#ov-pcm', 1, ['PCM41 B'], true], ['#ov-pcm', 2, ['PCM42 A'], true], ['#ov-pcm', 3, ['PCM42 B'], true],
    ['#ov-s900', 0, ['S900'], false], ['#ov-224', 0, ['224 L', '224 R'], false],
  ].map(([ov, i, jacks, insert]) => {
    const o = document.querySelector(ov), svg = o && o.querySelectorAll(ov === '#ov-224' ? 'svg' : '.ovsync > svg, .pg-wrap > svg')[i];
    if (!svg) return null;
    const wrap = document.createElement('div'); wrap.className = 'pg-wrap'; svg.parentNode.insertBefore(wrap, svg); wrap.appendChild(svg);
    const veil = document.createElement('div'); veil.className = 'pg-veil'; veil.innerHTML = `<span>NOT PATCHED · ${jacks[0].replace(/ [LR]$/, '')} is off — patch it in at the PATCHBAY</span>`; wrap.appendChild(veil);
    veil.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); });
    return { jacks, insert, veil, on: null };
  }).filter(Boolean);
  function patchGate() {
    for (const G of GATE) {
      const ins = patches.some((pc) => G.jacks.some((j) => pc.b === 'fxin:' + j || pc.b === `mgin:${j} IN`)), outs = patches.some((pc) => G.jacks.some((j) => pc.a === 'fxout:' + j || pc.a.startsWith(`mgo:${j} `)) && /^(lin|mcin|chin|iret|tin|fxin|mgin|ifout):/.test(pc.b));
      const on = G.insert ? ins && outs : ins || outs;
      if (on !== G.on) { G.on = on; G.veil.hidden = on; }
    }
  }
  patchGate();
