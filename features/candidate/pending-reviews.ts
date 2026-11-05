"use client";

import { useQueries } from "@tanstack/react-query";
import { getCandidatesMeResumesExtractionRetrieveQueryOptions } from "@/lib/api/generated/endpoints/resumes/resumes";
import type { ExtractedItemKindEnum, Extraction, Resume } from "@/lib/api/generated/model";

/** Only pending items are suggestions; reviewed or dismissed items never count as pending. */
export function pendingReviewLinks(extractions: Extraction[]) {
  const links: Partial<Record<ExtractedItemKindEnum, string>> = {};
  for (const extraction of extractions) {
    for (const item of extraction.items) {
      if (item.review_status === "pending" && !links[item.kind]) {
        links[item.kind] =
          `/account/profile/resumes/${extraction.resume_id}/review#review-item-${item.id}`;
      }
    }
  }
  return links;
}

export function usePendingReviews(resumes: Resume[]) {
  const awaiting = resumes.filter((r) => r.status === "review_required");
  const queries = useQueries({
    queries: awaiting.map((r) =>
      getCandidatesMeResumesExtractionRetrieveQueryOptions(r.id, {
        query: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
      }),
    ),
  });
  return {
    links: pendingReviewLinks(queries.flatMap((q) => (q.data ? [q.data] : []))),
    loading: queries.some((q) => q.isPending),
    failed: queries.some((q) => q.isError),
    fallback: awaiting[0] ? `/account/profile/resumes/${awaiting[0].id}/review` : undefined,
    retry: () => Promise.all(queries.filter((q) => q.isError).map((q) => q.refetch())),
  };
}
