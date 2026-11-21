# Studio reference: AMS RMX16 Digital Reverberation System

Research notes for building our own unit that looks, works and sounds like the AMS RMX16. It is a 2U digital reverb
from Advanced Music Systems of Burnley, England, launched in the early 1980s. It has one input, two outputs, nine
factory programs in EPROM, a red LED display and a calculator-style keypad. Everything below is written in our own
words. The manuals, magazine scans and photos are copyrighted, so they are **not** committed here. Fetch them from the
URLs in section 7.

Citation keys:

- **M3 p.x** = *The RMX 16 Digital Reverberation System, User Manual 527-030, Issue 3* (AMS Neve, © 2000; program
  notes for "Revision 3.0 Software"). archive.org item `manualzilla-id-5853972`. We could only read its OCR text layer
  (the PDF and page images sit on blocked archive.org data nodes). Page numbers are the manual's own printed numbers.
- **MUA p.x** = *RMX16 Digital Reverberation System, User Manual Issue 1* (AMS Neve, © 1980-2014), the manual for the
  plug-in version. It repeats the hardware text and adds plug-in-only controls. archive.org item
  `manualzilla-id-5674578`, read the same way.
- **HSR84** = Paul White, "AMS RMX-16 Digital Reverb", *Home & Studio Recording*, Mar 1984, pp.32-33 (muzines).
- **SEP86** = Chris Maillard, "Profile" (AMS company profile), *Sound Engineer and Producer*, Nov 1986, pp.46-48
  (muzines).
- **IMTR** = "Track Record: Lessons In Love" and "Track Record: Bowie & Jagger", *International Musician & Recording
  World*, 1986 (muzines).
- **[Photo AF]** = user photos of real RMX16 units on fr.audiofanzine.com (front panels lit, rear panel and inside).
  We read the display contents and legends off these. The user's own photos should be checked against this file.
- **[Eng]** = our own engineering assumption or inference, not a source fact.

---

## 1. What it is, history and famous uses

- AMS (Advanced Music Systems) was started by Stuart Nevison and Mark Crabtree, two former Lucas Aerospace engineers.
  Their first product was a flanger, then came digital delays (the DMX 15-80 family), pitch changers and reverbs
  (SEP86). Crabtree ran research and development.
- The RMX16 was sold as a microprocessor-controlled, full-bandwidth digital reverberator. AMS later called it the first
  of its kind (MUA p.3). The 1984 UK price was "£4500 plus" (HSR84). The intro date of 1981/82 comes from the brief.
  None of the sources we could read gives the exact launch date.
- According to AMS, the programs were voiced by ear over a long period. They were tuned so that a wide range of
  settings stays musical (MUA p.3).
- The software was in EPROM and could be updated. The program set changed over time:
  - **1984 set** (HSR84): 1 Plate B1, 2 Ambience, 3 Room A1, 4 Hall C1, 5 Delay, 6 Plate A1, 7 Hall B3,
    8 "Non-linear" (= Nonlin 1), 9 Reverse 1.
  - **Revision 3.0 set** (M3 p.29): 1 Ambience, 2 Room A1, 3 Hall C1, 4 Plate A1, 5 Hall B3, 6 Chorus, 7 Echo,
    8 Nonlin 2, 9 Reverse 1.
  - Nine more programs were issued as bar-coded "Softprogs" for the remote terminal and wand, or on a Softprog card:
    Delay, Freeze, Hall A1, Nonlin 1, Image P1, Plate B1, Reverse 2, Room A0, Room B1 (M3 p.42-44). Some of these are
    simply older factory programs that users asked to have back. The UAD plug-in's "Expanded" version has all 18
    programs.
  - Issue 3 of the manual still says "program 5 (the delay program)" in its fault-finding section (M3 p.20), which is
    left over from the 1984 order. One sentence in the operating section says "PROGRAM 3 allows the high filter only"
    (M3 p.12). That matches the 1984 order, where program 3 was Room A1, not Hall C1. Use the program notes, not that
    sentence.
