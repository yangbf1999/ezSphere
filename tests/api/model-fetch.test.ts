import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// model-fetch.ts: fetchModelsForConfig / fetchCodexOauthModels 薄封装；
// showFetchModelsError 是纯逻辑：根据 opts 缺字段 + 错误字符串映射到对应
// toast.error 的 i18n key。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import {
  fetchModelsForConfig,
  fetchCodexOauthModels,
  showFetchModelsError,
} from "@/lib/api/model-fetch";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;
const mockToast = toast.error as unknown as ReturnType<typeof vi.fn>;

// t 直接返回 key，便于断言映射到了哪个 key
const t = ((key: string) => key) as any;

describe("model-fetch API", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockToast.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  describe("fetchModelsForConfig", () => {
    it("传全部参数", async () => {
      mockInvoke.mockResolvedValue([{ id: "m1", ownedBy: "o" }]);
      await fetchModelsForConfig("http://b", "k", true, "http://b/v1/models", "ua");
      expect(mockInvoke).toHaveBeenCalledWith("fetch_models_for_config", {
        baseUrl: "http://b",
        apiKey: "k",
        isFullUrl: true,
        modelsUrl: "http://b/v1/models",
        customUserAgent: "ua",
      });
    });
    it("可选参数缺省为 undefined", async () => {
      mockInvoke.mockResolvedValue([]);
      await fetchModelsForConfig("http://b", "k");
      expect(mockInvoke).toHaveBeenCalledWith("fetch_models_for_config", {
        baseUrl: "http://b",
        apiKey: "k",
        isFullUrl: undefined,
        modelsUrl: undefined,
        customUserAgent: undefined,
      });
    });
  });

  describe("fetchCodexOauthModels", () => {
    it("有 accountId：透传", async () => {
      mockInvoke.mockResolvedValue([]);
      await fetchCodexOauthModels("acc1");
      expect(mockInvoke).toHaveBeenCalledWith("get_codex_oauth_models", { accountId: "acc1" });
    });
    it("无 accountId：传 null", async () => {
      mockInvoke.mockResolvedValue([]);
      await fetchCodexOauthModels();
      expect(mockInvoke).toHaveBeenCalledWith("get_codex_oauth_models", { accountId: null });
    });
    it("传 null：透传 null", async () => {
      mockInvoke.mockResolvedValue([]);
      await fetchCodexOauthModels(null);
      expect(mockInvoke).toHaveBeenCalledWith("get_codex_oauth_models", { accountId: null });
    });
  });

  describe("showFetchModelsError (错误字符串 -> i18n key 映射)", () => {
    it("缺 baseUrl 且缺 apiKey -> fetchModelsNeedConfig", () => {
      showFetchModelsError(new Error("x"), t, { hasApiKey: false, hasBaseUrl: false });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsNeedConfig");
    });
    it("缺 apiKey -> fetchModelsNeedApiKey", () => {
      showFetchModelsError(new Error("x"), t, { hasApiKey: false, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsNeedApiKey");
    });
    it("缺 baseUrl -> fetchModelsNeedEndpoint", () => {
      showFetchModelsError(new Error("x"), t, { hasApiKey: true, hasBaseUrl: false });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsNeedEndpoint");
    });
    it("HTTP 401 -> fetchModelsAuthFailed", () => {
      showFetchModelsError("HTTP 401 Unauthorized", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsAuthFailed");
    });
    it("HTTP 403 -> fetchModelsAuthFailed", () => {
      showFetchModelsError("HTTP 403 Forbidden", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsAuthFailed");
    });
    it("All candidates failed -> fetchModelsEndpointNotFound", () => {
      showFetchModelsError("All candidates failed", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsEndpointNotFound");
    });
    it("HTTP 404 -> fetchModelsEndpointNotFound", () => {
      showFetchModelsError("HTTP 404 Not Found", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsEndpointNotFound");
    });
    it("HTTP 405 -> fetchModelsEndpointNotFound", () => {
      showFetchModelsError("HTTP 405 Method Not Allowed", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsEndpointNotFound");
    });
    it("timeout -> fetchModelsTimeout", () => {
      showFetchModelsError("request timeout", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsTimeout");
    });
    it("timed out -> fetchModelsTimeout", () => {
      showFetchModelsError("operation timed out", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsTimeout");
    });
    it("Failed to parse -> fetchModelsNotSupported", () => {
      showFetchModelsError("Failed to parse response", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsNotSupported");
    });
    it("未知错误 -> fetchModelsFailed 兜底", () => {
      showFetchModelsError("something weird", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsFailed");
    });
    it("无 opts + Error 对象：走错误字符串解析", () => {
      showFetchModelsError(new Error("HTTP 401"), t);
      expect(mockToast).toHaveBeenCalledWith("providerForm.fetchModelsAuthFailed");
    });
    it("每次只调用一次 toast.error", () => {
      showFetchModelsError("unknown", t, { hasApiKey: true, hasBaseUrl: true });
      expect(mockToast).toHaveBeenCalledTimes(1);
    });
  });

  it("invoke 错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("network down"));
    await expect(fetchModelsForConfig("http://b", "k")).rejects.toThrow("network down");
  });
});
