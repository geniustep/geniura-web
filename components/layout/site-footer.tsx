import { useTranslations } from "next-intl";

import { BrandMark } from "./brand-mark";
import { Container } from "./container";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="mt-auto border-t bg-card">
      <Container className="flex flex-col gap-6 py-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col items-start gap-3">
          <BrandMark />
          <p className="max-w-md text-muted-foreground">{t("tagline")}</p>
          <p className="max-w-md text-sm font-medium text-foreground">{t("promise")}</p>
        </div>
        <p className="text-sm text-muted-foreground">{t("rights")}</p>
      </Container>
    </footer>
  );
}
