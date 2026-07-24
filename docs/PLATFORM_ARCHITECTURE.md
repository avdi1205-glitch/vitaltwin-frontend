# VitalTwin — Platform Architecture (PLATFORM_ARCHITECTURE.md)

> Erstellt für **"VitalTwin Release 0 — Platform Foundation & Integration
> Architecture"**. Beschreibt, wie das Backend als Integrationsplattform
> aufgebaut ist: eine einzige Registry (`core/integrations.py`), die den
> echten Status jeder Health-, Payment-, Affiliate-, Login-, KI- und
> Benachrichtigungs-Anbindung beschreibt — niemals vorgetäuscht.

## 1. Grundprinzip: eine Wahrheit, ein Ort

`backend/app/core/integrations.py` ist die **einzige Quelle der Wahrheit**
für den Status jeder Integration im System. Kein anderer Teil des Codes,
der Doku oder des Admin-UIs darf einen Integrationsstatus unabhängig davon
behaupten. Jede der sieben Kategorien (`platforms`, `health_connectors`,
`payment_providers`, `affiliate_networks`, `auth_providers`, `ai_providers`,
`notification_channels`) wird von einer eigenen `get_*()`-Funktion
zurückgegeben, die eine Liste von `IntegrationInfo`-Einträgen liefert.

Jeder Eintrag hat exakt einen von drei Status:

| Status | Bedeutung |
|---|---|
| `configured` | Code-Pfad existiert **und** die nötigen Env-Variablen sind gesetzt. Funktioniert live. |
| `not_configured` | Code-Pfad existiert, aber mindestens eine benötigte Env-Variable fehlt. |
| `not_implemented` | Kein Code-Pfad vorhanden. Es gibt nichts, das man "konfigurieren" könnte. |

Es gibt **keinen** vierten Zustand, der etwas vortäuscht. `not_implemented`
wird im Admin-UI immer als "Noch nicht eingerichtet" angezeigt — niemals
als funktionierendes Feature mit Fake-Zahlen.

## 2. Warum eine Registry statt verstreuter Checks

Vor dieser Architektur war der Integrationsstatus (z. B. "ist Stripe
konfiguriert?") an verschiedenen Stellen implizit über `if os.getenv(...)`
verstreut — im Admin-Dashboard, im System-Status-Endpunkt, in Docs, die
schnell veralteten. Das führte dazu, dass Doku und UI sich widersprechen
konnten. Die Registry löst das, indem:

- jede Kategorie **eine** Funktion hat, die den Status live aus echten
  Env-Variablen berechnet (`_env_present(*names)` — nie hartcodiert),
- der Admin-Endpunkt `GET /api/admin/integrations`
  (`routers/admin.py::list_integrations`) direkt
  `get_full_integration_report()` zurückgibt — keine eigene Logik,
- die Doku (`CONNECTORS.md`, `INTEGRATIONS.md`, `API_KEYS.md`) den Inhalt
  der Registry beschreibt statt eine Parallel-Wahrheit zu pflegen.

## 3. Kategorien im Überblick

| Kategorie | Anzahl Einträge | Wie viele `implemented=True`? |
|---|---|---|
| `platforms` | 4 (Web, Tablet, Android, iOS) | 3 |
| `health_connectors` | 9 | 0 |
| `payment_providers` | 2 (Stripe, PayPal) | 1 |
| `affiliate_networks` | 6 | 0 |
| `auth_providers` | 5 (E-Mail, Google, Apple, Microsoft, Passkeys) | 2 |
| `ai_providers` | 3 (OpenAI, Anthropic, Gemini) | 1 |
| `notification_channels` | 4 (In-App, Transaktions-E-Mail, Push, Newsletter) | 2 |

Details pro Kategorie: siehe [CONNECTORS.md](./CONNECTORS.md) für Health/
Wearables, [INTEGRATIONS.md](./INTEGRATIONS.md) für den vollständigen
Katalog aller Kategorien, [API_KEYS.md](./API_KEYS.md) für die konkrete
Env-Variable pro Integration.

## 4. Datenmodell (Migration 011)

`backend/migrations/011_platform_foundation.sql` legt die Tabellen an, die
diese Architektur voraussetzt, aber die noch nicht alle aktiv befüllt
werden:

- **`vt_notifications`** — real genutzt von `routers/notifications.py`
  (In-App-Benachrichtigungen).
- **`vt_feature_flags`** — real genutzt von den Feature-Flag-Endpunkten in
  `routers/admin.py` (siehe [FEATURE_FLAGS.md](./FEATURE_FLAGS.md)).
- **`vt_affiliate_partners`**, **`vt_affiliate_clicks`**,
  **`vt_affiliate_sales`** — Schema vorbereitet, aber kein
  Affiliate-Netzwerk ist angebunden (0 von 6 `implemented`). Diese
  Tabellen sind aktuell leer und werden von keinem Endpunkt beschrieben.
- **`vt_coupons`** — Schema vorbereitet für Rabattcodes, aber Stripe-Coupon-
  Unterstützung ist nicht implementiert (siehe `payment_providers`-Notiz zu
  Stripe in [INTEGRATIONS.md](./INTEGRATIONS.md)).

Diese Migration muss wie alle vorherigen (001–010) manuell im Supabase-
SQL-Editor ausgeführt werden — es gibt keine automatische Migrations-
Pipeline in diesem Projekt.

## 5. Admin-Oberfläche

`GET /api/admin/integrations` (Berechtigung `view_integrations`) liefert
den vollständigen Report. Die Admin-Seite
[`frontend/app/admin/integrations/page.tsx`](../app/admin/integrations/page.tsx)
rendert jede Kategorie als Karten-Grid mit Status-Badge (grün = konfiguriert,
rot = nicht konfiguriert, neutral = noch nicht eingerichtet) und den
Hinweistext aus dem jeweiligen `note`-Feld. Auf derselben Seite werden
Feature Flags verwaltet (Berechtigung `manage_feature_flags`).

## 6. Erweiterungspfad

Eine neue Integration hinzuzufügen bedeutet immer:

1. Einen neuen `IntegrationInfo`-Eintrag in der passenden `get_*()`-Funktion
   in `core/integrations.py` anlegen — mit ehrlichem Status.
2. Falls ein echter Code-Pfad gebaut wird: `implemented=True` setzen und
   `required_env_vars` mit den tatsächlich geprüften Variablennamen füllen.
3. Die betroffene Doku-Datei (`CONNECTORS.md`/`INTEGRATIONS.md`/
   `API_KEYS.md`) entsprechend aktualisieren.
4. Niemals den Status hart auf `"configured"` setzen, ohne dass
   `_env_present(...)` das tatsächlich verifiziert.
