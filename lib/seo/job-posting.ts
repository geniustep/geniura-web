import type { JobPosting, WithContext } from "schema-dts";

import type { PublicJob } from "@/lib/api/generated/model";

const employmentType: Record<string, string> = {
  internship: "INTERN",
  apprenticeship: "INTERN",
  freelance: "CONTRACTOR",
  temporary: "TEMPORARY",
  seasonal: "TEMPORARY",
  fixed_term: "TEMPORARY",
};

const salaryUnit: Record<string, string> = {
  hour: "HOUR",
  day: "DAY",
  month: "MONTH",
  year: "YEAR",
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Plain text → simple HTML paragraphs (Google expects the full description, HTML allowed). */
function toHtml(...blocks: string[]): string {
  return blocks
    .filter(Boolean)
    .flatMap((block) => block.split(/\n{2,}|\n/))
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

/**
 * schema.org JobPosting for a published, non-expired job (the API only serves those).
 * Follows Google's guidelines: markup only on the job's own page, full description, validThrough.
 * `directApply` stays false until candidates can apply on Geniura itself (PHASE 4).
 */
export function buildJobPostingJsonLd(
  job: PublicJob,
  options: { url: string; cityName?: string },
): WithContext<JobPosting> {
  const types = new Set<string>();
  types.add(job.schedule === "part_time" ? "PART_TIME" : "FULL_TIME");
  const extra = employmentType[job.contract_type];
  if (extra) types.add(extra);

  const data: WithContext<JobPosting> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: toHtml(job.description, job.responsibilities),
    identifier: { "@type": "PropertyValue", name: "Geniura", value: job.id },
    url: options.url,
    employmentType: [...types],
    directApply: false,
    hiringOrganization: {
      "@type": "Organization",
      name: job.organization.name,
      ...(job.organization.website ? { sameAs: job.organization.website } : {}),
    },
    ...(job.published_at ? { datePosted: job.published_at } : {}),
    ...(job.expires_at ? { validThrough: job.expires_at } : {}),
  };

  if (job.work_mode === "remote") {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = { "@type": "Country", name: "MA" };
  } else {
    data.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "MA",
        ...(options.cityName ? { addressLocality: options.cityName } : {}),
        ...(job.address_text ? { streetAddress: job.address_text } : {}),
      },
    };
  }

  const salary = job.salary as {
    min?: number | null;
    max?: number | null;
    currency?: string;
    period?: string;
  } | null;
  if (
    salary &&
    (salary.min != null || salary.max != null) &&
    salary.period &&
    salaryUnit[salary.period]
  ) {
    data.baseSalary = {
      "@type": "MonetaryAmount",
      currency: salary.currency ?? "MAD",
      value: {
        "@type": "QuantitativeValue",
        ...(salary.min != null ? { minValue: Number(salary.min) } : {}),
        ...(salary.max != null ? { maxValue: Number(salary.max) } : {}),
        unitText: salaryUnit[salary.period],
      },
    };
  }

  return data;
}
