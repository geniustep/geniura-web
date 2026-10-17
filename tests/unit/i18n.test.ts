import { describe, expect, it } from "vitest";

import ar from "@/messages/ar.json";
import fr from "@/messages/fr.json";
import { applicationStatuses } from "@/components/patterns/status-badge";
import { provenanceSources } from "@/components/patterns/provenance-tag";
import { defaultLocale, formattingLocale, getDirection, locales } from "@/lib/i18n/config";

const catalogs = { ar, fr } as const;

describe("locale configuration", () => {
  it("has a message catalog for every configured locale", () => {
    expect(Object.keys(catalogs).sort()).toEqual([...locales].sort());
  });

  it("includes the default locale", () => {
    expect(locales).toContain(defaultLocale);
  });

  it("derives the document direction from the locale", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("fr")).toBe("ltr");
  });

  it("formats Arabic dates and numbers with Latin digits for Morocco", () => {
    const number = new Intl.NumberFormat(formattingLocale.ar).format(2026);
    const date = new Intl.DateTimeFormat(formattingLocale.ar, { dateStyle: "long" }).format(
      new Date("2026-10-17T12:00:00Z"),
    );
    // Arabic-Indic digits (U+0660–U+0669) are not the Moroccan convention.
    expect(number).not.toMatch(/[\u0660-\u0669]/);
    expect(date).not.toMatch(/[\u0660-\u0669]/);
    expect(date).toContain("2026");
  });
});

describe("API codes have a label in every locale", () => {
  for (const [locale, messages] of Object.entries(catalogs)) {
    it(`${locale}: application statuses`, () => {
      for (const status of applicationStatuses) {
        expect(messages.Status.application[status]).toBeTruthy();
      }
    });

    it(`${locale}: provenance sources`, () => {
      for (const source of provenanceSources) {
        expect(messages.Provenance[source]).toBeTruthy();
      }
    });
  }
});
