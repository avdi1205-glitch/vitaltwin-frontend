# VitalTwin — AI Founder Task Manager (AI_FOUNDER_TASK_MANAGER.md)

> Drittes Modul des Founder Operating Systems (Release F3). Ergänzt
> [Founder Dashboard](../app/admin/founder/page.tsx) (F1) und
> [Founder Daily Briefing](./FOUNDER_DAILY_BRIEFING.md) (F2) um eine
> automatische, regelbasierte Aufgabenerkennung unter
> `/admin/founder/tasks`.

## 1. Kein LLM-Aufruf — auch hier nicht

Wie schon bei `core/affiliate_engine.py` und dem Daily Briefing gilt: Die
"KI" in "AI Founder Task Manager" ist ein **deterministisches Regelwerk**
(`backend/app/core/founder_task_detector.py`), kein Sprachmodell-Aufruf.
Jede erzeugte Aufgabe trägt `reason`, `data_used` und `impact_if_ignored`
als Klartext-Felder, die direkt aus den echten Zahlen zusammengesetzt
werden — nachvollziehbar, auditierbar, reproduzierbar.

## 2. Welche der 16 Aufgabenbereiche haben echte Erkennung?

Die Spezifikation nennt 16 Bereiche (Affiliate, Premium, Stripe, Blog, KI,
Server, API, Support, SEO, Dokumentation, Tests, Releases, Backups,
Performance, Sicherheit, Analytics). Alle 16 sind als `Source`-Wert im
Datenmodell vorhanden (Erweiterbarkeit ohne Migration), aber **nur 5 haben
aktuell eine echte Erkennungsregel**, weil nur für diese eine reale
Datenquelle in diesem Codebase existiert:

| Bereich | Regel | Datenquelle |
|---|---|---|
| Affiliate | Defekte Links | `vt_affiliate_products.link_status = 'broken'` |
| Affiliate | Neue Produkte heute | `vt_affiliate_products.created_at >= heute` |
| Affiliate | Produkte zur Freigabe | `vt_affiliate_products.status = 'in_review'` |
| Premium | Stripe nicht konfiguriert | `core/integrations.py::get_payment_providers()` |
| KI | OpenAI nicht konfiguriert | `core/integrations.py::get_ai_providers()` |
| Support | Neues Feedback seit gestern | `vt_user_feedback.created_at >= gestern` |
| Sicherheit | Ungewöhnlich viele fehlgeschlagene Logins (> 5 / 24h) | `vt_login_events` (`success=false`) |

**Bewusst ohne Erkennungsregel** (keine fingierten Aufgaben, da keine
reale Datenquelle vorhanden): Blog, Server, API, SEO, Dokumentation,
Tests, Releases, Backups, Performance, Analytics. Beispiele aus der
Spezifikation, die deshalb **nicht** umgesetzt wurden: "Build
fehlgeschlagen" (kein CI/CD-Status), "Neue API verfügbar" (kein
API-Monitoring), "OpenAI Kosten gestiegen" (kein Kosten-Tracking, siehe
bereits [FOUNDER_DAILY_BRIEFING.md](./FOUNDER_DAILY_BRIEFING.md)).

## 3. Datenmodell (Migration 013)

`backend/migrations/013_founder_task_manager.sql` — Tabelle
`vt_founder_tasks`. Zentrales Feld: **`dedupe_key`** (unique) — verhindert
doppelte/Spam-Aufgaben. Eine Erkennungsregel erzeugt oder aktualisiert
maximal eine Zeile pro Schlüssel:

- Bedingung neu wahr, kein offener Task vorhanden → neuer Task (`status=neu`).
- Bedingung weiterhin wahr, offener Task vorhanden → Zahlen werden aktualisiert (kein Duplikat).
- Bedingung wird falsch, offener, automatisch erkannter Task vorhanden → Task wird **automatisch** auf `erledigt` gesetzt, `auto_resolved=true` (das speist "Automatisch gelöst" in der CEO-Ansicht).
- Task bereits vom Gründer geschlossen/archiviert/ignoriert → wird nie automatisch wieder geöffnet.

Ausnahme: "Neue Produkte heute" nutzt einen tagesbezogenen `dedupe_key`
(`affiliate_new_products_<Datum>`), damit an jedem Tag erneut eine Aufgabe
entstehen kann, statt für immer offen zu bleiben.

## 4. Wann läuft die Erkennung?

**Bei jedem Aufruf von `GET /api/admin/founder/tasks`** — synchron,
innerhalb der Anfrage. Es gibt keinen Cron-Job, keine Warteschlange,
keinen Hintergrundprozess. "Automatisch" bedeutet hier dasselbe wie in F1/F2:
der Gründer muss nichts manuell zusammenstellen, aber es läuft nichts,
während niemand die Seite geöffnet hat.

