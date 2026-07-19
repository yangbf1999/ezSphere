import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// usage.ts: usageApi 多组薄封装，参数展平到 payload。query/testScript 把
// appId 映射为 app 字段；getRequestLogs 有默认分页 page=0/pageSize=20。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { usageApi } from "@/lib/api/usage";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("usage API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("query 把 appId 映射为 app", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await usageApi.query("p1", "claude");
    expect(mockInvoke).toHaveBeenCalledWith("queryProviderUsage", {
      providerId: "p1",
      app: "claude",
    });
  });

  it("testScript 传全部参数（含可选项）", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await usageApi.testScript(
      "p1",
      "codex",
      "script",
      5000,
      "k",
      "http://b",
      "tok",
      "uid",
      "openai" as any,
    );
    expect(mockInvoke).toHaveBeenCalledWith("testUsageScript", {
      providerId: "p1",
      app: "codex",
      scriptCode: "script",
      timeout: 5000,
      apiKey: "k",
      baseUrl: "http://b",
      accessToken: "tok",
      userId: "uid",
      templateType: "openai",
    });
  });

  it("testScript 仅必填参数：可选为 undefined", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await usageApi.testScript("p1", "claude", "script");
    expect(mockInvoke).toHaveBeenCalledWith("testUsageScript", {
      providerId: "p1",
      app: "claude",
      scriptCode: "script",
      timeout: undefined,
      apiKey: undefined,
      baseUrl: undefined,
      accessToken: undefined,
      userId: undefined,
      templateType: undefined,
    });
  });

  it("getUsageSummary 传可选筛选", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await usageApi.getUsageSummary(1, 2, "claude", "prov", "model");
    expect(mockInvoke).toHaveBeenCalledWith("get_usage_summary", {
      startDate: 1,
      endDate: 2,
      appType: "claude",
      providerName: "prov",
      model: "model",
    });
  });

  it("getUsageSummaryByApp 传参数", async () => {
    mockInvoke.mockResolvedValue([]);
    await usageApi.getUsageSummaryByApp(1, 2, "prov", "model");
    expect(mockInvoke).toHaveBeenCalledWith("get_usage_summary_by_app", {
      startDate: 1,
      endDate: 2,
      providerName: "prov",
      model: "model",
    });
  });

  it("getUsageTrends 传参数", async () => {
    mockInvoke.mockResolvedValue([]);
    await usageApi.getUsageTrends(1, 2, "claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_usage_trends", {
      startDate: 1,
      endDate: 2,
      appType: "claude",
      providerName: undefined,
      model: undefined,
    });
  });

  it("getProviderStats 传参数", async () => {
    mockInvoke.mockResolvedValue([]);
    await usageApi.getProviderStats(1, 2);
    expect(mockInvoke).toHaveBeenCalledWith("get_provider_stats", {
      startDate: 1,
      endDate: 2,
      appType: undefined,
      providerName: undefined,
      model: undefined,
    });
  });

  it("getModelStats 传参数", async () => {
    mockInvoke.mockResolvedValue([]);
    await usageApi.getModelStats(1, 2, "claude", "prov", "model");
    expect(mockInvoke).toHaveBeenCalledWith("get_model_stats", {
      startDate: 1,
      endDate: 2,
      appType: "claude",
      providerName: "prov",
      model: "model",
    });
  });

  describe("getRequestLogs", () => {
    it("默认分页 page=0 pageSize=20", async () => {
      mockInvoke.mockResolvedValue({ logs: [], total: 0 } as any);
      await usageApi.getRequestLogs({} as any);
      expect(mockInvoke).toHaveBeenCalledWith("get_request_logs", {
        filters: {},
        page: 0,
        pageSize: 20,
      });
    });
    it("自定义分页透传", async () => {
      mockInvoke.mockResolvedValue({ logs: [], total: 0 } as any);
      await usageApi.getRequestLogs({} as any, 3, 50);
      expect(mockInvoke).toHaveBeenCalledWith("get_request_logs", {
        filters: {},
        page: 3,
        pageSize: 50,
      });
    });
  });

  it("getRequestDetail 传 requestId", async () => {
    mockInvoke.mockResolvedValue(null);
    await usageApi.getRequestDetail("r1");
    expect(mockInvoke).toHaveBeenCalledWith("get_request_detail", { requestId: "r1" });
  });

  it("getModelPricing 调用 get_model_pricing 无参", async () => {
    mockInvoke.mockResolvedValue([]);
    await usageApi.getModelPricing();
    expect(mockInvoke).toHaveBeenCalledWith("get_model_pricing");
  });

  it("updateModelPricing 传全部字段", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await usageApi.updateModelPricing("m1", "M1", "1", "2", "3", "4");
    expect(mockInvoke).toHaveBeenCalledWith("update_model_pricing", {
      modelId: "m1",
      displayName: "M1",
      inputCost: "1",
      outputCost: "2",
      cacheReadCost: "3",
      cacheCreationCost: "4",
    });
  });

  it("deleteModelPricing 传 modelId", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await usageApi.deleteModelPricing("m1");
    expect(mockInvoke).toHaveBeenCalledWith("delete_model_pricing", { modelId: "m1" });
  });

  it("checkProviderLimits 传 providerId + appType", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await usageApi.checkProviderLimits("p1", "claude");
    expect(mockInvoke).toHaveBeenCalledWith("check_provider_limits", {
      providerId: "p1",
      appType: "claude",
    });
  });

  it("syncSessionUsage 调用 sync_session_usage 无参", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await usageApi.syncSessionUsage();
    expect(mockInvoke).toHaveBeenCalledWith("sync_session_usage");
  });

  it("getDataSourceBreakdown 调用 get_usage_data_sources 无参", async () => {
    mockInvoke.mockResolvedValue([]);
    await usageApi.getDataSourceBreakdown();
    expect(mockInvoke).toHaveBeenCalledWith("get_usage_data_sources");
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("db locked"));
    await expect(usageApi.query("p1", "claude")).rejects.toThrow("db locked");
  });
});
