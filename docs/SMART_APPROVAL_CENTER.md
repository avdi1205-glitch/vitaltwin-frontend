# VitalTwin — Smart Approval Center (SMART_APPROVAL_CENTER.md)

> Founder Operating System, Submodul D. Ergänzt
> [Founder Dashboard](../app/admin/founder/page.tsx) (F1),
> [Daily Briefing](./FOUNDER_DAILY_BRIEFING.md) (F2) und
> [AI Founder Task Manager](./AI_FOUNDER_TASK_MANAGER.md) (F3) um eine
> formale Freigabe-Warteschlange mit Massenaktionen, Filtern und Suche.

> **Hinweis zur Recherche:** `docs/MODULE_MAP.md` wurde wie im Auftrag
> gefordert gesucht, existiert aber nicht in diesem Repository. Diese
> Dokumentation und die Umsetzung basieren stattdessen auf
> `VITALTWIN_CONSTITUTION.md` und den bereits etablierten Mustern aus
> F1–F3 sowie dem Affiliate Center.

## 1. Modul-Abgrenzung

Dieses Modul gehört **ausschließlich** zum Founder Operating System:

- Kein Bestandteil des Digital Twin.
- Verarbeitet keine Gesundheits-, CGM-, Nutrition-, Schlaf- oder
  Twin-Memory-Daten — nur Business-/Technik-Metadaten (Affiliate-Produkte/
  -Partner, Support-Feedback-Metadaten wie Score/Zeitstempel, nie den
  Volltext einer Gesundheitseintragung).
- Digital Twin, Nutrition Twin, CGM Twin, Sleep Twin, Movement Twin und
  Health-Module wurden nicht angefasst.

## 2. Verhältnis zum AI Founder Task Manager (F3)

Beide Module können auf dieselben zugrunde liegenden Daten reagieren (z. B.
defekte Links), haben aber unterschiedliche Zwecke:

| | Task Manager (F3) | Approval Center (Submodul D) |
|---|---|---|
| Granularität | Eine **aggregierte** Aufgabe pro Regel (z. B. "3 Links defekt") | **Ein Vorschlag pro betroffenem Datensatz** (3 einzelne Vorschläge) |
| Zweck | Ambiente Awareness — "hier gibt es was zu tun" | Formale Ja/Nein-Entscheidung pro Einzelfall, inkl. Massenfreigabe |
| Reale Auswirkung | Nur "Link erneut prüfen" hat einen echten Effekt | Freigabe/Ablehnung von Affiliate-Produkten und Partnerprogrammen wirkt direkt auf `vt_affiliate_products`/`vt_affiliate_partners` |

Beide Module bleiben nebeneinander bestehen (keine Migration/Löschung von
F3) — das Approval Center ist die Stelle für **Einzelentscheidungen**,
der Task Manager bleibt die Stelle für **Überblick**.

## 3. Kein LLM-Aufruf

Wie in jedem bisherigen Founder-Modul: "KI geprüft" bedeutet ein
deterministisches Regelwerk (`backend/app/core/founder_approval_detector.py`),
niemals eine Sprachmodell-Generierung. Jeder Vorschlag trägt die fünf
geforderten Erklärungsfelder als Klartext, direkt aus den echten Zahlen
abgeleitet:

- `reason` — Warum wurde dieser Vorschlag erstellt?
- `data_used` — Welche Daten wurden benutzt?
- `rules_applied` — Welche Regel wurde angewendet?
- `benefits` — Welche Vorteile entstehen?
- `risks` — Welche Risiken bestehen?

## 4. Welche der 13 angefragten Prüfbereiche sind real umgesetzt?

Nur 5 von 13 haben eine echte Erkennungsregel — für den Rest existiert
keine Datenquelle in diesem Codebase (kein CMS-Redaktionsplan, kein
SEO-Crawler, kein Release-Tracker, keine Doku-Aktualitätsprüfung, kein
API-Änderungsmonitoring, kein Roadmap-Modell, kein System-Warnsystem):

| Bereich | Regel | Reale Auswirkung bei Freigabe |
|---|---|---|
| Affiliate Produkte | `vt_affiliate_products.status = 'in_review'` (ein Vorschlag pro Produkt) | Setzt `status = 'approved'` (Freigabe) bzw. `'archived'` (Ablehnung) |
| Defekte Links | `vt_affiliate_products.link_status = 'broken'` | Nur Tracking — echte Behebung über "Link erneut prüfen" im Affiliate Center/Task Manager |
| Abgelaufene Angebote | `end_date < heute` UND `status` noch `approved`/`active` | Nur Tracking (der Empfehlungsfilter respektiert `end_date` bereits unabhängig davon) |
| Neue Partnerprogramme | `vt_affiliate_partners.status = 'inactive'` | Setzt `status = 'active'` (Freigabe) bzw. bleibt `'inactive'` (Ablehnung) |
| Support-Priorisierung | Neues Feedback seit gestern, `score <= 2` → Priorität "hoch" | Nur Tracking — keine automatische Antwort |

