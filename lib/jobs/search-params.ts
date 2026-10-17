import {
  createLoader,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

import type { JobsListParams } from "@/lib/api/generated/model";

// Values accepted by geniura-api (ContractTypeEnum, WorkModeEnum, WorkScheduleEnum, sort enum).
export const contractTypes = [
  "permanent",
  "fixed_term",
  "temporary",
  "internship",
  "apprenticeship",
  "freelance",
  "seasonal",
] as const;
export const workModes = ["onsite", "hybrid", "remote"] as const;
export const schedules = ["full_time", "part_time", "shifts"] as const;
export const sorts = ["relevance", "newest", "expiring_soon"] as const;
export const postedWithinOptions = [1, 7, 30] as const;

/** URL state of the job search. Shared by the server (loader) and the browser (useQueryStates). */
export const jobSearchParsers = {
  q: parseAsString.withDefault(""),
  location: parseAsString,
  occupation: parseAsString,
  sector: parseAsString,
  contract_type: parseAsStringLiteral(contractTypes),
  work_mode: parseAsStringLiteral(workModes),
  schedule: parseAsStringLiteral(schedules),
  posted_within_days: parseAsInteger,
  sort: parseAsStringLiteral(sorts),
  page: parseAsInteger.withDefault(1),
};

export const loadJobSearchParams = createLoader(jobSearchParsers);
export const serializeJobSearch = createSerializer(jobSearchParsers);

export type JobSearchState = Awaited<ReturnType<typeof loadJobSearchParams>>;

export const PAGE_SIZE = 20;
/** geniura-api refuses page numbers above 200 (anti-scraping). */
export const MAX_PAGE = 200;
const MAX_QUERY_LENGTH = 200;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normalised API parameters: stable key order, no empty values, bounded values, ids that are
 * well-formed UUIDs only. The result doubles as the cache key of the public search.
 */
export function toApiParams(state: JobSearchState): JobsListParams {
  const params: JobsListParams = { page_size: PAGE_SIZE };
  const q = state.q.trim().slice(0, MAX_QUERY_LENGTH);
  if (q) params.q = q;
  for (const key of ["location", "occupation", "sector"] as const) {
    const value = state[key];
    if (value && uuid.test(value)) params[key] = value.toLowerCase();
  }
  if (state.contract_type) params.contract_type = state.contract_type;
  if (state.work_mode) params.work_mode = state.work_mode;
  if (state.schedule) params.schedule = state.schedule;
  if (
    state.posted_within_days &&
    (postedWithinOptions as readonly number[]).includes(state.posted_within_days)
  ) {
    params.posted_within_days = state.posted_within_days;
  }
  if (state.sort) params.sort = state.sort;
  const page = Math.min(Math.max(Math.trunc(state.page) || 1, 1), MAX_PAGE);
  if (page > 1) params.page = page;
  return params;
}

export function hasActiveFilters(state: JobSearchState): boolean {
  return Boolean(
    state.q.trim() ||
    state.location ||
    state.occupation ||
    state.sector ||
    state.contract_type ||
    state.work_mode ||
    state.schedule ||
    state.posted_within_days,
  );
}
