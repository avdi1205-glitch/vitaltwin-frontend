# ADSENSE_READY_CHECKLIST.md

Checkliste gemäß Abschnitt 17 der Aufgabenstellung. Ein Punkt gilt nur als ✅, wenn er tatsächlich verifiziert
wurde — nicht weil er "wahrscheinlich passt".

| # | Kriterium | Status | Anmerkung |
|---|---|---|---|
| 1 | Startseite vollständig | ✅ | Erklärt Was/Für wen/Wie/Preise/FAQ; jetzt zusätzlich zu Über uns/Blog/FAQ verlinkt |
| 2 | Über-uns-Seite vorhanden | ✅ | Neu erstellt, `/ueber-uns` |
| 3 | Kontakt vorhanden | ✅ | Bereits vorhanden, funktionierendes Formular + E-Mail |
| 4 | Impressum vorhanden | ✅ | Vollständig, §5 TMG/§18 MStV |
| 5 | Datenschutz vorhanden | ✅ | Vollständig, inkl. Sentry/AdSense-Offenlegung |
| 6 | FAQ vorhanden | ✅ | Neu erstellt, `/faq`, 28 Fragen |
| 7 | 10–15 hochwertige öffentliche Inhalte | ❌ **NICHT erfüllt** | Aktuell 3 Blogartikel als Entwurf (noch nicht veröffentlicht) + Startseite/Über-uns/FAQ/Preise als Kerninhalte. Reicht nicht für die geforderte Schwelle. |
| 8 | Keine offensichtlichen Platzhalter | ✅ | Kein "Coming Soon" auf öffentlichen Seiten gefunden; Pro/Family-Features korrekt als "(bald verfügbar)" markiert |
| 9 | Keine Demo-Daten | ✅ | Homepage-Beispielkachel ist explizit als "Beispielhafte Ansicht" gekennzeichnet, keine irreführende Darstellung als echte Daten |
| 10 | Keine kaputten Seiten | ✅ | `npm run build` erfolgreich, alle Routen generiert, tsc/lint sauber |
| 11 | Mobile Ansicht gut | ⚠️ Nicht neu geprüft | Basiert auf bestehendem, bereits mobil-optimiertem Layout-System; kein dedizierter neuer Mobile-Test für `/blog`, `/ueber-uns`, `/faq` durchgeführt |
| 12 | Ladezeiten akzeptabel | ⚠️ Nicht neu gemessen | Früherer Performance-Audit war grün; neue Seiten nicht separat live gemessen |
| 13 | Interne Navigation vollständig | ✅ | Footer verlinkt jetzt auf alle neuen Seiten; Blog-Artikel verlinken zurück auf `/blog` |
| 14 | Private Seiten `noindex`/disallow | ✅ | `robots.ts` jetzt vollständig: Dashboard/Profil/Onboarding/Frag-deinen-Twin/Passwort-*/Login/Register/Admin/API |
| 15 | AdSense datenschutzkonform vorbereitet | ✅ | Consent-gated Script-Loading, kein Slot in privaten/Gesundheitsbereichen — siehe Empfehlung unten zur Slot-Platzierung |

## Empfehlung zur AdSense-Platzierung (Abschnitt 9 der Aufgabe)

- **Geeignet**: `/blog` und einzelne Blogartikel, sobald veröffentlicht.
- **Nicht geeignet / bewusst ausgelassen**: `/dashboard` (enthält Wellness-/Gesundheitsdaten), `/profil`,
  `/frag-deinen-twin` (KI-Chat mit persönlichem Kontext), CGM-/Ernährungsbereiche, Admin/Founder OS.
- **Aktueller Stand im Code**: Es existiert ein vorbereiteter (aber inaktiver) `<AdSlot>` im
  Dashboard-Bereich für Free-Tarif-Nutzer (`app/dashboard/page.tsx`). Da das Dashboard Wellness-Check-ins und
  potenziell CGM-nahe Inhalte zeigt, **empfehlen wir, diesen Slot zu entfernen oder ausschließlich auf
  `/blog`-Seiten zu verschieben**, bevor `NEXT_PUBLIC_ADSENSE_CLIENT_ID` jemals gesetzt wird. Diese Änderung
  wurde in dieser Runde bewusst NICHT automatisch vorgenommen, da sie eine Produktentscheidung des Founders
  berührt (Free-Tarif-Monetarisierung) — nur dokumentiert als Empfehlung.

## Objektive Gesamteinschätzung

**Noch NICHT bereit für eine erneute AdSense-Prüfung.**

Der einzige, aber entscheidende offene Punkt ist Kriterium 7: Es braucht mindestens 10–15 tatsächlich
veröffentlichte, hochwertige öffentliche Inhalte — aktuell sind es rechnerisch nur 4 echte Content-Seiten
(Startseite, Über uns, FAQ, Preise) plus 3 unveröffentlichte Blog-Entwürfe. Das ist ein großer, echter
Fortschritt gegenüber vorher (0 Blogartikel, keine Über-uns-/FAQ-Seite), reicht aber noch nicht für die in der
Aufgabe selbst gesetzte Schwelle.

**Nächster konkreter Schritt**: die 3 vorbereiteten Entwürfe im Admin-Bereich (`/admin/content`) prüfen und
veröffentlichen, danach in überschaubaren Tranchen (z. B. 3–4 auf einmal) weitere Artikel aus der 12er-Liste
ergänzen, bis mindestens 10 Artikel live sind. Erst danach diese Checkliste erneut durchgehen.
