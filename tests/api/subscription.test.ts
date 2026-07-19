import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// subscription.ts: 配额查询。getCodexOauthQuota 的 accountId 直接透传（null/字符串）；
// getCodingPlanQuota 的 accessKeyId/secretAccessKey 可选。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { subscriptionApi } from "@/lib/api/subscription";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("subscription API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getQuota 传 tool", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await subscriptionApi.getQuota("claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_subscription_quota", { tool: "claude" });
  });

  describe("getCodexOauthQuota", () => {
    it("有 accountId：透传", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await subscriptionApi.getCodexOauthQuota("acc1");
      expect(mockInvoke).toHaveBeenCalledWith("get_codex_oauth_quota", { accountId: "acc1" });
    });
    it("传 null：透传 null", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await subscriptionApi.getCodexOauthQuota(null);
      expect(mockInvoke).toHaveBeenCalledWith("get_codex_oauth_quota", { accountId: null });
    });
  });

  describe("getCodingPlanQuota", () => {
    it("仅 baseUrl + apiKey：可选字段 undefined", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await subscriptionApi.getCodingPlanQuota("http://b", "k");
      expect(mockInvoke).toHaveBeenCalledWith("get_coding_plan_quota", {
        baseUrl: "http://b",
        apiKey: "k",
        accessKeyId: undefined,
        secretAccessKey: undefined,
      });
    });
    it("含火山方舟 AK/SK：透传", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await subscriptionApi.getCodingPlanQuota("http://b", "k", "AK", "SK");
      expect(mockInvoke).toHaveBeenCalledWith("get_coding_plan_quota", {
        baseUrl: "http://b",
        apiKey: "k",
        accessKeyId: "AK",
        secretAccessKey: "SK",
      });
    });
  });

  it("getBalance 传 baseUrl + apiKey", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await subscriptionApi.getBalance("http://b", "k");
    expect(mockInvoke).toHaveBeenCalledWith("get_balance", { baseUrl: "http://b", apiKey: "k" });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("quota api down"));
    await expect(subscriptionApi.getQuota("claude")).rejects.toThrow("quota api down");
  });
});
