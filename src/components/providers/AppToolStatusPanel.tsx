import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { settingsApi } from "@/lib/api";
import type { AppId } from "@/lib/api/types";
import {
  APP_SWITCHER_LABEL,
  CLI_TOOL_DISPLAY_NAMES,
  isCliStatusApp,
  type CliStatusAppId,
} from "@/config/appConfig";
import { isUpdateAvailable } from "@/lib/version";
import type { VisibleApps } from "@/types";
import { cn } from "@/lib/utils";

export type AppToolInstallAction = "install" | "update";

export interface AppToolInstallRequest {
  appId: CliStatusAppId;
  action: AppToolInstallAction;
  prompt: string;
}

interface AppToolStatusPanelProps {
  appId: AppId;
  visibleApps?: VisibleApps;
  onOpenInstall: (request: AppToolInstallRequest) => void;
}

export function AppToolStatusPanel({
  appId,
  visibleApps,
  onOpenInstall,
}: AppToolStatusPanelProps) {
  const { t } = useTranslation();

  const activeTool = useMemo(() => {
    if (!isCliStatusApp(appId)) return null;
    if (visibleApps && !visibleApps[appId]) return null;
    return appId;
  }, [appId, visibleApps]);

  const { data: toolVersions, isLoading } = useQuery({
    queryKey: ["providers", "tool-status", activeTool],
    queryFn: () => settingsApi.getToolVersions(activeTool ? [activeTool] : []),
    staleTime: 10 * 60 * 1000,
    enabled: activeTool != null,
  });

  const tool = toolVersions?.[0];

  if (!activeTool) {
    return null;
  }

  const label = CLI_TOOL_DISPLAY_NAMES[activeTool];
  const loading = isLoading && !tool;
  const installed = Boolean(tool?.version);
  const broken = Boolean(tool?.installed_but_broken);
  const outdated = isUpdateAvailable(tool?.version, tool?.latest_version);
  const latest = tool?.latest_version;
  const promptLabel = APP_SWITCHER_LABEL[activeTool] ?? label;
  const installPromptKey = {
    claude: "installRepair.prompts.installClaude",
    codex: "installRepair.prompts.installCodex",
    hermes: "installRepair.prompts.installHermes",
  }[activeTool];
  const installPrompt = t(installPromptKey);
  const updatePrompt = `更新 ${promptLabel}`;

  return (
    <div className="app-status">
      <div className="as-head">
        <div>{t("provider.appStatus.app", { defaultValue: "应用" })}</div>
        <div>
          {t("provider.appStatus.currentVersion", { defaultValue: "当前版本" })}
        </div>
        <div>
          {t("provider.appStatus.latestVersion", { defaultValue: "最新版本" })}
        </div>
        <div style={{ textAlign: "right" }}>
          {t("common.actions", { defaultValue: "操作" })}
        </div>
      </div>

      <div className="as-row">
        <div className="as-app">
          <div className="plogo" data-app={activeTool}>
            {label.charAt(0)}
          </div>
          {label}
        </div>
        <div
          className={cn(
            "as-ver",
            loading && "muted",
            !loading && installed && !outdated && "up-to-date",
            !loading && installed && outdated && "outdated",
            !loading && !installed && "muted",
          )}
        >
          {loading ? t("common.loading") : installed ? tool?.version : "—"}
        </div>
        <div className="as-ver muted">
          {loading ? (
            t("common.loading")
          ) : (
            <>
              {latest || t("common.unknown")}
              {installed && !outdated && (
                <span className="as-badge latest">
                  {t("provider.appStatus.upToDate", {
                    defaultValue: "已是最新",
                  })}
                </span>
              )}
              {installed && outdated && (
                <span className="as-badge update">
                  {t("provider.appStatus.updateAvailable", {
                    defaultValue: "可更新",
                  })}
                </span>
              )}
            </>
          )}
        </div>
        <div className="as-act">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--shell-text-muted)]" aria-hidden="true" />
          ) : !installed || broken ? (
            <>
              <span className="as-badge missing">
                {t("provider.appStatus.notInstalled", {
                  defaultValue: "未检测到本地安装",
                })}
              </span>
              <button
                type="button"
                className="ai-install-btn"
                onClick={() =>
                  onOpenInstall({
                    appId: activeTool,
                    action: "install",
                    prompt: installPrompt,
                  })
                }
              >
                <Plus />
                {t("provider.appStatus.aiInstall", {
                  defaultValue: "AI 自动安装",
                })}
              </button>
            </>
          ) : outdated ? (
            <button
              type="button"
              className="ai-install-btn"
              onClick={() =>
                onOpenInstall({
                  appId: activeTool,
                  action: "update",
                  prompt: updatePrompt,
                })
              }
            >
              <RefreshCw />
              {t("provider.appStatus.aiUpdate", {
                defaultValue: "AI 自动更新",
              })}
            </button>
          ) : (
            <span className="as-badge latest">
              {t("provider.appStatus.installed", {
                defaultValue: "已安装",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
