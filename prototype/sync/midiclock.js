// Stable MIDI clock out for the SBX-80 sync engine.
// The clock is generated from the tempo map, not from the incoming timecode, so it is as steady as a crystal: each
// update() schedules 0xF8 ticks ahead of time with timestamps (Web MIDI / CoreMIDI both take a send time). A gentle
// phase lock pulls the tick count toward the song position read off tape, so it follows vari-speed and transfer speed
// error without jitter. On lock it sends Song Position Pointer + Continue (Start at bar 1), on loss of code it sends Stop.

export class ClockOut {
  constructor(send, { lookahead = 0.06 } = {}) {
    this.send = send;            // (bytes: number[], timeMs: number) => void
    this.lookahead = lookahead;  // seconds scheduled ahead
    this.running = false;
    this.next = 0;               // time (ms) of the next tick
    this.count = 0;              // ticks sent since bar 1 (24 per quarter note)
    this.sent = { clocks: 0, spp: 0, start: 0, cont: 0, stop: 0 };
  }
  // now: ms clock; s: { running, beats (quarter notes from bar 1, may be negative in count-in), qps (quarter notes per second, already including tape speed) }
  update(now, s) {
    if (!s.running || s.qps <= 0 || s.beats < 0) {
      if (this.running) { this.send([0xFC], now); this.sent.stop++; this.running = false; }
      return;
    }
    const target = s.beats * 24, period = 1000 / (s.qps * 24);
    if (!this.running) {
      // start from the current position: Song Position (16ths) then Continue, or Start at the top
      const sixteenths = Math.max(0, Math.round(s.beats * 4));
      this.count = sixteenths * 6;
      if (sixteenths === 0) { this.send([0xFA], now); this.sent.start++; }
      else { this.send([0xF2, sixteenths & 0x7f, (sixteenths >> 7) & 0x7f], now); this.send([0xFB], now + 1); this.sent.spp++; this.sent.cont++; }
      this.next = now + (this.count - target) * period + 2;
      this.running = true;
    }
    // far off (locate, jump): stop and re-cue with Song Position
    const err = target - this.count + (this.next - now) / period;
    if (Math.abs(err) > 12) { this.send([0xFC], now); this.sent.stop++; this.running = false; return this.update(now, s); }
    // phase lock: stretch / shrink the period by up to 2 % toward the tape's position
    const p = period * (1 - Math.max(-0.02, Math.min(0.02, err * 0.02)));
    if (this.next < now) this.next = now;
    while (this.next < now + this.lookahead * 1000) {
      this.send([0xF8], this.next); this.sent.clocks++; this.count++;
      this.next += p;
    }
  }
}
