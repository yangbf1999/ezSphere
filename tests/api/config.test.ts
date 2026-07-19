import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// config.ts: 通用配置片段读写。纯逻辑重点：
// - extractCommonConfigSnippet 仅当 settingsConfig 是非空白字符串时才加入 payload
// - getClaudeCommonConfigSnippet / setClaudeCommonConfigSnippet 已废弃但仍是薄封装

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import {
  getClaudeCommonConfigSnippet,
  setClaudeCommonConfigSnippet,
  getCommonConfigSnippet,
  setCommonConfigSnippet,
  extractCommonConfigSnippet,
} from "@/lib/api/config";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("config API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getClaudeCommonConfigSnippet 调用 get_claude_common_config_snippet 无参", async () => {
    mockInvoke.mockResolvedValue(null);
    await getClaudeCommonConfigSnippet();
    expect(mockInvoke).toHaveBeenCalledWith("get_claude_common_config_snippet");
  });

  it("setClaudeCommonConfigSnippet 调用 set_claude_common_config_snippet 传 snippet", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setClaudeCommonConfigSnippet('{"k":"v"}');
    expect(mockInvoke).toHaveBeenCalledWith("set_claude_common_config_snippet", {
      snippet: '{"k":"v"}',
    });
  });

  it("getCommonConfigSnippet 传 appType", async () => {
    mockInvoke.mockResolvedValue(null);
    await getCommonConfigSnippet("codex");
    expect(mockInvoke).toHaveBeenCalledWith("get_common_config_snippet", { appType: "codex" });
  });

  it("setCommonConfigSnippet 传 appType + snippet", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await setCommonConfigSnippet("gemini", "toml");
    expect(mockInvoke).toHaveBeenCalledWith("set_common_config_snippet", {
      appType: "gemini",
      snippet: "toml",
    });
  });

  describe("extractCommonConfigSnippet (settingsConfig 纯逻辑)", () => {
    it("无 options：payload 只含 appType", async () => {
      mockInvoke.mockResolvedValue("{}");
      await extractCommonConfigSnippet("claude");
      expect(mockInvoke).toHaveBeenCalledWith("extract_common_config_snippet", { appType: "claude" });
    });
    it("settingsConfig 为非空白字符串：加入 payload", async () => {
      mockInvoke.mockResolvedValue("{}");
      await extractCommonConfigSnippet("codex", { settingsConfig: '{"a":1}' });
      expect(mockInvoke).toHaveBeenCalledWith("extract_common_config_snippet", {
        appType: "codex",
        settingsConfig: '{"a":1}',
      });
    });
    it("settingsConfig 为空串：不加入 payload", async () => {
      mockInvoke.mockResolvedValue("{}");
      await extractCommonConfigSnippet("claude", { settingsConfig: "" });
      expect(mockInvoke).toHaveBeenCalledWith("extract_common_config_snippet", { appType: "claude" });
    });
    it("settingsConfig 为纯空白串：不加入 payload", async () => {
      mockInvoke.mockResolvedValue("{}");
      await extractCommonConfigSnippet("claude", { settingsConfig: "   " });
      expect(mockInvoke).toHaveBeenCalledWith("extract_common_config_snippet", { appType: "claude" });
    });
    it("透传 invoke 返回的字符串", async () => {
      mockInvoke.mockResolvedValue('{"common":true}');
      await expect(extractCommonConfigSnippet("gemini")).resolves.toBe('{"common":true}');
    });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("invalid json"));
    await expect(setCommonConfigSnippet("claude", "{bad")).rejects.toThrow("invalid json");
  });
});
