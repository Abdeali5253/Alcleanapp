import { Capacitor } from "@capacitor/core";

// Backend URL configuration
// For Android emulator: 10.0.2.2 is the special IP to reach host machine's localhost
// For physical device: Use your computer's local IP address

const getBackendUrl = (): string => {
  const platform = Capacitor.getPlatform();
  
  // Check for environment variable first
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl) {
    console.log("[BaseURL] Using env VITE_BACKEND_URL:", envUrl);
    return envUrl;
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
