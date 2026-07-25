# Affiliate Intelligence (Founder OS — Submodul F)

## Zweck

Affiliate Intelligence erweitert das bestehende Affiliate-Center (Partner,
Produkte, Tracking, Analytics) um eine schlanke, regelbasierte
Intelligenzschicht: Provider-Status-Übersicht, Produkt-Gesundheit,
Duplikatserkennung, einen KI-gestützten Approval-Assistenten, einen
Empfehlungs-Simulator und einen ehrlichen Automatisierungsgrad. Es ist
**keine parallele Produktdatenbank** — alle Daten stammen aus den
bestehenden Tabellen `vt_affiliate_products`, `vt_affiliate_partners`,
`vt_affiliate_categories`, `vt_affiliate_events`,
`vt_affiliate_duplicate_candidates` (neu).

## Route-Konsolidierung (Abweichung von der Spec)

Die Spezifikation forderte eine neue Route `/admin/founder/affiliate-intelligence`.
Wie bei allen vorherigen Founder-OS-Submodulen wurde stattdessen ein
sechster Tab `Affiliate Intelligence` in der bestehenden, konsolidierten
Seite [`/admin/founder`](../app/admin/founder/page.tsx) ergänzt
(`AffiliateIntelligenceTab()`), um die Fragmentierung zu vermeiden, die im
Founder OS Refactor bereits behoben wurde. Berechtigungen bleiben
`view_founder_os` / `manage_founder_os` — es wurden **keine neuen
Permissions** eingeführt.

## Dashboard-KPIs

`GET /api/admin/founder/affiliate-intelligence/dashboard` liefert u. a.:
active_partner_programs, connected_apis (ehrlich 0, siehe
[AFFILIATE_PROVIDER_ARCHITECTURE.md](./AFFILIATE_PROVIDER_ARCHITECTURE.md)),
new_products_today, pending_approval, broken_links, expiring_soon,
active_products, impressions/clicks/conversions/commission (heute & Monat),
conversion_rate, open_tasks, open_approvals. Jeder Wert kommt aus einer
echten Datenbankabfrage; nicht verfügbare Werte liefern `null` +
erklärende `note`.

## Wiederverwendung statt Neubau

- Empfehlungs-Sortierung bleibt ausschließlich in
  `core/affiliate_engine.py` (unverändert).
- Approval-Erstellung nutzt weiterhin
  `core/founder_approval_detector.py::run_detection()`.
- Task-Erkennung ergänzt `core/founder_task_detector.py` nur um genuin
  neue Bedingungen (fehlende Daten, mögliche Duplikate, Umsatzeinbruch) in
  `core/affiliate_intelligence_detector.py`.
- Umsatzdaten je Kategorie kommen aus
  `core/founder_business_metrics.py::get_affiliate_revenue_by_category()`.
- Import/Export bleibt `core/affiliate_import_export.py`.

## Bekannte Grenzen

- Keine echten Netzwerk-API-Zugangsdaten vorhanden (siehe
  [AFFILIATE_PROVIDER_ARCHITECTURE.md](./AFFILIATE_PROVIDER_ARCHITECTURE.md)).
- Kein geplanter Hintergrund-Sync — alles wird synchron beim Laden
  berechnet ("on read"), konsistent mit allen anderen Founder-OS-Modulen.
- Der Automatisierungsgrad ist ein echter, aus Zähldaten berechneter
  Prozentwert — kein fixer Platzhalterwert.
