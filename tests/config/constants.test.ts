import { describe, expect, it } from "vitest";
import { PROVIDER_TYPES, TEMPLATE_TYPES } from "@/config/constants";

describe("PROVIDER_TYPES", () => {
  it("has github_copilot and codex_oauth", () => {
    expect(PROVIDER_TYPES.GITHUB_COPILOT).toBe("github_copilot");
    expect(PROVIDER_TYPES.CODEX_OAUTH).toBe("codex_oauth");
  });

  it("has exactly 2 entries", () => {
    expect(Object.keys(PROVIDER_TYPES)).toHaveLength(2);
  });

  it("has unique values", () => {
    const values = Object.values(PROVIDER_TYPES);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("TEMPLATE_TYPES", () => {
  it("has expected type values", () => {
    expect(TEMPLATE_TYPES.CUSTOM).toBe("custom");
    expect(TEMPLATE_TYPES.GENERAL).toBe("general");
    expect(TEMPLATE_TYPES.GITHUB_COPILOT).toBe("github_copilot");
    expect(TEMPLATE_TYPES.TOKEN_PLAN).toBe("token_plan");
    expect(TEMPLATE_TYPES.BALANCE).toBe("balance");
    expect(TEMPLATE_TYPES.OFFICIAL_SUBSCRIPTION).toBe("official_subscription");
  });

  it("has unique values", () => {
    const values = Object.values(TEMPLATE_TYPES);
    expect(new Set(values).size).toBe(values.length);
  });

  it("does not include commented-out NEW_API", () => {
    expect(TEMPLATE_TYPES).not.toHaveProperty("NEW_API");
  });
});
