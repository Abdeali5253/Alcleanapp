import express, { type Express } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  verifyIdToken: vi.fn(),
  getUser: vi.fn(),
  setCustomUserClaims: vi.fn(),
  deleteUser: vi.fn(),
  deleteNotificationDataForUser: vi.fn(() => ({
    devicesDeleted: 1,
    notificationsDeleted: 2,
  })),
}));

vi.mock("node-fetch", () => ({ default: mocks.fetch }));
vi.mock("./services/firebase-admin.js", () => ({
  getFirebaseAdminAuth: () => ({
    verifyIdToken: mocks.verifyIdToken,
    getUser: mocks.getUser,
    setCustomUserClaims: mocks.setCustomUserClaims,
    deleteUser: mocks.deleteUser,
  }),
}));
vi.mock("./routes/notifications.js", () => ({
  deleteNotificationDataForUser: mocks.deleteNotificationDataForUser,
}));

function jsonResponse(data: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => data };
}

let app: Express;

beforeAll(async () => {
  process.env.SHOPIFY_STORE_DOMAIN = "store.example";
  process.env.SHOPIFY_STOREFRONT_TOKEN = "storefront-token";
  process.env.SHOPIFY_ADMIN_API_TOKEN = "admin-token";
  const { default: authRouter } = await import("./routes/auth.js");
  app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
});

beforeEach(() => {
  mocks.fetch.mockReset();
  mocks.verifyIdToken.mockReset();
  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({ customClaims: { existingClaim: true } });
  mocks.setCustomUserClaims.mockReset();
  mocks.setCustomUserClaims.mockResolvedValue(undefined);
  mocks.deleteUser.mockReset();
  mocks.deleteNotificationDataForUser.mockClear();
});

describe("Apple authentication", () => {
  it("rejects a Firebase token from the wrong provider", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "firebase-user",
      email: "person@example.com",
      email_verified: true,
      firebase: { sign_in_provider: "google.com" },
    });

    const response = await request(app)
      .post("/api/auth/apple-login")
      .send({ idToken: "firebase-token" });

    expect(response.status).toBe(401);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("creates a Shopify customer from a verified private relay identity", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "apple-user",
      email: "private@privaterelay.appleid.com",
      email_verified: true,
      firebase: { sign_in_provider: "apple.com" },
    });
    mocks.fetch
      .mockResolvedValueOnce(jsonResponse({ customers: [] }))
      .mockResolvedValueOnce(jsonResponse({
        customer: {
          id: 1,
          email: "private@privaterelay.appleid.com",
          firstName: "Private",
          lastName: "Person",
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerAccessTokenCreate: {
            customerAccessToken: {
              accessToken: "shopify-access-token",
              expiresAt: "2026-12-01T00:00:00.000Z",
            },
            customerUserErrors: [],
          },
        },
      }));

    const response = await request(app)
      .post("/api/auth/apple-login")
      .send({
        idToken: "firebase-token",
        firstName: "Private",
        lastName: "Person",
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("private@privaterelay.appleid.com");
    expect(response.body.user.accessToken).toBe("shopify-access-token");
    expect(response.body.refreshFirebaseToken).toBe(true);
    expect(mocks.setCustomUserClaims).toHaveBeenCalledWith("apple-user", {
      existingClaim: true,
      shopifyCustomerId: "gid://shopify/Customer/1",
      authProvider: "apple",
    });
  });

  it("recreates an Apple account when Apple omits the email", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "returning-apple-user",
      firebase: { sign_in_provider: "apple.com" },
    });
    mocks.fetch
      .mockResolvedValueOnce(jsonResponse({ customers: [] }))
      .mockResolvedValueOnce(jsonResponse({
        customer: {
          id: "gid://shopify/Customer/2",
          email: "apple-fallback@users.invalid",
          firstName: "",
          lastName: "",
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerAccessTokenCreate: {
            customerAccessToken: {
              accessToken: "recreated-access-token",
              expiresAt: "2026-12-01T00:00:00.000Z",
            },
            customerUserErrors: [],
          },
        },
      }));

    const response = await request(app)
      .post("/api/auth/apple-login")
      .send({ idToken: "firebase-token" });

    expect(response.status).toBe(200);
    const createRequest = JSON.parse(String(mocks.fetch.mock.calls[1]?.[1]?.body));
    expect(createRequest.customer.email).toMatch(
      /^apple-[a-f0-9]{64}@users\.invalid$/,
    );
    expect(mocks.setCustomUserClaims).toHaveBeenCalledWith(
      "returning-apple-user",
      expect.objectContaining({
        shopifyCustomerId: "gid://shopify/Customer/2",
        authProvider: "apple",
      }),
    );
  });

  it("requires consent before replacing an existing password credential", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "apple-user",
      email: "person@example.com",
      email_verified: true,
      firebase: { sign_in_provider: "apple.com" },
    });
    mocks.fetch
      .mockResolvedValueOnce(jsonResponse({
        customers: [{ id: 1, email: "person@example.com", state: "enabled" }],
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerAccessTokenCreate: {
            customerAccessToken: null,
            customerUserErrors: [{ message: "Unidentified customer" }],
          },
        },
      }));

    const response = await request(app)
      .post("/api/auth/apple-login")
      .send({ idToken: "firebase-token" });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe("ACCOUNT_EXISTS_PASSWORD_LOGIN");
  });
});

