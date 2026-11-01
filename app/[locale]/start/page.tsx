import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
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
    <Container data-candidate-start className="py-6 sm:py-8">
      <div data-start-intro className="mx-auto mb-6 max-w-2xl text-center">
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
        <CandidateStart />
      </Suspense>
    </Container>
  );
}
