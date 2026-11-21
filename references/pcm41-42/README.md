# Studio reference: Lexicon PCM41 and PCM42 digital delay processors

Research notes for building units that look, work and sound like the Lexicon **PCM41** (1980/81) and **PCM42**
(1981/82). Both are mono 1U rack digital delays. Everything below is written in our own words. The manuals and
photos are copyrighted, so they are **not** committed here. Fetch them from the URLs in section 4.

Citation keys:

- **SM41 §x** = *PCM-41 Service Manual*, Lexicon Inc., Waltham MA. archive.org item
  `lexicon_Lexicon-PCM41-ServiceManual`. We read only its OCR text layer, because the PDF data nodes were blocked
  here. That means we cite section numbers, not page numbers. §1.2-1.3 cover the description and specs, §2.2 the
  performance tests, §3.0 calibration, §5.1 analog theory, §5.2 VCO/LFO theory and §5.3 digital theory.
- **OM42 §x** = *PCM 42 Owner's Manual*. archive.org item `Lexicon_PCM_42_owners_manual`, OCR text layer only. §2.1
  covers the front panel (items A-W), §2.2 the rear panel (items A-M), §3 installation, §4 applications and §6
  specifications. Some paragraphs in the OCR are garbled. Those are marked **(OCR)**.
- **AD42** = Lexicon brochure "PCM-42: The adventure continues..." (print code 20K-1082, i.e. Oct 1982). archive.org
  item `LexiconPCM42TheAdventureContinues1982`.
- **[Photo AF41]** = user photo of a PCM41 racked under a PCM70, front view. fr.audiofanzine.com PCM-41 photo page,
  image `medias.audiofanzine.com/img/pictures/normal/6/7/6710546.jpg`.
- **[Photo AF42]** = PCM42 photos on fr.audiofanzine.com (PCM-42 page). `…/lexicon-pcm-42-digital-delay-6549503.jpg`
  is a frontal view (we took the % positions from it). `…-6504021.jpg` is a second unit with what look like stock
  knobs. `…-6504022.jpg` is the rear.
- **[Forum]** = gearspace threads that we saw only as search-result summaries, because gearspace was blocked here. They
  are unverified.
- **[Eng]** = our own engineering inference or assumption, not a source fact.

---

## 1. Lexicon PCM41 Digital Delay Processor

### 1.1 What it is, history, uses

- It is a single-channel digital delay line for performing musicians and studios. It has 12-bit PCM conversion,
  analog log/antilog companding, a voltage-controlled sample clock (the "VCO") with an LFO and an envelope follower,
  feedback with polarity invert and LO/HI filters, and a dry/wet mix (SM41 §1.2).
- It was Lexicon's lower-cost "roadable" unit after the Prime Time. AD42 calls it "the world standard in
  cost-effective, roadable delay processors". Second-hand sources disagree on whether it came out in 1980 or 1981.
- Serial-number changes: early units through S/N 1110 had the Delay Multiply control voltage inverted. From S/N 1250
  on, the bypass jack runs at +5 V so that it is compatible with the Prime Time footswitch (SM41 §5.1.17, §5.2.3).
- It is used for slapback, ADT/doubling, flanging, chorus/vibrato and pitch-bend ("pitch twisting") effects. Users
  describe its character as "non-linear" and full of mojo rather than clean.

### 1.2 Specifications (SM41 §1.3)

| Item | Value |
|---|---|
| Delay taps | 11 pushbutton taps: **0, 0.8, 1.6, 2.4, 4, 7, 13, 26, 50, 100, 200 ms** (DLY X1). All are doubled in DLY X2. The spec text OCR reads "12" for 13, but the panel legend says **13** |
| Delay Multiply | Continuously scales any tap over **4:1** (X.5 to X2). Overall delay is ≈0.4 ms (0.8 × 0.5) up to ≈800 ms (400 × 2) |
| Delay capacity | X1 range: 200 ms at full bandwidth, 400 ms at 6 kHz. Delay Multiply X2: 400 ms full bandwidth, 800 ms at 6 kHz |
| "0" delay | ≈100 µs of residual delay (filters + converter) (SM41 §2.2.6) |
| Freq. response | 20 Hz-15 kHz +0/-1 dB, and -3 dB at 16 kHz (X1). 20 Hz-6 kHz -3 dB (X2) |
| THD+N | 0.04 % typ / 0.07 % max at 1 kHz (multiply X1). 0.1 % typ over 20 Hz-15 kHz |
| Dynamic range | >90 dB (20 Hz-20 kHz). Test limit: noise ≤-80 dBm wet, ≤-85 dBm dry, DIN (§2.2.3) |
| VCO | Depth 0 to a full 4:1 sweep. LFO 0.1-10 Hz with a flashing LED. Waveform blends sine↔envelope↔square |
| Input | Balanced TRS, 40 kΩ, 40 dB CMRR. Max input -23 dBV to +19 dBV using the Level control and the +20 dB rear switch |
| Outputs | Main 100 Ω, +19 dBV max, with a rear Output Level control. Direct 600 Ω, +11 dBV at the "0 dB" headroom point |
| Feedback filters | LO cut (80 Hz) and HI cut (4 kHz) |
| Power, size | 115/230 V, 20 W. 19" × 1U (44 mm), 280 mm deep, 2.5 kg |

