# Auto Documentation (Founder OS — Submodul I)

## Zweck

Auto Documentation automatisiert die technische Dokumentation von
VitalTwin: es analysiert sicher und lesend den Backend-Quellcode, erkennt
veraltete/fehlende Dokumentation, erzeugt Changelog- und Release-Notes-
Entwürfe, und beantwortet Fragen zur Projektdokumentation.

## Route-Konsolidierung (Abweichung von der Spec)

Die Spezifikation forderte eine neue Route `/admin/founder/documentation`.
Wie bei allen vorherigen Founder-OS-Submodulen wurde stattdessen ein
neunter Tab „Auto Documentation" in der bestehenden, konsolidierten Seite
[`/admin/founder`](../app/admin/founder/page.tsx) ergänzt
(`AutoDocumentationTab()`), sichtbar nur mit `view_documentation`.

## Kritische Architektur-Entscheidung: kein Dateisystem-Schreibzugriff

**Backend und Frontend sind separate Git-Repositories, getrennt deployt**
(Railway vs. Vercel). Der laufende Backend-Prozess hat zur Laufzeit
**keinerlei Dateisystemzugriff auf das Frontend-Repository** — er kann
`frontend/docs/*.md` weder lesen noch schreiben. Deshalb:

1. **Automatische Code-Analyse ist auf das Backend-Repository begrenzt**
   (`app/routers`, `app/core`, `migrations`, `tests`) — siehe
   [DOCUMENTATION_GENERATION.md](./DOCUMENTATION_GENERATION.md).
2. **"Generierte Dokumentation" wird ausschließlich als Text in der
   Datenbank gespeichert** (`vt_documentation_registry.generated_content`,
   `vt_documentation_versions`) — es gibt **keinen** Dateischreibpfad,
   weder für Backend- noch für Frontend-Dokumente. Der Gründer kopiert
   generierten Text manuell in echte `.md`-Dateien, falls gewünscht. Das
   eliminiert jedes Path-Traversal-/Überschreibungsrisiko vollständig.
3. Frontend-Dokumente (die ~40 `.md`-Dateien in `frontend/docs/`) werden
   als Registry-Einträge mit **Pfad-Metadaten** geführt (bekannt aus
   Projektkonvention), aber `status='manually_managed'` und ehrlich als
   "nicht automatisch inhaltlich prüfbar" markiert.

## Berechtigungen

Neue Permissions `view_documentation`/`manage_documentation`. `developer`
(bestehende Rolle) und die neue Rolle `documentation_editor` erhalten
beide. `admin` ist explizit ausgeschlossen (Muster wie Submodul G/H).
Nur `super_admin` darf ein Dokument endgültig archivieren (zusätzliche
Rollenprüfung im Router, nicht nur Permission).

## Sicherheit

Der Scanner (`core/documentation_scanner.py`) öffnet ausschließlich
Dateien innerhalb eines hartkodierten Allowlist-Verzeichnisses, liest nie
`.env`, führt nie Code aus, folgt keinen Symlinks außerhalb der Allowlist.
Siehe [DOCUMENTATION_SECURITY.md](./DOCUMENTATION_SECURITY.md).

## Bekannte Grenzen

- Frontend-Routen/-Komponenten können von diesem Backend nicht überprüft
  werden (siehe oben) — Staleness dafür ist ein gröberes, aber echtes
  Signal (Review-Alter > 90 Tage).
- Kein echter Diff gegenüber vorherigen Git-Commits, wenn kein `.git`-
  Verzeichnis im Deployment vorhanden ist — ehrlicher Fallback auf
  aktuellen Datenbank-/API-Stand statt erfundener History.
