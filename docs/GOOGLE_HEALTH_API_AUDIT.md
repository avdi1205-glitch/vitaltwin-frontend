# Google Health API — Audit (Phase 1)

Status: **2026-08-02**. This document is the mandatory Phase-1 audit written
before the production-grade rewrite of the Google Health integration, per
the founder's 27-section specification ("AUFGABE: Produktionsreife Google
Health API Integration für VitalTwin implementieren"). It documents the
existing stack, the architectural decisions made for this rewrite, and every
external blocker that still exists.

## 1. Existing auth stack (verified, untouched)

- Custom email/password auth: `vt_users` table, bcrypt password hashes.
- Session tokens: stateless JWT (PyJWT, HS256, 30-day expiry), issued/verified
  in `backend/app/routers/users.py`. `JWT_SECRET_KEY` env var.
- `backend/app/core/auth.py` provides `require_email` (returns the email
  string) and `require_user` (returns a `CurrentUser(email, user_id)`,
  `user_id` = stable `vt_users.id`). Every new Google Health table/endpoint
  in this rewrite uses `require_user`/`user_id`, **not** `require_email`, so
  ownership can be enforced against a real numeric id instead of an email
  string.
- Google Sign-In (separate from Google Health): frontend uses Google
  Identity Services `renderButton()`; backend verifies the `id_token` via
  `https://oauth2.googleapis.com/tokeninfo` in
  `routers/users.py::_verify_google_credential`, checks `aud ===
  GOOGLE_CLIENT_ID`, then issues the same internal JWT as email/password
  login. **Nothing in this Google Health rewrite reads, calls, or modifies
  this flow.** Google Health uses its own, separate OAuth client (its own
  Client ID/Secret registered in Google Cloud Console), separate scopes
  (`googlehealth.*` data scopes, not identity scopes), and a completely
  separate purpose (requesting *offline access to health data*, not proving
  who the user is).
- Admin RBAC (`core/admin_rbac.py`) is unrelated and not touched.

## 2. Project structure decision

The spec suggests an optional layered structure
(`app/api/routes/`, `app/services/health/*.py`, `app/repositories/*.py`,
`app/models/*.py`, `app/schemas/health.py`), explicitly qualified with "nur
falls keine passende Struktur existiert" (only if no fitting structure
exists).

**Decision: kept the existing flat convention** — every other feature in
this codebase lives in `app/routers/*.py` (thin HTTP layer) + `app/core/*.py`
(business logic, DB access, external API calls), with no separate
`services/`/`repositories/`/`models/`/`schemas/` layers anywhere else in the
project (CGM/nutrition, Stripe billing, Founder OS's 10 submodules, twin
memory, etc. — all follow this same two-layer pattern). Introducing a
different layered architecture for just this one feature would make the
codebase *less* consistent, not more maintainable, and a fitting structure
clearly already exists. The rewrite splits Google Health's logic across
several `app/core/health_*.py` modules (encryption, OAuth, token refresh,
API client, normalization, sync orchestration, connections repository)
instead of one large file — this keeps each module small/testable while
staying inside the existing flat convention.

## 3. Primary key convention decision

The spec's schema section (7.1–7.4) illustrates tables with UUID primary
keys. **Decision: used `bigint generated always as identity`** (like every
other table in this codebase — `vt_users.id`, `vt_founder_tasks.id`, all 30+
existing tables) instead of introducing UUIDs for just this feature.
Foreign keys to `vt_users(id)` require this anyway (that column is bigint).

## 4. OAuth state storage decision

Implemented as **DB-backed, single-use, short-lived** (`health_oauth_states`
table) — not the V1 draft's stateless-JWT approach. A cryptographically
random opaque token is sent to Google as `state`; only its SHA-256 hash is
persisted server-side, along with the initiating `user_id`, requested
scopes, an expiry (`HEALTH_OAUTH_STATE_TTL_SECONDS`, default 600s), and a
`used_at` column that is set the first time the state is successfully
consumed — a second attempt with the same state value is rejected
(`HEALTH_OAUTH_STATE_USED`) even though the value itself would still verify.
This satisfies the spec's explicit rejection of "einfache Klartext-JSON
User-ID als State" and its requirement for real CSRF protection with
single-use enforcement.

## 5. PKCE decision

**Not implemented, deliberately.** PKCE (RFC 7636) protects *public* OAuth
clients (mobile/SPA apps that cannot hold a `client_secret`) from
authorization-code interception. VitalTwin's Google Health OAuth client is a
confidential, server-side client — `GOOGLE_HEALTH_CLIENT_SECRET` lives only
in Railway env vars, and the authorization-code exchange happens
server-to-server in `core/health_oauth_service.py`. PKCE adds no additional
protection in this topology. Documented here per the spec's own "sofern
sinnvoll" (where sensible) qualifier for PKCE.

