import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSession } from "@/features/account/require-session";
import { EmployerWorkspace } from "@/features/employer/employer-workspace";
type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "EmployerWorkspace" });
  return { title: t("title") };
}
async function Content({ locale }: { locale: string }) {
  await requireSession(locale, "/account/employer");
  return <EmployerWorkspace />;
}
export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <Container className="max-w-5xl py-6 sm:py-10">
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <Content locale={locale} />
      </Suspense>
    </Container>
  );
}
