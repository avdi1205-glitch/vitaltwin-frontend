# VitalTwin — Twin Memory (TWIN_MEMORY.md)

> Erstellt in **Etappe 5 (Twin Intelligence Core)**. Dokumentiert das
> Memory-Modell, den Lebenszyklus, die Pattern-Detection-Regeln und die
> Twin Learning Events aus
> `backend/app/services/twin_memory.py`,
> `backend/app/services/pattern_detection.py`,
> `backend/app/routers/twin_memory.py` und
> `backend/app/core/learning_events.py`. Umgesetzter Loop:
> Constitution-Kapitel "Core Learning Loops" Nr. 19 (Memory Loop).

## 1. Grundprinzip

> "Der Twin darf eine einmalige Beobachtung nicht als absolute Wahrheit
> speichern." (Etappe 5 §1)

Jede automatisch erkannte Memory beginnt im Status `candidate` mit einer
gedeckelten Anfangs-Konfidenz (`INITIAL_CANDIDATE_CONFIDENCE = 0.4`) und wird
erst nach **wiederholter Beobachtung** (mindestens 3 verschiedene Tage, siehe
§5) oder einer **expliziten Nutzerbestätigung** weiter im Lebenszyklus
befördert. Die einzige Ausnahme: eine vom Nutzer selbst ausdrücklich
formulierte Aussage (`persoenliche_regel`, `bevorzugte_kommunikationsform`,
siehe §1.2) ist keine Beobachtung, sondern eine direkte Aussage — sie darf
sofort als `confirmed` gespeichert werden.

## 1.1 Speicherbare Memory-Typen

| Typ (`memory_type`) | Herkunft | Beispiel |
|---|---|---|
| `bestaetigte_praeferenz` | automatisch (≥2 angenommene Empfehlungen derselben Kategorie, keine Ablehnung) | "Bevorzugt Empfehlungen zu Schlaf" |
| `aktives_langfristiges_ziel` | automatisch (aktives Ziel ohne Zieldatum oder ≥30 Tage entfernt) | "Verfolgt das Ziel „Mehr Energie“" |
| `bevorzugte_aktivitaetszeit` | automatisch (Gewohnheit mit fester Erinnerungszeit + `completion_rate_30d ≥ 0,7`) | "Meditiert meist um 7 Uhr" |
| `erfolgreiche_routine` | automatisch (`completion_rate_30d ≥ 0,8` und `longest_streak ≥ 7`) | "Laufen funktioniert sehr zuverlässig" |
| `abgelehnter_empfehlungstyp` | automatisch (Kategorien-Malus ≥ 2, siehe `personalization.py`) | "Empfehlungen zu Bewegung werden meist abgelehnt" |
| `bestaetigtes_muster` | automatisch, aus einem bestätigten `TwinPattern` (Konfidenz ≥ 0,7, nicht widersprüchlich) | "Schlafdauer und Energie hängen möglicherweise zusammen" |
| `bevorzugte_kommunikationsform` | **nur explizit vom Nutzer** | "Möchte kurze, direkte Nachrichten" |
| `persoenliche_regel` | **nur explizit vom Nutzer** | "Erinnere mich nie an Alkohol-Tracking" |

## 1.2 Datenmodell

Tabelle `vt_twin_memory` (additiv erweitert in
`migrations/006_twin_memory_patterns_learning.sql`, ursprünglich in Etappe 2
angelegt):

| Feld | Typ | Bedeutung |
|---|---|---|
| `email` / `user_id` | text / bigint | Nutzertrennung (siehe §7) |
| `memory_type` | text | einer der acht Typen aus §1.1 |
| `memory_key` | text | interner Dedup-Schlüssel (z. B. `preferred_time:{habit_id}`) |
| `title` | text | kurzer Titel für die UI |
| `normalized_value` | jsonb | maschinenlesbarer Wert (z. B. `{"habit_id": "...", "reminder_time": "07:00"}`) |
| `human_readable_value` | text | der Satz, den der Nutzer sieht |
| `source` | text | `"calculated"` oder `"user_reported"` |
| `source_references` | jsonb | welche Felder/Ereignisse zur Erkennung führten, plus `"observed:{datum}"`-Marker für jede unabhängige (Re-)Erkennung |
| `confidence` | numeric | 0,05–0,95, siehe §4 |
| `status` | text | siehe §2 |
| `first_observed_at` / `last_confirmed_at` / `last_used_at` | timestamptz | Zeitstempel im Lebenszyklus |
| `user_confirmed` | boolean | ob der Nutzer je aktiv bestätigt hat |
| `expires_at` | timestamptz, optional | für zeitlich begrenzte Memories (aktuell ungenutzt) |
| `deleted_at` | timestamptz, optional | Soft-Delete-Zeitpunkt |

## 2. Statuswerte (`status`)

