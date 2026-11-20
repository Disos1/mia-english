// Learning engine — pure logic, no DOM. Tested by engine.test.mjs (node --test).
//
// Method (carried over from Mia Math / Mia Reading, adapted for 2 days × 30 min):
//
//  WORDS — successive relearning with a Leitner ladder. The teacher's brief
//  (20 Nov): she must READ each word and know its MEANING; spelling is not
//  tested. So the target skill is: see the English word → know the Hebrew.
//    box 0  not yet met
//    box 1  learning   → 'pic': English word → Hebrew options WITH pictures
//    box 2  almost     → 'read': Hebrew (+ spoken word) → find the written
//                        English word among look-alikes (decoding practice)
//    box 3  knows today  (English → Hebrew right cold today)
//    box 4  knows for sure (right cold on TWO different days)
//  Every word is first PROBED cold (English → Hebrew, no picture, no audio):
//  if she knows it, it jumps to box 3 and costs ~5 seconds; only unknown words
//  get taught. A miss brings the word back after a short gap. Words missed
//  today need one more cold success later in the session (relearning).
//  Options appear only after a pause, so she reads the word before choosing.
//
//  SENTENCES / READING RULES — a requeue bank: a missed item comes back a few
//  items later and again on the next day. Multiple choice gets ONE attempt
//  (a second try at 4 options is guessing).
//
//  ACCOUNTING — first attempt only. Probes (cold checks of a new word) are a
//  diagnostic: a probe miss never lowers accuracy or breaks the combo, because
//  not knowing a word you were never taught is not a mistake.
//
//  STARS — Mia Math's rule: <60% first-attempt accuracy → 0, 60–79% → 1,
//  ≥80% → 2; combo ≥5 → +1, ≥10 → +2 (only above the floor); cap 4; needs ≥8
//  scored items.

export const WORKING_SET = 5;     // new words taken into the learning loop
export const MAX_LOOP = 8;        // loop may grow to this when a cold probe fills a spacing gap
export const GAP_AFTER_MISS = 2;  // items before a missed word returns
export const GAP_AFTER_STEP = 4;  // items before a word that just climbed returns
export const GAP_RECHECK = 6;     // items before the relearning recheck
export const BANK_GAP = 3;        // items before a missed sentence/rule returns

export const MIN_ITEMS_FOR_STARS = 8;
export const MIN_ACCURACY = 0.6;
export const HIGH_ACCURACY = 0.8;
export const COMBO_1 = 5;
export const COMBO_2 = 10;
export const MAX_STARS = 4;

