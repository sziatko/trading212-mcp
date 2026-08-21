import { describe, expect, it, vi } from "vitest";
import { registerPieReadTools, registerPieWriteTools } from "./pies.js";

vi.mock("../trading212/client.js", () => ({
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

  it("create_pie posts the given fields to /equity/pies", async () => {
    const { t212Post } = await import("../trading212/client.js");
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    const body = { name: "Growth", goal: 1000 };
    await server.tools.get("create_pie")!.callback(body);

    expect(t212Post).toHaveBeenCalledWith("/equity/pies", "pie", body);
  });

  it("update_pie strips pieId from the body and posts to /equity/pies/{id}", async () => {
    const { t212Post } = await import("../trading212/client.js");
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    await server.tools.get("update_pie")!.callback({ pieId: 7, name: "Renamed" });

    expect(t212Post).toHaveBeenCalledWith("/equity/pies/7", "pie", { name: "Renamed" });
  });

  it("delete_pie deletes /equity/pies/{id} and reports the result", async () => {
    const { t212Delete } = await import("../trading212/client.js");
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    const result = await server.tools.get("delete_pie")!.callback({ pieId: 9 });

    expect(t212Delete).toHaveBeenCalledWith("/equity/pies/9", "pie");
    expect(result.content[0].text).toContain('"deleted": true');
    expect(result.content[0].text).toContain('"pieId": 9');
  });

  it("duplicate_pie posts to /equity/pies/{id}/duplicate", async () => {
    const { t212Post } = await import("../trading212/client.js");
    const server = createFakeServer();
    registerPieWriteTools(server as any);

    await server.tools.get("duplicate_pie")!.callback({ pieId: 3 });

    expect(t212Post).toHaveBeenCalledWith("/equity/pies/3/duplicate", "pie", {});
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
});
