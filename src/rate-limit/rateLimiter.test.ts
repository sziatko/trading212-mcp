import { afterEach, describe, expect, it } from "vitest";
import { __resetRateLimiter, waitForSlot } from "./rateLimiter.js";

afterEach(() => {
  __resetRateLimiter();
});

describe("waitForSlot", () => {
  it("allows calls immediately while under the limit", async () => {
    const start = Date.now();
    await waitForSlot("test-key", { count: 3, windowMs: 1000 });
    await waitForSlot("test-key", { count: 3, windowMs: 1000 });
    await waitForSlot("test-key", { count: 3, windowMs: 1000 });
    expect(Date.now() - start).toBeLessThan(100);
  });

  it("delays a call that would exceed the limit within the window", async () => {
    const start = Date.now();
    await waitForSlot("throttled-key", { count: 1, windowMs: 200 });
    await waitForSlot("throttled-key", { count: 1, windowMs: 200 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(190);
  });

  it("tracks separate keys independently", async () => {
    await waitForSlot("key-a", { count: 1, windowMs: 5000 });
    const start = Date.now();
    await waitForSlot("key-b", { count: 1, windowMs: 5000 });
    expect(Date.now() - start).toBeLessThan(100);
  });
});
