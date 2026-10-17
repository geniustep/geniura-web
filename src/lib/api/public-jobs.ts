/** Public, anonymous, read-only access. No user cookies or cached private data. */
export type JobSummary = {
  id: string;
  title: string;
  source_locale?: string;
  contract_type?: string | null;
  work_mode?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  salary?: { min?: number | string | null; max?: number | string | null; currency?: string; period?: string } | null;
  organization?: { display_name?: string; name?: string } | null;
};

export type JobDetail = JobSummary & {
  description?: string;
  responsibilities?: string;
  address_text?: string;
  education_level?: string;
};

export type JobListResult =
  | { kind: "ok"; count: number; results: JobSummary[]; next: string | null; previous: string | null }
  | { kind: "unavailable" };

export type JobDetailResult =
  | { kind: "ok"; job: JobDetail }
  | { kind: "not-found" }
  | { kind: "unavailable" };

function apiUrl(path: string): URL {
  const origin = process.env.GENIURA_API_ORIGIN ?? "https://api-geniura.geniura.com";
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid API origin");
  return new URL(path, url.origin);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export async function getPublicJobs(query: string, page: number): Promise<JobListResult> {
  const url = apiUrl("/api/v1/jobs");
  if (query) url.searchParams.set("q", query.slice(0, 120));
  url.searchParams.set("page", String(Math.max(1, Math.min(200, page))));
  try {
    const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) return { kind: "unavailable" };
    const body: unknown = await response.json();
    if (!isRecord(body) || typeof body.count !== "number" || !Array.isArray(body.results)) {
      return { kind: "unavailable" };
    }
    const results = body.results.filter(
      (item): item is JobSummary => isRecord(item) && typeof item.id === "string" && typeof item.title === "string",
    );
    return {
      kind: "ok", count: body.count, results,
      next: typeof body.next === "string" ? body.next : null,
      previous: typeof body.previous === "string" ? body.previous : null,
    };
  } catch {
    return { kind: "unavailable" };
  }
}

export async function getPublicJob(id: string): Promise<JobDetailResult> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { kind: "not-found" };
  try {
    const response = await fetch(apiUrl(`/api/v1/jobs/${encodeURIComponent(id)}`), {
      cache: "no-store", headers: { Accept: "application/json" },
    });
    if (response.status === 404) return { kind: "not-found" };
    if (!response.ok) return { kind: "unavailable" };
    const body: unknown = await response.json();
    if (!isRecord(body) || typeof body.id !== "string" || typeof body.title !== "string") {
      return { kind: "unavailable" };
    }
    return { kind: "ok", job: body as JobDetail };
  } catch {
    return { kind: "unavailable" };
  }
}
