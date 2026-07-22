# VitalTwin — Twin Feedback Loops (TWIN_FEEDBACK_LOOPS.md)

> Erstellt in **Etappe 3 (Twin Intelligence Core)**, erweitert in **Etappe 4**.
> Dokumentiert die in diesen Etappen **echt implementierten** Loops (Daily
> Check-in, Sleep/Movement/Stress-Recovery, Habit, Goal, sowie in Etappe 4 der
> Recommendation-/Decision-/Outcome-/Feedback-Loop) — mit echter
> Datenbankanbindung, nicht nur als Konzept wie im Constitution-Kapitel "Core
> Learning Loops".

## 1. Daily Check-in Loop

**Endpunkte:** `PUT /api/profile/daily` (Upsert), `GET /api/profile/daily/today`,
`GET /api/profile/daily?days=N`, `DELETE /api/profile/daily/{entry_date}`.

**Felder und Wertebereiche** (alle optional, validiert in
`app/routers/profile.py::DailyWellnessEntryInput` über
`app/core/validation.py`):

| Feld | Bereich | Neu in Etappe 3? |
|---|---|---|
| `mood` (Stimmung) | 1-10 | ja (Etappe 2 Spalte, Etappe 3 UI) |
| `energy` (Energie) | 1-10 | **ja, neu** |
| `stress` (Stress) | 1-10 | **ja, neu** |
| `motivation` | 1-10, optional | ja |
| `sleep_quality` (Schlafqualität) | 1-10 | ja |
| `recovery` (Erholung) | 1-10, optional | ja |
| `sleep_hours` (Schlafdauer) | 0-16 Std. | bereits vorhanden |
| `movement_minutes` (Bewegung) | 0-1440 Min., nie negativ | **ja, neu** |
| `water_habit` | wenig/mittel/viel, optional | bereits vorhanden |
| `note` (Notiz) | max. 280 Zeichen, optional | **ja, neu** |

`energy_level`/`stress_level` (1-5) bleiben unverändert für das bestehende
Marker-Formular — **keine Ersetzung**, um dessen UI nicht zu brechen.

**Ein Check-in pro Nutzer und lokalem Tag:** Der Endpunkt `PUT /daily` prüft
per `email + entry_date`, ob bereits eine Zeile existiert (`update` statt
`insert`) — der Client sendet sein eigenes lokales Datum (`entry_date`),
nicht die Serverzeit (siehe §Zeitzone unten). Zukünftige Daten werden von
`validate_local_date_not_future` abgelehnt.

**Nach dem Speichern:** Ein `vt_audit_events`-Eintrag (`action="create"` oder
`"update"`, `entity_type="daily_wellness_entry"`) markiert, dass sich die
Tagesdaten geändert haben — die Grundlage dafür, dass ein künftiger
`TwinContextService` (Etappe 7) weiß, seinen Kontext neu aufzubauen, statt
einen veralteten zu servieren. Es findet in Etappe 3 noch **keine**
automatische Tagesplan-Neubewertung statt (das ist Etappe 6, Daily Planning
Loop).

## 2. Sleep Loop

**Endpunkt:** `GET /api/profile/trends` (liefert 7- und 30-Tage-Durchschnitte
für `sleep_hours` und `sleep_quality`, zusammen mit allen anderen
Trend-Feldern).

**Loop wie geplant:** Schlafdaten (Check-in) → 7-/30-Tage-Trend
(`app/services/trends.py::compute_trend`) → transparente Anzeige
(`DashboardTrends`-Komponente) → *(spätere Etappe: Empfehlung)* → *(späterer
Check-in)* → *(späteres Feedback)*.

**Bewusst nicht enthalten (Etappe 3 §2):** keine KI-Empfehlungslogik, keine
Diagnose von Schlafstörungen, keine Medikamenten- oder
Behandlungsvorschläge — nur der reine, transparente Durchschnittswert plus
`data_quality` (`"partial"` bei < 4 Datenpunkten, sonst `"calculated"`).

## 3. Movement Loop

**Grundlage:** `movement_minutes` aus dem Check-in + `vt_habits`/
`vt_habit_entries` für bewegungsbezogene Gewohnheiten.

