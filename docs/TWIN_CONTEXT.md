# VitalTwin — Twin Context (TWIN_CONTEXT.md)

> Erstellt in **Etappe 7 (Twin Intelligence Core)**. Dokumentiert die Twin
> Context Engine (`backend/app/services/twin_context.py`), die vor jedem
> KI-Aufruf einen minimalen, auf die Frage zugeschnittenen Kontext baut —
> nie die gesamte Datenbank.

## 1. Grundprinzip

> "Die KI darf nicht die gesamte Datenbank unkontrolliert erhalten." (Etappe 7 §1)

`build_twin_context(...)` ist eine reine Funktion (keine Datenbankzugriffe)
— sie bekommt bereits geladene, bereits per `email` skopierte Daten vom
Aufrufer (`routers/chat.py::_build_context_for_user`) übergeben und kann
architektonisch bedingt niemals fremde Daten sehen: es gibt keinen
Parameter für eine andere Nutzer-ID, keinen Datenbankzugriff, keinen
globalen Zustand.

## 2. Bereiche im Kontext

| Bereich | Quelle | Aufgenommen wird |
|---|---|---|
| Aktuelles Profil | `vt_user_profiles` | nur hinterlegte Wellness-Ziele (kein Freitext) |
| Relevante Ziele | `vt_wellness_goals` | Titel aktiver Ziele (max. 5) |
| Relevante Gewohnheiten | `vt_habits` + Etappe-3-Stats | Name + 7-Tage-Erfüllungsquote aktiver Gewohnheiten (max. 6) |
| Aggregierte Trends | `services/trends.py` | Ø Schlaf/Energie/Bewegung/Stress/Stimmung (7 Tage) + Datenqualität |
| Aktive bestätigte Memories | `vt_twin_memory` | nur `status in (active, confirmed)`, `human_readable_value` (max. 5) |
| Relevante Empfehlungen | `vt_recommendations` | nur `status="proposed"`, Titel (max. 3) |
| Feedback-Zusammenfassung | `services/personalization.py` | nur Kategorien mit Ablehnungs-Malus ≥ 2 |
| Datenqualitätsstatus | Anzahl Check-ins | fester Hinweissatz, immer vorhanden |
| Relevante Muster | `vt_twin_patterns` | nur `status="active"` und `contradicting=false` (max. 3) |
| Aktueller Tagesplan | `vt_daily_plan_actions` | Beschreibungen der heutigen Aktionen (max. 3) |

## 3. Regeln (Etappe 7 §1) und ihre Umsetzung

| Regel | Umsetzung |
|---|---|
| Nur aktueller Nutzer | Jede Datenbankabfrage in `_build_context_for_user` ist `.eq("email", email)` skopiert — getestet in `tests/test_chat_router.py::TestContextQueriesAreScopedToRequestingUser` |
| Nur notwendige Daten | Jeder Block enthält ausschließlich das, was in der Tabelle oben steht — keine internen IDs, keine Rohdaten |
| Sensible Freitexte nur bei echter Notwendigkeit | Check-in-Notizen (`note`) und Reflexionstexte (`what_went_well`, `difficult_note`, ...) werden **nie** in den Kontext aufgenommen — nur aggregierte/strukturierte Werte |
| Keine gelöschten Memories | Filter `status in (active, confirmed)` — `deleted`/`archived`/`disputed`/`candidate` werden nie aufgenommen (siehe `twin_memory.USABLE_STATUSES`, wiederverwendet statt neu definiert) |
| Keine fremden Daten | Architektonisch unmöglich (siehe §1) — zusätzlich regressionsgetestet |
| Keine geheimen Systeminformationen | Der Kontext enthält ausschließlich Nutzerdaten, nie den Systemprompt selbst oder interne Konfiguration |
| Kontextgröße begrenzen | Siehe §4 |
| Keine vollständige Lebenshistorie senden | Trends sind auf 7 Tage begrenzt, Listen sind gedeckelt (siehe Tabelle oben), keine vollständige Datenbankhistorie |

## 4. Größenbegrenzung

Blöcke werden in der oben gezeigten Prioritätsreihenfolge zusammengesetzt,
bis das Zeichenbudget des Tarifs (`core/plans.py::get_context_char_limit`)
aufgebraucht ist:

| Tarif | Zeichenbudget |
|---|---|
| FREE | 600 |
| PREMIUM | 1500 |
| PRO | 2500 |
| FAMILY | 1500 (siehe Einschränkung in `TWIN_BETA_LIMITATIONS.md`) |

Wird das Budget überschritten, werden **niedriger priorisierte Blöcke
weggelassen**, nie ein Block gekürzt und als vollständig ausgegeben — die
Antwort trägt zusätzlich `truncated: true`, damit das ehrlich bleibt.

## 5. Transparenz

Jeder aufgenommene Block liefert zugleich eine `ContextSource` (Typ + kurzes
Label), die 1:1 in die `/api/chat/ask`-Antwort als `sources` einfließt und
im Frontend als "Warum?"-Aufklappliste angezeigt wird (siehe
[TWIN_EXPLAINABILITY.md](./TWIN_EXPLAINABILITY.md)).

## 6. Bekannte Grenzen

- Trends im Chat-Kontext verwenden ein festes 7-Tage-Fenster (nicht
  tarifabhängig verlängert) — "mehr Langzeitkontext" für PRO (Etappe 7 §7)
  bezieht sich aktuell nur auf das größere Zeichenbudget, nicht auf ein
  längeres Trend-Fenster; eine spätere Etappe könnte das Fenster selbst
  tarifabhängig machen.
- Der Tagesplan-Block liest nur einen bereits existierenden Plan für heute
  — der Chat erzeugt selbst keinen neuen Tagesplan (das bleibt Aufgabe des
  Daily Planning Loop, Etappe 6).
