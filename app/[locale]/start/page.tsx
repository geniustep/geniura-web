import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PageBand } from "@/components/patterns/page-band";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateStart } from "@/features/onboarding/candidate-start";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CandidateStart" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("CandidateStart");
  return (
    <PageBand eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")}>
      <Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
        <CandidateStart />
      </Suspense>
    </PageBand>
  );
}
