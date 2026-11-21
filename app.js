// Mia English — UI. All learning decisions live in engine.js.
// index.html loads this file as app.js?v=<build from version.json>; the same
// tag on the data and engine modules keeps a tablet's cache from mixing builds.
const V = new URL(import.meta.url).searchParams.get('v');
const Q = V ? `?v=${encodeURIComponent(V)}` : '';
const { WORDS, GROUPS, SENTENCE_ITEMS, PASSAGES, RULES, RULE_ITEMS } = await import(`./content.js${Q}`);
const E = await import(`./engine.js${Q}`);

const BUILD = '2026-11-21c'; // keep equal to version.json
let updateReady = false; // a newer build was published; reload at the next safe screen
const KEY = 'miaEnglish.v1';
const WORD = Object.fromEntries(WORDS.map((w) => [w.id, w]));
const RULE = Object.fromEntries(RULES.map((r) => [r.id, r]));

// Sentence bank: question/answer pairing first, the two reading passages
// spread through it, sentence building last.
const PASSAGE_QS = Object.fromEntries(PASSAGES.map((p) => [p.id, p.qs.map((q) => ({ ...q, kind: 'passage', passage: p }))]));
// Reading drill: hear the word, find it in print among look-alikes.
const DECODE_BANK = WORDS.map((w) => ({ id: `dec-${w.id}`, kind: 'decode', word: w }));
const SENTENCE_BANK = [
  ...SENTENCE_ITEMS.slice(0, 13),
  ...PASSAGE_QS.p1,
  ...SENTENCE_ITEMS.slice(13, 26),
  ...PASSAGE_QS.p2,
  ...SENTENCE_ITEMS.slice(26, 32),
  ...PASSAGE_QS.p3,
  ...SENTENCE_ITEMS.slice(32),
];

// ── storage ────────────────────────────────────────────────────────────────
let state = load();
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...E.freshState(), ...JSON.parse(raw) };
  } catch (e) {
    try { localStorage.setItem(`${KEY}.corrupt.${Date.now()}`, localStorage.getItem(KEY) ?? ''); } catch {}
  }
  return E.freshState();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}
try { navigator.storage?.persist?.(); } catch {}

const today = () => E.dayKey();

// ── speech (English) ───────────────────────────────────────────────────────
let enVoice = null;
function pickVoice() {
  const vs = window.speechSynthesis?.getVoices?.() ?? [];
  const en = vs.filter((v) => /^en[-_]/i.test(v.lang) || v.lang === 'en');
  enVoice = en.find((v) => /en[-_]US/i.test(v.lang) && v.localService) || en.find((v) => /en[-_](US|GB)/i.test(v.lang)) || en[0] || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}
const canSpeak = () => !!enVoice;
function speak(text) {
  if (!canSpeak()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = enVoice; u.lang = enVoice.lang; u.rate = 0.8;
    window.speechSynthesis.speak(u);
  } catch {}
}

// ── tiny DOM helper ────────────────────────────────────────────────────────
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const en = (text, cls = '') => h('span', { class: `en ${cls}`, dir: 'ltr' }, text);
const app = document.getElementById('app');
function mount(...nodes) { app.replaceChildren(...nodes.flat().filter(Boolean)); window.scrollTo(0, 0); }
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const speakBtn = (text, label = '🔊') => canSpeak() ? h('button', { class: 'speak', onclick: () => speak(text), 'aria-label': 'השמעה' }, label) : null;

// ── home ───────────────────────────────────────────────────────────────────
function totalStars() { return state.sessions.reduce((a, s) => a + (s.stars || 0), 0); }

function home() {
  if (updateReady) { save(); location.reload(); return; }
  const sum = E.wordSummary(state, WORDS);
  const resume = state.current && state.current.day === today();
  const dayIdx = E.practiceDayIndex(state, today());
  const lastMock = state.mocks.at(-1);
  const pct = (n) => `${(n / sum.total) * 100}%`;
  const doneToday = state.sessions.some((s) => s.day === today());
  const nthNext = resume ? state.current.nth ?? 1 : state.sessions.filter((s) => s.day === today() && !s.extra).length + 1;
  const plan = E.planFor(dayIdx, nthNext);
  const planText = resume ? 'ממשיכות מאיפה שעצרנו' :
    plan.some((b) => b.block === 'mock') ? 'חזרה קצרה, ואז מבחן ניסיון 📝' :
    dayIdx <= 1 ? 'כ-30 דקות: מילים, משפטים וקריאה' :
    dayIdx === 2 && nthNext === 1 ? 'כ-30 דקות: לכתוב את הפירושים בעצמך ✍️, משפטים וקריאה' :
    'כ-30 דקות: חזרה על מילים, משפטים וקריאה';

  mount(
    h('div', { class: 'spread' },
      h('div', { class: 'hello' }, 'היי מיה! 👋'),
      h('div', { class: 'chip' }, `⭐ ${totalStars()}`)),
    h('div', { class: 'muted', style: 'margin-bottom:12px' }, 'מתכוננות למבחן באנגלית — Jet 2, Unit 1'),
    h('div', { class: 'card' },
      h('h2', {}, `📚 המילים שלי — ${sum.sure + sum.today} מתוך ${sum.total}`),
      h('div', { class: 'seg' },
        h('div', { style: `width:${pct(sum.sure)};background:var(--good)` }),
        h('div', { style: `width:${pct(sum.today)};background:var(--sky)` }),
        h('div', { style: `width:${pct(sum.learning)};background:var(--yellow)` })),
      h('div', { class: 'legend' },
        h('div', {}, h('span', { class: 'dot', style: 'background:var(--good)' }), `יודעת בטוח: ${sum.sure}`),
        h('div', {}, h('span', { class: 'dot', style: 'background:var(--sky)' }), `ידעת פעם אחת: ${sum.today}`),
        h('div', {}, h('span', { class: 'dot', style: 'background:var(--yellow)' }), `בלמידה: ${sum.learning}`),
        h('div', {}, h('span', { class: 'dot', style: 'background:#EEF0F7' }), `עוד לא פגשנו: ${sum.unseen}`)),
      h('div', { class: 'small muted', style: 'margin-top:8px' }, '"יודעת בטוח" = ידעת לבחור את הפירוש, ובאימון של יום אחר גם כתבת אותו בעצמך ✍️')),
    h('button', { class: 'btn big coral', onclick: startPractice },
      resume ? '▶️ להמשיך את האימון' : doneToday ? '➕ עוד אימון' : '🚀 האימון של היום'),
    h('div', { class: 'small muted', style: 'text-align:center;margin:8px 0 16px' },
      planText),
    h('button', { class: 'btn big purple', onclick: mockIntro }, '📝 מבחן ניסיון'),
    h('div', { class: 'small muted', style: 'text-align:center;margin:8px 0 16px' },
      lastMock ? `בפעם האחרונה: ${lastMock.score}` :
        dayIdx <= 1 ? 'הוא יגיע בסוף האימון השני של מחר' :
        dayIdx === 2 && nthNext <= 2 ? 'הוא יגיע בסוף האימון השני של היום' : 'אפשר לעשות אותו בכל זמן'),
    h('div', { class: 'row center' }, h('button', { class: 'btn ghost', onclick: parent }, 'להורים')),
  );
}

