  // ---------------- house sync generator (Hollis SG-24) and two-machine synchronizer (Addison-Smyth Delta-Three) ------
  // SG-24: the studio's master clock. Word clock, black burst (NTSC / PAL), tri-level, a capstan reference for the tape
  // machine and a time-code generator (LTC + MTC). Pull-up / pull-down moves all of them together.
  // Delta-Three: chases the HJ-24 (slave, code read off track 24) to a master: the SG-24's generator, or MTC from a DAW.
  // With the SG-24's reference on the capstan and the master on the same house sync, it resolves to the reference.
  const SG = {
    rates: [44100, 48000, 88200, 96000, 176400, 192000], rateI: 1,
    pulls: [0, 0.001, -0.001, 0.04, -0.04], pullI: 0,
    videos: [['NTSC', 29.97, true], ['NTSC', 29.97, false], ['PAL', 25, false], ['FILM', 24, false], ['TC', 30, false]], videoI: 4,
    run: false, tc: 3600, start: 3600, capRef: true, mtcOut: null, lastQF: null, phase: 0,
  };
  const DZ = { on: false, src: 'gen', ref: true, trk: new CodeTracker({ flywheel: 0.6 }), ch: new Chaser(), mtc: { pieces: [], F: null, fps: 30, k: -1 }, msg: '' };
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
    if (!DZ.on) { tr.advance(dt); return; }
    const h = 0.01; let t = 0;
    // master and slave are read at the same instant: the start of each 10 ms step, before the tape moves
    while (t < dt - 1e-9) { const st = Math.min(h, dt - t); dzStep(st, now / 1000 - (dt - t)); tr.advance(st); t += st; }
  }
  function dzStep(dt, tNow) {
    const m = DZ.trk.read(tNow);
    DZ.ch.ref = DZ.ref && SG.capRef ? sgRef() : null;
    {
      const ps = tr.playSpeed, atSpeed = tr.mode === 'play' && tr.pinch > 0.5 && Math.abs(tr.v - ps) < 0.01 * ps;
      const code = slaveCode();
      const o = DZ.ch.update(dt, m, { code, playing: atSpeed, starting: tr.mode === 'play' && !atSpeed, stopped: tr.mode === 'stop' && Math.abs(tr.v) < 1e-3 });
      if (o.locate != null) { const tk = codeToTake(o.locate); if (tk != null) { AL.rehPunch = false; tr.locateTo(tk, 'stop'); } }
      if (o.play) tr.command('play');
      if (o.stop) tr.command('stop');
      tr.setVarispeed(o.speed || 0);
      DZ.err = code != null && m.valid ? m.pos + DZ.ch.offset - code : null;
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
  const sgAll = (sel, f) => document.querySelectorAll(sel).forEach(f);
  const sgLamp = (cls, on) => sgAll(cls, (e) => { const v = on ? 1 : 0; if (e._v !== v) { e._v = v; e.setAttribute('opacity', v); } });
  const sgTxt = (cls, s) => sgAll(cls, (e) => { if (e.textContent !== s) e.textContent = s; });
  const sgSay = (s) => { DZ.msg = s; const el = document.getElementById('sg-msg'); if (el) el.textContent = s; const z = document.getElementById('dz-msg'); if (z) z.textContent = s; };
  function dzDraw(m) {
    const fps = sgFps(), v = SG.videos[SG.videoI], r = SG.rates[SG.rateI], pull = SG.pulls[SG.pullI];
    sgTxt('.sg-d1', `${(r / 1000).toFixed(r % 1000 ? 1 : 0)}k ${v[0]} ${v[1]}${v[2] ? 'DF' : ''} ${pull ? (pull > 0 ? '+' : '') + (pull * 100).toFixed(1) + '%' : ''}`.trim());
    sgTxt('.sg-d2', tcStr(SG.tc, fps));
    const blink = SG.phase % 1 < 0.5;
    sgLamp('.sg-l-ref', true); sgLamp('.sg-l-wc', true); sgLamp('.sg-l-bb', blink); sgLamp('.sg-l-tri', !blink); sgLamp('.sg-l-ltc', SG.run && blink); sgLamp('.sg-l-mtc', SG.run && !!SG.mtcOut); sgLamp('.sg-l-cap', SG.capRef);
    // synchronizer: G_TC (generator / master) or the slave's offset error
    const st = DZ.ch.state, locked = DZ.on && st === 'LOCK', chasing = DZ.on && st !== 'IDLE';
    let line;
    if (!DZ.on) line = `${DZ.src === 'gen' ? 'G' : 'M'}_TC ${m.valid ? tcStr(m.pos, fps) : '--:--:--:--'}`;
    else if (DZ.err != null && Math.abs(DZ.err) < 10) line = `${st.padEnd(4)} ${DZ.err >= 0 ? '+' : '-'}${(Math.abs(DZ.err) * fps).toFixed(2).padStart(5, '0')}F`;
    else line = `${st.padEnd(4)} ${m.valid ? tcStr(m.pos, fps) : '--:--:--:--'}`;
    sgTxt('.dz-disp', line.slice(0, 16));
    sgLamp('.dz-l-wref', DZ.ref && SG.capRef); sgLamp('.dz-l-mtc', DZ.src === 'mtc' && m.running); sgLamp('.dz-l-efc', DZ.src === 'gen' && m.running);
    sgLamp('.dz-l-chase', chasing && !locked); sgLamp('.dz-l-lock', locked);
    sgLamp('.dz-k-master', DZ.on); sgLamp('.dz-k-slave', DZ.on && chasing);
    // pop-up readouts
    sgTxt('#dz-state', DZ.on ? ({ PARK: 'PARKED', CUE: 'WINDING TO CUE', WAIT: 'WAITING FOR MASTER', PULL: 'PULLING IN', LOCK: 'LOCKED', IDLE: 'NO MASTER' })[st] || st : 'OFF');
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
    else if (k === 'cap') { SG.capRef = !SG.capRef; if (!SG.capRef && !DZ.on) tr.setVarispeed(AL.varOn ? AL.vari : 0); sgSay(SG.capRef ? 'Capstan reference to the HJ-24: on' : 'Capstan reference off: the HJ-24 runs on its own crystal'); }
    else if (k === 'mtcout') {
      if (SG.mtcOut) { SG.mtcOut = null; sgSay('MTC out off'); }
      else try { const m = await sgMidiAccess(); const outs = [...m.outputs.values()]; if (!outs.length) throw new Error('no MIDI outputs'); SG.mtcOut = outs[0]; sgSay(`MTC out to ${outs[0].name}`); } catch (err) { sgSay(`MTC out: ${err.message}`); }
    }
    b.closest('.ovsync') && sgKeys();
  }));
  document.querySelectorAll('[data-dz]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.dz, fps = sgFps();
    if (k === 'chase') { DZ.on = !DZ.on; DZ.ch = Object.assign(new Chaser(), { offset: DZ.ch.offset }); if (!DZ.on) tr.setVarispeed(0); sgSay(DZ.on ? 'Chase on: the HJ-24 follows the master' : 'Chase off'); }
    else if (k === 'src') { DZ.src = DZ.src === 'gen' ? 'mtc' : 'gen'; DZ.trk = new CodeTracker({ flywheel: 0.6 }); dzListen(DZ.src === 'mtc'); }
    else if (k === 'ref') DZ.ref = !DZ.ref;
    else if (k === 'capture') { const m = DZ.trk.read(performance.now() / 1000), c = slaveCode(); if (m.valid && c != null) { DZ.ch.offset = Math.round((c - m.pos) * fps) / fps; sgSay(`Offset captured: ${tcStr(Math.abs(DZ.ch.offset), fps)}${DZ.ch.offset < 0 ? ' (slave behind)' : ''}`); } }
    else if (k === 'zero') DZ.ch.offset = 0;
    else if (k === 'nudge+' || k === 'nudge-') DZ.ch.offset += (k === 'nudge+' ? 1 : -1) / fps / 4;   // a quarter frame at a time
    sgKeys();
  }));
  function sgKeys() {
    const on = (sel, v) => sgAll(sel, (e) => e.classList.toggle('on', !!v));
    on('[data-sg="run"]', SG.run); on('[data-sg="cap"]', SG.capRef); on('[data-sg="mtcout"]', SG.mtcOut);
    on('[data-dz="chase"]', DZ.on); on('[data-dz="ref"]', DZ.ref);
    sgTxt('[data-dz="src"] .v', DZ.src === 'gen' ? 'SG-24 GEN' : 'MTC IN'); sgTxt('[data-sg="rate"] .v', `${SG.rates[SG.rateI] / 1000} kHz`);
    sgTxt('[data-sg="pull"] .v', SG.pulls[SG.pullI] ? `${SG.pulls[SG.pullI] > 0 ? '+' : ''}${SG.pulls[SG.pullI] * 100}%` : '0'); sgTxt('[data-sg="video"] .v', `${SG.videos[SG.videoI][0]} ${SG.videos[SG.videoI][1]}${SG.videos[SG.videoI][2] ? ' DF' : ''}`);
  }
  sgKeys();
  window.AS_SYNC = { SG, DZ };

