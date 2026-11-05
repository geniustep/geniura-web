import { describe, expect, it } from "vitest";
import { pendingReviewLinks } from "@/features/candidate/pending-reviews";
import type { Extraction } from "@/lib/api/generated/model";

describe("pending extraction links", () => {
  it("excludes confirmed, corrected and dismissed items and combines multiple CVs", () => {
    const data = [
      {
        resume_id: "one",
        items: [
          { id: "a", kind: "skill", review_status: "confirmed" },
          { id: "b", kind: "experience", review_status: "pending" },
          { id: "c", kind: "headline", review_status: "corrected" },
        ],
      },
      {
        resume_id: "two",
        items: [
          { id: "d", kind: "language", review_status: "dismissed" },
          { id: "e", kind: "education", review_status: "pending" },
          { id: "f", kind: "experience", review_status: "pending" },
        ],
      },
    ] as Extraction[];
    expect(pendingReviewLinks(data)).toEqual({
      experience: "/account/profile/resumes/one/review#review-item-b",
      education: "/account/profile/resumes/two/review#review-item-e",
    });
  });
  it("removes pending labels once the source confirms the review", () => {
    expect(
      pendingReviewLinks([
        { resume_id: "one", items: [{ id: "a", kind: "skill", review_status: "confirmed" }] },
      ] as Extraction[]),
    ).toEqual({});
  });
});
