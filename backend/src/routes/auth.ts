import { Router, Request, Response } from "express";
import fetch from "node-fetch";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { getFirebaseAdminAuth } from "../services/firebase-admin.js";
import { deleteNotificationDataForUser } from "./notifications.js";

const router = Router();

// Configuration from environment - read lazily to ensure dotenv has loaded
function getShopifyConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN || "";
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";
  const url = domain ? `https://${domain}/api/${apiVersion}/graphql.json` : "";

  return { domain, token, apiVersion, url };
}

function getShopifyAdminConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN || "";
  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";
  const adminUrl = domain ? `https://${domain}/admin/api/${apiVersion}` : "";

  return { domain, adminToken, apiVersion, adminUrl };
}

// Check if configured
function isShopifyConfigured(): boolean {
  const { domain, token } = getShopifyConfig();
  return !!(domain && token);
}

// GraphQL fetch helper
async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const { url, token } = getShopifyConfig();

  if (!isShopifyConfigured()) {
    throw new Error("Shopify not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json: any = await response.json();

  if (json.errors?.length) {
    console.error("[Shopify] GraphQL errors:", json.errors);
    throw new Error(json.errors.map((e: any) => e.message).join(", "));
  }

  return json.data;
}

// Admin API fetch helper
async function shopifyAdminFetch(
  endpoint: string,
  options: any = {},
): Promise<any> {
  const { adminUrl, adminToken } = getShopifyAdminConfig();

  if (!adminToken) {
    throw new Error("Shopify Admin not configured");
  }

  const url = `${adminUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[Shopify Admin] Error:", response.status, data);
    const errorData = data as any;
    throw new Error(
      errorData.errors?.[0]?.message || `Shopify API error: ${response.status}`,
    );
  }

  return data;
}

async function shopifyAdminGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const { domain, adminToken, apiVersion } = getShopifyAdminConfig();
  if (!domain || !adminToken) throw new Error("Shopify Admin not configured");
  const response = await fetch(
    `https://${domain}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  const payload: any = await response.json();
  if (!response.ok || payload.errors?.length) {
    const message =
      payload.errors?.map((entry: any) => entry.message).join(", ") ||
      `Shopify Admin API error: ${response.status}`;
    throw new Error(message);
  }
  return payload.data as T;
}

function cleanName(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 100)
    : "";
}
// Search customer by email
async function findCustomerByEmail(email: string): Promise<any | null> {
  try {
    const response = await shopifyAdminFetch(
      `/customers/search.json?query=email:${email}`,
    );
    const customers = response.customers || [];
    return customers.length > 0 ? customers[0] : null;
  } catch (error) {
    console.error("[Shopify] Find customer error:", error);
    return null;
  }
}

// Create customer
async function createCustomer(
  email: string,
  firstName: string,
  lastName: string,
  password: string,
): Promise<any> {
  const response = await shopifyAdminFetch("/customers.json", {
    method: "POST",
    body: JSON.stringify({
      customer: {
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirmation: password,
      },
    }),
  });
  return response.customer;
}

