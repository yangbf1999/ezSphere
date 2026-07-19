import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ssh.ts: 连接测试 / 持久化。saveSSHServer 的 alias 默认 null。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import {
  sshTestConnection,
  loadSSHServers,
  saveSSHServer,
  removeSSHServerFromDisk,
} from "@/api/ssh";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("ssh API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  describe("sshTestConnection", () => {
    it("调用 ssh_test_connection 传全部连接参数", async () => {
      mockInvoke.mockResolvedValue({ success: true, message: "ok" });
      await expect(
        sshTestConnection("10.0.0.1", 22, "root", "pw"),
      ).resolves.toEqual({ success: true, message: "ok" });
      expect(mockInvoke).toHaveBeenCalledWith("ssh_test_connection", {
        host: "10.0.0.1",
        port: 22,
        username: "root",
        password: "pw",
      });
    });

    it("错误透传", async () => {
      mockInvoke.mockRejectedValue(new Error("refused"));
      await expect(sshTestConnection("h", 22, "u", "p")).rejects.toThrow("refused");
    });
  });

  it("loadSSHServers 调用 load_ssh_servers 无参", async () => {
    mockInvoke.mockResolvedValue([{ id: "1" }]);
    await expect(loadSSHServers()).resolves.toEqual([{ id: "1" }]);
    expect(mockInvoke).toHaveBeenCalledWith("load_ssh_servers");
  });

  describe("saveSSHServer", () => {
    it("有 alias：透传 alias", async () => {
      mockInvoke.mockResolvedValue({ id: "1" });
      await saveSSHServer("1", "h", 22, "u", "pw", "my-server");
      expect(mockInvoke).toHaveBeenCalledWith("save_ssh_server", {
        id: "1",
        host: "h",
        port: 22,
        username: "u",
        password: "pw",
        alias: "my-server",
      });
    });
    it("无 alias：alias 为 null", async () => {
      mockInvoke.mockResolvedValue({ id: "1" });
      await saveSSHServer("1", "h", 22, "u", "pw");
      expect(mockInvoke).toHaveBeenCalledWith("save_ssh_server", {
        id: "1",
        host: "h",
        port: 22,
        username: "u",
        password: "pw",
        alias: null,
      });
    });
  });

  it("removeSSHServerFromDisk 调用 remove_ssh_server 传 id", async () => {
    mockInvoke.mockResolvedValue(true);
    await expect(removeSSHServerFromDisk("1")).resolves.toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("remove_ssh_server", { id: "1" });
  });
});
