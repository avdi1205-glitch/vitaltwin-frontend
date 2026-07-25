# Founder Autopilot Security

## Always Manual (niemals automatisch)

`core/autopilot_policies.py::ALWAYS_MANUAL_CATEGORIES` — Preise, Tarife,
Budgets, Verträge, Rechtliches, Datenschutz, Sicherheitsrichtlinien,
API-Schlüssel, Produktions-Releases, Branding, Strategie. Diese
Kategorien können in **keiner** Policy als `allowed_categories`
akzeptiert werden (`validate_policy_payload` wirft `ValueError`).

Zusätzlich gilt strukturell (wie bei Submodul G): Es gibt schlicht
**keine** Aktion mit `risk_level='critical'` in der Safe Action Registry
— Preisänderungen, Kontosperrungen, Datenlöschung, Produktionsdeployments,
Rückerstattungen, API-Schlüssel-Rotation etc. können über Founder
Autopilot niemals ausgeführt werden, unabhängig von jeder Policy- oder
Moduskonfiguration.

## Kill Switch

`POST /autopilot/kill-switch/activate` — setzt
`kill_switch_active=true`; `allowed_categories_for_current_state()`
liefert dann **immer** eine leere Menge, unabhängig vom Modus.
`run_orchestration_cycle()` prüft den Kill Switch als **allererstes** und
bricht sofort ab (`status: "gestoppt"`), bevor irgendetwas anderes
ausgewertet wird. Laufende, bereits gestartete Automationen in Submodul G
werden nicht gewaltsam abgebrochen (kein unkontrolliertes Abbrechen
irreversibler Aktionen) — nur neue Ausführungen werden verhindert.
Monitoring/Lesezugriffe bleiben während des Kill Switch uneingeschränkt
verfügbar.

## Umgehung des Approval Centers verhindert

Jede automatische Aktion, die Submodul G ausführt, unterliegt weiterhin
dessen eigener `approval_policy`-Prüfung — Founder Autopilot fügt nur
eine zusätzliche Kategorie-Einschränkung **davor** hinzu, hebt aber nie
eine Freigabepflicht auf. One-Click Approval selbst ist die explizite,
protokollierte Freigabe-Handlung des Founders — keine Umgehung.

## Manipulation von Risk Levels verhindert

Wie in Submodul G entscheidet die Ausführbarkeit einer Aktion über die
Safe Action Registry (nicht über ein Feld auf der Policy) — eine Policy
kann `maximum_risk_level` nicht nutzen, um eine nicht-registrierte oder
`critical`-Aktion freizuschalten.

## Berechtigungen

`view_founder_autopilot`/`manage_founder_autopilot` — `manage_*`
ausschließlich `super_admin`. `executive_analyst` nur Lesezugriff.
`admin` explizit ausgeschlossen.

## Bekannte Grenzen

- Keine Cross-Tenant-Prüfung nötig (kein Mandantenmodell in dieser App).
- Kein hartes Prozess-Kill für bereits laufende Automationen (siehe
  Kill-Switch-Abschnitt oben) — konsistent mit der synchronen,
  request-basierten Architektur der gesamten Codebase.
