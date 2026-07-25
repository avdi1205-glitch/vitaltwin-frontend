# VitalTwin — AI Business Coach (AI_BUSINESS_COACH.md)

> Founder Operating System, Submodul E. Ergänzt
> [Founder Dashboard](../app/admin/founder/page.tsx) (A),
> [Daily Briefing](./FOUNDER_DAILY_BRIEFING.md) (B),
> [AI Founder Task Manager](./AI_FOUNDER_TASK_MANAGER.md) (C) und
> [Smart Approval Center](./SMART_APPROVAL_CENTER.md) (D) um eine
> geschäftsanalytische Ebene: aggregierte KPIs, regelbasierte Insights,
> Business Goals, Chancen/Risiken und ein AI-gestütztes Q&A-Feld.

## 1. Modulzweck

Der AI Business Coach unterstützt ausschließlich den Gründer bei
Geschäftsentscheidungen (Umsatz, Kosten, Wachstum, Premium, Affiliate,
Conversion, Bindung, Priorisierung). Er ist **kein Bestandteil des
Digital Twin** — er liest, schreibt und zeigt niemals individuelle
Wellness-, CGM-, Nutrition-, Schlaf-, Bewegungs-, Biomarker- oder
Twin-Memory-Daten. Nur aggregierte, geschäftlich notwendige, systemweite
Zahlen (siehe §2).

## 2. Datenquellen — was ist real, was nicht

| Datenquelle | Status | Verwendet in |
|---|---|---|
| Nutzerregistrierungen (`vt_users.created_at`) | ✅ echt | Dashboard, Wachstums-Insight |
| Premium-Status (`vt_users.premium`) | ✅ echt (nur Snapshot, kein Verlauf) | Conversion-Rate, Ziel "premium_abos" |
| Aktive Nutzer (`vt_daily_wellness_entries`) | ✅ echt | Ziel "aktive_nutzer" |
| Affiliate-Umsatz/-Kategorie (`vt_affiliate_events`, `vt_affiliate_products`, `vt_affiliate_categories`) | ✅ echt | Dashboard, Affiliate-Chance-Insight, Ziel "affiliate_umsatz" |
| Support-Feedback-Volumen (`vt_user_feedback.created_at`) | ✅ echt | Supportproblem-Insight |
| Veröffentlichte Inhalte (`vt_content_items.status='published'`) | ✅ echt | Ziel "veroeffentlichte_inhalte" |
| Offene Founder-Aufgaben/-Freigaben (`vt_founder_tasks`, `vt_founder_approvals`) | ✅ echt | Dashboard "Offene Gründerentscheidungen", Automation Score |
| Stripe-Umsatz (heute/Monat), MRR | ❌ nicht verbunden | Dashboard zeigt `null` + Hinweis |
| Neue Premium-Abos, Kündigungen, Tarifwechsel | ❌ nicht verbunden (kein Zeitstempel für Premium-Aktivierung, kein `subscription.deleted`-Handler) | Dashboard zeigt `null` + Hinweis |
| KI-Kosten, Infrastrukturkosten | ❌ nicht verbunden | Dashboard zeigt `null` + Hinweis |
| Funnel-/Seitenaufruf-/Feature-Nutzungsdaten | ❌ nicht integriert | Kein Conversion-Problem-/Produktproblem-Insight möglich |
| SEO-Daten, Serverfehler, API-Ausfälle, Release-Status | ❌ nicht integriert | Keine entsprechenden Insight-Kategorien aktiv |

**Keine Werte erfunden.** Jede nicht verbundene Quelle liefert `null` mit
einem `note`-Feld, das die fehlende Integration konkret benennt — nie eine
Schätzung (z. B. wird MRR **nicht** aus `Premium-Nutzer × Listenpreis`
berechnet, weil das keine echte Zahl wäre).

## 3. Datenmodell (Migration 015)

`backend/migrations/015_founder_business_coach.sql`:

- **`vt_founder_business_goals`** (FounderBusinessGoal)
- **`vt_founder_business_insights`** (FounderBusinessInsight — deckt auch
  "Chancen" und "Risiken" ab, siehe §5)
- **`vt_founder_business_recommendations`** (FounderBusinessRecommendation)
- **`vt_founder_coach_queries`** (FounderCoachQuery + FounderCoachResponse
  in einer Tabelle, da untrennbar)
- **`vt_founder_automation_events`** (FounderAutomationEvent, für den
  Automation Score)

