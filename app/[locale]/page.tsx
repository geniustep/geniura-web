import {
  BriefcaseIcon,
  GraduationCapIcon,
  HandshakeIcon,
  LockKeyholeIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routing } from "@/lib/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries([
        ...routing.locales.map((code) => [code, `/${code}`]),
        ["x-default", `/${routing.defaultLocale}`],
      ]),
    },
  };
}

const paths = [
  { key: "jobs", icon: BriefcaseIcon },
  { key: "recruitment", icon: UsersIcon },
  { key: "skills", icon: GraduationCapIcon },
] as const;

const principles = [
  { key: "free", icon: WalletIcon },
  { key: "privacy", icon: LockKeyholeIcon },
  { key: "human", icon: ScaleIcon },
  { key: "trust", icon: ShieldCheckIcon },
] as const;

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tCommon = await getTranslations("Common");

  return (
    <>
      <div className="border-b bg-accent text-accent-foreground">
        <Container className="py-2 text-center text-sm">{tCommon("underConstruction")}</Container>
      </div>

      <section className="bg-gradient-to-b from-secondary/70 to-background">
        <Container className="flex flex-col items-start gap-6 py-16 sm:py-24">
          <Badge variant="info">{t("eyebrow")}</Badge>
          <h1 className="max-w-3xl text-3xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
          <div className="flex flex-wrap gap-3">
            {/* Search and employer spaces arrive in PHASE 3 and PHASE 5. */}
            <Button size="lg" disabled aria-describedby="cta-soon">
              <BriefcaseIcon aria-hidden="true" />
              {t("seekerCta")}
            </Button>
            <Button size="lg" variant="outline" disabled aria-describedby="cta-soon">
              <HandshakeIcon aria-hidden="true" />
              {t("employerCta")}
            </Button>
            <span id="cta-soon" className="self-center text-sm text-muted-foreground">
              {tCommon("comingSoon")}
            </span>
          </div>
        </Container>
      </section>

      <section aria-labelledby="paths-title">
        <Container className="flex flex-col gap-8 py-16">
          <h2 id="paths-title" className="text-2xl font-bold">
            {t("pathsTitle")}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {paths.map(({ key, icon: Icon }) => (
              <Card key={key}>
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardHeader>
                  <CardTitle>{t(`paths.${key}.title`)}</CardTitle>
                  <CardDescription className="text-base">{t(`paths.${key}.body`)}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="principles-title" className="bg-muted/40">
        <Container className="flex flex-col gap-8 py-16">
          <h2 id="principles-title" className="text-2xl font-bold">
            {t("principlesTitle")}
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ key, icon: Icon }) => (
              <li key={key} className="flex flex-col gap-2">
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{t(`principles.${key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">{t(`principles.${key}.body`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
