# VitalTwin — Twin Explainability (TWIN_EXPLAINABILITY.md)

> Erstellt in **Etappe 4 (Twin Intelligence Core)**. Dokumentiert die
> "Warum?"-Erklärungsstruktur für Empfehlungen
> (`backend/app/services/explainability.py`, Endpunkt
> `GET /api/recommendations/{id}/why`).

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
