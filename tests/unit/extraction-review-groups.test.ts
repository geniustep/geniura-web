import { describe, expect, it } from "vitest";

import { groupExtractionItems } from "@/features/profile/extraction-review-groups";
import type { ExtractedItem } from "@/lib/api/generated/model";

function item(id: string, kind: ExtractedItem["kind"], options: Partial<ExtractedItem> = {}): ExtractedItem {
  return {
    id,
    kind,
    confidence: "0.8",
    review_status: "pending",
    evidence_snippet: "",
    payload: {},
    reviewed_at: null,
    applied_object_type: "",
    applied_object_id: null,
    existing_object: null,
    ...options,
  };
}

describe("CV review tables", () => {
  const items = [
    item("skill", "skill"),
    item("exp-high", "experience"),
    item("education", "education"),
    item("exp-low", "experience", { confidence: "0.4" }),
    item("exp-reviewed", "experience", { review_status: "confirmed" }),
    item("language", "language"),
  ];

  it("groups facts in professional order and flags uncertain facts first without mutating the source", () => {
    const result = groupExtractionItems(items, new Set());
    expect(result.map((group) => group.kind)).toEqual(["experience", "education", "skill", "language"]);
    expect(result[0]?.items.map((entry) => entry.id)).toEqual(["exp-low", "exp-high", "exp-reviewed"]);
    expect(items[1]?.id).toBe("exp-high");
  });

  it("filters unresolved, staged and saved decisions independently", () => {
    const selected = new Set(["exp-low"]);
    expect(groupExtractionItems(items, selected, "needsReview").flatMap((group) => group.items.map((x) => x.id)))
      .not.toContain("exp-low");
    expect(groupExtractionItems(items, selected, "selected").flatMap((group) => group.items.map((x) => x.id)))
      .toEqual(["exp-low"]);
    expect(groupExtractionItems(items, selected, "reviewed").flatMap((group) => group.items.map((x) => x.id)))
      .toEqual(["exp-reviewed"]);
  });

  it("puts potential duplicates ahead of ordinary items for explicit confirmation", () => {
    const duplicated = item("duplicate", "skill", { existing_object: { id: "x" } as ExtractedItem["existing_object"] });
    const result = groupExtractionItems([item("ordinary", "skill"), duplicated], new Set());
    expect(result[0]?.items[0]?.id).toBe("duplicate");
  });
});
