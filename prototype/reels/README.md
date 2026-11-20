# HJ-24 reel prototype

A first, runnable test of how the reels and tape move. A full reel is 2500 ft. It shows a 3D HJ-24 transport (Amtex 499 supply, Quantica GP9 take-up) driven by real transport physics, so the motion can be judged on the target Mac and display before the full app is built.

## Run it

- **Easiest:** open the published page link (it runs in Safari or Chrome; on Apple Silicon, WebGL is drawn through Metal).
- **Locally:** open `dist/jh24-reels-local.html` in a browser. It loads three.js from the jsDelivr CDN, so it needs internet access.

Controls: **Space** play / stop, **←** rewind, **→** fast forward, **R** record, **S** stop, **B** motion blur on/off. Drag to look around, scroll to zoom. The strip also has LIFT (lifter defeat), 7.5 / 15 / 30 IPS, VARI (vari-speed on/off with a ±20 % slider; the readout shows percent and semitones), a shuttle slider, and Head / Middle / Tail to load the reel at different points.

## What to judge

1. Play from the head at 30 IPS: the full 2500 ft supply reel (a 10.5" reel, packed almost to the flange) turns at about 58 rpm and the empty take-up at about 127 rpm. Load Middle and both run at about 75 rpm; load Tail and the ratio reverses.
2. Fast forward and rewind spool up and brake with weight; a full reel is slower to start and stop than a balanced one.
3. Press PLAY during a wind: the reels brake first, then the cream pinch roller swings in and the capstan takes over.
4. During winds the lifter pins push the tape off the heads; LIFT keeps it on.
5. Toggle motion blur (B) at wind speed: with blur the slots and labels smear the way they do to the eye; without it they strobe.
6. The frame-rate readout should hold your display's refresh rate (60 or 120 fps).

## Transport feel

The Feel keys switch the transport profile in `physics.js` (`TRANSPORTS`). The HJ-24 profile steps its reel torque straight in, so winds start and stop with a slight lurch. The Stauder A827 profile is jerk-limited: acceleration builds and fades along an S-curve with a long, gentle landing, the A827's famously smooth transport. From a 1000 ft position the HJ-24 reaches wind speed in about 0.7 s and stops in 0.5 s; the A827 takes about 1.3 s and 1.4 s, without any jolt. The visuals stay those of the HJ-24 for now.

## How it works

- `physics.js`: renderer-independent transport model in SI units: pack radius from tape length, reel speed = tape speed ÷ pack radius, force-limited reel motors with the inertia of each pack, capstan servo for play, pinch-roller engagement near play speed, lifters, end of tape. It is written to port directly to the C++ engine.
- `index.src.html`: three.js renderer. The flange shader evaluates the slots, label and brush streaks at 16 instants across a 180° shutter, which gives real motion blur; the brushed-metal highlight stays fixed to the light while the reel turns. The tape is a 2" ribbon on edge, re-routed every frame by tangent lines as the pack radii change, and its surface texture moves with the tape.
- `build.mjs` inlines the physics into `dist/`; `physics.test.mjs` holds the physics tests; `check.mjs` renders headless screenshots.

```sh
npm install            # three.js, only for the headless check
node --test physics.test.mjs
node build.mjs
node check.mjs         # writes dist/shot-*.png (software WebGL: fps here is meaningless)
```

Figures marked "approx" in `physics.js` (reel inertia, motor force, wind speed, 2.0 mil overall tape thickness, 10.5" reel and 4.5" hub) are starting values to tune against the real machine.
