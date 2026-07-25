import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ungakadai.medoctor',
  appName: 'Me & Doctor',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#FAF6EE',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#FAF6EE',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
