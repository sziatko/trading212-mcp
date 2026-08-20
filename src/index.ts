import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAccountTools } from "./tools/account.js";
import { registerPositionTools } from "./tools/positions.js";
import { registerOrderReadTools, registerOrderWriteTools } from "./tools/orders.js";
import { registerHistoryTools } from "./tools/history.js";
import { registerPieReadTools, registerPieWriteTools } from "./tools/pies.js";
import { registerMetadataTools } from "./tools/metadata.js";

function isEnabled(envVar: string, defaultValue = true) {
  const value = process.env[envVar];
  if (value === undefined) return defaultValue;
  return value === "true";
}

const server = new McpServer({
  name: "trading212-mcp",
  version: "0.2.0",
});

if (isEnabled("ENABLE_ACCOUNT_TOOLS")) registerAccountTools(server);
if (isEnabled("ENABLE_POSITIONS_TOOLS")) registerPositionTools(server);
if (isEnabled("ENABLE_ORDERS_TOOLS")) {
  registerOrderReadTools(server);
  if (isEnabled("ENABLE_ORDER_WRITE_TOOLS", false)) registerOrderWriteTools(server);
}
if (isEnabled("ENABLE_HISTORY_TOOLS")) registerHistoryTools(server);
if (isEnabled("ENABLE_PIES_TOOLS")) {
  registerPieReadTools(server);
  if (isEnabled("ENABLE_PIE_WRITE_TOOLS", false)) registerPieWriteTools(server);
}
if (isEnabled("ENABLE_METADATA_TOOLS")) registerMetadataTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
