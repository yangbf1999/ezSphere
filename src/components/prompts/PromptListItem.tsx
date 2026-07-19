import React from "react";
import { useTranslation } from "react-i18next";
import { Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppId, Prompt } from "@/lib/api";
import { formatRelativeTime } from "@/components/sessions/utils";
import PromptToggle from "./PromptToggle";

interface PromptListItemProps {
  id: string;
  prompt: Prompt;
  appId: AppId;
  layout?: "default" | "shell";
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const PROMPT_FILENAME: Record<AppId, string> = {
  claude: "CLAUDE.md",
  "claude-desktop": "CLAUDE.md",
  codex: "AGENTS.md",
  gemini: "GEMINI.md",
  opencode: "AGENTS.md",
  openclaw: "AGENTS.md",
  hermes: "AGENTS.md",
};

function formatPromptMeta(
  prompt: Prompt,
  appId: AppId,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const filename = PROMPT_FILENAME[appId] ?? "AGENTS.md";
  const sizeKb = (new Blob([prompt.content]).size / 1024).toFixed(1);
  const parts = [`${filename} · ${sizeKb} KB`];
  if (prompt.updatedAt) {
    const relative = formatRelativeTime(prompt.updatedAt * 1000, t);
    if (relative) {
      parts.push(relative);
    }
  }
  return parts.join(" · ");
}

const PromptListItem: React.FC<PromptListItemProps> = ({
  id,
  prompt,
  appId,
  layout = "default",
  onToggle,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const enabled = prompt.enabled === true;

  if (layout === "shell") {
    const meta =
      prompt.description?.trim() ||
      formatPromptMeta(prompt, appId, t);

    return (
      <div className="prompt-item">
        <div className="prompt-info">
          <div className="prompt-name">{prompt.name}</div>
          <div className="prompt-meta">{meta}</div>
        </div>
        <PromptToggle
          enabled={enabled}
          onChange={(newEnabled) => onToggle(id, newEnabled)}
          layout="shell"
          promptName={prompt.name}
        />
        <div className="prompt-actions">
          <Button
            type="button"
            variant="prompt-icon"
            icon={Edit3}
            onClick={() => onEdit(id)}
            title={t("common.edit")}
            aria-label={`${t("common.edit")} ${prompt.name}`}
          />
          <Button
            type="button"
            variant="prompt-icon-danger"
            icon={Trash2}
            onClick={() => onDelete(id)}
            title={t("common.delete")}
            aria-label={`${t("common.delete")} ${prompt.name}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative h-16 rounded-xl border border-border-default bg-muted/50 p-4 transition-all duration-300 hover:bg-muted hover:border-border-default/80 hover:shadow-sm">
      <div className="flex items-center gap-4 h-full">
        <div className="flex-shrink-0">
          <PromptToggle
            enabled={enabled}
            onChange={(newEnabled) => onToggle(id, newEnabled)}
            promptName={prompt.name}
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1">{prompt.name}</h3>
          {prompt.description && (
            <p className="text-sm text-muted-foreground truncate">
              {prompt.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(id)}
            title={t("common.edit")}
            aria-label={`${t("common.edit")} ${prompt.name}`}
          >
            <Edit3 size={16} aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(id)}
            className="hover:text-red-500 hover:bg-red-100 dark:hover:text-red-400 dark:hover:bg-red-500/10"
            title={t("common.delete")}
            aria-label={`${t("common.delete")} ${prompt.name}`}
          >
            <Trash2 size={16} aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptListItem;
