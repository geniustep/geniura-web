import { FileQuestionIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/patterns/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");

  return (
    <Container className="py-16">
      <EmptyState
        icon={FileQuestionIcon}
        title={t("title")}
        description={t("body")}
        action={
          <Link href="/" className={buttonVariants()}>
            {t("back")}
          </Link>
        }
      />
    </Container>
  );
}
