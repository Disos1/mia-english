// Content for Jet 2 – Unit 1 (grade 4), taken from the teacher's exam summary
// (pages 26–78) and the workbook "Check your words" page 76.
//
// Words: `en` is the canonical spelling shown to her. `accept` lists other
// spellings graded as correct (case and extra spaces are always ignored).
// `he` is the Hebrew prompt. Where one Hebrew word maps to two English words
// (כיתה → grade / class) the prompt carries a hint so recall is answerable.
// `tip` is the spelling explanation shown after a miss (teach, don't just test);
// it points at the teacher's reading-rule numbers where one applies.

export const GROUPS = [
  { id: 'g1', pages: '26–29', title: 'בית, חברים ובית ספר' },
  { id: 'g2', pages: '36–39', title: 'משפחה' },
  { id: 'g3', pages: '46–49', title: 'בכיתה' },
  { id: 'g4', pages: '56–59', title: 'טלפון וכתובת' },
  { id: 'g5', pages: '66–69', title: 'שיעורים וימים' },
  { id: 'g6', pages: '',      title: 'ימי השבוע' },
];

export const WORDS = [
  // ── pages 26–29 ──
  { id: 'house',   g: 'g1', en: 'house',   he: 'בית',            emoji: '🏠', tip: 'ou נשמע "אַאוּ" — כמו mouse (כלל 4).' },
  { id: 'new',     g: 'g1', en: 'new',     he: 'חדש',            emoji: '🆕', tip: 'שלוש אותיות: n-e-w. ה-ew נשמע "יוּ".' },
  { id: 'friend',  g: 'g1', en: 'friend',  he: 'חבר',            emoji: '🧑‍🤝‍🧑', tip: 'מילה טריקית: יש i שקטה! fr-i-end. טריק: "a friend to the END".' },
  { id: 'grade',   g: 'g1', en: 'grade',   he: 'כיתה (שכבה — כמו "כיתה ד׳")', emoji: '4️⃣', tip: 'E קסומה בסוף: a_e נשמע "אֵיי" — כמו cake (כלל 1).' },
  { id: 'town',    g: 'g1', en: 'town',    he: 'עיר',            emoji: '🏘️', tip: 'ow נשמע "אַאוּ" — כמו cow (כלל 4).' },
  { id: 'school',  g: 'g1', en: 'school',  he: 'בית ספר',        emoji: '🏫', tip: 'sch-oo-l: ה-ch כאן נשמעת כמו "ק", ו-oo ארוכה כמו moon (כלל 5).' },
  { id: 'teacher', g: 'g1', en: 'teacher', he: 'מורה',           emoji: '👩‍🏫', tip: 'te-a-ch-er: ea = "אִי" ארוכה (כלל 9), ch (כלל 2), er בסוף (כלל 7).' },
  { id: 'name',    g: 'g1', en: 'name',    he: 'שם',             emoji: '📛', tip: 'E קסומה: a_e = "אֵיי" (כלל 1).' },
  { id: 'live',    g: 'g1', en: 'live',    he: 'לגור / גר',       emoji: '🏡', tip: 'l-i-v-e. כאן ה-E בסוף שקטה וה-i קצרה: "לִיב".' },

  // ── pages 36–39 ──
  { id: 'brother', g: 'g2', en: 'brother', he: 'אח',             emoji: '👦', tip: 'br-o-th-er: th (כלל 2) ו-er בסוף (כלל 7).' },
  { id: 'sister',  g: 'g2', en: 'sister',  he: 'אחות',           emoji: '👧', tip: 's-i-s-t-er: er בסוף (כלל 7).' },
  { id: 'family',  g: 'g2', en: 'family',  he: 'משפחה',          emoji: '👨‍👩‍👧‍👦', tip: 'fa-mi-ly: Y בסוף מילה ארוכה נשמעת "אִי" (כלל 3).' },
  { id: 'talk',    g: 'g2', en: 'talk',    he: 'לדבר',           emoji: '🗣️', tip: 'יש l שקטה: t-a-l-k. אומרים "טוֹק" אבל כותבים talk.' },
  { id: 'bird',    g: 'g2', en: 'bird',    he: 'ציפור',          emoji: '🐦', tip: 'ir כמו girl (כלל 7): b-ir-d.' },
  { id: 'fly',     g: 'g2', en: 'fly',     he: 'לעוף',           emoji: '🕊️', tip: 'Y בסוף מילה קצרה נשמעת "אַיי" — כמו my, sky (כלל 3).' },
  { id: 'English', g: 'g2', en: 'English', he: 'אנגלית',         emoji: '🇬🇧', tip: 'Eng-li-sh: sh בסוף (כלל 2). שם של שפה מתחיל באות גדולה: E.' },
  { id: 'lesson',  g: 'g2', en: 'lesson',  he: 'שיעור',          emoji: '📖', tip: 'שתי s באמצע: le-ss-on (כלל 8).' },
  { id: 'want',    g: 'g2', en: 'want',    he: 'רוצה',           emoji: '🙏', tip: 'אומרים "ווֹנְט" אבל כותבים עם a: w-a-n-t.' },
  { id: 'nice',    g: 'g2', en: 'nice',    he: 'נחמד / יפה',      emoji: '😊', tip: 'E קסומה: i_e = "אַיי" (כלל 1). ה-c נשמעת כמו s.' },
  { id: 'father',  g: 'g2', en: 'father',  he: 'אבא',            emoji: '👨', tip: 'fa-th-er: th (כלל 2), er בסוף (כלל 7).' },
  { id: 'mother',  g: 'g2', en: 'mother',  he: 'אמא',            emoji: '👩', tip: 'mo-th-er: כמו brother, רק עם m.' },
  { id: 'grandma', g: 'g2', en: 'grandma', he: 'סבתא',           emoji: '👵', tip: 'grand + ma = grandma (מילה אחת, בלי רווח).' },
  { id: 'grandpa', g: 'g2', en: 'grandpa', he: 'סבא',            emoji: '👴', tip: 'grand + pa = grandpa (מילה אחת, בלי רווח).' },

  // ── pages 46–49 ──
  { id: 'book',     g: 'g3', en: 'book',     he: 'ספר',          emoji: '📕', tip: 'oo קצרה — כמו look, cook (כלל 5).' },
  { id: 'paper',    g: 'g3', en: 'paper',    he: 'נייר',         emoji: '📄', tip: 'pa-per: er בסוף (כלל 7).' },
  { id: 'pencil',   g: 'g3', en: 'pencil',   he: 'עיפרון',       emoji: '✏️', tip: 'pen-cil: ה-c נשמעת כמו s. pen + cil.' },
  { id: 'board',    g: 'g3', en: 'board',    he: 'לוח',          emoji: '🟩', tip: 'b-oa-r-d: יש a שקטה אחרי ה-o.' },
  { id: 'eraser',   g: 'g3', en: 'eraser',   he: 'מחק',          emoji: '🧽', tip: 'e-ra-ser: מתחיל ב-e, נגמר ב-er (כלל 7).' },
  { id: 'scissors', g: 'g3', en: 'scissors', he: 'מספריים',      emoji: '✂️', tip: 'מילה קשה! s-c-i-ss-o-r-s: sc בהתחלה, ss באמצע, s בסוף.' },
  { id: 'need',     g: 'g3', en: 'need',     he: 'צריך',         emoji: '❗', tip: 'ee = "אִי" ארוכה — כמו tree (כלל 9).' },
  { id: 'chair',    g: 'g3', en: 'chair',    he: 'כיסא',         emoji: '🪑', tip: 'ch בהתחלה (כלל 2), ואז air.' },
  { id: 'notebook', g: 'g3', en: 'notebook', he: 'מחברת',        emoji: '📓', tip: 'note + book = notebook (מילה אחת). note עם E קסומה.' },
  { id: 'thanks',   g: 'g3', en: 'thanks',   he: 'תודה',         emoji: '👍', accept: ['thank you'], tip: 'th בהתחלה (כלל 2): th-a-n-k-s.' },
  { id: 'homework', g: 'g3', en: 'homework', he: 'שיעורי בית',   emoji: '📝', tip: 'home + work = homework (מילה אחת). home עם E קסומה (כלל 1).' },
  { id: 'lunch',    g: 'g3', en: 'lunch',    he: 'ארוחת צהריים', emoji: '🥪', tip: 'ch בסוף (כלל 2): l-u-n-ch.' },

  // ── pages 56–59 ──
  { id: 'address', g: 'g4', en: 'address', he: 'כתובת',          emoji: '📍', tip: 'שתי d ושתי s: a-dd-re-ss.' },
  { id: 'phone',   g: 'g4', en: 'phone',   he: 'טלפון',          emoji: '📱', tip: 'ph = "פ" (כלל 2), ו-o_e עם E קסומה (כלל 1).' },
  { id: 'number',  g: 'g4', en: 'number',  he: 'מספר (כמו 1, 2, 3)', emoji: '🔢', tip: 'num-ber: er בסוף (כלל 7).' },
  { id: 'see',     g: 'g4', en: 'see',     he: 'לראות',          emoji: '👀', tip: 'ee = "אִי" ארוכה (כלל 9).' },
  { id: 'me',      g: 'g4', en: 'me',      he: 'אותי / לי',      emoji: '🙋‍♀️', tip: 'E בסוף מילה קצרה = "אִי" — כמו he, she, we (כלל 10).' },
  { id: 'please',  g: 'g4', en: 'please',  he: 'בבקשה',          emoji: '🙏', tip: 'pl-ea-se: ea = "אִי" (כלל 9) ו-e שקטה בסוף.' },
  { id: 'food',    g: 'g4', en: 'food',    he: 'אוכל',           emoji: '🍎', tip: 'oo ארוכה — כמו moon (כלל 5).' },
  { id: 'write',   g: 'g4', en: 'write',   he: 'לכתוב',          emoji: '✍️', tip: 'יש w שקטה בהתחלה! w-r-i-t-e, ו-i_e עם E קסומה (כלל 1).' },
  { id: 'pupil',   g: 'g4', en: 'pupil',   he: 'תלמיד / תלמידה', emoji: '🧒', tip: 'pu-pil: "פְּיוּ-פִּיל".' },
  { id: 'meet',    g: 'g4', en: 'meet',    he: 'להיפגש',         emoji: '🤝', tip: 'ee = "אִי" ארוכה (כלל 9): m-ee-t.' },
  { id: 'street',  g: 'g4', en: 'street',  he: 'רחוב',           emoji: '🛣️', tip: 'str-ee-t: ee = "אִי" ארוכה (כלל 9).' },

  // ── pages 66–69 ──
  { id: 'art',      g: 'g5', en: 'art',      he: 'אומנות',       emoji: '🎨', tip: 'ar כמו car (כלל 7).' },
  { id: 'math',     g: 'g5', en: 'math',     he: 'מתמטיקה',      emoji: '➕', tip: 'th בסוף (כלל 2): m-a-th.' },
  { id: 'music',    g: 'g5', en: 'music',    he: 'מוזיקה',       emoji: '🎵', tip: 'mu-sic: ה-s נשמעת "ז", נגמר ב-c.' },
  { id: 'sports',   g: 'g5', en: 'sports',   he: 'ספורט',        emoji: '⚽', accept: ['sport'], tip: 'or כמו fork (כלל 7): sp-or-ts.' },
  { id: 'class',    g: 'g5', en: 'class',    he: 'כיתה (החדר / התלמידים)', emoji: '🧑‍🏫', tip: 'שתי s בסוף: cla-ss (כלל 8).' },
  { id: 'computer', g: 'g5', en: 'computer', he: 'מחשב',         emoji: '💻', tip: 'com-pu-ter: er בסוף (כלל 7).' },
  { id: 'day',      g: 'g5', en: 'day',      he: 'יום',          emoji: '📅', tip: 'ay בסוף = "אֵיי" (כלל 11).' },
  { id: 'week',     g: 'g5', en: 'week',     he: 'שבוע',         emoji: '🗓️', tip: 'ee = "אִי" ארוכה (כלל 9).' },
  { id: 'happy',    g: 'g5', en: 'happy',    he: 'שמח',          emoji: '😀', tip: 'שתי p, ו-Y בסוף מילה ארוכה = "אִי" (כלל 3).' },
  { id: 'learn',    g: 'g5', en: 'learn',    he: 'ללמוד',        emoji: '🧠', tip: 'l-ea-r-n: אומרים "לֶרְן" אבל כותבים ear באמצע.' },
  { id: 'favorite', g: 'g5', en: 'favorite', he: 'אהוב / מועדף',  emoji: '⭐', accept: ['favourite'], tip: 'fa-vo-ri-te: נגמר ב-e שקטה.' },

  // ── days of the week ──
  { id: 'Sunday',    g: 'g6', en: 'Sunday',    he: 'יום ראשון', emoji: '1️⃣', tip: 'Sun + day. ימי השבוע מתחילים באות גדולה.' },
  { id: 'Monday',    g: 'g6', en: 'Monday',    he: 'יום שני',   emoji: '2️⃣', tip: 'Mon + day. ay בסוף (כלל 11).' },
  { id: 'Tuesday',   g: 'g6', en: 'Tuesday',   he: 'יום שלישי', emoji: '3️⃣', tip: 'Tues + day: T-u-e-s-day.' },
  { id: 'Wednesday', g: 'g6', en: 'Wednesday', he: 'יום רביעי', emoji: '4️⃣', tip: 'הכי טריקית! אומרים "וֶנְזְדֵיי" אבל כותבים Wed-nes-day. טריק: תגידי בראש "וֶד-נֶס-דֵיי".' },
  { id: 'Thursday',  g: 'g6', en: 'Thursday',  he: 'יום חמישי', emoji: '5️⃣', tip: 'Th-ur-s-day: מתחיל ב-th (כלל 2), ואז ur.' },
  { id: 'Friday',    g: 'g6', en: 'Friday',    he: 'יום שישי',  emoji: '6️⃣', tip: 'Fri + day.' },
  { id: 'Saturday',  g: 'g6', en: 'Saturday',  he: 'יום שבת',   emoji: '7️⃣', tip: 'Sat-ur-day.' },
];

