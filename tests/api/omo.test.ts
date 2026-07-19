import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// omo.ts: omoApi / omoSlimApi 两组无参薄封装。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { omoApi, omoSlimApi } from "@/lib/api/omo";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("omo API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  describe("omoApi", () => {
    it("readLocalFile 调用 read_omo_local_file 无参", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await omoApi.readLocalFile();
      expect(mockInvoke).toHaveBeenCalledWith("read_omo_local_file");
    });
    it("getCurrentOmoProviderId 调用 get_current_omo_provider_id", async () => {
      mockInvoke.mockResolvedValue("pid");
      await expect(omoApi.getCurrentOmoProviderId()).resolves.toBe("pid");
      expect(mockInvoke).toHaveBeenCalledWith("get_current_omo_provider_id");
    });
    it("disableCurrentOmo 调用 disable_current_omo", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await omoApi.disableCurrentOmo();
      expect(mockInvoke).toHaveBeenCalledWith("disable_current_omo");
    });
  });

  describe("omoSlimApi", () => {
    it("readLocalFile 调用 read_omo_slim_local_file", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await omoSlimApi.readLocalFile();
      expect(mockInvoke).toHaveBeenCalledWith("read_omo_slim_local_file");
    });
    it("getCurrentProviderId 调用 get_current_omo_slim_provider_id", async () => {
      mockInvoke.mockResolvedValue("pid");
      await omoSlimApi.getCurrentProviderId();
      expect(mockInvoke).toHaveBeenCalledWith("get_current_omo_slim_provider_id");
    });
    it("disableCurrent 调用 disable_current_omo_slim", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await omoSlimApi.disableCurrent();
      expect(mockInvoke).toHaveBeenCalledWith("disable_current_omo_slim");
    });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("no omo"));
    await expect(omoApi.readLocalFile()).rejects.toThrow("no omo");
  });
});
