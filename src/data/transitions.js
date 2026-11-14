/**
 * تحولات المادة. heat: true تعني تسخين (لون دافئ)، false تعني تبريد (لون بارد).
 */
export const STATE_LABELS = {
  solid: { emoji: '🧊', name: 'صلب' },
  liquid: { emoji: '💧', name: 'سائل' },
  gas: { emoji: '💨', name: 'غاز' },
};

export const TRANSITIONS = [
  {
    id: 'melting',
    name: 'الانصهار',
    from: 'solid',
    to: 'liquid',
    heat: true,
    summary: 'تحوّل المادة من الحالة الصلبة إلى الحالة السائلة عند تسخينها.',
    particles: ['تزداد حركة الجسيمات.', 'يقل انتظامها، فتبدأ بالانزلاق بجانب بعضها.'],
    example: '🧊⬅💧 مكعب الثلج يتحول إلى ماء عندما نتركه في الشمس.',
  },
  {
    id: 'freezing',
    name: 'التجمد',
    from: 'liquid',
    to: 'solid',
    heat: false,
    summary: 'تحوّل المادة من الحالة السائلة إلى الحالة الصلبة عند تبريدها.',
    particles: ['تقل حركة الجسيمات.', 'تترتب الجسيمات وتتقارب أكثر، فتهتز في مكانها.'],
    example: '💧⬅🧊 الماء يتحول إلى ثلج في المُجمِّد (الفريزر).',
  },
  {
    id: 'evaporation',
    name: 'التبخر',
    from: 'liquid',
    to: 'gas',
    heat: true,
    summary: 'تحوّل المادة من الحالة السائلة إلى الحالة الغازية عند تسخينها.',
    particles: ['تتباعد الجسيمات كثيرًا.', 'تزداد سرعتها وتنتشر في كل الاتجاهات.'],
    example: '💧⬅💨 الملابس المبللة تجفّ في الشمس لأن الماء يتبخّر.',
  },
  {
    id: 'condensation',
    name: 'التكاثف',
    from: 'gas',
    to: 'liquid',
    heat: false,
    summary: 'تحوّل المادة من الحالة الغازية إلى الحالة السائلة عند تبريدها.',
    particles: ['تقل سرعة الجسيمات.', 'تتقارب الجسيمات من بعضها فتصبح سائلًا.'],
    example: '💨⬅💧 قطرات الماء تظهر على سطح كأس العصير البارد.',
  },
];

export const CHANGES_CHECK = {
  id: 'check-changes',
  type: 'process',
  prompt: 'ماذا نسمّي تحوّل الثلج إلى ماء؟',
  visual: '🧊 ⬅ 💧',
  options: [
    { text: 'الانصهار', emoji: '🔥', correct: true },
    { text: 'التجمد', emoji: '❄️' },
    { text: 'التكاثف', emoji: '☁️' },
  ],
  hint: 'الثلج مادة صلبة، والماء مادة سائلة. ما اسم التحوّل من صلب إلى سائل؟',
};
