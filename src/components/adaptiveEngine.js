/**
 * محرك «التدريب الذكي» التكيفي — منطق فقط (بلا واجهة)، يعمل بدون إنترنت.
 *
 * القواعد:
 *  - يبدأ الطالب في المستوى السهل.
 *  - إجابتان صحيحتان متتاليتان في «سهل» ← يصعد إلى «متوسط».
 *  - ثلاث إجابات صحيحة متتالية في «متوسط» ← يصعد إلى «متقدم».
 *  - أي إجابة خاطئة ← ينزل مستوى واحدًا (إن أمكن)، ويُسجَّل المفهوم «للمراجعة».
 *  - السؤال التالي بعد الخطأ يكون على المفهوم نفسه في المستوى الجديد (إعادة شرح).
 *  - وإلا يُختار المفهوم الأقل ظهورًا حتى تتوزع الأسئلة على كل المفاهيم.
 *  - لا يتكرر سؤال داخل الجلسة نفسها.
 */
import { ADAPTIVE_QUESTIONS } from '../data/adaptiveQuestions.js';

export const ORDER = ['easy', 'medium', 'hard'];
const UP_AFTER = { easy: 2, medium: 3 }; // عدد الإجابات الصحيحة المتتالية اللازمة للصعود

export function createSession({ length = 10, bank = ADAPTIVE_QUESTIONS, random = Math.random } = {}) {
  const s = {
    length,
    level: 'easy',
    streak: 0,
    used: new Set(),
    pendingConcept: null, // مفهوم يحتاج إلى مراجعة بعد خطأ
    history: [],          // [{ id, level, concept, correct }]
    peak: 'easy',
  };

  const conceptCount = (c) => s.history.filter((h) => h.concept === c).length;
  const pickFrom = (list) => {
    if (!list.length) return null;
    // الأولوية: مفهوم المراجعة، ثم المفهوم الأقل ظهورًا
    let pool = list;
    if (s.pendingConcept) {
      const same = list.filter((q) => q.concept === s.pendingConcept);
      if (same.length) pool = same;
    }
    if (pool === list) {
      const min = Math.min(...list.map((q) => conceptCount(q.concept)));
      pool = list.filter((q) => conceptCount(q.concept) === min);
    }
    return pool[Math.floor(random() * pool.length)];
  };

  return {
    get level() { return s.level; },
    get streak() { return s.streak; },
    get history() { return s.history.slice(); },
    get done() { return s.history.length >= s.length; },
    get index() { return s.history.length; },
    get length() { return s.length; },
    get peak() { return s.peak; },

    /** السؤال التالي حسب المستوى الحالي (مع الرجوع لمستوى مجاور إذا نفدت الأسئلة) */
    next() {
      const unused = bank.filter((q) => !s.used.has(q.id));
      const i = ORDER.indexOf(s.level);
      const tryLevels = [s.level, ORDER[i - 1], ORDER[i + 1], ...ORDER].filter(Boolean);
      for (const lv of tryLevels) {
        const q = pickFrom(unused.filter((x) => x.level === lv));
        if (q) { s.used.add(q.id); return q; }
      }
      return null;
    },

    /**
     * تسجيل الإجابة وتحديث المستوى.
     * @returns {{ change: 'up'|'down'|'stay', level: string }}
     */
    answer(q, correct) {
      s.history.push({ id: q.id, level: q.level, concept: q.concept, correct });
      let change = 'stay';
      if (correct) {
        s.streak += 1;
        if (s.pendingConcept === q.concept) s.pendingConcept = null;
        const need = UP_AFTER[s.level];
        if (need && s.streak >= need) {
          s.level = ORDER[ORDER.indexOf(s.level) + 1];
          s.streak = 0;
          change = 'up';
        }
      } else {
        s.streak = 0;
        s.pendingConcept = q.concept;
        if (s.level !== 'easy') {
          s.level = ORDER[ORDER.indexOf(s.level) - 1];
          change = 'down';
        }
      }
      if (ORDER.indexOf(s.level) > ORDER.indexOf(s.peak)) s.peak = s.level;
      return { change, level: s.level };
    },

    /** إتقان كل مفهوم: { concept: { right, total } } */
    mastery() {
      const m = {};
      s.history.forEach((h) => {
        m[h.concept] = m[h.concept] || { right: 0, total: 0 };
        m[h.concept].total += 1;
        if (h.correct) m[h.concept].right += 1;
      });
      return m;
    },
  };
}
