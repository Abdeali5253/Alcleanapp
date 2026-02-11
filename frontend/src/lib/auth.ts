// Auth Service using Backend API
import { toast } from "sonner";
import { BACKEND_URL } from "./base-url";
import { getFirebaseAuth } from "./firebase-config";
import {
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  accessToken: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: { amount: string; currencyCode: string };
  lineItems: any[];
}

export interface SocialLoginResult {
  success: boolean;
  requiresOverride?: boolean;
  error?: string;
}

const AUTH_STORAGE_KEY = "alclean_auth";
const REDIRECT_STORAGE_KEY = "alclean_redirect";

class AuthService {
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.loadUser();
  }

  private loadUser(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.user = JSON.parse(stored);
      }
    } catch (error) {
      console.error("[Auth] Failed to load user:", error);
    }
  }

  private saveUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      this.user = user;
      this.notifyListeners();
    } catch (error) {
      console.error("[Auth] Failed to save user:", error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.user));
  }

  subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.user);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  getUser(): User | null {
    return this.user;
  }

  isLoggedIn(): boolean {
    return this.user !== null;
  }

  getAccessToken(): string | null {
    return this.user?.accessToken || null;
  }

  private async clearNativeGoogleSession(auth: any): Promise<void> {
    try {
      await FirebaseAuthentication.signOut();
    } catch (error) {
      console.log("[Auth] Native signOut skipped:", error);
    }

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.log("[Auth] Firebase signOut skipped:", error);
    }
  }

  private async finishSocialLogin(
    auth: any,
    endpoint: string,
    payload: Record<string, any>,
  ): Promise<SocialLoginResult> {
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const backendError =
        data?.error || `Social login failed (HTTP ${response.status})`;

      if (Capacitor.isNativePlatform()) {
        await this.clearNativeGoogleSession(auth);
      }

      if (data?.code === "ACCOUNT_EXISTS_PASSWORD_LOGIN") {
        return {
          success: false,
          requiresOverride: true,
          error: backendError,
        };
      }

      toast.error(backendError);
      return { success: false, error: backendError };
    }

    if (data?.success) {
      authService.updateUser(data.user);
      return { success: true };
    }

    const msg = data?.error || "Social login failed";
    toast.error(msg);
    return { success: false, error: msg };
  }

  // Sign up with backend API
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phone?: string,
  ): Promise<User> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          phone,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create account");
      }

      const user: User = {
        ...data.user,
        accessToken: "", // Will be set after login
      };

      this.saveUser(user);
      toast.success("Account created successfully!");
      return user;
    } catch (error: any) {
      console.error("[Auth] Sign up error:", error);
      throw error;
    }
  }

  // Log in with backend API
  async logIn(email: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to login");
      }

      const user: User = data.user;

      this.saveUser(user);
      toast.success("Logged in successfully!");
      return user;
    } catch (error: any) {
      console.error("[Auth] Login error:", error);
      throw error;
    }
  }

  // Google login with Firebase
  async googleLogin(forceOverride = false): Promise<SocialLoginResult> {
    console.log("[Auth] Starting Google login");
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        console.error("[Auth] Firebase Auth not available");
        throw new Error("Firebase Auth not available");
      }

      let idToken: string;

      if (Capacitor.isNativePlatform()) {
        // For native platforms, use Capacitor Firebase Authentication plugin
        // This uses the native Google Sign-In SDK for a seamless experience
        console.log("[Auth] Starting native Google sign-in");

        try {
          // Force account picker instead of silently reusing last Google account.
          await this.clearNativeGoogleSession(auth);

          // Sign in with Google using native SDK
          const result = await FirebaseAuthentication.signInWithGoogle({
            // Credential Manager can fail on some emulators with
            // "no credentials available". Fallback to legacy API.
            useCredentialManager: false,
          });
          console.log("[Auth] Native Google sign-in result:", result);

          if (!result.credential?.idToken) {
            throw new Error("No ID token received from Google sign-in");
          }

          idToken = result.credential.idToken;

          // Also sign in to Firebase Auth for consistency
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);

          console.log("[Auth] Native Google sign-in successful");
        } catch (nativeError: any) {
          console.error("[Auth] Native Google sign-in error:", nativeError);
          if (
            nativeError.message?.includes("canceled") ||
            nativeError.message?.includes("cancelled")
          ) {
            toast.info("Login cancelled");
            return { success: false };
          }
          throw nativeError;
        }
      } else {
        // For web, use popup
        console.log("[Auth] Starting web Google popup sign-in");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.idToken) {
          throw new Error("No Google ID token received from popup sign-in");
        }
        idToken = credential.idToken;
        console.log("[Auth] Web Google sign-in successful");
        } catch (popupError: any) {
          if (popupError.code === "auth/popup-closed-by-user") {
            console.log("[Auth] Popup closed by user");
            toast.info("Login cancelled");
            return { success: false };
          } else if (popupError.code === "auth/popup-blocked") {
            console.error("[Auth] Popup blocked by browser");
            toast.error(
              "Please allow popups for this site to use Google login",
            );
            return { success: false };
          }
          throw popupError;
        }
      }

      // Send ID token to backend
      console.log("[Auth] Sending ID token to backend");
      const result = await this.finishSocialLogin(auth, "/api/auth/google-login", {
        idToken,
        forceOverride,
      });
      if (result.success) {
        toast.success("Logged in with Google successfully!");
      }
      return result;
    } catch (error: any) {
      console.error("[Auth] Google login error:", error.message || error);
      toast.error(error.message || "Failed to start Google login");
      return { success: false, error: error.message || "Failed to start Google login" };
    }
  }

  // Log out
  logOut(): void {
    this.saveUser(null);
    toast.success("Logged out successfully");
  }

  // Get order history
  async getOrders(): Promise<Order[]> {
    if (!this.user?.accessToken) {
      return [];
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/customer`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.user.accessToken}`,
        },
      });

      const data = await response.json();

      if (!data.success) {
        console.error("[Auth] Get orders error:", data.error);
        return [];
      }

      return data.orders || [];
    } catch (error) {
      console.error("[Auth] Get orders error:", error);
      return [];
    }
  }

  // Password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/recover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to send password reset email");
      }

      toast.success("Password reset email sent!");
    } catch (error: any) {
      console.error("[Auth] Password reset error:", error);
      throw error;
    }
  }

  // Get current user (for order service)
  getCurrentUser(): User | null {
    return this.user;
  }

  // Update user profile
  updateUser(updatedUser: User): void {
    this.user = updatedUser;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    this.notifyListeners();
  }

  // Redirect management
  setRedirectAfterLogin(path: string): void {
    localStorage.setItem(REDIRECT_STORAGE_KEY, path);
  }

  getRedirectAfterLogin(): string | null {
    const path = localStorage.getItem(REDIRECT_STORAGE_KEY);
    localStorage.removeItem(REDIRECT_STORAGE_KEY);
    return path;
  }
}

export const authService = new AuthService();
