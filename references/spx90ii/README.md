# Studio reference: Yamaha SPX90II Digital Multi-Effect Processor

Research notes for building our own unit that looks, works and sounds like the Yamaha SPX90II: a 1U digital
multi-effect unit from about 1987. It has one input, two outputs, 30 factory programs and 60 user memories. Everything
below is written in our own words. The manual and magazine scans are copyrighted, so they are **not** committed here.
Fetch them from the URLs in section 7.

Citation keys:

- **OM p.x** = page x of the English section of the *SPX90II Operating Manual* (trilingual English, French and German
  edition, printed in Japan in 1988; its MIDI chart is dated 28 Nov 1986). archive.org item `manualsbase-id-119664`.
  We could only read its OCR text layer. archive.org page images were blocked from this environment, so the parameter
  table on OM p.24-26 was rebuilt from two OCR copies, the English and German tables. Values the two copies disagree
  on are marked **(?)**.
- **OM90 p.x** = the *SPX90* (Mk I) Operating Manual, archive.org item `manualzz-id-989794`, read the same way. We use
  it only for comparison.
- **SOS91** = David Mellor, "Hands On: Yamaha SPX90", *Sound On Sound*, Dec 1991, pp.68-72 (muzines).
- **IM86** = Jim Betteridge, "Yamaha SPX90 Effects Processor", *International Musician & Recording World*, May 1986,
  pp.130-131 (muzines). It includes a frontal photo of the SPX90 front panel.
- **EMM86** = Tim Goodyer, "Yamaha SPX90 Multi-Effect Processor", *Electronics & Music Maker*, Mar 1986, p.38
  (muzines).
- **[Photo AF]** = user photos of real SPX90II units on fr.audiofanzine.com (front, rear and detail views).
- **[Eng]** = our own engineering assumption, not a source fact.

---

## 1. What it is; SPX90 vs SPX90II

- The SPX90II is a single-effect digital processor: **one effect at a time** (SOS91). It takes a mono input and gives a
  stereo output, and it has MIDI program change. The effect families are reverb, early reflections, gated and reverse
  reverb, delay and echo, flange, chorus, phasing, "tremolo" (really a deep chorus), symphonic, pitch change, "freeze"
  (a 2-second sampler), noise gate, a trigger-based "compressor", auto pan, triggered pan, delay vibrato and a
  parametric EQ (OM p.10-20).
- It has 30 ROM presets (memories 1-30) and 60 battery-backed user memories (31-90). The edit key is
  **PARAMETER**, values change with up and down keys, and you choose a memory with a separate pair of up and down keys
  followed by **RECALL** or **STORE** (OM p.3, p.5-6).
- The SPX90 Mk I came out in early 1986 (EMM86, IM86). SOS91 says the Mk II was the same machine apart from a
  longer maximum delay (0.5 s up to 2 s) and wider ranges on some parameters. Comparing the two manuals confirms this.
  Range changes (OM90 p.10-20 compared with OM p.10-20):

| Parameter | SPX90 | SPX90II |
|---|---|---|
| Reverb DELAY (pre-delay) | 0.1-50 ms | 0.1-1000 ms |
| E/R DELAY | 0.1-400 ms | 0.1-1800 ms |
| E/R ROOM SIZE | 1.0-20.0 | 0.1-20.0 |
| DELAY L,R per channel | 0.1-500 ms | 0.1-2000 ms |
| STEREO ECHO per channel | 0.1-250 ms | 0.1-1000 ms |
| MOD FRQ / PAN SPEED | 0.1-20 Hz | 0.1-40 Hz |
| Pitch DELAY A, B, D / C | 0.1-400 / 0.1-200 ms | 0.1-1800 / 0.1-900 ms |
| PEQ DELAY | 0.1-400 ms | 0.1-1800 ms |
| Freeze length, TRG DLY | 500 ms, ±500 ms | 2000 ms, ±2000 ms |

- The audio engine (31.25 kHz, 16 bit, 12 kHz bandwidth), the program list, the utility functions and the panel
  layout are the same on both. The badge changes from "SPX90" to "SPX90II" (OM90 p.23, OM p.23; [Photo AF]).

## 2. Specifications (OM p.23 unless noted)

