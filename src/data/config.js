/**
 * إعدادات عامة للموقع: المسارات، النقاط، الصوتيات، الصور.
 * عدّل هذا الملف لتغيير أسماء الملفات أو قيم النقاط دون لمس بقية الكود.
 */

export const SITE_TITLE = 'رحلة في عالم حالات المادة';

/* ---------- نظام النقاط ---------- */
export const POINTS = {
  correctAnswer: 10,    // الإجابة الصحيحة
  activityComplete: 20, // إكمال نشاط أو مرحلة
  journeyComplete: 50,  // إكمال جميع المراحل
};

/* نسبة النجاح للحصول على الشهادة */
export const CERTIFICATE_THRESHOLD = 0.7;

/* ---------- الملفات الصوتية ---------- */
export const AUDIO_BASE = 'assets/audio/';

/* الشرح الصوتي المسجّل لكل قسم */
export const NARRATION = {
  intro: 'intro.mp3',
  solid: 'solid.mp3',
  liquid: 'liquid.mp3',
  gas: 'gas.mp3',
  changes: 'changes.mp3',
  beforeActivity: 'before-activity.mp3',
  ending: 'ending.mp3',
};

/* أصوات التغذية الراجعة (اختيارية). ضعها في assets/audio/ وستعمل تلقائيًا */
export const FEEDBACK_SOUNDS = {
  correct: 'correct.mp3',
  tryAgain: 'try-again.mp3',
  hint: 'hint.mp3',
};

/* ---------- الصور ---------- */
export const IMG = {
  hero: 'assets/images/hero.webp',
  avatar: 'assets/images/avatar.webp',
  solid: 'assets/images/solid.webp',
  liquid: 'assets/images/liquid.webp',
  gas: 'assets/images/gas.webp',
  changes: 'assets/images/changes.webp',
  compare: 'assets/images/particles-compare.webp',
  beakerSolid: 'assets/images/beaker-solid.webp',
  beakerLiquid: 'assets/images/beaker-liquid.webp',
  beakerGas: 'assets/images/beaker-gas.webp',
  activity: 'assets/images/activity.webp',
  success: 'assets/images/success.webp',
  certificateFrame: 'assets/images/certificate-frame.webp',
};
