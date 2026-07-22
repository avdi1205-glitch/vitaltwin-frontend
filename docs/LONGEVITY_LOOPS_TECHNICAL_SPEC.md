# Die 5 Longevity-Kernloops (Technische Spezifikation)

> **Status:** Entwurf / Referenz für künftige Implementierung. Kein aktives Laufzeitverhalten,
> keine automatische KI-Antwortformatierung. Muss bei Umsetzung mit der
> [VitalTwin Constitution](./VITALTWIN_CONSTITUTION.md) übereinstimmen — insbesondere: **keine
> Diagnosen, keine Heilversprechen, nur verständliche Wellness-Orientierung.**

Diese Spezifikation beschreibt fünf geschlossene Regelkreise, die den digitalen Zwilling
technisch antreiben sollen: von der Sensor-Dateneingabe über die Analyse und eine konkrete
Intervention bis zur Verifikation und dem Lernen aus dem Ergebnis.

---

## Loop 1 — Der Sensor-Daten-Loop (Eingang)

- **Was eingebaut wird:** Wearables (HRV, Puls, Hauttemperatur), CGM, manuelle Food-Logs,
  Stimmungs-Tracking.
- **System-Aktion:** Normalisierung der Rohdaten (z. B. R-R-Intervalle in HRV umrechnen) und
  Plausibilisierung (Wertebereichs-Checks).
- **Statuszeile (bei Umsetzung):** `Loop1-Status: [OK/Daten fehlen/Fehlerhaft]`

## Loop 2 — Der Biomarker-Abgleich (Analyse)

- **Was eingebaut wird:** Statische Referenztabellen (Alter/Geschlecht) + dynamische persönliche
  Baseline (gleitender 7-Tage-Mittelwert).
- **System-Aktion:** Berechne die prozentuale Abweichung jedes Werts von der persönlichen
  Baseline. Identifiziere den Biomarker mit der höchsten negativen Abweichung
  („Stress-Index“ oder „Erholungsdefizit“).
- **Statuszeile (bei Umsetzung):** `Loop2-Ergebnis: Biomarker X ist um Y % abgewichen – Priorität Z.`

## Loop 3 — Der Interventions-Katalog (Aktion)

- **Was eingebaut wird:** Eine feste Wissensdatenbank mit 50+ mikroskaligen Aktionen
  (Atemübungen, Kaltreize, Essensfenster, Supplement-Timings).
- **System-Aktion:** Wähle exakt eine Aktion aus, die den in Loop 2 identifizierten Biomarker
  innerhalb von 2 Stunden beeinflusst. Die Aktion muss eine klare Start-/Endzeit haben.
- **Statuszeile (bei Umsetzung):** `Loop3-Empfehlung: [Aktion] ab sofort für [Dauer].`

## Loop 4 — Der Verifikations-Loop (Messung)

- **Was eingebaut wird:** Ein Timer, der nach 2 Stunden automatisch eine erneute Messung des
  gleichen Biomarkers anfordert (per Push oder manuellem Input).
- **System-Aktion:** Vergleiche Vorher/Nachher. Berechne die absolute Differenz.
- **Statuszeile (bei Umsetzung):** `Loop4-Ergebnis nach 2h: [Neuer Wert] → Delta = [x]. Ziel erreicht? [Ja/Nein]`
- Falls der Timer noch läuft: `Loop4: Wartend auf Timer – bitte in 2h den Wert eingeben.`

## Loop 5 — Der Gewichtungs-Adapter (Lernen)

- **Was eingebaut wird:** Ein persönlicher Score für jede Intervention (z. B. „Tiefenatmung senkt
  meinen HRV um 5 ms – das ist gut/schlecht“).
- **System-Aktion:** Passe die Gewichtung in Loop 2 an. Wenn die Aktion erfolgreich war
  (Verbesserung > 5 %), wird sie in der Wissensdatenbank für diesen Nutzer höher priorisiert.
  Wenn nicht, wird sie herabgestuft.
- **Statuszeile (bei Umsetzung):** `Loop5-Update: Persönlicher Faktor für [Aktion] wurde auf [neuer Multiplikator] angepasst.`

---

## Einordnung ins bestehende System

Diese 5 Loops sind eine **technische Verfeinerung** des bereits in der
[VITALTWIN_CONSTITUTION.md](./VITALTWIN_CONSTITUTION.md) definierten „Twin Learning Loop“ und
„Recommendation Loop“ — sie beschreiben, *wie* diese auf Datenebene funktionieren könnten, sobald
echte Wearable-Integrationen (siehe „Wearable Loop“) angebunden sind.

**Wichtige Leitplanken für eine spätere Umsetzung:**

- Die Statuszeilen sind ein Konzept für ein zukünftiges, in der App sichtbares
  Feature (z. B. eine "Loop-Status"-Karte im Dashboard) — **kein** Format für Chat-Antworten
  des Coding-Assistenten.
- Alle Interventionsvorschläge bleiben Wellness-Empfehlungen, keine medizinischen Anweisungen
  (keine Dosierungen, keine Diagnosen — siehe Constitution-Regel).
- Erfordert reale Sensor-/Wearable-Daten; ohne diese darf kein Loop einen echten Status vortäuschen.