// ── helpers ────────────────────────────────────────────────────────────────

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCorrectSpelling(word, typed) {
  const t = normalize(typed);
  if (!t) return false;
  if (t === normalize(word.en)) return true;
  return (word.accept ?? []).some((a) => normalize(a) === t);
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── state ──────────────────────────────────────────────────────────────────

export function freshState() {
  return {
    v: 1,
    words: {},     // id → WordState
    bank: {},      // item id → BankState (sentences, passages, rules)
    taught: {},    // rule id → day it was taught
    sessions: [],  // finished/partial session records
    mocks: [],     // mock-test results
    current: null, // in-progress session (resumable the same day)
  };
}

export function wordState(state, id) {
  if (!state.words[id]) {
    state.words[id] = {
      box: 0,
      dueAt: 0,
      okDay: null,       // last day she typed it right cold
      days: [],          // distinct days with a cold correct typing
      missToday: 0,
      missDay: null,
      misses: 0,         // all-time misses (parent view: "hard words")
      recheck: false,    // relearning criterion pending
      seen: 0,
    };
  }
  return state.words[id];
}

function bankState(state, id) {
  if (!state.bank[id]) {
    state.bank[id] = { seen: 0, ok: 0, miss: 0, dueAt: null, reviewDay: null, lastOk: false, okDay: null };
  }
  return state.bank[id];
}

// ── sessions ───────────────────────────────────────────────────────────────

/** Which practice day is this (1 = first day she ever practised)? */
export function practiceDayIndex(state, today) {
  const days = new Set(state.sessions.map((s) => s.day));
  if (state.current) days.add(state.current.day);
  days.add(today);
  return [...days].sort().indexOf(today) + 1;
}

/**
 * Block plan: cumulative minute deadlines; unused time rolls forward.
 * 'decode' = hear a word, find it in print among look-alikes — pure reading
 * practice (the teacher asked for reading + meaning), and it soaks up any
 * time the other blocks leave.
 */
export function planFor(dayIndex) {
  if (dayIndex <= 1) {
    return [
      { block: 'words', until: 14 },
      { block: 'sentences', until: 22 },
      { block: 'rules', until: 27 },
      { block: 'decode', until: 30 },
    ];
  }
  return [
    { block: 'words', until: 9 },
    { block: 'sentences', until: 17 },
    { block: 'rules', until: 24 },
    { block: 'decode', until: 30 },
  ];
}

export function startSession(state, today, now = Date.now()) {
  if (state.current && state.current.day === today) return state.current;
  if (state.current) finishSession(state, now); // stale session from another day
  // The spacing clock restarts every session: anything left waiting from an
  // earlier session is due right away (that is the next-day relearning).
  for (const ws of Object.values(state.words)) ws.dueAt = 0;
  for (const b of Object.values(state.bank)) if (b.dueAt !== null) b.dueAt = 0;
  const dayIndex = practiceDayIndex(state, today);
  state.current = {
    id: `s-${now}`,
    day: today,
    dayIndex,
    startedAt: now,
    activeMs: 0,
    bonusMin: 0,
    n: 0,                 // item counter (spacing clock)
    blockIdx: 0,
    scored: 0,            // first attempts that count for accuracy
    correct: 0,
    combo: 0,
    maxCombo: 0,
    probed: 0,
    knownOnProbe: 0,
    learnedToday: [],     // words that reached box 3 after being taught
    lastWord: null,
    lastBank: null,
    done: false,
  };
  return state.current;
}

export function elapsedMin(sess) {
  return sess.activeMs / 60000;
}

/** Add active time; a single item never counts for more than 90 s (breaks). */
export function addActiveTime(sess, ms) {
  sess.activeMs += Math.max(0, Math.min(ms, 90000));
}

/** Records one scored first attempt. */
export function recordAttempt(sess, firstTryCorrect, { probe = false } = {}) {
  if (probe) {
    sess.probed += 1;
    if (firstTryCorrect) sess.knownOnProbe += 1;
    // Probes are neutral: they neither score nor touch the combo, otherwise
    // 60 already-known words would hand out the combo bonus for free.
    return;
  }
  sess.scored += 1;
  if (firstTryCorrect) {
    sess.correct += 1;
    sess.combo += 1;
    sess.maxCombo = Math.max(sess.maxCombo, sess.combo);
  } else {
    sess.combo = 0;
  }
}

export function starsFor(rec) {
  if (rec.scored < MIN_ITEMS_FOR_STARS) return 0;
  const acc = rec.correct / rec.scored;
  const base = acc >= HIGH_ACCURACY ? 2 : acc >= MIN_ACCURACY ? 1 : 0;
  if (base === 0) return 0;
  const bonus = rec.maxCombo >= COMBO_2 ? 2 : rec.maxCombo >= COMBO_1 ? 1 : 0;
  return Math.min(base + bonus, MAX_STARS);
}

export function finishSession(state, now = Date.now()) {
  const s = state.current;
  if (!s) return null;
  const rec = {
    id: s.id,
    day: s.day,
    dayIndex: s.dayIndex,
    startedAt: s.startedAt,
    endedAt: now,
    minutes: Math.round(elapsedMin(s) * 10) / 10,
    scored: s.scored,
    correct: s.correct,
    maxCombo: s.maxCombo,
    probed: s.probed,
    knownOnProbe: s.knownOnProbe,
    learnedToday: s.learnedToday.slice(),
  };
  rec.stars = starsFor(rec);
  // Resuming the same day merges into one record rather than duplicating.
  state.sessions = state.sessions.filter((r) => r.id !== rec.id);
  state.sessions.push(rec);
  state.current = null;
  return rec;
}

// ── words ──────────────────────────────────────────────────────────────────

function resetDaily(ws, today) {
  if (ws.missDay !== today) {
    ws.missToday = 0;
    ws.missDay = today;
    if (ws.recheck && ws.okDay !== today) ws.recheck = false;
  }
}

/**
 * Next word item, or null when every word is done for today.
 * Returns { id, mode } with mode ∈ probe | pic | read | confirm | recheck.
 */
export function pickWordItem(state, sess, words, today) {
  const n = sess.n;
  const states = words.map((w) => {
    const ws = wordState(state, w.id);
    resetDaily(ws, today);
    return [w, ws];
  });
  const notLast = ([w]) => w.id !== sess.lastWord;
  const active = states.filter(([, ws]) => ws.box === 1 || ws.box === 2 || ws.recheck);

  // 1. learning-loop words whose gap has elapsed
  const due = active.filter(([, ws]) => ws.dueAt <= n).filter(notLast).sort((a, b) => a[1].dueAt - b[1].dueAt);
  if (due.length) return asItem(due[0]);

  // 2. meet a new word (cold probe) while the loop has room
  const learningCount = active.filter(([, ws]) => ws.box === 1 || ws.box === 2).length;
  if (learningCount < WORKING_SET) {
    const fresh = states.find(([, ws]) => ws.box === 0);
    if (fresh) return { id: fresh[0].id, mode: 'probe' };
  }

  // 3. cross-day confirmation of words known on an earlier day
  const confirm = states.filter(([, ws]) => ws.box === 3 && ws.okDay && ws.okDay < today).filter(notLast);
  if (confirm.length) return { id: confirm[0][0].id, mode: 'confirm' };

  // 4. nothing due: fill the gap with a cold probe (cheap if she knows the
  //    word, and it spaces out the loop), otherwise the soonest learning word
  if (learningCount < MAX_LOOP) {
    const fresh = states.find(([, ws]) => ws.box === 0);
    if (fresh) return { id: fresh[0].id, mode: 'probe' };
  }
  const waiting = active.filter(notLast).sort((a, b) => a[1].dueAt - b[1].dueAt);
  if (waiting.length) return asItem(waiting[0]);
  if (active.length) return asItem(active[0]); // only the last word is left

  // 5. fresh words remaining but loop full and nothing else — still probe
  const fresh = states.find(([, ws]) => ws.box === 0);
  if (fresh) return { id: fresh[0].id, mode: 'probe' };
  return null;
}

function asItem([w, ws]) {
  if (ws.recheck && ws.box === 3) return { id: w.id, mode: 'recheck' };
  return { id: w.id, mode: ws.box === 1 ? 'pic' : 'read' };
}

/**
 * Apply the outcome of a word item.
 * outcome: 'first' (right on the first try) | 'second' (right after a hint)
 *        | 'fail' (wrong; she was then shown the word and its meaning)
 * Multiple-choice word items have one attempt, so they send first | fail.
 */
export function applyWordResult(state, sess, wordId, mode, outcome, today) {
  const ws = wordState(state, wordId);
  resetDaily(ws, today);
  const n = sess.n;
  ws.seen += 1;
  const missed = outcome !== 'first';
  if (missed) {
    ws.misses += 1;
    ws.missToday += 1;
  }
  recordAttempt(sess, !missed, { probe: mode === 'probe' });

  const knowsToday = () => {
    ws.okDay = today;
    if (!ws.days.includes(today)) ws.days.push(today);
  };
  const toBox3 = () => {
    ws.box = 3;
    knowsToday();
    if (ws.missToday > 0) {
      ws.recheck = true; // relearning criterion: one more cold typing later
      ws.dueAt = n + GAP_RECHECK;
    } else {
      ws.recheck = false;
    }
  };
  const learnedNow = () => {
    if (!sess.learnedToday.includes(wordId)) sess.learnedToday.push(wordId);
  };

  switch (mode) {
    case 'probe':
      if (outcome === 'first') toBox3();
      else if (outcome === 'second') { ws.box = 2; ws.dueAt = n + GAP_AFTER_STEP; }
      else { ws.box = 1; ws.dueAt = n + GAP_AFTER_MISS; }
      break;
    case 'pic':
      if (outcome === 'first') { ws.box = 2; ws.dueAt = n + GAP_AFTER_STEP; }
      else { ws.box = 1; ws.dueAt = n + GAP_AFTER_MISS; }
      break;
    case 'read':
      if (outcome === 'first') { toBox3(); learnedNow(); }
      else if (outcome === 'second') { ws.box = 2; ws.dueAt = n + 3; }
      else { ws.box = 1; ws.dueAt = n + GAP_AFTER_MISS; }
      break;
    case 'recheck':
      if (outcome === 'first') { ws.recheck = false; learnedNow(); }
      else if (outcome === 'second') { ws.box = 2; ws.recheck = false; ws.dueAt = n + 3; }
      else { ws.box = 1; ws.recheck = false; ws.dueAt = n + GAP_AFTER_MISS; }
      break;
    case 'confirm':
      if (outcome === 'first') {
        knowsToday();
        ws.box = ws.days.length >= 2 ? 4 : 3;
      } else if (outcome === 'second') { ws.box = 2; ws.dueAt = n + 3; }
      else { ws.box = 1; ws.dueAt = n + GAP_AFTER_MISS; }
      break;
    default:
      throw new Error(`unknown word mode ${mode}`);
  }
  sess.lastWord = wordId;
  sess.n += 1;
}

/** Teaching moments (learn card, rule card) advance the spacing clock but are not attempts. */
export function tick(sess) {
  sess.n += 1;
}

export function wordSummary(state, words) {
  const c = { total: words.length, sure: 0, today: 0, learning: 0, unseen: 0 };
  for (const w of words) {
    const b = state.words[w.id]?.box ?? 0;
    if (b === 4) c.sure += 1;
    else if (b === 3) c.today += 1;
    else if (b === 0) c.unseen += 1;
    else c.learning += 1;
  }
  return c;
}

// ── sentence / rule bank ───────────────────────────────────────────────────

/**
 * items: ordered list of { id, ... }. Returns the next item or null.
 * Order: missed items whose gap elapsed → items missed on an earlier day
 * (relearning) → unseen items in order.
 */
export function pickBankItem(state, sess, items, today) {
  const n = sess.n;
  const rows = items.map((it) => [it, bankState(state, it.id)]);
  const notLast = ([it]) => it.id !== sess.lastBank;

  const due = rows.filter(([, b]) => b.dueAt !== null && b.dueAt <= n).filter(notLast)
    .sort((a, b) => a[1].dueAt - b[1].dueAt);
  if (due.length) return due[0][0];

  const review = rows.filter(([, b]) => b.miss > 0 && b.dueAt === null && b.reviewDay !== today && b.okDay !== today).filter(notLast);
  if (review.length) return review[0][0];

  const unseen = rows.find(([, b]) => b.seen === 0);
  if (unseen) return unseen[0];

  // Only requeued items remain. Never re-ask the item just answered (its
  // answer is still on screen); it returns as tomorrow's review instead.
  const waiting = rows.filter(([, b]) => b.dueAt !== null).filter(notLast).sort((a, b) => a[1].dueAt - b[1].dueAt);
  return waiting.length ? waiting[0][0] : null;
}

export function applyBankResult(state, sess, itemId, correct, today) {
  const b = bankState(state, itemId);
  b.seen += 1;
  recordAttempt(sess, correct);
  if (b.miss > 0 && b.dueAt === null && b.reviewDay !== today) b.reviewDay = today;
  if (correct) {
    b.ok += 1;
    b.lastOk = true;
    b.okDay = today;
    b.dueAt = null;
  } else {
    b.miss += 1;
    b.lastOk = false;
    b.dueAt = sess.n + BANK_GAP;
  }
  sess.lastBank = itemId;
  sess.n += 1;
}

export function bankSummary(state, items) {
  let done = 0, shaky = 0, unseen = 0;
  for (const it of items) {
    const b = state.bank[it.id];
    if (!b || b.seen === 0) unseen += 1;
    else if (b.lastOk) done += 1;
    else shaky += 1;
  }
  return { total: items.length, done, shaky, unseen };
}

// ── mock test ──────────────────────────────────────────────────────────────

/**
 * Builds an exam-style mock test worth 100 points. Weaker words are chosen
 * first so the score is an honest (if slightly harsh) readiness signal.
 *   A  20 × English word → Hebrew meaning   (2 pts)  40
 *   B   6 × Hebrew → find the English word  (2 pts)  12
 *   C   6 × questions & answers             (3 pts)  18
 *   D   1 passage, 4 questions              (4 pts)  16
 *   E   7 × reading rules                            14
 */
export function buildMock(state, { words, sentenceItems, passages, ruleItems, canHear }, rng = Math.random) {
  const byWeakness = shuffle(words, rng).sort((a, b) => (state.words[a.id]?.box ?? 0) - (state.words[b.id]?.box ?? 0));
  const meaning = byWeakness.slice(0, 20);
  const read = shuffle(byWeakness.slice(20), rng).slice(0, 6);
  const sentences = shuffle(sentenceItems.filter((s) => s.kind !== 'order'), rng).slice(0, 6);
  const passage = passages[Math.floor(rng() * passages.length)];
  const rules = shuffle(ruleItems.filter((r) => canHear || r.kind !== 'hear'), rng).slice(0, 7);

  const qs = [];
  meaning.forEach((w) => qs.push({ part: 'A', kind: 'meaning', word: w, pts: 2 }));
  read.forEach((w) => qs.push({ part: 'B', kind: 'read', word: w, pts: 2 }));
  sentences.forEach((s) => qs.push({ part: 'C', kind: 'sentence', item: s, pts: 3 }));
  passage.qs.forEach((q) => qs.push({ part: 'D', kind: 'passage', item: q, passage, pts: 4 }));
  const rulePts = rules.length ? 14 / rules.length : 0;
  rules.forEach((r) => qs.push({ part: 'E', kind: 'rule', item: r, pts: rulePts }));
  return qs;
}

/**
 * Applies a finished mock to word state: a cold correct answer is real
 * evidence (counts as a day of knowing it); a miss puts the word back into
 * the learning loop so the next practice starts with it.
 */
export function applyMock(state, qs, answers, today, now = Date.now()) {
  let score = 0, max = 0;
  const wrong = [];
  qs.forEach((q, i) => {
    max += q.pts;
    const ok = answers[i]?.correct === true;
    if (ok) score += q.pts;
    else wrong.push(i);
    if (q.kind === 'meaning' || q.kind === 'read') {
      const ws = wordState(state, q.word.id);
      resetDaily(ws, today);
      if (ok) {
        // "Sure" needs a cold success on an earlier day and no miss today.
        const earlierDay = ws.days.some((d) => d < today);
        ws.okDay = today;
        if (!ws.days.includes(today)) ws.days.push(today);
        if (ws.box >= 3 || ws.box === 0) ws.box = earlierDay && ws.missToday === 0 ? 4 : 3;
      } else {
        ws.misses += 1;
        ws.missToday += 1;
        ws.box = ws.box === 0 ? 1 : Math.min(ws.box, 2);
        ws.dueAt = 0;
        ws.recheck = false;
      }
    }
  });
  const pct = max ? Math.round((score / max) * 100) : 0;
  state.mocks.push({ day: today, at: now, score: pct, wrong: wrong.length, n: qs.length });
  return { score: pct, wrong };
}

// ── option builders (pure, so they are tested) ─────────────────────────────

/** Hebrew prompt without the disambiguation note: "כיתה (שכבה …)" → "כיתה". */
export function cleanHe(s) {
  return s.replace(/\s*\(.*\)\s*/, '').trim();
}

/**
 * Hebrew meaning options for an English word: 2 from the same topic (they are
 * the real confusions) + 1 from elsewhere. Never two options with the same
 * Hebrew (grade/class are both "כיתה").
 */
export function meaningOptions(word, words, rng = Math.random) {
  const used = new Set([cleanHe(word.he)]);
  const pool = words.filter((w) => w.id !== word.id);
  const same = shuffle(pool.filter((w) => w.g === word.g), rng);
  const other = shuffle(pool.filter((w) => w.g !== word.g), rng);
  const picks = [];
  const take = (w) => {
    const label = cleanHe(w.he);
    if (picks.length >= 3 || used.has(label)) return;
    used.add(label);
    picks.push(w);
  };
  same.slice(0, 2).forEach(take);
  other.forEach((w) => { if (picks.length < 3) take(w); });
  return [word, ...picks];
}

function lookAlike(a, b) {
  const x = a.toLowerCase(), y = b.toLowerCase();
  let s = 0;
  if (x[0] === y[0]) s += 3;
  if (x.at(-1) === y.at(-1)) s += 1;
  if (Math.abs(x.length - y.length) <= 1) s += 2;
  const big = (t) => new Set([...t].slice(1).map((c, i) => t[i] + c));
  const bx = big(x), by = big(y);
  for (const g of bx) if (by.has(g)) s += 1;
  return s;
}

/** English options that LOOK like the word, so she must really read it. */
export function lookAlikeOptions(word, words, rng = Math.random) {
  const ranked = shuffle(words.filter((w) => w.id !== word.id), rng)
    .sort((a, b) => lookAlike(word.en, b.en) - lookAlike(word.en, a.en));
  return [word, ...shuffle(ranked.slice(0, 6), rng).slice(0, 3)];
}
