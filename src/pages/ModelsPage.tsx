import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppId } from "@/lib/api";
import type { Provider, VisibleApps } from "@/types";
import {
  getDefaultModelsAppId,
  isModelsAppId,
  type ModelsAppId,
} from "@/config/vendorPresets";
import type { UniversalProviderPreset } from "@/config/universalProviderPresets";
import { useModelsProvidersQuery } from "@/lib/query";
import { ModelsProviderGrid } from "@/components/models/ModelsProviderGrid";
import { ModelsUniversalGrid } from "@/components/models/ModelsUniversalGrid";
import { ModelsVendorPanel } from "@/components/models/ModelsVendorPanel";

const MODELS_APP_STORAGE_KEY = "ezsphere-last-models-app";

interface ModelsPageProps {
  visibleApps?: VisibleApps;
  isProxyRunning?: boolean;
  onAddVendorPreset: (presetId: string, appId: ModelsAppId) => void;
  onAddCustomProvider: (appId: ModelsAppId) => void;
  onEditProvider: (provider: Provider, appId: ModelsAppId) => void;
  onDeleteProvider: (provider: Provider, appId: ModelsAppId) => void;
}

export function ModelsPage({
  visibleApps,
  isProxyRunning = false,
  onAddVendorPreset,
  onAddCustomProvider,
  onEditProvider,
  onDeleteProvider,
}: ModelsPageProps) {
  const { t } = useTranslation();
  const [modelsAppId, setModelsAppId] = useState<ModelsAppId>(() => {
    const saved = localStorage.getItem(MODELS_APP_STORAGE_KEY) as AppId | null;
    if (saved && isModelsAppId(saved)) {
      return getDefaultModelsAppId(saved, visibleApps);
    }
    return getDefaultModelsAppId("claude", visibleApps);
  });

  const handleSwitchModelsApp = useCallback((appId: ModelsAppId) => {
    localStorage.setItem(MODELS_APP_STORAGE_KEY, appId);
    setModelsAppId(appId);
  }, []);
  const [universalFormOpen, setUniversalFormOpen] = useState(false);
  const [universalPreset, setUniversalPreset] =
    useState<UniversalProviderPreset | null>(null);

  const { entries, isLoading } = useModelsProvidersQuery(visibleApps, {
    isProxyRunning,
  });

  const handleAddUniversalPreset = useCallback(
    (preset: UniversalProviderPreset | null) => {
      setUniversalPreset(preset);
      setUniversalFormOpen(true);
    },
    [],
  );

  return (
    <div className="models-page models-main min-h-0 flex-1 overflow-hidden">
      <div className="models-content">
        <div className="content-head">
          <h1>{t("nav.models")}</h1>
        </div>

        <div className="model-grid">
          <ModelsProviderGrid
            entries={entries}
            isLoading={isLoading}
            onEdit={onEditProvider}
            onDelete={onDeleteProvider}
          />
          <ModelsUniversalGrid
            formOpen={universalFormOpen}
            initialPreset={universalPreset}
            onFormOpenChange={setUniversalFormOpen}
            onPresetConsumed={() => setUniversalPreset(null)}
          />
        </div>
      </div>

      <ModelsVendorPanel
        modelsAppId={modelsAppId}
        onSwitchApp={handleSwitchModelsApp}
        visibleApps={visibleApps}
        onAddVendorPreset={onAddVendorPreset}
        onAddCustomProvider={onAddCustomProvider}
        onAddUniversalPreset={handleAddUniversalPreset}
      />
    </div>
  );
}
