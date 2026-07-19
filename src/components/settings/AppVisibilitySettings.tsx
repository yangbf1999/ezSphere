import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { ProviderIcon } from "@/components/ProviderIcon";
import { ToggleRow } from "@/components/ui/toggle-row";
import type { SettingsFormState } from "@/hooks/useSettings";
import type { VisibleApps } from "@/types";
import type { AppId } from "@/lib/api";

interface AppVisibilitySettingsProps {
  settings: SettingsFormState;
  onChange: (updates: Partial<SettingsFormState>) => void;
}

const APP_CONFIG: Array<{
  id: AppId;
  icon: string;
  nameKey: string;
  descriptionKey?: string;
}> = [
  {
    id: "claude",
    icon: "claude",
    nameKey: "apps.claudeCode",
    descriptionKey: "settings.appVisibility.claudeDesc",
  },
  {
    id: "claude-desktop",
    icon: "claude",
    nameKey: "apps.claudeDesktop",
  },
  {
    id: "codex",
    icon: "openai",
    nameKey: "apps.codex",
    descriptionKey: "settings.appVisibility.codexDesc",
  },
  {
    id: "gemini",
    icon: "gemini",
    nameKey: "apps.gemini",
    descriptionKey: "settings.appVisibility.geminiDesc",
  },
  {
    id: "opencode",
    icon: "opencode",
    nameKey: "apps.opencode",
    descriptionKey: "settings.appVisibility.opencodeDesc",
  },
  { id: "openclaw", icon: "openclaw", nameKey: "apps.openclaw" },
  { id: "hermes", icon: "hermes", nameKey: "apps.hermes" },
];

export function AppVisibilitySettings({
  settings,
  onChange,
}: AppVisibilitySettingsProps) {
  const { t } = useTranslation();

  const visibleApps: VisibleApps = settings.visibleApps ?? {
    claude: true,
    "claude-desktop": true,
    codex: true,
    gemini: true,
    opencode: true,
    openclaw: true,
    hermes: true,
  };

  // Count how many apps are currently visible
  const visibleCount = Object.values(visibleApps).filter(Boolean).length;

  const handleToggle = (appId: AppId) => {
    const isCurrentlyVisible = visibleApps[appId];
    // Prevent disabling the last visible app
    if (isCurrentlyVisible && visibleCount <= 1) return;

    onChange({
      visibleApps: {
        ...visibleApps,
        [appId]: !isCurrentlyVisible,
      },
    });
  };

  return (
    <section className="card section">
      <header className="card-header section-head">
        <Eye className="sec-ic" aria-hidden />
        <div>
          <h3>{t("settings.appVisibility.title")}</h3>
          <p className="sec-desc">
            {t("settings.appVisibility.description")}
          </p>
        </div>
      </header>
      <div>
        {APP_CONFIG.map((app) => {
          const isVisible = visibleApps[app.id];
          // Disable button if this is the last visible app
          const isDisabled = isVisible && visibleCount <= 1;
          const name = t(app.nameKey);

          return (
            <ToggleRow
              key={app.id}
              icon={<ProviderIcon icon={app.icon} name={name} size={14} />}
              title={name}
              description={
                app.descriptionKey
                  ? t(app.descriptionKey, { defaultValue: name })
                  : name
              }
              checked={isVisible}
              disabled={isDisabled}
              onCheckedChange={() => handleToggle(app.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
