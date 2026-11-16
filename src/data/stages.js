/**
 * مراحل الرحلة التعليمية (تظهر في خريطة الرحلة وفي شريط التقدم).
 * route: اسم الصفحة في الرابط (#solid ...)
 * short: الاسم المختصر في شريط التنقل
 */
export const STAGES = [
  { id: 'matter', route: 'matter', short: 'المادة', emoji: '🌍', title: 'ما المادة؟', desc: 'كل شيء له كتلة ويشغل حيزًا. هل الضوء مادة؟', color: 'gold' },
  { id: 'solid', route: 'solid', short: 'صلبة', emoji: '🧊', title: 'الحالة الصلبة', desc: 'شكل ثابت وجسيمات متقاربة جدًا تهتز في مكانها.', color: 'ice' },
  { id: 'liquid', route: 'liquid', short: 'سائلة', emoji: '💧', title: 'الحالة السائلة', desc: 'حجم ثابت، لكنها تأخذ شكل الوعاء.', color: 'aqua' },
  { id: 'gas', route: 'gas', short: 'غازية', emoji: '💨', title: 'الحالة الغازية', desc: 'تنتشر لتملأ المكان كله.', color: 'mist' },
  { id: 'lab', route: 'lab', short: 'المختبر', emoji: '🔬', title: 'مختبر الجزيئات', desc: 'تحكّم بالحرارة وقارن بين الحالات الثلاث.', color: 'mist' },
  { id: 'changes', route: 'changes', short: 'التحولات', emoji: '🔥', title: 'تحولات المادة', desc: 'انصهار وتجمد وتبخر وتكاثف.', color: 'warm' },
  { id: 'games', route: 'games', short: 'الألعاب', emoji: '🎯', title: 'ألعاب المختبر', desc: 'اصطد الجسيمات وأنقذ المختبر!', color: 'aqua' },
  { id: 'activity', route: 'activity', short: 'النشاط', emoji: '🎮', title: 'النشاط التفاعلي', desc: 'أسئلة وألعاب ممتعة لتثبيت ما تعلمته.', color: 'green' },
  { id: 'challenge', route: 'challenge', short: 'التحدي', emoji: '🏆', title: 'التحدي النهائي', desc: '٨ أسئلة وشهادة إنجاز للأبطال.', color: 'gold' },
];
