import { CircleCheckIcon, MonitorSmartphoneIcon, TriangleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PageBand } from "@/components/patterns/page-band";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton, ResendVerificationButton } from "@/features/account/account-actions";
import { AccountSettings, ChangePasswordForm } from "@/features/account/account-settings";
import { NotificationPreferences } from "@/features/account/notification-preferences";
import { requireSession } from "@/features/account/require-session";
import { Link } from "@/lib/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Account" });
  return { title: t("title") };
}

async function AccountDetails({ locale }: { locale: string }) {
  const me = await requireSession(locale, "/account");
  const t = await getTranslations("Account");
  const format = await getFormatter();

  return (
    <div className="grid gap-6">
      {me.is_email_verified ? null : (
        <div className="flex flex-col gap-3 rounded-2xl bg-warning-soft p-4 text-warning sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2 text-sm">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t("verifyBanner")}
          </p>
          <ResendVerificationButton />
        </div>
      )}
      <dl className="grid gap-6 sm:grid-cols-3">
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">{t("email")}</dt>
          <dd className="flex flex-wrap items-center gap-2 font-display text-lg font-semibold">
            <bdi dir="ltr">{me.email}</bdi>
            <Badge variant={me.is_email_verified ? "success" : "warning"}>
              {me.is_email_verified ? <CircleCheckIcon aria-hidden="true" /> : null}
              {me.is_email_verified ? t("verified") : t("notVerified")}
            </Badge>
          </dd>
          <p className="text-xs text-muted-foreground">{t("emailReadOnly")}</p>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">{t("name")}</dt>
          <dd className="font-medium">
            <bdi>{me.full_name || "—"}</bdi>
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="text-sm text-muted-foreground">{t("joined")}</dt>
          <dd className="font-medium">
            {format.dateTime(new Date(me.date_joined), { dateStyle: "long" })}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <Link href="/account/sessions" className={buttonVariants({ variant: "outline" })}>
          <MonitorSmartphoneIcon aria-hidden="true" />
          {t("sessionsLink")}
        </Link>
        <LogoutButton />
      </div>
      <div className="border-t border-border pt-6">
        <AccountSettings initial={{ full_name: me.full_name, preferred_locale: me.preferred_locale, time_zone: me.time_zone }} />
      </div>
      <div className="border-t border-border pt-6">
        <NotificationPreferences />
      </div>
      <div className="border-t border-border pt-6">
        <ChangePasswordForm />
      </div>
    </div>
  );
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Account");

  return (
    <PageBand title={t("title")} description={t("subtitle")}>
      <div className="rounded-2xl bg-card p-6 shadow-float sm:p-8">
        <Suspense fallback={<Skeleton className="h-48" />}>
          <AccountDetails locale={locale} />
        </Suspense>
      </div>
    </PageBand>
  );
}
