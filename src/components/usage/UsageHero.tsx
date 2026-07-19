import { cloneElement, isValidElement } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useUsageSummaryByApp } from "@/lib/query/usage";
import { cn } from "@/lib/utils";
import { APP_ICON_MAP } from "@/config/appConfig";
import type { AppId } from "@/lib/api/types";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Database,
  Info,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  fmtUsd,
  formatTokensShort,
  getResolvedLang,
  parseFiniteNumber,
} from "./format";
import {
  CACHE_INCLUSIVE_APP_TYPES,
  type AppType,
  type UsageRangeSelection,
  type UsageSummary,
  type UsageSummaryByApp,
} from "@/types/usage";

interface UsageHeroProps {
  range: UsageRangeSelection;
  appType?: string;
  providerName?: string;
  model?: string;
  refreshIntervalMs: number;
}

interface TitleTheme {
  accent: string;
  glyphStroke: string;
}

const TITLE_THEMES: Record<AppType | "all", TitleTheme> = {
  all: {
    accent: "text-[var(--shell-accent)]",
    glyphStroke: "var(--shell-accent)",
  },
  claude: {
    accent: "text-[var(--app-claude)]",
    glyphStroke: "var(--shell-accent)",
  },
  codex: {
    accent: "text-[var(--app-codex)]",
    glyphStroke: "var(--shell-accent)",
  },
  gemini: {
    accent: "text-[var(--app-gemini)]",
    glyphStroke: "var(--shell-accent)",
  },
  opencode: {
    accent: "text-[var(--app-opencode)]",
    glyphStroke: "var(--shell-accent)",
  },
};

function aggregateSummaries(items: UsageSummary[]): UsageSummary {
  let totalRequests = 0;
  let successCount = 0;
  let totalCostNum = 0;
  let input = 0;
  let output = 0;
  let cacheCreation = 0;
  let cacheRead = 0;

  for (const s of items) {
    totalRequests += s.totalRequests;
    successCount += Math.round((s.totalRequests * s.successRate) / 100);
    totalCostNum += parseFiniteNumber(s.totalCost) ?? 0;
    input += s.totalInputTokens;
    output += s.totalOutputTokens;
    cacheCreation += s.totalCacheCreationTokens;
    cacheRead += s.totalCacheReadTokens;
  }

  const cacheableInput = input + cacheCreation + cacheRead;
  return {
    totalRequests,
    totalCost: totalCostNum.toFixed(6),
    totalInputTokens: input,
    totalOutputTokens: output,
    totalCacheCreationTokens: cacheCreation,
    totalCacheReadTokens: cacheRead,
    successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
    realTotalTokens: input + output + cacheCreation + cacheRead,
    cacheHitRate: cacheableInput > 0 ? cacheRead / cacheableInput : 0,
  };
}

function pickSummary(
  apps: UsageSummaryByApp[],
  appType: string | undefined,
): UsageSummary | undefined {
  if (apps.length === 0) return undefined;
  if (appType) {
    return apps.find((a) => a.appType === appType)?.summary;
  }
  return aggregateSummaries(apps.map((a) => a.summary));
}

type CacheWriteState = "ok" | "partial" | "na";

function deriveCacheWriteState(appTypes: string[]): CacheWriteState {
  if (appTypes.length === 0) return "ok";
  const inclusive = appTypes.filter((t) =>
    CACHE_INCLUSIVE_APP_TYPES.has(t),
  ).length;
  if (inclusive === appTypes.length) return "na";
  if (inclusive === 0) return "ok";
  return "partial";
}

function AppGlyph({
  appType,
  accentClass,
  stroke,
}: {
  appType?: string;
  accentClass: string;
  stroke: string;
}) {
  if (appType && appType in APP_ICON_MAP) {
    const base = APP_ICON_MAP[appType as AppId].icon;
    if (isValidElement<{ size?: number }>(base)) {
      return cloneElement(base, { size: 20 });
    }
  }
  return (
    <Zap
      className={cn("h-5 w-5", accentClass)}
      style={{ color: stroke }}
      strokeWidth={2}
    />
  );
}

