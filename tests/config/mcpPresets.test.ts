import { describe, expect, it, vi } from "vitest";
import {
  mcpPresets,
  getMcpPresetWithDescription,
} from "@/config/mcpPresets";

describe("mcpPresets structure", () => {
  it("has 5 presets", () => {
    expect(mcpPresets).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = mcpPresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique names", () => {
    const names = mcpPresets.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("includes fetch, time, memory, sequential-thinking, context7", () => {
    const ids = mcpPresets.map((p) => p.id);
    expect(ids).toContain("fetch");
    expect(ids).toContain("time");
    expect(ids).toContain("memory");
    expect(ids).toContain("sequential-thinking");
    expect(ids).toContain("context7");
  });

  it("each preset has required fields", () => {
    for (const preset of mcpPresets) {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.tags).toBeInstanceOf(Array);
      expect(preset.tags.length).toBeGreaterThan(0);
      expect(preset.server).toBeDefined();
      expect(preset.server.type).toBe("stdio");
      expect(preset.server.command).toBeDefined();
      expect(preset.server.args).toBeInstanceOf(Array);
      expect(preset.homepage).toMatch(/^https?:\/\//);
      expect(preset.docs).toMatch(/^https?:\/\//);
    }
  });

  it("each preset tags include stdio", () => {
    for (const preset of mcpPresets) {
      expect(preset.tags).toContain("stdio");
    }
  });
});

describe("mcpPresets command types", () => {
  it("fetch and time use uvx command", () => {
    const fetch = mcpPresets.find((p) => p.id === "fetch")!;
    const time = mcpPresets.find((p) => p.id === "time")!;
    expect(fetch.server.command).toBe("uvx");
    expect(fetch.server.args).toEqual(["mcp-server-fetch"]);
    expect(time.server.command).toBe("uvx");
    expect(time.server.args).toEqual(["mcp-server-time"]);
  });

  it("memory, sequential-thinking, and context7 use npx-based command", () => {
    const memory = mcpPresets.find((p) => p.id === "memory")!;
    const seq = mcpPresets.find((p) => p.id === "sequential-thinking")!;
    const ctx7 = mcpPresets.find((p) => p.id === "context7")!;

    for (const preset of [memory, seq, ctx7]) {
      const cmd = preset.server.command;
      const args = preset.server.args as string[];
      // On Windows: command = "cmd", args start with ["/c", "npx", ...]
      // On non-Windows: command = "npx", args = [..., packageName]
      if (cmd === "cmd") {
        expect(args[0]).toBe("/c");
        expect(args[1]).toBe("npx");
      } else {
        expect(cmd).toBe("npx");
      }
      expect(args).toContain("-y");
    }
  });

  it("memory preset targets @modelcontextprotocol/server-memory", () => {
    const memory = mcpPresets.find((p) => p.id === "memory")!;
    const args = memory.server.args as string[];
    expect(args).toContain("@modelcontextprotocol/server-memory");
  });

  it("context7 preset targets @upstash/context7-mcp", () => {
    const ctx7 = mcpPresets.find((p) => p.id === "context7")!;
    const args = ctx7.server.args as string[];
    expect(args).toContain("@upstash/context7-mcp");
  });
});

describe("getMcpPresetWithDescription", () => {
  it("returns preset with i18n description from t()", () => {
    const preset = mcpPresets[0];
    const t = (key: string) => `[translated] ${key}`;
    const result = getMcpPresetWithDescription(preset, t);
    expect(result.description).toBe(
      `[translated] mcp.presets.${preset.id}.description`,
    );
  });

  it("spreads all original preset fields", () => {
    const preset = mcpPresets.find((p) => p.id === "memory")!;
    const t = vi.fn((key: string) => key);
    const result = getMcpPresetWithDescription(preset, t);

    expect(result.id).toBe(preset.id);
    expect(result.name).toBe(preset.name);
    expect(result.tags).toEqual(preset.tags);
    expect(result.server).toBe(preset.server);
    expect(result.homepage).toBe(preset.homepage);
    expect(result.docs).toBe(preset.docs);
  });

  it("calls t() with the correct i18n key", () => {
    const preset = mcpPresets.find((p) => p.id === "context7")!;
    const t = vi.fn((key: string) => key);
    getMcpPresetWithDescription(preset, t);
    expect(t).toHaveBeenCalledWith("mcp.presets.context7.description");
  });
});
