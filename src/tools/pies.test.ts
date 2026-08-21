import { describe, expect, it, vi } from "vitest";
import { registerPieReadTools, registerPieWriteTools } from "./pies.js";

vi.mock("../api/client.js", () => ({
  t212Get: vi.fn().mockResolvedValue([]),
  t212Post: vi.fn().mockResolvedValue({ settings: { id: 1 } }),
  t212Delete: vi.fn().mockResolvedValue(undefined),
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

describe("pie write tools", () => {
  it("are all annotated readOnlyHint:false so clients always prompt before running them", () => {
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.annotations.readOnlyHint, `${name} should not be readOnlyHint:true`).toBe(false);
    }
  });

  it("declare an outputSchema", () => {
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.outputSchema, `${name} should declare an outputSchema`).toBeDefined();
    }
  });

  it("create_pie posts the given fields to /equity/pies", async () => {
    const { t212Post } = await import("../api/client.js");
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    const body = { name: "Growth", goal: 1000 };
    await server.tools.get("create_pie")!.callback(body);

    expect(t212Post).toHaveBeenCalledWith("/equity/pies", "pieCreate", body);
  });

  it("update_pie strips pieId from the body and posts to /equity/pies/{id}", async () => {
    const { t212Post } = await import("../api/client.js");
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    await server.tools.get("update_pie")!.callback({ pieId: 7, name: "Renamed" });

    expect(t212Post).toHaveBeenCalledWith("/equity/pies/7", "pieUpdate", { name: "Renamed" });
  });

  it("delete_pie deletes /equity/pies/{id} and reports the result", async () => {
    const { t212Delete } = await import("../api/client.js");
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    const result = await server.tools.get("delete_pie")!.callback({ pieId: 9 });

    expect(t212Delete).toHaveBeenCalledWith("/equity/pies/9", "pieDelete");
    expect(result.content[0].text).toContain('"deleted": true');
    expect(result.content[0].text).toContain('"pieId": 9');
    expect(result.structuredContent).toEqual({ deleted: true, pieId: 9 });
  });

  it("duplicate_pie posts to /equity/pies/{id}/duplicate", async () => {
    const { t212Post } = await import("../api/client.js");
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    await server.tools.get("duplicate_pie")!.callback({ pieId: 3 });

    expect(t212Post).toHaveBeenCalledWith("/equity/pies/3/duplicate", "pieDuplicate", {});
  });
});

describe("pie read tools", () => {
  it("are annotated readOnlyHint:true", () => {
    const server = createFakeServer();
    registerPieReadTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.annotations.readOnlyHint, `${name} should be readOnlyHint:true`).toBe(true);
    }
  });

  it("declare an outputSchema", () => {
    const server = createFakeServer();
    registerPieReadTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.outputSchema, `${name} should declare an outputSchema`).toBeDefined();
    }
  });

  it("get_pies fetches /equity/pies and wraps the array as structuredContent", async () => {
    const { t212Get } = await import("../api/client.js");
    vi.mocked(t212Get).mockResolvedValueOnce([{ id: 1 }]);
    const server = createFakeServer();
    registerPieReadTools(server as any);

    const result = await server.tools.get("get_pies")!.callback();

    expect(t212Get).toHaveBeenCalledWith("/equity/pies", "piesList");
    expect(result.structuredContent).toEqual({ pies: [{ id: 1 }] });
  });

  it("get_pie fetches /equity/pies/{id}", async () => {
    const { t212Get } = await import("../api/client.js");
    const server = createFakeServer();
    registerPieReadTools(server as any);

    await server.tools.get("get_pie")!.callback({ pieId: 5 });

    expect(t212Get).toHaveBeenCalledWith("/equity/pies/5", "pieGet");
  });
});
