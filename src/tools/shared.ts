import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

/**
 * Builds a tool result carrying both `content` (JSON text, for clients that
 * don't read structured output) and `structuredContent` (validated against
 * the tool's outputSchema). `data` must be a plain object — MCP requires the
 * top-level structured output to be an object, so array-returning endpoints
 * are wrapped under a named key (e.g. `{ positions: [...] }`) before this is
 * called.
 */
export function jsonResult(data: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
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
