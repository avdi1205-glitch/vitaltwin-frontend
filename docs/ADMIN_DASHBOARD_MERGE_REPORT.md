# Admin Dashboard / Founder OS — Merge Report

Date: 2026-08-01

## Ziel

Es gibt weiterhin genau **einen** zentralen Admin-Bereich unter `/admin`, mit
Founder OS als erweitertem Steuerungsbereich unter `/admin/founder` — beide im
selben Layout/Sidebar (`app/admin/layout.tsx`). Dieses Dokument beschreibt, was
für diese Aufgabe tatsächlich zusammengeführt/bereinigt wurde.

## 1. Umbenennung "Enterprise" → "VitalTwin Admin Dashboard"

- `frontend/app/admin/page.tsx`: Seitentitel `"VitalTwin Enterprise Admin
  Dashboard"` → `"VitalTwin Admin Dashboard"`.
- `backend/app/routers/admin.py`: Moduldoku-Kopfzeile `"VitalTwin Enterprise
  Release — Admin Control Center 1.0."` → `"VitalTwin Admin Dashboard."`.
- **Bewusst NICHT geändert**: interne Code-Kommentare/Docstrings in ca. 90
  weiteren Backend-Dateien (z. B. `automation_engine.py`,
  `affiliate_engine.py`, `autopilot_*.py`), die "VitalTwin Enterprise" als
  internen Versions-/Release-Label in Docstrings verwenden. Das ist reine
  interne Dokumentation ohne Nutzer-/Admin-sichtbaren Effekt — eine
  Umbenennung dort war nicht Teil des Auftrags ("an dieser Stelle") und hätte
  ein Risiko für ~90 unbeteiligte Dateien ohne Nutzen dargestellt. Kann bei
  Bedarf separat beauftragt werden.

## 2. Layout & Sidebar — bereits einheitlich, keine Änderung nötig

`frontend/app/admin/layout.tsx` verwendet bereits **eine einzige** Sidebar
(`NAV_SECTIONS`) für alle Admin-Unterseiten inkl. Founder OS, mit exakt der
geforderten Reihenfolge (Dashboard, Founder OS, Nutzerverwaltung, Content
Management, Nutrition & CGM, KI Control Center, Business Center, Analytics,
Security Center, System Center, Support Center, Integrationen, Affiliate
Center) plus "← Zurück zur App" im Sidebar-Footer. Es existierte keine zweite
Admin-Navigation — hier war keine Bereinigung nötig, nur Verifikation.

## 3. Zentrales Admin Dashboard (`/admin`) — neue Kennzahlen ergänzt

`frontend/app/admin/page.tsx`, Abschnitt "1. Systemübersicht" wurde um alle in
der Aufgabe geforderten Kennzahlen erweitert (vorher fehlten mehrere). Neue
Reihenfolge/Inhalt:

| Kennzahl | Quelle | Status |
|---|---|---|
| Nutzer gesamt / aktive Nutzer / neue Registrierungen | `GET /api/admin/dashboard` | echt |
| Beta-Bewerbungen | **NEU**: `GET /api/admin/dashboard` → `beta_applications_total` (zählt `vt_beta_applications`) | echt, aber siehe Hinweis unten |
| Premium-Nutzer | `GET /api/admin/dashboard` | echt |
| Umsatz | — | ehrlich "Nicht eingerichtet" (kein Stripe-Reporting) |
| Affiliate-Umsatz | `GET /api/admin/business/overview` (`affiliate_note`) | ehrlich "Nicht eingerichtet" |
| KI-Nutzung heute | `GET /api/admin/dashboard` (`ai_requests_today`) | echt |
| KI-Kosten | — | ehrlich "Nicht eingerichtet" (kein Kosten-Tracking in `services/ai_provider.py`) |
| Datenbankstatus / API-Status / Stripe-Status / KI-Status | `GET /api/admin/dashboard` | echt |
| Letzter Release | — | ehrlich "Nicht eingerichtet" (kein Versions-Tag im Betrieb) |
| Letzter Backup-Status | — | ehrlich "Nicht eingerichtet" (kein Backup-System) |
| Offene Aufgaben | **NEU**: `GET /api/admin/founder/tasks` → `summary.open_tasks` (nur mit `view_founder_os`) | echt |
| Offene Freigaben | **NEU**: `GET /api/admin/founder/approvals` → `summary.open` (nur mit `view_founder_os`) | echt |
| Aktuelle/kritische Warnungen | **NEU**: `summary.critical_tasks + summary.critical_open` aus den beiden obigen Endpunkten | echt |
| Letzte Systemaktivitäten | **NEU**: `GET /api/admin/dashboard` → `latest_activity` (jüngster `vt_audit_events`-Eintrag) | echt |

**Hinweis Beta-Bewerbungen**: Es gibt in `vt_beta_applications` keinen
Freigabe-/Aktivierungsstatus (kein `status`-Feld) — die Zahl zeigt daher
"eingegangene Bewerbungen gesamt", nicht "aktive Beta-Tester". Das ist im UI
als `hint` transparent gemacht (`beta_applications_note`).

### Backend-Änderung (additiv, klein)

`backend/app/routers/admin.py` — `GET /api/admin/dashboard` bekommt zwei neue
Felder: `beta_applications_total` (Count auf `vt_beta_applications`, wie alle
anderen Counts via `_count_rows`, also `None` statt falscher `0` bei Fehlern)
und `latest_activity` (neuestes `vt_audit_events`-Row, `action`/`entity_type`/
`email`/`created_at`). Keine neue Tabelle, keine neue Migration nötig — beide
Tabellen existieren bereits. 885 Backend-Tests weiterhin grün.

