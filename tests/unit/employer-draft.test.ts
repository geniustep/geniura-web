import { describe, expect, it } from "vitest";
import {
  blankDraft,
  DRAFT_LIFETIME,
  isEmployerDraftPath,
  parseDraft,
  payload,
} from "@/features/employer/draft";
describe("employer draft persistence and request payload", () => {
  it("restores all draft fields and a server checkpoint without passwords", () => {
    const draft = {
      ...blankDraft("fr"),
      title: "Développeur",
      step: "confirm" as const,
      server: { userId: "user", orgId: "org", jobId: "job" },
    };
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft);
    expect(parseDraft(JSON.stringify({ ...draft, password: "secret" }))).not.toHaveProperty(
      "password",
    );
  });
  it("rejects malformed, expired, future and oversized stored drafts", () => {
    expect(parseDraft("{")).toBeNull();
    const now = Date.now();
    expect(
      parseDraft(JSON.stringify({ ...blankDraft("ar"), updatedAt: now - DRAFT_LIFETIME }), now),
    ).toBeNull();
    expect(
      parseDraft(JSON.stringify({ ...blankDraft("ar"), updatedAt: now + 100000 }), now),
    ).toBeNull();
    expect(parseDraft(JSON.stringify({ ...blankDraft("ar"), title: "a".repeat(161) }))).toBeNull();
  });
  it("requires real fields without inventing a location or publishing state", () => {
    const draft = {
      ...blankDraft("en"),
      title: "Engineer",
      description: "Role description",
      contractType: "permanent" as const,
    };
    expect(() => payload(draft)).toThrow();
    expect(payload({ ...draft, workMode: "remote" })).toEqual({
      title: "Engineer",
      description: "Role description",
      source_locale: "en",
      responsibilities: "",
      contract_type: "permanent",
      work_mode: "remote",
      location: null,
    });
    expect(payload({ ...draft, location: "real-id" })).not.toHaveProperty("status");
  });
  it("recognizes only the exact employer destination", () => {
    expect(isEmployerDraftPath("/employers/new")).toBe(true);
    expect(isEmployerDraftPath("https://evil.test/employers/new")).toBe(false);
    expect(isEmployerDraftPath("/employers/new-other")).toBe(false);
  });
});
