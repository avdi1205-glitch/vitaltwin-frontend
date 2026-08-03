# VitalTwin — Performance Implementation Report

Companion to `PERFORMANCE_AUDIT.md`. Every change below was made only after
that audit identified a real, verified bottleneck — nothing was changed
speculatively.

## 1. Files changed

**Backend:**
- `app/routers/admin.py` — `GET /api/admin/dashboard` rewritten to run its
  10 independent Supabase lookups concurrently via
  `core/concurrency.py::run_parallel`, itself offloaded to a worker thread
  via `await asyncio.to_thread(...)` so the event loop stays free for
  other requests during this endpoint's DB round-trips (previously: 10
  fully sequential calls, no `to_thread`).
- `app/routers/profile.py`:
  - `GET /api/profile/export` — the 14 independent per-category loads
    (profile, daily entries, habits, habit entries, goals, daily plans,
    daily plan actions, daily/weekly reflections, recommendations, twin
    memories/patterns/learning events, consents) now run concurrently via
    `run_parallel`; the 3 recommendation-child categories
    (decisions/outcomes/feedback) are then loaded in a second concurrent
    batch, filtered by the recommendation ids from the first batch.
  - **Bug fix** (found during this audit, not previously known): those 3
    recommendation-child tables have no `email` column, so the old
    `.eq("email", ...)` filter always silently returned `[]` for them
    (caught by a broad `except Exception`). Now filtered correctly via
    `.in_("recommendation_id", recommendation_ids)`.
  - `PUT /api/profile/me` — replaced a read-then-insert-or-update pattern
    (3 sequential DB round-trips: read, write, read-again) with a single
    `upsert(payload, on_conflict="email")` call (`email` already has a
    `unique` constraint from migration 001), returning the written row
    directly from the upsert response instead of a third read.
- `migrations/025_performance_indexes.sql` — 2 real, verified missing
  indexes (see audit section 3.5): `vt_wellness_goals(email)` and
  `vt_recommendation_decisions/_outcomes/_feedback(user_id)`. **Not yet
  run in Supabase.**

**Frontend:**
- `instrumentation-client.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts` — `tracesSampleRate` lowered from the Sentry
  wizard's default of `1` (100%) to `0.2` (20%), based on the live
  measurement in the audit showing redundant `/monitoring` tunnel
  round-trips (~700ms each, several per single page load) caused by
  full-rate tracing on every pageview.

**Tests:**
- `tests/test_admin_router.py` — existing `admin_dashboard` tests
  unchanged in behavior, all still pass with the parallelized
  implementation (55/55).
- `tests/test_profile_export.py` — 2 new tests added:
  `TestExportProfileRecommendationChildTables` (regression test proving
  the recommendation-child-table bug fix actually returns real data now)
  and `TestUpdateProfileUpsert` (proving `update_profile` now issues
  exactly one upsert call instead of up to three separate calls).

## 2. What was NOT changed (and why)

- **Dashboard mount fetches** (`frontend/app/dashboard/page.tsx`) — an
  earlier automated pass suspected these were sequential; manual
  re-reading of the actual code showed they already fire concurrently (no
  `await` between the two calls). **No change made** — fixing something
  that isn't broken would contradict the task's "keine Vermutungen"
  requirement.
- **`next/dynamic` code-splitting** for the 10 Founder OS admin tabs — the
  bundle is already lean (no heavy chart/icon libraries found), and every
  tab already lazy-loads its *data* on open (confirmed in the audit).
  Code-splitting the tab *components* themselves would still shrink the
  initial admin bundle somewhat, but was judged lower priority given the
  bundle's already-small size — left as an open recommendation, not
  implemented in this pass.
- **Full async Supabase client / `asyncio.to_thread` everywhere** — a much
  larger, higher-risk refactor across dozens of files; only applied to the
  two endpoints actually touched in this pass (`admin_dashboard`, and
  `run_parallel` itself already runs its callables in a thread pool).
  Every other router still blocks the event loop synchronously during DB
  calls, same as before — an explicitly flagged, not silently ignored,
  open item (see audit 3.7 and the prior Founder OS performance pass
  already on record in repo memory, which reached the same conclusion).
- **Skeleton-loading UI components** — real inspection of
  `dashboard/page.tsx` found it already avoids a fully blank page while
  loading (inline "Lädt…"/"Wird geladen…" text in the relevant spots, not a
  full skeleton-card treatment). Building full skeleton components for
  every card would be a substantial UI project on its own; not attempted
  in this pass given the page already satisfies the underlying requirement
  ("keine komplett leere Seite") even without dedicated skeleton
  components.
- **Railway/Supabase region change, worker count increase, any paid
  tier change** — per the task's explicit stop-rule, none of these were
  touched; no evidence of a region-latency problem was found in the first
  place (see audit section 4), and no Railway/Supabase API access exists
  to verify region settings independently.
