import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSearchField } from "@/components/common/PageSearchField";

export interface McpPageHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onImport: () => void;
  onAdd: () => void;
}

/** 对齐 ezSphere mcp.html：toolbar + sub */
export function McpPageHeader({
  searchTerm,
  onSearchChange,
  searchInputRef,
  onImport,
  onAdd,
}: McpPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="toolbar">
        <h1>{t("nav.mcp")}</h1>
        <div className="spacer" />
        <PageSearchField
          id="mcpSearchInput"
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t("mcp.searchPlaceholder")}
          inputRef={searchInputRef}
        />
        <Button id="btnMcpImport" variant="btn" icon={Download} onClick={onImport}>
          {t("mcp.importExisting")}
        </Button>
        <Button
          id="btnAddMcp"
          variant="btn-primary"
          icon={Plus}
          onClick={onAdd}
        >
          {t("mcp.addMcp")}
        </Button>
      </div>

      <p className="sub">{t("mcp.pageDescription")}</p>
    </>
  );
}