**Loop:** Bewegungsdaten → `GET /trends` liefert den 7-/30-Tage-Durchschnitt
für `movement_minutes` → Zielbezug über `vt_wellness_goals`
(`goal_type="mehr_bewegen"`) → *(spätere Etappe: konkrete Aktion/Umsetzung
über `vt_goal_actions`)*.

Es werden **keine erfundenen Fortschritte** angezeigt: `DashboardTrends`
blendet ein Feld komplett aus, solange `data_points == 0` für die
7-Tage-Ansicht.

## 4. Stress- und Recovery-Grundlage

**Felder:** `stress` (1-10), `recovery` (1-10, optional) im Check-in;
7-/30-Tage-Trend über denselben `/trends`-Endpunkt.

**Ausdrücklich nicht enthalten:** keine psychische Diagnose, kein Ersatz für
Therapie — die Anzeige ist ein reiner Durchschnittswert mit Datenqualitäts-
Hinweis, formuliert im `disclaimer`-Feld der `/trends`-Antwort.

## 5. Habit Loop

**Endpunkte:** `GET/POST /api/profile/habits`, `PATCH/DELETE
/api/profile/habits/{id}`, `POST /api/profile/habits/{id}/entries` (Abhaken/
Zurücknehmen), `GET /api/profile/habits/entries`.

**Felder:** `name` (Titel), `category`, `frequency`, `target`,
`reminder_time` (dient zugleich als "bevorzugte Tageszeit" — kein separates
Feld, um kein Duplikat anzulegen), `reminder_enabled`, `status`
(`active`/`paused`/`archived`, **neu in Etappe 3** — ersetzt nicht das
bestehende `active`-Boolean, sondern wird synchron dazu gehalten).

### Streak-Berechnung (serverseitig, `app/services/streaks.py`)

- **Aktuelle Serie** (`current_streak`): Anzahl aufeinanderfolgender
  erledigter Tage bis einschließlich heute. Ist der heutige Tag noch offen,
  wird trotzdem ab gestern rückwärts gezählt (eine laufende Serie gilt nicht
  als "gebrochen", bevor der Tag vorbei ist).
- **Längste Serie** (`longest_streak`): längster zusammenhängender Lauf über
  die gesamte Historie.
- **Erfüllungsquote 7/30 Tage** (`completion_rate_7d`/`completion_rate_30d`):
  Anteil erledigter Tage im Fenster. Das Fenster wird auf das Erstellungsdatum
  der Gewohnheit begrenzt (`compute_habit_stats` in
  `app/services/habit_service.py`), damit eine neue Gewohnheit am ersten Tag
  nicht fälschlich mit "0 % diesen Monat" erscheint.

Alle Berechnungen laufen auf dem **lokalen Kalendertag** (`entry_date`),
nicht auf Server-/UTC-Zeit.

**Keine doppelten Einträge am selben Tag:** `unique(habit_id, entry_date)`
(bestehender Constraint aus Migration 002) — `POST .../entries` macht ein
`update` statt `insert`, wenn für den Tag bereits ein Eintrag existiert.

## 6. Goal Loop

**Endpunkte:** `GET/POST /api/profile/goals`, `PATCH/DELETE
/api/profile/goals/{id}`.

**Felder** (`vt_wellness_goals`, Etappe 2 angelegt, in Etappe 3 um `title`
ergänzt): `title`, `goal_type` (eine der acht Kategorien aus der
Constitution plus `eigenes_ziel`), `status`
(`active`/`paused`/`completed`/`archived`), `target_value`, `target_date`
(muss in der Zukunft liegen), `created_at`/`updated_at`.

