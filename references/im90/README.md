# Studio reference: Publison Infernal Machine 90 (IM90) "Stereo Audio Computer"

Research notes for building our own unit that looks, works and sounds like the Publison Infernal Machine 90: a French
two-channel digital delay, echo, pitch shifter, reverb and sampler from the mid 1980s. Everything below is written in
our own words. The manual and magazine scans are copyrighted, so they are **not** committed here. Fetch them from the
URLs in section 6.

Citation keys:

- **UG x-y** = page x-y of the English *Infernal Machine 90 User Guide*, "summary of the English edition", dated
  8 April 1987 (archive.org item `publison-infernal-machine-manual`). Publison numbered each chapter by function, so
  for example "UG 9-17" is page 17 of the Function 9 chapter. The chapters are "F" (calling a function), "P" (setting
  parameters) and "M" (memories), then one per function. The only text we could read is a poor OCR layer, so a few
  names and labels are partly illegible, and this file marks each one.
- **dB83** = *dB Magazine*, October 1983, AES show report (DHM 89 B2 and KB 2000).
- **dB80** = *dB Magazine*, May 1980, London AES report (DHM 89 B2 with KB 2000 photo caption).
- **MVS86** = *Music Video Systèmes* no. 4, October 1986 (French), AES/Paris show report.
- **Mâche** = François-Bernard Mâche's chapter in *From Xenakis' UPIC to Graphic Notation Today* (ZKM / Hatje Cantz).
- **[Web]** = a fact seen only in web-search snippets of a page we could not open from this environment (see section
  6). Treat it as secondary.
- **[Engineering note]** = our own analysis or assumption, not a source fact.

---

## 1. What it is, history and context

### 1.1 The machine

- The IM90 is a 19-inch rack processor with **two independent DSP channels, A and B**. Each channel can run its own
  "function" (delay, echo, pitch shift, reverb or sampler) with its own parameters, or both channels can run the same
  function as a stereo pair (UG F-1, M-1).
- Publison called it a "Stereo Audio Computer". In the manual it is "the INFERNAL MACHINE" (UG throughout).
- **Introduced around 1984.** A Czech broadcast-engineering report on a 1984 AES convention lists the "PUBLISON model
  Infernal Machine 90" next to the Lexicon 224XL and Eventide SP2016, as a processor that could also work as a digital
  recorder and time compressor (Technické informace no. 48, May 1984). By October 1986 it had gone "from MIDI to
  MIDI/SMPTE" and "speaks three languages" (MVS86). In other words, the menu language could be chosen; Function 50 appears to
  be language selection (UG F-2, partly illegible). The last firmware revision dates from 1989 [Web: gearspace].
- **Price:** very expensive. A French forum post remembers 78,000 FF [Web: audiofanzine Altiverb thread]. A 1991 UK
  magazine called it a "£40K machine" that could pitch-shift and time-stretch a whole mix (CU Amiga, Dec 1991, on
  archive.org). The second figure was probably exaggerated.

### 1.2 Publison and the model line

- **Publison Audio Professional**, Paris (one address printed in 1986 ads is 18 avenue de la République). The
  engineer credited with the machines in the trade press is **"Peter" (Pierre) Dean**. He demonstrated the
  DHM 89 B2 at the 1980 AES (dB80), and MVS86 credits him with the Infernal Machine 90. Web sources also name the designer
  **Philippe Petitdemange**, who did the design from 1983 to 1984 and the DSP updates up to 1989 [Web: matrixsynth]. A 2025 ENS
  Louis-Lumière thesis by Naudin, *Publison et l'Early Digital en France*, describes the development history and
  reverse-engineers the IM90 DSP. We could not open it, and it is the best next source (section 6). Publison later
  made disk-based editing workstations (the "TotalStation" and "Océane" systems in the 1990s, *Pixel* no. 32, 1997) and
  went bankrupt in the late 1990s [Web].
- **DHM 89 B2** (about 1979–80): a stereo digital delay and pitch shifter ("harmonizer") in a rack. In 1980 it stored about
  **1.2 s** (dB80; *Boston Phoenix* 18 Nov 1980). By 1983 the report lists dual delays up to **5000 ms**, dual pitch shift
  from −2 to +1 octave, dual automatic arpeggio, dual "reversed sound" (a backwards-tape effect) and a "memory latch"
  (infinite repeat of a captured sound). Its converters were **16-bit floating-point** at **52.91 kHz** (dB83). Short and
  long memory versions were sold ("temps court" in French classified ads, MVS no. 5, Nov 1986). Studios used it for
  octave doubling (RE/P Aug 1983).