// ── practice session ───────────────────────────────────────────────────────
let sess = null;
let loopToken = 0;
const BLOCK_LABEL = { words: '📚 מילים', sentences: '💬 משפטים', rules: '🔤 כללי קריאה', decode: '👂 קריאה ושמיעה' };
const ruleItems = () => RULE_ITEMS.filter((r) => r.kind !== 'hear' || canSpeak());

// A "+10 minutes" session has one deadline and works words → sentences →
// rules, taking whatever is still open; a normal session follows the day plan.
function sessionPlan() {
  return sess.extraUntil
    ? ['words', 'sentences', 'rules', 'decode'].map((block) => ({ block, until: sess.extraUntil }))
    : E.planFor(sess.dayIndex, sess.nth ?? 1);
}
function sessionTotal() {
  return Math.max(...sessionPlan().map((b) => b.until).filter(Number.isFinite));
}

function pickIn(block, t) {
  return block === 'words' ? E.pickWordItem(state, sess, WORDS, t) :
    block === 'sentences' ? E.pickBankItem(state, sess, SENTENCE_BANK, t) :
    block === 'rules' ? E.pickBankItem(state, sess, ruleItems(), t) :
    canSpeak() ? E.pickBankItem(state, sess, DECODE_BANK, t) : null;
}

function nextItem() {
  const t = today();
  const plan = sessionPlan();
  while (sess.blockIdx < plan.length) {
    const b = plan[sess.blockIdx];
    if (b.block === 'mock') {
      if (!sess.mockDone) return { block: 'mock' };
    } else if (E.elapsedMin(sess) < b.until) {
      const item = pickIn(b.block, t);
      if (item) return { block: b.block, item };
    }
    sess.blockIdx += 1;
  }
  return null;
}

function startPractice() {
  sess = E.startSession(state, today());
  save();
  runLoop();
}

async function runLoop() {
  const token = ++loopToken;
  for (;;) {
    const next = nextItem();
    if (!next) break;
    if (next.block === 'mock') {
      await mockInSession();
      if (token !== loopToken) return;
      continue;
    }
    const t0 = performance.now();
    if (next.block === 'words') await doWord(next.item);
    else if (next.block === 'sentences') await doBank(next.item, 'sentences');
    else if (next.block === 'decode') await doDecode(next.item);
    else await doRule(next.item);
    if (token !== loopToken) return;
    E.addActiveTime(sess, performance.now() - t0);
    save();
    if (sess.n % 8 === 0) sendReport();
  }
  if (token !== loopToken) return;
  endCard();
}

function exitSession() {
  loopToken += 1;
  window.speechSynthesis?.cancel?.();
  save();
  sendReport();
  home();
}

function topbar(block) {
  const pct = Math.min(100, (E.elapsedMin(sess) / sessionTotal()) * 100);
  return h('div', { class: 'topbar' },
    h('button', { class: 'x', onclick: exitSession, 'aria-label': 'יציאה' }, '✕'),
    h('div', { class: 'chip' }, BLOCK_LABEL[block]),
    h('div', { class: 'timebar' }, h('div', { style: `width:${pct}%` })),
    h('div', { class: 'combo' }, sess.combo >= 2 ? `🔥 ${sess.combo}` : ''));
}

// ── word items ─────────────────────────────────────────────────────────────
// She reads the English word and finds its meaning (the teacher's brief: no
// spelling, only reading + meaning). Hebrew → English items make her read
// look-alike words, with the word spoken so sound and print connect.
const MODE_TAG = {
  probe: '🆕 מכירה את המילה?',
  pic: '🖼️ עם תמונות',
  read: '🔎 מצאי את המילה באנגלית',
  recheck: '🔁 עוד פעם אחת, לחיזוק',
  confirm: '🔁 זוכרת מאתמול?',
  type: '✍️ כתבי את הפירוש בעצמך',
};

function teachNode(w) {
  return h('div', {},
    h('div', { class: 'fb bad', style: 'font-size:22px' }, 'בואי נלמד את המילה 💡'),
    h('div', { class: 'emoji' }, w.emoji),
    h('div', { class: 'bigword en' }, w.en),
    h('div', { class: 'prompt-he' }, `= ${w.he}`),
    h('div', { class: 'row center' }, speakBtn(w.en, '🔊 הקשיבי')),
    h('div', { class: 'explain' }, '💡 ', w.tip),
    h('div', { class: 'ask' }, 'קראי את המילה בקול 3 פעמים 🗣️'));
}