// ── Sentences & questions (exam summary page 3) ─────────────────────────────
// Every item has `exp`: the explanation shown after any miss.
// Personal details always belong to fictional kids — the app never asks Mia
// for her own address or phone number.

export const PATTERNS = [
  { id: 'name',   q: "What's your name?",         a: 'My name is ___.',          he: 'מה השם שלך? — השם שלי הוא ___.' },
  { id: 'live',   q: 'Where do you live?',         a: 'I live in ___.',           he: 'איפה את גרה? — אני גרה ב___.' },
  { id: 'age',    q: 'How old are you?',           a: 'I am ___ years old.',      he: 'בת כמה את? — אני בת ___.' },
  { id: 'sib',    q: 'I have ___ sisters and ___ brothers.', a: '', he: 'יש לי ___ אחיות ו___ אחים.' },
  { id: 'have',   q: 'Do you have ___?',           a: "Yes, I do. / No, I don't.", he: 'האם יש לך ___? — כן, יש לי. / לא, אין לי.' },
  { id: 'letsgo', q: "Let's go to ___.",           a: '',                         he: 'בואי נלך ל___.' },
  { id: 'phone',  q: "What's your phone number?",  a: 'My phone number is ___.',  he: 'מה מספר הטלפון שלך?' },
  { id: 'addr',   q: "What's your address?",       a: 'My address is ___ street.', he: 'מה הכתובת שלך?' },
  { id: 'fav',    q: "What's your favorite ___?",  a: 'My favorite ___ is ___.',  he: 'מה ה___ האהוב עלייך?' },
  { id: 'like',   q: 'I like ___. / I don\'t like ___.', a: '',                    he: 'אני אוהבת ___. / אני לא אוהבת ___.' },
  { id: 'fun',    q: '___ is fun.',                a: '',                         he: '___ זה כיף.' },
];

