import { describe, expect, it } from "vitest";
import {
  geminiProviderPresets,
  getGeminiPresetByName,
  getGeminiPresetByUrl,
} from "@/config/geminiProviderPresets";

describe("geminiProviderPresets structure", () => {
  it("has unique names", () => {
    const names = geminiProviderPresets.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("each preset has name, websiteUrl, and settingsConfig", () => {
    for (const preset of geminiProviderPresets) {
      expect(preset.name).toBeDefined();
      expect(preset.websiteUrl).toBeDefined();
      expect(preset.settingsConfig).toBeDefined();
    }
  });

  it("each non-official, non-custom preset has GOOGLE_GEMINI_BASE_URL and GEMINI_MODEL in env", () => {
    for (const preset of geminiProviderPresets) {
      // official (Google Official) uses OAuth with empty env; custom is user-defined
      if (preset.category === "custom" || preset.category === "official") {
        continue;
      }
      const env = (preset.settingsConfig as any).env;
      expect(env).toBeDefined();
      expect(env.GOOGLE_GEMINI_BASE_URL).toBeDefined();
      expect(env.GEMINI_MODEL).toBeDefined();
    }
  });

  it("Google Official has empty env (OAuth-based, no base URL needed)", () => {
    const official = geminiProviderPresets.find(
      (p) => p.name === "Google Official",
    );
    const env = (official!.settingsConfig as any).env;
    expect(Object.keys(env)).toHaveLength(0);
  });

  it("baseURL matches GOOGLE_GEMINI_BASE_URL in env when both are present", () => {
    for (const preset of geminiProviderPresets) {
      const envUrl = (preset.settingsConfig as any).env?.GOOGLE_GEMINI_BASE_URL;
      if (preset.baseURL && envUrl) {
        expect(preset.baseURL).toBe(envUrl);
      }
    }
  });

  it("model field matches GEMINI_MODEL in env when both are present", () => {
    for (const preset of geminiProviderPresets) {
      const envModel = (preset.settingsConfig as any).env?.GEMINI_MODEL;
      if (preset.model && envModel) {
        expect(preset.model).toBe(envModel);
      }
    }
  });
});

describe("geminiProviderPresets categories", () => {
  it("official preset has category official", () => {
    const official = geminiProviderPresets.find(
      (p) => p.name === "Google Official",
    );
    expect(official?.category).toBe("official");
  });

  it("includes a custom template preset", () => {
    const custom = geminiProviderPresets.find((p) => p.category === "custom");
    expect(custom).toBeDefined();
    expect(custom?.name).toBe("自定义");
  });

  it("has presets across multiple categories", () => {
    const categories = new Set(geminiProviderPresets.map((p) => p.category));
    expect(categories.size).toBeGreaterThan(1);
    expect(categories.has("official")).toBe(true);
    expect(categories.has("aggregator")).toBe(true);
    expect(categories.has("third_party")).toBe(true);
  });
});

describe("geminiProviderPresets partners", () => {
  it("isPartner presets have partnerPromotionKey", () => {
    const partners = geminiProviderPresets.filter((p) => p.isPartner);
    expect(partners.length).toBeGreaterThan(0);
    for (const p of partners) {
      expect(p.partnerPromotionKey).toBeDefined();
    }
  });

  it("Google Official has partnerPromotionKey google-official", () => {
    const official = geminiProviderPresets.find(
      (p) => p.name === "Google Official",
    );
    expect(official?.partnerPromotionKey).toBe("google-official");
  });
});

describe("getGeminiPresetByName", () => {
  it("finds a preset by name", () => {
    const result = getGeminiPresetByName("Google Official");
    expect(result).toBeDefined();
    expect(result?.category).toBe("official");
  });

  it("finds the custom preset by name", () => {
    const result = getGeminiPresetByName("自定义");
    expect(result).toBeDefined();
    expect(result?.category).toBe("custom");
  });

  it("returns undefined for unknown name", () => {
    expect(getGeminiPresetByName("Nonexistent")).toBeUndefined();
  });
});

describe("getGeminiPresetByUrl", () => {
  it("finds a preset by URL (case insensitive)", () => {
    const result = getGeminiPresetByUrl("https://API.UNITY2.AI/v1beta");
    expect(result).toBeDefined();
    expect(result?.name).toBe("Unity2.ai");
  });

  it("returns undefined for empty url", () => {
    expect(getGeminiPresetByUrl("")).toBeUndefined();
  });

  it("returns undefined for unknown url", () => {
    expect(
      getGeminiPresetByUrl("https://nonexistent-host.example.com"),
    ).toBeUndefined();
  });

  it("matches by partial URL substring", () => {
    const result = getGeminiPresetByUrl(
      "https://subrouter.ai/v1beta/models/gemini-3.5-flash",
    );
    expect(result).toBeDefined();
    expect(result?.name).toBe("SubRouter");
  });

  it("does not match presets without baseURL", () => {
    // Google Official has no baseURL, so it should never match
    const result = getGeminiPresetByUrl("https://ai.google.dev");
    expect(result?.name).not.toBe("Google Official");
  });
});
