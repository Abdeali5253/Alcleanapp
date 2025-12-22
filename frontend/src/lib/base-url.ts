import { Capacitor } from "@capacitor/core";
export const BACKEND_URL =
  Capacitor.getPlatform() === "android"
    ? "http://10.0.2.2:3001"
    : "http://localhost:3001";
