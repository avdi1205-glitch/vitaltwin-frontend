# Automation Engine (Founder OS — Submodul G)

## Zweck

Die Automation Engine automatisiert wiederkehrende operative
Gründeraufgaben und verbindet die bestehenden Founder-OS-Submodule
(Dashboard, Daily Briefing, Task Manager, Smart Approval Center, AI
Business Coach, Affiliate Intelligence). Sie ist **kein Bestandteil des
Digital Twins** — sie verarbeitet ausschließlich Founder-OS-Daten,
aggregierte Geschäftsdaten, Systemereignisse und freigegebene operative
Aufgaben.

## Route-Konsolidierung (Abweichung von der Spec)

Die Spezifikation forderte eine neue Route `/admin/founder/automation`.
Wie bei allen vorherigen Founder-OS-Submodulen wurde stattdessen ein
siebter Tab „Automation Engine" in der bestehenden, konsolidierten Seite
[`/admin/founder`](../app/admin/founder/page.tsx) ergänzt
(`AutomationEngineTab()`), um Fragmentierung zu vermeiden. Der Tab wird
nur angezeigt, wenn der eingeloggte Admin die Berechtigung
`view_automation_engine` besitzt (siehe unten).

## Kein Hintergrund-Scheduler

Es existiert kein Celery/Redis/Cron-Prozess in dieser Codebase (Railway,
Single-Prozess). Zeitgesteuerte Regeln werden — konsistent mit jedem
anderen Founder-OS-Submodul ("on read") — beim Laden des
Automation-Dashboards **oder** durch einen expliziten Aufruf von
`POST /api/admin/founder/automation/run-due` ausgewertet. Ein externer
Cron-Aufruf (z. B. GitHub Actions Schedule) kann optional gegen diesen
Endpunkt konfiguriert werden — das ist ein manueller Einrichtungsschritt
des Gründers, keine mitgelieferte Infrastruktur.

## Architektur-Überblick

- `core/automation_registry.py` — Safe Action Registry (siehe
  [AUTOMATION_SECURITY.md](./AUTOMATION_SECURITY.md))
- `core/automation_conditions.py` — AND/OR-Bedingungsauswertung
- `core/automation_engine.py` — Regel-CRUD, Versionierung, Dry Run,
  Ausführung, Retry, Rollback, Freigabe-Integration
- `core/automation_opportunity_detector.py` — Automatisierungsvorschläge
- `core/automation_score.py` — echter Automatisierungsgrad
- `routers/founder_automation.py` — API, mounted unter
  `/api/admin/founder`

## Datenmodell

5 neue Tabellen (`migrations/017_founder_automation_engine.sql`):
`vt_automation_rules` (+ `vt_automation_rule_versions` für Historie),
`vt_automation_runs`, `vt_automation_dead_letters`,
`vt_automation_opportunities`, `vt_automation_alerts`. Erweitert
**keine** bestehende Tabelle destruktiv — nur additive neue Tabellen.

## Berechtigungen

Zwei neue, bewusst **nicht** in `admin`s automatischen Vollzugriff
übernommene Permissions: `view_automation_engine`/
`manage_automation_engine` (siehe
[AUTOMATION_SECURITY.md](./AUTOMATION_SECURITY.md) für die vollständige
Begründung dieser Abweichung vom sonst geteilten
`view_founder_os`/`manage_founder_os`-Paar).

## Bekannte Grenzen

- Kein Hintergrund-Scheduler (siehe oben).
- "Timeout" ist best-effort (kein hartes OS-Level-Timeout möglich in der
  synchronen Request-Architektur) — ein Timeout-Wert wird pro Aktion
  gespeichert, aber nicht durch harte Prozess-Terminierung erzwungen.
- Mehrere im Auftrag genannte Aktionen sind bewusst NICHT implementiert
  (siehe [AUTOMATION_RULES.md](./AUTOMATION_RULES.md)), da keine reale
  Infrastruktur dahinter existiert.
- Kein Multi-Tenant-Mandantenmodell — Environment-Unterscheidung
  (development/staging/production) ist ein Feld auf der Regel, keine
  getrennte Infrastruktur (Single-Deployment-App).
