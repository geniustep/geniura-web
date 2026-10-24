"use client";

import { BadgeCheckIcon, GitCompareArrowsIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/features/auth/form-parts";
import { fieldErrors, isApiError } from "@/lib/api/errors";
import { type Vocabulary } from "@/lib/jobs/labels";

import { cleanPayload, ifMatch, isConflict, useRefreshProfile } from "./api";
import { PartialDateField } from "./partial-date-field";
import { canPreserveSelectedDay, datePrecision, toApiPartialDate, validDateForPrecision, validProfessionalRange, type PartialDatePrecision } from "./partial-date";
import { useLanguageName } from "./labels";
import {
  formValues,
  LANGUAGE_CODES,
  SECTIONS,
  type FieldDef,
  type SectionItem,
  type SectionKind,
} from "./sections";
import { SkillPicker } from "./skill-picker";

type Values = Record<string, string | boolean>;

function FieldControl({
  field,
  id,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  vocabulary,
  datePrecision,
  selectedPrecision,
  onPrecisionChange,
}: {
  field: FieldDef;
  id: string;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  vocabulary: Vocabulary;
  datePrecision?: unknown;
  selectedPrecision?: PartialDatePrecision;
  onPrecisionChange?: (precision: PartialDatePrecision) => void;
}) {
  const t = useTranslations("Profile");
  const languageName = useLanguageName();
  const common = {
    id,
    disabled,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  };
  switch (field.kind) {
    case "textarea":
      return (
        <Textarea
          {...common}
          dir="auto"
          maxLength={field.maxLength}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "partial-date":
      return (
        <PartialDateField
          id={id}
          value={String(value)}
          precision={datePrecision}
          selectedPrecision={selectedPrecision}
          onPrecisionChange={(value) => onPrecisionChange?.(value)}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
          describedBy={describedBy}
        />
      );
    case "date":
      return (
        <Input
          {...common}
          type="date"
          dir="ltr"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "years":
      return (
        <Input
          {...common}
          inputMode="decimal"
          dir="ltr"
          value={String(value)}
          onChange={(e) => onChange(e.target.value.replace(",", "."))}
        />
      );
    case "checkbox":
      return (
        <input
          {...common}
          type="checkbox"
          className="size-5 accent-[var(--action)]"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "select":
      return (
        <NativeSelect {...common} value={String(value)} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {t(`enums.${field.enumKey}.${option || "blank"}` as "enums.skillLevel.basic")}
            </option>
          ))}
        </NativeSelect>
      );
    case "language":
      return (
        <NativeSelect {...common} value={String(value)} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t("form.chooseLanguage")}</option>
          {LANGUAGE_CODES.map((code) => (
            <option key={code} value={code}>
              {languageName(code)}
            </option>
          ))}
        </NativeSelect>
      );
    case "skill":
      return (
        <SkillPicker
          id={id}
          value={String(value)}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
          describedBy={describedBy}
          vocabulary={vocabulary}
        />
      );
    default:
      return (
        <Input
          {...common}
          dir="auto"
          maxLength={field.maxLength}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/**
 * Add or edit one professional fact. Saving sends the version the form was opened from; when the
 * fact changed on another device the server refuses, and the person picks which version to keep.
 */
export function ItemDialog({
  kind,
  item,
  open,
  onOpenChange,
  vocabulary,
}: {
  kind: SectionKind;
  item?: SectionItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocabulary: Vocabulary;
}) {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const formId = useId();
  const refresh = useRefreshProfile();
  const section = SECTIONS[kind];
  const [values, setValues] = useState<Values>(() => formValues(kind, item));
  const [version, setVersion] = useState(item?.updated_at ?? null);
  const [latest, setLatest] = useState<SectionItem | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [chosenPrecision, setChosenPrecision] = useState<Record<string, PartialDatePrecision>>({});

  const verified = item?.source === "verified";
  const changedFromLatest = latest
    ? section.fields.filter(
        (f) => String(formValues(kind, latest)[f.name]) !== String(values[f.name]),
      )
    : [];

  async function save(withVersion: string | null) {
    setPending(true);
    setFailure(null);
    setErrors({});
    const required = section.fields.filter((f) => f.required && !String(values[f.name]).trim());
    if (required.length) {
      setErrors(Object.fromEntries(required.map((f) => [f.name, t("form.required")])));
      setPending(false);
      return;
    }
    const partialFields = section.fields.filter((field) => field.kind === "partial-date");
    const invalidDates = partialFields.filter((field) => {
      if (kind === "experiences" && field.name === "end_date" && values.is_current) return false;
      const value = String(values[field.name] ?? "");
      const precision = chosenPrecision[field.name] ??
        datePrecision(value, item?.[field.name + "_precision"]);
      return !validDateForPrecision(value, precision);
    });
    if (invalidDates.length) {
      setErrors(Object.fromEntries(invalidDates.map((field) => [field.name, t("partialDate.invalid")])));
      setPending(false);
      return;
    }
    const unsupportedFirstDays = partialFields.filter((field) => {
      if (kind === "experiences" && field.name === "end_date" && values.is_current) return false;
      const value = String(values[field.name] ?? "");
      const precision = chosenPrecision[field.name] ?? datePrecision(value, item?.[field.name + "_precision"]);
      const unchanged = item && String(item[field.name] ?? "") === value &&
        (chosenPrecision[field.name] === undefined || chosenPrecision[field.name] === item[field.name + "_precision"]);
      return !unchanged && !canPreserveSelectedDay(value, precision);
    });
    if (unsupportedFirstDays.length) {
      setErrors(Object.fromEntries(unsupportedFirstDays.map((field) =>
        [field.name, t("partialDate.firstDayUnsupported")])));
      setPending(false);
      return;
    }
    const start = String(values.start_date ?? "");
    const end = String(values.end_date ?? "");
    if (partialFields.length && !(kind === "experiences" && values.is_current) && !validProfessionalRange(start, end)) {
      setErrors({ end_date: t("partialDate.rangeInvalid") });
      setPending(false);
      return;
    }
    const editable = Object.fromEntries(
      Object.entries(values)
        .filter(([name, value]) => {
          const field = section.fields.find((entry) => entry.name === name);
          if (item && field?.createOnly) return false;
          if (item && field?.kind === "partial-date" && String(item[name] ?? "") === String(value ?? "")) {
            // Never re-interpret an unchanged legacy date when editing an unrelated field.
            return name === "end_date" && kind === "experiences" &&
              Boolean(values.is_current) && !Boolean(item.is_current);
          }
          return true;
        })
        .map(([name, value]) => {
          const field = section.fields.find((entry) => entry.name === name);
          if (field?.kind === "partial-date") {
            return [name, kind === "experiences" && name === "end_date" && values.is_current
              ? null : toApiPartialDate(String(value))];
          }
          return [name, value];
        }),
    );
    const body = cleanPayload(editable, section.nullable) as never;
    try {
      if (item) await section.api.update(item.id, body, ifMatch(withVersion));
      else await section.api.create(body);
      await refresh();
      toast.success(item ? t("form.saved") : t("form.added"));
      onOpenChange(false);
    } catch (error) {
      if (isConflict(error) && item) {
        try {
          const fresh = (await section.api.retrieve(item.id)) as SectionItem;
          setLatest(fresh);
          setVersion(fresh.updated_at);
        } catch {
          setFailure(error);
        }
      } else if (isApiError(error) && error.code === "validation_error") {
        const { byField, general } = fieldErrors(error);
        setErrors(byField);
        if (general.length) setFailure(error);
      } else {
        setFailure(error);
      }
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void save(version);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={tCommon("close")} className="w-[min(36rem,100vw-2rem)]">
        <DialogTitle>{t(`sections.${kind}.${item ? "editTitle" : "addTitle"}`)}</DialogTitle>
        <DialogDescription>{t(`sections.${kind}.hint`)}</DialogDescription>

        {latest ? (
          <div
            role="alert"
            className="grid gap-3 rounded-2xl bg-warning-soft p-4 text-sm text-warning"
          >
            <p className="flex gap-2 font-semibold">
              <GitCompareArrowsIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t("conflict.title")}
            </p>
            <p className="text-foreground">{t("conflict.body")}</p>
            {changedFromLatest.length ? (
              <dl className="grid gap-2 rounded-xl bg-card p-3 text-foreground">
                {changedFromLatest.map((field) => (
                  <div key={field.name} className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">
                      {t(`fields.${field.name}` as "fields.title")}
                    </dt>
                    <dd className="grid gap-0.5 sm:grid-cols-2 sm:gap-3">
                      <span>
                        <span className="text-xs text-muted-foreground">
                          {t("conflict.theirs")}{" "}
                        </span>
                        <bdi dir="auto">{String(formValues(kind, latest)[field.name]) || "—"}</bdi>
                      </span>
                      <span>
                        <span className="text-xs text-muted-foreground">
                          {t("conflict.yours")}{" "}
                        </span>
                        <bdi dir="auto">{String(values[field.name]) || "—"}</bdi>
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void save(version)} disabled={pending}>
                {t("conflict.keepMine")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setValues(formValues(kind, latest));
                  setChosenPrecision({});
                  setLatest(null);
                }}
              >
                {t("conflict.useTheirs")}
              </Button>
            </div>
          </div>
        ) : null}

        {verified ? (
          <p className="flex gap-2 rounded-2xl bg-success-soft p-3 text-sm text-success">
            <BadgeCheckIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t("form.verifiedWarning")}
          </p>
        ) : null}

        <form id={formId} className="grid gap-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const id = `${formId}-${field.name}`;
              const errorId = errors[field.name] ? `${id}-error` : undefined;
              const wide =
                field.kind === "textarea" || field.kind === "skill" || field.name === "institution";
              const locked = Boolean(item && field.createOnly);
              const control = (
                <FieldControl
                  field={field}
                  id={id}
                  value={values[field.name] ?? ""}
                  onChange={(value) =>
                    setValues((current) => ({ ...current, [field.name]: value }))
                  }
                  disabled={pending || locked}
                  invalid={Boolean(errorId)}
                  describedBy={errorId}
                  vocabulary={vocabulary}
                  datePrecision={item?.[field.name + "_precision"]}
                  selectedPrecision={chosenPrecision[field.name]}
                  onPrecisionChange={(precision) => setChosenPrecision((old) => ({ ...old, [field.name]: precision }))}
                />
              );
              return (
                <div
                  key={field.name}
                  className={
                    field.kind === "checkbox"
                      ? "flex items-center gap-3 sm:col-span-2"
                      : `grid gap-2 ${wide ? "sm:col-span-2" : ""}`
                  }
                >
                  {field.kind === "checkbox" ? (
                    <>
                      {control}
                      <Label htmlFor={id}>{t(`fields.${field.name}` as "fields.title")}</Label>
                    </>
                  ) : (
                    <>
                      <Label htmlFor={id}>
                        {t(`fields.${field.name}` as "fields.title")}
                        {field.required ? <span aria-hidden="true"> *</span> : null}
                      </Label>
                      {control}
                      {locked ? (
                        <p className="text-xs text-muted-foreground">{t("form.identityLocked")}</p>
                      ) : null}
                    </>
                  )}
                  {errorId ? (
                    <p id={errorId} className="text-sm text-destructive sm:col-span-2">
                      {errors[field.name]}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <FormAlert error={failure} />
          <div className="flex flex-wrap justify-end gap-2" lang={locale}>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={pending || Boolean(latest)}>
              {pending ? t("form.saving") : verified ? t("form.saveAndUnverify") : t("form.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
