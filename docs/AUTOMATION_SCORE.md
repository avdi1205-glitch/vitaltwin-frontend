# Automation Score

## Kein fester/erfundener Prozentwert

`core/automation_score.py::compute_automation_score()` berechnet den
Automatisierungsgrad ausschließlich aus echten Zeilen:

- **Automatisiert**: erfolgreiche Läufe in `vt_automation_runs`
  (`status='erfolgreich'`) der letzten 30 Tage.
- **Manuell**: Aufgaben (`vt_founder_tasks`, `status='erledigt'`,
  `auto_resolved=false` — also vom Gründer selbst geschlossen) +
  Freigabe-Entscheidungen (`vt_founder_approvals`,
  `status in (freigegeben, abgelehnt)`) im selben Zeitraum.
- **Prozentwert**: `automatisiert / (automatisiert + manuell) * 100`,
  gerundet; `null` mit Hinweis, wenn keine Daten vorhanden sind.

## Trend

Vergleich des aktuellen 30-Tage-Fensters mit dem vorherigen 30-Tage-Fenster
(`trend_vs_previous_30d`) — echte Differenz, kein geschätzter Wert.

## Kategorie-Abdeckung

Für jede der 20 Automatisierungskategorien: Anzahl vorhandener Regeln
(`vt_automation_rules`) vs. Anzahl manuell abgeschlossener Aufgaben in
dieser Kategorie in den letzten 30 Tagen (`category_breakdown`).

## Lücken (`gaps`)

Kategorien mit **null** Regeln aber **≥3** manuellen Vorkommen in den
letzten 30 Tagen werden als "nächste Automatisierungschancen" markiert —
dasselbe Signal wie die [Automation Opportunity
Detection](./AUTOMATION_ENGINE.md), hier aggregiert je Kategorie
dargestellt statt als Einzelvorschlag.

## Verhältnis zum Business-Coach-Automation-Score

Der bestehende `GET /business-coach/automation-score`
(Submodul E, unverändert) misst nur die Automatisierung von
Business-Coach-Insights/-Aufgaben/-Freigaben. Der hier beschriebene
`GET /automation/automation-score` ist der umfassendere,
modulübergreifende Wert für das gesamte Founder OS. Beide bleiben
bewusst getrennt bestehen (unterschiedlicher Scope, keine Duplikat-Logik
— unterschiedliche zugrunde liegende Datenquellen).

## Bekannte Grenzen

- Betrachtet nur Läufe/Entscheidungen der letzten 30/60 Tage (kein
  ewiges Verlaufsarchiv im Dashboard, um große Datenmengen bei jedem
  Aufruf zu vermeiden — konsistent mit der "keine große Historie bei
  jedem Dashboard-Aufruf"-Vorgabe).
- "Eingesparte manuelle Schritte" ist keine separate Kennzahl, sondern
  implizit die Anzahl erfolgreicher automatisierter Läufe — es gibt keine
  Vorher/Nachher-Zeitmessung menschlicher Arbeit in dieser Codebase.
