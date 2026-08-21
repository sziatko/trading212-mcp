import { describe, expect, it, vi } from "vitest";
import { registerMetadataTools } from "./metadata.js";

vi.mock("../api/client.js", () => ({
  t212Get: vi.fn().mockResolvedValue([]),
  ACCOUNT_ENVIRONMENT_TAG: "🧪 DEMO",
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

  it("omit outputSchema (Claude Desktop rejects the draft-07 dialect the SDK emits)", () => {
    const server = createFakeServer();
    registerMetadataTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.outputSchema, `${name} should not declare an outputSchema`).toBeUndefined();
    }
  });

  it("tag every description with the live/demo environment", () => {
    const server = createFakeServer();
    registerMetadataTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.description, `${name} should start with the environment tag`).toMatch(/^🧪 DEMO /);
    }
  });

  it("get_instruments fetches /equity/metadata/instruments and wraps the array as structuredContent", async () => {
    const { t212Get } = await import("../api/client.js");
    vi.mocked(t212Get).mockResolvedValueOnce([{ ticker: "AAPL_US_EQ" }]);
    const server = createFakeServer();
    registerMetadataTools(server as any);

    const result = await server.tools.get("get_instruments")!.callback();

    expect(t212Get).toHaveBeenCalledWith("/equity/metadata/instruments", "instruments");
    expect(result.structuredContent).toEqual({ instruments: [{ ticker: "AAPL_US_EQ" }] });
  });

  it("get_exchanges fetches /equity/metadata/exchanges and wraps the array as structuredContent", async () => {
    const { t212Get } = await import("../api/client.js");
    vi.mocked(t212Get).mockResolvedValueOnce([{ id: 1 }]);
    const server = createFakeServer();
    registerMetadataTools(server as any);

    const result = await server.tools.get("get_exchanges")!.callback();

    expect(t212Get).toHaveBeenCalledWith("/equity/metadata/exchanges", "exchanges");
    expect(result.structuredContent).toEqual({ exchanges: [{ id: 1 }] });
  });
});
