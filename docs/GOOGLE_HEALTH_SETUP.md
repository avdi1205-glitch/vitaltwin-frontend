# Google Health — Setup Guide

Step-by-step instructions to configure a **real** Google Health OAuth client
and the corresponding VitalTwin environment variables. Nothing in this
integration works without completing every step below — there are no demo
credentials or mock tokens anywhere in the code.

## 1. Google Cloud Console — create the OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) and
   select (or create) the project VitalTwin already uses for Google
   Sign-In, or a new dedicated project — either works, since Google Health
   uses its **own, separate OAuth client**, not the existing Google Sign-In
   client.
2. Enable the **Google Health API** for that project (APIs & Services →
   Library → search "Google Health").
3. APIs & Services → Credentials → **Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Name: e.g. `VitalTwin Google Health`.
   - Authorized redirect URI: the exact, real backend callback URL —
     `https://api.vitaltwin.de/api/health/google/callback` in production
     (or your local tunnel URL while testing). This must be an HTTPS URL
     Google can actually reach; it must **exactly** match
     `GOOGLE_HEALTH_REDIRECT_URI` below, including trailing slashes.
4. Save. Note the generated **Client ID** and **Client Secret** — these are
   secrets, never commit them to git.

## 2. OAuth consent screen

1. APIs & Services → OAuth consent screen.
2. User type: **External** (VitalTwin users are not a Google Workspace
   organization).
3. Add the exact scopes requested by this integration (see
   `GOOGLE_HEALTH_DATA_MAPPING.md` for the full list) — Google's review
   process inspects the *declared* scopes against what your app's consent
   screen requests, so declare only what `core/health_oauth_service.py`'s
   `DEFAULT_SCOPES` actually requests.
4. While in **Testing** status: add every real Google account that should
   be able to test the connect flow under "Test users" (max 100). Refresh
   tokens issued in this mode expire after **7 days** — a test user will
   need to reconnect weekly until the app is verified/published.
5. Moving to **In production** requires Google's OAuth verification
   process. For the health-data scopes used here, this includes a
   **third-party security assessment** (Google's restricted-scope
   verification) — a real external process with real cost/time, not a
   toggle. **Do not describe any part of this integration as
   "production-ready" until this is complete** (per the explicit
   requirement in `GOOGLE_HEALTH_IMPLEMENTATION_REPORT.md`).

## 3. Backend environment variables (Railway)

Set these on the Railway service (see `.env.example` for the full list with
inline comments):

| Variable | Required | Example / notes |
|---|---|---|
| `GOOGLE_HEALTH_CLIENT_ID` | yes | from step 1 |
| `GOOGLE_HEALTH_CLIENT_SECRET` | yes | from step 1 — secret |
| `GOOGLE_HEALTH_REDIRECT_URI` | yes | must exactly match the Console entry |
| `HEALTH_TOKEN_ENCRYPTION_KEY` | yes | generate via the command below |
| `HEALTH_TOKEN_ENCRYPTION_KEY_VERSION` | no | defaults to `1` |
| `GOOGLE_HEALTH_AUTHORIZATION_URL` | no | defaults to the real Google endpoint |
| `GOOGLE_HEALTH_TOKEN_URL` | no | defaults to the real Google endpoint |
| `GOOGLE_HEALTH_REVOKE_URL` | no | defaults to the real Google endpoint |
| `GOOGLE_HEALTH_API_BASE_URL` | no | defaults to `https://health.googleapis.com/v4` |
| `GOOGLE_HEALTH_SCOPES` | no | comma-separated override of the default 3 scopes |
| `HEALTH_OAUTH_STATE_TTL_SECONDS` | no | defaults to `600` (10 minutes) |
| `HEALTH_INITIAL_SYNC_DAYS` | no | defaults to `30` |
| `HEALTH_SYNC_OVERLAP_HOURS` | no | defaults to `48` |
| `FRONTEND_BASE_URL` | already exists | reused, no change needed |
| `BACKEND_BASE_URL` | no | informational only, not read by any code path today |

Generate the encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## 4. Database migration

Run `backend/migrations/024_google_health_connections.sql` in the Supabase
SQL editor (it has **not** been run yet as of this writing — confirm this
before assuming any endpoint works). Creates: `user_health_connections`,
`health_oauth_states`, `health_sync_runs`, `health_activity_records`,
`health_sleep_records`, `health_metric_records`.

## 5. Verify

1. Log into VitalTwin as a real user (that has been added as a Google test
   user in step 2.4, unless the app is already verified/published).
2. Go to the dashboard, find the "Gesundheitsdaten verbinden" card, click
   "Mit Google Health verbinden".
3. You should land on Google's real consent screen listing the 3 requested
   scopes. Approve.
4. You should be redirected back to `/dashboard?health_connect=success`.
5. Click "Jetzt synchronisieren" — check `GET /api/health/data/activity`
   (via the browser dev tools network tab, with your session's bearer
   token) for real synced rows.

If any step fails, check `last_sync_error_code`/`last_sync_error_message` on
`GET /api/health/google/status` — every failure mode maps to one of the
documented internal error codes (see
`GOOGLE_HEALTH_IMPLEMENTATION_REPORT.md`), never a silent no-op.