| Item | Value |
|---|---|
| Input | 1 × unbalanced 1/4" phone jack, 10 kΩ. Nominal level −20 dBm or +4 dBm (rear switch). Front INPUT knob: max gain +12 dB in the spec (p.3 says "8" on the knob is unity and "10" is about +10 dB) |
| Input meter | 7-LED column |
| A/D | 1 channel, **31.25 kHz**, linear **16-bit** |
| D/A | 2 channels, 31.25 kHz, 16-bit |
| Bandwidth | effect 20 Hz-12 kHz; bypassed signal 20 Hz-20 kHz (an analogue dry path) |
| Output | 2 × unbalanced 1/4" jacks (L, R), 600 Ω. Nominal level −20 dBm or +4 dBm (rear switch) |
| Mixing | direct and effect (BALANCE), OUT LVL, BYPASS on/off |
| Dynamic range | reverb > 75 dB, delay > 81 dB (the manual adds that it is effectively > 90 dB in use) |
| THD | bypass < 0.01 %, effect < 0.03 % |
| Memories | presets (ROM) 1-30; user (RAM) 31-90, non-volatile (lithium battery, about 5 years, OM p.2). Every parameter except the input knob is stored |
| MIDI | IN and THRU. Program change 1-128 maps to memory 1-90 through 4 tables (banks A-D), each with a receive channel 1-16, OMNI or OFF. Note on/off is used as a trigger by programs 18, 19, 20, 25, 28 and 29, and as pitch by 21, 24 and 26 (OM p.8, p.24). SysEx bulk dump of a user memory or of a bank table (OM p.24) |
| Remote | rear DIN socket for the RC7 remote (direct keys for 1-7 and 31-37, the rest stepped) |
| Power | 110-120 V 60 Hz (US/Canada) or 220-240 V 50/60 Hz; 20 W |
| Size, weight | 480 × 45.2 × 285 mm (W × H × D), 1U; 3.2 kg |
| Power-up | Self-test. Errors E0 = ROM checksum, E1 = CPU RAM, E2 = external RAM (OM p.2). The output is muted for a few seconds, then the last-used program is selected (OM p.3) |

## 3. Front panel (for drawing)

Sources: [Photo AF] (frontal SPX90II photos and close-ups), IM86 photo (SPX90, same layout), OM p.3.

**General look.** Black anodised 1U rack panel, 19" (482.6 mm) wide with standard rack ears and two oval slots per
ear. All legends are small white sans-serif capitals. A long, slightly smoked, glossy **display window** runs from
about 16 % to 48 % of the width. It holds the logo, meter, LED digits and LCD, and is framed by a thin **teal/green
line**. Each key or key group on the SPX90II is a square **black** keycap with white legend, sitting in a thin
**teal/green outline**. The up/down keys show outlined triangle arrows.

Positions are the horizontal centre as a percentage of the full panel width, ears included. We estimated them from two
photos, so allow about ±2 %.

| # | Element | Position (% width) | Details |
|---|---|---|---|
| 1 | Rack ear and slots | 0-3 | two oval mounting slots |
| 2 | **POWER** | ~8 | Large square black push switch (about 13 × 13 mm), with the legend POWER above and "▁ON / ▀OFF" below |
| 3 | **INPUT** knob | ~13 | Small black pointer knob with "0" and "10" printed at the ends of a dotted scale arc; legend INPUT above |
| 4 | Logo | ~19-21 | Inside the window: "YAMAHA" in white bold, with "SPX90II" below in teal/green italic outline lettering (the "II" is smaller) |
| 5 | Input meter | ~25 | 7 small rectangular LEDs in a vertical column. Scale printed to the right, top to bottom: 0, −3, −6, −10, −15, −20, −30 (dB). Lower segments green, upper red (OM p.3); the exact red count is uncertain, probably the top 1-2 |
| 6 | **MEMORY** number | ~29-31 | 2-digit **red** 7-segment LED, about 13 mm digits, with MEMORY printed under it. It **flashes** while a new number is selected but not yet recalled or stored |
| 7 | **LCD** | ~36-47 | 16 characters × 2 lines, dot matrix. In photos the lit characters look **yellow-green** on a dark green-grey background (LED backlight). Whether it is positive or negative mode is not certain from the photos; draw yellow-green characters on a dark window |
| 8 | **PARAM-ETER** key | ~53 | Legend split over two lines "PARAM-/ETER", with a small **red LED** bar at the top of the key |
| 9 | Parameter **▲ / ▼** | ~57 | Two keys stacked vertically (▲ above ▼) that change the data value |
| 10 | **BALANCE** key | ~61 | |
| 11 | **STORE** key | ~66 | |
| 12 | Memory **▲ / ▼** | ~70 | Two keys stacked vertically that step the memory number |
| 13 | **RECALL** key | ~74 | |
| 14 | **UTILITY** key | ~79 | Has an LED that is lit while a utility page is open (OM p.8) |
| 15 | **FOOT TRIGGER** (top) and **BYPASS** (bottom) | ~84 | Two keys stacked vertically, each with a status LED (OM p.3, p.7) |
| 16 | **MEMORY TRIGGER** jack (top) and **BYPASS** jack (bottom) | ~89 | Two 1/4" jacks. A short horizontal line joins each to its key, and the legend sits to the right (~93 %) |
| 17 | Rack ear | 97-100 | |