| Status | Bedeutung |
|---|---|
| `candidate` | automatisch beobachtet, noch nicht ausreichend bestätigt |
| `active` | mindestens 3× unabhängig (an verschiedenen Tagen) wiedererkannt |
| `confirmed` | vom Nutzer explizit bestätigt oder korrigiert, oder eine explizite Nutzeraussage |
| `disputed` | vom Nutzer abgelehnt — wird nicht mehr für Empfehlungen/KI-Kontext verwendet, bleibt aber sichtbar |
| `archived` | vom Nutzer archiviert — ausgeblendet, aber nicht gelöscht |
| `deleted` | vom Nutzer gelöscht (Soft-Delete über `deleted_at`) |

Nur `active` und `confirmed` gelten als **nutzbar** für zukünftige
Empfehlungen/KI-Kontext (`twin_memory.is_usable_for_recommendations`).

## 3. Memory-Kontrolle: "Was dein Twin über dich gelernt hat"

Frontend-Komponente `dashboard-twin-memory.tsx`, Endpunkte unter
`/api/memory`:

| Aktion | Endpunkt | Wirkung |
|---|---|---|
| Aktive Memories sehen | `GET /api/memory` | listet alle nicht gelöschten Memories, generiert währenddessen neue Kandidaten aus aktuellen Daten |
| Herkunft/Begründung sehen | (im Listenergebnis) | `source`, `source_references`, `human_readable_value` werden direkt angezeigt |
| Konfidenz verständlich sehen | (im Listenergebnis) | Frontend übersetzt `confidence` in "niedrig/mittel/hoch" statt einer rohen Zahl |
| Memory bestätigen | `POST /{id}/confirm` | Status → `confirmed`, Konfidenz steigt |
| Memory korrigieren | `POST /{id}/correct` | `human_readable_value`/`normalized_value` werden überschrieben, Status → `confirmed` |
| Memory ablehnen | `POST /{id}/reject` | Status → `disputed`, Konfidenz sinkt deutlich |
| Memory archivieren | `POST /{id}/archive` | Status → `archived` |
| Memory löschen | `DELETE /{id}` | Soft-Delete (`deleted_at`, Status → `deleted`) |

**Explizite Speicherung** (nur für `persoenliche_regel` /
`bevorzugte_kommunikationsform`): `POST /api/memory` mit `memory_type`,
`title`, `human_readable_value`.

### Nach Löschung (Etappe 5 §2)

- `is_usable_for_recommendations("deleted")` ist `False` — eine gelöschte
  Memory wird nie mehr für Empfehlungen oder einen zukünftigen KI-Kontext
  herangezogen.
- `reevaluate_dependent_candidates(...)` setzt alle noch unbestätigten
  Memories **desselben Typs** zurück auf `candidate` und senkt ihre
  Konfidenz — die Löschung einer Memory stellt implizit auch verwandte,
  noch nicht bestätigte Beobachtungen infrage. Bereits vom Nutzer
  `confirmed`e Memories werden davon nicht angetastet (eine explizite
  Bestätigung wiegt schwerer als eine erneute Beobachtung).

## 4. Konfidenzregeln

- Start: `INITIAL_CANDIDATE_CONFIDENCE = 0.4` für automatisch erkannte
  Kandidaten (nie höher ohne echte Bestätigung).
- Bestätigung (Nutzer oder erneute Beobachtung): `+0.15`, gedeckelt bei `0.95`.
- Ablehnung/Widerspruch: `-0.25`, mit einer Untergrenze von `0.05` (nie 0 —
  eine einmal gemachte Beobachtung wird nie vollständig "vergessen", nur als
  unwahrscheinlich markiert).
- Explizite Nutzeraussagen starten bei `0.95` (siehe §1: keine Beobachtung,
  sondern eine direkte Aussage).
- Muster-zu-Memory-Beförderung übernimmt die Konfidenz des zugrunde
  liegenden `TwinPattern` unverändert (keine künstliche Erhöhung).

## 5. Memory-Lebenszyklus

```
Beobachtung (Detektor in twin_memory.py)
  → Kandidat (status="candidate", confidence=0.4)
  → wiederholte Bestätigung (≥3 unabhängige "observed:{datum}"-Einträge
     in source_references, an verschiedenen Tagen)
  → aktive Memory (status="active")
  → Nutzerbestätigung (POST /confirm oder /correct)
  → bestätigte Memory (status="confirmed", user_confirmed=true)
  → Nutzung (last_used_at wird bei jedem GET /api/memory aktualisiert)
  → erneute Bewertung (jeder GET-Aufruf prüft erneut alle Detektoren;
     widersprochene/gelöschte/archivierte Memories werden dabei NIE
     automatisch wiederhergestellt — siehe NON_RESURRECTABLE_STATUSES)
  → Archivierung (POST /archive) oder Löschung (DELETE /{id})
```

Automatische Neu-Erkennung überschreibt niemals eine bereits getroffene
explizite Nutzerentscheidung (`disputed`/`archived`/`deleted` werden nie
automatisch zurückgesetzt) — nur eine ausdrückliche neue Aktion des Nutzers
kann das ändern.

## 6. Pattern Detection