- Famous uses: AMS says Phil Collins used its reverb programs, and Bob Clearmountain used AMS gear on Bowie albums
  (SEP86). The engineer on Level 42's "Lessons In Love" called the RMX16 non-linear program his favourite effect and
  used it on the snare. He also put delayed non-linear reverb on the vocal (IMTR). The RMX16 was also used on Bowie &
  Jagger's "Dancing In The Street" (IMTR). The "gated" 1980s snare sound is the classic Nonlin 2 use.
- Later versions: AMS Neve released a 500-series module and a plug-in (UAD, 2014). The plug-in adds Dry/Wet and Wet
  Solo controls that the hardware **does not** have (MUA p.10-11). On the hardware, the outputs are effect only [Eng,
  from the absence of any mix control in M3].

## 2. Specifications

| Item | Value | Source |
|---|---|---|
| Format | 19" rack, **2U** (front panel 3.5"), 480 × 322 × 89 mm, about 12 kg, fan-cooled | M3 p.6, 25; HSR84 |
| Input | **1** × XLR female, electronically balanced, 10 kΩ, sensitivity −10 dBV (OCR reads "Ref. 0.775 V") | M3 p.23 |
| Outputs | **2** × XLR male (ch A, ch B), "compensating" electronically balanced, 150 Ω, max +20 dBV | M3 p.23 |
| THD | < 0.03 % at 1 kHz, full output (delay mode) | M3 p.5, 23 |
| Dynamic range | 90 dB | M3 p.23 |
| Frequency response | 20 Hz – 18 kHz, +0/−3 dB | M3 p.23 |
| S/N | depends on program, typically 86 dB | M3 p.23 |
| Converter | Sample-and-hold, then a gain-ranging stage (×1, ×2, ×4 or ×8, giving a 2-bit exponent), then a **12-bit ADC**. The result is turned into **16-bit linear** data. | M3 p.17; HSR84 |
| Processing | Microprogrammed parallel arithmetic processors at 22 MHz with a **28-bit** internal word. About 1000+ weighted taps per second of reverb. | M3 p.17 |
| Audio memory | 64 KB (HSR84, 1984) / **128 KB** (M3 p.17), used for delay and scratch | |
| Max delay | Delay program: **810 ms or 1.63 s**, depending on version. Echo: 650/150 ms or 1.2 s/400 ms. Plain DDL use: 0–1.6 s in 1 ms steps | M3 p.5, 31, 42 |
| Sample rate | **Not stated.** About 40 kHz, inferred: 32 K words / 0.81 s ≈ 40.4 kHz and 64 K words / 1.63 s ≈ 40.2 kHz (16-bit words). This also fits the 18 kHz bandwidth. | [Eng] |
| Output DACs | Two 16-bit channels, followed by reconstruction filters | M3 p.17 |
| Memory | 9 factory programs (EPROM). 9 user parameter stores plus the temporary store "t" in the mainframe (non-volatile, 3.6 V battery). 90 more stores in the remote. Softprog stores 10-12 (mainframe) and 31-33/34 (remote). | M3 p.5-6, 12, 23 |
| Display | **11 seven-segment digits** plus **8 seventeen-segment "starburst"** alphanumeric characters, red LED | M3 p.24 |
| Power | 110/220/240 V AC, 50/60 Hz (barrel selector), 70 VA, IEC inlet. Fuses: 1 A A/S mains, 1.6 A A/S ±15 V, 6.3 A semi-delay +5 V. The rear-panel photo reads "3.3A". | M3 p.8, 23; [Photo AF] |

## 3. Front panel (for drawing)

Overall: black or very dark navy-grey panel. Every section is framed by a thin light-grey outline box, and all
legends are lower-case, light grey, in a rounded sans face. Along the full width under the controls runs a framed
strip that reads **`model rmx 16 : digital reverberation system : advanced music systems : burnley, england`** (M3 p.1;
[Photo AF]). Rack ears with two screw holes each side.

