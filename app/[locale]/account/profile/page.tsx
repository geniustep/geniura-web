import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProfileWorkspace } from "@/features/profile/profile-workspace";
import { ProfilePage } from "@/features/profile/profile-page";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Profile.pages" });
  return { title: t("profile.title") };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <ProfilePage
      locale={locale}
      page="profile"
      returnTo="/account/profile"
      render={(vocabulary) => <ProfileWorkspace vocabulary={vocabulary} />}
    />
  );
}