// Set customer password (used to enable Google login for existing non-enabled customers)
async function setCustomerPassword(
  customerId: string | number,
  password: string,
): Promise<any> {
  const response = await shopifyAdminFetch(`/customers/${customerId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      customer: {
        id: customerId,
        password,
        password_confirmation: password,
      },
    }),
  });
  return response.customer;
}

// Transform Shopify customer to our User type
function transformCustomer(customer: any): any {
  return {
    id: customer.id,
    email: customer.email,
    name:
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
      customer.email,
    firstName: customer.firstName || "",
    lastName: customer.lastName || "",
    phone: customer.phone || "",
  };
}

// Shopify customer password max length is 40 chars.
function buildSocialPassword(provider: string, providerUserId: string): string {
  return crypto
    .createHash("sha256")
    .update(`${provider}:${providerUserId}`)
    .digest("hex")
    .slice(0, 40);
}

async function createCustomerAccessToken(
  email: string,
  password: string,
): Promise<{ accessToken?: string; expiresAt?: string; errors?: string }> {
  const mutation = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email,
      password,
    },
  };

  const data = await shopifyFetch<{
    customerAccessTokenCreate: {
      customerAccessToken: any;
      customerUserErrors: any[];
    };
  }>(mutation, variables);

  if (data.customerAccessTokenCreate.customerUserErrors?.length > 0) {
    return {
      errors: data.customerAccessTokenCreate.customerUserErrors
        .map((e: any) => e.message)
        .join(", "),
    };
  }

  return {
    accessToken: data.customerAccessTokenCreate.customerAccessToken.accessToken,
    expiresAt: data.customerAccessTokenCreate.customerAccessToken.expiresAt,
  };
}

async function getUserByCustomerAccessToken(
  accessToken: string,
  expiresAt?: string,
): Promise<any> {
  const customerQuery = `
    query getCustomer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) {
        id
        email
        firstName
        lastName
        phone
      }
    }
  `;

  const customerData = await shopifyFetch<{ customer: any }>(customerQuery, {
    customerAccessToken: accessToken,
  });

  const customer = customerData.customer;
  const user = transformCustomer(customer);
  user.accessToken = accessToken;
  if (expiresAt) user.expiresAt = expiresAt;
  return user;
}

/**
 * POST /api/auth/signup
 * Customer signup
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: "Email, password, firstName, and lastName are required",
      });
    }

    const mutation = `
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
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        email,
        password,
        firstName,
        lastName,
        phone: phone || null,
      },
    };

    const data = await shopifyFetch<{
      customerCreate: { customer: any; customerUserErrors: any[] };
    }>(mutation, variables);

    if (data.customerCreate.customerUserErrors?.length > 0) {
      const errors = data.customerCreate.customerUserErrors
        .map((e: any) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        error: errors,
      });
    }

    const customer = data.customerCreate.customer;
    const user = transformCustomer(customer);

    console.log(`[Auth] Customer created: ${user.email}`);
    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("[Auth] Signup error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create customer",
    });
  }
});

/**
 * POST /api/auth/login
 * Customer login
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const mutation = `
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        email,
        password,
      },
    };

    const data = await shopifyFetch<{
      customerAccessTokenCreate: {
        customerAccessToken: any;
        customerUserErrors: any[];
      };
    }>(mutation, variables);

    if (data.customerAccessTokenCreate.customerUserErrors?.length > 0) {
      const errors = data.customerAccessTokenCreate.customerUserErrors
        .map((e: any) => e.message)
        .join(", ");
      return res.status(401).json({
        success: false,
        error: errors,
      });
    }

    const accessToken =
      data.customerAccessTokenCreate.customerAccessToken.accessToken;
    const expiresAt =
      data.customerAccessTokenCreate.customerAccessToken.expiresAt;

    // Get customer details
    const customerQuery = `
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          email
          firstName
          lastName
          phone
        }
      }
    `;

    const customerData = await shopifyFetch<{ customer: any }>(customerQuery, {
      customerAccessToken: accessToken,
    });
    const customer = customerData.customer;
    const user = transformCustomer(customer);
    user.accessToken = accessToken;
    user.expiresAt = expiresAt;

    console.log(`[Auth] Customer logged in: ${user.email}`);
    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("[Auth] Login error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to login",
    });
  }
});

/**
 * POST /api/auth/renew
 * Renew a valid Shopify customer access token before it expires.
 */
router.post("/renew", async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!accessToken) {
      return res.status(401).json({ success: false, error: "Access token required" });
    }

    const mutation = `
      mutation customerAccessTokenRenew($customerAccessToken: String!) {
        customerAccessTokenRenew(customerAccessToken: $customerAccessToken) {
          customerAccessToken { accessToken expiresAt }
          userErrors { field message }
        }
      }
    `;
    const data = await shopifyFetch<{
      customerAccessTokenRenew: {
        customerAccessToken: { accessToken: string; expiresAt: string } | null;
        userErrors: Array<{ message: string }>;
      };
    }>(mutation, { customerAccessToken: accessToken });

    const renewed = data.customerAccessTokenRenew;
    if (!renewed.customerAccessToken || renewed.userErrors?.length) {
      return res.status(401).json({
        success: false,
        error: renewed.userErrors?.map((entry) => entry.message).join(", ") || "Session cannot be renewed",
      });
    }

    const user = await getUserByCustomerAccessToken(
      renewed.customerAccessToken.accessToken,
      renewed.customerAccessToken.expiresAt,
    );
    return res.json({ success: true, user });
  } catch (error: any) {
    console.error("[Auth] Token renewal failed:", error?.message || error);
    return res.status(401).json({ success: false, error: "Session expired" });
  }
});

/**
 * GET /api/auth/customer
 * Get customer details
 */
