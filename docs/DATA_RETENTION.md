# VitalTwin — Data Retention (DATA_RETENTION.md)

> Erstellt in **Etappe 9 (Twin Intelligence Core)**. Dokumentiert
> Aufbewahrungsregeln für jede Datenkategorie — keine unbegrenzte
> Speicherung ohne Zweck (Etappe 9 §4).

## 1. Aktive Profildaten

**Solange das Konto aktiv ist.** Profil, Check-ins, Ziele, Gewohnheiten,
Tagespläne/-reflexionen, Wochenrückblicke, Empfehlungen samt Entscheidungen/
Ergebnissen/Feedback, Twin Memories, Muster und Lernereignisse bleiben
gespeichert, solange der Nutzer sein Konto nicht löscht oder die jeweilige
Kategorie/den einzelnen Eintrag nicht selbst löscht (siehe
[PRIVACY_CONTROLS.md](./PRIVACY_CONTROLS.md)). Es gibt **keine automatische
Zeit-basierte Löschung** aktiver Nutzerdaten — das würde ohne Zustimmung
Daten entfernen, die der Nutzer bewusst behalten möchte (z. B. eine
Jahres-Historie für den eigenen Fortschritt).

## 2. Technische Logs

**Begrenzter Zeitraum.** `vt_audit_events` (Compliance-Audit-Log) und
Server-/Anwendungslogs (z. B. Railway-Plattformlogs) sind für
Sicherheits-/Debugging-Zwecke gedacht, nicht für unbegrenzte Historie.
Empfehlung für die Produktionsumgebung: Rotation/Löschung von
Plattform-Logs nach der von Railway vorgegebenen Standardaufbewahrung;
`vt_audit_events`-Zeilen sollten nach **24 Monaten** automatisiert
archiviert/gelöscht werden (noch nicht als Cronjob implementiert — siehe
§6 "Offene Punkte").

## 3. Gelöschte Daten

**Definierter Prozess, siehe [PRIVACY_CONTROLS.md](./PRIVACY_CONTROLS.md)
§2:**

- Die meisten Kategorien werden **hart** gelöscht (sofort aus der Tabelle
  entfernt, keine Wiederherstellung außer über ein Datenbank-Backup, siehe
  [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md)).
- Ziele und Memories nutzen **Soft Delete** (`deleted_at`/`status`), um
  Historie für Reflexionen/Nachvollziehbarkeit zu erhalten, werden aber
  sofort aus allen normalen Abfragen ausgeschlossen.
- **Endgültige Bereinigung von Soft-Deletes:** für eine spätere Etappe
  vorgesehen — ein Hintergrundjob, der Soft-Deletes älter als z. B. 90 Tage
  endgültig (hart) löscht. **Noch nicht implementiert** (offener Punkt,
  siehe unten).
- **Vollständige Kontolöschung:** manuell geprüft (kein automatischer
  Sofortvollzug, um versehentlichen Datenverlust zu verhindern) — Zusage:
  Bearbeitung und tatsächliche Löschung innerhalb einer angemessenen Frist
  nach Prüfung (aktuell nicht vertraglich fixiert, siehe §6).

## 4. Exportdateien

**Zeitlich begrenzt — aber aktuell gar nicht serverseitig gespeichert.**
Der volle JSON-Export sowie der CSV-Export werden **synchron erzeugt und
direkt an den Browser gestreamt**, nie als Datei auf dem Server oder in
einem Objektspeicher abgelegt. Es gibt daher aktuell keine
Export-Datei-Aufbewahrungsfrist zu definieren — sobald eine
Background-Job-Export-Pipeline gebaut wird (siehe
[TWIN_BETA_LIMITATIONS.md](./TWIN_BETA_LIMITATIONS.md), "große Exporte
vorbereiten"), muss diese Pipeline eine eigene Aufbewahrungsfrist für die
erzeugte Datei festlegen (Empfehlung: automatische Löschung nach 7 Tagen).

## 5. KI-Nutzungsmetadaten

**Nur notwendige Informationen.** `vt_chat_usage` speichert ausschließlich
einen Tageszähler (`count`, `last_request_at`) — **nie** den Inhalt einer
Nachricht oder Antwort. Diese Zähler werden mit dem Kalendertag assoziiert
und dienen ausschließlich der Tariflimit-Durchsetzung
(`core/plans.py::get_chat_daily_limit`); es gibt keinen weiteren Zweck, für
den sie länger als für die aktuelle Abrechnungsperiode gebraucht würden.
Empfehlung: Zeilen älter als 90 Tage können gefahrlos gelöscht werden
(noch nicht automatisiert, siehe §6).

## 6. Offene Punkte (ehrlich benannt)

- Kein automatisierter Cronjob für: Audit-Log-Rotation (24 Monate),
  Soft-Delete-Bereinigung (90 Tage), Chat-Usage-Bereinigung (90 Tage).
  Diese Fristen sind hier als **Zielwerte dokumentiert**, aber technisch
  noch nicht durchgesetzt.
- Keine vertraglich fixierte maximale Bearbeitungsfrist für
  Kontolöschungsanfragen — aktuell "so schnell wie möglich nach manueller
  Prüfung".
- Diese Dokumentation beschreibt die **Zielregeln**; eine rechtliche Prüfung
  (z. B. ob 24 Monate für Audit-Logs nach DSGVO angemessen sind) steht noch
  aus (siehe Abschlussbericht Etappe 9, Punkt "offene rechtliche
  Prüfungen").
