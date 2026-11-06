import { getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { CandidateNav } from "@/features/candidate/candidate-nav";
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

/** Compact private workspace shared with the candidate dashboard. */
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
    <Container data-candidate-space className="max-w-6xl py-6 sm:py-8">
      <div className="grid min-w-0 gap-6">
        <CandidateNav />
        <header className="grid min-w-0 gap-3">
          <h1 className="text-2xl font-semibold sm:text-3xl">{t(`${page}.title`)}</h1>
          {page !== "profile" ? <ProfileNav /> : null}
        </header>
        <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
          <Gate locale={locale} returnTo={returnTo} render={render} />
        </Suspense>
      </div>
    </Container>
  );
}
