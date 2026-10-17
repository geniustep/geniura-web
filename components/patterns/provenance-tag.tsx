import { BadgeCheckIcon, FileSearchIcon, UserPenIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

/** Matches geniura-api `ProvenanceSourceEnum`. The UI can display it, never upgrade it. */
export const provenanceSources = ["asserted", "extracted", "verified"] as const;

export type ProvenanceSource = (typeof provenanceSources)[number];

const icons = {
  asserted: UserPenIcon,
  extracted: FileSearchIcon,
  verified: BadgeCheckIcon,
} as const;

export function ProvenanceTag({ source }: { source: ProvenanceSource }) {
  const t = useTranslations("Provenance");
  const Icon = icons[source];
  return (
    <Badge variant={source === "verified" ? "success" : "outline"}>
      <Icon aria-hidden="true" />
      {t(source)}
    </Badge>
  );
}
