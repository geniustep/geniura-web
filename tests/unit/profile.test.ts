import { describe, expect, it } from "vitest";

import { cleanPayload, ifMatch, isConflict } from "@/features/profile/api";
import { formValues, SECTIONS } from "@/features/profile/sections";
import { ApiError } from "@/lib/api/errors";

describe("candidate profile helpers", () => {
  it("sends the read version as If-Match and nothing when there is none", () => {
    expect(ifMatch("2026-10-19T10:00:00.123456Z")).toEqual({
      headers: { "If-Match": '"2026-10-19T10:00:00.123456Z"' },
    });
    expect(ifMatch(null)).toBeUndefined();
  });

  it("recognises a 412 conflict only by its stable code", () => {
    expect(isConflict(new ApiError(412, { code: "precondition_failed" }))).toBe(true);
    expect(isConflict(new ApiError(409, { code: "conflict" }))).toBe(false);
    expect(isConflict(new Error("x"))).toBe(false);
  });

  it("turns empty optional dates into null but keeps other empty text", () => {
    expect(cleanPayload({ start_date: "", degree: "", is_current: false }, ["start_date"])).toEqual(
      {
        start_date: null,
        degree: "",
        is_current: false,
      },
    );
  });

  it("prefills forms from an item and defaults new ones safely", () => {
    const blank = formValues("educations");
    expect(blank.institution).toBe("");
    expect(blank.level).toBe("");
    expect(formValues("skills").level).toBe("unspecified");
    const filled = formValues("experiences", {
      id: "1",
      source: "verified",
      verified_at: null,
      updated_at: "t",
      title: "Comptable",
      is_current: true,
      start_date: null,
    });
    expect(filled).toMatchObject({ title: "Comptable", is_current: true, start_date: "" });
  });

  it("never lets a skill or language identity be edited after creation", () => {
    expect(SECTIONS.skills.fields.find((f) => f.name === "skill")?.createOnly).toBe(true);
    expect(SECTIONS.languages.fields.find((f) => f.name === "language_code")?.createOnly).toBe(
      true,
    );
  });
});
