# Affiliate Product Review

## Produkt-Gesundheit (`core/affiliate_product_health.py`)

`compute_product_health(product, blacklisted)` liefert
`{"status": "healthy"|"warning"|"critical"|"paused"|"unknown", "reasons": [...]}`.
Prüft in dieser Priorität: pausiert → Blacklist → defekter/ungeprüfter Link
→ abgelaufenes Enddatum → `availability == "out_of_stock"` → fehlende
Pflichtfelder (Bild, Beschreibung, Kategorie, Region).

## Duplikatserkennung (`core/affiliate_dedup.py`)

`find_duplicate_candidates(product, existing_products)` prüft:
identische `affiliate_url`, identischer normalisierter Titel + gleiche
Marke, identische `external_product_id`. `create_duplicate_candidates()`
schreibt idempotent (sortierte Produkt-ID-Paare, `unique(product_a_id,
product_b_id)`) in die neue Tabelle `vt_affiliate_duplicate_candidates`.

## Regelbasierte Produktprüfung (`core/affiliate_review_rules.py`)

`review_product_rule_based()` klassifiziert jedes Produkt in genau einen
von 8 Buckets (Prioritätsreihenfolge):

1. `automatisch_abgelehnt` — auf der Blacklist
2. `link_defekt` — Link-Check fehlgeschlagen
3. `angebot_abgelaufen` — Enddatum überschritten
4. `moegliches_duplikat` — offener Duplikat-Kandidat vorhanden
5. `daten_unvollstaendig` — Pflichtfelder fehlen
6. `moeglicher_regelverstoss` — Gesundheits-/Heilversprechen-Schlüsselwörter
   gefunden (`HEALTH_CLAIM_KEYWORDS`, z. B. "heilt", "garantiert",
   "verschreibungspflichtig", "diagnose")
7. `einzelpruefung` — sensible Kategorie (Nahrungsergänzung,
   CGM-Zubehör, Blutdruckgeräte, Medizingeräte) ohne Schlüsselwörter
8. `sammelfreigabe` — alle Prüfungen bestanden

`summarize_approval_assistant(reviews)` erzeugt eine ehrliche
Text-Zusammenfassung ausschließlich aus echten Zählwerten (kein
Platzhaltertext).

## Sensible Kategorien & Health-Claims

`SENSITIVE_CATEGORY_NAMES` und `HEALTH_CLAIM_KEYWORDS` sind bewusst
konservativ und erweiterbar in `core/affiliate_review_rules.py` zentral
gepflegt (keine verstreuten Regel-Kopien in Router/Frontend).

## Optionale KI-gestützte Einzelprüfung

`POST /affiliate-intelligence/products/{id}/ai-review` — die **einzige**
LLM-Aufruf-Stelle in diesem Modul. Nutzt ausschließlich die bestehende
`services/ai_provider.py`-Abstraktion (kein neuer Provider), ist
Rate-Limited (`MAX_AI_REVIEWS_PER_DAY = 20`, gleiche Technik wie
`founder_business_coach.py::ask_business_coach`), setzt niemals
automatisch `status`, sondern liefert nur eine zusätzliche
Text-Erklärung. Bei Provider-Fehler wird ehrlich `503` zurückgegeben —
niemals eine erfundene Antwort.

## Bekannte Grenzen

- Die Regelprüfung ist bewusst konservativ/regelbasiert, kein ML-Modell.
- Der KI-Review ist optional und admin-initiiert, kein automatischer
  Hintergrundprozess.