Vertical layout: the single keys sit on the panel's horizontal centreline, and the stacked pairs fill almost the full
usable height (about 30 mm). The display window takes roughly the middle 60 % of the height.

**Rear panel** (from the rear, left to right; [Photo AF], OM p.4): REMOTE (DIN, for RC7), MIDI THRU, MIDI IN (both
5-pin DIN), OUTPUT LEVEL slide switch (−20 dB/+4 dB), OUTPUT R and L jacks, INPUT LEVEL slide switch (−20 dB/+4 dB),
INPUT jack, Yamaha nameplate ("DIGITAL SOUND PROCESSOR, MODEL SPX90II"), fixed mains cable.

## 4. Operation

Key names: PARAMETER, DATA ▲/▼ (parameter increment and decrement), BALANCE, STORE, MEMORY ▲/▼, RECALL, UTILITY,
FOOT TRIGGER, BYPASS.

**LCD format.** Line 1 shows the program title (16 characters). Line 2 shows the selected parameter as
`NAME= value unit`. Examples seen in the manual figures and on real units: `REV TIME= 2.4s`, `HIGH = 0.5`,
`BALANCE = 100 %`, `OUT LVL = 100 %`, `TRG. LEVEL= 100`, `MOD. FRQ= 0.1 Hz` (OM p.5-7; [Photo AF]). The parameter
names are the abbreviations in the table in section 5. In one photo the title is right-aligned ("   DELAY VIBRATO"),
in another it is left-aligned. Factory titles are probably padded to 16 characters, so the padding is uncertain.

**Recall.** Use MEMORY ▲/▼ to pick a number from 1 to 90. The LED digits flash. Press RECALL to load that program and
the digits stop flashing (OM p.5). IM86 notes that stepping from one end of the list to the other takes about 3 s, so
the keys auto-repeat.

**Edit.** Each press of PARAMETER moves to the next parameter of the program, wrapping round, and line 2 shows it. DATA
▲/▼ change the value at once and you hear the change. Edits are lost if you recall another program before storing
(OM p.5-6).

**BALANCE / OUT LVL.** BALANCE is available in every program. The first press shows `BALANCE = xx %` (0 % is dry
only, 100 % is effect only). The next press shows `OUT LVL = xx %` (0-100 %). DATA ▲/▼ adjust both. Both values are
stored with the program (OM p.7).

**Store.** After editing, choose a number from 31 to 90 with MEMORY ▲/▼ and press STORE. If you try to store to 1-30,
the unit shows the error `#1~#30 READ ONLY` (OM p.6). SOS91 warns that it is easy to overwrite a memory by pressing
STORE instead of RECALL, because there is no confirmation.

**BYPASS** (key, or a normally-closed footswitch such as the FC5 in the BYPASS jack). The LED lights and only the dry
signal reaches both outputs. BALANCE and OUT LVL are bypassed too, but the INPUT knob still sets the level (OM p.3,
p.7).

**FOOT TRIGGER** key (LED). When it is off, a footswitch in the MEMORY TRIGGER jack steps through memories within the
footswitch range and wraps round. When it is on, the same footswitch acts as the trigger for the gate, compressor, pan,
vibrato and freeze programs (OM p.3, p.14, p.17-19).

**UTILITY.** The UTILITY LED is on in this mode. Each press moves to the next page: EDIT TITLE → MIDI CONTROL → MIDI PGM
CHANGE → F.SW MEMORY RCL → back to normal mode (LED off). While utility is active, the parameter and memory keys do the
special jobs below (OM p.8-9):

- **EDIT TITLE** (user memories only). Line 1 shows the title with a cursor, line 2 shows `EDIT TITLE`. PARAMETER moves
  the cursor **left** and BALANCE moves it **right**. DATA ▲/▼ scroll through the character set: space, digits,
  upper- and lower-case letters, `[ ] < > . * + - = & %` and some katakana (OM p.8).
- **MIDI CONTROL**: `MIDI CONTROL` / `BANK:A  CH= 1`. DATA ▲/▼ choose bank A-D and MEMORY ▲/▼ set the receive channel:
  1-16, OMNI or OFF. The manual's chart suggests the active bank is the one shown. Bank D is the default (PGM n =
  MEM n) at power-on.
- **MIDI PGM CHANGE**: `MIDI PGM CHANGE` / `PGM 12 = MEM 4`. DATA ▲/▼ choose the incoming program number (1-128) and
  MEMORY ▲/▼ choose the memory to load (1-90).
- **F.SW MEMORY RCL**: `F.SW MEMORY RCL` / `RANGE 1 TO 30`. Sets the first and last memory the footswitch steps
  through. If the first number is higher than the last, it steps downward (for example `RANGE 34 TO 31` gives 34, 33,
  32, 31, 34 and so on). Which key pair sets which end is not stated; we assume DATA sets the first and MEMORY the
  last [Eng].

