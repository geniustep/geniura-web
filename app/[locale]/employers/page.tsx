import { FileCheck2Icon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { buildSocialMetadata } from "@/lib/seo/social";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Employers" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    ...buildSocialMetadata({
      locale,
      pathname: `/${locale}/employers`,
      title: t("metaTitle"),
      description: t("metaDescription"),
    }),
    alternates: {
      canonical: `/${locale}/employers`,
      languages: Object.fromEntries(routing.locales.map((code) => [code, `/${code}/employers`])),
    },
  };
}

export default async function EmployersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("EmployerDraft");
  return (
    <Container className="max-w-6xl py-10 sm:py-16">
      <section className="grid gap-8 border-b pb-10 sm:gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div className="grid gap-5">
          <p className="text-sm font-medium text-muted-foreground">{t("employers")}</p>
          <h1 className="max-w-2xl text-4xl font-semibold sm:text-5xl">{t("landingTitle")}</h1>
          <p className="max-w-xl text-lg text-muted-foreground">{t("landingBody")}</p>
          <Link
            href="/employers/new"
            className={buttonVariants({ variant: "action", size: "lg", className: "w-fit" })}
          >
            {t("start")}
          </Link>
        </div>
        <div className="grid gap-4 rounded-2xl bg-secondary p-6">
          <FileCheck2Icon className="size-8 text-action" aria-hidden="true" />
          <h2 className="text-xl font-semibold">{t("stepsDraft")}</h2>
          <p className="text-sm text-muted-foreground">{t("storageHint")}</p>
          <Link
            href="/employers/new"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-action"
          >
            {t("resume")}
          </Link>
        </div>
      </section>
      <ol className="grid gap-8 py-10 sm:grid-cols-3">
        {["Draft", "Account", "Request"].map((key, i) => (
          <li key={key} className="grid content-start gap-2">
            <span className="text-sm font-semibold text-muted-foreground">{i + 1}</span>
            <h2 className="text-lg font-semibold">{t(`steps${key}` as "stepsDraft")}</h2>
            <p className="text-sm text-muted-foreground">
              {t(`steps${key}Body` as "stepsDraftBody")}
            </p>
          </li>
        ))}
      </ol>
    </Container>
  );
}
