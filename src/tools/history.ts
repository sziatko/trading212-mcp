import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { t212Get } from "../trading212/client.js";
import type { Dividend, PaginatedResponse, Transaction } from "../trading212/types.js";
import { jsonResult, readOnlyAnnotations } from "./shared.js";
import { paginationSchema } from "./pagination.js";

export function registerHistoryTools(server: McpServer) {
  server.registerTool(
    "get_dividends",
    {
      description: "Get historical dividend payments, paginated.",
      inputSchema: paginationSchema,
      annotations: readOnlyAnnotations("Get Dividends"),
    },
    async ({ cursor, limit }) =>
      jsonResult(await t212Get<PaginatedResponse<Dividend>>("/equity/history/dividends", { cursor, limit }))
  );

  server.registerTool(
    "get_transactions",
    {
      description: "Get historical cash movements (deposits, withdrawals, transfers), paginated.",
      inputSchema: paginationSchema,
      annotations: readOnlyAnnotations("Get Transactions"),
    },
    async ({ cursor, limit }) =>
      jsonResult(
        await t212Get<PaginatedResponse<Transaction>>("/equity/history/transactions", { cursor, limit })
      )
  );
}
