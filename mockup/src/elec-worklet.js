// AudioWorklet wrapper around the JH-Tape electronics model (prototype/electronics/jh24audio.js is inlined above this).
// The main thread posts the shared transport every frame; the worklet runs its own sample clock and follows it.
class JH24Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.m = new Machine(sampleRate);
    this.N = this.m.n;
    this.inp = Array.from({ length: this.N }, () => new Float32Array(128));
    this.out = Array.from({ length: this.N }, () => new Float32Array(128));
    this.ctl = null; this.target = null;
    this.osc = { on: false, f: 1000, db: 0, to: 'ready', ph: 0 };
    this.live = { on: false };
    this.mix = { gain: 0.5, solo: -1, mute: false };
    this.mech = new MechSound(sampleRate); this.mechLevel = 0.6;   // the machine's own sound (motors, air, solenoids)
    this.align = { on: false, f: 1000, std: 'NAB' };   // alignment tape playing: standard-flux tones on every track
    this.vuT = 0; this.vu = new Float32Array(this.N);
    // the rack's two dbk 160X compressors, each on a channel's insert (patched at the patchbay); null = not patched
    this.c160 = [new Comp160(sampleRate, VU0), new Comp160(sampleRate, VU0)]; this.c160ch = [null, null];
    this.c160buf = [new Float32Array(128), new Float32Array(128)];
    // the Publizon IM90's two channels, on inserts too (each can trigger from either channel's input)
    this.im = [new IM90Channel(sampleRate), new IM90Channel(sampleRate)]; this.imch = [null, null];
    this.imIn = [new Float32Array(128), new Float32Array(128)]; this.imOut = [new Float32Array(128), new Float32Array(128)];
    // two SPX90IIs: mono in from a channel insert, stereo out straight to the mix (the channel itself is replaced)
    this.spx = [new SPX90(sampleRate), new SPX90(sampleRate)]; this.spxch = [null, null];
    // the H949 and the RMX16: fed from a channel, their outputs ADDED to the mix (the channel stays: an effect send)
    this.h949 = new H949Unit(sampleRate); this.rmx = new RMX16(sampleRate); this.par = { h949: null, rmx: null };
    this.parIn = new Float32Array(128); this.parL = new Float32Array(128); this.parR = new Float32Array(128);
    this.spxIn = [new Float32Array(128), new Float32Array(128)]; this.spxL = [new Float32Array(128), new Float32Array(128)]; this.spxR = [new Float32Array(128), new Float32Array(128)]; this.silent = new Float32Array(128);
    this.port.onmessage = (e) => this.msg(e.data);
  }
  msg(d) {
    const m = this.m;
    if (d.type === 'transport') this.target = d;
    else if (d.type === 'status') { m.st.master = d.master; m.st.ready = new Set(d.ready); m.st.cue = new Set(d.cue); m.st.inputs = new Set(d.inputs); }
    else if (d.type === 'trim') {
      const c = m.ch[d.ch]; if (!c) return;
      if (d.ips != null) c.t[d.key][d.ips] = d.value; else c.t[d.key] = d.value;
      c.configure(m.ips, m.opLevel);
    }
    else if (d.type === 'align') { for (const c of (d.ch == null ? m.ch : [m.ch[d.ch]])) for (const s of SPEEDS) align(c, s, m.opLevel); m.setSpeed(m.ips); this.sendTrims(); }
    else if (d.type === 'opts') { if (d.quior != null) m.quior = d.quior; if (d.hiss != null) m.hiss = d.hiss; if (d.wf != null) m.wf = d.wf; if (d.opLevel && d.opLevel !== m.opLevel) { m.setOpLevel(d.opLevel); this.sendTrims(); } }
    else if (d.type === 'c160') { if (d.params) this.c160[d.unit].set(d.params); if (d.ch !== undefined) this.c160ch[d.unit] = d.ch; }
    else if (d.type === 'im90') {
      const c = this.im[d.unit]; if (!c) return;
      if (d.ch !== undefined) this.imch[d.unit] = d.ch;
      if (d.set) c.set(d.set);
      if (d.smp) { const o = { ...d.smp }; if (o.fromMs != null) { o.start = Math.min(c.N - 1, Math.max(0, o.fromMs * sampleRate / 1000)); delete o.fromMs; } if (o.toMs != null) { o.end = Math.min(c.N - 1, Math.max(0, o.toMs * sampleRate / 1000)); delete o.toMs; } c.setSample(o); }
      if (d.cmd === 'arm') c.arm(d.by); else if (d.cmd === 'play') c.play(); else if (d.cmd === 'stop') c.stop();
    }
    else if (d.type === 'h949' || d.type === 'rmx') { const u = d.type === 'h949' ? this.h949 : this.rmx; if (d.ch !== undefined) this.par[d.type] = d.ch; if (d.set) u.set(d.set); }
    else if (d.type === 'spx') { const u = this.spx[d.unit]; if (!u) return; if (d.ch !== undefined) this.spxch[d.unit] = d.ch; if (d.set) u.set(d.set); if (d.cmd === 'trig') u.trigger(); }
    else if (d.type === 'osc') Object.assign(this.osc, d);
    else if (d.type === 'live') this.live.on = d.on;
    else if (d.type === 'mix') Object.assign(this.mix, d);
    else if (d.type === 'machine') this.mechLevel = d.level;
    else if (d.type === 'alignTape') Object.assign(this.align, d);
    else if (d.type === 'load') { m.loadTransfer(d.track, d.data, d.u0, d.ips); this.port.postMessage({ type: 'loaded', track: d.track }); }
    else if (d.type === 'clear') { m.tracks[d.track].pieces = []; }
    else if (d.type === 'getTrims') this.sendTrims();
    else if (d.type === 'getReel') {   // a reel's recordings, for a .TAP file or an export
      this.reels = this.reels || {};
      const tracks = d.key === this.tapeKey ? m.tracks : this.reels[d.key];
      const out = (tracks || []).map((t) => t.pieces.map((p) => { const a = new Float32Array(p.n); for (let i = 0; i < p.n; i++) a[i] = p.at(i); return { u0: p.u0, du: p.du, post: p.post, lo: p.lo, hi: p.hi, fadeLo: p.fadeLo, fadeHi: p.fadeHi, data: a }; }));
      this.port.postMessage({ type: 'reel', id: d.id, key: d.key, tracks: out, trims: m.ch.map((c) => c.t), opLevel: m.opLevel, ips: m.ips, opts: { quior: m.quior, hiss: m.hiss, wf: m.wf } });
    }
    else if (d.type === 'trimsAll') { d.trims.forEach((t, i) => { if (m.ch[i]) m.ch[i].t = t; }); m.setSpeed(m.ips); this.sendTrims(); }
    else if (d.type === 'setReel') {   // a reel loaded from a .TAP file
      this.reels = this.reels || {};
      const tracks = Array.from({ length: m.n }, (_, i) => { const t = new Track(); for (const q of (d.tracks[i] || [])) { const p = new Piece(q.u0, q.du, q.post); for (let k = 0; k < q.data.length; k++) p.push(q.data[k]); Object.assign(p, { lo: q.lo ?? -Infinity, hi: q.hi ?? Infinity, fadeLo: q.fadeLo, fadeHi: q.fadeHi }); t.pieces.push(p); } return t; });
      if (d.key === this.tapeKey) m.setTape(m.tape, tracks); else this.reels[d.key] = tracks;
    }
    else if (d.type === 'tape') {   // a different reel threaded: its recordings come with it, its formulation into the model
      this.reels = this.reels || {};
      if (this.tapeKey) this.reels[this.tapeKey] = m.tracks;
      this.tapeKey = d.key;
      m.setTape(d.params, this.reels[d.key] || Array.from({ length: m.n }, () => new Track()));
      if (d.align) { for (const c of m.ch) for (const s of SPEEDS) align(c, s, m.opLevel); m.setSpeed(m.ips); }
      this.sendTrims();
    }
    else if (d.type === 'debugReset') this.vs = [];
    else if (d.type === 'debug') this.port.postMessage({ locked: !!this.locked, type: 'debug', take: m.take, v: m.v, mode: m.st.mode, ready: [...m.st.ready], pieces: m.tracks.map((t) => t.pieces.length), pass: m.pass.map((p) => !!p), jumps: this.jumps || 0, vmin: this.vs ? Math.min(...this.vs) : 0, vmax: this.vs ? Math.max(...this.vs) : 0 });
  }
  sendTrims() { this.port.postMessage({ type: 'trims', trims: this.m.ch.map((c) => c.t) }); }
  process(inputs, outputs) {
    const m = this.m, out = outputs[0], n = out[0].length, live = inputs[0] && inputs[0][0];
    if (this.inp[0].length !== n) { this.inp = this.inp.map(() => new Float32Array(n)); this.out = this.out.map(() => new Float32Array(n)); }
    // follow the transport: hard-set on a jump, otherwise pull gently toward the main thread's tape position
    let ctl = {};
    const T = this.target;
    if (T) {
      // a real locate moves the tape by far more than any timing slip between the two threads
      const err = T.take - m.take, jump = Math.abs(err) > Math.max(0.3, Math.abs(T.v) * 0.6);
      if (jump) { ctl.take = T.take; this.jumps = (this.jumps || 0) + 1; }
      const capstan = (T.mode === 'play' || T.mode === 'rec' || T.mode === 'rplay') && Math.abs(Math.abs(T.v) - T.ips * IPS * (1 + (T.vari || 0))) < 0.002 * T.ips * IPS;
      if (T.mode === 'stop' && Math.abs(T.v) < 1e-4) {   // stopped: the tape stands still at exactly the transport's position
        ctl.take = T.take; ctl.v = 0; this.locked = false;
      } else if (capstan && !jump) {
        // QUARTZ LOCK: the capstan runs at exactly the selected speed off the audio clock (the crystal). The screen's
        // transport is only a reference for phase: a correction of at most ±0.02 %, far below wow & flutter
        const ref = Math.sign(T.v) * T.ips * IPS * (1 + (T.vari || 0)), trim = Math.max(-0.0002, Math.min(0.0002, err * 0.02));
        ctl.v = ref * (1 + trim * Math.sign(ref)); this.locked = true;
      } else {
        ctl.v = T.v + (jump ? 0 : Math.max(-0.1 * Math.abs(T.v) - 0.02, Math.min(0.1 * Math.abs(T.v) + 0.02, err * 1.5))); this.locked = false;
      }
      ctl.lift = T.lift; ctl.mode = T.mode; ctl.ips = T.ips;
    }
    // line inputs: test oscillator to the chosen tracks, the computer's input to the ready tracks
    const o = this.osc, amp = VU0 * 10 ** (o.db / 20), w = 2 * Math.PI * o.f / sampleRate;
    for (let i = 0; i < this.N; i++) {
      const buf = this.inp[i]; buf.fill(0);
      const ready = m.st.ready.has(i);
      if (o.on && (o.to === 'all' || (o.to === 'ready' && ready) || o.to === i)) for (let k = 0; k < n; k++) buf[k] = amp * Math.sin(o.ph + w * k);
      if (this.live.on && live && ready) for (let k = 0; k < n; k++) buf[k] += live[k];
    }
    o.ph = (o.ph + w * n) % (2 * Math.PI);
    if (ctl.v != null && T && T.mode === 'play') { this.vs = this.vs || []; this.vs.push(ctl.v / (m.ips * IPS)); if (this.vs.length > 4000) this.vs.shift(); }
    m.process(this.inp, this.out, ctl);
    // alignment tape: reference-flux tones played at the repro / sync heads instead of the session tape
    if (this.align.on && Math.abs(m.v) > 0.3 * m.ips * IPS) {
      const a = this.align, aw = 2 * Math.PI * a.f / sampleRate;
      for (let i = 0; i < this.N; i++) {
        const c = m.ch[i], src = monitorSource(i, m.st);
        if (src === 'input') continue;
        const g = 10 ** ((src === 'repro' ? c.reproDb(a.f) + c.t.reproLvl : c.cueDb(a.f) + c.t.cueLvl) / 20) * 10 ** (standardOffset(a.std, c.t.std, m.ips, a.f) / 20) * VU0;
        for (let k = 0; k < n; k++) this.out[i][k] = g * Math.sin((a.ph || 0) + aw * k);
      }
      a.ph = ((a.ph || 0) + aw * n) % (2 * Math.PI);
    }
    // monitor mix to the speakers (tracks spread across the stereo field), or one channel soloed
    const L = out[0], R = out[1] || out[0];
    L.fill(0); if (R !== L) R.fill(0);
    // channel inserts: the 160Xs process their channels' tape returns (copies: the tape meters keep reading the tape)
    const ins = {};
    for (let u = 0; u < 2; u++) {
      if (this.c160buf[u].length !== n) this.c160buf[u] = new Float32Array(n);
      const ch = this.c160ch[u], b = this.c160buf[u];
      if (ch != null && this.out[ch]) { b.set(this.out[ch]); ins[ch] = b; } else b.fill(0);
    }
    // SLAVE on one unit links it to the other (the other becomes the master)
    const [A, B] = this.c160, swap = A.params.slave && !B.params.slave;
    if (swap) Comp160.processPair(B, this.c160buf[1], A, this.c160buf[0], n); else Comp160.processPair(A, this.c160buf[0], B, this.c160buf[1], n);
    // IM90 (after the compressors): its inputs are the channels it is patched on (silence when not); each channel
    // records / retriggers from input A or input B
    for (let u = 0; u < 2; u++) {
      if (this.imIn[u].length !== n) { this.imIn[u] = new Float32Array(n); this.imOut[u] = new Float32Array(n); }
      const ch = this.imch[u]; if (ch != null && this.out[ch]) this.imIn[u].set(ins[ch] || this.out[ch]); else this.imIn[u].fill(0);
    }
    for (let u = 0; u < 2; u++) {
      const c = this.im[u], by = c.smp.rec === 'armed' ? c.smp.startBy : (c.smp.trigBy || 'A');
      c.process(this.imIn[u], this.imOut[u], n, this.imIn[by === 'B' ? 1 : 0]);
      const ch = this.imch[u]; if (ch != null) ins[ch] = this.imOut[u];
    }
    // SPX90II (last on the insert): process the channel, silence it in the mix, add the unit's stereo output
    for (let u = 0; u < 2; u++) {
      if (this.spxIn[u].length !== n) { this.spxIn[u] = new Float32Array(n); this.spxL[u] = new Float32Array(n); this.spxR[u] = new Float32Array(n); this.silent = new Float32Array(n); }
      const ch = this.spxch[u]; if (ch != null && this.out[ch]) this.spxIn[u].set(ins[ch] || this.out[ch]); else this.spxIn[u].fill(0);
      this.spx[u].process(this.spxIn[u], this.spxL[u], this.spxR[u], n);
      if (ch != null) ins[ch] = this.silent;
    }
    if (!this.mix.mute) for (let i = 0; i < this.N; i++) {
      if (this.mix.solo >= 0 && this.mix.solo !== i) continue;
      const pan = this.mix.solo >= 0 ? 0.5 : 0.15 + 0.7 * (i % 8) / 7, gl = Math.cos(pan * Math.PI / 2) * this.mix.gain, gr = Math.sin(pan * Math.PI / 2) * this.mix.gain;
      const y = ins[i] || this.out[i];
      for (let k = 0; k < n; k++) { L[k] += y[k] * gl; if (R !== L) R[k] += y[k] * gr; }
    }
    // the H949 and the RMX16, alongside their channels
    if (this.parIn.length !== n) { this.parIn = new Float32Array(n); this.parL = new Float32Array(n); this.parR = new Float32Array(n); }
    for (const [key, unit] of [['h949', this.h949], ['rmx', this.rmx]]) {
      const ch = this.par[key]; if (ch == null || !this.out[ch]) { this.parIn.fill(0); unit.process(this.parIn, this.parL, this.parR, n); continue; }
      this.parIn.set(ins[ch] || this.out[ch]); unit.process(this.parIn, this.parL, this.parR, n);
      if (this.mix.mute || this.mix.solo >= 0) continue;
      const g = this.mix.gain * 0.8, dl = key === 'h949' && unit.p.dlyMs > 0;
      for (let k = 0; k < n; k++) { const a = this.parL[k], b = key === 'h949' ? (dl ? this.parR[k] : a) : this.parR[k]; L[k] += a * g; if (R !== L) R[k] += b * g; }
    }
    if (!this.mix.mute && this.mix.solo < 0) for (let u = 0; u < 2; u++) if (this.spxch[u] != null) { const g = this.mix.gain * 0.75, a = this.spxL[u], b = this.spxR[u]; for (let k = 0; k < n; k++) { L[k] += a[k] * g; if (R !== L) R[k] += b[k] * g; } }
    // the transport mechanics, heard in the room (not on tape): motors, air, solenoids
    if (T && this.mechLevel > 0) { this.mech.update({ v: m.v, rS: T.rS, rT: T.rT, acc: T.acc, mode: T.mode, lift: T.lift, endOfTape: T.eot }); this.mech.render(L, R, this.mechLevel); }
    // VU levels (average-responding, ~300 ms; 0 VU = 0 dB) and what each channel is monitoring, ~30 times a second
    const kv = 1 / (0.1 * sampleRate);
    for (let i = 0; i < this.N; i++) { const y = this.out[i]; let v = this.vu[i]; for (let k = 0; k < n; k++) v += (Math.abs(y[k]) - v) * kv; this.vu[i] = v; }
    this.vuT += n;
    if (this.vuT > sampleRate / 30) {
      this.vuT = 0;
      this.port.postMessage({ type: 'vu', locked: !!this.locked, db: Array.from(this.vu, (v) => 20 * Math.log10(Math.max(v, 1e-9) / (0.6366 * VU0))), src: m.ch.map((c, i) => monitorSource(i, m.st)), take: m.take, c160: this.c160.map((c) => c.meters()), im90: this.im.map((c) => c.meters()), spx: this.spx.map((c) => c.meters()), h949: this.h949.meters(), rmx: this.rmx.meters() });
    }
    return true;
  }
}
registerProcessor('jh24-electronics', JH24Processor);