**Bewusst nicht angelegt** (um keine doppelte, überlappende Infrastruktur
zu bauen — siehe die Anweisung, vor jedem neuen Modul auf Redundanz zu
prüfen):

- `FounderBusinessRisk`/`FounderBusinessOpportunity` als eigene Tabellen —
  Chancen/Risiken sind Insights, gefiltert nach `category` (`*_chance`
  bzw. `*_risiko`).
- `FounderMetricSnapshot` — Kennzahlen werden bei jedem Aufruf frisch aus
  den bereits zeitgestempelten Rohdaten berechnet (wie in
  `routers/founder.py`/`routers/founder_briefing.py`), Zeitfenster-
  Vergleiche (7 vs. 7 Tage) funktionieren direkt auf den Rohdaten ohne
  eine zusätzliche Snapshot-Tabelle.

## 4. Berechnungen (core/founder_business_metrics.py)

- **Konversionsrate**: `premium_users / total_users`, gerundet.
- **Affiliate-Umsatz je Kategorie**: Summe `vt_affiliate_events.revenue`
  (nur `event_type='conversion'`) gruppiert über `vt_affiliate_products.
  category_id` → `vt_affiliate_categories.name`.
- **Zeitfenster-Vergleiche**: `gte("created_at", vor_14_tagen)` minus
  `gte("created_at", vor_7_tagen)` ergibt die Vorwoche — keine gespeicherte
  Zeitreihe nötig.
- **Kleine-Gruppen-Schutz** (`small_group_guard`): jede Kennzahl aus
  weniger als `MIN_GROUP_SIZE = 5` Datensätzen wird als `None` mit Hinweis
  zurückgegeben, nie angezeigt — Datenschutzanforderung "verhindere
  Rückschlüsse auf einzelne Nutzer bei sehr kleinen Gruppen".

## 5. Insight-Regeln (core/founder_business_insight_engine.py)

**Kein LLM-Aufruf.** Wie bei jedem Founder-OS-Detector: ein deterministisches
Regelwerk, kein Sprachmodell. Von den 16 angefragten Insight-Kategorien
haben nur 3 eine aktive Regel, weil nur diese eine echte, vergleichbare
Zeitreihe haben:

| Kategorie | Regel | Schwelle |
|---|---|---|
| `wachstumschance` | Neue Registrierungen 7 Tage vs. vorherige 7 Tage | ≥ 20 % Anstieg, ≥ 5 Nutzer (Kleine-Gruppen-Schutz) |
| `affiliate_chance` | Affiliate-Umsatz je Kategorie 7 Tage vs. vorherige 7 Tage | ≥ 20 % Anstieg, echte Vorwoche > 0 |
| `supportproblem` | Feedback-Volumen 7 Tage vs. vorherige 7 Tage | ≥ 20 % Anstieg, ≥ 5 Einträge |

**Bewusst ohne Regel** (keine Datenquelle vorhanden): Umsatzchance,
Umsatzrisiko, Kostenrisiko, Conversion-Problem (als Trend — nur der
aktuelle Wert ist verfügbar, keine Zeitreihe), Kündigungsrisiko,
Premium-Chance (Monats-/Jahresabo nicht unterscheidbar, wie schon bei
PRO/FAMILY dokumentiert), Produktproblem, technisches Risiko,
KI-Kostenproblem, SEO-Chance, Release-Risiko. Datenqualitätsproblem wird
nicht als eigene Kategorie erzeugt, sondern strukturell über den
Kleine-Gruppen-Schutz abgedeckt.

**Idempotent**: `dedupe_key` pro Regel+Zeitraum verhindert Duplikate;
eine vom Gründer bereits entschiedene Insight (`umgesetzt`/`verworfen`/
`archiviert`) wird nie erneut geöffnet oder überschrieben. Insights lösen
sich anders als Tasks **nicht automatisch auf** — eine vergangene
Geschäftsveränderung bleibt ein Fakt, auch wenn sich die Zahl später
wieder ändert.

## 6. "Warum?"-Funktion

`GET /business-coach/insights/{id}/why` liefert ausschließlich bereits
beim Erkennen gespeicherte, echte Felder: verwendete Daten, Zeitraum,
Vergleichszeitraum, Berechnung (Beschreibungstext), Konfidenz, eine feste
Aussage "Beobachtung, keine Vermutung" (da jede Insight aus real
gemessenen Werten stammt) und `source_references` (Tabellen-/ID-Verweise).
Keine Blackbox — jedes Feld ist direkt nachvollziehbar im Code
(`core/founder_business_insight_engine.py`).

## 7. Chancen & Risiken

