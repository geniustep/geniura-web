"use client";

import { Menu } from "@base-ui/react/menu";
import { CheckIcon, LanguagesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/lib/i18n/navigation";
import { getDirection, locales } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const tLanguages = useTranslations("Languages");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <Menu.Root>
      <Menu.Trigger
        className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-muted data-popup-open:bg-muted"
        aria-label={t("current", { language: tLanguages(locale) })}
      >
        <LanguagesIcon className="size-4" aria-hidden="true" />
        <span>{tLanguages(locale)}</span>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50 outline-none">
          <Menu.Popup className="min-w-40 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md transition-[scale,opacity] duration-100 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {locales.map((option) => (
              <Menu.LinkItem
                key={option}
                render={<Link href={pathname} locale={option} />}
                lang={option}
                dir={getDirection(option)}
                aria-current={option === locale ? "true" : undefined}
                className={cn(
                  "flex h-10 items-center justify-between gap-4 rounded-md px-3 text-sm outline-none data-highlighted:bg-muted",
                  option === locale && "font-semibold",
                )}
              >
                {tLanguages(option)}
                {option === locale ? <CheckIcon className="size-4" aria-hidden="true" /> : null}
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
