# Mia English — exam prep, Jet 2 Unit 1 (grade 4)

Short-lived practice app for the English test on Monday 23 Nov 2026.
Content comes from the teacher's exam summary (pages 26–78) and workbook page 76.
The teacher's brief (20 Nov): students need to **read** the words and know their
**meaning**. They don't need to spell them.

No build step: static `index.html` + ES modules. Progress is kept in the tablet's
`localStorage` only (no accounts, no analytics, no server).

- `content.js`: 64 words, 36 sentence items, 3 reading passages, 11 reading rules (23 items)
- `engine.js`: learning logic (pure, tested)
- `app.js`: UI (Hebrew, RTL, feminine forms)
- `npm test` (or `node --test`): 13 engine tests

## Method (same rules as Mia Math / Mia Reading)
- Every word is first checked cold (English → Hebrew, no picture, no sound). Known
  words cost one tap; only unknown ones are taught.
- Unknown words climb a ladder: teaching card → meaning with pictures → find the
  English word among look-alikes (with sound) → one more cold check later the same
  session.
- "Knows for sure" = right cold on two different days (successive relearning).
- First-attempt-only accuracy. Cold checks of new words never count as mistakes.
- Stars: <60% → 0, 60–79% → 1, ≥80% → 2, plus combo bonus. Same as Math.
- Multiple choice gets one attempt. Options appear after a pause, so she reads first.
- Every miss shows an explanation (teach, don't just test).

## Daily plan (cumulative minutes, unused time rolls forward)
Day 1: words → 14, sentences/passages → 22, reading rules → 27, hear-and-find → 30.
Day 2 and later: words → 9, sentences → 17, rules → 24, hear-and-find → 30.
Practice test (about 8 min, 100 points), best on Sunday evening.

## Run locally
`python3 -m http.server 5187` in this folder, then open http://localhost:5187
