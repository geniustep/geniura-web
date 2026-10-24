/** Calendar dates with explicit precision: never infer a missing month or day. */
export type PartialDatePrecision = "unknown" | "year" | "month" | "day";

export function datePrecision(value: unknown, declared?: unknown): PartialDatePrecision {
  if (typeof value !== "string" || !value) return "unknown";
  // A corrected year must not inherit the precision of the previous full date.
  if (declared === "year" && /^\d{4}/.test(value)) return "year";
  if (declared === "month" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value.slice(8, 10) !== "01") return "day";
  if (declared === "month" && /^\d{4}-\d{2}/.test(value)) return "month";
  if (declared === "day" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return "day";
  if (declared === "unknown" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return "unknown";
  if (/^\d{4}$/.test(value)) return "year";
  if (/^\d{4}-\d{2}$/.test(value)) return "month";
  if (/^\d{4}-\d{2}-01$/.test(value)) return "month"; // Safe when the parser supplied month precision using day 01.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "day";
  return "unknown";
}

export function dateInputValue(value: unknown, declared?: unknown): string {
  if (typeof value !== "string" || !value) return "";
  if (datePrecision(value, declared) === "month") return value.slice(0, 7);
  if (datePrecision(value, declared) === "year") return value.slice(0, 4);
  return value;
}

export function validPartialDate(value: string): boolean {
  if (!value) return true;
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : 1;
  const day = match[3] ? Number(match[3]) : 1;
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= maxDay;
}

/** Preserve the declared granularity. Month placeholders from the server may include day 01. */
export function validDateForPrecision(value: string, precision: PartialDatePrecision): boolean {
  if (precision === "unknown") return value === "" || validPartialDate(value);
  if (!validPartialDate(value) || !value) return false;
  if (precision === "year") return /^\d{4}$/.test(value);
  if (precision === "month") return /^\d{4}-\d{2}$/.test(value) || /^\d{4}-\d{2}-01$/.test(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function toApiPartialDate(value: string): string | null {
  if (!value) return null;
  if (!validPartialDate(value)) throw new Error("Invalid professional date");
  // Send month precision explicitly, rather than inventing an indistinguishable day 01.
  return value;
}

export function formatProfessionalDate(value: unknown, precision: unknown, locale: string): string | null {
  if (typeof value !== "string" || !value) return null;
  if (!validPartialDate(value)) return value;
  const declared = datePrecision(value, precision);
  const year = Number(value.slice(0, 4));
  if (declared === "year") return value.slice(0, 4);
  if (declared === "unknown") return value; // Legacy full ISO, with unverified precision.
  const month = Number(value.slice(5, 7));
  const day = declared === "day" ? Number(value.slice(8, 10)) : 1;
  const d = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    ...(declared === "day" ? { day: "numeric" } : {}),
  }).format(d);
}

/** Reject only impossible ranges; partial years/months may overlap. */
export function validProfessionalRange(start: string, end: string): boolean {
  if (!start || !end || !validPartialDate(start) || !validPartialDate(end)) return true;
  const min = (v: string) => Number(v.slice(0, 4) + (v.length >= 7 ? v.slice(5, 7) : "01") + (v.length === 10 ? v.slice(8, 10) : "01"));
  const max = (v: string) => {
    const y = Number(v.slice(0, 4));
    const m = v.length >= 7 ? Number(v.slice(5, 7)) : 12;
    const d = v.length === 10 ? Number(v.slice(8, 10)) : new Date(Date.UTC(y, m, 0)).getUTCDate();
    return y * 10000 + m * 100 + d;
  };
  return min(start) <= max(end);
}

/** The current API serialises YYYY-MM-01 at month precision, so an asserted exact first
 * day cannot survive a round-trip. Refuse that assertion until the API supports writes
 * carrying an explicit writable precision. */
export function canPreserveSelectedDay(value: string, precision: PartialDatePrecision): boolean {
  return precision !== "day" || !/^\d{4}-\d{2}-01$/.test(value);
}
