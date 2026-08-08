# BLOG_QUALITY_GUIDELINES.md

Verbindliche Qualitätsregeln für jeden zukünftigen VitalTwin-Blogartikel. Gilt für Founder, Redaktion und jede
KI-unterstützte Texterstellung gleichermaßen.

## Workflow (verbindlich, kein Massenpublishing)

```
KI oder Redaktion erstellt Entwurf
        ↓
Qualitätsprüfung (entspricht dieser Richtlinie?)
        ↓
Faktenprüfung (keine erfundenen Studien/Zahlen/Zitate)
        ↓
Interne Verlinkung ergänzen
        ↓
SEO-Prüfung (Title, Description, Struktur)
        ↓
Founder-Freigabe (status: draft → published in /admin/content)
        ↓
Veröffentlichung
```

Es gibt **keinen** automatischen Massen-Publish-Mechanismus. Jeder Artikel wird einzeln als `draft` angelegt
und muss von einem Menschen im Admin-Bereich (`/admin/content`, Berechtigung `manage_content`) explizit auf
`published` gesetzt werden, bevor er über `/blog` öffentlich sichtbar wird (technisch erzwungen durch
`GET /api/content/blog`, das ausschließlich `status='published'` zurückgibt).

## Mindestanforderungen pro Artikel

- Beantwortet eine konkrete, echte Nutzerfrage (kein reines Keyword-Ziel)
- 900–1500 Wörter bei Themen, die das sinnvoll hergeben — niemals künstlich gestreckt
- Klare Struktur mit `##`/`###`-Zwischenüberschriften
- Eigene Formulierungen, keine kopierten oder nahezu identischen Passagen aus anderen Quellen
- Interne Links zu mindestens: einem verwandten Artikel (sobald vorhanden), der passenden Produktseite
  (`/preise`, `/ueber-uns` o. Ä.) und/oder `/faq`
- Byline "VitalTwin Redaktion" (kein erfundener Name, kein erfundener Expertentitel)
- Veröffentlichungsdatum sichtbar (`published_at`)
- Bei gesundheitsnahen Themen: expliziter Disclaimer, dass der Artikel keine medizinische Beratung ersetzt
- Keine Diagnose, kein Heilversprechen, keine "garantierten" Ergebnisse

## Ausdrücklich verboten

- 300-Wörter-Massenartikel ohne echten Inhalt
- Generische KI-Texte ohne Einordnung oder eigene Struktur
- Nahezu identische Artikel zu ähnlichen Themen ("Content-Spinning")
- Artikel ohne nachvollziehbare fachliche Einordnung
- Keyword-Wiederholung ohne inhaltlichen Mehrwert
- Erfundene Nutzerberichte, Testergebnisse, Studien oder Zitate
- Erfundene Autoren, Experten, Teamgrößen oder Partnerschaften
- Medizinische Heilversprechen oder Diagnose-Aussagen

## Empfohlene Themencluster (für interne Verlinkung)

```
Digitaler Wellness-Zwilling (Kernthema)
 ├─ Schlaf
 ├─ Bewegung
 ├─ Ernährung
 ├─ Gewohnheiten
 ├─ Wearables
 │   └─ Google Health
 ├─ CGM
 └─ Datenschutz bei Gesundheits-Apps
```

Jeder neue Artikel sollte, wo inhaltlich sinnvoll, mindestens ein bis zwei andere Artikel desselben oder eines
angrenzenden Clusters verlinken — keine künstlichen, themenfremden Linklisten.

## Content-Backlog (Stand 2026-08-08)

| # | Titel | Status |
|---|---|---|
| 1 | Was ist ein digitaler Wellness-Zwilling? | ✅ Entwurf fertig |
| 2 | Wie Schlaf, Bewegung und Ernährung zusammenhängen können | offen |
| 3 | Was Gesundheitsdaten wirklich aussagen – und was nicht | offen |
| 4 | Google Health erklärt: Welche Daten können verbunden werden? | offen |
| 5 | Fitbit und Pixel Watch mit Google Health verstehen | offen |
| 6 | Was ist CGM und wie liest man Glukoseverläufe? | ✅ Entwurf fertig |
| 7 | Warum persönliche Trends oft wichtiger sind als Durchschnittswerte | offen |
| 8 | Wie man Wellness-Ziele sinnvoll setzt | offen |
| 9 | Wearables: Welche Daten sind wirklich nützlich? | offen |
| 10 | Datenschutz bei Wellness- und Gesundheits-Apps | ✅ Entwurf fertig |
| 11 | So entsteht ein persönlicher Wellness-Bericht | offen |
| 12 | Was VitalTwin heute kann und was noch geplant ist | inhaltlich über `/ueber-uns` abgedeckt |

Neue Entwürfe technisch über eine SQL-Insert-Datei nach dem Muster von
`backend/scripts/seed_blog_drafts.sql` vorbereiten (oder direkt im Admin-CMS unter `/admin/content`
anlegen) — Status immer zunächst `draft`.
