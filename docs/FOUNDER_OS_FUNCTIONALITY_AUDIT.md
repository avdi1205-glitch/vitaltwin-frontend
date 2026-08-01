# Founder OS — Functionality Audit

Date: 2026-08-01. Scope: all 10 Founder OS submodules (A–J) plus the shared
Admin Control Center metrics they read from. This audit was requested because
many visible Founder OS numbers showed "Keine Daten vorhanden" — this
document classifies every checked metric/function honestly, and is the basis
for the internal-foundations work described in
[FOUNDER_OS_DATA_SOURCES.md](FOUNDER_OS_DATA_SOURCES.md) and
[FOUNDER_OS_MISSING_INTEGRATIONS.md](FOUNDER_OS_MISSING_INTEGRATIONS.md).

## Status legend

1. **vollständig funktionsfähig** — real data, real computation, no gaps.
2. **teilweise funktionsfähig** — real data exists but with a caveat (narrow
   scope, self-reported, optional config needed, etc.).
3. **nur UI vorhanden** — a route/component renders, but nothing real backs it.
4. **Datenquelle fehlt** — no table/service exists yet to compute this.
5. **externe Zugangsdaten fehlen** — the code path exists but needs a real
   external credential/API before it can return real data.
6. **fehlerhaft** — implemented but currently produces wrong/broken output.

No row in this table was fabricated to look better — every "1" was verified
against the actual current code in this repository during this audit.

## Audit table

