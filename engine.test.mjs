// Run: node --test
// Tests assert the SEAMS and that every ladder REACHES ITS TOP (the recurring
// failure mode in Mia Math/Reading was silent ceilings, not crashes).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { WORDS, SENTENCE_ITEMS, PASSAGES, RULES, RULE_ITEMS } from './content.js';

const D1 = '2026-11-21', D2 = '2026-11-22', D3 = '2026-11-23';

// A simulated learner. `known` words are recognised cold; others are
// learned after being taught.
function runWordsDay(state, day, { known = new Set(), forgets = new Set(), maxItems = 2000 } = {}) {
  const sess = E.startSession(state, day);
  const log = [];
  const forgot = new Set(); // a forgotten word fails its first typed check only
  for (let i = 0; i < maxItems; i++) {
    const it = E.pickWordItem(state, sess, WORDS, day);
    if (!it) break;
    log.push(it);
    let outcome;
    if (it.mode === 'probe') outcome = known.has(it.id) ? 'first' : 'fail';
    else if (it.mode === 'type') {
      outcome = forgets.has(it.id) && !forgot.has(it.id) ? 'fail' : 'first';
      if (outcome === 'fail') forgot.add(it.id);
    }
    else outcome = 'first';
    if (outcome === 'fail') E.tick(sess); // the learn card
    E.applyWordResult(state, sess, it.id, it.mode, outcome, day);
  }
  return { sess, log };
}

test('content sanity: unique ids, correct option present, no duplicate options', () => {
  const ids = new Set();
  for (const w of WORDS) {
    assert.ok(!ids.has(w.id), `dup word ${w.id}`);
    ids.add(w.id);
    assert.ok(w.he && w.emoji && w.tip, `incomplete word ${w.id}`);
  }
  assert.equal(WORDS.length, 64);
  const all = [...SENTENCE_ITEMS, ...RULE_ITEMS, ...PASSAGES.flatMap((p) => p.qs)];
  const bankIds = new Set();
  for (const it of all) {
    assert.ok(!bankIds.has(it.id), `dup item ${it.id}`);
    bankIds.add(it.id);
    assert.equal(new Set(it.opts).size, it.opts.length, `duplicate options in ${it.id}`);
    assert.ok(it.exp, `item ${it.id} needs an explanation`);
  }
  for (const r of RULE_ITEMS) assert.ok(RULES.find((x) => x.id === r.r), `rule ${r.r}`);
});

test('day 1: a learner who knows nothing still gets every word to box 3', () => {
  const st = E.freshState();
  const { log } = runWordsDay(st, D1);
  for (const w of WORDS) assert.equal(st.words[w.id].box, 3, w.id);
  // every unknown word went probe → pic → read → recheck (relearning)
  const modes = new Set(log.map((l) => l.mode));
  for (const m of ['probe', 'pic', 'read', 'recheck']) assert.ok(modes.has(m), m);
});

test('known words cost one probe each and are not taught', () => {
  const st = E.freshState();
  const known = new Set(WORDS.map((w) => w.id));
  const { log, sess } = runWordsDay(st, D1, { known });
  assert.equal(log.length, WORDS.length);
  assert.ok(log.every((l) => l.mode === 'probe'));
  assert.equal(sess.knownOnProbe, 64);
  assert.equal(sess.scored, 0, 'probes are diagnostic, not scored');
});

test('two days reach the top: every word becomes "sure" (box 4)', () => {
  const st = E.freshState();
  runWordsDay(st, D1);
  E.finishSession(st);
  const { log } = runWordsDay(st, D2);
  assert.ok(log.every((l) => l.mode === 'type'), 'day 2: she types the meaning of every word');
  for (const w of WORDS) assert.equal(st.words[w.id].box, 4, w.id);
  assert.equal(E.wordSummary(st, WORDS).sure, 64);
});

test('a meaning she cannot type is re-taught by multiple choice, then typed again the same session', () => {
  const st = E.freshState();
  runWordsDay(st, D1);
  E.finishSession(st);
  const { log } = runWordsDay(st, D2, { forgets: new Set(['Wednesday']) });
  const wed = log.filter((l) => l.id === 'Wednesday').map((l) => l.mode);
  assert.deepEqual(wed, ['type', 'read', 'type'], 'typed miss → find it again → type it again');
  assert.equal(st.words.Wednesday.box, 4, 'known yesterday + typed today = sure');
  assert.equal(st.words.house.box, 4);
  assert.equal(st.words.Wednesday.needType, false);
});

