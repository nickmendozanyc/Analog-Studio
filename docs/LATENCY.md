# Latency: the top priority of the final build

**Status: requirement. Priority above every other feature, look or optimisation.** If a change makes the app look
better or adds a feature but adds latency, the change loses. This applies to the native macOS build; the browser
mockup cannot meet it (Web Audio adds 10–40 ms the page cannot control) and is not measured against it.

Why it matters more here than in most DAWs: JH-Studio works like a tape machine. You overdub while hearing the
tape (sync-head monitoring) and punch in on the fly; nothing is fixed afterwards. Any lag between playing and
hearing breaks the instrument.

## Internal latency (inside the app)

| Requirement | Target |
|---|---|
| Processing latency added by the app | at most 1.5 ms (one buffer); nothing else on the path |
| Buffer size | 32–64 samples at 48 / 96 kHz, stable with the full studio running (24 tracks, console, rack) |
| Audio thread | real-time priority; never allocates, locks, logs, or touches files or the UI |
| Built-in models (JH-Tape, JH-Mix, dbk 160X, reverbs, delays) | zero look-ahead, zero added latency |
| Only intentional delay | the tape machine's record-to-repro head gap at the selected speed (it is the sound); sync-head monitoring removes it while overdubbing, as on the real machine |
| Third-party plugins (VST3 / AU) | reported latency compensated automatically (plugin delay compensation), shown per slot; anything with look-ahead is flagged |
| Input monitoring while recording | direct path at the smallest buffer; heavy processing kept off it |

## External latency (interface, outboard, sync)

| Requirement | How |
|---|---|
| True round-trip measured, not assumed | loop-back "ping" through the TASCAM Studio Bridge (out → in), converters and driver included; recordings aligned to the sample |
| Hardware inserts | each send / return pinged and compensated, so real outboard patched on an insert stays in time |
| Time code and the capstan reference | stamped against the audio clock, never the screen (as the quartz lock and the Delta-Three already are); MTC out uses driver timestamps |
| Sync accuracy | Delta-Three tight lock 0.003 frame; MTC out jitter well under 1 ms |
| Visible numbers | the top bar shows buffer, input, output and measured round-trip latency |

## How it is checked

- A latency test runs in CI on the native build: render a click through the full chain (tape, console, rack) and
  confirm zero added samples beyond the documented head gap.
- A loop-back test on real hardware before each release: round-trip within the interface's specification.
- Performance budget: the full studio must hold 32 samples at 48 kHz on the reference Mac without dropouts.
