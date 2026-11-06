"use client";

import {
  BriefcaseBusinessIcon,
  FileTextIcon,
  GraduationCapIcon,
  LanguagesIcon,
  LockKeyholeIcon,
  PencilIcon,
  PlusIcon,
  RadarIcon,
  ScrollTextIcon,
  SparklesIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UsersRoundIcon,
  UserRoundIcon,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";

import { ProvenanceTag } from "@/components/patterns/provenance-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import {
  useCandidatesMeCertificationsList,
  useCandidatesMeEducationsList,
  useCandidatesMeExperiencesList,
  useCandidatesMeLanguagesList,
  useCandidatesMeRetrieve,
  useCandidatesMeSkillsList,
} from "@/lib/api/generated/endpoints/candidates/candidates";
import type { CandidateProfile } from "@/lib/api/generated/model";
import { Link } from "@/lib/i18n/navigation";
import type { Vocabulary } from "@/lib/jobs/labels";

import { ifMatch, isConflict, useRefreshProfile } from "./api";
import { IdentityDialog } from "./identity-dialog";
import { ItemDialog } from "./item-dialog";
import { useLanguageName, useVocabularyLabel } from "./labels";
import { displayProfilePeriod } from "./periods";
import { SECTIONS, type SectionItem, type SectionKind } from "./sections";

const SECTION_ICONS = {
  educations: GraduationCapIcon,
  experiences: BriefcaseBusinessIcon,
  skills: SparklesIcon,
  languages: LanguagesIcon,
  certifications: ScrollTextIcon,
} as const;

const PAGE = { page_size: 50 };

type Editing = { kind: SectionKind; item?: SectionItem } | null;

function useSectionLists() {
  const options = { query: { staleTime: 30_000 } };
  return {
    educations: useCandidatesMeEducationsList(PAGE, options),
    experiences: useCandidatesMeExperiencesList(PAGE, options),
    skills: useCandidatesMeSkillsList(PAGE, options),
    languages: useCandidatesMeLanguagesList(PAGE, options),
    certifications: useCandidatesMeCertificationsList(PAGE, options),
  };
}

function useItemText(vocabulary: Vocabulary) {
  const t = useTranslations("Profile");
  const tJobs = useTranslations("Jobs");
  const format = useFormatter();
  const locale = useLocale();
  const languageName = useLanguageName();
  const label = useVocabularyLabel(vocabulary);

  const year = (value: unknown) =>
    typeof value === "string" && value
      ? format.dateTime(new Date(value), { year: "numeric", month: "short" })
      : null;
  const period = (item: SectionItem) => displayProfilePeriod(item, locale, t("item.present"));

  return (
    kind: SectionKind,
    item: SectionItem,
  ): { title: string; meta: (string | null)[]; alert?: string } => {
    switch (kind) {
      case "educations":
        return {
          title: String(item.degree || item.institution),
          meta: [
            item.degree ? String(item.institution || t("form.notSpecified")) : null,
            item.level ? tJobs(`educationLevel.${item.level}` as "educationLevel.none") : null,
            period(item),
          ],
        };
      case "experiences":
        return {
          title: String(item.title),
          meta: [item.employer_name ? String(item.employer_name) : null, period(item)],
        };
      case "skills":
        return {
          title: label("skills", String(item.skill)) ?? String(item.skill_code),
          meta: [
            item.level && item.level !== "unspecified"
              ? t(`enums.skillLevel.${item.level}` as "enums.skillLevel.basic")
              : null,
            item.years ? t("item.years", { years: Number(item.years) }) : null,
          ],
        };
      case "languages":
        return {
          title: languageName(String(item.language_code)),
          meta: [t(`enums.languageLevel.${item.level}` as "enums.languageLevel.B2")],
        };
      case "certifications": {
        const expired =
          typeof item.expires_at === "string" &&
          item.expires_at < new Date().toISOString().slice(0, 10);
        return {
          title: String(item.name),
          meta: [
            t(`enums.certificationKind.${item.kind}` as "enums.certificationKind.license"),
            item.issuer ? String(item.issuer) : null,
            item.expires_at ? t("item.expires", { date: year(item.expires_at) ?? "" }) : null,
          ],
          alert: expired ? t("item.expired") : undefined,
        };
      }
    }
  };
}