- **KB 2000** (about 1980): a 3-octave piano-key controller for the DHM. It had a panel with a three-voice chorus,
  "reverse synchronisation", a "memory synthesizer" that played the captured sound from the keys, two envelope
  generators, dual evolving vibrato, and glissando and sustain modes (dB83). Mâche, who used the DHM 89 B2 + KB 2000 pair in
  *Aulodie* (1982), calls it the first sampler and notes that it could change pitch and duration separately.
- **IM90** (1984): the successor. It is a single rack unit with MIDI in place of the KB 2000, a full-time-domain sampler
  ("Function 9"), parametric and preset reverb, 400 memories, and options for **long memory**, **SMPTE/EBU**, **RS-232** and a
  **remote control**. Variants seen on the market: MIDI-only, with remote, with SMPTE, and with extended memory [Web: gearspace].

### 1.3 Famous users and uses

- **Prince**: the sped-up "Camille" vocal persona during the *Sign o' the Times* sessions is widely credited to the IM90
  [Web: equipboard, guitarcloud]. Primary interviews disagree about tape varispeed versus Publison, so treat the
  attribution as folklore.
- **Stock Aitken Waterman / PWL**: the *PWL From the Factory Floor* book has a section titled "The Publison sampler –
  The Infernal Machine 90". PWL sampled whole stereo chorus blocks into it from an aux send and triggered or looped
  them over MIDI, for vocal stutters and for flying in choruses (archive.org snippets).
- Others mentioned in print or online: Chris Lord-Alge, who calls it one of his favourites (*Music Producers*, 1992); hip-hop
  producers who pitched samples into key with it (*Check the Technique* vol. 2); Al Jourgensen, Paul Humphreys and Ed Cherney
  [Web]. Film and video post used it to shift sound against picture under SMPTE control (UG 1-1).
- **The "feel"**: it is immediate. You type a function number and a value, and it is musical at once. The pitch shifter is
  very clean for its time, with selectable splice algorithms. It can capture a phrase in real time and then repitch,
  reverse, loop or retrigger it from the input signal or from a keyboard. The reverbs are dense and dark. Audio Ease
  sampled them for Altiverb in 2017 [Web].

---

## 2. Specifications

| Item | Value | Source |
|---|---|---|
| Channels | 2 independent processing channels (A, B), usable as a stereo pair | UG F-1 |
| Sample rate | **50 kHz** | UG 4-1 ("50,000 samples per second"), UG 9-1 |
| Word length | **16-bit** (linear per a user review) | UG 9-1; [Web: audiofanzine review] |
| Dynamic range | **95 dB** (the reverb chapter calls this the A/D range) | UG 9-1, UG 8-4 |
| Frequency response | Stated in UG 9-1, but the figure is partly illegible ("20 … frequency response"). Probably 20 Hz–20 kHz | UG 9-1 |
| Memory, "short" option | 8,388,608 bits = 524,288 16-bit words. **5.24 s per channel** (2 × 5.24 s) | UG 9-1, 1-1 |
| Memory, "long" option | 33,554,432 bits = 2,097,152 words. **20.93 s per channel** (2 × 20.93 s) | UG 9-1, 1-1 |
| Delay range | 0.04 ms (two samples) to 5242 ms (short) or 20,930 ms (long) | UG 1-1 |
| Echo loop time | same range as the delay. Feedback 0–99 % (digital) | UG 2-1 |
| Pitch ratio | 0.250 to 2.000 (−2 octaves to +1 octave), shown as a decimal ratio with 3 decimals | UG 4-1, 4-2, 9-26 |
| Speed ratio (sampler) | 0.250 to 4.000 | UG 9-27 |
| Samples | up to 99 sounds per recording session, limited by memory | UG 9-6 |
| Memories | **400** non-volatile "function memories", shared by channels A and B | UG M-1 |
| Preset reverbs | 52 factory programs (Function 7) | UG 7-1 |
| MIDI | MIDI In (receiver), channel 1–16, up to 8-voice polyphony across chained units (two voices per unit) | UG 4-3, 4-4 |
| Options | SMPTE/EBU interface board (functions 60–66), RS-232 terminal/computer control, remote control (needs an interface card in the unit, the remote head and a long multi-pin cable) | UG F-2, P-1; [Web: gearspace] |
| Audio I/O | XLR. **2 inputs (A, B), 4 outputs** (two per channel: the manual refers to "output no. 1" of a channel, and the reverb has separate left and right outputs) | UG 1-1, 8-2; [Web: inside blackbird, audiofanzine] |
| Audio-trigger threshold | −40 dBm at 0 dB input gain. It moves from −50 to +20 dBm with the input gain | UG 9-18 |
| Rack size | 19-inch, reported as **3U** | [Web: audiofanzine review] |
| Storage | none. Memories are battery-backed internal RAM; no floppy has been reported | UG M-1 (non-volatile) |
| Power, weight | not found | — |

