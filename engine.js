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
//    box 3  knows it  (English → Hebrew multiple choice right cold)
//    box 4  knows for sure: on a LATER day she TYPED the Hebrew meaning
//           herself (recall, not recognition — Dima, 21 Nov). Typos are
//           forgiven by checkMeaning(); spelling is not what is tested.
//  Multiple-choice word items say the English word aloud as it appears; the
//  typed step stays silent until she answers, like the paper exam.
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
    heExtra: {},   // word id → typed meanings a parent approved
    typedLog: [],  // typed answers the checker did not recognise (parent review)
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
      needType: false,   // the pending recheck is a typed one (a typed miss)
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
export function planFor(dayIndex, nth = 1) {
  if (dayIndex <= 1 && nth === 1) {
    return [
      { block: 'words', until: 14 },
      { block: 'sentences', until: 22 },
      { block: 'rules', until: 27 },
      { block: 'decode', until: 30 },
    ];
  }
  // Day 2, first session: she types the meaning of every word she knew
  // yesterday (~12 s each), so words get the bigger share.
  if (dayIndex === 2 && nth === 1) {
    return [
      { block: 'words', until: 16 },
      { block: 'sentences', until: 23 },
      { block: 'rules', until: 28 },
      { block: 'decode', until: 30 },
    ];
  }
  // Day 2, second session: a short review of what is still open, then the
  // exam simulation (untimed, ~15 min). Its misses go straight back into the
  // ladder for the morning review.
  if (dayIndex === 2 && nth === 2) {
    return [
      { block: 'words', until: 8 },
      { block: 'sentences', until: 12 },
      { block: 'rules', until: 15 },
      { block: 'mock', until: Infinity },
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
  const nth = state.sessions.filter((r) => r.day === today && !r.extra).length + 1;
  state.current = {
    id: `s-${now}-${state.sessions.length}`,
    day: today,
    dayIndex,
    nth,                  // 1st, 2nd … regular session of the day (picks the plan)
    mockDone: false,
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
    nth: s.nth ?? 1,
    extra: !!s.extraUntil,
    mockDone: !!s.mockDone,
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
 * Returns { id, mode } with mode ∈ probe | pic | read | recheck | type.
 * 'type' = she types the Hebrew meaning: the cross-day check of a word she
 * knew on an earlier day, and the recheck after a typed miss.
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

  // 3. cross-day check of words known on an earlier day: type the meaning
  const confirm = states.filter(([, ws]) => ws.box === 3 && ws.okDay && ws.okDay < today && !ws.recheck).filter(notLast);
  if (confirm.length) return { id: confirm[0][0].id, mode: 'type' };

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
  if (ws.recheck && ws.box === 3) return { id: w.id, mode: ws.needType ? 'type' : 'recheck' };
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
    case 'type':
      if (outcome === 'first') {
        knowsToday();
        ws.recheck = false;
        ws.needType = false;
        ws.box = ws.days.length >= 2 ? 4 : 3;
        if (ws.missToday > 0) learnedNow();
      } else {
        // She recognised it before but could not recall it: re-teach through
        // the multiple-choice steps, then she types it again this session.
        ws.box = 2;
        ws.recheck = false;
        ws.needType = true;
        ws.dueAt = n + GAP_AFTER_MISS;
      }
      break;
    case 'confirm': // older multiple-choice cross-day check (kept for saved sessions)
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
        // A multiple-choice success never makes a word "sure" (that takes a
        // typed meaning); it only counts an unseen word as known.
        if (ws.box === 0) {
          ws.box = 3;
          ws.okDay = today;
          if (!ws.days.includes(today)) ws.days.push(today);
        }
      } else {
        ws.misses += 1;
        ws.missToday += 1;
        ws.box = ws.box === 0 ? 1 : Math.min(ws.box, 2);
        ws.dueAt = 0;
        ws.recheck = false;
        ws.needType = false;
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


// ── typed Hebrew meaning ───────────────────────────────────────────────────
//
// She types the Hebrew meaning of an English word. Spelling is not tested, so
// typos are forgiven, but a different word never is:
//  1. normalise: no niqqud, punctuation, spaces; final letters → regular
//     (ך→כ …); a leading definite ה is optional.
//  2. compare with every accepted form of the target (content.js HE_ACCEPT +
//     the `he` field + forms a parent approved) by an edit distance where
//     letters that sound alike cost 0.3 (א/ע/ה, ט/ת, כ/ח/ק, ס/ש, ב/ו, ו/י)
//     and adding/dropping a quiet letter (א ה ו י ע) costs 0.4.
//  3. accept a typo only within a length-based allowance AND only if the
//     answer is strictly closer to this word than to any other of the 64
//     words — so "שני" for Tuesday is "that's Monday", never a typo.

const HE_FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const HE_ALIKE = ['אעה', 'טת', 'כחק', 'סש', 'בו', 'וי'];
const HE_QUIET = new Set('אהויע');

export function heNorm(s) {
  return String(s ?? '')
    .normalize('NFC')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[^א-ת]/g, '')
    .replace(/[ךםןףץ]/g, (c) => HE_FINALS[c]);
}

function subCost(a, b) {
  if (a === b) return 0;
  return HE_ALIKE.some((g) => g.includes(a) && g.includes(b)) ? 0.3 : 1;
}
const indel = (c) => (HE_QUIET.has(c) ? 0.4 : 1);

/** Weighted Damerau (optimal string alignment) distance on normalised text. */
export function heDistance(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) d[i][0] = d[i - 1][0] + indel(a[i - 1]);
  for (let j = 1; j <= n; j++) d[0][j] = d[0][j - 1] + indel(b[j - 1]);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + indel(a[i - 1]),
        d[i][j - 1] + indel(b[j - 1]),
        d[i - 1][j - 1] + subCost(a[i - 1], b[j - 1]),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 0.7);
    }
  }
  return Math.round(d[m][n] * 100) / 100;
}