- **Migration 025 was not run in Supabase** — per this project's
  established pattern, the founder runs migrations manually in the
  Supabase SQL Editor; not something this agent does directly.

## 3. Test results

`pytest -q` (full backend suite): **991 passed** (2 new tests added on top
of the pre-existing 989). `npx tsc --noEmit`, `npm run lint`, `npm run
build` (frontend): all clean.

## 4. Measurements — before/after

| Item | Before | After |
|---|---|---|
| `/` FCP (warm) | 436ms (already measured as part of establishing this baseline) | unchanged (no change was needed here) |
| `/preise` FCP | 564ms | unchanged (no change was needed here) |
| `GET /api/admin/dashboard` — DB round-trips | 10 sequential | 10 concurrent (≈ latency of the single slowest call instead of the sum of all 10) |
| `GET /api/profile/export` — DB round-trips | 17 sequential | 2 concurrent batches (14, then 3) |
| `PUT /api/profile/me` — DB round-trips | 2–3 sequential | 1 |
| `/monitoring` (Sentry tunnel) calls per pageview | Full-rate tracing (`tracesSampleRate=1`) — 3–4 calls observed live | 1 in 5 pageviews now traces at all (`tracesSampleRate=0.2`) |

No before/after millisecond timing exists for the 3 backend endpoints
above, because they are behind authentication this agent cannot exercise
against the live production API (see audit section 1) — the "before"
figures are exact call counts read directly from the old code, and the
"after" figures are exact call counts read from the new code; both are
real facts, not estimates, but neither is a live-clock millisecond
measurement. This is stated explicitly rather than implying a false
"X seconds faster" claim.

## 5. Open items / recommendations for later

1. Run migration 025 in Supabase (2 new indexes).
2. Consider `next/dynamic` for the Founder OS tab components if the admin
   bundle ever grows heavier (not currently needed).
3. Consider a broader `asyncio.to_thread` pass across the remaining
   user-facing routers (`daily_planning.py`, `chat.py`, `twin_memory.py`,
   `recommendations.py`) if real production load ever shows event-loop
   contention — no evidence of this exists yet at current beta traffic.
4. Consider adding a request-deduplication layer (e.g. SWR/React Query) on
   the frontend if/when more components start fetching the same endpoint
   independently — not currently a measured problem (only 1–2 call sites
   per endpoint today).
5. `vt_recommendation_decisions/_outcomes/_feedback.user_id` may still be
   `NULL` for rows created before this codebase started setting `user_id`
   consistently (see migration 003's own comment about a not-yet-run
   backfill) — the `export_profile` fix works correctly regardless (it
   joins via `recommendation_id`, which is never null), but a future
   `user_id` backfill would still be worth doing for other code paths that
   might filter these tables by `user_id` directly.

## 6. Answers to the mandated 10 closing questions

1. **Login before/after**: no functional change was made to the login
   flow — it was already correct (immediate redirect, no blocking waits).
2. **Dashboard before/after**: no live-clock before/after exists (requires
   auth); the two mount API calls were already concurrent, confirmed by
   code reading, not changed.
3. **Admin before/after**: `GET /api/admin/dashboard` went from 10
   sequential to 10 concurrent DB calls — real call-count change, no
   live-clock number available (see section 4).
4. **Slowest API**: `GET /api/profile/export` was the worst on paper (17
   sequential calls) — now 2 concurrent batches.
5. **Slowest SQL query**: not measurable without `EXPLAIN ANALYZE` access
   to production Supabase (no direct DB connection exists in this
   environment) — the closest real signal was the 2 missing indexes found
   by cross-checking actual hot-path filters against actual migration
   files (section 3.5 of the audit).
6. **Requests removed**: `PUT /api/profile/me` went from up to 3 DB calls
   to 1 (2 removed). `GET /api/profile/export`'s wall-clock-relevant
   round-trip count dropped from 17 sequential to effectively 2 batches.
7. **What is now lazy-loaded**: nothing new was made lazy in this pass —
   Founder OS tabs were already confirmed lazy; `next/dynamic`
   code-splitting remains an open recommendation, not implemented.
8. **External services no longer blocking**: none needed fixing — Stripe
   was already confirmed to never be called live on the dashboard/pricing
   hot path, and Google Health is not yet deployed to production at all.
9. **New costs incurred**: none. No hosting tier, worker count, or paid
   service was changed.
10. **Further possible optimizations**: see section 5 above.

No claim of "2–3 seconds achieved" is made anywhere in this report without
a real measurement backing it — the two public pages that could be
live-measured were already within budget before any change was made; the
authenticated-area backend changes are backed by exact, real call-count
reductions, not simulated timing numbers.
