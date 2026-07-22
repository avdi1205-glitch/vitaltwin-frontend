# VitalTwin — Datenwörterbuch (DATA_DICTIONARY.md)

> Erstellt in **Etappe 2 (Twin Intelligence Core)**. Referenz für jede
> Tabelle: Zweck, Felder, Quelle, Validierung, Beziehungen, Indizes,
> Aufbewahrung/Löschverhalten. Siehe auch `DATA_ARCHITECTURE.md` (Prinzipien)
> und `TWIN_DATA_DICTIONARY.md` (Fokus auf die Twin-Intelligence-Tabellen).
>
> Legende Löschverhalten: **Cascade** = wird mit dem Elterndatensatz gelöscht
> · **Set null** = FK wird auf `NULL` gesetzt, Zeile bleibt bestehen ·
> **Manuell** = nur über `/api/profile/request-deletion`-Workflow (geprüfte
> Löschung, siehe Constitution/AGB).

## Bereits bestehende Tabellen (vor Etappe 2, hier nur die Erweiterung dokumentiert)

### `vt_users`
- **Zweck:** Konto/Login. **Eigentümer:** sich selbst (`id` ist der Anker
  für `user_id` in allen anderen Tabellen).
- **Neu in Etappe 2:** nichts geändert (bewusst nicht angefasst).

### `vt_user_profiles`
- **Zweck:** Stammdaten + Onboarding-Auswahl (u. a. `wellness_goals text[]`
  für die schnelle Mehrfachauswahl — bleibt bestehen, siehe
  `vt_wellness_goals` für die volle Zielverfolgung).
- **Neu in Etappe 2:** `user_id bigint` (nullable, FK `vt_users.id`,
  **Set null**).
- **Quelle:** `onboarding`, `manual`. **Validierung:** vorhandene
  Pydantic-Regeln in `routers/profile.py` (unverändert).

### `vt_daily_wellness_entries`
- **Zweck:** Tages-Check-in (entspricht dem Etappe-2-Modell `DailyCheckIn` —
  bewusst erweitert statt dupliziert).
- **Neu in Etappe 2:** `user_id` (nullable, **Set null**), `mood int`,
  `motivation int`, `sleep_quality int`, `recovery int` (alle 1-10, siehe
  `validate_scale_1_to_10`), `timezone text` (IANA, Default
  `Europe/Berlin`), `source text` (Default `manual`), `data_quality text`
  (Default `user_reported`), `updated_at timestamptz`.
- **Beziehungen:** `user_id → vt_users.id`.
- **Indizes:** bestehend `unique(email, entry_date)`; neu
  `idx_..._user_id_entry_date (user_id, entry_date)`.
- **Aufbewahrung:** unbegrenzt, bis Nutzer Löschung beantragt.

### `vt_habits` / `vt_habit_entries`
- **Zweck:** Gewohnheiten + tägliche Erledigung (Habit Loop).
- **Neu in Etappe 2:** `user_id` (beide Tabellen, **Set null**), `source`
  (beide), `data_quality` (nur `vt_habit_entries`).
- **Bekannte Lücke:** Das Dashboard-Widget nutzt aktuell `localStorage`
  statt dieser Tabellen (siehe `DATA_ARCHITECTURE.md`).

---

## Neue Tabellen (Etappe 2)

Alle neuen Tabellen: `id uuid default gen_random_uuid()`,
`created_at timestamptz default now()`, meist `updated_at`. `user_id` ist
`bigint references vt_users(id)`, außer explizit anders vermerkt.

