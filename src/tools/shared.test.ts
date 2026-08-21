import { describe, expect, it, vi } from "vitest";
import { jsonResult, withEnvironmentTag } from "./shared.js";

vi.mock("../api/client.js", () => ({
  ACCOUNT_ENVIRONMENT_TAG: "🔴 LIVE",
}));

describe("withEnvironmentTag", () => {
  it("prepends the environment tag to a description", () => {
    expect(withEnvironmentTag("Get all open positions.")).toBe("🔴 LIVE Get all open positions.");
  });
});

describe("jsonResult", () => {
  it("prepends the environment tag to the content text", () => {
    const result = jsonResult({ free: 100 });

    expect(result.content[0].text.startsWith("🔴 LIVE\n\n")).toBe(true);
    expect(result.content[0].text).toContain('"free": 100');
  });

  it("leaves structuredContent as the raw data, untagged", () => {
    const result = jsonResult({ free: 100 });

    expect(result.structuredContent).toEqual({ free: 100 });
  });
});
