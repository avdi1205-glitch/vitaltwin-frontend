# VitalTwin — Datenarchitektur (DATA_ARCHITECTURE.md)

> Erstellt in **Etappe 2 (Twin Intelligence Core)**. Beschreibt, wie und wo
> VitalTwin persönliche Nutzerdaten dauerhaft speichert. Muss mit
> [VITALTWIN_CONSTITUTION.md](./VITALTWIN_CONSTITUTION.md) übereinstimmen.

## Grundprinzip

Die Datenbank (Supabase/Postgres) ist die **einzige verbindliche Quelle der
Wahrheit** für dauerhafte Nutzerdaten. Folgendes wird **nicht** als primäre
Datenhaltung verwendet:

- `localStorage` / `sessionStorage` (aktuell noch für Gewohnheiten im
  Dashboard-Widget genutzt — **bekannte Abweichung**, siehe „Bekannte
  Risiken und Lücken" unten; wird in Etappe 3 auf die Datenbank umgestellt)
- React State
- statische JSON-Dateien
- fest codierte Arrays
- Cookies

## Stack

- **Datenbank:** Supabase (verwaltetes Postgres), angesprochen über den
  `supabase-py`-Client — **kein Prisma**, kein ORM. Schema wird über
  handgeschriebene SQL-Migrationsdateien in `backend/migrations/` gepflegt
  und manuell im Supabase SQL-Editor ausgeführt (kein automatisierter
  Migrationsrunner).
- **Backend:** FastAPI (Python), Router unter `backend/app/routers/`,
  gemeinsame Bausteine unter `backend/app/core/`.
- **Frontend:** Next.js/React — enthält **keine** Datenbanklogik; jede
  Seite ruft die FastAPI-Routen über `fetch` auf.

## Nutzertrennung (Etappe 2)

- `userId` wird **niemals** aus dem Frontend übernommen.
- Jede Anfrage bestimmt den Nutzer serverseitig über
  `backend/app/core/auth.py`:
  - `require_email(authorization)` — löst die E-Mail aus dem Session-JWT auf.
  - `require_user(authorization)` — löst zusätzlich die stabile
    `vt_users.id` (bigint) auf und gibt ein `CurrentUser(email, user_id)`
    zurück.
  - `assert_owns(resource_user_id, current)` — Eigentumsprüfung für einen
    einzelnen Datensatz. Gibt bei jeder Abweichung **404** zurück (nie 403),
    damit erratene IDs nicht zwischen „existiert nicht" und „gehört dir
    nicht" unterscheiden lassen.

### Übergangszustand: `email` vs. `user_id`

Die ursprünglichen Tabellen (`vt_user_profiles`, `vt_daily_wellness_entries`,
`vt_habits`, `vt_habit_entries`) verlinken Datensätze über eine `email`-Spalte
(text), nicht über eine Fremdschlüsselbeziehung. Etappe 2 fügt allen diesen
Tabellen zusätzlich eine **nullable** `user_id`-Spalte hinzu (FK auf
`vt_users.id`), ohne die bestehende `email`-Spalte zu entfernen oder
Bestandsdaten zu verändern. Alle **neuen** Tabellen (siehe
`DATA_DICTIONARY.md`) verwenden von Anfang an `user_id` als primären
Besitz-Schlüssel.

Ein Backfill-Skript, das `user_id` für bestehende Zeilen anhand von `email`
nachträgt, ist **nicht** Teil von Etappe 2 (destruktive/datenverändernde
Aktion, erfordert ausdrückliche Freigabe) und für eine spätere Etappe
vorgesehen.

## Zeit und Zeitzone

- Jede Tabelle mit Tagesbezug (`vt_daily_wellness_entries`, `vt_daily_plans`,
  `vt_daily_reflections`, `vt_weekly_reflections`) speichert sowohl ein
  lokales Datum (`entry_date`/`local_date`, ohne Uhrzeit) als auch eine
  `timezone`-Spalte (IANA-Name, z. B. `Europe/Berlin`, validiert über
  `core/validation.py::validate_timezone_name`).
- Zeitstempel (`created_at`, `updated_at`) werden immer als `timestamptz`
  (UTC) gespeichert — die Umrechnung in den lokalen Kalendertag geschieht in
  der Anwendungsschicht anhand der gespeicherten Zeitzone, nicht anhand der
  Serverzeit.
- Ein Tageswechsel durch Reisen/Zeitzonenwechsel führt nicht automatisch zu
  einer Neuberechnung vergangener `local_date`-Werte — diese bleiben so
  gespeichert, wie sie zum Zeitpunkt der Eingabe lokal galten.

## Datenquellen und Datenqualität

Siehe `core/validation.py`:

- `DataSource`: `manual`, `onboarding`, `check_in`, `wearable`, `imported`,
  `calculated`, `ai_generated`. Wearables sind noch nicht angebunden — der
  Wert ist reserviert, damit eine spätere Anbindung keine Migration
  benötigt.
- `DataQuality`: `missing`, `partial`, `user_reported`, `calculated`,
  `imported`, `verified_source`, `outdated`, `conflicting`.

**Regel:** Berechnete oder KI-generierte Werte werden niemals mit
`source = "manual"` oder `data_quality = "user_reported"` gespeichert — sie
müssen als solche erkennbar bleiben (Constitution: „keine falsche
Genauigkeit").

## Validierung

Zentral in `backend/app/core/validation.py` (keine Duplikate pro Router):
1-10-Skalen (Energie, Stimmung, Stress, Motivation, Schlafqualität,
Erholung), Schlafdauer (0-16h), Bewegungsminuten (0-1440, nie negativ),
Zukunftsdatum-Ablehnung, Text-Maximallängen (kurz: 200, lang: 2000
Zeichen), IANA-Zeitzonen-Prüfung. Jede Regel wirft `ValueError` mit
nutzerverständlicher deutscher Meldung — keine stillen Korrekturen.

## Audit

`backend/app/core/audit.py::record_audit_event(...)` schreibt append-only
nach `vt_audit_events` (siehe Migration). Erfasst: `create`, `update`,
`delete`, `export_request`, `deletion_request`, `consent_change`. Speichert
niemals vollständige Freitexte, Passwörter oder Tokens — nur strukturierte
Metadaten. Ein fehlgeschlagener Audit-Write blockiert nie die eigentliche
Anfrage (best effort).

## Bekannte Risiken und Lücken (ehrlich dokumentiert)

1. **Migration nicht live getestet.** In dieser Session stand keine
   Datenbankverbindung zur Verfügung (`SUPABASE_URL`/`SUPABASE_KEY` nicht
   gesetzt). `003_twin_intelligence_foundation.sql` wurde nur auf
   Syntax/Konsistenz geprüft, nicht gegen eine echte Postgres-Instanz
   ausgeführt.
2. **Kein DB-Backfill.** `user_id` ist für Bestandsdaten aller
   vorbestehenden Tabellen `NULL`, bis ein separates Backfill-Skript läuft.
3. **Gewohnheiten im Dashboard-Widget** ([dashboard-habits.tsx](../app/components/dashboard-habits.tsx))
   nutzen weiterhin `localStorage`, obwohl `vt_habits`/`vt_habit_entries`
   bereits existieren und von der Profil-Seite genutzt werden — Umstellung
   ist für Etappe 3 vorgesehen.
4. **In-Memory-Zustände bleiben bestehen:** `users_store` (users.py) und der
   Rate-Limiter (`core/rate_limit.py`) sind weiterhin pro Prozess, nicht Teil
   von Etappe 2.
5. **Datenbanktests fehlen.** Unique-Constraint-Tests (z. B. „ein
   Check-in pro Nutzer und Tag") konnten nur als SQL-Definition geprüft,
   nicht gegen eine echte Datenbank ausgeführt werden.
