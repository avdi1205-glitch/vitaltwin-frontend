# Executive Risks & Opportunities

## Aggregation, keine neue Speicherung

`core/executive_risk_opportunity.py` legt **keine** eigene
Risiko-/Chancen-Tabelle an. `list_executive_risks()` /
`list_executive_opportunities()` sind reine Lesefunktionen, die zur
Laufzeit vereinheitlichen aus:

| Quelle | Wird zu |
|---|---|
| `vt_founder_business_insights` (Kategorie enthält "risiko") | Risk |
| `vt_founder_business_insights` (Kategorie enthält "chance") | Opportunity |
| `vt_automation_alerts` (`status='offen'`) | Risk |
| `vt_automation_opportunities` (`status='neu'`) | Opportunity |
| `core/affiliate_product_health.py` (`status='critical'`) | Risk |

Jedes Element trägt eine stabile `ref` (`"insight:<id>"`,
`"alert:<id>"`, `"automation_opportunity:<id>"`,
`"affiliate_product:<id>"`), über die Aktionen (schließen, an Task
Manager/Approval Center senden) exakt auf die zugrunde liegende Zeile
zurückwirken — nie auf eine zweite, unabhängige Kopie.

## Schließen/Archivieren

`close_executive_risk()`/`archive_executive_opportunity()` aktualisieren
**ausschließlich** den Status der Quellzeile (Insight → `archiviert`/
`verworfen`, Alert → `archiviert`, Automation-Opportunity → `abgelehnt`).
Produktgesundheits-Risiken (`affiliate_product:*`) können hier nicht
direkt geschlossen werden — Verweis auf den Affiliate-Intelligence-Tab.

## Task-Manager-/Approval-Center-Integration

`send_to_task_manager()`/`send_to_approval_center()` nutzen dieselbe
`dedupe_key`-Upsert-Logik wie jeder andere Founder-OS-Detector
(`ceo_intelligence_{ref}` / `ceo_intelligence_approval_{ref}`) — keine
Duplikate bei wiederholtem Senden. Freigabeanfragen werden **niemals**
automatisch ausgeführt — auch nicht für Kategorien wie Preisexperiment
oder Kampagnenstart, die im Auftrag als Beispiele genannt sind: es gibt
schlicht keine Ausführungsfunktion für diese Business-Entscheidungen in
dieser Codebase (konsistent mit dem "kein critical-Risiko"-Prinzip aus
Submodul G).

## Neue Erkennungsregel: Datenqualitätsrisiko

`detect_data_quality_risk()` — die einzige genuin neue Insight-Regel
dieses Submoduls. Prüft, wie viele der zentralen CEO-Overview-Kennzahlen
(`revenue_today`, `revenue_month`, `ai_cost`, `infra_cost`,
`product_status`, `release_status`) eine `data_quality` in
(`nicht_verbunden`, `unzureichend`, `widersprüchlich`, `veraltet`) haben.
Bei ≥ 4 von 6 wird ein Insight (Kategorie `datenqualitaetsrisiko`) in die
**bestehende** `vt_founder_business_insights`-Tabelle geschrieben —
idempotent über `dedupe_key` (ein Eintrag pro Tag), nie dupliziert.

## Bekannte Grenzen

- Kein separates `ExecutiveRisk`/`ExecutiveOpportunity`-Datenmodell mit
  eigenen Feldern wie `Frist`/`Wahrscheinlichkeit` — diese werden, wo
  nicht aus der Quelle ableitbar, ehrlich als `None` zurückgegeben.
- Produktgesundheits-Risiken sind nur lesend eingebunden (keine
  Statusänderung über CEO Intelligence, um die alleinige
  Zuständigkeit von Submodul F für Produktstatus nicht zu duplizieren).
