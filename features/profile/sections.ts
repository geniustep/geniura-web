import {
  candidatesMeCertificationsCreate,
  candidatesMeCertificationsDestroy,
  candidatesMeCertificationsPartialUpdate,
  candidatesMeCertificationsRetrieve,
  candidatesMeEducationsCreate,
  candidatesMeEducationsDestroy,
  candidatesMeEducationsPartialUpdate,
  candidatesMeEducationsRetrieve,
  candidatesMeExperiencesCreate,
  candidatesMeExperiencesDestroy,
  candidatesMeExperiencesPartialUpdate,
  candidatesMeExperiencesRetrieve,
  candidatesMeLanguagesCreate,
  candidatesMeLanguagesDestroy,
  candidatesMeLanguagesPartialUpdate,
  candidatesMeLanguagesRetrieve,
  candidatesMeSkillsCreate,
  candidatesMeSkillsDestroy,
  candidatesMeSkillsPartialUpdate,
  candidatesMeSkillsRetrieve,
} from "@/lib/api/generated/endpoints/candidates/candidates";
import { STRUCTURED_PERIODS_ENABLED } from "./periods";

import {
  CertificationKindEnum,
  EducationLevelEnum,
  LanguageLevelEnum,
  SkillLevelEnum,
} from "@/lib/api/generated/model";

export type SectionKind = "educations" | "experiences" | "skills" | "languages" | "certifications";

export type FieldKind =
  | "text"
  | "textarea"
  | "date"
  | "select"
  | "checkbox"
  | "skill"
  | "language"
  | "years"
  | "year"
  | "month"
  | "precision";

export type FieldDef = {
  name: string;
  kind: FieldKind;
  required?: boolean;
  /** Enum values for a select; labels come from `Profile.enums.<enumKey>.<value>`. */
  options?: readonly string[];
  enumKey?: string;
  /** Identity of the fact: shown, but fixed once created (a different skill is a new item). */
  createOnly?: boolean;
  maxLength?: number;
};

/** A professional fact as every section returns it (plus its own fields). */
export type SectionItem = {
  id: string;
  source: "asserted" | "extracted" | "verified";
  verified_at: string | null;
  updated_at: string;
  [field: string]: unknown;
};

type Api = {
  create: (body: never) => Promise<unknown>;
  update: (id: string, body: never, options?: RequestInit) => Promise<unknown>;
  destroy: (id: string, options?: RequestInit) => Promise<unknown>;
  retrieve: (id: string) => Promise<unknown>;
};

const PERIOD_FIELDS: FieldDef[] = STRUCTURED_PERIODS_ENABLED
  ? [
      { name: "source_period", kind: "text", maxLength: 160 },
      { name: "start_date_precision", kind: "precision" },
      { name: "start_year", kind: "year" },
      { name: "start_month", kind: "month" },
      { name: "start_date", kind: "date" },
      { name: "end_date_precision", kind: "precision" },
      { name: "end_year", kind: "year" },
      { name: "end_month", kind: "month" },
      { name: "end_date", kind: "date" },
    ]
  : [
      { name: "start_date", kind: "date" },
      { name: "end_date", kind: "date" },
    ];
const PERIOD_NULLABLE = STRUCTURED_PERIODS_ENABLED
  ? ["start_year", "start_month", "start_date", "end_year", "end_month", "end_date"]
  : ["start_date", "end_date"];

/** Languages offered first in Morocco (paper v1.1, decision Q1): Darija and Tamazight included. */
export const LANGUAGE_CODES = ["ar", "ary", "zgh", "fr", "en", "es", "de", "it", "pt"] as const;