### 1.3 Front panel, left to right (from [Photo AF41] and the SM41 Fig 1.0 legend)

Colours: the panel is **black** with white legends. Two rounded **sage/pale green** inset areas carry the controls:
one from the DLY button to the Output Mix knob, and one from the Delay INV button through to the Rate LED. A third
green box surrounds the VCO knobs. The audio-section knobs are **cream/white caps on black skirts** with a line
indicator. The VCO-section knobs are **red caps** on black skirts. Delay-select buttons are square black caps. Round
buttons are black. The power button is round and red. Positions are the centre x as a % of the full 19" width,
±1.5 % (the photo cuts off part of the left ear).

| % | Element | Legend / scale | Notes |
|---|---|---|---|
| 1, 99 | Rack ears | two holes each | |
| 4 | Model logo | "**pcm 41**" in large italic white | |
| 8 | Headroom meter, 5 LEDs, vertical | from top: **0dB** (red), **6** (yellow), **12, 18, 24** (green). The vertical word "HEADROOM" sits to the right | Peak-hold display (fast attack, slow release). The 0 dB LED is about 1 dB below A/D clip (§5.1.4) |
| 14 | **DLY** latching button (DELAY X1/X2) | Heading "DELAY". Icons **X1** (wide trapezoid) and **X2** (narrow trapezoid), vertical word "DLY" | Pressed = X2 (half sample rate, 6 kHz filters) |
| 18 | **LEVEL** knob (input) | 0-10, 11 ticks | Cream cap |
| 23 | **FEEDBACK** knob | 0-10 | Cream cap |
| 27.5 | **INV** button (feedback polarity) | Under the bracket heading "FILTER" | Round black latching button |
| 30.5 | **LO** button | | Feedback low-cut (80 Hz) |
| 34 | **HI** button | | Feedback high-cut (4 kHz) |
| ~27-34 | Section label below the knobs | "**INPUT**" (bottom, spans Level → filters) | |
| 37 | **BYPASS** LED | "BYPASS" | Green. Lit only when the rear footswitch bypasses the unit |
| 39.5 | **OUTPUT MIX** knob | "**=**" mark at the top (centre detent). Ends marked **INPUT** (left) and **DELAY** (right) | Cream cap |
| 44 | **INV** button (delay-output polarity) | "INV" | Round black |
| 47-63 | 11 red **delay LEDs** in a row, ≈1.6 % pitch | Above (X1): **0  0.8  1.6  2.4  4.0  7.0  13  26  50  100  200**. Below (X2): **0  1.6  3.2  4.8  8.0  14  26  52  100  200  400 ms** | One LED is lit at a time |
| 50.5 | **DELAY SELECT** "←" button | square black cap with an arrow | Steps down |
| 54 | legend "DELAY SELECT" | | |
| 57 | **DELAY SELECT** "→" button | | Steps up |
| 63 | **X2** LED (amber), above the **REPEAT** LED (amber) | "X2", "REPEAT" | REPEAT lights when the rear footswitch has the unit in repeat |
| ~55 | Section label below | "**DELAY**" | |
| 68.5 | **DELAY MULTIPLY** knob | **X.5** (lower left), **X1** (top, detent), **X2** (lower right) | Red cap. Replaced by the rear VCO jack when a plug is inserted |
| 73.5 | **DEPTH** knob | 0-10 | Red cap |
| 79.5 | **WAVEFORM** knob | **∿** (sine, left), **ENV** (top, detent), **⊓⊔** (square, right) | Red cap |
| 85 | **RATE** knob | **.1Hz** (left) to **10** (right) | Red cap |
| 86.5 | RATE LED | vertical word "RATE", green LED | Flashes at the LFO rate |
| ~77 | Section label below | "**VCO**" | |
| 89 | **POWER** button | "POWER" | Red round latching button |
| 90 | **lexicon** logo | | White |
| 94.5 | "digital delay processor" | italic, three lines | |

