/** Minimal valid single-page PDF (Latin-1 text lines) for local CV extraction tests. */
export function makePdf(lines: string[]): Buffer {
  const escape = (line: string) => line.replace(/\\/g, "\\\\").replace(/[()]/g, "\\$&");
  const content =
    "BT /F1 11 Tf 50 780 Td 14 TL " +
    lines.map((line) => `(${escape(line)}) Tj T*`).join(" ") +
    " ET";
  const stream = Buffer.from(content, "latin1");
  const objects = [
    "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj",
    "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj",
    "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj",
    `4 0 obj<< /Length ${stream.length} >>stream\n${content}\nendstream endobj`,
    "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${obj}\n`;
  }
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

/** Unique title avoids cross-candidate duplicate matching in shared local DBs. */
export function cvYearRange(uniqueId: string) {
  return ["Experience", `Reception agent ${uniqueId} 2016 - 2018`];
}

export function cvMonthPresent(uniqueId: string) {
  return ["Work Experience", `Accountant ${uniqueId} 03/2019 - present`];
}

/** @deprecated use cvYearRange(uniqueId) */
export const CV_YEAR_RANGE = cvYearRange("legacy");
export const CV_MONTH_PRESENT = cvMonthPresent("legacy");
/** Matches parser-friendly lines from backend cv_samples (slash months + year ranges). */
export const CV_FULL_RANGE = [
  "Experience professionnelle",
  "Agent accueil 2016 - 2018",
  "Teleconseiller 03/2019 - present",
];

export type UiLocale = "en" | "fr" | "ar";

export const UI = {
  en: {
    email: "Email address",
    password: "Password",
    register: "Create account",
    registerDone: "Check your inbox",
    login: "Sign in",
    versionName: "Version name",
    uploadCv: "Upload CV",
    uploaded: /File received/i,
    reviewLink: "Review information",
    accept: "Accept",
    saveDecisions: /Save \d+ decision/,
    keepMine: "Keep my profile",
    addExperience: "Add",
    jobTitle: "Job title",
    from: "From",
    to: "To",
    datePrecision: "Date precision",
    dateValue: "Date value",
    save: "Save",
    edit: "Edit",
    yearOnly: "year",
    monthYear: "month",
    dayFull: "day",
  },
  fr: {
    email: "Adresse e-mail",
    password: "Mot de passe",
    register: "Créer le compte",
    registerDone: "Consultez votre messagerie",
    login: "Connexion",
    versionName: "Nom de la version",
    uploadCv: "Déposer le CV",
    uploaded: /reçu|Fichier reçu/i,
    reviewLink: "Revoir les informations",
    accept: "Valider",
    saveDecisions: /Enregistrer \d+ décision/,
    keepMine: "Garder mon profil",
    addExperience: "Ajouter",
    jobTitle: "Intitulé du poste",
    from: "Du",
    to: "Au",
    datePrecision: "Précision de la date",
    dateValue: "Valeur de la date",
    save: "Enregistrer",
    edit: "Modifier",
    yearOnly: "year",
    monthYear: "month",
    dayFull: "day",
  },
  ar: {
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    register: "إنشاء الحساب",
    registerDone: "تحقّق من بريدك",
    login: "دخول",
    versionName: "اسم النسخة",
    uploadCv: "رفع السيرة",
    uploaded: /وصل الملف/i,
    reviewLink: "مراجعة المعلومات",
    accept: "اعتماد",
    saveDecisions: /حفظ قرار/,
    keepMine: "إبقاء ما في ملفي",
    addExperience: "إضافة",
    jobTitle: "المسمى",
    from: "من",
    to: "إلى",
    datePrecision: "دقة التاريخ",
    dateValue: "قيمة التاريخ",
    save: "حفظ",
    edit: "تعديل",
    yearOnly: "year",
    monthYear: "month",
    dayFull: "day",
  },
} as const;
