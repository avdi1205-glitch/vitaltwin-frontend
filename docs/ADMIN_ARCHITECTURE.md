# VitalTwin — Admin Control Center Architecture (ADMIN_ARCHITECTURE.md)

> Erstellt für **"VitalTwin Enterprise Release — Admin Control Center 1.0"**.
> Beschreibt die 7 Admin-Rollen und ihre Berechtigungslogik, den
> vollständigen Berechtigungs-Matrix, wie jeder Admin-Bereich seine Daten
> aus den bestehenden Fachtabellen ableitet, das Sicherheitsmodell (RBAC,
> HTTP-Semantik, No-Password-Exposure) und den Erweiterungspfad für neue
> Rollen/Berechtigungen/Bereiche.

## 1. Grundprinzipien

- **Abwesenheit = kein Admin.** Ein Konto ist Admin genau dann, wenn eine
  Zeile für seine `email` in `vt_admin_roles` existiert
  (`migrations/009_admin_rbac_foundation.sql`). Es gibt keine implizite
  Standardrolle und keinen "jeder ist zumindest Viewer"-Fallback.
- **Die Berechtigungsmatrix lebt im Code, nicht in der Datenbank**
  (`backend/app/core/admin_rbac.py::ROLE_PERMISSIONS`). Eine neue Fähigkeit
  einer Rolle zu geben erfordert nie eine Migration, nur ein Code-Review +
  Deploy. Die Datenbank speichert ausschließlich, *welche* Rolle ein Admin
  hat.
- **Feingranulare Berechtigungen, keine rohen Rollen-Checks.** Jeder
  Endpunkt prüft eine konkrete `Permission` (z. B. `manage_users`), nie
  `if role == "admin"`. Das hält `routers/admin.py` frei von verstreuten
  Rollen-Vergleichen und macht das tatsächliche Zugriffsmodell an einer
  einzigen Stelle auditierbar (`core/admin_rbac.py`).
- **Ehrlichkeit statt erfundener Zahlen.** Jeder Bereich, der eine
  Fähigkeit noch nicht hat (Umsatz-Reporting, Token-/Kosten-Tracking,
  Affiliate-System, Gutscheine, Nutrition-/CGM-Pipeline, Cron/Queues,
  Health Connect/Apple Health), sagt das explizit im Response-Payload statt
  eine `0` oder einen Platzhalter vorzutäuschen (siehe §4 pro Bereich).
- **Manuelle Dependency-Aufrufe, kein `fastapi.Depends`.** Passend zur
  bestehenden Konvention im gesamten Backend (`core/auth.py::require_email`
  wird direkt in jeder Endpunkt-Funktion aufgerufen). Jeder Admin-Endpunkt
  ruft `require_admin_permission(authorization, permission)` als ersten
  Schritt auf — keine Ausnahme.

## 2. Die 7 Admin-Rollen

| Rolle | Zweck | Umfang |
|---|---|---|
| `super_admin` | Vollzugriff, inklusive der beiden "Machtberechtigungen" | Alle 20 Berechtigungen, inklusive `manage_roles` und `manage_security` |
| `admin` | Operativer Vollzugriff im Tagesgeschäft | Alle Berechtigungen außer `manage_roles`/`manage_security` |
| `support` | Nutzer-Support | Nutzer suchen/ansehen/sperren, Einwilligungen/Login-Historie einsehen, Support-Tickets |
| `moderator` | Content-Moderation + Support | Content verwalten, Support-Tickets, read-only Nutzer-Lookup (Kontext zu Meldungen) |
| `editor` | Reiner Content-Zugriff | Nur Blog/FAQ/Landing/Hilfe/Benachrichtigungen — **kein** Zugriff auf Nutzerdaten |
| `analyst` | Read-only Kennzahlen | Dashboard/Analytics/Business/KI-Nutzung — nie verändernd |
| `developer` | System/Sicherheit (read-only) + KI-Konfiguration | System-/Security-Status, KI-Nutzung, KI-Einstellungen, Content lesen |

**Warum `manage_roles` und `manage_security` nur `super_admin` vorbehalten
sind:** Beide sind "Macht"-Berechtigungen mit Eskalationspotenzial —
`manage_roles` erlaubt es, sich selbst oder andere zu Admins zu machen
(Privilege-Escalation-Schleife), `manage_security` erlaubt das Ändern
sicherheitskritischer Konfiguration. Beides bewusst von der sonst
identischen `admin`-Rolle getrennt.

## 3. Vollständige Berechtigungsmatrix

Quelle: `backend/app/core/admin_rbac.py::ROLE_PERMISSIONS` (auch live
abrufbar über `GET /api/admin/security/permissions`, Berechtigung
`view_security`).

