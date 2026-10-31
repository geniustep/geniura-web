import { Suspense } from "react";
import { FormFallback } from "../form-fallback";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/features/auth/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function Content({ searchParams }: Pick<Props, "searchParams">) {
  const query = await searchParams;
  const next = Array.isArray(query.next) ? query.next[0] : query.next;
  return <RegisterForm next={next} />;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.register" });
  return { title: t("title") };
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth.register");

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <Suspense fallback={<FormFallback />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
