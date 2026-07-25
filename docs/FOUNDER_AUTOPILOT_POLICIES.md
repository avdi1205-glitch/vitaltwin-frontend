# Founder Autopilot Policies

## Felder

`name`, `description`, `mode`, `allowed_categories`, `blocked_categories`,
`maximum_risk_level`, `approval_policy`, `financial_threshold`,
`execution_window`, `allowed_environments`, `rollback_required`,
`audit_required`, `enabled`, `status`, `version`, `previous_versions`,
`created_by`, `created_at`, `updated_at`.

## Validierung (`core/autopilot_policies.py::validate_policy_payload`)

- `maximum_risk_level == "critical"` wird **immer** abgelehnt.
- Jede Kategorie in `ALWAYS_MANUAL_CATEGORIES` (Preise, Tarife, Budgets,
  Verträge, Rechtliches, Datenschutz, Sicherheitsrichtlinien,
  API-Schlüssel, Produktions-Releases, Branding, Strategie) wird
  **immer** abgelehnt, egal welches Risk Level angegeben ist.

## Sichere Aktionen (Safe Autopilot Actions)

Nur Kategorien aus `automation_registry.CATEGORIES_WITH_REAL_ACTIONS`
(Submodul G) können effektiv wirksam werden — eine Policy kann
theoretisch mehr Kategorien "erlauben", aber
`effective_allowed_categories()` schneidet immer mit der Safe Action
Registry, sodass nie eine nicht-implementierte oder kritische Aktion
freigeschaltet wird.

## Versionierung

Jede Änderung bumpt `version` und hängt einen Snapshot der vorherigen
Version an `previous_versions` (JSONB-Array, kein separates
Versions-Table nötig für diesen kleineren Datensatz). Jede Änderung
setzt die Policy automatisch zurück auf `status='entwurf'`,
`enabled=false` — eine geänderte Policy muss immer erneut aktiviert
werden.

## Aktivieren / Pausieren

`activate_policy()`/`pause_policy()` — beide nur mit
`manage_founder_autopilot` (== `super_admin`), konsistent mit "Nur
Founder oder Super Admin dürfen Production Policies ändern".

## Bekannte Grenzen

- `financial_threshold` ist ein Konfigurationsfeld, keine echte
  Euro-Durchsetzung (kein Kosten-Tracking in dieser Codebase).
- `execution_window` wird gespeichert, aber die Zeitfenster-Prüfung
  selbst erfolgt (wie bei Submodul G) über den Trigger-Kontext der
  jeweiligen Automatisierungsregel, nicht durch die Policy direkt
  erzwungen.
