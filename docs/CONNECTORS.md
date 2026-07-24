# VitalTwin — Health & Wearable Connectors (CONNECTORS.md)

> Status aller in `core/integrations.py::get_health_connectors()`
> definierten Connectoren. **Alle 9 sind `not_implemented`** — es existiert
> aktuell kein einziger OAuth-Flow, kein Daten-Sync-Job und kein
> gespeicherter Health-Datensatz von einem externen Wearable/Sensor in
> diesem Codebase. Dieses Dokument ist bewusst eine ehrliche
> Bestandsaufnahme, keine Ankündigung.

## Warum noch keiner implementiert ist

Jeder dieser Connectoren erfordert mindestens eines der folgenden, bevor
überhaupt Code geschrieben werden kann:

- eine native App (iOS/Android) statt nur der bestehenden Web-/Capacitor-
  WebView-App,
- eine Registrierung/Freigabe bei einem Drittanbieter (teils mit
  Wartezeit oder Partnerschaftspflicht),
- einen laufenden Sync-/Hintergrundjob, den es in diesem Backend noch
  nicht gibt (kein Cron/Queue-System aufgebaut, siehe
  [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md)).

## Die 9 Connectoren

| ID | Name | Voraussetzung |
|---|---|---|
| `apple_health` | Apple Health (HealthKit) | Natives iOS-Projekt (kein Capacitor-iOS-Projekt vorhanden) |
| `google_health_connect` | Google Health Connect | Android Health-Connect-API + Play-Console-Freigabe |
| `fitbit` | Fitbit | OAuth2-App-Registrierung bei fitbit.com/dev |
| `garmin` | Garmin | Garmin Connect Developer Program (antragspflichtig) |
| `oura` | Oura Ring | OAuth2-App-Registrierung über Oura Cloud API |
| `polar` | Polar | Polar AccessLink API (OAuth2-App-Registrierung) |
| `withings` | Withings | Withings Health API (OAuth2-App-Registrierung) |
| `abbott_libre` | Abbott Libre (LibreView) | Kein bekanntes Self-Service-API — Partnerschaft mit Abbott nötig |
| `dexcom` | Dexcom | Dexcom Developer API (Sandbox- und Production-Freigabe) |

## Was "Implementierung" für einen Connector konkret bedeuten würde

1. OAuth2-Client-Registrierung beim jeweiligen Anbieter, Client-ID/Secret
   in `.env` (siehe [API_KEYS.md](./API_KEYS.md) für das Namensschema).
2. Ein Router (`routers/connectors/<name>.py`) mit `/connect`-,
   `/callback`- und `/disconnect`-Endpunkten.
3. Eine Tabelle für gespeicherte OAuth-Tokens pro Nutzer (noch nicht
   angelegt — keine `vt_connector_tokens`-Tabelle existiert).
4. Ein Sync-Job, der periodisch neue Daten abruft und in die bestehenden
   Wellness-/Check-in-Tabellen schreibt (Datenmodell aus
   `migrations/001_profile_wellness_foundation.sql` ff.).
5. Einen neuen Eintrag in `core/integrations.py::get_health_connectors()`
   mit `implemented=True` und echtem `_env_present(...)`-Check — erst dann
   darf der Status im Admin-UI als "Konfiguriert" erscheinen.

Bis dahin bleibt der ehrliche Status `not_implemented`, sichtbar unter
`GET /api/admin/integrations` und in der Admin-Seite
`/admin/integrations`.