**Freeze operation** (OM p.14-16). PARAMETER steps through REC MODE → TRG DLY → RECORD → OVER DUB → PLAY → and so on.

- On the **RECORD** page, ▼ arms the unit and shows `REC READY`.
- In MANUAL mode, ▲ (or the footswitch with FOOT TRIGGER on) starts the 2000 ms recording. In AUTO mode the input
  level starts it.
- The display shows `TRIGGER!` when triggered and `OK` when the recording is finished.
- **OVER DUB** works the same way but layers onto the existing recording.
- On the **PLAY** page, ▲ or ▼ plays the recording (FREEZE A also accepts the footswitch, MIDI note on, or INPUT TRG
  set to ON so the input level triggers playback).
- In FREEZE B, the MIDI note sets the playback pitch and also triggers playback.

## 5. The 30 factory presets

The table is rebuilt from OM p.24-26 (English and German OCR copies) and checked against the parameter descriptions on
OM p.10-20. Each cell is: displayed parameter name, factory value, range. The program names are as printed in the
manual table; the LCD text should be the same. "Alg" is the type label printed in the table. Every program also has
**BALANCE** and **OUT LVL** (0-100 %). Their factory values are 100 % / 100 %, except **STEREO FLANGE A balance 50 %**
and **STEREO FLANGE B balance 75 %**. Those two come from aligning the OCR columns and are fairly confident.

### Reverb (Alg REV): programs 1-4

| # | Name | REV TIME (0.3-99.0 s) | HIGH (0.1-1.0) | DELAY (0.1-1000.0 ms) | HPF (THRU, 32 Hz-1.0 kHz) | LPF (1.0-11 kHz, THRU) |
|---|---|---|---|---|---|---|
| 1 | REV 1 HALL | 2.6 s | 0.6 | 30.0 ms | THRU | 8.0 kHz |
| 2 | REV 2 ROOM | 1.5 s | 0.7 | 20.0 ms | THRU | 8.0 kHz |
| 3 | REV 3 VOCAL | 2.4 s | 0.5 | 45.0 ms | 80 Hz | 8.0 kHz |
| 4 | REV 4 PLATE | 1.8 s | 0.7 | 10.0 ms | 40 Hz | 10.0 kHz |

- REV TIME is RT60 measured at 1 kHz. HIGH is the ratio of high-frequency RT to mid RT.
- The HPF steps through standard frequencies. The PEQ text says the HPF slope is 6 dB/oct; we assume the reverb HPF is
  the same [Eng]. The manual does not give the step list. Assume 1/3-octave ISO steps 32, 40, 50, 63, 80, 100 … 1.0
  kHz, and LPF steps 1.0, 1.25, 1.6, 2.0, 2.5, 3.2, 4.0, 5.0, 6.3, 8.0, 10, 11 kHz, THRU [Eng]. The factory values
  6.3 k, 8 k, 10 k, 40 Hz and 80 Hz all fit that series.

### Early reflections (Alg E/R1 = low density, E/R2 = high density): programs 5, 6, 16, 17

| # | Name | Alg | TYPE (HALL/RANDOM/REVERSE/PLATE) | ROOM SIZE (0.1-20.0) | LIVENESS (0-10) | DELAY (0.1-1800.0 ms) | LPF (1.0-11 kHz, THRU) |
|---|---|---|---|---|---|---|---|
| 5 | EARLY REF. 1 | E/R1 | HALL | 2.0 | 5 | 10.0 ms | THRU |
| 6 | EARLY REF. 2 | E/R2 | HALL | 2.0 | 5 | 10.0 ms | THRU |
| 16 | GATE REVERB | E/R2 | RANDOM | 2.0 | 5 | 20.0 ms | 6.3 kHz |
| 17 | REVERSE GATE | E/R2 | REVERSE | 3.3 | 5 | 29.0 ms | THRU |

The label on the delay parameter is shown as DELAY or DLY in different places.

### Delay / echo: programs 7-8

| # | Name | Alg | Lch DLY | Lch F.B | Rch DLY | Rch F.B | HIGH (0.1-1.0) |
|---|---|---|---|---|---|---|---|
| 7 | DELAY L,R | DELAY | 100.0 ms (0.1-2000.0) | 0 % (−99…+99) | 200.0 ms (0.1-2000.0) | 0 % | 1.0 |
| 8 | STEREO ECHO | ECHO | 170.0 ms (0.1-1000.0) | 60 % | 178.0 ms (0.1-1000.0) | 58 % | 0.9 |

A negative F.B value means the feedback is phase-inverted. HIGH damps the high frequencies inside the feedback loop.

### Modulation (Alg MOD.): programs 9-15

