import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alclean.app",
  appName: "AlClean",
  webDir: "dist",
  server: {
    androidScheme: "http", // Changed to HTTP to allow cleartext connections
    iosScheme: "http",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      iconColor: "#6DB33F",
      sound: "default",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6DB33F",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    webContentsDebuggingEnabled: true,
  },
};

export default config;
