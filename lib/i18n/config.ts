/**
 * Interface locales.
 *
 * PROVISIONAL: the four Geniura locales and their order are NOT APPROVED yet (web docs 04,
 * geniura-api ADR 0007). `ar` and `fr` mirror the backend development default
 * `GENIURA_LOCALES=ar,fr`. Adding a locale = add it here + add `messages/<locale>.json`.
 *
 * The interface locale is distinct from a job posting's `source_locale` and from the
 * languages a job requires (`JobRequirement.language_code`).
 */
export const locales = ["ar", "fr"] as const;

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
};

export const defaultTimeZone = "Africa/Casablanca";
