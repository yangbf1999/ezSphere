import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// mcp.ts: 统一 + 旧版 API。upsertServerInConfig/deleteServerInConfig 的
// syncOtherSide 仅在显式传入时加入 payload（纯逻辑）。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { mcpApi } from "@/lib/api/mcp";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("mcp API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getStatus 调用 get_claude_mcp_status", async () => {
    mockInvoke.mockResolvedValue({ running: true } as any);
    await mcpApi.getStatus();
    expect(mockInvoke).toHaveBeenCalledWith("get_claude_mcp_status");
  });

  it("readConfig 调用 read_claude_mcp_config", async () => {
    mockInvoke.mockResolvedValue(null);
    await mcpApi.readConfig();
    expect(mockInvoke).toHaveBeenCalledWith("read_claude_mcp_config");
  });

  it("upsertServer 传 id + spec", async () => {
    mockInvoke.mockResolvedValue(true);
    await mcpApi.upsertServer("srv1", { command: "npx" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("upsert_claude_mcp_server", {
      id: "srv1",
      spec: { command: "npx" },
    });
  });

  it("deleteServer 传 id", async () => {
    mockInvoke.mockResolvedValue(true);
    await mcpApi.deleteServer("srv1");
    expect(mockInvoke).toHaveBeenCalledWith("delete_claude_mcp_server", { id: "srv1" });
  });

  it("validateCommand 传 cmd", async () => {
    mockInvoke.mockResolvedValue(true);
    await mcpApi.validateCommand("npx -y");
    expect(mockInvoke).toHaveBeenCalledWith("validate_mcp_command", { cmd: "npx -y" });
  });

  it("getConfig 默认 app=claude", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await mcpApi.getConfig();
    expect(mockInvoke).toHaveBeenCalledWith("get_mcp_config", { app: "claude" });
  });

  describe("upsertServerInConfig (syncOtherSide 纯逻辑)", () => {
    it("未传 options：payload 不含 syncOtherSide", async () => {
      mockInvoke.mockResolvedValue(true);
      await mcpApi.upsertServerInConfig("claude", "srv1", { command: "npx" } as any);
      expect(mockInvoke).toHaveBeenCalledWith("upsert_mcp_server_in_config", {
        app: "claude",
        id: "srv1",
        spec: { command: "npx" },
      });
    });
    it("传 syncOtherSide=false：payload 含 syncOtherSide:false", async () => {
      mockInvoke.mockResolvedValue(true);
      await mcpApi.upsertServerInConfig("codex", "srv1", { command: "npx" } as any, {
        syncOtherSide: false,
      });
      expect(mockInvoke).toHaveBeenCalledWith("upsert_mcp_server_in_config", {
        app: "codex",
        id: "srv1",
        spec: { command: "npx" },
        syncOtherSide: false,
      });
    });
    it("传 syncOtherSide=true：payload 含 syncOtherSide:true", async () => {
      mockInvoke.mockResolvedValue(true);
      await mcpApi.upsertServerInConfig("codex", "srv1", {} as any, { syncOtherSide: true });
      expect(mockInvoke).toHaveBeenCalledWith("upsert_mcp_server_in_config", {
        app: "codex",
        id: "srv1",
        spec: {},
        syncOtherSide: true,
      });
    });
  });

  describe("deleteServerInConfig (syncOtherSide 纯逻辑)", () => {
    it("未传 options：payload 不含 syncOtherSide", async () => {
      mockInvoke.mockResolvedValue(true);
      await mcpApi.deleteServerInConfig("claude", "srv1");
      expect(mockInvoke).toHaveBeenCalledWith("delete_mcp_server_in_config", {
        app: "claude",
        id: "srv1",
      });
    });
    it("传 syncOtherSide=true：payload 含", async () => {
      mockInvoke.mockResolvedValue(true);
      await mcpApi.deleteServerInConfig("gemini", "srv1", { syncOtherSide: true });
      expect(mockInvoke).toHaveBeenCalledWith("delete_mcp_server_in_config", {
        app: "gemini",
        id: "srv1",
        syncOtherSide: true,
      });
    });
  });

  it("setEnabled 传 app + id + enabled", async () => {
    mockInvoke.mockResolvedValue(true);
    await mcpApi.setEnabled("claude", "srv1", false);
    expect(mockInvoke).toHaveBeenCalledWith("set_mcp_enabled", {
      app: "claude",
      id: "srv1",
      enabled: false,
    });
  });

  // 统一 API
  it("getAllServers 调用 get_mcp_servers", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await mcpApi.getAllServers();
    expect(mockInvoke).toHaveBeenCalledWith("get_mcp_servers");
  });

  it("upsertUnifiedServer 传 server", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await mcpApi.upsertUnifiedServer({ id: "s" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("upsert_mcp_server", { server: { id: "s" } });
  });

  it("deleteUnifiedServer 传 id", async () => {
    mockInvoke.mockResolvedValue(true);
    await mcpApi.deleteUnifiedServer("s");
    expect(mockInvoke).toHaveBeenCalledWith("delete_mcp_server", { id: "s" });
  });

  it("toggleApp 传 serverId + app + enabled", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await mcpApi.toggleApp("s", "claude", true);
    expect(mockInvoke).toHaveBeenCalledWith("toggle_mcp_app", {
      serverId: "s",
      app: "claude",
      enabled: true,
    });
  });

  it("importFromApps 调用 import_mcp_from_apps 返回 number", async () => {
    mockInvoke.mockResolvedValue(3);
    await expect(mcpApi.importFromApps()).resolves.toBe(3);
    expect(mockInvoke).toHaveBeenCalledWith("import_mcp_from_apps");
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("config locked"));
    await expect(mcpApi.upsertUnifiedServer({} as any)).rejects.toThrow("config locked");
  });
});
