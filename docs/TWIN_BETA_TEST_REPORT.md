# VitalTwin — Twin Beta Test Report (TWIN_BETA_TEST_REPORT.md)

> Erstellt in **Etappe 10 (Twin Intelligence Core — Beta-Abnahme)**.
> Zusammenfassender Testbericht über alle Etappen 1–10. Jede Zahl in diesem
> Dokument stammt aus einem tatsächlich ausgeführten Testlauf in dieser
> Session (Befehle unten dokumentiert) — keine geschätzten oder behaupteten
> Ergebnisse.

## 1. Testausführung (Etappe 10, dieser Durchlauf)

```
cd backend; .\venv\Scripts\python.exe -m pytest tests\ -q
→ 424 passed
```

```
cd frontend; npx tsc --noEmit        → keine Ausgabe (0 Fehler)
cd frontend; npm run lint            → keine Ausgabe (0 Fehler)
cd frontend; npm run build           → erfolgreich, 26 Routen
```

Backend-Testverteilung (Auszug, vollständige Liste in
`backend/tests/`): 33 Testdateien, u. a. `test_full_loop_integration.py`
(neu, Etappe 10 §1), `test_session_expiry.py` (neu, Etappe 10 §2),
`test_migrations_safety.py` (neu, Etappe 10 §15).

## 2. Vollständiger End-to-End-Loop (Etappe 10 §1)

Getestet in `backend/tests/test_full_loop_integration.py` (9 Tests, alle
grün) — echte Produktionsfunktionen verkettet, keine Mocks der
Geschäftslogik:

| Schritt | Funktion | Ergebnis |
|---|---|---|
| 1. Ausgangsdaten | 7 Tage Check-ins, 4× Schlaf < 6,5h | ✅ Datensatz konstruiert |
| 2. Auswertung | `recommendation_rules.evaluate_sleep_rule(...)` | ✅ erkennt Muster, liefert `RecommendationDraft` |
| 3. Empfehlung | `routers.recommendations._draft_to_payload(...)` | ✅ `status="proposed"`, `category="schlaf"` |
| 4. Nutzerentscheidung | Status → `"accepted"` | ✅ |
| 5. geplante Aktion | `daily_planning.generate_daily_plan_actions(...)` | ✅ Aktion mit `recommendation_id` erzeugt |
| 6. Umsetzung / 7. Ergebnis | `outcome_status="completed"` → Status `"completed"` | ✅ |
| 8. Feedback | `helpfulness="helpful"` | ✅ |
| 9. aktualisierte Präferenz | `twin_memory.detect_confirmed_preference(...)` | ✅ liefert `bestaetigte_praeferenz`-Kandidat |
| 10. nächste angepasste Empfehlung | `personalization.should_deprioritize_category(...)` filtert zukünftige Empfehlungen derselben (hier: abgelehnten) Kategorie heraus | ✅ demonstriert am negativen Verstärkungspfad (siehe Hinweis unten) |

**Ehrlicher Hinweis zu Schritt 10:** eine *positiv* bestätigte Präferenz
(wiederholt angenommen) verändert aktuell **nicht** die Priorisierung in
`recommendation_rules.py` selbst — sie wird als Memory gespeichert und
fließt in den Twin-Chat-Kontext ein (siehe
`test_confirmed_preference_memory_is_visible_in_future_twin_context`). Die
konkrete, im Code nachweisbare "nächste Empfehlung wird angepasst"-Wirkung
ist der **negative** Pfad: wiederholte Ablehnung senkt nachweislich die
Wahrscheinlichkeit, dieselbe Kategorie erneut vorgeschlagen zu bekommen
(`personalization.should_deprioritize_category`, Schwelle ≥ 2 Ablehnungen).
Beides ist im Test einzeln nachgewiesen — nichts wird hier behauptet, ohne
dass ein Test es tatsächlich zeigt.

## 3. Getestete Funktionsbereiche (Kurzübersicht, jede Zeile hat reale Testabdeckung)

