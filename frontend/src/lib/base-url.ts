import { Capacitor } from "@capacitor/core";
export const BACKEND_URL =
  Capacitor.getPlatform() === "android"
    ? "" 
    : "http://localhost:3001";
