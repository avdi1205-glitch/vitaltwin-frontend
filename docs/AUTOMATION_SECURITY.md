# Automation Security

## Safe Action Registry

`core/automation_registry.py::ACTION_REGISTRY` ist die **einzige**
Quelle erlaubter Aktionen. Jede Aktion in einer Regel muss dort
existieren, `implemented=True` sein und für die Ziel-Umgebung erlaubt
sein (`validate_actions()`), sonst wird die Regel mit `400` abgelehnt.
Es gibt **keine dynamische Codeausführung, keine Shell-Befehle, keine
unkontrollierte Tool-Ausführung** — jede Aktion ist eine fest verdrahtete
Python-Funktion in `core/automation_engine.py::_execute_action()`, die
ausschließlich bereits bestehende, reviewte Module aufruft
(`affiliate_link_checker`, `vt_affiliate_products`-Statusänderungen,
`founder_business_metrics`, `core.integrations`).

## Kein `critical`-Risiko implementiert

`registry.validate_risk_level()` wirft einen Fehler, sobald
`risk_level == "critical"` gesetzt wird — Regeln mit diesem Risk Level
können nicht einmal gespeichert werden. Es gibt schlicht **keine**
Aktion in der Registry für Preisänderungen, Tarifänderungen, rechtliche
Texte, Datenschutzregeln, Kontosperrungen/-löschungen,
Produktionsdeployments, Rückerstattungen, Verträge, API-Schlüssel-Rotation
oder Sicherheitsrichtlinien — unabhängig von jedem `risk_level`-Feld auf
einer Regel.

## Manipulation von `riskLevel` verhindert

Da die Ausführbarkeit einer Aktion an der Registry (nicht am
`risk_level`-Feld der Regel) hängt, kann ein manipuliertes `risk_level`
auf der Regel keine nicht-registrierte/nicht-implementierte Aktion
freischalten — `is_action_allowed()` prüft ausschließlich gegen die feste
Registry.

## Umgehung des Approval Centers verhindert

- Medium/High-Risk-Regelaktivierung erzeugt zwingend eine
  Freigabeanfrage (`request_rule_activation`) — es gibt keinen direkten
  Aktivierungspfad, der das umgeht.
- Läuft eine bereits aktive Regel mit `approval_policy in
  (always_require_approval)` oder `risk_level in (medium, high)`, wird
  **vor** jeder Ausführung ein Freigabe-Run (`wartet_auf_freigabe`)
  erzeugt; die Ausführung selbst passiert erst als Seiteneffekt der
  Freigabe-Entscheidung.
- Nur `super_admin` (== Gründer in dieser Single-Founder-App) darf eine
  Medium/High-Risk-Automatisierungsregel per Freigabe aktivieren — ein
  `admin`, der zufällig `manage_founder_os` besitzt, wird in
  `routers/founder_approval.py::_apply_entity_side_effect()` explizit
  blockiert, selbst wenn er die Freigabe technisch anklicken könnte (der
  Freigabe-Datensatz wird zwar aktualisiert, aber die reale
  Aktivierung bleibt aus).

## Berechtigungen (abweichend vom Founder-OS-Standardmuster)

Anders als alle anderen Founder-OS-Submodule (die
`view_founder_os`/`manage_founder_os` teilen) hat die Automation Engine
**zwei eigene, engere Permissions**: `view_automation_engine` /
`manage_automation_engine`.

- `super_admin`: beide (== Gründer).
- `automation_manager` (neue Rolle): **nur** diese beiden — kein
  Zugriff auf andere Admin-Bereiche.
- `analyst`: nur `view_automation_engine` (rein lesend).
- `admin`: **explizit ausgeschlossen** aus dem automatischen
  Vollzugriff (`ROLE_PERMISSIONS["admin"]` schließt beide Permissions
  aus) — ein normaler Admin muss vom Gründer ausdrücklich zu
  `automation_manager` oder `super_admin` hochgestuft werden.
- Alle anderen Rollen: kein Zugriff.

Begründung für diese Abweichung: Dieses Modul kann reale Aktionen
ausführen (Affiliate-Produkte pausieren, Tasks/Approvals erzeugen) — der
Auftrag verlangt explizit "Normale Admins dürfen nicht automatisch
Zugriff erhalten", was mit dem bisherigen geteilten Berechtigungspaar
(das `admin` automatisch mit einschließt) nicht abbildbar gewesen wäre.

## Sonstige Schutzmaßnahmen

- **Idempotenz**: jeder Lauf hat einen eindeutigen `idempotency_key`
  (`rule_id:trigger_signature`) — ein wiederholter Trigger (z. B.
  derselbe Kalendertag) erzeugt nie einen zweiten Lauf.
- **Keine Endlosschleifen**: `retry_policy.max_attempts` ist verpflichtend
  begrenzt; nach Erreichen wandert der Lauf in `dead_letter` und wird nie
  wieder automatisch versucht.
- **Deaktivierte Regeln laufen nie**: `evaluate_and_run_due_rules()`
  filtert immer auf `enabled=true AND status='aktiv'`.
- **Keine Cross-Tenant-Zugriffe**: es gibt kein Mandantenmodell in dieser
  App — alle Daten gehören demselben Gründer/Workspace.
- **Keine Geheimnisse im Audit-Log**: `record_audit_event()` (bestehend,
  unverändert) speichert nur strukturierte Metadaten, nie Zugangsdaten.

## Bekannte Grenzen

- Timeout ist best-effort (kein hartes Prozess-Kill), da die gesamte
  Codebase synchron/request-basiert arbeitet.
- Kein echtes Multi-Environment-Deployment — `environment` ist ein Feld,
  keine getrennte Infrastruktur.
