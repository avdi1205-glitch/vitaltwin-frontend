# VitalTwin — Twin-Datenwörterbuch (TWIN_DATA_DICTIONARY.md)

> Erstellt in **Etappe 2**. Fokus ausschließlich auf die Tabellen, die den
> lernenden Zwilling selbst antreiben (nicht die allgemeinen Profil-/
> Gewohnheits-Tabellen — siehe `DATA_DICTIONARY.md` für die Gesamtübersicht).
> Beantwortet für jede Tabelle gezielt: **wie nutzt der Twin das später?**

## `vt_twin_memory` — Langzeitgedächtnis

Der Twin merkt sich hier **Präferenzen und stabile Fakten**, nicht
Tagesdaten (Memory Loop, Constitution). Beispiel: `memory_key =
"preferred_workout_time"`, `memory_value = {"value": "morgens"}`.

- **Spätere Nutzung durch den Twin:** wird bei jeder neuen Empfehlung
  (`vt_recommendations`) als Kontext gelesen, bevor eine neue Empfehlung
  formuliert wird — verhindert, dass der Twin wiederholt bereits bekannte
  Präferenzen ignoriert.
- **Löschverhalten:** Cascade mit dem Nutzerkonto. `active = false` erlaubt
  „vergessen ohne löschen" (z. B. wenn eine Präferenz veraltet ist, aber zu
  Nachvollziehbarkeitszwecken erhalten bleiben soll).

## `vt_twin_patterns` — Erkannte Muster

Ergebnis einer Analyse über mehrere `vt_daily_wellness_entries`/
`vt_habit_entries`-Zeilen hinweg (z. B. „Schlafqualität sinkt an Tagen mit
> 3 Kaffee"). `confidence` (numeric) und `data_quality` dokumentieren, wie
belastbar das Muster ist — **nie** ein Muster mit `data_quality =
"calculated"` als „verified_source" ausgeben.

- **Spätere Nutzung:** Grundlage für `vt_twin_insights` (verdichtete,
  nutzerfreundlich formulierte Erkenntnis) und für die Priorisierung in
  `vt_recommendations`.

## `vt_twin_insights` — Verdichtete Erkenntnisse

Das, was der Nutzer tatsächlich zu sehen bekommt (im Gegensatz zum rohen
Pattern). `dismissed_at` erlaubt „weggewischt, aber nicht gelöscht" —
wichtig für den Personalization Loop (der Twin soll nicht dieselbe
weggewischte Erkenntnis erneut zeigen).

## `vt_twin_learning_events` — Append-only Lernprotokoll

Jedes Mal, wenn der Twin aus einer Nutzeraktion etwas lernt (z. B.
„Empfehlung X wurde 3x abgelehnt → Gewichtung senken"), wird hier ein
Ereignis protokolliert (`event_type`, `payload jsonb`). **Nie** update/
delete — nur insert. Dient als Nachvollziehbarkeits-Grundlage für die
`TwinExplainabilityService` (Etappe-1-Architekturplan) und spätere
Audits/Debugging ("warum empfiehlt der Twin das?").

## `vt_twin_context_snapshots` — KI-Kontext-Protokoll

Bevor eine Anfrage an einen KI-Anbieter geht (z. B. „Frag deinen Twin"),
wird der tatsächlich gesendete, kompakte Kontext hier gespeichert
(`snapshot jsonb`, `reason`). Ermöglicht:

- Nachvollziehbarkeit: „welche Daten hat der Twin bei dieser Antwort
  gesehen?"
- Explainability-Antworten an den Nutzer, ohne bei jeder Frage die KI
  erneut fragen zu müssen, was sie „wusste".

**Wichtig:** Enthält keine rohen Chat-Inhalte (siehe Migration
`002_chat_usage.sql`-Kommentar: Chatinhalte werden bewusst nicht
gespeichert) — nur die strukturierten Werte, die in den Kontext
eingeflossen sind.

## `vt_recommendations` + Entscheidung/Ergebnis/Feedback

Das ist der **vollständige Loop** aus Etappe 1 §5:

```
vt_recommendations (Empfehlung)
        ↓
vt_recommendation_decisions (Nutzer: angenommen/abgelehnt/verschoben)
        ↓
vt_recommendation_outcomes (was ist tatsächlich passiert)
        ↓
vt_recommendation_feedback (wie fand der Nutzer es, 1-5)
        ↓
→ nächster vt_twin_learning_events-Eintrag passt Gewichtung/Pattern an
```

Eine `vt_recommendations`-Zeile **ohne** zugehörige Decision/Outcome ist per
Definition kein abgeschlossener Loop — nur eine ausgesprochene Empfehlung
(siehe Etappe 1: „Eine reine Empfehlung ist kein vollständiger Loop").

## Konsistenzregeln über alle Twin-Tabellen hinweg

1. `source = "ai_generated"` oder `"calculated"` → niemals gleichzeitig
   `data_quality = "verified_source"` oder `"user_reported"`.
2. Jede Schreiboperation, die eine dieser Tabellen betrifft, sollte
   (sobald die Services in Etappe 5/7 gebaut werden) einen
   `vt_twin_learning_events`-Eintrag erzeugen — das ist die Brücke
   zwischen „eine Zeile wurde geschrieben" und „der Twin hat etwas
   gelernt".
3. Kein Modul außerhalb `backend/app/services/twin_*` (geplant ab Etappe 5)
   soll diese Tabellen direkt beschreiben — Zugriff über Services gebündelt,
   um doppelte Lernregeln zu vermeiden (Etappe-1-Architekturplan).
