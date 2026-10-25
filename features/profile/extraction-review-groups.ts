import type { ExtractedItem } from "@/lib/api/generated/model";

export type ReviewFilter = "all" | "needsReview" | "selected" | "reviewed";
export type ReviewGroup = { kind: ExtractedItem["kind"]; items: ExtractedItem[] };

const KIND_ORDER: readonly ExtractedItem["kind"][] = [
  "headline",
  "occupation",
  "experience",
  "education",
  "certification",
  "skill",
  "language",
];

/** Present facts by professional section, with unresolved and uncertain facts first. */
export function groupExtractionItems(
  items: readonly ExtractedItem[],
  selectedIds: ReadonlySet<string>,
  filter: ReviewFilter = "all",
): ReviewGroup[] {
  const grouped = new Map<ExtractedItem["kind"], ExtractedItem[]>();
  for (const item of items) {
    const pending = item.review_status === "pending";
    const selected = selectedIds.has(item.id);
    const visible =
      filter === "all" ||
      (filter === "needsReview" && pending && !selected) ||
      (filter === "selected" && pending && selected) ||
      (filter === "reviewed" && !pending);
    if (!visible) continue;
    const group = grouped.get(item.kind) ?? [];
    group.push(item);
    grouped.set(item.kind, group);
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b))
    .map(([kind, group]) => ({
      kind,
      items: [...group].sort((a, b) => {
        const reviewOrder = Number(a.review_status !== "pending") - Number(b.review_status !== "pending");
        if (reviewOrder) return reviewOrder;
        const duplicateOrder = Number(Boolean(b.existing_object)) - Number(Boolean(a.existing_object));
        if (duplicateOrder) return duplicateOrder;
        return Number(a.confidence) - Number(b.confidence);
      }),
    }));
}
