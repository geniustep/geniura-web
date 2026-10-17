import { defineRouting } from "next-intl/routing";

import { defaultLocale, locales } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // Every URL carries its locale (/ar/…, /fr/…) so pages stay cacheable and indexable per language.
  localePrefix: "always",
});
