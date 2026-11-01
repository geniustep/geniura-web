"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/features/auth/form-parts";
import { SkillPicker } from "@/features/profile/skill-picker";
import { LANGUAGE_CODES } from "@/features/profile/sections";
import { NativeSelect } from "@/components/ui/native-select";
import { authMeRetrieve } from "@/lib/api/generated/endpoints/me/me";
import {
  OnboardingGuestCvWorkspaceRetrieveResponse,
  OnboardingGuestCvWorkspacePartialUpdateResponse,
} from "@/lib/api/generated/zod/guest-onboarding/guest-onboarding.zod";
import { clearCsrfToken } from "@/lib/api/fetcher";
import { isApiError } from "@/lib/api/errors";
import {
  authLoginCreate,
  authPasswordResetRequestCreate,
} from "@/lib/api/generated/endpoints/auth/auth";
import {
  onboardingGuestCvWorkspaceRetrieve,
  onboardingGuestCvWorkspacePartialUpdate,
  onboardingGuestCvRegistrationCreate,
  onboardingGuestCvCompleteCreate,
} from "@/lib/api/generated/endpoints/guest-onboarding/guest-onboarding";
import type { WorkspaceState, WorkspaceItemKindEnum } from "@/lib/api/generated/model";
import {
  claimGuestDraft,
  deleteGuestDraft,
  sendGuestCode,
  verifyGuestCode,
} from "@/lib/api/guest-cv";
import { useRouter } from "@/lib/i18n/navigation";

const fields: Record<WorkspaceItemKindEnum, string[]> = {
  headline: ["headline"],
  experience: ["title", "employer_name", "source_period", "description"],
  education: ["institution", "degree", "field_of_study", "source_period"],
  language: ["language_code", "level"],
  skill: ["skill_id"],
  occupation: [],
  certification: ["name", "issuer", "issued_at", "expires_at"],
};
const emptyVocabulary = { locations: {}, occupations: {}, sectors: {}, skills: {} };
const languageLevels = ["unspecified", "A1", "A2", "B1", "B2", "C1", "C2", "native"];

