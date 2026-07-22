# VitalTwin — Twin Learning Rules (TWIN_LEARNING_RULES.md)

> Erstellt in **Etappe 4 (Twin Intelligence Core)**. Dokumentiert die
> regelbasierte Empfehlungslogik (`backend/app/services/recommendation_rules.py`)
> und die Beta-Personalisierungsheuristiken
> (`backend/app/services/personalization.py`).
>
> **Wichtiger Hinweis (Ehrlichkeit, siehe Constitution):** Nichts hier ist ein
> trainiertes Machine-Learning-Modell. Es gibt keine Gewichte, kein Training,
> keine Vorhersage im statistischen Sinn — nur feste, nachvollziehbare
> Schwellenwerte über die eigenen Daten des Nutzers. Jede Regel ist in
> Klartext lesbar und in unter einer Minute erklärbar.

## 1. Empfehlungsregeln (`recommendation_rules.py`)

Alle Regeln sind reine Funktionen ohne Datenbankzugriff und ohne Zufall — sie
bekommen bereits geladene Daten (Check-in-Einträge, Gewohnheiten, Ziele)
übergeben und geben entweder einen `RecommendationDraft` (oder eine Liste
davon) zurück, oder `None`/eine leere Liste, wenn die Datenlage nicht
ausreicht. **Keine Regel erzeugt eine Empfehlung "nur damit eine da ist".**

| Regel | Bedingung | Kategorie | Priorität |
|---|---|---|---|
| `evaluate_sleep_rule` | Mindestens 3 Check-ins der letzten 7 Tage, davon mindestens 3 Nächte mit `sleep_hours < 6.5` | `schlaf` | medium |
| `evaluate_movement_rule` | Mindestens 3 Check-ins der letzten 7 Tage, Durchschnitt `movement_minutes < 20` | `bewegung` | medium |
| `evaluate_stress_rule` | Mindestens 3 Check-ins der letzten 7 Tage, Durchschnitt `stress ≥ 7` | `stress` | high |
| `evaluate_habit_rule` | Aktive Gewohnheit, heute noch nicht erledigt, `completion_rate_7d < 0.5` | Gewohnheits-Kategorie | low |
| `evaluate_goal_rule` | Jedes aktive Ziel (`status="active"`) | `goal_type` des Ziels | medium |

**Warum genau diese Schwellenwerte?** Sie sind bewusst konservativ gewählt
(mehrfaches Auftreten über mehrere Tage, nicht ein einzelner Ausreißer), um
keine überstürzten oder alarmistischen Empfehlungen aus einem einzelnen
schlechten Tag abzuleiten — konsistent mit der Constitution-Vorgabe, keine
unnötige Sorge auszulösen.

**Mindestdatenmenge:** `MIN_DATA_POINTS = 3` für alle Check-in-basierten
Regeln (Schlaf/Bewegung/Stress) — bei weniger Datenpunkten wird **keine**
Empfehlung erzeugt, statt eine unsichere Aussage auf Basis von 1-2 Werten zu
treffen. Jeder erzeugte `RecommendationDraft` trägt `data_quality`
(`"calculated"` ab 4 Datenpunkten, sonst `"partial"`) und `confidence`
(0.5-0.9, regelabhängig) — beides wird 1:1 in der Explainability-Antwort
angezeigt (siehe [TWIN_EXPLAINABILITY.md](./TWIN_EXPLAINABILITY.md)).

`generate_recommendations(...)` ruft alle Regeln einmal auf und sammelt die
Ergebnisse; die Filterung (Personalisierung, Duplikate) passiert erst danach
im Router (`routers/recommendations.py`), nicht in den Regeln selbst — die
Regeln kennen die Historie des Nutzers nicht.

## 2. Beta-Personalisierung (`personalization.py`)

Drei einfache, vollständig erklärbare Heuristiken über die eigene
Empfehlungshistorie des Nutzers:

### 2.1 Kategorien-Malus (`compute_category_penalty` / `should_deprioritize_category`)

Für jede Kategorie wird ein Zähler geführt: eine `rejected`-Entscheidung
erhöht ihn um 1, eine `accepted`-Entscheidung senkt ihn um 1. Ab einem Wert
von **`REJECTION_THRESHOLD = 2`** wird die Kategorie in der nächsten
`GET /api/recommendations`-Anfrage übersprungen
(`should_deprioritize_category`). Beispiel: zwei abgelehnte
Bewegungs-Empfehlungen in Folge (ohne dazwischen angenommene) → keine
weiteren Bewegungs-Empfehlungen, bis wieder eine akzeptiert wurde.

### 2.2 Duplikat-Sperre (`has_recent_unsuccessful_duplicate`)

Verhindert, dass exakt dieselbe Kombination aus Kategorie + vorgeschlagener
Aktion innerhalb von **`REPEAT_COOLDOWN_DAYS = 14`** Tagen erneut vorgeschlagen
wird, wenn sie beim letzten Mal nicht erfolgreich war — "nicht erfolgreich"
bedeutet: Status `rejected`/`skipped`, oder ein gemeldetes Ergebnis
`outcome_status="not_implemented"`, oder eine Bewertung
`helpfulness="not_helpful"`.

### 2.3 Bevorzugte Tageszeit (`matches_preferred_time`)

Vergleicht die `reminder_time` einer Gewohnheit mit der aktuellen Stunde
(±3 Stunden Toleranz). **Rein informativ** — blockiert nie eine Empfehlung,
sondern kann in einer späteren Etappe genutzt werden, um Priorität/Anzeige
zu beeinflussen.

## 3. Bewusst nicht enthalten (Etappe 4)

- Kein trainiertes Modell, keine Gewichtsanpassung, kein Lernen über
  Nutzer hinweg (jede Personalisierung ist strikt pro Nutzer, basierend
  ausschließlich auf dessen eigener Historie).
- Kein KI-generierter Empfehlungstext (`source_type` ist immer
  `"rule_based"`).
- Keine Vorhersage zukünftigen Verhaltens — nur eine Reaktion auf bereits
  eingetretene Muster der letzten 7-14 Tage.
