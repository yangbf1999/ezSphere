import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// providers.ts: providersApi + universalProvidersApi。openTerminal 从 options
// 解构 cwd；onSwitched 走 listen('provider-switched')。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { providersApi, universalProvidersApi } from "@/lib/api/providers";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;
const mockListen = listen as unknown as ReturnType<typeof vi.fn>;

describe("providers API", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockListen.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  // 基础 CRUD
  it("getAll 把 appId 映射为 app", async () => {
    mockInvoke.mockResolvedValue({});
    await providersApi.getAll("claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_providers", { app: "claude" });
  });
  it("getCurrent 把 appId 映射为 app", async () => {
    mockInvoke.mockResolvedValue("p1");
    await expect(providersApi.getCurrent("claude")).resolves.toBe("p1");
    expect(mockInvoke).toHaveBeenCalledWith("get_current_provider", { app: "claude" });
  });
  it("add 传 provider + app + addToLive", async () => {
    mockInvoke.mockResolvedValue(true);
    const provider = { id: "p1", name: "n" } as any;
    await providersApi.add(provider, "codex", true);
    expect(mockInvoke).toHaveBeenCalledWith("add_provider", {
      provider,
      app: "codex",
      addToLive: true,
    });
  });
  it("add 不传 addToLive：透传 undefined", async () => {
    mockInvoke.mockResolvedValue(true);
    await providersApi.add({ id: "p1" } as any, "claude");
    expect(mockInvoke).toHaveBeenCalledWith("add_provider", {
      provider: { id: "p1" },
      app: "claude",
      addToLive: undefined,
    });
  });
  it("update 传 provider + app + originalId", async () => {
    mockInvoke.mockResolvedValue(true);
    await providersApi.update({ id: "p1" } as any, "claude", "old");
    expect(mockInvoke).toHaveBeenCalledWith("update_provider", {
      provider: { id: "p1" },
      app: "claude",
      originalId: "old",
    });
  });
  it("delete 传 id + app", async () => {
    mockInvoke.mockResolvedValue(true);
    await providersApi.delete("p1", "claude");
    expect(mockInvoke).toHaveBeenCalledWith("delete_provider", { id: "p1", app: "claude" });
  });
  it("removeFromLiveConfig 传 id + app", async () => {
    mockInvoke.mockResolvedValue(true);
    await providersApi.removeFromLiveConfig("p1", "opencode");
    expect(mockInvoke).toHaveBeenCalledWith("remove_provider_from_live_config", {
      id: "p1",
      app: "opencode",
    });
  });
  it("switch 传 id + app 返回 SwitchResult", async () => {
    mockInvoke.mockResolvedValue({ warnings: [] });
    await providersApi.switch("p1", "claude");
    expect(mockInvoke).toHaveBeenCalledWith("switch_provider", { id: "p1", app: "claude" });
  });

  // 导入
  it("importDefault 传 app", async () => {
    mockInvoke.mockResolvedValue(true);
    await providersApi.importDefault("claude");
    expect(mockInvoke).toHaveBeenCalledWith("import_default_config", { app: "claude" });
  });
  it("importClaudeDesktopFromClaude 无参", async () => {
    mockInvoke.mockResolvedValue(3);
    await expect(providersApi.importClaudeDesktopFromClaude()).resolves.toBe(3);
    expect(mockInvoke).toHaveBeenCalledWith("import_claude_desktop_providers_from_claude");
  });
  it("ensureClaudeDesktopOfficialProvider 无参", async () => {
    mockInvoke.mockResolvedValue(true);
    await providersApi.ensureClaudeDesktopOfficialProvider();
    expect(mockInvoke).toHaveBeenCalledWith("ensure_claude_desktop_official_provider");
  });
  it("getClaudeDesktopStatus 无参", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await providersApi.getClaudeDesktopStatus();
    expect(mockInvoke).toHaveBeenCalledWith("get_claude_desktop_status");
  });
  it("getClaudeDesktopDefaultRoutes 无参", async () => {
    mockInvoke.mockResolvedValue([]);
    await providersApi.getClaudeDesktopDefaultRoutes();
    expect(mockInvoke).toHaveBeenCalledWith("get_claude_desktop_default_routes");
  });
  it("updateTrayMenu 无参", async () => {
    mockInvoke.mockResolvedValue(true);
    await providersApi.updateTrayMenu();
    expect(mockInvoke).toHaveBeenCalledWith("update_tray_menu");
  });
  it("updateSortOrder 传 updates + app", async () => {
    mockInvoke.mockResolvedValue(true);
    await providersApi.updateSortOrder([{ id: "p1", sortIndex: 0 }], "claude");
    expect(mockInvoke).toHaveBeenCalledWith("update_providers_sort_order", {
      updates: [{ id: "p1", sortIndex: 0 }],
      app: "claude",
    });
  });

  // onSwitched: listen
  describe("onSwitched", () => {
    it("注册 listen('provider-switched')，handler 收到 payload", async () => {
      const unlisten = vi.fn();
      let captured: ((e: { payload: unknown }) => void) | null = null;
      mockListen.mockImplementation((_evt: string, cb: (e: { payload: unknown }) => void) => {
        captured = cb;
        return Promise.resolve(unlisten);
      });
      const handler = vi.fn();
      const result = await providersApi.onSwitched(handler);
      expect(mockListen).toHaveBeenCalledWith("provider-switched", expect.any(Function));
      expect(result).toBe(unlisten);
      const payload = { appType: "claude", providerId: "p1" };
      captured!({ payload });
      expect(handler).toHaveBeenCalledWith(payload);
    });
  });

  // openTerminal: 解构 cwd
  describe("openTerminal", () => {
    it("有 cwd：透传", async () => {
      mockInvoke.mockResolvedValue(true);
      await providersApi.openTerminal("p1", "claude", { cwd: "/proj" });
      expect(mockInvoke).toHaveBeenCalledWith("open_provider_terminal", {
        providerId: "p1",
        app: "claude",
        cwd: "/proj",
      });
    });
    it("无 options：cwd 为 undefined", async () => {
      mockInvoke.mockResolvedValue(true);
      await providersApi.openTerminal("p1", "claude");
      expect(mockInvoke).toHaveBeenCalledWith("open_provider_terminal", {
        providerId: "p1",
        app: "claude",
        cwd: undefined,
      });
    });
  });

  // live 导入
  it("importOpenCodeFromLive 无参", async () => {
    mockInvoke.mockResolvedValue(2);
    await expect(providersApi.importOpenCodeFromLive()).resolves.toBe(2);
    expect(mockInvoke).toHaveBeenCalledWith("import_opencode_providers_from_live");
  });
  it("getOpenCodeLiveProviderIds 无参", async () => {
    mockInvoke.mockResolvedValue(["p1"]);
    await providersApi.getOpenCodeLiveProviderIds();
    expect(mockInvoke).toHaveBeenCalledWith("get_opencode_live_provider_ids");
  });
  it("getOpenClawLiveProviderIds 无参", async () => {
    mockInvoke.mockResolvedValue([]);
    await providersApi.getOpenClawLiveProviderIds();
    expect(mockInvoke).toHaveBeenCalledWith("get_openclaw_live_provider_ids");
  });
  it("getHermesLiveProviderIds 无参", async () => {
    mockInvoke.mockResolvedValue([]);
    await providersApi.getHermesLiveProviderIds();
    expect(mockInvoke).toHaveBeenCalledWith("get_hermes_live_provider_ids");
  });
  it("importOpenClawFromLive 无参", async () => {
    mockInvoke.mockResolvedValue(1);
    await providersApi.importOpenClawFromLive();
    expect(mockInvoke).toHaveBeenCalledWith("import_openclaw_providers_from_live");
  });
  it("importHermesFromLive 无参", async () => {
    mockInvoke.mockResolvedValue(1);
    await providersApi.importHermesFromLive();
    expect(mockInvoke).toHaveBeenCalledWith("import_hermes_providers_from_live");
  });

  // universalProvidersApi
  describe("universalProvidersApi", () => {
    it("getAll 调用 get_universal_providers", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await universalProvidersApi.getAll();
      expect(mockInvoke).toHaveBeenCalledWith("get_universal_providers");
    });
    it("get 传 id", async () => {
      mockInvoke.mockResolvedValue(null);
      await universalProvidersApi.get("u1");
      expect(mockInvoke).toHaveBeenCalledWith("get_universal_provider", { id: "u1" });
    });
    it("upsert 传 provider", async () => {
      mockInvoke.mockResolvedValue(true);
      await universalProvidersApi.upsert({ id: "u1" } as any);
      expect(mockInvoke).toHaveBeenCalledWith("upsert_universal_provider", { provider: { id: "u1" } });
    });
    it("delete 传 id", async () => {
      mockInvoke.mockResolvedValue(true);
      await universalProvidersApi.delete("u1");
      expect(mockInvoke).toHaveBeenCalledWith("delete_universal_provider", { id: "u1" });
    });
    it("sync 传 id", async () => {
      mockInvoke.mockResolvedValue(true);
      await universalProvidersApi.sync("u1");
      expect(mockInvoke).toHaveBeenCalledWith("sync_universal_provider", { id: "u1" });
    });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("db busy"));
    await expect(providersApi.getAll("claude")).rejects.toThrow("db busy");
  });
});
