# VitalTwin — Twin Explainability (TWIN_EXPLAINABILITY.md)

> Erstellt in **Etappe 4 (Twin Intelligence Core)**, erweitert in
> **Etappe 5**. Dokumentiert die "Warum?"-Erklärungsstruktur für
> Empfehlungen (`backend/app/services/explainability.py`, Endpunkt
> `GET /api/recommendations/{id}/why`) sowie die Herkunfts-/Konfidenz-
> Anzeige für Memories und Patterns (Etappe 5, `routers/twin_memory.py`).

## 1. Grundprinzip

Jede Empfehlung speichert bei ihrer Erzeugung (`routers/recommendations.py::
_draft_to_payload`) ein `explanation`-JSON-Feld mit genau den Daten, auf
denen sie tatsächlich beruht (`rule_name`, `data_used`, `period_days`,
`data_points`, `data_quality`, `expected_benefit`). Der
`/why`-Endpunkt liest **ausschließlich** dieses gespeicherte Feld zurück —
`build_explanation_response(...)` erfindet oder rekonstruiert nichts
nachträglich. Wenn eine Information beim Erzeugen der Empfehlung nicht
gespeichert wurde, erscheint sie im `/why`-Ergebnis als `null`, statt
geraten oder plausibel wirkend nachgeliefert zu werden.

## 2. Antwortstruktur (`GET /{id}/why`)

| Feld | Herkunft | Bedeutung |
|---|---|---|
| `rule_name` | `explanation.rule_name` | Name der auslösenden Regel, z. B. `"repeated_short_sleep"` |
| `data_used` | `explanation.data_used` | Welche Felder verwendet wurden, z. B. `["sleep_hours"]` |
| `period_days` | `explanation.period_days` | Betrachteter Zeitraum in Tagen (0 bei Ziel-Empfehlungen, die keinen Zeitraum brauchen) |
| `data_points` | `explanation.data_points` | Anzahl der tatsächlich verwendeten Datenpunkte |
| `data_quality` | `explanation.data_quality` | `"calculated"` oder `"partial"` (siehe `core/validation.py::DataQuality`) |
| `confidence` | `recommendation.confidence` | 0.5-0.9, regelabhängig (siehe TWIN_LEARNING_RULES.md) |
| `goal_id` / `habit_id` | `recommendation.goal_id`/`habit_id` | Bezug zu Ziel/Gewohnheit, falls vorhanden |
| `expected_benefit` | `explanation.expected_benefit` | Kurzer, ehrlicher Nutzen-Satz, kein Heilsversprechen |
| `type` | abgeleitet | `"allgemeine Regel"`, wenn `rule_name` vorhanden ist, sonst `"unbekannt"` — in Etappe 4 ist dies immer eine Regel, nie eine "persönliche Erkenntnis des Twins" |
| `disclaimer` | fest | Siehe unten |

## 3. Disclaimer-Text (fest, immer identisch)

> "Diese Empfehlung basiert auf einer nachvollziehbaren Regel und deinen
> eigenen Daten — sie ist keine medizinische Notwendigkeit und ersetzt keine
> ärztliche Beratung."

Dieser Text wird bei **jeder** Antwort mitgeliefert, unabhängig von Kategorie
oder Priorität — auch bei `priority="high"` (z. B. der Stress-Regel), da eine
hohe Priorität in der Twin-Logik ausdrücklich keine medizinische Dringlichkeit
bedeutet.

## 4. Was ausdrücklich NICHT gezeigt wird

- Keine internen System-Prompts oder KI-Modell-Interna — es gibt in Etappe 4
  keine zu verbergen, da alle Empfehlungen regelbasiert sind
  (`source_type="rule_based"`).
- Keine erfundene Begründung, wenn `explanation` leer ist (z. B. bei
  historischen/fehlerhaften Datensätzen) — die Felder erscheinen dann als
  `null`, nicht als plausibel klingender Platzhaltertext.
- Kein Vergleich mit anderen Nutzern ("90 % der Nutzer schlafen besser,
  wenn...") — die Erklärung bezieht sich ausschließlich auf die eigenen
  Daten der anfragenden Person.

## 5. Zusammenspiel mit den anderen Loops

Die Explainability-Antwort ist bewusst read-only und hat keine Nebenwirkung
auf Status, Personalisierung oder Historie — sie kann beliebig oft abgerufen
werden (z. B. durch mehrfaches Klicken auf "Warum?" im Dashboard), ohne den
Empfehlungs- oder Personalisierungszustand zu verändern.

## 6. Memory- und Pattern-Explainability (Etappe 5)

Anders als bei Empfehlungen gibt es für Memories/Patterns keinen separaten
`/why`-Endpunkt — die Begründung ist direkt Teil des Listenergebnisses
(`GET /api/memory`, `GET /api/memory/patterns`), da sie ohnehin ständig
sichtbar sein soll ("Was dein Twin über dich gelernt hat", nicht erst auf
Nachfrage):

| Feld | Zeigt |
|---|---|
| `source` | `"user_reported"` (von dir angegeben) oder `"calculated"` (aus deinen Daten berechnet) |
| `source_references` | welche Felder/Ereignisse zur Erkennung führten (z. B. `["completion_rate_30d", "reminder_time"]`) |
| `human_readable_value` | die Begründung selbst als vollständiger, verständlicher Satz |
| `confidence` | wird im Frontend nie als rohe Zahl gezeigt, sondern als "niedrig"/"mittel"/"hoch" (`confidenceLabel(...)` in `dashboard-twin-memory.tsx`) |
| `contradicting` (nur Patterns) | zeigt explizit an, wenn die Daten nicht eindeutig sind, statt es zu verschweigen |

Patterns tragen zusätzlich ihre `summary` direkt im Ergebnis — bereits fertig
in der vorgeschriebenen "zeigt sich möglicherweise..."-Formulierung (siehe
[TWIN_LEARNING_RULES.md](./TWIN_LEARNING_RULES.md) §5), sodass das Frontend
nichts umformulieren muss und keine Kausalaussage entstehen kann.

Wie bei Empfehlungen gilt: keine internen Detektor-Interna, keine erfundene
Begründung, kein Vergleich mit anderen Nutzern — nur die eigenen,
tatsächlich gespeicherten Daten der anfragenden Person.
