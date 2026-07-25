# Documentation Approvals (Smart Approval Center Integration)

## Geschützte Dokumente

`core/documentation_protected.py::PROTECTED_PATH_MARKERS` — u. a.
`VITALTWIN_CONSTITUTION`, `IMPRESSUM`, `DATENSCHUTZ`, `AGB`,
`WIDERRUFSRECHT`, `PRIVACY`, `SECURITY_POLICY`, `PRICING`/`PREISE`,
`TERMS`, `CONTRACT`, `BRAND`. `is_protected(path)` prüft per
Substring-Match (case-insensitive) gegen den Dokumentpfad.

## Change Proposal Flow

1. `core/documentation_change_proposals.py::create_change_proposal()` —
   nur für geschützte Dokumente zulässig (wirft `ValueError` sonst).
   Speichert `proposed_content`, `reason`, `risk_level` in
   `vt_documentation_change_proposals` (`status='offen'`).
2. `send_proposal_to_approval_center()` — reuses die bestehende
   `vt_founder_approvals`-Tabelle (Submodul D) direkt, idempotent über
   `dedupe_key=f"documentation_proposal_{proposal_id}"`,
   `related_entity_type='documentation_change_proposal'`.
3. Der Gründer entscheidet **im bestehenden Approval-Center-UI** — es
   gibt keinen zweiten Freigabe-Bildschirm.
4. Nach Freigabe: das reale Anwenden der Änderung (Kopieren in die
   echte `.md`-Datei) bleibt ein manueller Schritt des Gründers — dieses
   Backend hat keine Schreibmöglichkeit für Frontend-Dokumente.

## Wann automatisch aktualisierbar (keine Freigabe nötig)

Technische Dateilisten, generierte Routen-/API-/Modellübersicht,
Teststatus, Buildstatus, Changelog-Entwurf, Release-Notes-Entwurf,
Dokumentationsabdeckung — alles über `core/documentation_generation.py`,
nie geschützt.

## Wann immer Freigabe erforderlich

Constitution, Preise, Markenversprechen, rechtliche Inhalte,
Datenschutz, Sicherheitsrichtlinien, medizinische Aussagen, öffentliche
Marketingaussagen, öffentliche Release Notes, Änderungen an
Modulmissionen — alle über den Change-Proposal-Flow oben.

## Bekannte Grenzen

- Es gibt keine automatisierte Erkennung, OB sich der Inhalt eines
  geschützten Frontend-Dokuments geändert hat (kein Dateizugriff) — der
  Change-Proposal-Flow wird ausschließlich manuell vom Gründer/Developer
  ausgelöst, wenn eine Änderung ansteht.
