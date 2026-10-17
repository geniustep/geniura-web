import { useTranslations } from "next-intl";

import { Badge, type BadgeProps } from "@/components/ui/badge";

/**
 * Application statuses exactly as returned by geniura-api (`ApplicationStatusEnum`).
 * The code is never translated in the API; only its label is translated here.
 */
export const applicationStatuses = [
  "submitted",
  "in_review",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
  "closed",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

// Presentation only: colour carries no decision, and the text label is always shown.
const tone: Record<ApplicationStatus, NonNullable<BadgeProps["variant"]>> = {
  submitted: "info",
  in_review: "info",
  shortlisted: "accent",
  interview: "accent",
  offer: "success",
  hired: "success",
  rejected: "neutral",
  withdrawn: "neutral",
  closed: "neutral",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const t = useTranslations("Status.application");
  return <Badge variant={tone[status]}>{t(status)}</Badge>;
}
