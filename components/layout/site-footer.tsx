import { useTranslations } from "next-intl";

import { BrandMark } from "./brand-mark";
import { Container } from "./container";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="mt-auto border-t bg-muted/40">
      <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <BrandMark />
          <p className="max-w-md text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <p className="text-sm text-muted-foreground">{t("rights")}</p>
      </Container>
    </footer>
  );
}
