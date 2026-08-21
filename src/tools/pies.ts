import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { t212Delete, t212Get, t212Post } from "../api/client.js";
import type { DuplicatePieRequest, PieDetail, PieRequest, PieSummary } from "../api/types.js";
import { jsonResult, readOnlyAnnotations, writeAnnotations } from "./shared.js";

const pieRequestSchema = {
  name: z.string().describe("Pie name."),
  goal: z.number().optional().describe("Total desired value of the pie in account currency."),
  instrumentShares: z
    .record(z.string(), z.number())
    .optional()
    .describe('Ticker to target allocation share, e.g. {"AAPL_US_EQ": 0.5, "MSFT_US_EQ": 0.5}.'),
  dividendCashAction: z.enum(["REINVEST", "TO_ACCOUNT_CASH"]).optional(),
  endDate: z.string().optional().describe("Target completion date (ISO 8601)."),
  icon: z.string().optional(),
};

export function registerPieReadTools(server: McpServer) {
  server.registerTool(
    "get_pies",
    {
      description: "Get all investment pies in the Trading212 account.",
      annotations: readOnlyAnnotations("Get Pies"),
    },
    async () => jsonResult(await t212Get<PieSummary[]>("/equity/pies", "piesList"))
  );

  server.registerTool(
    "get_pie",
    {
      description: "Get a single investment pie by id, including its holdings.",
      inputSchema: { pieId: z.number().describe("Pie id") },
      annotations: readOnlyAnnotations("Get Pie"),
    },
    async ({ pieId }) => jsonResult(await t212Get<PieDetail>(`/equity/pies/${pieId}`, "pieGet"))
  );
}

export function registerPieWriteTools(server: McpServer) {
  server.registerTool(
    "create_pie",
    {
      description: "Create a new investment pie.",
      inputSchema: pieRequestSchema,
      annotations: writeAnnotations("Create Pie"),
    },
    async (body: PieRequest) => jsonResult(await t212Post<PieDetail>("/equity/pies", "pieCreate", body))
  );

  server.registerTool(
    "update_pie",
    {
      description: "Update an existing investment pie's settings and/or allocation.",
      inputSchema: { pieId: z.number().describe("Pie id"), ...pieRequestSchema },
      annotations: writeAnnotations("Update Pie"),
    },
    async ({ pieId, ...body }: PieRequest & { pieId: number }) =>
      jsonResult(await t212Post<PieDetail>(`/equity/pies/${pieId}`, "pieUpdate", body))
  );

  server.registerTool(
    "delete_pie",
    {
      description: "Delete an investment pie by id.",
      inputSchema: { pieId: z.number().describe("Pie id") },
      annotations: writeAnnotations("Delete Pie", { destructive: true }),
    },
    async ({ pieId }) => {
      await t212Delete<void>(`/equity/pies/${pieId}`, "pieDelete");
      return jsonResult({ deleted: true, pieId });
    }
  );

  server.registerTool(
    "duplicate_pie",
    {
      description: "Duplicate an existing investment pie, optionally renaming/re-iconing the copy.",
      inputSchema: {
        pieId: z.number().describe("Pie id to duplicate"),
        name: z.string().optional().describe("Name for the duplicated pie."),
        icon: z.string().optional().describe("Icon for the duplicated pie."),
      },
      annotations: writeAnnotations("Duplicate Pie"),
    },
    async ({ pieId, ...body }: DuplicatePieRequest & { pieId: number }) =>
      jsonResult(await t212Post<PieDetail>(`/equity/pies/${pieId}/duplicate`, "pieDuplicate", body))
  );
}