## 5. Status, Priorität, Kategorien

- **Status**: Neu, In Bearbeitung, Warten, Erledigt, Archiviert.
- **Priorität**: Kritisch, Hoch, Mittel, Niedrig — regelbasiert vergeben
  (z. B. ≥ 3 defekte Links → Kritisch, sonst Hoch; Stripe/OpenAI nicht
  konfiguriert → immer Kritisch).
- **Kategorien** (20, wie spezifiziert): business, affiliate, premium,
  marketing, seo, blog, technik, backend, frontend, mobile, android, ios,
  ki, twin, cgm, nutrition, health, support, legal, datenschutz — als
  Typ vorhanden für zukünftige Regeln, aktuell befüllen die 5
  implementierten Regeln nur `affiliate`, `premium`, `ki`, `support` und
  `datenschutz`.

## 6. Automatisierung mit Freigabe

Von den in der Spezifikation genannten Beispiel-Automationen ("Link
erneut prüfen", "Cache leeren", "SEO-Bericht erzeugen", "Dokumentation
aktualisieren", "Build erneut starten") ist **nur eine** echt
implementiert: **"Link erneut prüfen"** — weil nur dafür bereits
funktionierender Code existiert (`core/affiliate_link_checker.py`, schon
aus dem Affiliate-Modul). Alle anderen genannten Automationen hätten hier
vorgetäuschte "Erfolg"-Meldungen ohne echte Wirkung erzeugt — das würde
gegen "keine Fake-Daten" verstoßen.

`POST /api/admin/founder/tasks/{id}/apply-suggestion`:

1. Prüft, ob die Aufgabe `dedupe_key == "affiliate_broken_links"` und
   `suggested_action_available == true` ist — sonst `400`, keine
   vorgetäuschte Ausführung.
2. Prüft **jeden** aktuell als defekt markierten Affiliate-Link erneut per
   echtem HTTP-Request.
3. Aktualisiert `link_status` je Produkt und lässt die Erkennung erneut
   laufen — ist danach kein Link mehr defekt, löst sich die Aufgabe
   automatisch auf.

Der Klick des Gründers auf den Button **ist** die geforderte Freigabe —
es gibt keine weitere, versteckte Automatik.

## 7. Quick Actions pro Aufgabe

| Aktion | Endpunkt |
|---|---|
| Details | (kein Aufruf — zeigt `reason`/`data_used`/`impact_if_ignored` aus der bereits geladenen Aufgabe) |
| Öffnen | Link zum passenden Admin-Bereich (nach `source`, z. B. Affiliate → `/admin/affiliate`) |
| Als erledigt markieren | `PATCH /tasks/{id}/status` (`{"status": "erledigt"}`) |
| Später erinnern | `POST /tasks/{id}/remind` (setzt `status=warten`, `remind_at = jetzt + 24h`) |
| Ignorieren | `POST /tasks/{id}/ignore` (setzt `status=archiviert`, `ignored=true`) |

## 8. CEO-Ansicht

Oben auf der Seite, aus echten Zahlen berechnet: Offene Aufgaben
(`status` in neu/in_bearbeitung/warten), Kritische Aufgaben (offen +
`priority=kritisch`), Heute erledigt (`status=erledigt` und
`resolved_at` heute), Automatisch erkannt (`auto_detected=true`, nicht
archiviert), Automatisch gelöst (`auto_resolved=true`, gesamt).

## 9. Nicht gebaut (per Auftrag)

Keine automatische Veröffentlichung, keine Preisänderungen, keine
automatische Freigabe neuer Produkte, keine rechtlichen Entscheidungen —
all das bleibt ausschließlich manuellen Admin-Aktionen in den jeweiligen
bestehenden Bereichen (Affiliate Center, Business Center, Impressum/AGB)
vorbehalten.

## 10. API-Referenz

| Methode | Pfad | Berechtigung | Zweck |
|---|---|---|---|
| GET | `/api/admin/founder/tasks` | `view_founder_tasks` | Erkennung ausführen + Liste + CEO-Zusammenfassung |
| PATCH | `/api/admin/founder/tasks/{id}/status` | `manage_founder_tasks` | Status ändern |
| POST | `/api/admin/founder/tasks/{id}/remind` | `manage_founder_tasks` | Später erinnern |
| POST | `/api/admin/founder/tasks/{id}/ignore` | `manage_founder_tasks` | Ignorieren/archivieren |
| POST | `/api/admin/founder/tasks/{id}/apply-suggestion` | `manage_founder_tasks` | Einzige echte Automatisierung: Links erneut prüfen |
