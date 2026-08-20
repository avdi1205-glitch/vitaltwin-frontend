# VitalTwin Play Store Setup

This project can be published to Google Play via Capacitor (Android wrapper around the live web app).

## 1. Install dependencies

```bash
npm install
```

## 2. Create Android project (first time)

```bash
npx cap add android
```

## 3. Sync latest web app settings

```bash
npm run mobile:sync
```

## 4. Open Android Studio

```bash
npm run mobile:android
```

## 5. Release keystore (already created — read this before rebuilding)

A real release keystore already exists at `android/app/vitaltwin-release.keystore`
(RSA 2048, ~27 years validity, alias `vitaltwin`). Its store/key password lives
**only** in `android/app/keystore.properties` (gitignored, never committed) —
`android/app/build.gradle`'s `signingConfigs.release` block reads it automatically.

**CRITICAL — BACKUP BOTH FILES NOW, BEFORE THE FIRST PLAY STORE UPLOAD:**

- If `vitaltwin-release.keystore` is ever lost, **the app can never be updated
  again** — Google Play permanently binds the app's package name to this one
  signing key. There is no recovery path, no "reset key" option once a release
  has been uploaded with it.
- Back up **both** `android/app/vitaltwin-release.keystore` (the key material)
  and the password from `android/app/keystore.properties` (via a password
  manager) — separately, in at least 2 secure locations (e.g. encrypted cloud
  storage + a local offline copy). Losing either one alone is enough to lose
  the ability to update the app.
- Known SHA256 fingerprints (public, not secret — needed later for Play
  Console App Links / Google Sign-In configuration):
  - Release: `6A:11:26:24:37:E4:85:59:F9:FC:70:08:3E:BD:A1:7B:2F:A0:59:4A:E6:FC:50:C7:B3:1A:8F:BE:50:13:30:12`
  - Debug (`%USERPROFILE%\.android\debug.keystore`, alias `androiddebugkey`, password `android`):
    `4F:E4:4A:1F:F3:1E:0F:3E:DF:2E:8B:7E:72:1A:48:07:58:D5:AB:65:8C:B1:B6:08:95:BB:87:59:90:18:51:24`

## 6. Build Play Store bundle

In Android Studio:

1. Build -> Generate Signed Bundle / APK
2. Android App Bundle (AAB)
3. Use the existing `android/app/vitaltwin-release.keystore` (see Section 5) —
   Android Studio can read the password automatically if you point it at
   `android/app/keystore.properties`, or reuses what's already configured via
   `build.gradle`'s `signingConfigs.release`.
4. Build release AAB

Upload the `.aab` file to Google Play Console.

## 7. App Links (Google Health OAuth callback + password reset)

Confirmed empirically (real emulator + CDP, not just code reading): navigating
from the app's WebView to a DIFFERENT origin than `https://www.vitaltwin.de`
(e.g. `accounts.google.com`, or the OAuth callback on `api.vitaltwin.de`) hands
off to the external system browser — this is unavoidable, since Google Health
OAuth and this app's own backend live on a different domain than the WebView's
`server.url`. Same-origin navigation (`https://www.vitaltwin.de/*`, e.g.
`/passwort-bestaetigen`) correctly stays inside the app already — no change
needed there.

To bring the user back into the app after that external round trip, the app
now declares a **verified Android App Link** for `https://www.vitaltwin.de`
and `https://vitaltwin.de` (`AndroidManifest.xml`'s `android:autoVerify="true"`
intent-filter) — `MainActivity.java` also now routes the WebView to the exact
deep-linked URL (path + query params) on both cold start and while already
running (`onNewIntent`, works because `launchMode="singleTask"` was already
set), which Capacitor does NOT do automatically for a hosted-mode app.

**REQUIRED before this actually verifies on a real device — manual action
outside this repo:**
1. Deploy `public/.well-known/assetlinks.json` (already added, lists both the
   release AND debug SHA256 fingerprints from Section 5) so it's reachable at
   `https://www.vitaltwin.de/.well-known/assetlinks.json` — this is a normal
   Vercel deploy, no separate DNS/hosting step needed since it's just a static
   file in `public/`.
2. After that's live, verify it with Google's own Statement List
   generator/tester: https://developers.google.com/digital-asset-links/tools/generator
3. Android verifies App Links automatically on install by fetching that URL —
   no Play Console action is required for `autoVerify` itself, but Play
   Console's "App content" → "Deep links" report is the easiest place to
   confirm verification succeeded after the app is actually installed from
   Play (sideloaded debug/local builds verify against the live assetlinks.json
   too, using the debug fingerprint already included above).

## Notes

- `capacitor.config.ts` uses the live URL `https://www.vitaltwin.de` (canonical,
  `https://vitaltwin.de` 308-redirects here — a cross-origin redirect would
  otherwise hand navigation off to an external browser instead of the in-app
  WebView).
- For fully offline-native packaging later, replace `server.url` with a local web build flow.
- Ensure legal pages are live before submitting to Play Store:
  - `/impressum`
  - `/datenschutz`

