import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { t212Get } from "../api/client.js";
import { PositionSchema, type Position } from "../api/types.js";
import { jsonResult, readOnlyAnnotations, withEnvironmentTag } from "./shared.js";

export function registerPositionTools(server: McpServer) {
  server.registerTool(
    "get_positions",
    {
      description: withEnvironmentTag("Get all open positions in the Trading212 account."),
      outputSchema: { positions: z.array(PositionSchema) },
      annotations: readOnlyAnnotations("Get Positions"),
    },
    async () => jsonResult({ positions: await t212Get<Position[]>("/equity/positions", "positionsList") })
  );

  server.registerTool(
    "get_position",
    {
      description: withEnvironmentTag(
        "Get a single open position by ticker. Returns an array (0 or 1 items, since tickers are unique)."
      ),
      inputSchema: { ticker: z.string().describe("Trading212 instrument ticker, e.g. AAPL_US_EQ") },
      outputSchema: { positions: z.array(PositionSchema) },
      annotations: readOnlyAnnotations("Get Position"),
    },
    async ({ ticker }) =>
      jsonResult({
        positions: await t212Get<Position[]>("/equity/positions", "positionsList", { ticker }),
      })
  );
}
