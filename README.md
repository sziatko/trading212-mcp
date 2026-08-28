# trading212-mcp

[![CI](https://github.com/sziatko/trading212-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sziatko/trading212-mcp/actions/workflows/ci.yml)

An MCP server that connects Claude to your Trading212 account. It reads your real account data —
cash balance, open positions, orders, pies, and history — so you can ask about your investments
directly in a chat with Claude. Optionally, with write tools enabled, Claude can also place and
cancel orders and manage pies (create/update/delete/duplicate), always with your explicit approval
before each action. Read tools are read-only by design; write tools are off by default and every
call still requires your explicit approval in Claude Desktop before it runs — nothing executes
silently, and the whole thing is open source and runs locally on your machine.

## Install

1. **[Download trading212-mcp.mcpb](../../releases/latest/download/trading212-mcp.mcpb)**
2. Double-click it (or drag it into the Claude Desktop window) to install.
3. Claude Desktop will prompt for your Trading212 API key(s), whether to use your live or demo
   account, and let you toggle individual tool categories (including write tools) on/off — no
   terminal, no Node.js, no build step needed.

You'll need a Trading212 account and an API key (from the Trading212 web app, under API settings),
and Claude Desktop.

## Status

Both read tools and write tools (orders, pies) are implemented. Write tools are off by default —
see [Configuration](#configuration) to enable them.

## Running from source (for development)

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

**Changing any setting requires a full Claude Desktop restart** (quit and reopen, not just a new
chat) to take effect. This is a Claude Desktop limitation, not something this server controls:
settings are passed in as environment variables when Claude Desktop spawns the server process, and
a running process can't pick up new environment variables from outside — only a fresh process
launch does. There is currently no way to reload a single extension without restarting the whole
app; see [Anthropic's own documentation](https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop),
which states the same restart requirement.

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

**Write tools on a remote instance.** If you deploy this server over HTTP (see
[Remote deployment (Render)](#remote-deployment-render)), it's recommended to leave
`ENABLE_ORDER_WRITE_TOOLS` and `ENABLE_PIE_WRITE_TOOLS` at their default `false`. A public HTTPS
endpoint has a much wider attack surface than a local stdio subprocess that only Claude Desktop can
talk to. The code doesn't force this — the defaults are already `false` — it's just the recommended
posture for a remote deployment.

## Remote deployment (Render)

By default the server talks to Claude over **stdio** — Claude Desktop launches it as a local
subprocess, so it only works on the machine it's installed on. Set `TRANSPORT=http` and it instead
runs a **Streamable HTTP** server, which you can deploy once and connect to from desktop, web, and
mobile Claude as a custom connector.

The repo ships a [`render.yaml`](render.yaml) Blueprint for [Render](https://render.com). Checklist:

1. **Generate an auth token:**

   ```
   openssl rand -hex 32
   ```

   Keep it somewhere safe — you'll paste it into Render and into Claude. The server refuses to
   start with `TRANSPORT=http` unless `MCP_AUTH_TOKEN` is set, and it's never logged.

2. **Create the service.** In Render: *New → Blueprint*, point it at your fork of this repo. Render
   reads `render.yaml` (`type: web`, `env: node`, build `npm install && npm run build`, start
   `node dist/index.js`, health check `/healthz`) and prompts for every environment variable,
   since they're all marked `sync: false`:

   | Variable | Value |
   | --- | --- |
   | `TRANSPORT` | `http` (already set in `render.yaml`) |
   | `MCP_AUTH_TOKEN` | the token from step 1 |
   | `TRADING212_API_KEY` / `TRADING212_DEMO_API_KEY` | your Trading212 key(s) |
   | `TRADING212_USE_LIVE` | `false` for demo (recommended), `true` for your live account |
   | `ENABLE_*` tool toggles | optional; omit to accept the defaults |
   | `ENABLE_ORDER_WRITE_TOOLS` / `ENABLE_PIE_WRITE_TOOLS` | leave unset / `false` — see the warning under [Configuration](#configuration) |

   You don't need to set `PORT` — Render provides it and the server binds `0.0.0.0:$PORT`.

3. **Wait for the first deploy**, then check `https://<service>.onrender.com/healthz` returns
   `OK`.

4. **Add it to Claude** as a custom connector: *Settings → Connectors → Add custom connector*,
   URL `https://<service>.onrender.com/mcp`, and supply the token from step 1 as the bearer
   token / API key. Every request to `/mcp` must carry `Authorization: Bearer <token>`; anything
   else gets a `401`.

**Cold starts on Render's free tier.** A free web service sleeps after ~15 minutes of inactivity.
The next request wakes it, which can take ~30–60 seconds before the first response — normal for
occasional personal use. If that's annoying, either move to a paid instance or hit `/healthz` on a
schedule (e.g. an external cron ping) to keep it warm.

## Project structure

- `src/index.ts` — entrypoint. Picks the transport: `TRANSPORT=http` starts the Streamable HTTP
  server (`src/http.ts`), anything else connects `src/server.ts` over stdio so Claude Desktop can
  launch it as a subprocess.
- `src/server.ts` — `createMcpServer()`: builds the `McpServer` and registers every enabled tool
  category. Transport-agnostic — both entrypoints call it.
- `src/http.ts` — the Streamable HTTP transport: a Node `http` server with `GET /healthz`, a
  bearer-token auth check (`MCP_AUTH_TOKEN`) on `/mcp`, and a fresh stateless
  `StreamableHTTPServerTransport` per request. Refuses to start without `MCP_AUTH_TOKEN`.
- `src/api/client.ts` — `t212Get/t212Post/t212Delete`, typed wrappers around `fetch` that pick the
  live or demo base URL and API key, add the `Authorization: Basic <key>` header, enforce the
  per-endpoint rate limit before sending, and throw on non-2xx responses. Every tool calls the
  Trading212 API through these functions.
- `src/api/types.ts` — Zod schemas for the shapes sent/returned by the Trading212 API (cash,
  positions, orders, pies, etc); each schema's TypeScript type is derived from it via `z.infer`, so
  there's one source of truth. Not currently used as `outputSchema` (see below) — the types are
  still the canonical reference and are ready to be re-wired once that's viable again. Kept
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

Every tool result carries a `structuredContent` block (JSON, for clients that read structured
output) alongside the usual `content` text block. **Tools currently do not declare an
`outputSchema`.** They did originally — built from the Zod schemas in `src/api/types.ts`, so Claude
could see a tool's exact return shape before calling it — but `@modelcontextprotocol/sdk` generates
`outputSchema` as JSON Schema draft-07, and Claude Desktop's bundled MCP client validates declared
schemas against 2020-12 only, rejecting draft-07 outright. That made every single tool call fail
with an "invalid outputSchema ... unsupported dialect" error. This is a known interop gap between
v1-SDK servers and v2 clients
([modelcontextprotocol/typescript-sdk#2532](https://github.com/modelcontextprotocol/typescript-sdk/issues/2532),
[anthropics/claude-code#86142](https://github.com/anthropics/claude-code/issues/86142)); the fix
shipped in a separate client package this server doesn't control, so `outputSchema` is dropped from
all 22 tools until Claude Desktop ships a build with the updated bundled client. The Zod schemas
stay in `src/api/types.ts` as the source of truth, ready to be re-wired once that lands.

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
it's a five-line transport switch (stdio vs HTTP), not worth mocking a transport to test.
`coverage.all: true` is set so a file with zero tests shows up as 0% rather than being silently
omitted from the report).

`test/setup.ts` stubs `TRADING212_API_KEY`/`TRADING212_DEMO_API_KEY` before any module loads,
since `client.ts` validates them at import time. Coverage includes: `t212Get`/`t212Post`/
`t212Delete` (auth header, URL building, error handling) mocking `fetch`; the rate limiter's
sliding-window behavior; the order/pie write tools' request routing and `readOnlyHint:false`
annotations, mocking the client module directly; and the HTTP transport (`src/http.ts`) — the
bearer-token auth check, `GET /healthz`, the `401` on a missing/invalid token, the
refuse-to-start-without-`MCP_AUTH_TOKEN` guard, and an end-to-end `initialize` round-trip against a
real `StreamableHTTPServerTransport` on an ephemeral port.

## License

MIT