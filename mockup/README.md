# Phase 0 – 4K UI mockup

A static, high-fidelity layout mockup at 3840×2160. It covers the tape machine, the 32-channel console and the outboard rack. No audio code exists yet. This is the approval gate set by the build prompt.

![Preview](analog-studio-mockup-preview.jpg)

Full resolution: [`analog-studio-mockup-4k.png`](analog-studio-mockup-4k.png). A vector version you can zoom in a browser: `analog-studio-mockup.html`.

## What's on screen

| Area | Contents |
| --- | --- |
| Tape machine (top left) | JH-24 top deck: Ampex 499 supply reel (full) and Quantegy GP9 take-up on black hold-down knobs; tape path supply → black guide post → roller guide → erase, record/sync and repro heads → capstan and pinch roller → cream idler → guide post → take-up; head cover with silver lid on a removable head plate. Angled front faceplate: power lamp, vari-speed and shuttle knobs, lifter lever, REW / F FWD / STOP / PLAY / REC / LIFT / EDIT, 15/30 IPS, AES/NAB, and the app's tape-character knobs (saturation, wow/flutter, hiss, bypass). MCI badge on the cabinet lip above the woodgrain drawer front |
| Autolocator (top centre) | 3D AL-III remote (shown at 72% so the console can have its meter bridge): sloped wedge on a pedestal pole and H-base with its grey cable bundle. Two red LED displays (tape time, current locate), 4 named locate memories, 24 round black TRACK READY buttons (armed tracks glow red), light-blue keypad, STORE/RECALL/LOCATE/ZERO, punch in/out/auto, all safe, and coloured transport keys |
| Tape meter bridge (top right) | 3D stepped housing (shown at 72%, meters spread across the full width): three tiers of 8 VU meters with ledges, top cap and stepped end caps. Each meter sits in a recessed window with red record and blue status lamps above, track number, masking-tape name and READY/SAFE keys below. The plinth carries the MCI badge and REPRO / INPUT / SYNC monitor keys |
| Console (bottom) | Flat front view of an MCI JH-600 series desk, with the channel strip laid out from your reference photos: 24-bus assign keys with LEDs; yellow MIC gain, GAIN / PHAN / LINE, red TRIM and odd/even bus pan; PAN toggle and DIRECT level with LED; DUMP and numbered key; gold-bracketed 3-band EQ (HI blue 4.6–16 kHz, MID sage .18–10 kHz, LOW red 30–250 Hz, ±14 dB) with printed scales; IN, filter, Ø and CHN keys; SEND 1-2 (yellow, PRE / WET), SEND 3-4 (blue pan + level, PRE), SEND 5-6 (red pan + level, PRE / 2MIX); MUTE and numbered solo key; BUS level and channel pan; REV / PFL with EQ / CHN / SOLO / TAPE LEDs; scribble strip and long-throw faders in real proportion (210 px of travel on an 85 px strip, matching a 100 mm fader on a 38 mm module) with white caps. A JH-600-style console meter bridge sits above the strips: two rows of VUs, one per channel over each pair of strips, and a large stereo L/R pair over the master section. Oak trim and stitched leather armrest. Channels 25–32 are effect returns and live inputs |
| Master section | Aux masters and returns, control-room source / dim / mono / cut with a large monitor knob, cue / studio, talkback, oscillator and bounce-to-WAV; 8 group faders with coloured caps and a yellow / teal stereo master pair; the stereo VUs are on the console meter bridge |
| Outboard rack (right side panel) | 3D cabinet seen from the left: wood sides, recessed rails, back panel. Lexicon 224, 2× UA 1176LN, 2× Yamaha SPX90, 2× Lexicon PCM41, 2× PCM42 with 3D knobs; three VST3/AU slots; insert patchbay with cables; plugin browser (scan, list, drag into a slot) |
| Top bar | Session name and source file; audio interface (TASCAM Studio Bridge, 24 in / 24 out), its MCU control link for transport and rec-ready, sample rate (48 kHz, the Studio Bridge's maximum), buffer and DSP load; tabs for the rack, patchbay and plugins |

## Reference photos applied

Corrected against your JH-24 photos and the MCI listings on [SoundBroker](https://www.soundbroker.com/manufacturers/MCI/): JH-24 (with Autolocator III) and JH-636 photos.

| Element | Change |
| --- | --- |
| JH-24 deck, autolocator, meter bridge | Warm taupe-grey finish, from your JH-24 photos; woodgrain laminate edge for the cabinet front |
| Tape VU meters | Warm cream, amber-backlit faces in a 3 × 8 bridge, with a record lamp and a status lamp above each meter |
| Transport | Raised silver strip with small coloured square buttons (REW, F FWD, STOP, PLAY, RECORD, LIFT, EDIT), a red power lamp and two black knobs |
| Head assembly | Tall black head cover with a brushed silver lid; blue-black head stacks at the tape face; black guide posts; capstan with pinch roller on its arm; cream idler roller |
| Deck layout | Removed the non-original logo plate, tape-time display, status lamps and swinging tension arms from the top deck. The tape counter lives on the autolocator, as on the real machine |
| Autolocator | Light-blue keypad keys, as on the AL-III |
| Reels | From your photos: a silver Ampex 499 (full supply reel, left) and a red Quantegy GP9 (take-up, right). Solid flanges with two radial slots, a black hub with six screws, and the printed labels |
| Console panel | Warm taupe-grey, as on the JH-636 (was blue-grey) |
| Knob caps | Colour-coded by row: black trim, white HPF, red HF, yellow HMF, blue LMF, white LF, red/yellow aux, black pan |
| Scribble strip | One continuous white strip above the faders (was masking tape at the top) |
| Fader bay | Light grey with black channel caps; group faders in yellow, green, white and black; red stereo master |
| Trim | Light oak frame and a padded brown leather armrest |

## Still unverified

- The outboard front panels have not been checked against photos yet.
- The autolocator's button grid is simplified compared to the real AL-III.
- The small, low-resolution listing photos leave the exact legends and knob-skirt detail unconfirmed.

## Tape machine rendering

The JH-24 is a real 3D scene (CSS 3D transforms, generated by `src/jh24.js`) seen from the operator's position, tilted 54°. Parts are modelled as solids:

- Reels have thickness: a back flange, a 2" tape pack between the flanges, a front flange with brushed (Ampex 499) or anodized (Quantegy GP9) finish, a black hub and three-lobed hold-down knobs.
- The tape is a 2" ribbon standing on edge, routed by tangent lines and wraps. Following your photos, it runs across the front of the head block: supply reel → tall black roller guide at front left (with a chrome lifter pin beside it) → erase / record-sync / repro → black ribbed capstan, with the slim cream pinch roller pressing from the front on its black arm housing → chunky black take-up guide → take-up reel.
- The head assembly is a box with a silver lid; the head stacks show 24 track lines.
- The transport strip is deck-coloured with the light outline that steps back on the right: indicator pin, red button, two black knobs and a lifter toggle; white REW / F FWD / STOP, green PLAY, red REC in a black bezel; blue LIFT and orange EDIT on the stepped section, then speed, EQ and the app's tape-character trims. Below it are the MCI badge and the woodgrain drawer front.

All text on the 3D tape machine surroundings and rack is 14 px or larger. The console's printed legends and knob scales are smaller (7–11 px) so the strip can follow the real JH-600 layout; the app's zoom brings them up to reading size, per the 50" 4K legibility rule. The VU scales show 20, 10, 7, 5, 3, 0 and +3 so the numbers stay readable at that size.

## JH-24 behaviour to implement (build phase)

These are planned behaviours. Exact timings and figures will be confirmed against the JH-24 manual before coding.

| Area | Behaviour |
| --- | --- |
| Transport | REW / F FWD wind with motor ramp-up and braking; PLAY or STOP from a wind decelerates first; RECORD = PLAY + REC, punch-in by pressing REC while playing, punch-out with PLAY |
| Lifters | Tape lifted off the heads during winds (no high-speed squeal); LIFT defeats the lifters for cueing; LIFTERS lever on the strip |
| Edit mode | EDIT releases the take-up so tape spills for splicing |
| Shuttle / vari-speed | Shuttle knob gives variable-speed winding in either direction; vari-speed shifts play speed (pitch and tempo) |
| Speed and EQ | 15 / 30 IPS with matching tonal changes; AES / NAB equalisation |
| Track arming | Per-track READY / SAFE; armed tracks switch to input on record; REPRO / INPUT / SYNC monitoring, with SYNC playing back from the record head for overdubs |
| Reels | Angular speed = tape speed ÷ pack radius; pack radii follow tape position; end-of-tape stop |
| Counter | Tape time derived from the idler (tach) roller; shown on the autolocator |
| Autolocator (AL-III) | Store / recall locate points, zero, search-to-cue, auto punch in/out with pre-roll |

## Rebuild

```sh
node mockup/src/build.js   # writes the SVG + HTML
node mockup/src/render.js  # renders the 4K PNG (uses the preinstalled Playwright/Chromium)
```
