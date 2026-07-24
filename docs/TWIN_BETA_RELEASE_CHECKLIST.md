# VitalTwin — Twin Beta Release Checklist (TWIN_BETA_RELEASE_CHECKLIST.md)

> Erstellt in **Etappe 10 (Twin Intelligence Core — Beta-Abnahme)**.
> Praktische Checkliste für Deployment, Rollback und offene
> Umgebungsvariablen — ergänzend zu
> [TWIN_BETA_TEST_REPORT.md](./TWIN_BETA_TEST_REPORT.md) (Testergebnisse)
> und [TWIN_BETA_LIMITATIONS.md](./TWIN_BETA_LIMITATIONS.md) (bekannte
> Grenzen).

## 1. Umgesetzte Funktionen (Stand Etappe 1–10)

- Legacy: Registrierung/Login (inkl. Google), Passwort-Reset, biologischer
  Alter-Rechner mit Szenarien, Stripe-Checkout, Beta-Bewerbung.
- Twin Intelligence Core: Profil, Daily Check-in, Habit Loop, Goal Loop,
  Recommendation/Decision/Outcome/Feedback Loop, Twin Memory + Pattern
  Detection + Learning Events, Daily Planning + Evening/Weekly Reflection +
  Monthly-Grundlage + Twin-Reifegrad, Twin Context Engine + AI-Provider-
  Abstraktion + "Frag deinen Twin", Dashboard-Integration ("Du und dein
  KI-Zwilling"), Privacy-Controls (Export/Löschung/Consent).

## 2. Funktionierende Loops (siehe TWIN_BETA_TEST_REPORT.md §2 für Details)

- ✅ Recommendation Loop (Empfehlung → Entscheidung → Ergebnis → Feedback)
- ✅ Memory Loop (Beobachtung → Kandidat → aktiv → bestätigt/korrigiert/
  abgelehnt/archiviert/gelöscht)
- ✅ Daily Planning Loop (Kontext → max. 3 priorisierte Aktionen →
  Entscheidung → Umsetzung)
- ✅ Weekly Reflection Loop (Datenvergleich → Entwicklungen/Routinen/
  Potenzial)
- ✅ Voller Ende-zu-Ende-Loop (Check-in → Regel → Empfehlung →
  Entscheidung → Plan-Aktion → Ergebnis → Feedback → Präferenz →
  angepasste nächste Empfehlung) — siehe `test_full_loop_integration.py`

## 3. Deployment-Checkliste

### 3.1 Backend (Railway)

- [ ] `SUPABASE_URL`, `SUPABASE_KEY` gesetzt und zeigen auf das
      Produktions-Supabase-Projekt (nicht auf ein Test-/Dev-Projekt).
- [ ] Alle Migrationen `001` bis `008` in Reihenfolge einmalig im Supabase
      SQL-Editor ausgeführt (bislang **nie** ausgeführt — siehe
      BACKUP_AND_RESTORE.md/DATA_RETENTION.md).
- [ ] `JWT_SECRET_KEY` gesetzt (nicht der unsichere Dev-Fallback!) und
      identisch über alle Backend-Instanzen hinweg.
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` gesetzt.
- [ ] `STRIPE_PRICE_PREMIUM_MONTHLY`/`_YEARLY`,
      `STRIPE_PRICE_PRO_MONTHLY`/`_YEARLY`,
      `STRIPE_PRICE_FAMILY_MONTHLY`/`_YEARLY` (oder Legacy
      `STRIPE_PRICE_ID`) gesetzt, je nachdem welche Tarife verkauft werden
      sollen.
- [ ] `GOOGLE_CLIENT_ID` gesetzt, falls Google-Login aktiv sein soll.
- [ ] `OPENAI_API_KEY` gesetzt — **ohne diesen Wert ist "Frag deinen
      Twin" nicht verfügbar** (liefert eine ehrliche 503-Fehlermeldung,
      kein Absturz, aber keine Funktion).
- [ ] `OPENAI_MODEL` optional (Default: `gpt-4o-mini`).
- [ ] `FRONTEND_BASE_URL` gesetzt (Default: `https://www.vitaltwin.de`).
- [ ] `pip install -r requirements.txt` (Produktion) ausgeführt, **nicht**
      `requirements-dev.txt` (nur für lokale Tests).
- [ ] Health-Check: `GET /` liefert `{"message": "VitalTwin Backend
      läuft"}`.

### 3.2 Frontend (Vercel)

- [ ] `NEXT_PUBLIC_API_BASE_URL` zeigt auf die Produktions-Backend-URL.
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` gesetzt, falls Google-Login aktiv.
- [ ] `NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY` (+ ggf. weitere Tarif-
      Preis-IDs) gesetzt und identisch mit den Backend-Werten.
- [ ] `npm run build` erfolgreich (in dieser Session verifiziert: 26
      Routen, 0 Fehler).
- [ ] `npm run lint` und `npx tsc --noEmit` fehlerfrei (in dieser Session
      verifiziert).

### 3.3 Nach dem Deployment

- [ ] Ein echter Registrierungs-/Login-Durchlauf auf der Produktions-URL.
- [ ] Ein echter Check-in + eine echte Empfehlungserzeugung (verifiziert,
      dass die Migrationen tatsächlich angewendet wurden).
- [ ] Ein echter "Frag deinen Twin"-Aufruf (verifiziert `OPENAI_API_KEY`).
- [ ] Ein echter Datenexport-Download.
- [ ] Stripe-Testkauf im Test-Modus (falls verfügbar) vor dem ersten echten
      Verkauf.

## 4. Rollback-Checkliste

- [ ] **Code-Rollback:** vorheriges Deployment über das Railway-/
      Vercel-Dashboard erneut aktivieren (beide Plattformen unterstützen
      Rollback auf ein vorheriges Deployment ohne Datenbankänderung).
- [ ] **Datenbank-Rollback:** ausschließlich über eine Supabase
      Point-in-Time-Recovery (siehe BACKUP_AND_RESTORE.md) — es gibt keine
      automatisierten Down-Migrationen in diesem Projekt (additive
      Migrationen benötigen normalerweise keine).
- [ ] Nach jedem Rollback: erneuter Health-Check (`GET /`) und ein
      Login-Test, um sicherzustellen, dass JWTs weiterhin gültig sind
      (setzt voraus, dass `JWT_SECRET_KEY` unverändert blieb).
- [ ] Bei einem fehlerhaften Migrationslauf: **nicht** die betroffene
      Tabelle manuell per `drop`/`truncate` bereinigen — stattdessen die
      Migration erneut ausführen (alle Statements sind `if not exists`-
      geschützt, ein erneuter Lauf ist sicher) oder Point-in-Time-Recovery
      nutzen.

## 5. Fehlende/zu prüfende Umgebungsvariablen (Zusammenfassung)

| Variable | Pflicht für | Status in dieser Session |
|---|---|---|
| `SUPABASE_URL` / `SUPABASE_KEY` | alles | nicht gesetzt (kein Infra-Zugriff) |
| `JWT_SECRET_KEY` | sichere Logins | nicht gesetzt, unsicherer Dev-Fallback aktiv |
| `OPENAI_API_KEY` | "Frag deinen Twin" | nicht gesetzt |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Zahlungen | nicht gesetzt |
| `STRIPE_PRICE_*` (Backend + `NEXT_PUBLIC_STRIPE_PRICE_*` Frontend) | verkaufbare Tarife | nicht gesetzt |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google-Login | nicht gesetzt |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend→Backend-Verbindung | nicht gesetzt (Fallback auf `localhost:8000` in Dev) |

Alle diese Variablen fehlen ausschließlich, weil diese Coding-Session
keinen Zugriff auf die Produktionsumgebung hatte — der Code behandelt
jeden fehlenden Wert ohne Absturz (ehrliche Fehlermeldung statt
Stacktrace), siehe jeweilige Router-Implementierung.
