import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageSearchField } from "@/components/common/PageSearchField";

export interface PromptsPageHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onAdd: () => void;
}

/** 对齐 ezSphere prompts.html：toolbar + sub */
export function PromptsPageHeader({
  searchTerm,
  onSearchChange,
  searchInputRef,
  onAdd,
}: PromptsPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="toolbar">
        <h1>{t("nav.prompts")}</h1>
        <div className="spacer" />
        <PageSearchField
          id="searchInput"
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t("prompts.searchPlaceholder")}
          inputRef={searchInputRef}
        />
        <Button id="btnAdd" variant="btn-primary" icon={Plus} onClick={onAdd}>
          {t("prompts.addNew")}
        </Button>
      </div>

      <p className="sub">{t("prompts.pageDescription")}</p>
    </>
  );
}
