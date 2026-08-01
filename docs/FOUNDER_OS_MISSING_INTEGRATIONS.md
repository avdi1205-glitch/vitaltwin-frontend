# Founder OS — Missing Integrations

Date: 2026-08-01. Companion to
[FOUNDER_OS_FUNCTIONALITY_AUDIT.md](FOUNDER_OS_FUNCTIONALITY_AUDIT.md) and
[FOUNDER_OS_DATA_SOURCES.md](FOUNDER_OS_DATA_SOURCES.md). Lists every
external system that Founder OS metrics depend on but that is **not
connected today**, what it would take to connect it for real, and the exact
environment variables involved. Nothing below was connected in this
session — per the task's explicit instruction, external integrations are
only ever described here, never faked.

For each: current status, setup steps, and required environment variables.

## 1. Stripe Reporting (Umsatz, Abonnements, Kündigungen, Rückerstattungen)

**Status (2026-08-01, aktualisiert): Code fertig, wartet nur noch auf
Stripe-Dashboard-Konfiguration.** Der bestehende Webhook-Endpoint
(`POST /api/payments/webhook` in `backend/app/routers/payments.py`)
verarbeitet jetzt zusätzlich zu `checkout.session.completed`:

- `customer.subscription.created`/`customer.subscription.updated` → echter
  Abo-Status in `vt_stripe_subscriptions` (neue Migration
  `023_stripe_billing_events.sql`, noch nicht in Supabase ausgeführt)
- `customer.subscription.deleted` → Abo wird als `canceled` markiert UND
  `premium` wird für den Nutzer auf `False` gesetzt (echte Kündigung, kein
  Feature-Flag-Rest mehr)
- `invoice.paid` → echte Zahlung in `vt_stripe_payments` (Basis für
  "Umsatz heute/Monat")
- `charge.refunded` → echte Rückerstattung in `vt_stripe_refunds`

Neues `core/stripe_billing.py` berechnet Umsatz/Abo-Zahlen/Rückerstattungen
ausschließlich aus diesen drei Tabellen — nie durch einen Live-Stripe-API-
Call bei jeder Dashboard-Anfrage. Wird bereits angezeigt in
`GET /api/admin/business/overview`, `GET /api/admin/founder/dashboard`
(`revenue.stripe`) und `GET /api/admin/founder/daily-briefing`
(`business.revenue_today/yesterday/month`, `users.cancellations`).

**Was jetzt noch fehlt, um wirklich Daten zu bekommen** (kein Code, reine
Konfiguration im Stripe-Dashboard):
1. Migration `023_stripe_billing_events.sql` in Supabase ausführen (wie
   Migration 022 zuvor).
2. Im Stripe-Dashboard unter "Webhooks" beim **bestehenden** Endpoint
   (derselbe wie für `checkout.session.completed`) die 4 neuen Events
   zusätzlich abonnieren: `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.paid`, `charge.refunded`.
3. Kein neuer API-Key nötig — derselbe `STRIPE_WEBHOOK_SECRET` gilt für
   alle Events desselben Endpoints.

**Environment variables needed**: keine neuen — nur die bereits
konfigurierten `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`.

**Priorität**: hoch, aber jetzt nur noch ein 5-Minuten-Konfigurationsschritt
im Stripe-Dashboard + einmal Migration 023 ausführen — kein Code mehr nötig.

## 2. Affiliate Partner Networks (echte Klicks/Verkäufe/Provisionen)

**Status: Nicht konfiguriert.** `core/affiliate_provider.py` already
scaffolds `ProviderStatus` for 6 real network APIs, all currently
`not_configured`. Today, clicks/conversions/commissions are only ever
written by our own frontend calling `POST /api/affiliate/track` — real
numbers, but self-reported, not independently verified by a network.

**Setup steps**: pick a real affiliate network (e.g. Awin, Impact, CJ,
Amazon PartnerNet, individual merchant programs) per product category,
obtain API credentials, implement the specific network adapter in
`affiliate_provider.py` (interface already exists), and switch tracking to
trust the network's own postback/webhook instead of (or in addition to)
the client-side `/track` call.

**Environment variables needed**: one API key/secret pair per network
(network-specific, e.g. `AWIN_API_TOKEN`, `IMPACT_ACCOUNT_SID` +
`IMPACT_AUTH_TOKEN`).

**Priorität**: mittel — current self-tracked numbers are usable for
internal product decisions, but not trustworthy enough for real payout
reconciliation.

## 3. Server / Hosting Monitoring (Serverstatus)

**Status: Nicht konfiguriert.** No uptime/CPU/memory signal exists anywhere.

