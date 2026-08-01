# Founder OS — Data Sources

Date: 2026-08-01. Companion to
[FOUNDER_OS_FUNCTIONALITY_AUDIT.md](FOUNDER_OS_FUNCTIONALITY_AUDIT.md).
Documents the **internal foundations** implemented in this session (real,
no external credentials needed) and exactly which table/module now backs
each one — so it's clear which numbers are genuinely computed vs. still
gated behind an external integration
(see [FOUNDER_OS_MISSING_INTEGRATIONS.md](FOUNDER_OS_MISSING_INTEGRATIONS.md)).

## New tables (migration `022_founder_os_internal_logging.sql`, NOT yet run in Supabase)

All five tables start **completely empty** — nothing was backfilled or
fabricated. They only fill up once the app is actually used / a founder
records a release or backup.

| Table | Purpose | Written by |
|---|---|---|
| `vt_ai_usage_events` | One row per AI request (success or failure), across every AI feature in the app | `core/ai_usage_logger.py::log_ai_usage()` |
| `vt_system_events` | Generic operational/lifecycle events (server start, unhandled exceptions) | `core/system_events.py::log_system_event()` |
| `vt_error_events` | Every unhandled backend exception | `core/error_events.py::log_error_event()`, called from `app/main.py`'s global exception handler |
| `vt_founder_releases` | Real release/build records | `core/founder_releases.py::record_release()`, exposed via `POST /api/admin/system/releases` |
| `vt_founder_backup_status` | Real backup status records | `core/founder_backup_status.py::record_backup()`, exposed via `POST /api/admin/system/backups` |

## 1. Central AI Usage Logging (foundation #1 + #2)

**Where it's wired in** — every one of the 7 real AI call sites in the
backend now logs to `vt_ai_usage_events`, success or failure:

| Feature | Router | Endpoint |
|---|---|---|
| `twin_chat` | `chat.py` | `POST /api/chat` |
| `business_coach_ask` | `founder_business_coach.py` | `POST /api/admin/founder/business-coach/ask` |
| `ceo_intelligence_ask` | `founder_ceo_intelligence.py` | `POST /api/admin/founder/ceo-intelligence/ask` |
| `documentation_ask` | `founder_documentation.py` | `POST /api/admin/founder/documentation/ask` |
| `autopilot_ask` | `founder_autopilot.py` | `POST /api/admin/founder/autopilot/ask` |
| `automation_explain_failure` | `founder_automation.py` | `POST /api/admin/founder/automation/runs/{id}/explain-failure` |
| `affiliate_ai_review` | `founder_affiliate_intelligence.py` | `POST /api/admin/founder/affiliate-intelligence/products/{id}/ai-review` |

