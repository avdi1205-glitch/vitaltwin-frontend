# Documentation Generation

## Sicherer Scanner (`core/documentation_scanner.py`)

- `scan_api_routes()` — parst jede `app/routers/*.py`-Datei per Regex
  nach `@router.<method>("...")`, inkl. Best-Effort-Erkennung der
  geforderten Permission (`require_admin_permission(..., "...")` im
  Textfenster danach).
- `scan_data_models()` — parst `migrations/*.sql` nach
  `create table if not exists public.<name>`.
- `scan_migrations()` — listet Migrationsdateien, markiert die neueste.
- `scan_core_services()` — listet `app/core/*.py`-Module mit erster
  Docstring-Zeile (nie vollständiger Dateiinhalt).
- `scan_test_files()` — zählt `def test_*`-Funktionen pro Testdatei.
- `compute_backend_source_hash()` — günstiger Fingerprint (Dateiname +
  Größe + mtime, kein Volltext-Hash) für Stale-Detection.

Alle Funktionen sind **read-only**, geben nie volle Dateiinhalte zurück,
fangen alle Fehler ab (nie ein Absturz bei nicht lesbaren Dateien).

## Generierte Dokumente (`core/documentation_generation.py`)

`run_generation()` erzeugt/aktualisiert vier nicht-geschützte,
automatisch generierte Registry-Einträge: API-Übersicht,
Datenmodell-Übersicht, Migrations-Übersicht, Service-Übersicht — jede
mit echtem Inhalt aus dem Live-Scan, versioniert bei jeder Änderung.
Ein Lauf wird immer in `vt_documentation_generation_runs` protokolliert
(`items_scanned`, `items_updated`, `items_flagged_stale`, `error`).

## Stale Detection (`core/documentation_stale_detection.py`)

- Backend-scannbare Kategorien (`api`, `datenmodelle`, `migrationen`,
  `services`): echter `source_hash`-Vergleich — Änderung am Quellcode
  → `status='stale'` mit konkretem Grund.
- Nicht backend-scannbare Einträge (Frontend-Dokumente): ehrliches,
  gröberes Signal — kein Review seit über 90 Tagen → `stale`.

## Missing Documentation Detection

`detect_missing_documentation()` vergleicht den Live-Scan (APIs,
Datenmodelle, Migrationen) gegen die `source_files`, die Registry-
Einträge tatsächlich referenzieren — jedes Artefakt ohne passenden
Eintrag wird als "fehlend" gemeldet, direkt aus dem echten Scan-Ergebnis.

## Bekannte Grenzen

- Kein KI-Einsatz in diesem Kernpfad — die gesamte Generierung ist
  regelbasiert (Templates über Scan-Ergebnisse), konsistent mit
  "Regelbasierte Analyse zuerst".
- Kein inkrementelles Caching einzelner Dateien — der Source-Hash wird
  über den gesamten Verzeichnisbaum berechnet (günstig genug für die
  aktuelle Projektgröße).
