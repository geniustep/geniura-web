"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import {
  datePrecision,
  type PartialDatePrecision,
} from "./partial-date";

export function PartialDateField({
  id,
  value,
  precision,
  onChange,
  disabled,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  precision?: unknown;
  onChange: (value: string) => void;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
}) {
  const t = useTranslations("Profile.partialDate");
  const [selected, setSelected] = useState<PartialDatePrecision>(() => datePrecision(value, precision));
  const shown = selected === "month" ? value.slice(0, 7) : selected === "year" ? value.slice(0, 4) : value;
  const placeholder = selected === "year" ? "YYYY" : selected === "month" ? "YYYY-MM" : "YYYY-MM-DD";
  function choose(next: PartialDatePrecision) {
    setSelected(next);
    if (next === "unknown") {
      onChange("");
      return;
    }
    if (next === "year") onChange(value ? value.slice(0, 4) : "");
    else if (next === "month") onChange(value.length >= 7 ? value.slice(0, 7) : value ? value.slice(0, 4) + "-" : "");
    else onChange(selected === "day" && value.length === 10
      ? value : value.length >= 7 ? value.slice(0, 7) + "-" : value ? value.slice(0, 4) + "-" : "");
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
          <option key={option} value={option}>{t(option)}</option>
        ))}
      </NativeSelect>
      {selected !== "unknown" ? (
        <Input
          id={id}
          inputMode="numeric"
          dir="ltr"
          autoComplete="off"
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          value={shown}
          onChange={(event) => onChange(event.target.value.trim())}
        />
      ) : (
        <span id={id} className="text-sm text-muted-foreground">{shown || t("notProvided")}</span>
      )}
    </div>
  );
}
