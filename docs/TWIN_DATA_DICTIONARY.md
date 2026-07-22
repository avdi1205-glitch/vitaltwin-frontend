# VitalTwin — Twin-Datenwörterbuch (TWIN_DATA_DICTIONARY.md)

> Erstellt in **Etappe 2**, ergänzt in **Etappe 3**, **aktualisiert und
> vervollständigt in Etappe 9** anhand des tatsächlichen Standes nach
> Etappe 5-8 (einige frühere Annahmen aus der Etappe-1/2-Planung wurden
> inzwischen anders umgesetzt oder nie befüllt — siehe die jeweiligen
> Hinweise unten). Beantwortet für jede Tabelle: wozu dient sie, welche
> Etappe hat sie eingeführt, und welcher Etappe-9-Löschkategorie
> (`docs/PRIVACY_CONTROLS.md`) gehört sie an.

## 1. Kern-Konto und Legacy-Twin (vor Etappe 1)

| Tabelle | Zweck | Löschkategorie |
|---|---|---|
| `vt_users` | Login/Konto | Konto (vollständige Löschung, manuell geprüft) |
| `vt_user_profiles` | Basisprofil, Onboarding, `deletion_requested_at` | Konto |
| `vt_user_feedback` | generisches Beta-Feedback-Formular | `feedback` |
| `vt_twin_calculations` | Ergebnisse des biologischen-Alter-Rechners (Legacy-Feature, unabhängig vom Twin-Intelligence-Core) | Konto |
| `vt_marker_reference` | statische Referenzbereiche für Biomarker | — (keine Nutzerdaten) |

## 2. Chat (Etappe 2 Grundlage, Etappe 7 Logik)

| Tabelle | Zweck | Löschkategorie |
|---|---|---|
| `vt_chat_usage` | Tages-Nutzungszähler für "Frag deinen Twin" — **enthält nie den Nachrichteninhalt**, nur einen Zähler | `chat_history` |

## 3. Check-in, Habit, Goal Loops (Etappe 3)

| Tabelle | Zweck | Löschkategorie |
|---|---|---|
| `vt_daily_wellness_entries` | täglicher Check-in (`mood`, `energy`, `stress`, `sleep_hours`, `movement_minutes`, `note`, ...) | `checkins` |
| `vt_habits` | Gewohnheiten-Definitionen (`status`: active/paused/archived) | `habits` |
| `vt_habit_entries` | tägliche Abhak-Einträge je Gewohnheit | `habit_entries` |
| `vt_wellness_goals` | verfolgbare Ziele (`title`, `goal_type`, `status`, `target_date`, `deleted_at`) | `goals` |
| `vt_goal_actions` | geplante Aktionen zu einem Ziel (Schema seit Etappe 2, bislang von keinem Router befüllt) | `goals` (kaskadiert) |

Serverseitig berechnete Felder (`current_streak`, `completion_rate_7d`, ...)
sind **nicht** gespeichert — sie werden bei jedem Aufruf frisch aus
`vt_habit_entries` berechnet (`app/services/habit_service.py`), damit sie
nie mit den Rohdaten auseinanderlaufen können.

## 4. Recommendation Loop (Etappe 4)

| Tabelle | Zweck | Löschkategorie |
|---|---|---|
| `vt_recommendations` | regelbasierte Empfehlungen (`status`, `explanation` jsonb) | `recommendations` |
| `vt_recommendation_decisions` | Übernehmen/Ändern/Überspringen/Ablehnen | `recommendations` (kaskadiert) |
| `vt_recommendation_outcomes` | gemeldetes Ergebnis | `recommendations` (kaskadiert) |
| `vt_recommendation_feedback` | Hilfreichkeits-Bewertung | `recommendations` (kaskadiert) |

## 5. Twin Memory, Pattern, Learning Events (Etappe 5)

| Tabelle | Zweck | Löschkategorie |
|---|---|---|
| `vt_twin_memory` | gelernte Präferenzen/Routinen/Regeln (`memory_type`, `status`, `human_readable_value`, `confidence`, `deleted_at`) | `memories` |
| `vt_twin_patterns` | erkannte Korrelationen (`pattern_type`, `status`, `summary`, `contradicting`) | `patterns` |
| `vt_twin_learning_events` | strukturiertes, append-only Lern-Ereignisprotokoll (`event_type`, `previous_state`, `new_state`, `reason`) | nicht separat löschbar (reines Protokoll ohne sensible Freitexte, siehe `docs/DATA_RETENTION.md`) |

