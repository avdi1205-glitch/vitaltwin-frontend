# Affiliate Compliance & Privacy

## Kennzeichnungspflicht (Disclosure)

Jede Empfehlung, die über den Recommendation Simulator (und im echten
Empfehlungspfad über `routers/affiliate.py::GET /recommendations`, bereits
vor Submodul F vorhanden) zurückgegeben wird, trägt ein
`disclosure`-Feld ("Partnerempfehlung / Affiliate Link / Werbung"). Diese
Kennzeichnung wurde nicht verändert, nur im Simulator zusätzlich
gespiegelt, um Vorschau-Konsistenz mit dem echten Verhalten
sicherzustellen.

## Blacklist-Vorrang

Die Blacklist (`vt_affiliate_blacklist`, Typen `product` / `brand` /
`partner` / `category`) hat in jeder Prüfung — Product Health,
Regelprüfung, Empfehlungs-Engine — höchste Priorität. Ein
blacklisted Produkt/Marke/Partner wird nie empfohlen, unabhängig von
Score oder Priorität.

## Keine Heilversprechen / Gesundheitsclaims

`HEALTH_CLAIM_KEYWORDS` in `core/affiliate_review_rules.py` erkennt
Formulierungen wie "heilt", "garantiert", "verschreibungspflichtig",
"Diagnose" und leitet betroffene Produkte automatisch in
`moeglicher_regelverstoss` statt in die Sammelfreigabe — damit landen
sie zwingend bei einer manuellen Gründer-Prüfung.

## Sensible Produktkategorien

Nahrungsergänzung, CGM-Zubehör, Blutdruckgeräte und Medizingeräte werden
als sensibel markiert (`SENSITIVE_CATEGORY_NAMES`) und — sofern keine
Health-Claim-Keywords vorliegen — in `einzelpruefung` eingestuft statt in
die Sammelfreigabe.

## Nutzerkontrollen (bereits vorhanden, unverändert)

`vt_affiliate_user_prefs` (`affiliate_enabled`, `hidden_categories`,
`hidden_products`) wird bereits von `core/affiliate_engine.py` respektiert
— Submodul F hat diesen Mechanismus **nicht verändert und nicht
dupliziert**.

## Datenschutz / Datenminimierung

- Der Recommendation Simulator arbeitet ausschließlich mit einem
  **neutralen Testkontext** (Freitext des Admins), niemals mit echten
  Nutzerdaten oder Nutzer-IDs.
- Keine neuen personenbezogenen Datenfelder wurden eingeführt.
- API-Zugangsdaten (`api_key` in `vt_affiliate_partners`) werden
  weiterhin nie an das Frontend zurückgegeben.

## Bekannte Grenzen

- Die Regel-Keyword-Liste ist kein Ersatz für eine juristische Prüfung
  bei tatsächlichem Wirkstoff-/Gesundheitsmarketing — bei Zweifel ist
  weiterhin eine manuelle Gründer-Freigabe erforderlich (das System stuft
  solche Fälle bewusst konservativ in `einzelpruefung` /
  `moeglicher_regelverstoss` ein, statt sie automatisch freizugeben).
