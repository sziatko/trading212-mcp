import { describe, expect, it, vi } from "vitest";
import { registerHistoryTools } from "./history.js";

vi.mock("../api/client.js", () => ({
  t212Get: vi.fn().mockResolvedValue({ items: [] }),
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

describe("history tools", () => {
  it("are annotated readOnlyHint:true", () => {
    const server = createFakeServer();
    registerHistoryTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.annotations.readOnlyHint, `${name} should be readOnlyHint:true`).toBe(true);
    }
  });

  it("declare an outputSchema", () => {
    const server = createFakeServer();
    registerHistoryTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.outputSchema, `${name} should declare an outputSchema`).toBeDefined();
    }
  });

  it("get_dividends fetches /equity/history/dividends with pagination params and passes through items/nextPagePath", async () => {
    const { t212Get } = await import("../api/client.js");
    vi.mocked(t212Get).mockResolvedValueOnce({ items: [{ ticker: "AAPL_US_EQ" }], nextPagePath: "next" });
    const server = createFakeServer();
    registerHistoryTools(server as any);

    const result = await server.tools.get("get_dividends")!.callback({ cursor: 3, limit: 20 });

    expect(t212Get).toHaveBeenCalledWith("/equity/history/dividends", "dividends", {
      cursor: 3,
      limit: 20,
    });
    expect(result.structuredContent).toEqual({
      items: [{ ticker: "AAPL_US_EQ" }],
      nextPagePath: "next",
    });
  });

  it("get_transactions fetches /equity/history/transactions with pagination params and passes through items/nextPagePath", async () => {
    const { t212Get } = await import("../api/client.js");
    vi.mocked(t212Get).mockResolvedValueOnce({ items: [{ amount: 5 }], nextPagePath: undefined });
    const server = createFakeServer();
    registerHistoryTools(server as any);

    const result = await server.tools.get("get_transactions")!.callback({ cursor: 1, limit: 5 });

    expect(t212Get).toHaveBeenCalledWith("/equity/history/transactions", "transactions", {
      cursor: 1,
      limit: 5,
    });
    expect(result.structuredContent).toEqual({ items: [{ amount: 5 }] });
  });
});
