# VitalTwin — Privacy Controls (PRIVACY_CONTROLS.md)

> Erstellt in **Etappe 9 (Twin Intelligence Core)**. Dokumentiert Export,
> Löschung, Einwilligungen und die Privacy-UI —
> `backend/app/routers/privacy.py`, `backend/app/services/privacy_export.py`,
> die Erweiterung von `backend/app/routers/profile.py::export_profile`, und
> `frontend/app/components/privacy-controls.tsx`.

## 1. Datenexport (Etappe 9 §1)

**Vollständiger JSON-Export:** `GET /api/profile/export` (bereits seit
Etappe 2 vorhanden, in Etappe 9 auf alle Kategorien erweitert). Enthält:
Profil, Check-ins, Ziele, Gewohnheiten, Gewohnheitseinträge, Tagespläne
(+ Aktionen), Tagesreflexionen, Wochenrückblicke, Empfehlungen (+
Entscheidungen/Ergebnisse/Feedback), Twin Memories, erkannte Muster,
Lernereignisse, Einwilligungen — jede Abfrage `.eq("email", email)"
skopiert, **nie** Daten eines anderen Nutzers.

**CSV-Export pro Kategorie:** `GET /api/privacy/export/csv/{category}` —
optional, für die 12 strukturierten Kategorien (siehe §2), jeweils als
einzelne CSV-Datei mit Union aller vorkommenden Spalten
(`services/privacy_export.py::rows_to_csv`).

**Große Exporte:** Oberhalb von `MAX_SYNC_EXPORT_ROWS = 5000` Gesamtzeilen
wird der JSON-Export mit `413` abgelehnt und auf einen manuellen Export
(`info@vitaltwin.de`) verwiesen, statt eine sehr große Antwort synchron zu
erzwingen — eine **Vorbereitung** auf einen künftigen Background-Job (kein
echter Job in dieser Etappe implementiert, siehe
[TWIN_BETA_LIMITATIONS.md](./TWIN_BETA_LIMITATIONS.md)).

## 2. Löschung (Etappe 9 §2)

| Aktion | Endpunkt | Umfang |
|---|---|---|
| Einzelne Einträge | jeweils bestehende `DELETE`-Endpunkte (Check-in, Gewohnheit, Ziel, Memory, Pattern-Verwerfen, Tagesplan-Aktion) | ein Datensatz |
| Datenkategorie vollständig | `DELETE /api/privacy/data/{category}` | alle Zeilen einer Tabelle für den Nutzer |
| Vollständiges Konto | `POST /api/profile/request-deletion` (unverändert seit Etappe 2) | manuell geprüfte Löschanfrage, keine automatische Sofortlöschung |

**Löschbare Kategorien** (`CATEGORY_TABLES` in `routers/privacy.py`):
`checkins`, `habits`, `habit_entries`, `goals`, `daily_plans`, `reflections`,
`weekly_reflections`, `recommendations`, `memories`, `patterns`,
`chat_history`, `feedback`.

**"Chatverlauf löschen":** Da niemals der Inhalt einer Chat-Nachricht
gespeichert wird (nur ein Tageszähler, `vt_chat_usage` — siehe
[TWIN_DATA_DICTIONARY.md](./TWIN_DATA_DICTIONARY.md)), löscht diese
Kategorie den Nutzungszähler. Es gibt keinen darüber hinausgehenden
Chatinhalt zu löschen — eine bereits vorher bestehende, hier nur
dokumentierte Privatsphäre-Eigenschaft.

### Garantie: gelöschte Daten wirken nirgends mehr

Nach einer Löschung (einzeln oder kategorienweise) erscheint die Zeile
**strukturell garantiert nicht mehr**:

- **im Twin-Kontext** — `services/twin_context.py` liest bei jeder
  Chat-Anfrage die Tabellen erneut; eine gelöschte Zeile existiert dort
  nicht mehr (siehe [TWIN_CONTEXT.md](./TWIN_CONTEXT.md)).
- **in Empfehlungen** — `recommendation_rules.py`/`personalization.py`
  arbeiten ausschließlich mit frisch geladenen, aktuellen Zeilen.
- **in Trends** — `services/trends.py::compute_trend` iteriert über die
  übergebene, frisch geladene Liste; eine gelöschte Zeile ist darin nicht
  enthalten (siehe `tests/test_trends.py`).
- **in Patterns** — `pattern_detection.py` erkennt Muster nur aus noch
  vorhandenen Zeilen.
- **bei Memory-Bestätigungen** — eine gelöschte Memory hat `status="deleted"`
  und `deleted_at` gesetzt; `twin_memory.is_usable_for_recommendations(...)`
  gibt für diesen Status `False` zurück (siehe
  [TWIN_MEMORY.md](./TWIN_MEMORY.md) §2).

### Soft Delete — wo verwendet, wie dokumentiert

Nur **Ziele** (`vt_wellness_goals.deleted_at`) und **Memories**
(`vt_twin_memory.deleted_at` + `status="deleted"`) nutzen Soft Delete
(bewusste Entscheidung aus Etappe 3/5, um Historie für Reflexionen/
Nachvollziehbarkeit zu erhalten). Beide werden **standardmäßig aus allen
normalen Abfragen ausgeschlossen** (`is_("deleted_at", "null")` bzw.
`status != "deleted"`). Ein endgültiger Löschprozess (echtes Purgen alter
Soft-Deletes) ist für eine spätere Etappe vorgesehen und noch nicht
automatisiert — siehe [DATA_RETENTION.md](./DATA_RETENTION.md). Alle
anderen Kategorien werden bei Lösch-Anfragen **hart** gelöscht (kein
Soft-Delete-Zwischenschritt).

## 3. Einwilligungen (Etappe 9 §3)

Sieben getrennte Zwecke, **nie eine pauschale Einwilligung**:

| `consent_type` | Zweck |
|---|---|
| `wellness_data_processing` | Verarbeitung der Wellness-Daten allgemein |
| `ai_features` | KI-Funktionen (Empfehlungen, Chat) |
| `chat_storage` | (reserviert — aktuell wird ohnehin kein Chatinhalt gespeichert) |
| `wearables_future` | reserviert für eine künftige Wearable-Anbindung |
| `marketing` | Marketing-Kommunikation |
| `affiliate_tracking` | Affiliate-Tracking |
| `research_optional` | optionale Forschungsnutzung |

**Modell:** `vt_consent_records` ist ein **append-only Log** — jede
Entscheidung (Erlauben/Widerrufen) fügt eine neue Zeile hinzu, statt eine
bestehende zu überschreiben. Der aktuelle Status pro Zweck ist die
**zeitlich neueste Zeile** (`services/privacy_export.py::
resolve_current_consents`). Das macht jede Änderung nachvollziehbar
(vollständige Historie bleibt erhalten) und einen Widerruf sofort und
eindeutig wirksam für alle künftigen Abfragen.

**Widerruf technisch wirksam:** Da jede Konsens-Prüfung (aktuell: die
Privacy-Übersicht zeigt den Status an) stets `resolve_current_consents(...)`
über die volle Historie neu berechnet, kann ein Widerruf nie durch eine
ältere "granted"-Zeile überschrieben werden.

**Endpunkte:** `GET /api/privacy/consents` (aktueller Status je Zweck),
`GET /api/privacy/consents/history` (volles Protokoll), `POST
/api/privacy/consents` (Erlauben/Widerrufen, ausgelöst über die
Privacy-UI unter `/profil#datenschutz`).

