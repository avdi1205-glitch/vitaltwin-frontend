# Founder Autopilot (Founder OS — Submodul J)

## Zweck

Founder Autopilot ist die zentrale Orchestrierungs- und Bedienebene für
alle Founder-OS-Submodule A–I. Es bündelt Today View, Decision Inbox,
Autopilot-Modi, Policies, Kill Switch, Incident Mode, Daily Plan, Weekly
Review, Smart Alerts, Automation Opportunity Center, Automation Score
und Release Readiness — **ohne eine zweite Automation Engine zu bauen**.

## Route-Konsolidierung (Abweichung von der Spec)

Die Spezifikation forderte eine neue Route `/admin/founder/autopilot`.
Wie bei allen vorherigen Founder-OS-Submodulen wurde stattdessen ein
zehnter Tab „Founder Autopilot" in der bestehenden, konsolidierten Seite
[`/admin/founder`](../app/admin/founder/page.tsx) ergänzt
(`FounderAutopilotTab()`), sichtbar nur mit `view_founder_autopilot`.

## Keine zweite Automation Engine

Founder Autopilot **nutzt Submodul G als alleinige Ausführungs-Engine**
(`core/automation_engine.py::evaluate_and_run_due_rules()`). Der
Orchestrator (`core/autopilot_orchestrator.py::run_orchestration_cycle()`)
entscheidet nur, **ob** G überhaupt laufen darf (Kill Switch, Modus,
Policy-Kategorien) — die eigentliche Ausführung, Retry-Logik, Rollback
und Safe Action Registry bleiben unverändert in G.

## Architektur-Überblick

- `core/autopilot_state.py` — Modus, Kill Switch, Incident Mode
- `core/autopilot_policies.py` — Policies (Validierung gegen
  `ALWAYS_MANUAL_CATEGORIES`)
- `core/autopilot_events.py` — Event-Synthese aus C/D/F/G/I (kein
  Message-Bus, "on read" wie überall sonst)
- `core/autopilot_priority.py` — Priority Engine + Founder Attention Score
- `core/autopilot_alerts.py` — Smart Alerts (nur reale Signale)
- `core/autopilot_orchestrator.py` — Today View, Decision Inbox,
  One-Click Approval, Orchestrierungszyklus
- `core/autopilot_planning.py` — Daily Plan (max. 3+3+3+3) + Weekly Review
- `core/autopilot_module_health.py` — Modul-Status A–I
- `core/autopilot_release_readiness.py` — konservative Release-Ansicht
- `core/autopilot_score.py` — Founder-OS-weiter Automation Score +
  Work-Saved-Schätzung

## Datenmodell

5 neue Tabellen (`migrations/020_founder_autopilot.sql`):
`vt_founder_autopilot_state` (Modus-Historie), `vt_founder_autopilot_policies`,
`vt_founder_autopilot_events`, `vt_founder_autopilot_alerts`,
`vt_founder_autopilot_incidents` + `vt_founder_autopilot_kill_switch_events`,
`vt_founder_autopilot_queries`. Daily Plan/Weekly Review werden — wie
Executive Summary und Daily Briefing — frisch berechnet, nicht
gespeichert.

## Berechtigungen

`view_founder_autopilot`/`manage_founder_autopilot` — `manage_*` wird
**ausschließlich** an `super_admin` vergeben (keine schmale
"autopilot_manager"-Rolle wie bei G/H/I), `executive_analyst` erhält
zusätzlich `view_founder_autopilot` (Lesezugriff). `admin` ist
ausgeschlossen.

## Bekannte Grenzen

- Mehrere im Auftrag genannte Smart-Alert-Beispiele (Stripe-Zahlungsfehler,
  KI-Kostenanstieg, überfällige Backups, fehlgeschlagene Produktions-Builds)
  haben keine reale Datenquelle in dieser Codebase — sie sind bewusst
  NICHT implementiert (siehe [FOUNDER_AUTOPILOT_SECURITY.md](./FOUNDER_AUTOPILOT_SECURITY.md)).
- Kostenlimits sind Konfigurationsfelder auf Policies, aber keine echte
  Euro-Durchsetzung, da kein Kosten-Tracking existiert (durchgängige
  Ehrlichkeits-Konvention dieses Projekts).
