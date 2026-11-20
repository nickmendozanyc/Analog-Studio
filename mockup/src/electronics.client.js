  // ---------------- HJ-24 audio electronics (prototype/electronics/jh24audio.js in an AudioWorklet) ----------------
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
        elPost({ type: 'getTrims' });
      }
      await EL.ctx.resume();
      EL.on = true; EL.statusKey = '';
      elPost({ type: 'mix', mute: false, gain: +document.getElementById('el-gain').value });
      document.getElementById('el-power').classList.add('on'); document.getElementById('el-plate').classList.add('on');
      elMsg(`Electronics on · ${EL.ctx.sampleRate / 1000} kHz · ${tr.speedIPS} ips. Play the tape, or load a transfer.`);
    } catch (err) { elMsg(`Audio could not start: ${err.message}`); }
  }
  function elRecv(d) {
    if (d.type === 'trims') { EL.trims = d.trims; elShowTrims(); }
    else if (d.type === 'debug') window.JH24_DEBUG = d;
    else if (d.type === 'loaded') elMsg(`Track ${d.track + 1} loaded onto the tape.`);
    else if (d.type === 'vu') {
      window.JH24_VU = EL.on ? d.db : null;
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
    tapeViewTick();
    if (!EL.node || !EL.on) return;
    elPost({ type: 'transport', take: tr.take, v: tr.v, lift: tr.lift, mode: tr.mode, ips: tr.speedIPS });
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
      c.querySelectorAll('.tr').forEach((el) => {
        const k = el.dataset.key, ips = el.dataset.ips, v = ips ? t[k][ips] : t[k];
        el.querySelector('.tv').textContent = k === 'crossfeed' ? `${Math.round(v * 100)}%` : `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
        el.querySelector('.scr b').style.transform = `rotate(${(k === 'crossfeed' ? (v - 0.6) * 300 : v * 18).toFixed(0)}deg)`;
      });
      c.querySelectorAll('.sw').forEach((b) => {
        const k = b.dataset.key, alt = k === 'std' ? t.std === 'IEC' : !!t[k];
        b.textContent = alt ? b.dataset.b : b.dataset.a; b.classList.toggle('alt', alt && k === 'biasDefeat');
      });
    });
  }
  if (elRoot) {
    elRoot.querySelectorAll('.ch').forEach((c) => {
      const ch = +c.dataset.ch;
      c.querySelectorAll('.tr').forEach((el) => {
        const k = el.dataset.key, ips = el.dataset.ips ? +el.dataset.ips : null;
        let y0 = null, v0 = 0;
        const get = () => (ips ? EL.trims[ch][k][ips] : EL.trims[ch][k]);
        const put = (v) => { const [lo, hi] = trimRange[k] || [-15, 15]; v = Math.max(lo, Math.min(hi, v)); if (ips) EL.trims[ch][k][ips] = v; else EL.trims[ch][k] = v; elPost({ type: 'trim', ch, key: k, ips, value: v }); elShowTrims(); };
        el.addEventListener('pointerdown', (e) => { if (!EL.trims) { elMsg('Power the electronics first.'); return; } y0 = e.clientY; v0 = get(); el.setPointerCapture(e.pointerId); });
        el.addEventListener('pointermove', (e) => { if (y0 == null) return; const step = (k === 'crossfeed' ? 0.004 : 0.1) * (e.shiftKey ? 0.2 : 1); put(v0 + Math.round((y0 - e.clientY) / 3) * step); });
        el.addEventListener('pointerup', () => { y0 = null; });
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
    $('el-mute').addEventListener('click', (e) => { const on = e.currentTarget.classList.toggle('on'); elPost({ type: 'mix', mute: on }); });
    const osc = () => { const to = $('el-osc-to').value; elPost({ type: 'osc', on: to !== 'off', to, f: +$('el-osc-f').value, db: +$('el-osc-db').value }); };
    ['el-osc-f', 'el-osc-db', 'el-osc-to'].forEach((id) => $(id).addEventListener('change', osc));
    const mrl = () => { const f = $('el-mrl').value; elPost({ type: 'alignTape', on: f !== 'off', f: +f || 1000, std: $('el-mrl-std').value }); if (f !== 'off') elMsg('Alignment tape loaded: press PLAY. Monitor on TAPE to align the repro, CUE to align sync (manual 7.3).'); };
    ['el-mrl', 'el-mrl-std'].forEach((id) => $(id).addEventListener('change', mrl));
    $('el-align').addEventListener('click', () => { if (!EL.node) { elMsg('Power the electronics first.'); return; } elPost({ type: 'align' }); elMsg('All 24 channels aligned: repro, sync, bias (peak + overbias), record level and HF.'); });
    $('el-ol').addEventListener('change', (e) => { elPost({ type: 'opts', opLevel: +e.target.value }); elMsg(`Operating level ${e.target.value} nWb/m: all channels realigned.`); });
    for (const [id, key] of [['el-quior', 'quior'], ['el-hiss', 'hiss'], ['el-wf', 'wf']]) $(id).addEventListener('click', (e) => { const on = e.currentTarget.classList.toggle('on'); elPost({ type: 'opts', [key]: on }); });
    $('el-load').addEventListener('click', () => $('el-file').click());
    $('el-file').addEventListener('change', async (e) => {
      const files = [...e.target.files]; e.target.value = '';
      if (!files.length) return;
      if (!EL.node) await elPower();
      if (!EL.ctx) return;
      const u0 = tr.zero, ips = tr.speedIPS;
      let used = new Set(), n = 0;
      for (const [fi, f] of files.entries()) {
        elMsg(`Decoding ${f.name}…`);
        let buf; try { buf = await EL.ctx.decodeAudioData(await f.arrayBuffer()); } catch (err) { elMsg(`${f.name}: ${err.message}`); continue; }
        if (buf.numberOfChannels > 2) { for (let c = 0; c < Math.min(24, buf.numberOfChannels); c++) { const d = buf.getChannelData(c).slice(); elPost({ type: 'load', track: c, data: d, u0, ips }, [d.buffer]); n++; } continue; }
        const m = /(?:^|[^0-9])(\d{1,2})(?:[^0-9]|$)/.exec(f.name.replace(/\.[^.]+$/, ''));
        let t = m ? +m[1] - 1 : -1; if (t < 0 || t > 23 || used.has(t)) { t = 0; while (used.has(t) && t < 23) t++; }
        used.add(t);
        const d = buf.getChannelData(0).slice(); elPost({ type: 'load', track: t, data: d, u0, ips }, [d.buffer]); n++;
      }
      elMsg(`${n} track${n === 1 ? '' : 's'} on the tape from the counter zero at ${ips} ips. Monitor on TAPE and press PLAY.`);
    });
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
    b.addEventListener('click', () => {
      const n = b.dataset.tk;
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
    });
  });
  function tapeViewTick() {
    if (!tpMsg || tpOv.hidden) return;
    const c = tr.counter, a = Math.abs(c), names = { stop: 'STOP', play: 'PLAY', rec: 'RECORD', rplay: 'REV PLAY', ff: 'F FWD', rew: 'REWIND', locate: 'LOCATE', shuttle: 'SHUTTLE' };
    tpMsg.textContent = `${c < 0 ? '-' : ''}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(Math.floor(a % 60)).padStart(2, '0')} · ${names[tr.mode] || tr.mode.toUpperCase()} · ${tr.speedIPS} ips${tr.varispeed ? ` ${tr.varispeed > 0 ? '+' : ''}${(tr.varispeed * 100).toFixed(1)} %` : ''}${tr.liftDefeat ? ' · LIFT' : ''} · space play/stop · , rewind · . fast forward · Z zero`;
  }
