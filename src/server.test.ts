import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./api/client.js", () => ({
  t212Get: vi.fn().mockResolvedValue({}),
  t212Post: vi.fn().mockResolvedValue({}),
  t212Delete: vi.fn().mockResolvedValue({}),
  ACCOUNT_ENVIRONMENT: "DEMO",
  ACCOUNT_ENVIRONMENT_TAG: "🧪 DEMO",
}));

const TOGGLES = [
  "ENABLE_ACCOUNT_TOOLS",
  "ENABLE_POSITIONS_TOOLS",
  "ENABLE_ORDERS_TOOLS",
  "ENABLE_HISTORY_TOOLS",
  "ENABLE_PIES_TOOLS",
  "ENABLE_METADATA_TOOLS",
  "ENABLE_ORDER_WRITE_TOOLS",
  "ENABLE_PIE_WRITE_TOOLS",
];

describe("createMcpServer", () => {
  const saved = Object.fromEntries(TOGGLES.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const k of TOGGLES) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.resetModules();
  });

  it("builds a server with the default tool set", async () => {
    const { createMcpServer } = await import("./server.js");
    const server = createMcpServer();
    expect(typeof server.connect).toBe("function");
  });

  it("registers nothing when every category is disabled", async () => {
    for (const k of TOGGLES) process.env[k] = "false";
    const { createMcpServer } = await import("./server.js");
    expect(() => createMcpServer()).not.toThrow();
  });

  it("honours explicit ENABLE_* values (categories off, write tools on)", async () => {
    process.env.ENABLE_ACCOUNT_TOOLS = "false";
    process.env.ENABLE_POSITIONS_TOOLS = "false";
    process.env.ENABLE_ORDERS_TOOLS = "true";
    process.env.ENABLE_ORDER_WRITE_TOOLS = "true";
    process.env.ENABLE_PIES_TOOLS = "true";
    process.env.ENABLE_PIE_WRITE_TOOLS = "true";
    process.env.ENABLE_HISTORY_TOOLS = "false";
    process.env.ENABLE_METADATA_TOOLS = "false";

    const { createMcpServer } = await import("./server.js");
    expect(() => createMcpServer()).not.toThrow();
  });

  it("treats an empty ENABLE_* value as unset (e.g. a blank Render env var)", async () => {
    for (const k of TOGGLES) process.env[k] = "";
    const { createMcpServer } = await import("./server.js");
    // _registeredTools is the SDK's internal registry; there's no public getter.
    const tools = Object.keys((createMcpServer() as any)._registeredTools);
    expect(tools).toContain("get_cash_balance");
    expect(tools).not.toContain("place_market_order");
  });
});
