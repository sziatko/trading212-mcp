# trading212-mcp

An MCP server that connects Claude to your Trading212 account. It reads your real account data,
such as cash balance, open positions, and order history, so you can ask about your investments
directly in a chat with Claude. A later stage will add the ability to place and cancel orders.

## Status

Early development. Stage 1 (read-only data) is in progress. Stage 2 (placing orders) has not
started yet. See `ROADMAP.md` for the full plan.

## Requirements

- Node.js 20 or newer
- A Trading212 account and an API key (from the Trading212 web app, under API settings)
- Claude Desktop, to use this server as a local extension

## Setup

1. Clone this repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add your Trading212 API key.
4. Run `npm run dev` to start the server locally.
5. Add the server to Claude Desktop as a local extension, pointing to this project folder.

## Data source

By default, this server reads from your Trading212 account as configured in `.env`. See
`ROADMAP.md` for the plan to add a Demo vs Live switch and an in-app settings screen.

## Project structure

- `src/index.ts` — entrypoint. Creates the MCP server, registers all tools, and connects it over
  stdio so Claude Desktop can launch it as a subprocess.
- `src/trading212/client.ts` — `t212Get<T>()`, a small typed wrapper around `fetch` that builds
  the request URL, adds the `Authorization: Basic <key>` header, and throws on non-2xx responses.
  Every tool calls the Trading212 API through this one function.
- `src/trading212/types.ts` — TypeScript interfaces for the shapes returned by the Trading212 API
  (cash, positions, orders, pies, etc), used to type the client's responses.
- `src/tools/` — one file per API domain (`account.ts`, `positions.ts`, `orders.ts`, `history.ts`,
  `pies.ts`, `metadata.ts`). Each exports a `register*Tools(server)` function that registers its
  domain's MCP tools. `shared.ts` and `pagination.ts` hold small helpers reused across them.

## Available tools

All tools are read-only (`readOnlyHint: true`) and hit the live Trading212 API.

| Tool | Description |
| --- | --- |
| `get_cash_balance` | Current cash balance. |
| `get_account_summary` | Full account summary: cash, invested value, profit/loss, total value. |
| `get_positions` | All open positions. |
| `get_position` | A single open position by ticker. |
| `get_orders` | All currently open/pending orders. |
| `get_order` | A single open/pending order by id. |
| `get_order_history` | Historical (filled/cancelled) orders, paginated. |
| `get_dividends` | Historical dividend payments, paginated. |
| `get_transactions` | Historical cash movements (deposits, withdrawals, transfers), paginated. |
| `get_pies` | All investment pies. |
| `get_pie` | A single investment pie by id, including its holdings. |
| `get_instruments` | Metadata for all tradeable instruments (tickers, names, ISINs, currencies). |
| `get_exchanges` | Metadata for all exchanges, including their working schedules. |

## Testing

Unit tests use [Vitest](https://vitest.dev). Run them with:

```
npm test
```

`test/setup.ts` stubs `TRADING212_API_KEY` before any module loads, since `client.ts` validates
it at import time. Tests mock `fetch` rather than calling the live API.

## License

MIT