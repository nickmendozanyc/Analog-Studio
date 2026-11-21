  // ---------------- JH-Tape audio electronics (prototype/electronics/jh24audio.js in an AudioWorklet) ----------------
  // POWER starts the engine. Every frame the shared transport and the monitoring status (AutoLocator TAPE / INPUT /
  // AUTO, record-ready and input keys, the cards' CUE keys) go to the worklet; it sends back VU levels and sources.
  const EL = { ctx: null, node: null, on: false, trims: null, cue: new Set(), solo: -1, statusKey: '', mrl: 'off', live: null };
  window.JH24_VU = null;
  const elRoot = document.getElementById('elec');
  const elMsg = (t) => { const m = document.getElementById('el-msg'); if (m) m.textContent = t; };
  const elPost = (d, tr2) => { if (EL.node) EL.node.port.postMessage(d, tr2 || []); };
  window.JH24_POST = elPost;
  async function elPower() {
    if (EL.on) {   // power down
      EL.on = false; elPost({ type: 'mix', mute: true }); try { await EL.ctx.suspend(); } catch (e) {}
      document.getElementById('el-power').classList.remove('on'); document.getElementById('el-plate').classList.remove('on'); window.JH24_VU = null;
      elMsg('Electronics off.'); return;
    }
    try {
      if (!EL.ctx) {
        EL.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
        const src = document.getElementById('jh24-worklet-src').textContent;
        try { await EL.ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([src], { type: 'application/javascript' }))); }
        catch (e) { await EL.ctx.audioWorklet.addModule(`data:application/javascript;charset=utf-8,${encodeURIComponent(src)}`); }   // file:// pages
        EL.node = new AudioWorkletNode(EL.ctx, 'jh24-electronics', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] });
        EL.node.connect(EL.ctx.destination);
        EL.node.port.onmessage = (e) => elRecv(e.data);
        EL.node.port.postMessage({ type: 'opts', opLevel: TP.opLevel || window.JH_TAPES[TP.key].ol });
        EL.node.port.postMessage({ type: 'tape', key: TP.key, params: window.JH_TAPES[TP.key], align: TP.aligned !== false });
        elPost({ type: 'getTrims' });
      }
      await EL.ctx.resume();
      EL.on = true; EL.statusKey = '';
      elPost({ type: 'mix', mute: false, gain: +document.getElementById('el-gain').value });
      document.getElementById('el-power').classList.add('on'); document.getElementById('el-plate').classList.add('on');
      elMsg(`Electronics on · ${EL.ctx.sampleRate / 1000} kHz · ${tr.speedIPS} ips. Play the tape, or load a transfer.`);
      if (!EL.demo && window.DEMO) {   // the session reel: one minute of dummy audio on 1-8, SMPTE on 24, from the counter zero
        EL.demo = true;
        const d = window.DEMO(EL.ctx.sampleRate, encode);
        d.tracks.forEach((x, t) => { if (x) elPost({ type: 'load', track: t, data: x, u0: tr.zero, ips: tr.speedIPS }, [x.buffer]); });
        EL.quietLoads = d.tracks.filter(Boolean).length;
        if (tr.mode === 'stop') tr.locate(tr.zero); else if (tr.playingMode) tr.locateTo(tr.zero, 'play');   // a wind is left alone
        elMsg(`Demo tape loaded: 1 kick · 2 snare · 3 hats · 4 toms · 5-6 overheads · 7 bass · 8 guitar · 24 SMPTE 30 fps (from 01:00:00:00), 1:00 at ${tr.speedIPS} ips, ${d.bpm} BPM.`);
      }
    } catch (err) { elMsg(`Audio could not start: ${err.message}`); }
  }
  function elRecv(d) {
    if (d.type === 'trims') { EL.trims = d.trims; elShowTrims(); }
    else if (d.type === 'debug') window.JH24_DEBUG = d;
    else if (d.type === 'reel') { const w = EL.waiting && EL.waiting[d.id]; if (w) { delete EL.waiting[d.id]; w(d); } }
    else if (d.type === 'loaded') { if (EL.quietLoads > 0) EL.quietLoads--; else elMsg(`Track ${d.track + 1} loaded onto the tape.`); }
    else if (d.type === 'vu') {
      window.JH24_VU = EL.on ? d.db : null; EL.locked = d.locked; EL.aTake = d.take; EL.aTime = performance.now();
      if (elRoot && !elRoot.closest('.overlay').hidden) elRoot.querySelectorAll('.ch').forEach((c) => {
        const i = +c.dataset.ch, db = d.db[i], s = d.src[i];
        c.querySelector('.vub i').style.width = `${Math.max(0, Math.min(100, (db + 20) / 23 * 100)).toFixed(1)}%`;
        const t = c.querySelector('.src'); const lab = s === 'input' ? 'IN' : s === 'cue' ? 'CUE' : 'REP';
        if (t.textContent !== lab) { t.textContent = lab; t.className = `src ${s === 'input' ? 'in' : s === 'cue' ? 'cue' : ''}`; }
      });
    }
  }
  // per frame: transport and status
  function elecTick() {
    tapeViewTick(); elTransportTick();
    if (!EL.node || !EL.on) return;
    // quartz lock: the tape at the heads (the audio engine) is the master; the screen's transport follows it, so the
    // reels, counters and autolocator show what you hear and nothing chases anything
    if (EL.locked && tr.playingMode && EL.aTime) {
      const est = EL.aTake + tr.v * (performance.now() - EL.aTime) / 1000, e = est - tr.take;
      if (Math.abs(e) < 0.3) tr.take += e * 0.25;
    }
    elPost({ type: 'transport', take: tr.take, v: tr.v, lift: tr.lift, mode: tr.mode, ips: tr.speedIPS, vari: tr.varispeed || 0, rS: tr.rS, rT: tr.rT, acc: tr.acc, eot: tr.endOfTape });
    const master = { tape: AL.mon === 'tape', input: AL.mon === 'input', auto: AL.mon === 'auto' };
    const key = `${AL.mon}|${[...AL.ready].join(',')}|${[...AL.inMon].join(',')}|${[...EL.cue].join(',')}`;
    if (key !== EL.statusKey) { EL.statusKey = key; elPost({ type: 'status', master, ready: [...AL.ready], cue: [...EL.cue], inputs: [...AL.inMon] }); }
  }
  // trims: drag up / down (0.1 dB per 3 px, shift for fine), double-click restores the factory alignment
  const trimRange = { crossfeed: [0, 1.2], bias: [-6, 10] };
  function elShowTrims() {
    if (!EL.trims || !elRoot) return;
    elRoot.querySelectorAll('.ch').forEach((c) => {
      const t = EL.trims[+c.dataset.ch];
      c.querySelectorAll('.tr:not(.inert)').forEach((el) => {
        const k = el.dataset.key, ips = el.dataset.ips, v = ips ? t[k][ips] : t[k];
        el.querySelector('.tv').textContent = k === 'crossfeed' ? `${Math.round(v * 100)}%` : `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
        el.querySelector('.scr b').style.transform = `rotate(${(k === 'crossfeed' ? (v - 0.6) * 300 : v * 18).toFixed(0)}deg)`;
      });
      c.querySelectorAll('.sw').forEach((b) => {
        const k = b.dataset.key, alt = k === 'std' ? t.std === 'IEC' : !!t[k];
        if (b.classList.contains('push')) {   // round push switch: lit when in (BIAS DEFEAT); NAB / IEC shows on its indicators
          if (k === 'biasDefeat') b.classList.toggle('on', alt);
          const ind = b.parentElement.querySelector('.ind'); if (ind) { ind.querySelector('.n').classList.toggle('on', !alt); ind.querySelector('.i').classList.toggle('on', alt); }
        } else { b.textContent = alt ? b.dataset.b : b.dataset.a; b.classList.toggle('alt', alt && k === 'biasDefeat'); }
      });
    });
  }
  if (elRoot) {
    elRoot.querySelectorAll('.ch').forEach((c) => {
      const ch = +c.dataset.ch;
      c.querySelectorAll('.tr:not(.inert)').forEach((el) => {
        const k = el.dataset.key, ips = el.dataset.ips ? +el.dataset.ips : null;
        let y0 = null, v0 = 0;
        const get = () => (ips ? EL.trims[ch][k][ips] : EL.trims[ch][k]);
        const put = (v) => { const [lo, hi] = trimRange[k] || [-15, 15]; v = Math.max(lo, Math.min(hi, v)); if (ips) EL.trims[ch][k][ips] = v; else EL.trims[ch][k] = v; elPost({ type: 'trim', ch, key: k, ips, value: v }); elShowTrims(); elMsg(`${el.dataset.name || k}: ${k === 'crossfeed' ? `${Math.round(v * 100)} %` : `${v >= 0 ? '+' : ''}${v.toFixed(1)} dB`}`); };
        el.addEventListener('pointerdown', (e) => { if (!EL.trims) { elMsg('Power the electronics first.'); return; } y0 = e.clientY; v0 = get(); el.setPointerCapture(e.pointerId); el.classList.add('drag'); });
        el.addEventListener('pointermove', (e) => { if (y0 == null) return; const step = (k === 'crossfeed' ? 0.004 : 0.1) * (e.shiftKey ? 0.2 : 1); put(v0 + Math.round((y0 - e.clientY) / 3) * step); });
        el.addEventListener('pointerup', () => { y0 = null; el.classList.remove('drag'); });
        el.addEventListener('dblclick', () => { if (EL.node) { elPost({ type: 'align', ch }); elMsg(`Channel ${ch + 1} realigned to the factory settings.`); } });
      });
      c.querySelectorAll('.sw').forEach((b) => b.addEventListener('click', () => {
        if (!EL.trims) { elMsg('Power the electronics first.'); return; }
        const k = b.dataset.key, t = EL.trims[ch];
        const v = k === 'std' ? (t.std === 'NAB' ? 'IEC' : 'NAB') : !t[k];
        t[k] = v; elPost({ type: 'trim', ch, key: k, value: v }); elShowTrims();
        if (k === 'biasDefeat') elMsg(v ? `Track ${ch + 1}: BIAS DEFEAT, recording only erases (spot erase).` : `Track ${ch + 1}: bias normal.`);
      }));
      c.querySelector('.cue').addEventListener('click', (e) => { if (EL.cue.has(ch)) EL.cue.delete(ch); else EL.cue.add(ch); e.currentTarget.classList.toggle('on', EL.cue.has(ch)); });
      c.querySelector('.solo').addEventListener('click', () => { EL.solo = EL.solo === ch ? -1 : ch; elRoot.querySelectorAll('.solo').forEach((s) => s.classList.toggle('on', +s.closest('.ch').dataset.ch === EL.solo)); elPost({ type: 'mix', solo: EL.solo }); });
      c.querySelector('.clr').addEventListener('click', () => { if (confirm(`Bulk-erase track ${ch + 1}?`)) { elPost({ type: 'clear', track: ch }); elMsg(`Track ${ch + 1} erased.`); } });
    });
    const $ = (id) => document.getElementById(id);
    $('el-power').addEventListener('click', elPower);
    $('el-plate').addEventListener('dblclick', (e) => { e.stopPropagation(); elPower(); });
    $('el-gain').addEventListener('input', (e) => elPost({ type: 'mix', gain: +e.target.value }));
    const mech = () => elPost({ type: 'machine', level: $('el-mech-on').classList.contains('on') ? +$('el-mech').value : 0 });
    $('el-mech').addEventListener('input', mech);
    $('el-mech-on').addEventListener('click', (e) => { e.currentTarget.classList.toggle('on'); mech(); });
    $('el-mute').addEventListener('click', (e) => { const on = e.currentTarget.classList.toggle('on'); elPost({ type: 'mix', mute: on }); });
    const osc = () => { const to = $('el-osc-to').value; elPost({ type: 'osc', on: to !== 'off', to, f: +$('el-osc-f').value, db: +$('el-osc-db').value }); };
    ['el-osc-f', 'el-osc-db', 'el-osc-to'].forEach((id) => $(id).addEventListener('change', osc));
    const mrl = () => { const f = $('el-mrl').value; elPost({ type: 'alignTape', on: f !== 'off', f: +f || 1000, std: $('el-mrl-std').value }); if (f !== 'off') elMsg('Alignment tape loaded: press PLAY. Monitor on TAPE to align the repro, CUE to align sync (manual 7.3).'); };
    ['el-mrl', 'el-mrl-std'].forEach((id) => $(id).addEventListener('change', mrl));
    $('el-align').addEventListener('click', () => { if (!EL.node) { elMsg('Power the electronics first.'); return; } elPost({ type: 'align' }); TP.aligned = true; TP.alignedFor = window.JH_TAPES[TP.key].short; alignLamp(); elMsg(`All 24 channels aligned for ${window.JH_TAPES[TP.key].name}: repro, sync, bias (peak + overbias), record level and HF.`); });
    $('el-ol').addEventListener('change', (e) => { TP.opLevel = +e.target.value; elPost({ type: 'opts', opLevel: +e.target.value }); elMsg(`Operating level ${e.target.value} nWb/m: all channels realigned.`); });
    for (const [id, key] of [['el-quior', 'quior'], ['el-hiss', 'hiss'], ['el-wf', 'wf']]) $(id).addEventListener('click', (e) => { const on = e.currentTarget.classList.toggle('on'); elPost({ type: 'opts', [key]: on }); });
    $('el-load').addEventListener('click', () => $('el-file').click());
    $('el-file').addEventListener('change', (e) => { const files = [...e.target.files]; e.target.value = ''; EL.importAudio(files); });
    // audio files onto tape tracks: numbered names go to their track, a multichannel file fills 1-24 (any format the
    // browser decodes: WAV, AIFF, FLAC, MP3, AAC / M4A, OGG / Opus, CAF ...). Placed at the counter zero.
    EL.importAudio = async (files, say = elMsg) => {
      if (!files.length) return 0;
      if (!EL.node) await elPower();
      if (!EL.ctx) return 0;
      const u0 = tr.zero, ips = tr.speedIPS;
      let used = new Set(), n = 0;
      for (const [fi, f] of files.entries()) {
        say(`Decoding ${f.name}…`);
        let buf; try { buf = await EL.ctx.decodeAudioData(await f.arrayBuffer()); } catch (err) { say(`${f.name}: this browser can't decode it (${err.message})`); continue; }
        if (buf.numberOfChannels > 2) { for (let c = 0; c < Math.min(24, buf.numberOfChannels); c++) { const d = buf.getChannelData(c).slice(); elPost({ type: 'load', track: c, data: d, u0, ips }, [d.buffer]); n++; } continue; }
        const m = /(?:^|[^0-9])(\d{1,2})(?:[^0-9]|$)/.exec(f.name.replace(/\.[^.]+$/, ''));
        let t = m ? +m[1] - 1 : -1; if (t < 0 || t > 23 || used.has(t)) { t = 0; while (used.has(t) && t < 23) t++; }
        used.add(t);
        const d = buf.getChannelData(0).slice(); elPost({ type: 'load', track: t, data: d, u0, ips }, [d.buffer]); n++;
      }
      say(`${n} track${n === 1 ? '' : 's'} on the tape from the counter zero at ${ips} ips. Monitor on TAPE and press PLAY.`);
      return n;
    };
    $('el-live').addEventListener('click', async (e) => {
      const b = e.currentTarget;
      if (EL.live) { EL.live.getTracks().forEach((t) => t.stop()); EL.live = null; b.classList.remove('on'); elPost({ type: 'live', on: false }); return; }
      if (!EL.node) await elPower();
      try {
        EL.live = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
        EL.ctx.createMediaStreamSource(EL.live).connect(EL.node); b.classList.add('on'); elPost({ type: 'live', on: true });
        elMsg('Live input feeds the record-ready tracks.');
      } catch (err) { elMsg(`No audio input: ${err.message}`); }
    });
  }

  // ---------------- tape machine pop-up: the magnified studio deck's panel keys ----------------
  const tpMsg = document.getElementById('tp-msg'), tpOv = document.getElementById('ov-tape');
  document.querySelectorAll('#tapeview .tpk').forEach((b) => {
    b.addEventListener('pointerdown', () => b.classList.add('dn')); ['pointerup', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => b.classList.remove('dn')));
    b.addEventListener('click', () => tapeKey(b.dataset.tk));
  });
  function tapeKey(n) {
    {
      if (['rew', 'ff', 'stop', 'play', 'record', 'loc', 'sto', 'rsttape', 'auto'].includes(n)) press(n);
      else if (n === 'rtz') { AL.rehPunch = false; tr.locateTo(tr.zero, 'stop'); }
      else if (n === 'safe') AL.ready.clear();
      else if (n === 'mon') press(AL.mon === 'tape' ? 'input' : AL.mon === 'input' ? 'auto' : 'tape');
      else if (n === 'rplay') { AL.rehPunch = false; tr.command('rplay'); }
      else if (n === 'lift') tr.liftDefeat = !tr.liftDefeat;
      else if (n === 'vari') press('mode');
      else if (n.startsWith('s')) tr.setSpeed(+n.slice(1));
      else if (n === 'elec') show('elec');
      else if (n === 'edit') { if (tpMsg) tpMsg.textContent = 'EDIT (dump edit) is not modelled yet'; }
      else if (['tape', 'input'].includes(n)) press(n);
    }
  }
  // electronics window transport bar
  document.querySelectorAll('#elec .eltr .tk').forEach((b) => b.addEventListener('click', () => tapeKey(b.dataset.tk)));
  const elCtr = document.getElementById('el-ctr'), elMode = document.getElementById('el-mode'), elLoc = document.getElementById('el-loc'), elOv = document.getElementById('ov-elec');
  const elTk = {}; document.querySelectorAll('#elec .eltr .tk').forEach((b) => { elTk[b.dataset.tk] = b; });
  const mmss = (t) => `${t < -0.5 ? '-' : ''}${String(Math.floor(Math.abs(t) / 60)).padStart(2, '0')}:${String(Math.floor(Math.abs(t) % 60)).padStart(2, '0')}`;
  function elTransportTick() {
    if (!elCtr || elOv.hidden) return;
    const m = tr.mode, names = { stop: 'STOP', play: 'PLAY', rec: 'RECORD', rplay: 'REV PLAY', ff: 'F FWD', rew: 'REWIND', locate: 'LOCATE', shuttle: 'SHUTTLE' };
    elCtr.textContent = mmss(tr.counter); elMode.textContent = names[m] || m.toUpperCase(); elLoc.textContent = AL.entry ? AL.entry.padStart(4, '0').replace(/(..)(..)/, '$1:$2') : mmss(AL.loc);
    const on = { play: m === 'play' || m === 'rec', stop: m === 'stop', record: m === 'rec', ff: m === 'ff' || (m === 'locate' && tr.v > 0), rew: m === 'rew' || (m === 'locate' && tr.v < 0), loc: m === 'locate', 's7.5': tr.speedIPS === 7.5, s15: tr.speedIPS === 15, s30: tr.speedIPS === 30, lift: tr.liftDefeat, tape: AL.mon === 'tape', input: AL.mon === 'input', auto: AL.mon === 'auto' };
    const q = document.getElementById('el-quartz'); if (q) { const on = !!(EL.on && EL.locked && tr.playingMode); if (q._on !== on) { q._on = on; q.classList.toggle('on', on); q.lastChild.textContent = tr.varispeed ? 'VARI LOCK' : 'QUARTZ LOCK'; } }
    for (const [k, b] of Object.entries(elTk)) { const v = !!on[k]; if (b._on !== v) { b._on = v; b.classList.toggle('on', v); } }
  }
  function tapeViewTick() {
    if (!tpMsg || tpOv.hidden) return;
    const c = tr.counter, a = Math.abs(c), names = { stop: 'STOP', play: 'PLAY', rec: 'RECORD', rplay: 'REV PLAY', ff: 'F FWD', rew: 'REWIND', locate: 'LOCATE', shuttle: 'SHUTTLE' };
    tpMsg.textContent = `${c < 0 ? '-' : ''}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(Math.floor(a % 60)).padStart(2, '0')} · ${names[tr.mode] || tr.mode.toUpperCase()} · ${tr.speedIPS} ips${tr.varispeed ? ` ${tr.varispeed > 0 ? '+' : ''}${(tr.varispeed * 100).toFixed(1)} %` : ''}${tr.liftDefeat ? ' · LIFT' : ''} · space play/stop · , rewind · . fast forward · Z zero`;
  }

  // ---------------- tapes: swap the reel on the machine (every deck view) and the formulation in the electronics ----
  // Each tape is its own reel: what is recorded on it, where it is wound to and its time code go with it.
  function setReelSkin(k, style) {
    const sk = window.JH_SKINS && window.JH_SKINS[k] && window.JH_SKINS[k][style]; if (!sk) return;
    // flange size: a 14" reel is bigger than a 10½" one around the same hub
    const geo = (el) => { Object.assign(el.style, { left: `${(sk.cx - sk.r).toFixed(2)}px`, top: `${(sk.cy - sk.r).toFixed(2)}px`, width: `${(2 * sk.r).toFixed(2)}px`, height: `${(2 * sk.r).toFixed(2)}px` }); };
    for (const pre of ['jh', 'a8', 'jhp', 'a8p']) {
      document.querySelectorAll(`.${pre}-fl[data-reel="${k}"], .${pre}-smear[data-reel="${k}"], .${pre}-lab[data-reel="${k}"], .${pre}-light[data-reel="${k}"], .${pre}-ring[data-reel="${k}"]`).forEach(geo);
      document.querySelectorAll(`.${pre}-lab[data-reel="${k}"] svg`).forEach((el) => { const w = (2 * sk.r).toFixed(2); el.setAttribute('width', w); el.setAttribute('height', w); el.setAttribute('viewBox', `0 0 ${w} ${w}`); });
      document.querySelectorAll(`.${pre}-smear[data-reel="${k}"]:not(.${pre}-smearback), .${pre}-light[data-reel="${k}"]`).forEach((el) => { el.style.webkitMaskImage = sk.bandMask; el.style.maskImage = sk.bandMask; });
      document.querySelectorAll(`.${pre}-fl[data-reel="${k}"]`).forEach((el) => { el.style.background = sk[el.dataset.layer]; el.style.clipPath = `path(evenodd, '${sk.d}')`; });
      document.querySelectorAll(`.${pre}-lab[data-reel="${k}"] svg`).forEach((el) => { el.innerHTML = sk.label; });
      document.querySelectorAll(`.${pre}-smear[data-reel="${k}"]`).forEach((el) => {
        if (el.classList.contains(`${pre}-smearback`)) { el.style.background = sk.backBg; return; }
        Object.assign(el.dataset, { slots: sk.slots, slotw: sk.slotW, lab: sk.labs, labw: sk.labW, hole: sk.hole, labc: sk.labc, labk: sk.labk, avg: sk.faceAvg });
        el.style.background = sk.faceAvg;
      });
      document.querySelectorAll(`.${pre}-light[data-reel="${k}"]`).forEach((el) => { el.style.background = sk.lightBg; });
      document.querySelectorAll(`.${pre}-ring[data-reel="${k}"]`).forEach((el) => { el.style.background = sk.ringBg; });
    }
    for (const rl of reels) if (rl.k === k) rl.smKey = '';   // redraw the exposure smear for the new windows
  }
  const TP = { key: 'a499', store: {}, aligned: true, alignedFor: 'Amtex 499', opLevel: 370 };
  function threadTape(key) {
    const t = window.JH_TAPES[key]; if (!t || key === TP.key) return;
    AL.rep = false; AL.rehPunch = false; tr.command('stop');
    TP.store[TP.key] = { take: tr.take, zero: tr.zero, stripes: SBX.stripes };
    const sv = TP.store[key] || { take: 0.6, zero: 0.6, stripes: [] };   // a fresh reel: at the head, leader on, no code yet
    TP.key = key;
    tr.total = t.ft * FT;   // 2500 ft on a 10½" reel, 5000 ft on the 14" GP9
    tr.locate(sv.take); tr.zero = sv.zero; SBX.stripes = sv.stripes;
    setReelSkin('s', t.reel);
    elPost({ type: 'tape', key, params: t });
    if (document.getElementById('tape-auto').checked) alignForTape();
    else { TP.aligned = false; alignLamp(); elMsg(`${t.name} threaded, alignment left as it was (for ${TP.alignedFor || 'the previous tape'}). Press ALIGN, or align by hand with the alignment tape.`); }
  }
  // realign for the threaded tape: its recommended operating level, then section 7 on every channel
  function alignForTape() {
    const t = window.JH_TAPES[TP.key], ol = document.getElementById('el-ol');
    if (ol) ol.value = String(t.ol);
    TP.opLevel = t.ol; TP.aligned = true; TP.alignedFor = t.short;
    elPost({ type: 'opts', opLevel: t.ol }); elPost({ type: 'align' });
    alignLamp();
    elMsg(`Aligned for ${t.name} at ${t.ol} nWb/m: repro, sync, bias (peak + overbias for this tape), record level and HF on all 24 channels.`);
  }
  function alignLamp() { const b = document.getElementById('tape-align'); if (b) { b.classList.toggle('done', !!TP.aligned); b.textContent = TP.aligned ? 'ALIGNED' : 'ALIGN'; } }
  const tapeAlignBtn = document.getElementById('tape-align');
  if (tapeAlignBtn) tapeAlignBtn.addEventListener('click', alignForTape);
  const tapeSel = document.getElementById('tape-sel'), takeSel = document.getElementById('takeup-sel');
  if (tapeSel) tapeSel.addEventListener('change', () => threadTape(tapeSel.value));
  if (takeSel) takeSel.addEventListener('change', () => setReelSkin('t', takeSel.value));

  // PLAY or RECORD with the electronics off powers them up (the click or key press lets the browser start audio)
  window.AS_AUTOPOWER = () => { if (!EL.on && !EL.starting) { EL.starting = true; elPower().finally(() => { EL.starting = false; }); } };
  tr.locate(tr.zero);   // the session reel starts parked at the counter zero (the head of the demo)
  window.JH24_NODE = () => EL.node && [EL.ctx, EL.node];   // for testing
