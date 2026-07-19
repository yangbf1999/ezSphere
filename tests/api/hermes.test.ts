import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// hermes.ts: model 配置 / WebUI / 记忆 blob。openWebUI 的 path 默认 null。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { hermesApi } from "@/lib/api/hermes";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("hermes API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getModelConfig 调用 get_hermes_model_config", async () => {
    mockInvoke.mockResolvedValue(null);
    await expect(hermesApi.getModelConfig()).resolves.toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith("get_hermes_model_config");
  });

  describe("openWebUI", () => {
    it("有 path：透传", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await hermesApi.openWebUI("/config");
      expect(mockInvoke).toHaveBeenCalledWith("open_hermes_web_ui", { path: "/config" });
    });
    it("无 path：传 null", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await hermesApi.openWebUI();
      expect(mockInvoke).toHaveBeenCalledWith("open_hermes_web_ui", { path: null });
    });
  });

  it("launchDashboard 调用 launch_hermes_dashboard", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await hermesApi.launchDashboard();
    expect(mockInvoke).toHaveBeenCalledWith("launch_hermes_dashboard");
  });

  it("getMemory 传 kind", async () => {
    mockInvoke.mockResolvedValue("");
    await hermesApi.getMemory("MEMORY");
    expect(mockInvoke).toHaveBeenCalledWith("get_hermes_memory", { kind: "MEMORY" });
  });

  it("setMemory 传 kind + content", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await hermesApi.setMemory("USER", "bio");
    expect(mockInvoke).toHaveBeenCalledWith("set_hermes_memory", { kind: "USER", content: "bio" });
  });

  it("getMemoryLimits 调用 get_hermes_memory_limits", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await hermesApi.getMemoryLimits();
    expect(mockInvoke).toHaveBeenCalledWith("get_hermes_memory_limits");
  });

  it("setMemoryEnabled 传 kind + enabled", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await hermesApi.setMemoryEnabled("MEMORY", false);
    expect(mockInvoke).toHaveBeenCalledWith("set_hermes_memory_enabled", {
      kind: "MEMORY",
      enabled: false,
    });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("hermes not running"));
    await expect(hermesApi.getMemory("MEMORY")).rejects.toThrow("hermes not running");
  });
});
