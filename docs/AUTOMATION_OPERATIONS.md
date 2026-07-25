# Automation Operations (Dry Run, Alerting, Integrationen)

## Dry Run

`POST /automation/rules/{id}/dry-run` — führt **keine** echte Aktion aus.
Zeigt: erkannten Trigger, erfüllte Bedingungen, verwendeten Kontext,
Vorschau je Aktion (würde ausgeführt / blockiert + Grund), ob eine
Freigabe nötig wäre, und ob bereits ein Lauf mit demselben
Idempotency-Key existiert (mögliches Duplikat). Schreibt nur einen
Audit-Event, niemals einen `vt_automation_runs`-Datensatz.

## Alerting

`core/automation_engine.py::create_or_refresh_alert()` — dedupliziert
über `dedupe_key` (z. B. `automation_dead_letter_alert_{run_id}`),
priorisiert über `severity`. Alerts werden erzeugt bei:

- maximale Wiederholungsversuche erreicht (Dead Letter)
- (weitere Alert-Quellen können künftig denselben Helper wiederverwenden,
  ohne ein zweites Alert-System zu bauen)

Kein Spam: ein bereits offener Alert mit demselben `dedupe_key` wird nur
aktualisiert (Severity/Message), nie dupliziert; ein `archiviert`er Alert
wird nie automatisch wieder geöffnet.

## Integrationen

### Task Manager (Submodul C)

`core/automation_engine.py::_create_or_refresh_task()` schreibt direkt
(idempotent via `dedupe_key`) in `vt_founder_tasks` — bei: Workflow
fehlgeschlagen (Dead Letter), Aktion `task_erstellen`. Reuses die exakt
gleiche Upsert-Semantik wie `core/founder_task_detector.py`.

### Smart Approval Center (Submodul D)

Siehe [AUTOMATION_APPROVALS.md](./AUTOMATION_APPROVALS.md) — vollständig
wiederverwendet, kein Parallelsystem.

### Daily Briefing (Submodul B)

`core/automation_engine.py::get_daily_briefing_summary()` liefert
`auto_completed_today`, `failed_today`, `awaiting_approval`,
`important_warnings` — additiv in
[`routers/founder_briefing.py`](../app/) unter dem neuen Feld
`"automation"` in der bestehenden `GET /daily-briefing`-Antwort
eingebunden (eine einzige zusätzliche Zeile im bestehenden Response-Dict,
kein neuer Briefing-Mechanismus).

### AI Business Coach (Submodul E)

Der bestehende `GET /business-coach/automation-score`-Endpunkt (aus
Submodul E, bereits vor Submodul G vorhanden) bleibt unverändert
bestehen — er misst ausschließlich die Automatisierung von
Business-Coach-eigenen Insights/Tasks/Approvals. Submodul G's *eigener*
`GET /automation/automation-score` (siehe
[AUTOMATION_SCORE.md](./AUTOMATION_SCORE.md)) ist umfassender (alle
Regel-Kategorien) und **ersetzt ihn nicht** — beide koexistieren bewusst,
da sie unterschiedliche Fragen beantworten. Keine individuellen
Nutzerdaten fließen in beide ein.

### Affiliate Intelligence (Submodul F)

Die Aktionen `link_pruefen` und `affiliate_produkt_pausieren` rufen
direkt in bestehende Affiliate-Funktionen (`affiliate_link_checker`,
`vt_affiliate_products`-Statusupdate). Eine automatische Freigabe neuer
*sensibler* Produkte ohne Regel+Approval ist ausgeschlossen — Produkte
werden nie automatisch auf `approved`/`active` gesetzt, nur pausiert
(reversibel) oder zur Prüfung markiert.

## Umgebungen (Development/Staging/Production)

`environment`-Feld pro Regel. In `production`: neue Regeln werden immer
`enabled=false`+`status='entwurf'` erstellt; Medium/High-Risk-Aktivierung
erfordert immer eine Freigabe, unabhängig vom Environment-Wert.

## Rollout-Stufen

`rollout_stage` (nur_founder / entwicklung / staging / ein_prozent /
begrenzte_kategorie / vollstaendig_aktiv) ist ein Feld pro Regel — bewusst
**kein** Eintrag im generischen `vt_feature_flags`-System (Platform
Foundation), um nicht für jede einzelne Regel einen globalen Feature-Flag
anzulegen. Es gibt keine automatische globale Aktivierung — jede Stufe
wird vom Gründer manuell gesetzt.
