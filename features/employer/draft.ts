import { z } from "zod";
import type { OrgJobRequest } from "@/lib/api/generated/model";

export const EMPLOYER_DRAFT_PATH = "/employers/new";
export const EMPLOYER_DRAFT_KEY = "geniura.employer-draft.v1";
export const DRAFT_LIFETIME = 7 * 24 * 60 * 60 * 1000;
const ref = z.object({ userId: z.string(), orgId: z.string(), jobId: z.string().optional() });
export const draftSchema = z.object({
  version: z.literal(1),
  updatedAt: z.number(),
  step: z.enum(["edit", "review", "account", "organization", "confirm", "sent"]),
  sourceLocale: z.enum(["ar", "fr", "en", "es"]),
  title: z.string().max(160),
  description: z.string().max(10000),
  responsibilities: z.string().max(5000),
  location: z.string().max(100),
  contractType: z.enum([
    "",
    "permanent",
    "fixed_term",
    "temporary",
    "internship",
    "apprenticeship",
    "freelance",
    "seasonal",
  ]),
  workMode: z.enum(["onsite", "hybrid", "remote"]),
  companyName: z.string().max(200),
  server: ref.optional(),
});
export type EmployerDraft = z.infer<typeof draftSchema>;
export function blankDraft(locale: string): EmployerDraft {
  return {
    version: 1,
    updatedAt: Date.now(),
    step: "edit",
    sourceLocale: (["ar", "fr", "en", "es"].includes(locale)
      ? locale
      : "ar") as EmployerDraft["sourceLocale"],
    title: "",
    description: "",
    responsibilities: "",
    location: "",
    contractType: "",
    workMode: "onsite",
    companyName: "",
  };
}
export function parseDraft(raw: string | null, now?: number): EmployerDraft | null {
  if (!raw) return null;
  now ??= Date.now();
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    return parsed.success &&
      parsed.data.updatedAt <= now + 60_000 &&
      now - parsed.data.updatedAt < DRAFT_LIFETIME
      ? parsed.data
      : null;
  } catch {
    return null;
  }
}
export function isEmployerDraftPath(next?: string) {
  return next?.split("?")[0] === EMPLOYER_DRAFT_PATH;
}
export function payload(draft: EmployerDraft): OrgJobRequest {
  if (
    !draft.title.trim() ||
    !draft.description.trim() ||
    !draft.contractType ||
    (draft.workMode !== "remote" && !draft.location)
  )
    throw new Error("incomplete_draft");
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    responsibilities: draft.responsibilities.trim(),
    source_locale: draft.sourceLocale,
    contract_type: draft.contractType,
    work_mode: draft.workMode,
    location: draft.location || null,
  };
}