Left to right:

1. **Logo and level block** (two stacked boxes on the far left):
   - Top box: the **AMS logo**. It is a light silver or cream plate with outline lettering "ams" inside a
     castellated border.
   - Bottom box: **`in`** knob (left) and **`out`** knob (right). Both are knurled aluminium skirted knobs, and some
     units have bronze or gold-coloured caps. Each has a printed **0-9** scale around it (0 at the top, running
     clockwise; 5 at the bottom right, 6 at the bottom, 7 at the bottom left). Between them is a vertical column of
     **4 LEDs** under the legend **`o/flo`**. From the top they are **red (overflow)**, **red (−6 dB)**,
     **yellow/amber (−12 dB)** and **green (−18 dB)** (M3 p.10; [Photo AF]).
2. **Pot block**: one knob with a 0-9 scale. Under it is the legend **`pot`** and a square black push key with a red
   LED.
3. **Display and function-key block** (the large central box):
   - A long dark-red window. In it are the 7-segment field (left and centre) and the 8-character starburst program
     name (right), for example `AMBIENCE`, `NONLIN 2`, `DELAY`.
   - Under the window is a row of square black keys. Each has a small red LED in its upper half. Legends sit above the
     keys:
     `program` · `predelay` · `decay time` · (a panel screw) · `decay filter` spanning `low` `high` · `store control`
     spanning `save` `recall` · `nudge` spanning `down` `up`. Paired keys sit close together. Each pair is a group
     under a shared heading.
4. **Keypad block**: a 4 × 4 grid of cream or ivory keys with dark legends:
   ```
   1 2 3 A
   4 5 6 B
   7 8 9 C
   * 0 # D
   ```
5. **Power block** (far right, narrow): **`on`/`off`** toggle switch at the top, a red power LED, and the legend
   **`power`**.

### Display layout (from [Photo AF], cross-checked with M3 p.24)

The display runs left to right. Unlit segments show faintly through the filter:

| Field | Cells | Shows | Examples seen |
|---|---|---|---|
| Program number | 2 digits, right-aligned | 1-9 (factory), 10+ (soft or extra programs) | `1`, `8`, `16`, `17` |
| Predelay (ms) | 3 digits, right-aligned, no leading zeros | 0 to the program maximum | `0`, `30` |
| Decay time (s) | 2 digits, **fixed decimal point after the first** | 0.0-9.9 | `4.0`, `4.8`, `0.0` |
| Decay filter low | 1 sign character (± bar) + 1 digit | −9 … +9, blank sign for 0 or positive | `0` |
| Decay filter high | 1 sign character + 1 digit | −9 … +9 | `-4`, `+4` |
| Store control | 2 digits | `t` (temporary store) or the store number 1-9 (1-99 with the remote) | `t` |
| Program name | 8 starburst characters | Program title; Echo shows `ECHO A` / `ECHO B` | `AMBIENCE`, `NONLIN 2`, `DELAY` |

The total is 2+3+2+1+1+2 = **11** seven-segment digits. The two sign characters are separate. This matches the
spec. Fields that a program does not use are **blank**. For example, DELAY shows only `16   0 0.0 … t DELAY`, with no
filter digits. Typical full readout: `1   0 4.0  0 -4  t  AMBIENCE`.

Display messages (M3 p.10-12):
- An **`E`** in a field means the entered value is illegal for that field. The field's key LED keeps flashing until
  that key is pressed again.
- **`t`** in the store field means the live settings are the temporary store, not a saved one.
- Each key LED: lit = selected for editing, flashing = keypad entry in progress or saving pending.
- Nudge LEDs light while their key is held (M3 p.11).

