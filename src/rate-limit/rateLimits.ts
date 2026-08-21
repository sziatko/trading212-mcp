import type { RateLimit } from "./rateLimiter.js";

const perSeconds = (n: number): RateLimit => ({ count: 1, windowMs: n * 1000 });
const perMinute = (n: number): RateLimit => ({ count: n, windowMs: 60_000 });

export interface EndpointRateLimit {
  method: "GET" | "POST" | "DELETE";
  /** Documented path template, for reference — not used for routing. */
  path: string;
  limit: RateLimit;
}

/**
 * One entry per endpoint documented at
 * https://docs.trading212.com/api/section/rate-limiting. Limits are enforced
 * by Trading212 per account regardless of key/IP, and (per that section's own
 * per-endpoint reference pages) tracked independently per method+path — so
 * e.g. GET/POST/DELETE on /equity/pies/{id} each get their own bucket here,
 * even though they currently share the same numeric limit.
 *
 * One entry is not separately documented and is assumed conservatively:
 * `accountCash` (folded into the account section, no dedicated rate-limit
 * row — assumed same as accountSummary; it also doesn't appear at all in
 * Trading212's official OpenAPI spec, only `accountSummary` does).
 *
 * A single position lookup uses `positionsList`, not its own key: the
 * documented `GET /equity/positions` endpoint accepts an optional `ticker`
 * query filter (same operation, same rate-limit bucket) — see get_position
 * in src/tools/positions.ts. There's no separate single-position endpoint.
 */
export const RATE_LIMITS = {
  accountCash: { method: "GET", path: "/equity/account/cash", limit: perSeconds(5) },
  accountSummary: { method: "GET", path: "/equity/account/summary", limit: perSeconds(5) },

  positionsList: { method: "GET", path: "/equity/positions", limit: perSeconds(1) },

  ordersList: { method: "GET", path: "/equity/orders", limit: perSeconds(5) },
  orderSingle: { method: "GET", path: "/equity/orders/{id}", limit: perSeconds(1) },
  orderHistory: { method: "GET", path: "/equity/history/orders", limit: perMinute(6) },

  dividends: { method: "GET", path: "/equity/history/dividends", limit: perMinute(6) },
  transactions: { method: "GET", path: "/equity/history/transactions", limit: perMinute(6) },

  piesList: { method: "GET", path: "/equity/pies", limit: perSeconds(30) },
  pieCreate: { method: "POST", path: "/equity/pies", limit: perSeconds(5) },
  pieGet: { method: "GET", path: "/equity/pies/{id}", limit: perSeconds(5) },
  pieUpdate: { method: "POST", path: "/equity/pies/{id}", limit: perSeconds(5) },
  pieDelete: { method: "DELETE", path: "/equity/pies/{id}", limit: perSeconds(5) },
  pieDuplicate: { method: "POST", path: "/equity/pies/{id}/duplicate", limit: perSeconds(5) },

  instruments: { method: "GET", path: "/equity/metadata/instruments", limit: perSeconds(50) },
  exchanges: { method: "GET", path: "/equity/metadata/exchanges", limit: perSeconds(30) },

  placeMarketOrder: { method: "POST", path: "/equity/orders/market", limit: perMinute(50) },
  placeLimitOrder: { method: "POST", path: "/equity/orders/limit", limit: perSeconds(2) },
  placeStopOrder: { method: "POST", path: "/equity/orders/stop", limit: perSeconds(2) },
  placeStopLimitOrder: { method: "POST", path: "/equity/orders/stop_limit", limit: perSeconds(2) },
  cancelOrder: { method: "DELETE", path: "/equity/orders/{id}", limit: perMinute(50) },
} as const satisfies Record<string, EndpointRateLimit>;

export type RateLimitKey = keyof typeof RATE_LIMITS;
