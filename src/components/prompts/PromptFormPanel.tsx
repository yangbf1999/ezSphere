import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogHeaderText,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MarkdownEditor from "@/components/MarkdownEditor";
import type { Prompt, AppId } from "@/lib/api";

interface PromptFormPanelProps {
  appId: AppId;
  editingId?: string;
  initialData?: Prompt;
  onSave: (id: string, prompt: Prompt) => Promise<void>;
  onClose: () => void;
}

const PromptFormPanel: React.FC<PromptFormPanelProps> = ({
  appId,
  editingId,
  initialData,
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();
  const appName = t(`apps.${appId}`);
  const filenameMap: Record<AppId, string> = {
    claude: "CLAUDE.md",
    "claude-desktop": "CLAUDE.md",
    codex: "AGENTS.md",
    gemini: "GEMINI.md",
    opencode: "AGENTS.md",
    openclaw: "AGENTS.md",
    hermes: "AGENTS.md",
  };
  const filename = filenameMap[appId];
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setContent(initialData.content);
    } else {
      setName("");
      setDescription("");
      setContent("");
    }
  }, [initialData, editingId]);

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    setSaving(true);
    try {
      const id = editingId || `prompt-${Date.now()}`;
      const timestamp = Math.floor(Date.now() / 1000);
      const prompt: Prompt = {
        id,
        name: name.trim(),
        description: description.trim() || undefined,
        content: content.trim(),
        enabled: initialData?.enabled || false,
        createdAt: initialData?.createdAt || timestamp,
        updatedAt: timestamp,
      };
      await onSave(id, prompt);
      onClose();
    } catch (error) {
      // Error handled by hook
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editingId;
  const title = isEdit
    ? t("prompts.editTitle", { appName })
    : t("prompts.addTitle", { appName });

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        size="default"
        className="[&_.ez-modal-content__inner]:min-h-[min(560px,85vh)]"
      >
        <DialogHeader>
          <DialogHeaderText>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? t("prompts.editDescription", {
                    defaultValue: `修改 ${filename} 提示词配置`,
                    filename,
                  })
                : t("prompts.addDescription", {
                    defaultValue: `新增 ${filename} 提示词`,
                    filename,
                  })}
            </DialogDescription>
          </DialogHeaderText>
          <DialogCloseButton />
        </DialogHeader>

        <DialogBody>
          <div className="ez-form-grid ez-form-grid--stacked">
            <div className="ez-form-field">
              <Label htmlFor="prompt-name" variant="form">
                {t("prompts.name")}
              </Label>
              <Input
                id="prompt-name"
                variant="modal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("prompts.namePlaceholder")}
              />
            </div>

            <div className="ez-form-field">
              <Label htmlFor="prompt-desc" variant="form">
                {t("prompts.description")}
              </Label>
              <Input
                id="prompt-desc"
                variant="modal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("prompts.descriptionPlaceholder")}
              />
            </div>
          </div>

          <div className="ez-form-field mt-4">
            <Label htmlFor="prompt-content" variant="form">
              {t("prompts.content")}
            </Label>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder={t("prompts.contentPlaceholder", { filename })}
              darkMode={isDarkMode}
              variant="modal"
              minHeight="167px"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptFormPanel;
