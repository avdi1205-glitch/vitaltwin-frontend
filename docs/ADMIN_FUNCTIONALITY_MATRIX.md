# ADMIN_FUNCTIONALITY_MATRIX.md

## Wichtiger Geltungsbereich-Hinweis (bitte zuerst lesen)

**Dieses Dokument beruht auf einem vollständigen Code-Audit (jede Datei unter `frontend/app/admin/**` gelesen,
jeder gefundene Button/Aktion bis zum jeweiligen Backend-Endpunkt zurückverfolgt), NICHT auf echten
Browser-Klicks.** Ich habe keinen Admin-Zugang zu `https://www.vitaltwin.de/admin` und konnte daher keinen
einzigen Button tatsächlich im Browser anklicken. Wo unten **„WORKING"** steht, bedeutet das ausschließlich:
*Button hat einen echten `onClick`-Handler → ruft einen echten `fetch()` mit einer echten URL auf → dieser
Backend-Endpunkt existiert nachweislich im Code und ist mit einer echten Permission gesichert.* Es bedeutet
**NICHT**, dass ich bestätigt habe, dass ein Klick tatsächlich das erwartete Ergebnis liefert. Für einen
echten Live-Test bräuchte ich entweder deine Admin-Zugangsdaten (nicht empfohlen) oder eine geteilte,
bereits eingeloggte Browser-Session (siehe Abschlussbemerkung).

## Legende

- **WORKING** = Code-verifiziert vollständig verdrahtet (Button → echter API-Call → echter, existierender
  Endpunkt → echte DB-Tabelle), aber NICHT live getestet
- **PARTIAL** = teilweise verdrahtet oder mit bekannten Einschränkungen
- **UI_ONLY** = sichtbares Element ohne echten Effekt
- **BROKEN** = Handler existiert, ruft aber einen nicht existierenden/falschen Endpunkt auf
- **MISSING_BACKEND** = Frontend erwartet eine Aktion, es gibt aber keinen passenden Endpunkt
- **MISSING_PERMISSION** = Aktion vorhanden, aber RBAC-Lücke gefunden
- **MISSING_EXTERNAL_CONFIG** = Code korrekt, aber abhängig von einer noch fehlenden externen Zugangsdaten
- **NOT_IMPLEMENTED** = bewusst nicht gebaut, im UI auch nicht vorgetäuscht

---

## 1. Dashboard (`/admin`)

| Funktion | Status | Backend | Testresultat |
|---|---|---|---|
| KPI-Kacheln (Nutzer, Umsatz, Fehler, Beta-Bewerbungen etc.) | WORKING | `GET /api/admin/dashboard` (existiert, parallelisiert) | Nur statisch geprüft |

Keine interaktiven Aktionen auf dieser Seite außer reiner Navigation.

## 2. Nutzerverwaltung (`/admin/users`)

| Funktion | Status vorher | Status jetzt | Backend | Testresultat |
|---|---|---|---|---|
| Details öffnen | WORKING | WORKING | `GET /users/{email}` | Nur statisch geprüft |
| Suche | WORKING | WORKING | `GET /users?search=` | Nur statisch geprüft |
| Sperren / Entsperren | WORKING | WORKING | `POST /users/{email}/suspend`\|`/unsuspend` | Nur statisch geprüft |
| Premium gewähren/entziehen | WORKING | WORKING | `POST /users/{email}/premium` | Nur statisch geprüft |
| Rolle setzen/entfernen | WORKING | WORKING | `POST`/`DELETE /users/{email}/role` | Nur statisch geprüft |
| Letzte Logins anzeigen | WORKING | WORKING | im `GET /users/{email}` enthalten | Nur statisch geprüft |
| **Direktes Löschen eines Nutzers** | **❌ MISSING_BACKEND/UI_ONLY** (kein Button vorhanden, nur die GDPR-Löschanfragen-Liste) | **✅ NEU GEBAUT** — "Gefahrenzone"-Button "Nutzer endgültig löschen" in der Detailansicht | NEU: `DELETE /api/admin/users/{email}` (blockt super_admin mit 403) | Nur statisch/testweise (11 Backend-Tests) geprüft, NICHT live geklickt |
| Löschanfragen (GDPR, self-service) | WORKING | WORKING (unverändert) | `GET .../deletion-requests`, `POST .../complete` | Nur statisch geprüft |
| Plan-Tarif (Free/Premium/Pro/Family) anzeigen | ⚠️ **nur binäres Premium-Flag, kein granularer Plan-Name** | unverändert | `vt_users` hat kein `plan`-Feld, nur `premium: bool` | Ehrlich dokumentiert, keine Fake-Anzeige gebaut |

