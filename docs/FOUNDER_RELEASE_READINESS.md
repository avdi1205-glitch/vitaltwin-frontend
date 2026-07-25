# Founder Release Readiness

## Konservativ per Konstruktion

`core/autopilot_release_readiness.py::compute_release_readiness()`
kann TypeScript-, Lint-, Test- und Build-Erfolg **nicht** sicher aus
diesem Backend-Prozess heraus verifizieren (das würde entweder beliebige
Build-Tooling-Ausführung erfordern — ein Sicherheitsrisiko, das dieses
Projekt ausdrücklich verbietet — oder einen CI-Webhook-Empfänger, den es
nicht gibt). Diese Prüfungen sind daher **immer** `verifiable: false` und
zählen **gegen** die Bereitschaft — nie wird ein nicht verifizierter
Check als "bestanden" angenommen.

## Echte, verifizierbare Prüfungen

- Offene kritische Aufgaben (`vt_founder_tasks`, `priority='kritisch'`)
- Offene kritische Freigaben (`vt_founder_approvals`, `priority='kritisch'`)
- Dokumentationsabdeckung (Submodul I, Schwelle 70%)

## Gesamturteil

- `nicht_bereit` — sobald irgendeine **verifizierbare** Prüfung
  fehlschlägt (kritischer Bug/Freigabe offen, Doku unter Schwelle).
- `bereit_mit_offenen_punkten` — wenn alle verifizierbaren Prüfungen
  bestehen, aber nicht-verifizierbare Punkte (TS/Lint/Tests/Build/
  Migrationen/Rollback) offen bleiben — das ist der **bestmögliche**
  Status, den dieses Backend je automatisch vergeben kann.
- `bereit` — wird von dieser Funktion aktuell **nie** zurückgegeben,
  solange TypeScript/Lint/Tests/Build nicht automatisch verifizierbar
  sind (ehrlich dokumentierte Grenze, kein Bug).

## Keine automatische Veröffentlichung

Founder Autopilot löst niemals selbst einen Release/Deploy aus — dieser
Endpunkt ist ausschließlich informativ.

## Bekannte Grenzen

- Migrationsstatus ("wurde in Supabase ausgeführt?") ist nicht
  automatisch verifizierbar — nur die Liste vorhandener
  Migrationsdateien ist bekannt (Submodul I).
