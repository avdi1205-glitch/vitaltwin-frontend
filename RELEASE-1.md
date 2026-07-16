# VitalTwin — Release 1

Diese Datei dokumentiert den Stand von "Release 1" (Blöcke 1–7). Sie ersetzt keine professionelle
Rechts- oder Sicherheitsberatung — sie ist eine ehrliche technische Bestandsaufnahme.

## 1. Funktionen von Release 1

- **Öffentliche Landingpage** mit Navigation, Hero, Funktionsübersicht, Preisvorschau, FAQ (Block 2)
- **Preisseite** mit 4 Tarifen (Free/Premium/Pro/Family), Monats-/Jahresumschalter, Vergleichstabelle,
  zentraler Tarif-/Berechtigungsstruktur (Block 3)
- **Wellness-Dashboard** mit Tagesübersicht, Gesamtstatus, biologischem Alter, "Heute für dich",
  Fortschritt, lokalem Gewohnheiten-Widget (Block 4)
- **Persönliches Profil** (Grundprofil, Wellness-Ziele, Alltag, echte Gewohnheiten-Verwaltung,
  Datenschutzkontrollen inkl. Export/Löschanfrage) + 5-Schritte-Onboarding (Block 5)
- **"Frag deinen Twin"**: KI-Wellness-Assistent mit mehrschichtigen Sicherheitsregeln, serverseitigen
  Tariflimits und Kostenkontrollen (Block 6)
- **Beta-Bewerbungsformular**, Stripe-Checkout (Premium live, Pro/Family/Jahres-Varianten kontrolliert
  als "Demnächst verfügbar", bis echte Preis-IDs konfiguriert sind)
- **Rechtsseiten**: Impressum, Datenschutz, AGB, Widerrufsrecht, Cookie-Einstellungen, KI-Hinweise (Block 7)
- **SEO-Grundlagen**: robots.txt, sitemap.xml, Open-Graph-Metadaten, `noindex` für eingeloggte Bereiche
- **Basis-Sicherheitshärtung**: Security-Header, serverseitiges Rate Limiting auf Register/Login/
  Beta-Bewerbung/Feedback, Preis-ID-Allowlist bei Stripe-Checkouts

## 2. Lokale Installation

**Backend** (`backend/`):
```powershell
cd backend
python -m venv venv
venv\Scripts\pip install -r requirements.txt
venv\Scripts\python -m uvicorn app.main:app --reload
```

**Frontend** (`frontend/`):
```powershell
cd frontend
npm install
npm run dev
```

## 3. Benötigte Umgebungsvariablen

Siehe `backend/.env.example` und `frontend/.env.example` für die vollständige, aktuelle Liste
(keine echten Werte in diesem Dokument). Kategorien:

- **Supabase**: `SUPABASE_URL`, `SUPABASE_KEY` (Backend)
- **JWT**: `JWT_SECRET_KEY` (Backend) — unbedingt in Produktion setzen, sonst unsicherer Dev-Fallback
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (Legacy) sowie je Tarif/Intervall
  `STRIPE_PRICE_{PREMIUM,PRO,FAMILY}_{MONTHLY,YEARLY}` (Backend), `NEXT_PUBLIC_STRIPE_PRICE_*` (Frontend, unkritisch)
- **KI-Chat**: `OPENAI_API_KEY`, optional `OPENAI_MODEL` (Backend)
- **Google Sign-In**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Frontend)
- **E-Mail/Sonstiges**: `FRONTEND_BASE_URL`, `STRIPE_TRIAL_DAYS`, `NEXT_PUBLIC_API_BASE_URL`,
  `NEXT_PUBLIC_ENABLE_PREMIUM_CHECKOUT`, `NEXT_PUBLIC_PREMIUM_PRICE_DISPLAY`

## 4. Datenbankmigrationen

Liegen unter `backend/migrations/`, müssen **manuell** im Supabase-SQL-Editor ausgeführt werden
(kein automatisierter Migrationslauf vorhanden). Alle Migrationen sind nicht-destruktiv
(`CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`), keine bestehende Tabelle wird verändert:

| Datei | Tabellen |
|---|---|
| `001_profile_wellness_foundation.sql` | `vt_user_profiles`, `vt_daily_wellness_entries`, `vt_habits`, `vt_habit_entries` |
| `002_chat_usage.sql` | `vt_chat_usage` |

**Bereits vor Release 1 bestehende Tabellen** (nicht als Migration versioniert, existieren bereits
live in Supabase): `vt_users`, `vt_user_feedback`, `vt_twin_calculations`, `vt_marker_reference`,
`vt_beta_applications`.

## 5. Stripe-Konfiguration

