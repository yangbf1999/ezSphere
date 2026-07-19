import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Boxes,
  Cpu,
  History,
  Home,
  Plug,
  Settings,
  Stethoscope,
  Wrench,
} from "lucide-react";

export type SidebarNavId =
  | "overview"
  | "apps"
  | "models"
  | "prompts"
  | "skills"
  | "mcp"
  | "sessions"
  | "install"
  | "settings";

export type AppView =
  | "overview"
  | "models"
  | "install"
  | "providers"
  | "settings"
  | "prompts"
  | "skills"
  | "mcp"
  | "agents"
  | "universal"
  | "sessions"
  | "workspace"
  | "openclawEnv"
  | "openclawTools"
  | "openclawAgents"
  | "hermesMemory";

export interface SidebarNavItem {
  id: SidebarNavId;
  labelKey: string;
  icon: LucideIcon;
  showBadge?: boolean;
}

export interface SidebarNavGroup {
  labelKey?: string;
  items: SidebarNavItem[];
}

export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_WIDTH_COMPACT = 180;
/** 窗口宽度 ≤ 此值时使用 SIDEBAR_WIDTH_COMPACT */
export const SIDEBAR_COMPACT_BREAKPOINT = 1280;

export const SIDEBAR_NAV_GROUPS: SidebarNavGroup[] = [
  {
    items: [
      {
        id: "overview",
        labelKey: "nav.overview",
        icon: Home,
      },
    ],
  },
  {
    labelKey: "nav.group.config",
    items: [
      {
        id: "apps",
        labelKey: "nav.apps",
        icon: Boxes,
        showBadge: true,
      },
      {
        id: "models",
        labelKey: "nav.models",
        icon: Cpu,
        showBadge: true,
      },
      {
        id: "prompts",
        labelKey: "nav.prompts",
        icon: BookOpen,
        showBadge: true,
      },
      {
        id: "skills",
        labelKey: "nav.skills",
        icon: Wrench,
        showBadge: true,
      },
      {
        id: "mcp",
        labelKey: "nav.mcp",
        icon: Plug,
        showBadge: true,
      },
      {
        id: "sessions",
        labelKey: "nav.sessions",
        icon: History,
      },
      {
        id: "install",
        labelKey: "nav.install",
        icon: Stethoscope,
      },
    ],
  },
  {
    labelKey: "nav.group.system",
    items: [
      {
        id: "settings",
        labelKey: "nav.settings",
        icon: Settings,
      },
    ],
  },
];

const APP_SUB_VIEWS: AppView[] = [
  "workspace",
  "openclawEnv",
  "openclawTools",
  "openclawAgents",
  "hermesMemory",
  "agents",
  "universal",
];

export function getSidebarIdForView(view: AppView): SidebarNavId {
  switch (view) {
    case "overview":
      return "overview";
    case "models":
      return "models";
    case "prompts":
      return "prompts";
    case "skills":
      return "skills";
    case "mcp":
      return "mcp";
    case "sessions":
      return "sessions";
    case "install":
      return "install";
    case "settings":
      return "settings";
    case "providers":
    case "workspace":
    case "openclawEnv":
    case "openclawTools":
    case "openclawAgents":
    case "hermesMemory":
    case "agents":
    case "universal":
      return "apps";
    default:
      return "apps";
  }
}

export function isAppSubView(view: AppView): boolean {
  return APP_SUB_VIEWS.includes(view);
}
