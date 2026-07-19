/**
 * 代理模式切换开关组件
 *
 * 放置在主界面头部，用于一键启用/关闭代理模式
 * 启用时自动接管 Live 配置，关闭时恢复原始配置
 */

import { Radio, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useProxyStatus } from "@/hooks/useProxyStatus";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { AppId } from "@/lib/api";

interface ProxyToggleProps {
  className?: string;
  activeApp: AppId;
}

export function ProxyToggle({ className, activeApp }: ProxyToggleProps) {
  const { t } = useTranslation();
  const { isRunning, takeoverStatus, setTakeoverForApp, isPending, status } =
    useProxyStatus();

  const handleToggle = async (checked: boolean) => {
    try {
      await setTakeoverForApp({ appType: activeApp, enabled: checked });
    } catch (error) {
      console.error("[ProxyToggle] Toggle takeover failed:", error);
    }
  };

  const takeoverEnabled = takeoverStatus?.[activeApp] || false;

  const appLabel =
    activeApp === "claude"
      ? "Claude"
      : activeApp === "codex"
        ? "Codex"
        : activeApp === "gemini"
          ? "Gemini"
          : "OpenCode";

  const tooltipText = takeoverEnabled
    ? isRunning
      ? t("proxy.takeover.tooltip.active", {
          appLabel,
          address: status?.address,
          port: status?.port,
          defaultValue: `${appLabel} 已接管 - ${status?.address}:${status?.port}\n切换该应用模型为热切换`,
        })
      : t("proxy.takeover.tooltip.broken", {
          appLabel,
          defaultValue: `${appLabel} 已接管，但代理服务未运行`,
        })
    : t("proxy.takeover.tooltip.inactive", {
        appLabel,
        defaultValue: `接管 ${appLabel} 的 Live 配置，让该应用请求走本地代理`,
      });

  return (
    <div
      className={cn("prov-toggle flex items-center gap-2", className)}
      title={tooltipText}
    >
      {isPending ? (
        <Loader2 className="prov-toggle-icon is-spinning animate-spin" />
      ) : (
        <Radio
          className={cn(
            "prov-toggle-icon",
            takeoverEnabled && "is-active animate-pulse",
          )}
        />
      )}
      <Switch
        checked={takeoverEnabled}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={t("proxy.takeover.switchLabel", {
          appLabel,
          defaultValue: `接管 ${appLabel}`,
        })}
      />
    </div>
  );
}
