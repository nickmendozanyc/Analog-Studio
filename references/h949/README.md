# Studio reference: Eventide H949 Harmonizer

Research notes for building our own unit that looks, works and sounds like the Eventide H949 Harmonizer: the
late-1970s 2U digital delay / pitch changer / effects box that followed the H910 and was the first "de-glitched"
Harmonizer. Everything below is written in our own words. The manual, patent and magazine scans are copyrighted and
are **not** committed here; fetch them from the URLs in section 6.

Citation keys:

- **M p.N** = Eventide *H949 Harmonizer Instruction Manual* (operator section, Eventide Clockworks Inc., 265 West 54th
  Street, New York; warranty page dated 3/79), archive.org item `Eventide_H949_Harmonizer_owners_manual`. "p.N" is the
  manual's own "H949 page N" footer. The un-numbered front matter (feature sheet, specification sheet, caution note)
  is cited as **M spec**. We could read only the OCR text layer. Three pages are drawings with no usable OCR: the
  function/algorithm chart (p.9), the feedback EQ response curves (p.12) and the pitch-ratio table (p.13). Anything
  that would have come from them is marked as such. The separate Technical Section (theory of operation, schematics)
  is not in that scan.
- **CL** = Eventide *Clockworks Legacy* plug-in user guide (Pro Tools TDM, around 2003), archive.org item
  `manualzilla-id-5688092`, pp. 23–27 (H949 chapter). It covers a software re-creation, but it includes a drawing of
  the hardware front panel and gives production dates.
- **H910** = Eventide *H910 user and service* manual, archive.org item `sm_Eventide_H910_user_and_service` (theory of
  operation). We use it for the lineage, the converter style and the compander.
- **PAT** = US Patent 4,464,784, A. M. Agnello / Eventide Clockworks, "Pitch changer with glitch minimizer" (filed
  30 Apr 1981, granted 7 Aug 1984). This is the de-glitch method.
- **MZ-x** = muzines.co.uk articles (section 6).
- **[Web]** = a fact seen only in web-search snippets of a page we could not open from this environment (Eventide's
  "Flashback" blog series, Valhalla DSP, gearspace, groupdiy, vintagedigital.com.au). Treat it as secondary.
- **[Eng]** = our own engineering inference or modelling assumption, not a source fact.

---

## 1. What it is, history and famous uses

- **Product.** A mono-in, two-out digital "Harmonizer": a digital delay line, pitch changer and effects unit in one 2U
  box (M spec). It has two audio outputs. The **MAIN** output carries the pitch-change or effect signal with its own
  delay. The **DELAY ONLY** output is a plain delay of up to 393.75 ms (M p.4). The feature sheet lists the features
  as: pitch change from one octave up to two octaves down; two outputs, each with up to about 400 ms of delay; micro
  pitch change; long delay, which allows simulated reverb; time reversal; repeat; flanging; randomized delay; high and
  low feedback EQ; two selectable pitch-change algorithms; and dual-colour LEDs (M spec).
- **Lineage.** The H910 came first (1975–76). It was a 10-bit unit with a 2:1 compander, sampling at about 33.5 kHz,
  with 4K words of RAM and a pitch window of about 30 ms (H910 theory of operation). The H949 added a third octave
  (down to 0.25), micro pitch, reverse, random delay, flange, the long "extend" window and selectable algorithms
  (M spec; CL p.23). Eventide's Legacy guide gives **production dates 1977–1984** and calls it the world's first
  "de-glitched" Harmonizer, and perhaps the first multi-effect unit (CL p.23). Eventide's own timeline and other web
  sources disagree on the date: some give 1977, others give 1979 or a 1979 AES debut [Web]. The manual's warranty page
  is dated 3/79.
- **De-glitch.** Early units had two algorithms (1 and 2). The optional **LU618 "de-glitch" board** turns Algorithm 2
  into an intelligent-splice mode. A factory-fitted board is marked "option: ALG. 3" on the serial plate. It can be
  fitted in the field to units after serial A949-1606 (M p.15). The method is in Agnello's patent (PAT): an
  autocorrelation search picks the splice offset that cancels least. Eventide's blog says the processor was a
  bit-slice design (AMD 2901 family) that ran about 16 instructions per sample for the splicing, and calls the H949
  the first de-glitched pitch changer [Web].
