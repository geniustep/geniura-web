import { describe, expect, it } from "vitest";

import { freshlyUploadedReviewState } from "@/features/profile/resumes-navigation";
import type { Resume } from "@/lib/api/generated/model";

function row(id: string, status: Resume["status"]) {
  return { id, status };
}

describe("automatic navigation after a CV upload", () => {
  it("opens the table only when the freshly uploaded CV is ready", () => {
    expect(freshlyUploadedReviewState([row("new", "review_required")], "new")).toBe("review");
    expect(freshlyUploadedReviewState([row("new", "scanning")], "new")).toBe("waiting");
    expect(freshlyUploadedReviewState([row("new", "processing")], "new")).toBe("waiting");
  });

  it("does not navigate to old CVs or absent IDs", () => {
    const list = [row("old", "review_required"), row("new", "processing")];
    expect(freshlyUploadedReviewState(list, "new")).toBe("waiting");
    expect(freshlyUploadedReviewState(list, null)).toBe("waiting");
    expect(freshlyUploadedReviewState(list, "other")).toBe("waiting");
  });

  it("leaves terminal CV states visible on the versions page", () => {
    for (const status of ["failed", "rejected", "deleted", "reviewed"] as const) {
      expect(freshlyUploadedReviewState([row("new", status)], "new")).toBe("terminal");
    }
  });

  it("waits for the initial fetch", () => {
    expect(freshlyUploadedReviewState(undefined, "new")).toBe("waiting");
  });
});
