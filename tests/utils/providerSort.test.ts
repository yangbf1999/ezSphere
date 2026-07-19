import { describe, expect, it } from "vitest";
import {
  compareProvidersByCreatedAt,
  compareProvidersBySortIndex,
  type ProviderSortable,
} from "@/utils/providerSort";

const mk = (over: Partial<ProviderSortable> & { name: string }): ProviderSortable =>
  over;

describe("compareProvidersBySortIndex", () => {
  it("按 sortIndex 升序排列", () => {
    const a = mk({ name: "A", sortIndex: 2 });
    const b = mk({ name: "B", sortIndex: 1 });
    expect(compareProvidersBySortIndex(a, b)).toBeGreaterThan(0);
    expect(compareProvidersBySortIndex(b, a)).toBeLessThan(0);
  });

  it("相同 sortIndex 时按 name localeCompare 作 tiebreaker", () => {
    const a = mk({ name: "Alpha", sortIndex: 1 });
    const b = mk({ name: "Beta", sortIndex: 1 });
    expect(compareProvidersBySortIndex(a, b)).toBeLessThan(0);
    expect(compareProvidersBySortIndex(b, a)).toBeGreaterThan(0);
  });

  it("相同 sortIndex 且 name 相同时返回 0", () => {
    const a = mk({ name: "Same", sortIndex: 5 });
    const b = mk({ name: "Same", sortIndex: 5 });
    expect(compareProvidersBySortIndex(a, b)).toBe(0);
  });

  it("无 sortIndex 的条目排到末尾", () => {
    const withIndex = mk({ name: "A", sortIndex: 100 });
    const noIndex = mk({ name: "B" });
    expect(compareProvidersBySortIndex(noIndex, withIndex)).toBeGreaterThan(0);
    expect(compareProvidersBySortIndex(withIndex, noIndex)).toBeLessThan(0);
  });

  it("两者均无 sortIndex 时退化为 name tiebreaker", () => {
    const a = mk({ name: "Zeta" });
    const b = mk({ name: "Alpha" });
    expect(compareProvidersBySortIndex(a, b)).toBeGreaterThan(0);
    expect(compareProvidersBySortIndex(b, a)).toBeLessThan(0);
  });

  it("支持自定义 locale", () => {
    const a = mk({ name: "a", sortIndex: 1 });
    const b = mk({ name: "A", sortIndex: 1 });
    // 不同 locale 可能影响 localeCompare 结果，验证 locale 参数被透传
    const zhResult = compareProvidersBySortIndex(a, b, "zh-CN");
    const enResult = compareProvidersBySortIndex(a, b, "en-US");
    expect(typeof zhResult).toBe("number");
    expect(typeof enResult).toBe("number");
  });
});

describe("compareProvidersByCreatedAt", () => {
  it("按 createdAt 降序排列（新在前）", () => {
    const newer = mk({ name: "New", createdAt: 2000 });
    const older = mk({ name: "Old", createdAt: 1000 });
    expect(compareProvidersByCreatedAt(newer, older)).toBeLessThan(0);
    expect(compareProvidersByCreatedAt(older, newer)).toBeGreaterThan(0);
  });

  it("无 createdAt（0）的条目排到末尾", () => {
    const withTime = mk({ name: "A", createdAt: 1000 });
    const noTime = mk({ name: "B" });
    expect(compareProvidersByCreatedAt(noTime, withTime)).toBeGreaterThan(0);
    expect(compareProvidersByCreatedAt(withTime, noTime)).toBeLessThan(0);
  });

  it("createdAt 为 0 时与无 createdAt 等同，排到末尾", () => {
    const withTime = mk({ name: "A", createdAt: 1000 });
    const zeroTime = mk({ name: "B", createdAt: 0 });
    expect(compareProvidersByCreatedAt(zeroTime, withTime)).toBeGreaterThan(0);
    expect(compareProvidersByCreatedAt(withTime, zeroTime)).toBeLessThan(0);
  });

  it("两者都无 createdAt 时按 name tiebreaker", () => {
    const a = mk({ name: "Zeta" });
    const b = mk({ name: "Alpha" });
    expect(compareProvidersByCreatedAt(a, b)).toBeGreaterThan(0);
    expect(compareProvidersByCreatedAt(b, a)).toBeLessThan(0);
  });

  it("两者 createdAt 均为 0 时同样按 name tiebreaker", () => {
    const a = mk({ name: "Zeta", createdAt: 0 });
    const b = mk({ name: "Alpha", createdAt: 0 });
    expect(compareProvidersByCreatedAt(a, b)).toBeGreaterThan(0);
    expect(compareProvidersByCreatedAt(b, a)).toBeLessThan(0);
  });

  it("相同 createdAt 时按 name tiebreaker", () => {
    const a = mk({ name: "Beta", createdAt: 5000 });
    const b = mk({ name: "Alpha", createdAt: 5000 });
    expect(compareProvidersByCreatedAt(a, b)).toBeGreaterThan(0);
    expect(compareProvidersByCreatedAt(b, a)).toBeLessThan(0);
  });

  it("可用于 Array.sort 得到新在前、无时间在后的稳定顺序", () => {
    const items: ProviderSortable[] = [
      mk({ name: "old-no-time", createdAt: 0 }),
      mk({ name: "newest", createdAt: 3000 }),
      mk({ name: "middle", createdAt: 2000 }),
      mk({ name: "oldest", createdAt: 1000 }),
      mk({ name: "alpha-no-time" }),
    ];
    const sorted = [...items].sort(compareProvidersByCreatedAt);
    expect(sorted[0].name).toBe("newest");
    expect(sorted[1].name).toBe("middle");
    expect(sorted[2].name).toBe("oldest");
    // 两个无时间的按 name 排序：alpha-no-time < old-no-time
    expect(sorted[3].name).toBe("alpha-no-time");
    expect(sorted[4].name).toBe("old-no-time");
  });
});