Note: there are **no** front-panel Bypass or Repeat buttons on the PCM41. Those functions are footswitch-only
(SM41 §2.2.8).

### 1.4 Rear panel (brief)

From left to right as seen from the rear: IEC mains inlet with fuse, the **REPEAT**, **BYPASS** and **VCO** (TRS)
footswitch/pedal jacks, the **+20 dB GAIN** push switch, **INPUT** (balanced TRS), **DIRECT OUTPUT**, **MAIN OUTPUT**
and the **OUTPUT LEVEL** knob ([Photo AF41] series; SM41 §1.3). The exact order of the three remote jacks is not
confirmed.

### 1.5 Operation in detail

- **Signal path** (SM41 §5.1): balanced input stage → Input Level (23 dB range) → gain stage (+14 dB, or +34 dB with
  the rear GAIN switch). This point feeds the Direct out and the dry side of the Output Mix. → 5-pole elliptic
  anti-alias LPF (17.3 kHz, or about 6 kHz in X2) → pre-emphasis (50 µs/12.5 µs, about +10 dB at 15 kHz) summed with
  the feedback signal → headroom meter and sample/hold → **log compressor** → **12-bit SAR A/D** → DRAM → the same DAC
  in reverse → **antilog expander** → deglitch S/H → aperture-correction 2-pole LPF → inverter → (feedback branch) →
  **DLY INV** → de-emphasis → output elliptic LPF → passive Output Mix → buffer → rear Output Level → output amp
  (+8 dB).
- **Feedback** is taken after the aperture filter. It goes through the Feedback pot, the FB **INV** switch, the **LO**
  filter (series cap, 80 Hz HPF) and/or the **HI** filter (shunt cap, 4 kHz LPF), and is summed back at the
  pre-emphasis/input mixer. The whole loop therefore lies *inside* the emphasis pair and both elliptic filters. Lexicon
  did this on purpose, to keep phase shift low and flange notches deep (§5.1.13). In the bench test with full feedback
  and a 1 kHz tone, the output rises about 10 dB. LO adds about 2 dB, HI takes off about 4 dB, and INV drops the output
  about 15 dB (§2.2.5).
- **Delay select**: the ← and → buttons step an 11-state counter. It powers up at "0", and one LED shows the tap. Delay
  is set by an address offset between the write and read pointers in 8192 words of 12-bit memory. The offset is an
  8-bit value added to the high address bits, so taps come in multiples of 32 samples (≈0.78 ms at the nominal rate)
  (§5.3.1-5.3.5). [Eng] The taps are probably 0, 1, 2, 3, 5, 9, 17, 33, 64, 128 and 256 steps of 32 samples, which
  gives 0, 0.78, 1.56, 2.34, 3.9, 7.0, 13.3, 25.8, 50, 100 and 200 ms.
- **DLY X2** halves the sample rate (a ÷2 on the master clock) and switches both elliptic filters to about 6 kHz.
  Every delay doubles. The X2 LED lights.
- **VCO / clock**: the master clock MCO runs at 655 kHz nominal. It is calibrated to **1.31 MHz at X.5** and **343-352
  kHz at X2**. One sample takes 16 clock cycles, so **Fs = MCO/16 ≈ 40.96 kHz** nominal. The range is about 22-82 kHz
  in DLY X1 and half that in X2. The manual rounds this to "20-80 kHz" (§5.1.5, §3.0.2, §5.3.2). Delay = (tap samples)
  / Fs, so the whole delay scales inversely with the clock. Every sweep is therefore a real sample-rate change.
- **DEPTH** crossfades the clock control voltage. Fully CCW, the CV comes only from Delay Multiply (or the VCO pedal
  jack). Fully CW, it comes only from the Waveform control. In between, the two are blended. The CV is always 0-10 V
  (§5.2.2). At Depth 10 the LFO sweeps the full 4:1 range, X.5↔X2, whatever the Delay Multiply setting. With a square
  wave at 0.1 Hz, the bench test sees the echo jump between 25 % and 100 % of its maximum position, about 5 s at each
  (§2.2.7).
