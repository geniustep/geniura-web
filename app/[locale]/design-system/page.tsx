import { SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { ProvenanceTag, provenanceSources } from "@/components/patterns/provenance-tag";
import { StatusBadge, applicationStatuses } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { InteractiveDemos } from "./interactive-demos";

// Internal review page for PHASE 1 acceptance (tokens and components in RTL and LTR).
// Never indexed, whatever NEXT_PUBLIC_ALLOW_INDEXING says.
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

const swatches = [
  ["primary", "bg-primary text-primary-foreground"],
  ["secondary", "bg-secondary text-secondary-foreground"],
  ["accent", "bg-accent text-accent-foreground"],
  ["muted", "bg-muted text-muted-foreground"],
  ["success", "bg-success text-success-foreground"],
  ["warning", "bg-warning text-warning-foreground"],
  ["destructive", "bg-destructive text-destructive-foreground"],
  ["card", "bg-card text-card-foreground border"],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("DesignSystem");

  return (
    <Container className="flex flex-col gap-12 py-10">
      <PageHeader title={t("title")} description={t("intro")} />

      <Section title={t("colors")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map(([name, classes]) => (
            <div key={name} className={`rounded-lg p-4 text-sm font-medium ${classes}`}>
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("typography")}>
        <div className="flex flex-col gap-2">
          <p className="text-3xl font-bold">{t("sampleHeading")}</p>
          <p className="text-lg font-medium">{t("sampleHeading")}</p>
          <p className="max-w-2xl">{t("sampleBody")}</p>
        </div>
      </Section>

      <Section title={t("buttons")}>
        <div className="flex flex-wrap gap-3">
          <Button>{t("primary")}</Button>
          <Button variant="secondary">{t("secondary")}</Button>
          <Button variant="outline">{t("outline")}</Button>
          <Button variant="ghost">{t("ghost")}</Button>
          <Button variant="destructive">{t("destructive")}</Button>
          <Button disabled>{t("disabled")}</Button>
        </div>
      </Section>

      <Section title={t("forms")}>
        <div className="grid max-w-xl gap-6">
          <div className="grid gap-2">
            <Label htmlFor="ds-title">{t("fieldLabel")}</Label>
            <Input
              id="ds-title"
              dir="auto"
              placeholder={t("fieldPlaceholder")}
              aria-describedby="ds-title-hint"
            />
            <p id="ds-title-hint" className="text-sm text-muted-foreground">
              {t("fieldHint")}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ds-summary">{t("textareaLabel")}</Label>
            <Textarea id="ds-summary" dir="auto" />
          </div>
        </div>
      </Section>

      <Section title={t("badges")}>
        <div className="flex flex-wrap gap-2">
          {applicationStatuses.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          {provenanceSources.map((source) => (
            <ProvenanceTag key={source} source={source} />
          ))}
        </div>
      </Section>

      <Section title={t("feedback")}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-xl border p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <EmptyState icon={SearchXIcon} title={t("emptyTitle")} description={t("emptyBody")} />
        </div>
      </Section>

      <Section title={t("dialogs")}>
        <InteractiveDemos />
      </Section>
    </Container>
  );
}