- **Designer.** Tony (Anthony M.) Agnello, the inventor named on PAT [Web, PAT].
- **Famous uses** (secondary unless cited):
  - AC/DC's 1986 live rig. The H949 was on all vocals: the DELAY ONLY output at 50 ms and the MAIN output at a pitch
    ratio of 1.01 with an extra 37.5 ms, panned left and right of the dry vocal (MZ-PA86).
  - A UK producer who worked with Be-Bop Deluxe (1984 interview). He owned both units. He used the reverse effect on
    the H949 but preferred his H910, because the H949's pitch ratio drifted (MZ-Obs84). This matches the manual's note
    on readout drift (M p.16).
  - Colin Thurston (Duran Duran / Kajagoogoo producer) used "the new Eventide H949 with the reverse switch" alongside
    an H910 (MZ-Thurston85).
  - 1978 UK distributor news listed pitch change, delay, chorus, ADT, flanging, reverb, time reversal and echo
    (MZ-News78; this item is probably from about 1983, see section 6).
  - Eddie Van Halen had two H949s in his 1986 5150-tour rack (photo on an Eventide user page). Eventide and retailers
    also name Zappa, Pink Floyd, Led Zeppelin, Brian Eno, Suzanne Ciani and Aphex Twin [Web].
  - The famous Bowie/Visconti *Low* snare used the **H910**, not the H949.

## 2. Specifications

Source is M spec unless noted.

| Item | Value |
|---|---|
| Input | balanced, about 10 kΩ, max +24 dBm; full dynamic range is available for input levels from −10 to +24 dBm; 3-pin XLR female (M p.11) |
| Outputs | 2 (MAIN, DELAY ONLY), electronically balanced, about 150 Ω source, drive 600 Ω at +18 dBm; 3-pin XLR male, pin 1 shield, pin 2 −, pin 3 + (M p.11) |
| Distortion | < 0.15 % at 1 kHz, reference level |
| Dynamic range | > 96 dB clip to noise (the feature sheet says 95 dB) |
| Frequency response | 20 Hz – 15 kHz ±1 dB at any delay, unity ratio |
| Pitch range | 1 octave up to 2 octaves down (0.25–2.00), continuously variable; 4-digit ratio readout |
| Delay, DELAY ONLY output | 0 – 393.75 ms in 6.25 ms steps |
| Delay, MAIN output | DELAY mode: 0 – 393.75 ms in 6.25 ms steps. Pitch modes: 50 ms steps. The spec sheet says 0–300 ms; the control text says the effect is shifted by 50–350 ms. See 4.6 |
| Memory | about 400 ms total (M p.6, p.8) |
| Remote | IEEE-488 option; HK940 keyboard (opt. 05 mono, opt. 06 polyphonic for up to 3 units); phase-lock frequency input (≥ 3 V p-p); CV input (full scale set internally between +5 and +10 V) |
| Capstan drive outputs | 19.2 kHz, 9.6 kHz and 60 Hz (M p.14) |
| Size / power | 3.5 in (2U) × 19 in, 11.75 in deep; 115/230 VAC switchable, 45 W; fuse 1/2 A (OCR reads "4 A") at 120 V, 3/8 A slow-blow at 240 V (M p.11) |

**Digital internals** (not in the operator manual; derived):

- **Sample rate 40.96 kHz** [Eng, strong]. Three facts point to it. PAT states that 256 samples = 6.25 ms and
  512 = 12.5 ms, which gives exactly 40.96 kHz; PAT's text rounds this to "40 kHz". The delay keys step in 6.25 ms,
  which is 256 samples. The total memory of 400 ms is 16 384 samples, i.e. 16K-word RAMs. A listing site also gives
  "41 kHz" [Web]. (One Eventide blog snippet mentions a 20 µs sample period [Web], which would be 50 kHz. We treat
  that as a round or illustrative number.)