**[Engineering note]** The memory sizes match powers of two exactly. 262,144 words per channel at 50 kHz is 5.243 s.
1,048,576 words per channel would be 20.97 s, but Publison quotes 20.93 s, so about 2,000 words per channel are
probably reserved. The 40 µs minimum delay is two samples at 50 kHz.

---

## 3. Hardware (for drawing)

Warning: we could not download any photos from this environment (section 6). The layout below combines the manual's
key and display names with secondary descriptions of photos. Check it against real photos before finalising the art.

### 3.1 Main unit front panel

The secondary descriptions agree on a black 19-inch front panel with three zones, left to right [Web: inside blackbird,
vintagedigital, eBay listings]:

1. **Left: level meters.** Vertical LED bargraph "scales" for channels A and B, marked in dB. The manual has you set the
   input to read about **0 dB** on the A (and B) input scale before sampling (UG 9-2, 9-11). Some descriptions mention
   input and output meters for both channels. **[Engineering note]** Draw 2 or 4 vertical columns of about 12–16 LEDs each,
   green below 0 dB and red above.
2. **Centre: displays and soft-key row.**
   - **Blue alphanumeric display(s)**: the manual says "the blue display of the A channel". The parameter lines it shows
     are **32 characters wide** (the manual shows a placeholder row of 32 characters). In two-channel work it shows one line
     for A and one for B. It also has a **graphic mode** that draws the sample memory as a character bar (see 4.6).
     The colour is given as blue in the manual. One secondary source says "LCD", but a blue display of that era is most
     likely a **vacuum-fluorescent (VFD) dot-matrix** unit. **[Engineering note]** Draw two 1×32 (or one 2×32) blue-cyan VFD
     lines on a dark smoked window.
   - **Memory-number displays**: the memory number for channel A is shown on a **red 7-segment LED display** and channel B
     on a **yellow** one (3 digits each, 1–400) (UG M-1).
   - **A row of 8 red oval membrane pads** under the display strips [Web: inside blackbird]. The manual names these
     front-panel keys: **FUNCTION** (with LED), **PARAMETER** (with LED: steady means numeric mode, blinking means
     increment/decrement mode), **USER GUIDE**, **SET A** (LED), **SET B** (LED), **MEMORY SELECT** (LED), **MEMORY IN**,
     **MEMORY OUT** (LED, toggles) and **AUX**, and it also mentions a **GAINS** key for the input gain (UG F-1, P-1, M-1, 9-18).
     **[Assumption]** The 8 pads are FUNCTION, PARAMETER, USER GUIDE, SET A, SET B, MEMORY SELECT, MEMORY IN and
     MEMORY OUT, with AUX, GAINS and ENTER on the keypad block.
3. **Right: data-entry keypad.** Digits **0–9**, **ENTER**, **"+"** and **"−"** (UG P-1, P-2). The keypad is also the
   speed control in increment mode (see 4.2). The manual implies a decimal entry for some values: you key "0,45" for a
   reverb coefficient, but "1 0 5 9" for a pitch ratio of 1.059, so the decimal point may be implied.
- Power switch: position not documented.

Colours, as described: a black panel, white or light-grey legends, red oval membrane keys, blue display, and red and
yellow LED numerals.

### 3.2 Remote control (option)

- A separate hand-held or desktop box in **blue and black**, with a **numeric keypad**, a **display**, and a long fixed
  multi-pin cable to a connector on the rear of the unit [Web: eBay listing, gearspace].
