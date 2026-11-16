/**
 * مراحل الرحلة التعليمية (تظهر في خريطة الرحلة وفي شريط التقدم).
 * route: اسم الصفحة في الرابط (#solid ...)
 */
export const STAGES = [
  { id: 'solid', route: 'solid', emoji: '🧊', title: 'الحالة الصلبة', desc: 'شكل ثابت وجسيمات متقاربة جدًا تهتز في مكانها.', color: 'ice' },
  { id: 'liquid', route: 'liquid', emoji: '💧', title: 'الحالة السائلة', desc: 'حجم ثابت، لكنها تأخذ شكل الوعاء.', color: 'aqua' },
  { id: 'gas', route: 'gas', emoji: '💨', title: 'الحالة الغازية', desc: 'تنتشر لتملأ المكان كله.', color: 'mist' },
  { id: 'changes', route: 'changes', emoji: '🔥', title: 'تحولات المادة', desc: 'انصهار وتجمد وتبخر وتكاثف.', color: 'warm' },
  { id: 'activity', route: 'activity', emoji: '🎮', title: 'النشاط التفاعلي', desc: 'أسئلة وألعاب ممتعة لتثبيت ما تعلمته.', color: 'green' },
  { id: 'challenge', route: 'challenge', emoji: '🏆', title: 'التحدي النهائي', desc: '8 أسئلة وشهادة إنجاز للأبطال.', color: 'gold' },
];
