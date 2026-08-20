import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { t212Get } from "../trading212/client.js";
import type { HistoricalOrderEntry, Order, PaginatedResponse } from "../trading212/types.js";
import { jsonResult, readOnlyAnnotations } from "./shared.js";
import { paginationSchema } from "./pagination.js";

export function registerOrderTools(server: McpServer) {
  server.registerTool(
    "get_orders",
    {
      description: "Get all currently open/pending orders.",
      annotations: readOnlyAnnotations("Get Orders"),
    },
    async () => jsonResult(await t212Get<Order[]>("/equity/orders"))
  );

  server.registerTool(
    "get_order",
    {
      description: "Get a single open/pending order by id.",
      inputSchema: { orderId: z.number().describe("Order id") },
      annotations: readOnlyAnnotations("Get Order"),
    },
    async ({ orderId }) => jsonResult(await t212Get<Order>(`/equity/orders/${orderId}`))
  );

  server.registerTool(
    "get_order_history",
    {
      description: "Get historical (filled/cancelled) orders, paginated.",
      inputSchema: paginationSchema,
      annotations: readOnlyAnnotations("Get Order History"),
    },
    async ({ cursor, limit }) =>
      jsonResult(
        await t212Get<PaginatedResponse<HistoricalOrderEntry>>("/equity/history/orders", { cursor, limit })
      )
  );
}
