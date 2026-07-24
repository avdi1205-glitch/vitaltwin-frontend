# VitalTwin — API Keys & Env Vars per Integration (API_KEYS.md)

> Zeigt exakt, welche Umgebungsvariable(n) welche Integration aus
> `core/integrations.py` von `not_configured` auf `configured` schalten.
> Spiegelt `required_env_vars` aus der Registry. **Werte selbst stehen
> ausschließlich in `backend/.env` (lokal, gitignored) bzw. in den
> Railway-Umgebungsvariablen der Produktionsumgebung — niemals in Docs,
> Code oder Commits.**

## Bereits gesetzt (produktiv verifiziert)

| Integration | Env-Variable(n) | Genutzt in |
|---|---|---|
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | `routers/payments.py` |
| Stripe Preise | `STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_PRICE_PREMIUM_YEARLY` | `routers/payments.py` |
| OpenAI | `OPENAI_API_KEY` | `services/ai_provider.py::OpenAIProvider` |
| Transaktions-E-Mail (SMTP) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | `routers/contact.py` |
| Kontaktformular-Empfänger | `CONTACT_NOTIFY_EMAIL` | `routers/contact.py` |
| JWT-Auth | `JWT_SECRET_KEY` | `core/auth.py` |
| Datenbank | `SUPABASE_URL`, `SUPABASE_KEY` | `app/main.py` / überall |

## Noch nicht gesetzt (Integration existiert im Code, aber "not_configured")

| Integration | Env-Variable(n) | Effekt sobald gesetzt |
|---|---|---|
| Google Sign-In | `GOOGLE_CLIENT_ID` | `auth_providers.google` → `configured` |

## Noch nicht gesetzt UND kein Code-Pfad vorhanden (`not_implemented`)

Diese Env-Variablen sind **geplante Namen** für den Fall, dass die
jeweilige Integration eines Tages gebaut wird. Sie zu setzen hat aktuell
**keinerlei Effekt** — es gibt keinen Code, der sie liest:

| Integration | Geplante Env-Variable(n) |
|---|---|
| PayPal | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` |
| Anthropic Claude | `ANTHROPIC_API_KEY` |
| Google Gemini | `GEMINI_API_KEY` |
| Sign in with Apple | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` |
| Microsoft Login | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` |
| Push-Benachrichtigungen | `FCM_SERVER_KEY` |

Health-Connectoren (Fitbit, Garmin, Oura, Polar, Withings, Dexcom etc.)
haben noch keine geplanten Env-Variablen-Namen, da vor der Implementierung
erst OAuth-App-Registrierungen bei den jeweiligen Anbietern nötig sind
(siehe [CONNECTORS.md](./CONNECTORS.md)).

## Regel für neue Integrationen

Ein Env-Variablen-Name darf erst in diese Tabelle als "bereits gesetzt"
oder "noch nicht gesetzt" (mit Code-Pfad) aufgenommen werden, wenn
`core/integrations.py` ihn tatsächlich über `_env_present(...)` prüft.
Sonst gehört er in den letzten Abschnitt ("kein Code-Pfad vorhanden").
