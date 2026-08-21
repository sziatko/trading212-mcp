import { describe, expect, it, vi } from "vitest";
import { registerPositionTools } from "./positions.js";

vi.mock("../api/client.js", () => ({
  t212Get: vi.fn().mockResolvedValue([]),
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

describe("position tools", () => {
  it("are annotated readOnlyHint:true", () => {
    const server = createFakeServer();
    registerPositionTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.annotations.readOnlyHint, `${name} should be readOnlyHint:true`).toBe(true);
    }
  });

  it("get_positions fetches /equity/positions with no ticker filter", async () => {
    const { t212Get } = await import("../api/client.js");
    const server = createFakeServer();
    registerPositionTools(server as any);

    await server.tools.get("get_positions")!.callback();

    expect(t212Get).toHaveBeenCalledWith("/equity/positions", "positionsList");
  });

  it("get_position fetches /equity/positions filtered by ticker, sharing the list's rate-limit bucket", async () => {
    const { t212Get } = await import("../api/client.js");
    const server = createFakeServer();
    registerPositionTools(server as any);

    await server.tools.get("get_position")!.callback({ ticker: "AAPL_US_EQ" });

    expect(t212Get).toHaveBeenCalledWith("/equity/positions", "positionsList", {
      ticker: "AAPL_US_EQ",
    });
  });
});
