"use client";

import { GitCompareArrowsIcon } from "lucide-react";
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
import {
  candidatesMePartialUpdate,
  candidatesMeRetrieve,
} from "@/lib/api/generated/endpoints/candidates/candidates";
import {
  CandidateProfileAvailabilityEnum,
  ContractTypeEnum,
  WorkModeEnum,
  type CandidateProfile,
} from "@/lib/api/generated/model";
import { vocabularyOptions, type Vocabulary } from "@/lib/jobs/labels";

import { ifMatch, isConflict, useRefreshProfile } from "./api";

type Values = {
  headline: string;
  summary: string;
  city: string;
  availability: string;
  available_from: string;
  willing_to_relocate: boolean;
  desired_contract_types: string[];
  desired_work_modes: string[];
};

function toValues(profile: CandidateProfile): Values {
  return {
    headline: profile.headline ?? "",
    summary: profile.summary ?? "",
    city: profile.city ?? "",
    availability: profile.availability ?? "unspecified",
    available_from: profile.available_from ?? "",
    willing_to_relocate: Boolean(profile.willing_to_relocate),
    desired_contract_types: [...(profile.desired_contract_types ?? [])],
    desired_work_modes: [...(profile.desired_work_modes ?? [])],
  };
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Professional identity, target and availability: one explicit save, guarded by the profile version. */
export function IdentityDialog({
  profile,
  open,
  onOpenChange,
  vocabulary,
}: {
  profile: CandidateProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocabulary: Vocabulary;
}) {
  const t = useTranslations("Profile");
  const tJobs = useTranslations("Jobs");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const formId = useId();
  const refresh = useRefreshProfile();
  const [values, setValues] = useState<Values>(() => toValues(profile));
  const [version, setVersion] = useState(profile.profile_updated_at);
  const [latest, setLatest] = useState<CandidateProfile | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const cities = vocabularyOptions(vocabulary.locations, locale);

  async function save(withVersion: string) {
    setPending(true);
    setFailure(null);
    setErrors({});
    try {
      await candidatesMePartialUpdate(
        {
          headline: values.headline.trim(),
          summary: values.summary.trim(),
          city: values.city || null,
          availability: values.availability as CandidateProfileAvailabilityEnum,
          available_from:
            values.availability === "from_date" ? values.available_from || null : null,
          willing_to_relocate: values.willing_to_relocate,
          desired_contract_types: values.desired_contract_types as ContractTypeEnum[],
          desired_work_modes: values.desired_work_modes as WorkModeEnum[],
        },
        ifMatch(withVersion),
      );
      await refresh();
      toast.success(t("form.saved"));
      onOpenChange(false);
    } catch (error) {
      if (isConflict(error)) {
        try {
          const fresh = await candidatesMeRetrieve();
          setLatest(fresh);
          setVersion(fresh.profile_updated_at);
        } catch {
          setFailure(error);
        }
      } else if (
        isApiError(error) &&
        (error.code === "validation_error" || error.code === "available_from_required")
      ) {
        const { byField } = fieldErrors(error);
        setErrors(
          error.code === "available_from_required"
            ? { available_from: t("form.required") }
            : byField,
        );
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

  const field = (name: keyof Values) => ({
    id: `${formId}-${name}`,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${formId}-${name}-error` : undefined,
    disabled: pending,
  });
  const error = (name: keyof Values) =>
    errors[name] ? (
      <p id={`${formId}-${name}-error`} className="text-sm text-destructive">
        {errors[name]}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={tCommon("close")} className="w-[min(40rem,100vw-2rem)]">
        <DialogTitle>{t("identity.editTitle")}</DialogTitle>
        <DialogDescription>{t("identity.hint")}</DialogDescription>

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
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => void save(version)} disabled={pending}>
                {t("conflict.keepMine")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setValues(toValues(latest));
                  setLatest(null);
                }}
              >
                {t("conflict.useTheirs")}
              </Button>
            </div>
          </div>
        ) : null}

        <form className="grid gap-4" onSubmit={onSubmit} noValidate>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-headline`}>{t("fields.headline")}</Label>
            <Input
              {...field("headline")}
              dir="auto"
              maxLength={160}
              placeholder={t("identity.headlineExample")}
              value={values.headline}
              onChange={(e) => setValues((v) => ({ ...v, headline: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              {t("form.counter", { count: values.headline.length, max: 160 })}
            </p>
            {error("headline")}
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-summary`}>{t("fields.summary")}</Label>
            <Textarea
              {...field("summary")}
              dir="auto"
              maxLength={3000}
              value={values.summary}
              onChange={(e) => setValues((v) => ({ ...v, summary: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{t("identity.summaryHint")}</p>
            {error("summary")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-city`}>{t("fields.city")}</Label>
              <NativeSelect
                {...field("city")}
                value={values.city}
                onChange={(e) => setValues((v) => ({ ...v, city: e.target.value }))}
              >
                <option value="">{t("form.notSpecified")}</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.label}
                  </option>
                ))}
              </NativeSelect>
              {error("city")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-availability`}>{t("fields.availability")}</Label>
              <NativeSelect
                {...field("availability")}
                value={values.availability}
                onChange={(e) => setValues((v) => ({ ...v, availability: e.target.value }))}
              >
                {Object.values(CandidateProfileAvailabilityEnum).map((value) => (
                  <option key={value} value={value}>
                    {t(`enums.availability.${value}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            {values.availability === "from_date" ? (
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-available_from`}>{t("fields.available_from")}</Label>
                <Input
                  {...field("available_from")}
                  type="date"
                  dir="ltr"
                  value={values.available_from}
                  onChange={(e) => setValues((v) => ({ ...v, available_from: e.target.value }))}
                />
                {error("available_from")}
              </div>
            ) : null}
          </div>
          {values.availability === "not_looking" && profile.visibility === "discoverable" ? (
            <p className="rounded-xl bg-muted p-3 text-sm text-subtle-foreground">
              {t("identity.pauseNote")}
            </p>
          ) : null}
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">
              {t("fields.desired_contract_types")}
            </legend>
            <div className="flex flex-wrap gap-2">
              {Object.values(ContractTypeEnum).map((value) => {
                const checked = values.desired_contract_types.includes(value);
                return (
                  <label
                    key={value}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={pending}
                      onChange={() =>
                        setValues((v) => ({
                          ...v,
                          desired_contract_types: toggle(v.desired_contract_types, value),
                        }))
                      }
                    />
                    {tJobs(`contractType.${value}`)}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">{t("fields.desired_work_modes")}</legend>
            <div className="flex flex-wrap gap-2">
              {Object.values(WorkModeEnum).map((value) => {
                const checked = values.desired_work_modes.includes(value);
                return (
                  <label
                    key={value}
                    className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={pending}
                      onChange={() =>
                        setValues((v) => ({
                          ...v,
                          desired_work_modes: toggle(v.desired_work_modes, value),
                        }))
                      }
                    />
                    {tJobs(`workMode.${value}`)}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-[var(--action)]"
              checked={values.willing_to_relocate}
              disabled={pending}
              onChange={(e) => setValues((v) => ({ ...v, willing_to_relocate: e.target.checked }))}
            />
            {t("fields.willing_to_relocate")}
          </label>
          <FormAlert error={failure} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={pending || Boolean(latest)}>
              {pending ? t("form.saving") : t("form.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
