# Google Health — Implementation Report

Production-grade rewrite of the Google Health integration, replacing the
earlier V1 draft (stateless-JWT OAuth state, one generic data-points table,
`/api/health-connect` prefix) per the founder's 27-section specification.

## 1. What was implemented

A complete, testable, but **not yet externally verifiable** Google Health
OAuth 2.0 Authorization Code integration:

- DB-backed, single-use OAuth state (CSRF protection with real replay
  prevention, not just signature verification).
- Normalized data storage across 3 category-specific tables instead of one
  generic JSONB blob table.
- Best-effort single-flight token-refresh protection (honestly documented
  as not a true Postgres advisory lock — see `GOOGLE_HEALTH_API_AUDIT.md`
  section 6).
- Scope-aware, partial-consent-tolerant sync with real per-run counters
  (`health_sync_runs`).
- 11 new REST endpoints under `/api/health/...` (providers, connections,
  connect/callback/status/disconnect/sync/data, plus an optional data-purge
  endpoint).
- Frontend card with the exact required copy and reauthorization/partial-
  consent UI states.
- 46 new backend tests, all mocking Supabase and Google's HTTP endpoints —
  no real network access, no real tokens anywhere in the test suite.

## 2. Files created / changed

**Created:**
- `backend/app/core/health_encryption_service.py`
- `backend/app/core/health_errors.py`
- `backend/app/core/health_oauth_service.py`
- `backend/app/core/google_health_client.py`
- `backend/app/core/health_connections_repository.py`
- `backend/app/core/health_token_service.py`
- `backend/app/core/health_normalization_service.py`
- `backend/app/core/health_sync_service.py`
- `frontend/docs/GOOGLE_HEALTH_API_AUDIT.md`
- `frontend/docs/GOOGLE_HEALTH_SETUP.md`
- `frontend/docs/GOOGLE_HEALTH_DATA_MAPPING.md`
- `frontend/docs/GOOGLE_HEALTH_IMPLEMENTATION_REPORT.md` (this file)

**Rewritten (replacing the V1 draft entirely):**
- `backend/migrations/024_google_health_connections.sql`
- `backend/app/routers/google_health.py`
- `backend/tests/test_google_health.py`
- `frontend/app/components/GoogleHealthConnect.tsx`

**Changed (small, additive):**
- `backend/app/main.py` — mount prefix changed from `/api/health-connect`
  to `/api/health`.

**Deleted (superseded by the modules above):**
- `backend/app/core/google_health.py` (V1's single monolithic module).

## 3. Tables created (migration 024, NOT yet run in Supabase)

`user_health_connections`, `health_oauth_states`, `health_sync_runs`,
`health_activity_records`, `health_sleep_records`, `health_metric_records`.
All `bigint generated always as identity` primary keys, all RLS disabled
(matching this codebase's existing convention), all start completely empty.

## 4. Which endpoints work (code-complete, mocked-tested; NOT live-tested)

All mounted under `/api/health`:

- `GET /providers`, `GET /connections`
- `GET /google/connect`, `GET /google/callback`, `GET /google/status`,
  `POST /google/disconnect`, `DELETE /google/data`, `POST /google/sync`
- `GET /data/activity`, `GET /data/sleep`, `GET /data/metrics`

Every one passes its unit/integration tests against mocked Supabase +
mocked Google HTTP responses. **None have been exercised against the real
Google OAuth flow** — see section 7.

## 5. Which real data types work

Code-complete for: `steps`, `distance`, `active-minutes`, `sleep`,
`heart-rate`, `weight` (see `GOOGLE_HEALTH_DATA_MAPPING.md`). Nutrition is
explicitly deferred, not implemented. "Work" here means: correctly
requests the right scope, paginates, normalizes, and upserts into the
right table when Google's API returns data in the shape the code expects —
**this shape was not confirmed against a real API response** (see section
9 / audit section 12).

## 6. Test results

`pytest -q` (full suite): **977 passed**, including 46 new/rewritten tests
in `tests/test_google_health.py` covering encryption, OAuth state
(round-trip/replay-rejection/expiry), authorization URL construction, token
exchange, the API client's error-code mapping (401/429/5xx) and pagination
(including the max-pages safety limit), normalization for all 3 category
shapes, the connections repository (upsert/reuse, active-vs-disconnected
filtering, refresh-lock acquire/release), the token service (valid-token
reuse, refresh, refresh-failure → reauthorization-required), sync
orchestration (scope-missing skip, full-success counters), and router-level
tests for every endpoint (ownership scoping, 404 on no connection, 409 on
reauthorization-required, 400 on invalid `data_type`).

Frontend: `tsc --noEmit` clean, `npm run lint` clean.

## 7. Which env vars are still missing

**All of these are unset** — confirmed by their absence from Railway (per
the founder, no credentials have been provided for this feature):

- `GOOGLE_HEALTH_CLIENT_ID`
- `GOOGLE_HEALTH_CLIENT_SECRET`
- `GOOGLE_HEALTH_REDIRECT_URI`
- `HEALTH_TOKEN_ENCRYPTION_KEY`

Everything else in `.env.example` below is optional (has a working default).

## 8. Which Google Cloud steps are still open

All of them — no Google Cloud project/OAuth client has been created for
Google Health yet (see `GOOGLE_HEALTH_SETUP.md` sections 1–2): creating the
OAuth client, configuring the redirect URI, configuring the consent screen
and requested scopes, adding test users, and — separately, and much later —
completing Google's third-party security verification to move out of
Testing mode.

## 9. Honest status classification

**Durch externe Zugangsdaten blockiert.** No Google Health OAuth client
credentials exist yet, migration 024 has not been run in Supabase, and no
end-to-end test against the real Google OAuth flow or real Google Health
API has been performed. The code is complete and passes all mocked tests,
but per the spec's explicit instruction, **nothing here may be called
"production-ready"** while:

- Google Cloud OAuth client setup is incomplete (section 8),
- required env vars are unset (section 7),
- migration 024 has not been run,
- and — separately, even once the above is done — the app remains in
  Google's "Testing" publishing status (max 100 users, 7-day refresh
  tokens) until Google's verification process is completed.

Once credentials + migration are in place, the honest status becomes **"nur
für Testnutzer funktionsfähig"** (limited to the up to 100 Google-registered
test users, with refresh tokens expiring every 7 days) — not
"vollständig funktionsfähig", until Google verification is complete.

## 10. What the founder must do next

1. Set the 4 required env vars in Railway (section 7) — see
   `GOOGLE_HEALTH_SETUP.md` for how to obtain/generate each one.
2. Run `backend/migrations/024_google_health_connections.sql` in the
   Supabase SQL editor.
3. Complete Google Cloud Console OAuth client + consent screen setup with
   the real production redirect URI (`GOOGLE_HEALTH_SETUP.md` sections
   1–2), and add the founder's own Google account (and any other real
   beta-test users) as OAuth test users.
4. Test the full connect → consent → callback → sync flow end-to-end with
   a real Google account (`GOOGLE_HEALTH_SETUP.md` section 5) — this is the
   first point at which the unresolved `dataPoints` response-shape
   uncertainty (audit section 12) can actually be confirmed or corrected.
5. Decide on a timeline for Google's OAuth verification/production
   publishing (a real external process with lead time), since until then
   the feature is capped at 100 test users with 7-day refresh tokens.
