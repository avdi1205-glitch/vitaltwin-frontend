# Strategic Goals

## Wiederverwendung von Submodul E

Strategic Goals nutzt **dieselbe Tabelle** `vt_founder_business_goals`
(AI Business Coach, Submodul E) — keine parallele `ExecutiveGoal`-Tabelle.
CEO Intelligence ergänzt additiv 3 neue Zielkategorien in
`routers/founder_business_coach.py::ALLOWED_GOAL_CATEGORIES`:
`automatisierungsziel`, `release_ziel`, `internationales_wachstum`.

## Fortschrittsberechnung

Wiederverwendet `core/founder_business_goals.py::compute_goal_progress()`
/ `explain_goal_progress()` unverändert. `automatisierungsziel` hat einen
neuen, echten Resolver (`core/automation_score.py::compute_automation_score()`
→ `overall_percentage`); `release_ziel`/`internationales_wachstum` bleiben
bewusst ohne Resolver (kein Release-Tracking, keine Länder-/
Sprach-Aufschlüsselung der Nutzer in dieser Codebase).

## Forecast (neu, `core/executive_goals.py::forecast_goal()`)

Echte, aber vorsichtige Prognose:

- `current_pace_per_day = (current_value - start_value) / Tage seit Start`
- `required_pace_per_day = (target_value - current_value) / Tage bis Zieldatum`
- `estimated_completion_date` nur, wenn `current_pace > 0`
- `uncertainty`: `hoch` (< 14 Tage Datenbasis), `mittel` (< 30 Tage),
  `gering` (≥ 30 Tage)

Formulierung immer **"Bei gleichbleibender Entwicklung könnte …"** — nie
"wird garantiert erreicht". Ohne Start-/Zieldatum oder Zielwert:
`computable: false` mit Begründung.

## Status

`geplant`, `aktiv`, `im_plan`, `gefaehrdet`, `erreicht`, `verfehlt`,
`pausiert`, `archiviert` — identisch mit Submodul E's bestehendem
Status-Set (`ALLOWED_GOAL_STATUSES`), keine neuen Werte nötig.

## Berechtigungen

`GET .../ceo-intelligence/goals` benötigt `view_ceo_intelligence`;
Erstellen/Status ändern benötigt `manage_ceo_intelligence` (nur
`super_admin`) — abweichend von Submodul E's eigenen Endpunkten (die
`view_founder_os`/`manage_founder_os` nutzen). Beide Endpunkt-Familien
greifen auf dieselbe Tabelle zu; ein über Business Coach erstelltes Ziel
erscheint automatisch auch in CEO Intelligence und umgekehrt.

## Bekannte Grenzen

- Kein automatischer Forecast-Verlauf (keine gespeicherte Zeitreihe der
  Zielfortschritte) — die Pace-Berechnung nutzt ausschließlich Start- und
  aktuellen Wert.
