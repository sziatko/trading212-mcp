import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { t212Get } from "../api/client.js";
import type { Dividend, PaginatedResponse, Transaction } from "../api/types.js";
import { jsonResult, readOnlyAnnotations } from "./shared.js";
import { paginationSchema } from "./pagination.js";

export function registerHistoryTools(server: McpServer) {
  server.registerTool(
    "get_dividends",
    {
      description: "Get historical dividend payments, paginated.",
      inputSchema: {
        ...paginationSchema,
        ticker: z.string().optional().describe("Filter by instrument ticker."),
      },
      annotations: readOnlyAnnotations("Get Dividends"),
    },
    async ({ cursor, limit, ticker }) =>
      jsonResult(
        await t212Get<PaginatedResponse<Dividend>>("/equity/history/dividends", "dividends", {
          cursor,
          limit,
          ticker,
        })
      )
  );

  server.registerTool(
    "get_transactions",
    {
      description: "Get historical cash movements (deposits, withdrawals, transfers), paginated.",
      inputSchema: {
        ...paginationSchema,
        time: z.string().optional().describe("Retrieve transactions from this ISO 8601 time onward."),
      },
      annotations: readOnlyAnnotations("Get Transactions"),
    },
    async ({ cursor, limit, time }) =>
      jsonResult(
        await t212Get<PaginatedResponse<Transaction>>("/equity/history/transactions", "transactions", {
          cursor,
          limit,
          time,
        })
      )
  );
}
