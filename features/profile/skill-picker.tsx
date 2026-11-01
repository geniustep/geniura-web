"use client";

import { SearchIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { useTaxonomySkillsList } from "@/lib/api/generated/endpoints/taxonomy/taxonomy";
import { pickLabel, type Vocabulary } from "@/lib/jobs/labels";
import { cn } from "@/lib/utils";

/**
 * Skills come from the approved dictionary only (no free text), searched in any of its languages.
 * The chosen skill is shown by its label in the interface language.
 */
export function SkillPicker({
  id,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  vocabulary,
}: {
  id: string;
  value: string;
  onChange: (id: string, label?: string) => void;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  vocabulary: Vocabulary;
}) {
  const t = useTranslations("Profile.form");
  const locale = useLocale();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [chosenLabel, setChosenLabel] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setQuery(text.trim()), 250);
    return () => clearTimeout(handle);
  }, [text]);

  const results = useTaxonomySkillsList(
    { q: query, limit: 8, locale },
    { query: { enabled: !disabled && query.length >= 2, staleTime: 60_000 } },
  );

  const current = value
    ? (chosenLabel ?? pickLabel(vocabulary.skills[value], locale) ?? null)
    : null;

  if (disabled && current) {
    return (
      <p id={id} className="flex h-11 items-center rounded-xl bg-muted px-3.5 text-sm font-medium">
        {current}
      </p>
    );
  }

  const listId = `${id}-results`;
  const options = results.data?.results ?? [];

  return (
    <div className="grid gap-2">
      {current ? (
        <p className="text-sm">
          {t("chosenSkill")} <strong>{current}</strong>
        </p>
      ) : null}
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          role="combobox"
          aria-expanded={options.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="ps-9"
          dir="auto"
          placeholder={t("skillSearch")}
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={disabled}
        />
      </div>
      {query.length >= 2 ? (
        <ul
          id={listId}
          role="listbox"
          className="grid max-h-56 gap-1 overflow-y-auto rounded-xl border p-1"
        >
          {results.isPending ? (
            <li className="p-2 text-sm text-muted-foreground">{t("searching")}</li>
          ) : null}
          {!results.isPending && options.length === 0 ? (
            <li className="p-2 text-sm text-muted-foreground">{t("noSkillFound")}</li>
          ) : null}
          {options.map((skill) => (
            <li key={skill.id} role="option" aria-selected={skill.id === value}>
              <button
                type="button"
                className={cn(
                  "flex min-h-11 w-full items-center rounded-lg px-3 text-start text-sm hover:bg-muted",
                  skill.id === value && "bg-secondary text-secondary-foreground",
                )}
                onClick={() => {
                  onChange(skill.id, skill.label);
                  setChosenLabel(skill.label);
                  setText("");
                }}
              >
                {skill.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