| # | Name | Parameters (value, range) |
|---|---|---|
| 9 | STEREO FLANGE A | MOD. FRQ 2.5 Hz (0.1-40.0 Hz); MOD. DEPTH 50 % (0-100); MOD. DLY 1.2 ms (0.1-100.0 ms); F.B GAIN 35 % (0-99 %) |
| 10 | STEREO FLANGE B | MOD. FRQ 0.5 Hz; MOD. DEPTH 90 %; MOD. DLY 1.0 ms; F.B GAIN 40 % |
| 11 | CHORUS A | MOD. FRQ 0.2 Hz (0.1-40.0); DM DEPTH 50 % (0-100); AM DEPTH 40 % (0-100) |
| 12 | CHORUS B | MOD. FRQ 0.6 Hz; DM DEPTH 50 %; AM DEPTH 10 % |
| 13 | STEREO PHASING | MOD. FRQ 1.1 Hz (0.1-40.0); MOD. DEPTH 100 %; MOD. DLY 3.0 ms (0.1-8.0 ms) |
| 14 | TREMOLO | MOD. FRQ 6.0 Hz (0.1-40.0); MOD. DEPTH 50 % |
| 15 | SYMPHONIC | MOD. FRQ 0.7 Hz (0.1-40.0); MOD. DEPTH 50 % |

- On flange and chorus, 100 % depth means the delay swings by ±4 ms (OM p.12).
- DM is delay-time modulation and AM is amplitude modulation.
- "TREMOLO" works like CHORUS with deeper, wider modulation (OM p.13); it is **not** an amplitude tremolo (SOS91).

### Gate / dynamics: programs 18-20

| # | Name | Alg | Parameters 1-9 |
|---|---|---|---|
| 18 | ADR-NOISE GATE | GATE | TRG. LEVEL 65 (1-100); TRG. DLY −7 ms (−100…+100 ms); TRG. MSK 5 ms (5-32000 ms); ATTACK 5 ms (5-32000); DECAY 5 ms (5-32000); DECAY LVL 100 % (0-100); HOLD 90 ms (1-30000); RELEASE 5 ms (5-32000); MIDI TRG OFF (OFF/ON) |
| 19 | COMPRESSOR | (GATE family) | TRG. LEVEL 89 (1-100); TRG. DLY −25 ms (−100…+100); TRG. MSK 420 ms (5-32000); ATTACK 22 ms (5-32000); HOLD 28 ms (1-30000); HOLD LEVEL 1 % (0-100) (?); RELEASE 525 ms (5-32000); MIDI TRG OFF |
| 20 | REVERB & GATE | R&G | REV TIME 2.0 s (0.3-99.0); HIGH 0.6 (0.1-1.0); DELAY 10.0 ms (0.1-1000.0); HPF THRU; LPF THRU; TRG. LEVEL 65 (1-100); HOLD 150 ms (1-30000) (?); RELEASE 5 ms (5-32000); MIDI TRG OFF |

The R&G trigger-level range is printed as 0-100 % in the text and 1-100 in the table.

### Pitch (Alg PITCH): programs 21-24

| # | Name | Parameters |
|---|---|---|
| 21 | PITCH CHANGE A | PITCH 6 (?) (−12…+12 semitones; the OCR is ambiguous between 6 and 0); FINE 0 (−100…+100 cents); DELAY 0.1 ms (0.1-1800.0 ms); F.B GAIN 0 % (0-99 %) (?); BASE KEY C3 (OFF, C1-C6) |
| 22 | PITCH CHANGE B | 1 PITCH 0; 1 FINE +8; 1 DLY 0.1 ms (0.1-1800.0); 2 PITCH 0; 2 FINE −8; 2 DLY 20.0 ms (0.1-1800.0) |
| 23 | PITCH CHANGE C | L PITCH 0; L FINE +8; L DLY 0.1 ms (0.1-900.0); R PITCH 0; R FINE −8; R DLY 0.1 ms (0.1-900.0) |
| 24 | PITCH CHANGE D | PITCH 0; FINE 0; DELAY 0.1 ms; F.B GAIN 0 % (?); BASE KEY C3 (?) (OFF, C1-C6) |

- Program A has one voice, with feedback and MIDI note control.
- Program B has two voices, both mixed to the centre.
- Program C has two voices, one on L and one on R.
- Program D is like A. The manual never says how A and D differ; they are presumably two starting points with
  different settings.
- With MIDI, Note − BASE KEY gives the shift in semitones, folded into the range −12…+12. For example, with BASE KEY C4,
  pressing C3 gives −12 and D4 gives +2 (OM p.13-14).

### Freeze (Alg FREEZE): programs 25-26

