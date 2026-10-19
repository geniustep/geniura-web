import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ExtractionReview } from "@/features/profile/extraction-review";
import { ProfilePage } from "@/features/profile/profile-page";

type Props = { params: Promise<{ locale: string; resumeId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Profile.pages" });
  return { title: t("review.title") };
}

async function ReviewContent({ params }: Props) {
  const { locale, resumeId } = await params;
  setRequestLocale(locale);
  return (
    <ProfilePage
      locale={locale}
      page="review"
      returnTo={`/account/profile/resumes/${resumeId}/review`}
      render={(vocabulary) => <ExtractionReview resumeId={resumeId} vocabulary={vocabulary} />}
    />
  );
}

// The resume id is request data: everything that depends on it streams inside Suspense.
export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<Skeleton className="m-6 h-96 rounded-2xl" />}>
      <ReviewContent params={params} />
    </Suspense>
  );
}
