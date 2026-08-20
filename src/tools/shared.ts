import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

export function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
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
