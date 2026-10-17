"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { plannedNavItems } from "./nav-items";

export function MobileNav() {
  const t = useTranslations("Header");
  const tCommon = useTranslations("Common");

  return (
    <Sheet>
      <SheetTrigger
        className="inline-flex size-10 items-center justify-center rounded-md hover:bg-muted md:hidden"
        aria-label={tCommon("menu")}
      >
        <MenuIcon className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="end" closeLabel={tCommon("close")}>
        <SheetTitle>{tCommon("menu")}</SheetTitle>
        <ul className="flex flex-col gap-1">
          {plannedNavItems.map((item) => (
            <li
              key={item}
              className="flex h-11 items-center justify-between rounded-md px-3 text-muted-foreground"
            >
              {t(`nav.${item}`)}
              <Badge variant="neutral">{tCommon("comingSoon")}</Badge>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
