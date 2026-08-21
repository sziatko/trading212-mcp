import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { ACCOUNT_ENVIRONMENT_TAG } from "../api/client.js";

/**
 * Builds a tool result carrying both `content` (JSON text, for clients that
 * don't read structured output) and `structuredContent` (validated against
 * the tool's outputSchema). `data` must be a plain object — MCP requires the
 * top-level structured output to be an object, so array-returning endpoints
 * are wrapped under a named key (e.g. `{ positions: [...] }`) before this is
 * called.
 *
 * The content text is prefixed with the live/demo tag so it's visible in the
 * actual response, not just the tool's description — `structuredContent` is
 * left untouched so it still validates cleanly against `outputSchema`.
 */
export function jsonResult(data: Record<string, unknown>) {
  return {
    content: [
      { type: "text" as const, text: `${ACCOUNT_ENVIRONMENT_TAG}\n\n${JSON.stringify(data, null, 2)}` },
    ],
    structuredContent: data,
  };
}

/** Prepends the live/demo tag to a tool's description, so it's visible in the tool list. */
export function withEnvironmentTag(description: string): string {
  return `${ACCOUNT_ENVIRONMENT_TAG} ${description}`;
}

export function readOnlyAnnotations(title: string): ToolAnnotations {
  return { title, readOnlyHint: true, openWorldHint: true };
}

/**
 * Annotations for tools that create/modify/cancel account state. readOnlyHint is
 * intentionally omitted (false) so MCP clients treat these as requiring explicit
 * user approval before every call, rather than auto-running them like read tools.
 */
export function writeAnnotations(title: string, opts?: { destructive?: boolean }): ToolAnnotations {
  return {
    title,
    readOnlyHint: false,
    destructiveHint: opts?.destructive ?? false,
    openWorldHint: true,
  };
}

export const ORDER_LIMITATIONS_NOTE =
  "Order limitations: orders can only be executed in the account's main currency.";
