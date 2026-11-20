# SBX-80 sync engine: SMPTE on track 24 → stable MIDI clock

Use case: tape transfers. A conversion lab digitises a client's 2" reels; track 24 often carries SMPTE (LTC) printed in
the 80s by a sync box. Analog Studio loads the transfer, reads that code and, like the original SBX-80, turns it into a
steady MIDI clock (plus song position, DIN sync and time base) so period MIDI gear plays along in time with the tape.

## Pieces (all tested here, all port 1:1 to the C++ engine)

| File | What it does |
|---|---|
| `ltc.js` | LTC encoder + decoder. Biphase-mark decode with adaptive bit-period tracking, hysteresis zero-crossings, DC removal and level normalisation; finds the sync word forward **and** reversed; auto-detects 24 / 25 / 30 fps and 29.97 drop-frame (and 29.97 non-drop by comparing code time to file time); bridges dropouts; groups frames into continuous runs with their measured speed (transfer speed error); `codeAt()` maps file time → SMPTE time with a short flywheel. |
| `midiclock.js` | Steady clock out. Ticks (0xF8, 24 ppq) are generated from the tempo map and scheduled ahead with timestamps, never from the jittery incoming code. A gentle phase lock (±2 % max) pulls the tick count toward the position read off tape, so it follows vari-speed and transfer speed error. On lock: Song Position Pointer + Continue (Start at bar 1); on loss of code: Stop; on a jump: Stop, new SPP, Continue. |
| `*.test.mjs` | `npm test`: 12 tests (30/25/24 fps, 29.97 DF across a minute, noisy 8 % fast transfer, dropout, reverse, file→code mapping, DF round-trip; clock period/jitter, start/stop, re-cue on locate, vari-speed tracking). |

## How a transfer flows through the app

1. **Import.** Track 24 is read as its own stem (labs usually deliver one mono file per track) or as channel 24 of a
   24-channel interleaved file.
2. **Decode once, offline.** The whole of track 24 is decoded in the background (seconds for a full reel) into a
   *code map*: runs of `{file time, SMPTE time, speed, direction}`. Gaps (splices, leader, dropouts) are kept as gaps;
   short ones are bridged by the flywheel (default 0.5 s, the SBX freewheels through dropouts the same way).
3. **Chase.** Playback, locate, rewind and vari-speed move the file position; the engine looks the SMPTE time up in the
   map instantly. That is better than real-time reading for a sampled tape: no lock-up delay after a locate, and it can
   show the code while the tape is stopped or winding.
4. **Tempo map.** The SBX's SMPTE OFFSET says where bar 1 falls; the tempo map (keypad, TEMPO knob, or tapped in live
   against the tape with RECORD) turns SMPTE time into song / measure / beat.
5. **Out.** MIDI clock + SPP on the interface's MIDI outs (CoreMIDI with MIDITimeStamps on the Mac; Web MIDI in the
   browser mockup), DIN sync 24 ppq and the time-base pulse on spare audio outputs or a TASCAM Studio Bridge output,
   and the metronome.

## Native engine notes

- Decode on a worker thread straight from the file in blocks (no full-file load: a 24-track 2" reel at 96 kHz is large).
- Clock thread: schedule ticks 50–100 ms ahead with absolute host time stamps; the audio thread only publishes the
  current file position and speed. Clock jitter is then the OS MIDI driver's, typically well under 1 ms.
- Offsets the user may need: output latency compensation (ms, +/-) so drum machines land on the tape's beat, and a
  frame-offset for code that was striped late.
- Warn, don't fail, on: no code found, mixed frame rates, code running backwards on a forward transfer (the reel was
  transferred tails-out), big jumps (re-striped sections).

## In the mockup

SBX-80 pop-up → **LOAD TRACK 24 AUDIO** (WAV / AIFF / FLAC; a 24-channel file uses channel 24) → the decoded code
replaces the stripe on the loaded reel → **SMPTE EXT**, play the tape → **MIDI OUT** menu picks a port (Chrome / Edge;
Safari has no Web MIDI).
