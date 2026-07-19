import { useEffect, useRef, useState } from "react";
import type { AppId } from "@/lib/api";
import type { VisibleApps } from "@/types";
import { AppSwitcher } from "@/components/AppSwitcher";
import { PromptsPageHeader } from "@/components/prompts/PromptsPageHeader";
import PromptPanel, {
  type PromptPanelHandle,
} from "@/components/prompts/PromptPanel";
import { isTextEditableTarget } from "@/utils/domUtils";

const PROMPT_APP_IDS: AppId[] = [
  "claude",
  "codex",
  "gemini",
  "opencode",
  "openclaw",
  "hermes",
];

function isPromptApp(app: AppId): boolean {
  return PROMPT_APP_IDS.includes(app);
}

interface PromptsPageProps {
  appId: AppId;
  onSwitchApp: (app: AppId) => void;
  visibleApps?: VisibleApps;
}

export function PromptsPage({
  appId,
  onSwitchApp,
  visibleApps,
}: PromptsPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [promptCount, setPromptCount] = useState(0);
  const [addRequestKey, setAddRequestKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const promptPanelRef = useRef<PromptPanelHandle>(null);

  const promptAppId: AppId = appId === "claude-desktop" ? "claude" : appId;
  const tabAppId: AppId = isPromptApp(appId) ? appId : "claude";

  useEffect(() => {
    if (!isPromptApp(appId)) {
      const first = PROMPT_APP_IDS.find((app) => visibleApps?.[app] !== false);
      if (first) onSwitchApp(first);
    }
  }, [appId, onSwitchApp, visibleApps]);

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
    <div className="prompts-page flex min-h-0 flex-1 flex-col">
      <PromptsPageHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchInputRef={searchInputRef}
        onAdd={() => setAddRequestKey((k) => k + 1)}
      />

      <AppSwitcher
        activeApp={tabAppId}
        onSwitch={onSwitchApp}
        visibleApps={visibleApps}
        variant="prompt-tabs"
        appFilter={isPromptApp}
        activeCount={promptCount}
      />

      <PromptPanel
        ref={promptPanelRef}
        open
        onOpenChange={() => {}}
        appId={promptAppId}
        layout="shell"
        searchTerm={searchTerm}
        onPromptCountChange={setPromptCount}
        addRequestKey={addRequestKey}
      />
    </div>
  );
}

export { PROMPT_APP_IDS, isPromptApp };
