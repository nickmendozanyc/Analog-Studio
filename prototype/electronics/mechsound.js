// HJ-24 transport mechanics as sound: what you hear standing next to the machine (not the tape's audio).
// Driven by the same physics as the reels on screen, block by block. Renderer-independent; runs in the AudioWorklet.
//
//  - reel motors: two DC servo motors direct-coupled to the reels. Each whines at its rotation rate times the
//    armature slot count, with a little cogging at the pole count; louder under load (spooling up / braking), so the
//    two pitches glide in opposite directions through a wind as the packs trade size.
//  - tape and air: band-passed noise that rises with the square of tape speed, pulsing a little at each reel's turn.
//  - mechanics: bearing / guide rumble, and a once-per-turn imbalance wobble from each reel.
//  - solenoids: lifters out (into a wind), brakes (STOP from a wind), pinch roller (PLAY), each a short damped clunk.
//  - tail flap: tape running off a reel at speed slaps the deck a few times as the reel coasts down.
// Every number here is (approx): voiced by ear to sound like a large two-inch deck, not measured from a JH-24.

export const MECH = {
  slots: 48,          // motor armature slots: whine = turns/s x slots (about 1.1 kHz at full wind)
  rise: 0.35,         // extra pitch climb with speed (0 = strictly proportional): the whine rises high in a wind
  poles: 4,
  whine: 0.0035,      // whine level at full wind speed (linear, the machine level scales everything)
  load: 0.0010,       // extra whine per m/s^2 of reel acceleration
  air: 0.035,         // tape and air rush at full wind speed
  rumble: 0.020,
  clunk: 0.22,
  flap: 0.16,
  vMax: 13,           // full wind speed (m/s)
};

