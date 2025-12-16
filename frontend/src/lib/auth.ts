/**
 * Authentication Service
 * Manages user authentication state for the AlClean shopping app
 * Integrated with Shopify Customer API for order tracking
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  shopifyCustomerId?: string; // Shopify customer ID for order tracking
}

const AUTH_STORAGE_KEY = 'alclean_auth';
const REDIRECT_STORAGE_KEY = 'alclean_redirect_after_login';

// Shopify Customer API Configuration
const SHOPIFY_STORE_DOMAIN = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOPIFY_STORE_DOMAIN : ";
const SHOPIFY_STOREFRONT_TOKEN = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN : ";

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
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const CUSTOMER_ACCESS_TOKEN_CREATE = `
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

const GET_CUSTOMER_ORDERS = `
  query getCustomerOrders($customerAccessToken: String!, $first: Int!) {
    customer(customerAccessToken: $customerAccessToken) {
      id
      email
      firstName
      lastName
      phone
      orders(first: $first) {
        edges {
          node {
            id
            orderNumber
            name
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
                    id
                    title
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

class AuthService {
  private user: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();
  private customerAccessToken: string | null = null;

  constructor() {
    this.loadUser();
  }

  /**
   * Load user from localStorage on initialization
   */
  private loadUser() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.user = data.user;
        this.customerAccessToken = data.accessToken || null;
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  }

  /**
   * Save user to localStorage
   */
  private saveUser(user: User | null, accessToken?: string | null) {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user,
          accessToken: accessToken || this.customerAccessToken
        }));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.user !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Shopify API call helper
   */
  private async shopifyFetch(query: string, variables: Record<string, any>): Promise<any> {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
      throw new Error('Shopify not configured');
    }

    const endpoint = `https://${SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (!res.ok || json.errors) {
      const msg = json.errors?.map((e: any) => e.message).join('; ') || res.statusText;
      throw new Error(`Shopify error: ${msg}`);
    }

    return json.data;
  }

  /**
   * Signup user - Creates Shopify customer account
   */
  async signup(name: string, email: string, password: string, phone?: string): Promise<User> {
    // If Shopify is configured, create customer in Shopify
    if (SHOPIFY_STORE_DOMAIN && SHOPIFY_STOREFRONT_TOKEN) {
      try {
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        const data = await this.shopifyFetch(CREATE_CUSTOMER, {
          input: {
            email,
            password,
            firstName,
            lastName,
            phone: phone || '',
          }
        });

        if (data.customerCreate.customerUserErrors?.length > 0) {
          throw new Error(data.customerCreate.customerUserErrors[0].message);
        }

        const shopifyCustomer = data.customerCreate.customer;
        
        // Now login to get access token
        return await this.login(email, password);
      } catch (error) {
        console.error('Shopify signup error:', error);
        // Fall back to mock signup
        return this.mockSignup(name, email, phone);
      }
    } else {
      // Mock signup for development
      return this.mockSignup(name, email, phone);
    }
  }

  /**
   * Mock signup for development
   */
  private mockSignup(name: string, email: string, phone?: string): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user: User = {
          id: Date.now().toString(),
          name,
          email,
          phone,
        };
        this.user = user;
        this.saveUser(user);
        this.notifyListeners();
        resolve(user);
      }, 500);
    });
  }

  /**
   * Login user - Authenticates with Shopify
   */
  async login(email: string, password: string): Promise<User> {
    // If Shopify is configured, authenticate with Shopify
    if (SHOPIFY_STORE_DOMAIN && SHOPIFY_STOREFRONT_TOKEN) {
      try {
        const data = await this.shopifyFetch(CUSTOMER_ACCESS_TOKEN_CREATE, {
          input: {
            email,
            password,
          }
        });

        if (data.customerAccessTokenCreate.customerUserErrors?.length > 0) {
          throw new Error(data.customerAccessTokenCreate.customerUserErrors[0].message);
        }

        const { accessToken } = data.customerAccessTokenCreate.customerAccessToken;
        this.customerAccessToken = accessToken;

        // Fetch customer details
        const customerData = await this.shopifyFetch(GET_CUSTOMER_ORDERS, {
          customerAccessToken: accessToken,
          first: 1,
        });

        const customer = customerData.customer;
        const user: User = {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email,
          phone: customer.phone,
          shopifyCustomerId: customer.id,
        };

        this.user = user;
        this.saveUser(user, accessToken);
        this.notifyListeners();
        return user;
      } catch (error) {
        console.error('Shopify login error:', error);
        // Fall back to mock login
        return this.mockLogin(email);
      }
    } else {
      // Mock login for development
      return this.mockLogin(email);
    }
  }

  /**
   * Mock login for development
   */
  private mockLogin(email: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email) {
          const user: User = {
            id: '1',
            name: 'John Doe',
            email: email,
            phone: '+92 300 1234567'
          };
          this.user = user;
          this.saveUser(user);
          this.notifyListeners();
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  }

  /**
   * Get customer orders from Shopify
   */
  async getCustomerOrders(limit: number = 10): Promise<any[]> {
    if (!this.customerAccessToken) {
      return [];
    }

    try {
      const data = await this.shopifyFetch(GET_CUSTOMER_ORDERS, {
        customerAccessToken: this.customerAccessToken,
        first: limit,
      });

      return data.customer.orders.edges.map((edge: any) => edge.node);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  /**
   * Logout user
   */
  logout() {
    this.user = null;
    this.customerAccessToken = null;
    this.saveUser(null);
    this.notifyListeners();
  }

  /**
   * Save redirect path for after login
   */
  setRedirectAfterLogin(path: string) {
    try {
      localStorage.setItem(REDIRECT_STORAGE_KEY, path);
    } catch (error) {
      console.error('Error saving redirect path:', error);
    }
  }

  /**
   * Get and clear redirect path
   */
  getAndClearRedirect(): string | null {
    try {
      const path = localStorage.getItem(REDIRECT_STORAGE_KEY);
      if (path) {
        localStorage.removeItem(REDIRECT_STORAGE_KEY);
        return path;
      }
    } catch (error) {
      console.error('Error getting redirect path:', error);
    }
    return null;
  }
}

export const authService = new AuthService();