describe("account deletion", () => {
  it("deletes an anonymous Apple account after Apple regenerates its UID", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "regenerated-apple-user",
      email: "person@example.com",
      shopifyCustomerId: "gid://shopify/Customer/2",
      authProvider: "apple",
      firebase: { sign_in_provider: "apple.com" },
    });
    mocks.deleteUser.mockResolvedValue(undefined);
    const anonymousEmail =
      "apple-a71965c0900dd9bf5420d12e8332c58443409e78a4bacb03c98c7ced2aeb26e7@users.invalid";
    mocks.fetch
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customer: {
            id: "gid://shopify/Customer/2",
            email: anonymousEmail,
            firstName: "",
            lastName: "",
            phone: null,
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customer: {
            orders: {
              nodes: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerDelete: {
            deletedCustomerId: "gid://shopify/Customer/2",
            userErrors: [],
          },
        },
      }));

    const response = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", "Bearer shopify-access-token")
      .send({ firebaseIdToken: "fresh-firebase-token" });

    expect(response.status).toBe(200);
    expect(mocks.deleteUser).toHaveBeenCalledWith("regenerated-apple-user");
  });

  it("detaches orders, deletes account data, and deletes the matching Firebase user", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "firebase-user",
      email: "person@example.com",
      shopifyCustomerId: "gid://shopify/Customer/1",
      authProvider: "apple",
      firebase: { sign_in_provider: "apple.com" },
    });
    mocks.deleteUser.mockResolvedValue(undefined);
    mocks.fetch
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customer: {
            id: "gid://shopify/Customer/1",
            email: "person@example.com",
            firstName: "Test",
            lastName: "Person",
            phone: null,
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customer: {
            orders: {
              nodes: [{ id: "gid://shopify/Order/1" }],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: { orderCustomerRemove: { userErrors: [] } },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerDelete: {
            deletedCustomerId: "gid://shopify/Customer/1",
            userErrors: [],
          },
        },
      }));

    const response = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", "Bearer shopify-access-token")
      .send({ firebaseIdToken: "fresh-firebase-token" });

    expect(response.status).toBe(200);
    expect(response.body.detachedOrderCount).toBe(1);
    expect(mocks.deleteNotificationDataForUser).toHaveBeenCalledWith(
      "gid://shopify/Customer/1",
    );
    expect(mocks.deleteUser).toHaveBeenCalledWith("firebase-user");
  });

  it("requires Apple users with a legacy session to sign in again", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "legacy-apple-user",
      firebase: { sign_in_provider: "apple.com" },
    });
    mocks.fetch.mockResolvedValueOnce(jsonResponse({
      data: {
        customer: {
          id: "gid://shopify/Customer/1",
          email: "private@privaterelay.appleid.com",
          firstName: "Private",
          lastName: "Person",
          phone: null,
        },
      },
    }));

    const response = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", "Bearer shopify-access-token")
      .send({ firebaseIdToken: "legacy-firebase-token" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ACCOUNT_BINDING_MISSING");
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("rejects an Apple identity bound to a different Shopify customer", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "other-apple-user",
      shopifyCustomerId: "gid://shopify/Customer/999",
      authProvider: "apple",
      firebase: { sign_in_provider: "apple.com" },
    });
    mocks.fetch.mockResolvedValueOnce(jsonResponse({
      data: {
        customer: {
          id: "gid://shopify/Customer/1",
          email: "private@privaterelay.appleid.com",
          firstName: "Private",
          lastName: "Person",
          phone: null,
        },
      },
    }));

    const response = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", "Bearer shopify-access-token")
      .send({ firebaseIdToken: "other-firebase-token" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ACCOUNT_BINDING_MISMATCH");
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });

  it("requests data erasure when historical order activity prevents deletion", async () => {
    mocks.fetch
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customer: {
            id: "gid://shopify/Customer/1",
            email: "person@example.com",
            firstName: "Test",
            lastName: "Person",
            phone: null,
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customer: {
            orders: {
              nodes: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerDelete: {
            deletedCustomerId: null,
            userErrors: [
              { message: "Customer can't be deleted because they have associated orders" },
            ],
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customer: {
            orders: {
              nodes: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerDelete: {
            deletedCustomerId: null,
            userErrors: [
              { message: "Customer can't be deleted because they have associated orders" },
            ],
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customer: {
            orders: {
              nodes: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerDelete: {
            deletedCustomerId: null,
            userErrors: [
              { message: "Customer can't be deleted because they have associated orders" },
            ],
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse({
        data: {
          customerRequestDataErasure: {
            customerId: "gid://shopify/Customer/1",
            userErrors: [],
          },
        },
      }));

    const response = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", "Bearer shopify-access-token")
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.shopifyCustomerDeleted).toBe(false);
    expect(response.body.shopifyErasureRequested).toBe(true);
    expect(mocks.deleteNotificationDataForUser).toHaveBeenCalled();
  });

  it("rejects a Firebase identity that does not match the Shopify customer", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "other-user",
      email: "other@example.com",
      firebase: { sign_in_provider: "google.com" },
    });
    mocks.fetch.mockResolvedValueOnce(jsonResponse({
      data: {
        customer: {
          id: "gid://shopify/Customer/1",
          email: "person@example.com",
          firstName: "Test",
          lastName: "Person",
          phone: null,
        },
      },
    }));

    const response = await request(app)
      .delete("/api/auth/account")
      .set("Authorization", "Bearer shopify-access-token")
      .send({ firebaseIdToken: "other-firebase-token" });

    expect(response.status).toBe(403);
    expect(mocks.deleteNotificationDataForUser).not.toHaveBeenCalled();
  });
});
