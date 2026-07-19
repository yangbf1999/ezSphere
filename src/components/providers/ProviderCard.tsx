import { useMemo, useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import type { Provider } from "@/types";
import type { AppId } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ProviderActions } from "@/components/providers/ProviderActions";
import { ProviderIcon } from "@/components/ProviderIcon";
import UsageFooter from "@/components/UsageFooter";
import SubscriptionQuotaFooter from "@/components/SubscriptionQuotaFooter";
import CopilotQuotaFooter from "@/components/CopilotQuotaFooter";
import CodexOauthQuotaFooter from "@/components/CodexOauthQuotaFooter";
import { PROVIDER_TYPES, TEMPLATE_TYPES } from "@/config/constants";
import { isHermesReadOnlyProvider } from "@/config/hermesProviderPresets";
import { ProviderHealthBadge } from "@/components/providers/ProviderHealthBadge";
import { FailoverPriorityBadge } from "@/components/providers/FailoverPriorityBadge";
import {
  extractCodexBaseUrl,
  extractCodexExperimentalBearerToken,
  extractCodexWireApi,
  isCodexChatWireApi,
} from "@/utils/providerConfigUtils";
import { useProviderHealth } from "@/lib/query/failover";
import { useUsageQuery } from "@/lib/query/queries";
import { resolveProviderInUse } from "@/utils/providerInUse";

interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

interface ProviderCardProps {
  provider: Provider;
  isCurrent: boolean;
  appId: AppId;
  isInConfig?: boolean; // OpenCode: 是否已添加到 opencode.json
  isOmo?: boolean;
  isOmoSlim?: boolean;
  onSwitch: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onRemoveFromConfig?: (provider: Provider) => void;
  onDisableOmo?: () => void;
  onDisableOmoSlim?: () => void;
  onConfigureUsage: (provider: Provider) => void;
  onOpenWebsite: (url: string) => void;
  onDuplicate: (provider: Provider) => void;
  onTest?: (provider: Provider) => void;
  onOpenTerminal?: (provider: Provider) => void;
  isTesting?: boolean;
  isProxyRunning: boolean;
  isProxyTakeover?: boolean; // 代理接管模式（Live配置已被接管，切换为热切换）
  dragHandleProps?: DragHandleProps;
  isAutoFailoverEnabled?: boolean; // 是否开启自动故障转移
  failoverPriority?: number; // 故障转移优先级（1 = P1, 2 = P2, ...）
  isInFailoverQueue?: boolean; // 是否在故障转移队列中
  onToggleFailover?: (enabled: boolean) => void; // 切换故障转移队列
  activeProviderId?: string; // 代理当前实际使用的模型 ID（用于故障转移模式下标注绿色边框）
  // OpenClaw: default model
  isDefaultModel?: boolean;
  onSetAsDefault?: () => void;
}

/** 判断是否为官方模型（无自定义 base URL / API key，直连官方 API） */
function isOfficialProvider(provider: Provider, appId: AppId): boolean {
  if (provider.category === "official") {
    return true;
  }

  const config = provider.settingsConfig as Record<string, any>;
  if (appId === "claude") {
    const baseUrl = config?.env?.ANTHROPIC_BASE_URL;
    return !baseUrl || (typeof baseUrl === "string" && baseUrl.trim() === "");
  }
  if (appId === "codex") {
    // 无 OPENAI_API_KEY → 使用 Codex CLI 内置 OAuth（官方）
    const apiKey = config?.auth?.OPENAI_API_KEY;
    const bearerToken =
      typeof config?.config === "string"
        ? extractCodexExperimentalBearerToken(config.config)
        : undefined;
    return (
      !bearerToken &&
      (!apiKey || (typeof apiKey === "string" && apiKey.trim() === ""))
    );
  }
  if (appId === "gemini") {
    // 无 GEMINI_API_KEY 且无 GOOGLE_GEMINI_BASE_URL → Google OAuth 官方模式
    const apiKey = config?.env?.GEMINI_API_KEY;
    const baseUrl = config?.env?.GOOGLE_GEMINI_BASE_URL;
    return (
      (!apiKey || (typeof apiKey === "string" && apiKey.trim() === "")) &&
      (!baseUrl || (typeof baseUrl === "string" && baseUrl.trim() === ""))
    );
  }
  return false;
}

