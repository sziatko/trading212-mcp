import { waitForSlot } from "../rate-limit/rateLimiter.js";
import { RATE_LIMITS, type RateLimitKey } from "../rate-limit/rateLimits.js";

const USE_LIVE = process.env.TRADING212_USE_LIVE === "true";

const TRADING212_BASE_URL = USE_LIVE
  ? "https://live.trading212.com/api/v0"
  : "https://demo.trading212.com/api/v0";

const API_KEY = USE_LIVE ? process.env.TRADING212_API_KEY : process.env.TRADING212_DEMO_API_KEY;
if (!API_KEY) {
  throw new Error(
    USE_LIVE
      ? "Missing TRADING212_API_KEY in environment (see .env.example)"
      : "Missing TRADING212_DEMO_API_KEY in environment. Add a demo account API key, or " +
        "enable 'Use live account' and set TRADING212_API_KEY instead."
  );
}

async function request<T>(
  method: string,
  path: string,
  rateLimitKey: RateLimitKey,
  options?: { query?: Record<string, string | number | undefined>; body?: unknown }
): Promise<T> {
  const url = new URL(`${TRADING212_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(options?.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  await waitForSlot(rateLimitKey, RATE_LIMITS[rateLimitKey].limit);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${API_KEY}`,
      ...(options?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      throw new Error(
        `Trading212 API error: 429 Too Many Requests${retryAfter ? ` (retry after ${retryAfter}s)` : ""}`
      );
    }
    throw new Error(`Trading212 API error: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function t212Get<T>(
  path: string,
  rateLimitKey: RateLimitKey,
  query?: Record<string, string | number | undefined>
): Promise<T> {
  return request<T>("GET", path, rateLimitKey, { query });
}

export function t212Post<T>(
  path: string,
  rateLimitKey: RateLimitKey,
  body: unknown
): Promise<T> {
  return request<T>("POST", path, rateLimitKey, { body });
}

export function t212Delete<T>(path: string, rateLimitKey: RateLimitKey): Promise<T> {
  return request<T>("DELETE", path, rateLimitKey);
}
