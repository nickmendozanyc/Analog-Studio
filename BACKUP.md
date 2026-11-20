# Studio v1 backup

A snapshot of the Analog Studio studio environment, taken on 20 November 2026 before a major change in direction. This exact state is commit `7c3028c` on the `claude/artifact-session-358pt5` branch (tagged `studio-v1` in the local clone).

## What the snapshot holds

| Part | Where |
| --- | --- |
| 4K mockup (tape machine, autolocator, meter bridge, JH-600-style console, rack) | `mockup/` (generator in `mockup/src/`, render `mockup/analog-studio-mockup-4k.png`) |
| Interactive mockup with pop-up views (tape machine, meter bridge, Lexicon 224X, patchbay) | `mockup/analog-studio-mockup.html` |
| JH-24 reel prototype and transport physics (2500 ft reels, 7.5 / 15 / 30 IPS, vari-speed) | `prototype/reels/` |
| Full-page magazine ad | `marketing/magazine-ad/` |

## Restore

```sh
git fetch origin claude/artifact-session-358pt5
git checkout 7c3028c                    # look at the snapshot
git switch -c restore-studio-v1 7c3028c # or start new work from it
```

Rebuild the mockup with `node mockup/src/build.js && node mockup/src/render.js`; rebuild the reel prototype with `node prototype/reels/build.mjs` (tests: `node --test prototype/reels/physics.test.mjs`).

## Published pages at the time of the snapshot

These live on claude.ai, outside the repo; each keeps its own version history.

| Page | Link |
| --- | --- |
| Build prompt and spec (doc, revision 48) | https://claude.ai/artifact/RKeQzMemPtLd1Gp7LCAYP3 |
| Analog Studio Console (interactive mockup) | https://claude.ai/artifact/V3t8WtLmPnbLcf9KgcN1r9 |
| JH-24 Reel Prototype | https://claude.ai/artifact/7SK9SgLZCmkgxd7DRtVFHX |
| Analog Studio Magazine Ad | https://claude.ai/artifact/DBGvHNtvxCr82LbtZg3uc6 |