const extractApiUrl = (provider: Provider, fallbackText: string) => {
  if (provider.notes?.trim()) {
    return provider.notes.trim();
  }

  if (provider.websiteUrl) {
    return provider.websiteUrl;
  }

  const config = provider.settingsConfig;

  if (config && typeof config === "object") {
    const envBase =
      (config as Record<string, any>)?.env?.ANTHROPIC_BASE_URL ||
      (config as Record<string, any>)?.env?.GOOGLE_GEMINI_BASE_URL;
    if (typeof envBase === "string" && envBase.trim()) {
      return envBase;
    }

    const baseUrl = (config as Record<string, any>)?.config;

    if (typeof baseUrl === "string" && baseUrl.includes("base_url")) {
      const extractedBaseUrl = extractCodexBaseUrl(baseUrl);
      if (extractedBaseUrl) {
        return extractedBaseUrl;
      }
    }
  }

  return fallbackText;
};

export function ProviderCard({
  provider,
  isCurrent,
  appId,
  isInConfig = true,
  isOmo = false,
  isOmoSlim = false,
  onSwitch,
  onEdit,
  onDelete,
  onRemoveFromConfig,
  onDisableOmo,
  onDisableOmoSlim,
  onConfigureUsage,
  onOpenWebsite,
  onDuplicate,
  onTest,
  onOpenTerminal,
  isTesting,
  isProxyRunning,
  isProxyTakeover = false,
  dragHandleProps,
  isAutoFailoverEnabled = false,
  failoverPriority,
  isInFailoverQueue = false,
  onToggleFailover,
  activeProviderId,
  // OpenClaw: default model
  isDefaultModel,
  onSetAsDefault,
}: ProviderCardProps) {
  const { t } = useTranslation();

  // OMO and OMO Slim share the same card behavior
  const isAnyOmo = isOmo || isOmoSlim;
  const handleDisableAnyOmo = isOmoSlim ? onDisableOmoSlim : onDisableOmo;

  const { data: health } = useProviderHealth(provider.id, appId);

  const fallbackUrlText = t("provider.notConfigured", {
    defaultValue: "未配置接口地址",
  });

  const displayUrl = useMemo(() => {
    return extractApiUrl(provider, fallbackUrlText);
  }, [provider, fallbackUrlText]);

  const isClickableUrl = useMemo(() => {
    if (provider.notes?.trim()) {
      return false;
    }
    if (displayUrl === fallbackUrlText) {
      return false;
    }
    return true;
  }, [provider.notes, displayUrl, fallbackUrlText]);

  const usageEnabled = provider.meta?.usage_script?.enabled ?? false;
  const isOfficial = isOfficialProvider(provider, appId);
  const supportsOfficialSubscription =
    isOfficial && ["claude", "codex", "gemini"].includes(appId);
  const isOfficialSubscriptionUsage =
    provider.meta?.usage_script?.templateType ===
    TEMPLATE_TYPES.OFFICIAL_SUBSCRIPTION;
  const officialSubscriptionEnabled =
    supportsOfficialSubscription && usageEnabled && isOfficialSubscriptionUsage;
  // 官方判定只认显式 category === "official"（SSOT），不回退 isOfficial 的空字段启发式。
  // 理由（此判定曾在「纯 category ↔ category+isOfficial 回退」间反复，结论钉死于此）：
  //  1) 封号保护是高代价决策，不该建立在「base_url/key 缺失」这种脆弱信号上——它无法区分
  //     「想直连官方」与「自定义但还没填完」，两者都表现为字段为空，必然误伤后者。
  //  2) 启发式在 UI 多拦的部分，执行层 useProviderActions.ts 也只认 category === "official"、
  //     并不兑现（绕过 UI 即可切换）→ 属虚保护，却以误伤 category 缺失的自定义模型为代价。
  //  3) 预设导入的官方一定带 category="official"，category 缺失的「真官方」现实中≈不存在。
  // 真官方就该有显式 category；手动新建官方应引导标注，而不是靠空字段猜。
  const isOfficialBlockedByProxy =
    isProxyTakeover && provider.category === "official";
  const isCopilot =
    provider.meta?.providerType === PROVIDER_TYPES.GITHUB_COPILOT ||
    provider.meta?.usage_script?.templateType === "github_copilot";
  // Hermes v12+ overlay entries live under the `providers:` dict and are
  // read-only here — writes have to go through Hermes Web UI.
  const isHermesReadOnly =
    appId === "hermes" && isHermesReadOnlyProvider(provider.settingsConfig);
  const isCodexOauth =
    provider.meta?.providerType === PROVIDER_TYPES.CODEX_OAUTH;
  const codexNeedsRouting = useMemo(() => {
    if (appId !== "codex" || provider.category === "official") return false;
    if (provider.meta?.apiFormat === "openai_chat") return true;
    const config = (provider.settingsConfig as Record<string, any>)?.config;
    return (
      typeof config === "string" &&
      isCodexChatWireApi(extractCodexWireApi(config))
    );
  }, [
    appId,
    provider.category,
    provider.meta?.apiFormat,
    (provider.settingsConfig as Record<string, any>)?.config,
  ]);
  // 获取用量数据以判断是否有多套餐
  // 累加模式应用（OpenCode/OpenClaw/Hermes）：使用 isInConfig 代替 isCurrent
  const shouldAutoQuery =
    appId === "opencode" || appId === "openclaw" || appId === "hermes"
      ? isInConfig
      : isCurrent;
  const autoQueryInterval = shouldAutoQuery
    ? provider.meta?.usage_script?.autoQueryInterval || 0
    : 0;

  const { data: usage } = useUsageQuery(provider.id, appId, {
    enabled: usageEnabled && !isOfficial && !isOfficialSubscriptionUsage,
    autoQueryInterval,
  });

  const isTokenPlan =
    provider.meta?.usage_script?.templateType === "token_plan";
  const hasMultiplePlans =
    usage?.success && usage.data && usage.data.length > 1 && !isTokenPlan;

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (hasMultiplePlans) {
      setIsExpanded(true);
    }
  }, [hasMultiplePlans]);

  const handleOpenWebsite = () => {
    if (!isClickableUrl) {
      return;
    }
    onOpenWebsite(displayUrl);
  };

  // 与模型中心共用 resolveProviderInUse（故障转移 / Hermes / OpenClaw 等）
  const isActiveProvider = resolveProviderInUse({
    appId,
    providerId: provider.id,
    isCurrent,
    isOmo,
    isOmoSlim,
    isDefaultModel,
    isFailoverModeActive: isAutoFailoverEnabled,
    activeProviderId,
  });

  return (
    <>
      <div
        className={cn(
          "prov group",
          isActiveProvider && "current",
          dragHandleProps?.isDragging && "opacity-90",
        )}
      >
      <button
        type="button"
        className="drag"
        aria-label={t("provider.dragHandle")}
        {...(dragHandleProps?.attributes ?? {})}
        {...(dragHandleProps?.listeners ?? {})}
      >
        ⋮⋮
      </button>

      <div className="prov-main">
        <div className="pinfo">
        <div
          className="plogo"
          style={
            provider.iconColor
              ? { color: provider.iconColor }
              : isActiveProvider
                ? { color: "var(--shell-accent)" }
                : undefined
          }
        >
          <ProviderIcon
            icon={provider.icon}
            name={provider.name}
            color={provider.iconColor}
            size={20}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="pname">
            <span>{provider.name}</span>
            {isOmo && <span className="prov-badge">OMO</span>}
            {isOmoSlim && <span className="prov-badge">Slim</span>}
            {appId === "claude-desktop" &&
              provider.category !== "official" &&
              provider.meta?.claudeDesktopMode === "proxy" && (
                <span className="route-tag route-needed">
                  {t("claudeDesktop.modeProxy", { defaultValue: "需要路由" })}
                </span>
              )}
            {appId === "claude" &&
              provider.category !== "official" &&
              provider.meta?.apiFormat &&
              provider.meta.apiFormat !== "anthropic" && (
                <span className="route-tag route-needed">
                  {t("claudeCode.needsRouting", { defaultValue: "需要路由" })}
                </span>
              )}
            {codexNeedsRouting && (
              <span className="route-tag route-needed">
                {t("codex.needsRouting", { defaultValue: "需要路由" })}
              </span>
            )}
            {appId === "claude" && provider.category === "official" && (
              <span className="route-tag route-unsupported">
                {t("claudeCode.noRoutingSupport", {
                  defaultValue: "不支持路由",
                })}
              </span>
            )}
            {appId === "codex" && provider.category === "official" && (
              <span className="route-tag route-unsupported">
                {t("codex.noRoutingSupport", { defaultValue: "不支持路由" })}
              </span>
            )}
            {isProxyRunning && isInFailoverQueue && health && (
              <ProviderHealthBadge
                consecutiveFailures={health.consecutive_failures}
                isHealthy={health.is_healthy}
                variant="shell"
              />
            )}
            {isAutoFailoverEnabled &&
              isInFailoverQueue &&
              failoverPriority && (
                <FailoverPriorityBadge priority={failoverPriority} />
              )}
            {provider.category === "third_party" && provider.meta?.isPartner && (
              <span title={t("provider.officialPartner", { defaultValue: "官方合作伙伴" })}>
                ⭐
              </span>
            )}
            {isHermesReadOnly && (
              <span className="prov-badge" title={t("provider.managedByHermesHint")}>
                {t("provider.managedByHermes", { defaultValue: "Hermes Managed" })}
              </span>
            )}
          </div>

          {displayUrl && (
            <div className="pmeta">
              <button
                type="button"
                onClick={handleOpenWebsite}
                className={cn(isClickableUrl && "clickable")}
                title={displayUrl}
                disabled={!isClickableUrl}
              >
                {displayUrl}
              </button>
            </div>
          )}
        </div>
        </div>

        <div
          className={cn(
            "health",
          isProxyRunning &&
            isInFailoverQueue &&
            health &&
            !health.is_healthy &&
            "bad",
          !usageEnabled &&
            !officialSubscriptionEnabled &&
            !isCopilot &&
            !isCodexOauth &&
            "dim",
        )}
      >
        {isCopilot ? (
          <CopilotQuotaFooter
            meta={provider.meta}
            inline={true}
            isCurrent={isCurrent}
          />
        ) : isCodexOauth ? (
          <CodexOauthQuotaFooter
            meta={provider.meta}
            inline={true}
            isCurrent={isCurrent}
          />
        ) : isOfficial ? (
          officialSubscriptionEnabled ? (
            <SubscriptionQuotaFooter
              appId={appId}
              inline={true}
              isCurrent={isCurrent}
              autoQueryInterval={
                provider.meta?.usage_script?.autoQueryInterval ?? 0
              }
            />
          ) : null
        ) : hasMultiplePlans ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="inline-flex items-center gap-1 text-xs"
          >
            <span className="h-dot" />
            {t("usage.multiplePlans", {
              count: usage?.data?.length || 0,
              defaultValue: `${usage?.data?.length || 0} 个套餐`,
            })}
            {isExpanded ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
        ) : (
          <UsageFooter
            provider={provider}
            providerId={provider.id}
            appId={appId}
            usageEnabled={usageEnabled}
            isCurrent={isCurrent}
            isInConfig={isInConfig}
            inline={true}
          />
        )}
        </div>
      </div>

      <ProviderActions
        appId={appId}
        isCurrent={isCurrent}
        isInConfig={isInConfig}
        isTesting={isTesting}
        isProxyTakeover={isProxyTakeover}
        isOfficialBlockedByProxy={isOfficialBlockedByProxy}
        isReadOnly={isHermesReadOnly}
        isOmo={isAnyOmo}
        onSwitch={() => onSwitch(provider)}
        onEdit={() => onEdit(provider)}
        onDuplicate={() => onDuplicate(provider)}
        onTest={
          onTest && provider.category !== "official"
            ? () => onTest(provider)
            : undefined
        }
        onConfigureUsage={
          (isOfficial && !supportsOfficialSubscription) ||
          isCopilot ||
          isCodexOauth
            ? undefined
            : () => onConfigureUsage(provider)
        }
        onDelete={() => onDelete(provider)}
        onRemoveFromConfig={
          onRemoveFromConfig ? () => onRemoveFromConfig(provider) : undefined
        }
        onDisableOmo={handleDisableAnyOmo}
        onOpenTerminal={
          onOpenTerminal ? () => onOpenTerminal(provider) : undefined
        }
        isAutoFailoverEnabled={isAutoFailoverEnabled}
        isInFailoverQueue={isInFailoverQueue}
        onToggleFailover={onToggleFailover}
        isDefaultModel={isDefaultModel}
        onSetAsDefault={onSetAsDefault}
        layout="shell"
      />
      </div>

      {isExpanded && hasMultiplePlans && (
        <div className="rounded-[var(--shell-card-radius)] border border-[var(--shell-border)] bg-[var(--shell-bg-surface)] p-4">
          <UsageFooter
            provider={provider}
            providerId={provider.id}
            appId={appId}
            usageEnabled={usageEnabled}
            isCurrent={isCurrent}
            isInConfig={isInConfig}
            inline={false}
          />
        </div>
      )}
    </>
  );
}