test('a multiple-choice success alone never makes a word sure', () => {
  const st = E.freshState();
  runWordsDay(st, D1);
  E.finishSession(st);
  const s2 = E.startSession(st, D2);
  // same-day multiple choice keeps it at box 3; only a typed answer promotes
  E.applyWordResult(st, s2, 'house', 'recheck', 'first', D2);
  assert.equal(st.words.house.box, 3);
  E.applyWordResult(st, s2, 'house', 'type', 'first', D2);
  assert.equal(st.words.house.box, 4);
});

test('spacing: a missed word does not come straight back, and the loop is bounded', () => {
  const st = E.freshState();
  const sess = E.startSession(st, D1);
  const first = E.pickWordItem(st, sess, WORDS, D1);
  E.applyWordResult(st, sess, first.id, 'probe', 'fail', D1);
  const next = E.pickWordItem(st, sess, WORDS, D1);
  assert.notEqual(next.id, first.id);
  // never more than WORKING_SET words in the learning loop
  for (let i = 0; i < 40; i++) {
    const it = E.pickWordItem(st, sess, WORDS, D1);
    E.applyWordResult(st, sess, it.id, it.mode, it.mode === 'probe' ? 'fail' : 'second', D1);
    const learning = Object.values(st.words).filter((w) => w.box === 1 || w.box === 2).length;
    assert.ok(learning <= E.MAX_LOOP, `learning=${learning}`);
  }
});

test('waiting words left from a previous session are due at once next session', () => {
  const st = E.freshState();
  const s1 = E.startSession(st, D1);
  s1.n = 500;
  E.applyWordResult(st, s1, 'scissors', 'probe', 'fail', D1); // dueAt 502
  E.finishSession(st);
  const s2 = E.startSession(st, D2);
  const it = E.pickWordItem(st, s2, WORDS, D2);
  assert.deepEqual(it, { id: 'scissors', mode: 'pic' });
});

test('first-attempt accounting and Mia Math star rule', () => {
  const sess = E.startSession(E.freshState(), D1);
  E.recordAttempt(sess, false, { probe: true });
  E.recordAttempt(sess, true, { probe: true });
  assert.equal(sess.scored, 0);
  assert.equal(sess.maxCombo, 0, 'probes do not feed the combo');
  for (let i = 0; i < 10; i++) E.recordAttempt(sess, true);
  assert.equal(sess.maxCombo, 10);
  E.recordAttempt(sess, false);
  assert.equal(sess.combo, 0);
  assert.equal(E.starsFor({ scored: 11, correct: 10, maxCombo: 10 }), 4);
  assert.equal(E.starsFor({ scored: 10, correct: 5, maxCombo: 5 }), 0, 'below floor: combo cannot rescue');
  assert.equal(E.starsFor({ scored: 10, correct: 7, maxCombo: 4 }), 1);
  assert.equal(E.starsFor({ scored: 5, correct: 5, maxCombo: 5 }), 0, 'needs 8 scored items');
});

test('bank: a miss returns after a gap, then again the next day', () => {
  const st = E.freshState();
  const sess = E.startSession(st, D1);
  const items = SENTENCE_ITEMS;
  const a = E.pickBankItem(st, sess, items, D1);
  E.applyBankResult(st, sess, a.id, false, D1);
  const seen = [];
  for (let i = 0; i < E.BANK_GAP + 1; i++) {
    const it = E.pickBankItem(st, sess, items, D1);
    seen.push(it.id);
    E.applyBankResult(st, sess, it.id, true, D1);
  }
  assert.ok(!seen.slice(0, E.BANK_GAP - 1).includes(a.id), 'not immediately');
  assert.ok(seen.includes(a.id), 'comes back within the gap');
  // finish the bank
  for (let i = 0; i < 200; i++) {
    const it = E.pickBankItem(st, sess, items, D1);
    if (!it) break;
    E.applyBankResult(st, sess, it.id, true, D1);
  }
  assert.equal(E.bankSummary(st, items).done, items.length);
  E.finishSession(st);
  const s2 = E.startSession(st, D2);
  assert.equal(E.pickBankItem(st, s2, items, D2).id, a.id, 'yesterday\'s miss is reviewed first');
  E.applyBankResult(st, s2, a.id, true, D2);
  assert.equal(E.pickBankItem(st, s2, items, D2), null, 'then the block is done');
});

