// Shopify Customer Authentication Service
// Handles customer registration, login, and profile management

import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  accessToken?: string;
  shopifyCustomerId?: string;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  acceptsMarketing: boolean;
  orders?: {
    edges: {
      node: {
        id: string;
        orderNumber: number;
        processedAt: string;
        financialStatus: string;
        fulfillmentStatus: string;
        totalPrice: { amount: string; currencyCode: string };
        lineItems: {
          edges: {
            node: {
              title: string;
              quantity: number;
              variant: {
                price: { amount: string };
                image: { url: string } | null;
              } | null;
            };
          }[];
        };
      };
    }[];
  };
}

const AUTH_STORAGE_KEY = 'alclean_auth';
const REDIRECT_STORAGE_KEY = 'alclean_redirect_after_login';

// Shopify Customer API Configuration
const SHOPIFY_STORE_DOMAIN = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOPIFY_STORE_DOMAIN : '';
const SHOPIFY_STOREFRONT_TOKEN = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN : '';
const SHOPIFY_API_VERSION = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOPIFY_API_VERSION : '2025-07';

const SHOPIFY_URL = SHOPIFY_STORE_DOMAIN 
  ? `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`
  : '';

// GraphQL Mutations for Shopify Customer
const CREATE_CUSTOMER = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
        firstName
        lastName
        phone
        acceptsMarketing
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const CREATE_ACCESS_TOKEN = `
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const GET_CUSTOMER = `
  query getCustomer($accessToken: String!) {
    customer(customerAccessToken: $accessToken) {
      id
      email
      firstName
      lastName
      phone
      acceptsMarketing
      orders(first: 10, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            orderNumber
            processedAt
            financialStatus
            fulfillmentStatus
            totalPrice {
              amount
              currencyCode
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    price {
                      amount
                    }
                    image {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const UPDATE_CUSTOMER = `
  mutation customerUpdate($accessToken: String!, $customer: CustomerUpdateInput!) {
    customerUpdate(customerAccessToken: $accessToken, customer: $customer) {
      customer {
        id
        email
        firstName
        lastName
        phone
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const RECOVER_CUSTOMER = `
  mutation customerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

// Shopify GraphQL fetch helper
async function shopifyCustomerFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error("Shopify is not configured");
  }

  const res = await fetch(SHOPIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();

  if (json.errors?.length) {
    console.error("[Auth] GraphQL errors:", json.errors);
    throw new Error(json.errors.map((e: any) => e.message).join(", "));
  }

  return json.data;
}

class AuthService {
  private user: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.loadUser();
  }

  // Load user from localStorage
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

  // Save user to localStorage
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

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.user));
  }

  // Subscribe to auth changes
  subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.user); // Call immediately with current state
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Get current user
  getUser(): User | null {
    return this.user;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.user !== null;
  }

  // Sign up with Shopify
  async signUp(email: string, password: string, firstName: string, lastName: string, phone?: string): Promise<User> {
    try {
      // Create customer in Shopify
      const createResult = await shopifyCustomerFetch<any>(CREATE_CUSTOMER, {
        input: {
          email,
          password,
          firstName,
          lastName,
          phone: phone || null,
          acceptsMarketing: true,
        },
      });

      if (createResult.customerCreate.customerUserErrors?.length > 0) {
        const errors = createResult.customerCreate.customerUserErrors;
        throw new Error(errors.map((e: any) => e.message).join(", "));
      }

      const customer = createResult.customerCreate.customer;

      // Now create access token (log in)
      const tokenResult = await shopifyCustomerFetch<any>(CREATE_ACCESS_TOKEN, {
        input: { email, password },
      });

      if (tokenResult.customerAccessTokenCreate.customerUserErrors?.length > 0) {
        throw new Error("Account created but failed to log in. Please try logging in.");
      }

      const accessToken = tokenResult.customerAccessTokenCreate.customerAccessToken.accessToken;

      const user: User = {
        id: customer.id,
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`.trim(),
        phone: customer.phone || '',
        accessToken,
        shopifyCustomerId: customer.id,
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
      // Create access token
      const tokenResult = await shopifyCustomerFetch<any>(CREATE_ACCESS_TOKEN, {
        input: { email, password },
      });

      if (tokenResult.customerAccessTokenCreate.customerUserErrors?.length > 0) {
        const errors = tokenResult.customerAccessTokenCreate.customerUserErrors;
        throw new Error(errors.map((e: any) => e.message).join(", "));
      }

      const accessToken = tokenResult.customerAccessTokenCreate.customerAccessToken.accessToken;

      // Get customer details
      const customerResult = await shopifyCustomerFetch<any>(GET_CUSTOMER, {
        accessToken,
      });

      const customer = customerResult.customer;
      
      if (!customer) {
        throw new Error("Failed to get customer details");
      }

      const user: User = {
        id: customer.id,
        email: customer.email,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || email,
        phone: customer.phone || '',
        accessToken,
        shopifyCustomerId: customer.id,
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

  // Update user profile
  async updateProfile(updates: { firstName?: string; lastName?: string; phone?: string }): Promise<User> {
    if (!this.user?.accessToken) {
      throw new Error("Not logged in");
    }

    try {
      const result = await shopifyCustomerFetch<any>(UPDATE_CUSTOMER, {
        accessToken: this.user.accessToken,
        customer: updates,
      });

      if (result.customerUpdate.customerUserErrors?.length > 0) {
        const errors = result.customerUpdate.customerUserErrors;
        throw new Error(errors.map((e: any) => e.message).join(", "));
      }

      const customer = result.customerUpdate.customer;
      
      const updatedUser: User = {
        ...this.user,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        phone: customer.phone || '',
      };

      this.saveUser(updatedUser);
      toast.success("Profile updated successfully!");
      return updatedUser;
    } catch (error: any) {
      console.error("[Auth] Update profile error:", error);
      throw error;
    }
  }

  // Get customer with orders
  async getCustomerWithOrders(): Promise<ShopifyCustomer | null> {
    if (!this.user?.accessToken) {
      return null;
    }

    try {
      const result = await shopifyCustomerFetch<any>(GET_CUSTOMER, {
        accessToken: this.user.accessToken,
      });

      return result.customer;
    } catch (error) {
      console.error("[Auth] Get customer error:", error);
      return null;
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const result = await shopifyCustomerFetch<any>(RECOVER_CUSTOMER, {
        email,
      });

      if (result.customerRecover.customerUserErrors?.length > 0) {
        const errors = result.customerRecover.customerUserErrors;
        throw new Error(errors.map((e: any) => e.message).join(", "));
      }

      toast.success("Password reset email sent!");
    } catch (error: any) {
      console.error("[Auth] Password reset error:", error);
      throw error;
    }
  }

  // Set redirect after login
  setRedirectAfterLogin(path: string): void {
    localStorage.setItem(REDIRECT_STORAGE_KEY, path);
  }

  // Get and clear redirect after login
  getRedirectAfterLogin(): string | null {
    const path = localStorage.getItem(REDIRECT_STORAGE_KEY);
    localStorage.removeItem(REDIRECT_STORAGE_KEY);
    return path;
  }
}

// Export singleton instance
export const authService = new AuthService();
