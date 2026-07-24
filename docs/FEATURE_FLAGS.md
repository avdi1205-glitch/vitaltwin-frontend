# VitalTwin — Feature Flags (FEATURE_FLAGS.md)

> Beschreibt das Feature-Flag-System aus `vt_feature_flags` +
> `routers/admin.py`. Real implementiert und nutzbar — kein Platzhalter.

## Datenmodell

Tabelle `vt_feature_flags` (`migrations/011_platform_foundation.sql`):

| Spalte | Typ | Zweck |
|---|---|---|
| `key` | `text` (Primary Key) | Eindeutiger Flag-Name, z. B. `new_dashboard_layout` |
| `enabled` | `boolean` | Aktueller Zustand |
| `description` | `text` | Freitext-Erklärung, was der Flag steuert |
| `updated_by` | `text` | E-Mail des Admins, der zuletzt geändert hat |
| `updated_at` | `timestamptz` | Letzter Änderungszeitpunkt |

Es gibt **keine Ablauf-/Zeitplan-Logik** (kein "aktiv ab/bis") und **keine
Zielgruppen-/Prozent-Rollout-Logik** (kein A/B-Testing) — ein Flag ist
entweder global an oder aus. Beides sind mögliche spätere Erweiterungen,
aber aktuell nicht gebaut; dieses Dokument behauptet nichts anderes.

## API

Beide Endpunkte in `backend/app/routers/admin.py`:

### `GET /api/admin/feature-flags`

- Berechtigung: `view_integrations`.
- Gibt `{"items": [...]}` mit allen Zeilen aus `vt_feature_flags`, sortiert
  nach `key`, zurück.
- Bei einem Datenbankfehler wird eine leere Liste zurückgegeben (kein
  500 nur wegen fehlender Tabelle) — analog zum bestehenden Muster in
  anderen "noch nicht vollständig" Bereichen des Admin-Routers.

### `PUT /api/admin/feature-flags/{key}`

- Berechtigung: `manage_feature_flags`.
- Body: `{"enabled": bool, "description"?: string}`
  (`FeatureFlagInput`-Pydantic-Modell).
- Führt ein `upsert` gegen `vt_feature_flags` aus (legt den Flag an, falls
  er noch nicht existiert, oder aktualisiert ihn).
- Setzt automatisch `updated_by` (E-Mail des aufrufenden Admins) und
  `updated_at` (aktueller UTC-Zeitstempel) — beides serverseitig, nicht
  vom Client übernehmbar.
- Feuert ein Audit-Event (`record_audit_event`, `action="update"`,
  `entity_type="feature_flag"`) — sichtbar im Security-Center
  (`/admin/security`, Audit-Log).

## Wer darf was

| Berechtigung | Erlaubt |
|---|---|
| `view_integrations` | Flags lesen (Liste) |
| `manage_feature_flags` | Flags anlegen/ändern |

Beide Berechtigungen sind Teil der regulären RBAC-Matrix
(`core/admin_rbac.py::ROLE_PERMISSIONS`) — `super_admin`/`admin` haben
automatisch beide, `analyst` und `developer` haben nur `view_integrations`
(read-only), alle anderen Rollen keine der beiden.

## Admin-UI

`frontend/app/admin/integrations/page.tsx` zeigt unterhalb der
Integrations-Karten einen Feature-Flag-Bereich (nur sichtbar mit
`manage_feature_flags`-Berechtigung dank `hasPermission()`): jeder Flag als
Karte mit Name, Beschreibung und einem Toggle-Button, der direkt
`PUT /api/admin/feature-flags/{key}` aufruft und danach neu lädt.

## Wie man einen neuen Flag einführt

Es gibt **keine Migration nötig**, um einen neuen Flag anzulegen — ein
Flag entsteht einfach durch den ersten `PUT`-Aufruf mit einem neuen `key`
(Upsert-Semantik). Empfohlener Ablauf:

1. Im Admin-UI unter `/admin/integrations` (oder direkt per `PUT`-Aufruf)
   einen neuen `key` mit `enabled=false` und einer klaren `description`
   anlegen.
2. Im Anwendungscode (Backend oder Frontend) den Flag-Wert abrufen, bevor
   das neue Verhalten aktiv geschaltet wird — dafür existiert aktuell noch
   **kein** generischer Lese-Helfer im Anwendungscode (nur der Admin-
   Endpunkt liest die Tabelle); ein solcher Helfer (`is_feature_enabled(key)`)
   wäre die nächste sinnvolle Ausbaustufe, sobald der erste Flag
   tatsächlich Anwendungsverhalten steuern soll.
3. Erst danach im Admin-UI auf `enabled=true` umschalten.