- **WAVEFORM** is fully CCW for sine, at the centre detent for the envelope follower, and fully CW for square. In
  between, it blends sine+env or env+square. The LFO is a bidirectional integrator with a comparator that has 10 V of
  hysteresis. That makes a triangle, rounded into a "quasi-sine" by level-dependent capacitors, plus a square from the
  comparator, which is in phase with the triangle's turning points. Both are unipolar 0-10 V. **RATE** covers 0.1-10 Hz
  and the LED follows the square (§5.2.5).
- **Envelope follower**: it uses the headroom meter's peak detector, which charges fast and decays through a resistor.
  The signal is inverted, so silence gives +10 V (longest delay) and full level gives 0 V (shortest delay). A loud
  input therefore *shortens* the delay and bends the pitch up on attacks (§5.2.4, §2.2.7). [Eng] Release is probably
  around 100-300 ms.
- **Delay Multiply** is a manual 0-10 V source. The centre detent is trimmed to X1 (655 kHz). The +10 V reference also
  goes to the VCO jack so that a pedal pot can be used: tip = wiper, ring and sleeve = pot ends. It accepts 0-10 V CV
  (§1.3, §5.2.3).
- **Output Mix** is a passive pot. It is trimmed so that the centre detent gives an exactly equal blend, which gives
  the deepest flange notch. **DLY INV** flips the wet polarity. In the test, a 100 Hz tone at the "=" setting drops
  about 30 dB (§2.2.5, §5.1.16).
- **Bypass** (footswitch, latching): an FET removes the wet signal, and the dry signal then passes at unity whatever
  the Mix position (§5.1.16-17).
- **Repeat** (momentary footswitch, toggles): the memory is frozen, and the unit loops the **whole memory length**,
  200 ms × multiply in X1 or 400 ms in X2. The loop length does not follow the selected tap, and there is a small click
  at the loop point. Changing X2 or Multiply while it loops changes the pitch of the loop. You hear nothing on tap "0".
  A second press erases the loop (§2.2.8).

### 1.6 Modelling recipe (PCM41)

1. **Virtual clock**: Fs_v = 40 960 / D / (X2 ? 2 : 1) Hz, where D (0.5…2) is the delay factor.
   [Eng] We could not get an exact CV→frequency law from the text. The trim points are 0 V→1.31 MHz (D = 0.5), about
   3 V→655 kHz (detent, D = 1) and 10 V→352 kHz (D ≈ 1.9-2). Use a piecewise-linear D: it runs 0.5→1 over the left
   half of the knob and 1→2 over the right half. Apply the same law to the LFO/env CV. Total
   CV = (1-depth)·manual + depth·wave.
2. **Delay** = (tap_steps × 32 samples) / Fs_v + 0.1 ms. Implement it as a ring buffer clocked at Fs_v. Resample
   between the host rate and Fs_v; a fractional-rate SRC with **no** extra anti-alias filtering beyond the modelled
   elliptic filter lets real aliasing through. At Delay Multiply X2 in DLY X1, Fs_v is about 21 kHz while the filter
   still passes 17 kHz, so audible aliasing and clock feedthrough are authentic. SM41 allows up to 1 % THD there
   (§2.2.2).
3. **Filters**: input and output each get a 5th-order elliptic LPF, fc 17.3 kHz (5.8 kHz in X2), 0.5 dB ripple, 65 dB
   stopband, zeros at about 40 and 62 kHz (scale them by 1/3 in X2). Add a sample/hold sinc droop plus an
   aperture-correction 2-pole lift (Q ≈ 0.7-1, near Nyquist) [Eng]. Pre-emphasis is a shelf with a zero at 50 µs
   (3.2 kHz) and a pole at 12.5 µs (12.7 kHz), about +10 dB at 15 kHz. De-emphasis is its inverse.
4. **Companding converter**: c(x) = sign(x)·ln(1+μ|x|)/ln(1+μ) with **μ ≈ 16**. That gives about +15 dB small-signal
   gain, which matches "+15 dB low level, about -2 dB at full scale, about 17 dB gained" (§5.1.6). Then **quantise to
   12 bits** (offset binary, a hard clip at full scale that is symmetrical), then expand with the exact inverse. The
   result is a noise floor that is low on quiet passages and rises with signal level (signal-correlated, "grainy"), and
   de-emphasis makes it darker.