function ItemRow({
  kind,
  item,
  vocabulary,
  onEdit,
}: {
  kind: SectionKind;
  item: SectionItem;
  vocabulary: Vocabulary;
  onEdit: () => void;
}) {
  const t = useTranslations("Profile");
  const text = useItemText(vocabulary)(kind, item);
  const refresh = useRefreshProfile();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await SECTIONS[kind].api.destroy(item.id, ifMatch(item.updated_at));
      toast.success(t("item.deleted"));
    } catch (error) {
      toast.error(isConflict(error) ? t("conflict.deleteRefused") : t("item.deleteFailed"));
    } finally {
      setBusy(false);
      setConfirming(false);
      await refresh();
    }
  }

  return (
    <li className="flex flex-col gap-3 border-t py-4 first:border-t-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="grid min-w-0 gap-1">
        <p className="font-semibold">
          <bdi dir="auto">{text.title}</bdi>
        </p>
        <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
          {text.meta.filter(Boolean).map((part, index) => (
            <span key={index} className="after:ms-2 after:content-['·'] last:after:content-none">
              <bdi dir="auto">{part}</bdi>
            </span>
          ))}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <ProvenanceTag source={item.source} />
          {text.alert ? (
            <Badge variant="warning">
              <TriangleAlertIcon aria-hidden="true" />
              {text.alert}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        {confirming ? (
          <>
            <Button size="sm" variant="destructive" onClick={() => void remove()} disabled={busy}>
              {t("item.confirmDelete")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              {t("form.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              aria-label={t("item.editLabel", { name: text.title })}
            >
              <PencilIcon aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t("item.edit")}</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(true)}
              aria-label={t("item.deleteLabel", { name: text.title })}
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

function SectionCard({
  kind,
  items,
  loading,
  error,
  vocabulary,
  onAdd,
  onEdit,
}: {
  kind: SectionKind;
  items: SectionItem[];
  loading: boolean;
  error: unknown;
  vocabulary: Vocabulary;
  onAdd: () => void;
  onEdit: (item: SectionItem) => void;
}) {
  const t = useTranslations("Profile");
  const Icon = SECTION_ICONS[kind];
  const headingId = `section-${kind}`;
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4 bg-card p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-semibold">
          <Icon className="size-5 text-action" aria-hidden="true" />
          {t(`sections.${kind}.title`)}
        </h2>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <PlusIcon aria-hidden="true" />
          {t("item.add")}
        </Button>
      </div>
      {loading ? <Skeleton className="h-16" /> : null}
      {error ? <FormAlert error={error} /> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">{t(`sections.${kind}.empty`)}</p>
      ) : null}
      {items.length ? (
        <ul>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              kind={kind}
              item={item}
              vocabulary={vocabulary}
              onEdit={() => onEdit(item)}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function VisibilityStrip({ profile }: { profile: CandidateProfile }) {
  const t = useTranslations("Profile");
  const paused = profile.visibility === "discoverable" && profile.availability === "not_looking";
  const Icon =
    profile.visibility === "private"
      ? LockKeyholeIcon
      : profile.visibility === "discoverable"
        ? RadarIcon
        : UsersRoundIcon;
  return (
    <Link
      href="/account/profile/privacy"
      className="flex items-center gap-3 rounded-2xl bg-secondary p-4 text-secondary-foreground hover:bg-secondary/80"
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="grid flex-1 gap-0.5 text-sm">
        <strong className="text-foreground">{t(`visibility.${profile.visibility}.short`)}</strong>
        <span>{paused ? t("visibility.paused") : t(`visibility.${profile.visibility}.line`)}</span>
      </span>
      <span className="text-sm font-semibold text-action">{t("visibility.manage")}</span>
    </Link>
  );
}

const SECTION_ORDER: SectionKind[] = [
  "experiences",
  "educations",
  "skills",
  "languages",
  "certifications",
];
function subscribeSection(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function currentSection(): SectionKind | "identity" {
  const kind = window.location.hash.replace("#section-", "");
  return SECTION_ORDER.includes(kind as SectionKind) ? (kind as SectionKind) : "identity";
}
const initialSection = () => "identity" as const;

export function ProfileWorkspace({ vocabulary }: { vocabulary: Vocabulary }) {
  const t = useTranslations("Profile");
  const tJobs = useTranslations("Jobs");
  const format = useFormatter();
  const label = useVocabularyLabel(vocabulary);
  const profile = useCandidatesMeRetrieve({ query: { staleTime: 30_000 } });
  const lists = useSectionLists();
  const [identityOpen, setIdentityOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const active = useSyncExternalStore(subscribeSection, currentSection, initialSection);

  if (profile.isPending) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (profile.isError || !profile.data) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-card">
        <FormAlert error={profile.error} />
      </div>
    );
  }

  const data = profile.data;
  const VisibilityIcon =
    data.visibility === "private"
      ? LockKeyholeIcon
      : data.visibility === "discoverable"
        ? RadarIcon
        : UsersRoundIcon;
  const city = label("locations", data.city);
  const availability = t(`enums.availability.${data.availability ?? "unspecified"}`);
  const openAdd = (kind: SectionKind) => setEditing({ kind });
  const results = (kind: SectionKind) =>
    ((lists[kind].data as { results?: SectionItem[] } | undefined)?.results ?? []) as SectionItem[];

  const identity: ReactNode = (
    <section aria-labelledby="identity" className="flex min-w-0 flex-col gap-4 bg-card p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 id="identity" className="text-xl font-semibold break-words sm:text-2xl">
            {data.headline ? (
              <bdi dir="auto">{data.headline}</bdi>
            ) : (
              <span className="text-muted-foreground">{t("identity.noHeadline")}</span>
            )}
          </h2>
          <p className="text-muted-foreground">
            {[city, data.willing_to_relocate ? t("identity.relocate") : null]
              .filter(Boolean)
              .join(" · ") || t("identity.noCity")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIdentityOpen(true)}>
          <PencilIcon aria-hidden="true" />
          {t("item.edit")}
        </Button>
      </div>
      {data.summary ? (
        <p className="max-w-3xl whitespace-pre-line" dir="auto">
          {data.summary}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={
            data.availability === "immediate"
              ? "success"
              : data.availability === "not_looking"
                ? "neutral"
                : "info"
          }
        >
          {availability}
          {data.availability === "from_date" && data.available_from
            ? ` ${format.dateTime(new Date(data.available_from), { dateStyle: "medium" })}`
            : ""}
        </Badge>
        {(data.desired_contract_types ?? []).map((value) => (
          <Badge key={value} variant="neutral">
            {tJobs(`contractType.${value}`)}
          </Badge>
        ))}
        {(data.desired_work_modes ?? []).map((value) => (
          <Badge key={value} variant="neutral">
            {tJobs(`workMode.${value}`)}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("identity.updated", {
          date: format.dateTime(new Date(data.profile_updated_at), {
            dateStyle: "long",
            timeStyle: "short",
          }),
        })}
      </p>
    </section>
  );

  return (
    <div className="grid min-w-0 gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
        <p className="min-w-0 text-lg font-semibold break-words sm:text-xl" dir="auto">
          {data.headline || t("identity.noHeadline")}
        </p>
        <Link
          href="/account/profile/privacy"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm text-secondary-foreground"
        >
          <VisibilityIcon className="size-4" aria-hidden="true" />
          {t(`visibility.${data.visibility}.short`)}
        </Link>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
        <aside className="min-w-0 lg:sticky lg:top-24">
          <nav
            aria-label={t("pages.profile.title")}
            className="overflow-x-auto lg:overflow-visible"
          >
            <ul className="flex w-max gap-1 lg:grid lg:w-auto lg:gap-2">
              <li>
                <a
                  href="#section-identity"
                  aria-current={active === "identity" ? "location" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${active === "identity" ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"}`}
                >
                  <UserRoundIcon className="size-5 shrink-0" aria-hidden="true" />
                  {t("editor.information")}
                </a>
              </li>
              {SECTION_ORDER.map((kind) => {
                const Icon = SECTION_ICONS[kind];
                return (
                  <li key={kind}>
                    <a
                      href={`#section-${kind}`}
                      aria-current={active === kind ? "location" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${active === kind ? "bg-secondary text-secondary-foreground" : "hover:bg-muted"}`}
                    >
                      <Icon className="size-5 shrink-0" aria-hidden="true" />
                      {t(`sections.${kind}.title`)}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="mt-4 flex flex-wrap gap-x-4 border-t pt-3 text-sm lg:grid lg:gap-1">
            <Link
              href="/account/profile/resumes"
              className="inline-flex min-h-11 items-center gap-2 text-action"
            >
              <FileTextIcon className="size-4" aria-hidden="true" />
              {t("links.resumes")}
            </Link>
            <Link
              href="/account/profile/privacy"
              className="inline-flex min-h-11 items-center gap-2 text-action"
            >
              <LockKeyholeIcon className="size-4" aria-hidden="true" />
              {t("nav.privacy")}
            </Link>
            <Link
              href="/account/profile/access-log"
              className="inline-flex min-h-11 items-center text-action"
            >
              {t("nav.accessLog")}
            </Link>
          </div>
        </aside>
        <div
          id={`section-${active}`}
          className="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border bg-card"
        >
          {active === "identity" ? (
            <>
              {identity}
              <div className="border-t p-5 sm:px-8">
                <VisibilityStrip profile={data} />
              </div>
            </>
          ) : (
            <SectionCard
              kind={active}
              items={results(active)}
              loading={lists[active].isPending}
              error={lists[active].error}
              vocabulary={vocabulary}
              onAdd={() => openAdd(active)}
              onEdit={(item) => setEditing({ kind: active, item })}
            />
          )}
        </div>
      </div>

      {identityOpen ? (
        <IdentityDialog
          profile={data}
          open
          onOpenChange={setIdentityOpen}
          vocabulary={vocabulary}
        />
      ) : null}
      {editing ? (
        <ItemDialog
          kind={editing.kind}
          item={editing.item}
          open
          onOpenChange={(open) => (open ? null : setEditing(null))}
          vocabulary={vocabulary}
        />
      ) : null}
    </div>
  );
}
