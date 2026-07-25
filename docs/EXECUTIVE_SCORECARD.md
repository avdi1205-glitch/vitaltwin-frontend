# Executive Scorecard

## 14 Dimensionen

`core/executive_scorecard.py::compute_scorecard()` liefert genau die 14
im Auftrag genannten Bereiche: Wachstum, Umsatz, Profitabilität,
Premium-Conversion, Nutzerbindung, Kündigungsrate, Affiliate-Leistung,
Produktnutzung, KI-Kosteneffizienz, Systemstabilität, Supportbelastung,
Release-Qualität, Automatisierungsgrad, Zielerreichung.

Jede Dimension: `{area, status, trend, data_basis, target_value,
current_value, deviation, risk_level, next_action}`.

## Statusstufen

`sehr_gut` / `im_plan` / `beobachten` / `gefaehrdet` / `kritisch` /
`keine_daten`. Jeder Status ist über `data_basis` und `next_action`
erklärbar — nie eine unbegründete Bewertung.

## Keine Gesamtbewertung

Es gibt bewusst **keinen** einzelnen Gesamt-Score über alle 14 Dimensionen
hinweg (per Auftrag: "Keine scheinwissenschaftliche Gesamtbewertung") —
jede Dimension steht für sich mit eigener Datenqualität.

## Berechenbare vs. nicht berechenbare Dimensionen

Real berechnet: Wachstum (Registrierungs-Trend), Affiliate-Leistung
(CTR-Trend), Supportbelastung (Feedback-Volumen-Trend), Automatisierungsgrad
(`core/automation_score.py`). Ehrlich `keine_daten`: Umsatz, Profitabilität,
Nutzerbindung, Kündigungsrate, Produktnutzung, KI-Kosteneffizienz,
Systemstabilität, Release-Qualität, Zielerreichung (jeweils mit
`next_action`, die die fehlende Integration konkret benennt).

## Bekannte Grenzen

- "Zielerreichung" verweist auf die Strategic Goals — es gibt keine
  eigene Aggregation über alle Ziele, um Datenschutz/Datenqualität nicht
  künstlich zu verdichten; der Founder sieht die einzelnen Ziel-Prognosen
  direkt im Strategic-Goals-Bereich.
