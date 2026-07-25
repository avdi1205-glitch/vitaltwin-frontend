# Release Notes Process

## Zwei Ansichten, eine Quelle

`core/release_notes_engine.py` baut **interne** und **nutzerfreundliche**
Release Notes aus genau demselben Changelog-Entwurf
(`core/changelog_engine.py`) — nie zwei unabhängige Wahrheiten.

## Interne Release Notes

`generate_internal_release_notes()` — alle 12 Kategorien, technische
Formulierung, **keine Freigabe erforderlich** (nur für interne
Verwendung).

## Nutzerfreundliche Release Notes

`generate_user_release_notes()` — nur die Kategorien Added/Changed/
Fixed/Removed (als "Neu"/"Verbessert"/"Behoben"/"Entfernt" beschriftet),
**immer freigabepflichtig** vor Veröffentlichung (`requires_approval:
true`). Security-, Database-, API- und Internal-Einträge werden **nie**
in die nutzerfreundliche Version übernommen — reiner Ausblende-Filter
über dieselbe Quelle, keine zweite Datenerhebung.

## Veröffentlichungs-Freigabe

Öffentliche Release Notes müssen laut Auftrag immer freigegeben werden —
dies erfolgt über den bestehenden Change-Proposal-Flow
([DOCUMENTATION_APPROVALS.md](./DOCUMENTATION_APPROVALS.md)), nicht über
einen separaten Mechanismus.

## Bekannte Grenzen

- Ohne Git-Verlauf (siehe [CHANGELOG_PROCESS.md](./CHANGELOG_PROCESS.md))
  sind auch die Release Notes auf den aktuellen Daten-/API-Stand
  beschränkt statt auf eine echte Versionshistorie.
