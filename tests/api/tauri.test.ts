import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// tauri.ts: 通用/杂项 API + shell。openExternal 动态 import shell 插件 open。
// startTool / launchGame 的可选参数默认 null。仅测本文件定义的函数，不测 re-export。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/plugin-shell", () => ({ open: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";
import {
  scanTools,
  applyModelToTool,
  restoreToolToOfficial,
  startTool,
  openExternal,
  openFolder,
  getSettings,
  saveSettings,
  appReady,
  readLogTail,
  launchGame,
} from "@/api/tauri";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;
const mockOpen = open as unknown as ReturnType<typeof vi.fn>;

describe("tauri misc API", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockOpen.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("scanTools 调用 scan_tools 无参", async () => {
    mockInvoke.mockResolvedValue([{ id: "t1" }]);
    await expect(scanTools()).resolves.toEqual([{ id: "t1" }]);
    expect(mockInvoke).toHaveBeenCalledWith("scan_tools");
  });

  it("applyModelToTool 传 toolId + modelInfo", async () => {
    mockInvoke.mockResolvedValue({ success: true, message: "ok" });
    await applyModelToTool("t1", { baseUrl: "http://x" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("apply_model_to_tool", {
      toolId: "t1",
      modelInfo: { baseUrl: "http://x" },
    });
  });

  it("restoreToolToOfficial 传 toolId", async () => {
    mockInvoke.mockResolvedValue({ success: true, message: "ok" });
    await restoreToolToOfficial("t1");
    expect(mockInvoke).toHaveBeenCalledWith("restore_tool_to_official", { toolId: "t1" });
  });

  describe("startTool", () => {
    it("有 startCommand：透传", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await startTool("t1", "run.sh");
      expect(mockInvoke).toHaveBeenCalledWith("start_tool", {
        toolId: "t1",
        startCommand: "run.sh",
      });
    });
    it("无 startCommand：传 null", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await startTool("t1");
      expect(mockInvoke).toHaveBeenCalledWith("start_tool", {
        toolId: "t1",
        startCommand: null,
      });
    });
  });

  it("openExternal 调用 shell open 传 url", async () => {
    mockOpen.mockResolvedValue(undefined);
    await openExternal("https://example.com");
    expect(mockOpen).toHaveBeenCalledWith("https://example.com");
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("openFolder 调用 open_folder 传 path", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await openFolder("/some/dir");
    expect(mockInvoke).toHaveBeenCalledWith("open_folder", { path: "/some/dir" });
  });

  it("getSettings 调用 get_settings 无参", async () => {
    mockInvoke.mockResolvedValue({ theme: "dark" } as any);
    await expect(getSettings()).resolves.toEqual({ theme: "dark" });
    expect(mockInvoke).toHaveBeenCalledWith("get_settings");
  });

  it("saveSettings 调用 save_settings 传 settings", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await saveSettings({ theme: "light" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("save_settings", {
      settings: { theme: "light" },
    });
  });

  it("appReady 调用 app_ready 无参", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await appReady();
    expect(mockInvoke).toHaveBeenCalledWith("app_ready");
  });

  it("readLogTail 调用 read_log_tail 传 lines", async () => {
    mockInvoke.mockResolvedValue("log line\nlog line2");
    await expect(readLogTail(50)).resolves.toBe("log line\nlog line2");
    expect(mockInvoke).toHaveBeenCalledWith("read_log_tail", { lines: 50 });
  });

  describe("launchGame", () => {
    it("有 modelConfig：透传", async () => {
      mockInvoke.mockResolvedValue({ success: true });
      await launchGame("t1", "/game.exe", { baseUrl: "http://x", model: "m" });
      expect(mockInvoke).toHaveBeenCalledWith("launch_game", {
        toolId: "t1",
        launchFile: "/game.exe",
        modelConfig: { baseUrl: "http://x", model: "m" },
      });
    });
    it("无 modelConfig：传 null", async () => {
      mockInvoke.mockResolvedValue({ success: true });
      await launchGame("t1", "/game.exe");
      expect(mockInvoke).toHaveBeenCalledWith("launch_game", {
        toolId: "t1",
        launchFile: "/game.exe",
        modelConfig: null,
      });
    });
    it("错误透传", async () => {
      mockInvoke.mockRejectedValue(new Error("missing file"));
      await expect(launchGame("t1", "/game.exe")).rejects.toThrow("missing file");
    });
  });
});
