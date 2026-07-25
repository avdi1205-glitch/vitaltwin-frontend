# Founder Incident Mode

## Aktivierung

`POST /autopilot/incidents/activate` (nur `manage_founder_autopilot` ==
`super_admin`) — erstellt einen `vt_founder_autopilot_incidents`-Eintrag
und setzt den Autopilot-Modus automatisch auf `incident_mode`.

## Verhalten im Incident Mode

- `allowed_categories_for_current_state()` liefert nur
  `system_monitoring`/`api_monitoring` — alle anderen automatischen
  Kategorien (Affiliate, Business, Reports, Dokumentation, …) sind
  blockiert.
- Kritische Alerts werden weiterhin priorisiert und angezeigt.
- Neue Kampagnen/Releases sind ohnehin **immer** manuell (siehe "Always
  Manual" in [FOUNDER_AUTOPILOT_SECURITY.md](./FOUNDER_AUTOPILOT_SECURITY.md))
  — der Incident Mode verstärkt diese Sperre nur zusätzlich für die
  sonst im `controlled_autopilot`-Modus erlaubten Kategorien.
- Keine automatische Datenlöschung, keine automatische
  Sicherheitsänderung — es gibt schlicht keine solche Aktion in der
  Safe Action Registry (Submodul G), unabhängig vom Modus.

## Beendigung

`POST /autopilot/incidents/{id}/resolve` — markiert den Incident als
`geloest` und setzt den Modus zurück auf `assist` (den
Production-Standard) — **nicht** automatisch auf den vorherigen Modus,
um ein versehentliches stilles Wiederaufnehmen von
`controlled_autopilot` zu vermeiden.

## Bekannte Grenzen

- Es gibt (bewusst) keine automatische Incident-Erkennung aus einem
  externen Monitoring-System — Aktivierung erfolgt durch Founder/Super
  Admin oder ein ausdrücklich erlaubtes, bereits im System vorhandenes
  kritisches Ereignis (z. B. mehrfach fehlgeschlagene Automationen, über
  die Smart-Alert-Erkennung sichtbar gemacht — die Aktivierung selbst
  bleibt aber immer ein expliziter Aufruf, nie vollautomatisch).
