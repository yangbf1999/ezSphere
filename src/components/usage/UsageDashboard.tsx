import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { UsageHero } from "./UsageHero";
import { UsageTrendChart } from "./UsageTrendChart";
import { RequestLogTable } from "./RequestLogTable";
import { ProviderStatsTable } from "./ProviderStatsTable";
import { ModelStatsTable } from "./ModelStatsTable";
import { DataSourceBar } from "./DataSourceBar";
import {
  KNOWN_APP_TYPES,
  type AppType,
  type AppTypeFilter,
  type UsageRangePreset,
  type UsageRangeSelection,
} from "@/types/usage";
import { motion } from "framer-motion";
import {
  BarChart3,
  ListFilter,
  Activity,
  RefreshCw,
  Coins,
  LayoutGrid,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PopoverAnchor } from "@/components/ui/popover";
import { useQueryClient } from "@tanstack/react-query";
import { usageKeys, useModelStats, useProviderStats } from "@/lib/query/usage";
import { useUsageEventBridge } from "@/hooks/useUsageEventBridge";
import { PricingConfigPanel } from "@/components/usage/PricingConfigPanel";
import { cn } from "@/lib/utils";
import { getLocaleFromLanguage } from "./format";
import { getUsageRangePresetLabel, resolveUsageRange } from "@/lib/usageRange";
import { UsageDateRangePicker } from "./UsageDateRangePicker";

const APP_FILTER_OPTIONS: AppTypeFilter[] = ["all", ...KNOWN_APP_TYPES];

const REFRESH_INTERVAL_OPTIONS_MS = [0, 5000, 10000, 30000, 60000] as const;

const RANGE_PRESETS: UsageRangePreset[] = [
  "today",
  "1d",
  "7d",
  "14d",
  "30d",
];

const APP_DOT_COLOR: Record<AppType, string> = {
  claude: "var(--app-claude)",
  codex: "var(--app-codex)",
  gemini: "var(--app-gemini)",
  opencode: "var(--app-opencode)",
};

const DYNAMIC_OPTION_PREFIX = "v:";
const encodeOptionValue = (name: string) => `${DYNAMIC_OPTION_PREFIX}${name}`;
const decodeOptionValue = (value: string) =>
  value === "all" ? undefined : value.slice(DYNAMIC_OPTION_PREFIX.length);

type UsageTab = "logs" | "providers" | "models" | "pricing";

