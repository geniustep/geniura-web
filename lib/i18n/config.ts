/**
 * Interface locales.
 *
 * APPROVED 2026-10-18: the four Geniura interface locales, in this order: Arabic (default),
 * French, English, Spanish. The backend (geniura-api ADR 0007, `GENIURA_LOCALES`) still has to
 * follow for its own localized labels and messages; until then it falls back to `fr`/`ar`.
 * Adding a locale = add it here + add `messages/<locale>.json`.
 *
 * The interface locale is distinct from a job posting's `source_locale` and from the
 * languages a job requires (`JobRequirement.language_code`).
 */
export const locales = ["ar", "fr", "en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

const rtlLocales: ReadonlySet<string> = new Set(["ar"]);

export function getDirection(locale: string): "rtl" | "ltr" {
  return rtlLocales.has(locale) ? "rtl" : "ltr";
}

/**
 * BCP 47 tags used for Intl formatting. `ar-MA` keeps Latin digits and Moroccan conventions.
 */
export const formattingLocale: Record<Locale, string> = {
  ar: "ar-MA",
  fr: "fr-MA",
  en: "en-MA",
  es: "es-MA",
};

export const defaultTimeZone = "Africa/Casablanca";
