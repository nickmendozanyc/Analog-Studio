# Reference: dbx 160X single-channel compressor/limiter (c. 1981)

Engineering notes for drawing the front panel and building a DSP model. Written in our own words from the
sources listed in section 6; nothing here is copied from the manuals (they are copyrighted and are not committed
to this public repo; fetch them again from the URLs below). Where a value is inferred rather than stated, it is
marked **[inferred]** or **[assumption]**.

Page numbers below are the printed page numbers of the documents (the 160X instruction manual scan is 9 PDF
pages, printed pages 1-2, then 11-14, with the specification page duplicated; the 160X/XT service manual is a
28-page PDF whose last pages reproduce the older 160X manual).

---

## 1. What it is, history, variants

The 160X is a mono, 1U, full-rack-width VCA compressor/limiter with true-RMS detection, a feed-forward gain
computer, switchable soft knee ("Over Easy") or hard knee, ratios that run past infinity into negative values
("Infinity+"), fixed (non-adjustable) program-dependent attack and release, and two LED bar meters. Two units
can be linked for stereo with a TRS patch cable between their STRAPPING jacks plus a front-panel SLAVE button.

Lineage (dates are approximate; the manuals do not give them):

| Model | Notes |
|---|---|
| 160 / 160 VU (1970s) | Original dbx compressor, hard knee only, true RMS + Blackmer VCA, VU meter. Half-width, 2U-style box per secondary sources. The 160X manual says that in hard-knee mode the 160X behaves like "its predecessor, the 160" (p. 13). |
| 161, 162 | 161 was a smaller mono version, 162 a stereo (two-channel) version of the 160 design; hard knee. The 160XT manual names "160, 161 and 162" as the units that made the hard-knee curve popular (160XT intro). |
| 165 / 165A | Larger, 2U units that introduced Over Easy and had manual attack/release; secondary sources say the 160X took its Over Easy circuit from the 165. |
| **160X** (c. 1981) | Subject of this document. First 1U 160; adds Over Easy/hard-knee switch, Infinity+ negative ratios, 19 + 12 LED meters, threshold LEDs, hard-wire bypass, barrier strip + TRS jacks, separate detector input. Single-ended output (balanced via optional AB-1 card or a Jensen transformer). No power switch. |
| 160XT (c. 1989-93, AKG era) | Same front panel and audio behaviour, plus XLR in/out, active-balanced XLR output, input ground-lift switch, detector input on a normalled TRS jack (no barrier strip), and "true power summing" stereo link (slave RMS energy summed with master's). A 160X can be slaved to a 160XT master. |
| 160A, 160S, 160SL (1990s-2000s) | Later redesigns (160A is the plain 1U successor; 160S/160SL are the high-end "Blue" series). Different panels and circuits; do not use as references for the 160X look. |
| 163X / 263X / 463X | Mid-1980s budget "X series" (one-knob compressor, de-esser, gate); not the same thing despite the X. |

What distinguishes the 160X: the combination of (a) no attack/release knobs, the timing coming entirely from the
RMS detector; (b) the ratio knob that keeps going past infinity:1 to -1:1; (c) the switchable Over Easy knee; (d)
the meter pair (19-LED level, 12-LED gain reduction) on a black 1U panel.

## 2. Specifications (160X unless marked XT)

Sources: 160X manual section 1.4 (p. 2-3 area, specification page) and 160XT spec page (service manual p. 24).

| Item | Value |
|---|---|
| Threshold range | -40 dBm to +20 dBm (7.8 mV to 7.8 V RMS); XT quotes the same in dBu |
| Compression ratio | Continuously variable 1:1 -> infinity:1 -> -1:1 ("Infinity+") in both knee modes. In hard knee the knob sets the exact ratio; in Over Easy it sets the ultimate (maximum) ratio reached above the knee |
| Max compression | more than 60 dB |
| Threshold characteristic | Over Easy or hard knee, switch selectable |
| Attack | Program dependent: about 15 ms for a 10 dB step above threshold, 5 ms for 20 dB, 3 ms for 30 dB. Defined (footnote) at infinite ratio as the time for the output to fall by 63% of the step |
| Release | 160X manual: program dependent, roughly 0-500 ms, varies with control settings. XT spec: 8 ms for 1 dB, 80 ms for 10 dB, 400 ms for 50 dB, i.e. a constant **125 dB/s** recovery rate |
| Output gain | -20 dB to +20 dB, fixed gain after the VCA; does not move the threshold |
| Input impedance | 50 kOhm unbalanced, 100 kOhm balanced (active, LF353 differential stage) |
| Detector input impedance | 230 kOhm unbalanced, 460 kOhm balanced; XT max detector input +28 dBu |
| Max input level | +24 dBm (XT: +24 dBu, 12.3 V RMS) |
| Output | 22 Ohm source impedance, single ended, drives 600 Ohm or more to +24 dBm (XT: balanced 22 Ohm on XLR, 44 Ohm unbalanced on the jack) |
| Slew rate | more than 10 V/us |
| Dynamic range | more than 113 dB (max level vs A-weighted output noise) |
| Equivalent input noise | below -89 dBm unweighted, 20 Hz-20 kHz |
| Frequency response | 20 Hz-20 kHz +0/-1 dB (XT: +/-0.5 dB) |
| Distortion below threshold | 2nd harmonic 0.07%, 3rd 0.07% (1 kHz, 0 dBm in/out) |
| Distortion above threshold | at infinite ratio: 2nd 0.07%, 3rd 0.02%. 2nd is roughly independent of ratio, time constant and frequency; 3rd falls at slower time constants, higher frequencies and lower ratios (i.e. it is detector ripple) |
| XT distortion | THD below 0.2% at any compression, 1 kHz; IMD below 0.2% SMPTE |
| Metering | 19-LED input-or-output level, -40 to +20 dB; 12-LED gain reduction, 1 to 40 dB. 0 dB = +4 dBm (1.23 V) by default, rear trimmer range -15 to +10 dBm |
| Indicators | BELOW/Over-Easy/ABOVE (green, yellow, red); INPUT (red), OUTPUT (red); SLAVE (yellow); BYPASS (red) |
| Connectors (160X) | Input and output: TRS jacks and a barrier strip in parallel; detector input: barrier strip (strapped to the signal input from the factory); strapping: TRS jack |
| Size | 1.75 in x 19 in x 9.25 in (1U, full 19-inch rack width). The 160X manual's metric depth "18.4 cm" is a misprint; 9.25 in is 23.5 cm, which the XT sheet gives |
| Weight | 6.5 lb (3 kg) |
| Power | 115/220 VAC +/-10%, 50-60 Hz, 8 W (rear-panel description says 12 W max). No power switch, no power LED |
| Accessory | AB-1 active balanced output card; an output transformer footprint (marked OPT) exists on the board |

## 3. Front panel and rear panel (for drawing)

Sources: 160X manual Fig. 1-1 (p. 2) and 160XT manual Figure 1 (service manual p. 4), ratio dial Figure 5
(service manual p. 9 / 160X manual Fig. 3-2B), LED legends from the 160X schematic (manual p. 16).

### 3.1 Proportions and layout

Panel: 19 in x 1.75 in (aspect about 10.9 : 1), standard 1U rack ears (two slotted holes each side). The
artwork (both manuals) is laid out on two text baselines: controls in the upper two thirds, labels in a single
row along the bottom edge. Horizontal positions measured from the 160XT drawing as a fraction of the panel width
from the left edge (the 160X drawing matches to within a couple of percent):

| x (% of width) | Element |
|---|---|
| ~7.5% | Maker logo (large lowercase wordmark), model number "160X" in smaller type directly beneath it, left-aligned with the logo |
| ~17% | BYPASS: small round LED on the upper line, rectangular push button below it, label "BYPASS" under the button |
| ~23% | SLAVE: same arrangement (LED, rectangular button, label) |
| ~31% | THRESHOLD knob (label under it) |
| ~39-40% | Three threshold LEDs in a row, word "THRESHOLD" above them, "BELOW" under the left LED and "ABOVE" under the right; the OVER EASY rectangular button below them, label "OVER EASY" |
| ~47% | COMPRESSION RATIO knob (two-line label "COMPRESSION / RATIO") |
| ~57% | OUTPUT GAIN knob (two-line label "OUTPUT / GAIN") |
| ~63-64% | DISPLAY: two small LEDs stacked vertically, "INPUT" above the top one and "OUTPUT" below the bottom one, joined by a bracket line that leads right into the start of the level meter row; rectangular DISPLAY button below, label "DISPLAY" |
| ~68% to ~90% | Upper row: 19 equally spaced LEDs (LEVEL), legend "LEVEL" at its right end. Between the rows a line of small scale numbers. Lower row: 12 LEDs, left-aligned under the first 12 level LEDs, followed by a horizontal rule leading to the legend "GAIN REDUCTION" |
| ~79% (bottom line) | "COMPRESSOR/LIMITER" centred under the meters |

The three knobs are the same size, small (roughly 0.5-0.6 of the panel height in diameter in the drawings), each
with a pointer line and a ring of short radial ticks with printed values. The push buttons are wide, flat
rectangles (about 2.5x as wide as tall) sitting on the lower line, with their LED (where they have one) on the
upper line directly above.

### 3.2 Knob scales

- **THRESHOLD**: seven ticks over a standard ~300 degree sweep: -40 dBm (lower left end), -30, -20, -10 (top
  centre), 0, +10, +20 dBm (lower right end). End labels carry the "dBm" unit.
- **COMPRESSION RATIO**: ticks 1:1 (lower left), 2:1, 3:1, 4:1 (just left of top), 6:1 (just right of top),
  10:1, infinity:1 (about 3 o'clock); after infinity the scale arc is drawn as a **thick black band** (the
  Infinity+ region) through -5:1 and -2:1 to -1:1 at the bottom, a little left of 6 o'clock. The dial therefore
  covers a larger arc than the other two (~320 degrees, measured off the drawing; [inferred]). The XT manual says
  about 4:1 is at 12 o'clock, and the pot law expands the low ratios.
- **OUTPUT GAIN**: five ticks: -20 dB (lower left), -10, 0 (top), +10, +20 dB (lower right).

### 3.3 LEDs and meters

- Threshold LEDs (left to right): BELOW = green, middle = yellow/amber (only lights in Over Easy mode, in the
  knee region), ABOVE = red. Exactly one is lit at a time [inferred from the comparator logic, U106A/B, LM339].
- BYPASS LED red; SLAVE LED yellow; INPUT and OUTPUT LEDs red (one lit, shows what the level meter reads).
- Level meter, 19 LEDs, left to right, values printed between the rows: -40, -30, -20, -15, -10, -8, -6, -5, -4,
  -3, -2, -1, 0, +1, +2, +4, +6, +10, +20. Per the schematic the first 12 (-40 to -1) are **yellow** and the last
  7 (0 to +20) are **red**. It is a bar (all LEDs up to the level lit; comparator ladder). True-RMS driven (its own
  RMS detector, U203). 0 = +4 dBm nominal. The METER (DISPLAY) switch selects input (button in) or output
  (button out) for this row only.
- Gain-reduction meter, 12 LEDs, all **red** per the schematic, values 1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30, 40 dB.
  On the panel the row sits under the left 12 level positions and uses the same printed numbers, so the 1 dB LED
  is the rightmost of the row (next to the "GAIN REDUCTION" rule) and the bar grows **leftwards** towards 40 dB
  [inferred from the alignment of the two rows in both panel drawings; check against a photo]. It always shows
  gain reduction, never the output-gain setting.
- There is no power LED and no power switch.

### 3.4 Colours

Not stated in any document read. From the drawings (all-black text on white) nothing can be confirmed.
Commonly seen units (to be checked against a photo before finalising): black painted/anodised panel with white
legends, black knobs with a white pointer line, black rectangular push buttons. In the 160XT drawing the
threshold and ratio knobs are drawn with a light stipple and the output gain knob with a darker hatch, which may
mean the output knob is a different colour on the XT. **[unverified]**

### 3.5 Rear panel (160X, left to right as seen from the back; manual Fig. 1-2, service manual p. 28)

"MODEL 160X" legend; SIGNAL INPUT TRS jack (tip +, ring -, sleeve ground); a small block of warning text; a
barrier strip of about 11 screw terminals: ground, DET IN +, SIGNAL INPUT +, ground, SIGNAL INPUT -, DET IN -,
then SIGNAL OUTPUT +, ground, SIGNAL OUTPUT -, ground (factory metal straps join each DET IN terminal to the
neighbouring signal input terminal; remove them to use an external sidechain); SIGNAL OUTPUT TRS jack; METER
CALIBRATION trimmer (screwdriver); STRAPPING TRS jack; at the far right a recessed line-voltage indicator window
and the captive AC cord. In normal mode the output jack's ring is grounded; in bypass it carries the input's cold
leg so a balanced feed passes straight through.

160XT rear differs: XLR input and output added (pin 3 hot in that manual), DETECTOR INPUT becomes a normalled TRS
jack, ground-lift switch, no barrier strip.

### 3.6 Photos

No usable photograph could be fetched in this session (Reverb, Gearspace and vintage-dealer pages are
blocked or bot-protected). Listing pages to look at manually:
https://reverb.com/item/99278262-dbx-160x-compressor-limiter ,
https://reverb.com/item/99381405-dbx-160x-compressor-limiter-2000s-black ,
https://equipboard.com/items/dbx-160x . Use one to confirm panel/knob/LED colours and the GR-bar direction.

## 4. How it works

Source for this section: 160X schematic (manual p. 16, archive.org item `dbx_160x_Schematic`), plus the
manual text. Component references below are from that schematic.

### 4.1 Block diagram

```
 IN (bal) --> U101A LF353 diff input --> U201 dbx VCA (current out) --> U101B I/V --> U103 LF351 + discrete
   |                                         ^                                     complementary output
   |                                         | control voltage (dB-linear)        stage, 22 Ohm --> OUT
   |  (barrier straps / normalling)          |                                    (output gain applied here)
 DET IN (bal) --> U102 LF351 diff --> U202 dbx true-RMS detector (log output, dB-linear)
                                         |
                                         v
          threshold offset (VR140 THRESHOLD) --> U104A/B, U105A/B (4558) with diode network D107-D109,
          D110, D113, D114: knee shaping (S103 OVER EASY switch) --> ratio scaling (U107/U108, RATIO pot,
          sign inversion for Infinity+) --> VCA control port; also to GR meter ladder (U306-U308, LM339)
          and threshold-LED comparators (U106, LM339).
 Meter: S104 selects input or output --> U203 second RMS detector --> 19-LED comparator ladder (U301-U305).
 Strapping jack: the detector/control node of two units is tied when one is in SLAVE (S102).
```

- **Feed-forward**: the detector looks at the input (or the external detector input), never at the VCA output.
  This is what makes exact ratios, infinity:1 and negative ratios possible: the gain computer just multiplies
  the detector's dB-above-threshold by a constant that can exceed 1.
- **VCA**: U201 is an 8-pin single-in-line dbx hybrid, labelled only by dbx part number 146732 on the schematic.
  It is a Blackmer (log-antilog, class AB) VCA with current output into a virtual ground (U101B). Forum lore
  places it in the dbx 202 hybrid family; the later 160XT is often said to use the 2150-series chip. Neither is
  confirmed by a document read here **[unverified]**. Its control port is dB-linear (exponential gain law), which
  is why the whole control path works in dB.
- **RMS detectors**: U202 (control) and U203 (meter) are 8-pin dbx hybrids, part 146742. The control detector is
  fed through 0.33 uF / 24.3 kOhm from the detector-input buffer; a 10 uF timing capacitor (C150) sits on it. The
  dbx detector rectifies, takes the log, doubles it (squaring in the log domain), and averages with a single RC in
  a log-domain filter, so its output is a dB-linear voltage of the **mean-square** level averaged by one time
  constant. Attack and release are the same time constant acting on power; this is the "program dependent"
  behaviour, and it explains every timing figure in the specs (see 4.4).
- **Threshold**: an adjustable DC offset subtracted from the detector's dB voltage (VR140). Because the control
  is DC, the pots carry no audio (the XT manual stresses "DC-controlled parameters").
- **Over Easy**: a diode network (three series diodes D107-D109 plus D110/D113/D114 around U104A/U105) adds the
  above-threshold signal gradually. A diode's exponential I-V law, working on a dB-linear voltage, gives a
  smooth "soft rectifier" (softplus-like) transition rather than a corner. S103 bypasses it for hard knee.
  The manual defines the Over Easy threshold as the middle of the knee: halfway between where gain reduction
  starts and where the curve reaches the set ratio.
- **Ratio**: the above-threshold control voltage is scaled by the RATIO pot through the U107/U108 stages; past
  infinity:1 the scaling continues past the point where VCA gain change equals the detector change, so the output
  falls as the input rises (down to slope -1 at -1:1). Pot taper expands the low ratios.
- **Stereo strapping**: 160X manual: with a TRS cable between STRAPPING jacks and one unit's SLAVE pressed, the
  two detectors are compared against the master's threshold and whichever needs more compression drives both
  (i.e. a **max** link). The slave's front controls except BYPASS and DISPLAY are disabled. 160XT changes this to
  **power summing**: the slave's RMS energy is added to the master's before the control voltage is formed.
- **Bypass**: a mechanical switch (S101) wires input to output (hard-wire bypass); works unpowered.
- **Output stage**: LF351 driving a complementary transistor pair with 33 Ohm emitter resistors, then 22 Ohm
  build-out resistors (the 22 Ohm output impedance). OUTPUT GAIN sets this stage's gain, +/-20 dB.

### 4.2 Static curves read from the manual figures

- Hard knee (160X Fig. 3-1, XT Figure 4): straight lines rotating about the threshold point; 2:1, 4:1, 20:1,
  infinity:1 drawn.
- Over Easy (XT Figure 3, 160X Fig. 3-1): for infinity:1 the output is already about 2-3 dB below the 1:1 line
  at the threshold input, departs from 1:1 around 5-7 dB below threshold, and reaches its flat asymptote around
  5-8 dB above threshold. The amber-LED region is drawn from about -4 to +6 dB re threshold. Total knee
  width is therefore about 12-15 dB.
- Infinity+ (XT Figure 5): at -1:1 the output falls 1 dB per dB above threshold; the drawn curve has a rounded
  top at threshold (Over Easy on).

### 4.3 Level references

Threshold and meter values are in dBm into a high impedance, which numerically equals dBu (0 dB = 0.775 V RMS).
Meter 0 = +4 dBu by default. Max in/out +24 dBu.

### 4.4 Detector time constant, worked out from the specs

Model the detector as power p(t) averaged by one pole with time constant tau, level L = 10 log10(p).

- Release: after the signal drops, p decays as exp(-t/tau), so L falls at 10 log10(e)/tau = 4.343/tau dB/s.
  The XT's 125 dB/s gives **tau ≈ 35 ms**. The 8/80/400 ms figures for 1/10/50 dB are this same constant rate.
- Attack: for a step of D dB, the time for L to cover 63% of D is t = -tau ln(1 - (10^(0.063 D) - 1)/(10^(D/10) - 1)).
  With tau = 35 ms this gives about 15.8 ms (10 dB), 6.7 ms (20 dB), 2.8 ms (30 dB), against the published 15 / 5 /
  3 ms. One single averaging constant reproduces both the attack table and the release rate, which supports the
  one-pole mean-square model.
- The 160X's "0-500 ms, depends on the controls" release wording is the same thing seen at the output: the
  recovery time in ms is the amount of gain reduction in dB divided by 125 dB/s, scaled by (1 - slope) of the
  gain computer.
- Ripple: a 35 ms power average lets some 2f ripple through at low frequencies, which is the 3rd-harmonic
  distortion the spec says falls with frequency and with lower ratios. A correct model reproduces it
  automatically.

## 5. Modelling recipe

Sample rate fs. Work on the detector signal d[n] (= audio input unless an external sidechain is patched), audio
x[n].

1. **Level calibration** [assumption]: map 0 dBFS = +24 dBu (the unit's clip point). Then the threshold knob's
   -40..+20 dBu maps to -64..-4 dBFS and meter 0 dB (+4 dBu) is -20 dBFS. Keep the calibration as a constant so it
   can be changed.
2. **True-RMS detector** (one pole on power, same tau both directions):
   `p[n] = p[n-1] + a * (d[n]^2 - p[n-1])`, `a = 1 - exp(-1/(tau*fs))`, `tau = 0.035 s`
   (range to try: 30-40 ms). `L[n] = 10*log10(p[n] + 1e-20)` in dBFS, plus the +3.01 dB offset if you want a sine's
   RMS to read like its RMS value (p of a sine of peak A is A^2/2; 10 log10 of that already is the RMS level, so
   no offset is needed). Do not add any extra attack/release smoothing; the original has none.
   Stereo link: 160X style `L = max(L_left, L_right)`; 160XT style `p = p_left + p_right` before the log.
3. **Gain computer** in dB, with `e = L - T` (T = threshold) and slope `s = 1/R`:
   - The ratio knob maps to s from +1 (1:1) through 0 (infinity:1) to -1 (-1:1). Parameterise the knob by s
     directly. Suggested taper from the dial drawing [inferred]: positions (0..1) 0.00 -> 1:1, 0.13 -> 2:1,
     0.27 -> 3:1, 0.38 -> 4:1, 0.50 -> 6:1, 0.62 -> 10:1, 0.70 -> infinity:1, 0.79 -> -5:1 (s=-0.2),
     0.90 -> -2:1 (s=-0.5), 1.00 -> -1:1; interpolate in s between ticks.
   - Hard knee: `G = (s - 1) * max(0, e)` dB.
   - Over Easy: `G = (s - 1) * k * ln(1 + exp(e / k))`, a softplus knee centred on the threshold, so that at
     e = 0 the curve sits k*ln2 below the hard line, matching "threshold is the middle of the knee". Fit to the
     manual's infinity:1 curve gives **k ≈ 3-3.5 dB** [inferred from figures] (gain reduction ≈ 2.2 dB at
     threshold, within 0.5 dB of the asymptotes about 6-7 dB either side; whole knee ≈ 12-14 dB). A quadratic knee
     of width W ≈ 14 dB is an acceptable alternative but has a corner in its second derivative and less reduction
     at threshold (W/8 ≈ 1.75 dB at infinity:1).
   - Clamp total gain reduction at, say, -70 dB (spec: more than 60 dB available).
   - Threshold LEDs: hard-knee mode: green if e < 0, red if e >= 0. Over Easy mode: green if e < -5 dB,
     red if e > +5 dB, amber in between [assumption; the manual figure puts the amber window at roughly
     -4..+6 dB re threshold].
4. **VCA**: `y = x * 10^((G + OutGain)/20)` applied sample by sample with the unsmoothed G. Optional colour
   [assumption, scaled to the spec]: a tiny static 2nd-harmonic term, `y += c2 * y^2` with c2 chosen for 0.07%
   2nd harmonic at +4 dBu (independent of gain reduction, per the footnote), plus a DC-block after it. The 3rd
   harmonic comes from detector ripple, not from a waveshaper.
5. **Output gain**: -20..+20 dB, applied after the VCA, not seen by the GR meter, not interacting with threshold.
6. **Output clip** [assumption]: soft-saturate near +24 dBu (0 dBFS under step 1), e.g. tanh above about
   -1 dBFS; the real output stage is an op-amp plus discrete push-pull, so the clip is fairly hard.
7. **Noise** [optional]: output noise floor about -89 dBu A-weighted (113 dB below +24 dBu) i.e. about -113 dBFS;
   only worth adding as a fixed white/pink floor if the product wants it.
8. **Bypass**: pure wire, output = input (no output-gain).
9. **Meters**:
   - Level: a separate one-pole mean-square detector (same structure, tau ~35 ms is a reasonable start; the
     meter detector on the schematic has a larger timing capacitor so it may be slower [inferred]), read in dBu,
     minus the calibration (default +4 dBu = 0), quantised to the 19 thresholds listed in 3.3, bar mode, input or
     output by the DISPLAY switch.
   - GR: -G (positive dB) quantised to 1,2,3,4,5,6,8,10,15,20,30,40, bar mode.

Uncertain / to verify: knee constant k (from figures only), the ratio-pot taper (from one drawing), the VCA
chip identity, panel and knob colours, the GR bar direction, and the meter detector's time constant.

## 6. Sources actually read

- dbx 160X instruction manual (AKG reprint), archive.org item `dbx_dbx_160x`:
  https://archive.org/details/dbx_dbx_160x (PDF and OCR text). Gave: product description (p. 1), front panel
  description and Fig. 1-1 (p. 2), specifications (spec page), operation incl. threshold, ratio, Over Easy, Fig.
  3-1 and 3-2 (p. 11), stereo strapping, meter calibration (p. 12), applications incl. Infinity+ and detector
  input (p. 13-14). Same manual also as archive.org item `JL10313` (OCR used to cross-check).
- dbx 160X schematic, archive.org item `dbx_160x_Schematic`: https://archive.org/details/dbx_160x_Schematic
  (manual p. 16). Gave: LED counts, dB legends and colours of all three LED rows, IC types (LF353, LF351, 4558,
  LM339, dbx hybrids 146732 and 146742), detector input network and 10 uF timing capacitor, Over Easy diode
  network, output stage, switch functions, barrier/jack wiring.
- dbx Model 160X/XT service manual (preliminary, AKG 1993), archive.org item `dbx_160X-XT_Service_Manual`:
  https://archive.org/details/dbx_160X-XT_Service_Manual . Gave: 160XT feature differences (intro), front panel
  Figure 1 with knob scales (p. 4), rear panel (p. 5-6), Over Easy/hard knee figures 3-4 (p. 8), ratio dial and
  Infinity+ Figure 5 (p. 9), power-summing stereo link (p. 10), 4:1 at 12 o'clock (p. 11), specifications incl.
  the 125 dB/s release (p. 24), and the 160X rear panel figure and description (p. 26-28, reprinted 160X manual).
- dbx 163X service manual OCR, archive.org item `dbx_163X_Service_Manual` (only to confirm the 163X is a
  different product).
- Sound On Sound, Oct 1986, "Triple 'X' Rating" (163X/263X/463X review), https://www.muzines.co.uk/articles/triple-x-rating/1667
  (confirms the X series is a separate budget line).
- Search-result summaries only (pages not readable from this session): Vintage Digital
  (https://vintagedigital.com.au/?p=148813: 160X as successor to the 160 VU with Over Easy from the 165),
  Mixdown "Gear icons: dbx 160" (https://mixdownmag.com.au/features/gear-icons-dbx-160: original 160 half-width,
  160X the first 1U), GroupDIY/Gearspace schematic threads (not read).
