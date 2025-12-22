import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.alclean.app",
  appName: "AlcleanApp",
  webDir: "dist",
  server: {
    cleartext: true,
  },
};

export default config;

