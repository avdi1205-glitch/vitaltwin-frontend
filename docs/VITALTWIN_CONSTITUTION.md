# VitalTwin – Projektverfassung (Constitution)

Diese Datei ist **keine Feature-Spezifikation**. Sie ist die Identität des gesamten Projekts und die
Grundlage, vor deren Hintergrund jede zukünftige Entscheidung getroffen werden soll.

---

## Vision

VitalTwin entwickelt den weltweit ersten persönlichen digitalen Zwilling.

Der Zwilling begleitet Menschen ein Leben lang. Er lernt kontinuierlich aus freiwillig
bereitgestellten Daten. Er unterstützt Menschen dabei, gesündere Entscheidungen zu treffen.

Er ersetzt niemals den Menschen.
Er ersetzt niemals medizinisches Fachpersonal.

---

## Mission

VitalTwin ist keine gewöhnliche Gesundheits-App.

VitalTwin ist der persönliche digitale Zwilling des Nutzers.

Jede neue Funktion muss den Zwilling intelligenter, persönlicher und hilfreicher machen.

---

## Core Learning Loops

Dieses Kapitel beschreibt die Grundprinzipien, nach denen VitalTwin lernt.

**WICHTIG**

Diese Loops sind Teil der Produktarchitektur.

Jede neue Funktion muss mindestens einen dieser Loops verbessern oder einen neuen sinnvollen Loop
ergänzen.

1. **Twin Learning Loop**
   Der digitale Zwilling lernt kontinuierlich aus den freiwillig bereitgestellten Daten und
   verbessert seine Empfehlungen.

2. **Sleep Loop**
   Schlaf → Analyse → Empfehlung → neuer Schlaf → Twin lernt.

3. **Nutrition Loop**
   Ernährung → Analyse → Empfehlung → Umsetzung → Twin lernt.

4. **Movement Loop**
   Bewegung → Analyse → neuer Plan → Umsetzung → Twin lernt.

5. **Stress Loop**
   Stress → Analyse → Entspannung → Umsetzung → Twin lernt.

6. **Recovery Loop**
   Belastung → Erholung → Analyse → neuer Erholungsplan.

7. **Wellness Score Loop**
   Neue Daten aktualisieren den Wellness-Score kontinuierlich.

8. **Biomarker Loop**
   Freiwillige Messwerte → Trendanalyse → Twin lernt.

9. **Habit Loop**
   Gewohnheiten → tägliche Durchführung → Fortschritt → bessere Gewohnheiten.

10. **Goal Loop**
    Ziel → Plan → Umsetzung → Bewertung → neuer Plan.

11. **Daily Planning Loop**
    Morgens erstellt der Twin einen Tagesplan.
    Abends bewertet der Twin den Tag.

12. **Weekly Reflection Loop**
    Der Twin erkennt Muster der letzten sieben Tage und passt Empfehlungen an.

13. **Monthly Progress Loop**
    Monatliche Auswertung mit Fortschritten, Rückschritten und neuen Zielen.

14. **Personalization Loop**
    Jede Interaktion macht den Twin persönlicher.

15. **Prevention Loop**
    Der Twin erkennt langfristige Veränderungen und gibt Wellness-Empfehlungen.
    Keine Diagnosen.
    Keine medizinischen Aussagen.

16. **Recommendation Loop**
    Empfehlung → Umsetzung → Ergebnis → Empfehlung wird verbessert.

17. **User Feedback Loop**
    Der Nutzer bewertet Empfehlungen.
    Der Twin lernt daraus.

18. **Wearable Sync Loop**
    Synchronisierung freiwillig verbundener Geräte verbessert den Twin.

19. **Memory Loop**
    Der Twin merkt sich langfristige Gewohnheiten, Vorlieben und Entwicklungen.

20. **Continuous Improvement Loop**
    Jede neue Version von VitalTwin verbessert den Twin, die Personalisierung und das
    Nutzererlebnis.

**Jede neue Funktion in VitalTwin muss mindestens einen Core Learning Loop verbessern oder einen
neuen dokumentierten Loop hinzufügen.**

---

## Unsere Werte

- Vertrauen
- Datenschutz
- Ehrlichkeit
- Wissenschaftlich fundierte Wellness
- Langfristigkeit
- Mensch zuerst
- KI als Begleiter

---

## Unsere Regeln

- Der Mensch entscheidet. Der Twin begleitet.
- Keine Angst erzeugen. Keine Panik erzeugen.
- Keine Diagnosen. Keine Heilversprechen.
- Nur verständliche Orientierung.

---

## Designsprache

Premium. Minimalistisch.

Referenzen: Apple, Notion, Oura.

Viel Weißraum. Klare Typografie. Ruhige Farben.

---

