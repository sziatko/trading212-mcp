import { describe, expect, it } from "vitest";
import { RATE_LIMITS } from "./rateLimits.js";

describe("RATE_LIMITS", () => {
  it("matches the numbers documented at docs.trading212.com/api/section/rate-limiting", () => {
    expect(RATE_LIMITS.accountSummary.limit).toEqual({ count: 1, windowMs: 5_000 });
    expect(RATE_LIMITS.positionsList.limit).toEqual({ count: 1, windowMs: 1_000 });
    expect(RATE_LIMITS.ordersList.limit).toEqual({ count: 1, windowMs: 5_000 });
    expect(RATE_LIMITS.orderSingle.limit).toEqual({ count: 1, windowMs: 1_000 });
    expect(RATE_LIMITS.orderHistory.limit).toEqual({ count: 6, windowMs: 60_000 });
    expect(RATE_LIMITS.dividends.limit).toEqual({ count: 6, windowMs: 60_000 });
    expect(RATE_LIMITS.transactions.limit).toEqual({ count: 6, windowMs: 60_000 });
    expect(RATE_LIMITS.piesList.limit).toEqual({ count: 1, windowMs: 30_000 });
    expect(RATE_LIMITS.pieCreate.limit).toEqual({ count: 1, windowMs: 5_000 });
    expect(RATE_LIMITS.pieGet.limit).toEqual({ count: 1, windowMs: 5_000 });
    expect(RATE_LIMITS.pieUpdate.limit).toEqual({ count: 1, windowMs: 5_000 });
    expect(RATE_LIMITS.pieDelete.limit).toEqual({ count: 1, windowMs: 5_000 });
    expect(RATE_LIMITS.pieDuplicate.limit).toEqual({ count: 1, windowMs: 5_000 });
    expect(RATE_LIMITS.instruments.limit).toEqual({ count: 1, windowMs: 50_000 });
    expect(RATE_LIMITS.exchanges.limit).toEqual({ count: 1, windowMs: 30_000 });
    expect(RATE_LIMITS.placeMarketOrder.limit).toEqual({ count: 50, windowMs: 60_000 });
    expect(RATE_LIMITS.placeLimitOrder.limit).toEqual({ count: 1, windowMs: 2_000 });
    expect(RATE_LIMITS.placeStopOrder.limit).toEqual({ count: 1, windowMs: 2_000 });
    expect(RATE_LIMITS.placeStopLimitOrder.limit).toEqual({ count: 1, windowMs: 2_000 });
    expect(RATE_LIMITS.cancelOrder.limit).toEqual({ count: 50, windowMs: 60_000 });
  });

  it("tracks each pie sub-operation independently, since the docs list them as separate endpoints", () => {
    const pieKeys = ["piesList", "pieCreate", "pieGet", "pieUpdate", "pieDelete", "pieDuplicate"] as const;
    const paths = pieKeys.map((key) => `${RATE_LIMITS[key].method} ${RATE_LIMITS[key].path}`);
    expect(new Set(paths).size).toBe(pieKeys.length);
  });
});
