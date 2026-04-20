import type { PublicLocale } from "@/i18n/routing";
import type { BlockInstance } from "@/lib/cms/blocks";

const arabicTreatmentDetailCopy = {
  treatmentDetail: {
    eyebrow: "دليل كير آند تور للعلاج",
    trustStatement:
      "تساعد كير آند تور المرضى على تقييم الإجراءات ومقارنة وضوح التعافي والتكلفة والانتقال من الاستكشاف إلى محادثة منظمة لتخطيط العلاج.",
    searchPlaceholder: "ابحث عن العلاجات أو الإجراءات بالاسم...",
    sectionTitles: {
      quickFacts: "حقائق أساسية عن العلاج",
      overview: "نظرة عامة على العلاج",
      idealCandidates: "لمن صُمم هذا العلاج",
      procedures: "الإجراءات ضمن مسار هذا العلاج",
      specialists: "الأطباء المتخصصون لهذا العلاج",
      patientReviews: "آراء المرضى",
      patientStories: "قصص المرضى",
    },
    sectionDescriptions: {
      overview:
        "راجع ملف العلاج وسياق التخطيط وعوامل ملاءمة المريض قبل الانتقال إلى مقارنة الإجراءات.",
      procedures:
        "استخدم البحث في العلاجات والإجراءات للتنقل بسرعة بين المسارات، ثم قارن الإجراءات المتاحة ضمن هذا العلاج بمزيد من التفصيل.",
      specialists:
        "تعرّف على الأطباء الأكثر ارتباطاً بهذه الفئة العلاجية قبل بدء مراجعة الحالة أو التخطيط للسفر.",
      patientStories:
        "اقرأ قصص المرضى المركزة على النتائج لمساعدة المرضى المحتملين على فهم الجداول الزمنية للتعافي وتوقعاته وسياق اتخاذ القرار.",
    },
    quickFactLabels: {
      duration: "مدة العلاج",
      recovery: "فترة التعافي",
      estimatedCost: "التكلفة التقديرية",
      successRate: "نسبة النجاح",
      treatmentPdf: "ملف العلاج",
      downloadOverview: "تنزيل الملخص",
      personalizedConsultation: "استشارة مخصصة",
      personalizedConsultationDescription:
        "تقوم كير آند تور بتخصيص التكلفة والجدول الزمني وخطة الإجراء حسب الحالة الطبية قبل تأكيد أي ترتيبات سفر.",
    },
    procedureLabels: {
      duration: "المدة",
      recovery: "التعافي",
      price: "السعر",
      successRate: "نسبة النجاح",
      procedurePdf: "ملف الإجراء",
      procedurePdfDescription:
        "نزّل نظرة تفصيلية عندما يكون دليل الإجراء الجاهز للمريض متاحاً.",
      download: "تنزيل",
      candidateRequirements: "متطلبات الملاءمة",
      additionalNotes: "ملاحظات إضافية",
      recoveryTimeline: "الجدول الزمني للتعافي",
      startJourney: "ابدأ رحلتك",
      priceComparisonToggle: "مقارنة الأسعار الدولية",
      priceComparisonShow: "إظهار مقارنة الأسعار",
      priceComparisonHide: "إخفاء مقارنة الأسعار",
    },
    filterLabels: {
      search: "البحث",
      treatment: "العلاج",
      procedure: "الإجراء",
    },
    filterPlaceholders: {
      treatment: "جميع العلاجات",
      procedure: "جميع الإجراءات",
    },
    filterSearchPlaceholders: {
      treatment: "ابحث عن علاج...",
      procedure: "ابحث عن إجراء...",
    },
    filterEmptyCopy: {
      treatment: "لم يتم العثور على علاجات.",
      procedure: "لم يتم العثور على إجراءات.",
    },
    filterOptionLabels: {
      pricingGuidance: "يتضمن إرشادات سعرية",
      pricingComparison: "يتضمن مقارنة دولية",
      recoveryGuidance: "يتضمن إرشادات للتعافي",
      recoveryTimeline: "يتضمن جدولاً زمنياً للتعافي",
      resourcesGuide: "يتضمن دليلاً قابلاً للتنزيل",
      resourcesRequirements: "يتضمن إرشادات للملاءمة",
    },
    clearButtonLabel: "مسح الفلاتر",
    states: {
      resultsIntro:
        "ابحث في العلاجات والإجراءات، ثم قارن خيارات الإجراءات المتاحة ضمن هذا المسار العلاجي قبل التحدث مع كير آند تور حول الخطوات التالية.",
      resultsCountLabel: "إجراءات متاحة",
      emptyHeading: "لم يتم العثور على إجراءات",
      emptyDescription:
        "عدّل عبارة البحث أو فلتر الإجراء لاستكشاف مزيد من الخيارات.",
    },
    labels: {
      backLink: "الرجوع إلى جميع العلاجات",
      fallbackDescription:
        "تعرّف على هذا المسار العلاجي المتاح عبر كير آند تور.",
      fallbackOverview:
        "تنظّم كير آند تور تخطيط العلاج حول الوصول إلى المتخصصين وملاءمة مقدم الرعاية وتنسيق السفر ووضوح التعافي.",
      candidateSuitability:
        "يتم تأكيد ملاءمة الحالة أثناء الاستشارة لضمان توافق المسار العلاجي مع أهداف المريض ووضعه الطبي.",
      noSpecialists: "لا يوجد متخصصون متاحون حالياً لهذا العلاج.",
      internationalLabel: "دولي",
      patientReviewsEmpty:
        "ستظهر آراء المرضى المنشورة لهذا العلاج هنا بمجرد توفرها.",
      noPatientStories:
        "لا توجد قصص مرضى منشورة بعد. تحقق لاحقاً للاطلاع على رحلات النتائج وسياق التعافي.",
      featuredSuccess: "قصة نجاح مميزة",
      requestConsultation: "اطلب استشارة",
    },
  },
  faq: {
    eyebrow: "أسئلة شائعة حول تخطيط العلاج",
    heading: "أسئلة المرضى الدوليين حول العلاج في مصر",
    description:
      "توضح هذه الإجابات كيف تساعد كير آند تور المرضى على تقييم خيارات العلاج وفهم الجداول الزمنية والتكاليف المتوقعة والتخطيط للرعاية في مصر بثقة أكبر.",
    items: [
      {
        question:
          "كيف تساعدني كير آند تور في اختيار المسار العلاجي المناسب في مصر؟",
        answer:
          "تساعد كير آند تور المرضى على فهم خيارات العلاج وتنسيق مراجعة المتخصصين وتحديد المسار الأنسب وفقاً للأهداف الطبية وأولويات التعافي واعتبارات السفر.",
      },
      {
        question: "ما الذي يشمله التخطيط للعلاج من خلال كير آند تور؟",
        answer:
          "بحسب الحالة، يمكن أن تدعم كير آند تور مطابقة المتخصصين وتنسيق مقدمي الرعاية والإرشاد العلاجي المبدئي وتخطيط السفر ودعم الإقامة وتنسيق الخطوات التالية قبل الوصول إلى مصر.",
      },
      {
        question: "كيف يتم تأكيد تكاليف العلاج والجداول الزمنية؟",
        answer:
          "الأسعار والجداول الزمنية المنشورة هي للإرشاد فقط. يتم تأكيد التوصيات النهائية والتكاليف والجدولة بعد مراجعة السجلات الطبية واعتماد مقدم الرعاية لخطة العلاج المناسبة.",
      },
      {
        question:
          "ما السجلات الطبية التي ينبغي أن أشاركها قبل تخطيط العلاج أو السفر؟",
        answer:
          "ينبغي للمريض عادةً مشاركة التقارير الطبية الحديثة ونتائج الأشعة والتحاليل والتشخيصات وملخصات الإجراءات السابقة التي تساعد مقدم الرعاية على مراجعة الحالة بشكل صحيح. ويمكن لكير آند تور توضيح السجلات الأكثر فائدة قبل الانتقال إلى الخطوة التالية من التخطيط.",
      },
    ],
  },
  callToAction: {
    eyebrow: "جاهز للتخطيط بشكل صحيح؟",
    heading: "انتقل من البحث عن العلاج إلى خطوة أوضح مع كير آند تور.",
    description:
      "شارك حالتك وسيساعدك فريقنا على تحويل خيارات العلاج إلى خطة عملية مبنية على ملاءمة مقدم الرعاية وتوقيت السفر ومتطلبات التعافي.",
    actions: [
      {
        label: "ابدأ رحلتك",
        href: "/start-journey",
        variant: "default" as const,
      },
      {
        label: "احجز استشارة",
        href: "/consultation",
        variant: "outline" as const,
      },
    ],
  },
};

export function localizeTreatmentDetailCmsFallback(
  blocks: BlockInstance[],
  locale: PublicLocale,
) {
  if (locale !== "ar") {
    return blocks;
  }

  return blocks.map((block) => {
    switch (block.type) {
      case "treatmentDetail":
        return {
          ...block,
          ...arabicTreatmentDetailCopy.treatmentDetail,
        };
      case "faq":
        return {
          ...block,
          ...arabicTreatmentDetailCopy.faq,
        };
      case "callToAction":
        return {
          ...block,
          ...arabicTreatmentDetailCopy.callToAction,
        };
      default:
        return block;
    }
  });
}