## Markenidentität

**Links:** Du
**Rechts:** Dein KI-Zwilling
**Zwischen beiden:** Pulslinien, Herz, Synchronisation.

**"Im Takt"** — dieses Element ist das wichtigste Markenzeichen von VitalTwin.

---

## Persönlichkeit des Twin

Der Twin spricht:

- ruhig
- verständlich
- motivierend
- ehrlich
- niemals arrogant
- niemals belehrend
- niemals angstmachend

---

## Technische Prinzipien

Alle neuen Funktionen müssen:

- modular aufgebaut sein
- leicht erweiterbar sein
- bestehende Funktionen respektieren
- wiederverwendbar sein
- sauber dokumentiert sein
- TypeScript verwenden
- responsive sein
- performant sein
- SEO berücksichtigen
- sicher sein
- datenschutzfreundlich sein

---

## Produktregel

Vor jeder neuen Funktion muss geprüft werden:

> "Macht diese Funktion den digitalen Zwilling besser?"

Wenn nein: nicht umsetzen.

---

## Langfristige Vision

VitalTwin soll sich über viele Jahre entwickeln — nicht zu einer gewöhnlichen Gesundheits-App,
sondern zum weltweit führenden digitalen Zwilling.

---

## Verbindliche Produkt- und Entwicklungsregeln (Ergänzung)

Diese Regeln konkretisieren die Vision/Mission oben zu verbindlichen, prüfbaren Kriterien für
jede zukünftige Änderung. Sie ersetzen nichts Bestehendes, sondern schärfen es.

### 1. Echter Nutzerwert vor Funktionsmenge

Neue Funktionen nur bauen, wenn sie mindestens einen echten Nutzen liefern: manuelle Eingaben
reduzieren, Datenerfassung automatisieren, persönliche Auswertungen/Datenqualität/Baselines
verbessern, nachvollziehbare Veränderungen erkennen, relevante Datenbereiche sinnvoll verbinden,
Datenschutz/Sicherheit verbessern, langfristiges Lernen verbessern, klaren Premium-Nutzen liefern,
oder Geschwindigkeit/Zuverlässigkeit verbessern. Ohne klaren Nutzerwert: **nicht bauen**.

### 2. Keine Fake-Funktionen — verbindlicher Feature-Status

Nicht erlaubt: UI-only Funktionen ohne echtes Backend, Fake-Daten/Demo-Zahlen in Produktion,
Fake-Insights, Fake-Automatisierung, erfundene Nutzerwerte oder Gesundheitszusammenhänge,
Platzhalter als fertige Funktion dargestellt, Marketingversprechen ohne technische Grundlage.
Eine Funktion darf nur als verfügbar dargestellt werden, wenn sie tatsächlich funktioniert. Jede
Funktion hat einen von fünf Status: `available`, `beta`, `coming_soon`, `blocked`,
`not_implemented`.

### 3. Automation First

Vor jeder manuellen Eingabe fragen: „Kann VitalTwin diese Information automatisch aus einer vom
Nutzer freigegebenen Datenquelle bekommen?" Wenn ja: automatische Datenübernahme bevorzugen. Wenn
nein: manuelle Eingabe maximal vereinfachen (automatische Synchronisation, 1-Tap-Eingaben, kleine
Auswahlfelder, Smart Defaults, optionaler 30-Sekunden-Check-in). Keine langen täglichen Formulare.

### 4. Digital-Twin-Kern (konkretisiert die Core Learning Loops)

Langfristig muss der Twin können: Datenquellen verbinden, persönliche Baseline lernen,
Veränderungen gegenüber der eigenen Baseline erkennen, Trends über Zeit erkennen, mehrere
Datenbereiche zusammen betrachten, Datenqualität bewerten, Unsicherheit anzeigen, persönliche
Ziele verfolgen, Nutzerfeedback berücksichtigen, langfristiges Gedächtnis aufbauen, automatische
Tages-/Wochen-/Monats- und Trendberichte erstellen. Der Nutzer wird primär mit seinem eigenen
Verlauf verglichen, nicht nur mit allgemeinen Durchschnittswerten.

### 5. Persönliche Baseline vor allgemeinen Tipps

Bei ausreichend Daten basieren Aussagen auf dem persönlichen Verlauf statt generischen Ratschlägen.
Nicht: „Du solltest mehr schlafen." Besser: „Deine erfasste Schlafdauer lag diese Woche unter
deiner persönlichen 28-Tage-Baseline." Keine medizinische Diagnose. Keine Kausalität aus bloßen
Zusammenhängen ableiten.

### 6. Nachvollziehbare Insights