| Berechtigung | super_admin | admin | support | moderator | editor | analyst | developer |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `view_dashboard` | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ |
| `view_users` | ✅ | ✅ | ✅ | ✅ | | | |
| `manage_users` | ✅ | ✅ | ✅ | | | | |
| `manage_roles` | ✅ | | | | | | |
| `manage_premium` | ✅ | ✅ | | | | | |
| `view_consents` | ✅ | ✅ | ✅ | | | | |
| `view_login_history` | ✅ | ✅ | ✅ | | | | |
| `view_content` | ✅ | ✅ | | ✅ | ✅ | | ✅ |
| `manage_content` | ✅ | ✅ | | ✅ | ✅ | | |
| `view_nutrition_admin` | ✅ | ✅ | | | | | |
| `view_ai_usage` | ✅ | ✅ | | | | ✅ | ✅ |
| `manage_ai_settings` | ✅ | ✅ | | | | | ✅ |
| `view_business` | ✅ | ✅ | | | | ✅ | |
| `manage_business` | ✅ | ✅ | | | | | |
| `view_analytics` | ✅ | ✅ | | | | ✅ | |
| `view_security` | ✅ | ✅ | | | | | ✅ |
| `manage_security` | ✅ | | | | | | |
| `view_system_status` | ✅ | ✅ | ✅ | | | ✅ | ✅ |
| `view_support` | ✅ | ✅ | ✅ | ✅ | | | |
| `manage_support` | ✅ | ✅ | ✅ | ✅ | | | |

## 4. Datenfluss pro Bereich (API unter `/api/admin`, siehe `routers/admin.py`)

Jeder Abschnitt unten nennt: die Berechtigung, die Quelltabellen, und —
sofern zutreffend — was bewusst **nicht** implementiert ist.

| Bereich | Endpunkte | Berechtigung(en) | Quelle | Ehrlichkeits-Hinweis |
|---|---|---|---|---|
| Admin Dashboard | `GET /dashboard` | `view_dashboard` | `vt_users`, `vt_daily_wellness_entries`, `vt_user_feedback`, `vt_chat_usage`, Env-Variablen | Kein Umsatz-Reporting (Stripe-API fehlt), kein Error-Tracking (z. B. Sentry) |
| User Management | `GET/POST /users*` | `view_users`, `manage_users`, `manage_roles`, `manage_premium`, `view_login_history` | `vt_users`, `vt_admin_roles`, `vt_login_events`, `vt_consent_records` | Passwörter werden **nie** selektiert (`_db_get_user`/Listen-Query lassen `password` konsequent weg) |
| Security Center | `GET /security/*` | `view_security` | `vt_audit_events`, `vt_login_events`, `ROLE_PERMISSIONS` (Code) | — |
| System Center | `GET /system/status` | `view_system_status` | DB-Erreichbarkeit (Live-Query), Env-Variablen | Kein Storage-/Cron-/Queue-System vorhanden; keine Health-Connect/Apple-Health-Anbindung |
| Support Center | `GET /support/feedback` | `view_support` | `vt_user_feedback` | Feedback/Bug-Reports/Feature-Wünsche laufen aktuell undifferenziert über eine gemeinsame Tabelle |
| Analytics | `GET /analytics/growth` | `view_analytics` | `vt_users`, `vt_daily_wellness_entries` | Kohorten-Retention, Session-Dauer und Feature-Nutzung im Detail erfordern ein dediziertes Event-Tracking-System |
| Content Management | `GET/POST/PATCH/DELETE /content*` | `view_content`, `manage_content` | `vt_content_items` | Ein generisches Modell für Blog/FAQ/Landing/Hilfe/Benachrichtigung — kein Rich-Media, keine Versionierung |
| KI Control Center | `GET /ai/usage` | `view_ai_usage` | `vt_chat_usage`, Env-Variablen (`OPENAI_MODEL`) | Kein Token-/Kosten-Tracking pro Anfrage, keine Antwortzeit-Messung, kein Prompt-Versionierungssystem |
| Business Center | `GET /business/overview` | `view_business` | `vt_users`, `core/plans.py` (Stripe-Preiskonfiguration) | PRO/FAMILY sind in der DB nicht von PREMIUM unterscheidbar (ein Boolean); kein Umsatz-Reporting, kein Affiliate-System, keine Gutschein-Verwaltung |
| Nutrition & CGM | `GET /nutrition/overview` | `view_nutrition_admin` | — (kein Datenmodell vorhanden) | Bewusster ehrlicher Stub: `"available": false` mit Begründung, statt erfundener Kennzahlen |
| Eigene Identität | `GET /me` | (jede Admin-Rolle) | `vt_admin_roles` | Lässt das Frontend die eigene Rolle/Berechtigungen einmalig abfragen, um die Navigation RBAC-bewusst zu rendern |

## 5. Sicherheitsmodell

