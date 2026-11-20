// AudioWorklet wrapper around the HJ-24 electronics model (prototype/electronics/jh24audio.js is inlined above this).
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
    this.align = { on: false, f: 1000, std: 'NAB' };   // alignment tape playing: standard-flux tones on every track
    this.vuT = 0; this.vu = new Float32Array(this.N);
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
    else if (d.type === 'osc') Object.assign(this.osc, d);
    else if (d.type === 'live') this.live.on = d.on;
    else if (d.type === 'mix') Object.assign(this.mix, d);
    else if (d.type === 'alignTape') Object.assign(this.align, d);
    else if (d.type === 'load') { m.loadTransfer(d.track, d.data, d.u0, d.ips); this.port.postMessage({ type: 'loaded', track: d.track }); }
    else if (d.type === 'clear') { m.tracks[d.track].pieces = []; }
    else if (d.type === 'getTrims') this.sendTrims();
    else if (d.type === 'debug') this.port.postMessage({ type: 'debug', take: m.take, v: m.v, mode: m.st.mode, ready: [...m.st.ready], pieces: m.tracks.map((t) => t.pieces.length), pass: m.pass.map((p) => !!p), jumps: this.jumps || 0 });
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
      ctl.v = T.v + (jump ? 0 : Math.max(-0.1 * Math.abs(T.v) - 0.02, Math.min(0.1 * Math.abs(T.v) + 0.02, err * 1.5)));
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
    if (!this.mix.mute) for (let i = 0; i < this.N; i++) {
      if (this.mix.solo >= 0 && this.mix.solo !== i) continue;
      const pan = this.mix.solo >= 0 ? 0.5 : 0.15 + 0.7 * (i % 8) / 7, gl = Math.cos(pan * Math.PI / 2) * this.mix.gain, gr = Math.sin(pan * Math.PI / 2) * this.mix.gain;
      const y = this.out[i];
      for (let k = 0; k < n; k++) { L[k] += y[k] * gl; if (R !== L) R[k] += y[k] * gr; }
    }
    // VU levels (average-responding, ~300 ms; 0 VU = 0 dB) and what each channel is monitoring, ~30 times a second
    const kv = 1 / (0.1 * sampleRate);
    for (let i = 0; i < this.N; i++) { const y = this.out[i]; let v = this.vu[i]; for (let k = 0; k < n; k++) v += (Math.abs(y[k]) - v) * kv; this.vu[i] = v; }
    this.vuT += n;
    if (this.vuT > sampleRate / 30) {
      this.vuT = 0;
      this.port.postMessage({ type: 'vu', db: Array.from(this.vu, (v) => 20 * Math.log10(Math.max(v, 1e-9) / (0.6366 * VU0))), src: m.ch.map((c, i) => monitorSource(i, m.st)), take: m.take });
    }
    return true;
  }
}
registerProcessor('jh24-electronics', JH24Processor);
