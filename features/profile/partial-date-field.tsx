"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import { datePrecision, type PartialDatePrecision } from "./partial-date";

/** Date precision is controlled by the parent so conflict reloads and corrections stay in sync. */
export function PartialDateField({
  id,
  value,
  precision,
  selectedPrecision,
  onChange,
  onPrecisionChange,
  disabled,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  precision?: unknown;
  selectedPrecision?: PartialDatePrecision;
  onChange: (value: string) => void;
  onPrecisionChange: (value: PartialDatePrecision) => void;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
}) {
  const t = useTranslations("Profile.partialDate");
  const selected = selectedPrecision ?? datePrecision(value, precision);
  const shown =
    selected === "month" ? value.slice(0, 7) : selected === "year" ? value.slice(0, 4) : value;
  const placeholder =
    selected === "year" ? "YYYY" : selected === "month" ? "YYYY-MM" : "YYYY-MM-DD";

  function choose(next: PartialDatePrecision) {
    onPrecisionChange(next);
    if (next === "unknown") return onChange("");
    if (next === "year") return onChange(value ? value.slice(0, 4) : "");
    if (next === "month") {
      return onChange(value.length >= 7 ? value.slice(0, 7) : value ? value.slice(0, 4) + "-" : "");
    }
    return onChange(
      selected === "day" && value.length === 10
        ? value
        : value.length >= 7
          ? value.slice(0, 7) + "-"
          : value
            ? value.slice(0, 4) + "-"
            : "",
    );
  }

  return (
    <div className="grid gap-2">
      <NativeSelect
        aria-label={t("precision")}
        value={selected}
        onChange={(event) => choose(event.target.value as PartialDatePrecision)}
        disabled={disabled}
      >
        {(["unknown", "year", "month", "day"] as const).map((option) => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </NativeSelect>
      {selected !== "unknown" ? (
        <Input
          id={id}
          inputMode="numeric"
          dir="ltr"
          autoComplete="off"
          placeholder={placeholder}
          aria-label={t("value")}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={shown}
          onChange={(event) => onChange(event.target.value.trim())}
        />
      ) : (
        <span className="text-sm text-muted-foreground">{shown || t("notProvided")}</span>
      )}
    </div>
  );
}