- Its key feature is an **endless rotary encoder with optical encoding** (UG P-2 calls it "the numeric potentiometer of
  the remote control"). Turning it clockwise raises the selected parameter and counter-clockwise lowers it, and the change
  speeds up with turning speed. It only works when the PARAMETER LED is steady, which is numeric mode. Turning it also
  confirms a newly typed value (UG P-1, P-2, 9-24).
- The manual says values can be keyed "on the numeric keyboard of the machine or of its remote control" (UG P-1).
- Reissue remotes have been sold on eBay ("IM90 Infernal Machine Remote Controller reissue").
- **[Engineering note]** For the app, draw a small wedge box: a 2-line blue display mirroring the unit's display, a
  12-key pad (0–9, +, −), ENTER, AUX, and a large knurled encoder knob. The exact remote key set is **unknown**.

### 3.3 Rear panel

Documented or reported: XLR inputs A and B, XLR outputs (4), MIDI In (the manual only describes reception), and option
connectors for SMPTE/EBU (LTC in), RS-232 and the remote (multi-pin). Mains IEC inlet and fuse: assumed.

### 3.4 Photos (not viewable from here)

- https://www.vintagedigital.com.au/publison-infernal-machine-90/ (main unit and history)
- https://vintagedigital.com.au/?p=144622 and https://www.vintagedigital.com.au/brand/publison/
- https://retrogearshop.com/products/publison-infernal-machine-90-stereo-audio-computer-im90-with-remote-control-rare-vintage-effect (unit with remote)
- https://www.ebay.com/itm/177184370216 (unit with remote) and https://www.ebay.com/itm/116824078807 (reissue remote)
- https://reverb.com/item/4424489-publison-infernal-machine-90-im90 and https://reverb.com/item/52525911-publison-infernal-machine-im90
- https://blog.insideblackbird.com/the-publison-infernal-machine-90-agent-provocateur-of-innovation-and-sound-exploration
- https://gearspace.com/board/high-end/606-publison-infernal-machine-90-a.html (pages 1–2: owners' photos, internals)
- https://www.preservationsound.com/the-publison-infernal-machine-dhm-89-b2-highly-advanced-signal-processorsampler-c-1978/ (DHM 89 B2)
- Huber, *Audio Production Techniques for Video*, Fig. 5-50 (IM90 product photo, archive.org `audioproductiont0000hube`, borrow only)
- dB Magazine May 1980 (DHM 89 B2 + KB 2000 photo), archive.org `DB_Magazine_1980_05`

---

## 4. Operation

### 4.1 General model: channel, function, parameter, memory

- **Choose the channel(s)** with **SET A** and **SET B**. Each press toggles a key's LED. A command goes to every channel
  whose SET LED is lit, so with both lit it goes to both (UG F-1).
- **Call a function**: press FUNCTION, type its number, then PARAMETER. As a slower route, press ENTER after the number to
  see its name first ("04 = PITCH-SHIFTING"), then press PARAMETER (UG F-1). **USER GUIDE** (pressed after FUNCTION)
  scrolls through the function list, about 2 s per entry. "+" and "−" step through it, and another key stops the scroll
  (UG F-1, F-2).
- **Function list** (UG F-2; the OCR is poor, and names marked ? are our reading):
  - 01 DELAY, 02 ECHO, 04 PITCH-SHIFTING, 05 ? (possibly an auto-pitch or "tracking" function)
  - 07 REVERBERATION PRESET PROGRAMS, 08 PARAMETRIC REVERBERATION
  - 09 HANDLING OF MEMORIZED SOUNDS (the sampler)
  - 50 LANGUAGE SELECTION (?)
  - 60–66: SMPTE/EBU functions (synchronised programming, real-time offset, event lists, display mode). These need the
    SMPTE/EBU board.
  - No 03 or 06 is listed in the 1987 guide.
- **Parameter pages**: a function's parameters sit on a sequence of one-line pages. "+" goes to the next parameter and "−"
  to the previous one, and the parameter being edited **blinks** (UG P-1).
- **Two editing modes**, switched by the PARAMETER key (UG P-1, P-2):
  - *Numeric* (LED steady): type a value. ENTER, "+", "−", leaving the page or turning the remote encoder confirms it. A
    value out of range shows a "TOO HIGH" or "TOO LOW" message for about 1 s, and the value is clamped to the limit.
  - *Increment/decrement* (LED blinking): "+" or "−" changes the value by one step. A digit **1–9 starts a continuous ramp**
    at that speed (1 slowest, 9 fastest). "−" reverses the direction and **0 stops** it. The value stops at its limit.
  - Function 9 adds a third, **graphic** state (see 4.6).
- **Memories** (UG M-1, M-2): 400 slots shared by A and B. **MEMORY SELECT** makes the red (A) or yellow (B) number
  blink. Type a number and press ENTER, or step with "+" and "−". **MEMORY IN** stores the current function and all its
  parameters into the selected number on each selected channel. The manual warns against overwriting a slot, and against
  storing both channels into the same number. **MEMORY OUT** is a toggle: while its LED is lit, the selected memory
  loads straight away, and so does any newly selected number (live browsing).

### 4.2 Function 01: Delay

One page shows "DELAY = 49,00 ms" (comma decimal). The range is 0.04 ms to the memory limit. Changing the delay
**crossfades** from the old delay to the new one, so a change is nearly inaudible (UG 1-2). The manual's uses: mic
time-alignment (2.94 ms per metre), phasing (0.04–10 ms), double or triple voices (10–150 ms, with A and B set
differently), "space" effects (150–500 ms), lip-sync for picture, and loudspeaker alignment.

### 4.3 Function 02: Echo

Page "ECHO LOOP = … ms  FEEDB = …%". The digital feedback runs 0–99 % and has a flat frequency response, so it can be set
very high without howling. At high feedback the output can grow louder than the input (UG 2-1). Suggested uses:
stronger phasing (0.04–10 ms, 50–99 %), a "tube" sound (5–100 ms, 85–99 %), spaces (100–1000 ms, 50–90 %), and an
"accumulator" (1 s or more at 99 %, sound-on-sound).

### 4.4 Function 04: Pitch shifting (harmonizer)

The pages, in order (UG 4-1 to 4-7):

1. `PITCH-RATIO=1,260 DEL=…ms`: the output/input frequency ratio, 0.250–2.000. The manual gives the semitone ratios
   (equal temperament). **Added delay**: from 1 ms to the memory limit. The true delay wanders by up to about **15 ms**
   around the shown value, because of how the shifter works.
2. `PITCH-ALGO=n FOR …`: four splice algorithms, each for a type of sound: **1 human voice A**, **2 strings (?)**,
   **3 human voice B**, **4 complex sounds**. You choose by ear.
3. MIDI CHANNEL (1–16), MIDI VOICE No. (which polyphony voice this channel plays), POLYPHONIC TOTAL VOICE NUMBER
   (default 2, i.e. A and B of one unit). Up to 8 voices with four units. The rules: the lowest free voice gets each new
   note, notes beyond the voice count are ignored, voices free up on note-off, and in single-voice mode the newest note
   always plays (last-note priority).
4. `VIB F=…Hz DEP=… DEL=…s M=…`: the **evolving vibrato**, a sine FM of the pitch ratio. F is 0.1–50 Hz, depth 1–99, and
   delay 0.0–9.9 s. Mode 0 is a delayed vibrato (it fades in after the delay). Mode 1 is an "appoggiatura" (vibrato at the
   attack that stops after the delay). Each MIDI note or an **AUX** press restarts the vibrato.
5. `ARPEGGIO FEEDBACK=…%`, 0–99 %: the shifter output is fed back to its input through the added delay. Each repeat is
   one more pitch step up or down, giving rising or falling "arpeggio" echoes. Example settings: 80 %, ratio 1.059,
   100 ms for a rising semitone arpeggio. 98 %, 1.003, 10 ms gives a continuous upward "rocket" sweep.
6. **MIDI play**: the note sets the pitch and the sound is muted on note-off. AUX brings back the sound at unity level,
   at the last pitch.

### 4.5 Functions 07 and 08: Reverb

- **07 Preset**: `REVERB 38=CONCERT HALL B EDI=0`. There are 52 programs, named by space type with a letter variant
  (A–D) that changes the decay time. Legible names include concert hall, plate, chamber, church/cathedral and rooms.
  Setting EDI=1 opens the program's parameters as Function 8, and the result can be stored in a memory (UG 7-1, 7-2).
- **08 Parametric** (UG 8-1 to 8-6). Calling it loads a "concert hall with damped trebles".
  - SIZE in 13 steps, from 1 m³ to 1,000,000 m³. Smaller rooms give a denser early response, and 1–30 m³ gives tube
    or tunnel sounds. Changing the size rebuilds all the delay lines, so **the output drops out briefly**.
  - DECay 0.1–200 s (to −60 dB). The allowed range depends on the size.
  - BASS COEF 0.25–4.00 (the low-band decay relative to 1 kHz, with a crossover of about 300 Hz). TREBLE COEF 0.25–1.00
    (above about 5 kHz). Natural values are 1.0 for bass and 0.4–0.6 for treble.
  - **Four pre-reflections**: R1 and R3 go to the left output, R2 and R4 to the right. Each has a delay of 1–999 ms and a
    level of 0–99 dB attenuation. R4's delay is also the **pre-delay** of the reverb tail.
  - REVERBERATION ATTENUATION 0–99 dB. 99 dB removes the tail completely and leaves a four-tap **ping-pong delay**.
  - The two outputs are decorrelated. Taps less than 30 ms apart on one side sound metallic.

### 4.6 Function 09: Sampler ("handling of memorized sounds")

**Workflow for capturing a single phrase on channel A** (UG 9-2 to 9-4, paraphrased):

1. Pick the memory slot that will hold the sample's parameters: SET A only, MEMORY SELECT, type 301, ENTER. The red
   display shows 301. Each later sample uses the next slot (302, 303, …), so you leave a gap between the A and B ranges.
2. FUNCTION, 9, PARAMETER. The display shows the record-start page `2=START BY AUX  RECORD SAMPLE 1`. Mode 2 is also a
   safe waiting state for setting the input level.
3. Feed the source and set it to about 0 dB on the input meter (at the source or with GAINS).
4. Mute the source (the phrase has to start after silence). Key **0**, ENTER, and the page changes to
   `0=IF A TRIGGER  RECORD SAMPLE 1`.
5. Play the phrase. Recording starts at the first signal, and the display switches to **graphic mode**: a bar grows
   left to right across the 32-character line, and dots on the right show the empty memory.
6. Either let the memory fill, and the unit then drops straight into playback, or press **AUX** to stop. The unit then
   waits on `AUX=NEW SAMPLE  PARAMETER=PLAY`: AUX arms the next sample (the number goes up to 2) and PARAMETER goes to
   playback. Pressing AUX twice moves straight on to the next sound. Up to 99 sounds can be stored.

**Record options** (UG 9-14 to 9-16): the start modes are 0 (signal on input A), 1 (signal on input B) and 2 (AUX key).
For a tight stereo capture, both channels can trigger from input A. The stop modes are 1 (AUX key, the default) and 0
(after a set time, shown as `20930,00ms=RECORD TIME SAMPLE`, which defaults to the maximum). You can also re-record one
sample in place (`RECORD AGAIN SAMPLE 4 ? 0=NO`), and later record into the remaining blank memory (`EMPTY MEMORY
RECORD ?`), which continues the sample numbering (UG 9-28).

**Playback display**: PARAMETER cycles through three states (UG 9-16, 9-17):

- numeric display with numeric entry (LED steady);
- numeric display with increment/decrement (LED blinking);
- **graphic** with increment/decrement. The line is a map of the whole memory. `S` marks the start point and `E` the end
  point (the one being edited blinks). Short vertical bars are the current sample's area, horizontal bars are other
  samples, dots are blank memory, a raised bar is the moving play cursor, and the sample number is shown at the right.

**Playback (reading) modes**, on the `MODE=` page (UG 9-17 to 9-22):

- **0 LOOP**: plays continuously from S to E with a fixed **≈3 ms crossfade** at the joint. The manual says longer
  crossfades phase and shorter ones click. For clean short loops, make the loop length a whole number of pitch periods, and
  set SPEED-LINK=1 so the length stays exact. Loops under about 200 ms sound mechanical, and vibrato softens them. MIDI
  changes the pitch but does not restart the loop. With SET A and SET B both lit, the two loops restart together and the
  shorter one is the master.
- **1 INPUT SOUND TRIGGER (A)**: an input signal above the threshold restarts the sample from S, which then plays once
  to E. This is the classic "drum replacement" or "trigger a vocal from a click track" use. MIDI can still set the pitch.
- **2**: the same, triggered from input B.
- **3 MIDI KEY SAMPLE SELECT** (the default after recording): the lowest keys of a 5-octave keyboard select samples
  (bottom C = sample 1, C♯ = sample 2, …) without sounding them. The other keys play the selected sample from S, stopping
  at key-up. Unity pitch is the C of the fifth octave (MIDI note 84, as the manual numbers it).
- **4 CHROMATIC STACK**: each sample owns a keyboard zone, from N− (0 to −24 semitones) to N+ (0 to +12) around its
  root. The zones stack left to right in sample order. This gives multisampling with less timbre shift, or a keyboard
  split such as bass, kick, snare and cymbal in successive octaves.
- **AUX** always plays the selected sample from S, whatever the mode.

**Sample parameters** (21 in all, stored per sample; UG 9-1, 9-23 to 9-27):

- `MR FROM 12000,00ms TO 16000,00ms`: start and end points in ms. Setting **start later than end plays the sample
  backwards**, and the cursor then runs right to left. You can audition with LOOP mode, AUX or MIDI.
- Evolving vibrato (the same four parameters as Function 4).
- `S-LINK=0 PITCH=1,059 SPEED=1,000`:
  - **S-LINK=1** ties the speed to the pitch, like tape varispeed. It reads memory linearly, with no splices.
  - **S-LINK=0** sets pitch and speed separately, with SPEED 0.25–4.0. This is time-stretch or pitch-shift with the same 4
    splice algorithms (`PITCH-ALGO`), and it can glitch.
- PITCH-RATIO 0.25–2.0. The MIDI pitch multiplies it.
- ATTACK TIME 0.1–999.9 ms: a linear fade-in from zero at each trigger. 1–3 ms removes clicks, and 0.1 ms keeps
  percussion sharp.
- MIDI channel, voice number and total voices (as in Function 4). With two channels at voices 1 and 2, the unit plays
  2-note polyphony.
- **Choosing a sample** (5 ways): with MEMORY OUT and MEMORY SELECT lit, type its slot number, or step with "+" and "−"
  (each step also plays it); select it from the MIDI keys (mode 3 or 4); or select it by SMPTE (option). A slot that holds
  no sample cannot be called, and the unit jumps to the nearest valid one.

---

## 5. Audio character and modelling recipe

### 5.1 What the sources say

- 50 kHz, 16-bit. The manual quotes 95 dB of dynamic range, and a user review calls the converters 16-bit linear. The
  DHM 89 B2 before it used 16-bit *floating-point* (gain-ranged) conversion at 52.91 kHz (dB83).
- The pitch shifter is a **variable delay read at a different rate (Doppler)**. A **phase analysis** of the signal decides
  when to pull the read point back towards the mean delay, so the jump lands where the waveform lines up and the glitch
  is small. The delay drifts by up to about 15 ms around its mean. There are four tuned variants (UG 4-1, 4-2, 9-25).
- The same splice engine does the sampler's time-stretch when S-LINK=0. With S-LINK=1 the read is linear, like tape.
- The loop joint uses a 3 ms linear-looking crossfade. Changing the delay crossfades between the old and new delay.
- The sampler attack ramp is linear, at least 0.1 ms.
- Feedback (echo and arpeggio) is digital and flat. Through the shifter it gives the famous rising or falling cascades.
- The reverb has 4 discrete early taps, a decorrelated stereo tail, and frequency-dependent decay for the bass
  (crossover about 300 Hz) and treble (crossover about 5 kHz).
- The ENS thesis figure list mentions "interpolation calculations in the DSP of the Infernal Machine 90, late 1985"
  [Web], so the read pointer uses some fractional-sample interpolation.

### 5.2 Recipe for a digital model **[Engineering note: assumptions are marked]**

1. **Run the core at 50 kHz.** Resample from the host rate in and out. Hard-clip at 0 dBFS, and set the input scale so the
   panel's 0 dB is about −12 dBFS (*assumed* headroom).
2. **Converters**: quantise to 16 bits with a little TPDF dither. Add a noise floor at about −95 dB re full scale
   (white, then shaped by the reconstruction filter). Optionally add a gain-ranging "DHM mode" with a 12-bit mantissa and
   3 gain steps for the older unit (*assumed* mantissa size).
3. **Anti-alias and anti-image filters** (*assumed*, typical of 1984): an analogue 7th-order elliptic low-pass at about
   20 kHz (0.1 dB ripple, about 70–80 dB stopband from 25 kHz) on both input and output. This gives slight ripple near
   20 kHz and some group-delay smear at the top. There is **no** digital oversampling.
4. **Memory**: one circular buffer per channel of 262,144 samples (short) or 1,046,500 samples (long, 20.93 s).
5. **Pitch shifter** (time-domain splice):
   - Use a single read head that moves at `ratio` samples per output sample, through a delay `d(t)` that drifts by
     (1 − ratio) samples per sample.
   - When `d` leaves the window [D − W/2, D + W/2] (D is the added delay, with a minimum of about 1 ms, and W is about
     15 ms, from UG 4-1), jump by a whole number of pitch periods. Choose the jump with a normalised cross-correlation search
     between the current read segment and candidate segments one window away. Search span: about 20 ms for "voice A" and
     "voice B" (different search resolutions or periodicity limits), shorter for "strings", and no search (blind jump) for
     "complex".
   - Crossfade the two heads over about 3–5 ms with equal power (*assumed*; the 3 ms loop crossfade is the documented
     anchor).
   - Interpolate the fractional read position **linearly** (*assumed* from the 1985 thesis figure). This gives mild
     high-frequency loss and aliasing when shifting up. Do not add an anti-alias filter before upward shifts; the original
     probably had none, and the slight fizz is part of the sound.
   - Ratio range 0.25–2.0, with a 3-decimal display resolution.
6. **Arpeggio**: add the output, times the feedback (0–0.99), into the shifter input after the added delay.
7. **Vibrato**: a sine LFO multiplying the ratio, with depth 1–99 mapped to about ±0.5–±50 cents (*assumed* mapping;
   the manual gives only the 1–99 scale). Add a delay or appoggiatura envelope, retriggered by MIDI note-on or AUX.
8. **Sampler**: linear (S-LINK=1) or splice (S-LINK=0) reads over [S, E], forward or reverse. Add the 3 ms loop
   crossfade, the linear attack ramp, and an audio trigger with about 10 ms re-arm hysteresis (*assumed*).
9. **Delay and echo**: integer-sample delays (two samples minimum). Crossfade over about 10–20 ms (*assumed*) when the
   time changes, rather than gliding with Doppler pitch.
10. **Reverb**: 4 tap delays plus a feedback-delay-network tail (for example 8 lines with Householder mixing). Size sets
    the line lengths (13 steps). Use separate decay gains below 300 Hz, at mid frequencies and above 5 kHz. Mute for
    about 50 ms on a size change.

### 5.3 Uncertain or unknown

- The exact panel art: key positions, legend wording, VFD or LCD, the number of meters, the colour of the remote, and its
  key list. Get these from photos (section 3.4).
- The exact frequency response, the converter chips, and the analogue filter design. Service docs are not public; owners
  say Publison never published schematics [Web: matrixsynth].
- The internals of the pitch algorithms (window, search span, crossfade shape) are inferred, not documented. The Naudin
  thesis is the most likely source.
- The names of functions 05 and 50–66, the full list of 52 preset names, and the full wording of the frequency response
  are illegible in the OCR we could read.
- Weight, power draw, and whether the XLR connectors are balanced.

---

## 6. Sources

Read in full or in part from this environment:

- **IM90 User Guide** (English, 8 April 1987), archive.org item `publison-infernal-machine-manual`:
  https://archive.org/details/publison-infernal-machine-manual. Only the OCR text could be read (via
  `https://archive.org/stream/publison-infernal-machine-manual/Publison%20Infernal%20Machine%20manual_djvu.txt`); the
  PDF and page images are on archive.org data nodes that this environment blocks. It gave nearly all of sections 2 and 4
  and the documented parts of section 5: the key names, displays, function and parameter ranges, memory sizes, 50 kHz
  and 95 dB, the description of the pitch algorithm, and the full sampler workflow. Coverage: chapters F, P, M, 1, 2, 4,
  7, 8 and 9. It has no hardware or rear-panel chapter.
