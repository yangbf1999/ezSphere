import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// env.ts: checkEnvConflicts/deleteEnvVars/restoreEnvBackup 薄封装；
// checkAllEnvConflicts 是纯编排：对 claude/codex/gemini 并发查询，
// 单个失败时 console.error 并回落空数组。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import {
  checkEnvConflicts,
  deleteEnvVars,
  restoreEnvBackup,
  checkAllEnvConflicts,
} from "@/lib/api/env";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("env API", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("checkEnvConflicts 调用 check_env_conflicts，把 appType 映射为 app", async () => {
    mockInvoke.mockResolvedValue([{ name: "ANTHROPIC_API_KEY", conflicts: [] }]);
    await checkEnvConflicts("claude");
    expect(mockInvoke).toHaveBeenCalledWith("check_env_conflicts", { app: "claude" });
  });

  it("deleteEnvVars 调用 delete_env_vars 传 conflicts", async () => {
    const conflicts = [{ name: "X" }] as any;
    mockInvoke.mockResolvedValue({ path: "/backup" } as any);
    await expect(deleteEnvVars(conflicts)).resolves.toEqual({ path: "/backup" });
    expect(mockInvoke).toHaveBeenCalledWith("delete_env_vars", { conflicts });
  });

  it("restoreEnvBackup 调用 restore_env_backup 传 backupPath", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await restoreEnvBackup("/b/file.json");
    expect(mockInvoke).toHaveBeenCalledWith("restore_env_backup", { backupPath: "/b/file.json" });
  });

  describe("checkAllEnvConflicts", () => {
    it("对三个 app 并发调用 checkEnvConflicts，返回分组结果", async () => {
      mockInvoke.mockImplementation(async (_cmd: string, args: any) => {
        return [{ name: `K_${args.app}` }];
      });
      const r = await checkAllEnvConflicts();
      expect(Object.keys(r).sort()).toEqual(["claude", "codex", "gemini"]);
      expect(r.claude).toEqual([{ name: "K_claude" }]);
      expect(mockInvoke).toHaveBeenCalledTimes(3);
    });

    it("单个 app 失败：该 app 回落空数组，不影响其他 app", async () => {
      mockInvoke.mockImplementation(async (_cmd: string, args: any) => {
        if (args.app === "codex") throw new Error("scan failed");
        return [{ name: args.app }];
      });
      const r = await checkAllEnvConflicts();
      expect(r.claude).toEqual([{ name: "claude" }]);
      expect(r.codex).toEqual([]);
      expect(r.gemini).toEqual([{ name: "gemini" }]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
