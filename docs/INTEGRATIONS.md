# VitalTwin — Full Integration Catalog (INTEGRATIONS.md)

> Vollständiger, ehrlicher Katalog aller Integrationskategorien aus
> `backend/app/core/integrations.py`. Live abrufbar über
> `GET /api/admin/integrations` (Berechtigung `view_integrations`) und
> sichtbar in der Admin-Seite `/admin/integrations`. Dieses Dokument
> spiegelt exakt den Code wider — bei Abweichung gilt immer der Code als
> Wahrheit, nicht diese Datei.

## Plattformen (`platforms`)

| ID | Name | Status | Hinweis |
|---|---|---|---|
| `web` | Web | ✅ configured | Next.js, responsive (Tailwind) |
| `tablet` | Tablet | ✅ configured | Abgedeckt durch responsives Web-Layout, kein separater Build |
| `android` | Android | ✅ configured | Capacitor-WebView-Wrapper lädt vitaltwin.de — kein natives Health-Connect-SDK |
| `ios` | iOS | ⬜ not_implemented | Kein Capacitor-iOS-Projekt vorhanden (erfordert macOS + Xcode) |

## Health- & Wearable-Connectoren (`health_connectors`)

Alle 9 sind `not_implemented`. Details: [CONNECTORS.md](./CONNECTORS.md).

`apple_health`, `google_health_connect`, `fitbit`, `garmin`, `oura`,
`polar`, `withings`, `abbott_libre`, `dexcom`.

## Zahlungsanbieter (`payment_providers`)

| ID | Name | Status | Hinweis |
|---|---|---|---|
| `stripe` | Stripe | ✅ configured, sobald `STRIPE_SECRET_KEY` gesetzt ist | Implementiert: Abonnements (`routers/payments.py`). **Nicht** implementiert: Einmalzahlungen, Gutscheine/Rabattcodes, Rechnungsstellung |
| `paypal` | PayPal | ⬜ not_implemented | Kein Code-Pfad — Architektur folgt derselben Kategorie wie Stripe |

## Affiliate-Netzwerke (`affiliate_networks`)

Alle 6 Netzwerk-*APIs* sind `not_implemented` (kein automatischer Produkt-
Import, kein automatischer Provisions-Abgleich). Das generische
Affiliate-Management-System selbst (Produkte, Freigabe-Workflow, Tracking,
Analytics, Blacklist, A/B-Tests) ist real implementiert — siehe
[AFFILIATE_PLATFORM.md](./AFFILIATE_PLATFORM.md). Partnerprogramme werden
manuell im Admin-Bereich unter „Affiliate Center → Partnerprogramme"
angelegt und gepflegt.

`amazon_partnernet`, `awin`, `digistore24`, `cj_affiliate`, `impact`,
`tradedoubler`.

## Login-Anbieter (`auth_providers`)

| ID | Name | Status | Hinweis |
|---|---|---|---|
| `email` | E-Mail + Passwort | ✅ configured | bcrypt-gehashte Passwörter (`routers/users.py::register/login`) |
| `google` | Google Sign-In | ✅ configured, sobald `GOOGLE_CLIENT_ID` gesetzt ist | Code vorhanden (`routers/users.py::google_login`) |
| `apple` | Sign in with Apple | ⬜ not_implemented | — |
| `microsoft` | Microsoft Login | ⬜ not_implemented | — |
| `passkeys` | Passkeys (WebAuthn) | ⬜ not_implemented | Erfordert eigene WebAuthn-Relying-Party-Implementierung, kein Drittanbieter-Key nötig |

## KI-Anbieter (`ai_providers`)

| ID | Name | Status | Hinweis |
|---|---|---|---|
| `openai` | OpenAI | ✅ configured, sobald `OPENAI_API_KEY` gesetzt ist | `services/ai_provider.py::OpenAIProvider` — einzige aktive Implementierung der `AIProvider`-Schnittstelle |
| `anthropic` | Anthropic Claude | ⬜ not_implemented | Kein `AIProvider`-Subclass vorhanden |
| `gemini` | Google Gemini | ⬜ not_implemented | Kein `AIProvider`-Subclass vorhanden |

## Benachrichtigungskanäle (`notification_channels`)

| ID | Name | Status | Hinweis |
|---|---|---|---|
| `in_app` | In-App-Benachrichtigungen | ✅ configured | `vt_notifications`-Tabelle + `routers/notifications.py` |
| `email_transactional` | Transaktions-E-Mail | ✅ configured, sobald `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` gesetzt sind | Aktuell **nur** für das Kontaktformular genutzt (`routers/contact.py`) — kein generisches Transaktions-Mail-System |
| `push` | Push-Benachrichtigungen | ⬜ not_implemented | Kein Push-Provider (z. B. Firebase Cloud Messaging) angebunden |
| `newsletter` | Newsletter | ⬜ not_implemented | Kein Massen-Mail-System (z. B. Mailchimp/Brevo) angebunden |

## Wie der Status berechnet wird

Jede `configured`/`not_configured`-Unterscheidung basiert auf
`_env_present(*names)` in `core/integrations.py` — einer echten Prüfung,
ob die genannten Umgebungsvariablen zur Laufzeit nicht-leer gesetzt sind.
Es gibt keinen hartcodierten `"configured"`-Wert ohne Env-Check. Siehe
[API_KEYS.md](./API_KEYS.md) für die vollständige Env-Variablen-Zuordnung.