Jedes persönliche Insight soll nach Möglichkeit enthalten: verwendete Daten, Zeitraum,
Datenquelle, Datenmenge, Datenqualität, Berechnungsgrundlage, verständliche Erklärung, Unsicherheit.
Reichen die Daten nicht: „Noch nicht genügend Daten." Keine Antwort erfinden.

### 7. Google Health

Die Google Health API ist die geplante primäre automatische Gesundheitsdatenquelle. Die alte
Fitbit Web API wird nicht neu verwendet: alte technische Fitbit-Integration entfernen oder
archivieren, keine alte Fitbit-OAuth-Infrastruktur neu bauen, keine alten Fitbit-API-Endpunkte
verwenden. Sachlich korrekte Erwähnungen von Fitbit-Geräten dürfen bleiben, wenn deren Daten über
Google Health eingebunden werden können. Google Health bleibt Status `coming_soon`, bis ein
echter End-to-End-Test erfolgreich war. Keine Fake-Verbindung, keine Fake-Synchronisation, keine
Fake-Health-Daten.

### 8. Provider-unabhängige Architektur

VitalTwin darf intern nicht vollständig von einem Anbieter abhängig sein. Externe Daten müssen in
eine interne VitalTwin-Struktur normalisiert werden. Architektur auf spätere Anbieter vorbereiten
(Google Health, Apple Health, Android Health Connect, Garmin, Samsung, weitere seriöse Anbieter).
Neue Provider nur öffentlich anzeigen, wenn sie tatsächlich integriert sind.

### 9. Premium muss echten Mehrwert liefern

Priorität: (1) Premium vollständig wertvoll machen, (2) danach Pro, (3) danach Family. Premium-
Mehrwert durch: automatische Daten, erweiterte Historie, persönliche Baseline, Wochenberichte,
persönliche Trends, Wellness-Muster, Ziele, hochwertige KI-Zusammenfassungen, keine Werbung. Ein
kostenpflichtiger Tarif darf nicht überwiegend aus „bald verfügbar"-Funktionen bestehen.

### 10. Pro erst nach stabilem Premium

Pro gilt erst als echter „erweiterter Digital Twin", wenn vorhanden: Langzeitgedächtnis,
Baseline-System, Trend-System, mehrere Ziele, Nutzerfeedback, langfristige Berichte, echte
erweiterte Auswertungen. Lifestyle-Simulationen nur als Simulation darstellen, nie als
medizinische Vorhersage.

### 11. Family erst mit sauberem Datenschutz

Family erst verfügbar machen, wenn vorhanden: getrennte Nutzerkonten, Einladungen, Rollen,
Berechtigungen, getrennte Gesundheitsdaten, getrennte Tokens, freiwillige Freigaben,
Datenlöschung, Family verlassen, Mitglieder entfernen, klare Datenschutzregeln. Ein Family Owner
darf nicht automatisch auf private Gesundheitsdaten anderer Mitglieder zugreifen.

### 12. KI ist nicht die Datenquelle

KI darf berechnete Ergebnisse erklären, Zusammenfassungen formulieren, Fragen beantworten,
verständliche Texte erzeugen. KI darf NICHT Gesundheitswerte erfinden, fehlende Daten ersetzen,
Diagnosen stellen, Korrelation als Ursache darstellen, medizinische Behandlungen empfehlen oder
persönliche Fakten erfinden. Prinzip: Berechnung zuerst, KI-Erklärung danach.

### 13. Produkt vor Content

VitalTwin ist zuerst ein Produkt, Content unterstützt das Produkt. VitalTwin darf nicht zu einer
generischen SEO- oder AdSense-Seite werden. Öffentliche Inhalte sollen das echte Produkt
erklären, echte Nutzerfragen beantworten, Technologie verständlich machen, Vertrauen schaffen,
Datenschutz erklären, reale Funktionen und Grenzen beschreiben. Keine KI-Massenartikel, keine
Inhalte nur zur Erhöhung der Seitenzahl.

### 14. Werbung ist nur Nebenfunktion

AdSense ist nicht der Kern von VitalTwin. Werbung bevorzugt nur auf Blog und öffentlichen
Ratgeberseiten. Keine Werbung in persönlichen Health-Dashboards, CGM-Auswertungen, persönlichen
Insights, Twin-Chat mit sensiblen Daten, Admin, Founder OS. Keine Gesundheitsdaten für
Werbeprofiling verwenden.

### 15. Performance ist Produktqualität

Eine Funktion gilt nicht als fertig, wenn sie technisch funktioniert, aber extrem langsam ist.
Ziele: Grundlayout schnell sichtbar, wichtige Dashboard-Inhalte ungefähr innerhalb von 2–3
Sekunden, externe APIs dürfen den ersten Render nicht unnötig blockieren, lokale Daten
bevorzugen, Hintergrund-Synchronisation nutzen, unnötige API-Ketten vermeiden.