/** How far a typo may be from a form of this (normalised) length. */
export function typoAllowance(len) {
  return len <= 2 ? 0.45 : len <= 3 ? 0.8 : len <= 5 ? 1 : len <= 7 ? 1.5 : 2;
}

/** Accepted meanings of a word: [{ raw, n }] (n = normalised). */
export function heForms(word, extra = {}) {
  const raw = [...cleanHe(word.he).split('/'), ...(word.heAlt ?? []), ...(extra[word.id] ?? [])]
    .map((x) => x.trim()).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const r of raw) {
    const n = heNorm(r);
    if (n && !seen.has(n)) { seen.add(n); out.push({ raw: r, n }); }
  }
  return out;
}

function closest(variants, forms) {
  let best = { d: Infinity, form: null };
  for (const v of variants) for (const f of forms) {
    const d = heDistance(v, f.n);
    if (d < best.d) best = { d, form: f };
  }
  return best;
}

/**
 * verdict: 'exact' | 'typo' (both correct) | 'other' (the meaning of another
 * word: `other`) | 'wrong' | 'latin' (typed in English letters — not counted,
 * she may retype) | 'empty'.
 */
export function checkMeaning(word, typed, words, extra = {}) {
  const raw = String(typed ?? '').trim();
  if (/[A-Za-z]/.test(raw)) return { verdict: 'latin' };
  const t = heNorm(raw);
  if (!t) return { verdict: 'empty' };
  const variants = [t];
  if (t.length > 2 && t[0] === 'ה') variants.push(t.slice(1));

  const own = heForms(word, extra);
  const ownSet = new Set(own.map((f) => f.n));
  const mine = closest(variants, own);
  if (mine.d === 0) return { verdict: 'exact', form: mine.form.raw };

  let rival = { d: Infinity, word: null };
  for (const w of words) {
    if (w.id === word.id) continue;
    const forms = heForms(w, extra).filter((f) => !ownSet.has(f.n)); // shared meanings (כיתה) are not rivals
    const c = closest(variants, forms);
    if (c.d < rival.d) rival = { d: c.d, word: w };
  }
  if (rival.d === 0) return { verdict: 'other', other: rival.word };
  if (mine.d <= typoAllowance(mine.form.n.length) && mine.d < rival.d) return { verdict: 'typo', form: mine.form.raw };
  return { verdict: 'wrong' };
}

/** Keep an unrecognised typed answer for the parent screen (last 40). */
export function logTyped(state, entry) {
  state.typedLog = state.typedLog ?? [];
  state.typedLog.push(entry);
  if (state.typedLog.length > 40) state.typedLog.splice(0, state.typedLog.length - 40);
}

/**
 * A parent says an unrecognised answer was right: accept that meaning from now
 * on, and give the word the credit a correct typed answer would have earned.
 */
export function approveTyped(state, index) {
  const e = state.typedLog?.[index];
  if (!e) return false;
  state.heExtra = state.heExtra ?? {};
  const list = (state.heExtra[e.id] = state.heExtra[e.id] ?? []);
  if (!list.includes(e.typed)) list.push(e.typed);
  const ws = wordState(state, e.id);
  ws.misses = Math.max(0, ws.misses - 1);
  if (!ws.days.includes(e.day)) ws.days.push(e.day);
  ws.days.sort();
  if (!ws.okDay || ws.okDay < e.day) ws.okDay = e.day;
  ws.recheck = false;
  ws.needType = false;
  ws.box = ws.days.length >= 2 ? 4 : Math.max(ws.box, 3);
  const n = heNorm(e.typed);
  state.typedLog = state.typedLog.filter((x) => !(x.id === e.id && heNorm(x.typed) === n));
  return true;
}

export function dismissTyped(state, index) {
  if (!state.typedLog?.[index]) return false;
  state.typedLog.splice(index, 1);
  return true;
}
