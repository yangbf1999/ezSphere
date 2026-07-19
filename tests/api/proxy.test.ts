import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// proxy.ts: 代理服务器控制 / 接管状态 / 配置 / 计费倍率。大量薄封装。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { proxyApi } from "@/lib/api/proxy";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("proxy API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  // 代理服务器控制
  it("startProxyServer 调用 start_proxy_server 无参", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await proxyApi.startProxyServer();
    expect(mockInvoke).toHaveBeenCalledWith("start_proxy_server");
  });
  it("stopProxyWithRestore 调用 stop_proxy_with_restore 无参", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await proxyApi.stopProxyWithRestore();
    expect(mockInvoke).toHaveBeenCalledWith("stop_proxy_with_restore");
  });
  it("getProxyStatus 调用 get_proxy_status 无参", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await proxyApi.getProxyStatus();
    expect(mockInvoke).toHaveBeenCalledWith("get_proxy_status");
  });
  it("isProxyRunning 返回 boolean", async () => {
    mockInvoke.mockResolvedValue(true);
    await expect(proxyApi.isProxyRunning()).resolves.toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("is_proxy_running");
  });
  it("isLiveTakeoverActive 返回 boolean", async () => {
    mockInvoke.mockResolvedValue(false);
    await proxyApi.isLiveTakeoverActive();
    expect(mockInvoke).toHaveBeenCalledWith("is_live_takeover_active");
  });
  it("switchProxyProvider 传 appType + providerId", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await proxyApi.switchProxyProvider("claude", "p1");
    expect(mockInvoke).toHaveBeenCalledWith("switch_proxy_provider", { appType: "claude", providerId: "p1" });
  });

  // 接管状态
  it("getProxyTakeoverStatus 无参", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await proxyApi.getProxyTakeoverStatus();
    expect(mockInvoke).toHaveBeenCalledWith("get_proxy_takeover_status");
  });
  it("setProxyTakeoverForApp 传 appType + enabled", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await proxyApi.setProxyTakeoverForApp("codex", true);
    expect(mockInvoke).toHaveBeenCalledWith("set_proxy_takeover_for_app", { appType: "codex", enabled: true });
  });

  // Legacy 配置
  it("getProxyConfig 无参", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await proxyApi.getProxyConfig();
    expect(mockInvoke).toHaveBeenCalledWith("get_proxy_config");
  });
  it("updateProxyConfig 传 config", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await proxyApi.updateProxyConfig({} as any);
    expect(mockInvoke).toHaveBeenCalledWith("update_proxy_config", { config: {} });
  });

  // v3+ 全局/应用级配置
  it("getGlobalProxyConfig 无参", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await proxyApi.getGlobalProxyConfig();
    expect(mockInvoke).toHaveBeenCalledWith("get_global_proxy_config");
  });
  it("updateGlobalProxyConfig 传 config", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await proxyApi.updateGlobalProxyConfig({} as any);
    expect(mockInvoke).toHaveBeenCalledWith("update_global_proxy_config", { config: {} });
  });
  it("getProxyConfigForApp 传 appType", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await proxyApi.getProxyConfigForApp("claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_proxy_config_for_app", { appType: "claude" });
  });
  it("updateProxyConfigForApp 传 config", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await proxyApi.updateProxyConfigForApp({ appType: "claude" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("update_proxy_config_for_app", { config: { appType: "claude" } });
  });

  // 计费默认配置
  it("getDefaultCostMultiplier 传 appType", async () => {
    mockInvoke.mockResolvedValue("1.0");
    await expect(proxyApi.getDefaultCostMultiplier("claude")).resolves.toBe("1.0");
    expect(mockInvoke).toHaveBeenCalledWith("get_default_cost_multiplier", { appType: "claude" });
  });
  it("setDefaultCostMultiplier 传 appType + value", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await proxyApi.setDefaultCostMultiplier("codex", "2.0");
    expect(mockInvoke).toHaveBeenCalledWith("set_default_cost_multiplier", { appType: "codex", value: "2.0" });
  });
  it("getPricingModelSource 传 appType", async () => {
    mockInvoke.mockResolvedValue("proxy");
    await proxyApi.getPricingModelSource("claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_pricing_model_source", { appType: "claude" });
  });
  it("setPricingModelSource 传 appType + value", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await proxyApi.setPricingModelSource("claude", "official");
    expect(mockInvoke).toHaveBeenCalledWith("set_pricing_model_source", { appType: "claude", value: "official" });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("port in use"));
    await expect(proxyApi.startProxyServer()).rejects.toThrow("port in use");
  });
});
