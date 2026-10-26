"use client";

import { CheckIcon, CopyIcon, PencilIcon, Undo2Icon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert } from "@/features/auth/form-parts";
import {
  candidatesMeResumesReviewCreate,
  useCandidatesMeResumesExtractionRetrieve,
} from "@/lib/api/generated/endpoints/resumes/resumes";
import type { ActionEnum, ExtractedItem } from "@/lib/api/generated/model";
import { Link, useRouter } from "@/lib/i18n/navigation";
import type { Vocabulary } from "@/lib/jobs/labels";

import { useRefreshProfile } from "./api";
import { useLanguageName, useVocabularyLabel } from "./labels";
import {
  displayReviewPeriod,
  prepareStructuredPeriodPayload,
  STRUCTURED_PERIODS_ENABLED,
} from "./periods";

type Decision = { action: ActionEnum; corrected?: Record<string, string | boolean | null> };

/** Text fields a person may correct per kind (identity fields such as a skill id are not free text). */
const CORRECTABLE: Record<string, string[]> = {
  experience: STRUCTURED_PERIODS_ENABLED
    ? [
        "title",
        "employer_name",
        "description",
        "source_period",
        "start_date_precision",
        "start_year",
        "start_month",
        "start_date",
        "end_date_precision",
        "end_year",
        "end_month",
        "end_date",
        "is_current",
      ]
    : ["title", "employer_name", "start_date", "end_date"],
  education: STRUCTURED_PERIODS_ENABLED
    ? [
        "institution",
        "degree",
        "field_of_study",
        "source_period",
        "start_date_precision",
        "start_year",
        "start_month",
        "start_date",
        "end_date_precision",
        "end_year",
        "end_month",
        "end_date",
      ]
    : ["institution", "degree", "field_of_study", "end_date"],
  certification: ["name", "issuer", "expires_at"],
  headline: ["headline"],
};

function usePayloadText(vocabulary: Vocabulary) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const label = useVocabularyLabel(vocabulary);
  const languageName = useLanguageName();
  return (item: ExtractedItem, override?: Record<string, string | boolean | null>) => {
    const p = { ...(item.payload as Record<string, unknown>), ...override };
    const s = (k: string) => (p[k] ? String(p[k]) : "");
    switch (item.kind) {
      case "skill":
        return label("skills", s("skill_id")) ?? s("label") ?? s("code");
      case "language":
        return [
          languageName(s("language_code")),
          p.level && p.level !== "unspecified"
            ? t(`enums.languageLevel.${s("level")}` as "enums.languageLevel.B2")
            : "",
        ]
          .filter(Boolean)
          .join(" · ");
      case "occupation":
        return label("occupations", s("occupation_id")) ?? s("label");
      case "experience":
        return [s("title"), s("employer_name"), displayReviewPeriod(p, locale, t("item.present"))]
          .filter(Boolean)
          .join(" · ");
      case "education":
        return [
          s("degree"),
          s("institution") || (STRUCTURED_PERIODS_ENABLED ? t("form.notSpecified") : ""),
          displayReviewPeriod(p, locale, t("item.present")),
        ]
          .filter(Boolean)
          .join(" · ");
      case "certification":
        return [s("name"), s("issuer")].filter(Boolean).join(" · ");
      default:
        return s("headline") || s("text") || "—";
    }
  };
}

