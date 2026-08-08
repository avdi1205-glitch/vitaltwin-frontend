# CONTENT_MANAGEMENT_EDITOR_REPORT.md

## Wichtiger Hinweis vorab (aus der Lektion der letzten Runde)

Dieser Bericht behauptet **nicht**, dass alles bereits live funktioniert. Ich habe den Code geschrieben, mit
echten (gemockten) Backend-Tests abgesichert und den Frontend-Build erfolgreich durchlaufen lassen — aber ich
habe **keinen Admin-Zugang** und kann `/admin/content` daher nicht selbst im Browser durchklicken. Der
tatsächliche Live-Test (Artikel öffnen, bearbeiten, speichern, Vorschau, veröffentlichen) steht noch aus und
muss von dir bestätigt werden.

**Bevor du testest, ist ein Schritt zwingend notwendig**: Migration `026_content_items_metadata.sql` muss
einmalig im Supabase SQL-Editor ausgeführt werden (fügt die neuen Spalten `excerpt`, `category`, `tags`,
`meta_title`, `meta_description` zur bestehenden Tabelle `vt_content_items` hinzu). **Ohne diesen Schritt wird
Speichern im neuen Editor wahrscheinlich fehlschlagen**, da die Datenbank die neuen Felder nicht kennt.

## Geänderte/neue Dateien

**Backend:**
- `backend/migrations/026_content_items_metadata.sql` (neu) — `alter table ... add column if not exists` für
  `excerpt`, `category`, `tags`, `meta_title`, `meta_description`. Keine neue Tabelle, bestehendes Modell
  erweitert.
- `backend/app/routers/admin.py` — `ContentInput` um die 5 neuen optionalen Felder erweitert.
  `GET /api/admin/content` unterstützt jetzt zusätzlich `?status=`-Filter. Neu: `GET
  /api/admin/content/{id}` (Einzeldatensatz, 404 wenn nicht gefunden), `POST
  /api/admin/content/{id}/publish` (validiert Titel/Slug/Inhalt + Slug-Eindeutigkeit, setzt
  `status=published` + `published_at`), `POST /api/admin/content/{id}/unpublish` (setzt `status=draft`
  zurück, **löscht `published_at` nicht** — bleibt als Historie erhalten, Daten gehen nie verloren). Neue
  Hilfsfunktion `_find_slug_conflict()` verhindert doppelte Slugs pro `content_type` (409 statt rohem
  DB-Fehler). `update_content` gibt jetzt den aktualisierten Datensatz zurück (vorher nur eine Erfolgsmeldung)
  und liefert 404, wenn die ID nicht existiert.
- `backend/tests/test_admin_content_editing.py` (neu, 11 Tests) — deckt Einzel-GET, Slug-Konflikt bei
  Create/Update (inkl. Regressionstest, dass ein Artikel seinen EIGENEN Slug behalten darf), Publish
  (Erfolg + fehlender Titel/Slug/Inhalt), Unpublish (inkl. dass `published_at` erhalten bleibt), Status-Filter
  ab.

**Frontend:**
- `frontend/app/components/blog-content-renderer.tsx` (neu) — gemeinsame Render-/Excerpt-/Datumsformat-Logik,
  jetzt von `/blog`, `/blog/[slug]` UND der neuen Admin-Vorschau gemeinsam genutzt (keine Duplizierung mehr).
- `frontend/app/admin/content/[id]/page.tsx` (neu) — voller Editor: Titel, Slug, Content Type, Status,
  Kategorie, Tags, Excerpt, Artikelinhalt (großes, mitwachsendes Textfeld, min. 420px hoch, Wortzähler),
  Meta Title, Meta Description. Buttons: Speichern, Veröffentlichen (nur aktiv/sichtbar wenn Titel+Slug+Inhalt
  vorhanden UND Status ≠ published), Zurück zu Entwurf (nur bei published), Archivieren, Zurück, Löschen
  (mit `window.confirm`-Bestätigungsdialog, optisch nicht hervorgehoben).
- `frontend/app/admin/content/[id]/preview/page.tsx` (neu) — Admin-only-Vorschau (läuft über den
  authentifizierten `/api/admin/content/{id}`-Endpunkt, NICHT über die öffentliche Blog-API — ein Draft ist
  dadurch strukturell nie öffentlich abrufbar). Zeigt Titel, Absätze, Überschriften, Disclaimer, exakt im
  gleichen Layout wie der spätere öffentliche Artikel (gemeinsame Render-Funktion).