## 4. Privacy-UI (Etappe 9 §7)

`frontend/app/components/privacy-controls.tsx`, eingebettet in die
bestehende "Datenschutzkontrollen"-Sektion auf `/profil`:

| Anforderung | Umsetzung |
|---|---|
| welche Daten gespeichert werden | `GET /api/privacy/overview` → Zeilenzahl je Kategorie |
| welche Daten der Twin verwendet | `active_memories_count`/`active_patterns_count` + Hinweistext mit Verweis auf TWIN_CONTEXT.md |
| welche Memories aktiv sind | Zahl aktiver/bestätigter Memories (Details weiterhin über die Dashboard-Memory-Karte, Etappe 5/8) |
| welche Muster aktiv sind | Zahl aktiver, nicht widersprüchlicher Muster |
| welche Einwilligungen aktiv sind | sieben Umschalter mit aktuellem Status |
| wie Daten exportiert werden | Button "Meine Daten exportieren" (voller JSON-Export) + "Als CSV exportieren" pro Kategorie |
| wie Daten gelöscht werden | Kategorie-Auswahl + "Kategorie löschen", plus bestehende Buttons für Einzel-Löschungen (Dashboard-Karten) und vollständige Kontolöschung |

## 5. Audit (Etappe 9 §6)

Jede in dieser Etappe neue oder erweiterte Aktion protokolliert ein
Audit-Event (`core/audit.py::record_audit_event`, nie sensible Freitexte):

| Aktion | `action` | `entity_type` |
|---|---|---|
| Voller JSON-Export | `export_request` | `full_export` |
| CSV-Export einer Kategorie | `export_request` | `category_csv:{category}` |
| Kategorie-Löschung | `delete` | `category:{category}` |
| Einwilligungsänderung | `consent_change` | `consent` (mit `entity_id=consent_type`) |
| Kontolöschungsanfrage | `deletion_request` | `account` |

Erstellung/Aktualisierung/Löschung einzelner Datensätze wurden bereits in
Etappe 2-6 mit Audit-Events versehen (`create`/`update`/`delete`) — diese
Etappe ergänzt nur die bis dahin fehlenden Export-/Lösch-/Consent-Events.
