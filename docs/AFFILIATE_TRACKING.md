# VitalTwin — Affiliate Tracking (AFFILIATE_TRACKING.md)

> Wie Impressionen, Klicks und Conversions erfasst, gespeichert und für
> Analytics/A-B-Tests/Provisionen ausgewertet werden.

## Ereignistabelle

Alle drei Ereignistypen landen in **einer** Tabelle,
`vt_affiliate_events` (`migrations/012_affiliate_platform.sql`), mit
`event_type` als Unterscheidungsmerkmal (`impression`, `click`,
`conversion`) statt drei separaten Tabellen — vereinfacht Analytics-
Abfragen, die ohnehin über alle drei Typen aggregieren.

| Spalte | Bedeutung |
|---|---|
| `product_id` | welches Produkt |
| `ab_test_id` / `ab_test_variant` | falls Teil eines A/B-Tests |
| `event_type` | `impression` \| `click` \| `conversion` |
| `email` | falls eingeloggt, sonst `null` (anonyme Klicks werden erfasst) |
| `revenue` / `commission` | nur bei `event_type = "conversion"` befüllt |
| `context` | freies JSON-Feld für zusätzlichen Kontext |

## Erfassung

`POST /api/affiliate/track` (`routers/affiliate.py::track_event`) — **kein
Login erforderlich**, damit auch anonyme Impressionen/Klicks gezählt
werden; ist der Aufrufer eingeloggt, wird die E-Mail automatisch
angehängt. Rate-limitiert auf 120 Aufrufe/Minute pro Client-IP
(`core/rate_limit.py`) gegen triviale Aufblähung.

**Conversions werden aktuell nicht automatisch erzeugt** — es gibt keine
Zahlungs-Webhook-Anbindung zu einem Partnernetzwerk (siehe
`core/integrations.py::get_affiliate_networks()`, alle 6 Netzwerke
`not_implemented`). Ein `conversion`-Event mit `revenue`/`commission` muss
aktuell manuell oder durch eine künftige Netzwerk-Integration übermittelt
werden — die API akzeptiert es bereits, es entsteht nur (noch) nicht von
selbst.

## Auswertung

- **Tracking-Tab** (`GET /api/admin/affiliate/events`): rohe Ereignisliste,
  filterbar nach `event_type`/`product_id`.
- **Analytics-Tab** (`GET /api/admin/affiliate/analytics`): aggregiert alle
  Ereignisse in Python zu Top-Produkten/-Kategorien/-Partnern nach Umsatz
  (absteigend sortiert, Top 10 je Liste).
- **Provisionen-Tab** (`GET /api/admin/affiliate/commissions`): Summe aller
  `commission`/`revenue`-Werte über alle `conversion`-Events.
- **A/B-Tests** (`GET /api/admin/affiliate/ab-tests`): pro Test werden die
  Ereignisse der beiden verglichenen Produkte (`product_a_id`/
  `product_b_id`) separat aggregiert (Impressionen/Klicks/Conversions/
  Umsatz je Variante). `POST /ab-tests/{id}/complete` bestimmt den Gewinner
  anhand der tatsächlichen Conversion-Zahl — bei Gleichstand wird ehrlich
  `"tie"` zurückgegeben, nie geraten.

## Bekannte Grenzen

- Keine Deduplizierung von Impressionen (ein mehrfach geladenes Widget
  zählt mehrfach) — für die aktuelle Beta-Phase ausreichend, sollte vor
  Skalierung um eine Session-/Zeitfenster-Deduplizierung ergänzt werden.
- Kein automatischer Abgleich mit tatsächlichen Partner-Auszahlungen
  (siehe oben) — die Zahlen in Analytics/Provisionen spiegeln nur, was
  über `/track` tatsächlich gemeldet wurde.