### Rear panel (M3 p.8; [Photo AF])
From left (seen from behind): fan with wire guard · IEC mains inlet with voltage selector/fuse flap · four fuse
holders labelled "1A A/S (MAINS SUPPLY)", "1.6A A/S (−15V SUPPLY)", "1.6A A/S (+15V SUPPLY)", "3.3A SEMI-DELAY (5V
SUPPLY)" · rating plate "Advanced Music Systems / model type / serial no / made in U.K" · **REMOTE** (25-pin D-sub) ·
**AUX** (blank plate) · **CH.A OUTPUT** and **CH.B OUTPUT** (XLR male, stacked) · **CH.A INPUT** (XLR female) and a
blanked **CH.B INPUT** hole (the unit is mono in).

## 4. Operation

General model: pressing a function key **selects that field for editing**, and its LED lights. Exactly one field is
active. A value can then be entered in three ways: **keypad + `#`**, **nudge down/up**, or (decay time only) the
**pot** (M3 p.10-12).

- **program**: press it, then type 1-9 (or a higher number for soft or extra programs) and press **`#`** (enter).
  The key LED flashes from the first digit until `#` is pressed. An unavailable number shows `E` and nothing changes.
  Press `program` again to clear the error. Nudge up/down steps through the programs. Changing to a *different base
  program* **mutes the output** for a fixed short time, so that stale memory contents are not heard. The mute time
  does not add up when you nudge through several programs. Loading a program puts its factory parameters into the
  temporary store `t`. Earlier tweaks are lost unless saved (M3 p.10, 12, 14; MUA p.8).
- **predelay**: keypad entry in ms, with 1 ms resolution. Nudge steps are **10 ms** (1 ms in Chorus). The maximum
  depends on the program. Above it you get `E` (M3 p.11, 24, 30).
- **decay time**: keypad entry with **`*` as the decimal point** (2 `*` 8 `#` = 2.8 s). Nudge steps are 0.1 s. Pressing
  **pot** hands decay time to the pot knob, which acts live and can be moved during a mix. (Issue 3 says the pot
  works only for decay time. The plug-in also lets it control predelay and mix.) Min and max depend on the program
  (M3 p.10-11, 14).
- **decay filter low / high**: single signed digit. Type **`*` first for a minus sign** (`*` 4 `#` = −4). With no `*`
  the value is positive. Nudge steps are 1. Each one works only if the program offers it. Otherwise the field is
  blank (the remote shows "NONE") (M3 p.12, 24, 37).
- **store control save**: press `save`. The LED flashes and the store digit shows the last store used. Type 1-9 and
  press `#`, or just `#` to accept the one shown. The settings are copied from `t` to that store. Later edits change
  only `t` (M3 p.12).
- **store control recall**: `recall`, digit, `#`. Recalling a store based on the *same* base program does **not**
  mute, so you can switch live during a mix. Trick: press `recall` and the digit early, then hit `#` on the beat
  (M3 p.12, 15).
- **nudge down / up**: change the active field. Holding a key auto-repeats at the nudge rate. Tapping quickly can go
  faster than that rate (M3 p.13).
- **A B C D**: kept for program-specific functions. Echo uses A/B to choose which output is being edited. The name
  then changes to `ECHO A`/`ECHO B` (M3 p.13, 31).
- **Power**: everything, including `t`, is non-volatile. The unit powers up exactly as it was left. Holding **`1`**
  while switching on clears the Softprog stores. This is also the reset after a battery change (M3 p.13, 19).
- **in / out / o/flo**: set `in` so that the top level LED (red, −6 dB) lights only on the highest peaks. The
  separate red o/flo LED shows internal arithmetic overflow (common in Chorus and in the frozen Ambience). If it
  lights, turn the input down. The `out` knob trims the stereo output level (M3 p.10, 30-31).