function wordItem(w, mode, { mock = false } = {}) {
  if (mode === 'read') {
    return { id: w.id, kind: 'wread', word: w, tag: mock ? null : MODE_TAG.read,
      opts: E.lookAlikeOptions(w, WORDS).map((x) => x.en), speakWord: !mock && canSpeak() };
  }
  const opts = E.meaningOptions(w, WORDS).map((x) => (mode === 'pic' ? `${x.emoji}  ${E.cleanHe(x.he)}` : E.cleanHe(x.he)));
  // Multiple choice says the word as it appears (sound + print together);
  // the mock stays silent like the paper exam.
  return { id: w.id, kind: 'wmean', word: w, tag: mock ? null : MODE_TAG[mode], opts, speakWord: !mock && canSpeak() };
}

async function doWord(item) {
  const w = WORD[item.id];
  if (item.mode === 'type') {
    const ok = await typeView(w);
    if (!ok) E.tick(sess); // the teaching card
    E.applyWordResult(state, sess, w.id, 'type', ok ? 'first' : 'fail', today());
    return;
  }
  const it = wordItem(w, item.mode);
  it.expNode = teachNode(w);
  const ok = await mcView(it, 'words', { feedback: true });
  if (!ok) E.tick(sess); // the teaching card
  E.applyWordResult(state, sess, w.id, item.mode, ok ? 'first' : 'fail', today());
}

/**
 * The last step of the ladder: she reads the English word (no sound) and types
 * its Hebrew meaning. Typos are forgiven (E.checkMeaning); English letters
 * are not counted and she may retype. One real attempt.
 */
function typeView(w) {
  return new Promise((resolve) => {
    let done = false;
    const input = h('input', {
      type: 'text', class: 'he-input', dir: 'rtl', lang: 'he', placeholder: 'הפירוש בעברית…',
      autocapitalize: 'none', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done',
    });
    const note = h('div', { class: 'small', style: 'text-align:center;min-height:24px;color:var(--bad)' });
    const after = h('div');
    const checkBtn = h('button', { class: 'btn coral', onclick: () => submit(false) }, 'בדיקה ✓');
    const dunnoBtn = h('button', { class: 'btn ghost', onclick: () => submit(true) }, 'לא יודעת');
    const buttons = h('div', { class: 'row center' }, checkBtn, dunnoBtn);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(false); } });

    async function submit(dunno) {
      if (done) return;
      const typed = input.value.trim();
      const r = dunno ? { verdict: 'wrong' } : E.checkMeaning(w, typed, WORDS, state.heExtra);
      if (r.verdict === 'empty') { note.textContent = 'כתבי את הפירוש בעברית ✍️'; input.focus(); return; }
      if (r.verdict === 'latin') { note.textContent = 'כתבי באותיות בעברית 🙂 (החליפי שפה במקלדת 🌐)'; input.focus(); return; }
      done = true;
      input.disabled = true;
      buttons.remove();
      note.textContent = '';
      input.blur();
      speak(w.en);
      if (r.verdict === 'exact' || r.verdict === 'typo') {
        after.replaceChildren(
          h('div', { class: 'fb good' }, pick(['נכון! 🎉', 'מעולה! ⭐', 'יש! 🙌'])),
          r.verdict === 'typo' ? h('div', { class: 'stat', style: 'text-align:center' }, 'ככה כותבים: ', h('strong', {}, r.form)) : null);
        await wait(r.verdict === 'typo' ? 2200 : 1200);
        return resolve(true);
      }
      if (!dunno && typed) E.logTyped(state, { day: today(), id: w.id, typed, at: Date.now(), other: r.other?.id ?? null });
      after.replaceChildren(
        r.verdict === 'other'
          ? h('div', { class: 'explain' }, '💡 ', `"${typed}" זה `, en(r.other.en), '. המילה כאן אחרת:')
          : null,
        teachNode(w),
        h('div', { class: 'row center' }, h('button', { class: 'btn coral', onclick: () => resolve(false) }, 'המשך ←')));
    }

    mount(
      topbar('words'),
      h('div', { class: 'card' },
        h('div', { style: 'text-align:center' }, h('span', { class: 'mode-tag' }, MODE_TAG.type)),
        h('div', { class: 'bigword en', style: 'margin:18px 0' }, w.en),
        h('div', { class: 'ask' }, 'מה הפירוש? כתבי בעברית (לא צריך כתיב מושלם)'),
        input, note, buttons, after),
    );
    setTimeout(() => input.focus(), 150);
  });
}

