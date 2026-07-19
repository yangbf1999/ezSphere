import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProviderIcon } from "@/components/ProviderIcon";
import { UniversalProviderFormModal } from "@/components/universal/UniversalProviderFormModal";
import { providersApi, universalProvidersApi } from "@/lib/api";
import { failoverApi } from "@/lib/api/failover";
import type { UniversalProvider, UniversalProvidersMap } from "@/types";
import type { UniversalProviderPreset } from "@/config/universalProviderPresets";
import { useProxyStatus } from "@/hooks/useProxyStatus";
import { isTauriRuntime } from "@/lib/tauri-runtime";
import {
  getUniversalSyncedProviderId,
  UNIVERSAL_SYNC_APP_IDS,
  type UniversalSyncAppId,
} from "@/utils/providerDisplay";
import { resolveProviderInUse } from "@/utils/providerInUse";
import { compareProvidersByCreatedAt } from "@/utils/providerSort";
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

function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "U";
}

function formatHost(url?: string): string {
  if (!url) return "-";
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

interface ModelsUniversalGridProps {
  formOpen: boolean;
  initialPreset: UniversalProviderPreset | null;
  onFormOpenChange: (open: boolean) => void;
  onPresetConsumed: () => void;
}

export function ModelsUniversalGrid({
  formOpen,
  initialPreset,
  onFormOpenChange,
  onPresetConsumed,
}: ModelsUniversalGridProps) {
  const { t } = useTranslation();
  const tauriAvailable = isTauriRuntime();
  const { takeoverStatus, status: proxyStatus } = useProxyStatus();
  const [providers, setProviders] = useState<UniversalProvidersMap>({});
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] =
    useState<UniversalProvider | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });

  const providerQueries = useQueries({
    queries: UNIVERSAL_SYNC_APP_IDS.map((appId) => ({
      queryKey: ["providers", appId],
      enabled: tauriAvailable,
      placeholderData: keepPreviousData,
      queryFn: async () => {
        let list: Record<string, unknown> = {};
        let currentProviderId = "";
        try {
          list = await providersApi.getAll(appId);
        } catch (error) {
          console.error("获取模型列表失败:", error);
        }
        try {
          currentProviderId = await providersApi.getCurrent(appId);
        } catch (error) {
          console.error("获取当前模型失败:", error);
        }
        return { providers: list, currentProviderId };
      },
    })),
  });

  const failoverQueries = useQueries({
    queries: UNIVERSAL_SYNC_APP_IDS.map((appId) => ({
      queryKey: ["autoFailoverEnabled", appId],
      enabled: tauriAvailable,
      queryFn: () => failoverApi.getAutoFailoverEnabled(appId),
      placeholderData: false as boolean,
    })),
  });

  const currentProviderIdByApp = useMemo(() => {
    const map = new Map<UniversalSyncAppId, string>();
    UNIVERSAL_SYNC_APP_IDS.forEach((appId, index) => {
      map.set(appId, providerQueries[index]?.data?.currentProviderId ?? "");
    });
    return map;
  }, [providerQueries]);

  const failoverEnabledByApp = useMemo(() => {
    const map = new Map<UniversalSyncAppId, boolean>();
    UNIVERSAL_SYNC_APP_IDS.forEach((appId, index) => {
      map.set(appId, failoverQueries[index]?.data === true);
    });
    return map;
  }, [failoverQueries]);

  const activeProviderIdByApp = useMemo(() => {
    const map = new Map<string, string>();
    for (const target of proxyStatus?.active_targets ?? []) {
      map.set(target.app_type, target.provider_id);
    }
    return map;
  }, [proxyStatus?.active_targets]);

  const isUniversalInUse = useCallback(
    (provider: UniversalProvider) => {
      return UNIVERSAL_SYNC_APP_IDS.some((appId) => {
        if (!provider.apps[appId]) return false;
        const syncedId = getUniversalSyncedProviderId(provider.id, appId);
        const isCurrent = syncedId === currentProviderIdByApp.get(appId);
        const isFailoverModeActive =
          Boolean(takeoverStatus?.[appId]) &&
          failoverEnabledByApp.get(appId) === true;
        return resolveProviderInUse({
          appId,
          providerId: syncedId,
          isCurrent,
          isFailoverModeActive,
          activeProviderId: activeProviderIdByApp.get(appId),
        });
      });
    },
    [
      activeProviderIdByApp,
      currentProviderIdByApp,
      failoverEnabledByApp,
      takeoverStatus,
    ],
  );

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await universalProvidersApi.getAll();
      setProviders(data);
    } catch (error) {
      console.error("Failed to load universal providers:", error);
      toast.error(
        t("universalProvider.loadError", {
          defaultValue: "加载统一API网关失败",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (formOpen && initialPreset) {
      setEditingProvider(null);
    }
  }, [formOpen, initialPreset]);

  const handleSave = useCallback(
    async (provider: UniversalProvider) => {
      try {
        await universalProvidersApi.upsert(provider);
        if (!editingProvider) {
          await universalProvidersApi.sync(provider.id);
        }
        toast.success(
          editingProvider
            ? t("universalProvider.updated", {
                defaultValue: "统一API网关已更新",
              })
            : t("universalProvider.addedAndSynced", {
                defaultValue: "统一API网关已添加并同步",
              }),
        );
        loadProviders();
        setEditingProvider(null);
        onFormOpenChange(false);
        onPresetConsumed();
      } catch (error) {
        console.error("Failed to save universal provider:", error);
        toast.error(
          t("universalProvider.saveError", {
            defaultValue: "保存统一API网关失败",
          }),
        );
      }
    },
    [
      editingProvider,
      loadProviders,
      onFormOpenChange,
      onPresetConsumed,
      t,
    ],
  );

  const handleSaveAndSync = useCallback(
    async (provider: UniversalProvider) => {
      try {
        await universalProvidersApi.upsert(provider);
        await universalProvidersApi.sync(provider.id);
        toast.success(
          t("universalProvider.savedAndSynced", {
            defaultValue: "已保存并同步到所有应用",
          }),
        );
        loadProviders();
        setEditingProvider(null);
        onFormOpenChange(false);
        onPresetConsumed();
      } catch (error) {
        console.error("Failed to save and sync universal provider:", error);
        toast.error(
          t("universalProvider.saveAndSyncError", {
            defaultValue: "保存并同步失败",
          }),
        );
      }
    },
    [loadProviders, onFormOpenChange, onPresetConsumed, t],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm.id) return;
    try {
      await universalProvidersApi.delete(deleteConfirm.id);
      toast.success(
        t("universalProvider.deleted", { defaultValue: "统一API网关已删除" }),
      );
      loadProviders();
    } catch (error) {
      console.error("Failed to delete universal provider:", error);
      toast.error(
        t("universalProvider.deleteError", {
          defaultValue: "删除统一API网关失败",
        }),
      );
    } finally {
      setDeleteConfirm({ open: false, id: "", name: "" });
    }
  }, [deleteConfirm.id, loadProviders, t]);

  const providerList = Object.values(providers).sort(compareProvidersByCreatedAt);

  if (loading) {
    return null;
  }

  return (
    <>
      {providerList.map((provider) => {
        const enabledApps = [
          provider.apps.claude ? "Claude" : null,
          provider.apps.codex ? "Codex" : null,
         // provider.apps.gemini ? "Gemini" : null,
        ].filter((app): app is string => app !== null);
        const inUse = isUniversalInUse(provider);

        return (
          <ModelCenterCard key={provider.id} data-model={provider.name}>
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
                  getInitial(provider.name)
                )}
              </ModelCenterCardIcon>
              <ModelCenterCardInfo
                title={provider.name}
                subtitle={t("models.universalTag", { defaultValue: "统一" })}
              />
              <ModelCenterCardBadge status={inUse ? "inUse" : "idle"}>
                {inUse
                  ? t("models.inUse", { defaultValue: "使用中" })
                  : t("models.addedTag", { defaultValue: "未启用" })}
              </ModelCenterCardBadge>
            </ModelCenterCardTop>
            <ModelCenterCardBody>
              <ModelCenterCardRow label="Base URL" value={formatHost(provider.baseUrl)} />
              <ModelCenterCardRow
                label={t("models.syncApps", { defaultValue: "同步" })}
                value={enabledApps.length > 0 ? enabledApps.join(" · ") : "-"}
              />
            </ModelCenterCardBody>
            <ModelCenterCardActions
              itemName={provider.name}
              onEdit={() => {
                setEditingProvider(provider);
                onFormOpenChange(true);
              }}
              onDelete={() =>
                setDeleteConfirm({
                  open: true,
                  id: provider.id,
                  name: provider.name,
                })
              }
            />
          </ModelCenterCard>
        );
      })}

      <UniversalProviderFormModal
        isOpen={formOpen}
        onClose={() => {
          onFormOpenChange(false);
          setEditingProvider(null);
          onPresetConsumed();
        }}
        onSave={handleSave}
        onSaveAndSync={handleSaveAndSync}
        editingProvider={editingProvider}
        initialPreset={editingProvider ? null : initialPreset}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title={t("universalProvider.deleteConfirmTitle", {
          defaultValue: "删除统一API网关",
        })}
        message={t("universalProvider.deleteConfirmDescription", {
          defaultValue: `确定要删除 "${deleteConfirm.name}" 吗？这将同时删除它在各应用中生成的API网关配置。`,
          name: deleteConfirm.name,
        })}
        confirmText={t("common.delete", { defaultValue: "删除" })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: "", name: "" })}
      />
    </>
  );
}
