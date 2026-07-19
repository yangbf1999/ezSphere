import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  settingsApi,
  type RectifierConfig,
  type OptimizerConfig,
} from "@/lib/api/settings";

interface SettingsSwitchRowProps {
  title: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingsSwitchRow({
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: SettingsSwitchRowProps) {
  return (
    <div className={`setting-row row${disabled ? " is-disabled" : ""}`}>
      <div className="setting-info row-text">
        <div>
          <h4 className="rt-title">{title}</h4>
          {description ? <p className="rt-desc">{description}</p> : null}
        </div>
      </div>
      <div className="setting-action row-ctrl">
        <Switch
          className="switch"
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
          aria-label={title}
        />
      </div>
    </div>
  );
}

export function RectifierConfigPanel() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<RectifierConfig>({
    enabled: true,
    requestThinkingSignature: true,
    requestThinkingBudget: true,
    requestMediaFallback: true,
    requestMediaHeuristic: true,
  });
  const [optimizerConfig, setOptimizerConfig] = useState<OptimizerConfig>({
    enabled: false,
    thinkingOptimizer: true,
    cacheInjection: true,
    cacheTtl: "1h",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .getRectifierConfig()
      .then(setConfig)
      .catch((e) => console.error("Failed to load rectifier config:", e))
      .finally(() => setIsLoading(false));
    settingsApi
      .getOptimizerConfig()
      .then(setOptimizerConfig)
      .catch((e) => console.error("Failed to load optimizer config:", e));
  }, []);

  const handleChange = async (updates: Partial<RectifierConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    try {
      await settingsApi.setRectifierConfig(newConfig);
    } catch (e) {
      console.error("Failed to save rectifier config:", e);
      toast.error(String(e));
      setConfig(config);
    }
  };

  const handleOptimizerChange = async (updates: Partial<OptimizerConfig>) => {
    const newConfig = { ...optimizerConfig, ...updates };
    setOptimizerConfig(newConfig);
    try {
      await settingsApi.setOptimizerConfig(newConfig);
    } catch (e) {
      console.error("Failed to save optimizer config:", e);
      toast.error(String(e));
      setOptimizerConfig(optimizerConfig);
    }
  };

  if (isLoading) return null;

  return (
    <div className="settings-row-group">
      <SettingsSwitchRow
        title={t("settings.advanced.rectifier.enabled")}
        description={t("settings.advanced.rectifier.enabledDescription")}
        checked={config.enabled}
        onCheckedChange={(checked) => handleChange({ enabled: checked })}
      />

      <div className="settings-subsection-title">
        {t("settings.advanced.rectifier.requestGroup")}
      </div>
      <SettingsSwitchRow
        title={t("settings.advanced.rectifier.thinkingSignature")}
        description={t(
          "settings.advanced.rectifier.thinkingSignatureDescription",
        )}
        checked={config.requestThinkingSignature}
        disabled={!config.enabled}
        onCheckedChange={(checked) =>
          handleChange({ requestThinkingSignature: checked })
        }
      />
      <SettingsSwitchRow
        title={t("settings.advanced.rectifier.thinkingBudget")}
        description={t("settings.advanced.rectifier.thinkingBudgetDescription")}
        checked={config.requestThinkingBudget}
        disabled={!config.enabled}
        onCheckedChange={(checked) =>
          handleChange({ requestThinkingBudget: checked })
        }
      />
      <SettingsSwitchRow
        title={t("settings.advanced.rectifier.mediaFallback")}
        description={t("settings.advanced.rectifier.mediaFallbackDescription")}
        checked={config.requestMediaFallback}
        disabled={!config.enabled}
        onCheckedChange={(checked) =>
          handleChange({ requestMediaFallback: checked })
        }
      />
      <SettingsSwitchRow
        title={t("settings.advanced.rectifier.mediaHeuristic")}
        description={t("settings.advanced.rectifier.mediaHeuristicDescription")}
        checked={config.requestMediaHeuristic}
        disabled={!config.enabled || !config.requestMediaFallback}
        onCheckedChange={(checked) =>
          handleChange({ requestMediaHeuristic: checked })
        }
      />

      <div className="settings-subsection-title settings-subsection-title--separated">
        <span>{t("settings.advanced.optimizer.title")}</span>
        <small>{t("settings.advanced.optimizer.description")}</small>
      </div>
      <SettingsSwitchRow
        title={t("settings.advanced.optimizer.enabled")}
        checked={optimizerConfig.enabled}
        onCheckedChange={(checked) =>
          handleOptimizerChange({ enabled: checked })
        }
      />
      <SettingsSwitchRow
        title={t("settings.advanced.optimizer.thinkingOptimizer")}
        description={t(
          "settings.advanced.optimizer.thinkingOptimizerDescription",
        )}
        checked={optimizerConfig.thinkingOptimizer}
        disabled={!optimizerConfig.enabled}
        onCheckedChange={(checked) =>
          handleOptimizerChange({ thinkingOptimizer: checked })
        }
      />
      <SettingsSwitchRow
        title={t("settings.advanced.optimizer.cacheInjection")}
        description={t("settings.advanced.optimizer.cacheInjectionDescription")}
        checked={optimizerConfig.cacheInjection}
        disabled={!optimizerConfig.enabled}
        onCheckedChange={(checked) =>
          handleOptimizerChange({ cacheInjection: checked })
        }
      />

      {optimizerConfig.cacheInjection && (
        <div
          className={`setting-row row${
            !optimizerConfig.enabled ? " is-disabled" : ""
          }`}
        >
          <div className="setting-info row-text">
            <div>
              <h4 className="rt-title">
                {t("settings.advanced.optimizer.cacheTtl")}
              </h4>
            </div>
          </div>
          <div className="setting-action row-ctrl">
            <select
              className="sel settings-select-sm"
              value={optimizerConfig.cacheTtl}
              disabled={
                !optimizerConfig.enabled || !optimizerConfig.cacheInjection
              }
              onChange={(e) =>
                handleOptimizerChange({ cacheTtl: e.target.value })
              }
              aria-label={t("settings.advanced.optimizer.cacheTtl")}
            >
              <option value="5m">
                {t("settings.advanced.optimizer.cacheTtl5m")}
              </option>
              <option value="1h">
                {t("settings.advanced.optimizer.cacheTtl1h")}
              </option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
