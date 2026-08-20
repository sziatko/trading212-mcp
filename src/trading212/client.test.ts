import { afterEach, describe, expect, it, vi } from "vitest";
import { t212Get } from "./client.js";

function mockFetchOnce(body: unknown, init?: { ok?: boolean; status?: number; statusText?: string }) {
  const response = {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? "OK",
    json: () => Promise.resolve(body),
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  return response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("t212Get", () => {
  it("sends a Basic auth header built from the API key", async () => {
    mockFetchOnce({ ok: true });

    await t212Get("/equity/account/cash");

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers.Authorization).toBe("Basic test-key");
  });

  it("requests the given path against the live base URL", async () => {
    mockFetchOnce({});

    await t212Get("/equity/account/cash");

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url.toString()).toBe("https://live.trading212.com/api/v0/equity/account/cash");
  });

  it("appends defined query params and omits undefined ones", async () => {
    mockFetchOnce({});

    await t212Get("/equity/history/orders", { cursor: 5, limit: undefined });

    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url.searchParams.get("cursor")).toBe("5");
    expect(url.searchParams.has("limit")).toBe(false);
  });

  it("returns the parsed JSON body on success", async () => {
    mockFetchOnce({ free: 100 });

    const result = await t212Get("/equity/account/cash");

    expect(result).toEqual({ free: 100 });
  });

  it("throws with the status code when the response is not ok", async () => {
    mockFetchOnce({}, { ok: false, status: 401, statusText: "Unauthorized" });

    await expect(t212Get("/equity/account/cash")).rejects.toThrow(
      "Trading212 API error: 401 Unauthorized"
    );
  });
});
