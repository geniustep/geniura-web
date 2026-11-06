"use client";

import { CheckIcon, ChevronLeftIcon, LockKeyholeIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ResendVerificationButton } from "@/features/account/account-actions";
import { FormAlert } from "@/features/auth/form-parts";
import { isApiError } from "@/lib/api/errors";
import { useAuthMeRetrieve } from "@/lib/api/generated/endpoints/me/me";
import {
  organizationsCreate,
  useOrganizationsList,
} from "@/lib/api/generated/endpoints/organizations/organizations";
import {
  organizationsJobsCreate,
  organizationsJobsRetrieve,
  organizationsJobsPartialUpdate,
  organizationsJobsAction,
} from "@/lib/api/generated/endpoints/jobs-organization/jobs-organization";
import { ContractTypeEnum, WorkModeEnum, type OrgJob } from "@/lib/api/generated/model";
import { useTaxonomyLocationsList } from "@/lib/api/generated/endpoints/taxonomy/taxonomy";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { vocabularyOptions, pickLabel } from "@/lib/jobs/labels";
import {
  blankDraft,
  EMPLOYER_DRAFT_KEY,
  EMPLOYER_DRAFT_PATH,
  parseDraft,
  payload,
  type EmployerDraft,
} from "./draft";

const subscribeHydration = () => () => {};
export function EmployerJourney() {
  const locale = useLocale();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  return hydrated ? <EmployerEditor key={locale} /> : <Skeleton className="h-96" />;
}
function EmployerEditor() {
  const t = useTranslations("EmployerDraft");
  const jobs = useTranslations("Jobs");
  const locale = useLocale();
  const router = useRouter();
  const locationQuery = useTaxonomyLocationsList(
    { limit: 100 },
    { query: { retry: false, staleTime: 300_000 } },
  );
  const vocabulary = {
    locations: Object.fromEntries(
      (locationQuery.data?.results ?? []).map((row) => [row.id, row.labels]),
    ),
  };
  const me = useAuthMeRetrieve({
    query: { retry: false, staleTime: 0, refetchOnWindowFocus: true },
  });
  const organizations = useOrganizationsList({
    query: { enabled: Boolean(me.data?.is_email_verified), retry: false },
  });
  const [draft, setDraft] = useState<EmployerDraft>(() => {
    try {
      return parseDraft(localStorage.getItem(EMPLOYER_DRAFT_KEY)) ?? blankDraft(locale);
    } catch {
      return blankDraft(locale);
    }
  });
  const [save, setSave] = useState<"saving" | "saved" | "failed">("saving");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [notice, setNotice] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState<OrgJob | null>(null);
  const [conflict, setConflict] = useState(false);
  const latest = useRef<EmployerDraft | null>(null);
  useEffect(() => {
    function changed(e: StorageEvent) {
      if (e.key === EMPLOYER_DRAFT_KEY) setConflict(true);
    }
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [locale]);
  useEffect(() => {
    if (!draft || conflict) return;
    latest.current = draft;
    const persist = () => {
      try {
        localStorage.setItem(EMPLOYER_DRAFT_KEY, JSON.stringify(latest.current));
        setSave("saved");
      } catch {
        setSave("failed");
      }
    };
    const timer = setTimeout(persist, 300);
    window.addEventListener("pagehide", persist);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", persist);
    };
  }, [draft, conflict]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (save !== "saved" || busy) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save, busy]);
  function checkpoint(next: EmployerDraft) {
    latest.current = next;
    setDraft(next);
    try {
      localStorage.setItem(EMPLOYER_DRAFT_KEY, JSON.stringify(next));
      setSave("saved");
    } catch {
      setSave("failed");
      throw new Error(t("storageFailed"));
    }
  }
  function update<K extends keyof EmployerDraft>(key: K, value: EmployerDraft[K]) {
    setDraft((d) => (d ? { ...d, [key]: value, updatedAt: Date.now() } : d));
    setSave("saving");
    setConsent(false);
    setNotice("");
  }
  function move(step: EmployerDraft["step"]) {
    if (!draft) return;
    setFailure(null);
    setNotice("");
    try {
      checkpoint({ ...draft, step, updatedAt: Date.now() });
    } catch {
      setNotice(t("storageFailed"));
    }
  }
  function preview() {
    if (!draft) return;
    try {
      payload(draft);
      move("review");
    } catch {
      setNotice(t("required"));
    }
  }
  function authenticate(kind: "login" | "register") {
    if (!draft) return;
    try {
      checkpoint({ ...draft, step: "account", updatedAt: Date.now() });
      router.push({
        pathname: kind === "login" ? "/login" : "/register",
        query: { next: EMPLOYER_DRAFT_PATH },
      });
    } catch {
      setNotice(t("storageFailed"));
    }
  }
  async function chooseOrganization() {
    if (!draft || !me.data || !me.data.is_email_verified || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    setNotice("");
    try {
      let orgId = draft.server?.userId === me.data.id ? draft.server.orgId : "";
      if (!orgId) {
        if (selectedOrg) {
          const org = organizations.data?.results.find((o) => o.id === selectedOrg);
          if (
            !org ||
            !["owner", "admin", "recruiter"].includes(org.my_role ?? "") ||
            org.status === "suspended"
          )
            throw new Error(t("notAllowed"));
          orgId = org.id;
        } else {
          if (!draft.companyName.trim()) {
            setNotice(t("companyRequired"));
            return;
          }
          const created = await organizationsCreate({
            legal_name: draft.companyName.trim(),
            contact_email: me.data.email,
          });
          orgId = created.id;
          await organizations.refetch();
        }
      }
      checkpoint({
        ...draft,
        server: {
          userId: me.data.id,
          orgId,
          ...(draft.server?.userId === me.data.id &&
          draft.server.orgId === orgId &&
          draft.server.jobId
            ? { jobId: draft.server.jobId }
            : {}),
        },
        step: "confirm",
        updatedAt: Date.now(),
      });
    } catch (error) {
      setFailure(error);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  async function submit() {
    if (!draft || !me.data?.is_email_verified || !consent || conflict || inFlight.current) return;
    const ref = draft.server;
    if (!ref || ref.userId !== me.data.id) return;
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    setNotice("");
    try {
      let job: OrgJob;
      if (ref.jobId) {
        job = await organizationsJobsRetrieve(ref.orgId, ref.jobId);
        if (job.status === "draft")
          job = await organizationsJobsPartialUpdate(ref.orgId, ref.jobId, payload(draft));
      } else {
        job = await organizationsJobsCreate(ref.orgId, payload(draft));
        checkpoint({ ...draft, server: { ...ref, jobId: job.id }, updatedAt: Date.now() });
      }
      if (job.status === "draft") {
        if (!job.allowed_actions.includes("submit")) throw new Error(t("notAllowed"));
        job = await organizationsJobsAction(ref.orgId, job.id, "submit");
      }
      if (job.status !== "submitted" && job.status !== "published")
        throw new Error(t("notSubmitted"));
      checkpoint({
        ...draft,
        server: { ...ref, jobId: job.id },
        step: "sent",
        updatedAt: Date.now(),
      });
      setSubmitted(job);
    } catch (error) {
      setFailure(error);
      if (isApiError(error) && error.status === 401) me.refetch();
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  async function checkRequest() {
    if (!draft?.server || draft.server.userId !== me.data?.id || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setFailure(null);
    try {
      const job = await organizationsJobsRetrieve(draft.server.orgId, draft.server.jobId!);
      if (job.status !== "submitted" && job.status !== "published")
        throw new Error(t("notSubmitted"));
      setSubmitted(job);
    } catch (e) {
      setFailure(e);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  if (!draft) return <Skeleton className="h-96" />;
  const orgs = organizations.data?.results ?? [];
  const owner = draft.server?.userId === me.data?.id;
  const ready = Boolean(me.data?.is_email_verified);
  const sessionFailed = me.isError && !(isApiError(me.error) && me.error.status === 401);
  const step = draft.step === "account" && me.data ? "organization" : draft.step;
  const locked = busy || conflict;
  const org = orgs.find((o) => o.id === draft.server?.orgId);
  const locations = vocabularyOptions(vocabulary?.locations ?? {}, locale);
  const location = pickLabel(vocabulary?.locations[draft.location], locale);
  const authGate =
    (!me.data || !ready || ((step === "confirm" || step === "sent") && !owner)) &&
    (step === "confirm" || step === "sent" || step === "organization");
  const account = step === "account" || authGate;
  const confirm = step === "confirm" && !account;
  const sent = step === "sent" && !account;
  const review = step === "review" || step === "organization" || account || confirm || sent;
  return (
    <div className="grid min-w-0 gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2">
          <Link href="/employers" className="text-sm text-action">
            {t("employers")}
          </Link>
          <h1 className="text-2xl font-semibold sm:text-3xl">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={`inline-flex min-h-11 items-center gap-2 text-sm ${save === "failed" ? "text-destructive" : "text-muted-foreground"}`}
        >
          <LockKeyholeIcon className="size-4" aria-hidden="true" />
          {t(save === "saved" ? "saved" : save === "saving" ? "saving" : "storageFailed")}
        </p>
      </header>
      {conflict ? (
        <div role="alert" className="grid gap-2 rounded-xl border p-4">
          <p>{t("otherTab")}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("reload")}
          </Button>
        </div>
      ) : null}
      <FormAlert error={failure} />
      {notice ? (
        <p role="alert" className="text-sm text-destructive">
          {notice}
        </p>
      ) : null}
      {!review ? (
        <form
          className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            preview();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="job-title">{t("jobTitle")}</Label>
            <Input
              id="job-title"
              value={draft.title}
              maxLength={160}
              required
              disabled={locked}
              onChange={(e) => update("title", e.target.value)}
              dir="auto"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="job-contract">{t("contract")}</Label>
              <NativeSelect
                id="job-contract"
                value={draft.contractType}
                required
                disabled={locked}
                onChange={(e) =>
                  update("contractType", e.target.value as EmployerDraft["contractType"])
                }
              >
                <option value="">{t("select")}</option>
                {Object.values(ContractTypeEnum).map((v) => (
                  <option key={v} value={v}>
                    {jobs(`contractType.${v}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-mode">{t("workMode")}</Label>
              <NativeSelect
                id="job-mode"
                value={draft.workMode}
                disabled={locked}
                onChange={(e) => update("workMode", e.target.value as EmployerDraft["workMode"])}
              >
                {Object.values(WorkModeEnum).map((v) => (
                  <option key={v} value={v}>
                    {jobs(`workMode.${v}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job-location">{t("location")}</Label>
            <NativeSelect
              id="job-location"
              value={draft.location}
              required={draft.workMode !== "remote"}
              disabled={locked || !locations.length}
              onChange={(e) => update("location", e.target.value)}
            >
              <option value="">{t("select")}</option>
              {locations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
            {!locations.length ? (
              <div className="grid gap-2">
                <p className="text-sm text-muted-foreground">{t("locationsUnavailable")}</p>
                <Button
                  variant="outline"
                  disabled={locationQuery.isFetching}
                  onClick={() => void locationQuery.refetch()}
                >
                  {t("retry")}
                </Button>
              </div>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job-description">{t("description")}</Label>
            <Textarea
              id="job-description"
              value={draft.description}
              required
              maxLength={10000}
              rows={7}
              disabled={locked}
              onChange={(e) => update("description", e.target.value)}
              dir="auto"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job-responsibilities">{t("responsibilities")}</Label>
            <Textarea
              id="job-responsibilities"
              value={draft.responsibilities}
              maxLength={5000}
              rows={3}
              disabled={locked}
              onChange={(e) => update("responsibilities", e.target.value)}
              dir="auto"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t("storageHint")}</p>
            <Button type="submit" disabled={locked}>
              {t("preview")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <article className="grid min-w-0 gap-5 rounded-2xl border bg-card p-5 sm:p-8">
            <p className="text-xs font-semibold text-muted-foreground">{t("previewLabel")}</p>
            <h2 className="text-2xl font-semibold break-words" dir="auto">
              {draft.title}
            </h2>
            <p className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {draft.contractType ? jobs(`contractType.${draft.contractType}`) : null}
              <span>{jobs(`workMode.${draft.workMode}`)}</span>
              {location ? <span>{location}</span> : null}
            </p>
            <p className="break-words whitespace-pre-wrap" dir="auto">
              {draft.description}
            </p>
            {draft.responsibilities ? (
              <div className="grid gap-2 border-t pt-4">
                <h3 className="font-semibold">{t("responsibilities")}</h3>
                <p className="break-words whitespace-pre-wrap" dir="auto">
                  {draft.responsibilities}
                </p>
              </div>
            ) : null}
            {!sent ? (
              <Button variant="outline" onClick={() => move("edit")} disabled={locked}>
                {t("edit")}
              </Button>
            ) : null}
          </article>
          <section
            className="grid min-w-0 gap-4 rounded-2xl border bg-card p-5"
            aria-label={t("nextStep")}
          >
            {step === "review" ? (
              <>
                <h2 className="text-lg font-semibold">{t("readyTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("readyBody")}</p>
                <Button
                  disabled={locked || save === "failed"}
                  onClick={() => move(me.data ? "organization" : "account")}
                >
                  {t("continue")}
                </Button>
              </>
            ) : null}
            {account ? (
              <>
                <h2 className="text-lg font-semibold">{t("accountTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("authSaved")}</p>
                {me.isPending ? (
                  <Skeleton className="h-20" />
                ) : sessionFailed ? (
                  <>
                    <FormAlert error={me.error} />
                    <Button variant="outline" onClick={() => void me.refetch()}>
                      {t("retry")}
                    </Button>
                  </>
                ) : !me.data ? (
                  <>
                    <Button
                      onClick={() => authenticate("login")}
                      disabled={locked || save === "failed"}
                    >
                      {t("login")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => authenticate("register")}
                      disabled={locked || save === "failed"}
                    >
                      {t("register")}
                    </Button>
                    <Link
                      href={{ pathname: "/forgot-password", query: { next: EMPLOYER_DRAFT_PATH } }}
                      className="inline-flex min-h-11 items-center text-sm text-action"
                    >
                      {t("forgot")}
                    </Link>
                  </>
                ) : !ready ? (
                  <>
                    <p className="text-sm">{t("verify")}</p>
                    <ResendVerificationButton />
                    <Button variant="outline" onClick={() => void me.refetch()}>
                      {t("verified")}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => move("organization")}>{t("organizationTitle")}</Button>
                )}
              </>
            ) : null}
            {step === "organization" && !account ? (
              <>
                <h2 className="text-lg font-semibold">{t("organizationTitle")}</h2>
                {organizations.isPending ? (
                  <Skeleton className="h-24" />
                ) : organizations.isError ? (
                  <>
                    <FormAlert error={organizations.error} />
                    <Button variant="outline" onClick={() => void organizations.refetch()}>
                      {t("retry")}
                    </Button>
                  </>
                ) : (
                  <>
                    {owner && draft.server ? (
                      <p dir="auto">{org?.legal_name ?? draft.companyName}</p>
                    ) : (
                      <>
                        <Label htmlFor="organization">{t("chooseOrganization")}</Label>
                        <NativeSelect
                          id="organization"
                          value={selectedOrg}
                          disabled={locked}
                          onChange={(e) => setSelectedOrg(e.target.value)}
                        >
                          <option value="">{t("newOrganization")}</option>
                          {orgs.map((o) => (
                            <option
                              key={o.id}
                              value={o.id}
                              disabled={
                                o.status === "suspended" ||
                                !["owner", "admin", "recruiter"].includes(o.my_role ?? "")
                              }
                            >
                              {o.legal_name}
                            </option>
                          ))}
                        </NativeSelect>
                        {!selectedOrg ? (
                          <>
                            <Label htmlFor="company-name">{t("companyName")}</Label>
                            <Input
                              id="company-name"
                              value={draft.companyName}
                              maxLength={200}
                              disabled={locked}
                              onChange={(e) => update("companyName", e.target.value)}
                              dir="auto"
                            />
                          </>
                        ) : null}
                      </>
                    )}
                    <Button
                      disabled={locked || save === "failed"}
                      onClick={() => void chooseOrganization()}
                    >
                      {busy ? t("working") : t("reviewRequest")}
                    </Button>
                  </>
                )}
              </>
            ) : null}
            {confirm ? (
              <>
                <h2 className="text-lg font-semibold">{t("confirmTitle")}</h2>
                <p className="font-medium" dir="auto">
                  {org?.legal_name ?? draft.companyName}
                </p>
                <p className="text-sm text-muted-foreground">{t("confirmBody")}</p>
                <label className="flex min-h-11 items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-5 shrink-0 accent-action"
                    checked={consent}
                    disabled={locked}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  {t("consent")}
                </label>
                <Button
                  disabled={locked || !consent || save === "failed"}
                  onClick={() => void submit()}
                >
                  {busy ? t("working") : t("submit")}
                </Button>
              </>
            ) : null}
            {sent ? (
              <>
                <CheckIcon className="size-7 text-success" aria-hidden="true" />
                <Link
                  href="/account/employer"
                  className="inline-flex min-h-11 items-center font-semibold text-action"
                >
                  {t("workspace")}
                </Link>
                <Button
                  variant="outline"
                  disabled={busy || conflict}
                  onClick={() => {
                    try {
                      checkpoint(blankDraft(locale));
                      setSubmitted(null);
                      setConsent(false);
                      setSelectedOrg("");
                      setFailure(null);
                      setNotice("");
                    } catch {
                      setNotice(t("storageFailed"));
                    }
                  }}
                >
                  {t("start")}
                </Button>
                <h2 className="text-lg font-semibold">
                  {submitted ? t("sentTitle") : t("savedRequestTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {submitted ? t("sentBody") : t("checkRequestBody")}
                </p>
                {submitted ? (
                  <>
                    <p className="text-sm">
                      {t("statusLabel")}{" "}
                      {t(submitted.status === "published" ? "published" : "submitted")}
                    </p>
                    <p className="text-xs break-all text-muted-foreground">
                      {t("reference")} {submitted.id}
                    </p>
                  </>
                ) : (
                  <Button variant="outline" disabled={busy} onClick={() => void checkRequest()}>
                    {t("checkRequest")}
                  </Button>
                )}
              </>
            ) : null}
          </section>
        </div>
      )}
      <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-action">
        <ChevronLeftIcon className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("home")}
      </Link>
    </div>
  );
}