export function UsageHero({
  range,
  appType,
  providerName,
  model,
  refreshIntervalMs,
}: UsageHeroProps) {
  const { t, i18n } = useTranslation();
  const lang = getResolvedLang(i18n);

  const { data, isLoading } = useUsageSummaryByApp(
    range,
    { providerName, model },
    {
      refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    },
  );

  const allApps = data ?? [];
  const summary = pickSummary(allApps, appType);

  const titleTheme =
    TITLE_THEMES[(appType ?? "all") as keyof typeof TITLE_THEMES] ??
    TITLE_THEMES.all;
  const appLabel =
    appType && appType in TITLE_THEMES ? t(`usage.appFilter.${appType}`) : null;

  const cacheWriteState = deriveCacheWriteState(
    appType ? [appType] : allApps.map((a) => a.appType),
  );

  const input = summary?.totalInputTokens ?? 0;
  const output = summary?.totalOutputTokens ?? 0;
  const cacheWrite = summary?.totalCacheCreationTokens ?? 0;
  const cacheRead = summary?.totalCacheReadTokens ?? 0;
  const realTotal = summary?.realTotalTokens ?? 0;
  const hitRate = summary?.cacheHitRate ?? 0;
  const totalCost = parseFiniteNumber(summary?.totalCost);
  const requests = summary?.totalRequests ?? 0;

  const cacheWriteDisplay = {
    value:
      cacheWriteState === "na" ? "N/A" : formatTokensShort(cacheWrite, lang),
    muted: cacheWriteState === "na",
    tooltip:
      cacheWriteState === "na"
        ? t(
            "usage.cacheWriteNotReported",
            "OpenAI 协议不区分缓存写入，仅上报缓存命中",
          )
        : cacheWriteState === "partial"
          ? t(
              "usage.cacheWritePartial",
              "部分协议（如 OpenAI）不上报缓存写入，数值可能偏低",
            )
          : undefined,
  };

  if (isLoading) {
    return (
      <div className="hero-card flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--shell-text-muted)]" />
      </div>
    );
  }

  const hitPercent = Math.max(0, Math.min(100, hitRate * 100));
  const hitPercentLabel = hitPercent.toFixed(hitPercent >= 99.95 ? 0 : 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="hero-card"
    >
      <div className="hero-top">
        <div className="hero-token">
          <div className="hero-glyph">
            <AppGlyph
              appType={appType}
              accentClass={titleTheme.accent}
              stroke={titleTheme.glyphStroke}
            />
          </div>
          <div>
            <div className="hero-label">
              {appLabel && (
                <>
                  <span className={cn("font-semibold", titleTheme.accent)}>
                    {appLabel}
                  </span>
                  <span className="mx-1.5 opacity-30">•</span>
                </>
              )}
              {t("usage.realTotal", "真实消耗 Tokens")}
            </div>
            <div className="hero-value-row">
              <span className="hero-value" title={realTotal.toLocaleString()}>
                {realTotal.toLocaleString()}
              </span>
              <span className="hero-compact">
                ≈ {formatTokensShort(realTotal, lang, 2)}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hs-label">{t("usage.totalRequests")}</span>
            <span className="hs-value">
              <Activity className="hs-ic text-[var(--chart-input)]" />
              {requests.toLocaleString()}
            </span>
          </div>
          <div className="hs-div" />
          <div className="hero-stat">
            <span className="hs-label">{t("usage.totalCost")}</span>
            <span className="hs-value hs-cost">
              {totalCost == null ? "--" : fmtUsd(totalCost, 4)}
            </span>
          </div>
        </div>
      </div>

      <div className="hero-grid">
        <MiniStat
          icon={<ArrowDownToLine className="ms-ic text-[var(--chart-input)]" />}
          label={t("usage.freshInput", "新增输入")}
          value={formatTokensShort(input, lang)}
        />
        <MiniStat
          icon={<ArrowUpFromLine className="ms-ic text-[var(--chart-cache-read)]" />}
          label={t("usage.output")}
          value={formatTokensShort(output, lang)}
        />
        <MiniStat
          icon={<Database className="ms-ic text-[var(--chart-cache-write)]" />}
          label={t("usage.cacheWrite", "缓存写入")}
          value={cacheWriteDisplay.value}
          muted={cacheWriteDisplay.muted}
          tooltip={cacheWriteDisplay.tooltip}
        />
        <MiniStat
          icon={<Sparkles className="ms-ic text-[var(--chart-output)]" />}
          label={t("usage.cacheRead", "缓存命中")}
          value={formatTokensShort(cacheRead, lang)}
        />
        <div className="hitrate-card">
          <div className="hr-top">
            <span>{t("usage.cacheHitRate", "缓存命中率")}</span>
            <span className="hr-val">{hitPercentLabel}%</span>
          </div>
          <div className="hr-bar">
            <motion.div
              className="hr-fill"
              initial={{ width: 0 }}
              animate={{ width: `${hitPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
  muted?: boolean;
}

function MiniStat({ icon, label, value, tooltip, muted }: MiniStatProps) {
  return (
    <div className="mini-stat" title={tooltip}>
      <div className="ms-top">
        {icon}
        <span>{label}</span>
        {tooltip && (
          <Info className="ms-ic ml-auto opacity-60 shrink-0" />
        )}
      </div>
      <span className={cn("ms-val", muted && "muted")}>{value}</span>
    </div>
  );
}
