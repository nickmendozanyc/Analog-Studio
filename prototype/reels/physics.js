// JH-24 reel and transport physics (SI units).
// Renderer-independent so it can be ported 1:1 to the C++ engine.
//
// Model
//  - Tape is wound on two hubs. A pack's outer radius follows from the tape length on it:
//      r(L) = sqrt(rHub^2 + L * thickness / pi)
//  - Tape speed v (m/s, + = toward take-up) is the one state variable of the transport.
//    Each reel turns at w = v / r, so the full reel turns slowly and the empty one fast.
//  - PLAY / RECORD: the capstan and pinch roller hold v at the selected speed with a fast,
//    servo-like response. From a wind, the reels brake first and the pinch roller only
//    engages once the tape is near play speed (the JH-24's motion sensing).
//  - Winds (F FWD, REW, shuttle, stop from a wind): the reel motors are force-limited, so
//    acceleration = force / effective mass, where the effective mass of the reels seen at the
//    tape is I_supply / r_s^2 + I_takeup / r_t^2. A full reel therefore spools up and brakes
//    more slowly than a nearly empty one.
//  - Lifters hold the tape off the heads at wind speed; LIFT defeats them.
//  - Tape running off a reel stops the transport.
//
// A full reel is 2500 ft. Numbers marked (approx) are plausible values to tune by eye and ear against the real machine.

export const TAPE = {
  thickness: 38.1e-6,   // 1.5 mil base + oxide (approx, typical of 456 / 499 / GP9)
  width: 0.0508,        // 2 inch
  density: 1350,        // kg/m^3 (approx)
  hubR: 0.0572,         // 4.5" hub diameter (approx)
  flangeR: 0.1778,      // 14" reel
};

export const MACHINE = {
  emptyReelInertia: 0.0127, // kg m^2, aluminium 14" reel (approx)
  windSpeed: 9.0,           // m/s (~354 ips) (approx)
  windForce: 42,            // N, reel-motor drive force at the tape (approx)
  brakeForce: 64,           // N, braking force at the tape (approx)
  capstanTau: 0.11,         // s, capstan servo time constant (approx)
  capstanSlew: 6.0,         // m/s^2, capstan acceleration limit (approx)
  pinchEngageWindow: 0.06,  // m/s, pinch roller engages within this of play speed
  lifterSpeed: 1.6,         // m/s, lifters come in above this speed
};

export const IPS = 0.0254; // m/s per inch-per-second
export const FT = 0.3048;
export const ROLL_FT = 2500; // feet of tape on a full reel

export const packRadius = (len, tape = TAPE) => Math.sqrt(tape.hubR * tape.hubR + Math.max(0, len) * tape.thickness / Math.PI);
export const packMass = (len, tape = TAPE) => Math.max(0, len) * tape.thickness * tape.width * tape.density;
export const reelInertia = (len, tape = TAPE, m = MACHINE) => {
  const r = packRadius(len, tape);
  return m.emptyReelInertia + 0.5 * packMass(len, tape) * (r * r + tape.hubR * tape.hubR);
};
export const capacity = (tape = TAPE) => Math.PI * (tape.flangeR * tape.flangeR - tape.hubR * tape.hubR) / tape.thickness;

export class Transport {
  constructor({ totalLength = ROLL_FT * FT, onTakeup = 0, speedIPS = 30, tape = TAPE, machine = MACHINE } = {}) {
    this.tape = tape; this.m = machine;
    this.total = Math.min(totalLength, capacity(tape));
    this.take = Math.min(Math.max(onTakeup, 0), this.total);
    this.v = 0;
    this.mode = 'stop';           // stop | play | rec | ff | rew | shuttle
    this.speedIPS = speedIPS;     // 15 | 30
    this.shuttle = 0;             // -1 .. 1
    this.liftDefeat = false;
    this.pinch = 0;               // 0 = retracted, 1 = engaged (smoothed for animation)
    this.lift = 0;                // 0 = tape on heads, 1 = lifted (smoothed)
    this.angleS = 0; this.angleT = 0;
    this.zero = this.take;        // counter zero point (tape position)
    this.endOfTape = false;
  }
  get supply() { return this.total - this.take; }
  get rS() { return packRadius(this.supply, this.tape); }
  get rT() { return packRadius(this.take, this.tape); }
  get wS() { return this.v / this.rS; }      // rad/s (supply pays out when v > 0)
  get wT() { return this.v / this.rT; }
  get playSpeed() { return this.speedIPS * IPS; }
  get counter() { return (this.take - this.zero) / this.playSpeed; } // seconds of tape at the selected speed
  get capstanDriving() { return (this.mode === 'play' || this.mode === 'rec') && this.pinch > 0.98; }

