# trading212-mcp

[![CI](https://github.com/sziatko/trading212-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sziatko/trading212-mcp/actions/workflows/ci.yml)

An MCP server that connects Claude to your Trading212 account. It reads your real account data —
cash balance, open positions, orders, pies, and history — so you can ask about your investments
directly in a chat with Claude. Optionally, with write tools enabled, Claude can also place and
cancel orders and manage pies (create/update/delete/duplicate), always with your explicit approval
before each action.

## Status

Both read tools and write tools (orders, pies) are implemented. Write tools are off by default —
see [Configuration](#configuration) to enable them.

## Requirements

- Node.js 24 or newer
- A Trading212 account and an API key (from the Trading212 web app, under API settings)
- Claude Desktop, to use this server as a local extension

## Setup

### Option A: install as a Claude Desktop extension (recommended, no build required)

1. Download `trading212-mcp.mcpb` from the [latest release](../../releases/latest).
2. Double-click it (or drag it into the Claude Desktop window) to install.
3. Claude Desktop will prompt for your Trading212 API key(s), whether to use your live or demo
   account, and let you toggle individual tool categories (including write tools) on/off — no
   terminal, no Node.js, no build step needed.

### Option B: run from source (for development)

1. Clone this repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add your Trading212 API key.
4. Run `npm run dev` to start the server locally.
5. Add the server to Claude Desktop as a local extension, pointing to this project folder (see
   `claude_desktop_config.json`'s `mcpServers` section).

### Building the extension yourself

```
npm install -g @anthropic-ai/mcpb
npm run package
```

This builds the project, installs production-only dependencies into a temp directory, and packs
`trading212-mcp.mcpb` in the repo root (see `scripts/package.sh` and `manifest.json`).

## Data source

By default, this server reads from your Trading212 demo/practice account. Set
`TRADING212_USE_LIVE=true` (or toggle "Use live account" in the extension settings) to read from
your real live account instead — see [Configuration](#configuration).

## Configuration

When installed as a Claude Desktop extension, these are exposed as a settings UI. When running
from source, set them as environment variables (in `.env`, or in `claude_desktop_config.json`'s
`env` block):

| Variable | Default | Description |
| --- | --- | --- |
| `TRADING212_API_KEY` | — | Basic-auth credential from your **live** Trading212 account (Settings → API). Only used when `TRADING212_USE_LIVE=true`. |
| `TRADING212_DEMO_API_KEY` | — | Basic-auth credential from your **demo/practice** account. Only used when `TRADING212_USE_LIVE` is unset or `false` (the default). Live and demo keys are separate — only one is active at a time. |
| `TRADING212_USE_LIVE` | `false` | Set to `true` to read from your real live account instead of demo. |
| `ENABLE_ACCOUNT_TOOLS` | `true` | Cash balance, account summary. |
| `ENABLE_POSITIONS_TOOLS` | `true` | Open positions. |
| `ENABLE_ORDERS_TOOLS` | `true` | Read-only order tools: open orders, order history. |
| `ENABLE_HISTORY_TOOLS` | `true` | Dividends, transactions. |
| `ENABLE_PIES_TOOLS` | `true` | Read-only pie tools: list/get pies. |
| `ENABLE_METADATA_TOOLS` | `true` | Instruments, exchanges. |
| `ENABLE_ORDER_WRITE_TOOLS` | `false` | Place/cancel orders. Independent of `ENABLE_PIE_WRITE_TOOLS`. |
| `ENABLE_PIE_WRITE_TOOLS` | `false` | Create/update/delete/duplicate pies. Independent of `ENABLE_ORDER_WRITE_TOOLS`. |

Set any `ENABLE_*` variable to `false` to hide that tool category from Claude entirely.

**Order limitations:** orders can only be executed in the account's main currency. [link](https://docs.trading212.com/api/orders)

**Write tools require approval.** Every write tool (`place_*_order`, `cancel_order`, `create_pie`,
`update_pie`, `delete_pie`, `duplicate_pie`) is annotated `readOnlyHint: false`, so Claude Desktop
prompts you to approve each call individually before it runs — nothing executes silently.

## Project structure

- `src/index.ts` — entrypoint. Creates the MCP server, registers all tools, and connects it over
  stdio so Claude Desktop can launch it as a subprocess.
- `src/api/client.ts` — `t212Get/t212Post/t212Delete`, typed wrappers around `fetch` that pick the
  live or demo base URL and API key, add the `Authorization: Basic <key>` header, enforce the
  per-endpoint rate limit before sending, and throw on non-2xx responses. Every tool calls the
  Trading212 API through these functions.
- `src/api/types.ts` — Zod schemas for the shapes sent/returned by the Trading212 API (cash,
  positions, orders, pies, etc); each schema's TypeScript type is derived from it via `z.infer`, so
  there's one source of truth. These schemas are also used as every tool's `outputSchema` (see below). Kept
  in sync with the official OpenAPI spec below, except `CashBalanceSchema`: `/equity/account/cash`
  isn't in that spec at all, so its fields are best-effort from observed live responses, not a
  verified schema (see the doc comment on it in the file). It's kept anyway (see `get_cash_balance`
  below) because it returns `ppl`/`result` — account-level profit/loss figures with no equivalent
  anywhere in the documented API, including `get_account_summary`.
- `docs/trading212-openapi.yaml` — Trading212's official OpenAPI spec, kept as a reference for
  exact request/response schemas and rate limits. Not fetched at runtime.
- `src/rate-limit/rateLimiter.ts` / `rateLimits.ts` — a small in-memory sliding-window limiter and
  a declarative table of every endpoint documented at
  [Trading212's rate-limiting docs](https://docs.trading212.com/api/section/rate-limiting) (method,
  path, limit), so the client waits instead of hitting a 429 in normal use.
- `src/tools/` — one file per API domain (`account.ts`, `positions.ts`, `orders.ts`, `history.ts`,
  `pies.ts`, `metadata.ts`). Each exports a `register*Tools(server)` function that registers its
  domain's MCP tools. `shared.ts` and `pagination.ts` hold small helpers reused across them.

## Output schemas

Every tool declares an `outputSchema` (from `src/api/types.ts`), so Claude sees the exact shape of
what a tool returns — not just prose in its `description` — before ever calling it. Each result
carries both a `content` block (JSON text, for clients that don't read structured output) and
`structuredContent` (the same data, validated against `outputSchema`).

MCP requires structured output to be a JSON object at the top level, so the 6 tools that
conceptually return a list (`get_positions`, `get_position`, `get_orders`, `get_pies`,
`get_instruments`, `get_exchanges`) wrap their array under a named key instead of returning it bare
— e.g. `get_positions` returns `{ "positions": [...] }`, not `[...]`. Every other tool's top-level
shape is unchanged.

## Available tools

### Read tools (`readOnlyHint: true`)

| Tool | Description |
| --- | --- |
| `get_cash_balance` | Current cash balance, via the undocumented legacy `/equity/account/cash` endpoint — kept because it's the only source for `ppl`/`result` (account-level profit/loss) and a couple of other fields (`invested`, `pieCash`, `blocked`) not available from any documented endpoint. |
| `get_account_summary` | Full account summary: cash, invested value, profit/loss, total value. |
| `get_positions` | All open positions. |
| `get_position` | A single open position by ticker (filters `get_positions` server-side; returns 0 or 1 items). |
| `get_orders` | All currently open/pending orders. |
| `get_order` | A single open/pending order by id. |
| `get_order_history` | Historical (filled/cancelled) orders, paginated, optionally filtered by ticker. |
| `get_dividends` | Historical dividend payments, paginated, optionally filtered by ticker. |
| `get_transactions` | Historical cash movements (deposits, withdrawals, transfers), paginated, optionally from a given time. |
| `get_pies` | All investment pies (summary shape: cash, dividends, result, status). |
| `get_pie` | A single investment pie by id (detailed shape: settings, holdings, per-instrument allocation). |
| `get_instruments` | Metadata for all tradeable instruments (tickers, names, ISINs, currencies). |
| `get_exchanges` | Metadata for all exchanges, including their working schedules. |

### Write tools (`readOnlyHint: false`, disabled by default — see `ENABLE_ORDER_WRITE_TOOLS` / `ENABLE_PIE_WRITE_TOOLS`)

| Tool | Description |
| --- | --- |
| `place_market_order` | Place a market order (executes at next available price). |
| `place_limit_order` | Place a limit order (executes at a specified price or better). |
| `place_stop_order` | Place a stop order (becomes a market order once triggered). |
| `place_stop_limit_order` | Place a stop-limit order (becomes a limit order once triggered). |
| `cancel_order` | Cancel an active, unfilled order by id. |
| `create_pie` | Create a new investment pie. |
| `update_pie` | Update an existing pie's settings and/or allocation. |
| `delete_pie` | Delete a pie by id. |
| `duplicate_pie` | Duplicate an existing pie, optionally renaming/re-iconing the copy. |

## Testing

Unit tests use [Vitest](https://vitest.dev). Run them with:

```
npm test
```

Run `npm run test:coverage` for a coverage report (100% statements/branches/functions/lines as of
this writing, across every source file except `src/index.ts`, which `vitest.config.ts` excludes —
it's thin wiring around the MCP SDK's stdio transport, not worth mocking that transport to test.
`coverage.all: true` is set so a file with zero tests shows up as 0% rather than being silently
omitted from the report).

`test/setup.ts` stubs `TRADING212_API_KEY`/`TRADING212_DEMO_API_KEY` before any module loads,
since `client.ts` validates them at import time. Coverage includes: `t212Get`/`t212Post`/
`t212Delete` (auth header, URL building, error handling) mocking `fetch`; the rate limiter's
sliding-window behavior; and the order/pie write tools' request routing and `readOnlyHint:false`
annotations, mocking the client module directly.

## License

MIT