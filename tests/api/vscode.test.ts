import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// vscode.ts: live 配置读取 / 自定义端点 / 文件对话框。
// testApiEndpoints 把 options.timeoutSecs 透传（可选）。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { vscodeApi } from "@/lib/api/vscode";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("vscode API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getLiveProviderSettings 把 appId 映射为 app", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await vscodeApi.getLiveProviderSettings("claude");
    expect(mockInvoke).toHaveBeenCalledWith("read_live_provider_settings", { app: "claude" });
  });

  describe("testApiEndpoints", () => {
    it("有 timeoutSecs：透传", async () => {
      mockInvoke.mockResolvedValue([]);
      await vscodeApi.testApiEndpoints(["http://a", "http://b"], { timeoutSecs: 5 });
      expect(mockInvoke).toHaveBeenCalledWith("test_api_endpoints", {
        urls: ["http://a", "http://b"],
        timeoutSecs: 5,
      });
    });
    it("无 options：timeoutSecs 为 undefined", async () => {
      mockInvoke.mockResolvedValue([]);
      await vscodeApi.testApiEndpoints(["http://a"]);
      expect(mockInvoke).toHaveBeenCalledWith("test_api_endpoints", {
        urls: ["http://a"],
        timeoutSecs: undefined,
      });
    });
  });

  it("getCustomEndpoints 传 app + providerId", async () => {
    mockInvoke.mockResolvedValue([]);
    await vscodeApi.getCustomEndpoints("claude", "p1");
    expect(mockInvoke).toHaveBeenCalledWith("get_custom_endpoints", {
      app: "claude",
      providerId: "p1",
    });
  });

  it("addCustomEndpoint 传 app + providerId + url", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await vscodeApi.addCustomEndpoint("codex", "p1", "http://x");
    expect(mockInvoke).toHaveBeenCalledWith("add_custom_endpoint", {
      app: "codex",
      providerId: "p1",
      url: "http://x",
    });
  });

  it("removeCustomEndpoint 传 app + providerId + url", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await vscodeApi.removeCustomEndpoint("codex", "p1", "http://x");
    expect(mockInvoke).toHaveBeenCalledWith("remove_custom_endpoint", {
      app: "codex",
      providerId: "p1",
      url: "http://x",
    });
  });

  it("updateEndpointLastUsed 传 app + providerId + url", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await vscodeApi.updateEndpointLastUsed("gemini", "p1", "http://x");
    expect(mockInvoke).toHaveBeenCalledWith("update_endpoint_last_used", {
      app: "gemini",
      providerId: "p1",
      url: "http://x",
    });
  });

  it("exportConfigToFile 传 filePath", async () => {
    mockInvoke.mockResolvedValue({ success: true } as any);
    await vscodeApi.exportConfigToFile("/f.json");
    expect(mockInvoke).toHaveBeenCalledWith("export_config_to_file", { filePath: "/f.json" });
  });

  it("importConfigFromFile 传 filePath", async () => {
    mockInvoke.mockResolvedValue({ success: true } as any);
    await vscodeApi.importConfigFromFile("/f.json");
    expect(mockInvoke).toHaveBeenCalledWith("import_config_from_file", { filePath: "/f.json" });
  });

  it("saveFileDialog 传 defaultName", async () => {
    mockInvoke.mockResolvedValue(null);
    await vscodeApi.saveFileDialog("x.json");
    expect(mockInvoke).toHaveBeenCalledWith("save_file_dialog", { defaultName: "x.json" });
  });

  it("openFileDialog 无参", async () => {
    mockInvoke.mockResolvedValue(null);
    await vscodeApi.openFileDialog();
    expect(mockInvoke).toHaveBeenCalledWith("open_file_dialog");
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("network"));
    await expect(vscodeApi.testApiEndpoints(["http://a"])).rejects.toThrow("network");
  });
});
