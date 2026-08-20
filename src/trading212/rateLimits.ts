import type { RateLimit } from "./rateLimiter.js";

const perSecond = (n: number): RateLimit => ({ count: 1, windowMs: n * 1000 });
const perMinute = (n: number): RateLimit => ({ count: n, windowMs: 60_000 });

/**
 * Per-endpoint limits from https://docs.trading212.com/api/section/rate-limiting.
 * Limits are enforced per account regardless of key/IP, so this local limiter
 * is a best-effort client-side guard, not a substitute for handling 429s.
 */
export const RATE_LIMITS: Record<string, RateLimit> = {
  "account/cash": perSecond(5),
  "account/summary": perSecond(5),
  positions: perSecond(1),
  position: perSecond(1),
  orders: perSecond(5),
  order: perSecond(1),
  orderHistory: perMinute(6),
  dividends: perMinute(6),
  transactions: perMinute(6),
  pies: perSecond(30),
  pie: perSecond(5),
  instruments: perSecond(30),
  exchanges: perSecond(30),
  placeMarketOrder: perMinute(50),
  placeLimitOrder: perSecond(2),
  placeStopOrder: perSecond(2),
  placeStopLimitOrder: perSecond(2),
  cancelOrder: perMinute(50),
};
