// Auth Service using Backend API
import { toast } from "sonner";
import { BACKEND_URL } from "./base-url";
import { getFirebaseAuth } from "./firebase-config";
import {
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { KeychainAccess, SecureStorage } from "@aparajita/capacitor-secure-storage";

export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  accessToken: string;
  expiresAt: string;
  authProvider?: "password" | "google" | "apple";
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
const SECURE_SESSION_KEY = "session";
const SESSION_MIGRATION_KEY = "alclean_secure_session_migrated_v1";
const REDIRECT_STORAGE_KEY = "alclean_redirect";
const RENEW_BEFORE_EXPIRY_MS = 24 * 60 * 60 * 1000;
const SENSITIVE_LOCAL_KEYS = [
  AUTH_STORAGE_KEY,
  "alclean_orders",
  "alclean_orders_cache",
  "alclean_orders_cache_timestamp",
  "alclean_notifications",
  "alclean_fcm_token",
  REDIRECT_STORAGE_KEY,
  "alclean_wishlist",
  "alclean_cart",
  "alclean_checkout",
];

type SessionProfile = Omit<User, "accessToken" | "expiresAt">;
interface StoredSession {
  [key: string]: unknown;
  user: SessionProfile;
  accessToken: string;
  expiresAt: string;
}

class AuthService {
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];
  private hydrated = false;
  private hydrationPromise: Promise<void>;
  private renewTimer: number | undefined;

  constructor() {
    this.hydrationPromise = this.initialize();
  }

  private assertSupportedPlatform(): void {
    if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
      throw new Error("Authentication is only available in the Android and iOS apps.");
    }
  }

  private async initialize(): Promise<void> {
    try {
      await SecureStorage.setKeyPrefix("alclean_");
      await SecureStorage.setSynchronize(false);
      await SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly);
      if (import.meta.env.PROD && !Capacitor.isNativePlatform()) {
        await SecureStorage.remove(SECURE_SESSION_KEY);
        this.clearSensitiveLocalData();
        return;
      }
      if (localStorage.getItem(SESSION_MIGRATION_KEY) !== "complete") {
        await SecureStorage.remove(SECURE_SESSION_KEY);
        this.clearSensitiveLocalData();
        localStorage.setItem(SESSION_MIGRATION_KEY, "complete");
        return;
      }
      const stored = (await SecureStorage.get(SECURE_SESSION_KEY)) as StoredSession | null;
      if (!stored?.user || !stored.accessToken || !stored.expiresAt) return;
      this.user = { ...stored.user, accessToken: stored.accessToken, expiresAt: stored.expiresAt };
      if (this.isExpired(stored.expiresAt)) {
        await this.clearSession(false);
      } else if (this.shouldRenew(stored.expiresAt)) {
        await this.renewSession();
      } else {
        this.scheduleRenewal();
      }
    } catch (error) {
      console.error("[Auth] Failed to hydrate secure session:", error);
      // Fail closed without depending on the plugin that just failed. Calling
      // clearSession() here would invoke SecureStorage again and could reject
      // the hydration promise, preventing the application from rendering.
      this.user = null;
      this.clearSensitiveLocalData();
      if (this.renewTimer !== undefined) window.clearTimeout(this.renewTimer);
      this.renewTimer = undefined;
      try {
        await SecureStorage.remove(SECURE_SESSION_KEY);
      } catch (cleanupError) {
        console.error("[Auth] Secure session cleanup skipped:", cleanupError);
      }
    } finally {
      this.hydrated = true;
      this.notifyListeners();
    }
  }

  whenReady(): Promise<void> {
    return this.hydrationPromise;
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  private clearSensitiveLocalData(): void {
    SENSITIVE_LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
    Object.keys(localStorage)
      .filter(
        (key) =>
          key.startsWith("alclean_order") ||
          key.startsWith("alclean_notification") ||
          key.startsWith("alclean_checkout") ||
          key.startsWith("alclean_wishlist"),
      )
      .forEach((key) => localStorage.removeItem(key));
  }

  private toStoredSession(user: User): StoredSession {
    const { accessToken, expiresAt, ...profile } = user;
    return { user: profile, accessToken, expiresAt };
  }

  private getExpiryTime(expiresAt: string | Date | undefined): number {
    if (expiresAt instanceof Date) return expiresAt.getTime();
    if (typeof expiresAt !== "string") return Number.NaN;
    return Date.parse(expiresAt);
  }

  private normalizeExpiry(expiresAt: string | Date | undefined): string | null {
    const expiry = this.getExpiryTime(expiresAt);
    return Number.isFinite(expiry) ? new Date(expiry).toISOString() : null;
  }

  private isExpired(expiresAt: string | Date): boolean {
    const expiry = this.getExpiryTime(expiresAt);
    return !Number.isFinite(expiry) || expiry <= Date.now();
  }

  private shouldRenew(expiresAt: string | Date): boolean {
    return this.getExpiryTime(expiresAt) - Date.now() <= RENEW_BEFORE_EXPIRY_MS;
  }

  private scheduleRenewal(): void {
    if (this.renewTimer !== undefined) window.clearTimeout(this.renewTimer);
    if (!this.user) return;
    const delay = Math.max(
      0,
      this.getExpiryTime(this.user.expiresAt) -
        Date.now() -
        RENEW_BEFORE_EXPIRY_MS,
    );
    this.renewTimer = window.setTimeout(
      () => {
        if (this.user && this.shouldRenew(this.user.expiresAt)) {
          void this.renewSession();
        } else {
          this.scheduleRenewal();
        }
      },
      Math.min(delay, 2_147_483_647),
    );
  }

  private async saveUser(user: User | null): Promise<void> {
    if (user) {
      const expiresAt = this.normalizeExpiry(user.expiresAt);
      if (!user.accessToken || !expiresAt) {
        throw new Error(
          "The authentication server returned a session without a valid expiry. Deploy the updated backend and try again.",
        );
      }
      this.user = { ...user, expiresAt };
      await SecureStorage.set(
        SECURE_SESSION_KEY,
        this.toStoredSession(this.user),
      );
      this.scheduleRenewal();
    } else {
      this.user = null;
      await SecureStorage.remove(SECURE_SESSION_KEY);
      if (this.renewTimer !== undefined) window.clearTimeout(this.renewTimer);
      this.renewTimer = undefined;
    }
    this.notifyListeners();
  }

  private async clearSession(clearLocalData = true): Promise<void> {
    if (clearLocalData) this.clearSensitiveLocalData();
    await this.saveUser(null);
  }

  private async renewSession(): Promise<void> {
    const token = this.user?.accessToken;
    if (!token) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/renew`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Session renewal failed (${response.status})`);
      const data = await response.json();
      if (!data?.success || !data.user?.accessToken || !data.user?.expiresAt) {
        throw new Error("Session renewal returned invalid data");
      }
      data.user.authProvider = this.user?.authProvider;
      await this.saveUser(data.user as User);
    } catch (error) {
      console.error("[Auth] Session renewal failed:", error);
      await this.invalidateSession();
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
    if (!this.user || this.isExpired(this.user.expiresAt)) return null;
    return this.user.accessToken;
  }

  private async clearNativeSocialSession(): Promise<void> {
    try {
      await FirebaseAuthentication.signOut();
      console.log("[Auth] Native social session cleared");
    } catch (error) {
      console.log("[Auth] Native signOut skipped:", error);
    }
  }

  private getGoogleSignInErrorMessage(error: any): string {
    const rawMessage = error?.message || "";
    const rawCode = error?.code;
    const codeText = String(rawCode ?? "");
    const lowerMessage = rawMessage.toLowerCase();
    const isDeveloperError =
      rawCode === 10 ||
      codeText === "10" ||
      lowerMessage.includes("status code: 10") ||
      lowerMessage.includes("developer_error") ||
      lowerMessage.includes("code 10");

    if (isDeveloperError) {
      if (Capacitor.getPlatform() === "android") {
        return "Google Sign-In is misconfigured for this Android build. Add this build's SHA-1 and SHA-256 fingerprints to Firebase for com.alclean.app, then download the updated google-services.json and rebuild the app.";
      }

      if (Capacitor.getPlatform() === "ios") {
        return "Google Sign-In is misconfigured for iOS. Verify the iOS app bundle, URL scheme, and GoogleService-Info.plist for com.alclean.app, then rebuild the app.";
      }
    }

    return rawMessage || "Failed to start Google login";
  }

  private async finishSocialLogin(
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
        await this.clearNativeSocialSession();
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
      const authProvider = endpoint.includes("apple-login")
        ? "apple"
        : endpoint.includes("google-login")
          ? "google"
          : undefined;
      await this.updateUser({ ...data.user, authProvider });
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
    this.assertSupportedPlatform();
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

      const user = await this.logIn(email, password);
      toast.success("Account created successfully!");
      return user;
    } catch (error: any) {
      console.error("[Auth] Sign up error:", error);
      throw error;
    }
  }

  // Log in with backend API
  async logIn(email: string, password: string): Promise<User> {
    this.assertSupportedPlatform();
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

      user.authProvider = "password";
      await this.saveUser(user);
      toast.success("Logged in successfully!");
      return user;
    } catch (error: any) {
      console.error("[Auth] Login error:", error);
      throw error;
    }
  }

  // Google login with Firebase
  async googleLogin(forceOverride = false): Promise<SocialLoginResult> {
    this.assertSupportedPlatform();
    console.log("[Auth] Starting Google login");
    try {
      const isNative = Capacitor.isNativePlatform();
      const auth = isNative ? null : getFirebaseAuth();
      if (!isNative && !auth) {
        console.error("[Auth] Firebase Auth not available");
        throw new Error("Firebase Auth not available");
      }

      let idToken: string;

      if (isNative) {
        // For native platforms, use Capacitor Firebase Authentication plugin
        // This uses the native Google Sign-In SDK for a seamless experience
        console.log("[Auth] Starting native Google sign-in");

        try {
          // Sign in with Google using native SDK
          const platform = Capacitor.getPlatform();
          console.log("[Auth] Calling native Google sign-in", { platform });
          const result = await FirebaseAuthentication.signInWithGoogle(
            platform === "android"
              ? {
                  // Credential Manager can fail on some emulators with
                  // "no credentials available". Fallback to legacy API.
                  useCredentialManager: false,
                }
              : undefined,
          );
          console.log("[Auth] Native Google sign-in result:", result);

          if (!result.credential?.idToken) {
            throw new Error("No ID token received from Google sign-in");
          }

          idToken = result.credential.idToken;

          console.log("[Auth] Native Google sign-in successful");
        } catch (nativeError: any) {
          console.error("[Auth] Native Google sign-in error:", {
            code: nativeError?.code,
            message: nativeError?.message,
            platform: Capacitor.getPlatform(),
            isNative: Capacitor.isNativePlatform(),
          });
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
        const webAuth = auth;
        if (!webAuth) {
          throw new Error("Firebase Auth not available");
        }
        console.log("[Auth] Starting web Google popup sign-in");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        try {
        const result = await signInWithPopup(webAuth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.idToken) {
          throw new Error("No Google ID token received from popup sign-in");
        }
        idToken = credential.idToken;
        console.log("[Auth] Web Google sign-in successful");
        } catch (popupError: any) {
          if (popupError.code === "auth/popup-closed-by-user") {
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

      const result = await this.finishSocialLogin("/api/auth/google-login", {
        idToken,
        forceOverride,
      });
      if (result.success) {
        toast.success("Logged in with Google successfully!");
      }
      return result;
    } catch (error: any) {
      const friendlyMessage = this.getGoogleSignInErrorMessage(error);
      console.error("[Auth] Google login error:", {
        code: error?.code,
        message: error?.message || error,
        resolvedMessage: friendlyMessage,
      });
      toast.error(friendlyMessage);
      return { success: false, error: friendlyMessage };
    }
  }

  async appleLogin(forceOverride = false): Promise<SocialLoginResult> {
    this.assertSupportedPlatform();
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
      return { success: false, error: "Sign in with Apple is available on iOS only" };
    }

    try {
      const result = await FirebaseAuthentication.signInWithApple();
      if (!result.user) throw new Error("Apple sign-in did not return a user");
      const firebaseToken = await FirebaseAuthentication.getIdToken({
        forceRefresh: true,
      });
      if (!firebaseToken.token) throw new Error("Apple sign-in token is unavailable");

      const displayName = result.user.displayName?.trim() || "";
      const [firstName = "", ...remainingName] = displayName.split(/\s+/).filter(Boolean);
      const socialResult = await this.finishSocialLogin("/api/auth/apple-login", {
        idToken: firebaseToken.token,
        firstName,
        lastName: remainingName.join(" "),
        forceOverride,
      });
      if (socialResult.success) toast.success("Logged in with Apple successfully!");
      return socialResult;
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("cancel")) {
        toast.info("Login cancelled");
        return { success: false };
      }
      console.error("[Auth] Apple login error:", error);
      const friendlyMessage = message || "Apple login failed. Please try again.";
      toast.error(friendlyMessage);
      return { success: false, error: friendlyMessage };
    }
  }

  async deleteAccount(): Promise<void> {
    const currentUser = this.user;
    const accessToken = currentUser?.accessToken;
    if (!accessToken) throw new Error("You must be signed in to delete your account");

    let firebaseIdToken: string | undefined;
    if (Capacitor.isNativePlatform()) {
      const current = await FirebaseAuthentication.getCurrentUser();
      if (!current.user && currentUser.authProvider === "google") {
        await FirebaseAuthentication.signInWithGoogle(
          Capacitor.getPlatform() === "android"
            ? { useCredentialManager: false }
            : undefined,
        );
      }
      const refreshedCurrent = current.user
        ? current
        : await FirebaseAuthentication.getCurrentUser();
      const isAppleUser = refreshedCurrent.user?.providerData.some(
        (provider) => provider.providerId === "apple.com",
      ) || currentUser.authProvider === "apple";
      if (isAppleUser) {
        const reauthenticated = await FirebaseAuthentication.signInWithApple();
        const authorizationCode = reauthenticated.credential?.authorizationCode;
        if (!authorizationCode) {
          throw new Error("Apple reauthentication did not return an authorization code");
        }
        const token = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
        firebaseIdToken = token.token;
        await FirebaseAuthentication.revokeAccessToken({ token: authorizationCode });
      } else if (refreshedCurrent.user) {
        const token = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
        firebaseIdToken = token.token;
      }
      if (currentUser.authProvider && currentUser.authProvider !== "password" && !firebaseIdToken) {
        throw new Error("Please sign in again before deleting this social account");
      }
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/account`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(firebaseIdToken ? { firebaseIdToken } : {}),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || "Account deletion could not be completed");
    }

    await this.clearNativeSocialSession();
    await this.clearSession();
    toast.success("Your account has been permanently deleted");
  }

  // Log out
  private async invalidateSession(): Promise<void> {
    const accessToken = this.user?.accessToken ?? null;
    const detail: { accessToken: string | null; tasks: Promise<unknown>[] } = {
      accessToken,
      tasks: [],
    };
    window.dispatchEvent(new CustomEvent("alclean-before-logout", { detail }));
    await Promise.allSettled(detail.tasks);
    await this.clearNativeSocialSession();
    await this.clearSession();
  }

  async logOut(): Promise<void> {
    await this.invalidateSession();
    toast.success("Logged out successfully");
  }

  async handleUnauthorizedResponse(response: Response): Promise<boolean> {
    if (response.status !== 401) return false;
    await this.invalidateSession();
    return true;
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

      if (await this.handleUnauthorizedResponse(response)) {
        return [];
      }

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
    this.assertSupportedPlatform();
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
  async updateUser(updatedUser: User): Promise<void> {
    await this.saveUser(updatedUser);
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
