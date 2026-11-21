# Studio reference: Akai S900 MIDI Digital Sampler (1986)

Research notes for building a unit that looks, works and sounds like the Akai **S900**, a 12-bit, 8-voice rack
sampler with a built-in 3.5" floppy drive. Everything below is written in our own words. Manuals, service notes,
magazine reviews and photos are copyrighted, so they are **not** committed here. Fetch them from the URLs in section 9.

> **Important correction: the S900 is 3U, not 2U.** Akai's own spec sheet gives 482.6 (W) × 132.6 (H) × 410 (D) mm,
> "EIA rack mount/3U", 10.8 kg (OM p.25 specs; SN p.1). SOS Jul 86 and HSR Sep 86 also call it 3U. 132.6 mm is
> 5.22 in. All the vertical positions below are a % of that 3U panel height. If the mockup has to fit a 2U slot, scale
> the whole face uniformly. Don't squash it vertically: the panel aspect ratio is 3.64:1.

Citation keys:

- **OM p.x** = *Akai S900 MIDI Digital Sampler Operator's Manual* (print code 610605-1, OS v1.x era, 26 pp.).
  archive.org item `synthmanual-akai-S900ownersmanual`. We read only its OCR text layer, because the PDF and page
  images sit on archive.org data nodes that were blocked here. Page numbers are the printed folios we could identify
  from the OCR. Section names follow the manual: "Ch.2 Pt.6 p.04" means the Edit Program function, page 04. The OCR
  of the LCD screen pictures is garbled, so the screen layouts in §4 are **reconstructions** (marked **(OCR)**).
- **SN** = *Akai S900 / ASK90 Service Manual* ("service notes"). archive.org item `Akai_S900_service_notes`, OCR text
  only. We used the spec page, the controls list (§II), the parts location (§IV), the adjustment (§V), the parts lists
  (voice PCB, CPU PCB, panel PCB, volume PCB, LCD PCB) and the IC information pages.
- **SX** = *MIDI System Exclusive Data Format for S900, Disk Version V2.0* (Akai doc "EX 9200x"). archive.org item
  `Akai_S900_SysEx_format`, OCR text. It is the best source for **parameter ranges, units and defaults** (§3.3).
- **OM950** = *Akai S950 Operator's Manual* (UK edition). archive.org item `manualzilla-id-7440972`, OCR text. The
  S950 is the S900's direct successor with the same 40×2 page UI. We use it only to fill gaps, and each use is marked.
- **E&MM** = Paul Wiffen, "Akai S900 Sampler", *Electronics & Music Maker*, Jul 1986.
  <https://www.muzines.co.uk/articles/akai-s900-sampler/1931>
- **SOS86** = Mark Jenkins, "Eat your heart out PPG!", *Sound On Sound*, Jul 1986.
  <https://www.muzines.co.uk/articles/eat-your-heart-out-ppg/1622>
- **IMRW** = Paul Fishman, "Akai S900 Sampler", *International Musician & Recording World*, Jul 1986, pp.84-86.
  <https://www.muzines.co.uk/articles/akai-s900-sampler/11018>
- **HSR** = "Sampling An Akai", *Home & Studio Recording*, Sep 1986.
  <https://www.muzines.co.uk/articles/sampling-an-akai/12863>
- **SOS87** = David Mellor, "Akai S900 Revisited" (V2.0 software), *Sound On Sound*, Oct 1987.
  <https://www.muzines.co.uk/articles/akai-s900-revisited/2520>
- **MT87** = Chris Jenkins, "Sampling Expandability" (V1.2, V2.0, ASK90), *Music Technology*, Sep 1987.
  <https://www.muzines.co.uk/articles/sampling-expandability/2081>
- **SOS88** = David Mellor, "Bits & Pieces" (Marion Systems MS9C 16-bit voice board), *Sound On Sound*, Dec 1988.
  <https://www.muzines.co.uk/articles/bits-and-pieces/4023>
- **MT89** = "Akai S950 Digital Sampler", *Music Technology*, Jan 1989 (used for S900 vs S950 differences).
  <https://www.muzines.co.uk/articles/akai-s950-digital-sampler/16>
- **[Photo A]** = production S900 with rack ears, straight-on front view (audiofanzine image **6827096**, 2038×789).
  This is our main source for details, legends and colours.
- **[Photo P]** = Akai press photo (audiofanzine image **6851001**, 600×434). It is nearly orthographic (its panel
  aspect ratio measures 3.68, against 3.64 true), so it is our **main source for % positions**. It shows an
  *early/pre-production* face: "EDIT PRESET" legends and a single wide ARROW/CURSOR key. Elsewhere it matches
  production.
- **[Photo C]** = close-ups: audiofanzine **7001126** (function keys, LEDs, page table, keypad, MIDI RECEIVE LED lit),
  **6409191** (right-hand knobs and jacks), **6731633** (stock LCD lit, showing "Press ENT to replay"), **6923688**
  (LCD unlit, logo), **6827095** (rear panel with an ASK90 fitted). All are on
  `https://fr.audiofanzine.com/sampleur/akai/s900/medias/photos/`. **Caution:** several gallery units have
  aftermarket blue OLED/LCD displays or Gotek floppy emulators (6409187-90, 6480769-80). Ignore those for colours.
- **[Eng]** = our own engineering inference or assumption, not a source fact.

---

## 1. What it is, history, versions

- Akai's second sampler after the S612 (1985). It was announced at Winter NAMM/Frankfurt in early 1986 and in UK shops
  by mid-1986 at £1599-1699 (IMRW; SOS86; E&MM). It is designed purely as a rack module played over MIDI.
- It has 12-bit sampling, a variable bandwidth of 3-16 kHz (sample rate 7.5-40 kHz), about 750 KB of sample RAM, 8
  voices, 8 individual outputs plus L/R and mono mix, a 3.5" DS/DD floppy, and a backlit 40×2 LCD (OM p.25; SN p.1).
- OS history:
  - **V1.0/1.1**: the launch software. The Utility page is empty (E&MM; SOS86).
  - **V1.2**: a free EPROM update. It adds a keygroup one-shot trigger for drum machines, a display of the previous
    sample's bandwidth, a MIDI program-change disable, and MIDI loudness (CC7) send/receive (MT87). The SN CPU parts
    list carries `S900LSB/MSB-V1.2A` EPROMs. A gallery photo shows the boot banner "AKAI S900 VERSION 1.2".
  - **V2.0**: a paid boot disk, copy-protected, £49.50-59.95. It adds audio pre-trigger, auto start point, crossfade
    looping, **filter ADSR**, velocity release on note-on, any-two-samples velocity crossfade with a 50 % point and
    time skew, and keygroup copy (SOS87; MT87; SX).
  - A later "OS v4.0" boot image exists on archive.org (`GOTEK_HxC_AKAI_S900_USB_Dump`). We did **not** verify its
    feature list.
- Options: the **ASK90** board gives 8 audio trigger inputs, enables the UTILITY drum pages and adds a Disk page 09
  (MT87; SX drum block). The 13-pin **VOICE OUT** connects to the Akai AX73/VX90/AX60 analog synths for external
  VCF/chorus (SOS86; MT87). The **Marion Systems MS9C** (Tom Oberheim) is a replacement voice board with 16-bit
  converters and companded 12-bit storage (SOS88).
- The S950 (1988) keeps the same 8 voices with monophonic individual outs, and the same L = voices 1-4 / R = voices 5-8
  rule. It goes to 48 kHz / 19.2 kHz bandwidth and expandable memory. It has blue/grey keypad buttons, S1000-style
  knobs and a quieter drive (MT89).

