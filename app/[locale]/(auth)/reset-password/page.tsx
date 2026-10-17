import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/features/auth/reset-password-form";
import { AuthShell } from "@/features/auth/auth-shell";

import { FormFallback } from "../form-fallback";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth.reset" });
  return { title: t("title") };
}

// Query parameters are request data, so they are read inside a Suspense boundary
// while the page shell stays static.
async function Content({ searchParams }: Pick<Props, "searchParams">) {
  const query = await searchParams;
  return <ResetPasswordForm uid={first(query.uid)} token={first(query.token)} />;
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth.reset");

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <Suspense fallback={<FormFallback />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
