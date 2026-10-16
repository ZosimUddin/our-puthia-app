import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ourputhia.app',
  appName: 'আমাদের পুঠিয়া',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
