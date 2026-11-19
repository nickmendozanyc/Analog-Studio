# JH-24 reel prototype

A first, runnable test of how the reels and tape move. It shows a 3D JH-24 transport (Ampex 499 supply, Quantegy GP9 take-up) driven by real transport physics, so the motion can be judged on the target Mac and display before the full app is built.

## Run it

- **Easiest:** open the published page link (it runs in Safari or Chrome; on Apple Silicon, WebGL is drawn through Metal).
- **Locally:** open `dist/jh24-reels-local.html` in a browser. It loads three.js from the jsDelivr CDN, so it needs internet access.

Controls: **Space** play / stop, **←** rewind, **→** fast forward, **R** record, **S** stop, **B** motion blur on/off. Drag to look around, scroll to zoom. The strip also has LIFT (lifter defeat), 15 / 30 IPS, a shuttle slider, and Head / Middle / Tail to load the reel at different points.

## What to judge

1. Play from the head: the full supply reel turns slowly (about 45 rpm) and the empty take-up fast (about 115 rpm). Load Middle and they match; load Tail and the ratio reverses.
2. Fast forward and rewind spool up and brake with weight; a full reel is slower to start and stop than a balanced one.
3. Press PLAY during a wind: the reels brake first, then the cream pinch roller swings in and the capstan takes over.
4. During winds the lifter pins push the tape off the heads; LIFT keeps it on.
5. Toggle motion blur (B) at wind speed: with blur the slots and labels smear the way they do to the eye; without it they strobe.
6. The frame-rate readout should hold your display's refresh rate (60 or 120 fps).

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

Figures marked "approx" in `physics.js` (reel inertia, motor force, wind speed, 5000 ft of 1.5 mil tape) are starting values to tune against the real machine.
