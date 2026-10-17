import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/patterns/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSession } from "@/features/account/require-session";
import { SessionsList } from "@/features/account/sessions-list";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account.sessions" });
  return { title: t("title") };
}

async function Gate({ locale }: { locale: string }) {
  await requireSession(locale, "/account/sessions");
  return <SessionsList />;
}

export default async function SessionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Account.sessions");

  return (
    <Container className="grid gap-8 py-10">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={<Skeleton className="h-40" />}>
        <Gate locale={locale} />
      </Suspense>
    </Container>
  );
}
