# Founder-OS-weiter Automation Score

## Zusammenführung statt Neuberechnung

`core/autopilot_score.py::compute_founder_os_automation_score()`
kombiniert die bereits bestehenden Scores von Submodul G
(`core/automation_score.py`) und Submodul I
(`core/documentation_score.py`) zu einem Gesamtwert — **keine dritte,
unabhängige Berechnung**.

```
overall_percentage = (G.automated_runs_30d + I.auto_generated_drafts)
                    / (G.automated_runs_30d + I.auto_generated_drafts
                       + G.manual_decisions_30d + I.manually_reviewed_documents)
                    × 100
```

`null`, wenn keine Prozessdaten vorhanden sind — kein fester Wert.

## Pro Submodul

`per_submodule` zeigt die Rohwerte von G und I einzeln. Weitere Submodule
(A-F, H) haben aktuell keinen eigenen "automatisiert vs. manuell"-Zähler
— sie sind entweder reine Aggregationsschichten (H) oder haben keine
automatisierbaren wiederkehrenden Vorgänge im technischen Sinne (A-F
liefern ihre Daten in G/I mit ein, wo relevant).

## Lücken & nächster Schritt Richtung 90%

`gaps` wird direkt von G's `compute_automation_score()` übernommen
(Kategorien ohne Regel trotz wiederkehrender manueller Vorgänge).
`next_step_towards_90_percent` benennt konkret die größte Lücke.

## Work-Saved-Schätzung

`compute_work_saved_estimate()` — **explizit als Schätzung
gekennzeichnet**, nie als exakte Wahrheit:

- `automated_operations_30d` — echte Anzahl erfolgreicher automatisierter
  Läufe (Submodul G, 30 Tage).
- `assumed_minutes_per_operation` — offen dokumentierte Annahme (aktuell
  5 Minuten pro Vorgang).
- `estimated_minutes_saved_30d` / `estimated_hours_saved_30d` —
  Produkt der beiden obigen Werte.
- `uncertainty: "hoch"` — immer, da keine echte Zeitmessung existiert.
- `calculation_method` — die exakte Formel wird immer mitgeliefert.

## Bekannte Grenzen

- Keine echte Zeiterfassung manueller Vorgänge in dieser Codebase — die
  Minuten-Annahme ist eine dokumentierte Schätzung, kein Messwert.
