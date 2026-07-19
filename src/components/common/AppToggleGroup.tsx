import React from "react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AppId } from "@/lib/api/types";
import {
  APP_IDS,
  APP_ICON_MAP,
  APP_SWITCHER_LABEL,
} from "@/config/appConfig";
import { cn } from "@/lib/utils";

interface AppToggleGroupProps {
  apps: Partial<Record<AppId, boolean>>;
  onToggle: (app: AppId, enabled: boolean) => void;
  appIds?: AppId[];
  variant?: "icon" | "chip";
  className?: string;
}

export const AppToggleGroup: React.FC<AppToggleGroupProps> = ({
  apps,
  onToggle,
  appIds = APP_IDS,
  variant = "icon",
  className,
}) => {
  const { t } = useTranslation();

  if (variant === "chip") {
    return (
      <div className={cn("app-chip-group", className)}>
        {appIds.map((app) => {
          const label = APP_SWITCHER_LABEL[app] ?? APP_ICON_MAP[app].label;
          const enabled = apps[app];
          return (
            <button
              key={app}
              type="button"
              className={cn("tag app-chip", !enabled && "off")}
              onClick={() => onToggle(app, !enabled)}
              aria-pressed={enabled}
              title={
                enabled
                  ? t("mcp.disableApp", {
                      app: label,
                      defaultValue: `点击停用 ${label}`,
                    })
                  : t("mcp.enableApp", {
                      app: label,
                      defaultValue: `点击启用 ${label}`,
                    })
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex items-center gap-1.5 flex-shrink-0", className)}>
        {appIds.map((app) => {
          const { label, icon, activeClass } = APP_ICON_MAP[app];
          const enabled = apps[app];
          return (
            <Tooltip key={app}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onToggle(app, !enabled)}
                  aria-label={enabled ? t("mcp.disableApp", { app: label, defaultValue: `停用 ${label}` }) : t("mcp.enableApp", { app: label, defaultValue: `启用 ${label}` })}
                  aria-pressed={enabled}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    enabled ? activeClass : "opacity-35 hover:opacity-70"
                  }`}
                >
                  {icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {label}
                  {enabled ? " ✓" : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
