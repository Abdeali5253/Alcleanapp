import { Capacitor } from "@capacitor/core";

// EC2 / Production backend (no extra slash)
const PRODUCTION_BACKEND_URL = "http://44.232.17.149:3001";

// Vite envs (ONLY import.meta.env in frontend)
const USE_PRODUCTION =
  (import.meta.env.VITE_USE_PRODUCTION as string | undefined) === "true";

const getBackendUrl = (): string => {
  const platform = Capacitor.getPlatform();

  // Force production URL for mobile apps (Android/iOS) since backend is remote
  if (platform === "android" || platform === "ios") {
    console.log("[BaseURL] Mobile platform, forcing production URL:", PRODUCTION_BACKEND_URL);
    return PRODUCTION_BACKEND_URL;
  }

  // explicit env override for web
  const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
  if (envUrl) {
    console.log("[BaseURL] Using env VITE_BACKEND_URL:", envUrl);
    return envUrl;
  }

  // production mode for web
  if (USE_PRODUCTION) {
    console.log("[BaseURL] Using PRODUCTION URL:", PRODUCTION_BACKEND_URL);
    return PRODUCTION_BACKEND_URL;
  }

  // web development
  console.log("[BaseURL] Web platform, using: http://localhost:3001");
  return "http://localhost:3001";
};

export const BACKEND_URL = getBackendUrl();
console.log("[BaseURL] Final BACKEND_URL:", BACKEND_URL);
