# VitalTwin — Founder Daily Briefing (FOUNDER_DAILY_BRIEFING.md)

> Zweites Modul des Founder Operating Systems (Release F2). Ergänzt das
> [Founder Dashboard](../app/admin/founder/page.tsx) (Release F1) um eine
> automatisch bei jedem Aufruf generierte Tageszusammenfassung unter
> `/admin/founder/daily-briefing`.

## 1. Was "automatisch erstellt" hier bedeutet

Es gibt **keinen** Cron-Job, keine E-Mail, keine Push-Nachricht und keinen
gespeicherten Briefing-Datensatz. "Automatisch" bedeutet: Der Gründer öffnet
die Seite, und `GET /api/admin/founder/daily-briefing`
(`backend/app/routers/founder_briefing.py`) berechnet in diesem Moment alle
Zahlen frisch aus den echten Tabellen — er muss nichts manuell
zusammenstellen oder ausfüllen. Das ist bewusst die einzige Bedeutung von
"automatisch" in diesem Modul (siehe "NICHT BAUEN" unten).

## 2. Kein LLM-Aufruf

Die Abschnitte "KI-Empfehlungen" und "CEO-Prioritäten" klingen nach
KI-Generierung, sind aber **deterministische Regelauswertungen** über
echte, gerade berechnete Zahlen — genau wie schon
`core/affiliate_engine.py` (siehe
[AFFILIATE_RULES.md](./AFFILIATE_RULES.md)). Beispiel: die Empfehlung
"Es wurden 5 neue Affiliate-Produkte gefunden." erscheint nur, wenn
`new_products_today == 5` tatsächlich aus `vt_affiliate_products` gezählt
wurde — kein Sprachmodell formuliert diesen Satz frei.

**Bewusst nicht umgesetzt:** Die Beispielformulierung "Die API-Antwortzeit
ist höher als gestern" aus der Spezifikation wird **nicht** erzeugt, weil
in diesem Codebase keinerlei Antwortzeit-Messung existiert. Das wäre eine
erfundene Zahl gewesen — laut Auftrag ausdrücklich verboten.

## 3. Datenquellen pro Abschnitt

| Abschnitt | Feld | Quelle | Status |
|---|---|---|---|
| Business | Umsatz heute/gestern/Monat | — | **Keine Daten vorhanden** (kein Stripe-Reporting implementiert) |
| Business | Premium-Verkäufe | — | **Keine Daten vorhanden** (Stripe-Webhook speichert kein Aktivierungsdatum, nur das premium-Flag) |
| Business | Affiliate-Einnahmen (heute) | `vt_affiliate_events` (`event_type='conversion'`, `created_at >= heute`) | echt |
| Nutzer | Neue Nutzer (heute) | `vt_users.created_at >= heute` | echt |
| Nutzer | Aktive Nutzer (heute) | `vt_daily_wellness_entries.entry_date = heute` (eindeutige E-Mails) | echt |
| Nutzer | Neue Premium-Nutzer | — | **Keine Daten vorhanden** (kein Zeitstempel für Premium-Aktivierung) |
| Nutzer | Kündigungen | — | **Keine Daten vorhanden** (Stripe-Webhook behandelt nur `checkout.session.completed`, kein `subscription.deleted`) |
| KI | Requests (heute) | `vt_chat_usage.count`, gefiltert auf heute | echt |
| KI | Kosten / Fehler / Langsame Antworten | — | **Keine Daten vorhanden** (kein Kosten-/Error-/Latenz-Tracking) |
| Affiliate | Neue Produkte (heute) | `vt_affiliate_products.created_at >= heute` | echt |
| Affiliate | Produkte zur Freigabe | `vt_affiliate_products.status = 'in_review'` | echt |
| Affiliate | Defekte Links | `vt_affiliate_products.link_status = 'broken'` | echt |
| Affiliate | Beste Produkte | Top 3 nach Umsatz aus `vt_affiliate_events` (`event_type='conversion'`) | echt |
| System | Datenbank | Live-Zählabfrage gegen `vt_users` | echt |
| System | API-Status | Antwortet der Endpunkt selbst, ist die API online | echt |
| System | Server-Status / Build-Status / Backups | — | **Keine Daten vorhanden** (keine entsprechende Integration vorhanden) |
| Aufgaben | Produkte prüfen | = Produkte zur Freigabe | echt |
| Aufgaben | Support prüfen | `vt_user_feedback.created_at >= heute` | echt |
| Aufgaben | Releases prüfen / Bugs prüfen / Dokumentation prüfen | — | **Keine Daten vorhanden** (kein Release-/Bug-/Doku-Tracking) |

## 4. Warnungen (kein Spam)

Es wird **nur** gewarnt, wenn ein echter Schwellenwert überschritten ist:

- Datenbank nicht erreichbar,
- mindestens 1 defekter Affiliate-Link,
- 5 oder mehr Produkte warten auf Freigabe (ungewöhnlich viele).

Ist nichts davon der Fall, zeigt die Seite ehrlich "Keine wichtigen
Warnungen." — nie eine erfundene Meldung, um die Sektion zu füllen.

## 5. CEO-Prioritäten

Feste, nachvollziehbare Regeln (keine KI-Gewichtung):

| Bedingung | Priorität |
|---|---|
| Datenbank nicht erreichbar | Hoch |
| Defekte Links vorhanden | Hoch |
| Produkte zur Freigabe vorhanden | Mittel |
| Neue Support-Anfragen heute | Mittel |
| Neue Affiliate-Produkte heute | Niedrig |
| (nichts davon zutreffend) | "Keine dringenden Prioritäten" (Niedrig) |

## 6. Quick Actions

Reine Navigations-Links (kein Backend-Aufruf): Produkte prüfen → Affiliate
Center, Affiliate öffnen → Affiliate Center, Dashboard öffnen → Founder
Dashboard, Support öffnen → Support Center, Blog öffnen → Content
Management, Analytics öffnen → Analytics.

## 7. API

`GET /api/admin/founder/daily-briefing` — Berechtigung
`view_founder_briefing` (nur `super_admin`/`admin`, analog zu
`view_founder_dashboard`). Response-Schema: `business`, `users`, `ai`,
`affiliate`, `system`, `tasks`, `warnings`, `recommendations`,
`priorities`, `generated_at`.

## 8. Nicht gebaut (per Auftrag)

Keine E-Mails, keine Push-Benachrichtigungen, keine automatischen
Entscheidungen, keine Hintergrund-KI-Änderungen, kein gespeicherter
Briefing-Verlauf. Jeder Aufruf berechnet alles neu.