  command(mode) {
    if (mode === 'rec' && this.mode !== 'play' && this.mode !== 'rec') mode = 'rec'; // REC from stop = PLAY + REC
    this.mode = mode;
    if (mode !== 'stop') this.endOfTape = false;
  }
  setSpeed(ips) { this.speedIPS = ips; }
  setShuttle(x) { this.shuttle = Math.max(-1, Math.min(1, x)); if (x !== 0) this.mode = 'shuttle'; }
  locate(pos) { this.take = Math.max(0, Math.min(this.total, pos)); this.v = 0; this.mode = 'stop'; }

  targetSpeed() {
    switch (this.mode) {
      case 'play': case 'rec': return this.playSpeed;
      case 'ff': return this.m.windSpeed;
      case 'rew': return -this.m.windSpeed;
      case 'shuttle': return this.shuttle * this.m.windSpeed;
      default: return 0;
    }
  }

  effectiveMass() {
    const rs = this.rS, rt = this.rT;
    return reelInertia(this.supply, this.tape, this.m) / (rs * rs) + reelInertia(this.take, this.tape, this.m) / (rt * rt);
  }

  // advance by dt seconds (call with small steps, e.g. 1 ms)
  step(dt) {
    const target = this.targetSpeed();
    const playing = this.mode === 'play' || this.mode === 'rec';
    const nearPlay = Math.abs(this.v - this.playSpeed) < this.m.pinchEngageWindow;
    const pinchWanted = playing && (this.pinch > 0.5 || nearPlay);
    this.pinch += ((pinchWanted ? 1 : 0) - this.pinch) * Math.min(1, dt / 0.06);

    if (playing && this.pinch > 0.5) {
      // capstan servo: first-order approach to play speed, slew limited
      const dv = (target - this.v) * Math.min(1, dt / this.m.capstanTau);
      const lim = this.m.capstanSlew * dt;
      this.v += Math.max(-lim, Math.min(lim, dv));
    } else {
      // reel motors: force limited; braking when the speed magnitude must fall
      const goal = playing ? this.playSpeed : target;
      const diff = goal - this.v;
      const braking = Math.abs(goal) < Math.abs(this.v) || Math.sign(goal) !== Math.sign(this.v);
      const F = braking ? this.m.brakeForce : this.m.windForce;
      const aMax = F / this.effectiveMass();
      // soft landing: ease off in the last 0.4 m/s so the reels settle instead of snapping
      const a = aMax * Math.min(1, Math.abs(diff) / 0.4 + 0.08);
      const dvMax = a * dt;
      this.v += Math.max(-dvMax, Math.min(dvMax, diff));
    }

    // lifters
    const liftWanted = !this.liftDefeat && Math.abs(this.v) > this.m.lifterSpeed && !this.capstanDriving;
    this.lift += ((liftWanted ? 1 : 0) - this.lift) * Math.min(1, dt / 0.08);

    // move tape
    const rs = this.rS, rt = this.rT;
    this.take += this.v * dt;
    this.angleS += (this.v / rs) * dt;
    this.angleT += (this.v / rt) * dt;
    if ((this.take >= this.total && this.v > 0) || (this.take <= 0 && this.v < 0)) {   // ran off a reel while moving toward it
      this.take = Math.max(0, Math.min(this.total, this.take));
      this.v = 0; this.mode = 'stop'; this.endOfTape = true;
    }
  }

  // advance real time with fixed substeps
  advance(seconds, sub = 0.001) {
    let t = seconds;
    while (t > 1e-9) { const h = Math.min(sub, t); this.step(h); t -= h; }
  }
}