router.get("/customer", async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.replace("Bearer ", "");

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: "Access token required",
      });
    }

    const query = `
      query getCustomer($customerAccessToken: String!) {
        customer(customerAccessToken: $customerAccessToken) {
          id
          email
          firstName
          lastName
          phone
          orders(first: 10) {
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
                          currencyCode
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

    const data = await shopifyFetch<{ customer: any }>(query, {
      customerAccessToken: accessToken,
    });
    const customer = data.customer;

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const user = transformCustomer(customer);

    // Transform orders
    const orders =
      customer.orders?.edges?.map((edge: any) => ({
        id: edge.node.id,
        orderNumber: edge.node.orderNumber,
        processedAt: edge.node.processedAt,
        financialStatus: edge.node.financialStatus,
        fulfillmentStatus: edge.node.fulfillmentStatus,
        totalPrice: edge.node.totalPrice,
        lineItems: edge.node.lineItems.edges.map((li: any) => ({
          title: li.node.title,
          quantity: li.node.quantity,
          price: li.node.variant?.price || { amount: "0", currencyCode: "USD" },
        })),
      })) || [];

    res.json({
      success: true,
      user,
      orders,
    });
  } catch (error: any) {
    console.error("[Auth] Get customer error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get customer details",
    });
  }
});

/**
 * POST /api/auth/recover
 * Password reset request
 */
router.post("/recover", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const mutation = `
      mutation customerRecover($email: String!) {
        customerRecover(email: $email) {
          customerUserErrors {
            field
            message
          }
        }
      }
    `;

    const data = await shopifyFetch<{
      customerRecover: { customerUserErrors: any[] };
    }>(mutation, { email });

    if (data.customerRecover.customerUserErrors?.length > 0) {
      const errors = data.customerRecover.customerUserErrors
        .map((e: any) => e.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        error: errors,
      });
    }

    console.log(`[Auth] Password reset email sent to: ${email}`);
    res.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error: any) {
    console.error("[Auth] Password recover error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send password reset email",
    });
  }
});

/**
 * POST /api/auth/google-login
 * Google login
 */
router.post("/google-login", async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[Auth] Google login attempt started`);

  try {
    const { idToken, forceOverride = false } = req.body;

    if (!idToken) {
      console.error(`[Auth] Google login failed: ID token is required`);
      return res.status(400).json({
        success: false,
        error: "ID token is required",
      });
    }

    console.log(`[Auth] Verifying Google ID token`);

    // Verify Google ID token
    const client = new OAuth2Client();
    const validAudiences = (
      process.env.GOOGLE_CLIENT_IDS
        ? process.env.GOOGLE_CLIENT_IDS.split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        : [process.env.GOOGLE_CLIENT_ID].filter(Boolean)
    ) as string[];
    console.log(
      `[Auth] Google verification audiences configured: ${validAudiences.length}`,
    );

    let payload: any;
    try {
      const verifyOptions: any = { idToken };
      if (validAudiences.length > 0) {
        verifyOptions.audience = validAudiences;
      }
      const ticket = await client.verifyIdToken(verifyOptions);
      payload = ticket.getPayload();
    } catch (verifyError: any) {
      console.error(
        `[Auth] Google token verification failed:`,
        verifyError?.message || verifyError,
      );
      return res.status(401).json({
        success: false,
        error:
          validAudiences.length > 0
            ? `Google token verification failed. Check GOOGLE_CLIENT_IDS. ${verifyError?.message || ""}`.trim()
            : `Google token verification failed. GOOGLE_CLIENT_IDS is not configured on backend. ${verifyError?.message || ""}`.trim(),
      });
    }

    if (!payload) {
      console.error(`[Auth] Google login failed: Invalid ID token`);
      return res.status(401).json({
        success: false,
        error: "Invalid ID token",
      });
    }

    const email = payload.email;
    const firstName = payload.given_name || "";
    const lastName = payload.family_name || "";
    const googleId = payload.sub;

    console.log(
      `[Auth] Google token verified for email: ${email}, Google ID: ${googleId}`,
    );

    if (!email) {
      console.error(`[Auth] Google login failed: Email not found in token`);
      return res.status(400).json({
        success: false,
        error: "Email not found in token",
      });
    }

    // Deterministic social password (<= 40 chars for Shopify).
    const googlePassword = buildSocialPassword("google", googleId);

    console.log(`[Auth] Checking if customer exists for email: ${email}`);

    // Check if customer exists
    const existingCustomer = await findCustomerByEmail(email);
    if (existingCustomer) {
      console.log(
        `[Auth] Existing customer found, attempting Google login for: ${email}`,
      );
      const firstTry = await createCustomerAccessToken(email, googlePassword);

      if (!firstTry.accessToken) {
        const errors = firstTry.errors || "Unidentified customer";
        console.error(`[Auth] Initial Google login failed for ${email}: ${errors}`);

        const state = (existingCustomer.state || "").toLowerCase();
        const canSetPassword =
          state === "disabled" || state === "invited" || state === "declined";
        const shouldOverride = canSetPassword || Boolean(forceOverride);

        if (!shouldOverride) {
          return res.status(409).json({
            success: false,
            code: "ACCOUNT_EXISTS_PASSWORD_LOGIN",
            error:
              "This email already has a password account. Use password login, or confirm override to switch this account to Google login.",
          });
        }

        console.log(
          `[Auth] Customer state is '${state}'. Overriding password and retrying Google login for ${email}`,
        );

        await setCustomerPassword(existingCustomer.id, googlePassword);
        const retry = await createCustomerAccessToken(email, googlePassword);

        if (!retry.accessToken) {
          const retryErrors = retry.errors || "Unidentified customer";
          console.error(
            `[Auth] Google login retry failed for existing user ${email}: ${retryErrors}`,
          );
          return res.status(400).json({
            success: false,
            error: retryErrors || "Failed to login with Google",
          });
        }

        const user = await getUserByCustomerAccessToken(
          retry.accessToken,
          retry.expiresAt,
        );

        const duration = Date.now() - startTime;
        console.log(
          `[Auth] Google login successful after password set for existing user: ${user.email} (took ${duration}ms)`,
        );
        return res.json({
          success: true,
          user,
        });
      }
      const user = await getUserByCustomerAccessToken(
        firstTry.accessToken,
        firstTry.expiresAt,
      );

      const duration = Date.now() - startTime;
      console.log(
        `[Auth] Google login successful for existing user: ${user.email} (took ${duration}ms)`,
      );
      res.json({
        success: true,
        user,
      });
    } else {
      console.log(
        `[Auth] No existing customer found, creating new Google user for: ${email}`,
      );

      // Create new customer with Google password
      const newCustomer = await createCustomer(
        email,
        firstName,
        lastName,
        googlePassword,
      );

      console.log(`[Auth] New customer created: ${email}, logging in`);

      const login = await createCustomerAccessToken(email, googlePassword);

      if (!login.accessToken) {
        const errors = login.errors || "Unidentified customer";
        console.error(
          `[Auth] Google signup failed during login for new user ${email}: ${errors}`,
        );
        return res.status(401).json({
          success: false,
          error: errors,
        });
      }

      const user = transformCustomer(newCustomer);
      user.accessToken = login.accessToken;
      user.expiresAt = login.expiresAt;

      const duration = Date.now() - startTime;
      console.log(
        `[Auth] Google signup successful for new user: ${user.email} (took ${duration}ms)`,
      );
      res.json({
        success: true,
        user,
      });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(
      `[Auth] Google login/signup error after ${duration}ms:`,
      error.message || error,
    );
    res.status(500).json({
      success: false,
      error: error.message || "Failed to login with Google",
    });
  }
});

