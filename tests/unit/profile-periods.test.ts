import { describe, expect, it } from "vitest";

import {
  displayProfilePeriod,
  displayReviewPeriod,
  prepareStructuredPeriodPayload,
  STRUCTURED_PERIODS_ENABLED,
} from "@/features/profile/periods";

describe("partial professional periods", () => {
  it("retains a single known year without inventing a month or day", () => {
    expect(displayProfilePeriod({ end_year: 2018, end_date_precision: "year" }, "fr", "présent"))
      .toBe("2018");
  });

  it("renders month precision and honors a source-backed current status", () => {
    const result = displayProfilePeriod(
      { start_year: 2024, start_month: 2, start_date_precision: "month", is_current: true },
      "fr",
      "présent",
    );
    expect(result).toContain("2024");
    expect(result).toContain("présent");
  });

  it("falls back to original source period and to existing full dates", () => {
    expect(displayReviewPeriod({ source_period: "2021 — 2023" }, "en", "present"))
      .toBe("2021 — 2023");
    expect(displayProfilePeriod({ start_date: "2021-03-01", end_date: "2024-10-31" }, "en", "present"))
      .toContain("2021");
  });

  it("preserves real first-January day precision when displaying dates", () => {
    const date = displayProfilePeriod(
      { start_date: "2024-01-01", start_date_precision: "day" },
      "en",
      "present",
    );
    expect(date).toContain("Jan");
    expect(date).toContain("1");
  });

  it("does not send new API fields by default in the production build", () => {
    expect(STRUCTURED_PERIODS_ENABLED).toBe(false);
    expect(prepareStructuredPeriodPayload({
      start_date_precision: "year",
      start_year: "2024",
      start_month: "2",
    })).toMatchObject({ start_month: "2" });
  });

  it("removes stale components when the person selects year precision", () => {
    expect(prepareStructuredPeriodPayload({
      start_date_precision: "year",
      start_year: "2024",
      start_month: "2",
      start_date: "2024-02-01",
    }, true)).toMatchObject({
      start_year: "2024",
      start_month: null,
      start_date: null,
    });
  });

  it("clears end components only when current employment is explicit", () => {
    const clean = prepareStructuredPeriodPayload({
      is_current: true,
      end_date_precision: "month",
      end_year: "2024",
      end_month: "5",
      end_date: "",
    }, true);
    expect(clean.end_date_precision).toBe("unknown");
    expect(clean.end_year).toBeNull();
    expect(clean.end_month).toBeNull();
    expect(prepareStructuredPeriodPayload({ is_current: false, end_year: "2024" }, true).end_year)
      .toBe("2024");
  });
});
