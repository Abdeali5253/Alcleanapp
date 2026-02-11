import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alclean.app",
  appName: "AlClean",
  webDir: "dist",
  server: {
    androidScheme: "https", // Changed to HTTPS to allow secure deep links
    iosScheme: "https",
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
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
      googleClientIds: [
        "310536726569-kp1kugnvltrp06qsdjcfih2vph97un9p.apps.googleusercontent.com",
        "310536726569-a149jog5uamvb1vr35l1oblv4rci5kbq.apps.googleusercontent.com",
      ],
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