- **Memory 16 384 words × 11 bits.** Forum readers counted eleven 16K×1 RAMs. Eventide says the H949's doubled master
  clock bought one extra bit over the H910's 10 [Web]. The 1K-sample "NORM" window gives 25 ms (M p.6 says "about
  25 ms") [Eng, consistent].
- **Converters.** The H910 used a ramp-and-counter (single-slope) ADC and a multiplying DAC. It wrapped them in a
  **2:1 compressor / 1:2 expander** with pre- and de-emphasis to stretch 10 bits to a usable range (H910 theory of
  operation). Eventide later said the H969's 16-bit ADC let it drop the dbx modules it had used to get "virtual
  16-bit" from home-made 11-bit ADCs [Web], so the H949 almost certainly used the same compander arrangement. That
  explains how 11 bits can give a 96 dB specification.

## 3. Front and rear panel

### 3.1 Front panel, left to right

The panel is two rack units high. The user's photo and the Legacy panel drawing (CL p.23) show a top row of
knobs, LED meter and display, and a bottom row of square push-buttons. **Panel text is in capitals**, as below.
Function keys carry **two legends: a GREEN one above and a RED one below** (M p.5).

**Top row**

1. **INPUT LEVEL section**
   - **LED level meter**, 5 LEDs, peak-reading (M p.3):
     - 1 **red LIMIT**, which lights within about 1 dB of clipping;
     - 3 **green** LEDs captioned **NOMINAL** on the panel (the manual text calls them "NORMAL"), which light at
       various levels below clipping (the Legacy plug-in uses −12, −6 and −3 dBFS);
     - 1 **yellow PRESENT** (signal present), which lights at about −40 dB re clip. The manual says it is not precise:
       it is always on above about −30 dB (M p.16).
     - The meter reads the input after the feedback has been mixed in (CL p.24).
   - **INPUT LEVEL knob**, an ordinary volume control (M p.3).
   - **REPEAT**: a latching push-button that the manual files under the input block (M p.3). It is most likely the
     "switch" the user saw beside the knob [Eng]. The photo should confirm which switch is REPEAT and which is
     LINE IN/OUT.
2. **FEEDBACK section**: four knobs (M p.3–4).
   - **LEVEL**: **MAIN** (feedback from the main output) and **DLY ONLY** (feedback from the delay-only output).
     Each runs OFF to MAX, which is 0–100 % loop gain with the EQ centred.
   - **EQ**: **LOW** and **HIGH**, centre-detent style. Turning anticlockwise cuts, clockwise boosts; flat at the
     centre. The EQ acts on the sum of the two feedback signals.
3. **PITCH RATIO**: 4-digit **red 7-segment LED** readout, for example `1.000`, `0.500`, `2.000` (M p.4–5).
4. **MANUAL**: a large knob for the pitch ratio. In FLANGE and RANDOM it sets the sweep rate (M p.4).
5. **CONTROL MODE**: three interlocked push-buttons, **MANUAL / KEYBOARD / CV+MAN** in the user's left-to-right order.
   Each has an LED: **red** under local control, **green** under remote (IEEE) control. All three green means the
   remote sets the ratio (M p.5).

**Bottom row (square keys)**

6. **DELAY ONLY OUTPUT (M SEC)**: six latching keys labelled **6.25 · 12.5 · 25 · 50 · 100 · 200**. The delays of all
   pressed keys add up, to a maximum of 393.75 (M p.4; CL p.23 drawing). (The "0.25" in the photo is 6.25.)