Siehe [TWIN_LEARNING_RULES.md](./TWIN_LEARNING_RULES.md) für die
detaillierten Regeln aller sechs implementierten Pattern-Detektoren
(Schlafdauer/Energie, Bewegung/Stimmung, Stress/Schlafqualität,
Wochentag/Routinen, Empfehlungstyp/Erfolgsquote — Tageszeit/
Gewohnheitserfolg ist über `bevorzugte_aktivitaetszeit`-Memories abgedeckt).
Ein Pattern lebt in `vt_twin_patterns` mit eigenem Status (`active`/
`discarded`) und wird — sobald ausreichend konfident und nicht
widersprüchlich — automatisch zu einer `bestaetigtes_muster`-Memory befördert
(§1.1).

## 7. Twin Learning Events

`backend/app/core/learning_events.py::record_learning_event` schreibt
strukturierte, kurze Ereignisse nach `vt_twin_learning_events` — getrennt vom
Compliance-Audit-Log (`core/audit.py`). Felder: `email`/`user_id`,
`event_type`, `source_type`, `source_id`, `previous_state`, `new_state`,
`reason` (kurz, kein Freitext-Aufsatz).

| `event_type` | Wird ausgelöst bei |
|---|---|
| `praeferenz_erkannt` | neue Memory eines präferenzartigen Typs erkannt |
| `praeferenz_bestaetigt` | Kandidat → aktiv durch wiederholte Beobachtung |
| `memory_bestaetigt` | Nutzer bestätigt eine Memory explizit |
| `memory_korrigiert` | Nutzer korrigiert eine Memory |
| `memory_abgelehnt` | Nutzer lehnt eine Memory ab |
| `memory_archiviert` | Nutzer archiviert eine Memory |
| `memory_geloescht` | Nutzer löscht eine Memory |
| `memory_erstellt` | neue Memory eines sonstigen Typs erstellt (Ziel, abgelehnte Kategorie, explizite Nutzeraussage) |
| `muster_erkannt` | neues Pattern erstmals erkannt |
| `muster_verworfen` | Nutzer verwirft ein Pattern |
| `empfehlung_erfolgreich` | Recommendation-Outcome `completed` (Etappe 4, jetzt verdrahtet) |
| `empfehlung_abgelehnt` | Recommendation-Decision `rejected`/`skipped` (Etappe 4, jetzt verdrahtet) |
| `ziel_angepasst` | Ziel-Status/-Zielwert/-Zieldatum/-Titel geändert (Etappe 3, jetzt verdrahtet) |

Die letzten drei Events sind kleine, additive Ergänzungen an bereits
bestehenden Etappe-3/4-Endpunkten (`routers/recommendations.py`,
`routers/profile.py::update_goal`) — notwendig, damit die dort bereits
stattfindenden Lernschritte auch als `TwinLearningEvent` dokumentiert werden,
wie in Etappe 5 §4 gefordert.

`memory_bestaetigt`/`memory_abgelehnt`/`memory_archiviert` sind drei
zusätzliche, in Etappe 5 §4 nicht wörtlich aufgeführte Ereignistypen
(dort nur als "Beispiele" bezeichnet) — ergänzt, weil der Memory-Lebenszyklus
(§5) diese drei Nutzeraktionen explizit vorsieht und sie sonst nicht
dokumentierbar wären.

## 8. Nutzertrennung

Jede Memory/jedes Pattern ist über `email` skopiert; jeder Zugriff auf eine
fremde oder nicht existierende `id` liefert `404`, nie `403`
(`_require_own_memory`/`_require_own_pattern` in `routers/twin_memory.py`,
konsistent mit `core/auth.py` und Etappe 4).

## 9. Bekannte Grenzen

- Migration `006_twin_memory_patterns_learning.sql` ist geschrieben, aber
  **nicht gegen eine echte Datenbank ausgeführt** — wie alle bisherigen
  Migrationen in dieser Umgebung.
- Die Etappe-2-Tabellen `vt_twin_memory`/`vt_twin_patterns`/
  `vt_twin_learning_events` hatten ursprünglich nur `user_id not null` ohne
  `email`-Spalte — diese Migration behebt das additiv (siehe Kommentar am
  Dateianfang der Migration), analog zum durchgängigen
  Email-zuerst-Muster aller anderen Twin-Intelligence-Tabellen.
- Die "wiederholte Beobachtung" (3× unabhängig) wird über tägliche
  `"observed:{datum}"`-Marker in `source_references` gezählt statt über ein
  eigenes Zählfeld — bewusst so gewählt, um innerhalb der in Etappe 5 §1
  spezifizierten Feldliste zu bleiben (kein zusätzliches, nicht angefordertes
  Feld).
- `bevorzugte_kommunikationsform` kann aktuell nur über den generischen
  `POST /api/memory`-Endpunkt gespeichert werden — es gibt noch keine
  dedizierte UI (z. B. ein Kommunikationsstil-Einstellungsmenü), die diesen
  Typ automatisch anlegt.