5. **Feedback**: fb = g·F·Pol·y, with g = 0…0.8 [Eng, from the +10 dB test], Pol = ±1 (INV), and F = HPF 80 Hz
   (1-pole, LO) and/or LPF 4 kHz (1-pole, HI). Sum it after pre-emphasis and before the A/D, so the loop passes through
   the compander and the 17 kHz elliptic filter on every pass. The loop also clips hard at the A/D, because the PCM41
   has no soft limiter.
6. **Mix**: out = (1-p)·dry + p·(±wet). Bypass gives out = dry. Model the input stage, and the A/D clip at the 0 dB
   LED + 1 dB, as hard clipping.
7. **LFO**: a triangle, softened toward a sine with a gentle tanh/poly fold [Eng], plus a square. Both are unipolar
   0-10 V. Rate is logarithmic from 0.1 to 10 Hz. The Waveform pot crossfades sine→env (left half) and env→square
   (right half).
8. **Noise and hum** [Eng]: add a little clock-related tone at Fs_v and its sub-multiples, below -80 dB.

---

## 2. Lexicon PCM42 Digital Delay Processor

### 2.1 What it is, history, uses

- It is the PCM41's successor (brochure dated Oct 1982). It keeps the PCM41's architecture of a swept sample clock,
  sine/env/square VCO and feedback/mix, and adds these (OM42 §1.0, AD42):
  - a **4-digit LED display** of the real delay time, which tracks sweeps
  - **256 delay taps** on UP/DOWN buttons
  - 1.2/2.4 s of delay, or **2.4/4.8 s with the memory option**
  - a front-panel **∞ RPT** (infinite repeat) that is synchronised to a programmable **metronome/clock** with a TTL
    **CLOCK OUT** jack
  - a "soft-knee" input compressor/limiter
  - **FEEDBACK CONTROL** and **MIX CONTROL** pedal/insert jacks
  - separate Direct and Delay outputs
- It is marketed for live phrase looping and layering. AD42 says up to "eight bars" can be held in loops without
  degradation, and it shows Mark O'Connor. [Forum, unverified] It is a long-standing studio favourite for slapback,
  doubling and gritty modulation. Users attribute much of its "grain" to driving the input limiter. Andy Wallace is
  often named as a user, but that is unconfirmed.

### 2.2 Specifications (OM42 §6, AD42)

| Item | Value |
|---|---|
| Delay ranges | **X1**: 256 taps over 0-800 ms (standard memory, Manual at X1). Step ≈3.1 ms on the 800 ms range. **X2**: double, at 6 kHz bandwidth |
| Manual VCO-Sweep | Scales all delays over **3:1** (X.5 / X1 / X1.5) |
| Capacity, std memory | 16 kHz mode: 400 ms (X.5), 1200 ms (X1.5). 6 kHz mode: 800 ms (X.5), 2400 ms (X1.5) |
| Capacity, extended memory | 16 kHz mode: 800 to 2400 ms. 6 kHz mode: 1600 to **4800 ms** |
| Display accuracy | ±1 ms up to 200 ms, then 0.5 % |
| Freq. response | 10 Hz-16 kHz +0.5/-3 dB (X1). 20 Hz-6 kHz (X2) |
| THD+N | 0.06 % typ / 0.1 % max at 1 kHz, +9 dBm. 0.2 % over 20 Hz-15 kHz |
| Dynamic range | >90 dB (DIN) |
| VCO | Depth 0 to a full 3:1 sweep. LFO 0.1-10 Hz. Waveform sine↔env↔square |
| Input limiting | Two stages: 5:1 compression starts 3 dB below converter overload (threshold about +9 dBV, before the anti-alias filter), then a hard limiter just below overload (between the filter and the S/H) |
| Input | Balanced TRS, 40 kΩ. -12 to +20 dBV peaks. +20 dB rear GAIN switch |
| Outputs | Main 100 Ω, up to +18 dBV (9 V rms), rear Output Level. Direct and Delay 600 Ω, about +12 dBV at the limit point |
| Aux jacks | FB CONTROL tip: 20 kΩ line input summed after the compressor and before the AAF/limiter. MIX CONTROL tip: 30 kΩ, replaces the wet feed to the Mix pot. The ring on both = buffered wet output |
| Power, size | 115/230 V (100 V special), 20 W. 1U, 280 mm deep, 2.5 kg |

### 2.3 Front panel, left to right ([Photo AF42] 6549503 and 6504021; OM42 §2.1 letters in brackets)

