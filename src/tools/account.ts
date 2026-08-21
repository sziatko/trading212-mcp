import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { t212Get } from "../api/client.js";
import type { AccountSummary, CashBalance } from "../api/types.js";
import { jsonResult, readOnlyAnnotations, withEnvironmentTag } from "./shared.js";

export function registerAccountTools(server: McpServer) {
  server.registerTool(
    "get_cash_balance",
    {
      description: withEnvironmentTag("Get the current cash balance for the Trading212 account."),
      annotations: readOnlyAnnotations("Get Cash Balance"),
    },
    async () => jsonResult(await t212Get<CashBalance>("/equity/account/cash", "accountCash"))
  );

  server.registerTool(
    "get_account_summary",
    {
      description: withEnvironmentTag(
        "Get a full account summary: cash, invested value, profit/loss, and total account value."
      ),
      annotations: readOnlyAnnotations("Get Account Summary"),
    },
    async () => jsonResult(await t212Get<AccountSummary>("/equity/account/summary", "accountSummary"))
  );
}
