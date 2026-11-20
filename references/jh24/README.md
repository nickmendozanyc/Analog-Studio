# CMI studio reference: MCI JH-24 Series manual (2nd edition, February 1982)

The user supplied the MCI JH-24 Series Multitrack Tape Recorders manual (157 pages, split in four parts:
Part1 p1-55, Part2 p56-88, Part3 p89-121, Part4 p122-157) as the reference for the HJ-24 tape machine and the
AutoLocator III in the CMI room. The PDF pages carry a "Courtesy of www.ms-tas.com" watermark (its public source).
It is MCI's copyrighted material and this repository is public, so the PDFs are NOT committed here; re-upload the
split copy or fetch it from that source when needed.

## Sections (manual page numbers)

| Section | Contents |
|---|---|
| 1 Introduction | 1-1 general, 1-3 specifications (Table 1-1), 1-5 ordering numbers |
| 2 Operating procedures | 2-2 transport controls, 2-3 channel / master status, 2-4 AutoLocator III, 2-5 tape speed control, 2-5..2-8 step-by-step procedures |
| 3 Tape transport | 3-1 control logic, 3-3 capstan servo (PLL, reference), 3-16 tape tension servo (idle / play / fast loops); schematics 3-19..3-57 (transport control panel 3-55, remote control 3-57) |
| 4 Audio electronics | record, repro, cue, input; schematics 4-11..4-33 (channel status board 4-25) |
| 5 AutoLocator III | 5-1 general, 5-2 hardware, 5-5 program description; schematics 5-7..5-15 (display board 5-9, assembly 5-15) |
| 6 Power supplies | JH-114PS, JH-24D |
| 7 Alignments | transport 7-2..7-8 (tension 7-5, capstan speed 7-7, MVC 7-8), audio 7-8..7-14 |
| 8 Troubleshooting | control logic, torque, PLL, audio, AutoLocator III |
| 9 Spare parts, warranty | |

## Facts that matter for the app

Specifications (Table 1-1, p1-3):
- Reels 7, 10½ and 14 inch; 2" tape for 16 and 24 track.
- Speeds **15 and 30 ips** fixed (HI = 30 ips AES, LO = 15 ips NAB/IEC); variable ±20 % about either.
- Start time 1200 ms at 30 ips, 600 ms at 15 ips. Stop time 4 s with 10½" reels.
- Rewind 85 s for 2500 ft (about 9 m/s average), 140 s for 4800 ft.
- Wow and flutter 0.04 % (15 ips) / 0.03 % (30 ips); erase 105 kHz, bias 210 kHz.

Transport (2.2.1, 2.3.1):
- RWD / FWD / STOP / PLAY / RECORD (RECORD with PLAY, or while playing). SHIELD, EDIT (dump edit, tape spills off the right).
- MVC joystick: from stop, shuttles while touched and returns to stop on release; from a wind, touching it takes over
  and stays latched (MVC LED) until any motion key.
- Torque limit HI / MED / LO for 14" / 10½" / 7" reels. Reference FIX / VAR / EXT (19.2 kHz or ±5 V), VAR pot ±20 %.
- From FWD, pressing RWD: tape decelerates, reverses and accelerates; STOP from a wind decelerates, lifters retract,
  shields go up.

Channel and master status (2.2.2, 2.2.3, 2.3.2):
- Per channel: RECORD READY (black, yellow LED), CUE (grey, green LED = monitoring the record head), red LED recording.
- Master TAPE / INPUT / AUTO. AUTO (automatic overdub): record-ready channels monitor input in stop, cue (record head)
  in play, input in record; the other channels monitor cue. INPUT+AUTO: record-ready channels on input throughout.

AutoLocator III (2.2.4, 2.2.5, 2.3.3):
- TAPE POSITION and LOCATE POSITION displays, minutes and seconds. Keypad 0-9 enters the locate position.
- ← shifts locate position to tape position; → shifts tape position to locate position.
- STO + digit stores the locate position; RCL + digit recalls it. RST under each display clears it to zero.
- LOC autolocates; 8/9/REP repeats: locate to memory 8, play to memory 9, rewind, again, until any key.
- TVI: tape position shows speed in ips (hundredths), locate position the pitch change in ¼ semitones (blank if not a
  multiple). MODE picks fixed or variable capstan reference (with transport REFERENCE in EXT); TAPE SPEED pot; VAR
  (red) and FIX (green) LEDs.

## Where the app differs from the manual (as of this commit)

- The app offers 7½ ips on the HJ-24 as well; the JH-24 has only 15 and 30.
- Wind and stop timing are set by the user's requests (winds about 13 m/s, stop from full wind about 2 s), faster
  than the stock machine (85 s rewind of 2500 ft, 4 s stop).
- AL-III now follows section 2: STO stores the locate position, ← / → shift between the displays, 8/9/REP loop,
  MODE (FIX / VAR), TVI (held: ips and ¼-semitone pitch), TAPE SPEED pot. The A.PLAY and LOC 0 keys are gone
  (Z still returns to zero from the keyboard).
- Audio electronics (section 4) are modelled in `prototype/electronics/` and run live in the mockup (AUDIO ELECTRONICS
  plate on the cabinet front).
