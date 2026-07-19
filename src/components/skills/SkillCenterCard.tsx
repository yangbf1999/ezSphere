import type { HTMLAttributes, ReactNode } from "react";
import { useCallback, useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";

export interface SkillCenterCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** skills.html `.card.skill-card` — 技能管理通用卡片容器 */
export function SkillCenterCard({
  className,
  children,
  ...props
}: SkillCenterCardProps) {
  return (
    <div className={cn("skill-card shell-card", className)} {...props}>
      {children}
    </div>
  );
}

export function SkillCenterCardTopEnd({ children }: { children: ReactNode }) {
  return <div className="skill-card-top-end">{children}</div>;
}

export interface SkillCenterCardInstalledTagProps {
  children: ReactNode;
  variant?: StatusBadgeVariant;
}

/** 右上角「本地」等状态 — 复用 StatusBadge 灰色系 */
export function SkillCenterCardInstalledTag({
  children,
  variant = "neutral",
}: SkillCenterCardInstalledTagProps) {
  return (
    <StatusBadge variant={variant} className="skill-installed-badge">
      {children}
    </StatusBadge>
  );
}

export function SkillCenterCardTopActions({ children }: { children: ReactNode }) {
  return <div className="skill-card-top-actions">{children}</div>;
}

export function SkillCenterCardTop({ children }: { children: ReactNode }) {
  return <div className="top">{children}</div>;
}

export interface SkillCenterCardLogoProps {
  children: ReactNode;
}

export function SkillCenterCardLogo({ children }: SkillCenterCardLogoProps) {
  return <div className="skill-logo">{children}</div>;
}

export function SkillCenterCardHead({ children }: { children: ReactNode }) {
  return <div className="skill-head">{children}</div>;
}

export function SkillCenterCardTitleRow({ children }: { children: ReactNode }) {
  return <div className="skill-name-row">{children}</div>;
}

export interface SkillCenterCardTitleProps {
  children: ReactNode;
}

export function SkillCenterCardTitle({ children }: SkillCenterCardTitleProps) {
  return <h4>{children}</h4>;
}

export interface SkillCenterCardVersionProps {
  children: ReactNode;
  update?: boolean;
}

export function SkillCenterCardVersion({
  children,
  update = false,
}: SkillCenterCardVersionProps) {
  return (
    <div className={cn("ver", update && "skill-update-badge")}>{children}</div>
  );
}

export interface SkillCenterCardDescriptionProps {
  children: ReactNode;
  title?: string;
}

export function SkillCenterCardDescription({
  children,
  title,
}: SkillCenterCardDescriptionProps) {
  return (
    <p className="skill-card-desc" title={title}>
      {children}
    </p>
  );
}

export function SkillCenterCardFoot({ children }: { children: ReactNode }) {
  return <div className="foot">{children}</div>;
}

export function SkillCenterCardFootActions({ children }: { children: ReactNode }) {
  return <div className="skill-card-foot-actions">{children}</div>;
}

export function SkillCenterCardAppChips({ children }: { children: ReactNode }) {
  return <span className="app-chips">{children}</span>;
}

export interface SkillCenterCardSourceProps {
  children: ReactNode;
}

export function SkillCenterCardSource({ children }: SkillCenterCardSourceProps) {
  return <span className="skill-source">{children}</span>;
}

export interface SkillCenterCardIconActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  loading?: boolean;
  loadingIcon?: LucideIcon;
  /** 删除等 destructive 操作：打开确认弹窗前防抖（毫秒） */
  debounceMs?: number;
}

const DEFAULT_DELETE_DEBOUNCE_MS = 500;

export function SkillCenterCardIconAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  destructive = false,
  loading = false,
  loadingIcon: LoadingIcon,
  debounceMs = DEFAULT_DELETE_DEBOUNCE_MS,
}: SkillCenterCardIconActionProps) {
  const lastClickAtRef = useRef(0);

  const handleClick = useCallback(() => {
    if (destructive && debounceMs > 0) {
      const now = Date.now();
      if (now - lastClickAtRef.current < debounceMs) {
        return;
      }
      lastClickAtRef.current = now;
    }
    onClick();
  }, [debounceMs, destructive, onClick]);

  if (loading && LoadingIcon) {
    return (
      <Button
        type="button"
        variant="icon-shell"
        className={cn(destructive ? "del" : "skill-action-btn")}
        onClick={handleClick}
        disabled={disabled}
        title={label}
        aria-label={label}
      >
        <LoadingIcon size={14} className="animate-spin" aria-hidden />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="icon-shell"
      className={cn(destructive ? "del" : "skill-action-btn")}
      icon={Icon}
      onClick={handleClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    />
  );
}
