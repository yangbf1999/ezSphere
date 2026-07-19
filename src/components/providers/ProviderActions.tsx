import {
  Activity,
  BarChart3,
  Check,
  Copy,
  Edit,
  Loader2,
  Minus,
  Play,
  Plus,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppId } from "@/lib/api";

interface ProviderActionsProps {
  appId?: AppId;
  isCurrent: boolean;
  isInConfig?: boolean;
  isTesting?: boolean;
  isProxyTakeover?: boolean;
  isOmo?: boolean;
  onSwitch: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onTest?: () => void;
  onConfigureUsage?: () => void;
  onDelete: () => void;
  onRemoveFromConfig?: () => void;
  onDisableOmo?: () => void;
  onOpenTerminal?: () => void;
  isAutoFailoverEnabled?: boolean;
  isInFailoverQueue?: boolean;
  onToggleFailover?: (enabled: boolean) => void;
  isOfficialBlockedByProxy?: boolean;
  isReadOnly?: boolean;
  isDefaultModel?: boolean;
  onSetAsDefault?: () => void;
  layout?: "default" | "shell";
}

interface MainButtonState {
  disabled: boolean;
  className: string;
  icon: JSX.Element | null;
  text: string;
  title?: string;
}

export function ProviderActions({
  appId,
  isCurrent,
  isInConfig = false,
  isTesting,
  isProxyTakeover = false,
  isOmo = false,
  onSwitch,
  onEdit,
  onDuplicate,
  onTest,
  onConfigureUsage,
  onDelete,
  onRemoveFromConfig,
  onDisableOmo,
  onOpenTerminal,
  isAutoFailoverEnabled = false,
  isInFailoverQueue = false,
  onToggleFailover,
  isOfficialBlockedByProxy = false,
  isReadOnly = false,
  isDefaultModel = false,
  onSetAsDefault,
  layout = "shell",
}: ProviderActionsProps) {
  const { t } = useTranslation();
  const isShell = layout === "shell";
  const iconButtonClass = isShell ? "icon-btn" : "h-8 w-8 p-1";

  const isAdditiveMode =
    (appId === "opencode" && !isOmo) ||
    appId === "openclaw" ||
    appId === "hermes";

  const isFailoverMode =
    !isAdditiveMode && !isOmo && isAutoFailoverEnabled && onToggleFailover;

  const handleMainButtonClick = () => {
    if (isOmo) {
      if (isCurrent) {
        onDisableOmo?.();
      } else {
        onSwitch();
      }
    } else if (isAdditiveMode) {
      if (isInConfig) {
        if (onRemoveFromConfig) {
          onRemoveFromConfig();
        } else {
          onDelete();
        }
      } else {
        onSwitch();
      }
    } else if (isFailoverMode) {
      onToggleFailover(!isInFailoverQueue);
    } else {
      onSwitch();
    }
  };

  const getMainButtonState = (): MainButtonState => {
    if (isOmo) {
      if (isCurrent) {
        return {
          disabled: false,
          className: isShell
            ? "prov-btn switch-btn"
            : "bg-gray-200 text-muted-foreground hover:bg-gray-200 hover:text-muted-foreground dark:bg-gray-700 dark:hover:bg-gray-700",
          icon: <Check className="h-4 w-4" />,
          text: t("provider.inUse"),
        };
      }
      return {
        disabled: false,
        className: isShell ? "prov-btn prov-btn-primary switch-btn" : "",
        icon: <Play className="h-4 w-4" />,
        text: t("provider.enable"),
      };
    }

    if (isAdditiveMode) {
      if (isInConfig) {
        return {
          disabled: isDefaultModel === true,
          className: isShell
            ? "prov-btn switch-btn"
            : cn(
                "bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-400 dark:hover:bg-orange-900/70",
                isDefaultModel && "opacity-40 cursor-not-allowed",
              ),
          icon: <Minus className="h-4 w-4" />,
          text: t("provider.removeFromConfig", { defaultValue: "移除" }),
        };
      }
      return {
        disabled: false,
        className: isShell
          ? "prov-btn prov-btn-primary switch-btn"
          : "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700",
        icon: <Plus className="h-4 w-4" />,
        text: t("provider.addToConfig", { defaultValue: "添加" }),
      };
    }

    if (isFailoverMode) {
      if (isInFailoverQueue) {
        return {
          disabled: false,
          className: isShell
            ? "prov-btn switch-btn"
            : "bg-primary/10 text-primary hover:bg-primary/15 dark:bg-primary/15 dark:text-primary dark:hover:bg-primary/20",
          icon: <Check className="h-4 w-4" />,
          text: t("failover.inQueue", { defaultValue: "已加入" }),
        };
      }
      return {
        disabled: false,
        className: isShell
          ? "prov-btn prov-btn-primary switch-btn"
          : "bg-primary hover:bg-primary/90 text-primary-foreground",
        icon: <Plus className="h-4 w-4" />,
        text: t("failover.addQueue", { defaultValue: "加入" }),
      };
    }

    if (isCurrent) {
      return {
        disabled: true,
        className: isShell
          ? "prov-btn switch-btn"
          : "bg-gray-200 text-muted-foreground hover:bg-gray-200 hover:text-muted-foreground dark:bg-gray-700 dark:hover:bg-gray-700",
        icon: <Check className="h-4 w-4" />,
        text: t("provider.inUse"),
      };
    }

    if (isOfficialBlockedByProxy) {
      return {
        disabled: true,
        className: isShell ? "prov-btn switch-btn" : "",
        icon: <Play className="h-4 w-4" />,
        text: t("provider.enable"),
        title: t("provider.blockedByProxyHint"),
      };
    }

    return {
      disabled: false,
      className: isShell
        ? cn("prov-btn switch-btn", !isProxyTakeover && "prov-btn-primary")
        : isProxyTakeover
          ? "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          : "",
      icon: <Play className="h-4 w-4" />,
      text: t("provider.enable"),
    };
  };

  const buttonState = getMainButtonState();
  const canDelete =
    !isReadOnly && (isOmo || isAdditiveMode ? true : !isCurrent);
  const readOnlyHint = t("provider.managedByHermesHint", {
    defaultValue: "由 Hermes 管理，请在 Hermes Web UI 中编辑",
  });

  const renderIconAction = (
    onClick: (() => void) | undefined,
    title: string,
    icon: JSX.Element,
    options?: { disabled?: boolean; danger?: boolean },
  ) => {
    if (isShell) {
      return (
        <button
          type="button"
          className={cn("icon-btn", options?.danger && "del")}
          onClick={onClick}
          disabled={options?.disabled || !onClick}
          title={title}
          aria-label={title}
        >
          {icon}
        </button>
      );
    }
    return (
      <Button
        size="icon"
        variant="ghost"
        onClick={onClick}
        disabled={options?.disabled || !onClick}
        title={title}
        aria-label={title}
        className={cn(
          iconButtonClass,
          options?.danger && "hover:text-red-500 dark:hover:text-red-400",
          (!onClick || options?.disabled) &&
            "opacity-40 cursor-not-allowed text-muted-foreground",
        )}
      >
        {icon}
      </Button>
    );
  };

  const defaultModelButton =
    (appId === "openclaw" || appId === "hermes") &&
    isInConfig &&
    onSetAsDefault ? (
      isShell ? (
        <button
          type="button"
          className={cn(
            "prov-btn switch-btn",
            isDefaultModel && "opacity-60 cursor-not-allowed",
          )}
          onClick={isDefaultModel ? undefined : onSetAsDefault}
          disabled={isDefaultModel}
        >
          <Zap className="h-4 w-4" />
          {isDefaultModel
            ? appId === "hermes"
              ? t("provider.inUse", { defaultValue: "已在用" })
              : t("provider.isDefault", { defaultValue: "当前默认" })
            : appId === "hermes"
              ? t("provider.enable", { defaultValue: "启用" })
              : t("provider.setAsDefault", { defaultValue: "设为默认" })}
        </button>
      ) : (
        <Button
          size="sm"
          variant={isDefaultModel ? "secondary" : "default"}
          onClick={isDefaultModel ? undefined : onSetAsDefault}
          disabled={isDefaultModel}
          className={cn(
            "w-fit px-2.5",
            isDefaultModel
              ? "bg-gray-200 text-muted-foreground dark:bg-gray-700 opacity-60 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-primary-foreground",
          )}
        >
          <Zap className="h-4 w-4" />
          {isDefaultModel
            ? appId === "hermes"
              ? t("provider.inUse", { defaultValue: "已在用" })
              : t("provider.isDefault", { defaultValue: "当前默认" })
            : appId === "hermes"
              ? t("provider.enable", { defaultValue: "启用" })
              : t("provider.setAsDefault", { defaultValue: "设为默认" })}
        </Button>
      )
    ) : null;

  const mainButton = isShell ? (
    <span
      title={buttonState.title}
      className={cn("inline-flex", buttonState.disabled && "cursor-not-allowed")}
    >
      <button
        type="button"
        className={cn("prov-btn switch-btn main-act", buttonState.className)}
        onClick={handleMainButtonClick}
        disabled={buttonState.disabled}
      >
        {buttonState.icon}
        {buttonState.text}
      </button>
    </span>
  ) : (
    <span
      title={buttonState.title}
      className={cn("inline-flex", buttonState.disabled && "cursor-not-allowed")}
    >
      <Button
        size="sm"
        variant={buttonState.disabled ? "secondary" : "default"}
        onClick={handleMainButtonClick}
        disabled={buttonState.disabled}
        className={cn("w-[4.5rem] px-2.5", buttonState.className)}
      >
        {buttonState.icon}
        {buttonState.text}
      </Button>
    </span>
  );

  const iconActions = (
    <>
      {renderIconAction(
        isReadOnly ? undefined : onEdit,
        isReadOnly ? readOnlyHint : t("common.edit"),
        <Edit className="h-4 w-4" />,
        { disabled: isReadOnly },
      )}
      {renderIconAction(onDuplicate, t("provider.duplicate"), (
        <Copy className="h-4 w-4" />
      ))}
      {renderIconAction(
        onTest,
        t("provider.connectivityCheck", "检测连通"),
        isTesting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Activity className="h-4 w-4" />
        ),
        { disabled: isTesting || !onTest },
      )}
      {renderIconAction(
        onConfigureUsage,
        t("provider.configureUsage"),
        <BarChart3 className="h-4 w-4" />,
        { disabled: !onConfigureUsage },
      )}
      {onOpenTerminal &&
        renderIconAction(
          onOpenTerminal,
          t("provider.openTerminal", "打开终端"),
          <Terminal className="h-4 w-4" />,
        )}
      {renderIconAction(
        canDelete ? onDelete : undefined,
        isReadOnly ? readOnlyHint : t("common.delete"),
        <Trash2 className="h-4 w-4" />,
        { disabled: !canDelete, danger: true },
      )}
    </>
  );

  return (
    <div
      className={cn(
        "actions",
        isShell && "shrink-0",
        !isShell && "flex items-center gap-1.5",
      )}
    >
      {defaultModelButton}
      {mainButton}
      {isShell ? (
        iconActions
      ) : (
        <div className="flex items-center gap-1">{iconActions}</div>
      )}
    </div>
  );
}
