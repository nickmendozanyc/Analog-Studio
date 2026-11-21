// Chase synchronizer: makes a slave tape transport follow master time code, the job of a two-machine synchronizer
// (Adams-Smith Zeta-Three style). Renderer-independent: the app, the Node tests and the native engine share it.
//
//   master code ──> CodeTracker (flywheel PLL: smooth position + speed from jittery MTC quarter frames / LTC frames)
//                         │
//   slave code ───────────┼──> Chaser: error = master + offset − slave
//                         │     PARK   master stopped: wind the slave to the master position, stop there
//                         │     CUE    master rolling, slave far: wind to a lead-in point ahead, wait, drop into play
//                         │     PULL   playing, error under a second: speed loop on the capstan (vari-speed / ext ref)
//                         │     LOCK   error inside the phase window: resolve (speed held, slow trim only)
//                         └──> commands to the slave: locate / play / stop / capstan speed
//
// Times are in seconds of time code. Speeds are ratios (1 = nominal play speed).

export class CodeTracker {
  // fps: the code's frame rate (sets the quantisation the tracker expects); flywheel: seconds to coast without code
  constructor({ fps = 30, flywheel = 0.5, bw = 2.0 } = {}) {
    this.fps = fps; this.flywheel = flywheel; this.bw = bw;
    this.pos = null; this.rate = 0; this.lastIn = -1e9; this.t = 0; this.locked = false;
  }
  // a code value arrived at local time t (seconds)
  input(t, code) {
    if (this.pos === null || Math.abs(code - this.predict(t)) > 0.5) {   // first code, or a jump: restart the flywheel
      this.pos = code; this.t = t; this.rate = this.lastCode != null && t > this.lastIn && t - this.lastIn < 0.2 ? Math.max(-2, Math.min(2, (code - this.lastCode) / (t - this.lastIn))) : this.rate;
      this.lastIn = t; this.lastCode = code; this.locked = false; return;
    }
    // second-order tracking loop (critically damped): phase and frequency follow the code, jitter is filtered out
    const p = this.predict(t), e = code - p, dt = Math.max(1e-4, t - this.t);
    const w = 2 * Math.PI * this.bw, kp = Math.min(1, 2 * w * dt), ki = w * w * dt;
    this.pos = p + kp * e; this.rate += ki * e; this.t = t;
    this.lastIn = t; this.lastCode = code; this.locked = true;
  }
  predict(t) { return this.pos === null ? null : this.pos + this.rate * (t - this.t); }
  // the master's position and speed now; running = code still arriving (or coasting through a short dropout)
  read(t) {
    if (this.pos === null) return { valid: false, running: false, pos: null, rate: 0 };
    const coasting = t - this.lastIn, running = coasting < this.flywheel && Math.abs(this.rate) > 0.05;
    if (!running && coasting >= this.flywheel) { this.pos = this.predict(this.lastIn); this.t = this.lastIn; this.rate = 0; }
    return { valid: true, running, pos: running ? this.predict(t) : this.pos, rate: running ? this.rate : 0 };
  }
}

export const CHASE = {
  parkWindow: 2 / 30,      // s: a stopped slave within this of its target stays parked
  cueLead: 3.0,            // s: when chasing from far away, cue this far ahead of the master and wait for it
  playWindow: 41 / 30,     // s: farther than this while rolling = wind (cue) instead of the speed loop (Zeta constant 34: 41 frames)
  spinup: 0.3,             // s: time the slave takes from STOP to play speed
  windRate: 9,             // code seconds per second the slave covers in a wind, on average (first cue estimate)
  windSettle: 3.5,         // s: a wind's spool-up and easing onto the cue
  pullKp: 3.0,             // 1/s: speed loop gain while pulling in
  pullKi: 1.5,            // 1/s^2
  maxPull: 0.12,           // max speed correction while pulling in: ±12 %, as the Zeta-Three's capstan range
  lockIn: 0.05 / 30,       // s: inside the Zeta's wide lock window (0.05 frame) for lockHold seconds = LOCK
  tightIn: 0.003 / 30,     // s: the narrow window (0.003 frame): TIGHT lock
  lockOut: 2 / 30,         // s: drifting past this drops back to PULL
  lockHold: 1.0,
  resolveKp: 0.3,          // 1/s: in LOCK only a slow trim moves the capstan: tape speed stays steady
  resolveMax: 0.002,       // ±0.2 % trim at most
  resolveTau: 3.0,         // s: in LOCK the master's speed is averaged this long before it moves the capstan
  resolveKpRef: 0.06,      // 1/s: with a house reference nothing can drift, so the phase trim can be much gentler
};

