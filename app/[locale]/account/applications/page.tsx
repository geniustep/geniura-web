import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSession } from "@/features/account/require-session";
import { Applications } from "@/features/candidate/applications";
import { CandidateNav } from "@/features/candidate/candidate-nav";

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CandidateHome" });
  return { title: t("applications") };
}
async function Content({ locale }: { locale: string }) {
  await requireSession(locale, "/account/applications");
  const t = await getTranslations("CandidateHome");
  return (
    <div className="grid gap-6">
      <CandidateNav />
      <h1 className="text-2xl font-semibold">{t("applications")}</h1>
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <Applications full />
      </section>
    </div>
  );
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