7. **Centre group**: function and algorithm keys inside red-outlined frames (M p.5–8; CL p.23):
   - **FUNCTION SELECT**: a latching key. When it is IN, the red lower legends apply; when OUT, the green upper ones.
   - **Four function keys**, each with a **red/green LED** above it. Only one LED is lit; red means the lower legend
     is active and green means the upper one.

     | key | GREEN legend (FUNCTION SELECT out) | RED legend (FUNCTION SELECT in) |
     |---|---|---|
     | 1 | DELAY | NORM |
     | 2 | RANDOM | EXTEND |
     | 3 | FLANGE | µPC SHARP |
     | 4 | REVERSE | µPC FLAT |

     NORM is confirmed as the leftmost red legend and REVERSE as the last green one (M p.6, p.7). The other positions
     follow the order in which the manual describes them [Eng]. Check them against the photo. The exact typography
     (for example "µPC" over "SHARP") also needs the photo.
   - **ALGORITHM SELECT**: a latching key with legends **1 / 2**. Pressed IN = Algorithm 1; OUT = Algorithm 2 (M p.7).
     In the Legacy drawing, the ALGORITHM SELECT caption sits next to the FUNCTION SELECT caption between the two
     delay groups. Its order relative to FUNCTION SELECT is not certain from the OCR.
8. **MAIN OUTPUT (M SEC)** (the Legacy drawing reads "MAIN OUTPUT DELAY (M SEC)"): six latching keys
   **6.25 · 12.5 · 25 · 50 · 100 · 200** (M p.8).
9. **LINE IN/OUT** (hard bypass) and **POWER**, at the far right [Eng: position assumed; both exist per M p.2].

Colours [Eng from photo-style reference]: black or dark-grey panel with white legends; green and red function
legends; red-outlined groups; red LED display behind a filter; square cream or white keys.

### 3.2 Rear panel (M p.11)

- **AC**: IEC inlet with a sliding clear cover over a reversible voltage-select PCB and fuse.
- **INPUT**: XLR-F.
- **Outputs**: **MAIN OUTPUT** and **DELAY ONLY OUTPUT**, both XLR-M.
- **KYBD**: multi-pin connector for the HK940 keyboard.
- **IEEE-488** connector, only if the remote option is fitted.
- **Terminal strip** "CAPSTAN DRIVE | EXTERNAL CONTROL". The OCR shows these signals: 9.6 KHZ, GND, 19.2 KHZ,
  REF FREQ, GND, FROM KBD, BIAS OUT, GND, GND, CV IN. The manual gives these pins explicitly:
  - CV is applied between **pins 10 and 11** (11 positive);
  - **pin 12** carries +12 V through 10 kΩ, for a 100 kΩ pot between 12 and 10 with the wiper on 11 (M p.9–10).
  - The 60 Hz output is mentioned in the text (M p.14) but was not legible on the strip.
- An exposed regulator on a mica washer (M p.16).

## 4. Operation in detail

### 4.1 Input, LINE and REPEAT

- **LINE IN/OUT**: when OUT, the input is hard-wired to both outputs, even with the power off (M p.2–3).
- **INPUT LEVEL**: set it so that all three green LEDs light and LIMIT never flashes.
- **REPEAT** (latching) stops new input from being written. The whole memory (about 400 ms) then loops for as long
  as REPEAT is held in, and is lost at power-off. While REPEAT is in, the meter **inverts**: LEDs go out as the input
  gets louder. This reminds the user that the input is being ignored (M p.3). The captured audio is whatever was in
  memory at the moment of the press, so monitor the dry signal when you time the press. Both outputs keep reading the
  frozen memory, with their delays and effects.

### 4.2 Feedback

Feedback = MAIN LEVEL × main out + DLY ONLY LEVEL × delay-only out. The sum passes through the LOW and HIGH EQ and is
added to the input after INPUT LEVEL. The gains are scaled so that MAX gives unity loop gain with the EQ centred.
EQ boost can therefore push the loop above unity and make it self-oscillate (M p.3–4). The EQ corner frequencies are
only on the p.12 graph, which we could not read.

### 4.3 PITCH RATIO readout

- The readout is a frequency counter: it compares the read clock with the reference over a fixed gate, as the H910's
  HR930 readout did (H910). It is accurate to ±1 in the last digit (0.1 %). The last digit flickers ±1, and the
  display sometimes blanks for a few milliseconds between readings (M p.5, p.16). The Legacy plug-in copies this:
  the display jitters between two values (CL p.25).
- In µPC mode the last digit can drift with temperature (0.1 % tolerance); in NORM the second-to-last digit can
  drift (1 %) (M p.16).
