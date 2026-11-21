  // ---------------- Akita S900 sampler: its operating system (after the Akai S900 manual; references/s900 section 4) ------
  // Mode keys pick a function; s9Pages by two digits or PAGE ▲▼; the arrow (→) moves between parameters with ◄ ►; CONTROL
  // or digits change the one under it; ON/+ OFF/− for yes/no and sign; ENT confirms; LETTER names; P.B auditions.
  // Sample audio lives in the engine (s900.js, in the tape machine's worklet); this side keeps a copy of every sample and
  // the programs, so a fresh engine gets them back.
  const S9N = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'], s9Note = (n) => S9N[n % 12] + (Math.floor(n / 12) - 2);
  const s9pad = (v, w) => String(Math.abs(Math.round(v))).padStart(w, '0'), s9sgn = (v, w) => (v < 0 ? '-' : '+') + s9pad(v, w);
  const S9 = { on: true, mode: 'play', page: 1, field: -1, prog: 0, kg: 0, smp: 0, samples: [], programs: [], master: 0, midiCh: 0, omni: true, oct: 4,
    rec: { step: 0, name: 'SAMPLE ' + 1, bw: 10000, time: 5000, root: 60, trig: 3, thresh: 0.06, state: 'idle' }, rlev: 0.6, mon: 0.5, out: 0.8,
    msg: null, letter: null, typed: '', node: null, t: 0, held: new Set(), err: 0, test: { key: 60, vel: 64 } };
  const s9Say = (t, ms = 1600) => { S9.msg = { t, until: performance.now() + ms }; };
  const s9Oops = (t) => { s9Say(['Oops... ' + t[0], t[1] || ''], 2600); S9.err = performance.now() + 1500; };
  const s9Free = () => S900_WORDS - S9.samples.reduce((a, s) => a + s.data.length, 0);
  const s9Mem = () => `Mem ${Math.round((1 - s9Free() / S900_WORDS) * 100)}%`;
  const s9P = () => S9.programs[S9.prog] || S9.programs[0], s9KG = () => s9P() && s9P().kgs[Math.min(S9.kg, s9P().kgs.length - 1)], s9SM = () => S9.samples[S9.smp];
  const s9Post = (o) => elPost({ type: 's900', ...o });
  const s9meta = (s) => ({ name: s.name, rate: s.rate, root: s.root, tune: s.tune, loud: s.loud, start: s.start, end: s.end, loopLen: s.loopLen, mode: s.mode });
  const s9SendProgs = () => s9Post({ programs: S9.programs, prog: S9.prog });
  const s9SendSample = (i) => { const s = S9.samples[i]; if (s) s9Post({ sampleEdit: { i, set: s9meta(s) } }); };
  function s9SendAll() {   // a fresh engine: everything back in
    s9Post({ clear: true, ch: S9.ch ?? null, level: S9.out, master: S9.master, on: S9.on });
    S9.samples.forEach((s) => s9Post({ load: { name: s.name, data: s.data, rate: s.rate, o: s9meta(s) } }));
    s9SendProgs();
  }
  function s9LoadFactory() {
    const F = s900Factory(); S9.samples = []; S9.programs = F.programs; S9.prog = 0; S9.kg = 0; S9.smp = 0;
    for (const s of F.samples) { const q = s9Sample(s.name, s.data, s.rate, s.o); S9.samples.push(q); }
    s9SendAll();
  }
  s9LoadFactory();
  window.S900_RECV = (d) => {
    if (d.recorded != null) {   // a new recording: keep a copy, make it playable (a program of its own)
      s9Post({ getSample: d.recorded }); S9.rec.state = 'done'; S9.rec.step = 8; S9.smp = d.recorded;
      S9.pendingRec = d;
    }
    if (d.sample != null && d.data) {
      const m = S9.pendingRec && S9.pendingRec.recorded === d.sample ? S9.pendingRec : null;
      S9.samples[d.sample] = s9Sample(d.name, d.data, d.rate, m ? { root: m.root, loopLen: m.loopLen } : {});
      if (m) { S9.pendingRec = null; S9.programs.push({ name: d.name.slice(0, 10), midiCh: 0, level: 85, tune: 0, kgs: [{ lo: 0, hi: 127, sample: d.sample, loud: -1, xfade: 64, tune: 0, transpose: 0, level: 0, oneShot: false, filter: 99, attack: 0, decay: 50, sustain: 99, release: 15, velLevel: 30, velFilter: 0, out: 0 }] }); S9.prog = S9.programs.length - 1; s9SendProgs(); s9Say(['Recorded ' + d.name, 'Program ' + (S9.prog + 1) + ' plays it. Press ENT to replay']); S9.rec.name = 'SAMPLE ' + (S9.samples.length + 1); }
    }
    if (d.trimmed != null && S9.samples[d.trimmed]) { const S = S9.samples[d.trimmed]; S.data = S.data.slice(S.start, S.end); S.end = S.data.length; S.start = 0; S.loopLen = Math.min(S.loopLen, S.end); }
    if (d.err) s9Oops([d.err]);
  };
  // ---- s9Pages: each gives two lines and its fields {k, label column, get, set, min, max, step, w, fmt, ent, name} ----
  const s9f = (k, get, set, min, max, step = 1, o = {}) => ({ k, get, set, min, max, step, ...o });
  function s9Pages(mode) {
    const p = s9P(), kg = s9KG(), sm = s9SM();
    if (mode === 'play') return { 1: () => {
      const list = S9.programs.map((q, i) => `${i + 1} ${q.name}`.padEnd(13).slice(0, 13)); const at = Math.max(0, Math.min(S9.prog - 1, list.length - 3));
      const blink = Math.floor(performance.now() / 400) % 2;
      return { l: [list.slice(at, at + 3).map((t, j) => (at + j === S9.prog && blink ? ''.padEnd(13) : t)).join(''), 'Select with keys or scroll with knob'], f: [s9f('prog', () => S9.prog + 1, (v) => { S9.prog = v - 1; S9.kg = 0; s9Post({ prog: S9.prog }); }, 1, S9.programs.length, 1, { w: 2 })], noPage: true };
    } };
    if (mode === 'tune') return { 1: () => ({ l: [`MASTER TUNE                    ${s9sgn(S9.master, 2)}`, '(in 1/16 semitones)'], f: [s9f('mt', () => S9.master, (v) => { S9.master = v; s9Post({ master: v }); }, -16, 16, 1, { w: 2, sign: true })], noPage: true }) };
    if (mode === 'util') return { 1: () => ({ l: ['UTILITY', 'No utilities in this version'], f: [], noPage: true }) };
    if (mode === 'midi') return {
      1: () => ({ l: [`*Basic MIDI channel ${s9pad(S9.midiCh + 1, 2)}`, `*Omni on/off       ${S9.omni ? 'ON ' : 'OFF'}`], f: [s9f('ch', () => S9.midiCh + 1, (v) => { S9.midiCh = v - 1; }, 1, 16, 1, { w: 2 }), s9f('omni', () => (S9.omni ? 1 : 0), (v) => { S9.omni = !!v; }, 0, 1, 1, { bool: true })] }),
      2: () => ({ l: [`*Channel ${s9pad(S9.midiCh + 1, 2)} *Key ${s9pad(S9.test.key, 3)} *Velocity ${s9pad(S9.test.vel, 3)}`, 'Press P.B to play'], f: [s9f('ch', () => S9.midiCh + 1, (v) => { S9.midiCh = v - 1; }, 1, 16, 1, { w: 2 }), s9f('key', () => S9.test.key, (v) => { S9.test.key = v; }, 0, 127, 1, { w: 3 }), s9f('vel', () => S9.test.vel, (v) => { S9.test.vel = v; }, 1, 127, 1, { w: 3 })] }),
      3: () => ({ l: [`Channel ${s9pad(S9.midiCh + 1, 2)} Key ${s9Note(S9.lastKey ?? 60)} ${s9pad(S9.lastKey ?? 60, 3)} Velocity ${s9pad(S9.lastVel ?? 64, 3)}`, '(the last note received)'], f: [] }),
    };
    if (mode === 'disk') {
      const nm = sm ? sm.name : '';
      return {
        1: () => ({ l: ['Clear memory and load', 'entire disk (ENT)            FACTORY'], f: [{ k: 'go', ent: () => { s9Disk(); s9LoadFactory(); s9Say(['Loading: STRINGS 1, E.PIANO, SYN BASS,', 'KICK, SNARE, HATS · 4 programs']); } }] }),
        2: () => ({ l: [`LOAD PROGRAM (ENT) *PR-only  ${s9Mem()}`, '    no program files on this disk'], f: [{ k: 'go', ent: () => s9Oops(['only the factory disk is here', 'use page 01, or page 03 for a sample']) }] }),
        3: () => ({ l: [`LOAD SAMPLE (ENT)            ${s9Mem()}`, '*from your computer: WAV AIFF FLAC MP3'], f: [{ k: 'go', ent: () => document.getElementById('s9-file').click() }] }),
        4: () => ({ l: [`Clear disk and save          ${s9Mem()}`, 'entire memory (ENT)       write-protect'], f: [{ k: 'go', ent: () => s9Oops(['Disk is write-protected.', 'Use page 06 to save a sample as WAV']) }] }),
        5: () => ({ l: ['SAVE PROGRAM (ENT) *PR. only', `*name ${(p ? p.name : '').padEnd(10)}`], f: [{ k: 'go', ent: () => s9Oops(['Disk is write-protected.', 'Use page 06 to save a sample as WAV']) }] }),
        6: () => ({ l: ['SAVE SAMPLE (ENT)              as WAV', `*name ${nm.padEnd(10)}`], f: [s9f('smp', () => S9.smp + 1, (v) => { S9.smp = v - 1; }, 1, Math.max(1, S9.samples.length), 1, { w: 2, ent: () => s9SaveWav() })] }),
        7: () => ({ l: ['ERASE FROM *Sample', 'DISK (ENT) *Program      write-protect'], f: [{ k: 'go', ent: () => s9Oops(['Disk is write-protected.']) }] }),
        8: () => ({ l: ['DISK FORMAT.', 'Prepare new disk (ENT)   write-protect'], f: [{ k: 'go', ent: () => s9Oops(['Disk is write-protected.']) }] }),
      };
    }
    if (mode === 'esmp') {
      if (!sm) return { 1: () => ({ l: ['No samples in memory', 'Record one (REC) or load one (DISK)'], f: [] }) };
      const total = sm.data.length;
      return {
        1: () => ({ l: [`*Select, Copy                ${sm.name.padEnd(10)}`, `SAMPLE *Rename, delete (-)   ${sm.name.padEnd(10)}`], f: [s9f('smp', () => S9.smp + 1, (v) => { S9.smp = v - 1; }, 1, S9.samples.length, 1, { w: 2, name: () => sm, del: () => s9DelSample(S9.smp) })] }),
        3: () => ({ l: ['*Loudness  *Nom pitch  *Fine pitch', `   ${s9sgn(sm.loud, 2)}        ${s9Note(sm.root).padEnd(3)} ${s9pad(sm.root, 3)}       ${s9sgn(sm.tune, 2)}`], f: [s9f('loud', () => sm.loud, (v) => { sm.loud = v; s9SendSample(S9.smp); }, -50, 50, 1, { sign: true }), s9f('root', () => sm.root, (v) => { sm.root = v; s9SendSample(S9.smp); }, 0, 127), s9f('tune', () => sm.tune, (v) => { sm.tune = v; s9SendSample(S9.smp); }, -50, 50, 1, { sign: true })] }),
        4: () => ({ l: ['*REPLAY MODE One shot (1)', `Looping (2), Alternating (3)           ${{ one: 1, loop: 2, alt: 3 }[sm.mode]}`], f: [s9f('mode', () => ({ one: 1, loop: 2, alt: 3 })[sm.mode], (v) => { sm.mode = ['one', 'loop', 'alt'][v - 1]; s9SendSample(S9.smp); }, 1, 3)] }),
        5: () => ({ l: ['*TIME DIRECTION', `Normal (1), Reverse (2)                ${sm.rev ? 2 : 1}`], f: [s9f('dir', () => (sm.rev ? 2 : 1), (v) => { if (!!sm.rev !== (v === 2)) { sm.rev = v === 2; sm.data.reverse(); s9Post({ reverse: S9.smp }); } }, 1, 2)] }),
        6: () => ({ l: ['START POINT          *Coarse  *Fine', `(0 - ${(sm.end - 100).toLocaleString('en')})`.padEnd(26) + `${s9pad(Math.floor(sm.start / 1000), 3)}, ${s9pad(sm.start % 1000, 3)}`], f: [s9f('sc', () => sm.start, (v) => { sm.start = v; s9SendSample(S9.smp); }, 0, sm.end - 100, 1000), s9f('sf', () => sm.start, (v) => { sm.start = v; s9SendSample(S9.smp); }, 0, sm.end - 100, 1)] }),
        7: () => ({ l: ['END POINT            *Coarse  *Fine', `(${(sm.start + 100).toLocaleString('en')} - ${total.toLocaleString('en')})`.padEnd(26) + `${s9pad(Math.floor(sm.end / 1000), 3)}, ${s9pad(sm.end % 1000, 3)}`], f: [s9f('ec', () => sm.end, (v) => { sm.end = v; sm.loopLen = Math.min(sm.loopLen, sm.end - sm.start); s9SendSample(S9.smp); }, sm.start + 100, total, 1000), s9f('ef', () => sm.end, (v) => { sm.end = v; sm.loopLen = Math.min(sm.loopLen, sm.end - sm.start); s9SendSample(S9.smp); }, sm.start + 100, total, 1)] }),
        8: () => ({ l: ['LOOP LENGTH  *Coarse  *Fine  *Auto', `(5 - ${(sm.end - sm.start).toLocaleString('en')})`.padEnd(18) + `${s9pad(Math.floor(sm.loopLen / 1000), 2)}, ${s9pad(sm.loopLen % 1000, 3)}   (ENT)`], f: [s9f('lc', () => sm.loopLen, (v) => { sm.loopLen = v; s9SendSample(S9.smp); }, 5, sm.end - sm.start, 1000), s9f('lf', () => sm.loopLen, (v) => { sm.loopLen = v; s9SendSample(S9.smp); }, 5, sm.end - sm.start, 1), { k: 'auto', ent: () => s9AutoLoop(sm) }] }),
        9: () => ({ l: ['*Resample at half bandwidth (ENT)', `*Discard before start, after end (ENT)`], f: [{ k: 'half', ent: () => s9Oops(['not in this version']) }, { k: 'disc', ent: () => { s9Post({ discard: S9.smp }); s9Say(['Discarded', `${sm.name}: ${(sm.end - sm.start).toLocaleString('en')} points kept`]); } }] }),
      };
    }
    if (mode === 'eprg') {
      if (!p) return { 1: () => ({ l: ['No programs', ''], f: [] }) };
      const sname = (i) => (S9.samples[i] ? S9.samples[i].name : '').padEnd(10);
      const kgl = `*KG${S9.kg + 1}`.padEnd(5);
      const kgF = s9f('kg', () => S9.kg + 1, (v) => { S9.kg = v - 1; }, 1, p.kgs.length, 1, { w: 2 });
      const setK = (k) => (v) => { kg[k] = v; s9SendProgs(); };
      if (!kg) return { 1: () => ({ l: [`*Select, Copy           ${p.name}`, `PROGRAM *Rename, Delete (-) ${p.name}`], f: [] }) };
      return {
        1: () => ({ l: [`*Select, Copy                ${p.name.padEnd(10)}`, `PROGRAM *Rename, Delete (-)  ${p.name.padEnd(10)}`], f: [s9f('prog', () => S9.prog + 1, (v) => { S9.prog = v - 1; S9.kg = 0; s9Post({ prog: S9.prog }); }, 1, S9.programs.length, 1, { w: 2, name: () => p, del: () => s9DelProg(S9.prog), copy: () => { S9.programs.push(JSON.parse(JSON.stringify(p))); S9.prog = S9.programs.length - 1; s9SendProgs(); } })] }),
        3: () => ({ l: [`KEYGROUP: *Select (1 to ${s9pad(p.kgs.length, 2)})      ${s9pad(S9.kg + 1, 2)}`, '*Copy (+), Delete (-)'], f: [s9f('kg', () => S9.kg + 1, (v) => { S9.kg = v - 1; }, 1, p.kgs.length, 1, { w: 2, copy: () => { p.kgs.push({ ...kg }); S9.kg = p.kgs.length - 1; s9SendProgs(); }, del: () => { if (p.kgs.length > 1) { p.kgs.splice(S9.kg, 1); S9.kg = Math.max(0, S9.kg - 1); s9SendProgs(); } } })] }),
        5: () => ({ l: ['Soft *sample *Low Key *High Key', `${kgl}${sname(kg.sample)} ${s9Note(kg.lo).padEnd(3)} ${s9pad(kg.lo, 3)}   ${s9Note(kg.hi).padEnd(3)} ${s9pad(kg.hi, 3)}`], f: [s9f('smp', () => kg.sample + 1, (v) => { kg.sample = v - 1; s9SendProgs(); }, 1, Math.max(1, S9.samples.length)), s9f('lo', () => kg.lo, (v) => { kg.lo = Math.min(v, kg.hi); s9SendProgs(); }, 0, 127), s9f('hi', () => kg.hi, (v) => { kg.hi = Math.max(v, kg.lo); s9SendProgs(); }, 0, 127), kgF] }),
        6: () => ({ l: ['S *Loudness *Filter *Transpose *fine', `${kgl}   ${s9sgn(kg.level, 2)}       ${s9pad(kg.filter, 2)}       ${s9sgn(kg.transpose, 2)}      ${s9sgn(kg.tune, 2)}`], f: [s9f('lv', () => kg.level, setK('level'), -50, 50, 1, { sign: true }), s9f('flt', () => kg.filter, setK('filter'), 0, 99), s9f('tr', () => kg.transpose, setK('transpose'), -50, 50, 1, { sign: true }), s9f('fn', () => kg.tune, setK('tune'), -50, 50, 1, { sign: true }), kgF] }),
        9: () => ({ l: ['ENV *Attack *Decay *Sustain *Release', `${kgl}    ${s9pad(kg.attack, 2)}      ${s9pad(kg.decay, 2)}      ${s9pad(kg.sustain, 2)}       ${s9pad(kg.release, 2)}`], f: [s9f('a', () => kg.attack, setK('attack'), 0, 99), s9f('d', () => kg.decay, setK('decay'), 0, 99), s9f('s', () => kg.sustain, setK('sustain'), 0, 99), s9f('r', () => kg.release, setK('release'), 0, 99), kgF] }),
        10: () => ({ l: [`VLCTY *Loudness ${s9pad(kg.velLevel, 2)}  *Filter ${s9pad(kg.velFilter, 2)}`, `${kgl}SENS.   *One-shot trigger ${kg.oneShot ? 'ON ' : 'OFF'}`], f: [s9f('vl', () => kg.velLevel, setK('velLevel'), 0, 99), s9f('vf', () => kg.velFilter, setK('velFilter'), 0, 99), kgF, s9f('os', () => (kg.oneShot ? 1 : 0), (v) => { kg.oneShot = !!v; s9SendProgs(); }, 0, 1, 1, { bool: true })] }),
      };
    }
    if (mode === 'rec') {
      const R = S9.rec, maxMs = Math.min(63351, Math.floor(s9Free() / (R.bw * 2.5) * 1000));
      const steps = [
        () => ({ l: ['NAME OF SAMPLE TO BE RECORDED', R.name.padEnd(10, '_')], f: [{ k: 'name', name: () => R }] }),
        () => ({ l: ['AUDIO BANDWIDTH (3000Hz to 16,000Hz)', `${R.bw.toLocaleString('en').padStart(6, '0')}Hz`.padStart(40)], f: [s9f('bw', () => R.bw, (v) => { R.bw = v; R.time = Math.min(R.time, Math.floor(s9Free() / (v * 2.5) * 1000)); }, 3000, 16000, 100)] }),
        () => ({ l: [`RECORDING TIME (250mS to ${maxMs.toLocaleString('en')}mS)`, `${R.time.toLocaleString('en').padStart(6, '0')}mS`.padStart(40)], f: [s9f('time', () => R.time, (v) => { R.time = v; }, 250, Math.max(250, maxMs), 50)] }),
        () => ({ l: [`PITCH OF SOUND BEING RECORDED:    ${s9Note(R.root).padEnd(3)} ${s9pad(R.root, 3)}`, '(play the note, or turn CONTROL)'], f: [s9f('root', () => R.root, (v) => { R.root = v; }, 0, 127)] }),
        () => ({ l: ['START SAMPLING WITH - Any key (1),', `Footswitch (2), Audio level (3)        ${R.trig}`], f: [s9f('trig', () => R.trig, (v) => { R.trig = v; }, 1, 3)] }),
        () => {   // the meter: bar + peak, T = trigger level, 6 overload dots; arrows fill the top line while recording
          const M = window.S900_M, db = M ? M.recDb : -99, bar = Math.max(0, Math.min(34, Math.round((db + 48) / 48 * 34))), tpos = Math.round((20 * Math.log10(R.thresh) + 48) / 48 * 34);
          let line = ''; for (let i = 0; i < 34; i++) line += i === tpos && R.trig === 3 ? 'T' : i < bar ? '█' : ' ';
          line += db > -0.5 ? '......' : db > -2 ? '...   ' : '      ';
          const top = R.state === 'rec' ? '→'.repeat(Math.max(1, Math.round((M ? M.recPct : 0) * 40))) : R.state === 'armed' ? 'WAITING FOR AUDIO ABOVE T' : R.trig === 3 ? 'KNOB SETS TRIG LEVEL. ANY KEY WHEN READY' : R.trig === 2 ? 'Hit footswitch to start recording' : 'Press any key to start recording';
          return { l: [top, line], f: [s9f('thr', () => Math.round(20 * Math.log10(R.thresh)), (v) => { R.thresh = 10 ** (v / 20); }, -48, 0, 1, { ent: () => s9Arm() })], meter: true };
        },
        () => ({ l: [R.state === 'done' ? `${(s9SM() || {}).name || ''} recorded` : 'Nothing recorded yet', 'Press ENT to replay'], f: [{ k: 'replay', ent: () => s9Audition() }] }),
      ];
      const o = {}; steps.forEach((fn, i) => { o[i + 1] = fn; }); o.steps = true; return o;
    }
    return { 1: () => ({ l: ['', ''], f: [] }) };
  }
  // ---- actions ----
  function s9Disk() { S9.diskT = performance.now() + 1400; }
  function s9DelSample(i) { if (!S9.samples[i]) return; S9.samples.splice(i, 1); s9Post({ del: i }); for (const p of S9.programs) for (const k of p.kgs) { if (k.sample > i) k.sample--; } S9.smp = Math.max(0, Math.min(S9.smp, S9.samples.length - 1)); s9SendProgs(); s9Say(['Sample deleted', s9Mem()]); }
  function s9DelProg(i) { if (S9.programs.length < 2) return s9Oops(['the last program cannot go']); S9.programs.splice(i, 1); S9.prog = Math.max(0, i - 1); s9SendProgs(); s9Say(['Program deleted', '']); }
  function s9AutoLoop(sm) {   // each ENT tries a slightly shorter loop whose ends meet best
    const d = sm.data, e = sm.end - 1; let best = sm.loopLen, err = 9;
    for (let L = sm.loopLen - 1; L > Math.max(5, sm.loopLen * 0.9); L--) { const a = e - L; if (a < sm.start + 1) break; const er = Math.abs(d[a] - d[e]) + Math.abs((d[a] - d[a - 1]) - (d[e] - d[e - 1])) * 2; if (er < err) { err = er; best = L; } }
    sm.loopLen = best; s9SendSample(S9.smp); s9Say(['Auto loop', `loop length ${best.toLocaleString('en')}`]);
  }
  function s9Arm() {
    const R = S9.rec; if (!EL.node) { window.AS_AUTOPOWER && window.AS_AUTOPOWER(); return s9Say(['Powering up the audio engine', 'press again in a moment']); }
    if (S9.samples.length >= 32) return s9Oops(['32 samples is the limit']);
    if (S9.ch == null) s9Say(['Nothing patched to S900 IN', 'recording silence (PATCHBAY)'], 2200);
    R.state = R.trig === 3 ? 'armed' : 'rec';
    s9Post({ rec: 'arm', opts: { rate: Math.round(R.bw * 2.5), len: R.time / 1000, thresh: R.trig === 3 ? R.thresh : 0, name: R.name.trim() || 'SAMPLE', root: R.root, gain: (S9.rlev * 1.6) ** 2 * 2 } });
  }
  function s9Audition(note) { const n = note ?? (S9.mode === 'midi' && S9.page === 2 ? S9.test.key : (s9SM() ? s9SM().root : 60)); s9NoteOn(n, S9.mode === 'midi' ? S9.test.vel : 100); setTimeout(() => s9NoteOff(n), 700); }
  function s9SaveWav() {
    const s = s9SM(); if (!s) return;
    const d = s.data.subarray(s.start, s.end), n = d.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, s.rate, true); v.setUint32(28, s.rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(d[i] * 32767))), true);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([b], { type: 'audio/wav' })); a.download = s.name.trim().replace(/\s+/g, '_') + '.wav'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    s9Disk(); s9Say(['Saved ' + s.name, `${n.toLocaleString('en')} points at ${s.rate} Hz, 12-bit in a 16-bit WAV`]);
  }
  async function s9LoadFile(file) {
    try {
      const ctx = EL.ctx || new (window.AudioContext || window.webkitAudioContext)(), buf = await ctx.decodeAudioData(await file.arrayBuffer());
      const rate = buf.duration > 6 ? 20000 : 40000, n = Math.min(Math.floor(buf.duration * rate), s9Free());
      if (n < 100) return s9Oops(['memory full']);
      const off = new OfflineAudioContext(1, n, rate), src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start(); const r = await off.startRendering();
      const name = file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 10), s = s9Sample(name, r.getChannelData(0), rate, { root: 60, loopLen: Math.min(n, Math.round(rate * 0.25)) });
      const i = S9.samples.length; S9.samples.push(s); s9Post({ load: { name: s.name, data: s.data, rate, o: s9meta(s) } });
      S9.programs.push({ name: name.slice(0, 10), midiCh: 0, level: 85, tune: 0, kgs: [{ lo: 0, hi: 127, sample: i, loud: -1, xfade: 64, tune: 0, transpose: 0, level: 0, oneShot: false, filter: 99, attack: 0, decay: 50, sustain: 99, release: 15, velLevel: 30, velFilter: 0, out: 0 }] });
      S9.prog = S9.programs.length - 1; S9.smp = i; s9SendProgs(); s9Disk();
      s9Say([`Loaded ${name}`, `${n.toLocaleString('en')} points at ${rate} Hz · program ${S9.prog + 1}`], 2600);
    } catch (e) { s9Oops(['could not read that file', String(e.message || e).slice(0, 40)]); }
  }
  const s9FileIn = document.getElementById('s9-file'); if (s9FileIn) s9FileIn.addEventListener('change', () => { if (s9FileIn.files[0]) s9LoadFile(s9FileIn.files[0]); s9FileIn.value = ''; });
  // ---- notes ----
  function s9NoteOn(n, v = 100) {
    if (!S9.on) return; if (!EL.node && window.AS_AUTOPOWER) window.AS_AUTOPOWER();
    S9.held.add(n); S9.lastKey = n; S9.lastVel = v; S9.midiT = performance.now() + 120;
    if (S9.mode === 'rec' && S9.page === 4) S9.rec.root = n;
    if (S9.mode === 'rec' && S9.page === 6 && S9.rec.trig === 1 && S9.rec.state !== 'rec') return s9Arm();
    s9Post({ note: n, vel: v }); s9KbDraw();
  }
  function s9NoteOff(n) { S9.held.delete(n); s9Post({ note: n, vel: 0 }); s9KbDraw(); }
  // ---- keys ----
  function s9Page() { const pg = s9Pages(S9.mode), fn = pg[S9.page] || pg[Object.keys(pg).filter((k) => !isNaN(k))[0]]; return { pg, v: fn() }; }
  function s9Field() { const { v } = s9Page(); return S9.field >= 0 ? v.f[S9.field] : null; }
  function s9Change(f, v) { if (!f || f.get == null) return; v = Math.max(f.min, Math.min(f.max, v)); f.set(v); }
  function s9Key(k) {
    const now = performance.now();
    if (k === 'power') { S9.on = !S9.on; s9Post({ on: S9.on }); return; }
    if (!S9.on) return;
    if (S9.letter) {   // naming: ENT commits, ◄ ► move, SPACE adds a space
      const L = S9.letter;
      if (k === 'k:ent') { L.obj.name = (L.buf.trimEnd() || L.obj.name).slice(0, 10); if (L.after) L.after(); S9.letter = null; s9Say(['Named ' + L.obj.name, '']); }
      else if (k === 'k:space') L.buf = (L.buf + ' ').slice(0, 10);
      else if (/^k:\d$/.test(k)) L.buf = (L.buf + k[2]).slice(0, 10);
      else if (k === 'k:minus' || k === 'k:left') L.buf = L.buf.slice(0, -1);
      return;
    }
    if (k.startsWith('m:')) { S9.mode = k.slice(2); S9.page = 1; S9.field = -1; S9.typed = ''; S9.msg = null; S9.err = 0; if (S9.mode === 'rec') { S9.rec.state = S9.rec.state === 'rec' ? 'rec' : 'idle'; } if (S9.mode === 'play' || S9.mode === 'tune') S9.field = 0; return; }
    const { pg, v } = s9Page(), nums = Object.keys(pg).filter((x) => !isNaN(x)).map(Number);
    const f = s9Field();
    if (k === 'k:pup' || k === 'k:pdn') { const i = nums.indexOf(S9.page) + (k === 'k:pdn' ? 1 : -1); if (i >= 0 && i < nums.length) { S9.page = nums[i]; S9.field = pg.steps || v.noPage ? 0 : -1; S9.typed = ''; } return; }
    if (k === 'k:left' || k === 'k:right') { const n = v.f.length; S9.field = Math.max(pg.steps || v.noPage ? 0 : -1, Math.min(n - 1, S9.field + (k === 'k:right' ? 1 : -1))); S9.typed = ''; return; }
    if (k === 'k:pb') { s9Audition(); return; }
    if (/^k:\d$/.test(k)) {
      S9.typed += k[2];
      if (S9.field < 0 && !pg.steps && !v.noPage) { if (S9.typed.length >= 2) { const n = +S9.typed; S9.typed = ''; if (pg[n]) { S9.page = n; S9.field = -1; } else s9Oops([`no page ${s9pad(n, 2)} here`]); } return; }
      if (f && f.get) { const w = f.w || String(f.max).length; const val = +S9.typed * (f.sign && f.get() < 0 ? -1 : 1); s9Change(f, val); if (S9.typed.length >= w) S9.typed = ''; }
      return;
    }
    if (k === 'k:plus' || k === 'k:minus') {
      if (f && f.bool) { s9Change(f, k === 'k:plus' ? 1 : 0); return; }
      if (f && f.sign) { s9Change(f, Math.abs(f.get()) * (k === 'k:plus' ? 1 : -1)); return; }
      if (f && k === 'k:plus' && f.copy) { S9.pend = 'copy'; s9Say(['Copy: press ENT', '']); return; }
      if (f && k === 'k:minus' && f.del) { S9.pend = 'del'; s9Say(['Delete: press ENT', '']); return; }
      return;
    }
    if (k === 'k:letter') { const t = f && f.name ? f.name() : null; if (t) { S9.letter = { obj: t, buf: '', after: () => s9SendProgs() }; s9Say(['Type the new name (keyboard), ENT', ''], 1200); } return; }
    if (k === 'k:ent') {
      if (S9.pend && f) { const a = S9.pend; S9.pend = null; if (a === 'copy' && f.copy) f.copy(); if (a === 'del' && f.del) f.del(); return; }
      if (f && f.ent) { f.ent(); return; }
      const first = v.f.find((x) => x.ent); if (first && S9.field < 0) first.ent();
      return;
    }
    if (k === 'foot') { if (S9.mode === 'rec' && S9.page === 6 && S9.rec.trig === 2) s9Arm(); else s9Audition(); return; }
    void now;
  }
  function s9Turn(d) {   // CONTROL: the page number when the arrow is on it, otherwise the value
    const { pg, v } = s9Page();
    if (S9.field < 0 && !pg.steps && !v.noPage) { const nums = Object.keys(pg).filter((x) => !isNaN(x)).map(Number), i = Math.max(0, Math.min(nums.length - 1, nums.indexOf(S9.page) + Math.sign(d))); S9.page = nums[i]; return; }
    const f = s9Field(); if (f && f.get) s9Change(f, f.get() + Math.sign(d) * (f.step || 1) * (Math.abs(d) > 2 ? 5 : 1));
  }
  document.querySelectorAll('.ovsync [data-s9]').forEach((g) => {
    const k = g.dataset.s9;
    if (k === 'control' || k === 'rlev' || k === 'mon' || k === 'out') {
      let y0 = null, acc = 0;
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); g.setPointerCapture(e.pointerId); y0 = e.clientY; acc = 0; });
      g.addEventListener('pointermove', (e) => {
        if (y0 == null) return; const dy = y0 - e.clientY; y0 = e.clientY;
        if (k === 'control') { acc += dy; while (Math.abs(acc) >= 8) { s9Turn(Math.sign(acc)); S9.ctlA = (S9.ctlA || 0) + Math.sign(acc) * 15; acc -= Math.sign(acc) * 8; } }
        else { S9[k] = Math.max(0, Math.min(1, S9[k] + dy / 200)); if (k === 'out') s9Post({ level: S9.out }); }
      });
      g.addEventListener('pointerup', () => { y0 = null; });
      g.addEventListener('wheel', (e) => { e.preventDefault(); if (k === 'control') { s9Turn(-Math.sign(e.deltaY)); S9.ctlA = (S9.ctlA || 0) - Math.sign(e.deltaY) * 15; } else { S9[k] = Math.max(0, Math.min(1, S9[k] - Math.sign(e.deltaY) * 0.04)); if (k === 'out') s9Post({ level: S9.out }); } }, { passive: false });
      return;
    }
    let rpt = null;
    g.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (k === 'k:pb') { s9NoteOn(S9.mode === 'midi' && S9.page === 2 ? S9.test.key : (s9SM() ? s9SM().root : 60), S9.mode === 'midi' ? S9.test.vel : 100); return; } s9Key(k); if (/^k:(pup|pdn)$/.test(k)) { let n = 0; rpt = setInterval(() => { if (++n > 5) s9Key(k); }, 90); } });
    for (const ev of ['pointerup', 'pointerleave']) g.addEventListener(ev, () => { clearInterval(rpt); rpt = null; if (k === 'k:pb') for (const n of [...S9.held]) s9NoteOff(n); });
  });
  document.querySelectorAll('[data-s9b="save"]').forEach((b) => b.addEventListener('click', () => s9SaveWav()));
  // ---- the keyboard under the panel (C1 to C5), the computer keys, MIDI in ----
  const s9kbEl = document.getElementById('s9kb');
  if (s9kbEl) {
    const lo = 36, hi = 84, whites = []; for (let n = lo; n <= hi; n++) if (![1, 3, 6, 8, 10].includes(n % 12)) whites.push(n);
    const ww = 2093 / whites.length;
    whites.forEach((n, i) => { const e = document.createElement('i'); e.dataset.n = n; e.style.left = (i * ww) + 'px'; e.style.width = ww + 'px'; if (n % 12 === 0) e.innerHTML = `<span>${s9Note(n)}</span>`; s9kbEl.appendChild(e); });
    for (let n = lo; n <= hi; n++) if ([1, 3, 6, 8, 10].includes(n % 12)) { const i = whites.indexOf(n - 1), e = document.createElement('i'); e.className = 'b'; e.dataset.n = n; e.style.left = ((i + 1) * ww - ww * 0.32) + 'px'; e.style.width = (ww * 0.64) + 'px'; s9kbEl.appendChild(e); }
    let down = null;
    const at = (e) => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.closest && t.closest('#s9kb i') ? +t.closest('#s9kb i').dataset.n : null; };
    s9kbEl.addEventListener('pointerdown', (e) => { e.preventDefault(); s9kbEl.setPointerCapture(e.pointerId); const n = at(e); if (n != null) { down = n; const r = e.target.getBoundingClientRect(); s9NoteOn(n, Math.round(40 + 87 * Math.min(1, (e.clientY - r.top) / r.height))); } });
    s9kbEl.addEventListener('pointermove', (e) => { if (down == null) return; const n = at(e); if (n != null && n !== down) { s9NoteOff(down); down = n; s9NoteOn(n, 100); } });
    for (const ev of ['pointerup', 'pointercancel']) s9kbEl.addEventListener(ev, () => { if (down != null) s9NoteOff(down); down = null; });
  }
  function s9KbDraw() { if (!s9kbEl) return; for (const e of s9kbEl.children) e.classList.toggle('on', S9.held.has(+e.dataset.n)); }
  const S9KEYS = 'awsedftgyhujk';
  const s9KbOpen = () => typeof isOpen === 'function' && isOpen('s900');
  addEventListener('keydown', (e) => {
    if (!s9KbOpen() || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test((e.target.tagName || ''))) return;
    if (S9.letter) {   // naming from the computer keyboard
      if (e.key === 'Enter') s9Key('k:ent'); else if (e.key === 'Backspace') S9.letter.buf = S9.letter.buf.slice(0, -1); else if (/^[a-zA-Z0-9 #\-.]$/.test(e.key)) S9.letter.buf = (S9.letter.buf + e.key.toUpperCase()).slice(0, 10); else return;
      e.preventDefault(); e.stopPropagation(); return;
    }
    const i = S9KEYS.indexOf(e.key.toLowerCase());
    if (i >= 0) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) s9NoteOn(12 * S9.oct + 12 + i, 100); return; }
    if (e.key === 'z' || e.key === 'x') { e.preventDefault(); e.stopPropagation(); S9.oct = Math.max(1, Math.min(7, S9.oct + (e.key === 'x' ? 1 : -1))); s9Say([`Computer keys from ${s9Note(12 * S9.oct + 12)}`, ''], 900); }
  }, true);
  addEventListener('keyup', (e) => { if (!s9KbOpen()) return; const i = S9KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) { e.stopPropagation(); for (let o = 1; o <= 7; o++) { const n = 12 * o + 12 + i; if (S9.held.has(n)) s9NoteOff(n); } } }, true);
  const s9MidiSel = document.getElementById('s9-midi');
  if (s9MidiSel && navigator.requestMIDIAccess) {
    let acc = null;
    const fill = () => { const v = s9MidiSel.value; s9MidiSel.innerHTML = '<option value="">MIDI IN · computer keys</option>' + [...acc.inputs.values()].map((p) => `<option value="${p.id}">MIDI IN · ${p.name}</option>`).join(''); s9MidiSel.value = v; };
    s9MidiSel.addEventListener('pointerdown', () => { if (!acc) navigator.requestMIDIAccess().then((a) => { acc = a; fill(); a.onstatechange = fill; }).catch(() => s9Say(['MIDI is not available here', ''])); });
    s9MidiSel.addEventListener('change', () => { if (!acc) return; for (const p of acc.inputs.values()) p.onmidimessage = p.id === s9MidiSel.value ? (m) => { const [st, n, v] = m.data, ch = st & 15, t = st & 0xf0; if (!S9.omni && ch !== S9.midiCh) return; if (t === 0x90 && v > 0) s9NoteOn(n, v); else if (t === 0x80 || (t === 0x90 && v === 0)) s9NoteOff(n); } : null; });
  }
  // ---- routing: the channel patched to S900 IN (insert send, direct out or tape out) ----
  function s9Route() {
    const pc = patches.find((q) => q.b === 'fxin:S900' && /^(isend|dir|tout):\d+$/.test(q.a)), n = pc && +pc.a.split(':')[1];
    const ch = n && n <= 24 ? n - 1 : null; if (ch !== S9.ch) { S9.ch = ch; s9Post({ ch }); }
  }
  // ---- the panel ----
  function s9Draw() {
    const now = performance.now(), on = S9.on;
    let l1 = '', l2 = '';
    if (on) {
      if (S9.letter) { const blink = Math.floor(now / 300) % 2; l1 = 'NAME:  type, ENT to finish'; l2 = (S9.letter.buf + (blink ? '_' : ' ')).padEnd(10); }
      else if (S9.msg && S9.msg.until > now) [l1, l2] = S9.msg.t;
      else {
        const { pg, v } = s9Page(); [l1, l2] = v.l;
        if (!pg.steps && !v.noPage) l1 = (S9.field < 0 ? '→' : ' ') + s9pad(S9.page, 2) + ' ' + l1;
        if (S9.field >= 0 && v.f[S9.field]) {   // the arrow sits in front of the selected parameter's "*"
          let c = -1, seen = -1; const both = l1 + '\n' + l2; for (let i = 0; i < both.length; i++) if (both[i] === '*' && ++seen === S9.field - (pg.steps ? 0 : 0)) { c = i; break; }
          if (c >= 0) { if (c < l1.length) l1 = l1.slice(0, c) + '→' + l1.slice(c + 1); else { const j = c - l1.length - 1; l2 = l2.slice(0, j) + '→' + l2.slice(j + 1); } }
        }
      }
    }
    sgTxt('.s9-l1', (l1 || ' ').padEnd(40).slice(0, 40)); sgTxt('.s9-l2', (l2 || ' ').padEnd(40).slice(0, 40));
    for (const e of c1All('s9-lcdbg')) { const c = on ? '#3fae9f' : '#7d8a80'; if (e._c !== c) { e._c = c; e.setAttribute('fill', c); } }
    const err = S9.err > now && Math.floor(now / 180) % 2;
    for (const m of ['play', 'rec', 'esmp', 'eprg', 'midi', 'util', 'disk']) c1Lamp(`s9-m-${m}`, on && (err || (S9.mode === m && !(S9.err > now))));
    c1Lamp('s9-midi', on && S9.midiT > now); c1Lamp('s9-dled', S9.diskT > now && Math.floor(now / 90) % 2); c1Lamp('s9-disk', true);
    for (const k of ['rlev', 'mon', 'out']) for (const g of c1All(`s9-k-${k}`)) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(g.getAttribute('transform') || ''); if (m) g.setAttribute('transform', `rotate(${(-135 + S9[k] * 270).toFixed(1)} ${m[1]} ${m[2]})`); }
    for (const g of c1All('s9-ctl')) { const m = /rotate\([^ ]+ ([^ ]+) ([^)]+)\)/.exec(g.getAttribute('transform') || ''); if (m) g.setAttribute('transform', `rotate(${(S9.ctlA || 0) % 360} ${m[1]} ${m[2]})`); }
    const M = window.S900_M; if (M && S9.rec.state === 'rec' && M.rec !== 'rec' && M.rec !== 'armed') { /* finished: the engine tells us */ } else if (M && S9.rec.state === 'armed' && M.rec === 'rec') S9.rec.state = 'rec';
    const msg = document.getElementById('s9-msg'); if (msg) { const t = `${S9.samples.length} samples · ${S9.programs.length} programs · ${s9Mem()} · input ${S9.ch == null ? 'not patched' : 'CH ' + (S9.ch + 1) + (NAMES[S9.ch] ? ' ' + NAMES[S9.ch] : '')}${M ? ' · ' + M.voices + '/8 voices' : ''}`; if (msg._t !== t) { msg._t = t; msg.textContent = t; } }
  }
  function s900Tick() {
    if (EL.node !== S9.node) { S9.node = EL.node; if (EL.node) s9SendAll(); }
    if (++S9.t % 15 === 0) s9Route();
    if (isOpen('s900') || document.body.classList.contains('racksview')) s9Draw();
  }
