import { describe, it, expect } from "vitest";
import {
  resolveUsageRange,
  getUsageRangePresetLabel,
} from "@/lib/usageRange";
import type { UsageRangePreset, UsageRangeSelection } from "@/types/usage";

const DAY_SECONDS = 24 * 60 * 60;
const DAY_MS = DAY_SECONDS * 1000;

// Fixed reference timestamp: June 15, 2026 12:30:00 local time
const nowMs = new Date(2026, 5, 15, 12, 30, 0).getTime();

/** Start of the local day for the given timestamp, in epoch seconds. */
function startOfDaySeconds(ms: number): number {
  const d = new Date(ms);
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000);
}

describe("resolveUsageRange", () => {
  it("resolves 'today' to start of local day → now", () => {
    const result = resolveUsageRange({ preset: "today" }, nowMs);
    expect(result.startDate).toBe(startOfDaySeconds(nowMs));
    expect(result.endDate).toBe(Math.floor(nowMs / 1000));
  });

  it("resolves '1d' to now-86400 → now (rolling 24h window)", () => {
    const result = resolveUsageRange({ preset: "1d" }, nowMs);
    const endSec = Math.floor(nowMs / 1000);
    expect(result.startDate).toBe(endSec - DAY_SECONDS);
    expect(result.endDate).toBe(endSec);
  });

  it("resolves '7d' to start of local day 6 days ago → now", () => {
    const result = resolveUsageRange({ preset: "7d" }, nowMs);
    expect(result.startDate).toBe(startOfDaySeconds(nowMs - 6 * DAY_MS));
    expect(result.endDate).toBe(Math.floor(nowMs / 1000));
  });

  it("resolves '14d' to start of local day 13 days ago → now", () => {
    const result = resolveUsageRange({ preset: "14d" }, nowMs);
    expect(result.startDate).toBe(startOfDaySeconds(nowMs - 13 * DAY_MS));
    expect(result.endDate).toBe(Math.floor(nowMs / 1000));
  });

  it("resolves '30d' to start of local day 29 days ago → now", () => {
    const result = resolveUsageRange({ preset: "30d" }, nowMs);
    expect(result.startDate).toBe(startOfDaySeconds(nowMs - 29 * DAY_MS));
    expect(result.endDate).toBe(Math.floor(nowMs / 1000));
  });

  it("resolves 'custom' with explicit start and end dates", () => {
    const selection: UsageRangeSelection = {
      preset: "custom",
      customStartDate: 1_000_000,
      customEndDate: 2_000_000,
      liveEndTime: false,
    };
    const result = resolveUsageRange(selection, nowMs);
    expect(result.startDate).toBe(1_000_000);
    expect(result.endDate).toBe(2_000_000);
  });

  it("resolves 'custom' with liveEndTime to use now as end", () => {
    const selection: UsageRangeSelection = {
      preset: "custom",
      customStartDate: 1_000_000,
      customEndDate: 2_000_000,
      liveEndTime: true,
    };
    const result = resolveUsageRange(selection, nowMs);
    expect(result.startDate).toBe(1_000_000);
    expect(result.endDate).toBe(Math.floor(nowMs / 1000));
  });

  it("defaults custom start/end when dates are missing", () => {
    const selection: UsageRangeSelection = { preset: "custom" };
    const result = resolveUsageRange(selection, nowMs);
    const endSec = Math.floor(nowMs / 1000);
    expect(result.startDate).toBe(endSec - DAY_SECONDS);
    expect(result.endDate).toBe(endSec);
  });

  it("uses default end (now) when customEndDate is missing and liveEndTime is false", () => {
    const selection: UsageRangeSelection = {
      preset: "custom",
      customStartDate: 500_000,
    };
    const result = resolveUsageRange(selection, nowMs);
    expect(result.startDate).toBe(500_000);
    expect(result.endDate).toBe(Math.floor(nowMs / 1000));
  });
});

describe("getUsageRangePresetLabel", () => {
  // Mock t: returns the key, or defaultValue if provided
  const t = (key: string, options?: { defaultValue?: string }) =>
    options?.defaultValue ?? key;

  it("returns label for each preset", () => {
    const cases: Array<{ preset: UsageRangePreset; expected: string }> = [
      { preset: "today", expected: "当天" },
      { preset: "1d", expected: "1d" },
      { preset: "7d", expected: "7d" },
      { preset: "14d", expected: "14d" },
      { preset: "30d", expected: "30d" },
      { preset: "custom", expected: "日历筛选" },
    ];

    for (const { preset, expected } of cases) {
      expect(getUsageRangePresetLabel(preset, t)).toBe(expected);
    }
  });
});
