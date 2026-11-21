  // ---------------- house sync generator (Hollis SG-24) and two-machine synchronizer (Addison-Smyth Delta-Three) ------
  // SG-24: the studio's master clock. Word clock, black burst (NTSC / PAL), tri-level, a capstan reference for the tape
  // machine and a time-code generator (LTC + MTC). Pull-up / pull-down moves all of them together.
  // Delta-Three: chases the JH-Tape (slave, code read off track 24) to a master: the SG-24's generator, or MTC from a DAW.
  // With the SG-24's reference on the capstan and the master on the same house sync, it resolves to the reference.
  const SG = {
    rates: [44100, 48000, 88200, 96000, 176400, 192000], rateI: 1,
    pulls: [0, 0.001, -0.001, 0.04, -0.04], pullI: 0,
    videos: [['NTSC', 29.97, true], ['NTSC', 29.97, false], ['PAL', 25, false], ['FILM', 24, false], ['TC', 30, false]], videoI: 4,
    run: false, tc: 3600, start: 3600, capRef: true, mtcOut: null, lastQF: null, phase: 0,
  };
  const DZ = { on: false, src: 'gen', ref: true, trk: new CodeTracker({ flywheel: 0.6 }), ch: new Chaser(), mtc: { pieces: [], F: null, fps: 30, k: -1 }, msg: '',
    masterEn: true, hold: false, item: 1, tightMode: false, tight: false, shL: false, shR: false };
  const DZ_ITEMS = ['G_TC', 'M_TC', 'S_TC', 'S_OFS', 'S_ERR', 'S_SPD'];   // display items (Zeta naming: group letter _ item)
  const sgRef = () => 1 + SG.pulls[SG.pullI];
  const sgFps = () => SG.videos[SG.videoI][1];
  const tcStr = (sec, fps) => { const f = Math.round(fps), n = Math.floor(sec * fps + 1e-6); const fr = ((n % f) + f) % f, s = Math.floor(n / f); return `${String(Math.floor(s / 3600) % 24).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}:${String(fr).padStart(2, '0')}`; };
  // the slave's code on tape <-> its tape position (the stripes on the reel, as the SBX reads them)
  // (the stripes hold code relative to 01:00:00:00, as the wall clock shows it; the synchronizer works in absolute time code)
  const slaveCode = () => { const c = tapeCode(tr.take); return c == null ? null : 3600 + c; };
  const codeToTake = (abs) => { const code = abs - 3600; for (const s of SBX.stripes) { const tk = s.take0 + (code - s.code0) * s.speed; if (tk >= s.take0 - 1 && tk <= s.take1 + 1) return Math.max(0, Math.min(tr.total, tk)); } return null; };
  // MIDI: MTC in (quarter frames + full frame), MTC out from the generator
  let sgMidi = null;
  async function sgMidiAccess() { if (sgMidi) return sgMidi; if (!navigator.requestMIDIAccess) throw new Error('this browser has no Web MIDI (use Chrome or Edge)'); sgMidi = await navigator.requestMIDIAccess({ sysex: true }).catch(() => navigator.requestMIDIAccess()); return sgMidi; }
  function mtcIn(e) {
    const d = e.data, t = (e.timeStamp || performance.now()) / 1000, M = DZ.mtc;
    if (d[0] === 0xf1) {   // quarter frame: piece n carries a nibble; piece 0 goes out at the start of the frame it describes
      const n = d[1] >> 4, v = d[1] & 15; M.pieces[n] = v;
      if (n === 7) {
        const p = M.pieces, fr = p[0] | (p[1] << 4), sc = p[2] | (p[3] << 4), mn = p[4] | (p[5] << 4), hr = p[6] | ((p[7] & 1) << 4), ty = (p[7] >> 1) & 3;
        M.fps = [24, 25, 29.97, 30][ty]; M.F = ((hr * 60 + mn) * 60 + sc) + fr / Math.round(M.fps) + 2 / M.fps;   // the set described 2 frames ago
        M.base = M.F - 8 / 4 / M.fps;
      }
      if (M.F != null) { const pos = M.base + (n + 8 * (n < 7 ? 1 : 0)) / 4 / M.fps; DZ.trk.input(t, pos); }
    } else if (d[0] === 0xf0 && d[1] === 0x7f && d[3] === 0x01 && d[4] === 0x01) {   // full frame: a locate on the master
      const ty = (d[5] >> 5) & 3, hr = d[5] & 31; M.fps = [24, 25, 29.97, 30][ty];
      const pos = ((hr * 60 + d[6]) * 60 + d[7]) + d[8] / Math.round(M.fps); M.F = null; DZ.trk.pos = null; DZ.trk.input(t, pos);
    }
  }
  async function dzListen(on) {
    try { const m = await sgMidiAccess(); for (const i of m.inputs.values()) i.onmidimessage = on ? mtcIn : null; sgSay(on ? `Listening for MTC on ${[...m.inputs.values()].map((i) => i.name).join(', ') || 'no MIDI inputs'}` : ''); }
    catch (err) { sgSay(`MTC in: ${err.message}`); }
  }
  // generator: time code advances at the reference speed; MTC quarter frames go to the tracker (and the MIDI port)
  function sgTick(dt, now) {
    const ref = sgRef(), fps = sgFps();
    SG.phase = (SG.phase + dt * ref * fps) % 2;   // drives the frame / field LEDs
    if (SG.run) {
      const t0 = SG.tc; SG.tc += dt * ref;
      const q = 1 / (4 * fps);   // quarter frame
      for (let k = Math.ceil(t0 / q); k * q <= SG.tc; k++) {
        const tq = now / 1000 - (SG.tc - k * q) / ref;
        if (DZ.src === 'gen') DZ.trk.input(tq, k * q);
        if (SG.mtcOut) sgSendQF(k, fps, tq);
      }
    } else if (DZ.src === 'gen' && (!DZ.trk.lastStop || now - DZ.trk.lastStop > 200)) { DZ.trk.lastStop = now; DZ.trk.pos = null; DZ.trk.input(now / 1000, SG.tc); }
  }
  function sgSendQF(k, fps, tq) {
    const f = Math.round(fps), n = k % 8, base = Math.floor(k / 8) * 8 / 4 / fps, sec = Math.floor(base + 1e-9), fr = Math.round((base - sec) * fps) % f;
    const hr = Math.floor(sec / 3600) % 24, mn = Math.floor(sec / 60) % 60, sc = sec % 60, ty = fps === 24 ? 0 : fps === 25 ? 1 : fps === 30 ? 3 : 2;
    const nib = [fr & 15, fr >> 4, sc & 15, sc >> 4, mn & 15, mn >> 4, hr & 15, (hr >> 4) | (ty << 1)][n];
    try { SG.mtcOut.send([0xf1, (n << 4) | nib], tq * 1000); } catch (e) { /* port went away */ }
  }
  // synchronizer servo: runs at 100 Hz inside the transport's time step, whatever the screen's frame rate
  function syncAdvance(dt, now) {
    if (!DZ.on || DZ.hold) { tr.advance(dt); return; }
    const h = 0.01; let t = 0;
    // master and slave are read at the same instant: the start of each 10 ms step, before the tape moves
    while (t < dt - 1e-9) { const st = Math.min(h, dt - t); dzStep(st, now / 1000 - (dt - t)); tr.advance(st); t += st; }
  }
  function dzStep(dt, tNow) {
    const m = DZ.masterEn ? DZ.trk.read(tNow) : { valid: false, running: false, pos: null, rate: 0 };
    DZ.ch.ref = DZ.ref && SG.capRef ? sgRef() : null;
    {
      const ps = tr.playSpeed, atSpeed = tr.mode === 'play' && tr.pinch > 0.5 && Math.abs(tr.v - ps) < 0.01 * ps;
      const code = slaveCode();
      const o = DZ.ch.update(dt, m, { code, playing: atSpeed, starting: tr.mode === 'play' && !atSpeed, stopped: tr.mode === 'stop' && Math.abs(tr.v) < 1e-3 });
      if (o.locate != null) { const tk = codeToTake(o.locate); if (tk != null) { AL.rehPunch = false; tr.locateTo(tk, 'stop'); } }
      if (o.play) tr.command('play');
      if (o.stop) tr.command('stop');
      tr.setVarispeed(o.speed || 0);
      DZ.err = code != null && m.valid ? m.pos + DZ.ch.offset - code : null; DZ.tight = !!o.tight;
    }
  }
  // every frame: the generator's reference on the capstan when not chasing, and the displays
  function dzTick(dt) {
    const m = DZ.trk.read(performance.now() / 1000);
    if (DZ.on) { /* the servo runs in syncAdvance */ } else if (SG.capRef) {
      // not chasing, but the capstan runs off the SG-24's reference: pull-up / down moves the tape too
      tr.setVarispeed(SG.pulls[SG.pullI] + (AL.varOn ? AL.vari : 0));
    }
    dzDraw(m);
  }
  // ---- displays and lamps (rack units and their pop-ups share classes)
  // the page is huge: look each selector up once (the rack faces and pop-ups never change) instead of every frame
  const sgCache = new Map();
  const sgAll = (sel, f) => { let l = sgCache.get(sel); if (!l) { l = [...document.querySelectorAll(sel)]; sgCache.set(sel, l); } l.forEach(f); };
  const sgLamp = (cls, on) => sgAll(cls, (e) => { const v = on ? 1 : 0; if (e._v !== v) { e._v = v; e.setAttribute('opacity', v); } });
  const sgTxt = (cls, s) => sgAll(cls, (e) => { if (e.textContent !== s) e.textContent = s; });
  const sgSay = (s) => { DZ.msg = s; const el = document.getElementById('sg-msg'); if (el) el.textContent = s; const z = document.getElementById('dz-msg'); if (z) z.textContent = s; };
  function dzDraw(m) {
    const fps = sgFps(), v = SG.videos[SG.videoI], r = SG.rates[SG.rateI], pull = SG.pulls[SG.pullI];
    sgTxt('.sg-d1', `${(r / 1000).toFixed(r % 1000 ? 1 : 0)}k ${v[0]} ${v[1]}${v[2] ? 'DF' : ''} ${pull ? (pull > 0 ? '+' : '') + (pull * 100).toFixed(1) + '%' : ''}`.trim());
    sgTxt('.sg-d2', tcStr(SG.tc, fps));
    const blink = SG.phase % 1 < 0.5;
    sgLamp('.sg-l-ref', true); sgLamp('.sg-l-wc', true); sgLamp('.sg-l-bb', blink); sgLamp('.sg-l-tri', !blink); sgLamp('.sg-l-ltc', SG.run && blink); sgLamp('.sg-l-mtc', SG.run && !!SG.mtcOut); sgLamp('.sg-l-cap', SG.capRef);
    // synchronizer: the selected item on the 20-character display, with the chase state at the right
    const st = DZ.ch.state, active = DZ.on && !DZ.hold, locked = active && st === 'LOCK', chasing = active && st !== 'IDLE';
    const sc = slaveCode(), sgn = (x) => (x >= 0 ? '+' : '-'), item = DZ_ITEMS[DZ.item];
    const val = {
      G_TC: () => tcStr(SG.tc, fps),
      M_TC: () => (m.valid ? tcStr(m.pos, fps) : '--:--:--:--'),
      S_TC: () => (sc != null ? tcStr(sc, fps) : '--:--:--:--'),
      S_OFS: () => sgn(DZ.ch.offset) + tcStr(Math.abs(DZ.ch.offset), fps),
      S_ERR: () => (DZ.err != null && active ? (Math.abs(DZ.err) < 10 ? `${sgn(DZ.err)}${(Math.abs(DZ.err) * fps).toFixed(3)}F` : `${sgn(DZ.err)}${tcStr(Math.abs(DZ.err), fps)}`) : '----'),
      S_SPD: () => `${sgn(tr.varispeed || 0)}${(Math.abs(tr.varispeed || 0) * 100).toFixed(3)}%`,
    }[item]();
    const tag = !DZ.on ? '' : DZ.hold ? 'HD' : ({ PARK: 'PK', CUE: 'CU', WAIT: 'WT', PULL: 'PL', LOCK: DZ.tight ? 'TL' : 'LK', IDLE: '--' })[st] || '';
    const line = (item.padEnd(6) + val).padEnd(18).slice(0, 18) + tag.padStart(2);   // 6 + up to 12 of value + 2 of state = 20
    sgTxt('.dz-disp', line.slice(0, 20));
    const blink2 = (performance.now() % 500) < 250;
    sgLamp('.dz-l-xref', DZ.ref && SG.capRef);
    sgLamp('.dz-l-mtc', DZ.masterEn && m.running);
    sgLamp('.dz-l-stc', sc != null && tr.mode !== 'stop' && Math.abs(tr.v) > 1e-3);
    sgLamp('.dz-l-chase', chasing && !locked);
    sgLamp('.dz-l-lock', locked && (!DZ.tightMode || DZ.tight || blink2));   // tight mode: the lamp blinks until inside 0.003 frame
    sgLamp('.dz-k-master', DZ.masterEn); sgLamp('.dz-k-slave', DZ.on); sgLamp('.dz-k-midi', DZ.src === 'mtc');
    sgLamp('.dz-k-shl', DZ.shL); sgLamp('.dz-k-shr', DZ.shR); sgLamp('.dz-k-run', SG.run); sgLamp('.dz-k-hold', DZ.hold); sgLamp('.dz-k-tight', DZ.tightMode);
    // pop-up readouts
    sgTxt('#dz-state', DZ.hold && DZ.on ? 'HELD (STOP·CONT)' : DZ.on ? ({ PARK: 'PARKED', CUE: 'WINDING TO CUE', WAIT: 'WAITING FOR MASTER', PULL: 'PULLING IN', LOCK: 'LOCKED', IDLE: 'NO MASTER' })[st] || st : 'OFF');
    sgTxt('#dz-off', `${DZ.ch.offset >= 0 ? '+' : '-'}${tcStr(Math.abs(DZ.ch.offset), fps)}`);
    sgTxt('#dz-err', DZ.err != null && DZ.on ? `${(DZ.err * 1000).toFixed(2)} ms` : '—');
    sgTxt('#dz-spd', `${((tr.varispeed || 0) * 100).toFixed(3)} %`);
  }
  // ---- controls (pop-up keys)
  document.querySelectorAll('[data-sg]').forEach((b) => b.addEventListener('click', async () => {
    const k = b.dataset.sg;
    if (k === 'rate') SG.rateI = (SG.rateI + 1) % SG.rates.length;
    else if (k === 'pull') SG.pullI = (SG.pullI + 1) % SG.pulls.length;
    else if (k === 'video') SG.videoI = (SG.videoI + 1) % SG.videos.length;
    else if (k === 'run') { SG.run = !SG.run; sgSay(SG.run ? 'Time code running' : 'Time code stopped'); }
    else if (k === 'reset') { SG.tc = SG.start; DZ.trk.pos = null; }
    else if (k === 'cap') { SG.capRef = !SG.capRef; if (!SG.capRef && !DZ.on) tr.setVarispeed(AL.varOn ? AL.vari : 0); sgSay(SG.capRef ? 'Capstan reference to the JH-Tape: on' : 'Capstan reference off: the JH-Tape runs on its own crystal'); }
    else if (k === 'mtcout') {
      if (SG.mtcOut) { SG.mtcOut = null; sgSay('MTC out off'); }
      else try { const m = await sgMidiAccess(); const outs = [...m.outputs.values()]; if (!outs.length) throw new Error('no MIDI outputs'); SG.mtcOut = outs[0]; sgSay(`MTC out to ${outs[0].name}`); } catch (err) { sgSay(`MTC out: ${err.message}`); }
    }
    b.closest('.ovsync') && sgKeys();
  }));
  const dzChase = () => { DZ.on = !DZ.on; DZ.hold = false; DZ.ch = Object.assign(new Chaser(), { offset: DZ.ch.offset }); if (!DZ.on) tr.setVarispeed(0); sgSay(DZ.on ? 'Chase on: the JH-Tape follows the master' : 'Chase off'); };
  const dzSrc = () => { DZ.src = DZ.src === 'gen' ? 'mtc' : 'gen'; DZ.trk = new CodeTracker({ flywheel: 0.6 }); dzListen(DZ.src === 'mtc'); if (DZ.src === 'gen') sgSay('Master: the SG-24 time-code generator'); };
  const dzCapture = () => { const fps = sgFps(), m = DZ.trk.read(performance.now() / 1000), c = slaveCode(); if (m.valid && c != null) { DZ.ch.offset = Math.round((c - m.pos) * fps) / fps; sgSay(`Offset captured: ${tcStr(Math.abs(DZ.ch.offset), fps)}${DZ.ch.offset < 0 ? ' (slave behind)' : ''}`); } else sgSay('CAPTURE needs code from both machines'); };
  const dzNudge = (d) => { DZ.ch.offset += d / sgFps() / 4; DZ.item = 3; };   // a quarter frame at a time; shows S_OFS
  document.querySelectorAll('[data-dz]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.dz;
    if (k === 'chase') dzChase();
    else if (k === 'src') dzSrc();
    else if (k === 'ref') DZ.ref = !DZ.ref;
    else if (k === 'capture') dzCapture();
    else if (k === 'zero') DZ.ch.offset = 0;
    else if (k === 'nudge+' || k === 'nudge-') dzNudge(k === 'nudge+' ? 1 : -1);
    sgKeys();
  }));
  // the front panel's own keys (in the pop-up): blue legends direct, red legends after that half's SHIFT
  const DZ_LEFT = ['master', 'slave', 'midi', 'run', 'stop'];
  function dzKey(k) {
    if (k === 'shiftL') { DZ.shL = !DZ.shL; return; }
    if (k === 'shiftR') { DZ.shR = !DZ.shR; return; }
    const left = DZ_LEFT.includes(k), sh = left ? DZ.shL : DZ.shR;
    if (left) DZ.shL = false; else DZ.shR = false;
    const g = (i) => DZ_ITEMS[i][0];
    switch (k) {
      case 'master': if (sh) sgSay('M-REC: record-enable for the master machine (here the master is the SG-24 or a DAW: nothing to arm)'); else { DZ.masterEn = !DZ.masterEn; sgSay(DZ.masterEn ? 'Master code reader enabled' : 'Master disabled: the slave stays where it is'); } break;
      case 'slave': if (sh) sgSay('S-REC: arm tracks on the JH-Tape autolocator; once locked, record punches land on frame'); else dzChase(); break;
      case 'midi': if (sh) { Object.assign(DZ.ch, { parkAhead: 0.1, learned: false, lead: DZ.ch.c.cueLead }); sgSay('LEARN: the slave\'s start-up and wind times will be measured again'); } else dzSrc(); break;
      case 'run': if (sh) { SG.tc = SG.start; DZ.trk.pos = null; sgSay('COPY: generator reset to its start time'); } else { SG.run = !SG.run; sgSay(SG.run ? 'Generator running' : 'Generator stopped'); } break;
      case 'stop':
        if (sh) { const m = DZ.trk.read(performance.now() / 1000), tk = m.valid ? codeToTake(m.pos + DZ.ch.offset) : null; if (tk != null) { AL.rehPunch = false; tr.locateTo(tk, 'stop'); sgSay('GOTO: slave to the master position'); } else sgSay('GOTO: no master code, or that code isn\'t on this tape'); }
        else { DZ.hold = !DZ.hold; if (DZ.hold) { tr.command('stop'); tr.setVarispeed(0); } else DZ.ch = Object.assign(new Chaser(), { offset: DZ.ch.offset, parkAhead: DZ.ch.parkAhead }); sgSay(DZ.hold ? 'STOP: chase held, slave stopped' : 'CONT: chase continues'); }
        break;
      case 'select': if (sh) { const cur = g(DZ.item); do DZ.item = (DZ.item + 1) % DZ_ITEMS.length; while (g(DZ.item) === cur); } else DZ.item = (DZ.item + 1) % DZ_ITEMS.length; break;
      case 'prev': if (sh) { const cur = g(DZ.item); do DZ.item = (DZ.item + DZ_ITEMS.length - 1) % DZ_ITEMS.length; while (g(DZ.item) === cur); } else DZ.item = (DZ.item + DZ_ITEMS.length - 1) % DZ_ITEMS.length; break;
      case 'index': DZ.tightMode = !DZ.tightMode; sgSay(DZ.tightMode ? 'LOCK lamp: tight window (0.003 frame)' : 'LOCK lamp: wide window (0.05 frame)'); break;
      case 'left': case 'right': dzNudge(k === 'right' ? 1 : -1); break;
      case 'clear': if (sh) dzCapture(); else { DZ.ch.offset = 0; DZ.item = 3; sgSay('Offset cleared'); } break;
    }
  }
  document.querySelectorAll('.ovsync [data-dzk]').forEach((g) => g.addEventListener('click', (e) => { e.stopPropagation(); dzKey(g.dataset.dzk); sgKeys(); }));
  function sgKeys() {
    const on = (sel, v) => sgAll(sel, (e) => e.classList.toggle('on', !!v));
    on('[data-sg="run"]', SG.run); on('[data-sg="cap"]', SG.capRef); on('[data-sg="mtcout"]', SG.mtcOut);
    on('[data-dz="chase"]', DZ.on); on('[data-dz="ref"]', DZ.ref);
    sgTxt('[data-dz="src"] .v', DZ.src === 'gen' ? 'SG-24 GEN' : 'MTC IN (ext.)'); sgTxt('[data-sg="rate"] .v', `${SG.rates[SG.rateI] / 1000} kHz`);
    sgTxt('[data-sg="pull"] .v', SG.pulls[SG.pullI] ? `${SG.pulls[SG.pullI] > 0 ? '+' : ''}${SG.pulls[SG.pullI] * 100}%` : '0'); sgTxt('[data-sg="video"] .v', `${SG.videos[SG.videoI][0]} ${SG.videos[SG.videoI][1]}${SG.videos[SG.videoI][2] ? ' DF' : ''}`);
  }
  sgKeys();
  window.AS_SYNC = { SG, DZ };

