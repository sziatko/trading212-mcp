import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";

export const MCP_PATH = "/mcp";
export const HEALTH_PATH = "/healthz";

/** Constant-time string comparison. Returns false for length mismatches. */
export function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Extracts the token from an `Authorization: Bearer <token>` header, or null. */
export function parseBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/**
 * True only if the request carries a Bearer token that matches `expectedToken`.
 * Never logs or echoes either token.
 */
export function isAuthorized(authHeader: string | undefined, expectedToken: string): boolean {
  const token = parseBearer(authHeader);
  if (!token) return false;
  return tokensMatch(token, expectedToken);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

/**
 * Builds the Node HTTP request listener: `GET /healthz` for health checks, and
 * an authenticated MCP endpoint at `/mcp` (stateless Streamable HTTP — a fresh
 * server + transport per request, so there is no session state to leak across
 * Render's cold starts).
 */
export function createRequestListener(authToken: string) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    // Node always populates `url` on an incoming server request.
    const { pathname } = new URL(req.url!, "http://localhost");

    if (req.method === "GET" && pathname === HEALTH_PATH) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
      return;
    }

    if (pathname !== MCP_PATH) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }

    if (!isAuthorized(req.headers.authorization, authToken)) {
      sendJson(res, 401, { error: "unauthorized" });
      return;
    }

    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      // Log the class of failure, never the request contents or the token.
      console.error("MCP request handling failed:", err instanceof Error ? err.message : err);
      if (!res.headersSent) sendJson(res, 500, { error: "internal_server_error" });
    }
  };
}

/**
 * Starts the Streamable HTTP transport. Refuses to start without
 * `MCP_AUTH_TOKEN` — this endpoint reaches a real brokerage account and must not
 * run unauthenticated. Returns the listening server.
 */
export function startHttpServer(): Server {
  const authToken = process.env.MCP_AUTH_TOKEN;
  if (!authToken) {
    throw new Error(
      "TRANSPORT=http requires MCP_AUTH_TOKEN to be set — refusing to expose an " +
        "unauthenticated MCP endpoint with access to a brokerage account. " +
        "Generate a token with: openssl rand -hex 32"
    );
  }

  const port = Number(process.env.PORT) || 3000;
  const httpServer = createServer(createRequestListener(authToken));
  httpServer.listen(port, "0.0.0.0", () => {
    console.error(
      `trading212-mcp Streamable HTTP transport listening on 0.0.0.0:${port} ` +
        `(MCP endpoint ${MCP_PATH}, health check ${HEALTH_PATH})`
    );
  });
  return httpServer;
}
