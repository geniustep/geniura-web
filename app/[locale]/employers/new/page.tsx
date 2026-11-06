import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployerJourney } from "@/features/employer/employer-journey";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EmployerDraft" });
  return { title: t("title"), robots: { index: false, follow: false } };
}
export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Container data-candidate-space className="max-w-5xl py-6 sm:py-10">
      <Suspense fallback={<Skeleton className="h-96" />}>
        <EmployerJourney />
      </Suspense>
    </Container>
  );
}
