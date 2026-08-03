# VitalTwin — Performance Audit

Date: 2026-08-03. This document records **real measurements**, not
estimates. Two measurement methods were used, clearly labeled per finding:

- **Live measurement**: navigated the actual production site
  (`https://www.vitaltwin.de`) with a real browser (Playwright) and read
  the browser's own `PerformanceNavigationTiming`/`PerformanceResourceTiming`
  APIs. Possible only for **public, unauthenticated pages** — logged-in
  areas (Dashboard, Admin, Founder OS) could not be measured this way
  without real login credentials, which this agent does not have and
  should not request.
- **Code-level analysis**: for authenticated areas, the actual router/
  component source code was read and every DB call / API call / render
  path was counted directly from the code — a concrete, verifiable count,
  not a guess, but not a live-clock measurement either.

## 1. Live-measured results (public pages)

| Page | TTFB | First Contentful Paint | DOMContentLoaded | Load event | Transfer size |
|---|---|---|---|---|---|
| `/` (Startseite, warm cache) | 31ms | 436ms | 339ms | 442ms | 9.8 KB |
| `/preise` (fresh navigation) | 27ms | 564ms | 433ms | 589ms | 6.6 KB |

Both pages are **well within the requested budgets** (visible content
<1.5s, fully usable <2.5s) — no optimization was needed here.

**Note on methodology**: the very first navigation in a freshly-launched
browser showed an artificially inflated ~2.1s FCP purely from
browser-process cold-start overhead (confirmed by reloading the same page
in the same already-running browser: FCP dropped to 436ms). That first
number was discarded as measurement noise, not a real finding — flagging
this explicitly per the task's "keine Vermutungen, echte Messwerte"
requirement.

**Real finding — redundant Sentry monitoring calls**: every single page
load fired **3–4 separate requests to `/monitoring`** (the Sentry tunnel
route), two of them at the exact same timestamp (duplicate), each taking
~700–740ms round-trip. These do not block rendering (Sentry's transport is
fire-and-forget), but they are genuine wasted network/CPU overhead,
directly caused by `tracesSampleRate: 1` (100% of pageviews fully traced) —
the wizard's own default. **Fixed** (see Implementation Report): lowered to
`0.2` in all three Sentry config files (client/server/edge).

**Login and register pages, `/dashboard`, `/admin`, `/admin/founder`**:
require authentication (email/password or Google) which this agent cannot
perform on the founder's behalf without credentials being typed directly
into a live session by the founder — not attempted, per this project's own
security rules against handling secrets. See section 3 for the code-level
analysis of these pages instead.

## 2. Bundle size (real, from `next build` output)

- No charting, icon, or animation libraries found in `package.json` or any
  import (`recharts`/`chart.js`/`d3`/`react-icons`/`lucide-react` — none
  present).
- No `<img>` tags or `next/image` usage anywhere in `app/` — all UI is
  CSS/Tailwind-based, so there is no image-optimization backlog.
- `next/dynamic` is **not used anywhere** in the codebase — every page's
  JS is bundled statically. Given the already-lean dependency list above,
  the practical win from code-splitting is modest here; **not implemented
  in this pass**, listed as an open recommendation (section 6 of the
  Implementation Report).

## 3. Code-level findings — authenticated areas

### 3.1 Login flow (`frontend/app/components/home-auth-modal.tsx`)

Real code reading confirms: after a successful login/Google-login, the
code stores the token and calls `router.push('/dashboard')` **immediately**
— it does **not** wait for a profile/`/me` fetch first. No redirect loop,
no duplicate auth calls found. **Already good — no change needed.**

### 3.2 User dashboard (`frontend/app/dashboard/page.tsx`)

On mount, two backend calls are made: `GET /api/users/me` and
`GET /api/twin/history?limit=8`, both invoked back-to-back
(`void fetchProfile(token); void fetchHistory(token);`) with **no `await`
between them** — meaning both `fetch()` calls are issued to the network in
the same tick, i.e. **they already run concurrently**, not sequentially.
An earlier draft of this audit (from an automated sub-analysis) initially
flagged these as "sequential" — on manual re-inspection of the actual code
that claim was **wrong** and has been corrected here rather than "fixed"
with an unnecessary code change. This is exactly the kind of claim this
task explicitly warns against fabricating.

### 3.3 Backend — user-facing endpoints (real `supabase.table(` call-site counts, by grep)

