import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isWindows,
  isLinux,
  DRAG_REGION_ATTR,
  DRAG_REGION_STYLE,
} from "@/lib/platform";
import { isTextEditableTarget } from "@/utils/domUtils";
import { cn } from "@/lib/utils";

interface FullScreenPanelProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * 覆盖内容区滚动容器的内边距/间距类。默认 `px-6 py-6 space-y-6`。
   * 通过 `cn`(twMerge) 合并，传入如 `pt-3` 只覆盖顶部内边距，其余保持默认。
   */
  contentClassName?: string;
}

const DRAG_BAR_HEIGHT = isWindows() || isLinux() ? 0 : 28; // px - match App.tsx
const HEADER_HEIGHT = 64; // px - match App.tsx

/**
 * 全屏面板 — 基于公共 Dialog（variant="fullscreen"）
 * 保留 macOS 拖拽区、返回头、可滚动内容与可选 footer
 */
export const FullScreenPanel: React.FC<FullScreenPanelProps> = ({
  isOpen,
  title,
  onClose,
  children,
  footer,
  contentClassName,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        variant="fullscreen"
        zIndex="nested"
        overlayClassName="bg-background"
        aria-describedby={undefined}
        className="overflow-hidden"
        onEscapeKeyDown={(event) => {
          // 子组件（例如 Radix Select/Dialog/Dropdown）已消费 ESC 时不再关闭
          if (event.defaultPrevented) return;

          if (isTextEditableTarget(event.target)) {
            event.preventDefault();
            return;
          }

          // 阻止冒泡到 window，避免触发 App.tsx 的全局 ESC 监听
          event.stopPropagation();
        }}
      >
        {/* Drag region - match App.tsx. Linux 上 DRAG_BAR_HEIGHT=0，
            直接跳过整个元素；macOS 保留 28px 拖拽占位。 */}
        {DRAG_BAR_HEIGHT > 0 && (
          <div
            data-tauri-drag-region
            style={
              {
                WebkitAppRegion: "drag",
                height: DRAG_BAR_HEIGHT,
              } as React.CSSProperties
            }
          />
        )}

        {/* Header - match App.tsx */}
        <div
          className="flex-shrink-0 flex items-center"
          {...DRAG_REGION_ATTR}
          style={
            {
              ...DRAG_REGION_STYLE,
              backgroundColor: "hsl(var(--background))",
              height: HEADER_HEIGHT,
            } as React.CSSProperties
          }
        >
          <div
            className="px-6 w-full flex items-center gap-4"
            {...DRAG_REGION_ATTR}
            style={{ ...DRAG_REGION_STYLE } as React.CSSProperties}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onClose}
              className="rounded-lg select-none"
              aria-label={t("common.back", { defaultValue: "返回" })}
              style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-lg font-semibold text-foreground select-none">
              {title}
            </DialogTitle>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-overlay">
          <div className={cn("px-6 py-6 space-y-6 w-full", contentClassName)}>
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="flex-shrink-0 py-4 border-t border-border-default"
            style={{ backgroundColor: "hsl(var(--background))" }}
          >
            <div className="px-6 flex items-center justify-end gap-3">
              {footer}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
