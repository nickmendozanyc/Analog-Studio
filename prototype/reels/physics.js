// HJ-24 reel and transport physics (SI units).
// Renderer-independent so it can be ported 1:1 to the C++ engine.
//
// Model
//  - Tape is wound on two hubs. A pack's outer radius follows from the tape length on it:
//      r(L) = sqrt(rHub^2 + L * thickness / pi)
//  - Tape speed v (m/s, + = toward take-up) is the one state variable of the transport.
//    Each reel turns at w = v / r, so the full reel turns slowly and the empty one fast.
//  - PLAY / RECORD: the capstan and pinch roller hold v at the selected speed with a fast,
//    servo-like response. From a wind, the reels brake first and the pinch roller only
//    engages once the tape is near play speed (the HJ-24's motion sensing).
//  - Winds (F FWD, REW, shuttle, stop from a wind): the reel motors are force-limited, so
//    acceleration = force / effective mass, where the effective mass of the reels seen at the
//    tape is I_supply / r_s^2 + I_takeup / r_t^2. A full reel therefore spools up and brakes
//    more slowly than a nearly empty one.
//  - Lifters hold the tape off the heads at wind speed; LIFT defeats them.
//  - Tape running off a reel stops the transport.
//
// A full reel is 2500 ft. Numbers marked (approx) are plausible values to tune by eye and ear against the real machine.

export const TAPE = {
  thickness: 50.8e-6,   // 2.0 mil overall (1.5 mil base + oxide and back coat), typical of 456 / 499 / GP9
  width: 0.0508,        // 2 inch
  density: 1350,        // kg/m^3 (approx)
  hubR: 0.0572,         // 4.5" hub diameter (approx)
  flangeR: 0.1334,      // 10.5" metal reel: 2500 ft of 2" tape on a 4.5" hub fills it
};

// Transport feel, shared by every tape machine in the app: the smooth, servo-controlled transport of the
// Studer A827. Jerk-limited S-curve reel ramps with a long, gentle landing; soft capstan servo.
//  jerk     how fast acceleration itself may change (m/s^3)
//  landing  speed band (m/s) over which the reel servos ease off before reaching the target speed
//  pinchTau time constant (s) of the pinch roller swinging in or out
export const MACHINE = {
  name: 'Smooth servo transport',
  emptyReelInertia: 0.0065, // kg m^2, aluminium 10.5" reel for 2" tape (approx)
  windSpeed: 13.0,          // m/s (~512 ips), 30 % faster winds (approx)
  windForce: 62,            // N, servo-controlled reel motors (approx)
  brakeForce: 70,           // N, electronic braking (approx)
  jerk: 12,                 // m/s^3, gentle S-curve ramps (approx)
  landing: 2.4,             // m/s
  capstanTau: 0.2,          // s, capstan servo time constant (approx)
  capstanSlew: 3.5,         // m/s^2
  pinchTau: 0.14,           // s
  pinchEngageWindow: 0.04,  // m/s, pinch roller engages within this of play speed
  lifterSpeed: 1.6,         // m/s, lifters come in above this speed
  locateDecel: 2.2,         // m/s^2, braking profile the autolocator follows into a cue point (approx)
  locateGain: 1.6,          // 1/s, final creep onto the cue point (keeps the reel servo from hunting)
  locateWindow: 0.008,      // m, close enough to the cue point to stop (about 1/3 inch, ~10 ms at 30 IPS)
};

