# VitalTwin — Twin Learning Rules (TWIN_LEARNING_RULES.md)

> Erstellt in **Etappe 4 (Twin Intelligence Core)**, erweitert in
> **Etappe 5** und **Etappe 6**. Dokumentiert die regelbasierte
> Empfehlungslogik (`backend/app/services/recommendation_rules.py`), die
> Beta-Personalisierungsheuristiken
> (`backend/app/services/personalization.py`), die Memory-Detektoren
> (`backend/app/services/twin_memory.py`), die transparente
> Pattern-Detection (`backend/app/services/pattern_detection.py`), die
> Priorisierungsregeln des Daily Planning Loop
> (`backend/app/services/daily_planning.py`) und die Twin-Reifegrad-Regeln
> (`backend/app/services/twin_maturity.py`).
>
> **Wichtiger Hinweis (Ehrlichkeit, siehe Constitution):** Nichts hier ist ein
> trainiertes Machine-Learning-Modell. Es gibt keine Gewichte, kein Training,
> keine Vorhersage im statistischen Sinn — nur feste, nachvollziehbare
> Schwellenwerte (und, für Patterns, eine einfache Pearson-Korrelation als
> reine Mathematik, kein ML) über die eigenen Daten des Nutzers. Jede Regel
> ist in Klartext lesbar und in unter einer Minute erklärbar.

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

## 4. Memory-Detektoren (`twin_memory.py`, Etappe 5)

Wie die Empfehlungsregeln: reine Funktionen, keine Datenbank, keine
Zufälligkeit. Details zu den acht Memory-Typen, dem Lebenszyklus und den
Konfidenzregeln: siehe [TWIN_MEMORY.md](./TWIN_MEMORY.md). Kurzüberblick der
Detektoren:

| Detektor | Bedingung | Memory-Typ |
|---|---|---|
| `detect_preferred_activity_time` | Gewohnheit mit `reminder_time` und `completion_rate_30d ≥ 0.7` | `bevorzugte_aktivitaetszeit` |
| `detect_successful_routine` | `completion_rate_30d ≥ 0.8` und `longest_streak ≥ 7` | `erfolgreiche_routine` |
| `detect_rejected_recommendation_type` | Kategorien-Malus ≥ 2 (wiederverwendet `personalization.compute_category_penalty`) | `abgelehnter_empfehlungstyp` |
| `detect_confirmed_preference` | ≥ 2 angenommene Empfehlungen derselben Kategorie, keine Ablehnung | `bestaetigte_praeferenz` |
| `detect_active_long_term_goal` | Aktives Ziel ohne Zieldatum oder ≥ 30 Tage entfernt | `aktives_langfristiges_ziel` |
| `promote_pattern_to_memory` | Bestätigtes, nicht widersprüchliches Pattern mit Konfidenz ≥ 0.7 | `bestaetigtes_muster` |

`persoenliche_regel` und `bevorzugte_kommunikationsform` haben **keinen**
Detektor — sie entstehen ausschließlich durch eine explizite Nutzeraktion
(`POST /api/memory`), nie durch automatische Beobachtung.

## 5. Pattern-Detection-Regeln (`pattern_detection.py`, Etappe 5)

Jeder Korrelations-Detektor berechnet einen einfachen Pearson-Korrelations­koeffizienten
(`_pearson`, reine Python-Mathematik) über mindestens
**`MIN_PATTERN_DATA_POINTS = 5`** Datenpunkte der letzten
**`LOOKBACK_DAYS = 30`** Tage. Ein Muster wird nur gemeldet, wenn
`|r| ≥ MEANINGFUL_CORRELATION (0.3)` — schwächere Zusammenhänge werden als
"nicht aussagekräftig genug" verworfen, nie als schwaches Muster angezeigt.

| Detektor | Variablen | Pattern-Typ |
|---|---|---|
| `detect_sleep_energy_pattern` | `sleep_hours` ↔ `energy` | `schlafdauer_energie` |
| `detect_movement_mood_pattern` | `movement_minutes` ↔ `mood` | `bewegung_stimmung` |
| `detect_stress_sleep_quality_pattern` | `stress` ↔ `sleep_quality` | `stress_schlafqualitaet` |
| `detect_weekday_routine_pattern` | Wochentag ↔ Gewohnheits-Erfüllung | `wochentag_routine` |
| `detect_recommendation_success_pattern` | Empfehlungskategorie ↔ Annahmequote | `empfehlungstyp_erfolgsquote` |

"Tageszeit und Gewohnheitserfolg" (aus Etappe 5 §3) wird nicht als separates
Pattern, sondern direkt als `bevorzugte_aktivitaetszeit`-Memory abgebildet
(§4) — beides beruht auf denselben zwei Größen (`reminder_time`,
`completion_rate`), ein zusätzliches Pattern wäre ein Duplikat.

