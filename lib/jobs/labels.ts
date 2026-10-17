/** Multilingual labels as returned by geniura-api taxonomy (`{ar: "…", fr: "…"}`). */
export type Labels = Record<string, string>;

export type Vocabulary = {
  locations: Record<string, Labels>;
  occupations: Record<string, Labels>;
  sectors: Record<string, Labels>;
  skills: Record<string, Labels>;
};

/** Label in the interface language, then French, then any available language. */
export function pickLabel(labels: Labels | undefined, locale: string): string | undefined {
  if (!labels) return undefined;
  return labels[locale] ?? labels.fr ?? Object.values(labels)[0];
}

export function vocabularyOptions(entries: Record<string, Labels>, locale: string) {
  return Object.entries(entries)
    .map(([id, labels]) => ({ id, label: pickLabel(labels, locale) ?? id }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}
