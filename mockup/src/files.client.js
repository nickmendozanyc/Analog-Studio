  // ---------------- rack file buttons: LOAD · SAVE (.TAP tape reels, .MIX console mixes) · IMPORT · EXPORT (audio) ----------
  const AF = window.ASF, JM = window.JH24M;
  const fbar = document.getElementById('files-bar'), fmsg = document.getElementById('files-msg');
  const fsay = (t) => { if (fmsg) fmsg.textContent = t; };
  const SESSION = 'Midnight Tapes';
  const trackName = (i) => `${String(i + 1).padStart(2, '0')} ${(NAMES[i] || '').replace(/[^\w .-]+/g, '')}`.trim();
  // saving: a plain download outside claude.ai; inside an artifact the viewer confirms each save, and only some file
  // types are allowed there, so the real file goes inside a .zip
  async function offer(name, bytes) {
    const host = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('downloads') : null;
    if (!host) {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes])); a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000); return 'saved';
    }
    const isZip = /\.zip$/i.test(name), file = isZip ? name : `${name.replace(/\.[^.]+$/, '')}.zip`;
    const data = isZip ? bytes : AF.zip([{ name, data: bytes }]);
    try { await host.save({ filename: file, data: new Blob([data]) }); return isZip ? 'saved' : 'zipped'; }
    catch (e) { if (e && e.code === 'declined') return 'declined'; throw e; }
  }
  // reading a stored .zip (ours, or any uncompressed one): its files
  function unzip(u8) {
    const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), out = [];
    let e = u8.length - 22; while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw new Error('not a zip file');
    let p = v.getUint32(e + 16, true);
    for (let k = 0, n = v.getUint16(e + 10, true); k < n; k++) {
      const method = v.getUint16(p + 10, true), size = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
      const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl));
      const start = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true);
      out.push({ name, method, data: u8.slice(start, start + size) });
      p += 46 + nl + xl + cl;
    }
    return out;
  }
  // the threaded reel's recordings and the machine's state, from the audio engine
  function reelData(key) {
    if (!EL.node) return Promise.resolve(null);
    return new Promise((res) => { const id = Math.random().toString(36).slice(2); (EL.waiting = EL.waiting || {})[id] = res; elPost({ type: 'getReel', key, id }); setTimeout(() => { if (EL.waiting[id]) { delete EL.waiting[id]; res(null); } }, 8000); });
  }

  // ---- .TAP: the reel on the machine
  async function saveTap() {
    fsay('Reading the tape…');
    const r = await reelData(TP.key);
    const meta = {
      format: 'jh-studio-tap', version: 1, tape: TP.key, takeup: document.getElementById('takeup-sel').value,
      total: tr.total, take: tr.take, zero: tr.zero, ips: tr.speedIPS,
      smpte: SBX.stripes, tempo: { bars: SBX.bars, offset: SBX.offset, tempo: SBX.tempo, manual: SBX.manual }, locate: { loc: AL.loc, mem: AL.mem },
      machine: r ? { trims: r.trims, opLevel: r.opLevel, opts: r.opts } : null,
    };
    const tracks = r ? r.tracks : Array.from({ length: 24 }, () => []);
    const n = tracks.filter((t) => t.length).length, res = await offer(`${SESSION}.TAP`, AF.writeTap(meta, tracks));
    fsay(res === 'declined' ? 'Save cancelled.' : `Tape saved: ${window.JH_TAPES[TP.key].short}, ${n} recorded track${n === 1 ? '' : 's'}${res === 'zipped' ? ' (inside a .zip)' : ''}.`);
  }
  async function loadTap(u8, name) {
    const m = AF.readTap(u8);
    if (!window.JH_TAPES[m.tape]) throw new Error(`unknown tape type ${m.tape}`);
    const tapeSel = document.getElementById('tape-sel'), auto = document.getElementById('tape-auto');
    const wasAuto = auto.checked; if (m.machine) auto.checked = false;   // the file's own alignment comes back below
    if (m.tape !== TP.key) { tapeSel.value = m.tape; threadTape(m.tape); } else tr.command('stop');
    auto.checked = wasAuto;
    if (m.takeup) { const t = document.getElementById('takeup-sel'); t.value = m.takeup; setReelSkin('t', m.takeup); }
    tr.total = m.total; tr.setSpeed(m.ips); tr.locate(m.take); tr.zero = m.zero;
    SBX.stripes = m.smpte || []; Object.assign(SBX, m.tempo || {}); AL.loc = m.locate.loc; AL.mem = m.locate.mem; drawMem();
    const recorded = m.tracks.some((t) => t.length);
    if (recorded && !EL.node) await elPower();
    if (EL.node) {
      if (m.machine) { elPost({ type: 'opts', opLevel: m.machine.opLevel, ...m.machine.opts }); elPost({ type: 'trimsAll', trims: m.machine.trims }); const ol = document.getElementById('el-ol'); if (ol) ol.value = String(m.machine.opLevel); TP.opLevel = m.machine.opLevel; TP.aligned = true; alignLamp(); }
      const bufs = m.tracks.flat().map((p) => p.data.buffer);
      elPost({ type: 'setReel', key: m.tape, tracks: m.tracks }, bufs);
    }
    fsay(`${name}: ${window.JH_TAPES[m.tape].short} threaded, ${m.tracks.filter((t) => t.length).length} recorded tracks, counter at ${Math.floor(tr.counter / 60)}:${String(Math.floor(tr.counter % 60)).padStart(2, '0')}.`);
  }

  // ---- .MIX: both consoles' channel settings and the patchbay
  async function saveMix() {
    const json = { format: 'jh-studio-mix', version: 1, consoles: ST, patches, studio: document.body.dataset.studio };
    const res = await offer(`${SESSION}.MIX`, new TextEncoder().encode(JSON.stringify(json, null, 1)));
    fsay(res === 'declined' ? 'Save cancelled.' : `Mix saved: ${Object.keys(ST).length} channel settings, ${patches.length} patch cables${res === 'zipped' ? ' (inside a .zip)' : ''}.`);
  }
  function loadMix(u8, name) {
    const m = JSON.parse(new TextDecoder().decode(u8));
    if (!/^(jh|analog)-studio-mix$/.test(m.format)) throw new Error('not a JH-Studio .MIX file');   // older sessions saved as analog-studio-mix still load
    ST = m.consoles || {}; saveST2();
    for (const key of Object.keys(ST)) { const k = /^(cmi|sls)(\d+)$/.exec(key); if (k) applyCh(k[1], +k[2]); }
    if (Array.isArray(m.patches)) { patches = m.patches; save(); renderCables(); }
    fsay(`${name}: mix loaded (${Object.keys(ST).length} channel settings, ${patches.length} patch cables).`);
  }

  // ---- LOAD / IMPORT: decide by what the file is
  async function openFiles(files, mode) {
    const audio = [];
    for (const f of files) {
      let u8 = new Uint8Array(await f.arrayBuffer()), name = f.name;
      const items = /\.zip$/i.test(name) ? unzip(u8).filter((z) => !/\/$/.test(z.name)) : [{ name, data: u8, method: 0 }];
      for (const it of items) {
        if (it.method !== 0) { fsay(`${it.name}: compressed zips aren't supported; unzip it first.`); continue; }
        const head = String.fromCharCode(...it.data.subarray(0, 6));
        try {
          if (head === 'ASTAP1' || /\.tap$/i.test(it.name)) await loadTap(it.data, it.name);
          else if (/\.mix$/i.test(it.name) || (head.startsWith('{') && /(jh|analog)-studio-mix/.test(new TextDecoder().decode(it.data.subarray(0, 200))))) loadMix(it.data, it.name);
          else if (mode === 'import') audio.push(new File([it.data], it.name.split('/').pop()));
          else fsay(`${it.name}: LOAD opens .TAP tapes and .MIX mixes. Use IMPORT for audio.`);
        } catch (e) { fsay(`${it.name}: ${e.message}`); }
      }
    }
    if (audio.length) { const n = await EL.importAudio(audio, fsay); if (n) fsay(`${n} track${n === 1 ? '' : 's'} imported onto the ${window.JH_TAPES[TP.key].short} reel at the counter zero (${tr.speedIPS} ips).`); }
  }

  // ---- EXPORT: play the tape through the machine (repro head, the reel's own alignment) and write each track
  async function exportStems(fmt, bits, which) {
    const r = await reelData(TP.key);
    if (!r || !r.tracks.some((t) => t.length)) { fsay('Nothing on this tape to export yet: record or IMPORT something first.'); return; }
    const fs = EL.ctx.sampleRate, ips = r.ips, v = ips * JM.IPS;
    let u0 = Infinity, u1 = -Infinity;
    for (const t of r.tracks) for (const p of t) { u0 = Math.min(u0, p.u0); u1 = Math.max(u1, p.u0 + p.data.length * p.du); }
    const sec = (u1 - u0) / v + 0.5, N = Math.ceil(sec * fs);
    const pick = r.tracks.map((t, i) => (which === 'all' || t.length ? i : -1)).filter((i) => i >= 0);
    fsay(`Rendering ${pick.length} tracks, ${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')} of tape…`);
    const tape = JM.TAPES[TP.key];
    const m = new JM.Machine(fs, { hiss: r.opts.hiss, wowFlutter: r.opts.wf, quior: r.opts.quior });
    m.opLevel = r.opLevel; m.ch.forEach((c, i) => { c.t = r.trims[i]; c.opLevel = r.opLevel; });
    m.setTape(tape, r.tracks.map((t) => { const T = new JM.Track(); for (const q of t) { const p = new JM.Piece(q.u0, q.du, q.post); for (let k = 0; k < q.data.length; k++) p.push(q.data[k]); Object.assign(p, { lo: q.lo, hi: q.hi, fadeLo: q.fadeLo, fadeHi: q.fadeHi }); T.pieces.push(p); } return T; }));
    m.setSpeed(ips);
    m.st.master = { tape: true, input: false, auto: false }; m.st.ready = new Set(); m.st.cue = new Set(); m.st.inputs = new Set();
    const B = 1024, out = Array.from({ length: 24 }, () => new Float32Array(B)), res = pick.map(() => new Float32Array(N));
    for (let k = 0, first = true; k < N; k += B) {
      m.process(null, out, first ? { take: u0, v, mode: 'play', lift: 0 } : { v, mode: 'play' }); first = false;
      pick.forEach((i, j) => res[j].set(out[i].subarray(0, Math.min(B, N - k)), k));
      if ((k / B) % 64 === 0) { fsay(`Rendering… ${Math.round(100 * k / N)} %`); await new Promise((z) => setTimeout(z)); }
    }
    fsay('Encoding…'); await new Promise((z) => setTimeout(z));
    const files = [];
    for (const [j, i] of pick.entries()) {
      let data, ext;
      if (fmt === 'wav') { data = AF.wav(res[j], fs, bits); ext = 'wav'; }
      else if (fmt === 'aiff') { data = AF.aiff(res[j], fs, Math.min(bits, 24)); ext = 'aif'; }
      else if (fmt === 'flac') { data = AF.flac(res[j], fs, Math.min(bits, 24)); ext = 'flac'; }
      else { data = await mp3(res[j], fs); ext = 'mp3'; }
      files.push({ name: `${trackName(i)}.${ext}`, data });
      fsay(`Encoding… ${j + 1} / ${pick.length}`); await new Promise((z) => setTimeout(z));
    }
    const name = `${SESSION} - ${window.JH_TAPES[TP.key].short} stems (${fmt.toUpperCase()}${fmt === 'mp3' ? '' : ` ${bits === 32 ? '32f' : bits}`}).zip`;
    const result = await offer(name, AF.zip(files));
    fsay(result === 'declined' ? 'Export cancelled.' : `Exported ${files.length} stems (${fmt.toUpperCase()}, ${fs / 1000} kHz) from the tape's repro head.`);
  }
  // MP3 through LAME (loaded on first use)
  let lameP = null;
  async function mp3(x, fs) {
    if (!window.lamejs) lameP = lameP || new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js'; s.onload = res; s.onerror = () => rej(new Error('the MP3 encoder could not be loaded')); document.head.appendChild(s); });
    await lameP;
    const enc = new window.lamejs.Mp3Encoder(1, fs, 320), q = new Int16Array(x.length), parts = [];
    for (let i = 0; i < x.length; i++) q[i] = Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767)));
    for (let i = 0; i < q.length; i += 1152) { const b = enc.encodeBuffer(q.subarray(i, i + 1152)); if (b.length) parts.push(new Uint8Array(b)); }
    const e = enc.flush(); if (e.length) parts.push(new Uint8Array(e));
    return AF.concat(parts);
  }

  // ---- the buttons and their little menus
  // the RACKS button: the racks room (the outboard rack where it stands, three more racks to its left); again to go back
  const racksBtn = fbar && fbar.querySelector('[data-f="racks"]');
  window.AS_RACKS = (on) => {
    on = on ?? !document.body.classList.contains('racksview');
    document.body.classList.toggle('racksview', on);
    if (racksBtn) racksBtn.textContent = on ? '◀ BACK TO THE STUDIO' : 'RACKS';
  };
  document.addEventListener('click', (e) => { if (e.target.closest('#racks-room [data-f="racks"]')) window.AS_RACKS(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('racksview') && !document.querySelector('.overlay:not([hidden])')) window.AS_RACKS(false); }, true);   // capture: a pop-up's own Esc closes it first, not the room
  if (fbar) {
    const pickFiles = (accept, mode) => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; i.accept = accept; i.onchange = () => { const f = [...i.files]; if (f.length) openFiles(f, mode).catch((e) => fsay(e.message)); }; i.click(); };
    const menu = (id) => { fbar.querySelectorAll('.fmenu').forEach((m) => { m.hidden = m.id !== id || !m.hidden; }); };
    fbar.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      const f = b.dataset.f;
      try {
        if (f === 'racks') { menu(''); window.AS_RACKS(); return; }
        if (f === 'load') { menu(''); pickFiles('.tap,.TAP,.mix,.MIX,.zip', 'load'); }
        else if (f === 'save' || f === 'export') menu(`fm-${f}`);
        else if (f === 'import') { menu(''); pickFiles('audio/*,video/*,.wav,.wave,.bwf,.aif,.aiff,.aifc,.flac,.mp3,.m4a,.aac,.mp4,.ogg,.oga,.opus,.webm,.caf,.zip,.tap,.mix', 'import'); }
        else if (f === 'save-tap') { menu(''); await saveTap(); }
        else if (f === 'save-mix') { menu(''); await saveMix(); }
        else if (f === 'go-export') {
          menu(''); if (!EL.node) { fsay('Power the tape machine electronics first (nothing is on tape yet).'); return; }
          const [fmt, bits] = document.getElementById('fx-fmt').value.split(':');
          await exportStems(fmt, +bits || 16, document.getElementById('fx-which').value);
        }
      } catch (err) { fsay(`${err.code ? `${err.code}: ` : ''}${err.message || err}`); }
    });
  }
