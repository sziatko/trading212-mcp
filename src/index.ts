import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAccountTools } from "./tools/account.js";
import { registerPositionTools } from "./tools/positions.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerHistoryTools } from "./tools/history.js";
import { registerPieTools } from "./tools/pies.js";
import { registerMetadataTools } from "./tools/metadata.js";

function isEnabled(envVar: string) {
  return process.env[envVar] !== "false";
}

const server = new McpServer({
  name: "trading212-mcp",
  version: "0.1.0",
});

if (isEnabled("ENABLE_ACCOUNT_TOOLS")) registerAccountTools(server);
if (isEnabled("ENABLE_POSITIONS_TOOLS")) registerPositionTools(server);
if (isEnabled("ENABLE_ORDERS_TOOLS")) registerOrderTools(server);
if (isEnabled("ENABLE_HISTORY_TOOLS")) registerHistoryTools(server);
if (isEnabled("ENABLE_PIES_TOOLS")) registerPieTools(server);
if (isEnabled("ENABLE_METADATA_TOOLS")) registerMetadataTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
