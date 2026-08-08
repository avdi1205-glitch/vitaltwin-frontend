# PUBLIC_CONTENT_MAP.md

Klassifizierung aller öffentlichen Seiten nach Kategorie A–D (Abschnitt 16 der Aufgabenstellung), Stand
2026-08-08.

**Kategorie A** — für AdSense geeignet
**Kategorie B** — öffentlich, aber ohne Werbung
**Kategorie C** — privat / muss `noindex`/disallow bleiben
**Kategorie D** — entfernen oder zusammenführen

| Seite | Kategorie | Begründung |
|---|---|---|
| `/blog`, `/blog/[slug]` | A | Redaktioneller Ratgeberinhalt, klassischer AdSense-Anwendungsfall |
| `/` (Startseite) | B | Produkt-/Marketingseite, kein Werbeplatz gewünscht |
| `/ueber-uns` | B | Vertrauens-/E-E-A-T-Seite |
| `/faq` | B | Support-/Hilfeseite; könnte künftig für dezente Werbung in Frage kommen, aktuell nicht priorisiert |
| `/preise` | B | Kaufentscheidung, keine Ablenkung durch Werbung |
| `/kontakt` | B | Formular-Seite |
| `/beta-bewerbung` | B | Formular-Seite |
| `/impressum` | B | Rechtlich notwendig, keine Werbung |
| `/datenschutz` | B | Rechtlich notwendig, keine Werbung |
| `/agb` | B | Rechtlich notwendig, keine Werbung |
| `/widerrufsrecht` | B | Rechtlich notwendig, keine Werbung |
| `/ki-hinweise` | B | Rechtlich/Vertrauens-relevant |
| `/cookie-einstellungen` | B | Consent-Verwaltung |
| `/login`, `/register` | C | Reine Weiterleitungen, kein indexierbarer Inhalt |
| `/dashboard` | C | Privater Bereich, Wellness-/Gesundheitsdaten |
| `/profil` | C | Privater Bereich, personenbezogene Daten |
| `/onboarding` | C | Privater Bereich |
| `/frag-deinen-twin` | C | Privater KI-Chat mit persönlichem Kontext |
| `/passwort-*` | C | Sicherheitskritische Auth-Flows |
| `/admin/*` | C | RBAC-geschützter Founder-/Admin-Bereich |
| API-Routen (`api.vitaltwin.de/*`) | C | Kein HTML-Inhalt, technische Schnittstelle |

**Kategorie D**: keine Seite identifiziert, die entfernt oder zusammengeführt werden müsste — es gab schlicht
zu wenige öffentliche Content-Seiten, nicht zu viele/doppelte.
