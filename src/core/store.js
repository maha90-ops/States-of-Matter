/**
 * حالة الطالب: النقاط والنجوم والمراحل المكتملة.
 * تُحفظ في المتصفح (localStorage) إن أمكن، ويعمل الموقع بدونها أيضًا.
 */
import { POINTS } from '../data/config.js';
import { STAGES } from '../data/stages.js';

const KEY = 'matter-journey-v1';

const fresh = () => ({
  points: 0,
  stars: 0,
  completed: [],   // معرفات المراحل المكتملة
  awarded: [],     // مفاتيح المكافآت التي مُنحت (لمنع التكرار)
  name: '',
  bestScore: null, // أفضل نتيجة في التحدي النهائي
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch (_) { /* التخزين غير متاح */ }
  return fresh();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* تجاهل */ }
}

function emit(event) {
  save();
  listeners.forEach((fn) => fn(state, event));
}

export const store = {
  get: () => state,

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /**
   * منح نقاط ونجوم مرة واحدة فقط لكل مفتاح.
   * يُرجع true إذا مُنحت المكافأة الآن.
   */
  awardOnce(key, points, stars = 0, reason = '') {
    if (state.awarded.includes(key)) return false;
    state.awarded.push(key);
    state.points += points;
    state.stars += stars;
    emit({ type: 'award', points, stars, reason });
    return true;
  },

  /** إجابة صحيحة: +10 نقاط ونجمة */
  correct(questionKey) {
    return store.awardOnce(`q:${questionKey}`, POINTS.correctAnswer, 1, 'إجابة صحيحة');
  },

  /** إكمال مرحلة: +20 نقطة، و+50 عند إكمال جميع المراحل */
  completeStage(stageId) {
    if (!state.completed.includes(stageId)) {
      state.completed.push(stageId);
      emit({ type: 'stage', stageId });
    }
    store.awardOnce(`stage:${stageId}`, POINTS.activityComplete, 0, 'إكمال نشاط');
    if (store.allComplete()) {
      store.awardOnce('journey', POINTS.journeyComplete, 0, 'إكمال جميع المراحل');
    }
  },

  isComplete: (id) => state.completed.includes(id),
  allComplete: () => STAGES.every((s) => state.completed.includes(s.id)),
  progress: () => STAGES.filter((s) => state.completed.includes(s.id)).length / STAGES.length,

  setName(name) {
    state.name = name;
    save();
  },

  setBestScore(score) {
    if (state.bestScore === null || score > state.bestScore) state.bestScore = score;
    save();
  },

  reset() {
    const name = state.name;
    state = { ...fresh(), name };
    emit({ type: 'reset' });
  },
};