test('plan: day 1 favours words, later days cover all three blocks within 30 min', () => {
  assert.equal(E.planFor(1)[0].block, 'words');
  assert.equal(E.planFor(1)[0].until, 14);
  assert.deepEqual(E.planFor(2).map((b) => b.block), ['words', 'sentences', 'rules', 'decode']);
  assert.equal(E.planFor(1).at(-1).until, 30);
  assert.equal(E.planFor(2).at(-1).until, 30);
  const st = E.freshState();
  E.startSession(st, D1); E.finishSession(st);
  assert.equal(E.practiceDayIndex(st, D2), 2);
  assert.equal(E.practiceDayIndex(st, D1), 1);
  // day 2: the first session leans on typing, the second ends with the mock
  assert.equal(E.planFor(2, 1)[0].until, 16);
  assert.deepEqual(E.planFor(2, 2).map((b) => b.block), ['words', 'sentences', 'rules', 'mock']);
  assert.equal(E.planFor(3, 1).at(-1).until, 30);
  const s1 = E.startSession(st, D2); assert.equal(s1.nth, 1); E.finishSession(st);
  const s2 = E.startSession(st, D2); assert.equal(s2.nth, 2);
  s2.extraUntil = 10; E.finishSession(st);
  assert.equal(E.startSession(st, D2).nth, 2, '"+10 minutes" sessions do not count');
});

test('mock: 100 points, weakest words first, results flow back into the ladder', () => {
  const st = E.freshState();
  runWordsDay(st, D1, { known: new Set(WORDS.map((w) => w.id).filter((id) => id !== 'scissors')) });
  st.words.scissors.box = 1;
  E.finishSession(st);
  const qs = E.buildMock(st, { words: WORDS, sentenceItems: SENTENCE_ITEMS, passages: PASSAGES, ruleItems: RULE_ITEMS, canHear: true });
  const total = qs.reduce((a, q) => a + q.pts, 0);
  assert.ok(Math.abs(total - 100) < 1e-9, `total ${total}`);
  assert.equal(qs[0].word.id, 'scissors', 'weakest word is tested');
  assert.equal(qs.filter((q) => q.kind === 'meaning').length, 20);
  const answers = qs.map((q) => ({ correct: !(q.kind === 'meaning' && q.word.id === 'scissors') }));
  const res = E.applyMock(st, qs, answers, D2);
  assert.equal(res.score, 98);
  assert.equal(st.words.scissors.box, 1);
  const other = qs.find((q) => q.kind === 'meaning' && q.word.id !== 'scissors').word.id;
  assert.equal(st.words[other].box, 3, 'a multiple-choice mock answer does not make a word sure');
  const noHear = E.buildMock(st, { words: WORDS, sentenceItems: SENTENCE_ITEMS, passages: PASSAGES, ruleItems: RULE_ITEMS, canHear: false });
  assert.ok(noHear.every((q) => q.kind !== 'rule' || q.item.kind !== 'hear'));
});

test('meaning options: correct first, 4 distinct Hebrew labels, grade never offered against class', () => {
  for (const w of WORDS) {
    for (let k = 0; k < 200; k++) {
      const opts = E.meaningOptions(w, WORDS);
      assert.equal(opts[0], w);
      assert.equal(opts.length, 4);
      assert.equal(new Set(opts.map((o) => E.cleanHe(o.he))).size, 4, w.id);
    }
  }
  const look = E.lookAlikeOptions(WORDS.find((w) => w.id === 'teacher'), WORDS);
  assert.equal(look.length, 4);
  assert.equal(new Set(look.map((o) => o.en)).size, 4);
});

test('spelling check ignores case and spacing, honours accepted variants', () => {
  const w = WORDS.find((x) => x.id === 'Wednesday');
  assert.ok(E.isCorrectSpelling(w, ' wednesday '));
  assert.ok(!E.isCorrectSpelling(w, 'wensday'));
  assert.ok(E.isCorrectSpelling(WORDS.find((x) => x.id === 'favorite'), 'favourite'));
  assert.ok(!E.isCorrectSpelling(w, ''));
});

// ── typed Hebrew meaning ───────────────────────────────────────────────────

const W = Object.fromEntries(WORDS.map((w) => [w.id, w]));
const ok = (id, typed) => ['exact', 'typo'].includes(E.checkMeaning(W[id], typed, WORDS).verdict);

test('typed meaning: every accepted form of every word is exact', () => {
  for (const w of WORDS) for (const f of E.heForms(w)) assert.equal(E.checkMeaning(w, f.raw, WORDS).verdict, 'exact', `${w.id} ${f.raw}`);
  assert.ok(ok('teacher', 'המורה'), 'leading ה is optional');
  assert.ok(ok('school', 'בֵּית סֵפֶר'), 'niqqud ignored');
  assert.ok(ok('school', 'ביתספר'), 'spaces ignored');
  assert.ok(ok('grade', 'כיתה') && ok('class', 'כיתה'), 'shared meaning accepted for both');
});