## 6. Advisory-lock / token-refresh race protection — known limitation

`supabase-py` only exposes the PostgREST REST API (`core/supabase.py`), not
a raw SQL/psycopg2 connection — **a true Postgres advisory lock
(`pg_advisory_lock`) is not reachable from this codebase's DB access
layer**, and adding a second, parallel raw-SQL connection just for this one
feature was judged out of scope/too risky for this rewrite. Instead,
`health_connections_repository.py::try_acquire_refresh_lock` uses a
conditional `UPDATE ... WHERE refresh_lock_expires_at IS NULL OR
refresh_lock_expires_at < now()` against two new columns
(`refresh_lock_token`, `refresh_lock_expires_at`) on
`user_health_connections`. This reduces (does not eliminate) the window for
a concurrent double-refresh, and is explicitly documented as a **best-effort
approximation, not a hard atomicity guarantee** — acceptable for the current
single-instance Railway deployment (same documented limitation already
accepted for `core/rate_limit.py`'s in-memory rate limiter), but would need
a real distributed lock (e.g. Redis) before horizontal scaling.

## 7. Route mount point

Confirmed via `grep_search` against `app/routers/health.py` (the existing
CGM/nutrition feature, mounted at `/api/health`) that it only defines
`/cgm/upload-csv`, `/cgm`, `/nutrition` (POST/GET) — no collision with the
new Google Health paths (`/providers`, `/connections`, `/google/*`,
`/data/*`). The rewritten `google_health.router` is now mounted at
`/api/health` (previously `/api/health-connect` in the V1 draft), matching
the spec's exact requested paths.

## 8. `GET /google/connect` — redirect vs. JSON decision

Returns `{"authorization_url": "..."}` as a JSON body, **not** an HTTP
redirect. The frontend calls this endpoint via `fetch()` (required to send
the `Authorization: Bearer <jwt>` header, which a real browser navigation
cannot attach) and then performs the actual navigation itself via
`window.location.href = authorization_url`. `GET /google/callback` is the
one endpoint Google's own redirect hits directly (no `Authorization` header
possible there), so it issues a real `RedirectResponse` back to the
frontend.

## 9. Google Health scopes activated (priority order, per spec)

1. `googlehealth.activity_and_fitness.readonly` (Steps, Distance,
   Active Minutes)
2. `googlehealth.sleep.readonly` (Sleep)
3. `googlehealth.health_metrics_and_measurements.readonly`
   (Heart Rate, Weight)
4. Nutrition scope — explicitly **deferred**, not requested yet (per spec's
   "später").

## 10. Credentials / configuration status — NOT CONFIGURED YET

None of the following exist in Railway yet (confirmed by the founder not
having provided them, and by their absence from any `.env` committed to this
repo):

- `GOOGLE_HEALTH_CLIENT_ID`
- `GOOGLE_HEALTH_CLIENT_SECRET`
- `GOOGLE_HEALTH_REDIRECT_URI`
- `HEALTH_TOKEN_ENCRYPTION_KEY`

This means: **the integration cannot be tested end-to-end against the real
Google OAuth flow yet**, no matter how complete the code is. See
`GOOGLE_HEALTH_IMPLEMENTATION_REPORT.md` section "Status" for the explicit,
honest classification required by the spec.

## 11. Google verification status

Per Google's own documentation (verified 2026-08-02 against
developers.google.com/health): new OAuth clients start capped at 100 test
users while in "Testing" publishing status, with refresh tokens expiring
after 7 days in that mode. Moving to "In production" (needed for real,
long-lived refresh tokens and to serve more than 100 users) requires
completing Google's OAuth consent screen verification, which for restricted
health scopes includes a third-party security assessment. **This has not
been started** — it is an external, non-code process the founder must
initiate in Google Cloud Console. No functionality of this integration may
be described as "production-ready" until this is complete, per the spec's
explicit final instruction.

## 12. Response schema uncertainty (carried over from V1, still unresolved)

The exact JSON field names of a `dataTypes/{type}/dataPoints` list response
(e.g. whether the items array key is `dataPoints` or `data_points`, and the
exact shape of `interval`/`sampleTime` sub-objects) were never confirmed
against a **real** API response — only request-URL examples were visible in
the fetched official docs. `google_health_client.py::iter_data_points` and
`health_normalization_service.py::normalize_data_point` both defensively
check multiple plausible key names and always retain the full raw item in
`raw_metadata`, so no data is silently lost if a guessed key is wrong — but
this must be verified against one real synced response once a live OAuth
connection exists (blocked on section 10 above).
