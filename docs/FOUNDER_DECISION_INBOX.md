# Founder Decision Inbox

## Bündelung aus Submodul D

`core/autopilot_orchestrator.py::get_decision_inbox()` liest **direkt**
`vt_founder_approvals` (Smart Approval Center, Submodul D) — keine
zweite Freigabe-Tabelle. Jede offene Freigabe wird um einen
`attention_score` (`core/autopilot_priority.py`) angereichert und danach
sortiert.

## One-Click Approval (Sammelfreigabe)

`execute_one_click_approval()` erlaubt eine Sammelfreigabe **nur wenn**:

- alle ausgewählten Elemente dieselbe `category` haben,
- alle dieselbe `priority` haben,
- die Priorität `mittel` oder `niedrig` ist (nie `kritisch`/`hoch`),
- die Kategorie nicht in `BULK_APPROVAL_EXCLUDED_CATEGORIES` liegt
  (rechtliches, datenschutz, preise, tarife, sicherheit, budgets,
  vertraege),
- keine Partnerprogramm-Aktivierung dabei ist (`related_entity_type ==
  "affiliate_partner"` wird immer ausgeschlossen — "Partnerprogramme
  endgültig aktivieren" ist laut Auftrag immer manuell).

Bei Verletzung einer dieser Regeln wird die gesamte Sammelfreigabe mit
`400 Bad Request` abgelehnt — **kein Teil-Erfolg**.

## Reale Seiteneffekte

Nur für `affiliate_product`- und `automation_rule`-Referenzen (mit
`risk_level == "low"`) hat die Sammelfreigabe einen echten Seiteneffekt
(Produktstatus/Regelaktivierung) — identisch zu den Einzel-Freigabe-
Seiteneffekten in `routers/founder_approval.py`, hier bewusst klein und
lokal reimplementiert (siehe Begründung in
[FOUNDER_AUTOPILOT.md](./FOUNDER_AUTOPILOT.md)), um keine
Router-zu-Router-Abhängigkeit zu erzeugen.

## Bekannte Grenzen

- Kein `Frist`/Deadline-Feld auf `vt_founder_approvals` — "läuft ab"
  kann daher nicht real erkannt werden; die Decision Inbox zeigt keine
  künstliche Frist an.