test('typed meaning: another word\'s meaning is never accepted', () => {
  for (const t of WORDS) {
    const own = new Set(E.heForms(t).map((f) => f.n));
    for (const o of WORDS) {
      if (o === t) continue;
      for (const f of E.heForms(o)) {
        if (own.has(f.n)) continue;
        const r = E.checkMeaning(t, f.raw, WORDS);
        assert.ok(!['exact', 'typo'].includes(r.verdict), `${t.id} accepted "${f.raw}" (${o.id})`);
      }
    }
  }
  assert.equal(E.checkMeaning(W.Tuesday, 'שני', WORDS).other.id, 'Monday');
  assert.equal(E.checkMeaning(W.scissors, 'מספר', WORDS).other.id, 'number');
  assert.equal(E.checkMeaning(W.brother, 'אחות', WORDS).other.id, 'sister');
});

test('typed meaning: Hebrew typos a child makes are forgiven', () => {
  const typos = [
    ['teacher', 'מורא'], ['bird', 'צפור'], ['pencil', 'עפרון'], ['pencil', 'איפרון'], ['scissors', 'מספרים'],
    ['chair', 'כסא'], ['chair', 'קיסא'], ['notebook', 'מכברת'], ['thanks', 'טודה'], ['lesson', 'שעור'],
    ['math', 'מטמטיקה'], ['sports', 'ספורת'], ['week', 'שבוא'], ['Wednesday', 'יום רבעי'], ['Thursday', 'יום כמישי'],
    ['happy', 'סמח'], ['meet', 'להפגש'], ['street', 'רכוב'], ['address', 'קתובת'], ['please', 'בבקשא'],
    ['lunch', 'ארוחט צהרים'], ['grandpa', 'סבה'], ['brother', 'אך'], ['name', 'שים'], ['paper', 'ניר'],
    ['English', 'אנגלט'], ['fly', 'לאוף'], ['need', 'צריח'], ['computer', 'מכשב'], ['phone', 'תלפון'],
    ['food', 'אכל'], ['pupil', 'טלמיד'], ['grade', 'כיתא'], ['school', 'בית סיפר'], ['homework', 'שיעורי בייט'],
  ];
  for (const [id, t] of typos) assert.equal(E.checkMeaning(W[id], t, WORDS).verdict, 'typo', `${id} ${t}`);
  // generated: one sound-alike swap, one dropped ו/י, or two swapped letters
  const swaps = { 'א': 'ע', 'ע': 'א', 'ה': 'א', 'ט': 'ת', 'ת': 'ט', 'כ': 'ח', 'ח': 'כ', 'ק': 'כ', 'ס': 'ש', 'ש': 'ס' };
  let tot = 0, good = 0;
  for (const w of WORDS) for (const f of E.heForms(w).slice(0, 2)) {
    const s = f.raw, vars = new Set();
    for (let i = 0; i < s.length; i++) {
      if (swaps[s[i]]) vars.add(s.slice(0, i) + swaps[s[i]] + s.slice(i + 1));
      if ('יו'.includes(s[i])) vars.add(s.slice(0, i) + s.slice(i + 1));
      if (i > 0 && s[i] !== ' ' && s[i - 1] !== ' ') vars.add(s.slice(0, i - 1) + s[i] + s[i - 1] + s.slice(i + 1));
    }
    for (const v of vars) { if (v === s) continue; tot++; if (ok(w.id, v)) good++; }
  }
  assert.ok(good / tot >= 0.95, `generated typos accepted ${good}/${tot}`);
});

test('typed meaning: unrelated answers, English letters and blanks', () => {
  assert.equal(E.checkMeaning(W.house, 'חתול', WORDS).verdict, 'wrong');
  assert.equal(E.checkMeaning(W.happy, 'עצוב', WORDS).verdict, 'wrong');
  assert.equal(E.checkMeaning(W.house, 'house', WORDS).verdict, 'latin');
  assert.equal(E.checkMeaning(W.house, '  ', WORDS).verdict, 'empty');
  assert.equal(E.checkMeaning(W.house, '123', WORDS).verdict, 'empty');
});

test('parent approval: the answer is accepted from now on and the word gets its credit', () => {
  const st = E.freshState();
  runWordsDay(st, D1);
  E.finishSession(st);
  const s2 = E.startSession(st, D2);
  E.applyWordResult(st, s2, 'nice', 'type', 'fail', D2);
  E.logTyped(st, { day: D2, id: 'nice', typed: 'חמוד', at: 1 });
  assert.equal(E.checkMeaning(W.nice, 'חמוד', WORDS, st.heExtra).verdict, 'wrong');
  assert.ok(E.approveTyped(st, 0));
  assert.equal(E.checkMeaning(W.nice, 'חמוד', WORDS, st.heExtra).verdict, 'exact');
  assert.equal(st.words.nice.box, 4);
  assert.equal(st.typedLog.length, 0);
  // and it no longer waits for a typed recheck
  assert.ok(!Object.values(st.words).some((w) => w.needType));
});