- **Remote terminal (option)**: an LCD handheld with paired up/down keys for each parameter (PROG, PREDEL, DECAY, LO
  FILT, HI FILT, STORE), plus STATUS, ID, SAVE, RECALL and CLEAR. It runs on NiCads and holds 90 stores. A bar-code
  wand loads Softprogs. Messages include "CONNECT RMX 16!", "PREDELAY = 55ms", "LO FILTER = NONE", "DECAY TIME =
  2.0s" and the ID "RMX 16:REV 1.6" (M3 p.35-41). The remote is not needed for our model.

## 5. Program list

Ranges that apply to every program: predelay is shown in ms (nudge 10 ms), decay 0.0-9.9 (nudge 0.1), filters −9 … +9
(nudge 1). The values below are each program's **maximums and available controls**. The manuals do not give a table
of factory default values. "Typical" values are what the photos show on real units, which is not proof of the
defaults.

### Factory programs (Revision 3.0, M3 p.29-32)

| # | Name (display) | Predelay max | Decay | Low filt | High filt | A-D keys | Character |
|---|---|---|---|---|---|---|---|
| 1 | `AMBIENCE` | 200 ms | 0.0-9.9; **9.9 ≈ infinite** | yes | yes | – | Between a hall and a plate, with few spatial cues and low colouring. Good for extending existing reverb. With decay 9.9 and both filters 0 it **freezes**: no air absorption, and new input adds on top ("choir"). Freeze it live by moving the pot quickly from 0.0 to 9.9. After minutes to tens of minutes, DC build-up can cause overflow; set decay to 0 for a moment to clear it. Typical: `0 4.0 0 -4` [Photo AF]. |
| 2 | `ROOM A1` | 300 ms | best 1-2 s | **no** | yes (suggested −7/−8) | – | Live room. Colouring is deliberately high, imitating standing waves. |
| 3 | `HALL C1` | not stated (300 ms assumed [Eng]) | – | yes | yes | – | Hall with **strong early reflections**, so a clear sense of size and presence. Good on vocals. |
| 4 | `PLATE A1` | 300 ms | calibrated up to about 5 s, longer for effects | yes | yes | – | High diffusion, so percussion is smoothed quickly. Medium colouring and an even decay. |
| 5 | `HALL B3` | 300 ms (M3) / 200 ms (MUA) | – | yes | yes | – | Like Hall C1 but with **weaker early reflections**. |
| 6 | `CHORUS` | **1-50 ms** = voice spacing, nudge **1 ms** | "decay" = **depth** of random delay modulation and pitch change | no | yes | – | 5 voices spread across the stereo field. Each voice has a randomised delay, and the basic spacing is "predelay" × voice index (5 × 50 = 250 ms total). Below about 6 ms you get phasing, flanging or "tunnelling", strongest in mono. Overflows easily. |
| 7 | `ECHO A` / `ECHO B` | out A 650 ms / out B 150 ms, **or** 1.2 s / 400 ms (memory version) | "decay" = **feedback (regeneration)** | yes | yes | **A, B** choose the output | Two independent delays from one input, with filters in the feedback path. Clean digital repeats. |
| 8 | `NONLIN 2` | not stated (0 is typical; photo shows 30) | **uncalibrated**, sets the hold length | no | yes | – | Stereo "non-linear" reverb. The level stays nearly flat for the set time, then **drops off very quickly**. Used for drums and loudness. Short settings give a good room. Commonly reported snare settings: predelay 0, decay 4.0, high filter around −4 (forum lore, unverified). Photo: `8  30 3.x … NONLIN 2`. |
| 9 | `REVERSE 1` | selectable (max not stated) | **uncalibrated**, sets the build-up length | not stated | not stated | – | Reverb **swells up then stops suddenly**. Output 1 is diffuse and output 2 has discrete reflections. They are two variants, **not a stereo pair** (M3). MUA says left diffuse, right discrete. |

### Extra programs (Softprogs / later ROMs / "Expanded" set, M3 p.42-44; HSR84)

