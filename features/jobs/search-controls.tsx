import { connection } from "next/server";
import { getLocale } from "next-intl/server";

import { getVocabulary } from "@/lib/api/public";
import { vocabularyOptions } from "@/lib/jobs/labels";

import { JobFilters, JobSearchBar, type SearchOptions } from "./job-search-controls";

async function loadOptions(locale: string): Promise<SearchOptions> {
  try {
    const vocabulary = await getVocabulary();
    return {
      locations: vocabularyOptions(vocabulary.locations, locale),
      occupations: vocabularyOptions(vocabulary.occupations, locale),
      sectors: vocabularyOptions(vocabulary.sectors, locale),
    };
  } catch {
    // Search still works with keywords when the vocabulary is unavailable.
    return { locations: [], occupations: [], sectors: [] };
  }
}

// Rendered per request (not baked into the build), then served from the shared vocabulary cache.
export async function SearchBarSection() {
  await connection();
  const options = await loadOptions(await getLocale());
  return <JobSearchBar options={options} />;
}

export async function FiltersSection() {
  await connection();
  const options = await loadOptions(await getLocale());
  return <JobFilters options={options} />;
}
