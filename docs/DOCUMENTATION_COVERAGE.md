# Documentation Coverage (Documentation Score)

## Berechnung (`core/documentation_score.py::compute_documentation_score()`)

Für jede backend-scannbare Kategorie (API, Datenmodelle, Migrationen)
wird die Abdeckung real berechnet: Anzahl Artefakte mit einem
Registry-Eintrag, dessen `source_files` die jeweilige Quelldatei
referenziert, geteilt durch die Gesamtzahl der live gescannten Artefakte.
Kein fester oder erfundener Prozentwert — `null`, wenn keine Artefakte
existieren.

Zusätzlich: Anzahl veralteter Dokumente (`status='stale'`), offene
Change Proposals, Gesamtzahl Registry-Einträge.

## Automation Score (`compute_documentation_automation_score()`)

Getrennt vom Documentation Score: misst, wie viel **automatisch**
(generierte Entwürfe) vs. **manuell** (`manually_managed`-Einträge)
gepflegt wird, plus fehlgeschlagene Läufe aus
`vt_documentation_generation_runs`. Auch hier: kein fester Wert, `null`
bei fehlenden Prozessdaten.

## CEO-Intelligence-Integration

`core/executive_metrics.py::get_ceo_overview()` liest zusätzlich
(additiv, mit Try/Except) `documentation_health` aus
`core/documentation_score.py` — Submodul H erhält so die
Dokumentationsabdeckung als aggregierte Kennzahl, ohne dass H eine eigene
Berechnung dupliziert.

## Daily-Briefing-Integration

`routers/founder_briefing.py` liest zusätzlich (additiv) ein
`"documentation"`-Feld mit `coverage_percentage`, `stale_documents`,
`open_change_proposals` — dieselbe Quelle wie oben, keine zweite
Berechnung.

## Bekannte Grenzen

- Deckt nur backend-scannbare Kategorien in der Prozentzahl ab —
  Frontend-Dokumentabdeckung wird nicht in den Prozentwert eingerechnet
  (da nicht verifizierbar), sondern separat als Anzahl `manually_managed`-
  Einträge ausgewiesen.