## 4. Founder OS Dashboard-Tab — von Duplikat zu kompakter Zusammenfassung

**Vorher**: Der "Dashboard"-Tab in `frontend/app/admin/founder/page.tsx` rief
`GET /api/admin/founder/dashboard` auf und zeigte 6 Karten (Nutzer, Umsatz,
KI, Affiliate, System, Aufgaben) — praktisch dieselben Kennzahlen wie das
zentrale `/admin`-Dashboard, nur in einer zweiten Darstellung.

**Jetzt**: Der Tab zeigt eine kompakte Founder-Zusammenfassung ohne
Kennzahl-Duplikate:

1. **Wichtigste heutige Kennzahlen** — neue/aktive Nutzer heute, KI-Anfragen
   heute, Affiliate-Umsatz heute (aus `GET /api/admin/founder/daily-briefing`)
2. **Kritische Warnungen** — `briefing.warnings[]`
3. **Offene Entscheidungen & Freigaben** — `GET /api/admin/founder/approvals`
   → `summary.open` / `summary.critical_open`, mit direktem Tab-Wechsel zum
   Approval Center
4. **Wichtigste Aufgaben** — Top 5 aus `briefing.tasks[]`
5. **Automatisierungsstatus** — `GET /api/admin/founder/automation/dashboard`
   (nur mit `view_automation_engine`; sonst ehrlicher Hinweis auf fehlende
   Berechtigung statt leerer Karte)
6. **Empfehlungen des AI Business Coach** — `GET
   /api/admin/founder/business-coach/recommendations`, gefiltert auf
   `status === "offen"`, max. 3 Einträge
7. **Nächste Gründeraktionen** — `briefing.priorities[]`

Die alte `type FounderDashboard` und der zugehörige API-Aufruf
(`GET /api/admin/founder/dashboard`) wurden aus dem Frontend entfernt (nicht
mehr referenziert). **Der Backend-Endpoint selbst (`backend/app/routers/
founder.py::/dashboard`) wurde NICHT gelöscht** — er bleibt bestehen, falls er
anderweitig gebraucht wird, wird aber aktuell von keinem Frontend-Tab mehr
aufgerufen.

## 5. Wiederverwendete/gemeinsam genutzte Komponenten

Keine neuen KPI-Komponenten wurden gebaut — alles nutzt weiterhin die
bestehenden gemeinsamen Bausteine aus `frontend/app/admin/_lib/AdminUI.tsx`
(`Kpi`, `Card`, `Badge`, `Button`, `Note`, `SectionTitle`, `Loading`,
`ErrorText`) und `Metric`/`CardTitle`/`priorityTone` aus
`frontend/app/admin/founder/page.tsx` (lokal für Founder-OS-Tabs, wie zuvor).
Beide Bereiche laufen weiterhin durch denselben `AdminContextProvider`
(`useAdmin()` liefert `authFetch`/`hasPermission`/`tokens`/`theme`).

## 6. Was noch nicht angeschlossen ist

- **KI-Kosten**: Es gibt in der gesamten Codebasis kein Kosten-/Token-Tracking
  für OpenAI-Aufrufe (`services/ai_provider.py` trackt das nicht). Überall
  ehrlich als "Nicht eingerichtet" markiert statt geschätzt.
- **Letzter Release / Versions-Tag**: Kein gespeichertes Versionsfeld. Es gibt
  zwar `core/changelog_engine.py` (echtes `git log`), aber keinen
  persistierten "aktueller Release"-Zustand für eine schnelle Dashboard-Kachel
  — bewusst nicht angebunden, um keinen schweren `git log`-Aufruf in jede
  Dashboard-Ladezeit einzubauen. Bei Bedarf: eigener leichter Endpoint auf
  Basis von `changelog_engine.py`.
- **Letzter Backup-Status**: Kein Backup-System vorhanden — ehrlich markiert.
- **Umsatz / Affiliate-Umsatz auf Zentral-Dashboard**: Kein Stripe-Reporting
  bzw. kein Provisions-Tracking implementiert (bereits vorher so, unverändert
  ehrlich markiert).
- **Beta-Tester-Status** (aktiv/inaktiv/freigegeben): `vt_beta_applications`
  hat kein Statusfeld — nur Bewerbungszähler verfügbar (siehe oben).

## 7. Fehlende Umgebungsvariablen

Keine neuen Umgebungsvariablen durch diese Aufgabe eingeführt. Weiterhin
offen (unverändert, aus früheren Prüfungen bekannt):
- `STRIPE_SECRET_KEY` / Stripe-Reporting-API-Zugang (für echtes Umsatz-KPI)
- Kein Cost-Tracking-Provider für OpenAI (kein ENV-Wert würde das lösen —
  bräuchte Code-Änderung in `ai_provider.py`)
- Kein Backup-/Monitoring-Provider (z. B. keine `BACKUP_STATUS_URL` o. Ä.)

## 8. Verifikation

- `npx tsc --noEmit -p tsconfig.json` — keine Fehler
- `npm run lint` — keine Fehler/Warnungen
- `npm run build` — erfolgreich, alle Routen inkl. `/admin`, `/admin/founder`
  gebaut, keine toten Links festgestellt
- Backend: `pytest -q` — 885/885 Tests grün (inkl. `test_admin_router.py`
  nach der additiven `/api/admin/dashboard`-Erweiterung)
- Bestehende Berechtigungen unverändert: keine RBAC-Permission entfernt oder
  umbenannt, `super_admin` behält alle Rechte
- Keine Datenbankdaten, keine bestehenden Funktionen gelöscht