// Item kinds:
//   answer   — a question; pick the answer that fits it
//   question — an answer; pick the question it answers
//   fill     — sentence with a blank; pick the missing word
//   order    — tap the words in the right order
//   meaning  — pick the Hebrew meaning
// `opts[0]` is always the correct option in the source; the UI shuffles.
export const SENTENCE_ITEMS = [
  // answer ← question
  { id: 's1', p: 'name', kind: 'answer', prompt: "What's your name?", opts: ['My name is Noa.', 'I live in Haifa.', 'I am 9 years old.', 'Yes, I do.'], exp: 'השאלה "What\'s your name?" שואלת מה השם. עונים: My name is…' },
  { id: 's2', p: 'live', kind: 'answer', prompt: 'Where do you live?', opts: ['I live in Tel Aviv.', 'My name is Dan.', 'I like art.', 'No, I don\'t.'], exp: 'Where = איפה. "Where do you live?" = איפה את גרה? עונים: I live in…' },
  { id: 's3', p: 'age', kind: 'answer', prompt: 'How old are you?', opts: ['I am 9 years old.', 'I have 2 sisters.', 'It\'s 25 Rose street.', 'My name is Tom.'], exp: 'How old = בן/בת כמה. עונים עם גיל: I am … years old.' },
  { id: 's4', p: 'have', kind: 'answer', prompt: 'Do you have a pencil?', opts: ['Yes, I do.', 'Yes, I am.', 'I live in a pencil.', 'My pencil is Dan.'], exp: 'שאלה שמתחילה ב-Do you…? עונים: Yes, I do. או No, I don\'t.' },
  { id: 's5', p: 'phone', kind: 'answer', prompt: "What's your phone number?", opts: ["It's 054-1234567.", "It's Rose street.", 'I am 9 years old.', 'My name is Maya.'], exp: 'phone number = מספר טלפון, אז התשובה היא מספר.' },
  { id: 's6', p: 'addr', kind: 'answer', prompt: "What's your address?", opts: ["It's 12 Rose street.", "It's 054-7654321.", 'I like music.', 'Yes, I do.'], exp: 'address = כתובת, אז התשובה היא רחוב ומספר בית: …street.' },
  { id: 's7', p: 'fav', kind: 'answer', prompt: "What's your favorite lesson?", opts: ['My favorite lesson is art.', 'My favorite lesson is Tuesday.', 'I have a lesson.', 'I am a lesson.'], exp: 'lesson = שיעור, אז עונים בשם של שיעור: art, math, music, English, sports.' },
  { id: 's8', p: 'fav', kind: 'answer', prompt: "What's your favorite day?", opts: ['My favorite day is Friday.', 'My favorite day is math.', 'I am happy.', 'It\'s 7 street.'], exp: 'day = יום, אז עונים ביום בשבוע: Sunday, Monday… Friday.' },
  // question ← answer
  { id: 's9',  p: 'age',  kind: 'question', prompt: 'I am 10 years old.', opts: ['How old are you?', 'Where do you live?', "What's your name?", 'Do you have a book?'], exp: 'התשובה מספרת גיל, אז השאלה היא How old are you?' },
  { id: 's10', p: 'live', kind: 'question', prompt: 'I live in Eilat.', opts: ['Where do you live?', 'How old are you?', "What's your phone number?", "What's your favorite lesson?"], exp: 'התשובה מספרת איפה גרים (live), אז השאלה היא Where do you live?' },
  { id: 's11', p: 'name', kind: 'question', prompt: 'My name is Yoni.', opts: ["What's your name?", 'Where do you live?', 'How old are you?', "What's your address?"], exp: 'name = שם. השאלה: What\'s your name?' },
  { id: 's12', p: 'have', kind: 'question', prompt: "No, I don't. I don't have a computer.", opts: ['Do you have a computer?', 'Where is the computer?', 'How old is the computer?', "What's your computer?"], exp: 'No, I don\'t עונה על שאלה שמתחילה ב-Do you have…?' },
  { id: 's13', p: 'phone', kind: 'question', prompt: 'My phone number is 052-3344556.', opts: ["What's your phone number?", "What's your address?", 'How old are you?', 'Where do you live?'], exp: 'יש פה מספר טלפון, אז השאלה: What\'s your phone number?' },
  // fill
  { id: 's14', p: 'live',   kind: 'fill', prompt: 'Where do you ___?', opts: ['live', 'have', 'name', 'old'], exp: 'Where do you live? = איפה את גרה?' },
  { id: 's15', p: 'age',    kind: 'fill', prompt: 'How ___ are you?', opts: ['old', 'name', 'live', 'do'], exp: 'How old are you? = בת כמה את?' },
  { id: 's16', p: 'sib',    kind: 'fill', prompt: 'I ___ two sisters and one brother.', opts: ['have', 'am', 'live', 'go'], exp: 'I have = יש לי. I have two sisters = יש לי שתי אחיות.' },
  { id: 's17', p: 'have',   kind: 'fill', prompt: "Do you have a chair? No, I ___.", opts: ["don't", 'do', 'am', 'have'], exp: 'תשובה שלילית ל-Do you have: No, I don\'t.' },
  { id: 's18', p: 'have',   kind: 'fill', prompt: 'Do you have an eraser? Yes, I ___.', opts: ['do', "don't", 'am', 'is'], exp: 'תשובה חיובית ל-Do you have: Yes, I do.' },
  { id: 's19', p: 'letsgo', kind: 'fill', prompt: "Let's ___ to school.", opts: ['go', 'have', 'like', 'name'], exp: "Let's go to… = בואו נלך ל…" },
  { id: 's20', p: 'fav',    kind: 'fill', prompt: 'My ___ lesson is music.', opts: ['favorite', 'happy', 'old', 'live'], exp: 'favorite = אהוב/מועדף. My favorite lesson = השיעור האהוב עליי.' },
  { id: 's21', p: 'name',   kind: 'fill', prompt: 'My ___ is Mia.', opts: ['name', 'live', 'old', 'address'], exp: 'My name is… = השם שלי הוא…' },
  { id: 's22', p: 'fun',    kind: 'fill', prompt: 'Art ___ fun.', opts: ['is', 'are', 'am', 'do'], exp: '___ is fun = ___ זה כיף. Art is fun.' },
  { id: 's23', p: 'like',   kind: 'fill', prompt: "I don't ___ homework.", opts: ['like', 'live', 'name', 'old'], exp: "I like = אני אוהבת. I don't like = אני לא אוהבת." },
  { id: 's24', p: 'addr',   kind: 'fill', prompt: 'My address is 5 Palm ___.', opts: ['street', 'school', 'phone', 'week'], exp: 'בכתובת כותבים מספר ורחוב: 5 Palm street.' },
  { id: 's25', p: 'age',    kind: 'fill', prompt: 'I am nine ___ old.', opts: ['years', 'days', 'weeks', 'old'], exp: 'I am nine years old = אני בת תשע (שנים).' },
  { id: 's26', p: 'live',   kind: 'fill', prompt: 'I live ___ Ness Ziona.', opts: ['in', 'on', 'is', 'do'], exp: 'I live in… = אני גרה ב… (in = ב).' },
  // order
  { id: 's27', p: 'live', kind: 'order', prompt: 'Where do you live?', opts: ['Where', 'do', 'you', 'live?'], exp: 'שאלה מתחילה במילת שאלה: Where do you live?' },
  { id: 's28', p: 'age',  kind: 'order', prompt: 'How old are you?', opts: ['How', 'old', 'are', 'you?'], exp: 'How old are you?' },
  { id: 's29', p: 'sib',  kind: 'order', prompt: 'I have two brothers.', opts: ['I', 'have', 'two', 'brothers.'], exp: 'מתחילים ב-I (אני), ואז הפועל: I have two brothers.' },
  { id: 's30', p: 'fav',  kind: 'order', prompt: 'My favorite lesson is math.', opts: ['My', 'favorite', 'lesson', 'is', 'math.'], exp: 'My favorite lesson is math. התיאור (favorite) בא לפני המילה lesson.' },
  { id: 's31', p: 'letsgo', kind: 'order', prompt: "Let's go to the park.", opts: ["Let's", 'go', 'to', 'the', 'park.'], exp: "Let's go to the park = בואו נלך לפארק." },
  { id: 's32', p: 'have', kind: 'order', prompt: 'Do you have a notebook?', opts: ['Do', 'you', 'have', 'a', 'notebook?'], exp: 'שאלת "יש לך?" מתחילה ב-Do: Do you have a notebook?' },
  // meaning
  { id: 's33', p: 'like', kind: 'meaning', prompt: "I don't like sports.", opts: ['אני לא אוהבת ספורט.', 'אני אוהבת ספורט.', 'יש לי ספורט.', 'בואו נלך לספורט.'], exp: "don't = לא. I don't like = אני לא אוהבת." },
  { id: 's34', p: 'letsgo', kind: 'meaning', prompt: "Let's go to the class.", opts: ['בואו נלך לכיתה.', 'אני בכיתה ד׳.', 'אין לי כיתה.', 'הכיתה שלי חדשה.'], exp: "Let's go to = בואו נלך ל…" },
  { id: 's35', p: 'fun',  kind: 'meaning', prompt: 'English is fun.', opts: ['אנגלית זה כיף.', 'אני לומדת אנגלית.', 'אני לא אוהבת אנגלית.', 'השיעור האהוב עליי אנגלית.'], exp: '___ is fun = ___ זה כיף.' },
  { id: 's36', p: 'sib',  kind: 'meaning', prompt: 'I have one sister and two brothers.', opts: ['יש לי אחות אחת ושני אחים.', 'יש לי שתי אחיות ואח אחד.', 'אין לי אחים.', 'אחותי בת שתיים.'], exp: 'sister = אחות, brothers = אחים. one = אחת, two = שניים.' },
];

