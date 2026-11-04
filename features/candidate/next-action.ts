import type { CandidateProfile, Me, Resume } from "@/lib/api/generated/model";
import type { GuestDraft } from "@/lib/api/guest-cv";

export type NextAction = {
  key: "verify" | "draft" | "review" | "processing" | "failed" | "profile" | "jobs";
  href: string;
};
export function candidateNextAction(
  me: Me,
  profile: CandidateProfile | undefined,
  resumes: Resume[],
  draft?: GuestDraft,
): NextAction {
  if (!me.is_email_verified) return { key: "verify", href: "/account" };
  if (draft && ["ready", "processing", "queued"].includes(draft.status))
    return { key: "draft", href: "/start?step=upload" };
  if (draft?.status === "failed") return { key: "failed", href: "/start?step=upload" };
  const pending = resumes.find((r) => r.status === "review_required");
  if (pending) return { key: "review", href: `/account/profile/resumes/${pending.id}/review` };
  if (
    resumes.some((r) =>
      ["pending_upload", "quarantined", "scanning", "processing"].includes(r.status),
    )
  )
    return { key: "processing", href: "/account/profile/resumes" };
  // Only the latest active version drives a failed-upload prompt.
  const latest = resumes
    .filter((r) => r.status !== "deleted")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (latest && ["failed", "rejected"].includes(latest.status))
    return { key: "failed", href: "/account/profile/resumes" };
  if (!profile?.headline?.trim()) return { key: "profile", href: "/account/profile" };
  return { key: "jobs", href: "/jobs" };
}