- **RBAC-Durchsetzung:** Jeder Endpunkt ruft
  `require_admin_permission(authorization, permission)` als ersten Schritt.
  Diese Funktion:
  1. Ruft `core/auth.py::require_email` auf → `401`, falls nicht
     authentifiziert.
  2. Lädt die Admin-Rolle über `get_admin_role(email)` → `403`, falls kein
     Admin.
  3. Prüft `role_has_permission(role, permission)` → `403`, falls die Rolle
     die konkrete Berechtigung nicht hat.
- **HTTP-Semantik `403` statt `404`:** Bewusst anders als die
  Ownership-Checks im übrigen Backend (`core/auth.py::assert_owns` gibt bei
  fremden Ressourcen `404` zurück, um deren Existenz zu verschleiern). Bei
  Admin-Berechtigungsprüfungen ist das nicht nötig — der Aufrufer weiß
  bereits, dass er eine Admin-API aufruft. Standard-REST-Semantik gilt:
  `401` = wer bist du, `403` = ich weiß wer du bist, du darfst das nicht.
- **Keine Passwort-Exposition:** Jede User-Management-Query (Liste,
  Detail) selektiert explizit nur benötigte Spalten und lässt `password`
  konsequent aus.
- **Sicherstellung der Sperr-Wirkung:** `POST /users/{email}/suspend`
  setzt `suspended=true` in `vt_users`; `routers/users.py::login()` prüft
  dieses Flag bei jedem Login-Versuch und gibt `403` zurück, wenn gesetzt —
  eine Sperrung ist damit tatsächlich wirksam, nicht nur kosmetisch.
- **Audit-Trail:** Jede verändernde Admin-Aktion (Sperren/Entsperren,
  Rollenvergabe, Premium-Änderung, Content CRUD) ruft
  `core/audit.py::record_audit_event` auf — best-effort, nie
  request-blockierend, wie an anderer Stelle im Backend etabliert.
- **Login-Historie:** `vt_login_events` erfasst jeden Login-Versuch
  (erfolgreich oder nicht) inklusive IP-Adresse und User-Agent, getrennt
  vom generischen `vt_audit_events` wegen höherer Frequenz und eigener
  Aufbewahrungs-Policy.

## 6. Erweiterungspfad

- **Neue Berechtigung zu einer bestehenden Rolle hinzufügen:** Nur
  `ROLE_PERMISSIONS` in `core/admin_rbac.py` ändern — keine Migration
  nötig.
- **Neue Rolle hinzufügen:** `AdminRole`-Literal und `ROLE_PERMISSIONS`
  in `core/admin_rbac.py` erweitern. `vt_admin_roles.role` ist ein freier
  Text ohne DB-Constraint — die Gültigkeitsprüfung erfolgt ausschließlich
  im Code (`RoleInput`-Validator in `routers/admin.py`).
- **Neue Berechtigung hinzufügen:** `Permission`-Literal erweitern, in
  mindestens einer Rolle in `ROLE_PERMISSIONS` eintragen, im
  entsprechenden Endpunkt per `require_admin_permission(...)` prüfen.
- **Neuer Admin-Bereich:** Neuen Abschnitt in `routers/admin.py` mit
  eigener Berechtigung ergänzen, plus zugehörige Frontend-Seite unter
  `frontend/app/admin/<bereich>/page.tsx` und einen Eintrag in
  `NAV_SECTIONS` (`frontend/app/admin/layout.tsx`) — die Navigation
  blendet Abschnitte automatisch aus, wenn die aktuelle Rolle die
  zugehörige Berechtigung nicht hat.

## 7. Frontend

- **Layout & RBAC-Navigation:** `frontend/app/admin/layout.tsx` ruft
  `GET /api/admin/me` beim Laden auf, um Rolle + Berechtigungsliste zu
  ermitteln, und blendet Navigationseinträge aus, für die keine
  Berechtigung vorliegt. `401` → Weiterleitung zum Login, `403` →
  "Kein Admin-Zugriff"-Ansicht.
- **Light+Dark-Toggle (nur Admin-Bereich):** Der Rest der App bleibt
  bewusst dunkel-only (Produktentscheidung). Der Admin-Bereich hat einen
  eigenen Theme-State (`frontend/app/admin/_lib/adminTheme.ts`), persistiert
  unter dem separaten `admin-theme`-localStorage-Schlüssel — beeinflusst
  nichts außerhalb von `/admin/*`.
- **Gemeinsame Bausteine:** `frontend/app/admin/_lib/AdminUI.tsx`
  (Card/Kpi/Note/Badge/Button) und `AdminContext.tsx`
  (`authFetch`/`hasPermission`) — jede Seite rendert nur, was das Backend
  liefert, keine client-seitige Business-Logik-Duplizierung.
