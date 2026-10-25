"use client";

import {
  BriefcaseBusinessIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FileTextIcon,
  GraduationCapIcon,
  HistoryIcon,
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
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
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
import { getDirection } from "@/lib/i18n/config";
import { Link } from "@/lib/i18n/navigation";
import type { Vocabulary } from "@/lib/jobs/labels";

import { ifMatch, isConflict, useRefreshProfile } from "./api";
import { formatProfessionalDate } from "./partial-date";
import { IdentityDialog } from "./identity-dialog";
import { ItemDialog } from "./item-dialog";
import { useLanguageName, useVocabularyLabel } from "./labels";
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
  const period = (item: SectionItem, current?: boolean) => {
    const from = formatProfessionalDate(item.start_date, item.start_date_precision, locale);
    const to = current
      ? t("item.present")
      : formatProfessionalDate(item.end_date, item.end_date_precision, locale);
    return from || to ? [from ?? "…", to ?? "…"].join(" – ") : null;
  };

  return (
    kind: SectionKind,
    item: SectionItem,
  ): { title: string; meta: (string | null)[]; alert?: string } => {
    switch (kind) {
      case "educations":
        return {
          title: String(item.degree || item.institution),
          meta: [
            item.degree ? String(item.institution) : null,
            item.level ? tJobs(`educationLevel.${item.level}` as "educationLevel.none") : null,
            period(item),
          ],
        };
      case "experiences":
        return {
          title: String(item.title),
          meta: [
            item.employer_name ? String(item.employer_name) : null,
            period(item, Boolean(item.is_current)),
          ],
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
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-2 rounded-2xl bg-card p-6 shadow-card"
    >
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

function NextSteps({
  profile,
  onIdentity,
  onAdd,
}: {
  profile: CandidateProfile;
  onIdentity: () => void;
  onAdd: (kind: SectionKind) => void;
}) {
  const t = useTranslations("Profile.next");
  const c = profile.completeness;
  const steps: { key: string; action: () => void }[] = [];
  if (!c.has_headline) steps.push({ key: "headline", action: onIdentity });
  if (!c.has_city) steps.push({ key: "city", action: onIdentity });
  if (!c.has_skills) steps.push({ key: "skills", action: () => onAdd("skills") });
  if (!c.has_languages) steps.push({ key: "languages", action: () => onAdd("languages") });
  if (!c.has_experience) steps.push({ key: "experience", action: () => onAdd("experiences") });
  const resumeChecking = c.has_resume && !c.has_shareable_resume;

  if (!steps.length && !resumeChecking && c.has_resume) return null;
  return (
    <section
      aria-labelledby="next-steps"
      className="flex flex-col gap-3 rounded-2xl bg-card p-6 shadow-card"
    >
      <div className="grid gap-1">
        <h2 id="next-steps" className="text-lg font-semibold">
          {t("title", { count: steps.length })}
        </h2>
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
      </div>
      <ul className="grid gap-1">
        {steps.map((step) => (
          <li key={step.key}>
            <button
              type="button"
              onClick={step.action}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-start hover:bg-muted"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-lg border-2 border-dashed border-action text-action">
                <PlusIcon className="size-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-medium">{t(`steps.${step.key}`)}</span>
              {step.key === "experience" ? (
                <span className="text-xs text-muted-foreground">{t("optional")}</span>
              ) : null}
            </button>
          </li>
        ))}
        {!c.has_resume ? (
          <li>
            <Link
              href="/account/profile/resumes"
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 hover:bg-muted"
            >
              <span className="inline-flex size-7 items-center justify-center rounded-lg border-2 border-dashed border-action text-action">
                <FileTextIcon className="size-4" aria-hidden="true" />
              </span>
              <span className="flex-1 text-sm font-medium">{t("steps.resume")}</span>
              <span className="text-xs text-muted-foreground">{t("optional")}</span>
            </Link>
          </li>
        ) : null}
        {resumeChecking ? (
          <li className="flex min-h-11 items-center gap-3 px-2 text-sm text-muted-foreground">
            <FileTextIcon className="size-4" aria-hidden="true" />
            {t("resumeChecking")}
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function SideLink({
  href,
  icon: Icon,
  title,
  line,
}: {
  href: string;
  icon: typeof EyeIcon;
  title: string;
  line: string;
}) {
  const locale = useLocale();
  const Chevron = getDirection(locale) === "rtl" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card hover:bg-muted"
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
        <Icon className="size-5 text-secondary-foreground" aria-hidden="true" />
      </span>
      <span className="grid flex-1 gap-0.5">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{line}</span>
      </span>
      <Chevron className="size-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

export function ProfileWorkspace({ vocabulary }: { vocabulary: Vocabulary }) {
  const t = useTranslations("Profile");
  const tJobs = useTranslations("Jobs");
  const format = useFormatter();
  const label = useVocabularyLabel(vocabulary);
  const profile = useCandidatesMeRetrieve({ query: { staleTime: 30_000 } });
  const lists = useSectionLists();
  const [identityOpen, setIdentityOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);

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
  const city = label("locations", data.city);
  const availability = t(`enums.availability.${data.availability ?? "unspecified"}`);
  const openAdd = (kind: SectionKind) => setEditing({ kind });
  const results = (kind: SectionKind) =>
    ((lists[kind].data as { results?: SectionItem[] } | undefined)?.results ?? []) as SectionItem[];

  const identity: ReactNode = (
    <section
      aria-labelledby="identity"
      className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-float sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 id="identity" className="text-2xl font-bold sm:text-3xl">
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="grid min-w-0 gap-6">
        {identity}
        <NextSteps profile={data} onIdentity={() => setIdentityOpen(true)} onAdd={openAdd} />
        {(Object.keys(SECTIONS) as SectionKind[]).map((kind) => (
          <SectionCard
            key={kind}
            kind={kind}
            items={results(kind)}
            loading={lists[kind].isPending}
            error={lists[kind].error}
            vocabulary={vocabulary}
            onAdd={() => openAdd(kind)}
            onEdit={(item) => setEditing({ kind, item })}
          />
        ))}
      </div>
      <aside className="grid gap-3 lg:sticky lg:top-24">
        <VisibilityStrip profile={data} />
        <SideLink
          href="/account/profile/resumes"
          icon={FileTextIcon}
          title={t("links.resumes")}
          line={t("links.resumesLine")}
        />
        <SideLink
          href="/account/profile/access-log"
          icon={HistoryIcon}
          title={t("links.accessLog")}
          line={t("links.accessLogLine")}
        />
        <SideLink href="/jobs" icon={EyeIcon} title={t("links.jobs")} line={t("links.jobsLine")} />
      </aside>

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
