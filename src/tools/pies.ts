import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { t212Get } from "../trading212/client.js";
import type { Pie } from "../trading212/types.js";
import { jsonResult, readOnlyAnnotations } from "./shared.js";

export function registerPieTools(server: McpServer) {
  server.registerTool(
    "get_pies",
    {
      description: "Get all investment pies in the Trading212 account.",
      annotations: readOnlyAnnotations("Get Pies"),
    },
    async () => jsonResult(await t212Get<Pie[]>("/equity/pies"))
  );

  server.registerTool(
    "get_pie",
    {
      description: "Get a single investment pie by id, including its holdings.",
      inputSchema: { pieId: z.number().describe("Pie id") },
      annotations: readOnlyAnnotations("Get Pie"),
    },
    async ({ pieId }) => jsonResult(await t212Get<Pie>(`/equity/pies/${pieId}`))
  );
}
