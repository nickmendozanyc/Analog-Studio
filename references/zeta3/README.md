# Studio reference: Adams-Smith ZETA-THREE synchronizer (Zeta III)

The user supplied a set of scanned Adams-Smith documents for the ZETA-THREE (the Operations Manual, the
appendices, the user and technical bulletins, the ZETA-REMOTE manuals, the MCI JH-16/24 interface drawings, and the
power-supply schematic). They are Adams-Smith's copyrighted material and this repository is public, so **the PDFs
and GIFs are NOT committed here**. This file paraphrases them (with a few short quotes) for building our own unit that
behaves like the ZETA-THREE: chase-locking the emulated MCI JH-24 to external timecode, and running two JH-24s
as a 48-track.

Citation keys used below:

- **mp N** = "Manual Page N" printed in the January 1990 ZETA-THREE Instruction Manual (chapters 2 to 5). For
  chapters 2 to 5 the PDF page is about N + 4 to N + 6. Chapter 13 pages are cited as **13-N**, and the appendices as **A-N … H-N**
  (each appendix numbers its own pages). The MIDI addendum (PDF pages 63 to 90) is cited as **MIDI-N**, using its own page numbers.
- **E-N** = Appendix E "Slave Transport Constants", the separate revision for software 3.70/3E70 (dated 5 March 1992).
  The manual itself carries the 3.60 revision of the same appendix (29 October 1990); the values match.
- **UBn** = ZETA-THREE User Bulletin n. **TB1** = Technical Bulletin 1. **QRC** = the Quick Reference Card for
  software 3.50 (manual PDF pages 3 and 4, identical to `Zeta3_Display_Menu_List.pdf`).
- **MCI-011** = Adams-Smith drawing B8610-0757 rev 3 / "MCI/SONY JH-16/24 interface drawing", cable no. 011
  (`zeta_jh16a/b/c.gif`).
- **2600-SY** = constants list for the sibling System 2600 E-SY synchronizer module (software 1.11). The
  ZETA-THREE's constants are a direct descendant of it, and it explains a few of them more fully. It is only used to clarify
  ZETA behaviour, and every use is marked.
- **RMT** = ZETA-REMOTE Autolocator/Controller Guide to Operation (8/1/88) and its R1.20/R1.30 revisions.

Sections marked **[Engineering note]** are our own analysis and recommendations, not manual content.

---

## 1. What it is

- **Maker:** Adams-Smith, 34 Tower Street, Hudson, MA 01749, USA (later bulletins add "The Stypher Corporation").
  The manual is dated January 1990. The MCI interface drawing is dated 7 October 1986 (rev. 14 February 1989).
- **Function:** a single 1U rack unit that combines an "audio / video / MIDI synchronizer / controller" (the subtitle on the
  front panel; the emulator model adds "/ emulator"). It holds:
  - one **SMPTE/EBU LTC generator** (with jam-sync and transfer copy, user bits, and resolve to video, mains or aux);
  - two **LTC readers**, MASTER and SLAVE;
  - a **master transport** section, which controls and monitors the master (or only monitors it, as a "time code only" master);
  - a **slave transport synchronizer**, which chases, parks and locks one slave by controlling its capstan through FM or DC, plus
    transport commands;
  - a **MIDI section**, which slaves a sequencer from an internal tempo map using MIDI clock plus Song Position Pointer, or
    Direct Time Lock, and which also generates **MIDI Time Code**;
  - an **events** section;
  - a serial **computer port** (Adams-Smith protocol, compatible with System 2600) and a serial **control port** (RS-422);
  - the optional **ZETA-REMOTE** autolocator.
- **One ZETA-THREE synchronizes exactly one slave to one master.** More transports need more ZETAs, chained
  (mp47; UB14 §7; RMT p27). A third "slave", the MIDI section, can chase as well.
- **Variants:** ZETA-THREE, ZETA-THREE "B" (named in UB19 and UB23), and ZETA-THREE^em (the emulator: it emulates a Sony or
  Ampex VTR over RS-422 so that a video editor can drive an audio deck; covered in Chapter 14 for 3E60).

### Software history (bulletin index, 5 March 1992)