Keine eigenen Tabellen (siehe §3) — `GET /business-coach/opportunities`
und `GET /business-coach/risks` filtern `vt_founder_business_insights`
nach `category` (enthält `"chance"` bzw. `"risiko"`).

## 8. Business Goals

`vt_founder_business_goals` — Kategorien: `monatsumsatz`, `premium_abos`,
`aktive_nutzer`, `conversion_rate`, `affiliate_umsatz`, `kuendigungsrate`,
`ki_kostenlimit`, `veroeffentlichte_inhalte`, `individuell`. Fortschritt
wird bei jedem `GET /business-coach/goals` frisch berechnet
(`core/founder_business_goals.py::compute_goal_progress`) — real
berechenbar für `premium_abos`, `aktive_nutzer`, `conversion_rate`,
`affiliate_umsatz`, `veroeffentlichte_inhalte`; für `monatsumsatz`,
`kuendigungsrate`, `ki_kostenlimit` ehrlich "nicht automatisch
berechenbar" (siehe §2).

`explain_goal_progress` bewertet on-track/at-risk anhand des Verhältnisses
von Fortschritt zu verstrichener Zeit — **ohne Prognose, ohne Garantie**:
fehlen Werte, ist die Antwort ehrlich `None`/"nicht genug Datenpunkte",
nie eine erfundene Erfolgswahrscheinlichkeit.

## 9. Integration mit Task Manager (Submodul C) & Approval Center (Submodul D)

- `POST /business-coach/insights/{id}/send-to-tasks` — erstellt eine Zeile
  direkt in `vt_founder_tasks` (keine eigene Task-Infrastruktur), Priorität
  aus `severity` abgeleitet. Dedupliziert über
  `dedupe_key = f"business_coach_insight_{insight_id}"` — erneutes Senden
  erzeugt keinen zweiten Task.
- `POST /business-coach/recommendations/{id}/send-to-approval` — erstellt
  eine Zeile direkt in `vt_founder_approvals` (keine eigene Freigabe-
  Infrastruktur), Status startet bei `ki_geprueft`, **niemals** automatisch
  freigegeben — die Entscheidung bleibt beim Gründer im Approval Center.
  Dedupliziert über `dedupe_key = f"business_coach_recommendation_{id}"`.

Beide Übergaben nutzen die bestehenden Tabellen/Endpunkte der jeweiligen
Submodule direkt — keine parallele, überlappende Logik.

## 10. AI-Provider-Integration ("Frag deinen Business Coach")

**Einziger Ort in diesem Modul mit einem echten LLM-Aufruf.** Nutzt die
bestehende `services/ai_provider.py`-Abstraktion
(`generate_recommendation_explanation`, bereits für Empfehlungstexte
verwendet) — keine neue, direkte Anbieterbindung.

- **Kostenkontrolle vor dem Aufruf**: Sind weniger als `MIN_GROUP_SIZE`
  (5) Nutzer im System, wird gar nicht erst ein KI-Aufruf gemacht —
  Antwort ist sofort "Für diese Frage sind noch nicht genügend Daten
  vorhanden." (spart Kosten und ist ehrlich).
- **Rate Limit**: max. 20 Fragen pro Tag pro Admin (`core/rate_limit.py`,
  wiederverwendet).
- **Timeout/Retries**: geerbt von `OpenAIProvider` (20s Timeout, 1
  kontrollierter Retry) — keine neue Logik nötig.
- **Grounding**: Der System-Prompt verbietet dem Modell explizit, Zahlen
  zu erfinden oder einzelne Nutzer zu erwähnen; der Kontext enthält
  ausschließlich die bereits aggregierten Dashboard-Werte + Insight-Titel.
- **Schema-Validierung/Fehlerbehandlung**: geerbt von `AIProviderError` —
  bei einem Provider-Ausfall wird **keine erfundene Antwort** erzeugt,
  sondern ein `503` mit ehrlicher Fehlermeldung, protokolliert in
  `vt_founder_coach_queries.error`.

## 11. Kostenkontrolle

`GET /business-coach/cost-control` zeigt: Anzahl Anfragen, Fehlerquote,
durchschnittliche Antwortzeit (alle **echt**, aus
`vt_founder_coach_queries` berechnet) sowie das tägliche Fragenlimit.
**Tokenverbrauch/geschätzte Kosten sind ehrlich `null`** — die bestehende
`AIProvider`-Abstraktion (`services/ai_provider.py`) gibt keinen
Token-Verbrauch zurück, und dieses Modul erweitert diese gemeinsam
genutzte, bereits getestete Infrastruktur bewusst nicht, um kein Risiko
für den bestehenden Twin-Chat einzugehen. Das ist eine bekannte Grenze
(§13), keine vorgetäuschte Zahl.

