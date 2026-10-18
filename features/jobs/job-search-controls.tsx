"use client";

import { LoaderCircleIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { useId, useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  contractTypes,
  jobSearchParsers,
  postedWithinOptions,
  schedules,
  sorts,
  workModes,
} from "@/lib/jobs/search-params";

type Option = { id: string; label: string };
export type SearchOptions = { locations: Option[]; occupations: Option[]; sectors: Option[] };

/**
 * Filters live in the URL (shareable, back-button friendly, crawlable). Changing one asks the
 * server for new results (`shallow: false`) inside a transition, so the current list stays visible.
 */
function useJobSearch() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useQueryStates(jobSearchParsers, {
    shallow: false,
    scroll: false,
    startTransition,
  });
  return { state, setState, isPending };
}

export function JobSearchBar({ options }: { options: SearchOptions }) {
  const t = useTranslations("Jobs");
  const { state, setState, isPending } = useJobSearch();
  const [q, setQ] = useState(state.q);
  const [location, setLocation] = useState(state.location ?? "");
  // Keep the inputs in sync when the URL changes elsewhere (clear filters, back button).
  const [synced, setSynced] = useState({ q: state.q, location: state.location });
  if (synced.q !== state.q || synced.location !== state.location) {
    setSynced({ q: state.q, location: state.location });
    setQ(state.q);
    setLocation(state.location ?? "");
  }
  const qId = useId();
  const locationId = useId();

  function submit(event: FormEvent) {
    event.preventDefault();
    void setState({ q: q.trim() || null, location: location || null, page: null });
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className="grid gap-3 sm:grid-cols-[1fr_15rem_auto] sm:items-end"
    >
      <div className="grid gap-2">
        <Label htmlFor={qId}>{t("search.label")}</Label>
        <Input
          id={qId}
          type="search"
          dir="auto"
          enterKeyHint="search"
          maxLength={200}
          placeholder={t("search.placeholder")}
          className="h-13 md:text-base"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={locationId}>{t("search.location")}</Label>
        <NativeSelect
          id={locationId}
          className="h-13 md:text-base"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        >
          <option value="">{t("search.anyLocation")}</option>
          {options.locations.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" variant="action" size="lg" disabled={isPending}>
        {isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : (
          <SearchIcon aria-hidden="true" />
        )}
        {t("search.submit")}
      </Button>
    </form>
  );
}

function FilterFields({ options }: { options: SearchOptions }) {
  const t = useTranslations("Jobs");
  const { state, setState } = useJobSearch();
  const id = useId();

  const field = (
    key: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    items: { value: string; label: string }[],
  ) => (
    <div className="grid gap-2" key={key}>
      <Label htmlFor={`${id}-${key}`}>{label}</Label>
      <NativeSelect
        id={`${id}-${key}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t("filters.any")}</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );

  const set = (patch: Parameters<typeof setState>[0]) => void setState({ ...patch, page: null });

  return (
    <div className="grid gap-4">
      {field(
        "sort",
        t("filters.sort"),
        state.sort ?? "",
        (v) => set({ sort: (v || null) as never }),
        sorts.map((value) => ({ value, label: t(`sort.${value}`) })),
      )}
      {field(
        "contract",
        t("filters.contractType"),
        state.contract_type ?? "",
        (v) => set({ contract_type: (v || null) as never }),
        contractTypes.map((value) => ({ value, label: t(`contractType.${value}`) })),
      )}
      {field(
        "mode",
        t("filters.workMode"),
        state.work_mode ?? "",
        (v) => set({ work_mode: (v || null) as never }),
        workModes.map((value) => ({ value, label: t(`workMode.${value}`) })),
      )}
      {field(
        "schedule",
        t("filters.schedule"),
        state.schedule ?? "",
        (v) => set({ schedule: (v || null) as never }),
        schedules.map((value) => ({ value, label: t(`schedule.${value}`) })),
      )}
      {field(
        "posted",
        t("filters.posted"),
        state.posted_within_days ? String(state.posted_within_days) : "",
        (v) => set({ posted_within_days: v ? Number(v) : null }),
        postedWithinOptions.map((days) => ({
          value: String(days),
          label: t("filters.postedWithin", { days }),
        })),
      )}
      {options.occupations.length > 0
        ? field(
            "occupation",
            t("filters.occupation"),
            state.occupation ?? "",
            (v) => set({ occupation: v || null }),
            options.occupations.map((o) => ({ value: o.id, label: o.label })),
          )
        : null}
      {options.sectors.length > 0
        ? field(
            "sector",
            t("filters.sector"),
            state.sector ?? "",
            (v) => set({ sector: v || null }),
            options.sectors.map((o) => ({ value: o.id, label: o.label })),
          )
        : null}
      <Button
        variant="ghost"
        onClick={() =>
          void setState({
            q: null,
            location: null,
            occupation: null,
            sector: null,
            contract_type: null,
            work_mode: null,
            schedule: null,
            posted_within_days: null,
            sort: null,
            page: null,
          })
        }
      >
        {t("filters.clear")}
      </Button>
    </div>
  );
}

/** Sidebar on large screens; a sheet on phones, collapsed by default (web docs 04). */
export function JobFilters({ options }: { options: SearchOptions }) {
  const t = useTranslations("Jobs");
  const tCommon = useTranslations("Common");

  return (
    <>
      <aside
        aria-label={t("filters.title")}
        className="hidden self-start rounded-2xl bg-card p-6 shadow-card lg:block"
      >
        <h2 className="mb-5 text-xl font-semibold">{t("filters.title")}</h2>
        <FilterFields options={options} />
      </aside>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" className="w-full" />}>
            <SlidersHorizontalIcon aria-hidden="true" />
            {t("filters.open")}
          </SheetTrigger>
          <SheetContent side="end" closeLabel={tCommon("close")} className="overflow-y-auto">
            <SheetTitle>{t("filters.title")}</SheetTitle>
            <FilterFields options={options} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