| Name | Predelay | Decay | Filters | Character |
|---|---|---|---|---|
| `DELAY` | **= the delay time**, 0-810 ms or 0-1.63 s, 1 ms steps | **feedback** (0.0 = single repeat), uncalibrated | none (fields blank) | Delay on **output 2 only**. Output 1 is the dry signal passed through the converters. Mono. Seen as program **16** on one unit [Photo AF]. In 1984 it was program 5 (HSR84). |
| `FREEZE` | – | **only 0.0 / 0.1 / 0.2 mean anything**: 0.0 = clear, 0.1 = freeze and add input, 0.2 (and above) = keep the frozen sound but mute the input | – | Easier version of the Ambience freeze trick. Meant to be played with the decay nudge keys. |
| `HALL A1` | 300 ms | – | high only | Older hall. Its decay is less smooth, which some users liked on vocals. |
| `NONLIN 1` | selectable | uncalibrated hold | none stated | Mono-style original non-linear program. Output 1 is diffuse, output 2 discrete. Good for multiplying hand claps. Was program 8 in 1984. |
| `IMAGE P1` | – | a few ms to about **0.6 s** | high only | Non-linear burst that **pans across the stereo field** as it goes. Summed to mono it sounds like Nonlin. |
| `PLATE B1` | 300 ms | to about 5 s calibrated | low + high | Second plate, a slight variation on A1. Was program 1 in 1984. |
| `REVERSE 2` | selectable | uncalibrated | high | Stereo version of Reverse 1. |
| `ROOM A0` | 300 ms | as Room A1 | as Room A1 (high only) | Original Room A1 with a brighter, less restrained top end. |
| `ROOM B1` | – | up to about **0.7 s** | high only | Different algorithm. Diffusion density stays constant over time, so the decay control changes the apparent room size. For very short rooms and drama dubbing. |

The full order of programs 10-18 on units with the expanded set is **unknown**. The photos show `16` = DELAY and a
`17` with decay 4.0 (name not visible).

### Decay filter calibration (M3 p.33)

- **High filter**: this sets the frequency at which the reverb tail decays in **half** the displayed time. The values
  are 0 = 18 kHz (flat), −1 = 15 k, −2 = 10 k, −3 = 8 k, −4 = 6.5 k, −5 = 5 k, −6 = 3.5 k, −7 = 2 k, −8 = 1.5 k,
  −9 = 1 kHz. Positive high settings appear on a real display (`+4`) but are not documented. We assume they lengthen the
  HF decay [Eng].
- **Low filter**: this changes the decay time at **350 Hz** from **¼ ×** the displayed time (−9) to **4 ×** (+9).
  We assume the curve is geometric, factor = 4^(L/9) [Eng].
- Both apply to the late reverb. In some programs they also colour the early reflections.

## 6. Modelling recipe

**Converter and engine (all programs)**
- Run the core at **40 kHz** [Eng, inferred]. Use a polyphase resampler to and from the host rate. Put a steep
  anti-alias low-pass at about 18 kHz (elliptic, 7th order or so) at the input and before the output.
- ADC: for each sample, pick a gain of 1, 2, 4 or 8 (the largest that does not clip the 12-bit range). Quantise to
  **12 bits** at that gain, then divide back. The result is a 16-bit linear word whose noise floor rises with level,
  like a floating-point converter. Hold the input at 16-bit resolution in the delay RAM. Accumulate at 28 bits,
  saturating, and light **o/flo** when the result clips. Use 16-bit DAC quantisation with a little TPDF dither [Eng].
- Input stage: mono sum to one input. `in` knob gain: 0-9 maps to −∞ … +10 dB, with unity at about 7 [Eng].
  Level LEDs at −18, −12 and −6 dBFS.
- Program change: mute the output for about 150-300 ms [Eng] and clear all delay memory. Recalling a store of the same
  program updates parameters without a mute, with about 20 ms smoothing.
- Parameter smoothing: decay, filters and pot moves change loop gains smoothly. Predelay jumps, as on the original
  [Eng].

