# Changelog Process

## Quellen

`core/changelog_engine.py::generate_changelog_draft()` nutzt in dieser
Priorität:

1. **Git-Commit-Historie** (`git log -30 --pretty=format:%s`), falls
   `git` verfügbar ist und `.git/` im Backend-Repository existiert —
   echte, reale Commit-Nachrichten.
2. **Ehrlicher Fallback**, falls kein Git verfügbar ist (z. B. in manchen
   Deployment-Umgebungen ohne `.git`-Verzeichnis): zeigt stattdessen den
   aktuellen Datenbank-/API-Stand (Tabellen aus Migrationen, Routen aus
   dem Live-Scan) — niemals eine erfundene Commit-Historie.

## Kategorisierung

Jede Commit-Nachricht wird per Präfix-Heuristik kategorisiert:
`feat` → Added, `fix` → Fixed, `docs` → Documentation, `perf` →
Performance, `security`/`chore`/`refactor` → Security/Internal, alles
andere → Changed. Kategorien: Added, Changed, Fixed, Deprecated, Removed,
Security, Performance, Documentation, Database, API, UI, Internal.

## Keine sensiblen Informationen

Commit-Nachrichten werden unverändert übernommen — der Founder ist dafür
verantwortlich, keine Geheimnisse in Commit-Nachrichten zu schreiben
(wie im gesamten Projekt bereits Konvention). Es werden keine Diffs, nur
Commit-**Nachrichten** verwendet — Code-Inhalte werden nie in den
Changelog übernommen.

## Bekannte Grenzen

- Reine Präfix-Heuristik, keine semantische Analyse der Commit-Botschaft.
- Ohne konsequente Conventional-Commits-Nutzung landen viele Commits in
  der generischen Kategorie "Changed".
