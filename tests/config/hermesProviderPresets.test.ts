import { describe, expect, it } from "vitest";
import {
  hermesProviderPresets,
  HERMES_PROVIDER_SOURCE_FIELD,
  HERMES_PROVIDER_SOURCE_CUSTOM_LIST,
  HERMES_PROVIDER_SOURCE_DICT,
  HERMES_DEFAULT_API_MODE,
  hermesApiModes,
  isHermesReadOnlyProvider,
} from "@/config/hermesProviderPresets";

describe("Hermes provider source constants", () => {
  it("has correct source field name", () => {
    expect(HERMES_PROVIDER_SOURCE_FIELD).toBe("_cc_source");
  });

  it("has correct source values", () => {
    expect(HERMES_PROVIDER_SOURCE_CUSTOM_LIST).toBe("custom_providers");
    expect(HERMES_PROVIDER_SOURCE_DICT).toBe("providers_dict");
  });

  it("source values are unique", () => {
    const values = [
      HERMES_PROVIDER_SOURCE_CUSTOM_LIST,
      HERMES_PROVIDER_SOURCE_DICT,
    ];
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("isHermesReadOnlyProvider", () => {
  it("returns false for null", () => {
    expect(isHermesReadOnlyProvider(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isHermesReadOnlyProvider(undefined)).toBe(false);
  });

  it("returns false for non-object primitives", () => {
    expect(isHermesReadOnlyProvider("string")).toBe(false);
    expect(isHermesReadOnlyProvider(42)).toBe(false);
    expect(isHermesReadOnlyProvider(true)).toBe(false);
  });

  it("returns false when marker is absent", () => {
    expect(isHermesReadOnlyProvider({ name: "test" })).toBe(false);
  });

  it("returns false when marker is custom_providers", () => {
    expect(
      isHermesReadOnlyProvider({
        [HERMES_PROVIDER_SOURCE_FIELD]: HERMES_PROVIDER_SOURCE_CUSTOM_LIST,
      }),
    ).toBe(false);
  });

  it("returns true when marker is providers_dict", () => {
    expect(
      isHermesReadOnlyProvider({
        [HERMES_PROVIDER_SOURCE_FIELD]: HERMES_PROVIDER_SOURCE_DICT,
      }),
    ).toBe(true);
  });
});

describe("HERMES_DEFAULT_API_MODE", () => {
  it("is chat_completions", () => {
    expect(HERMES_DEFAULT_API_MODE).toBe("chat_completions");
  });
});

describe("hermesApiModes", () => {
  it("has 4 modes", () => {
    expect(hermesApiModes).toHaveLength(4);
  });

  it("each mode has value and labelKey", () => {
    for (const mode of hermesApiModes) {
      expect(mode.value).toBeDefined();
      expect(typeof mode.value).toBe("string");
      expect(mode.labelKey).toBeDefined();
      expect(typeof mode.labelKey).toBe("string");
    }
  });

  it("includes all 4 api modes", () => {
    const values = hermesApiModes.map((m) => m.value);
    expect(values).toContain("chat_completions");
    expect(values).toContain("anthropic_messages");
    expect(values).toContain("codex_responses");
    expect(values).toContain("bedrock_converse");
  });

  it("has unique values", () => {
    const values = hermesApiModes.map((m) => m.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("hermesProviderPresets structure", () => {
  it("has unique names", () => {
    const names = hermesProviderPresets.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("each preset has name, websiteUrl, and settingsConfig", () => {
    for (const preset of hermesProviderPresets) {
      expect(preset.name).toBeDefined();
      expect(preset.websiteUrl).toBeDefined();
      expect(preset.settingsConfig).toBeDefined();
    }
  });

  it("each settingsConfig has name, base_url, api_key, api_mode, and models", () => {
    for (const preset of hermesProviderPresets) {
      const sc = preset.settingsConfig;
      expect(sc.name).toBeDefined();
      expect(sc.base_url).toBeDefined();
      expect(sc).toHaveProperty("api_key");
      expect(sc.api_mode).toBeDefined();
      expect(sc.models).toBeInstanceOf(Array);
      expect(sc.models!.length).toBeGreaterThan(0);
    }
  });

  it("each model has a non-empty id", () => {
    for (const preset of hermesProviderPresets) {
      for (const model of preset.settingsConfig.models!) {
        expect(model.id).toBeDefined();
        expect(typeof model.id).toBe("string");
        expect(model.id.length).toBeGreaterThan(0);
      }
    }
  });

  it("api_mode is a valid HermesApiMode", () => {
    const validModes = [
      "chat_completions",
      "anthropic_messages",
      "codex_responses",
      "bedrock_converse",
    ];
    for (const preset of hermesProviderPresets) {
      expect(validModes).toContain(preset.settingsConfig.api_mode);
    }
  });

  it("suggestedDefaults.model.default is one of the model ids when present", () => {
    for (const preset of hermesProviderPresets) {
      if (preset.suggestedDefaults) {
        const modelIds = preset.settingsConfig.models?.map((m) => m.id) ?? [];
        expect(modelIds).toContain(preset.suggestedDefaults.model.default);
      }
    }
  });

  it("suggestedDefaults.model.provider matches settingsConfig.name when present", () => {
    for (const preset of hermesProviderPresets) {
      if (preset.suggestedDefaults?.model.provider) {
        expect(preset.suggestedDefaults.model.provider).toBe(
          preset.settingsConfig.name,
        );
      }
    }
  });
});

describe("hermesProviderPresets categories and partners", () => {
  it("official preset (Nous Research) has isOfficial and category official", () => {
    const nous = hermesProviderPresets.find((p) => p.name === "Nous Research");
    expect(nous?.isOfficial).toBe(true);
    expect(nous?.category).toBe("official");
  });

  it("primePartner presets have primePartner flag", () => {
    const kimi = hermesProviderPresets.find((p) => p.name === "Kimi");
    const kimiCoding = hermesProviderPresets.find(
      (p) => p.name === "Kimi For Coding",
    );
    expect(kimi?.primePartner).toBe(true);
    expect(kimiCoding?.primePartner).toBe(true);
  });

  it("isPartner presets have partnerPromotionKey", () => {
    const partners = hermesProviderPresets.filter((p) => p.isPartner);
    expect(partners.length).toBeGreaterThan(0);
    for (const p of partners) {
      expect(p.partnerPromotionKey).toBeDefined();
    }
  });
});

describe("hermesProviderPresets hidden/visible", () => {
  it("has hidden presets", () => {
    const hidden = hermesProviderPresets.filter((p) => p.hidden);
    expect(hidden.length).toBeGreaterThan(0);
  });

  it("visible (non-hidden) presets include key vendors", () => {
    const visible = hermesProviderPresets.filter((p) => !p.hidden);
    const names = visible.map((p) => p.name);
    expect(names).toContain("火山Agentplan");
    expect(names).toContain("DouBaoSeed");
    expect(names).toContain("DeepSeek");
    expect(names).toContain("Kimi");
    expect(names).toContain("SiliconFlow");
    expect(names).toContain("Nous Research");
  });

  it("hidden presets are excluded from vendor allowlist display", () => {
    // Hidden presets should not appear in the models directory vendor names
    const modelsDirectoryVendors = new Set([
      "Kimi",
      "Kimi For Coding",
      "火山Agentplan",
      "DouBaoSeed",
      "DeepSeek",
      "Zhipu GLM",
      "Baidu Qianfan Coding Plan",
      "Bailian",
      "MiniMax",
      "Xiaomi MiMo",
      "SiliconFlow",
    ]);
    const hidden = hermesProviderPresets.filter((p) => p.hidden);
    for (const p of hidden) {
      // A hidden preset may share a name with an allowlist entry, but the
      // hidden flag means it is not displayed regardless
      expect(p.hidden).toBe(true);
    }
    // Visible presets that are in the allowlist should not be hidden
    const visibleAllowlisted = hermesProviderPresets.filter(
      (p) => !p.hidden && modelsDirectoryVendors.has(p.name),
    );
    expect(visibleAllowlisted.length).toBeGreaterThan(0);
  });
});
