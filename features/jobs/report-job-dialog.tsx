"use client";

import { FlagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/features/auth/form-parts";
import { useReportsCreate } from "@/lib/api/generated/endpoints/trust-reports/trust-reports";
import type { ReportCategoryEnum } from "@/lib/api/generated/model";

const categories = [
  "fraud",
  "fee_request",
  "misleading",
  "discrimination",
  "harassment",
  "inappropriate",
  "spam",
  "privacy",
  "other",
] as const satisfies readonly ReportCategoryEnum[];

/** Anonymous reports are accepted by the API; decisions are made by Geniura's trust team. */
export function ReportJobDialog({ jobId }: { jobId: string }) {
  const t = useTranslations("Jobs.report");
  const tCommon = useTranslations("Common");
  const id = useId();
  const [category, setCategory] = useState<ReportCategoryEnum>("fraud");
  const [description, setDescription] = useState("");
  const report = useReportsCreate();

  return (
    <Dialog onOpenChange={(open) => !open && report.reset()}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="text-muted-foreground" />}
      >
        <FlagIcon aria-hidden="true" />
        {t("open")}
      </DialogTrigger>
      <DialogContent closeLabel={tCommon("close")}>
        <DialogTitle>{t("title")}</DialogTitle>
        {report.isSuccess ? (
          <p role="status">{t("done")}</p>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              report.mutate({
                data: {
                  target_type: "job",
                  target_id: jobId,
                  category,
                  ...(description.trim() ? { description: description.trim() } : {}),
                },
              });
            }}
          >
            <DialogDescription>{t("body")}</DialogDescription>
            <FormAlert error={report.error} />
            <div className="grid gap-2">
              <Label htmlFor={`${id}-category`}>{t("category")}</Label>
              <NativeSelect
                id={`${id}-category`}
                value={category}
                onChange={(event) => setCategory(event.target.value as ReportCategoryEnum)}
              >
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {t(`categories.${value}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-description`}>{t("description")}</Label>
              <Textarea
                id={`${id}-description`}
                dir="auto"
                maxLength={3000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={report.isPending}>
              {t("submit")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
