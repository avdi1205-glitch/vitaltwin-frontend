# Executive Metrics

## CEO Overview (`core/executive_metrics.py::get_ceo_overview()`)

Jede Kennzahl hat die Form
`{value, source, period, comparison_period, computed_at, trend, data_quality, note}`.
`data_quality` ist automatisch `"nicht_verbunden"`, sobald `value is
None`. Enthält u. a.: `revenue_today`, `revenue_month`, `mrr`,
`annual_revenue_forecast`, `new_users`, `active_users`, `premium_users`,
`new_premium_subscriptions`, `cancellations`, `affiliate_revenue`,
`ai_cost`, `infra_cost`, `net_development`, `open_critical_risks`,
`open_opportunities`, `open_founder_decisions`, `automation_percentage`,
`product_status`, `release_status`.

Wiederverwendet direkt `core/founder_business_metrics.py::get_business_dashboard()`
für Umsatz/Premium/Kosten-Felder (keine zweite Berechnung derselben
Zahlen) und `core/automation_score.py::compute_automation_score()` für
den Automatisierungsgrad.

## Strategic KPI System (`get_strategic_kpis()`)

8 Gruppen — Nutzer, Business, Premium, Affiliate, KI, Produkt, Technik,
Automatisierung — mit je den im Auftrag genannten Einzelkennzahlen.
**Ehrlich nicht verbunden** (mit erklärender Notiz statt erfundenem Wert):
CAC, LTV, ARPU, Kündigungsrate/-gründe, Aktivierungsrate, Retention,
Reaktivierungen, Feature-Nutzung/Funnel, Uptime/API-Latenz/Fehlerquote,
Build-/Release-Status, offene kritische Bugs, KI-Requests/Fehlerquote/
Antwortzeit, Tarifwechsel, offene Forderungen.

**Real berechnet**: Gesamtregistrierungen, neue/aktive Nutzer,
Premium-Conversion, Affiliate-Impressionen/-Klicks/-CTR/-Verkäufe/
-Conversion/-Umsatz-nach-Kategorie, defekte Links, Support-Signale
(Feedback-Volumen), Automatisierungsgrad (automatisch erledigte/manuelle
Aufgaben, Fehler, Automation Score).

## Datenqualitätsstufen

`vollstaendig` / `teilweise` / `veraltet` / `nicht_verbunden` /
`widersprüchlich` / `unzureichend` — jede Kennzahl trägt genau eine
dieser Stufen. Keine strategische Aussage mit hoher Sicherheit bei
schlechter Datenqualität (siehe
[EXECUTIVE_RISKS_OPPORTUNITIES.md](./EXECUTIVE_RISKS_OPPORTUNITIES.md) —
die Datenqualitätsrisiko-Erkennung nutzt genau dieses Feld).

## Bekannte Grenzen

- Keine Jahresumsatzprognose möglich (keine ausreichende Umsatzbasis).
- "Nettoentwicklung" ist nicht sauber berechenbar, solange Umsatz/KI-
  Kosten/Infrastrukturkosten nicht vollständig verbunden sind.
