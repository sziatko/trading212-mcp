import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import { AddressInfo } from "node:net";
import {
  createRequestListener,
  isAuthorized,
  parseBearer,
  startHttpServer,
  tokensMatch,
} from "./http.js";

const TOKEN = "s3cr3t-token-value";

describe("auth helpers", () => {
  it("parseBearer pulls the token out of a well-formed header", () => {
    expect(parseBearer("Bearer abc123")).toBe("abc123");
    expect(parseBearer("bearer abc123")).toBe("abc123"); // scheme is case-insensitive
    expect(parseBearer("Bearer   abc123  ")).toBe("abc123");
  });

  it("parseBearer returns null for missing or malformed headers", () => {
    expect(parseBearer(undefined)).toBeNull();
    expect(parseBearer("")).toBeNull();
    expect(parseBearer("abc123")).toBeNull(); // no scheme
    expect(parseBearer("Basic abc123")).toBeNull();
    expect(parseBearer("Bearer ")).toBeNull(); // no token
  });

  it("tokensMatch is true only for an exact match", () => {
    expect(tokensMatch(TOKEN, TOKEN)).toBe(true);
    expect(tokensMatch(TOKEN, TOKEN + "x")).toBe(false);
    expect(tokensMatch("short", "longer-value")).toBe(false);
  });

  it("isAuthorized accepts a valid Bearer token and rejects everything else", () => {
    expect(isAuthorized(`Bearer ${TOKEN}`, TOKEN)).toBe(true);
    expect(isAuthorized(`Bearer ${TOKEN}-wrong`, TOKEN)).toBe(false);
    expect(isAuthorized(undefined, TOKEN)).toBe(false);
    expect(isAuthorized(TOKEN, TOKEN)).toBe(false); // missing "Bearer " prefix
  });
});

describe("startHttpServer", () => {
  const originalToken = process.env.MCP_AUTH_TOKEN;
  const originalPort = process.env.PORT;
  afterEach(() => {
    if (originalToken === undefined) delete process.env.MCP_AUTH_TOKEN;
    else process.env.MCP_AUTH_TOKEN = originalToken;
    if (originalPort === undefined) delete process.env.PORT;
    else process.env.PORT = originalPort;
    vi.restoreAllMocks();
  });

  it("refuses to start without MCP_AUTH_TOKEN", () => {
    delete process.env.MCP_AUTH_TOKEN;
    expect(() => startHttpServer()).toThrow(/MCP_AUTH_TOKEN/);
  });

  it("binds and serves /healthz when MCP_AUTH_TOKEN is set", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.MCP_AUTH_TOKEN = TOKEN;
    process.env.PORT = "0";

    const srv = startHttpServer();
    await new Promise((resolve) => srv.once("listening", resolve));
    const { port } = srv.address() as AddressInfo;

    const res = await fetch(`http://127.0.0.1:${port}/healthz`);
    expect(res.status).toBe(200);

    await new Promise<void>((resolve, reject) =>
      srv.close((err) => (err ? reject(err) : resolve()))
    );
  });
});

describe("HTTP request listener", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    server = createServer(createRequestListener(TOKEN));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  });

  it("GET /healthz returns 200 OK", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  it("rejects /mcp with no Authorization header (401, minimal body)", async () => {
    const res = await fetch(`${baseUrl}/mcp`, { method: "POST" });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("rejects /mcp with an invalid token (401)", async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { authorization: "Bearer nope" },
    });
    expect(res.status).toBe(401);
  });

  it("unknown paths return 404", async () => {
    const res = await fetch(`${baseUrl}/nope`);
    expect(res.status).toBe(404);
  });

  it("accepts an MCP initialize request with a valid token", async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "vitest", version: "1.0.0" },
        },
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.serverInfo.name).toBe("trading212-mcp");
  });
});
