// Auth Service using Shopify Storefront API
import { toast } from "sonner";
import { 
  customerCreate, 
  customerAccessTokenCreate, 
  getCustomer, 
  customerRecover 
} from "./shopify";

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

const AUTH_STORAGE_KEY = 'alclean_auth';
const REDIRECT_STORAGE_KEY = 'alclean_redirect';

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
    this.listeners.forEach(callback => callback(this.user));
  }

  subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.user);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
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

  // Sign up with Shopify
  async signUp(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    phone?: string
  ): Promise<User> {
    try {
      const customer = await customerCreate(email, password, firstName, lastName, phone);
      
      const user: User = {
        id: customer.id,
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`.trim(),
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone || '',
        accessToken: customer.accessToken,
      };

      this.saveUser(user);
      toast.success("Account created successfully!");
      return user;
    } catch (error: any) {
      console.error("[Auth] Sign up error:", error);
      throw error;
    }
  }

  // Log in with Shopify
  async logIn(email: string, password: string): Promise<User> {
    try {
      const accessToken = await customerAccessTokenCreate(email, password);
      const customer = await getCustomer(accessToken);
      
      if (!customer) {
        throw new Error("Failed to get customer details");
      }

      const user: User = {
        id: customer.id,
        email: customer.email,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || email,
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
        accessToken,
      };

      this.saveUser(user);
      toast.success("Logged in successfully!");
      return user;
    } catch (error: any) {
      console.error("[Auth] Login error:", error);
      throw error;
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
      const customer = await getCustomer(this.user.accessToken);
      if (!customer?.orders?.edges) {
        return [];
      }

      return customer.orders.edges.map((edge: any) => ({
        id: edge.node.id,
        orderNumber: edge.node.orderNumber,
        processedAt: edge.node.processedAt,
        financialStatus: edge.node.financialStatus,
        fulfillmentStatus: edge.node.fulfillmentStatus,
        totalPrice: edge.node.totalPrice,
        lineItems: edge.node.lineItems.edges.map((li: any) => li.node),
      }));
    } catch (error) {
      console.error("[Auth] Get orders error:", error);
      return [];
    }
  }

  // Password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await customerRecover(email);
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
    this.notifySubscribers();
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