**Reverb family (Ambience, Room A0/A1/B1, Hall A1/B3/C1, Plate A1/B1)** [Eng structure, source behaviour]
- Signal flow: predelay → input diffusion (4 series all-passes, 2-12 ms, g ≈ 0.6-0.75) → **8-line feedback delay
  network** (Householder or Hadamard mix, lines 20-110 ms with prime lengths, slowly modulated by ±0.2 ms on 2 lines).
  Use different output taps for L and R.
- Each line's gain is g = 10^(−3·d/(T60·fs)). In each loop put a **low-shelf at 350 Hz** set so that the low-band T60
  is T60·4^(L/9), and a **first-order HF damping filter** designed so that the T60 at the table frequency f(H) is
  T60/2.
- **Ambience**: few or weak early reflections, high diffusion and smooth modulation. **Special case: decay 9.9 with
  L = H = 0 → set the loop gain to exactly 1.0 and turn the damping off** (true freeze with additive input). Optionally
  add a tiny DC leak that builds up and triggers o/flo after minutes, for authenticity.
- **Room A1/A0**: 4 lines, short (8-40 ms), with **low input diffusion and low mixing density** so that standing-wave
  colouring rings through. No low filter. A0 = A1 with the output top-end shelf about 2-3 dB brighter.
- **Room B1**: a dense diffuser chain with constant echo density. Map decay 0-9.9 to T60 0.05-0.7 s and scale the
  delay lengths by the decay, so the size seems to grow with it.
- **Hall C1**: a tap-delay early-reflection pattern (about 12 taps, 15-90 ms, strong, panned L/R) feeding the FDN.
  **Hall B3**: the same with ER taps about 8-10 dB lower. **Hall A1**: no low filter and fewer modulated lines, so
  the decay is slightly grainy.
- **Plate A1/B1**: heavy input diffusion (6-8 all-passes) and short lines, so echo density builds fast. No ERs.
  B1 uses different line lengths and slightly less HF damping.

**Non-linear family (Nonlin 1/2, Image P1, Reverse 1/2)**: build these as **sparse FIRs** (about 200-400 taps per
output, random times over a window of length W) fed through 2-3 all-passes. This is how such "gated" programs are
generally made [Eng].
- Map the uncalibrated decay to W ≈ 0.07 s × decay (decay 4.0 → about 280 ms, 9.9 → about 700 ms) [Eng; tune against
  real-unit impulse responses].
- **Nonlin 2**: tap gains follow an almost flat envelope (about −3 to −6 dB across W) with slight random variation. In
  the last 10-15 % of W they fall off a steep raised-cosine edge (about −60 dB within 20-40 ms). Use different random
  taps for L and R, plus the high filter as a 1-pole LPF on the tap sum.
- **Nonlin 1**: out 1 = dense taps plus diffusion, out 2 = about 30 sparser discrete taps. No filters.
- **Reverse 1/2**: tap gains rise (exponentially, about +20-30 dB over W), then stop abruptly. Reverse 1 is out 1
  diffuse and out 2 discrete. Reverse 2 has stereo dense taps and a high filter.
- **Image P1**: Nonlin-style taps with W from 5 ms to 0.6 s. Tap pan moves linearly from L to R across W.

**Delay-based programs**
- **Delay**: out 1 = dry (through the converter model). Out 2 = the delay line with D = predelay ms (max 1630). The
  feedback gain is fb = decay/9.9 × 0.95 [Eng: uncalibrated]. 0.0 = one repeat. No filters, no modulation.
- **Echo**: two independent delay lines (A: max 1.2 s, B: max 0.4 s, using the 128 K memory). Each has its own predelay
  (= time) and decay (= feedback, as above). Put the low shelf (350 Hz) and HF damping in each feedback path. Out L = A,
  out R = B. A/B keys choose which line the panel edits.