- The readout keeps working in DELAY mode, so you can preset a ratio and then drop into pitch mode (M p.7, p.16).
- With external control it can read above 2.00, but the audio is limited to 2.00 (M p.16).
- At the low end the knob goes beyond 0.25, which brings noise and aliasing. Above 2.00 the reading rises but the
  pitch does not, and some phase noise appears (M p.6).
- In FLANGE and RANDOM the readout shows the sweep activity and rate (M p.4). [Eng: model it as the instantaneous
  read/write rate, which wanders around 1.000.]

### 4.4 CONTROL MODE

- **MANUAL**: the knob alone sets the ratio.
- **CV+MAN**: a 0 to +10 V CV (full scale trimmable from 5 to 10 V, trimmer "ECV LV") is added to the knob setting.
  A 100 kΩ pot on pins 10/11/12 spans **two octaves**, and the knob offsets that span within the three-octave range
  (M p.9–10).
- **KEYBOARD**: the ratio is phase-locked to an external frequency.
  - **2.5 kHz = 1.000**, and the ratio tracks the frequency in proportion: ratio = f / 2500 Hz, from 625 Hz (0.25) to
    5 kHz (2.0).
  - The signal must be a single clean tone (sine ≥ 5 V p-p, square ≥ 3 V p-p).
  - The HK940 keyboard locks to the H949's master oscillator. Its middle C = 1.000 (M p.4–5, p.10).
  - This mode is much more precise than the CV mode.

### 4.5 FUNCTION modes

**FUNCTION SELECT IN (red legends): pitch change**

- **NORM**: knob range 0.25 to 2.0, with extra travel at both ends. The pitch window ("delay variation") is about
  25 ms (M p.6).
- **EXTEND**: the window becomes the whole memory, 400 ms. Here the MAIN delay keys 200, 100 and 50 work *in
  reverse*:
  - pressing 200 cuts the window to 200 ms;
  - then also pressing 100 cuts it to 100 ms;
  - then also pressing 50 cuts it to 50 ms.
  - The keys work in a hierarchy: 100 does nothing unless 200 is in, and 50 does nothing unless 100 is in (M p.6).
  - The longer window gives fewer splices but audible echo-like repeats.
- **µPC SHARP / µPC FLAT** (micro pitch change):
  - SHARP covers 1.000 to about 1.07; FLAT covers 1.000 down to about 0.93.
  - The knob is **non-linear**: the pitch changes less per degree near 1:1, so you can set 1.001 and it stays there.
  - Fully anticlockwise is closest to 1.000. Clockwise raises the pitch in SHARP and lowers it in FLAT.
  - Recommended for tape time-compression ratios between 0.92 and 1.08 (M p.6, p.14).

**FUNCTION SELECT OUT (green legends): delay and reversal**

- **DELAY**: the MAIN output becomes a second plain delay (unity pitch), set by all six MAIN keys (M p.7–8).
- **RANDOM**: the main delay wanders between 0 and 25 ms at a **constant rate of change**. Each excursion goes to a
  pseudo-random limit inside that range, usually smaller than the full range. MANUAL sets the rate (clockwise =
  faster). The changing delay detunes the copy slightly, which is good for ADT (M p.7).
- **FLANGE**: the main delay sweeps over about 0–10 ms. MANUAL sets the sweep rate. The MAIN output is flanged
  internally, so no external mix is needed. The DELAY ONLY output is unaffected (M p.7).
- **REVERSE**: memory is read **backwards**, segment by segment (400 ms by default; 200/100/50 ms using the same
  hierarchical keys as EXTEND). MANUAL still changes the pitch within the NORM limits. There is no micro-pitch
  version (M p.7–8).
- RANDOM and FLANGE need **ALGORITHM 2** (key OUT). In Algorithm 1 the output level wobbles and an extra delayed copy
  can be heard (M p.7).

### 4.6 MAIN OUTPUT delay keys