interface SocialCustomerLogin {
  email: string;
  firstName: string;
  lastName: string;
  provider: "apple";
  providerUserId: string;
  forceOverride: boolean;
}

function getAppleCustomerEmail(decoded: {
  uid: string;
  email?: string;
  email_verified?: boolean;
}): string {
  if (decoded.email && decoded.email_verified === true) {
    return decoded.email;
  }

  // Apple may omit email after the first authorization. The verified Firebase
  // UID is stable for this Apple identity, so use a non-deliverable, anonymous
  // address as the Shopify login key instead of rejecting a valid Apple login.
  const digest = crypto.createHash("sha256").update(decoded.uid).digest("hex");
  return `apple-${digest}@users.invalid`;
}

async function loginSocialCustomer(input: SocialCustomerLogin): Promise<{
  status: number;
  body: Record<string, unknown>;
}> {
  const password = buildSocialPassword(input.provider, input.providerUserId);
  const existingCustomer = await findCustomerByEmail(input.email);
  if (existingCustomer) {
    let login = await createCustomerAccessToken(input.email, password);
    if (!login.accessToken) {
      const state = String(existingCustomer.state || "").toLowerCase();
      const canSetPassword = ["disabled", "invited", "declined"].includes(state);
      if (!canSetPassword && !input.forceOverride) {
        return {
          status: 409,
          body: {
            success: false,
            code: "ACCOUNT_EXISTS_PASSWORD_LOGIN",
            error:
              "This email already has a password account. Use password login, or confirm that you want to use Sign in with Apple for this account.",
          },
        };
      }
      await setCustomerPassword(existingCustomer.id, password);
      login = await createCustomerAccessToken(input.email, password);
    }
    if (!login.accessToken) {
      return {
        status: 400,
        body: { success: false, error: login.errors || "Failed to sign in with Apple" },
      };
    }
    const user = await getUserByCustomerAccessToken(login.accessToken, login.expiresAt);
    return { status: 200, body: { success: true, user } };
  }

  const customer = await createCustomer(
    input.email,
    input.firstName,
    input.lastName,
    password,
  );
  const login = await createCustomerAccessToken(input.email, password);
  if (!login.accessToken) {
    return {
      status: 400,
      body: { success: false, error: login.errors || "Failed to sign in with Apple" },
    };
  }
  const user = transformCustomer(customer);
  user.accessToken = login.accessToken;
  user.expiresAt = login.expiresAt;
  return { status: 200, body: { success: true, user } };
}