**How token capture works without changing the `AIProvider` interface**:
`services/ai_provider.py`'s `OpenAIProvider` now stores `self.last_usage`
(the real `usage` object from the OpenAI response) and `self.last_model`
after every successful call. Routers read these via
`getattr(provider, "last_usage", None)` after the `await` — this is safe
because `_get_ai_provider()` factories create a **fresh instance per
request** (already documented in the code as "not a singleton, for
testability"), so there's no cross-request race condition. Test fake
providers don't set these attributes, so `getattr(..., None)` degrades
gracefully to `None` there — zero changes needed to any existing test fake.

**Aggregation**: `core/ai_usage_logger.py::get_ai_usage_summary(days=N)`
returns `{requests, errors, total_tokens, cost_usd, cost_note,
avg_latency_ms}`, wired into:
- `GET /api/admin/ai/usage` (`usage_today` + `usage_30d`)
- `GET /api/admin/founder/dashboard` (`ai.errors`, `ai.cost`)
- `GET /api/admin/founder/daily-briefing` (`ai.errors`, `ai.cost`, same window)

**Cost is intentionally gated** behind `OPENAI_PROMPT_PRICE_PER_1K_USD` /
`OPENAI_COMPLETION_PRICE_PER_1K_USD` (see missing-integrations doc) — token
counts are always real regardless.

## 2. Central System Event Logging (foundation #3)

`core/system_events.py::log_system_event()` — currently emits:
- `server_start` (info) on FastAPI startup (`app/main.py`)
- `unhandled_exception` (error) whenever the new global exception handler
  catches a genuinely unhandled exception

`list_recent_system_events(limit)` is available for a future admin UI list
view (not yet wired into any page — see missing integrations doc for the
"next recommended" note).

## 3. Central Error Event Logging (foundation #7)

`app/main.py::unhandled_exception_handler` — a FastAPI
`@app.exception_handler(Exception)` handler. Starlette dispatches by
most-specific registered handler, so any `HTTPException` a route raises
intentionally (400/403/404/etc.) is **not** affected — it still goes through
FastAPI's own built-in handler. This only ever fires for genuinely
unhandled exceptions (real bugs).

`core/error_events.py::get_error_summary(days=N)` returns `{total, by_type,
note}`, wired into `GET /api/admin/system/status` (`error_events_7d`) and
shown on the System Center page.

**Honest scope**: this is real, but narrow — backend-only, no stack-trace
grouping, no alerting, no frontend error capture. Not a replacement for
Sentry (see missing integrations doc).

## 4. Release & Build data model (foundation #5)

`core/founder_releases.py` + `POST/GET /api/admin/system/releases`. A
founder/admin (permission `manage_founder_os`) records a release manually
via the new System Center form, or a future deploy script can `POST` to the
same endpoint. `GET /api/admin/system/status` exposes the latest release
(`release.version`, `release.build_status`, `release.released_at`) — used by
`founder.py`'s dashboard (`system.build_status`) and
`founder_briefing.py`'s daily briefing (`system.build_status`).

## 5. Backup Status data model (foundation #6)

`core/founder_backup_status.py` + `POST/GET /api/admin/system/backups`.
Same manual-record pattern as releases. `GET /api/admin/system/status`
exposes the latest backup (`backup.status`, `backup.completed_at`) — used
by `founder_briefing.py`'s daily briefing (`system.backups`).

## 6. Automation Event Logging (foundation #4) — already existed, verified

`vt_automation_runs` (Automation Engine, Submodule G, shipped earlier) was
already a real, per-run event log with status/timestamps/steps — this audit
confirmed it satisfies foundation #4 as-is. No new table was added; nothing
needed rebuilding.

## 7. Automation Score (foundation #8) — already existed, verified

`core/automation_score.py::compute_founder_os_automation_score()` computes a
real percentage from `vt_automation_runs` + manually-resolved
`vt_founder_tasks`/`vt_founder_approvals` rows — verified during this audit
to be genuinely computed, never a fixed/invented number. No changes made.

## 8. Documentation Health (foundation #9) — already existed, verified

`core/documentation_score.py::compute_documentation_score()` computes real
coverage percentages from `vt_documentation_registry` cross-referenced
against live code scans (`documentation_scanner.py`). Verified during this
audit to be genuinely computed. No changes made.

## 9. Stripe Billing — real revenue/subscriptions/refunds (2026-08-01 follow-up)

New tables (migration `023_stripe_billing_events.sql`, NOT yet run in
Supabase): `vt_stripe_subscriptions`, `vt_stripe_payments`,
`vt_stripe_refunds` — all start empty, populated exclusively by the
extended Stripe webhook in `routers/payments.py::stripe_webhook`, which now
handles `customer.subscription.created/updated/deleted`, `invoice.paid`,
and `charge.refunded` in addition to the pre-existing
`checkout.session.completed`. `core/stripe_billing.py` computes
`get_revenue_summary()`/`get_subscription_summary()`/
`get_refund_summary()`/`get_cancellations_since()` purely from these three
tables — never a live Stripe API call per dashboard request. Wired into
`GET /api/admin/business/overview`, `GET /api/admin/founder/dashboard`
(`revenue.stripe`), and `GET /api/admin/founder/daily-briefing`
(`business.revenue_today/yesterday/month`, `users.cancellations`).
`customer.subscription.deleted` also downgrades the user's `premium` flag
to `False` — a real cancellation now genuinely ends premium access instead
of leaving it stuck `True` forever. See
[FOUNDER_OS_MISSING_INTEGRATIONS.md](FOUNDER_OS_MISSING_INTEGRATIONS.md#1-stripe-reporting-umsatz-abonnements-kündigungen-rückerstattungen)
for the two remaining non-code steps (run migration 023, subscribe the new
event types in the Stripe Dashboard).

## 10. "Integration fehlt" vs. "Keine Daten" (foundation #10)

Every honest `None` field in the admin/Founder OS responses already carried
a `*_note` string explaining *why* (this was true before this session too —
see e.g. `revenue_note`, `stripe_note` throughout `admin.py`/`founder.py`).
This session's new fields follow the exact same convention:
`beta_applications_note`, `cost_note`, `release.note` ("Noch keine Releases
erfasst — POST /api/admin/system/releases verwenden"), `backup.note`,
`error_events_7d.note`. The distinction now visible in the UI:
- **"Noch keine Daten erfasst"** — the internal data model exists and is
  reachable, it's just empty so far (releases, backups, AI usage before the
  first request).
- **"Nicht eingerichtet" / "Nicht konfiguriert"** — no internal data model
  exists at all yet, or it exists but a required external credential is
  missing (Stripe revenue, server monitoring, Sentry, CI/CD).
