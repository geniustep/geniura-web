/** Provisional languages only. The final four product languages are not approved. */
export const supportedLocales = ["ar", "fr"] as const;
export type Locale = (typeof supportedLocales)[number];

export function isLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

const translations = {
  ar: {
    home: "الرئيسية",
    jobs: "فرص العمل",
    brandPurpose: "فرص مهنية، تقييم قائم على الأدلة، وتكوين يفتح آفاقًا جديدة.",
    heading: "من اكتشاف الفرصة إلى بناء المستقبل المهني",
    intro: "Geniura تجمع الباحثين عن عمل والمؤسسات حول فرص واضحة ومسارات مهنية أكثر ثقة.",
    explore: "استكشف فرص العمل",
    forCandidates: "للباحثين عن عمل",
    forEmployers: "للمؤسسات",
    candidateText: "ابحث عن الفرص المناسبة، وتابع ترشحاتك عند إطلاق الخدمات.",
    employerText: "اكتشف منصة تدعم التوظيف والانتقاء المهني والمراجعة البشرية.",
    search: "بحث",
    searchHint: "المسمى المهني أو الكلمات المفتاحية",
    noJobs: "لا توجد فرص منشورة تطابق البحث حاليًا.",
    unavailable: "قائمة فرص العمل غير متاحة حاليًا. لم يُفتح اتصال API العام بعد.",
    details: "تفاصيل الفرصة",
    back: "العودة إلى فرص العمل",
    published: "تاريخ النشر",
    expires: "آخر أجل",
    workMode: "نمط العمل",
    contract: "نوع العقد",
    noDescription: "لا يتوفر وصف إضافي لهذه الفرصة.",
    notFound: "هذه الفرصة غير متاحة.",
    previous: "السابق",
    next: "التالي",
    results: "نتيجة",
    preview: "التسجيل والترشح غير متاحين بعد في هذه النسخة التأسيسية.",
    foundation: "نسخة تأسيسية للمعاينة — ليست إطلاقًا عامًا للخدمات",
  },
  fr: {
    home: "Accueil",
    jobs: "Offres d’emploi",
    brandPurpose: "Opportunités, évaluation fondée sur des preuves et développement des compétences.",
    heading: "De la découverte d’opportunités à l’avenir professionnel",
    intro: "Geniura rapproche candidats et entreprises autour de parcours professionnels transparents.",
    explore: "Explorer les offres",
    forCandidates: "Pour les candidats",
    forEmployers: "Pour les entreprises",
    candidateText: "Recherchez des offres et suivez vos candidatures lorsque le service sera lancé.",
    employerText: "Une plateforme pour recruter, évaluer et sélectionner avec un examen humain.",
    search: "Rechercher",
    searchHint: "Intitulé du poste ou mots-clés",
    noJobs: "Aucune offre publiée ne correspond actuellement à votre recherche.",
    unavailable: "Les offres sont momentanément indisponibles : l’API publique n’est pas encore ouverte.",
    details: "Détails de l’offre",
    back: "Retour aux offres",
    published: "Publication",
    expires: "Échéance",
    workMode: "Mode de travail",
    contract: "Type de contrat",
    noDescription: "Aucune description complémentaire disponible.",
    notFound: "Cette offre n’est pas disponible.",
    previous: "Précédent",
    next: "Suivant",
    results: "résultat(s)",
    preview: "La connexion et les candidatures ne sont pas encore disponibles dans cette version de fondation.",
    foundation: "Version de fondation — les services ne sont pas encore ouverts au public",
  },
} as const;

export function t(locale: Locale) {
  return translations[locale];
}
