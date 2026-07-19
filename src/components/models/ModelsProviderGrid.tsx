import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProviderIcon } from "@/components/ProviderIcon";
import { APP_SWITCHER_LABEL } from "@/config/appConfig";
import { failoverApi } from "@/lib/api/failover";
import type { ModelsProviderEntry } from "@/lib/query/queries";
import type { ModelsAppId } from "@/config/vendorPresets";
import type { Provider } from "@/types";
import { useHermesModelConfig } from "@/hooks/useHermes";
import { useProxyStatus } from "@/hooks/useProxyStatus";
import { isTauriRuntime } from "@/lib/tauri-runtime";
import {
  extractApiBaseUrlFromConfig,
  extractProviderModelId,
  formatHost,
  getPresetInitial,
  resolveDisplayBaseUrl,
} from "@/utils/providerDisplay";
import {
  resolveProviderInUse,
  resolveStoredCurrent,
} from "@/utils/providerInUse";
import {
  ModelCenterCard,
  ModelCenterCardActions,
  ModelCenterCardBadge,
  ModelCenterCardBody,
  ModelCenterCardIcon,
  ModelCenterCardInfo,
  ModelCenterCardRow,
  ModelCenterCardTop,
} from "./ModelCenterCard";

interface ModelsProviderGridProps {
  entries: ModelsProviderEntry[];
  isLoading?: boolean;
  onEdit: (provider: Provider, appId: ModelsAppId) => void;
  onDelete: (provider: Provider, appId: ModelsAppId) => void;
}

export function ModelsProviderGrid({
  entries,
  isLoading = false,
  onEdit,
  onDelete,
}: ModelsProviderGridProps) {
  const { t } = useTranslation();
  const tauriAvailable = isTauriRuntime();
  const { takeoverStatus, status: proxyStatus } = useProxyStatus();
  const { data: hermesModelConfig } = useHermesModelConfig(
    tauriAvailable && entries.some((entry) => entry.appId === "hermes"),
  );

  const appIds = useMemo(
    () => [...new Set(entries.map((entry) => entry.appId))],
    [entries],
  );

  const failoverQueries = useQueries({
    queries: appIds.map((appId) => ({
      queryKey: ["autoFailoverEnabled", appId],
      enabled: tauriAvailable,
      queryFn: () => failoverApi.getAutoFailoverEnabled(appId),
      placeholderData: false as boolean,
    })),
  });

  const failoverEnabledByApp = useMemo(() => {
    const map = new Map<ModelsAppId, boolean>();
    appIds.forEach((appId, index) => {
      map.set(appId, failoverQueries[index]?.data === true);
    });
    return map;
  }, [appIds, failoverQueries]);

  const activeProviderIdByApp = useMemo(() => {
    const map = new Map<string, string>();
    for (const target of proxyStatus?.active_targets ?? []) {
      map.set(target.app_type, target.provider_id);
    }
    return map;
  }, [proxyStatus?.active_targets]);

  if (isLoading) {
    return null;
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <>
      {entries.map(({ provider, appId, isCurrent: storedIsCurrent }) => {
        // entries.isCurrent 来自 getCurrent；Hermes 改以 live model.provider 为准
        const isCurrent = resolveStoredCurrent({
          appId,
          providerId: provider.id,
          storedCurrentId: storedIsCurrent ? provider.id : "",
          hermesCurrentId: hermesModelConfig?.provider,
        });

        const isFailoverModeActive =
          Boolean(takeoverStatus?.[appId]) &&
          failoverEnabledByApp.get(appId) === true;

        const inUse = resolveProviderInUse({
          appId,
          providerId: provider.id,
          isCurrent,
          isFailoverModeActive,
          activeProviderId: activeProviderIdByApp.get(appId),
        });

        const apiUrl = resolveDisplayBaseUrl(
          extractApiBaseUrlFromConfig(provider.settingsConfig),
          provider.websiteUrl,
        );
        const modelId = extractProviderModelId(provider, appId);
        const modelIdText =
          modelId ||
          t("models.modelIdNotConfigured", { defaultValue: "未配置模型 ID" });
        const subtitle = APP_SWITCHER_LABEL[appId];

        return (
          <ModelCenterCard
            key={`${appId}:${provider.id}`}
            data-model={provider.name}
            data-provider-id={provider.id}
            data-app={appId}
          >
            <ModelCenterCardTop>
              <ModelCenterCardIcon>
                {provider.icon ? (
                  <ProviderIcon
                    icon={provider.icon}
                    name={provider.name}
                    color={provider.iconColor}
                    size={18}
                  />
                ) : (
                  getPresetInitial(provider.name)
                )}
              </ModelCenterCardIcon>
              <ModelCenterCardInfo title={provider.name} subtitle={subtitle} />
              <ModelCenterCardBadge status={inUse ? "inUse" : "idle"}>
                {inUse
                  ? t("models.inUse", { defaultValue: "使用中" })
                  : t("models.addedTag", { defaultValue: "未启用" })}
              </ModelCenterCardBadge>
            </ModelCenterCardTop>

            <ModelCenterCardBody>
              <ModelCenterCardRow label="Base URL" value={formatHost(apiUrl)} />
              <ModelCenterCardRow
                label={t("models.modelId", { defaultValue: "模型 ID" })}
                value={modelIdText}
                muted
              />
            </ModelCenterCardBody>

            <ModelCenterCardActions
              itemName={provider.name}
              onEdit={() => onEdit(provider, appId)}
              onDelete={() => onDelete(provider, appId)}
            />
          </ModelCenterCard>
        );
      })}
    </>
  );
}
