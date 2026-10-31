import { describe, expect, it } from "vitest";

import ar from "@/messages/ar.json";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";

const catalogs = { ar, fr, en, es };

describe("profile-first homepage translations", () => {
  for (const [locale, catalog] of Object.entries(catalogs)) {
    it(`${locale}: has complete, nonempty copy for the selected homepage`, () => {
      const copy = catalog.Home.profileFirst;
      expect(Object.keys(copy).sort()).toEqual(Object.keys(ar.Home.profileFirst).sort());
      for (const value of Object.values(copy)) {
        expect(value.trim().length).toBeGreaterThan(0);
        expect(value).not.toMatch(/TODO|Home\.profileFirst/);
        if (locale !== "ar") expect(value).not.toMatch(/[\u0600-\u06ff]/);
      }
    });
  }
  it("uses distinct localized CTAs instead of falling back to Arabic", () => {
    expect(
      new Set(Object.values(catalogs).map((c) => c.Home.profileFirst.createProfile)).size,
    ).toBe(4);
  });
});
