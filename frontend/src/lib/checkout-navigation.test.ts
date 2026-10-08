import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ platform: "android", returnToApp: vi.fn() }));
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => mocks.platform },
  registerPlugin: () => ({ returnToApp: mocks.returnToApp }),
}));
import { returnFromVerifiedCheckout } from "./checkout-navigation";
beforeEach(() => { vi.clearAllMocks(); mocks.platform = "android"; mocks.returnToApp.mockResolvedValue(undefined); });
describe("return from verified checkout", () => {
  it("waits for the browser close before foregrounding Android", async () => {
    let finishClose!: () => void;
    const close = vi.fn(() => new Promise<void>((resolve) => { finishClose = resolve; }));
    const completion = returnFromVerifiedCheckout({ close });
    expect(close).toHaveBeenCalledOnce();
    expect(mocks.returnToApp).not.toHaveBeenCalled();
    finishClose();
    await completion;
    expect(mocks.returnToApp).toHaveBeenCalledOnce();
  });
  it("still foregrounds Android when browser close fails", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    await returnFromVerifiedCheckout({ close: () => Promise.reject(new Error("closed")) });
    expect(mocks.returnToApp).toHaveBeenCalledOnce();
    warning.mockRestore();
  });
  it("closes the iOS browser without calling the Android plugin", async () => {
    mocks.platform = "ios";
    const close = vi.fn();
    await returnFromVerifiedCheckout({ close });
    expect(close).toHaveBeenCalledOnce();
    expect(mocks.returnToApp).not.toHaveBeenCalled();
  });
});