async function doDecode(base) {
  const w = base.word;
  const item = { ...base, opts: E.lookAlikeOptions(w, WORDS).map((x) => x.en), expNode: teachNode(w) };
  const ok = await mcView(item, 'decode', { feedback: true });
  E.applyBankResult(state, sess, base.id, ok, today());
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── sentences & rules ──────────────────────────────────────────────────────
const KIND_ASK = {
  wmean: 'מה הפירוש בעברית?',
  wread: 'איזו מילה זו באנגלית?',
  decode: 'הקשיבי — איזו מילה שמעת? קראי את כל המילים!',
  answer: 'בחרי את התשובה המתאימה לשאלה:',
  question: 'על איזו שאלה זו התשובה?',
  fill: 'איזו מילה חסרה?',
  meaning: 'מה הפירוש של המשפט?',
  passage: 'קראי את הקטע וענִי על השאלה:',
  pick: '',
  hear: 'הקשיבי — איך כותבים את המילה?',
};

async function doBank(item, block) {
  const ok = item.kind === 'order' ? await orderView(item, block) : await mcView(item, block, { feedback: true });
  E.applyBankResult(state, sess, item.id, ok, today());
}

async function doRule(item) {
  const r = RULE[item.r];
  if (state.taught[r.id] !== today()) {
    await teachCard(r);
    state.taught[r.id] = today();
    E.tick(sess);
  }
  await doBank(item, 'rules');
}

function teachCard(r) {
  return new Promise((resolve) => {
    mount(
      topbar('rules'),
      h('div', { class: 'card' },
        h('div', { style: 'text-align:center' }, h('span', { class: 'mode-tag' }, `💡 כלל ${r.n}`)),
        h('h2', { style: 'text-align:center' }, r.title),
        h('div', { class: 'explain' }, r.teach),
        h('div', { class: 'ask' }, canSpeak() ? 'לחצי על מילה כדי לשמוע אותה:' : 'קראי את המילים בקול:'),
        h('div', { class: 'row center' }, r.ex.map((x) => h('button', { class: 'btn light en', onclick: () => speak(x) }, x))),
        h('div', { class: 'row center', style: 'margin-top:14px' }, h('button', { class: 'btn coral', onclick: resolve }, 'הבנתי ✓'))),
    );
  });
}

function promptBlock(item) {
  const parts = [];
  if (item.tag) parts.push(h('div', { style: 'text-align:center' }, h('span', { class: 'mode-tag' }, item.tag)));
  if (item.kind === 'wmean') {
    parts.push(h('div', { class: 'bigword en', style: 'margin:18px 0' }, item.word.en), h('div', { class: 'ask' }, KIND_ASK.wmean));
    if (item.speakWord) parts.push(h('div', { class: 'row center' }, h('button', { class: 'speak', onclick: () => speak(item.word.en) }, '🔊 שוב')));
    return parts;
  }
  if (item.kind === 'decode') {
    parts.push(h('div', { class: 'ask' }, KIND_ASK.decode),
      h('div', { class: 'row center' }, h('button', { class: 'btn light', style: 'font-size:30px', onclick: () => speak(item.word.en) }, '🔊 שוב')));
    return parts;
  }
  if (item.kind === 'wread') {
    parts.push(h('div', { class: 'emoji' }, item.word.emoji), h('div', { class: 'prompt-he' }, item.word.he), h('div', { class: 'ask' }, KIND_ASK.wread));
    if (item.speakWord) parts.push(h('div', { class: 'row center' }, h('button', { class: 'speak', onclick: () => speak(item.word.en) }, '🔊 שוב')));
    return parts;
  }
  if (item.kind === 'passage') parts.push(h('div', { class: 'passage en' }, item.passage.text));
  const ask = item.kind === 'pick' ? item.prompt : KIND_ASK[item.kind];
  if (ask) parts.push(h('div', { class: 'ask', style: item.kind === 'pick' ? 'font-size:22px;color:var(--navy);font-weight:800' : '' }, ask));
  if (item.kind === 'hear') parts.push(h('div', { class: 'row center' }, h('button', { class: 'btn light', style: 'font-size:28px', onclick: () => speak(item.word) }, '🔊 שוב')));
  else if (item.kind !== 'pick') parts.push(h('div', { class: 'prompt-en en' }, item.prompt));
  return parts;
}

/**
 * Multiple choice. Options appear after a short pause (read first, then
 * choose — the anti-guessing reveal from Mia Reading). One attempt only.
 * opts: { feedback: boolean, header?: Node[] } → resolves correct:boolean.
 */
function mcView(item, block, { feedback, header } = {}) {
  return new Promise((resolve) => {
    const correct = item.opts[0];
    const order = E.shuffle(item.opts);
    const isHe = item.kind === 'meaning' || item.kind === 'wmean';
    const isWord = item.kind === 'wmean' || item.kind === 'wread' || item.kind === 'decode';
    const optBox = h('div', { class: 'waiting' }, '…');
    const after = h('div');
    let box = null;
    let locked = false;

    async function choose(btn, val) {
      if (locked) return;
      locked = true;
      const ok = val === correct;
      if (!feedback) {
        btn.classList.add('picked');
        await wait(250);
        return resolve(ok);
      }
      [...box.children].forEach((b) => { if (b.dataset.v === correct) b.classList.add('good'); });
      if (ok) {
        after.replaceChildren(h('div', { class: 'fb good' }, pick(['נכון! 🎉', 'מעולה! ⭐', 'יש! 🙌'])));
        if (isWord) speak(item.word.en);
        await wait(1100);
        return resolve(true);
      }
      btn.classList.add('bad');
      if (isWord) speak(item.word.en);
      after.replaceChildren(
        item.expNode ?? h('div', { class: 'explain' }, '💡 ', item.exp),
        h('div', { class: 'row center' }, h('button', { class: 'btn coral', onclick: () => resolve(false) }, 'המשך ←')));
    }
    function reveal() {
      box = h('div', { class: 'opts' }, order.map((o) => {
        const b = h('button', { class: `opt ${isHe ? 'he' : 'en'}`, 'data-v': o }, o);
        b.addEventListener('click', () => choose(b, o));
        return b;
      }));
      optBox.replaceWith(box);
    }
    mount(
      header ?? topbar(block),
      h('div', { class: 'card' }, ...promptBlock(item), optBox, after),
    );
    if (item.kind === 'hear') speak(item.word);
    if (((item.kind === 'wread' || item.kind === 'wmean') && item.speakWord) || item.kind === 'decode') speak(item.word.en);
    const delay = item.kind === 'passage' ? 2500 : ['hear', 'wread', 'decode'].includes(item.kind) ? 900 : 1200;
    setTimeout(reveal, delay);
  });
}

/** Build a sentence by tapping words in order. One check; a miss shows the sentence. */
function orderView(item, block) {
  return new Promise((resolve) => {
    const tiles = E.shuffle(item.opts.map((t, i) => ({ t, i, used: false })));
    // guard against the shuffle landing on the answer
    if (tiles.every((t, k) => t.i === k)) tiles.push(tiles.shift());
    const built = [];
    let locked = false;
    const line = h('div', { class: 'answer en', style: 'font-size:24px;letter-spacing:0;flex-wrap:wrap;gap:8px;min-height:70px' });
    const tray = h('div', { class: 'tray' });
    const after = h('div');
    function paint() {
      line.replaceChildren(...built.map((ti, k) => h('button', {
        class: 'tile wtile', style: 'background:#E0EEFF;box-shadow:none',
        onclick: () => { if (locked) return; built.splice(k, 1); tiles.find((x) => x.i === ti).used = false; paint(); },
      }, item.opts[ti])));
      tray.replaceChildren(...tiles.map((t) => h('button', {
        class: `tile wtile ${t.used ? 'used' : ''}`,
        onclick: () => { if (locked || t.used) return; t.used = true; built.push(t.i); paint(); if (built.length === item.opts.length) check(); },
      }, t.t)));
    }
    async function check() {
      locked = true;
      await wait(300);
      const ok = built.every((ti, k) => item.opts[ti] === item.opts[k]);
      line.classList.add(ok ? 'good' : 'bad');
      if (ok) {
        after.replaceChildren(h('div', { class: 'fb good' }, pick(['נכון! 🎉', 'מעולה! ⭐'])));
        speak(item.prompt);
        await wait(1200);
        return resolve(true);
      }
      after.replaceChildren(
        h('div', { class: 'ask' }, 'המשפט הנכון:'),
        h('div', { class: 'prompt-en en' }, item.prompt),
        h('div', { class: 'explain' }, '💡 ', item.exp),
        h('div', { class: 'row center' }, h('button', { class: 'btn coral', onclick: () => resolve(false) }, 'המשך ←')));
    }
    mount(
      topbar(block),
      h('div', { class: 'card' },
        h('div', { class: 'ask' }, 'סדרי את המילים למשפט:'),
        line, tray, after),
    );
    paint();
  });
}

// ── end of session ─────────────────────────────────────────────────────────
function endCard() {
  const dayIndex = sess.dayIndex;
  const live = sess;
  const rec = E.finishSession(state);
  save();
  sendReport();
  const sum = E.wordSummary(state, WORDS);
  const acc = rec.scored ? Math.round((rec.correct / rec.scored) * 100) : 0;
  const why =
    rec.scored < E.MIN_ITEMS_FOR_STARS ? 'כוכבים מקבלים מ-8 תשובות ומעלה.' :
    rec.stars === 0 ? 'הפעם בלי כוכבים — לאט ובזהירות שווה יותר כוכבים!' :
    rec.stars >= 3 ? 'וואו! דיוק ורצף — בדיוק ככה!' : 'כל הכבוד על הדיוק!';
  const learned = rec.learnedToday.map((id) => WORD[id]?.en).filter(Boolean);
  const timeUp = E.elapsedMin(live) >= sessionTotal() - 0.01;
  const next =
    dayIndex <= 1 ? 'מחר שני אימונים: בראשון תכתבי בעצמך את הפירושים ✍️, ובשני — מבחן ניסיון 📝' :
    dayIndex === 2 && rec.mockDone ? 'מחר בבוקר עוד חזרה קצרה — ובהצלחה במבחן! 🍀' :
    dayIndex === 2 ? 'באימון הבא: חזרה קצרה ואז מבחן ניסיון 📝' :
    'בהצלחה במבחן! את מוכנה 🍀';

  mount(
    h('div', { class: 'card', style: 'text-align:center' },
      h('h1', {}, timeUp ? 'הזמן נגמר — כל הכבוד! 🎉' : 'סיימת הכול להיום! 🎉'),
      h('div', { class: 'stars' }, rec.stars ? '⭐'.repeat(rec.stars) : '☆'),
      h('div', { class: 'stat' }, why),
      rec.scored ? h('div', { class: 'stat' }, `דיוק: ${acc}% · רצף הכי ארוך: 🔥 ${rec.maxCombo}`) : null,
      rec.knownOnProbe ? h('div', { class: 'stat' }, `גילינו שאת כבר מכירה ${rec.knownOnProbe} מילים! 💪`) : null,
      learned.length ? h('div', { class: 'stat' }, `מילים חדשות שלמדת: `, en(learned.join(', '))) : null,
      h('div', { class: 'stat', style: 'font-weight:800;margin-top:10px' }, `המילים שלי: ${sum.sure + sum.today} מתוך ${sum.total}`),
      h('div', { class: 'stat muted' }, next)),
    h('div', { class: 'row center' },
      h('button', { class: 'btn teal', onclick: () => { sess = E.startSession(state, today()); sess.extraUntil = 10; save(); runLoop(); } }, '➕ עוד 10 דקות'),
      h('button', { class: 'btn coral', onclick: home }, 'למסך הבית')),
  );
}

// ── mock test ──────────────────────────────────────────────────────────────
let mock = null;

function mockIntro() {
  mount(
    h('div', { class: 'card' },
      h('h1', {}, '📝 מבחן ניסיון'),
      h('div', { class: 'stat', style: 'text-align:right' }, 'כמו מבחן אמיתי: בלי רמזים ובלי עזרה. את התשובות הנכונות נראה בסוף.'),
      h('ul', { style: 'font-size:18px;line-height:1.8' },
        h('li', {}, 'מה הפירוש של המילה'),
        h('li', {}, 'למצוא מילה באנגלית'),
        h('li', {}, 'שאלות ותשובות'),
        h('li', {}, 'קטע קריאה'),
        h('li', {}, 'כללי קריאה')),
      h('div', { class: 'muted' }, 'בערך 10 דקות. לאט ובזהירות — קוראים כל מילה עד הסוף!'),
      h('div', { class: 'row center', style: 'margin-top:14px' },
        h('button', { class: 'btn coral', onclick: startMock }, 'מתחילות! 🚀'),
        h('button', { class: 'btn light', onclick: home }, 'חזרה'))),
  );
}

function startMock() {
  loopToken += 1;
  runMock(() => { loopToken += 1; mock = null; home(); })
    .then((res) => { if (res) mockResult(res, home, 'למסך הבית'); });
}

/** The exam simulation as the last block of day 2's second session. */
async function mockInSession() {
  const token = loopToken;
  await new Promise((go) => mount(
    h('div', { class: 'topbar' }, h('button', { class: 'x', onclick: exitSession, 'aria-label': 'יציאה' }, '✕')),
    h('div', { class: 'card', style: 'text-align:center' },
      h('h1', {}, '📝 עכשיו: מבחן ניסיון'),
      h('div', { class: 'stat' }, 'כמו המבחן מחר: בלי רמזים ובלי שמיעה. את התשובות הנכונות נראה בסוף.'),
      h('div', { class: 'muted' }, 'בערך 15 דקות. לאט ובזהירות — קוראים כל מילה עד הסוף!'),
      h('div', { class: 'row center', style: 'margin-top:14px' }, h('button', { class: 'btn coral', onclick: go }, 'מתחילות! 🚀')))));
  if (token !== loopToken) return;
  const res = await runMock(exitSession);
  if (!res || token !== loopToken) return;
  sess.mockDone = true;
  save();
  await new Promise((go) => mockResult(res, go, 'סיום האימון'));
}

function mockHeader(i) {
  const pct = (i / mock.qs.length) * 100;
  return h('div', { class: 'topbar' },
    h('button', { class: 'x', onclick: mock.exit, 'aria-label': 'יציאה' }, '✕'),
    h('div', { class: 'chip' }, `📝 שאלה ${i + 1} מתוך ${mock.qs.length}`),
    h('div', { class: 'timebar' }, h('div', { style: `width:${pct}%;background:var(--purple)` })));
}

const cleanHe = E.cleanHe;

/** Runs the questions; resolves the result, or null if she left. */
async function runMock(exit) {
  const qs = E.buildMock(state, { words: WORDS, sentenceItems: SENTENCE_ITEMS, passages: PASSAGES, ruleItems: RULE_ITEMS, canHear: canSpeak() });
  mock = { qs, answers: [], exit };
  const token = loopToken;
  for (let i = 0; i < mock.qs.length; i++) {
    const q = mock.qs[i];
    let ans;
    if (q.kind === 'meaning' || q.kind === 'read') {
      const item = wordItem(q.word, q.kind === 'read' ? 'read' : 'probe', { mock: true });
      ans = { correct: await mcView(item, null, { feedback: false, header: mockHeader(i) }) };
    } else {
      const item = q.kind === 'passage' ? { ...q.item, kind: 'passage', passage: q.passage } : q.item;
      const ok = await mcView(item, null, { feedback: false, header: mockHeader(i) });
      ans = { correct: ok };
    }
    if (token !== loopToken) return null;
    mock.answers.push(ans);
  }
  const res = E.applyMock(state, mock.qs, mock.answers, today());
  save();
  return res;
}

function mockResult(res, onDone, doneLabel) {
  sendReport();
  const rows = res.wrong.map((i) => {
    const q = mock.qs[i];
    const a = mock.answers[i];
    if (q.kind === 'meaning' || q.kind === 'read') return h('div', { class: 'explain' }, q.word.emoji, ' ', en(q.word.en, 'prompt-en'), ` = ${cleanHe(q.word.he)}`, h('div', { class: 'small' }, '💡 ', q.word.tip));
    return h('div', { class: 'explain' }, en(q.item.prompt ?? q.item.word ?? ''), h('div', {}, 'התשובה: ', en(q.item.opts[0])), h('div', { class: 'small' }, '💡 ', q.item.exp));
  });
  const msg = res.score === 100 ? 'מושלם! את מוכנה למבחן! 🏆' : res.score >= 90 ? 'כמעט מושלם! עוד חזרה קטנה על הטעויות 💪' : 'יופי של עבודה! בואי נחזור על הטעויות — הן יופיעו באימון הבא.';
  mount(
    h('div', { class: 'card', style: 'text-align:center' },
      h('h1', {}, 'הציון שלך'),
      h('div', { style: 'font-size:72px;font-weight:800;color:var(--good)' }, String(res.score)),
      h('div', { class: 'stat' }, msg)),
    rows.length ? h('div', { class: 'card' }, h('h2', {}, `מה כדאי לחזק (${rows.length})`), rows) : null,
    h('div', { class: 'row center' }, h('button', { class: 'btn coral', onclick: onDone }, doneLabel)),
  );
  mock = null;
}

// ── parent view ────────────────────────────────────────────────────────────
const BOX_LABEL = ['לא נבדקה', 'בלמידה', 'כמעט', 'בוחרת נכון', 'כותבת לבד'];

function parent() {
  if (updateReady) { save(); location.reload(); return; }
  const sum = E.wordSummary(state, WORDS);
  const hard = hardWords();
  const sb = E.bankSummary(state, SENTENCE_BANK);
  const rb = E.bankSummary(state, RULE_ITEMS);
  const db = E.bankSummary(state, DECODE_BANK);
  const lastMock = state.mocks.at(-1);
  const ready = sum.sure + sum.today;

  mount(
    h('div', { class: 'spread' }, h('h1', {}, 'להורים'), h('button', { class: 'btn light', onclick: home }, 'חזרה')),
    h('div', { class: 'card' },
      h('div', { class: 'headline' }, `מילים: ${ready}/${sum.total} ידועות (${sum.sure} מהן "בטוח": כתבה את הפירוש לבד)`),
      h('div', { class: 'small muted', style: 'margin:6px 0' }, 'לפי המורה: צריך לקרוא את המילים ולדעת את הפירוש (לא לכתוב באנגלית). מילה "ידועה" כשמיה בוחרת את הפירוש הנכון בלי תמונה. "בטוח" = ביום אחר היא גם כתבה את הפירוש בעברית בעצמה; שגיאות כתיב בעברית לא נחשבות.'),
      h('div', {}, `לא נבדקו: ${sum.unseen} · בלמידה: ${sum.learning}`),
      h('div', {}, `משפטים ושאלות: ${sb.done}/${sb.total} נכון · ${sb.shaky} לחזק · ${sb.unseen} לא נראו`),
      h('div', {}, `כללי קריאה: ${rb.done}/${rb.total} נכון · ${rb.shaky} לחזק · ${rb.unseen} לא נראו`),
      h('div', {}, `קריאה ושמיעה (לשמוע מילה ולמצוא אותה כתובה): ${db.done}/${db.total} נכון · ${db.shaky} לחזק · ${db.unseen} לא נראו`),
      h('div', {}, lastMock ? `מבחן ניסיון אחרון: ${lastMock.score} (${new Date(lastMock.at).toLocaleString('he-IL')})` : 'מבחן ניסיון: עוד לא נעשה')),
    typedReviewCard(),
    hard.length ? h('div', { class: 'card' },
      h('h2', {}, 'מילים לתרגל יחד בעל-פה 🗣️'),
      h('div', { class: 'small muted' }, 'הראו למיה את המילה כתובה באנגלית: שתקרא אותה בקול ותגיד מה הפירוש. אלה המילים שהכי קשות לה כרגע.'),
      h('table', {}, h('tbody', {}, hard.map(([w, s]) => h('tr', {},
        h('td', {}, en(w.en)), h('td', {}, cleanHe(w.he)),
        h('td', {}, h('span', { class: `pill b${s.box}` }, BOX_LABEL[s.box])),
        h('td', { class: 'muted' }, `${s.misses} טעויות`)))))) : null,
    h('div', { class: 'card' },
      h('h2', {}, 'כל המילים'),
      GROUPS.map((g) => [
        h('div', { style: 'font-weight:800;margin-top:10px' }, `${g.title}${g.pages ? ` (עמ׳ ${g.pages})` : ''}`),
        h('div', { class: 'row', style: 'gap:6px' }, WORDS.filter((w) => w.g === g.id).map((w) => {
          const b = state.words[w.id]?.box ?? 0;
          return h('span', { class: `pill b${b}`, title: BOX_LABEL[b] }, en(w.en));
        })),
      ]),
      h('div', { class: 'small muted', style: 'margin-top:10px' },
        h('span', { class: 'pill b4' }, 'יודעת בטוח'), ' ', h('span', { class: 'pill b3' }, 'נכון פעם אחת'), ' ',
        h('span', { class: 'pill b2' }, 'כמעט'), ' ', h('span', { class: 'pill b1' }, 'בלמידה'), ' ', h('span', { class: 'pill b0' }, 'לא נבדקה'))),
    h('div', { class: 'card' },
      h('h2', {}, 'אימונים'),
      state.sessions.length ? h('table', {}, h('tbody', {},
        h('tr', {}, h('th', {}, 'יום'), h('th', {}, 'דקות'), h('th', {}, 'דיוק'), h('th', {}, 'כוכבים'), h('th', {}, 'ידעה מראש'), h('th', {}, 'למדה')),
        state.sessions.map((s) => h('tr', {},
          h('td', {}, s.day), h('td', {}, String(s.minutes)),
          h('td', {}, s.scored ? `${Math.round((s.correct / s.scored) * 100)}%` : '—'),
          h('td', {}, String(s.stars)), h('td', {}, String(s.knownOnProbe)), h('td', {}, String(s.learnedToday.length)))))) :
        h('div', { class: 'muted' }, 'עוד אין אימונים.'),
      h('div', { class: 'small muted', style: 'margin-top:8px' }, 'דיוק נספר רק בניסיון הראשון. בדיקה של מילה שמיה עוד לא למדה לא נחשבת כטעות.')),
    h('div', { class: 'card small muted' },
      h('div', {}, `השמעה באנגלית: ${canSpeak() ? `פעילה (${enVoice.name})` : 'לא זמינה במכשיר — שאלות "הקשיבי" מדולגות'}`)),
    reportCard(),
    h('div', { class: 'card small muted' },
      h('div', { class: 'row', style: 'margin-top:10px' },
        h('button', { class: 'btn light', onclick: resetAll }, 'איפוס כל ההתקדמות')),
      h('div', { style: 'margin-top:10px' }, `גרסה: ${BUILD}`)),
  );
}

// Typed answers the checker did not recognise: a parent can accept a synonym
// it does not know (counted as correct from now on) or dismiss it.
function typedReviewCard() {
  const log = state.typedLog ?? [];
  if (!log.length) return null;
  const rows = log.map((e, i) => [e, i]).reverse().slice(0, 15);
  return h('div', { class: 'card' },
    h('h2', {}, '✍️ תשובות שהאפליקציה לא זיהתה'),
    h('div', { class: 'small muted' }, 'שגיאות כתיב כבר מתקבלות. אם מיה כתבה פירוש נכון שהאפליקציה לא מכירה — לחצו "היא צדקה" והמילה תקבל את הנקודה.'),
    h('table', {}, h('tbody', {}, rows.map(([e, i]) => {
      const w = WORD[e.id];
      return h('tr', {},
        h('td', {}, en(w?.en ?? e.id)),
        h('td', {}, `"${e.typed}"`),
        h('td', { class: 'muted' }, w ? cleanHe(w.he) : ''),
        h('td', {},
          h('button', { class: 'btn light', style: 'padding:6px 10px;font-size:15px', onclick: () => { E.approveTyped(state, i); save(); sendReport(); parent(); } }, 'היא צדקה ✓'),
          h('button', { class: 'btn ghost', style: 'padding:6px 10px;font-size:15px', onclick: () => { E.dismissTyped(state, i); save(); parent(); } }, 'הסתר')));
    }))));
}

function resetAll() {
  if (!confirm('למחוק את כל ההתקדמות של מיה? אי אפשר לבטל.')) return;
  if (!confirm('בטוח? כל המילים יחזרו להתחלה.')) return;
  state = E.freshState();
  save();
  home();
}

// Leaving mid-session keeps it resumable; send the latest summary on the way out.
document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); sendReport(); } else checkForUpdate(); });

