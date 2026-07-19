import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppId } from "@/lib/api";
import { SkillsPageHeader } from "@/components/skills/SkillsPageHeader";
import UnifiedSkillsPanel, {
  type UnifiedSkillsPanelHandle,
} from "@/components/skills/UnifiedSkillsPanel";
import { useScanUnmanagedSkills } from "@/hooks/useSkills";
import { isTextEditableTarget } from "@/utils/domUtils";
import { AppCountBar } from "@/components/common/AppCountBar";
import { SKILLS_APP_IDS } from "@/config/appConfig";

interface SkillsManagementPageProps {
  onOpenDiscovery: () => void;
  currentApp: AppId;
}

export function SkillsManagementPage({
  onOpenDiscovery,
  currentApp,
}: SkillsManagementPageProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<UnifiedSkillsPanelHandle>(null);
  const { data: unmanagedSkills } = useScanUnmanagedSkills({ enabled: true });
  const hasUnmanagedSkills = (unmanagedSkills?.length ?? 0) > 0;

  const [enabledCounts, setEnabledCounts] = useState<Record<AppId, number>>({} as Record<AppId, number>);

  const handleCountsChange = useCallback(
    (_count: number, counts: Record<AppId, number>) => {
      setEnabledCounts(counts);
    },
    [],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "f") {
        if (isTextEditableTarget(document.activeElement)) return;
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="skills-page flex min-h-0 flex-1 flex-col">
      <SkillsPageHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchInputRef={searchInputRef}
        hasUnmanagedSkills={hasUnmanagedSkills}
        onRestore={() => panelRef.current?.openRestoreFromBackup()}
        onZipInstall={() => panelRef.current?.openInstallFromZip()}
        onImport={() => panelRef.current?.openImport()}
        onDiscover={onOpenDiscovery}
      />

      <AppCountBar
        totalLabel={t("mcp.appliedStats", { defaultValue: "已应用" })}
        counts={enabledCounts}
        appIds={SKILLS_APP_IDS}
      />
      <UnifiedSkillsPanel
        ref={panelRef}
        layout="shell"
        searchTerm={searchTerm}
        onOpenDiscovery={onOpenDiscovery}
        currentApp={currentApp}
        onCountsChange={handleCountsChange}
      />
    </div>
  );
}