| Tabelle | Zweck | Wichtige Felder | Quelle | Beziehungen | Index/Constraint |
|---|---|---|---|---|---|
| `vt_wellness_goals` | Verfolgbares Ziel (Goal Loop) | `goal_type`, `status`, `target_value`, `target_date` | manual, onboarding | `user_id → vt_users` | `(user_id, created_at)`, `(user_id, status)` partiell auf `active` |
| `vt_goal_actions` | Aktion zu einem Ziel | `description`, `status`, `due_date` | manual, calculated | `goal_id → vt_wellness_goals` (Cascade) | `(goal_id)`, `(user_id, created_at)` |
| `vt_daily_plans` | Tagesplan (Daily Planning Loop) | `local_date`, `timezone`, `status` | calculated | `user_id → vt_users` | **unique** `(user_id, local_date)` |
| `vt_daily_plan_actions` | Einzelaktion im Tagesplan | `description`, `sort_order`, `status` | calculated | `daily_plan_id → vt_daily_plans` (Cascade) | `(daily_plan_id)` |
| `vt_daily_reflections` | Abendreflexion | `what_went_well`, `what_to_improve`, `mood`, `energy` | manual | `user_id → vt_users` | **unique** `(user_id, local_date)` |
| `vt_weekly_reflections` | Wochenreflexion (Muster) | `week_start_date`, `patterns jsonb`, `summary` | calculated | `user_id → vt_users` | **unique** `(user_id, week_start_date)` |
| `vt_recommendations` | Twin-Empfehlung | `category`, `text`, `status`, `confidence` | calculated, ai_generated | `user_id → vt_users` | `(user_id, created_at)`, `(user_id, status)` partiell auf `pending` |
| `vt_recommendation_decisions` | Nutzer-Entscheidung zu einer Empfehlung | `decision`, `decided_at` | manual | `recommendation_id → vt_recommendations` (Cascade) | `(recommendation_id)` |
| `vt_recommendation_outcomes` | Ergebnis nach Umsetzung | `outcome_status`, `result_notes` | manual, calculated | `recommendation_id → vt_recommendations` (Cascade) | `(recommendation_id)` |
| `vt_recommendation_feedback` | Bewertung einer Empfehlung (1-5) | `rating`, `comment` | manual | `recommendation_id → vt_recommendations` (Cascade) | `(recommendation_id)`, `check (rating between 1 and 5)` |
| `vt_twin_memory` | Langfristige Präferenzen/Fakten | `memory_key`, `memory_value jsonb`, `active` | calculated | `user_id → vt_users` (Cascade) | **unique** `(user_id, memory_key)`, partieller Index auf `active` |
| `vt_twin_patterns` | Erkanntes Muster | `pattern_type`, `confidence`, `data_quality` | calculated | `user_id → vt_users` (Cascade) | `(user_id, detected_at)` |
| `vt_twin_insights` | Verdichtete Erkenntnis für den Nutzer | `insight_type`, `text`, `confidence` | calculated, ai_generated | `user_id → vt_users` (Cascade) | `(user_id, created_at)` |
| `vt_twin_learning_events` | Append-only Lernprotokoll | `event_type`, `payload jsonb` | calculated | `user_id → vt_users` (Cascade) | `(user_id, created_at)` |
| `vt_twin_context_snapshots` | Kompakter KI-Kontext (Explainability) | `snapshot jsonb`, `reason` | calculated | `user_id → vt_users` (Cascade) | `(user_id, created_at)` |
| `vt_consent_records` | Einwilligungshistorie | `consent_type`, `granted`, `granted_at`, `revoked_at` | manual | `user_id → vt_users` | `(user_id)` |
| `vt_audit_events` | Audit-Log | `action`, `entity_type`, `entity_id`, `metadata jsonb` | system | `user_id → vt_users` (**Set null**) | `(user_id, created_at)`, `(entity_type, entity_id)` |

**Löschverhalten (Kontolöschung):** Alle neuen Tabellen mit `on delete
cascade` werden automatisch mitgelöscht, sobald `vt_users`-Zeile gelöscht
wird (was aktuell nur nach manueller Prüfung über
`/api/profile/request-deletion` geschieht, nie automatisch/sofort — siehe
Constitution und AGB). `vt_audit_events` nutzt bewusst **Set null** statt
Cascade, damit das Audit-Protokoll auch nach einer Kontolöschung als
anonymisierter Nachweis bestehen bleibt.

**KI-Antworten als Werte:** In `vt_recommendations`/`vt_twin_insights` ist
`source = "ai_generated"` erlaubt — aber niemals `data_quality =
"verified_source"` oder `"user_reported"` für einen KI-generierten Wert
(siehe Etappe 2 §7/§8 und `DATA_ARCHITECTURE.md`).
