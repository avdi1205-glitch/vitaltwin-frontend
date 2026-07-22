# VitalTwin — Backup and Restore (BACKUP_AND_RESTORE.md)

> Erstellt in **Etappe 9 (Twin Intelligence Core)**. Dokumentiert das
> Backup-/Wiederherstellungskonzept (Etappe 9 §5). VitalTwin nutzt
> verwaltete Plattformen (Supabase für Postgres, Railway für das Backend) —
> diese Datei beschreibt, was diese Plattformen bieten, was das Projekt
> zusätzlich beachten muss, und was in dieser Session **nicht** verifiziert
> werden konnte (kein Infrastrukturzugriff).

## 1. Verschlüsselte Produktionsbackups

Supabase (Postgres-Hosting dieses Projekts) verschlüsselt Backups
plattformseitig (at-rest, im jeweils gebuchten Plan enthalten). VitalTwin
selbst legt keine eigenen, zusätzlichen Datenbank-Dumps ab — es gibt daher
keine projektseitige Backup-Verschlüsselung zu konfigurieren, solange keine
eigene Backup-Pipeline neben der Plattform existiert.

**Nicht in dieser Session verifiziert:** ob der aktuell gebuchte
Supabase-Plan automatische Backups tatsächlich aktiviert hat (das hängt vom
gewählten Tarif ab) — das muss im Supabase-Dashboard durch das Team geprüft
werden, kein Code-Aspekt.

## 2. Aufbewahrungsdauer

Richtet sich nach dem Supabase-Plan (typischerweise 7-30 Tage
Point-in-Time-Recovery je nach Tarif). VitalTwin dokumentiert hier keinen
eigenen, längeren Aufbewahrungszeitraum — Empfehlung: mindestens 30 Tage
Point-in-Time-Recovery für die Produktionsdatenbank, sobald ein
kostenpflichtiger Supabase-Plan mit dieser Option gebucht ist.

## 3. Wiederherstellungstest

**Kein Wiederherstellungstest wurde in dieser Session durchgeführt** — es
bestand kein Zugriff auf eine echte Datenbank oder Supabase-Projekt-Login
(durchgängige Einschränkung seit Etappe 2, siehe jeden Migrationsheader).
Empfehlung für das Team: mindestens einmal pro Quartal eine
Point-in-Time-Recovery in eine isolierte Test-Umgebung einspielen und
gegen die in `backend/migrations/001` bis `008` beschriebenen Tabellen
prüfen (Zeilenanzahl, Stichproben-Werte, Nutzertrennung weiterhin intakt).

## 4. Trennung Entwicklung/Produktion

- **Backend:** `backend/.env` enthält lokale/Entwicklungs-Zugangsdaten,
  wird nicht committed (siehe `.gitignore` — Standard für dieses Projekt
  seit Etappe 1). Produktions-Zugangsdaten liegen ausschließlich als
  Railway-Umgebungsvariablen vor, nie im Repository.
- **Datenbank:** Es existiert (Stand dieser Session) ein einziges
  Supabase-Projekt, auf das sowohl lokale Entwicklung als lokale
  `.env`-Konfiguration verweisen könnte. **Empfehlung:** ein separates
  Supabase-Projekt (oder zumindest ein separates Schema) für Entwicklung/
  Staging einrichten, damit Testdaten nie in derselben Datenbank wie echte
  Nutzerdaten landen. Dies ist ein **offener organisatorischer Punkt**, kein
  Code-Defizit dieser Etappe.

## 5. Keine Datenbankdateien in Git

Verifiziert durch Konvention seit Etappe 1: `backend/migrations/*.sql`
enthält ausschließlich DDL (Tabellendefinitionen, additive
`alter table`/`create index`) — **keine** `.sql`-Dumps mit echten Zeilen,
keine `.db`/`.sqlite`-Binärdateien im Repository. `SUPABASE_SCHEMA.sql`
ist ebenfalls reines Schema, keine Daten.

## 6. Keine echten Nutzerdaten in öffentlichen Repositories

- Beide Repositories (`vitaltwin-frontend`, `vitaltwin-backend`) enthalten
  ausschließlich Code, Migrations-DDL und Dokumentation — keine
  Test-Fixtures mit echten E-Mail-Adressen oder personenbezogenen Daten
  (alle Tests in `backend/tests/` verwenden ausschließlich erfundene
  Beispieladressen wie `user-a@example.com`, siehe z. B.
  `tests/test_chat_router.py`).
- `.env`-Dateien mit echten Zugangsdaten sind über `.gitignore`
  ausgeschlossen (seit Etappe 1 etabliert).

## 7. Rollback-Strategie

- **Code:** Git-basiert — jede Etappe ist ein eigener, klar benannter
  Commit in beiden Repositories; ein Rollback auf den vorherigen Commit
  (`git revert`/Redeploy eines älteren Commits über Railway/Vercel) ist
  jederzeit möglich, ohne Datenbankänderungen rückgängig machen zu müssen,
  **weil jede Migration additiv ist** (nie `drop column`/`drop table`) —
  ein älterer Code-Stand funktioniert weiterhin gegen eine bereits
  migrierte, neuere Datenbank (er nutzt nur die neuen Spalten/Tabellen
  nicht).
- **Datenbank:** Rollback auf einen früheren Zustand ausschließlich über
  eine Supabase-Point-in-Time-Recovery (siehe §2/§3) — es gibt keine
  automatisierten "Down-Migrationen" in diesem Projekt (bewusst, additive
  Migrationen brauchen i.d.R. keine Down-Migration, siehe Header jeder
  `migrations/*.sql`-Datei).
- **Deployment:** Sowohl Railway (Backend) als auch Vercel (Frontend)
  erlauben ein Rollback auf ein vorheriges Deployment über deren jeweiliges
  Dashboard, unabhängig vom Datenbankzustand.

## 8. Zusammenfassung: was verifiziert wurde vs. was offen ist

| Punkt | Status |
|---|---|
| Additive, nie destruktive Migrationen | ✅ verifiziert (Code-Review aller `migrations/001`-`008`) |
| Keine DB-Dateien/echten Nutzerdaten in Git | ✅ verifiziert (Repository-Struktur, Test-Fixtures) |
| `.env`-Trennung, keine Secrets im Repo | ✅ verifiziert (`.gitignore`-Konvention) |
| Rollback-Fähigkeit des Codes | ✅ verifiziert (additive Migrationen, Git-Historie) |
| Tatsächliche Supabase-Backup-Konfiguration | ❌ nicht verifizierbar (kein Plattformzugriff in dieser Session) |
| Durchgeführter Wiederherstellungstest | ❌ nicht durchgeführt (kein Datenbankzugriff) |
| Getrennte Dev-/Prod-Datenbank | ❌ offener organisatorischer Punkt |
