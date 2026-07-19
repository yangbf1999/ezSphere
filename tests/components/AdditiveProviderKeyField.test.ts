import { describe, expect, it } from "vitest";
import { getAdditiveProviderKeyError } from "@/components/providers/forms/AdditiveProviderKeyField";

describe("getAdditiveProviderKeyError", () => {
  it("returns null for empty key", () => {
    expect(getAdditiveProviderKeyError("", ["kimi"])).toBeNull();
    expect(getAdditiveProviderKeyError("   ", ["kimi"])).toBeNull();
  });

  it("returns invalid for trailing hyphen or bad pattern", () => {
    expect(getAdditiveProviderKeyError("kimi-", [])).toBe("invalid");
    expect(getAdditiveProviderKeyError("-kimi", [])).toBe("invalid");
  });

  it("returns duplicate only for exact existing key", () => {
    expect(getAdditiveProviderKeyError("kimi", ["kimi", "deepseek"])).toBe(
      "duplicate",
    );
    expect(
      getAdditiveProviderKeyError("kimi-coding-2", ["kimi", "kimi-coding"]),
    ).toBeNull();
  });

  it("ignores self key as duplicate", () => {
    expect(
      getAdditiveProviderKeyError("my-model", ["other"], "my-model"),
    ).toBeNull();
  });
});
