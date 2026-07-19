import React, { useEffect, useState } from "react";
import { Save, Download, Loader2, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import JsonEditor from "@/components/JsonEditor";

interface GeminiCommonConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onSave: (value: string) => boolean;
  error?: string;
  onExtract?: () => void;
  isExtracting?: boolean;
}

/**
 * GeminiCommonConfigModal - Common Gemini configuration editor modal
 * Allows editing of common env snippet shared across Gemini providers
 */
export const GeminiCommonConfigModal: React.FC<
  GeminiCommonConfigModalProps
> = ({ isOpen, onClose, value, onSave, error, onExtract, isExtracting }) => {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [draftValue, setDraftValue] = useState(value);

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
    if (isOpen) {
      setDraftValue(value);
    }
  }, [isOpen, value]);

  const handleClose = () => {
    setDraftValue(value);
    onClose();
  };

  const handleSave = () => {
    if (onSave(draftValue)) {
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent
        size="lg"
        zIndex="top"
        className="[&_.ez-modal-content__inner]:max-h-[88vh]"
      >
        <DialogHeader>
          <DialogTitle>
            {t("geminiConfig.editCommonConfigTitle", {
              defaultValue: "编辑 Gemini 通用配置片段",
            })}
          </DialogTitle>
          <DialogCloseButton aria-label={t("common.close", "关闭")} />
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            <div className="rounded-lg border border-info/30 bg-info/10 p-3 space-y-1.5">
              <p className="text-sm font-medium text-info">
                {t("commonConfig.guideTitle")}
              </p>
              <p className="text-xs text-info/80">
                {t("commonConfig.guidePurpose")}
              </p>
              <p className="text-xs text-info/80">
                {t("commonConfig.guideUsage")}
              </p>
              <p className="text-xs text-info/80">
                {t("commonConfig.guideReExtract")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("commonConfig.guideReassurance")}
              </p>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {t("geminiConfig.commonConfigHint", {
                defaultValue:
                  "该片段会写入 Gemini 的 .env（不允许包含 GOOGLE_GEMINI_BASE_URL、GEMINI_API_KEY）",
              })}
            </p>
            {(!draftValue ||
              draftValue.trim() === "" ||
              draftValue.trim() === "{}") && (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <Package className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">
                  {t("commonConfig.emptyTitle")}
                </p>
                <p className="text-xs mt-1">{t("commonConfig.emptyHint")}</p>
              </div>
            )}

            <JsonEditor
              value={draftValue}
              onChange={setDraftValue}
              placeholder={`{
  "GEMINI_MODEL": "gemini-3.5-flash"
}`}
              darkMode={isDarkMode}
              rows={16}
              showValidation={true}
              language="json"
            />

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          {onExtract && (
            <Button
              type="button"
              variant="outline"
              onClick={onExtract}
              disabled={isExtracting}
              className="mr-auto gap-2"
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("geminiConfig.extractFromCurrent", {
                defaultValue: "从编辑内容提取",
              })}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
