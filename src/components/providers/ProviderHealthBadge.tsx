import { cn } from "@/lib/utils";
import { ProviderHealthStatus } from "@/types/proxy";
import { useTranslation } from "react-i18next";

interface ProviderHealthBadgeProps {
  consecutiveFailures: number;
  isHealthy?: boolean;
  className?: string;
  variant?: "default" | "shell";
}

/**
 * 模型健康状态徽章
 * 根据连续失败次数显示不同颜色的状态指示器
 */
export function ProviderHealthBadge({
  consecutiveFailures,
  isHealthy,
  className,
  variant = "default",
}: ProviderHealthBadgeProps) {
  const { t } = useTranslation();

  const getStatus = () => {
    if (consecutiveFailures === 0) {
      return {
        labelKey: "health.operational",
        labelFallback: "正常",
        status: ProviderHealthStatus.Healthy,
        color: "bg-green-500",
        bgColor: "bg-green-500/10",
        textColor: "text-green-600 dark:text-green-400",
        shellClass: "ez-badge ez-badge--success",
      };
    }
    if (isHealthy !== false) {
      return {
        labelKey: "health.degraded",
        labelFallback: "降级",
        status: ProviderHealthStatus.Degraded,
        color: "bg-yellow-500",
        bgColor: "bg-yellow-500/10",
        textColor: "text-yellow-600 dark:text-yellow-400",
        shellClass: "ez-badge ez-badge--warning",
      };
    }
    return {
      labelKey: "health.circuitOpen",
      labelFallback: "熔断",
      status: ProviderHealthStatus.Failed,
      color: "bg-red-500",
      bgColor: "bg-red-500/10",
      textColor: "text-red-600 dark:text-red-400",
      shellClass: "ez-badge ez-badge--error",
    };
  };

  const statusConfig = getStatus();
  const label = t(statusConfig.labelKey, {
    defaultValue: statusConfig.labelFallback,
  });

  if (variant === "shell") {
    return (
      <span
        className={cn(statusConfig.shellClass, className)}
        title={t("health.consecutiveFailures", {
          count: consecutiveFailures,
          defaultValue: `连续失败 ${consecutiveFailures} 次`,
        })}
      >
        <span className="h-dot" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        statusConfig.bgColor,
        statusConfig.textColor,
        className,
      )}
      title={t("health.consecutiveFailures", {
        count: consecutiveFailures,
        defaultValue: `连续失败 ${consecutiveFailures} 次`,
      })}
    >
      <div
        className={cn("w-2 h-2 rounded-full", statusConfig.color)}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}
