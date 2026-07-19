import React from "react";
import type { AppId } from "@/lib/api/types";
import {
  ClaudeIcon,
  CodexIcon,
  GeminiIcon,
  OpenClawIcon,
} from "@/components/BrandIcons";
import { ProviderIcon } from "@/components/ProviderIcon";

export interface AppConfig {
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  badgeClass: string;
}

export const APP_IDS: AppId[] = [
  "claude",
  //"claude-desktop",
  "codex",
  //"gemini",
  //"opencode",
  //"openclaw",
  "hermes",
];

/** 模型页 AppSwitcher tab 显示的应用 */
export const PROVIDER_TAB_APP_IDS: AppId[] = [
  "claude",
  "codex",
  "hermes",
];

/** 支持 CLI 版本探测的应用（与后端 VALID_TOOLS 对齐） */
export const CLI_STATUS_APP_IDS = [
  "claude",
  "codex",
 // "gemini",
 // "opencode",
 // "openclaw",
  "hermes",
] as const satisfies readonly AppId[];

export type CliStatusAppId = (typeof CLI_STATUS_APP_IDS)[number];

export const CLI_TOOL_DISPLAY_NAMES: Record<CliStatusAppId, string> = {
  claude: "Claude Code",
  codex: "Codex CLI",
 // gemini: "Gemini CLI",
 // opencode: "OpenCode",
 // openclaw: "OpenClaw",
  hermes: "Hermes",
};

export const APP_SWITCHER_ICON: Record<AppId, string> = {
  claude: "claude",
 // "claude-desktop": "claude",
  codex: "openai",
 // gemini: "gemini",
 // opencode: "opencode",
 // openclaw: "openclaw",
  hermes: "hermes",
};

export const APP_SWITCHER_LABEL: Record<AppId, string> = {
  claude: "Claude Code",
  //"claude-desktop": "Claude Desktop",
  codex: "Codex",
 // gemini: "Gemini",
 // opencode: "OpenCode",
 // openclaw: "OpenClaw",
  hermes: "Hermes",
};

export function isCliStatusApp(appId: AppId): appId is CliStatusAppId {
  return (CLI_STATUS_APP_IDS as readonly AppId[]).includes(appId);
}

/** App IDs shown in Skills panels (excludes OpenClaw — it doesn't support Skills) */
export const SKILLS_APP_IDS: AppId[] = [
  "claude",
  "codex",
 // "gemini",
 // "opencode",
  "hermes",
];

/** App IDs shown in MCP panels (excludes OpenClaw) */
export const MCP_APP_IDS: AppId[] = [...SKILLS_APP_IDS];

export const APP_ICON_MAP: Record<AppId, AppConfig> = {
  claude: {
    label: "Claude",
    icon: <ClaudeIcon size={14} />,
    activeClass:
      "bg-orange-500/10 ring-1 ring-orange-500/20 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400",
    badgeClass:
      "bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 border-0 gap-1.5",
  },
  "claude-desktop": {
    label: "Claude Desktop",
    icon: <ClaudeIcon size={14} />,
    activeClass:
      "bg-amber-500/10 ring-1 ring-amber-500/20 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border-0 gap-1.5",
  },
  codex: {
    label: "Codex",
    icon: <CodexIcon size={14} />,
    activeClass:
      "bg-green-500/10 ring-1 ring-green-500/20 hover:bg-green-500/20 text-green-600 dark:text-green-400",
    badgeClass:
      "bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 border-0 gap-1.5",
  },
  gemini: {
    label: "Gemini",
    icon: <GeminiIcon size={14} />,
    activeClass:
      "bg-primary/10 ring-1 ring-primary/20 hover:bg-primary/20 text-primary",
    badgeClass:
      "bg-primary/10 text-primary hover:bg-primary/20 border-0 gap-1.5",
  },
  opencode: {
    label: "OpenCode",
    icon: (
      <ProviderIcon
        icon="opencode"
        name="OpenCode"
        size={14}
        showFallback={false}
      />
    ),
    activeClass:
      "bg-indigo-500/10 ring-1 ring-indigo-500/20 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 border-0 gap-1.5",
  },
  openclaw: {
    label: "OpenClaw",
    icon: <OpenClawIcon size={14} />,
    activeClass:
      "bg-rose-500/10 ring-1 ring-rose-500/20 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400",
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border-0 gap-1.5",
  },
  hermes: {
    label: "Hermes",
    icon: (
      <ProviderIcon
        icon="hermes"
        name="Hermes"
        size={14}
        showFallback={false}
      />
    ),
    activeClass:
      "bg-violet-500/10 ring-1 ring-violet-500/20 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400",
    badgeClass:
      "bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 border-0 gap-1.5",
  },
};