---

## 2. Front panel (priority 1)

### 2.1 Overall

| Item | Value |
|---|---|
| Size | 19" rack, **3U**. 482.6 × 132.6 mm face, 410 mm deep, 10.8 kg (OM p.25) |
| Panel finish | **Light silver-grey anodised/painted aluminium**, matt, warm-neutral. Suggested `#cfcfcb` (photos range from `#c8c8c4` to `#dcdcd8` depending on white balance). HSR calls it a "grey box" |
| Legend ink | **Black**, plain grotesque caps (Helvetica-like, ~2.2-2.8 mm cap height), except as noted below |
| Ears | Integral ears about **5.3 %** wide each side (≈25.5 mm). A vertical seam/step marks the ear/face boundary at ≈5.3 % and ≈94.7 %. Each ear has **two horizontal oval slots** (≈2.5 % × 4 % of the panel) at x ≈1.7 % / 98.3 %, y ≈28.5 % and ≈73 % |
| Measured from | [Photo P] (positions), with sizes and colours checked against [Photo A] and [Photo C]. The x tolerance is ±1 % for the centre band and ±1.5 % near the ears. y is ±2 %. [Photo A] is a slightly rotated three-quarter view: it gives the same order and spacing, but its left-half features sit about 1.5-2 % further right, which is perspective |

Positions: **x** = centre as a % of the full 482.6 mm width, ear to ear. **y** = centre as a % of the panel height,
measured down from the top edge (0 % = top, 100 % = bottom).

### 2.2 Left section (ear to the LCD)

| x % | y % | Element | Size (W×H, % of width / % of height) | Legend / colour / notes |
|---|---|---|---|---|
| 9.7 | 9 | **AKAI** logo | 4.8 × 7 (7.3-12.1 %) | "AKAI" in Akai's bold serif wordmark, **red** (`#c8202a`) |
| 14.4 | 10 | "professional" | 3.9 wide (12.4-16.3 %) | Red italic script, baseline aligned with AKAI |
| 21.8 | 7 / 11 | "MIDI" over "DIGITAL SAMPLER" | 8.8 wide (17.4-26.2 %) | Two lines, black, in a squarish "techno"/stencil-like typeface, small (~2 mm) |
| 9.8 | 25 | **POWER** switch | 4.4 × 20 (≈21 × 26 mm), square | Large square push button, latching. Cap is **dark smoked grey/black** with "POWER" printed in **red** near the bottom edge of the cap |
| 23.7 | 19.5 | "CONTRAST" label | | |
| 23.7 | 28 | **CONTRAST** knob | Ø 3.0 (≈14.5 mm) | Small dark-grey round knob, ring of ~11 dots around it (no numbers). LCD viewing-angle trim |
| 18.2 | 60 | "FLOPPY DISK DRIVE" label | | Black caps, widely tracked |
| 18.3 | 77.5 | **Floppy drive** bezel | 21.4 × 26 (7.6-29.0 %, y 64.5-90.5 %), ≈103 × 34 mm | **Black** plastic bezel with a 3.5" slot at y ≈68 %. A black **eject push-tab** sits under the slot (centre-left) and pops out when a disk is in. A small **red activity LED** is at the lower right (x ≈28.4 %, y ≈83 %) (OM p.3: "red light in the lower right-hand side of the disk drive") |

### 2.3 Centre section (LCD, mode keys, page table)

| x % | y % | Element | Size | Legend / colour / notes |
|---|---|---|---|---|
| 33.8 | 8 | **S900** model logo | 6.8 × 6.5 (30.4-37.2 %) | **Outlined (hollow) letters**, extended geometric face, dark-grey outline. The "S" is drawn as an open, inline style |
| 52.0 | 24 | **LCD window** (black bezel) | 43.1 × 21 (30.4-73.5 %, y 13.5-34.5 %) | Gloss **black** acrylic window covering the LCD and the MIDI RECEIVE LED |
| 48.0 | 25 | LCD active glass | 30.3 × 10 (32.9-63.2 %, y 20-30 %), ≈146 × 13 mm | **40 characters × 2 lines**, 5×8 dot cells (see §2.5) |
| 69.9 | 20 | "MIDI RECEIVE" | | White text on the black window, with a short vertical tick line down to the LED |
| 69.9 | 27 | **MIDI RECEIVE LED** | ≈0.8 % square | **Red** square LED, lit while MIDI is received (OM p.4; [Photo C] 7001126) |
| 31.6 … 54.9 | | **8 function (mode) keys**, pitch **3.33 %** (16 mm) | | Labels above (y ≈42-46 %), LEDs (y ≈47.5 %), keys (y ≈53 %) |
| 31.6 | | PLAY | key ≈2.2 × 6 % (10.5 × 8 mm cap with bezel) | |
| 35.0 | | REC | | |
| 38.3 | | EDIT / SAMPLE (2 lines) | | |
| 41.6 | | EDIT / PRGRM (2 lines). [Photo P] has "EDIT PRESET" | | |
| 44.9 | | MIDI | | |
| 48.2 | | UTILITY | | |
| 51.6 | | DISK | | |
| 54.9 | | MASTER / TUNE (2 lines) | | **No LED** above MASTER TUNE. SN panel PCB has 7 LEDs, D1-D7, and the MIDI LED is on the separate "LED PCB" |
| | 47.5 | Function LEDs | ≈1.2 × 1.2 % | **Red** rectangular "dash" LEDs, one above each of the first 7 keys. The selected mode's LED is lit. **All 8 flash on an error** (OM p.5) |
| | | Key caps (all keys) | | **Cream/ivory** (`#e4dccb`) square caps with a slightly domed top, in a dark-grey recessed collar. Function keys and keypad keys share the same cap |
| 43.3 | 78.5 | **Page reference table** | 25.4 × 28.5 (30.6-56.0 %, y 64.5-93 %) | Three blocks, each with a **dark-grey header bar** (`#555754`) carrying a white caps title, then 6 rows with **black ruled grid lines** on the panel colour, black text and a 2-digit page number column. Contents below |

Page table contents, production ([Photo A], [Photo C] 7001126):

| EDIT SAMPLE | | EDIT PROGRAM | | DISK | |
|---|---|---|---|---|---|
| SAMPLE NAME | 01 | PROGRAM NAME | 01 | LOAD FROM DISK | 01 |
| REPLAY MODE | 04 | SAMPLE NAME | 05 | SAVE TO DISK | 04 |
| START POINT | 06 | A.D.S.R. | 09 | ERASE FROM DISK | 07 |
| END POINT | 07 | VLCTY.SENS. | 10 | DISK FORMAT | 08 |
| LOOP LENGTH | 08 | PITCH WARP | 11 | *(blank)* | |
| SPLICE X-FADE | 10 | LFO | 12 | *(blank)* | |

"FROM", "TO" and "FROM" in the DISK column are set in smaller lower-weight caps. Block x-ranges are EDIT SAMPLE
30.6-39.0 %, EDIT PROGRAM 39.0-47.6 % and DISK 47.6-56.0 %. The page-number column in each block is ≈1.4 % wide. The
pre-production [Photo P] table reads EDIT PRESET / PRESET NAME, and some of its numbers differ.

### 2.4 Right section (keypad, CONTROL, audio)

