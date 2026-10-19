import { getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { PageBand } from "@/components/patterns/page-band";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSession } from "@/features/account/require-session";
import { getVocabulary } from "@/lib/api/public";
import type { Vocabulary } from "@/lib/jobs/labels";

import { ProfileNav } from "./profile-nav";

const EMPTY: Vocabulary = { locations: {}, occupations: {}, sectors: {}, skills: {} };

async function Gate({
  locale,
  returnTo,
  render,
}: {
  locale: string;
  returnTo: string;
  render: (vocabulary: Vocabulary) => ReactNode;
}) {
  await requireSession(locale, returnTo);
  const vocabulary = await getVocabulary().catch(() => EMPTY);
  return render(vocabulary);
}

/** Shared frame of the candidate's space: navy band, tabs, then the private content (never cached). */
export async function ProfilePage({
  locale,
  page,
  returnTo,
  render,
}: {
  locale: string;
  page: "profile" | "resumes" | "privacy" | "accessLog" | "review";
  returnTo: string;
  render: (vocabulary: Vocabulary) => ReactNode;
}) {
  const t = await getTranslations("Profile.pages");
  return (
    <PageBand eyebrow={t("eyebrow")} title={t(`${page}.title`)} description={t(`${page}.subtitle`)}>
      <ProfileNav />
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Gate locale={locale} returnTo={returnTo} render={render} />
      </Suspense>
    </PageBand>
  );
}