**Diese Runde behoben**: Der vom Founder gemeldete Bug ("nur Sperren funktionierte, kein Löschen") ist real
bestätigt und jetzt behoben — Backend-Endpunkt + Frontend-Button mit doppelter Sicherheitsabfrage
(Bestätigungsdialog + Eingabe der exakten E-Mail-Adresse), super_admin-Konten sind strukturell geschützt.

## 3. Content Management (`/admin/content`, `/admin/content/[id]`, `/admin/content/[id]/preview`)

| Funktion | Status vorher (Founder-Meldung) | Status jetzt | Backend |
|---|---|---|---|
| Artikel öffnen/anklicken | ❌ UI_ONLY (nur Löschen sichtbar) | ✅ WORKING — Titel ist Link zum Editor | `GET /content/{id}` |
| Bearbeiten | ❌ MISSING_BACKEND | ✅ WORKING — vollständiges Formular | `PATCH /content/{id}` |
| Speichern | ❌ fehlte | ✅ WORKING | `PATCH /content/{id}` |
| Vorschau | ❌ fehlte | ✅ WORKING — eigene Vorschauseite | admin-only `GET /content/{id}` |
| Veröffentlichen | ❌ fehlte | ✅ WORKING — mit Server-Validierung (Titel/Slug/Inhalt + Slug-Eindeutigkeit) | `POST /content/{id}/publish` |
| Zurück zu Entwurf | ❌ fehlte | ✅ WORKING | `POST /content/{id}/unpublish` |
| Archivieren | ❌ fehlte | ✅ WORKING (über Speichern mit status=archived) | `PATCH /content/{id}` |
| Löschen | ✅ war bereits da | ✅ WORKING, jetzt mit Bestätigungsdialog | `DELETE /content/{id}` |
| Status-Filter | fehlte | ✅ WORKING | `GET /content?status=` |

**WICHTIGE OFFENE ABHÄNGIGKEIT**: Migration `026_content_items_metadata.sql` muss in Supabase ausgeführt sein,
sonst schlägt Speichern der neuen Felder (Excerpt/Kategorie/Tags/Meta) wahrscheinlich fehl.

## 4. Nutrition & CGM (`/admin/nutrition`)

| Funktion | Status | Backend |
|---|---|---|
| Übersicht (rein lesend) | WORKING | `GET /nutrition/overview` |

Keine Schreibaktionen auf dieser Seite (ehrlich als Status-Übersicht ohne Datenpipeline dokumentiert).

## 5. KI Control Center (`/admin/ai`)

| Funktion | Status | Backend |
|---|---|---|
| Nutzung/Kosten anzeigen | WORKING | `GET /ai/usage` |

Rein lesend, keine Aktionen.

## 6. Business Center (`/admin/business`)

| Funktion | Status | Backend |
|---|---|---|
| Umsatz/Abo-Übersicht | WORKING | `GET /business/overview` |

Rein lesend.

## 7. Analytics (`/admin/analytics`)

| Funktion | Status | Backend |
|---|---|---|
| Wachstumskennzahlen | WORKING | `GET /analytics/growth` |

Rein lesend.

## 8. Security Center (`/admin/security`)

| Funktion | Status | Backend |
|---|---|---|
| Audit-Log | WORKING | `GET /security/audit-logs` |
| Login-Historie | WORKING | `GET /security/login-history` |
| Berechtigungsmatrix | WORKING | `GET /security/permissions` |

Rein lesend.

## 9. System Center (`/admin/system`)

