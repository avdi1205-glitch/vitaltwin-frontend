# Automation Rules

## AutomationRule-Felder

`id`, `name`, `description`, `category`, `trigger_type`,
`trigger_config`, `conditions`, `actions`, `risk_level`,
`approval_policy`, `retry_policy`, `timeout_seconds`, `max_runs`,
`run_count`, `enabled`, `status`, `environment`, `rollout_stage`,
`approved_once`, `version`, `created_at`, `updated_at`, `created_by`,
`last_run_at`, `next_run_at`.

## Kategorien

Alle 20 im Auftrag genannten Kategorien sind gültige `category`-Werte
(Affiliate, Business, Analytics, Reports, Support, SEO, Content,
Dokumentation, Releases, Tests, Backups, System Monitoring, API
Monitoring, KI-Kosten, Performance, Sicherheit, Integrationen,
Datenqualität, Founder Tasks, Founder Briefing). Wie beim Task Manager
und Smart Approval Center (nur 5 von 16 bzw. 4 von 13 Quellen mit echter
Erkennungsregel) haben aktuell nur folgende Kategorien echte, ausführbare
Aktionen dahinter: **Affiliate, Business, Analytics, Reports, System
Monitoring, API Monitoring, Integrationen, Founder Tasks, Founder
Briefing.** Die restlichen sind gültige, filterbare Labels für zukünftige
Regeln.

## Trigger-Typen

`schedule`, `manual`, `event`, `approval_granted`, `task_overdue`,
`threshold`. Da kein Event-Bus existiert, werden `event`/
`approval_granted`/`task_overdue`/`threshold`-Trigger bei jeder
Auswertung (Dashboard-Laden oder `run-due`) durch Abfrage des aktuellen
Datenbankzustands erkannt — nicht push-basiert.

## Bedingungen (AND/OR)

`core/automation_conditions.py::evaluate_condition()` unterstützt
verschachtelte `{"all": [...]}`/`{"any": [...]}`-Gruppen sowie die
Operatoren: `equals`, `not_equals`, `greater_than`, `less_than`,
`contains`, `missing`, `stale`/`age_in_days`, `failed_count`,
`consecutive_failures`, `cost_threshold`, `time_window`. Die im Auftrag
zusätzlich genannten „Bedingungstypen" `region`/`category`/`status`/
`role`/`approval_status` sind Feld-Kategorien, keine eigene
Vergleichslogik — sie werden als Gleichheits-Kurzform behandelt.

## Risk Levels

`low` / `medium` / `high` / `critical`. **`critical` wird bei der
Regel-Erstellung/-Aktualisierung hart abgelehnt** (`ValueError`) — siehe
[AUTOMATION_SECURITY.md](./AUTOMATION_SECURITY.md).

## Approval Policies

`no_approval`, `one_time_approval`, `always_require_approval`,
`founder_only`, `super_admin_only`, `approval_for_threshold`,
`approval_for_new_scope` — validiert gegen eine feste Liste in
`core/automation_registry.py`.

## Versionierung

Jede Erstellung/Änderung schreibt einen Snapshot in
`vt_automation_rule_versions` (`GET .../rules/{id}/versions`). Eine
Änderung an `risk_level` auf `medium`/`high` setzt die Regel automatisch
zurück auf `status='entwurf'`, `enabled=false`, `approved_once=false` —
eine alte Freigabe darf nie stillschweigend für neue Bedingungen/Aktionen
weitergelten.

## Aktivierung

`POST .../rules/{id}/activate`:
- `risk_level='low'` + `approval_policy='no_approval'` → sofort `aktiv`.
- Sonst → erstellt eine Freigabeanfrage im Smart Approval Center
  (`related_entity_type='automation_rule'`) und setzt die Regel auf
  `wartet_auf_freigabe`. Die eigentliche Aktivierung passiert als
  Seiteneffekt der Freigabe-Entscheidung in
  `routers/founder_approval.py` — **wiederverwendet**, nicht dupliziert.

## Retry / Dead Letter

`retry_policy = {"type": "none"|"fixed", "max_attempts": int,
"cooldown_seconds": int}`. Ein fehlgeschlagener Lauf bleibt bei
`attempt < max_attempts` in `fehlgeschlagen_wird_wiederholt` offen; beim
nächsten Auswertungsdurchlauf (nach Ablauf des Cooldowns) wird **derselbe**
Run erneut versucht. Nach Erreichen von `max_attempts` wandert der Lauf
in `dead_letter`, erzeugt einen Task-Manager-Task, einen Founder Alert
und einen Audit-Event.

## Rollback

Nur Aktionen mit `reversible=True` in der Safe Action Registry
schreiben `previous_state` — nur diese Läufe können per
`POST .../runs/{id}/rollback` zurückgerollt werden, und nur einmal.
