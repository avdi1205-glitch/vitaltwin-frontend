# CEO Intelligence (Founder OS — Submodul H)

## Zweck

CEO Intelligence unterstützt den Gründer bei strategischen Entscheidungen,
indem es Kennzahlen, Chancen, Risiken, Ziele und den Automatisierungsgrad
aus den bereits bestehenden Founder-OS-Submodulen (A–G) zusammenführt,
priorisiert und erklärt. **Es ist keine neue Datenquelle** — nahezu jede
Kennzahl wird von einem bestehenden Modul berechnet und hier nur
CEO-gerecht angereichert (Quelle, Zeitraum, Trend, Datenqualität).

## Route-Konsolidierung (Abweichung von der Spec)

Die Spezifikation forderte eine neue Route `/admin/founder/ceo-intelligence`.
Wie bei allen vorherigen Founder-OS-Submodulen wurde stattdessen ein
achter Tab „CEO Intelligence" in der bestehenden, konsolidierten Seite
[`/admin/founder`](../app/admin/founder/page.tsx) ergänzt
(`CeoIntelligenceTab()`). Der Tab ist nur sichtbar, wenn der Admin die
Berechtigung `view_ceo_intelligence` besitzt.

## Warum nur 2 neue Tabellen?

`vt_executive_scenarios` (gespeicherte Was-wäre-wenn-Szenarien) und
`vt_executive_queries` (Frage-Protokoll für "Frag CEO Intelligence").
Alles andere — Kennzahlen, Scorecard, Ziele, Risiken, Chancen, Executive
Summary — wird **zur Laufzeit aus bestehenden Tabellen aggregiert**:

| Bereich | Wiederverwendete Quelle |
|---|---|
| CEO Overview / Strategic KPIs | `core/founder_business_metrics.py`, `core/automation_score.py`, `core/integrations.py` |
| Executive Scorecard | dieselben Quellen, neu zusammengesetzt |
| Strategic Goals | `vt_founder_business_goals` (Submodul E), 3 neue Kategorien additiv ergänzt |
| Executive Risks/Opportunities | `vt_founder_business_insights` (E) + `vt_automation_alerts`/`vt_automation_opportunities` (G) + `core/affiliate_product_health.py` (F) |
| Executive Summary | alle oben genannten, zu Text zusammengefasst |

Siehe [EXECUTIVE_METRICS.md](./EXECUTIVE_METRICS.md),
[EXECUTIVE_SCORECARD.md](./EXECUTIVE_SCORECARD.md),
[STRATEGIC_GOALS.md](./STRATEGIC_GOALS.md),
[EXECUTIVE_RISKS_OPPORTUNITIES.md](./EXECUTIVE_RISKS_OPPORTUNITIES.md),
[EXECUTIVE_SCENARIOS.md](./EXECUTIVE_SCENARIOS.md) für die Details je
Bereich.

## Berechtigungen

Zwei neue, engere Permissions: `view_ceo_intelligence` /
`manage_ceo_intelligence`. Nur `super_admin` (== Gründer) hat
`manage_ceo_intelligence` automatisch; die neue Rolle `executive_analyst`
hat ausschließlich `view_ceo_intelligence` (rein lesend). `admin` ist
**explizit ausgeschlossen** — konsistent mit der Submodul-G-Begründung
(sensible, aggregierte Geschäftsdaten).

## KI-Nutzung

Regelbasiert zuerst: alle Kennzahlen, die Scorecard, Zielabweichungen und
Risiko-/Chancen-Erkennung sind deterministisch. Die **einzige** KI-Stelle
ist `POST /ceo-intelligence/ask` ("Frag CEO Intelligence") — rate-limited,
streng auf aggregierte Daten begrenzt, mit ehrlichem
"Dafür sind noch nicht genügend Daten vorhanden."-Fallback.

## Bekannte Grenzen

- Viele im Auftrag genannte Kennzahlen (CAC, LTV, Uptime, API-Latenz,
  Build-/Release-Status, Funnel-Daten, Kündigungsrate) haben **keine**
  reale Datenquelle in dieser Codebase — sie werden ehrlich als
  `null` mit erklärender Notiz zurückgegeben, nie erfunden.
- Kein Hintergrund-Scheduler — alles wird beim Laden des Tabs berechnet
  ("on read"), konsistent mit jedem anderen Founder-OS-Modul.
- Keine automatische Preis-/Tarifänderung — Scenario Planning liefert nur
  transparente Schätzungen, niemals eine Ausführung.