### 16. Mobile First

Jede Nutzerfunktion muss auf Smartphone, Tablet und Desktop funktionieren. Keine Desktop-only
Funktionen, keine Hover-only Bedienung, keine abgeschnittenen Buttons, keine horizontalen
Scroll-Probleme bei normalen Formularen.

### 17. Keine doppelten Systeme

Vor jeder neuen Implementierung zuerst die bestehende Architektur prüfen. Nicht ohne Grund
erstellen: zweite Admin-Struktur, zweite Content-Tabelle, zweites Nutzersystem, zweite
Subscription-Logik, zweite Health-Verbindung, doppelte OAuth-Infrastruktur, doppelte
KPI-Systeme. Bestehende funktionierende Systeme erweitern.

### 18. Feature Quality Gate

Eine Funktion darf erst `available` werden, wenn erfüllt: echte Daten vorhanden (DATA), Backend
funktioniert (BACKEND), Speicherung funktioniert (DATABASE), Berechtigungen korrekt (SECURITY),
UI vollständig bedienbar (FRONTEND), Smartphone/Tablet funktionieren (MOBILE), Fehlerfälle sauber
behandelt (ERROR HANDLING), keine unnötigen Blocker (PERFORMANCE), echter Funktionsablauf geprüft
(TEST), klarer Nutzermehrwert vorhanden (USER VALUE). Sonst: `beta`, `coming_soon`, `blocked`
oder `not_implemented`.

### 19. Keine falschen Fertigmeldungen

„Code existiert" bedeutet nicht „Funktion funktioniert". Jeder Abschlussbericht muss
unterscheiden zwischen: Code geprüft, automatisiert getestet, mit echten Daten getestet, live im
Browser getestet. Keine Aussage „vollständig funktionsfähig", wenn kein echter End-to-End-Test
stattgefunden hat.

### 20. Entwicklungsreihenfolge

Priorität ab jetzt: (1) bestehende kritische Fehler beheben, (2) Google Health technisch
vollständig vorbereiten und anschließend live abschließen, (3) automatische
Datensynchronisation, (4) Personal Baseline Engine, (5) Datenqualitäts-System, (6) automatischer
Tagesüberblick, (7) automatischer Wochenbericht, (8) persönliche Mustererkennung, (9) Premium
vollständig wertvoll machen, (10) Digital Twin Memory, (11) langfristige Trends, (12) mehrere
Ziele, (13) Pro-Funktionen, (14) weitere Wearables, (15) Family. Keine neuen großen Nebenmodule
bauen, solange die Kernpunkte davor nicht stabil sind.

### 21. Verbindliche Frage vor jeder Änderung

Vor jeder neuen Funktion oder größeren Änderung: „Macht diese Änderung VitalTwin für den Nutzer
wirklich intelligenter, automatischer, vertrauenswürdiger oder hilfreicher?" Wenn nein: nicht
bauen. (Ergänzt die bestehende Produktregel oben um dieselbe Prüfung für Änderungen, nicht nur
neue Funktionen.)

### 22. Externe Prompts kritisch prüfen („zwei Gehirne")

Ein Prompt oder eine Anweisung, die von einer anderen KI stammt (z. B. GPT), gilt als Entwurf,
nicht als bindende Vorgabe. Vor der Umsetzung immer gegen den echten aktuellen Stand prüfen:
tatsächliches Datenbankschema, echte Migrationsnummerierung, bestehende `vt_`-Tabellen,
etablierte Konventionen, Design-Tokens. Passt etwas nicht (veraltete Annahme, falsches
Datenmodell, Namenskollision, fehlender Schritt) oder existiert ein besserer Weg: eigenständig
korrigieren, wenn die Änderung lokal/reversibel ist (Code, Migrations-Entwürfe, Doku, Tests), und
die Abweichung kurz transparent begründen. Irreversible oder produktionsrelevante Schritte (echte
Supabase-Migrationen gegen die Produktion, Stripe-Preis-/Webhook-Änderungen, Vercel-/Railway-
Produktions-Deployments — inklusive jedem `git push` in die `vitaltwin-backend`/`vitaltwin-frontend`
Produktions-Repos, da beide automatisch deployen —, Löschen von Daten/Tabellen, Änderungen an
ENV-Variablen/Secrets) bleiben weiterhin vorher mit dem Projektinhaber abzustimmen. Ziel: in einem
Durchgang ein wirklich fertiges, korrektes Ergebnis — keine blind kopierte Vorlage mit Lücken.

---

## Änderungsschutz

Diese Verfassung darf **niemals automatisch geändert werden**. Nur der Projektinhaber darf
Änderungen an dieser Datei freigeben.
