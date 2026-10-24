import { describe, expect, it } from "vitest";

import {
  canPreserveSelectedDay,
  dateInputValue,
  datePrecision,
  formatProfessionalDate,
  toApiPartialDate,
  validPartialDate,
  validProfessionalRange,
} from "@/features/profile/partial-date";
import { SECTIONS } from "@/features/profile/sections";

describe("professional dates with explicit precision", () => {
  it("recognises a year without manufacturing a month", () => {
    expect(datePrecision("2016")).toBe("year");
    expect(toApiPartialDate("2016")).toBe("2016");
    expect(formatProfessionalDate("2016", "year", "ar")).toBe("2016");
  });

  it("reads a known month without presenting day one as confirmed", () => {
    expect(dateInputValue("2019-03-01", "month")).toBe("2019-03");
    expect(datePrecision("2019-03-01")).toBe("unknown");
    expect(formatProfessionalDate("2019-03-01", undefined, "en")).toBe("2019-03-01");
    expect(toApiPartialDate("2019-03")).toBe("2019-03");
    expect(formatProfessionalDate("2019-03-01", "month", "en")).toBe("March 2019");
    expect(formatProfessionalDate("2019-03-01", "month", "fr")).toMatch(/mars 2019/);
  });

  it("shows a confirmed full date and preserves old unknown precision", () => {
    expect(formatProfessionalDate("2019-03-15", "day", "en")).toBe("March 15, 2019");
    expect(formatProfessionalDate("2019-03-15", "unknown", "en")).toBe("2019-03-15");
    expect(datePrecision("2016", "month")).toBe("year");
    expect(datePrecision("2019-03-01", "day")).toBe("day");
  });

  it("does not claim first-day precision before backend round-trip support", () => {
    expect(canPreserveSelectedDay("2019-03-01", "day")).toBe(false);
    expect(canPreserveSelectedDay("2019-03-15", "day")).toBe(true);
    expect(canPreserveSelectedDay("2019-03-01", "month")).toBe(true);
  });

  it("validates true calendar days including leap years", () => {
    expect(validPartialDate("")).toBe(true);
    expect(validPartialDate("2016")).toBe(true);
    expect(validPartialDate("2016-02")).toBe(true);
    expect(validPartialDate("2024-02-29")).toBe(true);
    for (const invalid of ["2019-02-29", "2024-13", "2024-00", "2020-04-31", "abc", "2016-"]) {
      expect(validPartialDate(invalid)).toBe(false);
    }
  });

  it("rejects ranges only when they cannot overlap", () => {
    expect(validProfessionalRange("2020", "2019")).toBe(false);
    expect(validProfessionalRange("2020-09", "2020-08")).toBe(false);
    expect(validProfessionalRange("2020", "2020-02")).toBe(true);
    expect(validProfessionalRange("2016", "2018")).toBe(true);
  });

  it("supports nullable dates and only targets professional fields", () => {
    expect(toApiPartialDate("")).toBe(null);
    for (const kind of ["experiences", "educations"] as const) {
      expect(SECTIONS[kind].fields.filter((field) => field.name.endsWith("_date"))
        .every((field) => field.kind === "partial-date")).toBe(true);
    }
    expect(SECTIONS.certifications.fields.find((field) => field.name === "issued_at")?.kind).toBe("date");
  });
});
