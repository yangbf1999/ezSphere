import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// model-test.ts: 连通性检查。streamCheckAllProviders 默认 proxyTargetsOnly=false。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import {
  streamCheckProvider,
  streamCheckAllProviders,
  getStreamCheckConfig,
  saveStreamCheckConfig,
} from "@/lib/api/model-test";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("model-test API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("streamCheckProvider 传 appType + providerId", async () => {
    mockInvoke.mockResolvedValue({ status: "operational", success: true, message: "ok", testedAt: 1, retryCount: 0 } as any);
    await streamCheckProvider("claude", "p1");
    expect(mockInvoke).toHaveBeenCalledWith("stream_check_provider", { appType: "claude", providerId: "p1" });
  });

  describe("streamCheckAllProviders", () => {
    it("默认 proxyTargetsOnly=false", async () => {
      mockInvoke.mockResolvedValue([]);
      await streamCheckAllProviders("claude");
      expect(mockInvoke).toHaveBeenCalledWith("stream_check_all_providers", {
        appType: "claude",
        proxyTargetsOnly: false,
      });
    });
    it("显式 proxyTargetsOnly=true 透传", async () => {
      mockInvoke.mockResolvedValue([]);
      await streamCheckAllProviders("codex", true);
      expect(mockInvoke).toHaveBeenCalledWith("stream_check_all_providers", {
        appType: "codex",
        proxyTargetsOnly: true,
      });
    });
    it("返回 [id, result] 元组数组透传", async () => {
      const r: any = [["p1", { status: "operational", success: true, message: "ok", testedAt: 1, retryCount: 0 }]];
      mockInvoke.mockResolvedValue(r);
      await expect(streamCheckAllProviders("claude")).resolves.toBe(r);
    });
  });

  it("getStreamCheckConfig 调用 get_stream_check_config", async () => {
    mockInvoke.mockResolvedValue({ timeoutSecs: 10, maxRetries: 3, degradedThresholdMs: 2000 } as any);
    await getStreamCheckConfig();
    expect(mockInvoke).toHaveBeenCalledWith("get_stream_check_config");
  });

  it("saveStreamCheckConfig 传 config", async () => {
    mockInvoke.mockResolvedValue(undefined);
    const config = { timeoutSecs: 5, maxRetries: 1, degradedThresholdMs: 1000 };
    await saveStreamCheckConfig(config as any);
    expect(mockInvoke).toHaveBeenCalledWith("save_stream_check_config", { config });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("unreachable"));
    await expect(streamCheckProvider("claude", "p1")).rejects.toThrow("unreachable");
  });
});