export function GuestWorkspace({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations("GuestWorkspace");
  const profile = useTranslations("Profile");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["guest-workspace"],
    queryFn: async () =>
      OnboardingGuestCvWorkspaceRetrieveResponse.parse(await onboardingGuestCvWorkspaceRetrieve()),
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const [edited, setEdited] = useState<WorkspaceState>();
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [activeSection, setActiveSection] = useState<string>("identity");
  const [phase, setPhase] = useState<"edit" | "finish">("edit");
  const [mode, setMode] = useState<"register" | "login">("register");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(signedIn);
  const [loginEmail, setLoginEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [existing, setExisting] = useState(false);
  const [proofVerified, setProofVerified] = useState(false);
  const data = edited ?? query.data;
  function update(next: WorkspaceState) {
    setEdited(next);
    setDirty(true);
    setNotice("");
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!data) throw new Error(t("loadError"));
    if (!dirty) return data;
    const saved = OnboardingGuestCvWorkspacePartialUpdateResponse.parse(
      await onboardingGuestCvWorkspacePartialUpdate({
        revision: data.revision,
        identity: data.identity,
        items: data.items,
      }),
    );
    setEdited(saved);
    setDirty(false);
    setNotice(t("saved"));
    return saved;
  }
  function setPayload(index: number, key: string, value: unknown) {
    if (!data) return;
    update({
      ...data,
      items: data.items.map((item, i) =>
        i === index ? { ...item, payload: { ...item.payload, [key]: value } } : item,
      ),
    });
  }
  const label = (key: string) =>
    key === "skill_id" ? profile("fields.skill") : profile(`fields.${key}` as "fields.name");
  if (query.isPending) return <p role="status">{t("loading")}</p>;
  if (!data)
    return (
      <div className="grid gap-4">
        <FormAlert error={query.error} />
        <Button onClick={() => query.refetch()}>{t("retry")}</Button>
      </div>
    );
  const authenticated = signedIn || loggedIn;
  return (
    <div
      data-guest-workspace
      className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]"
      aria-busy={busy}
    >
      <header className="grid gap-1 lg:col-span-2">
        <h1 className="text-2xl font-semibold [overflow-wrap:anywhere]">
          {data.identity.name.trim()
            ? t("welcomeName", { name: data.identity.name.trim() })
            : t("welcome")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(phase === "edit" ? "editHint" : "finishHint")}
        </p>
      </header>
      <div className="empty:hidden lg:col-span-2">
        <FormAlert error={error} />
      </div>
      {isApiError(error) && error.code === "draft_conflict" ? (
        <p role="alert" className="lg:col-span-2">
          {t("conflict")}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="flex items-center gap-2 text-sm text-success lg:col-span-2">
          <CheckIcon className="size-4" aria-hidden="true" />
          {notice}
        </p>
      ) : null}
      {phase === "edit" ? (
        <nav
          aria-label={t("sectionsLabel")}
          className="flex gap-2 overflow-x-auto pb-1 lg:row-span-3 lg:flex-col lg:self-start lg:overflow-visible"
        >
          {[
            "identity",
            ...Object.keys(fields).filter(
              (kind) => kind !== "occupation" || data.items.some((item) => item.kind === kind),
            ),
            ...(!authenticated ? ["account"] : []),
          ].map((section) => {
            const title =
              section === "identity"
                ? t("identity")
                : section === "account"
                  ? t("accountSection")
                  : t(`kinds.${section}` as "kinds.experience");
            const count = data.items.filter((item) => item.kind === section).length;
            return (
              <button
                key={section}
                type="button"
                aria-pressed={activeSection === section}
                aria-controls="draft-section-panel"
                onClick={() => setActiveSection(section)}
                className={`flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-2 text-start text-sm font-medium transition-colors lg:w-full ${activeSection === section ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
              >
                <span>{title}</span>
                {section !== "identity" && section !== "account" ? (
                  <span className="text-xs opacity-75">{count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      ) : null}
      <div
        id="draft-section-panel"
        className={`min-w-0 ${phase === "finish" ? "lg:col-span-2" : ""}`}
      >
        {phase === "edit" ? (
          <>
            {activeSection === "identity" ? (
              <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
                <h3 className="font-semibold sm:col-span-2">{t("identity")}</h3>
                {(["name", "email", "phone"] as const).map((key) => (
                  <div className={`grid gap-2 ${key === "name" ? "sm:col-span-2" : ""}`} key={key}>
                    <label htmlFor={`draft-${key}`} className="text-sm font-medium">
                      {t(key)}
                    </label>
                    <Input
                      id={`draft-${key}`}
                      type={key === "email" ? "email" : "text"}
                      dir={key === "name" ? "auto" : "ltr"}
                      value={data.identity[key]}
                      maxLength={key === "name" ? 150 : key === "phone" ? 50 : 254}
                      disabled={busy}
                      onChange={(event) =>
                        update({
                          ...data,
                          identity: { ...data.identity, [key]: event.target.value },
                          registration_prepared:
                            key === "email" ? false : data.registration_prepared,
                        })
                      }
                    />
                  </div>
                ))}
              </section>
            ) : null}
            {Object.keys(fields)
              .filter((kind) => kind === activeSection)
              .map((kind) => {
                const entries = data.items
                  .map((item, index) => ({ item, index }))
                  .filter(({ item }) => item.kind === kind);
                if (kind === "occupation" && !entries.length) return null;
                return (
                  <section key={kind} className="rounded-2xl border bg-card p-5 sm:p-6">
                    <h3 className="font-semibold">
                      {t(`kinds.${kind}` as "kinds.experience")}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({entries.length})
                      </span>
                    </h3>
                    <div className="mt-4 grid gap-5">
                      {entries.map(({ item, index }) => (
                        <fieldset key={index} disabled={busy} className="grid gap-4 border-t pt-5">
                          <legend className="sr-only">
                            {t(`kinds.${kind}` as "kinds.experience")} {index + 1}
                          </legend>
                          {kind === "occupation" ? (
                            <p dir="auto">{String(item.payload.label ?? "")}</p>
                          ) : null}
                          {fields[item.kind].map((key) => (
                            <div key={key} className="grid gap-2">
                              <label
                                htmlFor={`item-${index}-${key}`}
                                className="text-sm font-medium"
                              >
                                {label(key)}
                              </label>
                              {key === "skill_id" ? (
                                <>
                                  {item.payload.label ? (
                                    <p className="text-sm text-muted-foreground" dir="auto">
                                      {String(item.payload.label)}
                                    </p>
                                  ) : null}
                                  <SkillPicker
                                    id={`item-${index}-${key}`}
                                    value={String(item.payload.skill_id ?? "")}
                                    onChange={(id) => setPayload(index, key, id)}
                                    disabled={busy}
                                    invalid={false}
                                    vocabulary={emptyVocabulary}
                                  />
                                </>
                              ) : key === "language_code" ||
                                (key === "level" && kind === "language") ? (
                                <NativeSelect
                                  id={`item-${index}-${key}`}
                                  value={String(
                                    item.payload[key] ?? (key === "level" ? "unspecified" : ""),
                                  )}
                                  onChange={(e) => setPayload(index, key, e.target.value)}
                                >
                                  <option value="">{profile("form.notSpecified")}</option>
                                  {(key === "language_code" ? LANGUAGE_CODES : languageLevels).map(
                                    (value) => (
                                      <option key={value} value={value}>
                                        {key === "level"
                                          ? profile(
                                              `enums.languageLevel.${value}` as "enums.languageLevel.B2",
                                            )
                                          : value}
                                      </option>
                                    ),
                                  )}
                                </NativeSelect>
                              ) : key === "description" ? (
                                <Textarea
                                  id={`item-${index}-${key}`}
                                  dir="auto"
                                  value={String(item.payload[key] ?? "")}
                                  maxLength={5000}
                                  onChange={(e) => setPayload(index, key, e.target.value)}
                                />
                              ) : (
                                <Input
                                  id={`item-${index}-${key}`}
                                  dir="auto"
                                  type={key.endsWith("_at") ? "date" : "text"}
                                  value={String(item.payload[key] ?? "")}
                                  maxLength={1000}
                                  onChange={(e) => setPayload(index, key, e.target.value)}
                                />
                              )}
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            className="justify-self-end text-muted-foreground"
                            onClick={() =>
                              update({ ...data, items: data.items.filter((_, i) => i !== index) })
                            }
                          >
                            <Trash2Icon aria-hidden="true" />
                            {t("remove")}
                          </Button>
                        </fieldset>
                      ))}
                      {kind !== "occupation" ? (
                        <Button
                          variant="outline"
                          className="justify-self-start rounded-xl"
                          disabled={busy}
                          onClick={() =>
                            update({
                              ...data,
                              items: [
                                ...data.items,
                                {
                                  kind: kind as WorkspaceItemKindEnum,
                                  payload: {},
                                  source_index: null,
                                },
                              ],
                            })
                          }
                        >
                          <PlusIcon aria-hidden="true" />
                          {t("add")}
                        </Button>
                      ) : null}
                    </div>
                  </section>
                );
              })}
          </>
        ) : null}
        {!authenticated &&
        ((phase === "edit" && activeSection === "account") ||
          (phase === "finish" && (existing || !data.registration_prepared))) ? (
          <section className="grid gap-4 rounded-2xl border bg-secondary/40 p-5 sm:p-7">
            <h3 className="text-lg font-semibold">
              {t(mode === "register" && !existing ? "accountTitle" : "loginTitle")}
            </h3>
            {data.registration_prepared && mode === "register" && !existing ? (
              <p role="status">{t("prepared")}</p>
            ) : (
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    await save();
                    if (mode === "login" || existing) {
                      const user = await authLoginCreate({ email: data.identity.email, password });
                      setLoggedIn(true);
                      if (phase === "edit") setActiveSection("identity");
                      setLoginEmail(user.email);
                      setPassword("");
                      setExisting(false);
                      setNotice(t("signedIn"));
                      if (
                        phase === "finish" &&
                        existing &&
                        proofVerified &&
                        user.email === data.identity.email
                      ) {
                        const result = await claimGuestDraft();
                        router.push(`/account/profile/resumes/${result.resume_id}/review`);
                      }
                      await queryClient.invalidateQueries({ queryKey: ["/api/v1/auth/me"] });
                    } else {
                      await onboardingGuestCvRegistrationCreate({
                        email: data.identity.email,
                        password,
                        locale: locale as "ar" | "fr" | "en" | "es",
                      });
                      setPassword("");
                      setEdited((prev) => ({ ...(prev ?? data), registration_prepared: true }));
                      setNotice(t("prepared"));
                    }
                  });
                }}
              >
                <div className="grid gap-2">
                  <label htmlFor="account-email" className="text-sm">
                    {t("email")}
                  </label>
                  <Input
                    id="account-email"
                    type="email"
                    dir="ltr"
                    required
                    value={data.identity.email}
                    disabled={busy || sent}
                    onChange={(e) =>
                      update({
                        ...data,
                        identity: { ...data.identity, email: e.target.value },
                        registration_prepared: false,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="account-password" className="text-sm">
                    {t("password")}
                  </label>
                  <Input
                    id="account-password"
                    type="password"
                    autoComplete={
                      mode === "register" && !existing ? "new-password" : "current-password"
                    }
                    required
                    maxLength={128}
                    value={password}
                    disabled={busy}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="action"
                  className="h-auto min-h-12 rounded-xl py-3 whitespace-normal"
                  disabled={busy}
                >
                  {t(mode === "register" && !existing ? "create" : "login")}
                </Button>
              </form>
            )}
            {!existing ? (
              <Button
                variant="link"
                disabled={busy}
                onClick={() => {
                  setMode(mode === "register" ? "login" : "register");
                  setPassword("");
                }}
              >
                {t(mode === "register" ? "haveAccount" : "needAccount")}
              </Button>
            ) : null}
            {mode === "login" || existing ? (
              <Button
                variant="link"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await save();
                    await authPasswordResetRequestCreate({ email: data.identity.email });
                    setNotice(t("resetSent"));
                  })
                }
              >
                {t("forgot")}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">{t("optional")}</p>
            )}
          </section>
        ) : null}
        {phase === "finish" && !existing && (authenticated || data.registration_prepared) ? (
          <form
            className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-7"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                if (!sent) {
                  const accountEmail = authenticated
                    ? loginEmail || (await authMeRetrieve()).email
                    : data.identity.email;
                  setLoginEmail(authenticated ? accountEmail : "");
                  await sendGuestCode(accountEmail, locale);
                  setSent(true);
                  return;
                }
                const proof = await verifyGuestCode(code);
                setProofVerified(true);
                if (proof.account_exists && !authenticated) {
                  setExisting(true);
                  setMode("login");
                  setSent(false);
                  return;
                }
                const result = authenticated
                  ? await claimGuestDraft()
                  : await onboardingGuestCvCompleteCreate();
                clearCsrfToken();
                await queryClient.invalidateQueries({ queryKey: ["/api/v1/auth/me"] });
                router.push(`/account/profile/resumes/${result.resume_id}/review`);
              });
            }}
          >
            <p className="text-sm text-muted-foreground">
              {t("confirmTo")} <bdi>{loginEmail || data.identity.email}</bdi>
            </p>
            {sent ? (
              <div className="grid gap-2">
                <label htmlFor="activation-code">{t("code")}</label>
                <Input
                  id="activation-code"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            ) : null}
            <Button
              type="submit"
              variant="action"
              className="h-auto min-h-12 rounded-xl py-3 whitespace-normal"
              disabled={busy}
            >
              {t(sent ? "activate" : "sendCode")}
            </Button>
          </form>
        ) : null}
      </div>
      <details
        className={`text-sm text-muted-foreground ${phase === "edit" ? "lg:col-start-2" : "lg:col-span-2"}`}
      >
        <summary className="inline-flex min-h-11 cursor-pointer items-center">
          {t("options")}
        </summary>
        <Button
          variant="link"
          className="justify-self-start text-muted-foreground"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              await deleteGuestDraft();
              queryClient.removeQueries({ queryKey: ["guest-workspace"] });
              await queryClient.invalidateQueries({ queryKey: ["guest-cv"] });
            })
          }
        >
          {t("delete")}
        </Button>
      </details>
      <div
        className={`sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-card ${phase === "edit" ? "lg:col-start-2" : "lg:col-span-2"}`}
      >
        {phase === "edit" ? (
          <>
            <Button
              variant="outline"
              disabled={busy || !dirty}
              onClick={() =>
                void run(async () => {
                  await save();
                })
              }
            >
              {t("save")}
            </Button>
            <Button
              variant="action"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await save();
                  setPhase("finish");
                  setNotice("");
                })
              }
            >
              {t("finish")}
            </Button>
            <p className="w-full text-xs text-muted-foreground">
              {t(dirty ? "unsaved" : "draftExpiry")}
            </p>
          </>
        ) : (
          <Button
            variant="link"
            disabled={busy}
            onClick={() => {
              setPhase("edit");
              setExisting(false);
              setSent(false);
              setCode("");
            }}
          >
            {t("backEdit")}
          </Button>
        )}
      </div>
    </div>
  );
}
