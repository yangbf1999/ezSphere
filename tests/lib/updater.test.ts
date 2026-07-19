import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// getCurrentVersion: getVersion 成功返回版本号，失败回落 ""。
// checkForUpdate: 动态 import updater 插件，check 抛错/返回空 -> up-to-date；
// 返回 update 对象 -> available + UpdateInfo。

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: vi.fn(),
}));

import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import {
  getCurrentVersion,
  checkForUpdate,
} from "@/lib/updater";

const mockGetVersion = getVersion as unknown as ReturnType<typeof vi.fn>;
const mockCheck = check as unknown as ReturnType<typeof vi.fn>;

describe("getCurrentVersion", () => {
  beforeEach(() => mockGetVersion.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getVersion 成功：返回版本号", async () => {
    mockGetVersion.mockResolvedValue("3.8.0");
    await expect(getCurrentVersion()).resolves.toBe("3.8.0");
  });

  it("getVersion 抛错：回落空字符串", async () => {
    mockGetVersion.mockRejectedValue(new Error("app api unavailable"));
    await expect(getCurrentVersion()).resolves.toBe("");
  });
});

describe("checkForUpdate", () => {
  beforeEach(() => {
    mockGetVersion.mockReset();
    mockCheck.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("check 抛错：视为 up-to-date（不打扰用户），并 warn", async () => {
    mockGetVersion.mockResolvedValue("1.0.0");
    mockCheck.mockRejectedValue(new Error("endpoint not configured"));

    const r = await checkForUpdate();
    expect(r).toEqual({ status: "up-to-date" });
    expect(console.warn).toHaveBeenCalled();
  });

  it("check 返回 null：up-to-date", async () => {
    mockGetVersion.mockResolvedValue("1.0.0");
    mockCheck.mockResolvedValue(null);

    const r = await checkForUpdate();
    expect(r).toEqual({ status: "up-to-date" });
  });

  it("check 返回 falsy（undefined）：up-to-date", async () => {
    mockGetVersion.mockResolvedValue("1.0.0");
    mockCheck.mockResolvedValue(undefined);

    const r = await checkForUpdate();
    expect(r).toEqual({ status: "up-to-date" });
  });

  it("check 返回 update 对象：available + 完整 UpdateInfo", async () => {
    mockGetVersion.mockResolvedValue("2.0.0");
    mockCheck.mockResolvedValue({
      version: "2.1.0",
      notes: "bug fixes",
      date: "2026-07-01",
    });

    const r = await checkForUpdate();
    expect(r).toEqual({
      status: "available",
      info: {
        currentVersion: "2.0.0",
        availableVersion: "2.1.0",
        notes: "bug fixes",
        pubDate: "2026-07-01",
      },
    });
  });

  it("check 返回 update 但字段缺失：availableVersion 回落空串", async () => {
    mockGetVersion.mockResolvedValue("2.0.0");
    mockCheck.mockResolvedValue({});

    const r = await checkForUpdate();
    expect(r.status).toBe("available");
    if (r.status === "available") {
      expect(r.info.availableVersion).toBe("");
      expect(r.info.notes).toBeUndefined();
      expect(r.info.pubDate).toBeUndefined();
    }
  });

  it("默认 timeout=30000 传给 check", async () => {
    mockGetVersion.mockResolvedValue("1.0.0");
    mockCheck.mockResolvedValue(null);

    await checkForUpdate();
    expect(mockCheck).toHaveBeenCalledWith({ timeout: 30000 });
  });

  it("自定义 timeout 透传给 check", async () => {
    mockGetVersion.mockResolvedValue("1.0.0");
    mockCheck.mockResolvedValue(null);

    await checkForUpdate({ timeout: 5000 });
    expect(mockCheck).toHaveBeenCalledWith({ timeout: 5000 });
  });
});
