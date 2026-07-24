# VitalTwin — Affiliate Recommendation Rules (AFFILIATE_RULES.md)

> Die vollständige, verbindliche Regel-Logik in `core/affiliate_engine.py`
> — jede Zeile hier entspricht direkt einer Zeile Code, damit dieses
> Dokument nie von der Realität abweichen kann.

## Grundsatz

**Kein LLM entscheidet, welches Produkt empfohlen wird.** Die
"Empfehlung" ist ein deterministischer Regelfilter über admin-kuratierte
Daten. Das ist eine bewusste Architekturentscheidung, keine Einschränkung
— sie macht die Mission ("nur geprüfte, freigegebene Produkte") technisch
unumgehbar, statt sie einem Prompt anzuvertrauen, der theoretisch ignoriert
werden könnte.

## Die 5 Regeln (`get_eligible_products` + `get_recommendations_for_user`)

Ein Produkt wird nur zurückgegeben, wenn **alle fünf** Bedingungen
zutreffen:

1. **Status.** `status` ist `approved` oder `active`. Jeder andere Status
   (`draft`, `in_review`, `paused`, `expired`, `archived`) schließt das
   Produkt kategorisch aus — keine Ausnahmen, keine "fast fertig"-Sonderfälle.

2. **Gültigkeitsfenster.** `start_date` ist leer oder `<= heute`,
   `end_date` ist leer oder `>= heute`. Ein abgelaufenes Produkt wird nie
   empfohlen, unabhängig vom Status.

3. **Link-Status.** `link_status != "broken"`. Ein Produkt mit zuletzt
   fehlgeschlagener Link-Prüfung (siehe
   `core/affiliate_link_checker.py`) wird ausgeschlossen, bis ein Admin es
   erneut prüft und der Link wieder erreichbar ist.

4. **Nicht gesperrt (Blacklist).** Weder die Produkt-ID, noch die Marke,
   noch der Partner, noch die Kategorie des Produkts darf in
   `vt_affiliate_blacklist` stehen. Eine Sperre auf einer beliebigen dieser
   vier Ebenen reicht aus, um das Produkt für **alle** Nutzer
   auszuschließen.

5. **Nutzerpräferenzen.** `vt_affiliate_user_prefs.affiliate_enabled` muss
   `true` sein (Standard, wenn der Nutzer nie etwas geändert hat). Zusätzlich
   dürfen die vom Nutzer ausgeblendeten Kategorien/Produkte
   (`hidden_categories`/`hidden_products`) das Produkt nicht betreffen.
   Diese Regel gilt **zusätzlich** zu 1–4, nicht anstelle davon.

## Sortierung

Unter den verbleibenden, zulässigen Produkten wird sortiert nach:

1. `pinned` (angeheftete Top-Empfehlungen zuerst),
2. `priority` (absteigend),
3. `rating` (absteigend).

Saisonale Kampagnen (`vt_affiliate_campaigns`) können eine Produktliste für
einen Zeitraum bevorzugen; die Kampagnenzuordnung selbst nimmt aber keinem
Produkt eine der 5 Regeln ab — ein in einer Kampagne enthaltenes, aber
gesperrtes oder abgelaufenes Produkt wird trotzdem nicht empfohlen.

## KI-Transparenz

Jede tatsächlich zurückgegebene Empfehlung erzeugt einen Eintrag in
`vt_affiliate_recommendation_log` mit:

- `email` — für wen wurde empfohlen (falls eingeloggt),
- `product_id`, `category`,
- `rule_applied` — aktuell immer
  `"eligible_status_not_expired_not_blacklisted_not_hidden"` (die einzige
  bisher implementierte Regel-Kombination; ein künftiges kontextbasiertes
  Ranking würde einen eigenen `rule_applied`-Wert bekommen),
- `reason` — Klartext-Zusammenfassung (Status, Pinned, Priorität,
  Link-Status) für den konkreten Fall.

Dieses Log beantwortet die drei geforderten Transparenz-Fragen:
"Warum wurde dieses Produkt gewählt?", "Welche Regel wurde verwendet?",
"Welche Kategorie war ausschlaggebend?" — nicht "welcher Nutzerkontext",
da aktuell kein kontextbasiertes (Ziel/Situation-abhängiges) Ranking
implementiert ist (siehe Abschlussbericht, bekannte Einschränkungen).

## Compliance-Kennzeichnung

`GET /api/affiliate/recommendations` markiert jedes zurückgegebene Produkt
mit `"is_affiliate": true` und `"disclosure": "Partnerempfehlung /
Affiliate Link / Werbung"` — direkt im Response-Objekt, nicht optional für
den aufrufenden Frontend-Code. Premium-Nutzer können Affiliate-Empfehlungen
vollständig deaktivieren (`PUT /api/affiliate/prefs`,
`affiliate_enabled: false`) — das greift unabhängig vom Premium-Status,
jeder eingeloggte Nutzer hat diese Kontrolle.
