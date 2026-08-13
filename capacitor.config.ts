import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitaltwin.app',
  appName: 'VitalTwin',
  webDir: '.next',
  server: {
    // Canonical production origin — vitaltwin.de 308-redirects here, and a
    // cross-origin redirect makes Capacitor hand navigation to Chrome instead
    // of loading it in-app.
    url: 'https://www.vitaltwin.de',
    cleartext: false,
  },
};

export default config;
