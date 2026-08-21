import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { t212Delete, t212Get, t212Post } from "../api/client.js";
import type {
  HistoricalOrderEntry,
  LimitOrderRequest,
  MarketOrderRequest,
  Order,
  PaginatedResponse,
  StopLimitOrderRequest,
  StopOrderRequest,
} from "../api/types.js";
import { jsonResult, ORDER_LIMITATIONS_NOTE, readOnlyAnnotations, writeAnnotations } from "./shared.js";
import { paginationSchema } from "./pagination.js";

export function registerOrderReadTools(server: McpServer) {
  server.registerTool(
    "get_orders",
    {
      description: "Get all currently open/pending orders.",
      annotations: readOnlyAnnotations("Get Orders"),
    },
    async () => jsonResult(await t212Get<Order[]>("/equity/orders", "ordersList"))
  );

  server.registerTool(
    "get_order",
    {
      description: "Get a single open/pending order by id.",
      inputSchema: { orderId: z.number().describe("Order id") },
      annotations: readOnlyAnnotations("Get Order"),
    },
    async ({ orderId }) => jsonResult(await t212Get<Order>(`/equity/orders/${orderId}`, "orderSingle"))
  );

  server.registerTool(
    "get_order_history",
    {
      description: "Get historical (filled/cancelled) orders, paginated.",
      inputSchema: {
        ...paginationSchema,
        ticker: z.string().optional().describe("Filter by instrument ticker."),
      },
      annotations: readOnlyAnnotations("Get Order History"),
    },
    async ({ cursor, limit, ticker }) =>
      jsonResult(
        await t212Get<PaginatedResponse<HistoricalOrderEntry>>("/equity/history/orders", "orderHistory", {
          cursor,
          limit,
          ticker,
        })
      )
  );
}

export function registerOrderWriteTools(server: McpServer) {
  const ticker = z.string().describe("Trading212 instrument ticker, e.g. AAPL_US_EQ");
  const quantity = z.number().describe("Positive to buy, negative to sell.");
  const timeValidity = z
    .enum(["DAY", "GOOD_TILL_CANCEL"])
    .describe("How long the order stays active if not immediately filled.");

  server.registerTool(
    "place_market_order",
    {
      description: `Place a market order, executed immediately at the next available price. ${ORDER_LIMITATIONS_NOTE}`,
      inputSchema: {
        ticker,
        quantity,
        extendedHours: z.boolean().optional().describe("Allow execution during extended trading hours."),
      },
      annotations: writeAnnotations("Place Market Order"),
    },
    async (body: MarketOrderRequest) =>
      jsonResult(await t212Post<Order>("/equity/orders/market", "placeMarketOrder", body))
  );

  server.registerTool(
    "place_limit_order",
    {
      description: `Place a limit order, executed at a specified price or better. ${ORDER_LIMITATIONS_NOTE}`,
      inputSchema: {
        ticker,
        quantity,
        limitPrice: z.number().describe("The limit price."),
        timeValidity,
      },
      annotations: writeAnnotations("Place Limit Order"),
    },
    async (body: LimitOrderRequest) =>
      jsonResult(await t212Post<Order>("/equity/orders/limit", "placeLimitOrder", body))
  );

  server.registerTool(
    "place_stop_order",
    {
      description: `Place a stop order: becomes a market order once stopPrice is reached. ${ORDER_LIMITATIONS_NOTE}`,
      inputSchema: {
        ticker,
        quantity,
        stopPrice: z.number().describe("The stop trigger price."),
        timeValidity,
      },
      annotations: writeAnnotations("Place Stop Order"),
    },
    async (body: StopOrderRequest) =>
      jsonResult(await t212Post<Order>("/equity/orders/stop", "placeStopOrder", body))
  );

  server.registerTool(
    "place_stop_limit_order",
    {
      description: `Place a stop-limit order: becomes a limit order once stopPrice is reached. ${ORDER_LIMITATIONS_NOTE}`,
      inputSchema: {
        ticker,
        quantity,
        stopPrice: z.number().describe("The stop trigger price."),
        limitPrice: z.number().describe("The limit price once triggered."),
        timeValidity,
      },
      annotations: writeAnnotations("Place Stop-Limit Order"),
    },
    async (body: StopLimitOrderRequest) =>
      jsonResult(await t212Post<Order>("/equity/orders/stop_limit", "placeStopLimitOrder", body))
  );

  server.registerTool(
    "cancel_order",
    {
      description: "Cancel an active, unfilled order by its id.",
      inputSchema: { orderId: z.number().describe("Order id") },
      annotations: writeAnnotations("Cancel Order", { destructive: true }),
    },
    async ({ orderId }) => {
      await t212Delete<void>(`/equity/orders/${orderId}`, "cancelOrder");
      return jsonResult({ cancelled: true, orderId });
    }
  );
}
