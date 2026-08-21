import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { t212Get } from "../api/client.js";
import type { Exchange, Instrument } from "../api/types.js";
import { jsonResult, readOnlyAnnotations } from "./shared.js";

export function registerMetadataTools(server: McpServer) {
  server.registerTool(
    "get_instruments",
    {
      description: "Get metadata for all tradeable instruments (tickers, names, ISINs, currencies, etc).",
      annotations: readOnlyAnnotations("Get Instruments"),
    },
    async () => jsonResult(await t212Get<Instrument[]>("/equity/metadata/instruments", "instruments"))
  );

  server.registerTool(
    "get_exchanges",
    {
      description: "Get metadata for all exchanges, including their working schedules.",
      annotations: readOnlyAnnotations("Get Exchanges"),
    },
    async () => jsonResult(await t212Get<Exchange[]>("/equity/metadata/exchanges", "exchanges"))
  );
}
