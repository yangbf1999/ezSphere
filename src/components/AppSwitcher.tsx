import type { AppId } from "@/lib/api";
import type { VisibleApps } from "@/types";
import { ProviderIcon } from "@/components/ProviderIcon";
import {
  APP_SWITCHER_ICON,
  APP_SWITCHER_LABEL,
  PROVIDER_TAB_APP_IDS,
} from "@/config/appConfig";
import { cn } from "@/lib/utils";
import { Monitor, Terminal } from "lucide-react";

const APP_BADGE_ICON: Partial<
  Record<AppId, { icon: typeof Terminal; offsetY?: number }>
> = {
  claude: { icon: Terminal },
  "claude-desktop": { icon: Monitor, offsetY: 0.5 },
};

interface AppSwitcherProps {
  activeApp: AppId;
  onSwitch: (app: AppId) => void;
  visibleApps?: VisibleApps;
  compact?: boolean;
  variant?: "pill" | "tabs" | "prompt-tabs" | "segmented";
  activeCount?: number;
  appFilter?: (app: AppId) => boolean;
  /** 是否写入「应用管理」共用的 last-app；模型中心等独立场景应传 false */
  persistSelection?: boolean;
}

const STORAGE_KEY = "ezsphere-last-app";

export function AppSwitcher({
  activeApp,
  onSwitch,
  visibleApps,
  compact,
  variant = "pill",
  activeCount,
  appFilter,
  persistSelection = true,
}: AppSwitcherProps) {
  const handleSwitch = (app: AppId) => {
    if (app === activeApp) return;
    if (persistSelection) {
      localStorage.setItem(STORAGE_KEY, app);
    }
    onSwitch(app);
  };
  const iconSize = variant === "tabs" ? 16 : 20;

  const appsToShow = PROVIDER_TAB_APP_IDS.filter((app) => {  
    if (appFilter && !appFilter(app)) return false;
    if (!visibleApps) return true;
    return visibleApps[app];
  });

  if (variant === "segmented") {
    return (
      <div className="seg" role="tablist" aria-label="应用切换">
        {appsToShow.map((app) => {
          const isActive = activeApp === app;
          return (
            <button
              key={app}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSwitch(app)}
              className={cn(isActive && "active")}
            >
              {APP_SWITCHER_LABEL[app]}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "prompt-tabs") {
    return (
      <div className="prompt-tabs" role="tablist" aria-label="提示词应用切换">
        {appsToShow.map((app) => {
           //hermes过滤掉
           if (app === "hermes") return false;
          const isActive = activeApp === app;
          return (
            <button
              key={app}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSwitch(app)}
              className={cn("prompt-tab", isActive && "active")}
            >
              <ProviderIcon
                icon={APP_SWITCHER_ICON[app]}
                name={APP_SWITCHER_LABEL[app]}
                size={16}
              />
              {APP_SWITCHER_LABEL[app]}
              {isActive && activeCount != null && (
                <span className="cnt">{activeCount}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "tabs") {
    return (
      <div className="prov-tabs" role="tablist" aria-label="模型应用切换">
        {appsToShow.map((app) => {
          const isActive = activeApp === app;
          return (
            <button
              key={app}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSwitch(app)}
              className={cn("prov-tab", isActive && "active")}
            >
              <ProviderIcon
                icon={APP_SWITCHER_ICON[app]}
                name={APP_SWITCHER_LABEL[app]}
                size={iconSize}
              />
              {APP_SWITCHER_LABEL[app]}
              {isActive && activeCount != null && (
                <span className="cnt">{activeCount}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="inline-flex bg-muted rounded-xl p-1 gap-1">
      {appsToShow.map((app) => {
        const badgeConfig = APP_BADGE_ICON[app];
        const BadgeIcon = badgeConfig?.icon;
        const isActive = activeApp === app;
        return (
          <button
            key={app}
            type="button"
            onClick={() => handleSwitch(app)}
            className={cn(
              "group inline-flex items-center px-3 h-8 rounded-md text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            )}
          >
            <span className="relative inline-flex shrink-0">
              <ProviderIcon
                icon={APP_SWITCHER_ICON[app]}
                name={APP_SWITCHER_LABEL[app]}
                size={iconSize}
              />
              {BadgeIcon && (
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-[3px] border h-[11px] w-[11px]",
                    isActive
                      ? "bg-background border-border text-foreground"
                      : "bg-muted border-background text-muted-foreground group-hover:bg-background group-hover:text-foreground",
                  )}
                  aria-hidden="true"
                >
                  <BadgeIcon
                    className="h-[8px] w-[8px]"
                    strokeWidth={2.5}
                    style={
                      badgeConfig?.offsetY
                        ? { transform: `translateY(${badgeConfig.offsetY}px)` }
                        : undefined
                    }
                  />
                </span>
              )}
            </span>
            <span
              className={cn(
                "transition-all duration-200 whitespace-nowrap overflow-hidden",
                compact
                  ? "max-w-0 opacity-0 ml-0"
                  : "max-w-[120px] opacity-100 ml-2",
              )}
            >
              {APP_SWITCHER_LABEL[app]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
