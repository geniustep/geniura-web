import { useTranslations } from "next-intl";

import { UserMenu } from "@/features/auth/user-menu";
import { Link } from "@/lib/i18n/navigation";

import { BrandMark } from "./brand-mark";
import { Container } from "./container";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { liveNavItems, plannedNavItems } from "./nav-items";

// The original logo is navy and gold on a transparent ground, so the header stays light: the
// navy bands of each page start right below it, and the logo never gets a backdrop of its own.
export function SiteHeader() {
  const t = useTranslations("Header");
  const tCommon = useTranslations("Common");

  return (
    <header className="sticky top-0 z-30 border-b bg-background/92 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container className="flex h-18 items-center justify-between gap-4">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label={t("homeLabel")} className="rounded-md">
            <BrandMark />
          </Link>
          <nav aria-label={tCommon("menu")} className="hidden md:block">
            <ul className="flex items-center gap-2">
              {liveNavItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="inline-flex h-11 items-center rounded-full px-4 font-semibold text-foreground hover:bg-muted"
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              ))}
              {plannedNavItems.map((item) => (
                <li key={item} className="px-4 py-2 text-muted-foreground">
                  {t(`nav.${item}`)}
                  <span className="sr-only"> ({tCommon("comingSoon")})</span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <UserMenu />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