export const IPS = 0.0254; // m/s per inch-per-second
export const FT = 0.3048;
export const ROLL_FT = 2500; // feet of tape on a full reel
export const SPEEDS_IPS = [7.5, 15, 30];
export const VARI_RANGE = 0.2;  // vari-speed range: ±20 % (about ±3 semitones)

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
    this.acc = 0;                 // current reel-motor acceleration (m/s^2), jerk limited
    this.total = Math.min(totalLength, capacity(tape));
    this.take = Math.min(Math.max(onTakeup, 0), this.total);
    this.v = 0;
    this.mode = 'stop';           // stop | play | rec | rplay | ff | rew | shuttle | locate
    this.locTarget = 0;           // tape position (m on the take-up) the autolocator is heading for
    this.locThen = 'stop';        // mode to enter on arrival (stop, or play for auto-play)
    this.speedIPS = speedIPS;     // 7.5 | 15 | 30
    this.varispeed = 0;           // fraction, -VARI_RANGE..+VARI_RANGE (0 = off)
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
  get nominalSpeed() { return this.speedIPS * IPS; }
  get playSpeed() { return this.nominalSpeed * (1 + this.varispeed); }
  get semitones() { return 12 * Math.log2(1 + this.varispeed); }   // pitch shift heard from vari-speed
  get counter() { return (this.take - this.zero) / this.nominalSpeed; } // tape time at the selected speed (vari-speed does not change it)
  get playingMode() { return this.mode === 'play' || this.mode === 'rec' || this.mode === 'rplay'; }   // capstan modes
  get capstanDriving() { return this.playingMode && this.pinch > 0.98; }

  command(mode) {
    if (mode === 'rec' && this.mode !== 'play' && this.mode !== 'rec') mode = 'rec'; // REC from stop = PLAY + REC
    this.mode = mode;
    if (mode !== 'stop') this.endOfTape = false;
  }
  setSpeed(ips) { if (SPEEDS_IPS.includes(ips)) this.speedIPS = ips; }
  setVarispeed(f) { this.varispeed = Math.max(-VARI_RANGE, Math.min(VARI_RANGE, f)); }
  setShuttle(x) { this.shuttle = Math.max(-1, Math.min(1, x)); if (x !== 0) this.mode = 'shuttle'; }
  locate(pos) { this.take = Math.max(0, Math.min(this.total, pos)); this.v = 0; this.mode = 'stop'; }   // load the reel at a position (no motion)
  // autolocator: wind to a tape position under servo control, then stop (or play)
  locateTo(pos, then = 'stop') { this.locTarget = Math.max(0, Math.min(this.total, pos)); this.locThen = then; this.mode = 'locate'; this.endOfTape = false; }
  get counterToTake() { return (sec) => this.zero + sec * this.nominalSpeed; }

  targetSpeed() {
    switch (this.mode) {
      case 'play': case 'rec': return this.playSpeed;
      case 'rplay': return -this.playSpeed;   // reverse play: the capstan pulls the tape back toward the supply reel
      case 'ff': return this.m.windSpeed;
      case 'rew': return -this.m.windSpeed;
      case 'shuttle': return this.shuttle * this.m.windSpeed;
      case 'locate': { const d = this.locTarget - this.take; return Math.sign(d) * Math.min(this.m.windSpeed, Math.sqrt(2 * (this.m.locateDecel ?? 2.2) * Math.abs(d)), (this.m.locateGain ?? 1.6) * Math.abs(d)); }   // braking curve, then an exponential creep onto the cue
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
    const playing = this.playingMode;
    const playTarget = this.mode === 'rplay' ? -this.playSpeed : this.playSpeed;
    const nearPlay = Math.abs(this.v - playTarget) < this.m.pinchEngageWindow;
    const pinchWanted = playing && (this.pinch > 0.5 || nearPlay);
    this.pinch += ((pinchWanted ? 1 : 0) - this.pinch) * Math.min(1, dt / (this.m.pinchTau ?? 0.06));

    if (playing && this.pinch > 0.5) {
      // capstan servo: first-order approach to play speed, slew limited
      const dv = (target - this.v) * Math.min(1, dt / this.m.capstanTau);
      const lim = this.m.capstanSlew * dt;
      this.v += Math.max(-lim, Math.min(lim, dv));
      this.acc = 0;
    } else {
      // reel motors: force limited; braking when the speed magnitude must fall
      const goal = playing ? playTarget : target;
      const diff = goal - this.v;
      const braking = Math.abs(goal) < Math.abs(this.v) || Math.sign(goal) !== Math.sign(this.v);
      const F = braking ? this.m.brakeForce : this.m.windForce;
      const aMax = F / this.effectiveMass();
      // soft landing: ease off within the machine's landing band so the reels settle instead of snapping
      const land = this.m.landing ?? 0.4;
      const jerk = this.m.jerk ?? 400;
      // never carry more acceleration than can be shed (at the jerk limit) before reaching the target
      const aDes = Math.sign(diff) * Math.min(aMax * Math.min(1, Math.abs(diff) / land + 0.08), Math.max(2 * jerk * dt, Math.sqrt(2 * jerk * Math.abs(diff)) - 1.5 * jerk * dt));   // floor keeps it creeping in to lock-on
      // jerk limit: acceleration itself changes no faster than the machine allows (S-curve ramps)
      const dj = jerk * dt;
      this.acc += Math.max(-dj, Math.min(dj, aDes - this.acc));
      const dv = this.acc * dt;
      const settled = Math.abs(diff) < 3e-4 && Math.abs(this.acc) <= 2 * dj;   // within a hair of the target: lock on
      if (settled || (diff >= 0 && dv >= diff) || (diff <= 0 && dv <= diff)) { this.v = goal; this.acc = 0; }
      else this.v += dv;
    }

    // autolocator arrival
    if (this.mode === 'locate' && Math.abs(this.locTarget - this.take) < (this.m.locateWindow ?? 0.004) && Math.abs(this.v) < 0.05) { this.v = 0; this.acc = 0; this.mode = this.locThen; }

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
