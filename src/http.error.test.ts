import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";

// The mocked transport's handleRequest behaviour is swapped per-test via this
// flag so both catch-block branches (Error vs non-Error, headers sent vs not)
// get exercised.
let mode: "throw-error" | "throw-after-headers" = "throw-error";

vi.mock("@modelcontextprotocol/sdk/server/streamableHttp.js", () => ({
  StreamableHTTPServerTransport: class {
    async start() {}
    async close() {}
    async send() {}
    async handleRequest(_req: unknown, res: any) {
      if (mode === "throw-after-headers") {
        res.writeHead(202, { "Content-Type": "application/json" });
        res.end("{}");
        throw "stream already started"; // non-Error rejection
      }
      throw new Error("simulated transport failure");
    }
  },
}));

const TOKEN = "s3cr3t-token-value";

describe("HTTP request listener — transport failure", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { createRequestListener } = await import("./http.js");
    server = createServer(createRequestListener(TOKEN));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  });

  it("returns a generic 500 when the transport throws before responding", async () => {
    mode = "throw-error";
    const res = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "internal_server_error" });
  });

  it("leaves the response alone when the transport throws after headers are sent", async () => {
    mode = "throw-after-headers";
    const res = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(202); // the already-sent status is untouched
  });
});
