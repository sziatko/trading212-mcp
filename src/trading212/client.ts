const USE_LIVE = process.env.TRADING212_USE_LIVE === "true";

const TRADING212_BASE_URL = USE_LIVE
  ? "https://live.trading212.com/api/v0"
  : "https://demo.trading212.com/api/v0";

const API_KEY = process.env.TRADING212_API_KEY;
if (!API_KEY) {
  throw new Error("Missing TRADING212_API_KEY in environment (see .env.example)");
}

export async function t212Get<T>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(`${TRADING212_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: { Authorization: `Basic ${API_KEY}` },
  });

  if (!response.ok) {
    throw new Error(`Trading212 API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
