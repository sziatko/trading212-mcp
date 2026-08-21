import { describe, expect, it, vi } from "vitest";
import { registerAccountTools } from "./account.js";

vi.mock("../api/client.js", () => ({
  t212Get: vi.fn().mockResolvedValue({}),
}));

function createFakeServer() {
  const tools = new Map<string, { config: any; callback: any }>();
  return {
    registerTool: vi.fn((name: string, config: any, callback: any) => {
      tools.set(name, { config, callback });
    }),
    tools,
  };
}

describe("account tools", () => {
  it("are annotated readOnlyHint:true", () => {
    const server = createFakeServer();
    registerAccountTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.annotations.readOnlyHint, `${name} should be readOnlyHint:true`).toBe(true);
    }
  });

  it("declare an outputSchema", () => {
    const server = createFakeServer();
    registerAccountTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.outputSchema, `${name} should declare an outputSchema`).toBeDefined();
    }
  });

  it("get_cash_balance fetches /equity/account/cash and passes the result through as structuredContent", async () => {
    const { t212Get } = await import("../api/client.js");
    vi.mocked(t212Get).mockResolvedValueOnce({ free: 100 });
    const server = createFakeServer();
    registerAccountTools(server as any);

    const result = await server.tools.get("get_cash_balance")!.callback();

    expect(t212Get).toHaveBeenCalledWith("/equity/account/cash", "accountCash");
    expect(result.structuredContent).toEqual({ free: 100 });
  });

  it("get_account_summary fetches /equity/account/summary", async () => {
    const { t212Get } = await import("../api/client.js");
    const server = createFakeServer();
    registerAccountTools(server as any);

    await server.tools.get("get_account_summary")!.callback();

    expect(t212Get).toHaveBeenCalledWith("/equity/account/summary", "accountSummary");
  });
});
