#!/usr/bin/env node
// Calls every tool through the real MCP protocol (stdio), against the real
// Trading212 demo API. This is a hands-off analog of manually chatting with
// Claude Desktop and asking it to run each tool.
//
// Usage:
//   node scripts/mcp-integration-test.mjs          # read tools only
//   node scripts/mcp-integration-test.mjs --write   # also exercise write tools
//
// Requires TRADING212_DEMO_API_KEY in .env (or the environment). Always runs
// against DEMO — this script hardcodes TRADING212_USE_LIVE=false and ignores
// any live key, on purpose, since --write places real (demo) orders and
// creates/deletes a real (demo) pie.

import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RUN_WRITE = process.argv.includes("--write");

console.log(`Building project...`);
execSync("npm run build", { cwd: ROOT, stdio: "inherit" });

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(ROOT, "dist/index.js")],
  cwd: ROOT,
  env: {
    ...process.env,
    // Hard safety rail: this script must never run against the live account.
    TRADING212_USE_LIVE: "false",
    ENABLE_ACCOUNT_TOOLS: "true",
    ENABLE_POSITIONS_TOOLS: "true",
    ENABLE_ORDERS_TOOLS: "true",
    ENABLE_HISTORY_TOOLS: "true",
    ENABLE_PIES_TOOLS: "true",
    ENABLE_METADATA_TOOLS: "true",
    ENABLE_ORDER_WRITE_TOOLS: "true",
    ENABLE_PIE_WRITE_TOOLS: "true",
  },
});

const client = new Client({ name: "t212-mcp-integration-test", version: "0.0.0" });

try {
  await client.connect(transport);
} catch (err) {
  console.error(
    "Failed to start/connect to the server. Most likely TRADING212_DEMO_API_KEY is missing from .env.\n" +
      String(err?.message ?? err)
  );
  process.exit(1);
}

const results = [];

async function call(name, args) {
  try {
    const res = await client.callTool({ name, arguments: args ?? {} });
    if (res.isError) {
      const detail = res.content?.[0]?.text ?? "(no message)";
      results.push({ name, status: "TOOL_ERROR", detail });
      console.log(`ERROR  ${name}: ${detail}`);
    } else {
      results.push({ name, status: "OK" });
      console.log(`OK     ${name}`);
    }
    return res;
  } catch (err) {
    const detail = String(err?.message ?? err);
    results.push({ name, status: "THROW", detail });
    console.log(`THROW  ${name}: ${detail}`);
    return null;
  }
}

function skip(name, reason) {
  results.push({ name, status: "SKIP", detail: reason });
  console.log(`SKIP   ${name} (${reason})`);
}

console.log("\n=== Read tools ===\n");

await call("get_cash_balance");
await call("get_account_summary");

const positionsRes = await call("get_positions");
const ticker = positionsRes?.structuredContent?.positions?.[0]?.instrument?.ticker;
if (ticker) {
  await call("get_position", { ticker });
} else {
  skip("get_position", "no open positions to look up");
}

const ordersRes = await call("get_orders");
const existingOrderId = ordersRes?.structuredContent?.orders?.[0]?.id;
if (existingOrderId) {
  await call("get_order", { orderId: existingOrderId });
} else {
  skip("get_order", "no open orders to look up");
}

await call("get_order_history", { limit: 5 });
await call("get_dividends", { limit: 5 });
await call("get_transactions", { limit: 5 });

const piesRes = await call("get_pies");
const existingPieId = piesRes?.structuredContent?.pies?.[0]?.id;
if (existingPieId) {
  await call("get_pie", { pieId: existingPieId });
} else {
  skip("get_pie", "no existing pies to look up");
}

const instrumentsRes = await call("get_instruments");
console.log(`       (${instrumentsRes?.structuredContent?.instruments?.length ?? 0} instruments returned)`);
await call("get_exchanges");

if (RUN_WRITE) {
  console.log("\n=== Write tools (DEMO account — real side effects) ===\n");

  const limitRes = await call("place_limit_order", {
    ticker: "AAPL_US_EQ",
    quantity: 1,
    limitPrice: 50,
    timeValidity: "DAY",
  });
  const limitOrderId = limitRes?.structuredContent?.id;
  if (limitOrderId) {
    await call("cancel_order", { orderId: limitOrderId });
  } else {
    skip("cancel_order", "place_limit_order didn't return an order id");
  }

  await call("place_market_order", { ticker: "AAPL_US_EQ", quantity: 2 });

  const stopRes = await call("place_stop_order", {
    ticker: "AAPL_US_EQ",
    quantity: -1,
    stopPrice: 50,
    timeValidity: "DAY",
  });
  const stopLimitRes = await call("place_stop_limit_order", {
    ticker: "AAPL_US_EQ",
    quantity: -1,
    stopPrice: 50,
    limitPrice: 50,
    timeValidity: "DAY",
  });
  for (const [label, res] of [
    ["stop", stopRes],
    ["stop-limit", stopLimitRes],
  ]) {
    const id = res?.structuredContent?.id;
    if (id) await call("cancel_order", { orderId: id });
    else skip(`cancel_order (${label} cleanup)`, `place_${label}_order didn't return an order id`);
  }

  const pieName = `MCP Test Pie ${new Date().toISOString()}`;
  const createRes = await call("create_pie", {
    name: pieName,
    goal: 1000,
    instrumentShares: { AAPL_US_EQ: 0.5, MSFT_US_EQ: 0.5 },
  });
  const originalPieId = createRes?.structuredContent?.settings?.id;

  if (originalPieId) {
    const dupRes = await call("duplicate_pie", { pieId: originalPieId });
    const dupPieId = dupRes?.structuredContent?.settings?.id;

    if (dupPieId) {
      await call("update_pie", { pieId: dupPieId, name: `${pieName} (renamed)` });
      await call("delete_pie", { pieId: dupPieId });
    } else {
      skip("update_pie", "duplicate_pie didn't return a pie id");
      skip("delete_pie (duplicate)", "duplicate_pie didn't return a pie id");
    }

    await call("delete_pie", { pieId: originalPieId });
  } else {
    skip("duplicate_pie", "create_pie didn't return a pie id");
    skip("update_pie", "create_pie didn't return a pie id");
    skip("delete_pie", "create_pie didn't return a pie id");
  }
} else {
  console.log("\n(skipping write tools — pass --write to exercise them)\n");
}

await client.close();

console.log("\n=== Summary ===\n");
const byStatus = { OK: 0, TOOL_ERROR: 0, THROW: 0, SKIP: 0 };
for (const r of results) byStatus[r.status]++;
console.log(
  `${results.length} tools tested — ${byStatus.OK} ok, ${byStatus.TOOL_ERROR} tool errors, ` +
    `${byStatus.THROW} threw, ${byStatus.SKIP} skipped\n`
);
for (const r of results) {
  if (r.status !== "OK") console.log(`  ${r.status.padEnd(10)} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
}

process.exit(byStatus.THROW > 0 || byStatus.TOOL_ERROR > 0 ? 1 : 0);