// ── Reading passages (exam-style comprehension) ─────────────────────────────
export const PASSAGES = [
  {
    id: 'p1',
    text: "Hi! My name is Noa. I am nine years old. I live in Haifa. I have one brother and two sisters. My favorite lesson is art. I don't like math. My phone number is 054-1112233.",
    qs: [
      { id: 'p1a', prompt: 'How old is Noa?', opts: ['9', '10', '2', '1'], exp: '"I am nine years old" — nine = 9.' },
      { id: 'p1b', prompt: 'Where does Noa live?', opts: ['Haifa', 'Tel Aviv', 'Eilat', 'school'], exp: '"I live in Haifa."' },
      { id: 'p1c', prompt: 'How many sisters does Noa have?', opts: ['2', '1', '3', '0'], exp: '"I have one brother and two sisters" — two sisters = 2.' },
      { id: 'p1d', prompt: "What is Noa's favorite lesson?", opts: ['art', 'math', 'music', 'English'], exp: '"My favorite lesson is art." היא לא אוהבת math!' },
    ],
  },
  {
    id: 'p2',
    text: "Hello! I am Tom. I am a new pupil in grade 4. I live on Palm street. I like sports and music. On Sunday I have English. My teacher is nice. I have a computer, but I don't have a phone.",
    qs: [
      { id: 'p2a', prompt: 'What grade is Tom in?', opts: ['grade 4', 'grade 3', 'grade 5', 'grade 9'], exp: '"I am a new pupil in grade 4."' },
      { id: 'p2b', prompt: 'When does Tom have English?', opts: ['Sunday', 'Monday', 'Friday', 'Saturday'], exp: '"On Sunday I have English."' },
      { id: 'p2c', prompt: 'Does Tom have a phone?', opts: ["No, he doesn't.", 'Yes, he does.'], exp: '"I don\'t have a phone" — אין לו טלפון.' },
      { id: 'p2d', prompt: 'What does Tom like?', opts: ['sports and music', 'math and art', 'homework', 'lunch'], exp: '"I like sports and music."' },
    ],
  },
  {
    id: 'p3',
    text: "My name is Dana. I am a pupil in grade 4. My school is new and my class is nice. On Monday I have math and art. Art is fun! I don't have a computer at home. I write my homework in my notebook with a pencil and an eraser.",
    qs: [
      { id: 'p3a', prompt: 'What does Dana have on Monday?', opts: ['math and art', 'English and music', 'sports', 'lunch'], exp: '"On Monday I have math and art."' },
      { id: 'p3b', prompt: 'Does Dana have a computer at home?', opts: ["No, she doesn't.", 'Yes, she does.'], exp: '"I don\'t have a computer at home."' },
      { id: 'p3c', prompt: 'Where does Dana write her homework?', opts: ['in her notebook', 'on the board', 'on the computer', 'on paper'], exp: '"I write my homework in my notebook."' },
      { id: 'p3d', prompt: 'What is fun for Dana?', opts: ['art', 'math', 'homework', 'Monday'], exp: '"Art is fun!"' },
    ],
  },
];