| Version | Date | Highlights |
|---|---|---|
| 2.00 | 16 Dec 1987 | MIDI section (tempo map) (UB1, UB2; MIDI addendum dated 7 Dec 1987) |
| 3.00 | 31 Jul 1988 | Remote interface; serial Adams-Smith protocols; **MIDI Time Code generator**; ZETATIME; solo modes; reader PRESET (UB5) |
| 3.50 | 22 Aug 1989 | Slave varispeed play; learning from an audio click; tempo-map banks; MIDI-file sysex transfer; Direct Time Lock; Adams-Smith protocol over MIDI (UB8) |
| 3.60 / 3E60 | 29 Oct 1990 | Generator "off" mode; automatic slave record (follows the master's record); automatic resolve; SYS PARK chaining; AUX IN functions; failure sense; jog/shuttle; the first emulator release (UB14, UB17) |
| 3.70 / 3E70 | 5 Mar 1992 | Sony RS-422 serial transport control; drop-frame mismatch indicator; **improved reading of jittery code (bit-length clamp, constant 33 lsd)**; Neve Flying Faders; front-panel lockout (UB21, UB23) |
| 3.71 | 5 May 1992 | Neve FF 3.0; fix for the Soundcraft library (UB24) |

### Specifications

- **Timecode formats** (mp19-20, D-6): 30 fps SMPTE, 29.97 drop-frame, 29.97 non-drop, 25 fps EBU, 24 fps film. The rate
  is a system-wide setting (FRAMES menu). All codes in one system must have the same frame rate. Master and slave may
  differ in drop-frame mode, because offsets are computed internally (A-3, mp36-37). From 3.70 on, a drop-frame
  mismatch between incoming code and the system standard shows as a flashing `*` (plus `DF`) in the subframe digits, for example
  `S_TC 01 00 03 18*DF` (UB21).
- **LTC (longitudinal timecode) only**. There is no VITC reader. Each reader decodes from "approximately 1/20 to 100X play
  speed" (mp24; A-5 also gives 1/20 as the low end). Below that, or with tape lifters out, the unit keeps the address up to date by
  counting tach or control-track pulses with a direction signal (mp24, mp39). A trailing `T` on M_TC or S_TC marks
  tach-updated readings (mp31).
- **Reader inputs:** XLR, pins 2 and 3 differential, pin 1 signal ground, shell chassis (C-2, C-3). The front end
  uses CA3080 OTAs (U19 for master, U8 for slave) (TB1).
- **Recommended LTC record levels** (mp21, A-4): -5 to -10 VU on audio machines and 1" VTRs, -3 to -5 VU on 3/4" and
  1/2" VCRs. Below -10 recovery becomes unreliable; above -3 adjacent tracks get crosstalk. The generator output should
  be under 1 V p-p into consoles (A-4).
- **Generator:** balanced XLR output (C-3). When stopped it repeats the current frame. From 3.60 it can instead send all
  "ones", a steady 2400 Hz square wave (generator constant 05 lsd = 1) (mp19, UB14). User bits are 8 hex digits (mp42).
  Jam-sync or transfer copy (mp42-43). It can copy ZETATIME, which is reconstructed master time.
- **Reference / resolve** (mp40-41, D-6): internal crystal; VIDEO IN (composite video, composite sync, black burst,
  bars; two loop-through BNCs, unterminated, so terminate with 75 Ω (UB21)); MAINS (30 fps from 60 Hz, 25 fps from 50 Hz; the PSU has a
  LINE SYNC opto output); AUX IN (a square wave or pulse of about 1 to 8 V at frame rate, C-5).
- **Lock accuracy:** Address mode "provides lock accuracy to 1/1000 of a frame" (mp54). Appendix B says
  synchronism must be "on the order of microseconds" (B-4). Lock from park "usually takes no more than a very few
  seconds" (B-3).
- **Slew:** 1 frame/s (fast) or 0.1 frame/s (slow) (mp35).
- **MIDI** (MIDI addendum; UB5; UB8; Appendix F):
  - **MIDI OUT:** MIDI clock plus Song Position Pointer plus Start/Continue/Stop, driven from the internal tempo map; or
    Direct Time Lock (MOTU), selected by "MIDI CLK = DT LOCK"; plus **MIDI Time Code** (quarter-frame and full messages) that
    follows ZETATIME. It does **not** chase incoming MTC. MIDI IN is used for merging, tempo learning (from MIDI clock),
    sysex (tempo-map files, Adams-Smith protocol, device inquiry; the reply carries 'Z3'), and failure sense.
  - Tempo map: 400 to 500 tempo or meter changes; a tempo at any 1/16 note; meters from 1/2 to 15/16; tempos also as
    frames per beat (24, 25, 30, 24/25 or 24/25/30 frame basis); up to 3 non-volatile banks in 3.70.
  - Timebase (drum sync) output on AUX OUT tip at 12, 16, 20, 24, 32, 40, 48, 60, 80, 96, 120, 160 or 240 pulses per beat.
- **Power:** 90 to 260 VAC, 95 VA, 50 to 60 Hz, with no switching between ranges (mp4). Internal fuse 2 A / 250 V, 5 × 20 mm (mp5). The PSU is a
  UC3842 flyback supplying +5 V at 3 A and ±18 V at 0.5 A (through 78M18/79M18 regulators), plus a LINE SYNC opto output (PSU schematic).
- **Non-volatile memory:** offsets, transports, and setups are retained (mp26, mp34). Dallas DS1235Y/DS1230Y NVRAM at U74
  (UB23, UB24).

---

## 2. Panels (for drawing the unit)

### 2.1 Overall

- **1U, 19-inch rack**, with removable rack angles (they come off for tabletop use with stick-on feet). Two threaded inserts on each side take an optional slide kit (mp3-4).
  Early units have a cover that slides back and is held by 2 screws; later units have 6 screws (TB1).
- Front panel colour: light grey / silver, with dark blue and red legends. Centre top: "ADAMS • SMITH", the Adams-Smith
  logo (a box with a stylised tape path), and "ZETA - THREE" (with a superscript "em" on the emulator). Under the display:
  "AUDIO • VIDEO • MIDI   SYNCHRONIZER / CONTROLLER / EMULATOR" (from the photo of an em unit).
- **Key legend convention** (mp7-8): a key's **primary function is printed in BLUE** (the lower legend, directly over the key) and its
  **SHIFTed function in RED** (the upper legend). A group name such as ENABLE, GEN, SYSTEM, DISPLAY or CURSOR sits above
  the pair, bracketed. There are **two SHIFT keys**. The left SHIFT shifts only the keys on the left half; the right SHIFT shifts only the
  keys on the right half (mp8). SHIFT works as a latch (press once, and its red LED lights until the next key) or as a held modifier.
- Most keys are square caps about 18 mm across with one or two small LEDs set into the upper part of the cap. In the photo, cap
  colours are: ENABLE keys **blue**; SHIFT keys **red**; GEN and SYSTEM keys **grey**; DISPLAY SELECT/GROUP **blue**
  and wider (about 1.5×); INDEX **grey**; CURSOR **grey**; PREV/MENU **blue**; CLEAR/CAPTURE **grey** and wider.

### 2.2 Front panel, left to right (numbers are the manual's callouts, mp ii diagram)

| # | Element | Legend (RED shifted / BLUE primary) | LEDs | Function |
|---|---|---|---|---|
| 1 | Status LED | XREF | amber | Off: running on the internal crystal. **Blinking: resolve is selected but there is no or bad reference. Solid: locked to the external reference** (mp41, QRC, RMT p21) |
| 2 | Status LED | MTC | green | Good **Master** Time Code being read; flickers on bad or low code (mp23). (This means *Master* TC, **not** MIDI TC) |
| 3 | Status LED | STC | green | Good **Slave** Time Code (mp23) |
| 4 | Status LED | CHASE | amber/yellow | Slave chasing (cueing, winding or synchronizing); off once parked or locked (mp29, mp33). Blinks while slewing (mp36) |
| 5 | Status LED | LOCK | red | Slave locked (S_ERR reached zero) (mp33). Blinks while slewing |
| 6 | Key, group ENABLE | M-REC / MASTER | amber + red | MASTER: toggles the master in or out of the system (amber). SHIFT: M-REC arms master record (red: blinks when armed, solid in record, blinks again after punch-out) (mp27, mp56) |
| 7 | Key, group ENABLE | S-REC / SLAVE | amber + red | SLAVE enable (amber); SHIFT: S-REC arms slave record (red) |
| 8 | Key, group ENABLE | LEARN / MIDI | amber + red | MIDI enable (amber); SHIFT: LEARN, tempo learn (red, flashes until learning starts) (MIDI-20) |
| 9 | Key | SHIFT (left) | red | Shift for keys 6-8, 10, 11 |
| 10 | Key, group GEN | COPY / RUN | amber + red | RUN toggles the generator running (amber lit while running; the cursor disappears) (mp18). SHIFT: COPY, jam or transfer copy of the incoming code (mp42) |
| 11 | Key, group SYSTEM | GOTO / STOP/CONT | amber + red | STOP/CONT toggles stop and play of the left-most enabled device (amber: blinks after the command until play speed is reached, then solid) (mp28-29, mp44-45). SHIFT: GOTO cues and parks at Z_GO (red while cueing; press again to abort). GOTO followed by STOP/CONT = **Play Preset**, which plays on arrival (mp45-46) |
| 12 | Display | n/a | n/a | **One line of 20 characters, red LED alphanumeric** (segmented characters with decimal points; see the photo). Printed legends under the display windows, left to right: **IDENT · BPM · HOURS · MINUTES · SECONDS/BAR · FRAMES/BEAT** (the original panel drawing has IDENT, HOURS, MINUTES, SECONDS, FRAMES). The IDENT field holds the group letter and the selection name (`G_TC`, `S_OFS` …). A blinking character is the cursor (mp6) |
| 13 | Key, group DISPLAY | SELECT / GROUP | none | GROUP steps through G → M → S → D → Z → E and also exits menus. SHIFT: SELECT steps through the selections within the group (mp10-11; QRC) |
| 14 | Key, INDEX | ▽ / △ (hourglass symbol) | amber | △ increments the digit or choice under the cursor; SHIFT gives ▽, decrement. Below zero on the left-most digit it gives negative numbers (mp9). While slewing, held △ = ADVANCE and ▽ = RETARD (mp36) |
| 9′ | Key | SHIFT (right) | red | Shift for keys 13-17. Right SHIFT + an ENABLE key = solo mode (UB5) |
| 15 | Key, group CURSOR | ← / → | amber | Moves the cursor right; SHIFT moves it left (mp9). In a choice-type menu the cursor selects the whole word (mp15) |
| 16 | Key | PREV / MENU | amber | MENU opens the current group's menu. The LED **blinks when the item has a sub-menu (`->`)**; pressing MENU again enters it. SHIFT: PREV returns to the previous menu level (mp12-16) |
| 17 | Key | CLEAR / CAPTURE | amber | CAPTURE loads a live value (an offset, a GOTO point from the current TC, the preset into G_TC, a choice in a list). LED **solid** = the displayed list item is the captured (current) one; **blinking** = you have scrolled away and not captured (mp15-16). SHIFT: CLEAR sets a register to "dashes" (empty) or zero (mp10, mp14) |

Layout in the photo (proportions across the 19"): LED column at the far left (5 small LEDs stacked vertically) | ENABLE
block of 3 blue keys, bracketed "ENABLE" | gap | red SHIFT | gap | GEN + SYSTEM pair (2 grey keys) | **display**, about 30 % of the
width, centred under the logo | DISPLAY SELECT/GROUP (wide blue) + INDEX (grey) | red SHIFT | CURSOR (grey) + PREV/MENU
(blue) + CLEAR/CAPTURE (wide grey) | rack ear. Each rack ear has two oval slots, and there are round screw heads at the panel corners.

### 2.3 Display formats (QRC; mp11)

| Group | Selections (20-character display) |
|---|---|
| G Generator | `G_TC 01 00 00 00`, `G_UB 00 00 00 00` |
| M Master | `M_TC 00 00 00 00`, `M_UB 00 00 00 00` |
| S Slave | `S_TC 00 00 00 00`, `S_UB …`, `S_OFS 00 00 00 00.00` (offset with 1/100-frame subframes, signed), `S_ERR 00 00 00 00.00` (lock error), `S_SLEW 00.00` |
| D MIDI | `D_B120.00 0001/01.1` (BPM, bar/beat.16th; with the cursor on `B`, index to `F` frames-per-beat, `C` click, `T` meter), `D_TC` (song time), `D_OFS`, `D_ERR`, `D_SLEW`. A `*` marks a tempo override |
| Z System | `Z_GO -- -- -- --`, `Z_IN --.--`, `Z_OUT --.--`, `Z_END` (dashes = empty) |
| E Events | `E_01 … E_10` (from 3.50; originally E_01 and E_02) |

Menus show as `G01 PRESET 01000000`, `S02 LOCK MODE=ADR`, `M05 TRANSPORT ->`. Messages show as, for example, `---- MAP SAVED OK ---`,
`- CANCEL OVERRIDES -`, `--- UNLOCK OK ---`.

### 2.4 Rear panel, left to right (as seen from the rear; mp ii callouts; Appendix C)

| # | Connector | Type | Pinout / purpose |
|---|---|---|---|
| 18 | AUX IN | 1/4" jack | Tip = signal, sleeve = ground (C-5). Frame-rate square wave or pulse (about 1-8 V) for resolve; tempo learn from a timebase or (3.50) an audio click through a 12 kΩ pad. From 3.60, contact-closure functions: OFF / RECORD HOLD / REC'D TOGGLE / ALL ENABLE / STOP/CONT / **SYS PARK IN**. Tip is pulled up to 5 V through 10 kΩ; pulses must last at least 66 ms (UB14 §8) |
| 19 | AUX OUT | 1/4" TRS | Tip: Event 1 (a 5 V pulse) or TIMEBASE (MIDI drum sync) or SYS PRK. Ring: Event 2 or STP/CNT or FRAME or REC TLY or SYS PRK (C-5, UB14 §7). Sinks up to 200 mA; use a relay for lamps |
| 20, 21 | VIDEO IN (×2) | BNC loop-through | Video, composite sync or black burst reference; **unterminated**, so fit 75 Ω on the unused BNC (mp40, UB21) |
| 22 | MIDI IN | DIN-5 | |
| 23 | MIDI OUT | DIN-5 | |
| 24 | MIDI THRU/OUT | DIN-5 | THRU, or a second OUT (menu MIDI THRU = IN / OUT-2) |
| 25 | COMPUTER | DE-9F | RS-422: 1 frame GND, 2 RX A, 3 TX B, 4 TX common, 5 /AUXP, 6 RX common, 7 RX B, 8 TX A, 9 frame GND. RS-232: 2 RXD, 3 TXD, 4 DTR (always asserted), 5 SG, 6 DSR, 7 RTS, 8 CTS. Chosen by an internal ribbon cable (J17) and jumper JP3 (C-4, 13-8). RS-422 is fixed at 38.4 kbaud 8N1; RS-232 runs at 150-38400 baud (UB5) |
| 26 | CONTROL | DE-9F | RS-422 transport control (same pinout as RS-422 above). From 3.70 it speaks Sony 9-pin protocol to the master or the slave (C-3, UB21) |
| 27 | REMOTE | DE-9 | ZETA-REMOTE ("reserved for Adams-Smith use", C-3). Daisy-chained to more ZETAs through an "ADD ONE Y" cable |
| 28 | GEN CODE OUT | XLR-3 male | Balanced output: pins 2/3, pin 1 signal ground, shell chassis (C-3) |
| 29 | MASTER CODE IN | XLR-3 female | Pins 2/3 differential, pin 1 signal ground (C-3) |
| 30 | MASTER TRANSPORT | DB-25F | See the table below |
| 31 | SLAVE CODE IN | XLR-3 female | As 29 |
| 32 | SLAVE TRANSPORT | DB-25F | See the table below |
| 33 | POWER | rocker switch | |
| 34 | Mains | IEC inlet | 90-260 V, 50/60 Hz, 95 VA |

The rear panel also carries a printed label: "ADAMS • SMITH, HUDSON MASS. MADE IN U.S.A.", and "MODEL: ZETA-THREE SER. NO." near the MIDI jacks.

**SLAVE TRANSPORT DB-25 (C-1)**

| Pin | Signal | Pin | Signal |
|---|---|---|---|
| 1 | CAPSTAN common (relay) | 14 | GND sense |
| 2 | CAPSTAN normally closed | 15 | **DC** (capstan speed-control voltage) |
| 3 | STOP | 16 | **FM** (capstan reference-frequency output) |
| 4 | FF | 17 | +5 V DC |
| 5 | REW | 18 | CAPSTAN normally open |
| 6 | PLAY | 19 | Command common (for pins 3, 4, 5, 6, 10) |
| 7 | GP1 / PAUSE / LIFTER DEFEAT | 20 | GP1 common |
| 8 | GP2 / LOCK / MUTE | 21 | GP2 common |
| 9 | GP3 / REHEARSE | 22 | GP3 common |
| 10 | REC | 23 | SPARE tally (input) |
| 11 | REC tally (input) | 24 | n/c |
| 12 | DIRECTION (input) | 25 | GND |
| 13 | CTL/TACH (input) | | |

The command outputs are isolated contact or transistor pairs (each has its own "common"), so they can switch either polarity of
remote logic. The capstan **relay** (a changeover on pins 1, 2 and 18) switches the machine's speed reference between its own
source (normally closed) and the ZETA (normally open) (E-2 constant 04 msd; MCI-011).

**MASTER TRANSPORT DB-25 (C-2):** the same as the slave except: pins 1 and 2 tied; pin 8 = GP2/MUTE; pins 15, 16 and 18 unused
(there is no capstan output). With "OUTPUT = AUX3-10" (M03), pins 3-10 become eight extra event outputs (Appendix H).

### 2.5 ZETA-REMOTE (summary; RMT)

- A desktop autolocator/controller on a cable to REMOTE [27]; extension cables allow up to 120 ft.
- **The top half mirrors the ZETA front panel**: the left-half keys in row 1, the right-half keys in row 2. The single DISPLAY key is
  replaced by **five green group keys** (GEN, MASTER, SLAVE, MIDI, ZETA; shifted they give direct "speed" displays such as S-OFS), and a
  **LEVEL** key is added.
- **Two displays**: the lower one duplicates the ZETA display (menus are shown only here); the upper one is independent and
  selected by holding RECORD plus a green key.
- Transport keys (REW, FF, STOP, PLAY, RECORD, plus REHEARSE, GOTO, PAUSE, VARI; R1.20 adds varispeed), a **numeric
  keypad**, **MEMORY / STORE / RECALL / LOCATE**, six programmable **function keys** (macros), **UNDO**, a timecode
  calculator, and a piezo beeper for metronome and count-in.
- **100 autolocator memories** (timecode or bar/beat, optionally with subframes) and **100 edit memories** (each holds
  Z_IN, Z_OUT, Z_GO, Z_END, S_OFS, D_OFS and the song number).
- Commands go to the system master, which is the **left-most enabled** device, unless a device is **soloed** (SHIFT + ENABLE; its LED blinks).
- LEVEL selects which ZETA (system address 0-3) the remote is talking to. Level 0 is the system master.

---

## 3. Operating model, modes and menus

### 3.1 Enables, the system master, and solo mode (mp27-28, 13-7, UB5)

- The three ENABLE toggles (MASTER, SLAVE, MIDI) define the system. The **left-most enabled device is the "System
  Master"**, and STOP/CONT, GOTO and record commands go to it. Enabled devices to its right chase it.
  - M only: transport control of the master.
  - M + S: the slave chases the master.
  - M + D: MIDI chases master TC.
  - S + D: MIDI chases slave TC (the slave acts as master).
  - D only: the tempo map free-runs.
- Readers always read and display, enabled or not. A device that is not enabled is never controlled (mp28).
- If both machines are winding and one is disabled, both stop. If both are playing, both continue (mp28).
- Z_GO automatically shifts by the offset when the left-most enable changes (mp29, mp45-46).
- **Solo:** right SHIFT + an ENABLE key solos that device (its LED flashes). Transport commands then reach only that device, and it leaves
  chase when commanded; pressing ENABLE returns it to chase. Disabling from solo sends **no** automatic stop (UB5 §3.6).
- `LOCAL CHASE = OFF` makes the enables control-only, with no chase (for computer control) (UB5).

### 3.2 Generator (mp18-19, mp39-44, D-1, Appendix G)

- G_TC is the start address. CAPTURE loads G01 PRESET (default 01:00:00:00); CLEAR sets 00:00:00:00. Do not
  start at 00:00:00:00, because cueing across midnight causes problems (mp21).
- **COPY** (SHIFT GEN RUN) regenerates the code coming from the left-most enabled reader:
  - **JAM**: keeps counting if the source stops or drops out.
  - **XFER**: stops with the source and follows it again when it resumes.
  - TC COPY = TC / UB / **ZETATIME**; UB COPY = UB / TC / OFF.
  - Re-jam happens after a number of consecutive bad frames (generator constant 12). From 3.70 it jams across drop-frame/non-drop mismatches,
    and constant 01 counts re-jams (UB21).
- **ZETATIME** (UB5 §3.5) is the master time reconstructed from whichever transport is the system master:
  - With the master enabled, it is master TC.
  - With only the slave enabled, it is slave TC minus the slave offset, including subframes. (The Z menu "ZETATIME = MASTER / SLAVE" picks which
    frame of reference.)
  - In XFER mode it is also tach-updated while winding, so a downstream ZETA always sees the "virtual master" position (RMT p27).
  - The MIDI TC generator also uses it.

### 3.3 Offsets, capture, trim, slew (mp33-37)

- Offset = **slave − master**, signed, 10 digits (hh mm ss ff .ff). It is entered digit by digit, or CAPTUREd on S_OFS
  (both machines should be playing for accuracy; code must have been read from both since power-up). It is kept in NV memory.
- Trimming (editing digits) temporarily loses lock, and the slave re-syncs.
- **Slew** (S_SLEW): with the cursor on tenths, slewing runs at 1 frame/s; on hundredths, at 0.1 frame/s. Hold △ to ADVANCE (the slave runs faster) and ▽ to RETARD.
  CHASE and LOCK blink during the slew. CAPTURE adds the slew to S_OFS; CLEAR slews back to the original offset at the same rate.
- Drop-frame offsets: never compute them by hand. CAPTURE them instead, and the ZETA stores them in non-drop-frame form (mp36-37).
- Readers can be PRESET (M01/S01) so an offset can be captured from two known addresses without rolling tape (UB5).

### 3.4 Lock modes and recovery (mp53-56, D-3/4)

- **ADR (Address, default):** uses addresses plus frame edges. Slave frame edges come from slave LTC. Master frame edges come from
  master LTC, **or from the video reference when resolved**. Accuracy is 1/1000 frame.
- **FWL (Freewheel):** uses frame edges only and ignores addresses. It locks the nearest slave frame edge to the next master frame
  edge. The offset is meaningful only within one frame, and subframe offset and slew still apply. Use it for discontinuous code.
- **AUTO:** ADR until locked, then FWL after the delay in constant 38 lsd (seconds; F = immediately). It returns to ADR whenever
  synchronous running stops (stop or wind).
- **Lock Hold:** if slave code drops out (unreadable but not discontinuous), the ZETA keeps slave speed steady and plays through (mp55).
- **SLOW RELOCK = ON:** subframe errors (from splices or edits not aligned to frame edges) are corrected inaudibly instead of with a normal
  resync. The sibling 2600-SY uses about 0.1 frame/s for errors of N frames or less.
- **SPLICE TRAP = ON:** on a code discontinuity, it immediately recaptures the offset from the next valid address and keeps lock (the old
  offset is lost) (mp56). Constant 33 msd = 4x adds a "subframe splice trap", which allows lock with a constant subframe error.

### 3.5 Transport functions (mp44-47, D-5)

- STOP/CONT; GOTO (cue and park at Z_GO minus the PREROLL setting); Play Preset.
- **LOOP** = OFF / CYCLE / AUTO REWIND / AUTO STOP between Z_GO and Z_END. CYCLE waits for chasing slaves to park before rolling.
- LIMIT (end-of-tape address per transport): from 3.50 it stops the transport when passing the limit going forward.
- Slave varispeed play (3.50, from the remote or serial only).

### 3.6 Record / rehearse (mp56-57, D-4/5, E-14/15, UB14)

- `IN/OUT = RECORD / REHEARSE`. Arm with M-REC and/or S-REC. Punch-in happens when the **left-most enabled** TC reaches Z_IN, and punch-out at Z_OUT.
  The red LED blinks when armed, is solid in record, and blinks again after punch-out. With a record tally, the LED follows the tally; otherwise it follows the command.
- `AUTO EDIT = OFF / ON / ON+CUE` (pre-roll, punch, post-roll).
- Record and rehearse in/out "advance" constants 87-90 (units of 1/4 frame) compensate for machine latency.
- **AUTO REC'D = SLAVE** (3.60): the slave's record follows the master's record tally, so punches made on the master deck are mirrored on the slave. This is what you
  want for 48-track. It needs the master's record tally (constant 85 lsd odd).

### 3.7 Events (mp57-58, Appendix H, UB14)

- E_01 … E_10 trigger points (captured or entered). Each is armed as DISARMED / AUX OUT / NOTE ON/OFF / NOTE ON / NOTE OFF /
  PROG CHNG / REMOTE FN. MIDI channel, note and velocity are set under "MIDI TRIGGERS".
- Pulse length: constant 35 lsd × 8.33 ms (default 6 = 50 ms; the manual's "50 micro-seconds" is a typo).
- Per-event advances are in units of 1/4 frame (×100 range available). Events can be paired (on/off) and set to auto-disarm. Events can be mapped to AUX OUT tip/ring or to master connector pins 3-10.

### 3.8 MIDI section (MIDI addendum, UB5, UB8, Appendix F)

- The tempo map song starts at START TIME (expressed as a master TC). D_OFS = song time − master TC. The bar/beat display goes negative before the
  start: the sequencer waits at bar 1 and gets Continue when bar 1 is reached. A `+` marks positions past the end.
- MIDI lock is intentionally smooth: the tempo sent is bent to reach the target position (D_ERR shows the error). The MIDI section has its own LOCK
  MODE, SLOW RELOCK, SPLICE TRAP and lock-window constants. Its relevant constants are 01, 05, 06, 34 = 20 frames, 38, 45 and 46. There are constants for the gap between SPP and Continue and for SPP spacing,
  and 51 msd = 1x issues a single SPP just before Continue.
- **MIDI TC output modes** (constant 15): quarter-frame messages continuously, or only when moving (the 3.50 default), or quarter frames in
  play with full messages otherwise. Optional user-bits full message. Constant 13 = number of identical frames treated as "stopped" (8), and constant 12 = number of jam errors before a re-jam.
- Tempo learning: tap (averaged or exact), MIDI clock in, AUX IN timebase, AUX IN audio click. Quantize setting (default 8).
- The map is saved to tape via the generator user bits (MIDI-file format) or as a sysex MIDI file.

### 3.9 Menu list (QRC software 3.50, with 3.60/3.70 changes)

The QRC is the baseline. Changes from UB14 and UB21 are shown in brackets.

- **G** Generator: G01 PRESET · G02 COPY MODE = XFER/JAM · G03 TC COPY = TC/UB/ZETATIME · G04 UB COPY = UB/TC/OFF · G05 CONSTANTS ->
- **M** Master: M01 PRESET · M02 MASTER = READER/GENERATOR · M03 OUTPUT = TRANSPORT/OFF/AUX3-10 · M04 LIMIT · M05 TRANSPORT ->
  (list) · M06 SAVE TRANSPORT -> (user areas; 6 labelled areas from 3.60) · M07 CONSTANTS ->
- **S** Slave: S01 PRESET · S02 LOCK MODE = ADR/FWL/AUTO · S03 SLOW RELOCK · S04 SPLICE TRAP · S05 LIMIT · S06 TRANSPORT ->
  · S07 SAVE TRANSPORT -> · S08 CONSTANTS -> (S09 EDITOR/VTR on em units)
- **D** MIDI: D01 EDIT -> · D02 SONG SETUP -> (start time, end action, song number, map bank, start time = master/slave) · D03 LEARN MODE
  -> · D04 LEARN QNTIZE · D05 FPB FRM · D06 MERGE = OFF/REAL-TIME/NO REAL-TIME/ALL · D07 MIDI CLK = ON/ON+SSEL/DT LOCK/OFF ·
  D08 MIDI THRU = IN/OUT-2 · D09 MIDI TC = OFF/ZETATIME · [3.60: D10 MIDI TC display; the rest shift by one] D10 LOCK MODE · D11 SLOW
  RELOCK · D12 SPLICE TRAP · D13 TIMEBASE -> · D14 MAP LOAD/SAVE -> · D15 BEEP · D16 MIDI CONSTS
- **Z** System: Z01 IN/OUT = RECORD/REHEARSE · Z02 AUTO EDIT = OFF/ON/ON+CUE · Z03 PREROLL = ss ff · Z04 LOOP · Z05 FRAMES =
  30.00/24/25/29.97/29.97 DF · Z06 RESOLVE = OFF/VIDEO/AUX IN (older manuals: a separate SYSTEM = UNRESOLVED/RESOLVED plus RESOLVE = VIDEO/MAINS/AUX
  IN) · Z07 ZETATIME = MASTER/SLAVE · Z08 COMPUTER PORT -> (OFF / ADAMS-SMITH 232 / 422 / MIDI / NEVE FF) · Z09 RS-232 BAUD · Z10
  RS-232 FORMAT · Z11 CONTROL PORT (= OFF/MASTER/SLAVE in 3.70) · Z12 SYS ADDR = 0/8282 · Z13 XOUT TIP · Z14 XOUT RING · Z15 (3.50: LOCAL
  CHASE; 3.60: XIN = …) · Z16 LOCAL CHASE · Z17 AUTO REC'D · Z18 RMT REC'D = SYSTEM/SLAVE · Z19 RMT Z-ECHO · Z20 ZETA TC LINK =
  OFF/ON · Z21 SENSE (failure sense) · Z22 SENSE OUTPUT · Z23 CLEAR REGISTERS · Z24 SYSTEM RESET ->
- **E** Events: E01-E10 EV_xx arming · E11 EV_ALL DISARM · E12 MIDI TRIGGERS -> · E13 EVENT CONSTANTS ->

Menu numbers moved between versions (for example, LOCK MODE is S01 in the 1990 manual text and S02 from 3.00). For our unit,
use the 3.60/3.70 layout.

---

## 4. How the lock works

The manual does not print the firmware. The steps below are assembled from Appendix B, chapters 4-5, the slave constants (Appendix E)
and the serial status bits (13-41). Where the sibling 2600-SY explains a shared constant more fully, that is noted.

### 4.1 Inputs the synchronizer uses

1. **Master position and phase**: decoded master LTC (address plus the arrival time of the sync word, which is the frame edge). When the
   system is **resolved**, the master *frame edge* comes from the video, mains or aux reference instead of the LTC sync word (mp54).
   With master code missing at wind speeds, the master position is tach- or CTL-updated from MASTER TRANSPORT pins 12/13. When M02 = GENERATOR, the master is the internal generator.
2. **Slave position and phase**: decoded slave LTC; tach/CTL plus DIRECTION from SLAVE TRANSPORT pins 12/13 when code is missing.
3. **Transport state**: tallies (record on pin 11; spare on pin 23 = play, pause, standby and so on, per constant 85 msd; direction). Otherwise the state is inferred from
   commands, tach motion, and (for "code only" machines) the presence of code. Constant 83 msd sets how long code must be absent before the
   ZETA decides a code-only master has stopped (default 4 × 0.133 s) (UB5, E-14).
4. **Reader details**: the reader measures the LTC bit length to follow speed. Constant 33 lsd (from 3.70) clamps how fast the bit-length
   estimate may change, from 0 = instant to 7 = heavily clamped, which improves reading of jittery code (E-10, UB21). "Plus one" tests (each new address must be
   the previous address + 1, constant 94 msd 1x defeats them) and a run of bad frames are used to reject bad code.
   Constant 01 lsd (default 6) is the number of consecutive frames outside the wide window needed before the ZETA resyncs, so short bursts of bad code are ignored (E-1).
5. **Tach**: the rate is set in constants 91-93 (integer plus a /256 fraction; 2600-SY: pulses per second at play speed, 00 = frame rate).
   The direction sense can be learned once (constant 94 msd 2x) or inverted (8x). Field- or frame-rate CTL overrides are in constant 94 lsd.

Error definition: `error = (slaveTC − masterTC) − offset`, shown on S_ERR in frames with 1/100 frame resolution and
held internally to at least 1/1000 frame (the narrow window unit). When stopped, S_ERR is simply the positional distance
to the park point (mp33).

### 4.2 State machine (B-3, mp29-33, 13-41 status bits)

The serial status word exposes these internal states: `chase mode`, `resolve mode`, `cueing`, `parked`, `rolling back`,
`slewing`, `locked`, `tight locked (narrow window)`, `lock hold`, `over end point` (13-41). Our implementation should
mirror them:

```
DISABLED
  └─ (Master+Slave enabled) → CHASE
CHASE  (CHASE LED on)
  master STOPPED  → CUE/PARK: wind the slave so that slavePos = masterPos + offset + parkAhead
  master FF/REW   → follow with FF/REW commands, using tach- or code-updated positions
  master PLAY     → if |err| ≤ lockExit (const 34, default 0x29 = 41 frames): SMART-START + CAPSTAN SYNC
                    else: cue toward the moving master, aiming ahead by park-ahead (const 37 msd, 2 s),
                          stop, then play-for-timecode and smart-start
PARKED   (CHASE LED off; status "parked")
SYNCHRONIZING  (capstan relay ON: ZETA drives the capstan)
  └─ |err| inside wide window (const 06 msd × 0.05 frame; default 0.05)  → LOCKED (LOCK LED)
       └─ inside narrow window (const 06 lsd × 0.001 frame; default 0.003) → "tight lock"
LOCKED
  ├─ |err| > wide window for N consecutive frames (const 01 lsd, 6)       → re-synchronize (audible slew,
  │                                                                          or SLOW RELOCK if enabled)
  ├─ |err| > lock-exit (41 frames)                                          → back to CHASE (FF/REW cueing)
  ├─ slave code drop-out (address continuity preserved)                     → LOCK HOLD (hold speed)
  ├─ code discontinuity + SPLICE TRAP                                      → recapture offset, stay locked
  └─ master stops / winds                                                   → CHASE (park / follow)
```

### 4.3 Cueing, winding, and parking (E-3 to E-5, E-10 to E-12)

- Winding uses transport FF and REW commands as pulses: duration from constant 35 lsd × 8.3 ms (default 50 ms), repeated up to
  constant 35 msd times (6) if the transport does not respond; after that, a STOP is sent.
- **Stopping point, "KV-squared" cueing** (constant 10, default 03): while closing on the target at speed v, the ZETA issues the
  *opposite-direction* wind command (which on an ATR brakes the reels) when the remaining distance falls to about K·v². A larger K starts
  braking earlier and gives less overshoot; the typical K is 1 to 5, and xD-xF mean -3 to -1. A finer "hi-res K" scale exists (0x81 to 0x9F).
  The target is approached by alternating FF and REW ("FF/RW cueing"; the 2600-SY also has servo, constant-speed and modulated cueing).
- **Oscillation limit** (constant 08 lsd, default 2): the number of forward crossings of the cue point allowed before giving up and
  stopping. Values x8 and up mean "never repeat FF or REW twice in a row".
- **Play-to-cue** (constant 07 msd, 0-7 s): for transports with unreliable tach, cue to *n* seconds before the point, stop, then play into
  the point and stop. Retries are set in constant 07 lsd, and the stopping allowance in constant 36 msd.
- **Park window** (constant 41, default 0x59 = 89 frames): if the slave does not park within this window after chasing, it re-cues
  until the oscillation limit is reached.
- **Smart-start / park-to-play compensation** (constants 37 lsd, 42, 43):
  - Constant 42 (default 5 frames) is the transport's start-up delay, from the PLAY command until play speed is reached. When the slave is
    parked and the master starts, the slave is parked *ahead* by enough to absorb that delay (constant 43, default 1 × 5 frames, the minimum park-ahead
    for a stopped master).
  - **Both values are learned**: "after going through several cue-park-lock cycles, the Zeta may optimize" them, and shows the learned
    value (E-12). (Constant 43 4x resets them at power-up; 8x inverts the sign of 42.)
  - Smart-start may be adjusted using the master's tach before true code appears (37 lsd bits).
  - If smart-start is defeated, the slave simply starts with the master and pulls in with the capstan, provided the error is under the lock-exit value (2600-SY).
- **Motion sense** (constant 09 lsd): wait for stop between commands; wait for stop before PLAY; ignore code above 2× (for heads
  that output garbage at speed).
- Lifter defeat (constant 94 lsd; mapped to GP1) keeps the tape on the heads so wide-band code can be read while winding. The ZETA
  mutes audio (GP2 = MUTE, constant 64) during wind and initial lock (constant 84 lsd), with a delay from lifter release to un-mute set by constant 84 msd.

### 4.4 Capstan servo (synchronizing and locked)

- **Output paths** (choose one per transport, set in the constants):
  - **FM**: a reference *frequency* fed to the slave's capstan PLL in place of its crystal. The centre frequency is
    `F = 80 000 000 / MainDivisor / FinalDivisor`. The main divisor comes from constants 03 + 04 lsd (typically 0x823 = 2083). The final divisor
    comes from constant 01 msd: 1x = 512 (75 Hz), 2x = 32 (1.2 kHz), 3x/4x = 16 (2.4 kHz), 5x = 8 (4.8 kHz), 6x = 4 (9.6 kHz),
    **7x = 2 (19.2 kHz)**, or 0x = a custom divisor from constants 45/46 (E-1, E-2). So 80 MHz / 2083 / 2 = 19 203 Hz.
  - **DC**: a control voltage with a 12-bit offset (constants 96/97, 000-FFF) and span (98/99). Polarity can be inverted (95 msd 8x), and it can be bipolar
    for jog.
  - **Capstan relay** (pins 1, 2 and 18): constant 04 msd 0x = relay ON (the ZETA drives the capstan) only while the slave is enabled (normal);
    1x = always; 2x = off unless PLAYing or LOCKing; 4x = off once locked (VCR mode). When the relay is off, the machine runs on its own reference.
    Constant 38 msd 4x drops the relay after the AUTO switch to freewheel, so the deck "self-resolves" (useful for word-clocked digital decks).
- **Speed range** (constant 05 msd): ±3 % per step, default 4 = **±12 %** (F = ±45 %). The varispeed limit is 50 % (constant 44).
- **Control law**, from the descriptions of constants 02 and 05 (E-2):
  - **K1** (02 msd, default 3) "weights present positional error of offset": the proportional term. Use the smallest value that
    gives no overshoot or oscillation.
  - **K2** (02 lsd, default 5) "weights the running sum of offset errors to optimize damping": the integral term. Use the smallest value
    that does not cause oscillation in final sync.
  - **05 lsd** (default 2), "limit for error contribution to lock speed change": the 2600-SY calls this K3, "the maximum rate of change
    of error correction", in effect a slew-rate limit on the speed command. Set it as high as varispeed tracking allows without overshoot.
  - In other words, a **PI position loop** whose output is a capstan speed ratio, clamped to the speed range and rate-limited, updated
    once per frame from LTC frame-edge phase measurements. The machine's own capstan PLL is the inner loop.
  - [Engineering note] The term written in terms of *position* error, together with the slave's capstan *speed* loop, makes the
    whole loop type 2 (position → speed → position), which is why the integral term needs damping.
- **Windows:** wide = constant 06 msd × 0.05 frame (0 to 0.75 frame; default 1 → 0.05 frame). Narrow = constant 06 lsd × 0.001 frame (0 to 0.015;
  default 3 → 0.003 frame ≈ 100 µs at 30 fps). Constant 33 msd 1x-3x adds 1 to 3 whole frames ("rough lock window") for sloppy
  transports.
- **Resolve:** when the system is resolved and only the slave is enabled and playing, the ZETA locks the slave's frame edges to the
  reference (freewheel against the reference, the "resolve mode" status bit). From 3.60 the deck can be started from its own panel
  if a play tally is wired to the spare tally (constant 85 msd = 1) (UB14 §3.2). Constant 38 msd 1x inhibits slave resolve (for video
  slaves that already lock to house sync).

### 4.5 Numbers to start from (Appendix E "typical" column)

| Const | Default | Meaning |
|---|---|---|
| 01 lsd | 6 | frames outside the wide window before resync |
| 01 msd | 6 (9.6 kHz) / **7 for MCI (19.2 kHz)** | FM final divisor |
| 02 msd / lsd | 3 / 5 | K1 proportional / K2 integral |
| 03 + 04 lsd | 0x823 | FM main divisor |
| 04 msd | 0 | capstan relay on while the slave is enabled |
| 05 lsd / msd | 2 / 4 | correction rate limit / ±12 % range |
| 06 msd / lsd | 1 / 3 | wide 0.05 frame / narrow 0.003 frame |
| 07 lsd / msd | 1 / 0 | play-to-cue retries / off |
| 08 lsd | 2 | cue oscillation limit |
| 10 | 03 | KV² cueing K |
| 33 lsd | 4 | reader bit-length clamp |
| 34 | 0x29 (41 frames) | lock-routine exit error (switch to cueing) |
| 35 lsd / msd | 6 (50 ms) / 6 | command pulse length / repeats |
| 37 msd | 2 s | park-ahead of a playing master |
| 38 lsd | 0 | AUTO switch delay (s) |
| 41 | 0x59 (89 frames) | park window |
| 42 | 5 frames | park-to-play compensation (learned) |
| 43 | 1 (× 5 frames) | park-ahead of a stopped master (learned) |
| 44 | 50 | varispeed limit (% of play) |
| 50/53/54/55/64/65/67/69/72 | 01/02/04/08/20/10/08/88/40 | pin maps: Stop / FF / Rew / Play / Mute = GP2 / Lifter defeat = GP1 / Record out = Play / **Record in = Rec+Play** / Rehearse = GP3 |
| 61 | F4 | capstan relay |
| 83 msd | 4 (0.53 s) | code-only stop detection |

Pin-map values (E-13): 01 Stop (pin 3), 02 FF (4), 04 Rew (5), 08 Play (6), 10 GP1 (7), 20 GP2 (8), 40 GP3 (9), 80 Rec (10);
F1/F2 = AUX OUT tip/ring; F4 = capstan relay. The values are ORed, so 0x88 = Rec + Play pins asserted together.

**The per-transport library values for "028 MCI/SONY JH-16/24/114" are not printed in any of these documents.** Only
the generic defaults above, plus the MCI cable notes in section 5, are known. Transport 029 is MCI/SONY JH-110 A/B/C.

### 4.6 Lock time and accuracy (summary)

- From park to lock takes "no more than a very few seconds" (B-3). The park-ahead and learned start-up compensation exist precisely so the slave
  arrives at play speed already almost in phase.
- Steady-state accuracy is 1/1000 frame (ADR). Display resolution is 1/100 frame. The narrow window defaults to 3/1000 frame.
- Slew rates are 1 and 0.1 frame/s. Slow relock runs at about 0.1 frame/s (2600-SY).
- MIDI chase is deliberately slower (it bends the tempo).

---

## 5. MCI JH-16 / JH-24 interface (cable 011, MCI-011)

A **Y-cable**: the ZETA DB-25 (P1, JAE DB-25P, 20 ft) breaks out into three in-line pairs. Each pair is a plug going to the
machine's socket and a socket for the machine's own remote, autolocator or varispeed cable. The original controls keep working, and the ZETA
taps in parallel.

**Capstan, Cinch-Jones 310 (10-pin), P9 plug to the machine / P10 socket to the original remote:**

| JH pin | JH signal | ZETA DB-25 |
|---|---|---|
| 7 | **19.2 kHz OUT** (the machine's internal reference) | through 2.2 kΩ, clamped by a 1N5231B 5.1 V zener, to **2 CAPSTAN N.C.** |
| 9 | **19.2 kHz INJ** (the capstan PLL's reference input) | **1 CAPSTAN common** |
| 8 | GND | 14 GND sense |
| 2, 3 | +15 V, GATE CONT | jumpered together in the machine-side plug (enables the external injection gate) |
| n/a | n/a | **18 CAPSTAN N.O.** is wired to **16 FM** |
| 1, 4, 5, 6, 10 | −15 V, buffered capstan tach, +8 V, EXT DC control, 24 VAC | passed through only |

So the relay chooses which 19.2 kHz drives the capstan PLL: **relaxed (N.C.)** = the machine's own 19.2 kHz crystal
looped back (normal stand-alone operation); **energised (N.O.)** = the ZETA's FM output (19.2 kHz ± up to 12 %). The
sheet's note: "CAPSTAN CENTER FREQUENCY 19.2 KHz". The DC centre, range and polarity fields are left blank, so MCI uses FM, not DC.
(This matches the JH-24 manual's EXT reference of 19.2 kHz or ±5 V; see `references/jh24/README.md`.)

**Remote, Cinch-Jones 324 (24-pin), P5 plug to the machine / P6 socket to the remote. The P6 socket carries 1N914 diodes on the six command lines,
so the remote and the ZETA can both pull the same lines:**

| ZETA DB-25 | → JH remote pin |
|---|---|
| 3 STOP | 11 REMOTE STOP |
| 4 FF | 10 REMOTE FWD |
| 5 REW | 9 REMOTE RWD |
| 6 PLAY | 12 REMOTE PLAY |
| 10 REC | 13 REMOTE RECORD |
| 11 REC tally | ← 8 RECORD LITE |
| 7 GP1 (lifter defeat) | 19 LIFTER DEFEAT |
| 20 GP1 common | 20 GND |
| 8 GP2 (lock / mute) | 16 RMVC TRIGGER |
| 15 DC | 17 RMVC ANALOG (shielded; the remote-varispeed analog input, an alternative DC path) |
| 19 CMD common (also tied to 21 GP2 common) | 1 (−15 V rail): the MCI remote commands are active when pulled to this rail |
| n/a | 5 FWD lite, 4 RWD lite, 7 PLAY lite, 6 STOP lite, 3 +15 V, 2 +22 V, 21 pinch roller, 14/22/23/24: passed through only |

**Autolocator, Cinch-Jones 312 (12-pin), P7 plug / P8 socket:**

| ZETA DB-25 | → JH autolocator pin |
|---|---|
| 13 CTL/TACH | 6 COUNTER (tach pulse train) |
| 12 DIRECTION | 7 UP (direction: "0 VDC indicates reverse") |
| 25 logic GND | shield / ground |
| n/a | 11 A/L GND, 2 A/L ENABLE, 10 GND, 1 −15 V, 3 +15 V, 4 A/L CMD, 5 A/L ANALOG, 8 DOWN, 9 SPEED, 12 +8 V: passed through only |

The sheet also states:

- "TACH RATE AT 15 IPS IS 8 PPS (08H)": the value is meant for tach constants 91-93. [Engineering note: treat this figure as
  unverified. It is very coarse, so code must be read at play speed for fine positioning; our emulated JH-24 can expose any tach rate.]
- "PUNCH IN = REC", "PUNCH OUT = PLAY". This matches pin-map defaults 69 = 0x88 and 67 = 0x08: re-asserting PLAY drops the MCI
  out of record.

Summary of the signals for our emulated JH-24 interface:

- **Commands in:** STOP, FF, REW, PLAY, REC (pulses of about 50 ms), LIFTER DEFEAT, MUTE/RMVC trigger.
- **Tallies out:** RECORD LITE (plus play/stop/fwd/rwd lites, if the spare tally is used).
- **Position out:** tach pulses (COUNTER) plus DIRECTION (UP).
- **Speed in:** an external capstan reference, a 19.2 kHz centre clock (relay-switched) or RMVC analog DC.
- **Timecode:** LTC from track 24 (or a dedicated TC track) to SLAVE CODE IN.

---

## 6. Getting stable sync

### 6.1 What the documents say

- **Code quality first:** "Poor time code on tape is the primary cause of synchronizing problems" (mp22). Watch the
  MTC/STC LEDs: steady = good, flicker = discontinuous or low code (mp23). Stripe **the whole tape**, starting about 1 minute before the
  material (for example from 00:59:00:00, never 00:00:00:00), with at least 30 minutes for testing. Record at -5 to -10 VU on audio machines (mp21, mp30; RMT p21).
- **Never dub code**: always regenerate it through the generator (XFER or JAM copy) (RMT p21; mp42-43).
- Record code with the deck on **internal/fixed speed** and nothing enabled (mp20; RMT p21).
- **Master on internal (fixed) speed, slave on EXTERNAL speed control** (mp26).
- **One frame rate for the whole system.** Mismatched rates cannot be synchronized; drop and non-drop may be mixed (A-3).
- Play both tapes for a few seconds before enabling, so the ZETA has read both codes (mp28, mp37).
- **Resolve to a common reference** whenever video is involved. Feed the same house sync to the VTRs and to the ZETA, so that the slave
  tape's code lands on the video frame edge, not merely on the master code's sync word, which may itself be misaligned (mp50-51). Video-to-video without a
  common sync is "MARGINALLY ADEQUATE" (mp51). For audio-to-audio the ZETA may run unresolved (mp49).
- Choose **AUTO** lock mode for tapes with flaky or discontinuous code (address-lock, then freewheel). Use SLOW RELOCK for inaudible subframe
  corrections, and SPLICE TRAP to keep critical passages locked across splices (mp54-56).
- Use a separate, clean mains circuit for the ZETA (mp4). Guard the reader inputs against transients (TB1).
- From 3.70: raise the reader bit-length clamp (constant 33 lsd) to follow jittery code smoothly (UB21).
- Tune the constants in this order: windows → K1 (raise until it overshoots, then back off) → K2 (smallest value that kills residual drift) → 05 lsd
  (rate limit) → cueing K and the park window → let the learned park-to-play value settle over several cycles (E-2, E-3, E-12).

### 6.2 Two machines (48-track) and a DAW

- **Classic 48-track (one ZETA):** master JH-24 track 24 LTC → MASTER CODE IN, and its interface cable → MASTER TRANSPORT (control, tach
  and record tally). Slave JH-24 track 24 → SLAVE CODE IN, with cable 011 → SLAVE TRANSPORT. Stripe both tapes from one generator pass
  (zero offset), or capture the offset. Enable MASTER + SLAVE. Set **Z17 AUTO REC'D = SLAVE** so punches on the master are copied to the slave.
- **DAW as master of one JH-24 (one ZETA):** the DAW's LTC output → MASTER CODE IN, with no master transport cable (a "time code only" master;
  constant 83 msd sets stop detection). JH-24 = slave. The **original unit cannot read MIDI Time Code**: MTC exists only as an *output*
  (MIDI TC = ZETATIME). So, to be faithful, the DAW should send LTC. A MTC master input is a deliberate extension in our build (see below).
- **DAW master + two JH-24s:** one ZETA controls only one slave, so use **two ZETAs**:
  1. ZETA #1: DAW → MASTER CODE IN; JH-24 A = slave.
  2. ZETA #1 GEN CODE OUT (COPY MODE = XFER, TC COPY = ZETATIME, ZETATIME = MASTER) → ZETA #2 MASTER CODE IN; JH-24 B = slave of #2.
  3. For park interlock: ZETA #2 AUX OUT tip (XOUT TIP = SYS PRK) → ZETA #1 AUX IN (XIN = SYS PARK IN), with ZETA TC LINK = ON on #1.
  4. Enable MASTER + SLAVE on both. ZETA #1 then waits for #2's slave to park before rolling (UB14 §7; RMT p27).
- Alternatively, JH-24 A is the master of ZETA #1 and the DAW chases **the ZETA's MTC output** (MIDI TC = ZETATIME). This is the period-correct
  "tape is master" setup.

### 6.3 [Engineering note] Best practice for our implementation

- **Common clock beats chasing.** In the app, every "machine" runs on one audio sample clock. Treat that as house sync. The emulated capstan
  reference should be derived from the session sample clock (the analogue of resolving), so that once locked the only remaining error is what the
  emulated mechanics introduce. Chase-lock (an address and phase servo) is needed only for positioning and for recovering after transport moves.
- **Resolve vs chase:** when the DAW is master, its LTC and MTC are sample-accurate to its own clock. If our app and the DAW share an audio
  device clock, run the slave servo in FWL/AUTO after the address lock, with a very low-bandwidth phase correction. Do not let per-frame code jitter
  modulate the capstan, because it will be heard as wow.
- **Measure phase at the sync word, filtered.** Timestamp each LTC frame's sync-word edge (sub-sample, by interpolating the zero crossing).
  Fit a line (a second-order PLL or a Kalman/α-β filter) through recent frame edges to estimate position and rate. Feed the servo with the *filtered*
  error, not the raw error. This is the software equivalent of the reader's bit-length clamp (constant 33).
- **Flywheel / freewheel:** on dropouts, keep extrapolating the last good position and rate (Lock Hold). Do not declare an error until N
  consecutive frames are outside the wide window (constant 01 lsd = 6). Validate new addresses with the +1 test, and treat a non-+1 jump as a splice
  (splice trap or recapture).
- **Two-stage control:** a coarse stage (wind with KV² braking to a park point ahead by the learned start-up latency, then play) and a fine stage (a PI
  loop on position error, output = speed ratio, clamped to ±12 % and rate-limited). Use deadbands with hysteresis: enter "locked" at the narrow window and leave
  at the wide window, to avoid LED chatter.
- **MTC input (an extension):** quarter-frame messages give a full address only every 2 frames and arrive with MIDI transport jitter. Use the quarter-frame
  arrival times as phase samples (8 per 2 frames at 4 per frame), compensate for the 2-frame address latency, filter heavily, and
  prefer the DAW's LTC (audio) or a shared word clock when it is available. Use full-frame messages only for locate.
- **Bit-phase lock:** for sub-frame accuracy, lock to bit-cell timing within the frame (80 bits per frame), not just the frame edge. At 30 fps
  one bit is 1/80 frame, about 0.42 ms, so averaging bit transitions gives a phase estimate well under the 0.001-frame narrow window.
- Always keep the slave's emulated "capstan relay": released = the machine runs on its own crystal (fixed speed); energised = the ZETA's reference.

---

## 7. Sources actually read

- `zetathree_manual.pdf`, all 219 pages (OCR of every page; images viewed for PDF pp. 1-8: the cover, the front and rear panel callout
  diagram, the 3.50 QRC menu list and basic-operation card, chapter 1, and chapter 2 pp. 3-4). Read in detail: chapters 2-5 (mp3-58), the MIDI addendum
  (PDF 63-90), chapter 13 (13-1 to 13-8 and 13-40 to 13-44, plus the transport ID list 13-64/65), and Appendices A, B, C, D, E (header), F, G, H.
- `Zeta3_Slave_Transport_Constants.pdf` (Appendix E, 3.70/3E70), all 25 pages.
- `Zeta3_Appendix_C.pdf`, all 5 pages.
- `zeta_jh16a.gif`, `zeta_jh16b.gif`, `zeta_jh16c.gif` (MCI/Sony JH-16/24 cable 011).
- `zeta3.jpg` (front-panel photo of a ZETA-THREE^em).
- `zeta3_bulletin_index.pdf` (2 pages).
- User bulletins **#5** (3.00 differences), **#8** (3.50), **#14** (3.60), **#21** (3.70), **#23** (3.70 announcement), **#24** (3.71): read.
  Bulletins #1-4, 6, 7, 9-13 and 16-19 were OCR'd and skimmed only for relevance (installation, ESD and RAM kits).
- `Zeta3-TECHNICAL-BULLETIN-1.pdf` (reader input fix).
- `Zeta3_Chapter14.pdf` (emulation; first pages only).
- `ZetaIII-Remote-Control-Original-Manual.pdf` (text layer: operation, memories, time-code tips, multiple ZETAs, hidden keys);
  `ZetaIII-Remote-Control-Version-1.20.pdf` and `ZetaIIIRemoteVer_1_3.pdf` (searched only).
- `Original_ZetaIII_PSU_Schematic.pdf`.
- `sy_ver1_11_constantsdescriptions.pdf` (System 2600 E-SY constants; pp. 1-16 read for clarifications).
- Not used: `Zeta3_Display_Menu_List.pdf`, beyond confirming it matches the manual's QRC; `Partial-Chapter13.pdf` (only searched for MCI); the
  other per-transport interface PDFs (Otari, Studer, Sony and so on) and the System 2600 manuals; `system-2600e-transport-library-list.pdf`
  (OCR'd, no MCI constant values found).