- In DELAY mode all six keys add up: 0–393.75 ms (M p.8).
- In NORM, µPC, RANDOM and FLANGE, **only 50, 100 and 200 work**. They shift the effect by 50–350 ms (M p.8). The
  spec sheet says 0–300 ms in 50 ms steps (M spec). [Eng: with the 25 ms window (plus any Algorithm-1 offset), 350 ms
  plus the window exceeds the 400 ms memory, so in practice 300 ms is probably the effective maximum. Clamp the total
  so that delay + window ≤ 16 384 samples.]
- In EXTEND and REVERSE the keys set the window or segment length instead (see 4.5).
- The DELAY ONLY keys never interact with the main section (M p.4).

### 4.7 ALGORITHM SELECT and de-glitch

- **Algorithm 2** (key OUT) is the H910-style splice. Glitches come more often the further the ratio is from 1.000,
  and hard clicks are possible below 0.5 (M p.8).
- **Algorithm 1** (key IN) does not glitch, but it colours the sound. Its softer splice gives a tremolo-like effect,
  and it **adds extra delay** (M p.8; chart footnote on p.9; p.15).
- The two algorithms converge, and sound the same, at ±1 octave (M p.8).
- With the **LU618 (ALG. 3)** board fitted, **Algorithm 2 becomes the de-glitch mode**, but only in NORM and µPC; not
  in EXTEND or REVERSE (M p.15). It works best on single-instrument material (M p.15).
- The Legacy plug-in swaps the descriptions: it calls Algorithm 2 "glitch free" and Algorithm 1 "glitchy" (CL p.27).
  That matches a de-glitch unit's Algorithm 2 but contradicts the original manual on Algorithm 1. **For our model:
  Algorithm 1 = blind crossfade; Algorithm 2 = de-glitch when ALG3 is fitted (our default), or the H910 splice when
  it is not.**

### 4.8 Power-up and other quirks (M p.16)

- A fast off/on can reverse the µPC directions and stop FLANGE and RANDOM working. Wait 5 s before powering on again.
- The pitch circuitry can very rarely go "out of sync" and distort. Changing the function resets it.
- Switching between PITCH and DELAY can shift the level by a fraction of a dB.
- **Tempo / time compression**: the capstan output scales as 1/ratio. A ratio above 1 slows the tape; a ratio below 1
  speeds it up. Example: 60/62 = 0.968 squeezes a 62 s spot into 60 s (M p.13–14). Ratios of 0.5 and 0.25 would
  double or quadruple the tape speed.

## 5. Modelling recipe

All numbers below are [Eng] unless a source is given.

**Core**

- `fs = 40960 Hz`. Memory is a ring of `N = 16384` samples (400 ms). The delay-key unit is `256` samples (6.25 ms).
- Run the host at its own rate and resample into a 40.96 kHz core, or scale every sample count by `fs_host/40960`.
- **Analog front end**:
  - input gain;
  - add the feedback;
  - 2:1 compressor with pre-emphasis (dbx-like RMS detector, about 10–20 ms);
  - anti-alias low-pass, about 15 kHz, steep (about 6–7 pole elliptic) [the spec says ±1 dB to 15 kHz];
  - 11-bit quantiser with hard clip; LIMIT LED = |x| > 0.89 FS (−1 dB).
- **Back end** for each output:
  - DAC zero-order hold;
  - optional sin(x)/x droop;
  - reconstruction low-pass at about 15 kHz;
  - 1:2 expander with de-emphasis.
  - The compander is the main source of the "sound": noise that breathes with the signal, softened transients and
    slight pumping. An option to bypass it gives a clean 11-bit sound.
- **Meter**: peak hold with about 1 ms attack and about 150 ms release. Thresholds: PRESENT −40 dB, NOMINAL −12, −6
  and −3 dB, LIMIT −1 dB re clip. Invert the meter while REPEAT is in.

**DELAY ONLY tap**

- `d = 256 × Σ(keys)`, with the key weights 1, 2, 4, 8, 16, 32 for 6.25…200 ms, so 0–63 × 256 samples.
- Integer read, no interpolation (the hardware reads whole words).

**MAIN pitch shifter: two read heads A and B**

