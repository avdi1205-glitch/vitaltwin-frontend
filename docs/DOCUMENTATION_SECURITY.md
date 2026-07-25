# Documentation Security

## Erlaubte Lesebereiche (Allowlist)

`core/documentation_scanner.py::ALLOWED_SCAN_ROOTS` — hartkodiert, exakt
vier Verzeichnisse innerhalb des Backend-Repositories:
`app/routers`, `app/core`, `migrations`, `tests`. Jede Dateioperation
prüft `_is_allowed(path)` (Pfad muss nach `.resolve()` innerhalb einer
dieser Wurzeln liegen) — verhindert Path Traversal strukturell, nicht nur
per Konvention.

## Kein Schreibzugriff überhaupt

Es gibt **keinen** Dateischreibpfad in diesem Submodul — weder für
Backend- noch für Frontend-Dateien. "Generierte Dokumentation" landet
ausschließlich in `vt_documentation_registry.generated_content` /
`vt_documentation_versions` (Datenbank). Das eliminiert die im Auftrag
genannten Risiken vollständig:

- **Path Traversal beim Schreiben**: unmöglich, da nie geschrieben wird.
- **Überschreiben geschützter Dateien**: unmöglich, da nie geschrieben
  wird — geschützte Dokumente werden zusätzlich explizit per
  `documentation_protected.py::assert_not_protected_for_auto_update()`
  vor jedem Inhalts-Update geprüft (Verteidigung in der Tiefe).
- **Unkontrolliertes Schreiben in Code-Dateien**: unmöglich (kein
  Schreibpfad existiert).

## Keine Codeausführung

Der Scanner nutzt ausschließlich `pathlib`/`re` — kein `eval`, `exec`,
`importlib`, kein dynamisches Modul-Laden von Scan-Ergebnissen.

## Git-Integration ist sicher begrenzt

`core/changelog_engine.py` ruft **einen einzigen, fest kodierten**
`git log`-Befehl auf (`subprocess.run([...], shell=False)`, keine
String-Interpolation von Nutzereingaben, 5-Sekunden-Timeout). Kein
User-Input erreicht jemals diesen Aufruf — keine Command-Injection-Fläche.

## Keine Geheimnisse

`.env`/`.env.example` sind nicht im Allowlist-Verzeichnis. Der Scanner
liest niemals Konfigurationsdateien mit Zugangsdaten. Die
Dokumentationssuche (`core/documentation_search.py`) indexiert
ausschließlich bereits registrierte Metadaten/generierten Inhalt —
niemals rohe Quelldateien oder Umgebungsvariablen.

## Prompt Injection

Da Quelldateien nur per Regex/Docstring-Extraktion gelesen werden (nie an
ein LLM als auszuführende Anweisung weitergereicht) und die KI (Frag die
Projektdokumentation) ausschließlich mit bereits strukturierten,
kuratierten Kontextzeilen arbeitet (Titel/Kategorie/Status, keine
Rohdateiinhalte), ist die Angriffsfläche für Prompt Injection aus
Quelldateien minimal — ein manipulierter Docstring-Text könnte höchstens
als harmloser Kontext-String erscheinen, nie als ausführbarer Befehl.

## Bekannte Grenzen

- Der Scanner kann nicht verhindern, dass ein Docstring absichtlich
  irreführenden Text enthält — er extrahiert ihn wörtlich. Dies ist ein
  Restrisiko, das durch Code-Review (nicht durch dieses Submodul)
  adressiert werden muss.