- **Chorus**: 5 taps at k·s (k = 1…5, s = predelay 1-50 ms). Each tap moves by a smoothed random signal (about 0.5-3 Hz),
  with depth = decay/9.9 × about 5 ms [Eng]. Pan the voices −1, −0.5, 0, +0.5, +1. HF filter on all voices. Do not
  normalise the sum: the original overflows.
- **Freeze**: a circulating buffer of about 1.6 s with a crossfaded loop (or an FDN with g = 1 and no damping).
  0.0 clears the buffer, 0.1 adds input and holds, ≥ 0.2 holds and blocks the input.

**Calibration targets**: commercial impulse-response sets of real units exist (for example the "Townhouse RMX" library
announced on gearspace) and could be used to tune ER patterns, the Nonlin W mapping and the HF damping.

## 7. Sources actually read

1. *The RMX 16 Digital Reverberation System, User Manual 527-030 Issue 3* (AMS Neve, 2000), OCR via
   https://archive.org/stream/manualzilla-id-5853972/5853972_djvu.txt (item https://archive.org/details/manualzilla-id-5853972).
   Used p.1 (panel drawing legends), 5-7 (overview), 8-9 (rear, fuses), 10-15 (operation), 17 (theory), 19-21
   (maintenance, card list), 23-25 (specs), 29-32 (program notes), 33 (filter characteristics), 35-41 (remote and
   wand), 42-44 (extra programs).
2. *RMX16 Digital Reverberation System User Manual Issue 1* (AMS Neve, 2014, plug-in), OCR via
   https://archive.org/stream/manualzilla-id-5674578/5674578_djvu.txt. Used p.3 (intro), 7-12, 13-16.
3. P. White, "AMS RMX-16 Digital Reverb", *Home & Studio Recording*, Mar 1984, pp.32-33,
   https://www.muzines.co.uk/articles/ams-rmx-16-digital-reverb/1337 (1984 program order, 64 KB memory, 810 ms delay,
   12+2-bit converter).
4. C. Maillard, "Profile", *Sound Engineer and Producer*, Nov 1986, pp.46-48,
   https://www.muzines.co.uk/articles/profile/13752 (company history, users).
5. *IM&RW* "Track Record: Lessons In Love" https://www.muzines.co.uk/articles/track-record-lessons-in-love/11027 and
   "Track Record: Bowie & Jagger" https://www.muzines.co.uk/articles/track-record-bowie-and-jagger/5113.
6. M. Jenkins, "Digital Reverb Guide", *Sound On Sound*, Jul 1987,
   https://www.muzines.co.uk/articles/digital-reverb-guide/2474 (notes that MIDI was later offered for the RMX16).
7. User photos: https://fr.audiofanzine.com/reverb/ams-neve/RMX-16/medias/photos/ (images on medias.audiofanzine.com,
   e.g. `img/pictures/normal/6/2/6201809.jpg` (display `1 0 4.8 0 +4 t AMBIENCE`), `6253452.jpg` (NONLIN 2),
   `6284361.jpg` (16 DELAY), `6253750.jpg` (17, level block, pot), `6325765.jpg` (keys), `6325766.jpg` (rear)).
8. Search-result snippets only (pages not reachable): gearspace "AMS RMX-16 Non-Lin" thread (snare settings), UA and
   sonicscoop pages about the 18-program Expanded set.

Not reachable from this environment: archive.org PDF and page-image hosts (data nodes), media.uaudio.com (UA Expanded
manual), ams-neve.com (500-series manual), barryrudolph.com (another copy of Issue 3), soundonsound.com and
gearspace.com.

### Open questions
- Exact sample rate (we infer about 40 kHz) and the launch year (the 1981/82 in the brief is unconfirmed here).
- Factory default values for each program, and the max predelay for Hall C1, Nonlin 2 and Reverse 1.
- How 1.63 s delays appear in a 3-digit predelay field.
- What positive high-filter settings do.
- The numbering of programs 10-18 on units that have them.
- Whether Reverse 1 has filters.