- Each head's delay moves by `(1 − r)` samples per sample, where `r` is the ratio.
- Base delay `D0 = 2048 × (k50 + 2·k100 + 4·k200)`, clamped so that `D0 + W ≤ N`.
- Window `W = 1024` (NORM / µPC) or `N, N/2, N/4, N/8` (EXTEND, chosen hierarchically).
- Reads in hardware are integer-addressed (no interpolation). The resulting rate jitter adds a little grit at
  ratios other than 1. Offer linear interpolation as a "clean" option.

**Splice behaviour by algorithm**

- **Algorithm 2 without ALG3 (H910-style)**: one active head. When its delay leaves `[D0, D0+W]`, jump by ±W. The H910
  hardware crossfaded the old and new reads with a ramp; use a short raised-cosine crossfade of about 2–4 ms, tunable,
  to reproduce the periodic "glitch". The glitch rate is `|1 − r| × fs / W` per second (about 4 Hz at a fifth up).
- **Algorithm 1 (blind soft splice)**: two heads held W/2 (12.5 ms) apart, with complementary gains that fade over a
  long portion of the cycle (triangular). The result is comb-filter colouring and amplitude flutter (the "tremolo")
  and about 12.5 ms of extra latency. Do not phase-align. In RANDOM and FLANGE this algorithm makes the level
  wobble, as the manual warns.
- **Algorithm 2 with ALG3 (de-glitch, PAT)**:
  - Every 256 samples, compute a correlation on a log-compressed (sign-preserving) copy of the input: compare a
    256-sample reference against lags of 256–512 samples (6.25–12.5 ms), i.e. `A(m) = Σ x(n)·x(n+m)` over 256 terms.
  - Multiply the score by a weight that rises linearly from 0.9 to 1.0 across the lag range, so longer lags (fewer
    splices) win ties.
  - Keep the best lag from the previous block (`ASPV`).
  - When the active head reaches the edge of the window (top limit for r < 1, bottom for r > 1), preset the idle
    head to `active ± ASPV` and crossfade the gains over the splice period. The patent gives no length; use about
    256 samples (6.25 ms), linear (PAT describes a "beveled" ramp). Then the heads swap roles.
  - Only NORM and µPC use this; EXTEND and REVERSE fall back to the blind splice.
  - Polyphonic or noisy material gives no clear peak, so glitches return. That is faithful to the original.

**Ratio laws**

- NORM: knob `k ∈ [0,1]` maps to `r = 0.23 × (2.1/0.23)^k`, i.e. exponential with overshoot at both ends. Clamp the
  audio at 2.0 (the display may read up to 2.1) and allow down to about 0.23 with extra noise.
- µPC SHARP: `r = 1 + 0.072·k²`. µPC FLAT: `r = 1 − 0.072·k²` (quadratic taper, fine near unity).
- CV+MAN: `r = r_knob × 4^(V/Vfs)`, i.e. two octaves per full scale.
- KEYBOARD: `r = f/2500`. For MIDI, map middle C to 1.000 and use 12-TET ratios: 0.500, 0.667 (fifth below),
  0.749, 0.794, 0.841, 0.891, 0.944, 1.000, 1.059, 1.122, 1.189, 1.260, 1.335, 1.414, 1.498, 1.587, 1.682, 1.782,
  1.888, 2.000; 0.250 at −24 semitones.
- Display: compute `r` from the actual read rate, show it as `X.XXX` (4 digits), add ±1-LSD dither, and blank it for
  a few ms about once every 10–30 s.

**Effect modes**

- **DELAY**: the MAIN output is a plain tap at `256 × Σ(MAIN keys)`. The knob still moves the display.
- **RANDOM**: the delay moves at a constant slope `s` toward a target, and a new random target in `[0, 1024]` samples
  is chosen on arrival. Knob → `s = 0.0005 … 0.02` (about 0.05–2 % detune), exponential. The main delay keys
  (50/100/200) add an offset.
- **FLANGE**: the main output = 0.5 × (tap at `D0`) + 0.5 × (tap at `D0 + τ(t)`), where `τ` sweeps a triangle over
  0–410 samples (0–10 ms). Knob → rate about 0.03–3 Hz. Fractional reads with linear interpolation, so the comb
  sweeps smoothly.
