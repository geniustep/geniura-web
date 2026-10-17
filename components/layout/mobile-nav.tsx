"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Link } from "@/lib/i18n/navigation";

import { liveNavItems, plannedNavItems } from "./nav-items";

export function MobileNav() {
  const t = useTranslations("Header");
  const tCommon = useTranslations("Common");
  // Controlled so that following a link closes the menu (the header persists across navigations).
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="inline-flex size-10 items-center justify-center rounded-md hover:bg-muted md:hidden"
        aria-label={tCommon("menu")}
      >
        <MenuIcon className="size-5" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="end" closeLabel={tCommon("close")}>
        <SheetTitle>{tCommon("menu")}</SheetTitle>
        <ul className="flex flex-col gap-1">
          {liveNavItems.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex h-11 items-center rounded-md px-3 font-medium hover:bg-muted"
              >
                {t(`nav.${item.key}`)}
              </Link>
            </li>
          ))}
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