router.post("/apple-login", async (req: Request, res: Response) => {
  const { idToken, firstName, lastName, forceOverride = false } = req.body || {};
  if (typeof idToken !== "string" || !idToken) {
    return res.status(400).json({ success: false, error: "Firebase ID token is required" });
  }

  let decoded;
  try {
    decoded = await getFirebaseAdminAuth().verifyIdToken(idToken, true);
  } catch (error) {
    console.error("[Auth] Apple Firebase token verification failed", error);
    return res.status(401).json({ success: false, error: "Invalid or expired Apple sign-in" });
  }

  const provider = decoded.firebase?.sign_in_provider;
  if (provider !== "apple.com" || !decoded.uid) {
    return res.status(401).json({
      success: false,
      error: "Invalid Apple sign-in identity",
    });
  }

  try {
    const result = await loginSocialCustomer({
      email: getAppleCustomerEmail(decoded),
      firstName: cleanName(firstName),
      lastName: cleanName(lastName),
      provider: "apple",
      providerUserId: decoded.uid,
      forceOverride: forceOverride === true,
    });
    return res.status(result.status).json(result.body);
  } catch (error: any) {
    console.error("[Auth] Apple login failed", error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to sign in with Apple",
    });
  }
});

async function listCustomerOrderIds(customerId: string): Promise<string[]> {
  const orderIds: string[] = [];
  let after: string | null = null;
  do {
    const data: {
      customer: {
        orders: {
          nodes: Array<{ id: string }>;
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      } | null;
    } = await shopifyAdminGraphql(
      `query deletionOrders($id: ID!, $after: String) {
        customer(id: $id) {
          orders(first: 100, after: $after) {
            nodes { id }
            pageInfo { hasNextPage endCursor }
          }
        }
      }`,
      { id: customerId, after },
    );
    if (!data.customer) return orderIds;
    orderIds.push(...data.customer.orders.nodes.map((order) => order.id));
    after = data.customer.orders.pageInfo.hasNextPage
      ? data.customer.orders.pageInfo.endCursor
      : null;
  } while (after);
  return orderIds;
}

async function detachCustomerFromOrders(orderIds: string[]): Promise<void> {
  for (const orderId of orderIds) {
    const data: {
      orderCustomerRemove: { userErrors: Array<{ message: string }> };
    } = await shopifyAdminGraphql(
      `mutation detachDeletionOrder($orderId: ID!) {
        orderCustomerRemove(orderId: $orderId) {
          userErrors { message }
        }
      }`,
      { orderId },
    );
    if (data.orderCustomerRemove.userErrors.length > 0) {
      throw new Error(
        data.orderCustomerRemove.userErrors.map((entry) => entry.message).join(", "),
      );
    }
  }
}

function isAssociatedOrdersError(error: unknown): boolean {
  return String(error instanceof Error ? error.message : error)
    .toLowerCase()
    .includes("associated orders");
}

async function deleteShopifyCustomer(customerId: string): Promise<void> {
  const data: {
    customerDelete: {
      deletedCustomerId: string | null;
      userErrors: Array<{ message: string }>;
    };
  } = await shopifyAdminGraphql(
    `mutation deleteAccountCustomer($id: ID!) {
      customerDelete(input: { id: $id }) {
        deletedCustomerId
        userErrors { message }
      }
    }`,
    { id: customerId },
  );
  if (data.customerDelete.userErrors.length > 0) {
    throw new Error(
      data.customerDelete.userErrors.map((entry) => entry.message).join(", "),
    );
  }
  if (!data.customerDelete.deletedCustomerId) {
    throw new Error("Shopify did not confirm customer deletion");
  }
}

async function requestShopifyCustomerDataErasure(customerId: string): Promise<void> {
  const data: {
    customerRequestDataErasure: {
      customerId: string | null;
      userErrors: Array<{ code?: string; message: string }>;
    };
  } = await shopifyAdminGraphql(
    `mutation requestAccountDataErasure($customerId: ID!) {
      customerRequestDataErasure(customerId: $customerId) {
        customerId
        userErrors { code message }
      }
    }`,
    { customerId },
  );
  if (data.customerRequestDataErasure.userErrors.length > 0) {
    throw new Error(
      data.customerRequestDataErasure.userErrors
        .map((entry) => entry.message)
        .join(", "),
    );
  }
  if (!data.customerRequestDataErasure.customerId) {
    throw new Error("Shopify did not confirm the customer data-erasure request");
  }
}

async function detachOrdersAndDeleteShopifyCustomer(customerId: string): Promise<{
  detachedOrderCount: number;
  shopifyCustomerDeleted: boolean;
  shopifyErasureRequested: boolean;
}> {
  const detachedOrderIds = new Set<string>();

  // Shopify can take a moment to expose the updated customer/order relationship.
  // Re-query before retrying so any newly visible order is detached as well.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const orderIds = await listCustomerOrderIds(customerId);
    await detachCustomerFromOrders(orderIds);
    orderIds.forEach((orderId) => detachedOrderIds.add(orderId));

    try {
      await deleteShopifyCustomer(customerId);
      return {
        detachedOrderCount: detachedOrderIds.size,
        shopifyCustomerDeleted: true,
        shopifyErasureRequested: false,
      };
    } catch (error) {
      if (!isAssociatedOrdersError(error)) throw error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  }

  await requestShopifyCustomerDataErasure(customerId);
  return {
    detachedOrderCount: detachedOrderIds.size,
    shopifyCustomerDeleted: false,
    shopifyErasureRequested: true,
  };
}

router.delete("/account", async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.match(/^Bearer\s+([^\s]+)$/i)?.[1];
  if (!accessToken) {
    return res.status(401).json({ success: false, error: "Access token required" });
  }

  let customer: any;
  try {
    customer = await getUserByCustomerAccessToken(accessToken);
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired session" });
  }
  if (!customer?.id || !customer?.email) {
    return res.status(401).json({ success: false, error: "Customer not found" });
  }

  const firebaseIdToken = req.body?.firebaseIdToken;
  let firebaseUid: string | null = null;
  if (firebaseIdToken !== undefined) {
    if (typeof firebaseIdToken !== "string" || !firebaseIdToken) {
      return res.status(400).json({ success: false, error: "Invalid Firebase identity" });
    }
    try {
      const decoded = await getFirebaseAdminAuth().verifyIdToken(firebaseIdToken, true);
      const provider = decoded.firebase?.sign_in_provider;
      const allowedProvider = provider === "apple.com" || provider === "google.com";
      if (
        !allowedProvider ||
        !decoded.email ||
        decoded.email.toLowerCase() !== String(customer.email).toLowerCase()
      ) {
        return res.status(403).json({ success: false, error: "Account identity mismatch" });
      }
      firebaseUid = decoded.uid;
    } catch (error) {
      console.error("[Auth] Deletion identity verification failed", error);
      return res.status(401).json({ success: false, error: "Reauthentication required" });
    }
  }

  try {
    const {
      detachedOrderCount,
      shopifyCustomerDeleted,
      shopifyErasureRequested,
    } = await detachOrdersAndDeleteShopifyCustomer(customer.id);
    const removed = deleteNotificationDataForUser(customer.id);

    if (firebaseUid) {
      try {
        await getFirebaseAdminAuth().deleteUser(firebaseUid);
      } catch (error: any) {
        if (error?.code !== "auth/user-not-found") throw error;
      }
    }

    return res.json({
      success: true,
      detachedOrderCount,
      shopifyCustomerDeleted,
      shopifyErasureRequested,
      removed,
      retainedData: "Historical transaction records required for business or legal purposes",
    });
  } catch (error: any) {
    console.error("[Auth] Account deletion failed", error?.message || error);
    return res.status(502).json({
      success: false,
      error: "Account deletion could not be completed. Please try again.",
    });
  }
});

export default router;
