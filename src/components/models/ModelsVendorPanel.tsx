import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { AppSwitcher } from "@/components/AppSwitcher";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProviderIcon } from "@/components/ProviderIcon";
import type { UniversalProviderPreset } from "@/config/universalProviderPresets";
import {
  getVendorPresetsForApp,
  type ModelsAppId,
} from "@/config/vendorPresets";
import { universalProviderPresets } from "@/config/universalProviderPresets";
import type { VisibleApps } from "@/types";
import { formatHost, getPresetInitial, resolveDisplayBaseUrl } from "@/utils/providerDisplay";
import { cn } from "@/lib/utils";

type PanelTab = "vendor" | "universal";

interface ModelsVendorPanelProps {
  modelsAppId: ModelsAppId;
  onSwitchApp: (app: ModelsAppId) => void;
  visibleApps?: VisibleApps;
  onAddVendorPreset: (presetId: string, appId: ModelsAppId) => void;
  onAddCustomProvider: (appId: ModelsAppId) => void;
  onAddUniversalPreset: (preset: UniversalProviderPreset | null) => void;
}

interface DirectoryCardProps {
  displayName: string;
  subtitle: string;
  icon?: string;
  iconColor?: string;
  variant?: "default" | "custom";
  onAdd: () => void;
  dataAttr?: Record<string, string>;
}

function DirectoryCard({
  displayName,
  subtitle,
  icon,
  iconColor,
  variant = "default",
  onAdd,
  dataAttr,
}: DirectoryCardProps) {
  const { t } = useTranslation();
  const isCustom = variant === "custom";
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = () => {
    if (subtitleRef.current) {
      setIsTruncated(
        subtitleRef.current.scrollWidth > subtitleRef.current.clientWidth,
      );
    }
  };

  return (
    <div
      className={cn("dir-card", isCustom && "dir-card--custom")}
      {...dataAttr}
    >
      <div className="dir-l">
        <div className={cn("dir-logo", isCustom && "dir-logo--accent")}>
          {isCustom ? (
            <Plus strokeWidth={2.5} />
          ) : icon ? (
            <ProviderIcon
              icon={icon}
              name={displayName}
              color={iconColor}
              size={16}
              className="dir-logo-icon"
            />
          ) : (
            getPresetInitial(displayName)
          )}
        </div>
        <div className="dir-info">
          <div className={cn("dir-name", isCustom && "dir-name--accent")}>
            {displayName}
          </div>
          <div className="min-w-0 overflow-hidden">
            <TooltipProvider>
              <Tooltip open={isTruncated ? undefined : false}>
                <TooltipTrigger asChild>
                  <div
                    ref={subtitleRef}
                    onMouseEnter={checkTruncation}
                    className="dir-sub"
                  >
                    {subtitle}
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[280px] break-all bg-[#1a1a1a] px-3 py-1.5 font-mono text-xs text-white"
                >
                  {subtitle}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <Button
        type="button"
        variant="dir-add"
        icon={Plus}
        title={t("common.add")}
        aria-label={`${t("common.add")} ${displayName}`}
        onClick={onAdd}
      />
    </div>
  );
}

export function ModelsVendorPanel({
  modelsAppId,
  onSwitchApp,
  visibleApps,
  onAddVendorPreset,
  onAddCustomProvider,
  onAddUniversalPreset,
}: ModelsVendorPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<PanelTab>("vendor");

  const visibleVendors = useMemo(
    () => getVendorPresetsForApp(modelsAppId),
    [modelsAppId],
  );

  const totalCount =
    activeTab === "vendor"
      ? visibleVendors.length + 1
      : universalProviderPresets.length;

  return (
    <aside className="models-panel">
      <div className="panel-head">
        <span className="panel-head-label">
          {t("models.directory", { defaultValue: "目录" })}
        </span>
        {/** 统一API网关不显示统计*/}
        {activeTab !== "universal" && (
          <span className="panel-head-count">
            {t("models.directoryCount", { defaultValue: "共" })}{" "}
            <span className="count">{totalCount-1}</span>
          </span>
        )}
      </div>

      <div className="models-panel-tabs !pb-0">
        <div
          className="seg"
          role="tablist"
          aria-label={t("models.directory", { defaultValue: "目录" })}
        >
        <button
          type="button"
          role="tab"
          id="models-tab-vendor"
          aria-selected={activeTab === "vendor"}
          aria-controls="models-panel-vendor"
          className={cn(activeTab === "vendor" && "active")}
          onClick={() => setActiveTab("vendor")}
        >
          {t("models.vendorTab", { defaultValue: "大模型厂商" })}
        </button>
        <button
          type="button"
          role="tab"
          id="models-tab-universal"
          aria-selected={activeTab === "universal"}
          aria-controls="models-panel-universal"
          className={cn(activeTab === "universal" && "active")}
          onClick={() => setActiveTab("universal")}
        >
          {t("models.universalTab", { defaultValue: "统一API网关" })}
        </button>
        </div>
      </div>

      {activeTab === "vendor" ? (
        <div
          role="tabpanel"
          id="models-panel-vendor"
          aria-labelledby="models-tab-vendor"
        >
          <div className="models-app-switch mt-2">
            <AppSwitcher
              activeApp={modelsAppId}
              onSwitch={(app) => onSwitchApp(app as ModelsAppId)}
              visibleApps={visibleApps}
              variant="segmented"
              persistSelection={false}
            />
          </div>
          <div className="panel-list">
            <DirectoryCard
              variant="custom"
              dataAttr={{ "data-vendor": "__custom" }}
              displayName={t("models.addCustom", {
                defaultValue: "添加自定义模型",
              })}
              subtitle={t("models.addCustomHint", {
                defaultValue: "新增模型自定义配置",
              })}
              onAdd={() => onAddCustomProvider(modelsAppId)}
            />
            {visibleVendors.map((preset) => {
              const displayName = preset.nameKey
                ? t(preset.nameKey)
                : preset.name;

              return (
                <DirectoryCard
                  key={preset.presetId}
                  dataAttr={{ "data-vendor": preset.name }}
                  displayName={displayName}
                  subtitle={formatHost(
                    resolveDisplayBaseUrl(preset.baseUrl, preset.websiteUrl),
                  )}
                  icon={preset.icon}
                  iconColor={preset.iconColor}
                  onAdd={() => onAddVendorPreset(preset.presetId, modelsAppId)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div
          role="tabpanel"
          id="models-panel-universal"
          aria-labelledby="models-tab-universal"
        >
        <div className="panel-list mt-2">
          {/*{universalProviderPresets.map((preset) => (
            <DirectoryCard
              key={preset.name}
              dataAttr={{ "data-universal": preset.name }}
              displayName={preset.name}
              subtitle={preset.description || preset.providerType}
              icon={preset.icon}
              iconColor={preset.iconColor}
              onAdd={() => onAddUniversalPreset(preset)}
            />
          ))} */}

          <DirectoryCard
            variant="custom"
            dataAttr={{
              "data-universal": "__add",
              "data-apps": "claude codex hermes",
            }}
            displayName={t("universalProvider.add")}
            subtitle={t("universalProvider.addHint")}
            onAdd={() => onAddUniversalPreset(null)}
          />
        </div>
        </div>
      )}

      {/*<div className="panel-foot">{t("models.directoryHint")}</div>*/}
    </aside>
  );
}
