// Auth Service using Backend API
import { toast } from "sonner";
import { BACKEND_URL } from "./base-url";
import { getFirebaseAuth } from "./firebase-config";
import { signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { Capacitor } from "@capacitor/core";

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
  async googleLogin(): Promise<void> {
    console.log("[Auth] Starting Google login");
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        console.error("[Auth] Firebase Auth not available");
        throw new Error("Firebase Auth not available");
      }

      console.log("[Auth] Firebase Auth available, creating provider");
      const provider = new GoogleAuthProvider();
      console.log("[Auth] Starting Google redirect");

      await signInWithRedirect(auth, provider);
      // The redirect will happen, result handled in App.tsx
    } catch (error: any) {
      console.error("[Auth] Google login error:", error.message || error);
      toast.error(error.message || "Failed to start Google login");
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
