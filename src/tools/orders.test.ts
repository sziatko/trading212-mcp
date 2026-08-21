import { describe, expect, it, vi } from "vitest";
import { registerOrderReadTools, registerOrderWriteTools } from "./orders.js";

vi.mock("../trading212/client.js", () => ({
  t212Get: vi.fn().mockResolvedValue([]),
  t212Post: vi.fn().mockResolvedValue({ id: 1, status: "CONFIRMED" }),
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

describe("order write tools", () => {
  it("are all annotated readOnlyHint:false so clients always prompt before running them", async () => {
    const { t212Post } = await import("../trading212/client.js");
    void t212Post;
    const server = createFakeServer();
    registerOrderWriteTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.annotations.readOnlyHint, `${name} should not be readOnlyHint:true`).toBe(false);
    }
  });

  it("place_limit_order posts the given fields to /equity/orders/limit", async () => {
    const { t212Post } = await import("../trading212/client.js");
    const server = createFakeServer();
    registerOrderWriteTools(server as any);

    const body = { ticker: "AAPL_US_EQ", quantity: 1, limitPrice: 100, timeValidity: "DAY" as const };
    await server.tools.get("place_limit_order")!.callback(body);

    expect(t212Post).toHaveBeenCalledWith("/equity/orders/limit", "placeLimitOrder", body);
  });

  it("place_market_order posts to /equity/orders/market", async () => {
    const { t212Post } = await import("../trading212/client.js");
    const server = createFakeServer();
    registerOrderWriteTools(server as any);

    const body = { ticker: "AAPL_US_EQ", quantity: 1 };
    await server.tools.get("place_market_order")!.callback(body);

    expect(t212Post).toHaveBeenCalledWith("/equity/orders/market", "placeMarketOrder", body);
  });

  it("cancel_order deletes /equity/orders/{id} and reports the result", async () => {
    const { t212Delete } = await import("../trading212/client.js");
    const server = createFakeServer();
    registerOrderWriteTools(server as any);

    const result = await server.tools.get("cancel_order")!.callback({ orderId: 42 });

    expect(t212Delete).toHaveBeenCalledWith("/equity/orders/42", "cancelOrder");
    expect(result.content[0].text).toContain('"cancelled": true');
    expect(result.content[0].text).toContain('"orderId": 42');
  });
});

describe("order read tools", () => {
  it("are annotated readOnlyHint:true", () => {
    const server = createFakeServer();
    registerOrderReadTools(server as any);

    for (const [name, { config }] of server.tools) {
      expect(config.annotations.readOnlyHint, `${name} should be readOnlyHint:true`).toBe(true);
    }
  });
});
