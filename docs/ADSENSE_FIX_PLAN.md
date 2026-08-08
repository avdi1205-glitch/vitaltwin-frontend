# ADSENSE_FIX_PLAN.md

Konkreter Maßnahmenplan zur AdSense-Wiedervorlage, abgeleitet aus `ADSENSE_CONTENT_AUDIT.md`. Reihenfolge folgt
den Phasen aus der Aufgabenstellung.

## Phase 1 — Audit (abgeschlossen)

Siehe `ADSENSE_CONTENT_AUDIT.md`.

## Phase 2 — Dünne/unfertige Seiten bereinigen (abgeschlossen)

Es wurden keine öffentlichen Seiten mit "Coming Soon"-Charakter, leeren Tabellen oder Demo-Daten gefunden, die
entfernt oder auf `noindex` gesetzt werden mussten. Die einzige Korrektur war technischer Natur: `/login` und
`/register` (reine Weiterleitungen ohne eigenen Inhalt) sowie `/admin/*` waren nicht in `robots.txt`
ausgeschlossen — jetzt korrigiert.

## Phase 3 — Startseite, Über uns, FAQ, Kontakt stärken (abgeschlossen)

- `/ueber-uns` neu erstellt (Produktherkunft, Vision, Grenzen, keine erfundenen Fakten).
- `/faq` neu erstellt (28 Fragen in 6 Gruppen).
- Startseite: Footer- und FAQ-Verlinkung zu den neuen Seiten ergänzt.
- Kontakt: bereits vollständig, keine Änderung nötig.

## Phase 4 — Blog-Qualität (Infrastruktur abgeschlossen, Inhalt teilweise)

- Neue öffentliche, rein lesende Backend-Route `GET /api/content/blog(+/{slug})` — gibt ausschließlich
  `status='published'`-Einträge zurück, niemals Entwürfe.
- Neue Frontend-Seiten `/blog` (Liste) und `/blog/[slug]` (Einzelartikel), serverseitig gerendert.
- Bestehendes Admin-CMS (`/admin/content`) bleibt der einzige Weg, Inhalte zu erstellen/bearbeiten/
  freizugeben — kein neuer Publish-Mechanismus, keine Automatisierung, die an Google-Richtlinien vorbeigehen
  könnte.
- 3 Artikel als Entwurf vorbereitet (siehe Phase 5).

## Phase 5 — 10–15 hochwertige Inhalte aufbauen (TEILWEISE — bewusst nicht vollständig)

Von den 12 empfohlenen Artikeln wurden **3 vollständig als Entwurf geschrieben** (900–1300 Wörter, eigene
Struktur, Gesundheits-Disclaimer, keine erfundenen Studien/Zahlen):

1. ✅ Was ist ein digitaler Wellness-Zwilling? (Entwurf fertig)
2. Wie Schlaf, Bewegung und Ernährung zusammenhängen können — **noch nicht geschrieben**
3. Was Gesundheitsdaten wirklich aussagen – und was nicht — **noch nicht geschrieben**
4. Google Health erklärt: Welche Daten können verbunden werden? — **noch nicht geschrieben**
5. Fitbit und Pixel Watch mit Google Health verstehen — **noch nicht geschrieben**
6. ✅ Was ist CGM und wie liest man Glukoseverläufe? (Entwurf fertig)
7. Warum persönliche Trends oft wichtiger sind als Durchschnittswerte — **noch nicht geschrieben**
8. Wie man Wellness-Ziele sinnvoll setzt — **noch nicht geschrieben**
9. Wearables: Welche Daten sind wirklich nützlich? — **noch nicht geschrieben**
10. ✅ Datenschutz bei Wellness- und Gesundheits-Apps (Entwurf fertig)
11. So entsteht ein persönlicher Wellness-Bericht — **noch nicht geschrieben**
12. Was VitalTwin heute kann und was noch geplant ist — **inhaltlich bereits über `/ueber-uns` abgedeckt,
    optional zusätzlich als Blogartikel sinnvoll**

**Warum bewusst nicht alle 12 auf einmal**: Die Aufgabenstellung verbietet ausdrücklich automatisches
Massenpublishing und verlangt "Erst Entwürfe erstellen, Qualität prüfen, dann gezielt veröffentlichen." Die 3
Artikel liegen als `status='draft'` in der Datenbank (`backend/scripts/seed_blog_drafts.sql`, einmalig manuell
in Supabase auszuführen) und sind über `/admin/content` einsehbar, aber **nicht öffentlich sichtbar**, bis ein
Founder sie geprüft und auf "published" gestellt hat. Die restlichen 9 Themen sind als Backlog dokumentiert und
sollten in weiteren, überschaubaren Runden (nicht automatisiert) ergänzt werden.

## Phase 6 — Technisches SEO & Indexierung (abgeschlossen)

- `robots.ts`: `/login`, `/register`, `/admin`, `/admin/*`, `/api`, `/api/*` neu als `disallow` ergänzt (vorher
  fehlten diese trotz sensibler/privater Natur).
- `sitemap.ts`: `/ueber-uns`, `/faq`, `/blog` sowie alle veröffentlichten Blog-Artikel (dynamisch aus der
  Content-API geladen) neu ergänzt.
- Canonicals/Duplicate-URLs: keine Auffälligkeiten gefunden (keine Query-Parameter-Varianten der öffentlichen
  Seiten im Umlauf).

## Phase 7 — Datenschutz & AdSense-Platzierung (geprüft, keine Änderung nötig)

Bereits vor dieser Runde korrekt umgesetzt (`CookieConsentBanner.tsx`, `AdSenseScript.tsx`, `AdSlot.tsx`):

- AdSense lädt ausschließlich nach aktiver Consent-Zustimmung UND nur wenn `NEXT_PUBLIC_ADSENSE_CLIENT_ID`
  gesetzt ist (aktuell nicht gesetzt — AdSense ist inaktiv).
- Kein AdSense-Slot ist im privaten Dashboard oder in Gesundheitsdatenbereichen platziert; der einzige
  vorbereitete Slot liegt im Free-Tarif-Bereich des Dashboards — **das sollte vor der nächsten Prüfung nach
  `/blog` verschoben werden**, siehe `ADSENSE_READY_CHECKLIST.md`.
- Keine Health-Daten fließen in Analytics-/AdSense-Events oder URL-Parameter (verifiziert in einer früheren
  Sentry-/Datenschutz-Runde dieser Session-Historie).

## Phase 8 — Mobile & Performance (nicht neu geprüft in dieser Runde)

Ein separater Performance-Audit wurde bereits in einer früheren Session durchgeführt
(`PERFORMANCE_AUDIT.md`, `PERFORMANCE_IMPLEMENTATION_REPORT.md`) — Ladezeiten der öffentlichen Seiten waren
dort bereits im grünen Bereich. Die neuen Seiten (`/blog`, `/ueber-uns`, `/faq`) verwenden dieselbe
Server-Component-Architektur und dasselbe Styling wie die bestehenden Rechtsseiten, kein zusätzliches
Performance-Risiko zu erwarten. Ein erneuter Live-Messlauf speziell für `/blog` wurde in dieser Runde NICHT
durchgeführt (Aufwand/Nutzen-Abwägung) — sollte vor der finalen Freigabe einmal nachgeholt werden.

## Phase 9 — Finale AdSense-Readiness-Prüfung

Siehe `ADSENSE_READY_CHECKLIST.md` für die konkrete Checkliste und den ehrlichen Status.
