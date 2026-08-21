import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { t212Get } from "../api/client.js";
import { ExchangeSchema, InstrumentSchema, type Exchange, type Instrument } from "../api/types.js";
import { jsonResult, readOnlyAnnotations } from "./shared.js";

export function registerMetadataTools(server: McpServer) {
  server.registerTool(
    "get_instruments",
    {
      description: "Get metadata for all tradeable instruments (tickers, names, ISINs, currencies, etc).",
      outputSchema: { instruments: z.array(InstrumentSchema) },
      annotations: readOnlyAnnotations("Get Instruments"),
    },
    async () =>
      jsonResult({
        instruments: await t212Get<Instrument[]>("/equity/metadata/instruments", "instruments"),
      })
  );

  server.registerTool(
    "get_exchanges",
    {
      description: "Get metadata for all exchanges, including their working schedules.",
      outputSchema: { exchanges: z.array(ExchangeSchema) },
      annotations: readOnlyAnnotations("Get Exchanges"),
    },
    async () =>
      jsonResult({ exchanges: await t212Get<Exchange[]>("/equity/metadata/exchanges", "exchanges") })
  );
}