**Korrektur gegenüber der ursprünglichen Etappe-2-Planung:** `vt_twin_memory`
wurde in Etappe 5 nicht mit dem ursprünglich geplanten generischen
`memory_key`/`memory_value`-Schema umgesetzt, sondern additiv um die
konkreten Felder `memory_type` (8 feste Typen), `status` (6-stufiger
Lebenszyklus), `human_readable_value`, `source_references`, `confidence`
erweitert — siehe `docs/TWIN_MEMORY.md` für das tatsächliche Modell.

## 6. Reservierte, bislang ungenutzte Tabellen (Etappe 2 angelegt)

| Tabelle | Ursprünglicher Plan | Tatsächlicher Stand (nach Etappe 9) |
|---|---|---|
| `vt_twin_insights` | verdichtete, nutzerfreundlich formulierte Erkenntnisse, getrennt von rohen Patterns | **Nie befüllt.** Etappe 5 zeigt Pattern-`summary`s direkt an (bereits in der vorgeschriebenen "zeigt sich möglicherweise..."-Formulierung) — eine separate Verdichtungsstufe war nicht nötig. |
| `vt_twin_context_snapshots` | Protokoll des tatsächlich an die KI gesendeten Kontexts | **Nie befüllt.** Etappe 7 baut den Kontext bei jeder Chat-Anfrage frisch und zustandslos (`services/twin_context.py`), statt ihn zu persistieren — bewusste Entscheidung gegen zusätzliche Datenspeicherung, die selbst wieder Datenschutzfragen aufwerfen würde. |

Beide Tabellen bleiben im Schema (additive Migrationen löschen nie
Tabellen), sind aber leer und werden von keinem aktuellen Endpunkt gelesen
oder beschrieben — das wird hier bewusst dokumentiert, statt es zu
verschweigen.

## 7. Daily Planning, Reflection Loops (Etappe 6)

| Tabelle | Zweck | Löschkategorie |
|---|---|---|
| `vt_daily_plans` | Tagesplan-Kopf | `daily_plans` |
| `vt_daily_plan_actions` | einzelne Plan-Aktionen (`priority`, `status`, `goal_id`, `habit_id`, `recommendation_id`) | `daily_plans` (kaskadiert) |
| `vt_daily_reflections` | Abendreflexion (`completed_summary`, `helpful_note`, `difficult_note`, `mood`, `energy`) | `reflections` |
| `vt_weekly_reflections` | Wochenrückblick (`data_sufficient`, `positive_developments`, `patterns`) | `weekly_reflections` |

## 8. Privacy, Consent, Audit (Etappe 2 Grundlage, Etappe 9 Nutzung)

| Tabelle | Zweck |
|---|---|
| `vt_consent_records` | append-only Einwilligungs-Log, ein Eintrag pro Entscheidung (`consent_type`, `granted`, `granted_at`, `revoked_at`) |
| `vt_audit_events` | Compliance-Audit-Log (`action`, `entity_type`, `entity_id`, `metadata`) |

## 9. Konsistenzregeln über alle Twin-Tabellen hinweg

1. `source = "ai_generated"` oder `"calculated"` → niemals gleichzeitig
   `data_quality = "verified_source"` oder `"user_reported"`.
2. **`email` ist das durchgängige Skopierungsfeld** — nicht `user_id` (bei
   vielen Tabellen nullable und nicht durchgängig befüllt, siehe
   Etappe-1-Bericht). Jede Abfrage seit Etappe 2 filtert `.eq("email",
   email)` mit der serverseitig aus dem Session-Token aufgelösten E-Mail.
3. Wichtige Lernschritte werden als `vt_twin_learning_events` protokolliert
   (Etappe 5 §4, in Etappe 6/7 auf weitere Loops ausgeweitet) — die Brücke
   zwischen "eine Zeile wurde geschrieben" und "der Twin hat etwas gelernt".
4. Gelöschte Daten (Etappe 9 §2) verschwinden vollständig aus ihrer
   Tabelle — jede spätere Kontext-/Trend-/Empfehlungs-/Pattern-Abfrage liest
   dieselbe Tabelle erneut und kann eine gelöschte Zeile strukturell nicht
   mehr sehen (siehe `docs/PRIVACY_CONTROLS.md`).

