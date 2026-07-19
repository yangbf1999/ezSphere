import { ChevronRight, Clock, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ProviderIcon } from "@/components/ProviderIcon";
import type { SessionMeta } from "@/types";
import {
  formatRelativeTime,
  formatSessionTitle,
  getProviderIconName,
  getProviderLabel,
  getSessionKey,
  highlightText,
} from "./utils";

interface SessionItemProps {
  session: SessionMeta;
  isSelected: boolean;
  selectionMode: boolean;
  isChecked: boolean;
  isCheckDisabled?: boolean;
  searchQuery?: string;
  layout?: "default" | "shell";
  onSelect: (key: string) => void;
  onToggleChecked: (checked: boolean) => void;
  onDelete?: () => void;
}

export function SessionItem({
  session,
  isSelected,
  selectionMode,
  isChecked,
  isCheckDisabled = false,
  searchQuery,
  layout = "shell",
  onSelect,
  onToggleChecked,
  onDelete,
}: SessionItemProps) {
  const { t } = useTranslation();
  const title = formatSessionTitle(session);
  const lastActive = session.lastActiveAt || session.createdAt || undefined;
  const sessionKey = getSessionKey(session);
  const providerLabel = getProviderLabel(session.providerId, t);
  const preview = session.summary?.trim();

  if (layout === "shell") {
    return (
      <div className={cn("sess", isSelected && "active")}>
        <div className="sess-row">
          {selectionMode && (
            <div className="sess-check">
              <Checkbox
                checked={isChecked}
                disabled={isCheckDisabled}
                aria-label={t("sessionManager.selectForBatch", {
                  defaultValue: "选择会话",
                })}
                onCheckedChange={(checked) => onToggleChecked(Boolean(checked))}
              />
            </div>
          )}
          <button
            type="button"
            onClick={() => onSelect(sessionKey)}
            className="sess-main"
          >
            <div className="t">
              <span className="sess-title">
                {searchQuery ? highlightText(title, searchQuery) : title}
              </span>
              <span className="src">{providerLabel}</span>
            </div>
            {preview ? (
              <div className="m">
                {searchQuery ? highlightText(preview, searchQuery) : preview}
              </div>
            ) : null}
            <div className="meta">
              <span>
                {lastActive
                  ? formatRelativeTime(lastActive, t)
                  : t("common.unknown")}
              </span>
            </div>
          </button>
          {onDelete && session.sourcePath ? (
            <button
              type="button"
              className="btn-del icon-btn del"
              title={t("sessionManager.deleteTooltip", {
                defaultValue: "永久删除此本地会话记录",
              })}
              aria-label={t("sessionManager.delete", {
                defaultValue: "删除",
              })}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  /* 原 default 列表样式保留 */
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2.5 transition-all group",
        isSelected
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/60 border border-transparent",
      )}
    >
      {selectionMode && (
        <div className="shrink-0 pt-0.5">
          <Checkbox
            checked={isChecked}
            disabled={isCheckDisabled}
            aria-label={t("sessionManager.selectForBatch", {
              defaultValue: "选择会话",
            })}
            onCheckedChange={(checked) => onToggleChecked(Boolean(checked))}
          />
        </div>
      )}
      <button
        type="button"
        onClick={() => onSelect(sessionKey)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2 mb-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0">
                <ProviderIcon
                  icon={getProviderIconName(session.providerId)}
                  name={session.providerId}
                  size={18}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {getProviderLabel(session.providerId, t)}
            </TooltipContent>
          </Tooltip>
          <span className="text-sm font-medium line-clamp-2 flex-1">
            {searchQuery ? highlightText(title, searchQuery) : title}
          </span>
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground/50 shrink-0 transition-transform",
              isSelected && "text-primary rotate-90",
            )}
          />
        </div>

        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          <span>
            {lastActive
              ? formatRelativeTime(lastActive, t)
              : t("common.unknown")}
          </span>
        </div>
      </button>
    </div>
  );
}
