import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// copyText 优先走 Tauri invoke；失败后回落 navigator.clipboard.writeText；
// 两者都失败时按 Error 实例优先的规则抛出。

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { copyText } from "@/lib/clipboard";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

const stubClipboard = (writeText: ReturnType<typeof vi.fn>) => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
};

describe("copyText", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("invoke 成功：直接返回，不触发 web 剪贴板", async () => {
    mockInvoke.mockResolvedValue(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await copyText("hello");
    expect(mockInvoke).toHaveBeenCalledWith("copy_text_to_clipboard", {
      text: "hello",
    });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("invoke 失败 + web 剪贴板成功：回落成功", async () => {
    mockInvoke.mockRejectedValue(new Error("native unavailable"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await expect(copyText("hello")).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("invoke 失败 + web 剪贴板抛 Error：抛出该 web Error", async () => {
    mockInvoke.mockRejectedValue(new Error("native unavailable"));
    const webErr = new Error("clipboard blocked");
    const writeText = vi.fn().mockRejectedValue(webErr);
    stubClipboard(writeText);

    await expect(copyText("hello")).rejects.toBe(webErr);
  });

  it("invoke 抛 Error + web 抛非 Error：抛 invoke 的 Error", async () => {
    const nativeErr = new Error("native boom");
    mockInvoke.mockRejectedValue(nativeErr);
    const writeText = vi.fn().mockRejectedValue("web string error");
    stubClipboard(writeText);

    await expect(copyText("hello")).rejects.toBe(nativeErr);
  });

  it("invoke 抛非 Error + web 抛非 Error：抛 new Error(String(...))", async () => {
    mockInvoke.mockRejectedValue("native string");
    const writeText = vi.fn().mockRejectedValue("web string");
    stubClipboard(writeText);

    await expect(copyText("hello")).rejects.toThrow("web string");
  });

  it("invoke 抛非 Error + web 抛 falsy：回退到 native 字符串", async () => {
    mockInvoke.mockRejectedValue("native string");
    const writeText = vi.fn().mockRejectedValue(null);
    stubClipboard(writeText);

    // webError || nativeError -> null || "native string" -> "native string"
    await expect(copyText("hello")).rejects.toThrow("native string");
  });
});