| Founder-OS-Submodul | Kennzahl / Funktion | Route | Service | Tabelle(n) | Echte Datenquelle? | Status | Fehlende Implementierung | Externe Zugangsdaten | Priorität |
|---|---|---|---|---|---|---|---|---|---|
| Admin/F1 Dashboard | Nutzerzahlen gesamt | `GET /api/admin/dashboard`, `GET /api/admin/founder/dashboard` | `admin.py::admin_dashboard`, `founder.py::founder_dashboard` | `vt_users` | Ja | 1 | — | — | — |
| Admin/F1 Dashboard | Premium-Nutzer | gleiche Routen | gleiche Services | `vt_users.premium` | Ja | 1 | — | — | — |
| Admin/Business Center | Stripe-Umsatz (heute/Monat) | `GET /api/admin/business/overview`, `.../founder/dashboard`, `.../daily-briefing` | `stripe_billing.py` (NEU, 2026-08-01) | `vt_stripe_payments` (Migration 023, noch nicht in Supabase ausgeführt) | Ja, sobald `invoice.paid`-Events im Stripe-Dashboard abonniert sind | 2 | Migration 023 ausführen + `invoice.paid` im Stripe-Dashboard abonnieren (kein Code mehr) | keine neuen (nutzt `STRIPE_WEBHOOK_SECRET`) | erledigt (Code), niedrig (Konfiguration) |
| Business Center | Abonnements (aktiv/gekündigt) | `.../business/overview` | `stripe_billing.py` (NEU) | `vt_stripe_subscriptions` (Migration 023) | Ja, sobald `customer.subscription.*`-Events abonniert sind | 2 | s.o. | s.o. | erledigt (Code), niedrig (Konfiguration) |
| Business Center | Kündigungen | `.../daily-briefing` (`users.cancellations`) | `stripe_billing.py::get_cancellations_since` (NEU) | `vt_stripe_subscriptions` | Ja, sobald `customer.subscription.deleted` abonniert ist | 2 | s.o. — zusätzlich setzt der Webhook jetzt auch `premium=False` bei echter Kündigung | s.o. | erledigt (Code), niedrig (Konfiguration) |
| Business Center | Rückerstattungen | `.../business/overview` | `stripe_billing.py::get_refund_summary` (NEU) | `vt_stripe_refunds` (Migration 023) | Ja, sobald `charge.refunded` abonniert ist | 2 | s.o. | s.o. | erledigt (Code), niedrig (Konfiguration) |
| Affiliate / Affiliate Intelligence (F) | Affiliate-Produkte | `GET /api/admin/affiliate/products`, `.../founder/affiliate-intelligence/dashboard` | `affiliate_admin.py`, `founder_affiliate_intelligence.py` | `vt_affiliate_products` | Ja | 1 | — | — | — |
| Affiliate | Affiliate-Klicks | `POST /api/affiliate/track` (event_type=click) | `affiliate.py` | `vt_affiliate_events` | Ja, aber selbst-getrackt | 2 | Verifizierte Klicks über ein echtes Partner-Netzwerk (Postback/Server-to-Server) statt reinem Client-Call | Partner-Netzwerk-API-Keys (z. B. Awin/Impact/CJ) | mittel |
| Affiliate | Affiliate-Verkäufe (Conversions) | `POST /api/affiliate/track` (event_type=conversion) | `affiliate.py` | `vt_affiliate_events` | Ja, aber selbst-getrackt | 2 | Echte Conversion-Bestätigung durch Partner-Netzwerk statt Client-Aufruf | Partner-Netzwerk-API-Keys | mittel |
| Affiliate | Affiliate-Provisionen | gleiche Route (`commission`-Feld, vom Aufrufer übergeben) | `affiliate.py` | `vt_affiliate_events.commission` | Ja, aber selbst-gemeldet | 2 | Provision sollte vom Partner-Netzwerk bestätigt werden, nicht vom eigenen Frontend übergeben | Partner-Netzwerk-API-Keys | mittel |
| Affiliate Intelligence | Automation Score (Affiliate) | `.../affiliate-intelligence/automation-score` | `affiliate_ranking.py`/Detektoren | `vt_affiliate_products`, `vt_founder_tasks` | Ja | 1 | — | — | — |
| KI Control Center / Twin Chat | KI-Requests (gesamt/heute) | `GET /api/admin/ai/usage`, alle `.../ask`-Endpunkte | `services/ai_provider.py`, **NEU:** `core/ai_usage_logger.py` | `vt_chat_usage` (aggregiert) + **NEU** `vt_ai_usage_events` (pro Anfrage) | Ja | 1 (seit dieser Session) | — | — | erledigt |
| KI Control Center | KI-Tokenverbrauch (prompt/completion/total) | `GET /api/admin/ai/usage` (`usage_today`/`usage_30d`) | **NEU:** `core/ai_usage_logger.py` | **NEU** `vt_ai_usage_events` | Ja | 1 (seit dieser Session) | War vorher Status 4 (keine Tabelle) — jetzt real pro Anfrage aus der OpenAI-`usage`-Antwort erfasst | — | erledigt |
| KI Control Center | KI-Kosten (USD) | gleiche Route | `core/ai_usage_logger.py::_compute_cost` | `vt_ai_usage_events.cost_usd` | Teilweise | 2 | Kostenberechnung nur, wenn Preis pro 1K Token konfiguriert ist (bewusst kein hartkodierter Preis, um keine falsche Zahl vorzutäuschen) | `OPENAI_PROMPT_PRICE_PER_1K_USD` + `OPENAI_COMPLETION_PRICE_PER_1K_USD` (keine externen Zugangsdaten, nur eigene Konfiguration) | niedrig |
| KI Control Center | KI-Fehler | gleiche Route | `core/ai_usage_logger.py` | `vt_ai_usage_events.status='error'` | Ja | 1 (seit dieser Session) | War vorher Status 4 — jetzt real pro Anfrage/Feature (twin_chat, business_coach_ask, ceo_intelligence_ask, documentation_ask, autopilot_ask, automation_explain_failure, affiliate_ai_review) | — | erledigt |
| System Center | Serverstatus | `GET /api/admin/system/status` | `admin.py::system_status` | — | Nein | 4 | Hosting-Monitoring-Integration (Railway/Vercel-API) | Railway-/Vercel-API-Token | mittel |
| System Center | API-Status | gleiche Route | `admin.py::system_status` | — (tautologisch: Antwort kam durch) | Trivial-real | 2 | Echter Health-Check mit Verlauf/Historie statt reiner "diese Anfrage kam durch"-Logik | — | niedrig |
| System Center | Datenbankstatus | gleiche Route | `admin.py::system_status` | `vt_users` (Test-Query) | Ja | 1 | — | — | — |
| System Center | Error Tracking | gleiche Route (`error_events_7d`) | **NEU:** `core/error_events.py` + globaler Exception-Handler in `app/main.py` | **NEU** `vt_error_events` | Ja, aber eng begrenzt | 2 | Nur unbehandelte Backend-Exceptions dieses Prozesses — kein Stacktrace-Grouping, kein Alerting, keine Frontend-Fehler | Für volles Tracking: `SENTRY_DSN` | mittel-hoch |
| System Center | Build-Status | gleiche Route (`release.build_status`) | **NEU:** `core/founder_releases.py` | **NEU** `vt_founder_releases` | Ja, aber manuell erfasst | 2 | Kein automatischer CI/CD-Trigger — Status muss aktuell manuell oder per Deploy-Skript per `POST /api/admin/system/releases` gemeldet werden | Für Automatisierung: GitHub-Actions-/Vercel-/Railway-Webhook-Secret | mittel |
| System Center | Release-Status ("letzter Release") | gleiche Route (`release`) | `core/founder_releases.py` | `vt_founder_releases` | Ja, aber manuell erfasst | 2 | s.o. | s.o. | mittel |
| System Center | Backup-Status | gleiche Route (`backup`) | **NEU:** `core/founder_backup_status.py` | **NEU** `vt_founder_backup_status` | Ja, aber manuell erfasst | 2 | Kein automatisierter Backup-Job — Status muss manuell oder per Backup-Skript per `POST /api/admin/system/backups` gemeldet werden | Abhängig vom gewählten Backup-Provider (z. B. S3-Zugangsdaten für ein eigenes Backup-Skript) | mittel |
| Automation Engine (G) | Automation Events | `GET /api/admin/founder/automation/dashboard`, `/runs` | `automation_engine.py` | `vt_automation_runs` | Ja | 1 | — | — | — |
| Automation Engine (G) | Automation Score | `.../automation/dashboard` (`automation-score`) | `core/automation_score.py` | `vt_automation_runs`, `vt_founder_tasks`, `vt_founder_approvals` | Ja (verifiziert in diesem Audit) | 1 | — | — | — |
| Task Manager (F3) | Founder Tasks | `GET /api/admin/founder/tasks` | `founder_task_detector.py` | `vt_founder_tasks` | Ja (5 von 16 angefragten Quellbereichen haben echte Detektoren: Affiliate defekt/neu/pending, Premium=Stripe fehlt, KI=OpenAI fehlt, Support=neues Feedback, Sicherheit=Login-Spike) | 1 (für die 5 realen Bereiche), 4 (für die restlichen 11, dort existiert bewusst kein Fake-Detektor) | Für die 11 fehlenden Bereiche (Blog/Server/API/SEO/Doku/Tests/Releases/Backups/Performance/Analytics) fehlen die zugrunde liegenden Datenquellen selbst | je nach Bereich | siehe einzeln |
| Smart Approval Center (D) | Founder Approvals | `GET /api/admin/founder/approvals` | `founder_approval_detector.py` | `vt_founder_approvals` | Ja (5 reale Detektoren) | 1 | — | — | — |
| AI Business Coach (E) | Strategic Goals | `GET /api/admin/founder/business-coach/goals` | `founder_business_goals.py` | `vt_founder_business_goals` | Ja | 1 | — | — | — |
| AI Business Coach (E) / CEO Intelligence (H) | Risks | `.../business-coach/risks`, `.../ceo-intelligence/risks` | `founder_business_insight_engine.py`, `executive_risk_opportunity.py` | `vt_founder_business_insights` | Ja (nur 3-4 von möglichen Kategorien haben echte Regel-Detektoren: wachstumschance, affiliate_chance, supportproblem, datenqualitaetsrisiko) | 1 (für die realen Kategorien), 4 (für nicht abgedeckte Risiko-Kategorien — es feuert schlicht nichts, statt etwas zu erfinden) | Weitere Risiko-Kategorien bräuchten jeweils eigene reale Signal-Datenquellen | — | niedrig |
| AI Business Coach / CEO Intelligence | Opportunities | gleiche Endpunkte (`category=chance`) | gleiche Services | `vt_founder_business_insights` | Ja (gleiche Einschränkung wie Risks) | 1 | s.o. | — | niedrig |
| Auto Documentation (I) | Documentation Health | `GET /api/admin/founder/documentation/score` | `core/documentation_score.py` | `vt_documentation_registry`, echte Code-Scans (`documentation_scanner.py`) | Ja (verifiziert in diesem Audit) | 1 | — | — | — |
| CEO Intelligence (H) | Executive Scorecard (14 Dimensionen) | `.../ceo-intelligence/scorecard` | `executive_scorecard.py` | Aggregiert aus mehreren o. g. Tabellen | Ja, wo Quelle vorhanden — sonst ehrlich "nicht verfügbar" pro Dimension | 1/4 gemischt (dimensionsabhängig) | s.o. Stripe/Server/Backup-Lücken schlagen hier durch | s.o. | s.o. |
| Founder Autopilot (J) | Release Readiness | `.../autopilot/release-readiness` | `autopilot_release_readiness.py` | TypeScript/Lint/Tests/Build-Status | Bewusst konservativ: verifizierbare Checks zählen IMMER als "nicht verifizierbar" (kann nie automatisch "bereit" anzeigen) | 1 (Design-Entscheidung, kein Bug) | — | — | — |

