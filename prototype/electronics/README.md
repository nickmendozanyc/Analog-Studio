# JH-Tape audio electronics model (MCI JH-24, manual section 4)

`jh24audio.js` models every channel's audio electronics and the tape between the heads, sample by sample.
Renderer-independent (plain loops over Float32Arrays): it runs in an AudioWorklet in the mockup
(`mockup/src/elec-worklet.js`), in the Node tests here, and ports 1:1 to the C++ engine.

## What is modelled

| Manual | Model |
|---|---|
| Record/Cue card: balanced input, IN CAL, CAL REC, record HF EQ (<) per speed, NAB/IEC | `Channel` record path: gain, high shelves, bias-dependent HF loss, tape saturation |
| Bias card: 210 kHz bias, HI/LO bias adjust, 105 kHz erase, **QUIOR** delay and ramps | `Machine.pass`: erase on → bias delayed by the erase→record head distance / speed, both ramped (on punch-in and punch-out). Bias sets HF sensitivity, level and distortion |
| Erase head, record/cue head, repro head | `Track` pieces of recorded flux by tape position; erase cuts them (with ramps), the record head writes, the repro head reads 38 mm later (50 ms at 30 ips), sync reads at the record head |
| Reproduce card: preamp, HI < / LO > EQ per speed, REPRO LVL | head bump, LF roll-off, gap loss, EQ shelves, level |
| Cue electronics, cross-feed | sync playback (more HF loss than repro), adjacent recording tracks leak in ≈ −32 dB, cross-feed cancels them |
| Output module: FET select, bias defeat | `monitorSource()`: the manual's TAPE / INPUT / AUTO / INPUT+AUTO / individual input / CUE truth table, 2 ms FET crossfade; bias defeat = spot erase |
| Spec table 1-1 | 0 VU = operating level (185–370 nWb/m), 3 % 3rd harmonic at 1040 nWb/m, hiss −64 / −60 dB re 510 nWb/m, wow & flutter 0.03–0.04 % |
| Section 7 alignment | `align()`: repro to the alignment tape (level, 10 kHz, LF), sync the same, bias peak + overbias, record level and record HF |

Tape formulations (`TAPES`, made-up names after real reels): Amtex 456 and 499, Quantica GP9, Maxwell UD, Scotia 250,
ATX Master Tape and BAFS Studio Master 900. Each sets the MOL, noise, 1 kHz and 10 kHz sensitivity and the bias it
wants; `Machine.setTape()` threads one without realigning (the meters show the mismatch until you align for it).

`mechsound.js` is the machine itself in the room (not on tape): two reel-motor whines at each reel's turns x
armature slots (they glide apart through a wind as the packs trade size, louder under load), tape and air rush with
speed, rumble and once-per-turn wobble, lifter / brake / pinch-roller solenoid clunks, and the tail flapping when tape
runs off a reel. Voiced by ear, not measured from a JH-24; MACHINE level and on/off in the electronics window.

Tape transfers (audio files) load as already-reproduced pieces; recording over them erases them like any track.
Numbers marked (approx) in the source are plausible values, not MCI data.

## Tests

`npm test` (13): factory flatness within the spec windows, 0 VU in → 0 VU out, repro delay and zero-delay sync,
monitor switching per the manual, QUIOR punch with no hole and the hole without QUIOR, MOL, bias trade-offs, cross-feed,
bias defeat, lifters during winds, NAB vs IEC alignment tapes, loaded transfers.

## In the mockup

The tape machine's cabinet front has an **AUDIO ELECTRONICS** plate: the pop-up shows the three drawers (channels
1–8, 9–16, 17–24), each channel's Reproduce, Output, Record/Cue and Bias cards with their 18-turn trims (drag up / down,
double-click realigns that channel), NAB/IEC and bias-defeat switches, CUE / SOLO / ERASE keys, a VU bar and what
the channel is monitoring. The top bar has POWER, monitor level, test oscillator (to ready tracks or all inputs),
alignment tape (tones to standard), ALIGN ALL, operating level, QUIOR, hiss, wow & flutter, LOAD TRANSFER (numbered
files or one multichannel file, placed at the counter zero) and LIVE IN (the computer's input into ready tracks).
Monitoring follows the AutoLocator's TAPE / INPUT / AUTO and its ready / input keys; the meter bridge shows the
real line-output levels while the electronics are on.
