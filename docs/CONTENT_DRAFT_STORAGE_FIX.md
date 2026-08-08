# CONTENT_DRAFT_STORAGE_FIX.md

## Ursache (ehrlich, ohne Beschönigung)

Die 3 Blogartikel-Entwürfe wurden **nur als SQL-Datei geschrieben** (`backend/scripts/seed_blog_drafts.sql`),
aber **nie tatsächlich gegen die Produktions-Datenbank ausgeführt**. Ich habe keinen direkten Datenbankzugriff
(kein Supabase-Tool, keine `.env`-Zugangsdaten lokal vorhanden) — jede Migration/jeder Seed in diesem Projekt
muss laut etablierter Konvention manuell im Supabase SQL-Editor ausgeführt werden.

Mein Fehler war die **Formulierung im Abschlussbericht**: Ich schrieb "3 vollständige Blogartikel-Entwürfe
geschrieben ... in der Datenbank ... bereit", was fälschlich klang, als läge das bereits vor. Richtig gewesen
wäre: "3 Entwürfe geschrieben, liegen als SQL-Datei vor — **du musst sie einmalig ausführen**, bevor sie
irgendwo sichtbar sind." Das war in den Doku-Dateien (`ADSENSE_FIX_PLAN.md`) korrekt als "einmalig manuell
auszuführen" vermerkt, aber in der direkten Chat-Zusammenfassung nicht klar genug hervorgehoben. Das war ein
Kommunikationsfehler, kein Backend-Bug.

## Betroffene Tabelle

`public.vt_content_items` (angelegt in Migration `009_admin_rbac_foundation.sql`). Spalten: `id`,
`content_type`, `slug`, `title`, `body`, `status`, `created_by`, `created_at`, `updated_at`, `published_at`.

## Schreibpfad (geprüft)

`backend/scripts/seed_blog_drafts.sql` — ein `INSERT INTO public.vt_content_items (...) VALUES (...) ON
CONFLICT (content_type, slug) DO UPDATE ...` für 3 Zeilen mit `content_type='blog'`, `status='draft'`,
`created_by='seed-script'`. **Dieses Skript wurde bisher nicht ausgeführt** — daher existieren aktuell keine
Zeilen in der Datenbank.

## Lesepfad (geprüft, kein Bug gefunden)

- Frontend `frontend/app/admin/content/page.tsx` ruft `GET /api/admin/content` auf (ohne Filter für "Alle",
  mit `?content_type=blog` für den Tab "blog").
- Backend `backend/app/routers/admin.py::list_content()`:
  ```python
  query = supabase.table(CONTENT_TABLE).select("*")   # CONTENT_TABLE = "vt_content_items"
  if content_type:
      query = query.eq("content_type", content_type)
  rows = query.order("updated_at", desc=True).execute().data or []
  ```
- **Schreibpfad-Tabelle (`vt_content_items`) und Lesepfad-Tabelle (`vt_content_items`) stimmen exakt überein.**
  Kein Tabellen-Mismatch, kein falscher Filter, keine falsche Berechtigungsprüfung, die Drafts ausschließen
  würde (`view_content`/`manage_content` gelten für alle `status`-Werte, kein `status='published'`-Filter im
  Admin-Endpoint).
- **Ergebnis der Prüfung**: "Keine Inhalte vorhanden" ist das korrekte, ehrliche Verhalten einer tatsächlich
  leeren Tabelle — kein Anzeigefehler.

## Tatsächliche IDs der 3 Entwürfe

**Keine vorhanden.** Da das Insert-Skript nie ausgeführt wurde, existieren keine Zeilen und damit keine
`id`-Werte in der Datenbank. Die IDs würden von `gen_random_uuid()` erst beim tatsächlichen `INSERT` erzeugt.

## Testresultat (echter Datenbank-Read nach Schreiben)

**Noch nicht durchführbar** — der Schreibvorgang hat noch nicht stattgefunden, ich habe keinen Weg, ihn selbst
auszuführen (keine Datenbank-Zugangsdaten verfügbar). Der nächste tatsächliche Test ist:

1. Founder führt `backend/scripts/seed_blog_drafts.sql` einmalig im Supabase SQL-Editor aus.
2. Founder öffnet `/admin/content`, prüft Tab "Alle" und Tab "blog" — beide sollten dann 3 Zeilen mit
   `status: draft`, den 3 Titeln und den 3 Slugs zeigen.
3. Ich verifiziere das Ergebnis danach real — entweder anhand eines von dir geteilten Screenshots/Browser-Tabs
   von `/admin/content`, oder indem du mir das SQL-Ergebnis der Abfrage `select id, content_type, slug, title,
   status from vt_content_items where content_type = 'blog';` zurückschickst.

**Keine Erfolgsmeldung ohne diesen Schritt** — dieses Dokument macht bewusst keine Angabe "erledigt", solange
Schritt 1–3 nicht tatsächlich stattgefunden haben.