**Löschung = sichere Archivierung:** `DELETE /goals/{id}` löscht nicht
hart, sondern setzt `deleted_at` + `status="archived"` (Etappe 3 §7: "Delete
beziehungsweise sichere Archivierung"). Die Zeile bleibt für spätere
Reflexionen/Auswertungen abfragbar.

**Loop wie geplant:** Ziel → *(spätere Etappe: Planungsgrundlage über
`vt_daily_plans`)* → *(spätere Etappe: tägliche Aktionen über
`vt_goal_actions`)* → Umsetzung → Fortschritt → *(spätere Etappe: Reflexion
über `vt_weekly_reflections`)* → angepasster Plan. In Etappe 3 ist nur der
**erste Teil** (Ziel anlegen, Status ändern, archivieren) implementiert —
Planungsgrundlage und Aktionen folgen in Etappe 6.

## Zeitzonenlogik (gilt für alle vier Loops)

Der Server verwendet **niemals** seine eigene Zeit, um zu entscheiden, was
"heute" für einen Nutzer bedeutet. Stattdessen:

1. Der Client (Browser) berechnet sein eigenes lokales Datum
   (`new Date().toISOString().slice(0, 10)` in den neuen
   Dashboard-Komponenten) und sendet es explizit als `entry_date`.
2. Die Datenbank speichert zusätzlich eine `timezone`-Spalte (IANA-Name),
   validiert über `core/validation.py::validate_timezone_name` (siehe
   `ProfileUpdate.timezone`).
3. Reisen/Zeitzonenwechsel verändern nie rückwirkend bereits gespeicherte
   `entry_date`-Werte — ein Eintrag bleibt für den Tag gültig, an dem er
   lokal erstellt wurde.

**Bekannte Einschränkung:** `GET /daily/today` verwendet aktuell
`date.today()` auf dem Server (UTC-Datum), nicht die tatsächliche
Nutzerzeitzone, da der Client sein lokales Datum nur beim **Schreiben**
(`PUT /daily`) mitschickt, nicht bei diesem Lese-Aufruf. Für Nutzer in
zeitzonenfernen Regionen kann `/daily/today` daher kurzzeitig (um
Mitternacht) den falschen Tag zeigen. Korrektur ist für eine spätere Etappe
vorgesehen (Client müsste sein lokales Datum auch als Query-Parameter an
`/daily/today` übergeben).

## 7. Recommendation-, Decision-, Outcome- und Feedback-Loop (Etappe 4)

**Endpunkte** (neuer Router `app/routers/recommendations.py`, montiert unter
`/api/recommendations`):

| Endpunkt | Zweck |
|---|---|
| `GET /api/recommendations` | Aktive Empfehlungen laden, abgelaufene `proposed`-Einträge auf `expired` setzen, neue regelbasierte Entwürfe generieren und persistieren |
| `POST /{id}/decision` | Annehmen/Verändern/Überspringen/Ablehnen |
| `POST /{id}/outcome` | Ergebnis melden |
| `POST /{id}/feedback` | Hilfreichkeit bewerten |
| `GET /{id}/why` | Erklärung ("Warum?") |

**Der volle Loop wie in der Constitution beschrieben:** Datenlage
(Check-in/Habit/Goal) → regelbasierte Empfehlung
(`services/recommendation_rules.py`) → Beta-Personalisierungsfilter
(`services/personalization.py`) → Entscheidung des Nutzers → *(bei
Annahme/Änderung)* Umsetzung → Ergebnis-Rückmeldung → Hilfreichkeits-Feedback
→ das Feedback fließt über die Personalisierungsregeln in die **nächste**
Empfehlungsrunde zurück (Kategorien-Malus, Duplikat-Sperre). Details zum
Empfehlungsmodell, den Regeln, dem Status-/Entscheidungs-/Outcome-/
Feedback-Modell und den Personalisierungsregeln: siehe
[TWIN_LEARNING_RULES.md](./TWIN_LEARNING_RULES.md). Details zur
Erklärungsstruktur: siehe [TWIN_EXPLAINABILITY.md](./TWIN_EXPLAINABILITY.md).

**Nutzertrennung:** jede Empfehlung ist über `email` skopiert; ein
Zugriffsversuch auf eine fremde oder nicht existierende `id` liefert `404`,
nie `403` (siehe `core/auth.py`-Konvention aus Etappe 2).

**Bewusst nicht enthalten (Etappe 4):** keine KI-generierten Empfehlungen
(`source_type` ist ausschließlich `"rule_based"` — `"ai_generated"` ist im
Enum reserviert, aber ungenutzt), kein trainiertes ML-Modell für die
Personalisierung (siehe TWIN_LEARNING_RULES.md), kein Wearable-Import für
Outcomes (`outcome_source="imported_from_wearable"` ist reserviert, aber
ungenutzt).

**Bekannte Einschränkung:** Migration `005_recommendation_loops.sql` ist
geschrieben, aber (wie alle bisherigen Migrationen) **nicht gegen eine echte
Datenbank ausgeführt** — in dieser Umgebung stehen keine
Supabase-Zugangsdaten zur Verfügung.