- **REVERSE**: segment `L = N, N/2, N/4, N/8`. The read head runs backwards through the most recent completed
  segment at rate `r`. Add a short crossfade (about 2 ms) at segment boundaries; the original probably clicks
  slightly there.
- **REPEAT**: stop writing; every head keeps reading the frozen 16 384-sample ring. Feedback has no effect while
  frozen.

**Feedback EQ** (the p.12 graph was not read)

- Low shelf about 200 Hz, ±12 dB; high shelf about 3 kHz, ±12 dB; flat at the centre.
- `fb = EQ(gM·main + gD·dly)`, with `gM, gD ∈ [0,1]` (audio taper). Add it before the compressor and meter.
- Put a soft limiter in the loop, because the digital clip at the converter is what makes self-oscillation sound
  harsh.

**Sound character to aim for**

- Bandwidth limited to about 15 kHz; compander breathing; 11-bit grain on quiet tails.
- Algorithm 2 (non-ALG3): rhythmic glitch. Algorithm 1: watery tremolo and comb colouring. ALG3: mostly clean on
  voice and mono lines, with occasional splices.
- The H949 is generally thought "cleaner but less characterful" than the H910 (MZ-Obs84; [Web] gearspace).

## 6. Sources

- Eventide H949 Harmonizer Instruction Manual (operator section), archive.org:
  https://archive.org/details/Eventide_H949_Harmonizer_owners_manual. OCR text:
  https://archive.org/stream/Eventide_H949_Harmonizer_owners_manual/Eventide_H949_Harmonizer_owners_manual_djvu.txt.
  The PDF and page images sit on ia*.us.archive.org data nodes, which this environment could not reach. Pages 9, 12
  and 13 need the images.
- Eventide Clockworks Legacy plug-in user guide, pp. 23–30:
  https://archive.org/details/manualzilla-id-5688092
- Eventide H910 user and service manual (theory of operation):
  https://archive.org/details/sm_Eventide_H910_user_and_service
- US 4,464,784, "Pitch changer with glitch minimizer" (Agnello / Eventide, 1984):
  https://patentimages.storage.googleapis.com/pdfs/US4464784.pdf. Sampling, segment and correlation figures are on
  sheets/columns 8–10 and 17–20.
- MZ-PA86: "PA Column", *International Musician & Recording World*, Mar 1986:
  https://www.muzines.co.uk/articles/pa-column/11036
- MZ-Obs84: "Echoes From The Observatory", *Home & Studio Recording*, Dec 1984:
  https://www.muzines.co.uk/articles/echoes-from-the-observatory/4203
- MZ-Thurston85: "Colin Thurston", *Home & Studio Recording*, Feb 1985:
  https://www.muzines.co.uk/articles/colin-thurston/6306
- MZ-News78: "News", *Sound International*, Aug 1978: https://www.muzines.co.uk/articles/news/8805. The item names
  Marquee as Eventide agent; the snippet's date may be later, since it also mentions Quantec and AMS.
- [Web], not opened (the host was blocked here):
  - Eventide blog "Flashback #7.1 / 7.2 / 7.3" (H949 history, 2901 bit-slice, 16K RAM, 11 bit, de-glitch):
    https://www.eventideaudio.com/blog/flashback-7-1-the-h949-harmonizer/
  - Valhalla DSP, "Pitch Shifting: The H949, and de-glitching":
    https://valhalladsp.com/2010/05/07/pitch-shifting-the-h949-and-de-glitching/
  - gearspace "Eventide H910 vs H949": https://gearspace.com/threads/eventide-h910-vs-h949.981119/
  - groupdiy "Eventide H949 Harmonizer": https://groupdiy.com/threads/eventide-h949-harmonizer.20917/
  - vintagedigital.com.au H949 page.

### Open questions for the drawing

- The exact left-to-right order of FUNCTION SELECT, ALGORITHM SELECT and the four function keys.
- The positions of REPEAT and LINE IN/OUT.
- Whether the meter LEDs are vertical or horizontal.
- The exact µPC legend typography.

All of these should be read from the user's photos.