- Live-Modus bereits aktiv für Premium/monatlich (`STRIPE_PRICE_ID` bzw. `STRIPE_PRICE_PREMIUM_MONTHLY`)
- Webhook (`/api/payments/webhook`) verifiziert Signaturen über `STRIPE_WEBHOOK_SECRET` — muss in Stripe
  auf `https://<backend-domain>/api/payments/webhook` zeigen
- Pro/Family/Jahres-Tarife: Preise in Stripe anlegen, IDs in Railway (Backend, geheim) **und** Vercel
  (Frontend, `NEXT_PUBLIC_*`, unkritisch) eintragen — Buttons schalten sich automatisch frei

## 6. KI-Konfiguration ("Frag deinen Twin")

- `OPENAI_API_KEY` in Railway setzen, sonst bleibt die Funktion kontrolliert deaktiviert (klare Meldung,
  kein Absturz)
- Migration `002_chat_usage.sql` ausführen, sonst greift das Tageslimit nicht zuverlässig
- Modell konfigurierbar über `OPENAI_MODEL` (Default: `gpt-4o-mini`)

## 7. Bekannte Einschränkungen

- Datenbank unterscheidet weiterhin nur `premium: bool` — Pro/Family sind technisch nicht von Premium
  unterscheidbar (betrifft Preisseite, Dashboard-Tarifanzeige, Chat-Limits)
- Gewohnheiten existieren aktuell an zwei Stellen: lokal (Dashboard-Widget, Block 4) und im Backend
  (`/profil`, Block 5) — noch nicht vereinheitlicht
- Tagesübersicht im Dashboard bleibt bewusst leer, bis eine echte Datenquelle pro Wellness-Domäne
  angebunden ist
- Rate Limiting ist In-Memory (pro Prozess) — funktioniert für eine einzelne Backend-Instanz, nicht
  für horizontale Skalierung über mehrere Instanzen
- Kein automatisierter Test-Suite-Lauf (`pytest`/`jest`) vorhanden — Verifikation erfolgt über
  `tsc`/`lint`/`build` + manuelle/Playwright-gestützte Live-Tests
- "Frag deinen Twin" ohne gesetzten `OPENAI_API_KEY` nicht nutzbar (kontrolliert, nicht defekt)

## 8. Noch manuell zu erledigende Schritte

1. Migrationen `001_profile_wellness_foundation.sql` und `002_chat_usage.sql` in Supabase ausführen
2. `OPENAI_API_KEY` in Railway setzen, sobald ein echter KI-Anbieter gewünscht ist
3. Fehlende Stripe-Preise (Pro, Family, Premium-jährlich) in Stripe anlegen und IDs eintragen
4. Alle rechtlichen Platzhalter (Impressum-Angaben, Registernummer, verantwortliche Person, etc.)
   von einer tatsächlich befugten Person bzw. anwaltlich prüfen und vervollständigen lassen
5. Domain-Alias-Cache-Problem bei `/frag-deinen-twin` in Vercel prüfen (siehe Block-6-Bericht) —
   ggf. manuelles Redeploy/Cache-Purge im Vercel-Dashboard

## 9. Testbefehle

**Frontend:**
```powershell
cd frontend
npx tsc --noEmit -p tsconfig.json
npm run lint
npm run build
```

**Backend:**
```powershell
cd backend
venv\Scripts\python.exe -m py_compile app\main.py app\routers\*.py app\core\*.py
```

Es existiert keine automatisierte `pytest`/`jest`-Suite — funktionale Verifikation erfolgte in diesem
Release über direkte Live-API-Tests und Playwright-gestützte Browser-Tests gegen die Produktionsumgebung.

## 10. Deployment-Hinweise

- Frontend: Vercel, automatisches Deployment bei Push auf `main` im `vitaltwin-frontend`-Repo
- Backend: Railway, automatisches Deployment bei Push auf `main` im `vitaltwin-backend`-Repo
- Keine separate Staging-Umgebung vorhanden — alle Tests laufen gegen Produktion
- Nach jedem Deploy: kurze Wartezeit (~30–60s) vor Live-Verifikation einplanen

## 11. Rollback-Hinweis

- Frontend/Backend: im jeweiligen Vercel-/Railway-Dashboard auf das vorherige Deployment zurückrollen
  (beide Plattformen unterstützen "Redeploy previous version" ohne Code-Änderung)
- Datenbank: **keine der Release-1-Migrationen ist rückgängig zu machen nötig**, da ausschließlich neue,
  optionale Tabellen angelegt wurden — ein Rollback des Codes erfordert keinen DB-Rollback
- Falls eine neue Tabelle vollständig entfernt werden soll: manuell und bewusst in Supabase (nicht
  automatisiert, um versehentlichen Datenverlust auszuschließen)
