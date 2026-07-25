# Founder Autopilot Modes

## Die 6 Modi

| Modus | Verhalten |
|---|---|
| `off` | Keine Automationen aus Founder Autopilot. |
| `monitor` | Nur beobachten/analysieren, nie ausführen. |
| `assist` | Sichere Aktionen vorbereiten, Freigabe bleibt erforderlich. **Standard in Production.** |
| `controlled_autopilot` | Freigegebene Low-Risk-Automationen (Kategorien aus aktiven Policies) laufen selbstständig über Submodul G. |
| `maintenance` | Nur technische Wartungskategorien (`system_monitoring`, `api_monitoring`, `backups`, `tests`). |
| `incident_mode` | Nur `system_monitoring`/`api_monitoring` — alles andere pausiert. |

`core/autopilot_state.py::allowed_categories_for_current_state()` ist die
einzige Stelle, die den Modus in eine Kategorie-Allowlist übersetzt.

## Aktivierung

`controlled_autopilot` darf **nur durch Founder oder Super Admin**
aktiviert werden — technisch garantiert dadurch, dass
`manage_founder_autopilot` ausschließlich `super_admin` besitzt (siehe
[FOUNDER_AUTOPILOT_SECURITY.md](./FOUNDER_AUTOPILOT_SECURITY.md)).

## Zusammenspiel mit Policies

Modus UND Policy schränken gemeinsam ein (logisches UND, nie ODER):
`effective_categories = allowed_categories_for_current_state() ∩
autopilot_policies.effective_allowed_categories()`. Selbst im
`controlled_autopilot`-Modus läuft nichts automatisch, wenn keine
passende, aktive Policy existiert.

## Bekannte Grenzen

- Es gibt keine automatische Rückkehr von `incident_mode` zu `assist` —
  das Beenden eines Incidents (`resolve_incident`) muss explizit
  ausgelöst werden, um versehentliches stilles Wiederaufnehmen zu
  vermeiden.