// A tablet can keep the page open for days. When it comes back to the front,
// look for a newer build; it loads at the next home or parent screen, never mid-question.
function checkForUpdate() {
  fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { if (j?.build && j.build !== BUILD) updateReady = true; })
    .catch(() => {});
}
window.addEventListener('pageshow', (e) => { if (e.persisted) checkForUpdate(); });

function hardWords() {
  return WORDS.map((w) => [w, state.words[w.id]]).filter(([, s]) => s && (s.misses >= 2 || (s.box > 0 && s.box < 3)))
    .sort((a, b) => b[1].misses - a[1].misses);
}

// ── one-way daily summary for the Mia Math email ───────────────────────────
// Progress stays on this tablet. With a pairing key (set once by a parent via
// the #pair= link or the parent screen) the app POSTs a small summary — counts,
// hard words, practice-test score — that the daily email shows. Nothing is
// ever read back. text/plain keeps it a "simple" request: no CORS preflight,
// so keepalive delivers it even as the tab closes.
const REPORT_URL = 'https://qstwjwkaiirtqudghiqi.supabase.co/functions/v1/english-report';
const PAIR_KEY = 'miaEnglish.reportKey';
const SENT_KEY = 'miaEnglish.reportStatus';
let lastSentBody = '';

function reportKey() { try { return localStorage.getItem(PAIR_KEY) || ''; } catch { return ''; } }
function reportStatus() { try { return JSON.parse(localStorage.getItem(SENT_KEY) || 'null'); } catch { return null; } }
function setReportStatus(v) { try { localStorage.setItem(SENT_KEY, JSON.stringify(v)); } catch {} }

