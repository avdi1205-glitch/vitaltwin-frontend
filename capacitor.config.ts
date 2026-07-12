import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vitaltwin.app',
  appName: 'VitalTwin',
  webDir: '.next',
  server: {
    // Use the live website as source so Android can run immediately.
    url: 'https://vitaltwin.de',
    cleartext: false,
  },
};

export default config;