| Funktion | Status | Backend | Anmerkung |
|---|---|---|---|
| Release erfassen (Formular) | WORKING | `POST /system/releases` | Protokolliert, führt kein echtes Deployment aus |
| Backup-Status erfassen (Formular) | WORKING | `POST /system/backups` | Protokolliert einen gemeldeten Status |
| Release-Webhook (CI/CD) | WORKING, aber nicht getriggert | `POST /system/releases/webhook` | 503 bis `RELEASE_WEBHOOK_SECRET` gesetzt |
| Backup-Webhook | WORKING, aber nicht getriggert | `POST /system/backups/webhook` | 503 bis `BACKUP_WEBHOOK_SECRET` gesetzt |
| **"Backup jetzt starten" / "Cache leeren" / "Restart"** | **NOT_IMPLEMENTED** | keiner | Es gibt absichtlich KEINEN Button, der echte Infrastruktur-Aktionen auslöst — korrekt so, da es dafür keine echte Infrastruktur-Anbindung gibt. Kein Fake-Button vorhanden. |

## 10. Support Center (`/admin/support`)

| Funktion | Status | Backend |
|---|---|---|
| Kontaktanfragen (Status ändern) | WORKING | `PATCH /support/contacts/{id}/status` |
| Beta-Bewerbungen anzeigen | WORKING (read-only, absichtlich kein Freigabe-Workflow — kein Statusfeld existiert dafür) | `GET /support/beta-applications` |
| Feedback anzeigen | WORKING | `GET /support/feedback` |

## 11. Integrationen (`/admin/integrations`)

| Funktion | Status | Backend | Anmerkung |
|---|---|---|---|
| Feature-Flag umschalten | WORKING | `PUT /feature-flags/{key}` | |
| Integrationsstatus anzeigen | WORKING (rein lesend, aus Umgebungsvariablen) | `GET /integrations` | |
| **"Verbinden"/"Trennen"/"Synchronisieren"** | **NOT_IMPLEMENTED** | keiner | Absichtlich keine echten OAuth-Connect-Buttons vorhanden — ehrliche reine Status-Anzeige statt vorgetäuschter Konnektivität |

## 12. Affiliate Center (`/admin/affiliate`)

| Funktion | Status | Backend |
|---|---|---|
| Partner/Produkte/Kategorien/Kampagnen CRUD | WORKING | jeweils eigene REST-Endpunkte in `affiliate_admin.py`, alle verifiziert vorhanden |
| Link prüfen | WORKING | `POST /affiliate/products/{id}/check-link` |
| Import (CSV/JSON/XLSX) | WORKING | `POST /affiliate/import` |
| Export (CSV/JSON/Excel) | WORKING | `GET /affiliate/export` |
| A/B-Tests | WORKING | eigene Endpunkte, in dieser Session performance-optimiert (N+1 behoben) |

## 13. Founder OS (`/admin/founder`, 10 Tabs)

Alle 10 Tabs (Dashboard, Daily Briefing, Tasks, Approval Center, AI Business Coach, Affiliate Intelligence,
Automation Engine, CEO Intelligence, Auto Documentation, Founder Autopilot) laden nachweislich von echten,
existierenden Backend-Endpunkten (jeweils in `founder*.py`-Routern) — kein Tab zeigt statische
Platzhalterdaten. Alle geprüften Buttons (Freigeben/Ablehnen, Regel aktivieren/pausieren/ausführen, Kill
Switch, Modus wechseln, Task-Status ändern, Duplikat auflösen, Chancen archivieren usw.) rufen echte,
existierende Endpunkte auf. Automatisierungs-/Autopilot-Aktionen sind mit `manage_founder_os` bzw.
`view_founder_autopilot` gesichert. **Detailstatus: WORKING (code-verifiziert), kein Live-Test.**

---

## Zusammenfassung nach Status

| Status | Anzahl (grob, nach Funktionsgruppen, nicht Einzel-Buttons) |
|---|---|
| WORKING (code-verifiziert) | ~55 Funktionsgruppen über alle Seiten |
| MISSING_BACKEND → jetzt behoben | 2 (Content-Editor, Direktes Nutzer-Löschen) |
| NOT_IMPLEMENTED (bewusst, ehrlich gekennzeichnet) | 3 (Backup/Cache/Restart-Buttons, OAuth-Connect-Buttons, granularer Plan-Name) |
| BROKEN | 0 gefunden |
| UI_ONLY (verbleibend) | 0 gefunden (die 2 bekannten Fälle wurden behoben) |
