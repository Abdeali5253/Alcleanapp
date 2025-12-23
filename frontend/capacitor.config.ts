import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alclean.app",
  appName: "AlClean",
  webDir: "dist",
  server: {
    cleartext: true,
    androidScheme: "http",  // Changed to HTTP to allow cleartext connections
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#6DB33F",
      sound: "default",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6DB33F",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