Colours: the panel is **black/very dark navy** with white legends. A rounded **medium-blue** inset band (PCM41 was
sage green) holds the controls, broken into three areas: input/output, delay and VCO-sweep. Knob caps on unit 6504021:
**cream/white** for Level, Feedback and Output Mix, and **red** for Manual, Depth, Waveform and Rate. That is the same
scheme as the PCM41, and we take it to be stock. Unit 6549503 has the colours swapped, which is probably a
replacement. Round black latching buttons have a white collar ring. UP/DOWN are square black caps with arrows. The
power button is red. Positions are the centre x as a % of the full 19" width, ±1.5 %.

| % | Element | Legend / scale | Notes |
|---|---|---|---|
| 1, 99 | Rack ears | | |
| 3.5 | Logo | "**pcm 42**" in large italic white | |
| 7 | (A) **HEADROOM** 5 LEDs | **0dB** red, **-6** yellow, **-12, -18, -24** green. The vertical word "HEADROOM" is beside them | It reads the level after Level+Feedback and after the compressor, so it goes non-linear once 0 dB is lit |
| 13 | (B) **DELAY X2** latching button | Icons **X1** (wide trapezoid) and **X2** (narrow trapezoid), vertical "DLY" | Pressed = long range at 6 kHz. Lights the 6KHz LED |
| 17.5 | (C) **LEVEL** | 0-10 | Section label "INPUT" sits below, spanning Level to Phase |
| 22 | (D) **FEEDBACK** | 0-10 | |
| 27 | (E) **HI CUT** button | Bracket heading "**FILTER**" | 1-pole 4 kHz LPF in the feedback path |
| 30 | (F) **FB INV** button | Bracket heading "**PHASE**" spans FB INV and DLY INV | Inverts the feedback polarity |
| 33 | (G) **DLY INV** button | | Inverts the wet polarity to the mix |
| 35.5 | (H) **BYPASS** LED | "BYPASS" | Green. Lit by the footswitch or logic only |
| 38.5 | (I) **OUTPUT MIX** | "**=**" (centre detent, equal blend calibrated for the deepest notch). **INPUT** left, **DELAY** right | |
| 43 | (J) **∞ RPT** button | "∞" above "RPT" | Latching |
| 47 | (L) **DOWN** button (↓) | | Square |
| 49 | (K) **SET-MODE** slide switch | "SET-MODE", "DLY ◄──► CLK" | Small black 2-position slider between the buttons |
| 51.5 | (M) **UP** button (↑) | | Square |
| 59 | (N) **DELAY-ms** display | heading "DELAY-ms". **4-digit red 7-segment LED** behind a red window, about 9 % wide | Section label "DELAY" sits below |
| 64.5 | (O) **CLK**, (P) **∞**, (Q) **6KHz** LEDs, stacked top to bottom | text to the right of the display | Red |
| 68 | (R) **MANUAL** (VCO-SWEEP) | **X.5** lower left, **X1** top (detent), **X1.5** lower right | |
| 73.5 | (S) **DEPTH** | 0-10 | Section label "**VCO-SWEEP**" sits below, spanning Manual to Rate |
| 78.5 | (T) **WAVEFORM** | **∿** left, **ENV** top (detent), **⊓⊔** right | |
| 84 | (U) **RATE** | **.1Hz** left to **10** right | |
| 86.5 | (V) RATE LED | vertical word "RATE", green LED | |
| 89.5 | (W) **POWER** | "POWER" | Red latching button |
| 91 | **lexicon** logo | | |
| 95 | "digital delay processor" | italic, three lines | |

### 2.4 Rear panel (OM42 §2.2, brief)

The OM42 letters run from the left as seen from the rear:

- (A) IEC power inlet
- (B) **VCO** jack, TRS: a pedal pot (CCW end = sleeve, wiper = tip, CW end = ring), or 0-10 V CV where 0 V = maximum
  delay and +10 V = minimum, linear over 3:1. It overrides the Manual knob.
- (C) **BYPASS** jack: latching footswitch to ground, or a TTL low.
- (D) **∞ REPEAT** jack: momentary switch or a TTL falling edge, which toggles.
- (E) **CLOCK OUTPUT**: a TTL square wave.
- (F) **DELAY OUT** and (G) **DIRECT OUT**.
- (H) **INPUT**: balanced TRS.
- (I) **GAIN** +20 dB push switch.
- (J) **FEEDBACK CONTROL** and (K) **MIX CONTROL**: TRS jacks with tip = input, ring = buffered wet out. They take the
  A-CP-41 pedal, or work as inserts or aux inputs.
