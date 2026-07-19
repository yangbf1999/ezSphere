import { describe, expect, it } from "vitest";
import {
  CODING_PLAN_PROVIDERS,
  detectCodingPlanProvider,
  injectCodingPlanUsageScript,
} from "@/config/codingPlanProviders";
import { TEMPLATE_TYPES } from "@/config/constants";

describe("CODING_PLAN_PROVIDERS data structure", () => {
  it("exports exactly 5 provider entries", () => {
    expect(CODING_PLAN_PROVIDERS).toHaveLength(5);
  });

  it("each entry has id, label and a RegExp pattern", () => {
    for (const entry of CODING_PLAN_PROVIDERS) {
      expect(typeof entry.id).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.pattern).toBeInstanceOf(RegExp);
    }
  });

  it("has unique ids", () => {
    const ids = CODING_PLAN_PROVIDERS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains the expected provider ids", () => {
    const ids = CODING_PLAN_PROVIDERS.map((e) => e.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "kimi",
        "zhipu",
        "minimax",
        "zenmux",
        "volcengine",
      ]),
    );
  });
});

describe("detectCodingPlanProvider", () => {
  it("returns null for null / undefined / empty string", () => {
    expect(detectCodingPlanProvider(null)).toBeNull();
    expect(detectCodingPlanProvider(undefined)).toBeNull();
    expect(detectCodingPlanProvider("")).toBeNull();
  });

  it("detects kimi via api.kimi.com/coding", () => {
    expect(
      detectCodingPlanProvider("https://api.kimi.com/coding/v1"),
    ).toBe("kimi");
  });

  it("detects zhipu via bigmodel.cn or api.z.ai", () => {
    expect(
      detectCodingPlanProvider("https://open.bigmodel.cn/api/paas/v4"),
    ).toBe("zhipu");
    expect(
      detectCodingPlanProvider("https://api.z.ai/api/paas/v4"),
    ).toBe("zhipu");
  });

  it("detects minimax via the three documented hosts", () => {
    expect(detectCodingPlanProvider("https://api.minimax.com/v1")).toBe(
      "minimax",
    );
    expect(detectCodingPlanProvider("https://api.minimaxi.com/v1")).toBe(
      "minimax",
    );
    expect(detectCodingPlanProvider("https://api.minimax.io/v1")).toBe(
      "minimax",
    );
  });

  it("detects zenmux via zenmux. substring", () => {
    expect(detectCodingPlanProvider("https://app.zenmux.io/v1")).toBe(
      "zenmux",
    );
  });

  it("detects volcengine via volces.com/api/coding", () => {
    expect(
      detectCodingPlanProvider(
        "https://ark.cn-beijing.volces.com/api/coding/v3",
      ),
    ).toBe("volcengine");
  });

  it("is case-insensitive (patterns use the /i flag)", () => {
    expect(detectCodingPlanProvider("HTTPS://API.KIMI.COM/CODING")).toBe(
      "kimi",
    );
    expect(detectCodingPlanProvider("https://BIGMODEL.CN/v4")).toBe(
      "zhipu",
    );
  });

  it("returns null for unrelated base URLs", () => {
    expect(detectCodingPlanProvider("https://api.openai.com/v1")).toBeNull();
    expect(
      detectCodingPlanProvider("https://api.anthropic.com/v1/messages"),
    ).toBeNull();
  });

  it("returns the first matching provider when multiple patterns match", () => {
    // "bigmodel.cn" (zhipu, index 1) is matched before "zenmux." (index 3).
    const url = "https://bigmodel.cn.zenmux.io/v1";
    expect(detectCodingPlanProvider(url)).toBe("zhipu");
  });
});

describe("injectCodingPlanUsageScript", () => {
  it("returns the provider unchanged for non-claude apps", () => {
    const provider = {
      settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://api.kimi.com/coding" } },
    };
    const result = injectCodingPlanUsageScript("codex", provider);
    expect(result).toBe(provider);
  });

  it("returns the provider unchanged when usage_script already exists", () => {
    const provider = {
      settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://api.kimi.com/coding" } },
      meta: { usage_script: { enabled: false, code: "custom" } },
    };
    const result = injectCodingPlanUsageScript("claude", provider);
    expect(result).toBe(provider);
  });

  it("returns the provider unchanged when base URL does not match any coding plan", () => {
    const provider = {
      settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://api.openai.com/v1" } },
    };
    const result = injectCodingPlanUsageScript("claude", provider);
    expect(result).toBe(provider);
  });

  it("returns the provider unchanged when settingsConfig is missing", () => {
    const provider = {};
    const result = injectCodingPlanUsageScript("claude", provider);
    expect(result).toBe(provider);
  });

  it("returns the provider unchanged when ANTHROPIC_BASE_URL is not a string", () => {
    const provider = {
      settingsConfig: { env: { ANTHROPIC_BASE_URL: 12345 } },
    };
    const result = injectCodingPlanUsageScript("claude", provider);
    expect(result).toBe(provider);
  });

  it("injects a token_plan usage_script when base URL matches kimi", () => {
    const provider = {
      settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://api.kimi.com/coding" } },
    };
    const result = injectCodingPlanUsageScript("claude", provider);
    expect(result).not.toBe(provider);
    expect(result.meta).toBeDefined();
    expect(result.meta!.usage_script).toBeDefined();
    expect(result.meta!.usage_script.enabled).toBe(true);
    expect(result.meta!.usage_script.templateType).toBe(
      TEMPLATE_TYPES.TOKEN_PLAN,
    );
    expect(result.meta!.usage_script.codingPlanProvider).toBe("kimi");
  });

  it("leaves the script code empty (Rust side uses a dedicated quota endpoint)", () => {
    const provider = {
      settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://api.minimax.io/v1" } },
    };
    const result = injectCodingPlanUsageScript("claude", provider);
    expect(result.meta!.usage_script.code).toBe("");
  });

  it("injects the correct codingPlanProvider id for each matched provider", () => {
    const cases: Array<[string, string]> = [
      ["https://api.kimi.com/coding", "kimi"],
      ["https://open.bigmodel.cn/api/paas/v4", "zhipu"],
      ["https://api.minimax.io/v1", "minimax"],
      ["https://app.zenmux.io/v1", "zenmux"],
      ["https://ark.cn-beijing.volces.com/api/coding", "volcengine"],
    ];
    for (const [url, expectedId] of cases) {
      const provider = {
        settingsConfig: { env: { ANTHROPIC_BASE_URL: url } },
      };
      const result = injectCodingPlanUsageScript("claude", provider);
      expect(result.meta!.usage_script.codingPlanProvider).toBe(expectedId);
    }
  });

  it("preserves existing meta fields when injecting usage_script", () => {
    const provider = {
      settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://api.kimi.com/coding" } },
      meta: { customField: "keep-me" },
    };
    const result = injectCodingPlanUsageScript("claude", provider);
    expect(result.meta!.customField).toBe("keep-me");
    expect(result.meta!.usage_script).toBeDefined();
  });

  it("preserves top-level provider fields when injecting", () => {
    const provider = {
      name: "Kimi For Coding",
      id: "provider-1",
      settingsConfig: { env: { ANTHROPIC_BASE_URL: "https://api.kimi.com/coding" } },
    };
    const result = injectCodingPlanUsageScript("claude", provider);
    expect(result.name).toBe("Kimi For Coding");
    expect(result.id).toBe("provider-1");
    expect(result.settingsConfig.env.ANTHROPIC_BASE_URL).toBe(
      "https://api.kimi.com/coding",
    );
  });
});
