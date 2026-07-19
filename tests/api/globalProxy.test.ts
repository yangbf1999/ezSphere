import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// globalProxy.ts: 薄封装；setGlobalProxyUrl 把 invoke 错误统一包成 Error。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import {
  getGlobalProxyUrl,
  setGlobalProxyUrl,
  testProxyUrl,
  getUpstreamProxyStatus,
  scanLocalProxies,
} from "@/lib/api/globalProxy";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("globalProxy API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getGlobalProxyUrl 调用 get_global_proxy_url 无参", async () => {
    mockInvoke.mockResolvedValue("http://127.0.0.1:7890");
    await expect(getGlobalProxyUrl()).resolves.toBe("http://127.0.0.1:7890");
    expect(mockInvoke).toHaveBeenCalledWith("get_global_proxy_url");
  });

  describe("setGlobalProxyUrl", () => {
    it("调用 set_global_proxy_url 传 url", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await setGlobalProxyUrl("socks5://127.0.0.1:1080");
      expect(mockInvoke).toHaveBeenCalledWith("set_global_proxy_url", {
        url: "socks5://127.0.0.1:1080",
      });
    });
    it("invoke 抛 Error：原样抛出", async () => {
      mockInvoke.mockRejectedValue(new Error("proxy refused"));
      await expect(setGlobalProxyUrl("http://x")).rejects.toThrow("proxy refused");
    });
    it("invoke 抛字符串：包成 Error", async () => {
      mockInvoke.mockRejectedValue("string error");
      await expect(setGlobalProxyUrl("http://x")).rejects.toThrow("string error");
      // 确保抛出的是 Error 实例
      await expect(setGlobalProxyUrl("http://x")).rejects.toBeInstanceOf(Error);
    });
    it("invoke 抛非字符串对象：包成 Error(String(...))", async () => {
      mockInvoke.mockRejectedValue({ code: 42 });
      await expect(setGlobalProxyUrl("http://x")).rejects.toThrow("[object Object]");
    });
  });

  it("testProxyUrl 调用 test_proxy_url 传 url", async () => {
    mockInvoke.mockResolvedValue({ success: true, latencyMs: 10, error: null });
    await testProxyUrl("http://127.0.0.1:7890");
    expect(mockInvoke).toHaveBeenCalledWith("test_proxy_url", { url: "http://127.0.0.1:7890" });
  });

  it("getUpstreamProxyStatus 调用 get_upstream_proxy_status 无参", async () => {
    mockInvoke.mockResolvedValue({ enabled: false, proxyUrl: null });
    await getUpstreamProxyStatus();
    expect(mockInvoke).toHaveBeenCalledWith("get_upstream_proxy_status");
  });

  it("scanLocalProxies 调用 scan_local_proxies 无参", async () => {
    mockInvoke.mockResolvedValue([{ url: "http://127.0.0.1:7890", proxyType: "http", port: 7890 }]);
    await scanLocalProxies();
    expect(mockInvoke).toHaveBeenCalledWith("scan_local_proxies");
  });
});