export const SECTIONS: Record<SectionKind, { fields: FieldDef[]; nullable: string[]; api: Api }> = {
  educations: {
    fields: [
      { name: "institution", kind: "text", required: !STRUCTURED_PERIODS_ENABLED, maxLength: 200 },
      { name: "degree", kind: "text", maxLength: 160 },
      {
        name: "level",
        kind: "select",
        options: ["", ...Object.values(EducationLevelEnum)],
        enumKey: "educationLevel",
      },
      { name: "field_of_study", kind: "text", maxLength: 160 },
      ...PERIOD_FIELDS,
    ],
    nullable: PERIOD_NULLABLE,
    api: {
      create: candidatesMeEducationsCreate as Api["create"],
      update: candidatesMeEducationsPartialUpdate as Api["update"],
      destroy: candidatesMeEducationsDestroy,
      retrieve: candidatesMeEducationsRetrieve,
    },
  },
  experiences: {
    fields: [
      { name: "title", kind: "text", required: true, maxLength: 160 },
      { name: "employer_name", kind: "text", maxLength: 160 },
      ...PERIOD_FIELDS,
      { name: "is_current", kind: "checkbox" },
      { name: "description", kind: "textarea", maxLength: 3000 },
    ],
    nullable: PERIOD_NULLABLE,
    api: {
      create: candidatesMeExperiencesCreate as Api["create"],
      update: candidatesMeExperiencesPartialUpdate as Api["update"],
      destroy: candidatesMeExperiencesDestroy,
      retrieve: candidatesMeExperiencesRetrieve,
    },
  },
  skills: {
    fields: [
      { name: "skill", kind: "skill", required: true, createOnly: true },
      {
        name: "level",
        kind: "select",
        options: Object.values(SkillLevelEnum),
        enumKey: "skillLevel",
      },
      { name: "years", kind: "years" },
    ],
    nullable: ["years"],
    api: {
      create: candidatesMeSkillsCreate as Api["create"],
      update: candidatesMeSkillsPartialUpdate as Api["update"],
      destroy: candidatesMeSkillsDestroy,
      retrieve: candidatesMeSkillsRetrieve,
    },
  },
  languages: {
    fields: [
      { name: "language_code", kind: "language", required: true, createOnly: true },
      {
        name: "level",
        kind: "select",
        options: Object.values(LanguageLevelEnum),
        enumKey: "languageLevel",
      },
    ],
    nullable: [],
    api: {
      create: candidatesMeLanguagesCreate as Api["create"],
      update: candidatesMeLanguagesPartialUpdate as Api["update"],
      destroy: candidatesMeLanguagesDestroy,
      retrieve: candidatesMeLanguagesRetrieve,
    },
  },
  certifications: {
    fields: [
      {
        name: "kind",
        kind: "select",
        options: Object.values(CertificationKindEnum),
        enumKey: "certificationKind",
      },
      { name: "name", kind: "text", required: true, maxLength: 200 },
      { name: "issuer", kind: "text", maxLength: 200 },
      { name: "issued_at", kind: "date" },
      { name: "expires_at", kind: "date" },
    ],
    nullable: ["issued_at", "expires_at"],
    api: {
      create: candidatesMeCertificationsCreate as Api["create"],
      update: candidatesMeCertificationsPartialUpdate as Api["update"],
      destroy: candidatesMeCertificationsDestroy,
      retrieve: candidatesMeCertificationsRetrieve,
    },
  },
};

/** Form values for an item: strings for inputs, booleans for checkboxes. */
export function formValues(
  kind: SectionKind,
  item?: SectionItem,
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const field of SECTIONS[kind].fields) {
    const raw = item?.[field.name];
    if (field.kind === "checkbox") values[field.name] = Boolean(raw);
    else if (raw === null || raw === undefined) {
      values[field.name] =
        field.kind === "precision"
          ? "unknown"
          : field.kind === "select" && field.options
            ? field.options[0]!
            : "";
    } else values[field.name] = String(raw);
  }
  if (STRUCTURED_PERIODS_ENABLED && (kind === "experiences" || kind === "educations")) {
    for (const prefix of ["start", "end"]) {
      const precision = `${prefix}_date_precision`;
      if (values[precision] === "unknown" && values[`${prefix}_date`]) {
        values[precision] = "day";
      }
    }
  }
  if (!item && kind === "skills") values.level = "unspecified";
  if (!item && kind === "languages") values.level = "unspecified";
  return values;
}
