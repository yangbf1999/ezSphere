import { describe, expect, it } from "vitest";
import {
  universalProviderPresets,
  createUniversalProviderFromPreset,
  getPresetDisplayName,
  findPresetByType,
} from "@/config/universalProviderPresets";

describe("universalProviderPresets structure", () => {
  it("has at least one preset", () => {
    expect(universalProviderPresets.length).toBeGreaterThan(0);
  });

  it("has unique names", () => {
    const names = universalProviderPresets.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has unique providerTypes", () => {
    const types = universalProviderPresets.map((p) => p.providerType);
    expect(new Set(types).size).toBe(types.length);
  });

  it("each preset has name, providerType, defaultApps, and defaultModels", () => {
    for (const preset of universalProviderPresets) {
      expect(preset.name).toBeDefined();
      expect(preset.providerType).toBeDefined();
      expect(preset.defaultApps).toBeDefined();
      expect(preset.defaultApps.claude).toBeDefined();
      expect(preset.defaultApps.codex).toBeDefined();
      expect(preset.defaultApps.gemini).toBeDefined();
      expect(preset.defaultModels).toBeDefined();
    }
  });

  it("includes a custom template preset", () => {
    const custom = universalProviderPresets.find((p) => p.isCustomTemplate);
    expect(custom).toBeDefined();
    expect(custom?.providerType).toBe("custom_gateway");
    expect(custom?.name).toBe("自定义网关");
  });

  it("defaultModels has claude, codex, and gemini model configs", () => {
    for (const preset of universalProviderPresets) {
      expect(preset.defaultModels.claude).toBeDefined();
      expect(preset.defaultModels.codex).toBeDefined();
      expect(preset.defaultModels.gemini).toBeDefined();
    }
  });

  it("claude defaultModels include model, haikuModel, sonnetModel, opusModel", () => {
    for (const preset of universalProviderPresets) {
      const claude = preset.defaultModels.claude!;
      expect(claude.model).toBeDefined();
      expect(claude.haikuModel).toBeDefined();
      expect(claude.sonnetModel).toBeDefined();
      expect(claude.opusModel).toBeDefined();
    }
  });
});

describe("findPresetByType", () => {
  it("finds preset by providerType", () => {
    const result = findPresetByType("custom_gateway");
    expect(result).toBeDefined();
    expect(result?.name).toBe("自定义网关");
  });

  it("returns undefined for unknown type", () => {
    expect(findPresetByType("nonexistent_type")).toBeUndefined();
  });
});

describe("getPresetDisplayName", () => {
  it("returns the preset name", () => {
    const preset = universalProviderPresets[0];
    expect(getPresetDisplayName(preset)).toBe(preset.name);
  });
});

describe("createUniversalProviderFromPreset", () => {
  const preset = universalProviderPresets[0];

  it("creates a provider with correct id, baseUrl, and apiKey", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
    );
    expect(provider.id).toBe("test-id");
    expect(provider.baseUrl).toBe("https://api.example.com");
    expect(provider.apiKey).toBe("test-key");
  });

  it("uses preset name by default", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
    );
    expect(provider.name).toBe(preset.name);
  });

  it("uses customName when provided", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
      "My Custom Name",
    );
    expect(provider.name).toBe("My Custom Name");
  });

  it("copies providerType from preset", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
    );
    expect(provider.providerType).toBe(preset.providerType);
  });

  it("copies apps as a new object with same values", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
    );
    expect(provider.apps).not.toBe(preset.defaultApps);
    expect(provider.apps).toEqual(preset.defaultApps);
  });

  it("deep-clones defaultModels (not same reference)", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
    );
    expect(provider.models).not.toBe(preset.defaultModels);
    expect(provider.models).toEqual(preset.defaultModels);
  });

  it("copies icon and iconColor from preset when present", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
    );
    expect(provider.icon).toBe(preset.icon);
    expect(provider.iconColor).toBe(preset.iconColor);
  });

  it("sets createdAt to a number", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
    );
    expect(typeof provider.createdAt).toBe("number");
    expect(provider.createdAt).toBeGreaterThan(0);
  });

  it("deep clone is independent - mutating provider.models does not affect preset", () => {
    const provider = createUniversalProviderFromPreset(
      preset,
      "test-id",
      "https://api.example.com",
      "test-key",
    );
    // Mutate the provider's models
    provider.models.claude!.model = "mutated-model";
    // Original preset should be unaffected
    expect(preset.defaultModels.claude!.model).not.toBe("mutated-model");
  });
});