- *dB Magazine* Oct 1983 (archive.org `DB_Magazine_1983_10`): DHM 89 B2 and KB 2000 features, 16-bit floating-point
  conversion, 52.91 kHz, 5000 ms delay.
- *dB Magazine* May 1980 (archive.org `DB_Magazine_1980_05`): Peter Dean demonstrating the DHM 89 B2, 1.2 s, the
  KB 2000 photo caption.
- *Recording Engineer/Producer* Aug 1983 (archive.org `recording-1983-08`): DHM 89 B2 used for octave doubling, and a
  "Publison with keyboard" in a studio equipment list.
- *Music Video Systèmes* no. 4, Oct 1986 (archive.org `music-video-systemes-004-1986-10`, French): the IM90 credited
  to Peter Dean, the move to MIDI/SMPTE, three languages.
- *Technické informace* no. 48, May 1984 (archive.org `cs-rozhlas-technicke-informace-48-1984-ocr`, Czech): the IM90
  shown at the 1984 AES as a processor that also records and time-compresses.
- Mâche, in *From Xenakis' UPIC to Graphic Notation Today* (archive.org
  `from-xenakis-upic-to-graphic-notation-today-zkm-karlsruhe`): the DHM 89 B2 + KB 2000 as an early sampler, its features,
  and its use in *Aulodie* (1982).
