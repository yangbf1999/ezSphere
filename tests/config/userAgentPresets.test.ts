import { describe, expect, it } from "vitest";
import { USER_AGENT_PRESETS } from "@/config/userAgentPresets";

describe("USER_AGENT_PRESETS", () => {
  it("is a readonly array with 5 entries", () => {
    expect(USER_AGENT_PRESETS).toHaveLength(5);
  });

  it("all entries are non-empty strings", () => {
    for (const ua of USER_AGENT_PRESETS) {
      expect(typeof ua).toBe("string");
      expect(ua.length).toBeGreaterThan(0);
    }
  });

  it("has unique entries", () => {
    const set = new Set(USER_AGENT_PRESETS);
    expect(set.size).toBe(USER_AGENT_PRESETS.length);
  });

  it("first entry is the full claude-cli format with (external, cli)", () => {
    expect(USER_AGENT_PRESETS[0]).toBe("claude-cli/2.1.161 (external, cli)");
  });

  it("contains claude-cli, claude-code, and Kilo-Code prefixes", () => {
    const prefixes = USER_AGENT_PRESETS.map((ua) => ua.split("/")[0]);
    expect(prefixes).toContain("claude-cli");
    expect(prefixes).toContain("claude-code");
    expect(prefixes).toContain("Kilo-Code");
  });

  it("every entry has a version number after the prefix slash", () => {
    for (const ua of USER_AGENT_PRESETS) {
      const match = ua.match(/^[^/]+\/(\S+)/);
      expect(match).not.toBeNull();
      expect(match![1].length).toBeGreaterThan(0);
    }
  });

  it("does not contain codex-cli or kimi-cli (blocked by Kimi UA whitelist)", () => {
    for (const ua of USER_AGENT_PRESETS) {
      expect(ua).not.toMatch(/^codex-cli/);
      expect(ua).not.toMatch(/^kimi-cli/);
    }
  });

  it("second entry is the short claude-cli format without (external, cli)", () => {
    expect(USER_AGENT_PRESETS[1]).toBe("claude-cli/2.1.161");
  });

  it("has two claude-cli variants, two claude-code variants, and one Kilo-Code", () => {
    const counts = USER_AGENT_PRESETS.reduce<Record<string, number>>(
      (acc, ua) => {
        const prefix = ua.split("/")[0];
        acc[prefix] = (acc[prefix] ?? 0) + 1;
        return acc;
      },
      {},
    );
    expect(counts["claude-cli"]).toBe(2);
    expect(counts["claude-code"]).toBe(2);
    expect(counts["Kilo-Code"]).toBe(1);
  });
});