## Zusammenfassung nach Status

- **Status 1 (vollständig funktionsfähig):** Nutzerzahlen, Premium-Nutzer,
  Datenbankstatus, Affiliate-Produkte, Automation Events, Automation Score,
  Founder Tasks (5 reale Bereiche), Founder Approvals, Strategic Goals,
  Documentation Health — **und neu seit dieser Session:** KI-Requests,
  KI-Tokenverbrauch, KI-Fehler (zentral über alle 7 KI-Aufrufstellen).
- **Status 2 (teilweise):** Stripe-Umsatz/Abonnements/Kündigungen/
  Rückerstattungen (Code seit 2026-08-01 fertig, wartet nur noch auf
  Migration 023 + Event-Abo im Stripe-Dashboard), Affiliate-Klicks/Verkäufe/Provisionen (real, aber
  selbst-getrackt statt Netzwerk-verifiziert), API-Status (trivial),
  Error Tracking (real, aber eng begrenzt), Build-/Release-/Backup-Status
  (real, aber manuell statt automatisiert), KI-Kosten (real, aber nur mit
  konfiguriertem Preis).
- **Status 4 (Datenquelle fehlt komplett):** Serverstatus, 11 von 16
  Task-Manager-Quellbereichen.
- **Status 5 (externe Zugangsdaten fehlen):** siehe
  [FOUNDER_OS_MISSING_INTEGRATIONS.md](FOUNDER_OS_MISSING_INTEGRATIONS.md) —
  betrifft dieselben Zeilen wie oben, sobald die interne Seite bereitsteht.
- **Status 3 (nur UI) / 6 (fehlerhaft):** In diesem Audit wurde **keine**
  einzige Kennzahl gefunden, die nur UI ohne jeglichen Backend-Aufruf ist,
  oder die nachweislich falsche Werte zurückgibt. Jede Founder-OS-Seite ruft
  einen echten Endpoint auf — das ursprüngliche Problem war ausschließlich
  fehlende Datenquellen/externe Integrationen (Status 4/5), nicht Fake-UI.
