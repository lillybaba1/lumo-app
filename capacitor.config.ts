import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.julazone.app',
  appName: 'JulaZone',
  webDir: 'out',
  server: {
    url: 'https://julazone.com',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#d946ef',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#d946ef',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
    StatusBar: {
      backgroundColor: '#d946ef',
      style: 'LIGHT',
      overlaysWebView: false,
    },
  },
};

export default config;