// ── Reading rules (exam summary page 4) ─────────────────────────────────────
// Each rule: a short teaching card, then items. Item kinds:
//   pick  — which word fits the rule (opts[0] correct)
//   hear  — listen to the word (TTS) and pick the right spelling (needs a voice)
export const RULES = [
  { id: 'r1',  n: 1,  title: 'Magic E — האות E הקסומה', teach: 'E בסוף המילה שקטה, אבל היא גורמת לתנועה שלפניה להגיד את השם שלה: a_e = "אֵיי", i_e = "אַיי", o_e = "אוֹ".', ex: ['cake', 'name', 'bike', 'five', 'home', 'nose'] },
  { id: 'r2',  n: 2,  title: 'Two letters, one sound — wh, th, sh, ch, ph', teach: 'שתי אותיות יחד עושות צליל אחד: wh = "וו", th = "ת׳" (הלשון בין השיניים), sh = "ש", ch = "צ׳", ph = "פ".', ex: ['what', 'this', 'fish', 'chair', 'phone'] },
  { id: 'r3',  n: 3,  title: 'Y בסוף מילה', teach: 'במילה קצרה Y נשמעת כמו "אַיי" (my, fly). במילה ארוכה Y נשמעת כמו "אִי" (happy, baby).', ex: ['my', 'fly', 'sky', 'happy', 'baby', 'funny'] },
  { id: 'r4',  n: 4,  title: 'OW / OU', teach: 'ow ו-ou שניהם נשמעים "אַאוּ": cow, town, house, mouse.', ex: ['cow', 'town', 'house', 'mouse', 'cloud'] },
  { id: 'r5',  n: 5,  title: 'OO', teach: 'oo יכולה להיות ארוכה "אוּוּ" (moon, food, school) או קצרה "אֻ" (book, look, good).', ex: ['moon', 'food', 'school', 'book', 'look', 'good'] },
  { id: 'r6',  n: 6,  title: 'O בסוף מילה קצרה', teach: 'O בסוף מילה קצרה נשמעת בדרך כלל "אוֹ": go, no, so. (שימי לב: do ו-to נשמעות "דוּ", "טוּ".)', ex: ['go', 'no', 'so', 'do', 'to'] },
  { id: 'r7',  n: 7,  title: 'R משנה את התנועה — er, ir, ar, or', teach: 'R משנה את הצליל של התנועה שלפניה: er/ir = "אֶר" (her, bird), ar = "אַר" (car), or = "אוֹר" (fork).', ex: ['her', 'bird', 'girl', 'car', 'star', 'fork', 'horse'] },
  { id: 'r8',  n: 8,  title: 'SS', teach: 'שתי אותיות S יוצרות צליל S אחד: class, glass, kiss.', ex: ['class', 'glass', 'dress', 'kiss', 'miss'] },
  { id: 'r9',  n: 9,  title: 'EE / EA', teach: 'ee ו-ea שתיהן נשמעות "אִי" ארוכה: tree, green, sea, meat.', ex: ['tree', 'green', 'sleep', 'sea', 'meat', 'read'] },
  { id: 'r10', n: 10, title: 'E בסוף מילה קצרה', teach: 'E בסוף מילה קצרה נשמעת "אִי": me, he, she, we, be.', ex: ['me', 'he', 'she', 'we', 'be'] },
  { id: 'r11', n: 11, title: 'AY', teach: 'ay בסוף מילה נשמעת "אֵיי": day, play, stay, say.', ex: ['day', 'play', 'stay', 'say', 'away'] },
];