function ItemCard({
  item,
  decision,
  onDecide,
  vocabulary,
}: {
  item: ExtractedItem;
  decision?: Decision;
  onDecide: (decision: Decision | undefined) => void;
  vocabulary: Vocabulary;
}) {
  const t = useTranslations("Profile.review");
  const tFields = useTranslations("Profile.fields");
  const text = usePayloadText(vocabulary);
  const [editing, setEditing] = useState(false);
  const fields = CORRECTABLE[item.kind] ?? [];
  const payload = item.payload as Record<string, unknown>;
  const [draft, setDraft] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f,
        f === "is_current" ? payload[f] === true : payload[f] ? String(payload[f]) : "",
      ]),
    ),
  );
  const repeated = Boolean(item.existing_object);
  const reviewed = item.review_status !== "pending";

  return (
    <li className={`grid gap-3 rounded-2xl border bg-card p-4 ${decision ? "opacity-90" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {t(`kinds.${item.kind}`)}
        </span>
        {repeated ? (
          <Badge variant="warning">
            <CopyIcon aria-hidden="true" />
            {t("alreadyInProfile")}
          </Badge>
        ) : null}
      </div>
      <p className="font-semibold">
        <bdi dir="auto">{text(item, decision?.corrected)}</bdi>
      </p>
      {item.confidence ? (
        <p className="text-xs text-muted-foreground">
          {t("review.confidence", { value: Math.round(Number(item.confidence) * 100) })}
        </p>
      ) : null}
      {item.evidence_snippet ? (
        <blockquote
          className="rounded-xl bg-muted px-3 py-2 text-sm text-subtle-foreground"
          dir="auto"
        >
          «{item.evidence_snippet}»
        </blockquote>
      ) : null}

      {reviewed ? (
        <p className="text-sm text-muted-foreground">{t(`reviewed.${item.review_status}`)}</p>
      ) : decision ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-success">
            {t(
              `decided.${decision.action}${decision.corrected ? "Corrected" : ""}` as "decided.confirm",
            )}
          </span>
          <Button size="sm" variant="ghost" onClick={() => onDecide(undefined)}>
            <Undo2Icon aria-hidden="true" />
            {t("undo")}
          </Button>
        </div>
      ) : editing ? (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onDecide({
              action: repeated ? "update_existing" : "correct",
              corrected: (STRUCTURED_PERIODS_ENABLED &&
              (item.kind === "experience" || item.kind === "education")
                ? prepareStructuredPeriodPayload(draft)
                : draft) as Record<string, string | boolean | null>,
            });
            setEditing(false);
          }}
        >
          {fields.map((field) => {
            const prefix = field.startsWith("start_")
              ? "start"
              : field.startsWith("end_")
                ? "end"
                : null;
            if (STRUCTURED_PERIODS_ENABLED && prefix) {
              const precision = draft[`${prefix}_date_precision`];
              if (field.endsWith("_date") && precision !== "day") return null;
              if (field.endsWith("_year") && !["year", "month"].includes(String(precision)))
                return null;
              if (field.endsWith("_month") && precision !== "month") return null;
              if (prefix === "end" && draft.is_current === true) return null;
            }
            const id = `${item.id}-${field}`;
            return (
              <div key={field} className="grid gap-1.5">
                <Label htmlFor={id}>{tFields(field as "title")}</Label>
                {field === "is_current" ? (
                  <input
                    id={id}
                    type="checkbox"
                    className="size-5 accent-[var(--action)]"
                    checked={draft.is_current === true}
                    onChange={(e) => setDraft((d) => ({ ...d, is_current: e.target.checked }))}
                  />
                ) : field.endsWith("_date_precision") ? (
                  <NativeSelect
                    id={id}
                    value={String(draft[field] || "unknown")}
                    onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                  >
                    {(["unknown", "year", "month", "day"] as const).map((precision) => (
                      <option key={precision} value={precision}>
                        {t(`datePrecision.${precision}`)}
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <Input
                    id={id}
                    dir={
                      field.endsWith("_date") || field.endsWith("_year") || field.endsWith("_month")
                        ? "ltr"
                        : "auto"
                    }
                    type={
                      field.endsWith("_date")
                        ? "date"
                        : field.endsWith("_year") || field.endsWith("_month")
                          ? "number"
                          : "text"
                    }
                    min={field.endsWith("_month") ? 1 : field.endsWith("_year") ? 1900 : undefined}
                    max={field.endsWith("_month") ? 12 : field.endsWith("_year") ? 2100 : undefined}
                    value={String(draft[field] ?? "")}
                    onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                  />
                )}
                {field === "source_period" ? (
                  <p className="text-xs text-muted-foreground">{t("form.periodHint")}</p>
                ) : null}
              </div>
            );
          })}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="sm">
              {t("keepCorrection")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {repeated ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDecide({ action: "update_existing" })}
              >
                {t("updateExisting")}
              </Button>
              {fields.length ? (
                <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                  <PencilIcon aria-hidden="true" />
                  {t("correct")}
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => onDecide({ action: "dismiss" })}>
                {t("keepMine")}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => onDecide({ action: "confirm" })}>
                <CheckIcon aria-hidden="true" />
                {t("confirm")}
              </Button>
              {fields.length ? (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  <PencilIcon aria-hidden="true" />
                  {t("correct")}
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => onDecide({ action: "dismiss" })}>
                <XIcon aria-hidden="true" />
                {t("dismiss")}
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

/** Every suggestion read from the CV is a draft until the person decides; nothing is merged before. */
export function ExtractionReview({
  resumeId,
  vocabulary,
}: {
  resumeId: string;
  vocabulary: Vocabulary;
}) {
  const t = useTranslations("Profile.review");
  const router = useRouter();
  const refresh = useRefreshProfile();
  const extraction = useCandidatesMeResumesExtractionRetrieve(resumeId);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [failure, setFailure] = useState<unknown>(null);
  const [pending, setPending] = useState(false);

  const items = useMemo(() => extraction.data?.items ?? [], [extraction.data]);
  const open = items.filter((i) => i.review_status === "pending");
  const decided = Object.keys(decisions).length;

  async function submit() {
    setPending(true);
    setFailure(null);
    try {
      const result = await candidatesMeResumesReviewCreate(resumeId, {
        decisions: Object.entries(decisions).map(([item, d]) => ({
          item,
          action: d.action,
          ...(d.corrected ? { corrected_payload: d.corrected } : {}),
        })),
      });
      toast.success(t("saved", { count: result.confirmed + result.corrected + result.updated }));
      setDecisions({});
      await refresh();
      if (decided >= open.length) router.push("/account/profile");
    } catch (error) {
      setFailure(error);
    } finally {
      setPending(false);
    }
  }

  if (extraction.isPending) return <Skeleton className="h-96" />;
  if (!extraction.data) return <FormAlert error={extraction.error} />;

  return (
    <div className="grid gap-6">
      <div className="grid gap-3 rounded-2xl bg-card p-6 shadow-float">
        <p>{t("intro")}</p>
        <div className="flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={open.length}
            aria-valuenow={decided}
            aria-label={t("progressLabel")}
          >
            <div
              className="h-full rounded-full bg-action transition-all"
              style={{ width: `${open.length ? (decided / open.length) * 100 : 100}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground tabular-nums">
            {t("progress", { done: decided, total: open.length })}
          </span>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-card p-6 text-muted-foreground shadow-card">{t("nothing")}</p>
      ) : null}
      <ul className="grid gap-3">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            decision={decisions[item.id]}
            vocabulary={vocabulary}
            onDecide={(decision) =>
              setDecisions((current) => {
                const next = { ...current };
                if (decision) next[item.id] = decision;
                else delete next[item.id];
                return next;
              })
            }
          />
        ))}
      </ul>
      <FormAlert error={failure} />
      <div className="sticky bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-float">
        <span className="text-sm">{t("partialNote")}</span>
        <div className="flex gap-2">
          <Link
            href="/account/profile/resumes"
            className={buttonVariants({ variant: "outline-inverse", size: "sm" })}
          >
            {t("later")}
          </Link>
          <Button
            variant="inverse"
            size="sm"
            disabled={!decided || pending}
            onClick={() => void submit()}
          >
            {pending ? t("saving") : t("save", { count: decided })}
          </Button>
        </div>
      </div>
    </div>
  );
}
