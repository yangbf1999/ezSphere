/**
 * 故障转移切换开关组件
 *
 * 放置在主界面头部，用于一键启用/关闭自动故障转移
 */

import { Shuffle, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  useAutoFailoverEnabled,
  useSetAutoFailoverEnabled,
} from "@/lib/query/failover";
import { useProxyStatus } from "@/hooks/useProxyStatus";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { AppId } from "@/lib/api";

interface FailoverToggleProps {
  className?: string;
  activeApp: AppId;
}

export function FailoverToggle({ className, activeApp }: FailoverToggleProps) {
  const { t } = useTranslation();
  const { data: isEnabled = false, isLoading } =
    useAutoFailoverEnabled(activeApp);
  const setEnabled = useSetAutoFailoverEnabled();
  const { takeoverStatus } = useProxyStatus();
  const takeoverEnabled = takeoverStatus?.[activeApp] ?? false;

  const handleToggle = (checked: boolean) => {
    if (checked && !takeoverEnabled) return;
    setEnabled.mutate({ appType: activeApp, enabled: checked });
  };

  const appLabel =
    activeApp === "claude"
      ? "Claude"
      : activeApp === "codex"
        ? "Codex"
        : "Gemini";

  const tooltipText = !takeoverEnabled
    ? t("failover.tooltip.takeoverRequired", {
        app: appLabel,
        defaultValue: `请先接管 ${appLabel}，再启用故障转移`,
      })
    : isEnabled
      ? t("failover.tooltip.enabled", {
          app: appLabel,
          defaultValue: `${appLabel} 故障转移已启用\n按队列优先级（P1→P2→...）选择模型`,
        })
      : t("failover.tooltip.disabled", {
          app: appLabel,
          defaultValue: `启用 ${appLabel} 故障转移\n将立即切换到队列 P1，并在失败时自动切换到下一个`,
        });

  return (
    <div
      className={cn("prov-toggle flex items-center gap-2", className)}
      title={tooltipText}
    >
      {setEnabled.isPending || isLoading ? (
        <Loader2 className="prov-toggle-icon is-spinning animate-spin" />
      ) : (
        <Shuffle
          className={cn("prov-toggle-icon", isEnabled && "is-active animate-pulse")}
        />
      )}
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={setEnabled.isPending || isLoading || !takeoverEnabled}
        aria-label={t("failover.switchLabel", {
          app: appLabel,
          defaultValue: `${appLabel} 故障转移`,
        })}
      />
    </div>
  );
}
