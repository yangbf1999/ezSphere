import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link2 } from "lucide-react";
import { McpPageHeader } from "@/components/mcp/McpPageHeader";
import UnifiedMcpPanel, {
  type UnifiedMcpPanelHandle,
} from "@/components/mcp/UnifiedMcpPanel";
import { isTextEditableTarget } from "@/utils/domUtils";

interface McpManagementPageProps {
  onOpenChange?: (open: boolean) => void;
}

export function McpManagementPage({ onOpenChange }: McpManagementPageProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<UnifiedMcpPanelHandle>(null);

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
    <div className="mcp-page flex min-h-0 flex-1 flex-col">
      <McpPageHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchInputRef={searchInputRef}
        onImport={() => panelRef.current?.openImport()}
        onAdd={() => panelRef.current?.openAdd()}
      />

      <UnifiedMcpPanel
        ref={panelRef}
        layout="shell"
        searchTerm={searchTerm}
        onOpenChange={onOpenChange ?? (() => {})}
      />

    
    </div>
  );
}
