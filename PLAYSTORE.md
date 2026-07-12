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

## 5. Build Play Store bundle

In Android Studio:

1. Build -> Generate Signed Bundle / APK
2. Android App Bundle (AAB)
3. Use your release keystore
4. Build release AAB

Upload the `.aab` file to Google Play Console.

## Notes

- Current config uses the live URL `https://vitaltwin.de` in `capacitor.config.ts`.
- For fully offline-native packaging later, replace `server.url` with a local web build flow.
- Ensure legal pages are live before submitting to Play Store:
  - `/impressum`
  - `/datenschutz`
