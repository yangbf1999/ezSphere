import { afterEach, describe, expect, it, vi } from "vitest";

// platform.ts 的 isMac/isWindows/isLinux 读取 navigator.userAgent / navigator.platform，
// 并在访问异常时安全回落到 false。DRAG_REGION_* 常量在模块加载时按 isLinux() 派生。

const stubNavigator = (userAgent: string, platform = "") => {
  Object.defineProperty(navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  });
  Object.defineProperty(navigator, "platform", {
    value: platform,
    configurable: true,
  });
};

const loadPlatform = async () => {
  vi.resetModules();
  return await import("@/lib/platform");
};

describe("platform detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  describe("isMac", () => {
    it("Mac UA -> true", async () => {
      stubNavigator(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        "MacIntel",
      );
      const { isMac } = await loadPlatform();
      expect(isMac()).toBe(true);
    });

    it("仅 platform 含 mac（UA 不含）-> true", async () => {
      stubNavigator("Mozilla/5.0 (X11; Linux x86_64)", "MacIntel");
      const { isMac } = await loadPlatform();
      expect(isMac()).toBe(true);
    });

    it("Windows UA -> false", async () => {
      stubNavigator(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Win32",
      );
      const { isMac } = await loadPlatform();
      expect(isMac()).toBe(false);
    });
  });

  describe("isWindows", () => {
    it("Windows NT UA -> true", async () => {
      stubNavigator(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      );
      const { isWindows } = await loadPlatform();
      expect(isWindows()).toBe(true);
    });

    it("win32 platform token -> true", async () => {
      stubNavigator("Mozilla/5.0 (win32; custom)", "");
      const { isWindows } = await loadPlatform();
      expect(isWindows()).toBe(true);
    });

    it("Mac UA -> false", async () => {
      stubNavigator("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "MacIntel");
      const { isWindows } = await loadPlatform();
      expect(isWindows()).toBe(false);
    });
  });

  describe("isLinux", () => {
    it("Linux UA -> true（排除 mac/windows/android）", async () => {
      stubNavigator(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15",
        "Linux x86_64",
      );
      const { isLinux } = await loadPlatform();
      expect(isLinux()).toBe(true);
    });

    it("Android UA 含 Linux 但被排除 -> false", async () => {
      stubNavigator(
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36",
      );
      const { isLinux } = await loadPlatform();
      expect(isLinux()).toBe(false);
    });

    it("Mac UA 含 X11 但 isMac 命中 -> false", async () => {
      // isMac 优先：UA 含 "Mac" -> isLinux 返回 false
      stubNavigator("Mozilla/5.0 (Macintosh; X11; Mac OS X)", "MacIntel");
      const { isLinux } = await loadPlatform();
      expect(isLinux()).toBe(false);
    });

    it("Windows UA -> false", async () => {
      stubNavigator("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
      const { isLinux } = await loadPlatform();
      expect(isLinux()).toBe(false);
    });
  });

  describe("DRAG_REGION derived constants", () => {
    it("非 Linux 环境：DRAG_REGION_ATTR 含 data-tauri-drag-region，style 含 WebkitAppRegion", async () => {
      stubNavigator("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Win32");
      const {
        DRAG_REGION_ENABLED,
        DRAG_REGION_ATTR,
        DRAG_REGION_STYLE,
      } = await loadPlatform();
      expect(DRAG_REGION_ENABLED).toBe(true);
      expect(DRAG_REGION_ATTR).toHaveProperty("data-tauri-drag-region", true);
      expect(DRAG_REGION_STYLE).toHaveProperty("WebkitAppRegion", "drag");
    });

    it("Linux 环境：禁用拖拽，ATTR/STYLE 均为空对象", async () => {
      stubNavigator(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15",
        "Linux x86_64",
      );
      const {
        DRAG_REGION_ENABLED,
        DRAG_REGION_ATTR,
        DRAG_REGION_STYLE,
      } = await loadPlatform();
      expect(DRAG_REGION_ENABLED).toBe(false);
      expect(DRAG_REGION_ATTR).toEqual({});
      expect(DRAG_REGION_STYLE).toEqual({});
    });
  });
});
