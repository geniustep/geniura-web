import { useTranslations } from "next-intl";

import { UserMenu } from "@/features/auth/user-menu";
import { Link } from "@/lib/i18n/navigation";

import { BrandMark } from "./brand-mark";
import { Container } from "./container";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { liveNavItems, plannedNavItems } from "./nav-items";

export function SiteHeader() {
  const t = useTranslations("Header");
  const tCommon = useTranslations("Common");

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label={t("homeLabel")} className="rounded-md">
            <BrandMark />
          </Link>
          <nav aria-label={tCommon("menu")} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {liveNavItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              ))}
              {plannedNavItems.map((item) => (
                <li key={item} className="px-3 py-2 text-sm text-muted-foreground">
                  {t(`nav.${item}`)}
                  <span className="sr-only"> ({tCommon("comingSoon")})</span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <UserMenu />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
