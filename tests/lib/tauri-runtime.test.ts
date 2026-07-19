import { afterEach, describe, expect, it } from "vitest";
import { isTauriRuntime } from "@/lib/tauri-runtime";

// isTauriRuntime: typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__)
// setupGlobals 默认把 window.__TAURI_INTERNALS__ 设为 true。

describe("isTauriRuntime", () => {
  afterEach(() => {
    // 恢复 setupGlobals 的默认状态
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: true,
      configurable: true,
    });
  });

  it("默认（setupGlobals 注入 __TAURI_INTERNALS__）-> true", () => {
    expect(isTauriRuntime()).toBe(true);
  });

  it("__TAURI_INTERNALS__ 为 undefined -> false", () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: undefined,
      configurable: true,
    });
    expect(isTauriRuntime()).toBe(false);
  });

  it("__TAURI_INTERNALS__ 为 falsy（0）-> false", () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: 0,
      configurable: true,
    });
    expect(isTauriRuntime()).toBe(false);
  });

  it("__TAURI_INTERNALS__ 为对象 -> true", () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: { invoke: () => {} },
      configurable: true,
    });
    expect(isTauriRuntime()).toBe(true);
  });
});
