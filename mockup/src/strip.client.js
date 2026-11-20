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
  let ST = {};
  const saveST = () => { try { localStorage.setItem('as-strip-v1', JSON.stringify(ST)); } catch (e) {} };
  let chState = function (con, ch) {
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
  // ---- the pop-up shows the real console section, magnified (an <svg><use> of the console itself), and drives the
  //      console's own tagged controls: data-kid knobs (pointer group .kptr) and data-bid keys (lit layer .klit).
  //      What you turn in the pop-up turns on the console, so they always match.
  const DEF = { cmi: {}, sls: {} };
  for (const con of ['cmi', 'sls']) for (const sec of ORDER[con]) for (const row of SPEC[con][sec].rows) for (const c of row) if (c.id) DEF[con][c.id] = c;
  Object.assign(DEF.sls, { hf_bell: { label: 'HF BELL' }, lf_bell: { label: 'LF BELL' }, eqdynsc: { label: 'EQ → DYN S/C' }, eqpredyn: { label: 'EQ PRE DYN' }, g_gate: { label: 'GATE SELECT' }, link: { label: 'LINK' }, q_lf: { label: 'QUAD LF' }, q_rf: { label: 'QUAD RF' }, q_lb: { label: 'QUAD LB' }, q_rb: { label: 'QUAD RB' } });
  for (const [k, l] of Object.entries({ hf_bell: 'HF BELL', lf_bell: 'LF BELL' })) if (DEF.sls[k]) DEF.sls[k].label = l;
  const ROOT = (con) => document.getElementById(con === 'cmi' ? 'room-svg' : 'sls-svg');
  const angOf = (c, v) => -150 + 300 * Math.max(0, Math.min(1, toFrac(c, v)));
  const knobDef = (con, id) => (DEF[con][id] && DEF[con][id].min !== undefined ? DEF[con][id] : null) || { id, label: id.toUpperCase(), min: 0, max: 1, def: 0.5, unit: '' };
  function els(con, ch) { const r = ROOT(con); return r ? { k: [...r.querySelectorAll(`[data-kid][data-ch="${ch}"]`)], b: [...r.querySelectorAll(`[data-bid][data-ch="${ch}"]`)] } : { k: [], b: [] }; }
  ST = {}; try { ST = JSON.parse(localStorage.getItem('as-strip-v2') || '{}'); } catch (e) {}
  const saveST2 = () => { try { localStorage.setItem('as-strip-v2', JSON.stringify(ST)); } catch (e) {} };
  // state for a channel: what the console drawing shows, overridden by anything saved
  chState = function (con, ch) {
    const key = `${con}${ch}`;
    if (ST[key] && ST[key].__init) return ST[key];
    const s = Object.assign({}, ST[key] || {}), E = els(con, ch);
    for (const sec of ORDER[con]) for (const row of SPEC[con][sec].rows) for (const c of row) if (c.id && c.t !== 'bus24' && s[c.id] === undefined) s[c.id] = c.def;
    for (const el of E.k) { const id = el.dataset.kid; if ((ST[key] || {})[id] === undefined) { const c = knobDef(con, id); s[id] = fromFrac(c, (+el.dataset.a0 + 150) / 300); } }
    if (!ST[key] || !ST[key].bus) s.bus = E.b.filter((el) => /^bus\d+$/.test(el.dataset.bid) && el.dataset.on === '1').map((el) => +el.dataset.bid.slice(3));
    for (const el of E.b) { const id = el.dataset.bid; if (!/^bus\d+$/.test(id) && (ST[key] || {})[id] === undefined) s[id] = el.dataset.on === '1'; }
    s.__init = true; ST[key] = s; return s;
  };
  function applyCh(con, ch) {
    const s = chState(con, ch), E = els(con, ch);
    for (const el of E.k) { const c = knobDef(con, el.dataset.kid), pg = el.querySelector('.kptr'); if (pg && s[el.dataset.kid] !== undefined) pg.setAttribute('transform', `rotate(${(angOf(c, s[el.dataset.kid]) - +el.dataset.a0).toFixed(2)} ${el.dataset.cx} ${el.dataset.cy})`); }
    for (const el of E.b) { const id = el.dataset.bid, on = /^bus\d+$/.test(id) ? s.bus.includes(+id.slice(3)) : !!s[id], l = el.querySelector('.klit'); if (l) l.setAttribute('opacity', on ? 1 : 0); }
  }
  // saved settings show on the consoles at load
  for (const key of Object.keys(ST)) { const m = /^(cmi|sls)(\d+)$/.exec(key); if (m) { ST[key].__init = false; applyCh(m[1], +m[2]); } }
  // section rectangles on the stage (same bands as the click targets)
  function panelsFor(con, ch, sec) {
    if (con === 'cmi') { const x0 = 46 + ch * 85, B = { input: [954, 134], eq: [1088, 326], sends: [1414, 220] }; return sec === 'bus' ? [[x0, 797, 85, 156], [x0, 1634, 85, 61]] : [[x0, B[sec][0], 85, B[sec][1]]]; }   // bus assign (all 24 keys) + BUS LVL, clear of the INPUT/TAPE and MUTE keys
    const x0 = ch < 16 ? 48 + ch * 72 : 24 + 2072 + (ch - 16) * 72, B2 = { bus: [870, 1000], input: [1000, 1072], dyn: [1072, 1262], eq: [1262, 1592], sends: [1592, 1712] }[sec];
    return [[x0, B2[0], 72, B2[1] - B2[0]]];
  }
  const stageBox = (el) => { const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect(), k = sr.width / 3840; return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k }; };
  let PANELS = [], CTRLS = [];
  function sideSvg() {
    const { con, ch, sec } = SP, sp = SPEC[con], ss = sp[sec], s = chState(con, ch);
    let o = '';
    if (ss.graph) o += graphSvg(con, s, ss.graph, 2080, 210, 1680, 1060, sp.theme);
    const ly0 = ss.graph ? 1320 : 210, lh = ss.graph ? 760 : 1820;
    o += `<rect x="2080" y="${ly0}" width="1680" height="${lh}" rx="10" fill="#1d1b19"/>`;
    const ids = CTRLS.map((c) => c.id).filter((id, i, a) => a.indexOf(id) === i);
    const busIds = ids.filter((id) => /^bus\d+$/.test(id)), rest = ids.filter((id) => !/^bus\d+$/.test(id));
    let y = ly0 + 60, col = 0;
    const put = (lab, val) => { const x = 2120 + col * 820; o += T(x, y, lab, 26, '#9c9384', 'start', 800, 'letter-spacing="1"') + T(x + 760, y, val, 28, '#7dffd6', 'end', 700, `font-family="'JetBrains Mono', monospace"`); col++; if (col > 1) { col = 0; y += 52; } };
    if (busIds.length) put(con === 'sls' ? 'GROUPS' : 'BUSES', s.bus.length ? s.bus.join(' · ') : 'none');
    for (const id of rest) { const c = DEF[con][id]; const isKey = CTRLS.find((q) => q.id === id).t === 'key'; put((c && c.label) || id.replace(/_/g, ' ').toUpperCase(), isKey ? (s[id] ? 'IN' : 'OUT') : fmtV(knobDef(con, id), s[id])); }
    if (col) y += 52;
    const words = ss.note.split(' '); let line = ''; y += 30;
    for (const w of words) { if ((line + w).length > 92) { o += T(2120, y, line, 24, '#d9d3c7', 'start', 600); y += 36; line = ''; } line += w + ' '; }
    o += T(2120, y, line, 24, '#d9d3c7', 'start', 600);
    o += T(2120, ly0 + lh - 30, 'Drag a knob up / down or use the wheel · double-click resets · click a key · ← → steps channels', 22, '#9c9384', 'start', 700);
    return o;
  }
  // the pop-up is a window around just the clicked section of that channel, magnified (the console's own drawing)
  function renderStrip() {
    if (!STRIP_SVG) return;
    const { con, ch, sec } = SP, sp = SPEC[con], ss = sp[sec];
    chState(con, ch); applyCh(con, ch);
    const rects = panelsFor(con, ch, sec), pad = 26, gap = 36;
    const tw = rects.reduce((a, r) => a + r[2], 0), th = Math.max(...rects.map((r) => r[3]));
    const sc = Math.min(4.4, 1720 / th, (1500 - gap * (rects.length - 1)) / tw);
    const W = Math.round(tw * sc + gap * (rects.length - 1) + 2 * pad), H = Math.round(th * sc + 2 * pad);
    STRIP_SVG.setAttribute('width', W); STRIP_SVG.setAttribute('height', H); STRIP_SVG.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let o = `<rect width="${W}" height="${H}" fill="#141210"/>`, px = pad;
    PANELS = [];
    for (const [x, y, w, h] of rects) {
      const pw = w * sc, ph = h * sc, py = pad + (th * sc - ph) / 2, vx = con === 'cmi' ? x : x - 24, vy = con === 'cmi' ? y : y - 690;
      o += `<svg x="${px}" y="${py}" width="${pw}" height="${ph}" viewBox="${vx} ${vy} ${w} ${h}" style="overflow:hidden"><use href="#${con === 'cmi' ? 'room-svg' : 'sls-svg'}"/></svg>`;
      PANELS.push({ px, py, pw, ph, x, y, w, h, sc });
      px += pw + gap;
    }
    // the controls inside those sections (positions from the console itself)
    const E = els(con, ch); CTRLS = [];
    const inP = (b) => rects.some(([x, y, w, h]) => b.x + b.w / 2 >= x && b.x + b.w / 2 <= x + w && b.y + b.h / 2 >= y && b.y + b.h / 2 <= y + h);
    for (const el of E.k) { const b = stageBox(el); if (inP(b)) CTRLS.push({ t: 'knob', id: el.dataset.kid, el, cx: b.x + b.w / 2, cy: b.y + b.h / 2, r: Math.max(b.w, b.h) / 2 }); }
    for (const el of E.b) { const b = stageBox(el); if (inP(b)) CTRLS.push({ t: 'key', id: el.dataset.bid, el, ...b }); }
    STRIP_SVG.innerHTML = o;
    const tt = document.getElementById('strip-title'); if (tt) tt.textContent = `CH ${ch + 1} · ${NAMES[ch]} · ${ss.title.split(' · ')[0]}`;
    const ow = document.querySelector('#ov-strip .ov-win'); if (ow) ow.style.minWidth = '0';
    showVal(null);
  }
  // the value of the control being touched, in the window's title bar
  function showVal(c) {
    const v = document.getElementById('strip-val'); if (!v) return;
    if (!c) { v.textContent = '← → channels'; return; }
    const { con, ch } = SP, s = chState(con, ch), d = DEF[con][c.id];
    const lab = (d && d.label) || (/^bus\d+$/.test(c.id) ? (con === 'sls' ? 'GROUPS' : 'BUSES') : c.id.replace(/_/g, ' ').toUpperCase());
    v.textContent = /^bus\d+$/.test(c.id) ? `${lab} ${s.bus.length ? s.bus.join(' · ') : 'none'}` : c.t === 'key' ? `${lab} ${s[c.id] ? 'IN' : 'OUT'}` : `${lab} ${fmtV(knobDef(con, c.id), s[c.id])}`;
  }
  let lastCtl = null;
  const refreshSide = () => showVal(lastCtl);
  function openStrip(con, ch, sec) { SP.con = con; SP.ch = ch; SP.sec = sec; show('strip'); renderStrip(); }
  window.AS_OPEN_STRIP = openStrip;
  // popup point -> console control
  function hitCtrl(e) {
    const q = svgPt(STRIP_SVG, e);
    const P = PANELS.find((p) => q.x >= p.px && q.x <= p.px + p.pw && q.y >= p.py && q.y <= p.py + p.ph); if (!P) return null;
    const sx = P.x + (q.x - P.px) / P.sc, sy = P.y + (q.y - P.py) / P.sc;
    let best = null, bd = 1e9;
    for (const c of CTRLS) {
      if (c.t === 'knob') { const d = Math.hypot(sx - c.cx, sy - c.cy); if (d < c.r * 1.05 && d < bd) { bd = d; best = c; } }
      else if (sx >= c.x - 1 && sx <= c.x + c.w + 1 && sy >= c.y - 1 && sy <= c.y + c.h + 1) { best = c; bd = 0; }
    }
    return best;
  }
  if (STRIP_SVG) {
    let drag = null;
    STRIP_SVG.addEventListener('pointerdown', (e) => {
      const nav = e.target.closest('[data-tab],[data-nav]');
      if (nav) { if (nav.dataset.tab) SP.sec = nav.dataset.tab; else SP.ch = (SP.ch + +nav.dataset.nav + 32) % 32; renderStrip(); return; }
      const c = hitCtrl(e); if (!c) return;
      lastCtl = c;
      const s = chState(SP.con, SP.ch);
      if (c.t === 'knob') { const d = knobDef(SP.con, c.id); drag = { c, d, y: svgPt(STRIP_SVG, e).y, f: toFrac(d, s[c.id]) }; STRIP_SVG.setPointerCapture(e.pointerId); return; }
      if (/^bus\d+$/.test(c.id)) { const b = +c.id.slice(3); s.bus = s.bus.includes(b) ? s.bus.filter((x) => x !== b) : [...s.bus, b].sort((a, z) => a - z); }
      else if (c.id === 'src_in' || c.id === 'src_tape') { s.src_in = c.id === 'src_in'; s.src_tape = !s.src_in; }
      else s[c.id] = !s[c.id];
      applyCh(SP.con, SP.ch); saveST2(); refreshSide();
    });
    STRIP_SVG.addEventListener('pointermove', (e) => {
      if (drag) { const s = chState(SP.con, SP.ch); s[drag.c.id] = fromFrac(drag.d, drag.f + (drag.y - svgPt(STRIP_SVG, e).y) / 600); applyCh(SP.con, SP.ch); refreshSide(); return; }
      STRIP_SVG.style.cursor = hitCtrl(e) ? (hitCtrl(e).t === 'knob' ? 'ns-resize' : 'pointer') : 'default';
    });
    STRIP_SVG.addEventListener('pointerup', () => { if (drag) { drag = null; saveST2(); } });
    STRIP_SVG.addEventListener('dblclick', (e) => { const c = hitCtrl(e); if (!c || c.t !== 'knob') return; lastCtl = c; chState(SP.con, SP.ch)[c.id] = knobDef(SP.con, c.id).def; applyCh(SP.con, SP.ch); saveST2(); refreshSide(); });
    STRIP_SVG.addEventListener('wheel', (e) => { const c = hitCtrl(e); if (!c || c.t !== 'knob') return; lastCtl = c; e.preventDefault(); const s = chState(SP.con, SP.ch), d = knobDef(SP.con, c.id); s[c.id] = fromFrac(d, toFrac(d, s[c.id]) - Math.sign(e.deltaY) * 0.02); applyCh(SP.con, SP.ch); saveST2(); refreshSide(); }, { passive: false });
    addEventListener('keydown', (e) => { if (open && open.dataset.view === 'strip' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { SP.ch = (SP.ch + (e.key === 'ArrowLeft' ? 31 : 1)) % 32; renderStrip(); } });
  }
  // ---- click targets on the consoles: work out channel and section from the click position ----
  const SEC_LABEL = { input: 'INPUT', bus: 'BUS', dyn: 'DYNAMICS', eq: 'EQ', sends: 'SENDS' };
  function hitCMI(x, y) {
    const ch = Math.floor((x - 46) / 85); if (ch < 0 || ch > 31) return null;
    const sec = y < 953 ? 'bus' : y < 1088 ? 'input' : y < 1402 ? 'eq' : y < 1634 ? 'sends' : y < 1696 ? 'bus' : null;
    return sec && { con: 'cmi', ch, sec, x0: 46 + ch * 85, w: 85, band: sec === 'bus' && y > 1634 ? [1634, 1695] : { bus: [797, 953], input: [954, 1088], eq: [1088, 1402], sends: [1402, 1634] }[sec] };
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

