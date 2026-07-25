# Automation Approvals (Smart Approval Center Integration)

## Wiederverwendung statt Parallelsystem

Die Automation Engine baut **kein eigenes Freigabesystem** — jede
Freigabeanfrage landet in der bestehenden `vt_founder_approvals`-Tabelle
und wird über die bestehende `routers/founder_approval.py`-API
entschieden. Zwei neue `related_entity_type`-Werte wurden dafür additiv
ergänzt:

### `automation_rule`

Wird erzeugt, wenn eine Regel mit `risk_level in (medium, high)` oder
`approval_policy != no_approval` aktiviert werden soll
(`request_rule_activation`). Enthält: Regelname, Trigger, Bedingungen,
geplante Aktionen, Risk Level, betroffene Systeme (aus den Aktionen
ableitbar), erwarteten Nutzen.

Seiteneffekt bei Freigabe: Regel wird `aktiv`+`enabled=true`. Bei
Ablehnung: Regel bleibt/wird `entwurf`+`enabled=false`. **Nur
`super_admin`** darf diesen Seiteneffekt für Medium/High-Risk auslösen
(siehe [AUTOMATION_SECURITY.md](./AUTOMATION_SECURITY.md)).

### `automation_run`

Wird erzeugt, wenn eine bereits aktive Regel fällig ist, aber ihre
`approval_policy` (`always_require_approval`, oder `risk_level in
(medium, high)`) eine Freigabe *pro Lauf* verlangt. Der Run bleibt in
`wartet_auf_freigabe`, bis der Gründer entscheidet.

Seiteneffekt bei Freigabe: der Run wird jetzt tatsächlich ausgeführt
(`execute_rule_run`); bei `approval_policy='one_time_approval'` wird
zusätzlich `approved_once=true` auf der Regel gesetzt, sodass zukünftige
Läufe **derselben** Regel keine erneute Freigabe mehr brauchen. Bei
Ablehnung: Run wird `abgebrochen`.

## Wann eine Freigabe NICHT nötig ist

`risk_level='low'` + `approval_policy='no_approval'` → Regel läuft direkt,
ganz ohne Approval-Center-Beteiligung — deckt die im Auftrag genannten
Low-Risk-Beispiele ab (defekten Link erneut prüfen, Report aktualisieren,
Analytics aggregieren, Daily Briefing lesen).

## Approval-Request-Inhalt

Jede automatisch erzeugte Freigabeanfrage enthält (wie alle anderen
Smart-Approval-Center-Vorschläge) `reason`, `data_used`, `rules_applied`,
`benefits`, `risks` — aus echten Regel-/Lauf-Feldern gebaut, nie
Platzhaltertext.