export const RULE_ITEMS = [
  { id: 'ri1',  r: 'r1',  kind: 'pick', prompt: 'באיזו מילה יש E קסומה (a_e)?', opts: ['cake', 'cat', 'car', 'day'], exp: 'c-a-k-e: ה-E בסוף שקטה וגורמת ל-a להגיד "אֵיי".' },
  { id: 'ri2',  r: 'r1',  kind: 'hear', word: 'kite', opts: ['kite', 'kit', 'kayt', 'kiet'], exp: 'kite: i_e עם E קסומה = "אַיי".' },
  { id: 'ri3',  r: 'r1',  kind: 'hear', word: 'home', opts: ['home', 'hom', 'hoom', 'houm'], exp: 'home: o_e עם E קסומה = "אוֹ".' },
  { id: 'ri4',  r: 'r2',  kind: 'pick', prompt: 'באיזו מילה ph נשמעת כמו "פ"?', opts: ['photo', 'ship', 'chair', 'three'], exp: 'ph = "פ": photo, phone, dolphin.' },
  { id: 'ri5',  r: 'r2',  kind: 'hear', word: 'ship', opts: ['ship', 'chip', 'sip', 'whip'], exp: 'sh = "ש": ship.' },
  { id: 'ri6',  r: 'r2',  kind: 'hear', word: 'three', opts: ['three', 'tree', 'free', 'sree'], exp: 'th = "ת׳" עם הלשון בין השיניים: three.' },
  { id: 'ri7',  r: 'r2',  kind: 'pick', prompt: 'איזו מילה מתחילה ב-wh?', opts: ['where', 'were', 'wear', 'here'], exp: 'wh: what, when, where, white.' },
  { id: 'ri8',  r: 'r3',  kind: 'pick', prompt: 'באיזו מילה Y נשמעת "אַיי"?', opts: ['sky', 'happy', 'baby', 'funny'], exp: 'sky היא מילה קצרה, אז Y = "אַיי". במילים ארוכות (happy) Y = "אִי".' },
  { id: 'ri9',  r: 'r3',  kind: 'pick', prompt: 'באיזו מילה Y נשמעת "אִי"?', opts: ['candy', 'my', 'cry', 'fly'], exp: 'candy היא מילה ארוכה, אז Y = "אִי".' },
  { id: 'ri10', r: 'r4',  kind: 'pick', prompt: 'איזו מילה נשמעת כמו cow (ow)?', opts: ['brown', 'snow', 'go', 'boat'], exp: 'brown: ow = "אַאוּ" כמו cow, town, clown.' },
  { id: 'ri11', r: 'r4',  kind: 'hear', word: 'mouse', opts: ['mouse', 'mose', 'maus', 'moose'], exp: 'mouse: ou = "אַאוּ".' },
  { id: 'ri12', r: 'r5',  kind: 'pick', prompt: 'באיזו מילה oo קצרה (כמו book)?', opts: ['look', 'moon', 'food', 'spoon'], exp: 'look, cook, good, foot: oo קצרה. moon, food: oo ארוכה.' },
  { id: 'ri13', r: 'r5',  kind: 'hear', word: 'moon', opts: ['moon', 'mon', 'mun', 'mone'], exp: 'moon: oo ארוכה "אוּוּ".' },
  { id: 'ri14', r: 'r6',  kind: 'pick', prompt: 'איזו מילה נגמרת ב-O ונשמעת "אוֹ"?', opts: ['go', 'do', 'to', 'two'], exp: 'go, no, so: O בסוף = "אוֹ". do ו-to יוצאות דופן.' },
  { id: 'ri15', r: 'r7',  kind: 'hear', word: 'bird', opts: ['bird', 'bard', 'bed', 'berd'], exp: 'bird: ir.' },
  { id: 'ri16', r: 'r7',  kind: 'hear', word: 'star', opts: ['star', 'stir', 'store', 'ster'], exp: 'star: ar = "אַר".' },
  { id: 'ri17', r: 'r7',  kind: 'pick', prompt: 'באיזו מילה יש or?', opts: ['fork', 'farm', 'fern', 'first'], exp: 'fork: or = "אוֹר", כמו horse, corn.' },
  { id: 'ri18', r: 'r8',  kind: 'pick', prompt: 'איזו מילה נגמרת ב-ss?', opts: ['glass', 'gas', 'has', 'bus'], exp: 'glass: שתי s בסוף. גם class, dress, kiss.' },
  { id: 'ri19', r: 'r9',  kind: 'hear', word: 'green', opts: ['green', 'grin', 'gren', 'grean'], exp: 'green: ee = "אִי".' },
  { id: 'ri20', r: 'r9',  kind: 'hear', word: 'beach', opts: ['beach', 'bech', 'bich', 'beash'], exp: 'beach: ea = "אִי" (כמו sea), ו-ch בסוף.' },
  { id: 'ri21', r: 'r10', kind: 'pick', prompt: 'באיזו מילה E בסוף נשמעת "אִי"?', opts: ['she', 'cake', 'home', 'nice'], exp: 'she, he, me, we: E בסוף מילה קצרה = "אִי". ב-cake ה-E שקטה (E קסומה).' },
  { id: 'ri22', r: 'r11', kind: 'hear', word: 'play', opts: ['play', 'plai', 'pley', 'plae'], exp: 'play: ay = "אֵיי" בסוף מילה.' },
  { id: 'ri23', r: 'r11', kind: 'pick', prompt: 'איזו מילה נגמרת ב-ay?', opts: ['stay', 'star', 'stop', 'step'], exp: 'stay, day, play, say, away.' },
];
