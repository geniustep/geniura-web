/** Backwards-compatible CV period display and staged form submission.
 * No new profile field is submitted until the matching API contract is deployed.
 */
export const STRUCTURED_PERIODS_ENABLED =
  process.env.NEXT_PUBLIC_GENIURA_STRUCTURED_PERIODS === "true";

type Fields = Record<string, unknown>;

function nonEmpty(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d{1,4}$/.test(value)) return Number(value);
  return null;
}

function isoDay(value: unknown, locale: string): string | null {
  const iso = nonEmpty(value);
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function periodPart(fields: Fields, end: boolean, locale: string): string | null {
  const prefix = end ? "end" : "start";
  const precision = fields[`${prefix}_date_precision`];
  const year = numeric(fields[`${prefix}_year`]);
  const month = numeric(fields[`${prefix}_month`]);
  const day = isoDay(fields[`${prefix}_date`], locale);

  if (precision === "day" && day) return day;
  if (year && month && month >= 1 && month <= 12 && precision !== "year") {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(year, month - 1, 1)),
    );
  }
  if (year) return String(year);
  return day;
}

/** A source period takes precedence if the parser has not produced structured dates. */
export function displayProfilePeriod(
  fields: Fields,
  locale: string,
  presentLabel: string,
): string | null {
  const from = periodPart(fields, false, locale);
  const to = fields.is_current === true ? presentLabel : periodPart(fields, true, locale);
  if (from || to) return [from, to].filter(Boolean).join(" – ");
  return nonEmpty(fields.source_period);
}

/** The extraction review may receive older v1.2 proposals with plain start/end dates. */
export function displayReviewPeriod(
  payload: Fields,
  locale: string,
  presentLabel: string,
): string | null {
  return displayProfilePeriod(payload, locale, presentLabel);
}

/** Keep explicit empties and avoid sending stale day/month fields after precision changes. */
export function prepareStructuredPeriodPayload(values: Fields): Fields {
  if (!STRUCTURED_PERIODS_ENABLED) return { ...values };
  const next = { ...values };
  for (const prefix of ["start", "end"] as const) {
    const precision = next[`${prefix}_date_precision`];
    if (precision === "unknown") {
      next[`${prefix}_year`] = null;
      next[`${prefix}_month`] = null;
      next[`${prefix}_date`] = null;
    } else if (precision === "year") {
      next[`${prefix}_month`] = null;
      next[`${prefix}_date`] = null;
    } else if (precision === "month") {
      next[`${prefix}_date`] = null;
    } else if (precision === "day") {
      // A precise calendar day is evidence by itself; it is not created from year/month.
      next[`${prefix}_year`] = null;
      next[`${prefix}_month`] = null;
    }
  }
  if (next.is_current === true) {
    next.end_year = null;
    next.end_month = null;
    next.end_date = null;
    next.end_date_precision = "unknown";
  }
  return next;
}