- (L) **MAIN OUTPUT** and (M) **OUTPUT LEVEL** knob.

Accessories: A-FS-41 dual footswitch (bypass + repeat) and A-CP-41 foot pedal.

### 2.5 Operation in detail (OM42 §2-4)

- **Delay selection**: SET-MODE is on **DLY**. A short press of UP or DOWN moves one tap. Holding a button repeats
  about once per second. Pressing the *other* button while holding the first gives fast slewing in the first button's
  direction. The display always shows the real current delay, including Manual/LFO sweep. Power-up sets 0 ms, repeat
  off and clock 1/2. Knob and switch settings are not stored (§2.1 L-N, W).
- **DELAY X2**: out gives 0-1200 ms (0-2400 ms with the option) at 16 kHz. In gives double the range at 6 kHz, and the
  6KHz LED lights.
- **Manual VCO-Sweep**: changes the **sample rate** over 3:1, which scales the delay (X.5…X1.5). It is the route to the
  longest delays. **Depth** at 0 turns the internal sweep off. At 10 the sweep spans the full 3:1 and Manual has no
  effect. In between, the two interact as a crossfade, as on the PCM41.
- **Waveform** works like the PCM41's. CCW is sine, the centre detent is the envelope follower (delay follows the
  input level), and CW is square (instant jumps). Settings in between blend env with sine or with square. **Rate**
  covers 0.1-10 Hz and has no effect at the ENV detent. The LED flashes at the LFO rate.
- **Feedback** feeds the delay output back to the input. **HI CUT** puts a single-pole 4 kHz low-pass in the loop (for a
  "distant" or tape-like echo). There is **no LO cut** on the PCM42. **FB INV** inverts the loop, which moves flange
  notches to odd harmonics and gives a hollow sound. The FB CONTROL jack forms a *second, parallel* loop that is not
  filtered. Using both loops at once can run away (§3.3).
- **∞ RPT**: it captures at the **next clock pulse** after it is pressed, and releases on a clock pulse as well. It
  loops the **entire memory**, so the loop length = maximum delay at the current X2/Manual settings, not the selected
  tap. The CLK LED shows the beat. It will not start in repeat if the button is held in at power-up. The rear jack
  toggles it. The **∞ LED** lights while a loop is held (§2.1 J, P; §4.2.2). Lexicon's suggested layering: capture a
  loop, set full feedback, release, overdub, then capture again. At full feedback and 4.8 s the decay is longer than 3
  minutes (§4.2.1).
- **Clock/metronome**: SET-MODE is on **CLK**. The display shows a fraction "n d", numerator on the left and
  denominator on the right. **DOWN** cycles the numerator through the odd numbers 1, 3, 5, 7, 9. **UP** cycles the
  denominator through 1, 2, 4, (8), 16, 32, 64 and back to 1. The OCR list drops 8, but the "1/2 → 1/4 … 1/64" text
  implies it is there. The clock period = full memory time × n/d. For example, with 1600 ms memory and the default
  1/2, the clock flashes every 800 ms. The rate follows Manual and X2, not the UP/DOWN tap, and drifts if Depth > 0.
  The CLOCK OUT jack drives sequencers and drum machines (§4.3). There is **no clock input**. The tempo is set by the
  memory length, i.e. by the Manual knob, and the clock is derived from it. The suggested sync procedure: hold UP and
  tap DOWN to reach the maximum tap, so that tap = loop length. Then set Manual so the time is an even value: about 800
  ms near the knob's centre, or 1600 ms with the memory option.
- **Bypass** (rear only): the wet signal is cut from the Main mix and the feed *into* the delay line is cut too.
- **Mix Control jack**: a plug breaks the wet feed to the Output Mix pot. A pedal then fades the wet signal from 0 up
  to the Mix setting, or the jack can be used as an insert.
- **Input limiter**: up to -3 dB, it is linear. From -3 dB to 0 dB it compresses at 5:1. At 0 dB it hard limits, but
  the manual says even extreme overload gives only "soft" distortion. The Direct out is compressed but not limited.

### 2.6 Modelling recipe (PCM42)