| Bereich | Testdatei(en) | Abdeckung |
|---|---|---|
| Auth/Nutzertrennung | `test_auth.py`, `test_session_expiry.py` | 401 bei fehlendem/ungültigem/abgelaufenem Token, 404 (nicht 403) bei fremder ID |
| Check-in (Daten) | `test_checkin_habit_goal_models.py`, `test_validation.py` | Validierung, Zeitzone, ungültige Werte |
| Habits | `test_habit_service.py`, `test_streaks.py` | Streak, längste Serie, 7-/30-Tage-Quote |
| Ziele | `test_checkin_habit_goal_models.py` | Statusübergänge, Validierung |
| Empfehlungen | `test_recommendation_rules.py`, `test_recommendation_models.py`, `test_explainability.py` | Erzeugung, Entscheidung, "Warum?" |
| Feedback/Personalisierung | `test_personalization.py` | Kategorien-Malus, Duplikat-Sperre |
| Memory | `test_twin_memory.py`, `test_twin_memory_models.py`, `test_twin_memory_router.py` | Lebenszyklus, Nutzertrennung |
| Patterns | `test_pattern_detection.py` | Mindestdaten, Widerspruch, Konfidenz |
| Planung/Reflexion | `test_daily_planning.py`, `test_daily_planning_router.py`, `test_weekly_reflection.py`, `test_monthly_progress.py`, `test_twin_maturity.py` | Priorisierung, max. 3 Aktionen, Datengrenzen |
| KI/Chat | `test_ai_provider.py`, `test_twin_context.py`, `test_twin_conversation.py`, `test_chat_router.py` | Timeout, Retry, Rate-Limit, Schema-Validierung, Prompt-Injection, Medizin-Gate |
| Privacy/Export/Löschung | `test_privacy_export.py`, `test_privacy_router.py`, `test_profile_export.py` | Kategorie-Löschung, Consent-Historie, Export-Größenlimit |
| Migrationen | `test_migrations_safety.py` | additiv-only, sequenziell nummeriert |
| Voller Loop | `test_full_loop_integration.py` | siehe §2 |

**Gesamt: 424 Backend-Tests, alle grün.**

## 4. Sicherheitsstatus

- **Nutzertrennung:** jeder Etappe-2+-Endpunkt löst `email` ausschließlich
  serverseitig aus dem Session-Token auf; jede Datenbankabfrage ist
  `.eq("email", email)` skopiert; jeder Zugriff auf eine fremde/nicht
  existierende Ressource liefert `404`, nie `403` (Anti-Enumeration).
- **Manipulierte IDs/userId:** `userId` wird nirgends vom Client
  akzeptiert; IDs in der URL werden immer gegen die aufgelöste `email`
  geprüft, nie gegen sich selbst vertraut.
- **Legacy-Inkonsistenz gefunden, kein Sicherheitsrisiko:** siehe
  [TWIN_BETA_LIMITATIONS.md](./TWIN_BETA_LIMITATIONS.md) §7 — zwei
  Alt-Endpunkte nutzen Token-im-Body statt Header, validieren aber
  weiterhin korrekt.
- **Admin-/Support-Rollen:** **existieren nicht** in diesem Produkt (nur
  `free`/`premium`-Unterscheidung). Das ist keine Lücke gegenüber einer
  geplanten Funktion, sondern schlicht (noch) nicht gebaut — für die Beta
  ohne Admin-Bedienoberfläche unkritisch, aber als offener Punkt für den
  Support-Betrieb zu vermerken (siehe TWIN_BETA_RELEASE_CHECKLIST.md).
- **Prompt-Injection/Systemprompt-Abfrage:** deterministisch abgefangen
  (`twin_conversation.py::detect_prompt_injection`), vor jedem KI-Aufruf.
- **Medizinische Sicherheit:** zweifach abgesichert (Eingabe- und
  Ausgabe-Gate, `contains_medical_red_flag`), plus Systemprompt-Verbote.

## 5. Datenschutzstatus

- 7 getrennte Einwilligungszwecke, append-only Log, Widerruf technisch
  sofort wirksam (`resolve_current_consents`).
- Vollständiger Export (16 Kategorien) + optionaler CSV-Export je Kategorie,
  beide ausschließlich für den anfragenden Nutzer.
- 12 löschbare Datenkategorien, vollständige Kontolöschung (manuell
  geprüft).
- Audit-Events für Erstellung/Aktualisierung/Löschung/Export/
  Kontolöschungsanfrage/Einwilligungsänderung.
- Details: [PRIVACY_CONTROLS.md](./PRIVACY_CONTROLS.md).

## 6. Datenintegritätsstatus

- Alle 8 Migrationen sind additiv-only (statisch verifiziert,
  `test_migrations_safety.py`) — kein `drop table`/`drop column`/
  `truncate`/`delete from` in irgendeiner Migration.
- Gelöschte Daten verschwinden strukturell garantiert aus Kontext, Trends,
  Empfehlungen, Mustern (jede Abfrage liest die Tabelle erneut, siehe
  PRIVACY_CONTROLS.md §2).
- **Kein Datenverlust-Risiko durch diese Etappe:** keine neuen
  destruktiven Operationen eingeführt.
