import { Capacitor } from "@capacitor/core";

// EC2 / Production backend (no extra slash)
const PRODUCTION_BACKEND_URL = "http://44.232.17.149:3001";

// Vite envs (ONLY import.meta.env in frontend)
const USE_PRODUCTION =
  (import.meta.env.VITE_USE_PRODUCTION as string | undefined) === "true";

const getBackendUrl = (): string => {
  const platform = Capacitor.getPlatform();

  // explicit env override
  const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
  if (envUrl) {
    console.log("[BaseURL] Using env VITE_BACKEND_URL:", envUrl);
    return envUrl;
  }

  // production mode
  if (USE_PRODUCTION) {
    console.log("[BaseURL] Using PRODUCTION URL:", PRODUCTION_BACKEND_URL);
    return PRODUCTION_BACKEND_URL;
  }

  // android
  if (platform === "android") {
    const androidUrl = "http://10.0.2.2:3001";
    console.log("[BaseURL] Android platform, using:", androidUrl);
    return androidUrl;
  }

  // ios
  if (platform === "ios") {
    const iosUrl = "http://localhost:3001";
    console.log("[BaseURL] iOS platform, using:", iosUrl);
    return iosUrl;
  }

  // web
  console.log("[BaseURL] Web platform, using: http://localhost:3001");
  return "http://localhost:3001";
};

export const BACKEND_URL = getBackendUrl();
console.log("[BaseURL] Final BACKEND_URL:", BACKEND_URL);
