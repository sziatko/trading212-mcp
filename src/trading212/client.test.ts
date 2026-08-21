import { afterEach, describe, expect, it, vi } from "vitest";
import { t212Delete, t212Get, t212Post } from "./client.js";
import { __resetRateLimiter } from "./rateLimiter.js";

function mockFetchOnce(body: unknown, init?: { ok?: boolean; status?: number; statusText?: string }) {
  const response = {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? "OK",
    headers: new Headers(),
    json: () => Promise.resolve(body),
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  return response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  __resetRateLimiter();
});

describe("t212Get", () => {
  it("sends a Basic auth header built from the demo API key by default", async () => {
    mockFetchOnce({ ok: true });

    await t212Get("/equity/account/cash", "account/cash");

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers.Authorization).toBe("Basic test-demo-key");
  });

  it("requests the given path against the demo base URL by default", async () => {
    mockFetchOnce({});

    await t212Get("/equity/account/cash", "account/cash");

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url.toString()).toBe("https://demo.trading212.com/api/v0/equity/account/cash");
  });

  it("appends defined query params and omits undefined ones", async () => {
    mockFetchOnce({});

    await t212Get("/equity/history/orders", "orderHistory", { cursor: 5, limit: undefined });

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url.searchParams.get("cursor")).toBe("5");
    expect(url.searchParams.has("limit")).toBe(false);
  });

  it("returns the parsed JSON body on success", async () => {
    mockFetchOnce({ free: 100 });

    const result = await t212Get("/equity/account/cash", "account/cash");

    expect(result).toEqual({ free: 100 });
  });

  it("throws with the status code when the response is not ok", async () => {
    mockFetchOnce({}, { ok: false, status: 401, statusText: "Unauthorized" });

    await expect(t212Get("/equity/account/cash", "account/cash")).rejects.toThrow(
      "Trading212 API error: 401 Unauthorized"
    );
  });

  it("throws a rate-limit-specific message on 429", async () => {
    mockFetchOnce({}, { ok: false, status: 429, statusText: "Too Many Requests" });

    await expect(t212Get("/equity/account/cash", "account/cash")).rejects.toThrow(
      "Trading212 API error: 429 Too Many Requests"
    );
  });
});

describe("t212Post", () => {
  it("sends a POST with a JSON body and Content-Type header", async () => {
    mockFetchOnce({ id: 1 });

    await t212Post("/equity/orders/limit", "placeLimitOrder", {
      ticker: "AAPL_US_EQ",
      quantity: 1,
      limitPrice: 100,
      timeValidity: "DAY",
    });

    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url.toString()).toBe("https://demo.trading212.com/api/v0/equity/orders/limit");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Basic test-demo-key");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual({
      ticker: "AAPL_US_EQ",
      quantity: 1,
      limitPrice: 100,
      timeValidity: "DAY",
    });
  });

  it("returns the parsed JSON body on success", async () => {
    mockFetchOnce({ id: 42, status: "CONFIRMED" });

    const result = await t212Post("/equity/orders/market", "placeMarketOrder", { ticker: "AAPL_US_EQ", quantity: 1 });

    expect(result).toEqual({ id: 42, status: "CONFIRMED" });
  });

  it("throws on a non-2xx response, same as t212Get", async () => {
    mockFetchOnce({}, { ok: false, status: 400, statusText: "Bad Request" });

    await expect(
      t212Post("/equity/orders/market", "placeMarketOrder", { ticker: "AAPL_US_EQ", quantity: 1 })
    ).rejects.toThrow("Trading212 API error: 400 Bad Request");
  });
});

describe("t212Delete", () => {
  it("sends a DELETE with no body", async () => {
    mockFetchOnce({}, { status: 204 });

    await t212Delete("/equity/orders/123", "cancelOrder");

    const [url, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url.toString()).toBe("https://demo.trading212.com/api/v0/equity/orders/123");
    expect(options.method).toBe("DELETE");
    expect(options.body).toBeUndefined();
  });

  it("returns undefined for a 204 No Content response", async () => {
    mockFetchOnce({}, { status: 204 });

    const result = await t212Delete("/equity/orders/123", "cancelOrder");

    expect(result).toBeUndefined();
  });

  it("throws on a non-2xx response, same as t212Get", async () => {
    mockFetchOnce({}, { ok: false, status: 404, statusText: "Not Found" });

    await expect(t212Delete("/equity/orders/999", "cancelOrder")).rejects.toThrow(
      "Trading212 API error: 404 Not Found"
    );
  });
});
