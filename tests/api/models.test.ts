import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// models.ts: CRUD 薄封装；addModel/deleteModel/updateModel 成功后派发
// 'models-changed' window 事件；testModel 默认 protocol='openai'。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import {
  getModels,
  addModel,
  deleteModel,
  updateModel,
  testModel,
  pingModel,
  isKeyDestroyed,
} from "@/api/models";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("models API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getModels 调用 get_models 无参", async () => {
    mockInvoke.mockResolvedValue([{ id: "m1" }]);
    await expect(getModels()).resolves.toEqual([{ id: "m1" }]);
    expect(mockInvoke).toHaveBeenCalledWith("get_models");
  });

  describe("addModel", () => {
    it("调用 add_model 传 input，并派发 models-changed 事件", async () => {
      const created = { internalId: "1", name: "n" } as any;
      mockInvoke.mockResolvedValue(created);
      const spy = vi.spyOn(window, "dispatchEvent");
      const input = { name: "n", baseUrl: "http://x", apiKey: "k" };
      await expect(addModel(input)).resolves.toBe(created);
      expect(mockInvoke).toHaveBeenCalledWith("add_model", { input });
      const evt = spy.mock.calls[0][0];
      expect(evt.type).toBe("models-changed");
    });

    it("invoke 抛错：不派发事件，错误透传", async () => {
      mockInvoke.mockRejectedValue(new Error("dup"));
      const spy = vi.spyOn(window, "dispatchEvent");
      await expect(addModel({} as any)).rejects.toThrow("dup");
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("deleteModel", () => {
    it("调用 delete_model 传 internalId，返回 boolean，派发事件", async () => {
      mockInvoke.mockResolvedValue(true);
      const spy = vi.spyOn(window, "dispatchEvent");
      await expect(deleteModel("1")).resolves.toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith("delete_model", { internalId: "1" });
      expect(spy.mock.calls[0][0].type).toBe("models-changed");
    });
  });

  describe("updateModel", () => {
    it("调用 update_model 传 internalId + updates，派发事件", async () => {
      const updated = { internalId: "1", name: "n2" } as any;
      mockInvoke.mockResolvedValue(updated);
      const spy = vi.spyOn(window, "dispatchEvent");
      const updates = { name: "n2" };
      await expect(updateModel("1", updates)).resolves.toBe(updated);
      expect(mockInvoke).toHaveBeenCalledWith("update_model", { internalId: "1", updates });
      expect(spy.mock.calls[0][0].type).toBe("models-changed");
    });

    it("返回 null 时仍派发事件", async () => {
      mockInvoke.mockResolvedValue(null);
      const spy = vi.spyOn(window, "dispatchEvent");
      await expect(updateModel("1", {})).resolves.toBeNull();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("testModel", () => {
    it("默认 protocol=openai", async () => {
      mockInvoke.mockResolvedValue({ ok: true });
      await testModel("1", "hi");
      expect(mockInvoke).toHaveBeenCalledWith("test_model", {
        internalId: "1",
        prompt: "hi",
        protocol: "openai",
      });
    });
    it("自定义 protocol 透传", async () => {
      mockInvoke.mockResolvedValue({ ok: true });
      await testModel("1", "hi", "anthropic");
      expect(mockInvoke).toHaveBeenCalledWith("test_model", {
        internalId: "1",
        prompt: "hi",
        protocol: "anthropic",
      });
    });
  });

  it("pingModel 传 internalId", async () => {
    mockInvoke.mockResolvedValue({ ok: true });
    await pingModel("1");
    expect(mockInvoke).toHaveBeenCalledWith("ping_model", { internalId: "1" });
  });

  it("isKeyDestroyed 传 internalId 返回 boolean", async () => {
    mockInvoke.mockResolvedValue(true);
    await expect(isKeyDestroyed("1")).resolves.toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("is_key_destroyed", { internalId: "1" });
  });
});
