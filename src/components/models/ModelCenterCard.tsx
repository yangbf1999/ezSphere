import { useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";

export interface ModelCenterCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** models.html `.card.mcard` — 模型中心通用卡片容器 */
export function ModelCenterCard({
  className,
  children,
  ...props
}: ModelCenterCardProps) {
  return (
    <div className={cn("mcard shell-card", className)} {...props}>
      {children}
    </div>
  );
}

export function ModelCenterCardTop({ children }: { children: ReactNode }) {
  return <div className="mcard-top">{children}</div>;
}

export interface ModelCenterCardIconProps {
  children: ReactNode;
  className?: string;
}

export function ModelCenterCardIcon({
  children,
  className,
}: ModelCenterCardIconProps) {
  return <div className={cn("micon", className)}>{children}</div>;
}

export interface ModelCenterCardInfoProps {
  title: string;
  subtitle: string;
}

export function ModelCenterCardInfo({ title, subtitle }: ModelCenterCardInfoProps) {
  const subtitleRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = () => {
    if (subtitleRef.current) {
      setIsTruncated(
        subtitleRef.current.scrollWidth > subtitleRef.current.clientWidth,
      );
    }
  };

  return (
    <div className="minfo">
      <div className="mname">{title}</div>
      <TooltipProvider>
        <Tooltip open={isTruncated ? undefined : false}>
          <TooltipTrigger asChild>
            <div
              ref={subtitleRef}
              onMouseEnter={checkTruncation}
              className="mid"
            >
              {subtitle}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[280px] break-all bg-[#1a1a1a] px-3 py-1.5 font-mono text-xs text-white"
          >
            {subtitle}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export interface ModelCenterCardBadgeProps {
  children: ReactNode;
  /** 与 ProviderCard `.route-tag` 对齐的启用态 */
  status?: "inUse" | "idle";
  /** status 未传时回退到通用 StatusBadge */
  variant?: StatusBadgeVariant;
}

export function ModelCenterCardBadge({
  variant = "neutral",
  status,
  children,
}: ModelCenterCardBadgeProps) {
  if (status === "inUse") {
    return (
      <span className="mcard-badge route-tag route-needed">{children}</span>
    );
  }
  if (status === "idle") {
    return (
      <span className="mcard-badge route-tag route-unsupported">
        {children}
      </span>
    );
  }

  return (
    <StatusBadge variant={variant} className="mcard-badge">
      {children}
    </StatusBadge>
  );
}

export function ModelCenterCardBody({ children }: { children: ReactNode }) {
  return <div className="mcard-body">{children}</div>;
}

export interface ModelCenterCardRowProps {
  label: string;
  value: string;
  muted?: boolean;
}

export function ModelCenterCardRow({
  label,
  value,
  muted = false,
}: ModelCenterCardRowProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = () => {
    if (valueRef.current) {
      setIsTruncated(valueRef.current.scrollWidth > valueRef.current.clientWidth);
    }
  };

  return (
    <div className="mrow">
      <span className="lbl shrink-0">{label}</span>
      <TooltipProvider>
        <Tooltip open={isTruncated ? undefined : false}>
          <TooltipTrigger asChild>
            <span
              ref={valueRef}
              onMouseEnter={checkTruncation}
              className={cn("val min-w-0 truncate", muted && "muted")}
            >
              {value}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[var(--tooltip-max-w,280px)] break-all bg-[#1a1a1a] px-3 py-1.5 font-mono text-xs text-white"
            style={{ "--tooltip-max-w": valueRef.current?.clientWidth ? `${valueRef.current.clientWidth}px` : undefined } as React.CSSProperties}
          >
            {value}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export interface ModelCenterCardActionsProps {
  itemName: string;
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}

export function ModelCenterCardActions({
  itemName,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: ModelCenterCardActionsProps) {
  const { t } = useTranslation();
  const resolvedEditLabel = editLabel ?? t("common.edit");
  const resolvedDeleteLabel = deleteLabel ?? t("common.delete");

  return (
    <div className="mcard-foot">
      <Button
        type="button"
        variant="btn"
        size="sm"
        onClick={onEdit}
        aria-label={`${resolvedEditLabel} ${itemName}`}
      >
        {resolvedEditLabel}
      </Button>
      <Button
        type="button"
        variant="btn-danger"
        size="sm"
        onClick={onDelete}
        aria-label={`${resolvedDeleteLabel} ${itemName}`}
      >
        {resolvedDeleteLabel}
      </Button>
    </div>
  );
}
