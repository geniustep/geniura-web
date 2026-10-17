import type { useFormatter } from "next-intl";

type Formatter = ReturnType<typeof useFormatter>;
type Salary = {
  min?: number | null;
  max?: number | null;
  currency?: string;
  period?: string;
} | null;

/** "9 000 – 14 000 MAD" (period added by the caller); null when no amount is published. */
export function formatSalary(format: Formatter, salary: unknown): string | null {
  const value = salary as Salary;
  if (!value || (value.min == null && value.max == null)) return null;
  const amount = (n: number) =>
    format.number(Number(n), {
      style: "currency",
      currency: value.currency ?? "MAD",
      maximumFractionDigits: 0,
    });
  if (value.min != null && value.max != null && Number(value.min) !== Number(value.max)) {
    return `${amount(value.min)} – ${amount(value.max)}`;
  }
  return amount((value.min ?? value.max)!);
}

export function salaryPeriod(salary: unknown): string | undefined {
  return (salary as Salary)?.period || undefined;
}

export function formatDate(format: Formatter, iso: string | null | undefined): string | null {
  return iso ? format.dateTime(new Date(iso), { dateStyle: "medium" }) : null;
}
