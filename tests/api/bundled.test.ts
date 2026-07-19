import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// bundled.ts: getMotherHints / getInstallIndex 在非 Tauri 运行时返回内嵌
// FALLBACK 字符串；Tauri 运行时调用对应 invoke command。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@/lib/tauri-runtime", () => ({ isTauriRuntime: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "@/lib/tauri-runtime";
import { getMotherHints, getInstallIndex } from "@/api/bundled";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;
const mockIsTauri = isTauriRuntime as unknown as ReturnType<typeof vi.fn>;

describe("bundled API", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockIsTauri.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  describe("getMotherHints", () => {
    it("非 Tauri：返回 FALLBACK，包含 install/showSpecs 等 action", async () => {
      mockIsTauri.mockReturnValue(false);
      const r = await getMotherHints();
      const parsed = JSON.parse(r);
      expect(parsed.hints).toBeInstanceOf(Array);
      expect(parsed.hints.length).toBeGreaterThan(0);
      const actions = parsed.hints.map((h: any) => h.action);
      expect(actions).toContain("install");
      expect(actions).toContain("showSpecs");
      expect(actions).toContain("networkInfo");
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("Tauri：调用 deployment_get_mother_hints 并透传", async () => {
      mockIsTauri.mockReturnValue(true);
      mockInvoke.mockResolvedValue('{"hints":[]}');
      const r = await getMotherHints();
      expect(r).toBe('{"hints":[]}');
      expect(mockInvoke).toHaveBeenCalledWith("deployment_get_mother_hints");
    });
  });

  describe("getInstallIndex", () => {
    it("非 Tauri：返回 FALLBACK，ids 含 claudecode / vscode 等", async () => {
      mockIsTauri.mockReturnValue(false);
      const r = await getInstallIndex();
      const parsed = JSON.parse(r);
      expect(parsed.ids).toBeInstanceOf(Array);
      expect(parsed.ids).toContain("claudecode");
      expect(parsed.ids).toContain("vscode");
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it("Tauri：调用 deployment_get_install_index", async () => {
      mockIsTauri.mockReturnValue(true);
      mockInvoke.mockResolvedValue('{"ids":[]}');
      const r = await getInstallIndex();
      expect(r).toBe('{"ids":[]}');
      expect(mockInvoke).toHaveBeenCalledWith("deployment_get_install_index");
    });

    it("invoke 抛错时透传", async () => {
      mockIsTauri.mockReturnValue(true);
      mockInvoke.mockRejectedValue(new Error("no embedded asset"));
      await expect(getInstallIndex()).rejects.toThrow("no embedded asset");
    });
  });
});
