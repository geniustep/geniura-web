"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function InteractiveDemos() {
  const t = useTranslations("DesignSystem");
  const tCommon = useTranslations("Common");

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => toast.success(t("toastMessage"))}>
        {t("toast")}
      </Button>
      <Sheet>
        <SheetTrigger render={<Button variant="outline" />}>{t("openSheet")}</SheetTrigger>
        <SheetContent side="end" closeLabel={tCommon("close")}>
          <SheetTitle>{t("sheetTitle")}</SheetTitle>
          <SheetDescription>{t("sheetBody")}</SheetDescription>
        </SheetContent>
      </Sheet>
    </div>
  );
}