function buildSummary() {
  const t = today();
  const sum = E.wordSummary(state, WORDS);
  const recs = state.sessions.filter((s) => s.day === t);
  const live = state.current && state.current.day === t ? state.current : null;
  const add = (f) => recs.reduce((a, s) => a + (s[f] || 0), 0) + (live ? live[f] || 0 : 0);
  const lastMock = state.mocks.at(-1);
  const pair = (b) => [b.done, b.total];
  return {
    day: t,
    words: { total: sum.total, sure: sum.sure, once: sum.today, learning: sum.learning, unseen: sum.unseen },
    hard: hardWords().slice(0, 12).map(([w]) => w.en),
    today: {
      minutes: recs.reduce((a, s) => a + (s.minutes || 0), 0) + (live ? E.elapsedMin(live) : 0),
      sessions: recs.length + (live ? 1 : 0),
      scored: add('scored'),
      correct: add('correct'),
      stars: recs.reduce((a, s) => a + (s.stars || 0), 0),
    },
    mock: lastMock ? { score: lastMock.score, day: lastMock.day } : null,
    banks: {
      sentences: pair(E.bankSummary(state, SENTENCE_BANK)),
      rules: pair(E.bankSummary(state, RULE_ITEMS)),
      decode: pair(E.bankSummary(state, DECODE_BANK)),
    },
    build: BUILD,
  };
}

