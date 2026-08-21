import { describe, expect, it, vi } from "vitest";
import { registerMetadataTools } from "./metadata.js";

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

describe("metadata tools", () => {
  it("are annotated readOnlyHint:true", () => {
    const server = createFakeServer();
    registerMetadataTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.annotations.readOnlyHint, `${name} should be readOnlyHint:true`).toBe(true);
    }
  });

  it("get_instruments fetches /equity/metadata/instruments", async () => {
    const { t212Get } = await import("../api/client.js");
    const server = createFakeServer();
    registerMetadataTools(server as any);

    await server.tools.get("get_instruments")!.callback();

    expect(t212Get).toHaveBeenCalledWith("/equity/metadata/instruments", "instruments");
  });

  it("get_exchanges fetches /equity/metadata/exchanges", async () => {
    const { t212Get } = await import("../api/client.js");
    const server = createFakeServer();
    registerMetadataTools(server as any);

    await server.tools.get("get_exchanges")!.callback();

    expect(t212Get).toHaveBeenCalledWith("/equity/metadata/exchanges", "exchanges");
  });
});
