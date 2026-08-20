import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { t212Get } from "../trading212/client.js";
import type { AccountSummary, CashBalance } from "../trading212/types.js";
import { jsonResult, readOnlyAnnotations } from "./shared.js";

export function registerAccountTools(server: McpServer) {
  server.registerTool(
    "get_cash_balance",
    {
      description: "Get the current cash balance for the Trading212 account.",
      annotations: readOnlyAnnotations("Get Cash Balance"),
    },
    async () => jsonResult(await t212Get<CashBalance>("/equity/account/cash"))
  );

  server.registerTool(
    "get_account_summary",
    {
      description: "Get a full account summary: cash, invested value, profit/loss, and total account value.",
      annotations: readOnlyAnnotations("Get Account Summary"),
    },
    async () => jsonResult(await t212Get<AccountSummary>("/equity/account/summary"))
  );
}