function sendReport() {
  const key = reportKey();
  if (!key || !navigator.onLine) return;
  const body = JSON.stringify({ key, summary: buildSummary() });
  if (body === lastSentBody) return;
  lastSentBody = body;
  fetch(REPORT_URL, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } })
    .then((r) => {
      // A rejected code is useless: forget it so the parent screen asks for it again.
      if (r.status === 401) { try { localStorage.removeItem(PAIR_KEY); } catch {} lastSentBody = ''; }
      setReportStatus({ at: Date.now(), ok: r.ok, code: r.status });
    })
    .catch(() => { lastSentBody = ''; setReportStatus({ at: Date.now(), ok: false, code: 0 }); });
}

function reportCard() {
  const key = reportKey();
  const st = reportStatus();
  const input = h('input', { type: 'text', placeholder: 'קוד חיבור', dir: 'ltr', autocapitalize: 'none', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', style: 'font-size:16px;padding:10px;border-radius:12px;border:2px solid #E3E5EF;flex:1;min-width:0' });
  const when = st ? new Date(st.at).toLocaleString('he-IL') : '';
  return h('div', { class: 'card' },
    h('h2', {}, '📧 דיווח למייל היומי'),
    h('div', { class: 'small muted' }, 'ההתקדמות נשמרת רק בטאבלט. אם יש קוד חיבור, נשלח סיכום קצר (מספרים, מילים קשות וציון מבחן ניסיון) למייל היומי של Mia Math. שום דבר לא נקרא בחזרה.'),
    key
      ? h('div', { style: 'margin-top:8px' },
          h('div', {}, st ? (st.ok ? `✅ מחובר · נשלח לאחרונה: ${when}` : `⚠️ השליחה האחרונה נכשלה (${st.code || 'אין רשת'}) · ${when}`) : '✅ מחובר · עוד לא נשלח'),
          h('div', { class: 'row', style: 'margin-top:8px' },
            h('button', { class: 'btn light', onclick: () => { lastSentBody = ''; sendReport(); setTimeout(parent, 1500); } }, 'שלחי עכשיו'),
            h('button', { class: 'btn ghost', onclick: () => { if (!confirm('לנתק את הדיווח למייל?')) return; localStorage.removeItem(PAIR_KEY); localStorage.removeItem(SENT_KEY); parent(); } }, 'ניתוק')))
      : h('div', { style: 'margin-top:8px' },
        st && st.code === 401 ? h('div', { style: 'color:#C0392B;font-weight:700' }, '❌ קוד החיבור לא התקבל. הכי פשוט: לפתוח שוב את קישור החיבור בטאבלט. בהקלדה — אותיות גדולות וקטנות חשובות.') : null,
        h('div', { class: 'row', style: 'margin-top:8px' },
          input,
          h('button', { class: 'btn teal', onclick: () => { const v = input.value.trim(); if (v.length < 16) return; localStorage.setItem(PAIR_KEY, v); lastSentBody = ''; sendReport(); setTimeout(parent, 1500); } }, 'חיבור'))));
}

// One-time pairing link: https://…/mia-english/#pair=<key>
(function pairFromLink() {
  const m = location.hash.match(/^#pair=([\w-]{16,100})$/);
  if (!m) return;
  try { localStorage.setItem(PAIR_KEY, m[1]); } catch {}
  history.replaceState(null, '', location.pathname + location.search);
})();
sendReport();

home();