- `frontend/app/admin/content/page.tsx` (überarbeitet) — jede Zeile ist jetzt eine anklickbare Karte
  (Titel verlinkt auf den Editor), zusätzlicher Status-Filter (Alle/draft/published/archived) neben dem
  bestehenden Typ-Filter, Aktionen "Öffnen"/"Vorschau"/"Veröffentlichen"/"Löschen" pro Zeile (Löschen mit
  Bestätigungsdialog), zeigt `content_type`, `created_by`, `updated_at`. Karten-Layout statt Tabelle — auf
  Mobilgeräten bricht nichts horizontal um, da keine feste Tabellenbreite mehr existiert.

## Wie Publish funktioniert

`POST /api/admin/content/{id}/publish` lädt den Datensatz, prüft serverseitig, dass Titel, Slug und Inhalt
vorhanden sind (422 mit genauer Angabe, was fehlt) und dass der Slug innerhalb desselben `content_type`
eindeutig ist (409 bei Konflikt), setzt danach `status=published`, `published_at` und `updated_at`. Der
Frontend-Button "Veröffentlichen" ist zusätzlich clientseitig deaktiviert, solange Titel/Slug/Inhalt leer sind
— Doppelabsicherung, kein reines Vertrauen auf die UI.

## Wie Draft-Zurücknahme funktioniert

`POST /api/admin/content/{id}/unpublish` setzt nur `status` zurück auf `draft` und aktualisiert `updated_at`.
`published_at` bleibt unverändert als Nachweis, wann der Artikel ursprünglich veröffentlicht wurde. Der
öffentliche Blog-Endpunkt (`GET /api/content/blog`) filtert ausschließlich nach `status='published'` — sobald
`unpublish` läuft, verschwindet der Artikel augenblicklich aus `/blog`, ohne dass irgendein Inhalt gelöscht
wird.

## Wie Vorschau funktioniert

Die Vorschau läuft über den **authentifizierten Admin-Endpunkt**, nicht über den öffentlichen
`/api/content/blog`-Endpunkt — ein Draft ist dadurch strukturell (nicht nur durch eine Statusprüfung) niemals
über den öffentlichen Pfad erreichbar. Rendering nutzt exakt dieselbe Funktion (`renderContentBody`) wie die
spätere echte Blogseite, damit die Vorschau wirklich der späteren Darstellung entspricht.

## Sicherheit

- Alle neuen Endpunkte verlangen `view_content`/`manage_content` über das bestehende
  `require_admin_permission()` — keine neue, parallele Auth-Logik.
- Kein `dangerouslySetInnerHTML` irgendwo im Blog-/Editor-/Vorschau-Code — Inhalte werden als reiner Text mit
  einer sehr kleinen, kontrollierten Menge an Markup (`##`, `###`, `- `) in JSX-Elemente umgewandelt. Dadurch
  gibt es strukturell keine Möglichkeit, über den Artikelinhalt ausführbares HTML/JavaScript einzuschleusen —
  unabhängig davon, was im Textfeld eingegeben wird.
- Slug-Eindeutigkeit wird serverseitig geprüft (409), nicht nur clientseitig.

## Getestete Artikel (automatisiert, mit synthetischen Testdaten — NICHT die 3 echten Live-Artikel)

Die 11 neuen Backend-Tests verwenden absichtlich synthetische Testdaten (nicht die 3 echten Artikel aus
Supabase), da automatisierte Tests niemals gegen die echte Produktionsdatenbank laufen (etabliertes Muster
in diesem gesamten Projekt). Sie decken exakt dieselben Codepfade ab, die die 3 echten Artikel beim Live-Test
durchlaufen würden.

## Was noch AUSSTEHT (per expliziter Anweisung keine Erfolgsmeldung ohne das)

- [ ] Migration `026_content_items_metadata.sql` in Supabase ausführen
- [ ] `/admin/content` öffnen, einen der 3 echten Artikel anklicken
- [ ] Text sehen und bearbeiten, speichern, Seite neu laden, Änderung ist noch da
- [ ] Vorschau öffnen
- [ ] Veröffentlichen, `/blog` und `/blog/[slug]` live prüfen
- [ ] Zurück auf Entwurf setzen, Artikel verschwindet wieder von `/blog`
- [ ] Löschen mit Bestätigungsdialog probieren (auf einem Testeintrag, nicht auf einem echten Artikel)

Diese Punkte kann nur der Founder mit echtem Admin-Login tatsächlich ausführen — ich vermelde bewusst
**keinen "fertig"-Status**, bis das geschehen ist und rückgemeldet wurde.
