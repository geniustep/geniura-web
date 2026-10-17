import { describe, expect, it } from "vitest";

import type { PublicJob } from "@/lib/api/generated/model";
import { pickLabel } from "@/lib/jobs/labels";
import { MAX_PAGE, toApiParams, type JobSearchState } from "@/lib/jobs/search-params";
import { buildJobPostingJsonLd } from "@/lib/seo/job-posting";
import { jsonLdScript } from "@/lib/seo/json-ld";

const empty: JobSearchState = {
  q: "",
  location: null,
  occupation: null,
  sector: null,
  contract_type: null,
  work_mode: null,
  schedule: null,
  posted_within_days: null,
  sort: null,
  page: 1,
};
const id = "17dfad5e-e9d0-471f-afbd-3adbb80fb9c4";

describe("toApiParams", () => {
  it("drops empty values and keeps a fixed page size", () => {
    expect(toApiParams(empty)).toEqual({ page_size: 20 });
  });

  it("trims and bounds the keyword query", () => {
    expect(toApiParams({ ...empty, q: `  ${"x".repeat(300)}  ` }).q).toHaveLength(200);
  });

  it("only forwards well-formed ids", () => {
    expect(toApiParams({ ...empty, location: id, sector: "not-a-uuid" })).toEqual({
      page_size: 20,
      location: id,
    });
  });

  it("clamps pages to what the API accepts", () => {
    expect(toApiParams({ ...empty, page: 0 }).page).toBeUndefined();
    expect(toApiParams({ ...empty, page: 999 }).page).toBe(MAX_PAGE);
  });

  it("ignores unsupported posted_within_days values", () => {
    expect(toApiParams({ ...empty, posted_within_days: 3 }).posted_within_days).toBeUndefined();
    expect(toApiParams({ ...empty, posted_within_days: 7 }).posted_within_days).toBe(7);
  });
});

describe("pickLabel", () => {
  it("prefers the interface language, then French, then anything", () => {
    expect(pickLabel({ ar: "الرباط", fr: "Rabat" }, "ar")).toBe("الرباط");
    expect(pickLabel({ fr: "Rabat" }, "ar")).toBe("Rabat");
    expect(pickLabel({ en: "Rabat" }, "ar")).toBe("Rabat");
    expect(pickLabel(undefined, "ar")).toBeUndefined();
  });
});

const job = {
  id: "b6228443-68c7-4b5c-a676-0ef80b5a6d7b",
  title: "Développeur·se </script><script>alert(1)</script>",
  source_locale: "fr",
  description: "Ligne 1\nLigne <b>2</b>",
  responsibilities: "Tâche",
  occupation: null,
  sector: null,
  location: id,
  address_text: "",
  work_mode: "hybrid",
  contract_type: "internship",
  schedule: "full_time",
  positions_count: 1,
  salary: { min: 3000, max: 3000, currency: "MAD", period: "month" },
  experience_min_years: 0,
  education_level: "bac_plus_3",
  published_at: "2026-10-17T00:00:00Z",
  expires_at: "2026-11-16T00:00:00Z",
  organization: {
    id: "o",
    name: "Atlas Démo",
    is_verified: true,
    website: "https://example.test",
    city: null,
    sector: null,
  },
  requirements: [],
  is_reviewed: true,
} as unknown as PublicJob;

describe("JobPosting JSON-LD", () => {
  const data = buildJobPostingJsonLd(job, {
    url: "https://geniura.com/fr/jobs/x",
    cityName: "Casablanca",
  }) as unknown as Record<string, unknown>;

  it("carries the fields Google requires", () => {
    expect(data).toMatchObject({
      "@type": "JobPosting",
      datePosted: "2026-10-17T00:00:00Z",
      validThrough: "2026-11-16T00:00:00Z",
      hiringOrganization: { name: "Atlas Démo", sameAs: "https://example.test" },
      employmentType: ["FULL_TIME", "INTERN"],
      directApply: false,
    });
    expect(data.jobLocation).toMatchObject({
      address: { addressLocality: "Casablanca", addressCountry: "MA" },
    });
    expect(data.baseSalary).toMatchObject({
      currency: "MAD",
      value: { minValue: 3000, unitText: "MONTH" },
    });
  });

  it("escapes HTML in the description", () => {
    expect(data.description).toBe("<p>Ligne 1</p><p>Ligne &lt;b&gt;2&lt;/b&gt;</p><p>Tâche</p>");
  });

  it("uses TELECOMMUTE for remote jobs", () => {
    const remote = buildJobPostingJsonLd({ ...job, work_mode: "remote" } as PublicJob, {
      url: "u",
    }) as unknown as Record<string, unknown>;
    expect(remote.jobLocationType).toBe("TELECOMMUTE");
    expect(remote.jobLocation).toBeUndefined();
  });

  it("cannot break out of the script tag", () => {
    const script = jsonLdScript(data);
    expect(script).not.toContain("</script>");
    expect(script).not.toMatch(/[<>]/);
    expect(JSON.parse(script).title).toBe(job.title);
  });
});
