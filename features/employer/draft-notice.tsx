"use client";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { EMPLOYER_DRAFT_KEY, EMPLOYER_DRAFT_PATH, isEmployerDraftPath, parseDraft } from "./draft";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}
function snapshot() {
  try {
    return localStorage.getItem(EMPLOYER_DRAFT_KEY);
  } catch {
    return null;
  }
}
const serverSnapshot = () => null;
function useSavedDraft() {
  return parseDraft(useSyncExternalStore(subscribe, snapshot, serverSnapshot));
}
export function useEmployerDraftReturn(next?: string) {
  const draft = useSavedDraft();
  return (
    isEmployerDraftPath(next) || Boolean(draft && draft.step !== "edit" && draft.step !== "sent")
  );
}
export function EmployerDraftNotice({ next }: { next?: string }) {
  const t = useTranslations("EmployerDraft");
  const draft = useSavedDraft();
  return isEmployerDraftPath(next) && draft ? (
    <p role="status" className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
      {t("authSaved")}
    </p>
  ) : null;
}
export function EmployerDraftReturn({ next }: { next?: string }) {
  const t = useTranslations("EmployerDraft");
  const pending = useEmployerDraftReturn(next);
  return pending ? (
    <Link
      href={EMPLOYER_DRAFT_PATH}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-action"
    >
      {t("resume")}
    </Link>
  ) : null;
}
