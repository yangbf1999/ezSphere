import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import { type AppId } from "@/lib/api";
import { usePromptActions } from "@/hooks/usePromptActions";
import PromptListItem from "./PromptListItem";
import PromptFormPanel from "./PromptFormPanel";
import { ConfirmDialog } from "../ConfirmDialog";

interface PromptPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: AppId;
  layout?: "default" | "shell";
  searchTerm?: string;
  onPromptCountChange?: (count: number) => void;
  /** 递增时打开新增表单（由页面顶栏「新增提示词」触发） */
  addRequestKey?: number;
}

export interface PromptPanelHandle {
  openAdd: () => void;
}

const PromptPanel = React.forwardRef<PromptPanelHandle, PromptPanelProps>(
  (
    {
      open,
      appId,
      layout = "default",
      searchTerm = "",
      onPromptCountChange,
      addRequestKey = 0,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
      isOpen: boolean;
      titleKey: string;
      messageKey: string;
      messageParams?: Record<string, unknown>;
      onConfirm: (checked: boolean) => void;
    } | null>(null);

    const {
      prompts,
      loading,
      reload,
      savePrompt,
      deletePrompt,
      toggleEnabled,
    } = usePromptActions(appId);

    useEffect(() => {
      if (open) reload();
    }, [open, reload]);

    useEffect(() => {
      const handlePromptImported = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.app === appId) {
          reload();
        }
      };

      window.addEventListener("prompt-imported", handlePromptImported);
      return () => {
        window.removeEventListener("prompt-imported", handlePromptImported);
      };
    }, [appId, reload]);

    const handleAdd = React.useCallback(() => {
      setEditingId(null);
      setIsFormOpen(true);
    }, []);

    React.useImperativeHandle(ref, () => ({
      openAdd: handleAdd,
    }));

    useEffect(() => {
      if (addRequestKey > 0) handleAdd();
    }, [addRequestKey, handleAdd]);

    const handleEdit = (id: string) => {
      setEditingId(id);
      setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
      const prompt = prompts[id];
      setConfirmDialog({
        isOpen: true,
        titleKey: "prompts.confirm.deleteTitle",
        messageKey: "prompts.confirm.deleteMessage",
        messageParams: { name: prompt?.name },
        onConfirm: async (_checked: boolean) => {
          try {
            await deletePrompt(id);
            setConfirmDialog(null);
          } catch {
            // Error handled by hook
          }
        },
      });
    };

    const promptEntries = useMemo(() => Object.entries(prompts), [prompts]);

    const filteredEntries = useMemo(() => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return promptEntries;
      return promptEntries.filter(([_, prompt]) => {
        const haystack = [prompt.name, prompt.description ?? "", prompt.content]
          .join(" ")
          .toLowerCase();
        return haystack.includes(term);
      });
    }, [promptEntries, searchTerm]);

    useEffect(() => {
      onPromptCountChange?.(promptEntries.length);
    }, [promptEntries.length, onPromptCountChange]);

    const enabledPrompt = promptEntries.find(([_, p]) => p.enabled);

    const listContent = loading ? (
      <div
        className={
          layout === "shell"
            ? "prompt-loading"
            : "text-center py-12 text-muted-foreground"
        }
      >
        {t("prompts.loading")}
      </div>
    ) : filteredEntries.length === 0 ? (
      <div
        className={
          layout === "shell" ? "prompt-empty" : "text-center py-12"
        }
      >
        {layout === "shell" && (
          <div className="prompt-empty-icon">
            <FileText size={24} />
          </div>
        )}
        {layout !== "shell" && (
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <FileText size={24} className="text-muted-foreground" />
          </div>
        )}
        <h3
          className={
            layout === "shell"
              ? undefined
              : "text-lg font-medium text-foreground mb-2"
          }
        >
          {searchTerm.trim()
            ? t("prompts.noSearchResults", { defaultValue: "无匹配提示词" })
            : t("prompts.empty")}
        </h3>
        <p className={layout === "shell" ? undefined : "text-muted-foreground text-sm"}>
          {searchTerm.trim()
            ? t("prompts.noSearchResultsHint", {
                defaultValue: "尝试更换搜索关键词",
              })
            : t("prompts.emptyDescription")}
        </p>
      </div>
    ) : (
      <div className={layout === "shell" ? "prompt-list" : "space-y-3"}>
        {filteredEntries.map(([id, prompt]) => (
          <PromptListItem
            key={id}
            id={id}
            prompt={prompt}
            appId={appId}
            layout={layout}
            onToggle={toggleEnabled}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );

    if (layout === "shell") {
      return (
        <>
          {listContent}

          {isFormOpen && (
            <PromptFormPanel
              key={editingId ?? "new"}
              appId={appId}
              editingId={editingId || undefined}
              initialData={editingId ? prompts[editingId] : undefined}
              onSave={savePrompt}
              onClose={() => setIsFormOpen(false)}
            />
          )}

          {confirmDialog && (
            <ConfirmDialog
              isOpen={confirmDialog.isOpen}
              title={t(confirmDialog.titleKey)}
              message={t(confirmDialog.messageKey, confirmDialog.messageParams)}
              onConfirm={confirmDialog.onConfirm}
              onCancel={() => setConfirmDialog(null)}
            />
          )}
        </>
      );
    }

    return (
      <div className="flex flex-col flex-1 min-h-0 px-6">
        <div className="flex-shrink-0 py-4 glass rounded-xl border border-white/10 mb-4 px-6">
          <div className="text-sm text-muted-foreground">
            {t("prompts.count", { count: promptEntries.length })} ·{" "}
            {enabledPrompt
              ? t("prompts.enabledName", { name: enabledPrompt[1].name })
              : t("prompts.noneEnabled")}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-16">{listContent}</div>

        {isFormOpen && (
          <PromptFormPanel
            key={editingId ?? "new"}
            appId={appId}
            editingId={editingId || undefined}
            initialData={editingId ? prompts[editingId] : undefined}
            onSave={savePrompt}
            onClose={() => setIsFormOpen(false)}
          />
        )}

        {confirmDialog && (
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={t(confirmDialog.titleKey)}
            message={t(confirmDialog.messageKey, confirmDialog.messageParams)}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(null)}
          />
        )}
      </div>
    );
  },
);

PromptPanel.displayName = "PromptPanel";

export default PromptPanel;