## 12. Berechtigungen

Wiederverwendet **exakt** `view_founder_os`/`manage_founder_os` (kein
neues, fragmentiertes Berechtigungspaar) — serverseitig geprüft in jedem
einzelnen Endpunkt (`require_admin_permission`), nicht nur im Frontend-
Menü. Normale Nutzer, Support und Editor haben keinen Zugriff (diese
Rollen haben `view_founder_os` nie erhalten). Eine Analyst-Rolle könnte
das Recht künftig explizit erhalten, hat es aber standardmäßig nicht.

## 13. Datenschutz

- Keine individuellen Wellness-/CGM-/Nutrition-/Schlaf-/Bewegungsdaten,
  keine Twin-Memories — dieses Modul liest ausschließlich die in §2
  genannten aggregierten Tabellen.
- Kleine-Gruppen-Schutz (`MIN_GROUP_SIZE = 5`) verhindert Rückschlüsse auf
  einzelne Nutzer bei kleinen absoluten Zahlen.
- Der KI-Kontext für "Frag deinen Business Coach" enthält ausschließlich
  bereits aggregierte Zahlen — nie eine Nutzer-E-Mail, nie eine
  Einzelperson.

## 14. Automatisierung & Automation Score

Automatisch: Kennzahlen aktualisieren, Veränderungen/Chancen/Risiken
erkennen (Insights), Aufgaben/Freigaben vorbereiten (Handoff), Ziel-
Fortschritt berechnen. Manuell durch den Gründer: jede Preis-/Tarif-/
Partner-/Veröffentlichungs-/Rechtsentscheidung — dieses Modul kann davon
**keine einzige** automatisch ausführen (siehe §"Keine automatische
Ausführung" im Auftrag).

`GET /business-coach/automation-score` berechnet den Automatisierungsgrad
**aus echten Prozessdaten** (`vt_founder_automation_events` vs. offene
Tasks/Approvals) — **kein fester Prozentsatz**. Ist noch nichts passiert,
lautet die ehrliche Antwort "Noch keine Prozessdaten vorhanden."

## 15. Bekannte Grenzen

- Kein Token-/Kosten-Tracking für KI-Aufrufe (siehe §11) — die
  Rate-Limit-Grenze (20/Tag) ist der einzige echte Kostenschutz.
- Kein MRR, keine Stripe-Umsatzzahlen, keine Kündigungs-/Tarifwechsel-
  Erkennung — dieselbe Lücke wie in F1/F2 bereits dokumentiert, hier
  konsistent wiederholt statt umgangen.
- Conversion-Rate hat keinen Trend (nur den aktuellen Wert) — keine
  historische Zeitreihe gespeichert.
- Kein Funnel-/Feature-Nutzungs-/SEO-/Server-/Release-Tracking — daher
  keine Insight-Regeln für diese 2/3 der angefragten Kategorien.
- Route ist der 5. Tab in der bereits konsolidierten Founder-OS-Seite
  (`/admin/founder`), nicht die im Auftrag genannte separate Route
  `/admin/founder/business-coach` — bewusste Abweichung, um die
  bestehende Konsolidierung (siehe Submodul D §9) nicht zu brechen.

## 16. API-Referenz

| Methode | Pfad | Berechtigung |
|---|---|---|
| GET | `/business-coach/dashboard` | `view_founder_os` |
| GET | `/business-coach/insights`, `/opportunities`, `/risks` | `view_founder_os` |
| GET | `/business-coach/insights/{id}/why` | `view_founder_os` |
| PATCH | `/business-coach/insights/{id}/status` | `manage_founder_os` |
| POST | `/business-coach/insights/{id}/send-to-tasks` | `manage_founder_os` |
| GET/POST | `/business-coach/recommendations` | `view_founder_os` / `manage_founder_os` |
| POST | `/business-coach/recommendations/{id}/send-to-approval` | `manage_founder_os` |
| GET/POST | `/business-coach/goals` | `view_founder_os` / `manage_founder_os` |
| PATCH | `/business-coach/goals/{id}/status` | `manage_founder_os` |
| POST | `/business-coach/ask` | `manage_founder_os` |
| GET | `/business-coach/cost-control` | `view_founder_os` |
| GET | `/business-coach/automation-score` | `view_founder_os` |
