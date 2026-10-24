"use client";

import { CheckIcon, CopyIcon, PencilIcon, Undo2Icon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PartialDateField } from "./partial-date-field";
import { canPreserveSelectedDay, datePrecision, formatProfessionalDate, toApiPartialDate, validPartialDate, validProfessionalRange, type PartialDatePrecision } from "./partial-date";
import { useLanguageName, useVocabularyLabel } from "./labels";

type Decision = { action: ActionEnum; corrected?: Record<string, string> };

/** Text fields a person may correct per kind (identity fields such as a skill id are not free text). */
const CORRECTABLE: Record<string, string[]> = {
  experience: ["title", "employer_name", "start_date", "end_date"],
  education: ["institution", "degree", "field_of_study", "end_date"],
  certification: ["name", "issuer", "expires_at"],
  headline: ["headline"],
};

function usePayloadText(vocabulary: Vocabulary) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const label = useVocabularyLabel(vocabulary);
  const languageName = useLanguageName();
  return (item: ExtractedItem, override?: Record<string, string>) => {
    const p = { ...(item.payload as Record<string, unknown>), ...override };
    const s = (k: string) => (p[k] ? String(p[k]) : "");
    const date = (k: string) => formatProfessionalDate(p[k], p[k + "_precision"], locale) ?? "";
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
        return [
          s("title"),
          s("employer_name"),
          [date("start_date"), s("is_current") === "true" ? t("item.present") : date("end_date")]
            .filter(Boolean)
            .join(" – "),
        ]
          .filter(Boolean)
          .join(" · ");
      case "education":
        return [s("degree"), s("institution"), date("end_date")].filter(Boolean).join(" · ");
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
  const tDate = useTranslations("Profile.partialDate");
  const text = usePayloadText(vocabulary);
  const [editing, setEditing] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [chosenPrecision, setChosenPrecision] = useState<Record<string, PartialDatePrecision>>({});
  const fields = CORRECTABLE[item.kind] ?? [];
  const payload = item.payload as Record<string, unknown>;
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f, payload[f] ? String(payload[f]) : ""])),
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
            const bad = fields.filter((field) => field.endsWith("_date") && !validPartialDate(draft[field] ?? ""));
            if (bad.length) {
              setDateError(tDate("invalid"));
              return;
            }
            const unsupportedFirstDay = fields.some((field) => field.endsWith("_date") &&
              !canPreserveSelectedDay(draft[field] ?? "", chosenPrecision[field] ??
                datePrecision(draft[field], payload[field + "_precision"])));
            if (unsupportedFirstDay) {
              setDateError(tDate("firstDayUnsupported"));
              return;
            }
            if (!validProfessionalRange(draft.start_date ?? "", draft.end_date ?? "")) {
              setDateError(tDate("rangeInvalid"));
              return;
            }
            setDateError(null);
            const corrected = Object.fromEntries(Object.entries(draft).map(([field, value]) =>
              [field, field.endsWith("_date") ? toApiPartialDate(value) ?? "" : value],
            ));
            onDecide({ action: repeated ? "update_existing" : "correct", corrected });
            setEditing(false);
          }}
        >
          {fields.map((field) => (
            <div key={field} className="grid gap-1.5">
              <Label htmlFor={`${item.id}-${field}`}>{tFields(field as "title")}</Label>
              {field.endsWith("_date") && (item.kind === "experience" || item.kind === "education") ? (
                <PartialDateField
                  id={item.id + "-" + field}
                  value={draft[field] ?? ""}
                  precision={payload[field + "_precision"]}
                  onPrecisionChange={(next) => setChosenPrecision((old) => ({ ...old, [field]: next }))}
                  disabled={false}
                  invalid={Boolean(dateError)}
                  onChange={(value) => { setDateError(null); setDraft((d) => ({ ...d, [field]: value })); }}
                />
              ) : (
                <Input
                  id={item.id + "-" + field}
                  dir={field.endsWith("_date") || field.endsWith("_at") ? "ltr" : "auto"}
                  type={field.endsWith("_date") || field.endsWith("_at") ? "date" : "text"}
                  value={draft[field] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                />
              )}
            </div>
          ))}
          {dateError ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{dateError}</p> : null}
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
