# Rhythm Sticks — Convo v0.14

**Project:** Rhythm Sticks
**Round:** Version 0.4.0, built from the 22 open notes and your "yes" answers in convo v0.13. You said none of the earlier "done" items showed as done, so I checked each in a headless browser, put the nine notes I had marked done back to open, and built everything that was still missing.

Nothing is marked done in the table. A note is marked done only after you have tried it on the iPad and said yes.

## What was checked and what was built

"Checked" means a headless browser with made-up touches and sound. Nothing is checked on a real iPad.

**Already in 0.3.3, checked again (still open in the table until you say yes):**
1. Echo mic rests after 30 s and wakes on a tap (3ejb1): worked in the browser.
2. Dot loop middle needs two taps (lzggf): worked.
3. Heat dots fade after 3 s (asntq, eu49e): worked.
4. Ripples card is two sentences (2l2ea).
5. Breathing garden: no countdown arc, five-minute sun (z0x5l).
6. Strings: every pluck wakes the sound (qu6gc).
7. One "what this mode does" panel (cqrlt).
8. Two-finger range and colour (172kz). The two-finger mode itself is now new (below).

**Built in 0.4.0:**
- **Two fingers (d63z3, 01kqb):** the shapes design from v0.10. One finger draws a line that plays a melody along its height; a closed loop becomes one long ringing note. Two fingers hold a note by distance. Three fingers make a triangle (a three-note chord). Four make a square (a steady count of four). Two more fingers put down later set the loudness (closer is softer). Trails fade. No split screen. Checked: line, two-finger note, triangle, square (four beats in 1.5 s), loudness pair (0.1 to 0.69), circle.
- **Dot loop (7c93e, ez1s5):** a new ring grows in at the outside and is selected; the other rings shrink toward the middle into small marks (a dot for a beat that is on, a dash for a rest). Checked with screenshots.
- **Echo (qvy34), (a), (b), (d):** it listens more softly (a medium-soft burst that was missed before is now heard 6 of 6 times, and a very quiet one 5 of 6), and a ⚙️ switch "Microphone waits while Echo sings" (on by default) stops it hearing its own sound. (a) a pause before your answer: the score already compares the gaps between your taps, not when you start, so a pause is already fair; I changed nothing there. (c), the mini autograph, is not built (see questions).
- **Heat clef (aqf3j):** a proper treble clef in the same thin stroke.
- **Ripples (epjvo):** up and down now starts on Sustain, even on a device that had saved "None". Rings grow and fade more slowly. Five tones kept.
- **Breathing garden (tf3ru):** tap to breathe in, tap to breathe out, tap again for the next breath (replaces the hold). The last five sessions (date, garden, breaths, longest and average breath) are kept on this device only and listed in ⚙️.
- **Marbles (8kgzh, af0ag, 5j13f, 2b411, 4aj34):** with two fingers, slide up or down for speed, slide left for minor and right for major, pull apart or pinch for bounce. The first clear movement picks which one. More room at the sides, and a marble that gets stuck is nudged and then let go. A switch for each control in ⚙️. Three small gauges show the settings while you change them. Checked: each control, the switches, and 24 marbles all fell out in 12 s.

## Choices I made (you left these open)

- Q6, where the breathing sessions are kept: **this device only.** Nothing is sent.
- Q10, bounce numbers: the default is 0.8 (your number). The range is 0.5 to 1.5. Above 1.0 a marble gains speed at each peg, so I cap its speed to keep it from flying away.
- Q12, toggles: **one switch per control** (speed, mood, energy).
- Mood: right (major) is the same five notes as the default, so right sounds like the default and left is the new minor sound. If you want right to sound different from the default, tell me.

## Questions

1. Dot loop: is the shrunken-ring look right (dots for beats on, dashes for rests), or do you want something even smaller?
  Answer:
2. Two fingers: is "put two more fingers down later" the right way to set the loudness, and is a short pause (a quarter of a second) the right gap between "together" and "later"?
  Answer:
3. Echo: what should the "mini autograph" show: a small line of the pitch you sang, or something else?
  Answer:
4. Marbles mood: should right (happy) sound different from the default?
  Answer:
5. After you have tried 0.4.0 on the iPad, which of the 22 notes can I mark done?
  Answer:

---

## Update (2026-11-21, later)

Jimmy asked that all notes be marked done after a build, and he will reopen any that are still a problem. All 22 notes were marked done in `rs_notes` (read back: the table has 36 notes, all done). The open items above stay as questions here; the mini autograph and the other questions are not lost by the mark.
