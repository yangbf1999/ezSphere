import { describe, expect, it } from "vitest";
import {
  MODELS_DIRECTORY_VENDOR_NAMES,
  getVendorPresetsForApp,
  isModelsDirectoryVendor,
} from "@/config/vendorPresets";
import { providerPresets } from "@/config/claudeProviderPresets";

describe("vendorPresets models directory filter", () => {
  it("keeps only allowlist vendors plus official presets for claude", () => {
    const vendors = getVendorPresetsForApp("claude");
    const names = vendors.map((v) => v.name);

    expect(names).toContain("Claude Official");
    expect(names).toContain("Kimi");
    expect(names).toContain("SiliconFlow");
    expect(names).not.toContain("Shengsuanyun");
    expect(names).not.toContain("OpenRouter");
    expect(names).not.toContain("StepFun");
  });

  it("uses stable source-array presetId indices", () => {
    const kimiIndex = providerPresets.findIndex((p) => p.name === "Kimi");
    expect(kimiIndex).toBeGreaterThanOrEqual(0);

    const vendors = getVendorPresetsForApp("claude");
    const kimi = vendors.find((v) => v.name === "Kimi");
    expect(kimi?.presetId).toBe(`claude-${kimiIndex}`);
  });

  it("matches models.html vendor allowlist", () => {
    expect(MODELS_DIRECTORY_VENDOR_NAMES.size).toBe(11);
    for (const name of MODELS_DIRECTORY_VENDOR_NAMES) {
      expect(
        providerPresets.some((preset) => preset.name === name),
      ).toBe(true);
    }
  });

  it("respects hidden flag on preset definitions", () => {
    const hidden = providerPresets.find((p) => p.name === "Shengsuanyun");
    expect(hidden?.hidden).toBe(true);
    expect(isModelsDirectoryVendor(hidden!)).toBe(false);
  });
});