| # | Name | Parameters |
|---|---|---|
| 25 | FREEZE A | REC MODE AUTO (MANUAL/AUTO); TRG. DLY −5 ms (−2000.0…+2000.0 ms); RECORD (action page); OVER DUB (action page); PLAY (action page); START 0 (0-2000.0 ms); END 2000.0 (0-2000.0 ms); INPUT TRG OFF (OFF/ON); TRG. MSK 80 ms (10-2000.0 ms) |
| 26 | FREEZE B | REC MODE MANUAL; TRG. DLY −50 ms (−2000.0…+2000.0); RECORD; OVER DUB; PLAY; PITCH 0 (−12…+12); FINE 0 (−100…+100); BASE KEY C3 (OFF, C1-C6) |

On FREEZE A, setting END before START plays that segment backwards (OM p.16).

### Pan, vibrato and EQ: programs 27-30

| # | Name | Alg | Parameters |
|---|---|---|---|
| 27 | PAN | PAN | PAN SPEED 0.7 Hz (0.1-40.0 Hz); DIRECTION L↔R (?) (L→R, L←R, L↔R); DEPTH 75 % (0-100) |
| 28 | TRIGGERED PAN | PAN | TRG. LEVEL 65 (1-100); TRG. DLY −10 ms (−100…+100); TRG. MSK 1000 ms (5-32000); ATTACK 22 ms (5-32000); PANNING 525 ms (5-32000); RELEASE 840 ms (5-32000); DIRECTION L→R (L→R, L←R); L/R BALANCE 30 % (0-100); MIDI TRG OFF |
| 29 | DELAY VIBRATO | VIB | TRG. LEVEL 100 (1-100); VIB DLY 400 ms (1-30000); VIB RISE 1400 ms (5-32000); VIB FRQ 7.0 Hz (0.1-20.0 Hz); VIB DEPTH 40 % (0-100); MIDI TRG OFF (OFF/ON) |
| 30 | PARAMETRIC EQ. | PEQ | HPF THRU (THRU, 32 Hz-1.0 kHz, 6 dB/oct); MID FRQ 500 Hz (315 Hz-4.0 kHz, 1/6-octave steps); MID GAIN 0 dB (−15…+15 dB); MID Q 1.0 (0.5-5.0); HI FRQ 2.0 kHz (800 Hz-8.0 kHz); HI GAIN 0 dB (−15…+15); HI Q 1.6 (0.5-5.0); LPF THRU (1.0-11 kHz, THRU); DELAY (0.1-1800.0 ms), factory value unreadable, probably 0.1 ms (?) |

- On program 28, the SPX90II manual text wrongly lists LPF and DELAY as parameters 8 and 9 (copied from the PEQ
  text). The table, and the SPX90 manual's text, give DIRECTION, L/R BALANCE and MIDI TRG instead (OM90 p.19).
- Program 27 is called "Auto Pan" in SOS91. The PAN DEPTH and SPEED are described on OM p.19.

## 6. Modelling recipes per family

Common to all programs [Eng unless cited]:

- **Signal path.** Mono input → INPUT gain (knob position 8 is 0 dB, 10 is about +10 dB) → split. One branch is the
  analogue dry path; the other goes through an anti-alias LPF at about 12 kHz (steep) → A/D at 31.25 kHz, 16 bit → DSP
  → stereo D/A → reconstruction LPF at about 12 kHz (OM p.23, block diagram on p.29).
- **Output mix.** Each output is `OUT LVL × ((1−B)·dry + B·wet)`, where B is BALANCE/100, with a linear crossfade
  [Eng]. On BYPASS the output is dry only, with the BALANCE/OUT LVL stage skipped and the dry path keeping its full
  20 kHz bandwidth (OM p.7, p.23). SOS91 notes that the internal mix dulls the dry sound to 12 kHz, so the "dry" inside
  the mix appears to be the digitised, band-limited signal. Model the dry part of the mix as the band-limited signal
  and the BYPASS path as full band.
- **Run the DSP at 31.25 kHz** (resample in and out), or at your host rate with 12 kHz band-limiting. Add a little
  16-bit-era noise: a reverb noise floor about 75 dB below full scale.
- **Parameter changes** take effect at once. Ramp them over about 20 ms to avoid zipper noise; the original was
  probably steppy.

**Reverb (REV 1-4, and R&G front end).**

- Structure: pre-delay (DELAY) → early-reflection taps (fixed pattern per program: hall, room, vocal, plate) → a late
  reverb network (for example an 8-line FDN or a Schroeder/Moorer allpass+comb network) with stereo decorrelated taps
  for L and R.
- Loop gain per line: `g = 10^(−3·d/(RT·fs))`, where d is the line length.
- HIGH: a one-pole low-shelf/LPF in each loop, set so that the RT above about 4-5 kHz is HIGH × RT [Eng: crossover
  frequency assumed].