- **Nicht verifiziert (kein Infrastrukturzugriff):** tatsächliche
  Ausführung der Migrationen gegen eine echte Datenbank, echter
  Wiederherstellungstest (siehe BACKUP_AND_RESTORE.md).

## 7. Performance-Status (ehrlich, Etappe 10 §13)

| Aspekt | Befund |
|---|---|
| Unnötige Requests | Jede Dashboard-Karte lädt ausschließlich ihre eigenen Daten über einen dedizierten Endpunkt — keine doppelten identischen Requests beobachtet. |
| N+1-Abfragen | Innerhalb eines Requests (z. B. Twin-Context-Aufbau) werden mehrere Tabellen **sequenziell** einzeln abgefragt (Profil, Ziele, Gewohnheiten, Check-ins, Memories, Empfehlungen, Muster, Tagesplan) — das ist kein klassisches N+1 (kein Pro-Zeile-Query), aber es sind ca. 8-10 Einzelabfragen pro Chat-Anfrage. Für die Beta-Nutzerzahlen unkritisch, für Skalierung ein Optimierungskandidat (z. B. paralleles Abfragen). |
| Große Datenmengen | Trends nutzen aggregierte 7-/30-Tage-Fenster statt voller Historie; Chat-Kontext ist zeichenbasiert gedeckelt (`get_context_char_limit`); Export ist zeilenbasiert gedeckelt (`MAX_SYNC_EXPORT_ROWS=5000`). |
| Pagination | Es gibt aktuell **keine echte Seiten-Pagination** (z. B. "Seite 2 der Empfehlungshistorie") — bislang nicht nötig, da keine Ansicht unbegrenzt wächst; als späterer Ausbau vorgemerkt. |
| Dashboard-Ladezeit | Nicht mit echten Produktionsdaten gemessen (kein Backend-Zugriff in dieser Session) — strukturell: 8 unabhängige Karten laden parallel (jede eigener `useEffect`), kein serieller Wasserfall zwischen ihnen. |
| KI-Kontextgröße | Hart begrenzt pro Tarif (600/1500/2500 Zeichen), siehe TWIN_CONTEXT.md. |
| Mobile CPU-Last | Keine aufwändigen Animationen/Berechnungen im Client; alle Aggregationen laufen serverseitig. Nicht mit einem echten Mobilgerät gemessen. |
| Client-Bundle | Kein Bundle-Analyzer in dieser Session ausgeführt; `next build` meldet keine Größenwarnung. |
| Datenbankindizes | Jede `email`-skopierte Tabelle hat einen `idx_*_email`-Index (seit Etappe 1-9 durchgängig ergänzt) — siehe TWIN_DATA_DICTIONARY.md. |

## 8. Responsive-Ergebnisse

Per Playwright-Viewport-Messung gegen den lokal laufenden Dev-Server
(`/dashboard`, `/profil`) bei 320/375/390/768(Tablet hoch)/1024(Tablet
quer)/1366(Laptop)/1920(Desktop)px: **an keiner Breite eine horizontale
Scrollbar** (`document.documentElement.scrollWidth <= clientWidth` an
jedem Messpunkt). Tastaturnavigation (Tab) bewegt den Fokus sichtbar durch
interaktive Elemente. Hellmodus: nicht vorhanden (bewusste
Produktentscheidung, siehe TWIN_BETA_LIMITATIONS.md §4) — Test daher nicht
anwendbar, nicht fehlgeschlagen.

## 9. Bekannte Fehler (Stand Etappe 10)

**Keine kritischen Fehler gefunden.** Ein Build-Versuch in Etappe 4 schlug
einmalig wegen eines vorübergehenden Netzwerkfehlers beim Laden von Google
Fonts fehl — beim sofortigen Retry erfolgreich, kein Code-Defekt (siehe
Etappe-4-Bericht). Alle in dieser Etappe neu geschriebenen Tests (21 Stück:
9 Loop-Integration + 4 Session-Expiry + 8 Migrationssicherheit) sind beim
ersten Lauf grün gewesen, keine Nacharbeit nötig.

## 10. Offene Beta-Punkte (nicht kritisch)

Siehe [TWIN_BETA_LIMITATIONS.md](./TWIN_BETA_LIMITATIONS.md) für die
vollständige, kategorisierte Liste. Kurzfassung: kein Hellmodus (gewollt),
keine Admin-/Support-Rollen, keine automatisierte Aufbewahrungs-Bereinigung,
kein verifizierter Datenbank-Restore-Test, zwei stilistisch inkonsistente
Legacy-Auth-Endpunkte (kein Sicherheitsrisiko), kein Background-Job für
sehr große Exporte.