export class MechSound {
  constructor(fs, cfg = MECH) {
    this.fs = fs; this.c = cfg;
    this.ph = [0, 0, 0, 0];           // supply / take-up motor phases (turns), and their slot phases
    this.rng = 0x2545f491;
    this.bp = [0, 0, 0, 0];           // band-pass state (air), low-pass state (rumble)
    this.ev = [];                     // clunks and flaps: { t, f1, f2, a, d }
    this.mode = 'stop'; this.lift = 0; this.v = 0; this.flapT = 0; this.flapRate = 0; this.time = 0;
  }
  noise() { this.rng ^= this.rng << 13; this.rng ^= this.rng >>> 17; this.rng ^= this.rng << 5; return (this.rng >>> 0) / 4294967296 * 2 - 1; }
  // a mechanical clunk: a noise tick into two damped resonances (frame and solenoid plunger)
  clunk(level, f1 = 140, f2 = 900, decay = 0.05) { this.ev.push({ t: 0, f1, f2, a: level, d: decay }); }
  // the transport state for this block: v (m/s), reel pack radii (m), acceleration, mode, lifters 0..1, end of tape
  update(s) {
    const was = this.mode, wind = (m) => m === 'ff' || m === 'rew' || m === 'locate' || m === 'shuttle';
    if (s.mode !== was) {
      if (wind(s.mode) && !wind(was)) this.clunk(this.c.clunk, 120, 760, 0.07);                 // lifters swing out
      if (s.mode === 'stop' && Math.abs(this.v) > 1) this.clunk(this.c.clunk * 0.8, 95, 620, 0.09); // brakes from a wind
      if ((s.mode === 'play' || s.mode === 'rec' || s.mode === 'rplay') && was !== 'play' && was !== 'rec') this.clunk(this.c.clunk * 0.9, 160, 1150, 0.05);   // pinch roller
      if (s.mode === 'stop' && (was === 'play' || was === 'rec')) this.clunk(this.c.clunk * 0.6, 150, 980, 0.04);           // pinch roller out
      this.mode = s.mode;
    }
    if (s.endOfTape && !this.eot && Math.abs(this.v) > 2) { this.flapT = 2.2; this.flapRate = Math.abs(this.v) / (2 * Math.PI * s.rT); }
    this.eot = s.endOfTape;
    this.v = s.v; this.rS = s.rS; this.rT = s.rT; this.acc = s.acc || 0; this.lift = s.lift ?? this.lift;
  }
  // add the machine's sound into L / R (the machine sits slightly left of centre in the room)
  render(L, R, level) {
    const c = this.c, fs = this.fs, n = L.length, av = Math.abs(this.v), x = Math.min(1.2, av / c.vMax);
    const climb = 1 + c.rise * (x - 1), fS = av / (2 * Math.PI * (this.rS || 0.1)) * climb, fT = av / (2 * Math.PI * (this.rT || 0.1)) * climb;   // turns per second, with the climb
    const wl = level * (c.whine * Math.pow(x, 1.1) + c.load * Math.abs(this.acc) * Math.min(1, x * 4));
    const al = level * c.air * x * x, rl = level * c.rumble * Math.min(1, x * 1.5);
    // air: a resonant band rising with speed
    const fc = 500 + 2200 * x, q = 0.7, w = 2 * Math.PI * fc / fs, alpha = Math.sin(w) / (2 * q), cw = Math.cos(w), a0 = 1 + alpha;
    const b0 = alpha / a0, a1 = -2 * cw / a0, a2 = (1 - alpha) / a0, lpk = 1 - Math.exp(-2 * Math.PI * 140 / fs);
    for (let k = 0; k < n; k++) {
      let y = 0;
      if (av > 0.02) {
        // motors: slot whine + a softer pole cogging, each reel its own pitch
        this.ph[0] += fS / fs; this.ph[1] += fT / fs;
        const s1 = Math.sin(2 * Math.PI * this.ph[0] * c.slots), s2 = Math.sin(2 * Math.PI * this.ph[1] * c.slots);
        const g1 = Math.sin(2 * Math.PI * this.ph[0] * c.poles * 2), g2 = Math.sin(2 * Math.PI * this.ph[1] * c.poles * 2);
        y += wl * (s1 + 0.2 * Math.sin(4 * Math.PI * this.ph[0] * c.slots) + 0.15 * g1);
        y += wl * 0.85 * (s2 + 0.2 * Math.sin(4 * Math.PI * this.ph[1] * c.slots) + 0.15 * g2);
        // tape and air, pulsing with each reel's turn
        const nz = this.noise();
        const yb = b0 * nz - b0 * this.bp[1] - a1 * this.bp[2] - a2 * this.bp[3];
        this.bp[1] = this.bp[0]; this.bp[0] = nz; this.bp[3] = this.bp[2]; this.bp[2] = yb;
        const pulse = 1 + 0.18 * Math.sin(2 * Math.PI * this.ph[0]) + 0.12 * Math.sin(2 * Math.PI * this.ph[1]);
        y += al * yb * pulse * (this.lift > 0.5 ? 1 : 0.6);
        // rumble and once-per-turn imbalance
        this.bp[4] = (this.bp[4] || 0) + lpk * (this.noise() - (this.bp[4] || 0));
        y += rl * (this.bp[4] * 3 + 0.4 * Math.sin(2 * Math.PI * this.ph[0] * 2) + 0.3 * Math.sin(2 * Math.PI * this.ph[1] * 2));
      }
      // clunks
      for (const e of this.ev) {
        const t = e.t, env = Math.exp(-t / e.d);
        y += level * e.a * env * (0.7 * Math.sin(2 * Math.PI * e.f1 * t) + 0.45 * Math.sin(2 * Math.PI * e.f2 * t) * Math.exp(-t / (e.d * 0.35)) + (t < 0.004 ? 0.8 * this.noise() : 0));
        e.t += 1 / fs;
      }
      // tail flap: the loose end slapping once a turn as the reel coasts down
      if (this.flapT > 0) {
        this.flapT -= 1 / fs; this.flapRate *= 1 - 0.9 / fs; this.ph[2] += this.flapRate / fs;
        const fr = this.ph[2] % 1;
        if (fr < 0.06) y += level * c.flap * Math.min(1, this.flapT) * Math.exp(-fr * 60) * this.noise();
      }
      L[k] += y * 0.95; R[k] += y * 0.75;
      this.time += 1 / fs;
    }
    this.ev = this.ev.filter((e) => e.t < e.d * 8);
    if (this.ph[0] > 1e6) { this.ph[0] %= 1; this.ph[1] %= 1; }
  }
}
