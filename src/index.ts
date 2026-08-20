import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAccountTools } from "./tools/account.js";
import { registerPositionTools } from "./tools/positions.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerHistoryTools } from "./tools/history.js";
import { registerPieTools } from "./tools/pies.js";
import { registerMetadataTools } from "./tools/metadata.js";

const server = new McpServer({
  name: "trading212-mcp",
  version: "0.1.0",
});

registerAccountTools(server);
registerPositionTools(server);
registerOrderTools(server);
registerHistoryTools(server);
registerPieTools(server);
registerMetadataTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
