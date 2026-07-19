import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderText,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UseConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info";
}

export function useConfirm() {
  return async ({ title, message }: UseConfirmOptions) => {
    return window.confirm(`${title}\n\n${message}`);
  };
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "info";
  zIndex?: "base" | "nested" | "alert" | "top";
  /** 可选勾选项：提供 label 即显示，勾选状态经 onConfirm 参数回传 */
  checkboxLabel?: string;
  checkboxDefaultChecked?: boolean;
  /** 确定按钮防抖（毫秒），防止连点重复提交 */
  confirmDebounceMs?: number;
  onConfirm: (checkboxChecked: boolean) => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant = "destructive",
  zIndex = "alert",
  checkboxLabel,
  checkboxDefaultChecked = false,
  confirmDebounceMs = 500,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const [checkboxChecked, setCheckboxChecked] = useState(
    checkboxDefaultChecked,
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const lastConfirmAtRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setCheckboxChecked(checkboxDefaultChecked);
      setIsConfirming(false);
      lastConfirmAtRef.current = 0;
    }
  }, [isOpen, checkboxDefaultChecked]);

  const handleConfirm = async () => {
    if (isConfirming) return;

    const now = Date.now();
    if (confirmDebounceMs > 0 && now - lastConfirmAtRef.current < confirmDebounceMs) {
      return;
    }
    lastConfirmAtRef.current = now;

    setIsConfirming(true);
    try {
      await Promise.resolve(
        onConfirm(checkboxLabel ? checkboxChecked : false),
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const IconComponent = variant === "info" ? Info : AlertTriangle;
  const iconClass =
    variant === "info" ? "h-5 w-5 text-primary" : "h-5 w-5 text-destructive";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent size="sm" zIndex={zIndex}>
        <DialogHeader className="ez-modal-head--compact">
          <DialogHeaderText>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent className={iconClass} aria-hidden="true" />
              {title}
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line text-sm leading-relaxed">
              {message}
            </DialogDescription>
          </DialogHeaderText>
        </DialogHeader>
        {checkboxLabel ? (
          <DialogBody className="ez-modal-body--compact pt-0">
            <label className="flex cursor-pointer select-none items-start gap-2">
              <Checkbox
                checked={checkboxChecked}
                onCheckedChange={(value) => setCheckboxChecked(value === true)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed">{checkboxLabel}</span>
            </label>
          </DialogBody>
        ) : null}
        <DialogFooter className="ez-modal-foot--compact">
          <Button variant="outline" onClick={onCancel}>
            {cancelText || t("common.cancel")}
          </Button>
          <Button
            variant={variant === "info" ? "default" : "destructive"}
            disabled={isConfirming}
            onClick={() => void handleConfirm()}
          >
            {confirmText || t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
