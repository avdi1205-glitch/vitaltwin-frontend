# Affiliate Automation Score

## Zweck

`GET /affiliate-intelligence/automation-score` beantwortet ehrlich: "Wie
viel läuft hier tatsächlich automatisch, und wie viel braucht noch eine
Gründer-Entscheidung?" — auf Basis echter Zählwerte, nie eines fixen
Prozentsatzes.

## Berechnete Werte

- `auto_checked_links` — Produkte mit vorhandenem `link_last_checked_at`
- `auto_paused_products` — automatisch pausierte Produkte
  (Link/Blacklist/Ablauf-Erkennung, siehe Product Health)
- `auto_reviewed_products` — Produkte mit `ai_reviewed = true`
- `auto_detected_duplicates` — offene Einträge in
  `vt_affiliate_duplicate_candidates`
- `manual_decisions_required` — Produkte mit Status `needs_review` /
  `in_review` + offene Duplikat-Kandidaten (alles, was auf eine
  Gründer-Entscheidung wartet)
- `automation_percentage` — echtes Verhältnis automatisch
  verarbeiteter zu insgesamt verarbeiteter Elemente; `null` mit Hinweis,
  wenn keine Datenbasis vorhanden ist (z. B. keine Produkte)

## Philosophie: "Gründer entscheidet, KI schlägt nur vor"

Kein Wert in diesem Endpoint impliziert, dass etwas *ohne* Gründer-Freigabe
live geschaltet, gelöscht oder final entschieden wurde. Automatisierung
bezieht sich ausschließlich auf **Erkennung/Vorschlag/Klassifizierung**,
niemals auf finale Business-Entscheidungen (Freigabe, Ablehnung,
Partnerwechsel).

## Bekannte Grenzen

- Kein historischer Trend (nur Momentaufnahme bei Aufruf) — es gibt
  keinen Hintergrundjob, der Verlaufsdaten sammelt.
