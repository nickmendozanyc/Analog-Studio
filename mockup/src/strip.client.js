  // ---------------- channel section pop-ups (both consoles) ----------------
  // Click a section on any channel strip (input, bussing, dynamics, EQ, sends) to open it full size with working controls.
  // Values are kept per console and channel (localStorage 'as-strip-v1'). EQ shows its live frequency response,
  // dynamics its live transfer curve.
  const STRIP_SVG = document.getElementById('stripSvg');
  const NAMES = ['KICK', 'SNR TOP', 'SNR BTM', 'HAT', 'TOM 1', 'TOM 2', 'FL TOM', 'OH L', 'OH R', 'ROOM L', 'ROOM R', 'BASS DI', 'BASS AMP', 'GTR 1', 'GTR 2', 'AC GTR', 'KEYS L', 'KEYS R', 'ORGAN', 'LEAD VOX', 'BGV 1', 'BGV 2', 'PERC', 'SMPTE', '224 L', '224 R', 'SPX L', 'SPX R', 'PCM42 A', 'PCM42 B', 'LIVE 1', 'TALK'];
  const K = (id, label, min, max, def, unit, col, o = {}) => ({ t: 'knob', id, label, min, max, def, unit, col, ...o });
  const B = (id, label, def = false, col = 'white', o = {}) => ({ t: 'key', id, label, def, col, ...o });
  const GAP = { t: 'gap' };
  // ---- section specs (rows of controls) ----
  const SPEC = {
    cmi: {
      name: 'CMI HJ-632', theme: { panel: '#2b2a28', ink: '#ece6da', gold: '#d8c27c', knob: 'cmi' },
      input: { title: 'INPUT', rows: [
        [B('src_in', 'INPUT', false, 'amber', { radio: 'src' }), B('src_tape', 'TAPE', true, 'amber', { radio: 'src' }), B('phase', 'Ø', false), B('dump', 'DUMP', false, 'red')],
        [K('trim', 'TRIM', -20, 20, 0, 'dB', '#e3452f'), K('direct', 'DIRECT OUT', -60, 10, -60, 'dB', '#1a1a1c', { inf: true })],
      ], note: 'Line inputs come from the interface (mic preamps are outboard). INPUT monitors the input, TAPE the tape return. DUMP sends the channel to the 2-mix.' },
      bus: { title: 'BUS ASSIGN', rows: [
        [{ t: 'bus24', id: 'bus' }],
        [B('panbus', 'PAN', true, 'amber'), K('oddeven', 'ODD · EVEN', -1, 1, 0, 'pan', '#e3452f'), K('buslvl', 'BUS LVL', -60, 10, 0, 'dB', '#1d1d1f', { inf: true })],
      ], note: 'Press any of the 24 bus keys. With PAN in, ODD · EVEN pans between odd and even buses. BUS LVL sets the level into the buses (0 dB normal).' },
      eq: { title: 'EQUALIZER', graph: 'eq', rows: [
        [K('hf_f', 'HI FREQ', 4600, 16000, 10000, 'Hz', '#3f8fd9', { log: true }), K('hf_g', 'HI GAIN', -14, 14, 0, 'dB', '#3f8fd9')],
        [K('mf_f', 'MID FREQ', 180, 10000, 1500, 'Hz', '#7fa392', { log: true }), K('mf_g', 'MID GAIN', -14, 14, 0, 'dB', '#7fa392')],
        [K('lf_f', 'LOW FREQ', 30, 250, 100, 'Hz', '#e3452f', { log: true }), K('lf_g', 'LOW GAIN', -14, 14, 0, 'dB', '#e3452f')],
        [B('eq_in', 'EQ IN', true, 'green'), B('hpf', 'HPF 45', false), B('lpf', 'LPF 16k', false), B('chn', 'CHN', false)],
      ], note: 'Three bands (HI 4.6–16 kHz, MID 180 Hz–10 kHz, LOW 30–250 Hz, ±14 dB), 18 dB/oct HPF at 45 Hz and LPF at 16 kHz. CHN moves the EQ to the channel path.' },
      sends: { title: 'SENDS', rows: [
        [K('s1', 'SEND 1', -60, 3, -60, 'dB', '#ecd03a', { inf: true }), K('s2', 'SEND 2', -60, 3, -60, 'dB', '#ecd03a', { inf: true }), B('s12pre', 'PRE', false), B('s12wet', 'WET', false)],
        [K('s34p', '3-4 PAN', -1, 1, 0, 'pan', '#3f8fd9', { lr: true }), K('s34', 'SEND 3-4', -60, 3, -60, 'dB', '#3f8fd9', { inf: true }), B('s34pre', 'PRE', false), B('s34cue', 'FX / CUE', false, 'amber')],
        [K('s56p', '5-6 PAN', -1, 1, 0, 'pan', '#e3452f', { lr: true }), K('s56', 'SEND 5-6', -60, 3, -60, 'dB', '#e3452f', { inf: true }), B('s56pre', 'PRE', true), B('s562mix', '2MIX', false, 'amber')],
      ], note: '1 and 2 are mono effects sends (WET returns them). 3-4 is a stereo effects send that FX / CUE switches to Cue 1. 5-6 is Cue 2, or the 2-MIX.' },
    },
    sls: {
      name: 'SLS 4000 G', theme: { panel: '#8f9695', ink: '#111213', gold: '#2a2c2e', knob: 'sls' },
      input: { title: 'INPUT', rows: [
        [K('line', 'LINE', -20, 20, 0, 'dB', '#cfd0cb'), B('flip', 'FLIP', false, 'amber'), B('subgp', 'SUB GP', false), B('phase', 'Ø', false)],
        [K('gtrim', 'GROUP TRIM', -20, 10, 0, 'dB', '#cfd0cb'), B('float', 'FLOAT', false), B('direct', 'DIRECT', false)],
      ], note: 'LINE trims the input from the interface. FLIP swaps the large and small fader paths. SUB GP feeds the group back into the channel. FLOAT and DIRECT set the group output.' },
      bus: { title: 'ROUTING', rows: [
        [{ t: 'bus24', id: 'bus' }],
        [B('q_lf', 'LF', false, 'amber'), B('q_rf', 'RF', false, 'amber'), B('q_lb', 'LB', false, 'amber'), B('q_rb', 'RB', false, 'amber')],
        [B('panbus', 'PAN', true, 'amber'), K('rpan', 'ODD · EVEN', -1, 1, 0, 'pan', '#cfd0cb')],
      ], note: '24 groups (the 24 multitrack buses) and the quad bus. With PAN in, the routing pan moves between odd and even groups.' },
      dyn: { title: 'DYNAMICS', graph: 'dyn', rows: [
        [K('c_ratio', 'RATIO', 1, 20, 1, ':1', '#cfd0cb', { log: true }), K('c_thr', 'THRESHOLD', -20, 10, 10, 'dB', '#cfd0cb'), K('c_rel', 'RELEASE', 0.1, 4, 0.4, 's', '#cfd0cb', { log: true }), B('c_fatk', 'F.ATK', false), B('link', 'LINK', false)],
        [K('g_thr', 'GATE THRESH', -30, 10, -30, 'dB', '#3f9a58'), K('g_rng', 'RANGE', 0, 40, 0, 'dB', '#3f9a58'), K('g_rel', 'RELEASE', 0.1, 4, 0.2, 's', '#3f9a58', { log: true }), B('g_ex', 'EXPAND', true, 'white', { radio: 'gmode' }), B('g_gate', 'GATE', false, 'white', { radio: 'gmode' })],
        [B('dyn_in', 'DYN IN', false, 'green'), B('cmp_in', 'CMP IN', true, 'amber'), B('exp_in', 'EXP IN', true, 'red')],
      ], note: 'Compressor / limiter and expander / gate. The curve shows output against input level.' },
      eq: { title: 'FILTERS · EQUALISER', graph: 'eq', rows: [
        [K('hpf', 'HPF', 0, 350, 0, 'Hz', '#cfd0cb', { outAt: 'min' }), K('lpf', 'LPF', 3000, 12001, 12001, 'Hz', '#cfd0cb', { outAt: 'max', log: true }), B('fdyn', 'DYN SC', false), B('prefilt', 'PRE DYN', false)],
        [K('hf_g', 'HF', -15, 15, 0, 'dB', '#c8262b'), K('hf_f', 'HF FREQ', 1500, 16000, 8000, 'Hz', '#c8262b', { log: true }), B('hf_bell', 'BELL', false)],
        [K('hm_g', 'HMF', -15, 15, 0, 'dB', '#1f6e3d'), K('hm_f', 'HMF FREQ', 600, 7000, 2500, 'Hz', '#1f6e3d', { log: true }), K('hm_q', 'HMF Q', 0.5, 3, 1, 'Q', '#1f6e3d')],
        [K('lm_g', 'LMF', -15, 15, 0, 'dB', '#1f6dac'), K('lm_f', 'LMF FREQ', 200, 2500, 600, 'Hz', '#1f6dac', { log: true }), K('lm_q', 'LMF Q', 0.5, 3, 1, 'Q', '#1f6dac')],
        [K('lf_g', 'LF', -15, 15, 0, 'dB', '#8b4a28'), K('lf_f', 'LF FREQ', 30, 450, 100, 'Hz', '#8b4a28', { log: true }), B('lf_bell', 'BELL', false), B('eq_in', 'EQ IN', true, 'green'), B('eq_blk', 'BLK / BRN', false, 'amber')],
      ], note: 'Filters 18 dB/oct high pass (20–350 Hz) and 12 dB/oct low pass (12–3 kHz). HF and LF are shelves, or bells with BELL. HMF and LMF have variable Q.' },
      sends: { title: 'CUES', rows: [
        [K('st', 'STEREO CUE', -60, 3, -60, 'dB', '#e2b43a', { inf: true }), K('stp', 'ST PAN', -1, 1, 0, 'pan', '#e2b43a', { lr: true }), B('st_pre', 'PRE', false), B('st_sm', 'SM FDR', false)],
        [K('c1', 'CUE 1', -60, 3, -60, 'dB', '#cfd0cb', { inf: true }), B('c1_pre', 'PRE', false), B('c1_sm', 'SM FDR', false), K('c2', 'CUE 2', -60, 3, -60, 'dB', '#cfd0cb', { inf: true }), B('c2_pre', 'PRE', false), B('c2_sm', 'SM FDR', false)],
        [K('c3', 'CUE 3', -60, 3, -60, 'dB', '#cfd0cb', { inf: true }), B('c3_pre', 'PRE', false), B('c3_sm', 'SM FDR', false), K('c4', 'CUE 4', -60, 3, -60, 'dB', '#cfd0cb', { inf: true }), B('c4_pre', 'PRE', false), B('c4_sm', 'SM FDR', false)],
      ], note: 'Stereo cue with pan, and cues 1–4. PRE takes the send before the fader; SM FDR takes it from the small-fader path.' },
    },
  };
  const ORDER = { cmi: ['input', 'bus', 'eq', 'sends'], sls: ['input', 'bus', 'dyn', 'eq', 'sends'] };
  let ST = {}; try { ST = JSON.parse(localStorage.getItem('as-strip-v1') || '{}'); } catch (e) {}
  const saveST = () => { try { localStorage.setItem('as-strip-v1', JSON.stringify(ST)); } catch (e) {} };
  function chState(con, ch) {
    const key = `${con}${ch}`;
    if (!ST[key]) {
      const s = {};
      for (const sec of ORDER[con]) for (const row of SPEC[con][sec].rows) for (const c of row) if (c.id && c.t !== 'bus24') s[c.id] = c.def;
      // bus defaults match the console drawing: SLS track n -> group n; CMI drums 1-2, bass 3-4, guitars 5-6, keys 7-8
      s.bus = con === 'sls' ? (ch < 24 ? [ch + 1] : []) : (ch < 11 ? [1, 2] : ch < 13 ? [3, 4] : ch < 19 ? [5, 6] : ch < 23 ? [7, 8] : []);
      ST[key] = s;
    }
    return ST[key];
  }
  const SP = { con: 'cmi', ch: 0, sec: 'eq' };
  // ---- value helpers ----
  const toFrac = (c, v) => c.log ? Math.log(v / c.min) / Math.log(c.max / c.min) : (v - c.min) / (c.max - c.min);
  const fromFrac = (c, f) => { f = Math.max(0, Math.min(1, f)); const v = c.log ? c.min * Math.pow(c.max / c.min, f) : c.min + f * (c.max - c.min); return c.unit === 'Q' || c.unit === 's' || c.unit === ':1' ? Math.round(v * 100) / 100 : c.unit === 'Hz' ? Math.round(v) : Math.round(v * 10) / 10; };
  const fmtV = (c, v) => {
    if (c.outAt === 'min' && v <= c.min + 1e-6) return 'OUT';
    if (c.outAt === 'max' && v >= c.max - 1e-6) return 'OUT';
    if (c.inf && v <= c.min + 0.01) return '−∞';
    if (c.unit === 'Hz') return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 1 : 2)} kHz` : `${Math.round(v)} Hz`;
    if (c.unit === 'dB') return `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`;
    if (c.unit === 'pan') return Math.abs(v) < 0.02 ? 'C' : v < 0 ? `${c.lr ? 'L' : 'ODD'} ${Math.round(-v * 100)}` : `${c.lr ? 'R' : 'EVEN'} ${Math.round(v * 100)}`;
    if (c.unit === ':1') return v >= 19.9 ? '∞ : 1' : `${v.toFixed(1)} : 1`;
    if (c.unit === 's') return `${v.toFixed(2)} s`;
    if (c.unit === 'Q') return `Q ${v.toFixed(2)}`;
    return String(v);
  };
  // ---- EQ response (RBJ biquads, analysed at 48 kHz) ----
  const FS = 48000;
  function bq(type, f0, Q, g) {
    const A = Math.pow(10, g / 40), w = 2 * Math.PI * f0 / FS, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * Q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
    else if (type === 'low' || type === 'high') {
      const s = type === 'low' ? 1 : -1, sq = 2 * Math.sqrt(A) * al;
      b0 = A * ((A + 1) - s * (A - 1) * cs + sq); b1 = s * 2 * A * ((A - 1) - s * (A + 1) * cs); b2 = A * ((A + 1) - s * (A - 1) * cs - sq);
      a0 = (A + 1) + s * (A - 1) * cs + sq; a1 = -s * 2 * ((A - 1) + s * (A + 1) * cs); a2 = (A + 1) + s * (A - 1) * cs - sq;
    } else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
  }
  function bqDb([b0, b1, b2, a1, a2], f) {
    const w = 2 * Math.PI * f / FS, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
    const nr = b0 + b1 * c1 + b2 * c2, ni = -(b1 * s1 + b2 * s2), dr = 1 + a1 * c1 + a2 * c2, di = -(a1 * s1 + a2 * s2);
    return 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di));
  }
  const fo1 = (f, fc, hp) => 10 * Math.log10(hp ? (f * f) / (f * f + fc * fc) : (fc * fc) / (f * f + fc * fc));   // 1st-order section
  function eqCurve(con, s) {
    const sec = [];
    if (con === 'cmi') {
      if (s.eq_in) sec.push(bq('peak', s.hf_f, 0.7, s.hf_g), bq('peak', s.mf_f, 1.2, s.mf_g), bq('peak', s.lf_f, 0.7, s.lf_g));
      return (f) => sec.reduce((a, c) => a + bqDb(c, f), 0) + (s.hpf ? fo1(f, 45, true) + bqDb(bq('hp', 45, 1, 0), f) : 0) + (s.lpf ? fo1(f, 16000, false) + bqDb(bq('lp', 16000, 1, 0), f) : 0);
    }
    if (s.eq_in) sec.push(bq(s.hf_bell ? 'peak' : 'high', s.hf_f, s.hf_bell ? 0.9 : 0.707, s.hf_g), bq('peak', s.hm_f, s.hm_q, s.hm_g), bq('peak', s.lm_f, s.lm_q, s.lm_g), bq(s.lf_bell ? 'peak' : 'low', s.lf_f, s.lf_bell ? 0.9 : 0.707, s.lf_g));
    const hpOn = s.hpf > 1, lpOn = s.lpf < 12000;
    return (f) => sec.reduce((a, c) => a + bqDb(c, f), 0) + (hpOn ? fo1(f, Math.max(20, s.hpf), true) + bqDb(bq('hp', Math.max(20, s.hpf), 1, 0), f) : 0) + (lpOn ? bqDb(bq('lp', s.lpf, 0.707, 0), f) : 0);
  }
  // ---- drawing ----
  const esc2 = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const T = (x, y, t, size, fill, anchor = 'middle', w = 800, extra = '') => `<text x="${x}" y="${y}" font-family="Archivo, Arial, sans-serif" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc2(t)}</text>`;
  const LITC = { white: '#fff6e0', amber: '#ffb02e', green: '#59f07a', red: '#ff3b2f' };
  function knobSvg(c, v, x, y, r, th) {
    const f = toFrac(c, v), ang = -150 + 300 * f, a = (ang - 90) * Math.PI / 180;
    let s = `<g data-k="${c.id}" style="cursor:ns-resize">`;
    for (let k = 0; k <= 10; k++) { const t = (-150 + k * 30 - 90) * Math.PI / 180; s += `<line x1="${(x + (r + 12) * Math.cos(t)).toFixed(1)}" y1="${(y + (r + 12) * Math.sin(t)).toFixed(1)}" x2="${(x + (r + 28) * Math.cos(t)).toFixed(1)}" y2="${(y + (r + 28) * Math.sin(t)).toFixed(1)}" stroke="${th.gold}" stroke-width="3"/>`; }
    const lo = fmtV(c, c.min), hi = fmtV(c, c.max);
    s += T((x + (r + 46) * Math.cos(-240 * Math.PI / 180)).toFixed(0), (y + (r + 46) * Math.sin(-240 * Math.PI / 180) + 8).toFixed(0), lo.replace(' dB', '').replace(' Hz', '').replace(' kHz', 'k'), 20, th.ink, 'middle', 700);
    s += T((x + (r + 46) * Math.cos(60 * Math.PI / 180)).toFixed(0), (y + (r + 46) * Math.sin(60 * Math.PI / 180) + 8).toFixed(0), hi.replace(' dB', '').replace(' Hz', '').replace(' kHz', 'k'), 20, th.ink, 'middle', 700);
    s += `<circle cx="${x + 4}" cy="${y + 10}" r="${r + 4}" fill="#000" opacity="0.45"/>`;
    if (th.knob === 'sls') {
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#efefea"/><circle cx="${x}" cy="${y}" r="${r - 3}" fill="none" stroke="#b9bab4" stroke-width="5" stroke-dasharray="3 4"/>`;
      s += `<circle cx="${x}" cy="${y}" r="${r * 0.8}" fill="${c.col}"/><circle cx="${x}" cy="${y}" r="${r * 0.8}" fill="url(#capHiDark)" opacity="0.35"/>`;
    } else {
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#111214"/><circle cx="${x}" cy="${y}" r="${r * 0.78}" fill="${c.col}"/><circle cx="${x}" cy="${y}" r="${r * 0.78}" fill="url(#capHiDark)" opacity="0.6"/>`;
    }
    const light = c.col === '#cfd0cb' || c.col === '#e2b43a' || c.col === '#ecd03a';
    s += `<line x1="${x}" y1="${y}" x2="${(x + r * 0.92 * Math.cos(a)).toFixed(1)}" y2="${(y + r * 0.92 * Math.sin(a)).toFixed(1)}" stroke="${light ? '#141416' : '#ffffff'}" stroke-width="${r * 0.13}" stroke-linecap="round"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r + 30}" fill="transparent"/></g>`;
    s += T(x, y + r + 74, c.label, 26, th.ink, 'middle', 900, 'letter-spacing="2"');
    s += `<rect x="${x - 100}" y="${y + r + 88}" width="200" height="44" rx="6" fill="#0b0c0d"/>` + T(x, y + r + 120, fmtV(c, v), 26, '#7dffd6', 'middle', 700, `font-family="'JetBrains Mono', monospace"`);
    return s;
  }
  function keySvg(c, on, x, y, w, h, th) {
    const lit = LITC[c.col] || LITC.white;
    return `<g data-b="${c.id}" style="cursor:pointer"><rect x="${x + 3}" y="${y + 6}" width="${w}" height="${h}" rx="8" fill="#000" opacity="0.5"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${on ? lit : th.knob === 'sls' ? '#d8d5cb' : '#1a1a1a'}" ${on ? 'filter="url(#glow)"' : ''}/><rect x="${x}" y="${y}" width="${w}" height="${h * 0.42}" rx="8" fill="#fff" opacity="${on ? 0.35 : 0.12}"/>${T(x + w / 2, y + h / 2 + 11, c.label, 30, on ? '#1a1208' : th.knob === 'sls' ? '#1e1f22' : th.ink, 'middle', 900)}</g>`;
  }
  function busSvg(s, x, y, th, con) {
    let o = T(x, y - 20, con === 'sls' ? 'GROUPS 1 – 24' : 'BUSES 1 – 24', 26, th.ink, 'start', 900, 'letter-spacing="3"');
    for (let b = 0; b < 24; b++) {
      const bx = x + (b % 12) * 150, by = y + Math.floor(b / 12) * 150, on = s.bus.includes(b + 1);
      o += `<g data-bus="${b + 1}" style="cursor:pointer"><circle cx="${bx + 56}" cy="${by + 64}" r="50" fill="#000" opacity="0.45"/><circle cx="${bx + 52}" cy="${by + 58}" r="50" fill="${on ? '#ff5a3c' : con === 'sls' ? '#d9d6cc' : '#141414'}" ${on ? 'filter="url(#glow)"' : ''}/><circle cx="${bx + 52}" cy="${by + 58}" r="50" fill="url(#capHiDark)" opacity="0.5"/>${T(bx + 52, by + 70, String(b + 1), 36, on ? '#1a0a05' : con === 'sls' ? '#1e1f22' : '#ece6da', 'middle', 900)}</g>`;
    }
    return o;
  }
  function graphSvg(con, s, sec, gx, gy, gw, gh, th) {
    let o = `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="10" fill="#0a0b0c"/>`;
    if (sec === 'eq') {
      const fx = (f) => gx + 40 + (Math.log10(f / 20) / 3) * (gw - 80), dy = (d) => gy + gh / 2 - d * (gh - 120) / 40;
      for (const f of [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]) o += `<line x1="${fx(f)}" y1="${gy + 40}" x2="${fx(f)}" y2="${gy + gh - 60}" stroke="#2a2d30"/>` + T(fx(f), gy + gh - 24, f >= 1000 ? `${f / 1000}k` : String(f), 22, '#8b9196', 'middle', 700);
      for (const d of [-18, -12, -6, 0, 6, 12, 18]) o += `<line x1="${gx + 40}" y1="${dy(d)}" x2="${gx + gw - 40}" y2="${dy(d)}" stroke="${d ? '#2a2d30' : '#4a5056'}"/>` + T(gx + 30, dy(d) + 7, `${d > 0 ? '+' : ''}${d}`, 20, '#8b9196', 'end', 700);
      const fn = eqCurve(con, s); let pts = '';
      for (let k = 0; k <= 300; k++) { const f = 20 * Math.pow(1000, k / 300); const d = Math.max(-20, Math.min(20, fn(f))); pts += `${fx(f).toFixed(1)},${dy(d).toFixed(1)} `; }
      o += `<polyline points="${pts}" fill="none" stroke="#7dffd6" stroke-width="5" stroke-linejoin="round"/>`;
      o += T(gx + 40, gy + 30, s.eq_in ? 'FREQUENCY RESPONSE' : 'FREQUENCY RESPONSE · EQ OUT', 22, '#8b9196', 'start', 800, 'letter-spacing="2"');
    } else if (sec === 'dyn') {
      const px = (d) => gx + 80 + (d + 60) / 80 * (gw - 140), py = (d) => gy + gh - 80 - (d + 60) / 80 * (gh - 140);
      for (const d of [-60, -40, -20, 0, 20]) o += `<line x1="${px(d)}" y1="${py(-60)}" x2="${px(d)}" y2="${py(20)}" stroke="#2a2d30"/><line x1="${px(-60)}" y1="${py(d)}" x2="${px(20)}" y2="${py(d)}" stroke="#2a2d30"/>` + T(px(d), py(-60) + 34, String(d), 20, '#8b9196', 'middle', 700) + T(px(-60) - 14, py(d) + 7, String(d), 20, '#8b9196', 'end', 700);
      o += `<line x1="${px(-60)}" y1="${py(-60)}" x2="${px(20)}" y2="${py(20)}" stroke="#4a5056" stroke-dasharray="6 6"/>`;
      let pts = '';
      for (let k = 0; k <= 200; k++) {
        const i = -60 + 80 * k / 200; let out = i;
        if (s.dyn_in && s.cmp_in && i > s.c_thr) out = s.c_thr + (i - s.c_thr) / (s.c_ratio >= 19.9 ? 1e6 : s.c_ratio);
        if (s.dyn_in && s.exp_in && i < s.g_thr) out -= s.g_gate ? s.g_rng : Math.min(s.g_rng, (s.g_thr - i) * 1.5);
        pts += `${px(i).toFixed(1)},${py(Math.max(-60, out)).toFixed(1)} `;
      }
      o += `<polyline points="${pts}" fill="none" stroke="#7dffd6" stroke-width="5"/>`;
      o += T(gx + 40, gy + 30, s.dyn_in ? 'TRANSFER CURVE  ·  OUTPUT vs INPUT (dB)' : 'TRANSFER CURVE · DYNAMICS OUT', 22, '#8b9196', 'start', 800, 'letter-spacing="2"');
    }
    return o;
  }
  function renderStrip() {
    if (!STRIP_SVG) return;
    const { con, ch, sec } = SP, sp = SPEC[con], ss = sp[sec], th = sp.theme, s = chState(con, ch);
    const graph = !!ss.graph, PX0 = 140, PW = graph ? 2000 : 3560;
    let o = `<rect width="3840" height="2104" fill="#141210"/>`;
    o += `<rect x="80" y="210" width="${PW + 120}" height="1820" rx="14" fill="${th.panel}"/><rect x="80" y="210" width="${PW + 120}" height="6" fill="#fff" opacity="0.12"/>`;
    // header: console, channel, name, section tabs, channel stepper
    o += T(90, 92, `${sp.name}  ·  CHANNEL ${String(ch + 1).padStart(2, '0')}`, 44, '#efe8dc', 'start', 900, 'letter-spacing="3"');
    o += `<rect x="90" y="112" width="300" height="56" rx="4" fill="#f2eee2"/>` + T(240, 152, NAMES[ch], 36, '#1c2a6e', 'middle', 700, `font-family="'Permanent Marker', sans-serif"`);
    o += `<g data-nav="-1" style="cursor:pointer"><rect x="420" y="112" width="96" height="56" rx="6" fill="#2b2c30"/>${T(468, 150, '◀', 30, '#efe8dc')}</g><g data-nav="1" style="cursor:pointer"><rect x="530" y="112" width="96" height="56" rx="6" fill="#2b2c30"/>${T(578, 150, '▶', 30, '#efe8dc')}</g>`;
    ORDER[con].forEach((k, i) => { const on = k === sec, x = 700 + i * 300; o += `<g data-tab="${k}" style="cursor:pointer"><rect x="${x}" y="108" width="280" height="64" rx="6" fill="${on ? '#ffb02e' : '#2b2c30'}"/>${T(x + 140, 150, SPEC[con][k].title.split(' · ')[0], 26, on ? '#1a1208' : '#efe8dc', 'middle', 900, 'letter-spacing="2"')}</g>`; });
    // rows of controls
    const rows = ss.rows, rowH = Math.min(420, 1700 / rows.length);
    rows.forEach((row, ri) => {
      const y0 = 260 + ri * rowH;
      if (row[0].t === 'bus24') { o += busSvg(s, PX0 + 60, y0 + 60, th, con); return; }
      const n = row.length, cw = PW / n;
      row.forEach((c, ci) => {
        const cx = PX0 + cw * ci + cw / 2;
        if (c.t === 'knob') { const r = Math.min(86, rowH * 0.2); o += knobSvg(c, s[c.id], cx, y0 + rowH * 0.36, r, th); }
        else if (c.t === 'key') { const w = Math.min(240, cw - 30), h = Math.min(110, rowH * 0.3); o += keySvg(c, !!s[c.id], cx - w / 2, y0 + rowH * 0.36 - h / 2, w, h, th); }
      });
      if (ri < rows.length - 1) o += `<line x1="${PX0}" y1="${y0 + rowH - 10}" x2="${PX0 + PW}" y2="${y0 + rowH - 10}" stroke="${th.knob === 'sls' ? '#6f7574' : '#4a4640'}" stroke-width="2"/>`;
    });
    if (graph) o += graphSvg(con, s, ss.graph, 2320, 210, 1440, 1180, th);
    const nx = graph ? 2320 : 90, ny = graph ? 1460 : 2070;
    if (graph) { o += `<rect x="${nx}" y="${ny - 50}" width="1440" height="620" rx="10" fill="#1d1b19"/>`; const words = ss.note.split(' '); let line = '', ly = ny + 10; for (const w of words) { if ((line + w).length > 70) { o += T(nx + 40, ly, line, 28, '#d9d3c7', 'start', 600); ly += 44; line = ''; } line += w + ' '; } o += T(nx + 40, ly, line, 28, '#d9d3c7', 'start', 600); o += T(nx + 40, ny + 520, 'Drag a knob up / down · double-click resets · ◀ ▶ or ← → steps channels', 24, '#9c9384', 'start', 700); }
    else o += T(nx, 2080, ss.note + '   Drag a knob up / down · double-click resets · ← → steps channels', 26, '#9c9384', 'start', 600);
    STRIP_SVG.innerHTML = o;
    const tt = document.getElementById('strip-title'); if (tt) tt.textContent = `${sp.name} · CH ${ch + 1} · ${NAMES[ch]} · ${ss.title}`;
  }
  function openStrip(con, ch, sec) { SP.con = con; SP.ch = ch; SP.sec = sec; show('strip'); renderStrip(); }
  window.AS_OPEN_STRIP = openStrip;
  if (STRIP_SVG) {
    const pt = (e) => svgPt(STRIP_SVG, e);
    let drag = null;
    STRIP_SVG.addEventListener('pointerdown', (e) => {
      const g = e.target.closest('[data-k],[data-b],[data-bus],[data-tab],[data-nav]'); if (!g) return;
      const s = chState(SP.con, SP.ch), sec = SPEC[SP.con][SP.sec];
      const find = (id) => { for (const r of sec.rows) for (const c of r) if (c.id === id) return c; return null; };
      if (g.dataset.k) { const c = find(g.dataset.k); drag = { c, y: pt(e).y, f: toFrac(c, s[c.id]) }; STRIP_SVG.setPointerCapture(e.pointerId); return; }
      if (g.dataset.b) { const c = find(g.dataset.b); if (c.radio) { for (const r of sec.rows) for (const k of r) if (k.radio === c.radio) s[k.id] = false; s[c.id] = true; } else s[c.id] = !s[c.id]; }
      else if (g.dataset.bus) { const b = +g.dataset.bus; s.bus = s.bus.includes(b) ? s.bus.filter((x) => x !== b) : [...s.bus, b].sort((a, c) => a - c); }
      else if (g.dataset.tab) SP.sec = g.dataset.tab;
      else if (g.dataset.nav) SP.ch = (SP.ch + +g.dataset.nav + 32) % 32;
      saveST(); renderStrip();
    });
    STRIP_SVG.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const s = chState(SP.con, SP.ch); s[drag.c.id] = fromFrac(drag.c, drag.f + (drag.y - pt(e).y) / 500); renderStrip();
    });
    STRIP_SVG.addEventListener('pointerup', () => { if (drag) { drag = null; saveST(); } });
    STRIP_SVG.addEventListener('dblclick', (e) => {
      const g = e.target.closest('[data-k]'); if (!g) return;
      for (const r of SPEC[SP.con][SP.sec].rows) for (const c of r) if (c.id === g.dataset.k) chState(SP.con, SP.ch)[c.id] = c.def;
      saveST(); renderStrip();
    });
    STRIP_SVG.addEventListener('wheel', (e) => {
      const g = e.target.closest('[data-k]'); if (!g) return; e.preventDefault();
      for (const r of SPEC[SP.con][SP.sec].rows) for (const c of r) if (c.id === g.dataset.k) { const s = chState(SP.con, SP.ch); s[c.id] = fromFrac(c, toFrac(c, s[c.id]) - Math.sign(e.deltaY) * 0.02); }
      renderStrip();
    }, { passive: false });
    addEventListener('keydown', (e) => { if (open && open.dataset.view === 'strip' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { SP.ch = (SP.ch + (e.key === 'ArrowLeft' ? 31 : 1)) % 32; renderStrip(); } });
  }
  // ---- click targets on the consoles: work out channel and section from the click position ----
  const SEC_LABEL = { input: 'INPUT', bus: 'BUS', dyn: 'DYNAMICS', eq: 'EQ', sends: 'SENDS' };
  function hitCMI(x, y) {
    const ch = Math.floor((x - 46) / 85); if (ch < 0 || ch > 31) return null;
    const sec = y < 950 ? 'bus' : y < 1088 ? 'input' : y < 1402 ? 'eq' : y < 1636 ? 'sends' : y < 1700 ? 'bus' : null;
    return sec && { con: 'cmi', ch, sec, x0: 46 + ch * 85, w: 85, band: sec === 'bus' && y > 1636 ? [1636, 1700] : { bus: [804, 950], input: [950, 1088], eq: [1088, 1402], sends: [1402, 1636] }[sec] };
  }
  function hitSLS(x, y) {
    const xx = x - 24; let ch = -1, x0 = 0;
    if (xx >= 24 && xx < 24 + 16 * 72) { ch = Math.floor((xx - 24) / 72); x0 = 48 + ch * 72; }
    else if (xx >= 2072 && xx < 2072 + 16 * 72) { ch = 16 + Math.floor((xx - 2072) / 72); x0 = 24 + 2072 + (ch - 16) * 72; }
    if (ch < 0) return null;
    const B2 = { bus: [870, 1000], input: [1000, 1072], dyn: [1072, 1262], eq: [1262, 1592], sends: [1592, 1712] };
    const sec = Object.keys(B2).find((k) => y >= B2[k][0] && y < B2[k][1]);
    return sec && { con: 'sls', ch, sec, x0, w: 72, band: B2[sec] };
  }
  const hl = document.getElementById('strip-hl');
  for (const [id, hit] of [['strip-hot-cmi', hitCMI], ['strip-hot-sls', hitSLS]]) {
    const el = document.getElementById(id); if (!el) continue;
    const loc = (e) => { const r = stage.getBoundingClientRect(), k = r.width / 3840; return [(e.clientX - r.left) / k, (e.clientY - r.top) / k]; };
    el.addEventListener('mousemove', (e) => {
      const h = hit(...loc(e));
      if (!h) { hl.hidden = true; el.style.cursor = 'default'; return; }
      Object.assign(hl.style, { left: `${h.x0}px`, top: `${h.band[0]}px`, width: `${h.w}px`, height: `${h.band[1] - h.band[0]}px` });
      hl.querySelector('span').textContent = `CH ${h.ch + 1} · ${SEC_LABEL[h.sec]}`; hl.hidden = false; el.style.cursor = 'zoom-in';
    });
    el.addEventListener('mouseleave', () => { hl.hidden = true; });
    el.addEventListener('click', (e) => { const h = hit(...loc(e)); if (h) { hl.hidden = true; openStrip(h.con, h.ch, h.sec); } });
  }
  const syncHot = () => { const sls = document.body.dataset.studio === 'sls'; const a = document.getElementById('strip-hot-cmi'), b = document.getElementById('strip-hot-sls'); if (a) a.hidden = sls; if (b) b.hidden = !sls; };
  modeKeys.forEach((b) => b.addEventListener('click', syncHot)); syncHot();

