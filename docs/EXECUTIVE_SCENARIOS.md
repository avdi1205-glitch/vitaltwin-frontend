# Executive Scenarios (Scenario Planning)

## 6 Szenario-Typen

`core/executive_scenarios.py` implementiert alle 6 im Auftrag genannten
Szenarien — aber **nur dort, wo eine echte Baseline existiert**, wird
tatsächlich gerechnet. Die anderen antworten ehrlich mit
`computable: false` + Begründung (siehe unten "Leerzustand
Szenario nicht berechenbar").

| Szenario | Berechenbar? | Baseline |
|---|---|---|
| `premium_conversion_up` | ✅ Ja | `vt_users` (premium-Flag / Gesamtnutzer) |
| `churn_down` | ❌ Nein | Keine Kündigungs-/Downgrade-Erfassung vorhanden |
| `affiliate_ctr_up` | ✅ Ja | `vt_affiliate_events` (Impressionen/Klicks/Conversions/Provision, 7 Tage) |
| `ai_cost_up` | ❌ Nein | Kein Kosten-Tracking (services/ai_provider.py liefert keinen Verbrauch) |
| `new_users_grow` | ✅ Ja | `vt_users.created_at` (7-Tage-Fenster) |
| `annual_plan_share_up` | ❌ Nein | Kein Plan-/Abrechnungszyklus pro Nutzer gespeichert |

## Format jedes Ergebnisses

```json
{
  "scenario_type": "...",
  "assumption": { "delta_pct": 10 },
  "computable": true,
  "baseline": { ... },
  "projected": { ... },
  "affected_metrics": ["..."],
  "uncertainty_note": "...",
  "limits_note": "..."
}
```

## Keine Garantie, keine automatische Ausführung

Jedes berechenbare Ergebnis trägt eine `uncertainty_note`
("Einfache lineare Schätzung … keine Garantie, keine automatische
Umsetzung"). Kein Szenario ändert jemals einen echten Preis, Tarif oder
eine echte Kampagne — die Funktion berechnet ausschließlich eine
Zahl, die der Founder selbst interpretiert.

## Gespeicherte Szenarien

`vt_executive_scenarios` (neue Tabelle) — `save_scenario()` /
`list_scenarios()` / `delete_scenario()`, nur mit
`manage_ceo_intelligence` (super_admin) erstell-/löschbar; Lesen mit
`view_ceo_intelligence`.

## Bekannte Grenzen

- Rein lineare Extrapolation, keine saisonale Anpassung, kein
  Konfidenzintervall im statistischen Sinne — nur eine qualitative
  Unsicherheits-Notiz.
- 3 von 6 Szenarien sind aktuell nicht berechenbar (siehe Tabelle oben) —
  das UI zeigt das ehrlich an, statt eine Zahl zu erfinden.
