import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Labels, Vocabulary } from "@/lib/jobs/labels";

import { isApiError } from "./errors";
import { jobsList, jobsRetrieve } from "./generated/endpoints/jobs-public/jobs-public";
import {
  taxonomyLocationsList,
  taxonomyOccupationsList,
  taxonomySectorsList,
  taxonomySkillsList,
} from "./generated/endpoints/taxonomy/taxonomy";
import type { JobsListParams, PublicJob } from "./generated/model";

/*
 * Public, anonymous data only. These functions never receive cookies or user identifiers, so a
 * cached result can be shared safely between all visitors (research report §3, rule 1–2).
 * Errors are not cached: the next request tries again.
 */

export async function getJobsPage(params: JobsListParams) {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs");
  return jobsList(params);
}

export async function getJob(jobId: string): Promise<PublicJob | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("jobs", `job:${jobId}`);
  try {
    return await jobsRetrieve(jobId);
  } catch (error) {
    // Unpublished, expired, held or unknown jobs are all a plain 404 from the API.
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
}

const toMap = (rows: { id: string; labels: Labels }[]) =>
  Object.fromEntries(rows.map((row) => [row.id, row.labels]));

/**
 * Id → labels for the vocabularies shown next to jobs. TEMPORARY: the public job payload only
 * carries ids, and taxonomy cannot be looked up by id, so the first 50 entries of each vocabulary
 * are used (enough for the current vocabulary; unknown ids fall back to a neutral label).
 * To be replaced by labels embedded in PublicJob (docs/07-BACKEND-COORDINATION.md, item 7).
 */
export async function getVocabulary(): Promise<Vocabulary> {
  "use cache";
  cacheLife("hours");
  cacheTag("taxonomy");
  const [locations, occupations, sectors, skills] = await Promise.all([
    taxonomyLocationsList({ limit: 50 }),
    taxonomyOccupationsList({ limit: 50 }),
    taxonomySectorsList({ limit: 50 }),
    taxonomySkillsList({ limit: 50 }),
  ]);
  return {
    locations: toMap(locations.results as { id: string; labels: Labels }[]),
    occupations: toMap(occupations.results as { id: string; labels: Labels }[]),
    sectors: toMap(sectors.results as { id: string; labels: Labels }[]),
    skills: toMap(skills.results as { id: string; labels: Labels }[]),
  };
}