- archive.org full-text search snippets only (the books are borrow-only): Huber, *Audio Production Techniques for
  Video* (IM90 Fig. 5-50, "random access multiple sampling at full bandwidth under MIDI protocol"); *PWL From the Factory
  Floor* (SAW vocal sampling); *Music Producers* (Chris Lord-Alge); *Check the Technique* vol. 2; *CU Amiga* Dec 1991.

Seen only as web-search summaries (the hosts are blocked here; read these directly when network access allows):

- https://en.audiofanzine.com/misc-studio-effect/publison/Infernal-Machine-90/user_reviews/ (16-bit linear, 50 kHz,
  3U, XLR, MIDI, SMPTE)
- https://www.vintagedigital.com.au/publison-infernal-machine-90/ and its scanned user guide, https://vintagedigital.com.au/?p=5640
- https://blog.insideblackbird.com/the-publison-infernal-machine-90-agent-provocateur-of-innovation-and-sound-exploration
  (panel zones, 2 in / 4 out)
- https://gearspace.com/board/high-end/606-publison-infernal-machine-90-a.html,
  https://gearspace.com/board/high-end/611875-publison-infernal-machine-im90-options.html,
  https://gearspace.com/board/high-end/102829-publison-infernal-machine-90-manual.html (options, remote card and cable,
  1989 software, 20 s memory upgrade, an SMPTE/EBU manual exists)
- https://www.ens-louis-lumiere.fr/wp-content/uploads/2026/03/ENSLL_SON_NAUDIN_2025.pdf (Naudin 2025 thesis: history,
  DSP reverse-engineering; **the highest-priority unread source**)
- https://www.matrixsynth.com/search/label/Publison (designer names, no schematics published)
- https://fr.audiofanzine.com/reverb-a-convolution-logicielle/audio-ease/altiverb-7/forums/t.642860,la-reverbe-de-l-im90-gratuite-pour-altiverb.html
  (Altiverb IRs, price memory)
- Savant Audio IM90 plug-in coverage (https://www.gearnews.com/savant-im90-studio/,
  https://www.kvraudio.com/forum/viewtopic.php?t=625168): a modern emulation to compare by ear.
