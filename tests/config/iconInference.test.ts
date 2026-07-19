import { describe, expect, it } from "vitest";
import {
  addIconsToPresets,
  inferIconForPreset,
} from "@/config/iconInference";

describe("inferIconForPreset", () => {
  it("matches known AI provider names (lowercase exact)", () => {
    expect(inferIconForPreset("claude")).toEqual({
      icon: "claude",
      iconColor: "#D4915D",
    });
    expect(inferIconForPreset("deepseek")).toEqual({
      icon: "deepseek",
      iconColor: "#1E88E5",
    });
    expect(inferIconForPreset("qwen")).toEqual({
      icon: "qwen",
      iconColor: "#FF6A00",
    });
  });

  it("is case-insensitive", () => {
    const expected = { icon: "claude", iconColor: "#D4915D" };
    expect(inferIconForPreset("Claude")).toEqual(expected);
    expect(inferIconForPreset("CLAUDE")).toEqual(expected);
    expect(inferIconForPreset("cLaUdE")).toEqual(expected);
  });

  it("matches via substring (e.g. display names)", () => {
    const result = inferIconForPreset("Claude Official");
    expect(result.icon).toBe("claude");
    expect(result.iconColor).toBe("#D4915D");

    const glm = inferIconForPreset("Zhipu GLM-4");
    expect(glm.icon).toBe("zhipu");

    const kimi = inferIconForPreset("Kimi For Coding");
    expect(kimi.icon).toBe("kimi");
  });

  it("maps alias keys to the same icon config (glm -> zhipu, aliyun -> alibaba, step -> stepfun)", () => {
    expect(inferIconForPreset("glm")).toEqual(
      inferIconForPreset("zhipu"),
    );
    expect(inferIconForPreset("aliyun")).toEqual(
      inferIconForPreset("alibaba"),
    );
    expect(inferIconForPreset("step")).toEqual(
      inferIconForPreset("stepfun"),
    );
  });

  it("shares icon color but uses distinct icon names for related brands", () => {
    // kimi / moonshot share the same color but distinct icon names.
    expect(inferIconForPreset("moonshot").iconColor).toBe(
      inferIconForPreset("kimi").iconColor,
    );
    expect(inferIconForPreset("moonshot").icon).toBe("moonshot");
    expect(inferIconForPreset("kimi").icon).toBe("kimi");

    // tencent / hunyuan share the same color but distinct icon names.
    expect(inferIconForPreset("hunyuan").iconColor).toBe(
      inferIconForPreset("tencent").iconColor,
    );
    expect(inferIconForPreset("hunyuan").icon).toBe("hunyuan");
    expect(inferIconForPreset("tencent").icon).toBe("tencent");

    // claude / anthropic share the same color but distinct icon names.
    expect(inferIconForPreset("anthropic").iconColor).toBe(
      inferIconForPreset("claude").iconColor,
    );
    expect(inferIconForPreset("anthropic").icon).toBe("anthropic");
    expect(inferIconForPreset("claude").icon).toBe("claude");
  });

  it("returns the first matching key when multiple keys match (insertion order)", () => {
    // "claude" precedes "anthropic" in the mapping table.
    // Both would match the name "Claude Anthropic", but claude wins.
    const result = inferIconForPreset("Claude Anthropic");
    expect(result.icon).toBe("claude");

    // "tencent" precedes "hunyuan"; both have distinct icon names.
    const hunyuan = inferIconForPreset("Tencent Hunyuan");
    expect(hunyuan.icon).toBe("tencent");

    // "bailian" precedes "alibaba"/"aliyun".
    const bailian = inferIconForPreset("Aliyun Bailian");
    expect(bailian.icon).toBe("bailian");
  });

  it("matches cloud platform providers", () => {
    expect(inferIconForPreset("AWS Bedrock").icon).toBe("aws");
    expect(inferIconForPreset("Azure OpenAI").icon).toBe("azure");
    expect(inferIconForPreset("Huawei Cloud").icon).toBe("huawei");
    expect(inferIconForPreset("Cloudflare").icon).toBe("cloudflare");
  });

  it("returns an empty object for unknown names", () => {
    expect(inferIconForPreset("Unknown Provider")).toEqual({});
    expect(inferIconForPreset("random-model-xyz")).toEqual({});
  });

  it("returns an empty object for empty string", () => {
    expect(inferIconForPreset("")).toEqual({});
  });

  it("documents substring false-positive behavior (inherent to includes matching)", () => {
    // "meta" is a key, so any name containing "meta" matches it.
    // This documents the current substring-based behavior.
    const result = inferIconForPreset("Metadata Service");
    expect(result.icon).toBe("meta");
  });
});

describe("addIconsToPresets", () => {
  it("infers icons for presets that do not already have one", () => {
    const presets = [{ name: "Claude Official" }, { name: "DeepSeek" }];
    const result = addIconsToPresets(presets);
    expect(result[0].icon).toBe("claude");
    expect(result[0].iconColor).toBe("#D4915D");
    expect(result[1].icon).toBe("deepseek");
    expect(result[1].iconColor).toBe("#1E88E5");
  });

  it("preserves an existing icon and does not override it", () => {
    const presets = [
      { name: "Claude Official", icon: "custom", iconColor: "#000000" },
    ];
    const result = addIconsToPresets(presets);
    expect(result[0].icon).toBe("custom");
    expect(result[0].iconColor).toBe("#000000");
  });

  it("returns the same preset object reference when icon already set", () => {
    const preset = { name: "Claude", icon: "custom" };
    const result = addIconsToPresets([preset]);
    expect(result[0]).toBe(preset);
  });

  it("handles an empty array", () => {
    expect(addIconsToPresets([])).toEqual([]);
  });

  it("leaves presets with unrecognized names without an icon", () => {
    const presets = [{ name: "Mystery Vendor" }];
    const result = addIconsToPresets(presets);
    expect(result[0].icon).toBeUndefined();
    expect(result[0].iconColor).toBeUndefined();
  });

  it("preserves other fields on the preset objects", () => {
    const presets = [
      { name: "Claude", id: "abc", category: "official" },
    ];
    const result = addIconsToPresets(presets);
    expect(result[0].id).toBe("abc");
    expect(result[0].category).toBe("official");
    expect(result[0].icon).toBe("claude");
  });

  it("processes a mixed batch of presets", () => {
    const presets = [
      { name: "Claude Official" },
      { name: "Custom One", icon: "preset-icon" },
      { name: "Unknown Vendor" },
      { name: "Kimi" },
    ];
    const result = addIconsToPresets(presets);
    expect(result[0].icon).toBe("claude");
    expect(result[1].icon).toBe("preset-icon");
    expect(result[2].icon).toBeUndefined();
    expect(result[3].icon).toBe("kimi");
  });
});