- HPF and LPF act on the wet output only.
- Character per program [Eng]: ROOM has shorter delay lines and denser early reflections; PLATE has no distinct early
  reflections and a fast, bright build-up; VOCAL is a hall with a longer pre-delay. SOS91 notes very short times sound
  like a tiled room with bright flutter, so keep the line count modest (the original is metallic at short RT).

**Early reflections (E/R1, E/R2; GATE REVERB, REVERSE GATE).**

- Structure: pre-delay (DELAY) → multi-tap delay → LPF. Separate tap sets for L and R.
- E/R1 uses about 8 taps per side and E/R2 about 20 [Eng].
- TYPE chooses a fixed table of tap times and gains:
  - HALL: clustered, decaying.
  - RANDOM: irregular spacing and gains.
  - PLATE: dense and short.
  - REVERSE: gains rise over time and end abruptly.
- ROOM SIZE scales all tap times linearly. The manual's chart plots size 1.0 and 4.0 over a 0-500 ms axis, so the last
  tap is about 100 ms per unit of size [Eng, (?)].
- LIVENESS sets the slope of the tap-gain decay: 0 dies very fast, 10 is nearly flat. For REVERSE, it sets how steeply
  the taps rise.
- GATE REVERB is simply the RANDOM pattern at size 2 with a 6.3 kHz LPF, so the "gate" comes from the finite tap span.
  REVERSE GATE is the REVERSE pattern at size 3.3.

**Delay / echo (DELAY L,R; STEREO ECHO).**

- Two independent delay lines (L and R) fed by the mono input.
- Each has its own feedback (−99…+99 %) through a one-pole LPF set by HIGH (1.0 = flat; lower values roll off more per
  repeat).
- SOS91 found the two programs identical apart from range. We treat ECHO as the same structure with a 1000 ms limit.
  Cross-feedback (ping-pong) is **not** documented.

**Modulation.**

- STEREO FLANGE: one delay line with base delay MOD. DLY, modulated by a sine LFO (MOD. FRQ). Depth is
  ±4 ms × DEPTH/100, clamped so the delay stays above 0.1 ms. Feedback is F.B GAIN, positive. Wet L and R use LFO
  phases 180° apart [Eng]. The flanging comb comes from BALANCE mixing in the dry signal (hence the factory 50 %/75 %
  settings).
- CHORUS: three modulated taps, panned L, centre and R (OM p.12), at base delays of about 10-20 ms [Eng]. LFO phases
  are 0/120/240°. DM DEPTH sets ±4 ms × DM/100. AM DEPTH modulates each tap's gain by the same LFO (up to −100 %).
- STEREO PHASING: as the flanger but with no feedback and a 0.1-8 ms base delay (OM p.13). With BALANCE at 100 %, a
  pure modulated delay would only give vibrato, so we assume the algorithm sums an unmodulated (or anti-phase
  modulated) path internally. Each output is `x + d(t)`, with L and R using opposite LFO phase [Eng, (?)].
- TREMOLO: the chorus structure, with more depth and a wider delay sweep. A 6 Hz rate gives a warbling vibrato-chorus.
- SYMPHONIC: a multi-voice chorus with fixed internal delay, only rate and depth editable. It sounds like a "very strong
  ultra chorus" (SOS91). Use about 4 voices with slightly detuned LFO rates, spread L and R [Eng].

**Pitch change (A-D).**

- A classic two-pointer delay-line shifter: two read heads moving at rate `r = 2^((PITCH + FINE/100)/12)`, crossfaded
  with a raised-cosine window, on a window of about 30-50 ms [Eng]. The manual admits output pitch can be slightly off
  for some sources (OM p.14), which fits a simple time-domain shifter.
- DELAY puts a delay before the shifter.
- A and D add F.B GAIN, which feeds the shifted output back into the input delay. The result is a spiralling pitch echo
  (SOS91: +4 semitones, 100 ms, 80 % feedback).
- B: two shifters summed to the centre. C: two shifters, one to L and one to R.
- MIDI note on sets PITCH from Note − BASE KEY, folded into −12…+12.

**Freeze.**

- A 2.0 s mono buffer (62,500 samples at 31.25 kHz).
- RECORD and OVER DUB start on a trigger: the front-panel ▲ key, the footswitch, input above a fixed threshold in AUTO
  mode, or a MIDI note.
- TRG. DLY moves the recorded window relative to the trigger. A negative value uses a pre-roll ring buffer, so
  material from before the trigger is kept.
- OVER DUB adds the new input into the buffer.
- FREEZE A plays from START to END (in reverse if END < START). Each playback trigger restarts it; TRG. MSK ignores new
  triggers for that time; INPUT TRG lets the input level trigger it.
- FREEZE B reads the buffer at rate r (PITCH/FINE or MIDI note − BASE KEY). IM86 says it resumes from where it last
  stopped rather than restarting.

**Trigger-envelope family (ADR gate, compressor, R&G, triggered pan, delay vibrato).** These are not level-following
dynamics. They are **one-shot envelope generators fired by a level trigger**:

- Trigger detector: peak level > TRG. LEVEL. Map 1-100 to roughly −48…0 dBFS [Eng]. Also fired by the footswitch (with
  FOOT TRIGGER on) or a MIDI note (MIDI TRG ON).
- TRG. MSK: no re-trigger for that many ms.
- TRG. DLY: positive values delay the envelope start; negative values delay the audio instead, so the envelope opens
  before the sound arrives (look-ahead).
- **ADR-NOISE GATE**: gain 0 → rises to 1 over ATTACK → falls to DECAY LVL over DECAY → holds for HOLD → falls to 0
  over RELEASE. Use linear ramps in dB or amplitude [Eng]. With a long ATTACK this gives the "reverse gate" swell
  (OM p.17).
- **COMPRESSOR**: gain 1 → falls to HOLD LEVEL over ATTACK → stays for HOLD → returns to 1 over RELEASE. It is
  effectively a triggered ducker, which is why reviewers found it unorthodox (IM86, SOS91).
- **REVERB & GATE**: the REV engine → the gate envelope (instant open, HOLD, then RELEASE), triggered from the *dry
  input* level.
- **TRIGGERED PAN**: on trigger, the pan position moves from one side to the other over ATTACK (DIRECTION), stays for
  PANNING, and returns over RELEASE. L/R BALANCE sets the static L/R level offset (OM90 p.19). We assume it uses
  constant-power pan laws [Eng].
- **DELAY VIBRATO**: on trigger, vibrato depth drops to 0, stays there for VIB DLY, then ramps to VIB DEPTH over VIB
  RISE. Vibrato is a modulated delay line (base about 5 ms, peak swing about ±2 ms × DEPTH/100 [Eng]) at VIB FRQ, wet
  output only.

**PAN (auto-pan).** An LFO at PAN SPEED drives constant-power panning of the mono input. DEPTH sets the swing:
0 % is centre and 100 % is hard L to hard R. L→R and L←R are probably saw ramps in one direction; L↔R is a triangle or
sine [Eng]. At 5 Hz on a single output it works as a real amplitude tremolo (SOS91).

**PARAMETRIC EQ.** In series: HPF (1st order, 6 dB/oct) → MID peaking biquad (fc in 1/6-octave steps, gain ±15 dB, Q
0.5-5) → HI peaking biquad (same, 800 Hz-8 kHz) → LPF (we assume 1st order, matching the HPF [Eng]) → DELAY. The same
signal goes to both outputs.

**Distortion / EQ elsewhere:** the unit has no distortion program (EMM86).

## 7. Sources actually read

1. *SPX90II Operating Manual* (Yamaha, EN/FR/DE), OCR text via
   https://archive.org/stream/manualsbase-id-119664/119664_djvu.txt (item page
   https://archive.org/details/manualsbase-id-119664). We used the English pages 2-9 (panels and operation), 10-20
   (program descriptions), 23 (specs), 24 (MIDI data format), 24-26 (ROM table), 27-31 (charts and MIDI chart), and
   cross-checked the German ROM table.
2. *SPX90 Operating Manual* (Mk I), OCR via https://archive.org/stream/manualzz-id-989794/989794_djvu.txt (OM90
   p.3-21, 23, ROM table).
3. D. Mellor, "Hands On: Yamaha SPX90", *Sound On Sound*, Dec 1991,
   https://www.muzines.co.uk/articles/hands-on-yamaha-spx90/7549 (includes the "SPX90II and SPX900" side bar).
4. J. Betteridge, "Yamaha SPX90 Effects Processor", *IM&RW*, May 1986,
   https://www.muzines.co.uk/articles/yamaha-spx90-effects-processor/6814. The front-panel photo is
   https://www.muzines.co.uk/images_mag/articles/im/IM_86_05_yamaha_spx90_1_full.jpg.
5. T. Goodyer, "Yamaha SPX90 Multi-Effect Processor", *E&MM*, Mar 1986,
   https://www.muzines.co.uk/articles/yamaha-spx90-multi-effect-processor/9246.
6. User photos of SPX90II units, front, rear and close-ups:
   https://fr.audiofanzine.com/multieffet/yamaha/SPX90-II/ and https://fr.audiofanzine.com/processeur-sono/yamaha/spx-90-ii/
   (images on medias.audiofanzine.com, e.g. `yamaha-spx90-ii-6911069.jpg`, `-6911071.jpg`, `yamaha-spx-90-ii-6867086/87/88/91.jpg`).

Not reachable from this environment: the archive.org page images and PDFs (download host blocked), the Yamaha manual
library (usa.yamaha.com) and gearspace.com. muzines has no dedicated SPX90II review; the SPX90 reviews apply because the
two units share the same engine and panel.
