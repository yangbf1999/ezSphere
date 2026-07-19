import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// failover.ts: 熔断器 + 故障转移队列。均带 appType/providerId 的薄封装。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { failoverApi } from "@/lib/api/failover";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("failover API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  // 熔断器
  it("getProviderHealth 传 providerId + appType", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await failoverApi.getProviderHealth("p1", "claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_provider_health", { providerId: "p1", appType: "claude" });
  });
  it("resetCircuitBreaker 传 providerId + appType", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await failoverApi.resetCircuitBreaker("p1", "codex");
    expect(mockInvoke).toHaveBeenCalledWith("reset_circuit_breaker", { providerId: "p1", appType: "codex" });
  });
  it("getCircuitBreakerConfig 无参", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await failoverApi.getCircuitBreakerConfig();
    expect(mockInvoke).toHaveBeenCalledWith("get_circuit_breaker_config");
  });
  it("updateCircuitBreakerConfig 传 config", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await failoverApi.updateCircuitBreakerConfig({ threshold: 5 } as any);
    expect(mockInvoke).toHaveBeenCalledWith("update_circuit_breaker_config", {
      config: { threshold: 5 },
    });
  });
  it("getCircuitBreakerStats 传 providerId + appType 返回|null", async () => {
    mockInvoke.mockResolvedValue(null);
    await expect(failoverApi.getCircuitBreakerStats("p1", "claude")).resolves.toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith("get_circuit_breaker_stats", {
      providerId: "p1",
      appType: "claude",
    });
  });

  // 故障转移队列
  it("getFailoverQueue 传 appType", async () => {
    mockInvoke.mockResolvedValue([]);
    await failoverApi.getFailoverQueue("claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_failover_queue", { appType: "claude" });
  });
  it("getAvailableProvidersForFailover 传 appType", async () => {
    mockInvoke.mockResolvedValue([]);
    await failoverApi.getAvailableProvidersForFailover("codex");
    expect(mockInvoke).toHaveBeenCalledWith("get_available_providers_for_failover", { appType: "codex" });
  });
  it("addToFailoverQueue 传 appType + providerId", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await failoverApi.addToFailoverQueue("claude", "p1");
    expect(mockInvoke).toHaveBeenCalledWith("add_to_failover_queue", { appType: "claude", providerId: "p1" });
  });
  it("removeFromFailoverQueue 传 appType + providerId", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await failoverApi.removeFromFailoverQueue("claude", "p1");
    expect(mockInvoke).toHaveBeenCalledWith("remove_from_failover_queue", {
      appType: "claude",
      providerId: "p1",
    });
  });
  it("getAutoFailoverEnabled 传 appType 返回 boolean", async () => {
    mockInvoke.mockResolvedValue(false);
    await expect(failoverApi.getAutoFailoverEnabled("claude")).resolves.toBe(false);
    expect(mockInvoke).toHaveBeenCalledWith("get_auto_failover_enabled", { appType: "claude" });
  });
  it("setAutoFailoverEnabled 传 appType + enabled", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await failoverApi.setAutoFailoverEnabled("codex", true);
    expect(mockInvoke).toHaveBeenCalledWith("set_auto_failover_enabled", { appType: "codex", enabled: true });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("state machine"));
    await expect(failoverApi.getProviderHealth("p1", "claude")).rejects.toThrow("state machine");
  });
});