**Setup steps**: call the hosting provider's own status API (Railway's
GraphQL API for deployment/service health, or Vercel's API for the
frontend) from a new `core/server_monitoring.py`, on a schedule or on
dashboard read.

**Environment variables needed**: `RAILWAY_API_TOKEN` (backend host) and/or
`VERCEL_API_TOKEN` (frontend host).

**Priorität**: mittel.

## 4. CI/CD / Build Pipeline (automatischer Build-Status)

**Status: teilweise vorhanden.** The new `vt_founder_releases` table +
`POST /api/admin/system/releases` endpoint (this session) already provide a
real place to record build/release status — but nothing calls it
automatically yet. Today it's manual (a founder/admin fills in the System
Center form after a deploy).

**Setup steps**: add a step to the existing GitHub Actions / Vercel / Railway
deploy pipeline that calls `POST /api/admin/system/releases` with the real
version/commit SHA/build result at the end of every deploy.

**Environment variables needed**: a shared secret for the CI/CD job to
authenticate the call (e.g. a dedicated service-account admin token, or a
simple shared `RELEASE_WEBHOOK_SECRET` checked in the endpoint — not yet
implemented, since no CI/CD system is connected yet to test against).

**Priorität**: mittel.

## 5. Backup Automation (automatischer Backup-Status)

**Status: teilweise vorhanden.** Same pattern as releases — the new
`vt_founder_backup_status` table + `POST /api/admin/system/backups`
endpoint exist and are usable manually today, but nothing triggers them
automatically.

**Setup steps**: depends on the chosen backup strategy —
(a) if relying on Supabase's own built-in backups (available on paid
Supabase tiers), there is no API to query completion status today, so this
would need Supabase support/dashboard confirmation rather than an API call;
(b) if building a custom `pg_dump`-based backup job, have that job `POST` to
`/api/admin/system/backups` on completion.

**Environment variables needed**: depends entirely on the chosen backup
target (e.g. AWS S3 credentials `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`
if backups are shipped to S3).

**Priorität**: mittel.

## 6. External Error Tracking (Sentry or similar)

**Status: Nicht konfiguriert.** This session added a real-but-narrow
internal error log (`vt_error_events`, backend-only, unhandled exceptions
only). A real external tool would add: stack-trace grouping/deduplication,
alerting/paging, release-tagged errors, and **frontend** error capture
(none of which the internal log does).

**Setup steps**: create a Sentry project (or similar), add the Python SDK
to the backend (`sentry-sdk`) and the JS SDK to the frontend
(`@sentry/nextjs`), initialize both with the DSN.

**Environment variables needed**: `SENTRY_DSN` (backend),
`NEXT_PUBLIC_SENTRY_DSN` (frontend).

**Priorität**: mittel-hoch — this is the most impactful remaining gap for
production reliability visibility, now that AI usage/cost is solved
internally.

## 7. AI Cost Pricing (optional, no external credential)

**Status: internes Foundation fertig, Preis nicht konfiguriert.** Real
token counts are now logged for every AI request
(see [FOUNDER_OS_DATA_SOURCES.md](FOUNDER_OS_DATA_SOURCES.md)). Converting
tokens to a real USD cost only requires the founder to set two values —
**not an external API key**, just a documented price:

**Environment variables needed**: `OPENAI_PROMPT_PRICE_PER_1K_USD`,
`OPENAI_COMPLETION_PRICE_PER_1K_USD` (set to the real current OpenAI list
price for whichever model `OPENAI_MODEL` is configured to, e.g. for
`gpt-4o-mini` check the current price at platform.openai.com/pricing —
deliberately not hardcoded in this codebase since prices change and differ
per contract).

**Priorität**: niedrig — purely a "nice to have exact $" config step, all
raw token data is already real and usable without it.

## Recommended integration order

1. **Stripe Reporting** — code is DONE (2026-08-01); only remaining steps
   are running migration 023 in Supabase + subscribing the 4 new event
   types in the Stripe Dashboard (no code, ~5 minutes).
2. **Sentry** (or equivalent) — production reliability visibility, cheap to
   add, high signal.
3. **OPENAI_*_PRICE_PER_1K_USD env vars** — trivial, 5-minute task, turns
   already-logged tokens into a real $ figure.
4. **CI/CD → `POST /api/admin/system/releases`** webhook step — automates
   what's already a working manual endpoint.
5. **Affiliate partner network APIs** — only worth doing once actual
   affiliate volume justifies the integration effort per network.
6. **Server/hosting monitoring** — nice-to-have, lowest urgency since
   Railway/Vercel already have their own dashboards founders can check
   directly today.
7. **Backup automation** — depends on which backup strategy is chosen;
   revisit once a concrete backup policy is decided.
