# VitalTwin — Twin Beta Limitations (TWIN_BETA_LIMITATIONS.md)

> Erstellt in **Etappe 7 (Twin Intelligence Core)**. Zentrale, ehrliche
> Übersicht der bekannten Grenzen des Twin-Conversation-Features und der
> Tarifstruktur — damit "keine erfundene Sicherheit" (Etappe 7 §6) auch für
> das Gesamtsystem gilt, nicht nur für einzelne Antworten.

## 1. Tariflimits (Etappe 7 §7)

Zentral verwaltet in `backend/app/core/plans.py`, serverseitig durchgesetzt
in `routers/chat.py` — nie im Frontend nachgebildet oder umgehbar.

| Tarif | KI-Anfragen/Tag | Kontext-Zeichenbudget | Rückblicke |
|---|---|---|---|
| FREE | 3 | 600 (klein, nur das Nötigste) | Basis (regelbasierter Wochenrückblick, Etappe 6) |
| PREMIUM | 30 | 1500 (erweitert) | ausführlicher (mehr Kontext fließt ein) |
| PRO | 60 | 2500 (mehr Langzeitkontext) | tiefere Personalisierung durch mehr Kontext |
| FAMILY | 30 | 1500 | wie PREMIUM |

**FAMILY — getrennte private Profile:** Jedes Familienmitglied hat einen
eigenen Login (eigene `email`), keine gemeinsame Familien-ID. Jede
Context-Abfrage ist ausschließlich `.eq("email", email)` skopiert (siehe
[TWIN_CONTEXT.md](./TWIN_CONTEXT.md)) — "keine automatische gegenseitige
Dateneinsicht" gilt daher bereits strukturell, ohne zusätzlichen Code, weil
kein Profil je die `email` eines anderen Familienmitglieds verwenden kann.

## 2. Bekannte Einschränkungen

- **PRO/FAMILY nicht in der Datenbank unterscheidbar:** `vt_users` speichert
  aktuell nur ein boolesches `premium`-Flag (siehe Etappe-1-Bericht). PRO-
  und FAMILY-Konten werden serverseitig wie PREMIUM behandelt, bis ein
  echtes `plan`-Feld existiert. Die in der Tabelle oben gezeigten
  PRO-spezifischen Werte (Kontingent 60, Budget 2500) sind bereits im Code
  vorbereitet, greifen aber erst, sobald `_current_plan(...)` PRO wirklich
  erkennen kann.
- **Kein längeres Trend-Fenster pro Tarif:** Trends im Chat-Kontext nutzen
  immer ein 7-Tage-Fenster, unabhängig vom Tarif — "mehr Langzeitkontext"
  bezieht sich in dieser Etappe nur auf das Zeichenbudget (mehr andere
  Blöcke passen hinein), nicht auf ein längeres Trend-Fenster selbst.
- **Migration nicht ausgeführt:** Etappe 7 fügt keine neue Migration hinzu
  (keine neuen Tabellen nötig) — die bestehende Datenbank-Einschränkung aus
  allen vorherigen Etappen (keine Live-Datenbankverbindung in dieser
  Umgebung) besteht unverändert fort.
- **Rate Limiting ist In-Memory:** `core/rate_limit.py` (wiederverwendet für
  den IP-basierten Chat-Rate-Limit) hält Zustand nur pro Prozess — bei
  mehreren Backend-Instanzen (horizontale Skalierung) wird das Limit nicht
  synchronisiert. Dokumentiert als bereits bekannte Einschränkung im Modul
  selbst.
- **Keine echte Kostenobergrenze pro Zeitraum:** Kostenkontrolle erfolgt
  über Tageskontingent + begrenzte Tokens/Retries/Nebenläufigkeit, nicht
  über ein tatsächliches Euro-Budget-Tracking gegenüber dem OpenAI-Konto.
- **Kein API-Schlüssel in dieser Umgebung konfiguriert:** Alle KI-Aufrufe
  sind vollständig geschrieben und getestet (via `httpx.MockTransport`),
  aber nie gegen die echte OpenAI-API ausgeführt worden — es ist kein
  `OPENAI_API_KEY` in dieser Session verfügbar.
- **`generate_weekly_reflection_narrative`/`generate_recommendation_explanation`
  sind implementiert, aber nicht in eine UI verdrahtet** — siehe
  [TWIN_INTELLIGENCE_ARCHITECTURE.md](./TWIN_INTELLIGENCE_ARCHITECTURE.md)
  für die bewusste Begründung.

## 3. Wellness-Positionierung (unverändert seit Etappe 1)

VitalTwin bleibt ein Wellness-Tool, keine Medizinprodukt-Positionierung —
siehe die durchgängigen medizinischen Grenzen in
[TWIN_SAFETY.md](./TWIN_SAFETY.md).
