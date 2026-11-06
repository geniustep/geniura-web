// Local-only synthetic API fixture. Never imported by the application.
import { createServer } from "node:http";
const me = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "candidate@example.test",
  full_name: "أمينة",
  signup_intent: "candidate",
  preferred_locale: "ar",
  time_zone: "Africa/Casablanca",
  is_email_verified: true,
  date_joined: "2026-11-01T00:00:00Z",
  staff_roles: [],
  memberships: [],
};
const id = "00000000-0000-4000-8000-000000000002";
const reviewed = new Set();
const employerOrgs = new Map();
const employerJobs = new Map();
createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const session = (req.headers.cookie ?? "").match(/geniura_sid=([^;]+)/)?.[1];
  const state = session?.split("__")[0];
  const done = reviewed.has(session);
  const send = (status, data) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  if (url.pathname === "/api/v1/auth/csrf") return send(200, { csrf_token: "a".repeat(64) });
  if (url.pathname === "/api/v1/auth/login") {
    res.setHeader("Set-Cookie", "geniura_sid=complete; Path=/; HttpOnly; SameSite=Lax");
    return send(200, me);
  }
  if (url.pathname === "/api/v1/auth/register") return send(202, { detail: "Check your email" });
  if (url.pathname === "/api/v1/auth/email/resend") return send(202, { detail: "Sent" });
  if (url.pathname === "/api/v1/organizations/") {
    if (!session) return send(401, { code: "not_authenticated" });
    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const org = {
          ...JSON.parse(body),
          id: "org-" + session,
          status: "pending",
          my_role: "owner",
        };
        employerOrgs.set(session, org);
        send(201, org);
      });
      return;
    }
    const org = employerOrgs.get(session);
    return send(200, { count: org ? 1 : 0, next: null, previous: null, results: org ? [org] : [] });
  }
  if (/^\/api\/v1\/organizations\/[^/]+\/jobs(?:\/[^/]+)?(?:\/submit)?$/.test(url.pathname)) {
    if (!session) return send(401, { code: "not_authenticated" });
    const existing = employerJobs.get(session);
    if (url.pathname.endsWith("/submit")) {
      if (state === "submit-failure") return send(503, { code: "unavailable" });
      const job = {
        ...existing,
        status: "submitted",
        allowed_actions: [],
        submitted_at: "2026-11-06T00:00:00Z",
      };
      employerJobs.set(session, job);
      return send(200, job);
    }
    if (req.method === "POST" || req.method === "PATCH") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        const job = {
          ...existing,
          ...JSON.parse(body),
          id: "job-" + session,
          status: "draft",
          allowed_actions: ["submit"],
          revision: 1,
        };
        employerJobs.set(session, job);
        send(req.method === "POST" ? 201 : 200, job);
      });
      return;
    }
    return existing ? send(200, existing) : send(404, { code: "not_found" });
  }
  if (url.pathname === "/api/v1/auth/me")
    return send(
      state ? 200 : 401,
      state ? { ...me, is_email_verified: state !== "unverified" } : { code: "not_authenticated" },
    );
  if (url.pathname === "/api/v1/onboarding/guest-cv")
    return state === "draft"
      ? send(200, {
          status: "ready",
          expires_at: "2099-01-01T00:00:00Z",
          identity: { name: "Synthetic" },
          email_verified: false,
          claimed: false,
        })
      : send(404, { code: "not_found" });
  if (url.pathname === "/api/v1/candidates/me")
    return state === "outage"
      ? send(503, { code: "unavailable" })
      : send(200, {
          id,
          headline: state === "new" ? "" : "مطورة برمجيات",
          visibility: "private",
          city: null,
          availability: "immediate",
          summary: "",
          willing_to_relocate: false,
          profile_updated_at: "2026-11-01T00:00:00Z",
          completeness: {
            has_headline: state !== "new",
            has_city: false,
            has_skills: true,
            has_experience: true,
            has_languages: true,
            has_resume: state === "review",
            has_shareable_resume: false,
          },
        });
  if (
    /^\/api\/v1\/candidates\/me\/(educations|experiences|skills|languages|certifications)$/.test(
      url.pathname,
    )
  ) {
    const kind = url.pathname.split("/").at(-1);
    const rows =
      kind === "educations"
        ? [
            {
              id: "education-1",
              degree: "Licence en droit privé – 3e année suivie",
              institution: "",
              level: "bac_plus_3",
              source: "extracted",
              updated_at: "2026-11-01T00:00:00Z",
            },
            {
              id: "education-2",
              degree: "Baccalauréat – 2014",
              institution: "",
              level: "baccalaureate",
              source: "extracted",
              updated_at: "2026-11-01T00:00:00Z",
            },
          ]
        : [];
    return send(200, { count: rows.length, next: null, previous: null, results: rows });
  }
  if (url.pathname === "/api/v1/candidates/me/resumes")
    return send(
      200,
      state === "review"
        ? [
            {
              id,
              status: done ? "reviewed" : "review_required",
              created_at: "2026-11-01T00:00:00Z",
              display_name: "synthetic.pdf",
            },
          ]
        : [],
    );
  if (url.pathname === `/api/v1/candidates/me/resumes/${id}/review` && req.method === "POST") {
    req.resume();
    reviewed.add(session);
    return send(200, { confirmed: 2, corrected: 0, dismissed: 0, updated: 0 });
  }
  if (url.pathname === `/api/v1/candidates/me/resumes/${id}/extraction`)
    return send(200, {
      resume_id: id,
      resume_status: done ? "reviewed" : "review_required",
      display_status: "",
      status: "ready",
      parser: "synthetic-test",
      error_code: "",
      items: [
        {
          id: "experience-item",
          kind: "experience",
          payload: { title: "Synthetic role", employer_name: "Synthetic employer" },
          confidence: "0.8",
          evidence_snippet: "",
          review_status: done ? "confirmed" : "pending",
          existing_object: null,
          applied_object_id: null,
          applied_object_type: "",
          reviewed_at: null,
        },
        {
          id: "language-item",
          kind: "language",
          payload: { language_code: "fr", level: "B2" },
          confidence: "0.8",
          evidence_snippet: "",
          review_status: done ? "confirmed" : "pending",
          existing_object: null,
          applied_object_id: null,
          applied_object_type: "",
          reviewed_at: null,
        },
        {
          id: "skill-item",
          kind: "skill",
          payload: { label: "Synthetic skill" },
          confidence: "0.8",
          evidence_snippet: "",
          review_status: "confirmed",
          existing_object: null,
          applied_object_id: "saved-skill",
          applied_object_type: "skill",
          reviewed_at: null,
        },
      ],
    });
  if (url.pathname === "/api/v1/candidates/me/applications") {
    if (state === "outage") return send(503, { code: "unavailable" });
    const page = url.searchParams.get("page");
    return send(200, {
      count: state === "complete" ? 2 : 0,
      next:
        state === "complete" && !page
          ? "http://localhost:3104/api/v1/candidates/me/applications?page=2"
          : null,
      previous: null,
      results:
        state === "complete"
          ? [
              {
                id: page ? "application-2" : "application-1",
                job: {
                  id,
                  title: page ? "وظيفة اختبار ثانية" : "وظيفة اختبار",
                  organization_name: "مؤسسة اختبار",
                  status: "published",
                },
                status: page ? "submitted" : "interview",
                submitted_at: "2026-11-01T00:00:00Z",
              },
            ]
          : [],
    });
  }
  if (url.pathname.startsWith("/api/v1/taxonomy/"))
    return send(200, { count: 0, results: [], locale: "ar" });
  return send(404, { code: "not_found" });
}).listen(Number(process.env.CANDIDATE_FIXTURE_PORT ?? 3104), "127.0.0.1");
