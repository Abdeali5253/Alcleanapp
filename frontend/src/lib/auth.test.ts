// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const secure = new Map<string, unknown>();
  return {
    secure,
    signOut: vi.fn(async () => undefined),
    signInWithGoogle: vi.fn(),
    setKeyPrefix: vi.fn(async () => undefined),
    remove: vi.fn(async (key: string) => void secure.delete(key)),
  };
});

vi.mock("@aparajita/capacitor-secure-storage", () => ({
  KeychainAccess: { whenUnlockedThisDeviceOnly: 1 },
  SecureStorage: {
    setKeyPrefix: mocks.setKeyPrefix,
    setSynchronize: vi.fn(async () => undefined),
    setDefaultKeychainAccess: vi.fn(async () => undefined),
    get: vi.fn(async (key: string) => mocks.secure.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => void mocks.secure.set(key, value)),
    remove: mocks.remove,
  },
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => "android",
  },
}));
vi.mock("@capacitor-firebase/authentication", () => ({
  FirebaseAuthentication: {
    signOut: mocks.signOut,
    signInWithGoogle: mocks.signInWithGoogle,
  },
}));
vi.mock("firebase/auth", () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {
    static credentialFromResult() { return null; }
    setCustomParameters() {}
  },
}));
vi.mock("./firebase-config", () => ({ getFirebaseAuth: () => null }));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  mocks.secure.clear();
  mocks.remove.mockClear();
  mocks.signOut.mockClear();
  mocks.signInWithGoogle.mockReset();
  mocks.setKeyPrefix.mockReset();
  mocks.setKeyPrefix.mockResolvedValue(undefined);
  localStorage.clear();
});

describe("secure authentication lifecycle", () => {
  it("fails closed and completes hydration when native secure storage is unavailable", async () => {
    localStorage.setItem("alclean_secure_session_migrated_v1", "complete");
    mocks.setKeyPrefix.mockRejectedValueOnce(new Error("plugin unavailable"));

    const { authService } = await import("./auth");

    await expect(authService.whenReady()).resolves.toBeUndefined();
    expect(authService.isHydrated()).toBe(true);
    expect(authService.getUser()).toBeNull();
  });

  it("starts native Google sign-in without clearing the provider session first", async () => {
    localStorage.setItem("alclean_secure_session_migrated_v1", "complete");
    mocks.signInWithGoogle.mockResolvedValue({
      credential: { idToken: "google-id-token" },
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          success: true,
          user: {
            id: "1",
            email: "person@example.com",
            name: "Test Person",
            firstName: "Test",
            lastName: "Person",
            phone: "",
            accessToken: "shopify-token",
            expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          },
        }),
    })));

    const { authService } = await import("./auth");
    await authService.whenReady();
    const result = await authService.googleLogin();

    expect(result.success).toBe(true);
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.signInWithGoogle).toHaveBeenCalledWith({
      useCredentialManager: false,
    });
  });

  it("never commits a session that is missing trustworthy expiry metadata", async () => {
    localStorage.setItem("alclean_secure_session_migrated_v1", "complete");
    const { authService } = await import("./auth");
    await authService.whenReady();

    await expect(
      authService.updateUser({
        id: "1",
        email: "person@example.com",
        name: "Test",
        firstName: "Test",
        lastName: "Person",
        phone: "",
        accessToken: "new-token",
        expiresAt: "",
      }),
    ).rejects.toThrow(/valid expiry/);
    expect(authService.getUser()).toBeNull();
    expect(mocks.secure.has("session")).toBe(false);
  });

  it("forces a one-time logout and removes legacy PII caches", async () => {
    localStorage.setItem("alclean_auth", JSON.stringify({ accessToken: "legacy" }));
    localStorage.setItem("alclean_orders", JSON.stringify([{ email: "person@example.com" }]));
    localStorage.setItem("alclean_notifications", JSON.stringify([{ body: "private" }]));

    const { authService } = await import("./auth");
    await authService.whenReady();

    expect(authService.isHydrated()).toBe(true);
    expect(authService.getUser()).toBeNull();
    expect(localStorage.getItem("alclean_auth")).toBeNull();
    expect(localStorage.getItem("alclean_orders")).toBeNull();
    expect(localStorage.getItem("alclean_notifications")).toBeNull();
    expect(localStorage.getItem("alclean_secure_session_migrated_v1")).toBe("complete");
  });

  it("renews a secure session shortly before expiry", async () => {
    localStorage.setItem("alclean_secure_session_migrated_v1", "complete");
    mocks.secure.set("session", {
      user: {
        id: "gid://shopify/Customer/1",
        email: "person@example.com",
        name: "Test Person",
        firstName: "Test",
        lastName: "Person",
        phone: "",
      },
      accessToken: "old-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        user: {
          id: "gid://shopify/Customer/1",
          email: "person@example.com",
          name: "Test Person",
          firstName: "Test",
          lastName: "Person",
          phone: "",
          accessToken: "renewed-token",
          expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        },
      }),
    })));

    const { authService } = await import("./auth");
    await authService.whenReady();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/renew"),
      expect.objectContaining({ method: "POST" }),
    );
    expect(authService.getAccessToken()).toBe("renewed-token");
    await authService.logOut();
  });

  it("awaits cleanup and removes secure and local session data on logout", async () => {
    localStorage.setItem("alclean_secure_session_migrated_v1", "complete");
    localStorage.setItem("alclean_wishlist", "private");
    mocks.secure.set("session", {
      user: {
        id: "1", email: "person@example.com", name: "Test",
        firstName: "Test", lastName: "Person", phone: "",
      },
      accessToken: "token",
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    });
    const cleanup = vi.fn(async () => undefined);
    window.addEventListener("alclean-before-logout", ((event: CustomEvent) => {
      event.detail.tasks.push(cleanup());
    }) as EventListener, { once: true });

    const { authService } = await import("./auth");
    await authService.whenReady();
    await authService.logOut();

    expect(cleanup).toHaveBeenCalledOnce();
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.secure.has("session")).toBe(false);
    expect(localStorage.getItem("alclean_wishlist")).toBeNull();
    expect(authService.getUser()).toBeNull();
  });
});
