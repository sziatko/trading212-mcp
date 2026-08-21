import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { t212Get } from "../api/client.js";
import type { Dividend, PaginatedResponse, Transaction } from "../api/types.js";
import { jsonResult, readOnlyAnnotations, withEnvironmentTag } from "./shared.js";
import { paginationSchema } from "./pagination.js";

export function registerHistoryTools(server: McpServer) {
  server.registerTool(
    "get_dividends",
    {
      description: withEnvironmentTag("Get historical dividend payments, paginated."),
      inputSchema: {
        ...paginationSchema,
        ticker: z.string().optional().describe("Filter by instrument ticker."),
      },
      annotations: readOnlyAnnotations("Get Dividends"),
    },
    async ({ cursor, limit, ticker }) => {
      const data = await t212Get<PaginatedResponse<Dividend>>("/equity/history/dividends", "dividends", {
        cursor,
        limit,
        ticker,
      });
      return jsonResult({ items: data.items, nextPagePath: data.nextPagePath });
    }
  );

  server.registerTool(
    "get_transactions",
    {
      description: withEnvironmentTag(
        "Get historical cash movements (deposits, withdrawals, transfers), paginated."
      ),
      inputSchema: {
        ...paginationSchema,    
        cursor: z.string().optional().describe("Pagination cursor from a previous response (a transaction id, not a number)."),
        time: z
          .string()
          .optional()
          .describe(
            "ISO 8601/RFC3339 timestamp. Must be combined with `cursor` — Trading212 rejects `time` supplied alone."
          ),
      },
      annotations: readOnlyAnnotations("Get Transactions"),
    },
    async ({ cursor, limit, time }) => {
      const data = await t212Get<PaginatedResponse<Transaction>>(
        "/equity/history/transactions",
        "transactions",
        { cursor, limit, time }
      );
      return jsonResult({ items: data.items, nextPagePath: data.nextPagePath });
    }
  );
}