1. **Clock and memory** [Eng, not documented]: OM42 states only "an increased sampling rate" over the PCM41, and a 16
   kHz bandwidth that is alias-free across the 3:1 sweep. Assume **Fs ≈ 41 kHz at X1.5, ≈61.4 kHz at X1 and ≈123 kHz
   at X.5**, giving about **49 152 12-bit words** for 800 ms at X1 (standard memory), doubled with the option. Halve
   Fs in X2. The bandwidth then stays 16 kHz everywhere without aliasing, unlike the PCM41.
   - Taps: 256 evenly spaced, tap k = k/256 × memory. Delay_ms = k × (memory_words/256) / Fs_v.
   - Manual: the delay factor D = 0.5 + knob (0…1), which is linear, as the VCO jack spec says.
   - Total CV = (1-depth)·manual + depth·wave.
2. **Converter**: reuse the PCM41 compander + 12-bit quantiser (μ ≈ 16) [Eng]. Lexicon calls it "proprietary
   encoding" with very little degradation per recirculation. Keep the pre/de-emphasis pair (50/12.5 µs) [Eng,
   inherited].
3. **Filters**: anti-alias and reconstruction elliptic LPFs, 5th order, fc ≈ 16-17 kHz in X1 and ≈6 kHz in X2.
4. **Input dynamics**: a feed-forward peak compressor with ratio 5:1, threshold at -3 dBFS(converter), fast attack (≈1
   ms) and medium release (≈100 ms) [Eng]. Follow it with a soft-knee limiter/saturator (tanh-style, ceiling 0 dBFS).
   This is the main "drive" character of the 42. [Forum] Some users say an opto-style element is in the loop, which
   would suggest program-dependent release.
5. **Feedback**: fb = g·Pol·HI(4 kHz 1-pole)·y, with g_max ≈ 0.85 (−1.4 dB per pass [Eng], derived from the ">3 min
   decay at 4.8 s"). Inject it after the compressor and before the AAF/limiter, so runaway feedback is caught by the
   limiter and never clips hard.
6. **∞ RPT**: on a clock edge, freeze writes and read the whole buffer cyclically. Release on a clock edge. While
   frozen, Manual changes the playback rate, i.e. the pitch and the loop length together.
7. **Clock output**: period = memory_time × n/d, phase-locked to the write pointer wrap. Use it to drive a UI LED and a
   tempo output.
8. **Display**: show the effective delay in ms, updated each block (4 digits, 0-4800).
9. **Mix and polarity**: as on the PCM41. The centre detent gives an exactly equal blend.

---

## 3. Differences at a glance

| | PCM41 | PCM42 |
|---|---|---|
| Delay selection | 11 fixed taps, LED ladder (0-200 ms, ×2) | 256 taps, 4-digit ms display |
| Max delay | 800 ms (X2 + Multiply X2) | 2.4 s, or 4.8 s with the memory option |
| Manual sweep range | 4:1 (X.5-X2), "DELAY MULTIPLY" | 3:1 (X.5-X1.5), "MANUAL" |
| Aliasing | Yes at slow clock settings (Fs down to about 21 kHz with a 17 kHz filter) | Designed out (higher Fs) |
| Overload | Hard clip at the A/D | 5:1 compressor + soft limiter |
| Feedback filters | INV, LO (80 Hz), HI (4 kHz) | HI CUT (4 kHz), FB INV. No LO |
| Repeat / Bypass | Footswitch only. LEDs on the front | ∞ RPT button + jack, synced to the clock. Bypass by jack |
| Extra I/O | Direct out | Direct, Delay out, Clock out, FB and Mix control jacks |
| Panel colour | Black with sage-green insets | Black/navy with blue insets |

---

## 4. Sources actually read

- PCM-41 Service Manual (OCR text): <https://archive.org/details/lexicon_Lexicon-PCM41-ServiceManual>. We used
  §1.2-1.3, §2.1-2.2, §3.0.2-3.0.4 and §5.1-5.3.
- PCM 42 Owner's Manual (OCR text): <https://archive.org/details/Lexicon_PCM_42_owners_manual>. We used §1.0, §2.1-2.2,
  §3.3-3.5, §4.1-4.3 and §6.
- PCM-42 brochure, 1982: <https://archive.org/details/LexiconPCM42TheAdventureContinues1982>.
- Panel photos: fr.audiofanzine.com product pages `delay/lexicon/PCM-41/medias/photos/` (image 6710546) and
  `delay/lexicon/PCM-42/` (images 6549503, 6504021, 6504022).
- Not reachable from this environment: gearspace (blocked), archive.org PDF data nodes (blocked) and pluginboutique.
  We found no PCM41 or PCM42 review in muzines.co.uk's Lexicon gear listing.