**Bewusst nicht umgesetzt** (keine Datenquelle vorhanden): Neue
Blogartikel, SEO-Vorschläge, Neue Releases, Dokumentationsänderungen,
API-Änderungen, Neue Integrationen, Feature Flags, Systemwarnungen, Neue
Roadmap-Einträge.

## 5. Freigabestatus

Neu → KI geprüft → Zur Prüfung → Freigegeben/Abgelehnt → Archiviert.

Automatisch erzeugte Vorschläge starten direkt bei **"KI geprüft"** (nicht
"Neu") — da die Regel-Prüfung zum Zeitpunkt der Erzeugung bereits
vollständig gelaufen ist, gibt es keinen sinnvollen unbearbeiteten
Zwischenzustand. "Neu" bleibt im Vokabular für eine mögliche künftige
manuelle Erfassung reserviert.

## 6. Was "Freigeben"/"Ablehnen" wirklich tut

Nur zwei Vorschlagstypen haben eine reale Auswirkung außerhalb der
eigenen Tabelle — bewusst begrenzt, damit nie mehr passiert, als die
Spezifikation erlaubt:

- **Affiliate-Produkt-Freigabe**: `Freigeben` → Produktstatus `approved`;
  `Ablehnen` → Produktstatus `archived`.
- **Partnerprogramm-Freigabe**: `Freigeben` → Partnerstatus `active`;
  `Ablehnen` → Partnerstatus bleibt `inactive`.

Alle anderen Vorschlagstypen (defekte Links, abgelaufene Angebote,
Support) sind reine Tracking-Einträge — "Freigeben"/"Ablehnen" ändert nur
den Status des Vorschlags selbst, niemals eine reale Entität. Das
entspricht exakt der Vorgabe:

> "Die KI darf NICHT automatisch: Produkte veröffentlichen, Preise
> ändern, Premium ändern, Partner aktivieren, Releases veröffentlichen,
> Datenschutz ändern, rechtliche Texte ändern."

— die *Erkennung* passiert automatisch, die *Aktivierung* (Produkt/Partner)
passiert ausschließlich durch den expliziten Klick des Gründers auf
"Freigeben", nie von selbst.

## 7. Massenfreigabe, Filter, Suche

- **Massenfreigabe**: Checkbox pro offenem Vorschlag, `Auswahl freigeben`/
  `Auswahl ablehnen` ruft `POST /api/admin/founder/approvals/bulk` mit der
  ausgewählten ID-Liste auf — wendet dieselbe Logik (inkl. Entity-
  Seiteneffekt) wie eine Einzelentscheidung an, nur für mehrere Zeilen.
- **Smart Filter**: Kategorie (Affiliate, Business, KI, Blog, SEO,
  Technik, Support, Releases, API, Sicherheit — als vollständiges
  Vokabular vorbereitet, aktuell befüllen die Regeln nur `affiliate`,
  `business` und `support`), Status, Priorität.
- **Suche**: Volltextsuche (Substring, Kleinschreibung) über Titel,
  Kategorie, Priorität, Status und Erstellungsdatum.
- **Quick Actions**: "Nur kritische anzeigen", "Nur neue anzeigen", "Nur
  Affiliate anzeigen" — reine Filter-Umschalter im Frontend, kein
  zusätzlicher Backend-Aufruf.

## 8. API

Mounted unter `/api/admin/founder` (gleicher Präfix wie F1–F3, eigene
Router-Datei `routers/founder_approval.py`). Berechtigungen: bewusst die
bereits bestehenden `view_founder_os`/`manage_founder_os` — **keine**
neuen, fragmentierten Berechtigungen (siehe die Konsolidierung direkt
nach Release F3).

| Methode | Pfad | Berechtigung | Zweck |
|---|---|---|---|
| GET | `/approvals?category=&status=&priority=&search=` | `view_founder_os` | Erkennung ausführen + gefilterte/gesuchte Liste + Zusammenfassung |
| PATCH | `/approvals/{id}/status` | `manage_founder_os` | Freigeben/Ablehnen/Zur Prüfung/Archivieren (inkl. Entity-Seiteneffekt) |
| PATCH | `/approvals/{id}/comment` | `manage_founder_os` | Kommentar schreiben |
| PATCH | `/approvals/{id}/priority` | `manage_founder_os` | Priorität ändern |
| POST | `/approvals/bulk` | `manage_founder_os` | Massenfreigabe/-ablehnung |

## 9. Route

`/admin/founder` — vierter Tab **"Approval Center"**, konsolidiert in
dieselbe Seite wie Dashboard/Daily Briefing/Tasks (statt einer separaten
Route `/admin/founder/approval`, wie ursprünglich in der Spezifikation
genannt) — bewusste Abweichung, um die im Anschluss an Release F3 explizit
gewünschte Konsolidierung (eine Founder-OS-Seite mit Tabs statt vieler
Einzelrouten) nicht wieder rückgängig zu machen.