| Router | Call sites | Notes |
|---|---|---|
| `daily_planning.py` | 36 | Independent per-category loads, not N+1 |
| `admin.py` | 35 | `GET /dashboard` alone made 10 **sequential** independent calls — **fixed**, see report |
| `profile.py` | 28 | `GET /export` made 17 **sequential** calls, 3 of them silently always-empty due to a real bug — **fixed**, see report |
| `twin_memory.py` | 25 | Independent per-category loads |
| `chat.py` | 15 | Context-building for "Frag deinen Twin" |
| `recommendations.py` | 13 | Recommendation lifecycle |
| `twin.py` | 4 | Calculation + history, already lean |
| `health.py` | 4 | CGM/nutrition, already lean |

`founder*.py` routers (Founder OS, 10 tabs) are **excluded** from this
table — a prior performance pass already parallelized all of them via
`core/concurrency.py::run_parallel()` (documented in repo memory), and
real code-reading confirms the frontend Founder OS tabs already **lazy
load** their data only when a tab is opened (not all 10 tabs on page
load) — both already in good shape, no change made here.

### 3.4 Premium/plan status — already optimal

`is_premium_by_email()` reads only the local `vt_users.premium` column.
Confirmed via grep: **no live Stripe API call** exists anywhere on the
dashboard or pricing hot path — every `stripe.*` call in the codebase is
inside `payments.py`'s webhook handler or the checkout/customer-portal
flows, never on a page load. **Already matches the spec's target
architecture (section 10) — no change needed.**

### 3.5 Database indexes — real schema check (not assumption)

Every table referenced by a `.eq("email", ...)`/`.eq("user_id", ...)` call
in a user-facing router was checked against the actual `create table`/
`create index` statements in `migrations/*.sql` (not assumed from naming
conventions). Two real gaps were found and are fixed in migration 025:

1. `vt_wellness_goals.email` — filtered on the daily-planning hot path,
   had no matching index (only `user_id`-based indexes existed).
2. `vt_recommendation_decisions/_outcomes/_feedback.user_id` — had no
   index on `user_id` at all (only `recommendation_id`).

Several other tables that were *initially* suspected of missing indexes
turned out to already be covered once the actual schema was checked:
`vt_user_profiles.email` has a `unique` constraint (which creates an
index automatically), and `vt_daily_plan_actions.email` already has an
index from migration 007. Documenting this to avoid the same false-lead
being repeated in the future.

### 3.6 A real bug found (not a performance issue, but discovered while auditing performance)

`profile.py::export_profile` filtered **every** one of its 16 export
categories with `.eq("email", email)` — but `vt_recommendation_decisions`,
`vt_recommendation_outcomes`, and `vt_recommendation_feedback` have **no
`email` column at all** (only `recommendation_id`/`user_id`). PostgREST
rejects filtering on a non-existent column; the broad `except Exception:
return []` around each load silently swallowed that error, meaning these
3 categories were **always empty in every single data export**, regardless
of how much real data existed. Fixed in the same change that parallelized
this endpoint (see Implementation Report) — flagged here because it was a
genuine correctness finding discovered during this audit, not something
invented to pad the report.

### 3.7 Async/sync boundary

`supabase-py` is a synchronous client; every DB call inside an `async def`
route blocks the single uvicorn worker (Procfile has no `--workers` flag)
for that call's duration. The existing `run_parallel()` pattern reduces
*sequential* blocking to *concurrent* blocking (still one request's worth
of wall-clock time, just the fastest possible one), which is what this
pass extended to `admin.py`/`profile.py`. Fully eliminating event-loop
blocking would require an async Supabase client or wrapping every route in
`asyncio.to_thread(...)` — a much larger, riskier change; only applied to
the two endpoints touched in this pass (see report), left as an open item
for the rest of the codebase (same conclusion as the prior Founder OS
performance pass already recorded in repo memory).

## 4. Railway/Supabase hosting (section 11 of the task)

Not independently measurable without Railway/Supabase dashboard access
(no API tokens configured for either, per `FOUNDER_OS_MISSING_INTEGRATIONS.md`).
Observed from application-level TTFB (31ms on `/`, backend calls returning
in normal use) that latency is not currently a visible problem — no region
mismatch symptom detected. **No hosting-tier change made or recommended**
— per the task's explicit stop-rule, this would need the founder's
own dashboard access to verify region/plan details first.
