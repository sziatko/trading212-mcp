export interface RateLimit {
  count: number;
  windowMs: number;
}

const timestamps = new Map<string, number[]>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Blocks until a call under `key` is allowed to proceed without exceeding
 * `limit.count` calls per `limit.windowMs`, per the Trading212 per-endpoint
 * limits documented at https://docs.trading212.com/api/section/rate-limiting.
 */
export async function waitForSlot(key: string, limit: RateLimit): Promise<void> {
  const now = Date.now();
  const history = (timestamps.get(key) ?? []).filter((t) => now - t < limit.windowMs);

  if (history.length >= limit.count) {
    const oldest = history[0];
    // +50ms safety margin: a real 429 was observed against Trading212's
    // actual demo API at the exact window boundary (clock drift/network jitter
    // between us and their server)
    const waitMs = limit.windowMs - (now - oldest) + 50;
    await sleep(waitMs);
    return waitForSlot(key, limit);
  }

  history.push(now);
  timestamps.set(key, history);
}

/** Test-only: clears all tracked call history. */
export function __resetRateLimiter(): void {
  timestamps.clear();
}
