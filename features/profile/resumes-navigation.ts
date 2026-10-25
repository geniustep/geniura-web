import type { Resume } from "@/lib/api/generated/model";

type StatusRow = Pick<Resume, "id" | "status">;
export type UploadedReviewState = "waiting" | "review" | "terminal";

/** Open the extracted table only for this visit's freshly uploaded CV. */
export function freshlyUploadedReviewState(
  resumes: readonly StatusRow[] | undefined,
  uploadedId: string | null,
): UploadedReviewState {
  if (!uploadedId) return "waiting";
  const uploaded = resumes?.find((resume) => resume.id === uploadedId);
  if (!uploaded) return "waiting";
  if (uploaded.status === "review_required") return "review";
  if (
    uploaded.status === "failed" ||
    uploaded.status === "rejected" ||
    uploaded.status === "deleted" ||
    uploaded.status === "reviewed"
  ) {
    return "terminal";
  }
  return "waiting";
}
