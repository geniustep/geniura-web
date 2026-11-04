import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSession } from "@/features/account/require-session";
import { CandidateHome } from "@/features/candidate/candidate-home";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CandidateHome" });
  return { title: t("title") };
}
async function Content({ locale }: { locale: string }) {
  const me = await requireSession(locale, "/account/home");

  return <CandidateHome me={me} />;
}
export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Container data-candidate-space className="max-w-6xl py-6 sm:py-8">
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Content locale={locale} />
      </Suspense>
    </Container>
  );
}
