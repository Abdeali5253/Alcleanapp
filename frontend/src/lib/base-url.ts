import { Capacitor } from "@capacitor/core";

// Backend URL configuration
// For Android emulator: 10.0.2.2 is the special IP to reach host machine's localhost
// For physical device: Use your computer's local IP address
// For production: Use EC2 public IP or domain

// PRODUCTION EC2 URL - Update this when deploying to production
const PRODUCTION_BACKEND_URL = "http://44.251.139.38:3001";

// Set to true for production builds, false for development
const USE_PRODUCTION = (import.meta as any).env?.VITE_USE_PRODUCTION === "true" || false;

const getBackendUrl = (): string => {
  const platform = Capacitor.getPlatform();
  
  // Check for explicit environment variable first
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl) {
    console.log("[BaseURL] Using env VITE_BACKEND_URL:", envUrl);
    return envUrl;
  }
  
  // Use production URL if flag is set
  if (USE_PRODUCTION) {
    console.log("[BaseURL] Using PRODUCTION URL:", PRODUCTION_BACKEND_URL);
    return PRODUCTION_BACKEND_URL;
  }
  
  if (platform === "android") {
    // Android emulator uses 10.0.2.2 to reach host's localhost
    // For physical device, you'll need to use your computer's IP
    const androidUrl = "http://10.0.2.2:3001";
    console.log("[BaseURL] Android platform, using:", androidUrl);
    return androidUrl;
  }
  
  if (platform === "ios") {
    // iOS simulator can use localhost directly
    const iosUrl = "http://localhost:3001";
    console.log("[BaseURL] iOS platform, using:", iosUrl);
    return iosUrl;
  }
  
  // Web platform
  console.log("[BaseURL] Web platform, using: http://localhost:3001");
  return "http://localhost:3001";
};

export const BACKEND_URL = getBackendUrl();
console.log("[BaseURL] Final BACKEND_URL:", BACKEND_URL);
