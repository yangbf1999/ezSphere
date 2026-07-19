import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Archive, Download, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSearchField } from "@/components/common/PageSearchField";

export interface SkillsPageHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  hasUnmanagedSkills?: boolean;
  onRestore: () => void;
  onZipInstall: () => void;
  onImport: () => void;
  onDiscover: () => void;
}

/** 对齐 ezSphere skills.html：toolbar + sub */
export function SkillsPageHeader({
  searchTerm,
  onSearchChange,
  searchInputRef,
  hasUnmanagedSkills,
  onRestore,
  onZipInstall,
  onImport,
  onDiscover: _onDiscover,
}: SkillsPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="toolbar">
        <h1>{t("nav.skills")}</h1>
        <div className="spacer" />
        <PageSearchField
          id="skillsSearchInput"
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t("skills.searchPlaceholder")}
          inputRef={searchInputRef}
        />
        <Button
          id="btnRestoreBackup"
          variant="btn"
          icon={FolderOpen}
          onClick={onRestore}
        >
          {t("skills.restoreFromBackup.button")}
        </Button>
        <Button id="btnZipInstall" variant="btn" icon={Archive} onClick={onZipInstall}>
          {t("skills.installFromZip.button")}
        </Button>
        <Button
          id="btnImportExisting"
          variant="btn"
          icon={Download}
          showDot={hasUnmanagedSkills}
          onClick={onImport}
          title={
            hasUnmanagedSkills
              ? t("skills.unmanagedAvailable")
              : undefined
          }
        >
          {t("skills.import")}
        </Button>
        {/*暂时影藏发现按钮*/}
        {/*<Button id="btnDiscover" variant="btn-primary" icon={SearchIcon} onClick={onDiscover}>
          {t("skills.discover")}
        </Button>*/}
      </div>

      <p className="sub">{t("skills.description")}</p>
    </>
  );
}