export function UsageDashboard() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<UsageRangeSelection>({ preset: "today" });
  const [appType, setAppType] = useState<AppTypeFilter>("all");
  const [providerName, setProviderName] = useState<string | undefined>(
    undefined,
  );
  const [model, setModel] = useState<string | undefined>(undefined);
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(30000);
  const [activeTab, setActiveTab] = useState<UsageTab>("logs");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const changeAppType = (next: AppTypeFilter) => {
    setAppType(next);
    if (next !== appType) {
      setProviderName(undefined);
      setModel(undefined);
    }
  };
  const changeProviderName = (next: string | undefined) => {
    setProviderName(next);
    if (next !== providerName) {
      setModel(undefined);
    }
  };

  useUsageEventBridge();

  const changeRefreshInterval = (next: number) => {
    setRefreshIntervalMs(next);
    queryClient.invalidateQueries({ queryKey: usageKeys.all });
  };

  const language = i18n.resolvedLanguage || i18n.language || "en";
  const locale = getLocaleFromLanguage(language);
  const resolvedRange = useMemo(() => resolveUsageRange(range), [range]);
  const rangeLabel = useMemo(() => {
    if (range.preset !== "custom") {
      return getUsageRangePresetLabel(range.preset, t);
    }

    const startStr = new Date(resolvedRange.startDate * 1000).toLocaleString(
      locale,
    );

    if (range.liveEndTime) {
      return `${startStr} → ${t("usage.liveEndTimeNow", "现在")}`;
    }

    const endStr = new Date(resolvedRange.endDate * 1000).toLocaleString(
      locale,
    );
    return `${startStr} - ${endStr}`;
  }, [locale, range, resolvedRange.endDate, resolvedRange.startDate, t]);

  const optionsRefetch = {
    refetchInterval:
      refreshIntervalMs > 0 ? refreshIntervalMs : (false as const),
  };
  const { data: providerOptionsData } = useProviderStats(
    range,
    { appType },
    optionsRefetch,
  );
  const { data: modelOptionsData } = useModelStats(
    range,
    { appType, providerName },
    optionsRefetch,
  );

  const providerOptions = useMemo(() => {
    const names = new Set<string>();
    for (const stat of providerOptionsData ?? []) {
      names.add(stat.providerName);
    }
    if (providerName) names.add(providerName);
    return Array.from(names);
  }, [providerOptionsData, providerName]);

  const modelOptions = useMemo(() => {
    const names = new Set<string>();
    for (const stat of modelOptionsData ?? []) {
      names.add(stat.model);
    }
    if (model) names.add(model);
    return Array.from(names);
  }, [modelOptionsData, model]);

  const applyPreset = (preset: UsageRangePreset) => {
    setRange({ preset });
    setCalendarOpen(false);
  };

  const tabs: { id: UsageTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "logs",
      label: t("usage.requestLogs"),
      icon: <ListFilter className="h-3.5 w-3.5" />,
    },
    {
      id: "providers",
      label: t("usage.providerStats"),
      icon: <Activity className="h-3.5 w-3.5" />,
    },
    {
      id: "models",
      label: t("usage.modelStats"),
      icon: <BarChart3 className="h-3.5 w-3.5" />,
    },
    {
      id: "pricing",
      label: t("settings.advanced.pricing.title"),
      icon: <Coins className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="usage-page pb-8"
    >
      <div className="dash-head">
        <div className="dh-left">
          <h1>{t("usage.title")}</h1>
          <p className="dh-sub">{t("usage.subtitle")}</p>
        </div>

        <div className="dh-filters">
          <div className="app-filter" role="group" aria-label={t("usage.appFilterLabel", { defaultValue: "应用筛选" })}>
            {APP_FILTER_OPTIONS.map((type) => {
              const label = t(`usage.appFilter.${type}`);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => changeAppType(type)}
                  title={label}
                  aria-label={label}
                  aria-pressed={appType === type}
                  className={cn("af-btn", appType === type && "active")}
                >
                  {type === "all" ? (
                    <LayoutGrid />
                  ) : (
                    <span
                      className="af-dot"
                      style={{ background: APP_DOT_COLOR[type] }}
                      aria-hidden
                    />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <Select
            value={
              providerName != null ? encodeOptionValue(providerName) : "all"
            }
            onValueChange={(v) => changeProviderName(decodeOptionValue(v))}
          >
            <SelectTrigger
              size="compact"
              className="w-[130px] [&>span]:truncate"
              title={providerName ?? t("usage.filterBySource")}
            >
              <SelectValue placeholder={t("usage.allSources")} />
            </SelectTrigger>
            <SelectContent compact className="max-w-[280px]">
              <SelectItem value="all">{t("usage.allSources")}</SelectItem>
              {providerOptions.map((name) => (
                <SelectItem
                  key={name}
                  value={encodeOptionValue(name)}
                  title={name}
                  className="[&>span:last-child]:truncate"
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={model != null ? encodeOptionValue(model) : "all"}
            onValueChange={(v) => setModel(decodeOptionValue(v))}
          >
            <SelectTrigger
              size="compact"
              className="w-[130px] [&>span]:truncate"
              title={model ?? t("usage.filterByModel")}
            >
              <SelectValue placeholder={t("usage.allModels")} />
            </SelectTrigger>
            <SelectContent compact className="max-w-[280px]">
              <SelectItem value="all">{t("usage.allModels")}</SelectItem>
              {modelOptions.map((name) => (
                <SelectItem
                  key={name}
                  value={encodeOptionValue(name)}
                  title={name}
                  className="[&>span:last-child]:truncate"
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="dh-right">
            <Select
              value={String(refreshIntervalMs)}
              onValueChange={(v) => changeRefreshInterval(Number(v))}
            >
              <SelectTrigger
                size="compact"
                className="w-[100px]"
                title={t("usage.refreshInterval")}
                aria-label={t("usage.refreshInterval")}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <RefreshCw className="h-3 w-3 shrink-0" />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent compact>
                {REFRESH_INTERVAL_OPTIONS_MS.map((ms) => (
                  <SelectItem key={ms} value={String(ms)}>
                    {ms > 0 ? `${ms / 1000}s` : t("usage.refreshOff")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="range-seg" role="radiogroup" aria-label={t("usage.timeRange", { defaultValue: "时间范围" })}>
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={range.preset === preset}
                  className={cn(range.preset === preset && "active")}
                  onClick={() => applyPreset(preset)}
                >
                  {getUsageRangePresetLabel(preset, t)}
                </button>
              ))}
              <UsageDateRangePicker
                selection={range}
                triggerLabel={rangeLabel}
                onApply={(nextRange) => setRange(nextRange)}
                hideTrigger
                showPresets={false}
                open={calendarOpen}
                onOpenChange={setCalendarOpen}
                anchor={
                  <PopoverAnchor asChild>
                    <button
                      type="button"
                      className={cn(range.preset === "custom" && "active")}
                      onClick={() => setCalendarOpen(true)}
                    >
                      {t("usage.customRange", { defaultValue: "日历筛选" })}
                    </button>
                  </PopoverAnchor>
                }
              />
            </div>
          </div>
        </div>
      </div>

      <UsageHero
        range={range}
        appType={appType === "all" ? undefined : appType}
        providerName={providerName}
        model={model}
        refreshIntervalMs={refreshIntervalMs}
      />

      <UsageTrendChart
        range={range}
        rangeLabel={rangeLabel}
        appType={appType}
        providerName={providerName}
        model={model}
        refreshIntervalMs={refreshIntervalMs}
      />

    {/*  <DataSourceBar refreshIntervalMs={refreshIntervalMs} /> */}

      <div className="tabs-wrap">
        <div className="tabs-list" role="tablist" aria-label={t("usage.dataTabs", { defaultValue: "数据视图" })}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`usage-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`usage-panel-${tab.id}`}
              className={cn("tab", activeTab === tab.id && "active")}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "logs" && (
          <div role="tabpanel" id="usage-panel-logs" aria-labelledby="usage-tab-logs">
          <RequestLogTable
            range={range}
            rangeLabel={rangeLabel}
            appType={appType}
            providerName={providerName}
            model={model}
            refreshIntervalMs={refreshIntervalMs}
            onRangeChange={setRange}
          />
          </div>
        )}

        {activeTab === "providers" && (
          <div role="tabpanel" id="usage-panel-providers" aria-labelledby="usage-tab-providers">
          <ProviderStatsTable
            range={range}
            appType={appType}
            providerName={providerName}
            model={model}
            refreshIntervalMs={refreshIntervalMs}
          />
          </div>
        )}

        {activeTab === "models" && (
          <div role="tabpanel" id="usage-panel-models" aria-labelledby="usage-tab-models">
          <ModelStatsTable
            range={range}
            appType={appType}
            providerName={providerName}
            model={model}
            refreshIntervalMs={refreshIntervalMs}
          />
          </div>
        )}

        {activeTab === "pricing" && (
          <div role="tabpanel" id="usage-panel-pricing" aria-labelledby="usage-tab-pricing">
            <p className="pricing-desc">
              {t("settings.advanced.pricing.description")}
            </p>
            <PricingConfigPanel listLayout="table" />
          </div>
        )}
      </div>

      {/* 原 Accordion 定价入口已迁移至 Tab，保留模块注释备查
      <Accordion type="multiple" defaultValue={[]} className="w-full space-y-4">
        <AccordionItem value="pricing" className="rounded-xl glass-card overflow-hidden">
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
            <PricingConfigPanel />
          </AccordionTrigger>
        </AccordionItem>
      </Accordion>
      */}
    </motion.div>
  );
}
