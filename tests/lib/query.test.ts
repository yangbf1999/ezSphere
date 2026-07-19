import { describe, it, expect } from "vitest";
import { usageKeys } from "@/lib/query/usage";
import { subscriptionKeys } from "@/lib/query/subscription";
import { omoKeys, omoSlimKeys } from "@/lib/query/omo";

// queryKey 构造器：验证数组结构与 undefined -> 默认值的归一化逻辑。
// （queries.ts 的 isTransientUsageError / resolveDisplayUsage 已由
//   tests/lib/keepLastGoodUsage.test.ts 覆盖，此处不重复。）

describe("usageKeys", () => {
  it("all 是稳定前缀", () => {
    expect(usageKeys.all).toEqual(["usage"]);
  });

  describe("summary", () => {
    it("完整参数：原样展开到数组", () => {
      expect(
        usageKeys.summary("7d", 1000, 2000, {
          appType: "claude",
          providerName: "Acme",
          model: "gpt-4o",
        }, true),
      ).toEqual([
        "usage", "summary", "7d", 1000, 2000, true, "claude", "Acme", "gpt-4o",
      ]);
    });

    it("undefined 日期/filters/liveEndTime 归一化为 0/0/false/null", () => {
      expect(usageKeys.summary("today", undefined, undefined, undefined, undefined))
        .toEqual([
          "usage", "summary", "today", 0, 0, false, null, null, null,
        ]);
    });

    it("部分 filters：缺失维度归一化为 null", () => {
      expect(
        usageKeys.summary("30d", 1, 2, { providerName: "P" }),
      ).toEqual([
        "usage", "summary", "30d", 1, 2, false, null, "P", null,
      ]);
    });
  });

  it("summaryByApp 不含 appType 维度（仅 providerName/model）", () => {
    expect(
      usageKeys.summaryByApp("7d", 1000, 2000, { providerName: "P", model: "M" }, true),
    ).toEqual([
      "usage", "summary-by-app", "7d", 1000, 2000, true, "P", "M",
    ]);
  });

  it("trends / providerStats / modelStats 与 summary 同形但 token 不同", () => {
    const args = ["7d", 1, 2, { appType: "claude" }, true] as const;
    const sum = usageKeys.summary(...args);
    const tre = usageKeys.trends(...args);
    const prov = usageKeys.providerStats(...args);
    const mod = usageKeys.modelStats(...args);
    // 中段 token 不同
    expect(sum[1]).toBe("summary");
    expect(tre[1]).toBe("trends");
    expect(prov[1]).toBe("provider-stats");
    expect(mod[1]).toBe("model-stats");
    // 其余维度一致
    expect(tre.slice(2)).toEqual(sum.slice(2));
    expect(prov.slice(2)).toEqual(sum.slice(2));
    expect(mod.slice(2)).toEqual(sum.slice(2));
  });

  describe("logs", () => {
    it("完整 key：展开 preset/日期/布尔/字符串/page/pageSize", () => {
      const key = {
        preset: "custom" as const,
        customStartDate: 100,
        customEndDate: 200,
        liveEndTime: true,
        appType: "codex",
        providerName: "P",
        model: "M",
        statusCode: 500,
      };
      expect(usageKeys.logs(key, 3, 50)).toEqual([
        "usage", "logs", "custom", 100, 200, true, "codex", "P", "M", 500, 3, 50,
      ]);
    });

    it("key 字段缺失：日期->0, liveEndTime->false, 字符串->'', statusCode->-1", () => {
      const key = { preset: "today" as const };
      expect(usageKeys.logs(key, 0, 20)).toEqual([
        "usage", "logs", "today", 0, 0, false, "", "", "", -1, 0, 20,
      ]);
    });
  });

  it("detail 拼接 requestId", () => {
    expect(usageKeys.detail("req-1")).toEqual(["usage", "detail", "req-1"]);
  });

  it("pricing 是固定 key", () => {
    expect(usageKeys.pricing()).toEqual(["usage", "pricing"]);
  });

  it("limits 拼接 providerId/appType", () => {
    expect(usageKeys.limits("prov-1", "claude")).toEqual([
      "usage", "limits", "prov-1", "claude",
    ]);
  });

  it("script 拼接 providerId/appType（无中间 token）", () => {
    expect(usageKeys.script("prov-1", "codex")).toEqual([
      "usage", "prov-1", "codex",
    ]);
  });
});

describe("subscriptionKeys", () => {
  it("all 是稳定前缀", () => {
    expect(subscriptionKeys.all).toEqual(["subscription"]);
  });

  it("quota 拼接 appId", () => {
    expect(subscriptionKeys.quota("claude")).toEqual([
      "subscription", "quota", "claude",
    ]);
    expect(subscriptionKeys.quota("codex")).toEqual([
      "subscription", "quota", "codex",
    ]);
  });
});

describe("omoKeys / omoSlimKeys", () => {
  it("omoKeys.all / currentProviderId()", () => {
    expect(omoKeys.all).toEqual(["omo"]);
    expect(omoKeys.currentProviderId()).toEqual(["omo", "current-provider-id"]);
  });

  it("omoSlimKeys 用 omo-slim 前缀", () => {
    expect(omoSlimKeys.all).toEqual(["omo-slim"]);
    expect(omoSlimKeys.currentProviderId()).toEqual([
      "omo-slim", "current-provider-id",
    ]);
  });

  it("两套 keys 互不相同（前缀隔离）", () => {
    expect(omoKeys.all).not.toEqual(omoSlimKeys.all);
  });
});
