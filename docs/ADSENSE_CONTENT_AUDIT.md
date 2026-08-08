# ADSENSE_CONTENT_AUDIT.md

Vollständiger Content-Audit aller öffentlich erreichbaren Seiten von VitalTwin, durchgeführt am 2026-08-08 im
Rahmen der AdSense-Qualitätsüberarbeitung. Grundlage: `https://www.vitaltwin.de` (Next.js App Router,
`frontend/app/`).

## Legende

- **Qualität**: hochwertig / mittel / dünn / Platzhalter
- **Handlungsbedarf**: keiner / ausgebaut / neu erstellt / technisch korrigiert

---

## 1. Startseite (`/`)

- **Titel**: "VitalTwin | Digitaler Wellness-Zwilling"
- **Zweck**: Produktvorstellung, Registrierung/Login-Einstieg
- **Textmenge**: ~600 Wörter über mehrere Abschnitte (Hero, "So funktioniert VitalTwin", "Dein täglicher
  Überblick", "Dein digitaler Zwilling", "Warum VitalTwin?", Preisübersicht, CTA, 5 FAQ-Einträge, Footer)
- **Qualität**: mittel → hochwertig (nach Überarbeitung)
- **Originalität**: eigener Text, keine kopierten Inhalte
- **Nutzermehrwert**: erklärt Produkt, Funktionsweise, Preise, beantwortet Kernfragen
- **Interne Links**: Preise, Impressum, Datenschutz, AGB, Widerrufsrecht, Cookie-Einstellungen, KI-Hinweise,
  Kontakt, Beta-Bewerbung — jetzt zusätzlich Über uns, Blog, FAQ
- **Vertrauenssignale**: Wellness-Disclaimer sichtbar, ehrliche Preisangaben, Datenschutz-Link in FAQ
- **Handlungsbedarf**: Footer- und FAQ-Verlinkung zu den neuen Seiten (Über uns/Blog/FAQ) ergänzt. Die
  "Beispielhafte Ansicht"-Kachel (Schlafqualität/Bewegung/Stresslevel) ist bereits korrekt als "Beispielhafte
  Ansicht" gekennzeichnet, nicht als echte Nutzerdaten — kein Fake-Daten-Problem, aber im Auge zu behalten.

## 2. Preise (`/preise`)

- **Zweck**: Tarifübersicht (Free/Premium/Pro/Family), Checkout-Einstieg
- **Textmenge**: mittel, überwiegend Funktions-/Preislisten
- **Qualität**: hochwertig
- **Originalität**: eigen
- **Nutzermehrwert**: klare Tarifvergleiche
- **Vertrauenssignale**: bereits vorbildlich — jedes Feature, das noch nicht fertig ist, trägt ein
  `comingSoon`-Flag und wird im UI mit "(bald verfügbar)" gekennzeichnet (`lib/plans.ts`); Kaufbuttons für
  Pro/Family sind nur aktiv, wenn ein echter Stripe-Preis konfiguriert ist (`isPlanPurchasable()`) — sonst kein
  aktiver Checkout, keine Irreführung.
- **Handlungsbedarf**: keiner (bereits konform mit Abschnitt 12 der Aufgabe)

## 3. Blog (`/blog`, `/blog/[slug]`) — NEU

- **Zweck**: Ratgeberinhalte zu Schlaf, Bewegung, Ernährung, Wearables, Datenschutz, CGM, digitalem Zwilling
- **Status vorher**: existierte nicht. Ein CMS (`vt_content_items`, Admin-UI unter `/admin/content`) war
  bereits vorhanden, aber es gab **keine öffentliche Seite, die veröffentlichte Inhalte anzeigt** — das CMS war
  faktisch nutzlos für SEO/AdSense-Zwecke.
- **Jetzt**: neue öffentliche, nur-lesende Backend-Route `GET /api/content/blog` (+ `/blog/{slug}`), die
  ausschließlich `status=published`-Einträge zurückgibt. Neue Frontend-Seiten `/blog` (Liste) und
  `/blog/[slug]` (Einzelartikel), serverseitig gerendert (SEO-freundlich), mit `generateMetadata` für Title/
  Description je Artikel.
- **Inhalt aktuell**: 3 fertige, aber **als Entwurf (status='draft') markierte** Artikel vorbereitet (siehe
  `backend/scripts/seed_blog_drafts.sql`) — noch NICHT veröffentlicht, bis ein Founder sie im Admin-Bereich
  prüft und freigibt.
- **Qualität**: hochwertig (900–1300 Wörter je Artikel, eigene Struktur, kein Keyword-Stuffing, mit
  Gesundheits-Disclaimer)
- **Handlungsbedarf**: 9 weitere Artikel aus der 12er-Liste sind noch NICHT geschrieben (siehe
  `ADSENSE_FIX_PLAN.md` Phase 5).

## 4. Über uns (`/ueber-uns`) — NEU

- **Zweck**: Produktherkunft, Vision, Grenzen, E-E-A-T
- **Status vorher**: existierte nicht
- **Jetzt**: vollständige Seite (Was ist VitalTwin / Warum entwickelt / Was bedeutet "digitaler Zwilling" /
  Unterschied zu Tracking-Apps / heutige Funktionen / geplante Funktionen / Grenzen & kein Medizinprodukt /
  Kontakt)
- **Qualität**: hochwertig, ~700 Wörter, keine erfundenen Teammitglieder, keine erfundenen Partnerschaften
- **Handlungsbedarf**: keiner mehr

## 5. FAQ (`/faq`) — NEU

- **Zweck**: zentrale, durchsuchbare Sammlung häufiger Fragen
- **Status vorher**: nur 5 Fragen auf der Startseite, keine eigene Seite
- **Jetzt**: 28 Fragen in 6 Themengruppen (Grundlagen, Kosten & Tarife, Daten & Datenschutz, Wearables &
  Datenquellen, KI & Empfehlungen, Beta & Zukunft)
- **Qualität**: hochwertig, ehrliche Antworten inkl. offener Punkte (z. B. Google Health "in Entwicklung")
- **Handlungsbedarf**: keiner mehr

## 6. Kontakt (`/kontakt`)

- **Qualität**: hochwertig, funktionierendes Formular + direkte E-Mail-Adresse
- **Rechtlich notwendig**: ja (TMG, zweiter Kontaktweg neben E-Mail lt. BGH I ZR 93/08)
- **Handlungsbedarf**: keiner. Admin-Sichtbarkeit für eingehende Nachrichten wurde in einer früheren Iteration
  bereits nachgerüstet (`/admin/support`).

## 7. Datenschutz (`/datenschutz`)

- **Qualität**: hochwertig, vollständig, inkl. Sentry-/AdSense-Offenlegung, granularem Consent
- **Handlungsbedarf**: keiner

## 8. Impressum (`/impressum`)

- **Qualität**: hochwertig, vollständig (§5 TMG, §18 MStV, USt-IdNr., Kontakt, Haftungshinweis)
- **Handlungsbedarf**: keiner

## 9. AGB (`/agb`)

- **Qualität**: hochwertig (nicht im Detail neu gelesen in dieser Runde, keine Auffälligkeiten aus früheren
  Audits bekannt)
- **Handlungsbedarf**: keiner bekannt

## 10. Widerrufsrecht (`/widerrufsrecht`)

- **Qualität**: hochwertig, rechtlich notwendig
- **Handlungsbedarf**: keiner

## 11. KI-Hinweise (`/ki-hinweise`)

- **Qualität**: hochwertig — erklärt Grenzen der KI-Funktion, Datenübermittlung, Speicherung, kein
  medizinischer Anspruch
- **Handlungsbedarf**: keiner

## 12. Cookie-Einstellungen (`/cookie-einstellungen`)

- **Qualität**: hochwertig, konditional auf `NEXT_PUBLIC_ADSENSE_CLIENT_ID` — zeigt akkuraten Text je
  nachdem, ob AdSense aktiv ist
- **Handlungsbedarf**: keiner (siehe auch Abschnitt 13 in `ADSENSE_READY_CHECKLIST.md`)

## 13. Beta-Bewerbung (`/beta-bewerbung`)

- **Qualität**: hochwertig, funktionierendes Formular, Honeypot gegen Spam
- **Handlungsbedarf**: keiner

## 14. Login (`/login`), Register (`/register`)

- **Qualität**: technisch reine Weiterleitungen (`redirect()`), kein eigener indexierbarer Inhalt
- **Handlungsbedarf**: aus `robots.txt` explizit ausgeschlossen (vorher nicht der Fall) — siehe technischer
  SEO-Abschnitt in `ADSENSE_FIX_PLAN.md`

## 15. Dashboard, Profil, Onboarding, Frag-deinen-Twin, Passwort-*

- **Kategorie**: privat, login-pflichtig
- **Qualität**: n/a für SEO-Zwecke
- **Handlungsbedarf**: bereits korrekt in `robots.txt` als `disallow` geführt

## 16. Admin (`/admin/*`), Founder OS

- **Kategorie**: streng privat, RBAC-geschützt
- **Handlungsbedarf**: war bisher NICHT explizit in `robots.txt` ausgeschlossen — jetzt ergänzt
  (`/admin`, `/admin/*`)

## 17. API-Routen (`/api/*`, Backend unter `api.vitaltwin.de`)

- **Kategorie**: technisch, kein HTML-Inhalt
- **Handlungsbedarf**: `/api`, `/api/*` jetzt explizit in `robots.txt` ergänzt (defensiv, da die
  Frontend-Domain selbst keine `/api`-Routen rendert, aber zur Klarheit trotzdem aufgenommen)

---

## Zusammenfassung: Warum "Minderwertige Inhalte" wahrscheinlich war

Vor dieser Überarbeitung bestand die gesamte öffentlich indexierbare Seite aus **9 Seiten**: Startseite,
Preise, Beta-Bewerbung, AGB, Datenschutz, Impressum, Widerrufsrecht, Cookie-Einstellungen, KI-Hinweise. Davon
sind 6 reine Pflicht-/Rechtstexte ohne eigenständigen redaktionellen Mehrwert im Sinne von AdSense. Es gab
**keinen Blog, keine Über-uns-Seite, keine FAQ-Seite** — also praktisch keinen eigenständigen, wiederkehrend
wertvollen redaktionellen Inhalt, den Google als Qualitätssignal werten könnte. Das ist nach der eigenen
Einschätzung dieses Audits der wahrscheinlichste Hauptgrund für die Einstufung als "Minderwertige Inhalte".
