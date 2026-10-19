"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import { pickLabel, type Vocabulary } from "@/lib/jobs/labels";

/** Darija and Tamazight have no reliable name in every browser's Intl data: named by us. */
const OWN_NAMES = new Set(["ary", "zgh"]);

export function useLanguageName() {
  const locale = useLocale();
  const t = useTranslations("Profile.languageNames");
  const names = useMemo(() => new Intl.DisplayNames([locale], { type: "language" }), [locale]);
  return useCallback(
    (code: string) => {
      if (OWN_NAMES.has(code)) return t(code as "ary");
      try {
        return names.of(code) ?? code;
      } catch {
        return code;
      }
    },
    [names, t],
  );
}

export function useVocabularyLabel(vocabulary: Vocabulary) {
  const locale = useLocale();
  return useCallback(
    (group: keyof Vocabulary, id: string | null | undefined) =>
      id ? (pickLabel(vocabulary[group][id], locale) ?? null) : null,
    [vocabulary, locale],
  );
}
