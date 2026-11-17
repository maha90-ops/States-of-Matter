/**
 * «عقل» المساعد: فهم سؤال الطالب بالعربية ومطابقته مع قاعدة المعرفة.
 * منطق فقط بلا واجهة — يعمل بدون إنترنت وبدون أي خدمة خارجية.
 *
 * الخطوات:
 *  ١. التطبيع: حذف التشكيل والتطويل، توحيد (أ إ آ ← ا)، (ة ← ه)، (ى ← ي)، (ؤ ← و)، (ئ ← ي).
 *  ٢. تقطيع الكلمات وحذف السوابق: وال، بال، فال، كال، لل، ال.
 *  ٣. لكل عنصر في القاعدة: كل كلمة من سؤال الطالب تُحسب مرة واحدة بأعلى وزن مطابق.
 *  ٤. أعلى نتيجة ≥ ٣ ← إجابة. بين ٢ و٣ ← «هل تقصد…؟». أقل ← «لا أعرف بعد».
 */
import { KB } from '../data/assistantKB.js';

const ANSWER_AT = 3;
const SUGGEST_AT = 2;

export function normalize(text) {
  return String(text || '')
    .replace(/[ً-ٰٟۖ-ۭ]/g, '') // التشكيل
    .replace(/ـ/g, '')                            // التطويل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .toLowerCase()
    .replace(/[^ء-يa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PREFIXES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال'];

export function stem(word) {
  for (const p of PREFIXES) {
    if (word.startsWith(p) && word.length - p.length >= 2) return word.slice(p.length);
  }
  return word;
}

export function tokens(text) {
  return normalize(text).split(' ').filter(Boolean).map(stem);
}

/* فهرسة القاعدة مرة واحدة */
const RAW = KB.map((e) => ({
  entry: e,
  keys: e.k.map((s) => {
    const i = s.lastIndexOf(':');
    const term = normalize(i > 0 ? s.slice(0, i) : s);
    const weight = i > 0 ? Number(s.slice(i + 1)) : 1;
    return { term: term.includes(' ') ? term : stem(term), weight, phrase: term.includes(' ') };
  }),
}));
// ندرة كل كلمة: الكلمة التي تظهر في عناصر قليلة أدقّ في تحديد السؤال (تُستخدم لفك التعادل)
const DF = new Map();
RAW.forEach(({ keys }) => new Set(keys.map((k) => k.term)).forEach((t) => DF.set(t, (DF.get(t) || 0) + 1)));
const INDEX = RAW;

function matchWord(tok, term) {
  // حرفان: مطابقة تامة. ثلاثة أحرف: في بداية الكلمة أو نهايتها مع حرفين زائدين على الأكثر
  // (مثل «بروح» ← روح). أربعة فأكثر: إذا وردت داخل الكلمة (مثل «يتبخر» ← تبخر).
  if (term.length <= 2) return tok === term;
  if (term.length === 3) return tok === term || ((tok.startsWith(term) || tok.endsWith(term)) && tok.length - term.length <= 2);
  return tok.includes(term);
}

/** حساب نتيجة كل عنصر لسؤال الطالب */
export function score(text) {
  const norm = ` ${normalize(text)} `;
  const toks = tokens(text);
  return INDEX.map(({ entry, keys }) => {
    let total = 0;
    let specific = 0;
    const used = new Set();
    const add = (k) => { total += k.weight; specific += k.weight / DF.get(k.term); used.add(k); };
    keys.filter((k) => k.phrase).forEach((k) => { if (norm.includes(k.term)) add(k); });
    new Set(toks).forEach((tok) => {
      let best = null;
      keys.forEach((k) => { if (!k.phrase && !used.has(k) && matchWord(tok, k.term) && (!best || k.weight > best.weight)) best = k; });
      if (best) add(best);
    });
    return { entry, score: total, specific };
  }).sort((a, b) => b.score - a.score || b.specific - a.specific);
}

/**
 * @returns {{ type: 'answer', entry, also?: entry } | { type: 'maybe', options: entry[] } | { type: 'unknown' }}
 */
export function understand(text) {
  if (!normalize(text)) return { type: 'unknown' };
  const ranked = score(text);
  const [first, second] = ranked;
  if (first.score >= ANSWER_AT) {
    const also = second && second.score >= ANSWER_AT && first.score - second.score <= 1 && second.entry.id !== first.entry.id ? second.entry : null;
    return { type: 'answer', entry: first.entry, also };
  }
  if (first.score >= SUGGEST_AT) {
    return { type: 'maybe', options: ranked.filter((r) => r.score >= SUGGEST_AT).slice(0, 3).map((r) => r.entry) };
  }
  return { type: 'unknown' };
}

export const byId = (id) => KB.find((e) => e.id === id);

/** هل السؤال من نوع المساعدة/المحادثة (مسموح دائمًا، حتى أثناء الاختبار)؟ */
export const isMeta = (entry) => /^(help-|hello|thanks|who)/.test(entry.id);