| x % | y % | Element | Notes |
|---|---|---|---|
| 65.5 | 66 | **Keypad panel** (57.5-73.5 %, y 39-93 %) | A **dark charcoal-grey** (`#55575a`) rectangle printed on the face with **white** legends. OM calls it "the gray rectangle" |
| 62.0 | 44-46 | "PARAMETER / KEY" header | Over the 3 numeric columns |
| 70.2 | 44-47 | "ARROW / ∕CURSOR" header, with **◄** and **►** under it (y ≈49 %) | Over the 2 right-hand columns |
| | | **Key grid**, 5 columns × 4 rows. Column x: **59.0, 62.0, 64.8** · **68.5, 71.9**. Row y: **55, 65.5, 76, 86.5**. Each key's legend sits just above it (≈−5 % y). Caps ≈1.85 × 4.5 % (9 × 6 mm), cream |
| | | Row 1: `7` `8` `9` · `◄` `►` | Production has two separate arrow keys. [Photo P] shows one wide rocker cap spanning both columns. The v1 manual (OM p.4) describes an "elongated ARROW/CURSOR key", so early units had a rocker |
| | | Row 2: `4` `5` `6` · `▲` `▼` under a "▲ PAGE ▼" legend | PAGE up / PAGE down |
| | | Row 3: `1` `2` `3` · `SPACE` `LETTER` | |
| | | Row 4: `0` `ON/+` `OFF/−` · `ENT` `P.B` | P.B = play back (audition) |
| 84.7 | 9 | "CONTROL" label | |
| 84.7 | 27.5 | **CONTROL** encoder | **Ø 8.0 % (≈38.5 mm)**. A large smooth **medium-grey** (`#6f7072`) cylindrical knob with a flat, very slightly dished face and **no pointer**, sitting in a thin **black ring/shadow gap**. Endless detented rotary encoder (SN: "ROTARY ENCODER") |
| 79.1 | 52 / 64.5 | "REC LEVEL" / **REC LEVEL** knob | Ø ≈3.3 % (16 mm). **Knurled silver-aluminium skirt with a red cap** (`#b8403c`) and a line pointer. 11-dot scale, "MIN" at lower left, "MAX" at lower right (y ≈72 %) |
| 84.7 | 52 / 64.5 | "MONITOR" / **MONITOR** knob | Same knob with a **cream** cap. Sets the level of the input sent to the **mono MIX out** while sampling (OM950 p.18) |
| 90.5 | 52 / 64.5 | "OUTPUT" with a sub-legend "LEFT ‑⊙‑ RIGHT" (y ≈55 %) / **OUTPUT** knob | Same style, cream cap. SN volume PCB: VR1 A10k, VR2 B10k, VR3 **dual-gang** B10k+B10k. [Eng] OUTPUT is the dual-gang (stereo) master for the L/R (and mix) outs. "LEFT ⊙ RIGHT" is printed as a stereo symbol, not as two concentric knobs |
| 82.0 | 77 | "MIC —— INPUT —— LINE" legend | Spans the first two jacks |
| 90.5 | 77 | "REC/P.B TRIGGER" legend | |
| 79.1 / 84.7 / 90.3 | 85 | **MIC** · **LINE** · **REC/P.B TRIGGER** ¼" jacks | Black jack face with a chrome inner ring, Ø ≈2.3 % (11 mm). The trigger jack takes a footswitch (PS-X80): it starts sampling, or auditions the sample (HSR; OM p.22) |

### 2.5 The LCD

- Module: **Optrex DMC40218** (SN LCD PCB, "IND LCD DMC40218UE"). That is a **40 × 2 character, 5×8-dot** module with
  an HD44780-type controller [Eng: the DMC series uses the Hitachi HD44780 with the A00 Japanese ROM]. E&MM calls it an
  "80-character back-lit LCD".
- Backlight: **EL panel** driven by the "INVERTOR PCB" (SN, inverter block NEL-D32-43). The stock look ([Photo C]
  6731633, lit) is a **blue-green/aqua field** (`#3aa89c` to `#58c0b0` when new; old EL foils go dimmer and bluer,
  around `#2d7673`) with **dark slate characters** (`#1e3434`). Unlit it looks grey-olive. E&MM praises the "size and
  clarity" of the display. *Do not* use the deep blue/white of modern replacement displays.
- [Eng] The character cell is ≈3.2 × 5.6 mm at ≈3.65 mm pitch, about 146-154 mm across 40 characters. Use a 5×8 dot
  matrix with ~0.1 mm gaps, a faint "unlit dot" ghost, and the HD44780 A00 font. **Glyph 0x7E in that ROM is "→"**,
  and that is the S900's **Arrow gadget**. The OCR of the manual renders it as "~", which explains strings like "~06".
- Cursor: a **flashing block** on the value under edit (HD44780 blink), and an **underline** in LETTER (naming) mode
  (OM p.5).
- The level meter in REC uses custom CGRAM glyphs: a bar in the lower half of the cells, a peak-hold line under it, six
  overload dots at the right, and a movable **T** threshold marker (OM p.22; OM950 p.18).

### 2.6 Rear panel (brief, [Photo C] 6827095; SN)

The rear is **black** with white legends. Seen from behind, left to right on the upper row:

- **OUTPUT**: MIX, LEFT, RIGHT, CH-1 … CH-8 (11 × ¼" jacks)
- **VOICE OUT** (13-pin DIN)
- **MIDI** IN, OUT, THRU
- **VOLTAGE SELECTOR** (220/240 V; export models only)

Lower row: a blanking plate or the **ASK90** "AUDIO INPUT CH-1…CH-8" (8 × ¼"), the **RS-232C** DB-25 (female, wired as
DCE), the serial-number plate, and the IEC inlet. The SN lists 3 input jacks on the front input PCB (mic, line,
trigger). There is no separate rear footswitch jack, despite OM p.22's wording.

---

## 3. Specifications (priority 3)

### 3.1 Headline specs

| Item | Value | Source |
|---|---|---|
| Resolution | **12-bit linear** PCM, stored as 12-bit words. The SysEx sample format is offset binary | OM p.25; SX "SW" type |
| Sample rate | **Continuously variable, 7.5-40 kHz**. The user sets **audio bandwidth 3000-16000 Hz** (5-digit entry, 1 Hz steps) and **Fs = 2.5 × bandwidth** | OM p.21 Step 4; SX SMRATE note; E&MM |
| Default bandwidth | 10 kHz (Fs 25 kHz) | SOS86 |
| Max time | **11.878 s at 16 kHz bandwidth (40 kHz)**, **63.351 s at 3 kHz (7.5 kHz)**, from clear memory. 19.005 s at 10 kHz bandwidth. Minimum recording time 250 ms | OM p.21 Step 5; SOS86 |
| Sample memory | 750 KB marketing figure = **512 K words × 12 bit**. 28 × 41256 DRAMs = 896 KB total, of which [Eng] 24 chips are sample RAM (2 banks × 12 bits) and 4 are CPU RAM. **User-available ≈475,136 words** (11.878 s × 40 k = 475,120; 63.351 s × 7.5 k = 475,132; SysEx accepts up to 475,020 words per dump) | SN CPU PCB list; E&MM datafile "Sample memory 512K"; MT89; SX |
| Samples / programs | **32 samples**, **32 programs** in memory (the earliest reviews said 8 programs; E&MM's datafile and OM p.5 say 32) | OM; E&MM |
| Keygroups | Up to **32 per program**. S900 total keygroups = **64** (MT89, comparing with the S950's 198) | OM p.5; MT89 |
| Polyphony | **8 voices**, each with its own DAC, filter and VCA (SN voice PCB has 8 identical channels, IC1xx…IC8xx) | SN; OM |
| Range | 6 octaves of playback range. "Max transposition of three octaves either way" (IMRW). MIDI notes 24-127 (C0-G8; **Akai C3 = MIDI 60**) | OM p.25; IMRW; OM MIDI chart |
| Outputs | **8 individual voice outs** (one voice each), **LEFT = voices 1-4**, **RIGHT = voices 5-8**, **MIX = all 8**. Plus 13-pin VOICE OUT | SX OPVOICE note; MT89; SOS86 |
| Inputs | Front MIC and LINE (¼"), REC/P.B trigger (footswitch) | OM p.25; HSR |
| Disk | 3.5" 2DD, about 1 MB unformatted, 750 KB usable. A full disk takes about 40 s to load, and formatting also takes about 40 s | OM; SOS86 |
| Dynamic range | **68 dB unweighted** (Marion Systems' measurement of a stock S900, against 85 dB with MS9C) | SOS88 |
| Idle noise | Output is **dead silent when no voice is sounding**: the per-voice VCAs close, so "the Akai is its own noise gate" | SOS87 |
| Interfaces | MIDI In/Out/Thru (HD6850 ACIA), RS-232C (300-19,200 baud standard, non-standard rates up to 100 kbaud, CTS/RTS) | SN; SX |

### 3.2 Signal chain (from the SN parts lists and IC data) and what it implies

**Record path** (voice PCB, IC1-IC27): mic preamp (M5220 low-noise dual amp), then REC LEVEL, then a
**MF6CN-50 6th-order Butterworth switched-capacitor low-pass** (IC7, the anti-alias filter), then a DG211 analog
switch / sample-and-hold, then the converter. The converter is a **12-bit successive-approximation A/D built from an
AM2504 SAR register + BA9221 12-bit DAC + IR9311 comparator**. The rate clocks come from programmable timers
(3 × µPD71054 + 3 × µPD8253 = 18 counters, fed from the 16 MHz crystal).

- [Eng] The MF6-50's corner is its clock ÷ 50. With 18 counters, 2 go to recording (sample clock + filter clock) and 16
  go to the 8 voices (sample clock + filter clock each). So the **input filter corner = the chosen bandwidth = 0.4 ×
  Fs**. A 6-pole Butterworth at 0.4 Fs gives only about **−12 dB at Nyquist** and about −21 dB at 0.6 Fs (which
  aliases back onto 0.4 Fs). **Recording therefore aliases audibly on bright sources.** This is part of the S900's
  grainy, "crunchy" top end, and it gets worse the lower the bandwidth.

**Playback path**, per voice ×8:

- the sample word goes into a **74HC670 register-file FIFO** and is clocked by that voice's own **timer counter**
- **BA9221 12-bit DAC** (zero-order hold), then
- **MF6CN-50 6th-order Butterworth low-pass** with its *own* clock counter. This is the per-voice **"Filter"**. There is
  **no resonance** (SOS87)
- **BA6110 voltage-controlled amp** whose gain comes from a per-voice **BA9201 8-bit DAC** (the envelope/loudness),
  then op-amps (M5223/M5238), then the individual out and the L/R/MIX summing buses

- **Pitch shifting = variable sample clock per voice.** Each voice's DAC is clocked at Fs × pitch ratio. There is
  **no interpolation** and no fixed output rate. This is the classic Emulator II / Mirage / S900 approach. [Eng]
  Inferred from the per-voice timer + FIFO + DAC architecture. Consequences:
  - Transposing **up** produces no extra aliasing. The waveform is replayed faster and its spectrum simply scales up.
    Any aliasing baked in at recording time scales with it.
  - Transposing **down** lowers the DAC clock, so the **zero-order-hold images** (at k·Fs' ± f) fall into the audio
    band. They are removed only as far as the voice filter is set. That is why the default **key-filter tracking is 50
    = 1 octave per octave** (SX FKI default 50), and why E&MM describes the filter "with keyboard tracking to get rid of
    aliasing effects".
  - The **zero-order-hold sinc droop** is about −2.4 dB at 0.4 Fs. Together with the Butterworth corner, the top octave
    is a little soft. Marion Systems claimed the stock response "isn't all it could be" (SOS88).
  - "Not all samples are capable of being transposed over the full range" (OM p.15). There is an upper limit on the
    voice clock. [Eng] The limit is unknown. Model it as a maximum voice rate of about 160-320 kHz.
  - [Eng] Integer timer divisors quantise pitch. With an unknown timer clock (probably 2-8 MHz from the 16 MHz
    crystal), a 40 kHz voice gets a divisor of about 50-200, i.e. pitch steps of about 9-35 cents. Akai may have chosen
    a higher clock, and fine tune is stored in 1/16-semitone units (SX). Treat divisor quantisation as an **optional
    "authentic detune" switch**, off by default.
- **Envelope/VCA**: the SysEx doc says sustain is "0.375 dB/step, 0 = −96 dB" and loudness offsets are "units of
  0.375 dB". 256 × 0.375 dB = 96 dB, so the 8-bit VCA DAC is **dB-linear (exponential)**: 8 bits covering 96 dB in
  0.375 dB steps. The software updates it at a control rate. [Eng] A tick of about 1-5 ms gives very slightly
  "zippered" fast envelopes.
- **Filter control**: software reprograms each voice's filter-clock divisor, so the cutoff moves in **steps**. V2.0's
  filter ADSR is a software sweep of that divisor. [Eng] At a ≈1-5 ms tick, sweeps are slightly stepped.

### 3.3 Parameter ranges and units (SX V2.0 unless noted; defaults in brackets)

**Keygroup** (each keygroup has a "soft" (first) and a "loud" (second) sample):

| Parameter | Range / units [default] |
|---|---|
| Key range | Upper and lower MIDI key, 24-127 [24-127] |
| Velocity switch threshold (VST) | 0-128 [128 = soft sample only; 0 = loud only]. Velocity ≥ VST plays the loud sample |
| Velocity crossfade | on/off. V2.0: the velocity at which the mix is 50/50 (VTMX, 0-127 [64]) |
| Envelope (amp) | Attack 0-99 "logarithmic coding" [00], Decay 0-99 [80], Sustain 0-99 [99] (0.375 dB/step scale), Release 0-99 [30]. Review defaults are 0/80/99/30 (SOS86) |
| Velocity → filter (FVI) | 0-99 [10] |
| Key → filter tracking (FKI) | 0-99 [50 = 1 octave/octave] |
| Velocity → attack (AVI) | 0-99 [0]. More velocity = shorter attack |
| Velocity → release (RVI) | ±50 [0]. V2.0 adds the choice of note-off or note-on velocity (ONRV bit) |
| Velocity → loudness (LVI) | 0-99 [30]. 0 = no dynamics |
| Warp (pitch at attack) | Velocity amount 0-99 [0] (OM says 0-128), offset ±50 [0], recovery time 0-99 [99 = slowest] |
| LFO | Rate 0-99 [42], depth 0-99 [0], delay (build-up) 0-99 [64], desync on/off. Aftertouch depth 0-99 [0], mod-wheel depth 0-99 [50]. **Total LFO depth (depth + AT + MW) is limited to ±3 semitones** |
| Flags | Transpose disable ("constant pitch"), velocity crossfade, desync, **one-shot trigger** (ignore note-off; V1.2), velocity-release source, crossfade-curve mod |
| Output assign | 0-7 = mono voice 1-8, 8 = LEFT group (voices 1-4), 9 = RIGHT group (5-8), 255 = ALL [ALL]. On the OM page 16 front end: 00 All, 01-08 Mono, 09 Left, 10 Right |
| MIDI channel offset | 0-15 [0], added to the basic channel. Going past 16 gives "NONE" |
| Filter env (V2.0) | Amount ±50 [0], attack, decay, sustain, release 0-99 [20 each] |
| Per sample in the keygroup | Transpose (OM: ±50 semitones; SX: offset in **1/16 semitone**), **fine ±99 in 1/16 semitone** (±6.2 st, which is the manual's "just over a flatted fifth"), filter 0-99 [99 = highest cutoff], loudness ±50 × 0.375 dB [0] |

**Program**:

- Key-loudness tilt ±50 [0]
- Positional crossfade on/off
- Number of keygroups

**Sample**:

| Parameter | Range [default] |
|---|---|
| Name | 10 characters (A-Z, 0-9, space, #, +, −) |
| Length | 200 … 475,020 words |
| Rate | Hz (= bandwidth × 2.5) |
| Nominal pitch | 1/16 semitone, C3 = 960 [960] |
| Loudness | Signed |
| Replay mode | One-shot / Looping / Alternating ['L' in SX; OM says one-shot is the default for a new recording] |
| Points | End point (relative to the sample start), start point, loop length ≥5 [loop 45 in SX example; OM950 says 2000 for a new sample] |
| Type | Normal / velocity-crossfade pair |
| Direction | Normal / reversed |
| Point limits (OM p.18-19) | Start can go up to length − 100. End is at least start + 100. Loop length runs from 5 to (end − start) |

**Global**:

| Parameter | Range [default] |
|---|---|
| Basic channel | 1-16 or OMNI [OMNI] |
| Pitch wheel range | 0-12 semitones [7]. SOS86 saw a maximum of 7 on early software |
| Program change receive | On/off (V1.2) |
| CC7 loudness receive | On/off (V1.2) |
| Control source | MIDI or RS-232 |
| Master tune | ±16 (OM p.9). [Eng] Units are probably 1/16 semitone, i.e. ±1 semitone |

**MIDI implementation** (OM p.26 chart):

| Message | Response |
|---|---|
| Modes | 1-4 (Omni on/off, poly/mono). Mono mode means keygroups on separate channels |
| Notes | Note on/off 24-127, with velocity and release velocity |
| Channel aftertouch | → LFO depth |
| Pitch bend | Received |
| CC1 | Mod wheel |
| Program change | 1-32 |
| SysEx | Akai exclusive (program, sample parameters, catalogue) and the Prophet-2000 style **sample dump** (12-bit) |

---

## 4. Operating system (priority 2)

### 4.1 Navigation model (OM Ch.1, Ch.2 Pt.1)

- **8 function keys** select a *function*: PLAY, REC, EDIT SAMPLE, EDIT PRGRM, MIDI, UTILITY, DISK, MASTER TUNE. Its LED
  lights. Each function except MASTER TUNE has numbered **pages**. A key press always lands on page 01 (DISK lands on
  "load entire disk").
- **Page selection**, three ways:
  1. type a **two-digit** page number on the keypad ("0","7" for page 07)
  2. **PAGE ▲ / PAGE ▼**
  3. with the Arrow on the page number, turn **CONTROL**

  REC pages have no numbers and are only stepped with PAGE ▼/▲.
- **Arrow gadget** (→, char 0x7E): points at the selected parameter's name. When a page opens, it sits on the page
  number. Editable parameters are marked with "**\***", and the arrow takes the place of the `*` in front of the
  selected parameter [Eng: we infer the arrow replaces the asterisk from the OCR, where "*" and "→" occupy the same
  column]. **◄/►** (ARROW/CURSOR) moves the arrow between parameters. A **flashing block cursor** marks the value
  field.
- **Value entry**, three ways:
  1. CONTROL (endless encoder) scrolls
  2. digits with **leading zeros to the full field width** (e.g. 009, 09)
  3. **ON/+**, **OFF/−** for yes/no and sign

  Some actions need **ENT** to confirm (the screen says "(ENT)").
- **Naming**: put the arrow on a name field and press **LETTER**. The cursor becomes an underline. CONTROL dials A-Z,
  0-9, space and #. Digits can be typed, **SPACE** inserts a space, and ◄/► moves between characters. **ENT** commits.
- **P.B** sounds the current sample/note while it is held (or plays the MIDI page-02 test note).
- **Errors**: all 8 function LEDs flash and the LCD shows a friendly message starting "Oops…". Pressing a function key
  clears it (OM p.5; E&MM). E&MM's example is "Disk is write-protected. Take out of drive and close switch in bottom
  left-hand corner."
- **Power-on**: the unit auto-loads a disk if one is in the drive. Otherwise it creates the program **"TONE PRGRM"**
  with a sine sample **"TONE"** (E&MM; screens). The boot banner is "AKAI S900 VERSION 1.2" (gallery photo).

### 4.2 LCD page formats

The 40×2 screens below are reconstructed from the manual's screen pictures (**(OCR)**), the S950 manual's typed
screens and the SysEx defaults. Words, field order and line split are from the sources. **Exact column positions are
[Eng]**. `→` is the arrow, `*` an editable field marker and `_` a flashing cursor position. A column ruler:

```
0         1         2         3
0123456789012345678901234567890123456789
```

**PLAY** [Eng layout. Sources: OM p.8 and E&MM say programs scroll past with CONTROL, the number keys select, the
selected program is shown with a flashing cursor and shifted into view, and the screen says "scroll with knob" (HSR).]

```
1 TONE PRGRM  2 PIANO-A     3 PIANO-B
Select with keys or scroll with knob
```

**MASTER TUNE** [Eng layout]: "+" or "−" and two digits 00-16.

```
MASTER TUNE                    +00
```

**MIDI** (OM Ch.2 Pt.4; parameter names quoted from the manual. Layouts are [Eng].)

```
→01 *Basic MIDI channel 01
    *Omni on/off       ON
→02 *Channel 01 *Key 060 *Velocity 064
    Press P.B to play
→03 Channel 01 Key C3 060 Velocity 064
→04 *Pitch wheel range (+ semitones) 07
→05 *Control by MIDI (1) RS232 (2)   1
    *RS232 Baud rate 0960  actual 09600
```

V1.2 adds program-change enable and CC7-loudness pages. [Eng] Put them on 06/07.

**DISK** (OM Ch.2 Pt.5; layouts from the OCR'd screen pictures)

```
→01 Clear memory and load
    entire disk (ENT)
→02 LOAD PROGRAM (ENT) *PR-only  Mem 76%
    *name WELCOME     *PR & Samples
→03 LOAD SAMPLE (ENT)            Mem 76%
    *name WELCOME
→04 Clear disk and save          Mem 76%
    entire memory (ENT)         Disk 78%
→05 SAVE PROGRAM (ENT) *PR. only   Disk
    *name WELCOME     *PR. & SMPLS  78%
→06 SAVE SAMPLE (ENT)              Disk
    *name WELCOME                   78%
→07 ERASE FROM *Sample             Disk
    DISK (ENT) *Program             78%
→08 DISK FORMAT.                   Disk
    Prepare new disk (ENT)          78%
```

- During a load, the names of the samples and programs being loaded are shown (E&MM).
- Formatting overwrites the screen with dots, left to right (OM p.4).
- Inserting a new disk reloads the catalogue (press DISK).
- ASK90 adds **page 09**, LOAD/SAVE DRUM SETTING (MT87).

**EDIT PROGRAM**, 16 pages (17 in V2.0). Pages 04-16 show the keygroup "*KG n" at the start of line 2. Put the arrow
there and change KG with CONTROL or two digits (OM p.14).

```
→01 *Select, Copy           TONE PRGRM
PROGRAM *Rename, Delete (-) TONE PRGRM
→02 *Key-loudness                   +00
    *Positional crossfade           OFF
→03 KEYGROUP: *Select (0 to 01)      01
    *Copy (+), Delete (-)
→04 *Velocity Crossfade             OFF
*KG1 *Velocity switch threshold     128
→05 Soft *sample *Low Key *High Key
*KG1 TONE       C0  024   G8  127
→06 S *Loudness *Filter *Transpose *fine
*KG1    +00       99       +00      +00
→07 Loud *sample *Low Key *High Key
*KG1 TONE       C0  024   G8  127
→08 L *Loudness *Filter *Transpose *fine
*KG1    +00       99       +00      +00
→09 ENV *Attack *Decay *Sustain *Release
*KG1     00      80      99       30
→10 VLCTY *Loudness 30  *Attack     00
*KG1 SENS. *Filter  10  *Release   +00
→11 WARP *Velocity 000  *Time 99
*KG1 *Attack offset +00
→12 LFO *Depth *Rate *Delay *Desync
*KG1     00     42     64     OFF
→13 LFO DEPTH *Aftertouch *Mod. wheel
*KG1              00           50
→14 *Key-filter  *Constant pitch
*KG1     50            OFF
→15 *MIDI channel      This keygroup on
*KG1 offset (0-15) 00  MIDI ch.  ALL
→16 *OUTPUT All (0), Mono (1-8),
*KG1 VOICE(S) Left (9), Right (10)  00
```

- Page 03: "Select" with 00 = **all** keygroups (edit all at once). "+" then ENT copies to a new, highest-numbered KG,
  and "−" then ENT deletes it.
- Page 04: VST 128 means soft only and 000 means loud only. Pages 05/07 then show "No soft sample, vlcty thrsh = 0" or
  "No loud sample, vlcty thrsh = 128".
- The S/L at the start of pages 06/08 is the soft/loud tag.
- The page 10 values are the SysEx defaults; the manual's picture shows other example values.
- V2.0 adds: page 04 crossfade 50 % point; page 14 velocity-crossfade **time skew**; page 03 keygroup copy between
  programs; page 10 velocity-release source; and **page 17 "FILTER ENV"** (amount ±50, A/D/S/R) (MT87; SOS87).
  [Eng layout for page 17:]

```
→17 FILT *Attck *Decay *Sustn *Rlse
*KG1 ENV *Amt+00  20    20     20    20
```

(The parameter abbreviations on page 17 are our guess.)

**EDIT SAMPLE**, 12 pages (V2.0 adds 13 and later)

```
→01 *Select, Copy                TONE
SAMPLE *Rename, delete (-)       TONE
→02 *Select program              Monitor
→03 *Loudness  *Nom pitch  *Fine pitch
       +00        C3 060       +00
→04 *REPLAY MODE One shot (1)
    Looping (2), Alternating (3)       1
→05 *TIME DIRECTION
    Normal (1), Reverse (2)            1
→06 START POINT          *Coarse  *Fine
    (0 - 24,900)              00,  000
→07 END POINT            *Coarse  *Fine
    (000,100 - 025,000)       25,  000
→08 LOOP LENGTH  *Coarse  *Fine  *Auto
    (5 - 25,000)      02,  000   (ENT)
→09 *Resample at half bandwidth (ENT)
*Discard before start, after end (ENT)
→10 SPLICE *2nd sample name  SAMPLE 2
X-FADE     *New sample name  NEW SAMPLE
→11 *Splice crossfade time (points)
    (50 - 8,496)                   01000
→12 *SPLICE ORDER: 1st then 2nd (1),
2nd then 1st (2), Together (3)  Mem 76%
```

- "Coarse" is in thousands (3 digits) and "Fine" in single points (3 digits) (OM p.18-19).
- The lower-left range text shows the legal limits.
- Page 03: Nom pitch is in semitones and fine is ±1 semitone in cents (OM p.17). In the SysEx, nominal pitch is in
  1/16 semitone.
- Page 08 Auto: every ENT tries a **slightly shorter** loop length that minimises the jump (OM p.19). Reviewers
  describe it as zero-crossing/energy matching (SOS86; E&MM).
- V2.0 additions (MT87; layout per OM950 p.9):
  - page 06 gains an *Auto (start threshold 01-99, ENT)
  - **page 13 CROSSFADE LOOP** (name a new sample, X-fade length, Execute, Mem %)
  - page 15 makes a velocity-crossfade sample from any two samples

```
→13 CROSSFADE LOOP. *Name   NEW SAMPLE
*X-fade length 02000 *Execute   Mem 76%
```

**REC** (unnumbered steps. PAGE ▼ moves forward. OM Ch.2 Pt.8; prompt wording also from OM950 p.16-18.)

```
NAME OF SAMPLE TO BE RECORDED
TONE______
NAME OF PROGRAM FOR MONITORING
Monitor
SAMPLE TYPE: Normal (1), Velocity
xfade soft (2), Vel. xfade loud (3)    1
AUDIO BANDWIDTH (3000Hz to 16,000Hz)
                                10,000Hz
RECORDING TIME (250mS to 19,005mS)
                               05,000mS
PITCH OF SOUND BEING RECORDED:    C3 060
START SAMPLING WITH - Any key (1),
Footswitch (2), Audio level (3)        3
KNOB SETS TRIG LEVEL. ANY KEY WHEN READY
▄▄▄▄▄▄▄▄▄▄▄▄▄▄T▄▄▄▄           ......
Press ENT to replay
```

- Step 3 has 3 choices: soft/loud (= velocity crossfade pair halves) or normal.
- Step 4 is a 5-digit entry, and the maximum time follows from the bandwidth chosen.
- Step 6: play the note on the MIDI keyboard. Keypad entry is disabled there.
- Step 7 has no default in V1 (SOS86).
- Step 8, the meter: the lower line is a bar graph with peak hold and **6 overload dots at the right**, and **T** is the
  trigger threshold set with CONTROL. With choice 1 the line reads "Press any key to start recording". With choice 2 it
  reads "Hit footswitch to start recording".
- While sampling, **arrows fill the top line left to right** in proportion to elapsed time. When it finishes, the
  display returns to the trigger step.
- PAGE ▼ then shows "Press ENT to replay", which is confirmed by the stock-LCD photo [Photo C] 6731633.
- **V2.0 pre-trigger**: audio-level triggering keeps the **2000 points before** the threshold crossing (MT87).

**UTILITY**: empty in V1.x (E&MM, SOS86). With the ASK90 it shows "DRUM INPUTS ON/OFF" and the drum pages (MT87).

### 4.3 Behaviour details

- **Keygroup model**: one or two samples (soft and loud) plus a key range. Ranges may overlap freely. E&MM stacked six
  samples on one key.
  - **Velocity switch**: velocity < VST plays soft, ≥ VST plays loud.
  - **Velocity crossfade**: both samples play, with gains that swap with velocity. Each one uses a voice. [Eng] So a
    crossfaded note costs **2 voices**.
  - **Positional crossfade** (program-wide): where two keygroups overlap, the lower one fades out linearly and the upper
    fades in across the overlap.
- **Loop model**: the loop **end = the sample end point** and the loop start = end − loop length. There are no separate
  loop points (E&MM).
  - *One-shot* plays start→end and stops.
  - *Looping* plays start→end, then repeats [end−len, end) **for as long as the voice lives, including during the
    release**. "Not possible to have a sample stop looping and go through its natural release" (E&MM).
  - *Alternating* ping-pongs inside the loop.
  - *Reverse* (page 05) plays end→start. [Eng] Treat it as reversing the data (the SysEx flags the waveform as "R").
- **One-shot trigger** (keygroup flag, V1.2) ignores note-off so drum-machine notes play out. In V2.0 the release time
  is honoured in "special one-shot" (SOS87).
- **Destructive edits**: Resample at half bandwidth, Discard, Splice (1st→2nd, 2nd→1st, or Together = mix) with a
  crossfade of N points, and Crossfade loop (V2.0). Each makes a new sample or overwrites, and needs free memory ("Mem
  %" shown).
- **Monitoring** while sampling goes to the **mono MIX out only**, at the MONITOR knob level (OM950 p.18-19).
- **Programs carry the MIDI channel and output routing**, so a program change can re-route everything (E&MM). There is
  no per-voice polyphonic output assignment: each individual out carries exactly one voice (SOS87 wish-list).
- **MIDI test (MIDI page 02)** sends the note to MIDI OUT and also triggers it internally when **P.B** is pressed.
  **MIDI page 03** is a monitor.

---

## 5. Sonic character (why it sounds like an S900)

1. **12-bit linear with an analog VCA after the DAC**: quantisation noise is fixed relative to the sample's full scale,
   not to the output level. Quiet samples and envelope tails are relatively noisy and grainy, but with no voice playing
   there is total silence. Stock dynamic range is about 68 dB (SOS88), which is worse than ideal 12-bit (74 dB) because
   of analog noise and converter non-linearity.
2. **Recording aliasing**: the 6-pole Butterworth AAF sits at 0.4 Fs, so bright material folds back about 12-20 dB
   down. This is part of the "crunchy" drum and break sound.
3. **Variable-rate playback with no interpolation**: pitching up stays clean. Pitching **down** brings
   zero-order-hold images ("metallic sizzle") into the audio band, and they are only partly removed by the voice
   filter. Classic hip-hop drums pitched down on S900/S950s get their gritty top from this.
4. **Per-voice 36 dB/oct Butterworth with no resonance**: smooth and dark when closed, with a steep "brickwall" feel. It
   tracks the key at 1 oct/oct by default.
5. **Slightly soft top**: the bandwidth limit (16 kHz maximum), ZOH droop and the filter corner sit close together.
6. **dB-stepped VCA** (0.375 dB steps) and control-rate software envelopes and filter sweeps.
7. **Hard clipping** at the A/D if REC LEVEL is too hot. The meter's six overload dots warn of it.

---

## 6. Modelling recipe (AudioWorklet @ 48 kHz) [Eng unless cited]

### 6.1 Storage and recording

- Sample memory is one `Int16Array(475136)` holding values −2048…+2047. Allocate samples contiguously and enforce the
  memory total, 32 samples and 32 programs. Show "Mem nn%".
- Recording at bandwidth BW (3000-16000 Hz, 1 Hz steps), Fs = 2.5·BW:
  1. Input gain is REC LEVEL (dB-taper), with a clip at ±1.0 = A/D full scale.
  2. **6th-order Butterworth low-pass at fc = BW** (3 cascaded biquads with Q = 0.518, 0.707, 1.932), run at 4× host
     rate (192 kHz) for accuracy.
  3. **Sample-and-hold decimation to Fs**: read the 192 kHz stream at times n/Fs using linear (or cubic) interpolation
     and **no further band-limiting**, so the residual aliasing is authentic.
  4. Quantise: `q = clamp(round(x·2048), −2048, 2047)`, with **no dither** (SAR converter).
- Trigger modes: any key, footswitch, or audio level. For audio level, the threshold is a meter position on a 0-100 %
  linear peak scale. V2.0 pre-trigger keeps a 2000-sample pre-roll ring buffer.
- Meter: a peak with hold on about 34 cells plus 6 overload cells. Assume the overload region starts at about −1.5 dBFS.
- Resample at half bandwidth: [Eng, method undocumented] average adjacent pairs and decimate by 2, then halve Fs and BW.
- Splice: linear crossfade over N points; "Together" = (a+b)/2 [Eng]. Crossfade loop (V2.0): for the last L points
  before the loop end, blend linearly with the L points before the loop start (equal-gain linear), written into a new
  sample.
- Auto loop: from the current length, search downward for the next length ℓ where |s[end−ℓ] − s[end]| plus the slope
  mismatch is minimal and the slopes have the same sign. Each ENT moves on to the next candidate.

### 6.2 Voice playback (the core)

Each of the 8 voices runs its own **virtual DAC clock** `Fv = Fs_sample · 2^(Δ/12)`, where

`Δ = (note − nominal) [0 if constant pitch] + transpose + fine/16 + sampleFine/100 + masterTune/16 + bend·range + lfo + warp`

(clamp Fv ≤ 320 kHz; above that the note does not sound or holds at the maximum).

- Optional "authentic detune": `Fv = Fclk / round(Fclk/Fv)` with Fclk = 4 MHz (unverified).
- **Zero-order-hold DAC rendered band-limited**: keep a fractional phase in DAC ticks. Every time a DAC tick falls
  inside the current 48 kHz output sample, the held value changes by `Δv = s[k] − s[k−1]`. Add that step to an
  accumulator and insert a **band-limited step correction** (minBLEP or polyBLEP, 16-32-tap table) at the sub-sample
  position. The output is the held value plus BLEP residuals. This reproduces the staircase and its images exactly up
  to 24 kHz, at any ratio, and treats the voice as a true variable-clock DAC with **no interpolation**.
  - When Fv > 48 kHz, several DAC ticks fall into one output sample. Loop over them, since each is a step.
  - Cheaper fallback: 4× oversampled naive ZOH, then a half-band decimator.
- Read pointer and loops:
  - One-shot: start→end, then the voice ends.
  - Loop: on reaching end, jump to end−len and repeat forever (release included).
  - Alternating: reflect the direction at end and at loop start.
  - Reverse: iterate the data backwards.
  - The minimum loop is 5 points.
- **Voice filter** = 6th-order Butterworth low-pass (3 biquads, bilinear with prewarp), cutoff updated at the control
  tick (see 6.3). Clamp fc to [30 Hz, 0.45·48 kHz].
  - Cutoff law, hypothesis B (recommended; it makes the default patch an ideal reconstruction filter):
    `fc = BW_sample · 2^(Δpitch·FKI/50 / 12) · 2^((F−99)/12) · 2^(velFilt + envFilt)`
    - F is the keygroup filter value (99 = open, each unit = 1 semitone lower)
    - velFilt = FVI/99 · 3 oct · (vel/127 − 1)
    - envFilt = Amount/50 · 4 oct · env(t) (V2.0)
  - Hypothesis A: the cutoff is absolute (F=99 → 16 kHz, with tracking around C3). Switchable. Neither is documented.
- **VCA** in dB: `gain_dB = −0.375·(255 − code)`, where code is an 8-bit value from the envelope + loudness. Quantise to
  0.375 dB steps and update at the control tick with a one-pole 0.3 ms smoother (analog VCA slew).
  - Loudness terms are all in 0.375 dB units: sample loudness + keygroup loudness + key tilt (KTILT·(note−60)/12 ×
    0.375 dB [Eng]) + velocity (−LVI/99 · 30 dB · (1 − vel/127) [Eng]) + crossfade gains + CC7.
- **Envelope** (ADSR 0-99), at a control tick of 1 ms. Time laws [Eng, logarithmic coding per SX]:
  - attack time = 2 ms · 2^(v/9.5), so 0 → ~instant and 99 → ≈2.7 s
  - decay/release time to −60 dB = 10 ms · 2^(v/10), so 99 → ≈9.6 s
  - Attack rises linearly in amplitude (quantised to dB steps). Decay and release are linear in dB.
  - Sustain level = 99 → 0 dB, else −0.375·(99−S)·2.6 dB (≈ S=0 → −96 dB).
  - Velocity→attack shortens the attack by up to ×1/16 at vel 127 scaled by AVI. Release-velocity scales the release
    ±.
- **LFO**: triangle [Eng] at rate 0.05 Hz·2^(R/9.9) (99 → ~51 Hz; cap at 20 Hz). Depth = (depth + AT·aftertouch +
  MW·modwheel)/99 · 3 semitones, capped at ±3 st (SX). The delay builds depth up linearly over 0-5 s (value/20 s).
  **Desync off** = one shared phase for all voices. **Desync on** = phase reset per note.
- **Warp**: an initial pitch offset of ±50/16 semitones [Eng] (≈±3 st at 50), scaled by velocity
  (vel/127·PVI/99 if PVI > 0, else full), decaying exponentially to 0 with τ = 5 ms·2^(T/12).
- **Velocity crossfade**: soft gain = cos(π/2·x), loud gain = sin(π/2·x), with x = clamp((vel − (VTMX − 32))/64, 0, 1)
  [Eng]. Each half uses its own voice.

### 6.3 Voice allocation, outputs, MIDI

- Pool per keygroup output assignment: ALL = voices 1-8, Mono n = voice n only, LEFT = voices 1-4, RIGHT = voices 5-8.
- Allocation [Eng]: a free voice in the pool, else the quietest voice in release, else the oldest note. A voice that is
  stolen gets a 1 ms fade before restarting. The real VCA will click, so offer an "authentic click" toggle.
- Mono Mode / channel offsets: a keygroup responds on (basic channel + offset). OMNI accepts all channels.
- Outputs: render 8 voice buses, then Individual n = voice n, LEFT = Σ voices 1-4, RIGHT = Σ voices 5-8, MIX = Σ all.
  OUTPUT knob = master gain on L/R/MIX [Eng]. Add a tiny analog noise floor (−80 dBFS pink) **only while any VCA is
  open** (gated by the summed VCA gains), to land at about 68 dB dynamic range together with the 12-bit noise.
- During REC with "Monitor" selected, route the input × MONITOR to MIX only.
- Control rate: 1 ms (48 samples) for envelopes, LFO, filter recalculation and VCA steps. Audio rate for the DAC/BLEP
  and the filters.
- MIDI responses: note range 24-127, velocity and release velocity, pitch bend (0-12 st), CC1, channel aftertouch,
  CC7 (V1.2), program change 1-32 (with a disable option).

### 6.4 UI recipe

- 40×2 HD44780-style LCD canvas: 5×8 dots per cell, aqua EL background, dark characters, a block cursor blinking at
  ≈2 Hz, and 0x7E drawn as "→".
- Implement the page tables in §4.2 as data: each page has fields with their column, width, type, range and target
  parameter.
- Keys: 8 function, 0-9, ON/+, OFF/−, ENT, P.B, SPACE, LETTER, ◄, ►, PAGE ▲, PAGE ▼. CONTROL is an endless encoder,
  ±1 per detent with acceleration.
- Map the computer keyboard: digits → keypad, arrows → cursor/page, Enter → ENT, wheel → CONTROL.

---

## 7. Uncertainties and things we could not verify

- **Exact LCD column layouts**: we had only garbled OCR of the screen pictures. The wording and field order are good;
  the column positions are guesses. The PLAY and MASTER TUNE screens are not shown in the manual's OCR at all.
- **Envelope, LFO and warp time/rate laws, and the filter value → Hz mapping** are undocumented. The laws in §6 are
  engineering guesses that only keep the documented units (0.375 dB steps, 1/16 semitone, ±3 st LFO, 1 oct/oct at
  FKI = 50).
- **Whether the filter cutoff is relative to the sample bandwidth** (hypothesis B) or absolute (A).
- **Timer clock frequency**, and therefore any pitch quantisation, and the maximum voice rate / up-transposition
  limit.
- **The REC LEVEL / OUTPUT pot assignment** to the SN parts. We could not confirm whether OUTPUT also scales the MIX
  and individual outs.
- **Panel positions**: they come from one near-orthographic press photo (600 px wide, early panel variant) cross-checked
  against an oblique production photo. Expect ±1 % in x. Panel colour varies with photo white balance.
- **OS v2.0 page numbers** come from MT87/SOS87 prose, not from screens. **OS v4.0** contents are unknown.
- Not reachable from this environment: Wikipedia, vintagesynth, reverb.com, eBay, gearspace, manualslib, zine.r-massive
  (which has a newer manual scan), and archive.org data nodes (PDFs and page images).

---

## 8. Quick panel map (for the mockup)

```
x%:  0   5.3   9.8    18.3   23.7     31.6..54.9 (8 keys)   59..72 keypad    84.7   94.7 100
     |ear|  AKAI prof. MIDI/DIGITAL SAMPLER   S900(33.8)  [ LCD 30.4–73.5 | MIDI RX 69.9 ]  CONTROL
     |o  |  [POWER]          (CONTRAST)                                                     (big)  |o |
     |   |                                    PLAY REC ES EP MIDI UTIL DISK MT  [7 8 9 ◄ ►]  REC MON OUT
     |o  |  FLOPPY DISK DRIVE                 [ page table 30.6–56.0 ]          [4 5 6 ▲ ▼]  79  85  90.5
     |   |  [====== floppy 7.6–29.0 ======]                                    [1 2 3 SP LT]
     |   |                                                                     [0 + − ENT PB]  MIC LINE TRIG
```

---

## 9. Sources actually read

- S900 Operator's Manual (OCR text): <https://archive.org/details/synthmanual-akai-S900ownersmanual>. Read in full:
  Ch.1, Ch.2 Pts 1-8, specs and MIDI chart.
- S900/ASK90 Service Manual (OCR text): <https://archive.org/details/Akai_S900_service_notes>. Specs, controls,
  parts location, adjustments, parts lists and IC table.
- S900 SysEx format V2.0 (OCR text): <https://archive.org/details/Akai_S900_SysEx_format>.
- S950 Operator's Manual (OCR text): <https://archive.org/details/manualzilla-id-7440972>. Getting started, PLAY, REC,
  EDIT SAMPLE.
- Magazine reviews on muzines.co.uk (full text): E&MM Jul 86, SOS Jul 86, IM&RW Jul 86, HSR Sep 86, SOS Oct 87,
  MT Sep 87, SOS Dec 88, MT Jan 89 (URLs in the citation keys).
- Photos: audiofanzine S900 gallery <https://fr.audiofanzine.com/sampleur/akai/s900/medias/photos/>. Images 6827096,
  6851001, 7001126, 6409191, 6731633, 6923688, 6827095 (and the rest scanned for colour and modification checks).
- Other archive.org items noted but not read: `Akai_S900_video_manual`, `GOTEK_HxC_AKAI_S900_USB_Dump` (OS v4.0),
  `akai-s-950-display-install` (replacement-display guide).
