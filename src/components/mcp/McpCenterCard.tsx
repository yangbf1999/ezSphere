import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  type StatusBadgeVariant,
} from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";

export interface McpCenterCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** mcp.html `.card.mcp-card` — MCP 管理通用卡片容器 */
export function McpCenterCard({
  className,
  children,
  ...props
}: McpCenterCardProps) {
  return (
    <div className={cn("mcp-card shell-card", className)} {...props}>
      {children}
    </div>
  );
}

export interface McpCenterCardHeaderProps {
  children: ReactNode;
}

export function McpCenterCardHeader({ children }: McpCenterCardHeaderProps) {
  return <h4>{children}</h4>;
}

export interface McpCenterCardTitleProps {
  children: ReactNode;
}

export function McpCenterCardTitle({ children }: McpCenterCardTitleProps) {
  return <span className="mcp-card-name">{children}</span>;
}

export interface McpCenterCardDocsLinkProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function McpCenterCardDocsLink({
  icon: Icon,
  label,
  onClick,
}: McpCenterCardDocsLinkProps) {
  return (
    <Button
      type="button"
      variant="native"
      className="mcp-docs-link"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <Icon size={12} aria-hidden />
    </Button>
  );
}

export interface McpCenterCardBadgeProps {
  variant: StatusBadgeVariant;
  children: ReactNode;
}

export function McpCenterCardBadge({
  variant,
  children,
}: McpCenterCardBadgeProps) {
  return (
    <StatusBadge variant={variant} className="mcp-sync-badge">
      {children}
    </StatusBadge>
  );
}

export interface McpCenterCardDescriptionProps {
  children: ReactNode;
}

export function McpCenterCardDescription({
  children,
}: McpCenterCardDescriptionProps) {
  return <p className="desc">{children}</p>;
}

export interface McpCenterCardCommandProps {
  children: ReactNode;
}

export function McpCenterCardCommand({ children }: McpCenterCardCommandProps) {
  return (
    <div className="row">
      <span>{children}</span>
    </div>
  );
}

export function McpCenterCardToggles({ children }: { children: ReactNode }) {
  return <div className="mcp-app-toggles">{children}</div>;
}

export interface McpCenterCardActionsProps {
  children: ReactNode;
}

export function McpCenterCardActions({ children }: McpCenterCardActionsProps) {
  return <div className="mcp-actions">{children}</div>;
}

export interface McpCenterCardIconActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export function McpCenterCardIconAction({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: McpCenterCardIconActionProps) {
  return (
    <Button
      type="button"
      variant="icon-shell"
      className={cn(destructive ? "del" : "edit-mcp")}
      icon={Icon}
      onClick={onClick}
      title={label}
      aria-label={label}
    />
  );
}
