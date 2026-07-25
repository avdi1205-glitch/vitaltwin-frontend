# Documentation Registry

## Felder

`id`, `document_path` (unique), `title`, `category`, `module`,
`submodule`, `owner`, `status`, `source_files` (Liste von Backend-
Dateinamen, die dieses Dokument abdeckt), `last_generated_at`,
`last_reviewed_at`, `last_approved_at`, `version`, `content_hash`,
`source_hash`, `is_generated`, `requires_approval`, `protected`,
`stale_reason`, `generated_content`, `created_at`, `updated_at`,
`created_by`.

## Statuswerte

`current` / `stale` / `missing` / `draft` / `pending_review` /
`approved` / `rejected` / `archived` / `manually_managed`.

## Erlaubte Quellen (Analyse)

Ausschließlich `app/routers/*.py`, `app/core/*.py`, `migrations/*.sql`,
`tests/test_*.py` im **Backend**-Repository — siehe
[AUTO_DOCUMENTATION.md](./AUTO_DOCUMENTATION.md) für die Begründung,
warum Frontend-Quellen nicht einbezogen werden können.

## Versionierung

Jede Inhaltsänderung eines nicht-geschützten Dokuments schreibt eine neue
Zeile in `vt_documentation_versions` (`registry_id`, `version`, `content`,
`content_hash`, `diff_summary`, `created_at`, `created_by`). Das ist die
Grundlage für Rollback (siehe unten).

## Seed: bekannte Founder-OS-Dokumente

`core/documentation_registry.py::seed_known_documents()` registriert
einmalig (idempotent) die acht Founder-OS-Dokumente aus diesem Projekt
(Module A–H) mit `status='manually_managed'` — Pfade sind aus
Projektkonvention bekannt, Inhalte werden **nicht** vom Backend gelesen.

## Rollback

`rollback_document(registry_id, target_version)` — stellt eine vorherige
`generated_content`-Version wieder her (als neue Version, nicht
destruktiv). Betrifft **ausschließlich** den Dokumentationsinhalt in der
Datenbank — nie Quelldateien, nie Migrationen, nie Code (strukturell
garantiert, da die Funktion keinerlei Dateisystem-Import verwendet).

## Geschützte Dokumente

Registrierung/Review-Metadaten sind auch für geschützte Dokumente
erlaubt (z. B. `last_reviewed_at` aktualisieren) — nur die
**Inhaltsänderung** (`update_document_content`) ist blockiert, siehe
[DOCUMENTATION_SECURITY.md](./DOCUMENTATION_SECURITY.md).
