import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// sessions.ts: list/getMessages/delete/deleteMany/launchTerminal。
// delete 与 launchTerminal 从 options 解构后展平为参数（纯逻辑）。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { sessionsApi } from "@/lib/api/sessions";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("sessions API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("list 调用 list_sessions 无参", async () => {
    mockInvoke.mockResolvedValue([]);
    await sessionsApi.list();
    expect(mockInvoke).toHaveBeenCalledWith("list_sessions");
  });

  it("getMessages 传 providerId + sourcePath", async () => {
    mockInvoke.mockResolvedValue([]);
    await sessionsApi.getMessages("p1", "/path/to/session.jsonl");
    expect(mockInvoke).toHaveBeenCalledWith("get_session_messages", {
      providerId: "p1",
      sourcePath: "/path/to/session.jsonl",
    });
  });

  describe("delete", () => {
    it("从 options 解构并展平为 providerId/sessionId/sourcePath", async () => {
      mockInvoke.mockResolvedValue(true);
      await sessionsApi.delete({
        providerId: "p1",
        sessionId: "s1",
        sourcePath: "/a/b.jsonl",
      });
      expect(mockInvoke).toHaveBeenCalledWith("delete_session", {
        providerId: "p1",
        sessionId: "s1",
        sourcePath: "/a/b.jsonl",
      });
    });
    it("返回 false 透传", async () => {
      mockInvoke.mockResolvedValue(false);
      await expect(
        sessionsApi.delete({ providerId: "p1", sessionId: "s1", sourcePath: "/x" }),
      ).resolves.toBe(false);
    });
  });

  it("deleteMany 传 items 数组", async () => {
    mockInvoke.mockResolvedValue([
      { providerId: "p1", sessionId: "s1", sourcePath: "/a", success: true },
    ]);
    await sessionsApi.deleteMany([
      { providerId: "p1", sessionId: "s1", sourcePath: "/a" },
    ]);
    expect(mockInvoke).toHaveBeenCalledWith("delete_sessions", {
      items: [{ providerId: "p1", sessionId: "s1", sourcePath: "/a" }],
    });
  });

  describe("launchTerminal", () => {
    it("从 options 解构 command/cwd/customConfig 并展平", async () => {
      mockInvoke.mockResolvedValue(true);
      await sessionsApi.launchTerminal({
        command: "claude",
        cwd: "/proj",
        customConfig: null,
      });
      expect(mockInvoke).toHaveBeenCalledWith("launch_session_terminal", {
        command: "claude",
        cwd: "/proj",
        customConfig: null,
      });
    });
    it("cwd/customConfig 缺省为 undefined 时也透传字段", async () => {
      mockInvoke.mockResolvedValue(true);
      await sessionsApi.launchTerminal({ command: "codex" });
      expect(mockInvoke).toHaveBeenCalledWith("launch_session_terminal", {
        command: "codex",
        cwd: undefined,
        customConfig: undefined,
      });
    });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("not found"));
    await expect(sessionsApi.getMessages("p1", "/x")).rejects.toThrow("not found");
  });
});