### Widersprüchliche Daten (`contradicting`)

Für die drei Korrelations-Detektoren wird der Beobachtungszeitraum
chronologisch in zwei Hälften geteilt. Zeigen beide Hälften eine
Korrelation von mindestens `CONTRADICTION_CORRELATION = 0.2`, aber mit
**entgegengesetztem Vorzeichen**, wird `contradicting=True` gesetzt und die
Konfidenz um 40 % reduziert (`* 0.6`) — das Muster wird trotzdem angezeigt,
aber mit einem klaren Hinweis ("Die Daten sind dabei nicht eindeutig...") und
niedrigerer Konfidenz, statt es zu verschweigen oder unverändert als sicher
darzustellen.

### Verpflichtende Formulierung

Jede `PatternDraft.summary` beginnt mit "In deinen bisherigen Daten zeigt
sich möglicherweise..." und endet mit "...keine Ursache"/"...keine feste
Regel" — nie mit einer Kausalaussage ("X verursacht bei dir Y"). Dies ist
Teil der reinen String-Erzeugung in `pattern_detection.py`, nicht optional
und nicht durch den Aufrufer veränderbar.

## 6. Priorisierungsregeln des Daily Planning Loop (`daily_planning.py`, Etappe 6)

`generate_daily_plan_actions` sammelt Kandidaten aus vier Quellen, vergibt
jedem einen einfachen additiven Score und liefert höchstens
**`MAX_DAILY_PLAN_ACTIONS = 3`** — die höchsten Scores zuerst.

| Quelle | Basis-Score | Bonus |
|---|---|---|
| Aktives Ziel (`goal`) | `GOAL_BASE_SCORE = 5.0` | — |
| Offene Gewohnheit (`habit`) | `HABIT_BASE_SCORE = 4.0` | `+ (1 - completion_rate_7d) * 3` (bisherige Erfolge); `+ PREFERRED_TIME_BONUS (2.0)` bei Übereinstimmung mit `reminder_time` **oder** einer bestätigten `bevorzugte_aktivitaetszeit`-Memory (aktive bestätigte Memories) |
| Aktive Empfehlung (`recommendation`) | `confidence * 10 * 0.5` | `+ RECOMMENDATION_PRIORITY_BONUS` (high: 3, medium: 1, low: 0) — Empfehlungen sind bereits check-in-basiert (Etappe 4) und durch Nutzerfeedback personalisiert gefiltert (Etappe 4 §6) |
| Offene Aktion von gestern (`carried_over`) | `HABIT_BASE_SCORE + CARRIED_OVER_BONUS (2.0)` | Plan des Vortags — dedupliziert gegen frische Ziel-/Gewohnheits-Kandidaten desselben Bezugs |

**Datenqualität** wird nicht separat gescort, sondern indirekt: Kandidaten
aus wenig belastbaren Quellen entstehen gar nicht erst (z. B. erzeugt
`recommendation_rules.py` selbst erst ab 3 Datenpunkten eine Empfehlung,
siehe §1). Jede Aktion trägt ihre eigene, für Menschen verständliche
`reasoning` und einen groben `estimated_effort` — nie nur den internen
Score.

## 7. Twin-Reifegrad-Regeln (`twin_maturity.py`, Etappe 6)

Fünf Stufen, streng aufsteigend, jede mit konkreten, benannten
Datenschwellen (keine "gefühlte" Prozentzahl):

| Stufe | Bedingung |
|---|---|
| `start` | Standard, solange keine höhere Stufe erreicht ist |
| `lernt_dich_kennen` | ≥ `MIN_CHECKIN_DAYS_LEARNING = 5` Check-in-Tage |
| `erkennt_routinen` | zusätzlich ≥ `MIN_ACCOUNT_AGE_ROUTINES_DAYS = 14` Tage Nutzungsdauer **und** (bestätigte Routine/Aktivitätszeit-Memory **oder** ein aktives, nicht widersprüchliches Pattern) |
| `versteht_praeferenzen` | zusätzlich ≥ `MIN_ACCOUNT_AGE_PREFERENCES_DAYS = 21` Tage, eine bestätigte Präferenz-Memory **und** ≥ `MIN_CONFIRMED_MEMORIES_PREFERENCES = 2` bestätigte Memories insgesamt |
| `begleitet_langfristig` | zusätzlich ≥ `MIN_ACCOUNT_AGE_LONGTERM_DAYS = 60` Tage, ≥ `MIN_CONFIRMED_MEMORIES_LONGTERM = 5` bestätigte Memories **und** mindestens ein vollständiger (`data_sufficient`) Wochenrückblick |

Jede Antwort liefert zusätzlich `present_data` (alle verwendeten Zähler) und
`missing_data` (konkrete, in Zahlen ausgedrückte Lücke zur nächsten Stufe) —
nie nur das Level ohne Begründung.