export class Chaser {
  constructor(opts = {}) {
    this.c = { ...CHASE, ...opts };
    this.offset = 0;           // slave = master + offset
    this.state = 'IDLE';       // IDLE | PARK | CUE | WAIT | PULL | LOCK
    this.integ = 0; this.speed = 0; this.inWin = 0; this.cueAt = null; this.enabled = true;
    this.parkAhead = 0.1;      // s: parked this far ahead of the master, so the slave's start-up lag lands it in step (learned)
    this.ref = null;           // house reference speed ratio (1 = nominal, 1.001 = pulled up) when master and slave share a sync generator
    this.time = 0; this.lead = this.c.cueLead; this.locStart = 0;   // the cue lead adapts to how long this slave takes to wind
  }
  // m: { running, pos, rate } (CodeTracker.read) ; s: { code (slave time code or null), mode, playing (capstan locked
  // at speed), stopped }. Returns commands: { locate?: code, play?: true, stop?: true, speed: fraction }.
  update(dt, m, s) {
    const c = this.c, out = { speed: this.speed }; this.time += dt;
    const cue = (target, rate) => {
      if (!this.learned) { const far = Math.abs(target - s.code); this.lead = Math.max(c.cueLead, (far / c.windRate + c.windSettle) * 1.15 + c.spinup); }   // first wind: estimate from the distance
      this.cueAt = target + this.lead * rate; this.locStart = this.time; this.state = 'CUE'; return this.cueAt;
    };
    if (!this.enabled || !m.valid) { this.state = 'IDLE'; this.speed = 0; this.integ = 0; this.rateAvg = null; return { speed: 0 }; }
    const target = m.pos + this.offset;
    if (s.code == null) { this.state = 'CUE'; return out; }   // no code under the slave's heads yet
    const err = target - s.code;   // + = slave behind
    if (!m.running) {
      // master stopped: park the slave on the same frame
      this.integ = 0; this.speed = 0; out.speed = 0;
      const parkAt = target + this.parkAhead * Math.max(1, m.rate || 1), perr = parkAt - s.code;
      if (Math.abs(perr) > c.parkWindow) { if (this.state !== 'PARK' || s.stopped) out.locate = parkAt; this.state = 'PARK'; }
      else { if (!s.stopped) out.stop = true; this.state = 'PARK'; }
      return out;
    }
    // master rolling
    if (this.state === 'WAIT') {
      // parked on the cue point: drop into play when the master arrives (minus the slave's spin-up)
      const eta = (this.cueAt - target) / Math.max(0.1, m.rate);
      if (eta < 0) { if (!this.justLearned) this.lead = Math.min(60, this.lead * 1.3 + 0.5); this.justLearned = false; out.locate = cue(target, m.rate); return out; }   // the master beat us here: cue further ahead
      this.justLearned = false;   // the master beat us here: cue further ahead
      if (eta <= c.spinup) { out.play = true; this.state = 'PULL'; this.integ = 0; }
      return out;
    }
    if (!s.playing && !(this.state === 'PULL' && s.starting)) {
      if (Math.abs(err) < c.playWindow && s.stopped) { out.play = true; this.state = 'PULL'; this.integ = 0; this.learnStart = true; return out; }
      if (this.state === 'CUE' && s.stopped && this.cueAt != null && Math.abs(s.code - this.cueAt) < c.parkWindow * 3) {
        // arrived on the cue: learn how long that wind took, so the next cue is placed far enough ahead
        const took = this.time - this.locStart; this.lead = Math.max(c.cueLead, Math.min(60, took * 1.2 + c.spinup + 0.5)); this.learned = true;
        this.state = 'WAIT'; this.justLearned = true; return out;
      }
      if (this.state !== 'CUE') out.locate = cue(target, m.rate);
      return out;
    }
    if (Math.abs(err) > c.playWindow) { out.locate = cue(target, m.rate); this.integ = 0; this.speed = 0; out.speed = 0; return out; }
    // speed loop on the capstan: feed-forward the master's speed, PI on the position error. The master's speed is
    // averaged (fast while pulling in, slow once locked) so MTC delivery jitter never reaches the capstan
    const tau = this.state === 'LOCK' ? c.resolveTau : 0.25;
    this.rateAvg = this.rateAvg == null ? m.rate : this.rateAvg + (m.rate - this.rateAvg) * Math.min(1, dt / tau);
    // with a house reference the master's speed is known exactly (both run off the same crystal): resolve to it
    const ff = (this.ref != null && m.running ? this.ref : this.rateAvg) - 1;
    // learn the park-ahead (Zeta constants 42/43): the error left the moment the slave reaches speed is its start-up lag
    if (this.learnStart && s.playing) { this.learnStart = false; this.parkAhead = Math.max(0, Math.min(2, this.parkAhead + 0.7 * err)); }
    if (this.state !== 'LOCK' && this.state !== 'PULL') this.errF = null;
    if (this.state === 'LOCK') {
      const kp = this.ref != null ? c.resolveKpRef : c.resolveKp;
      this.speed = ff + Math.max(-c.resolveMax, Math.min(c.resolveMax, this.integ + kp * err));
      this.integ = Math.max(-c.resolveMax, Math.min(c.resolveMax, this.integ + kp * 0.15 * err * dt));
      if (Math.abs(err) > c.lockOut) { this.state = 'PULL'; this.inWin = 0; }
    } else {
      this.integ = Math.max(-c.maxPull, Math.min(c.maxPull, this.integ + c.pullKi * err * dt));
      this.speed = ff + Math.max(-c.maxPull, Math.min(c.maxPull, c.pullKp * err + this.integ));
      this.state = 'PULL';
      // the lock window judges the error averaged over a quarter second, so code jitter alone can't hold LOCK off
      this.errF = this.errF == null ? err : this.errF + (err - this.errF) * Math.min(1, dt / 0.25);
      this.inWin = Math.abs(this.errF) < c.lockIn ? this.inWin + dt : 0;
      if (this.inWin > c.lockHold) { this.state = 'LOCK'; this.integ = 0; }   // the speed feed-forward already carries the master's speed: lock starts from no trim
    }
    out.speed = this.speed; out.err = err; out.tight = this.state === 'LOCK' && Math.abs(err) < c.tightIn;
    return out;
  }
}
