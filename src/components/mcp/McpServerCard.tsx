import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Edit3, ExternalLink, Trash2 } from "lucide-react";
import type { McpServer, McpServerSpec } from "@/types";
import type { AppId } from "@/lib/api/types";
import { settingsApi } from "@/lib/api";
import { mcpPresets } from "@/config/mcpPresets";
import { MCP_APP_IDS } from "@/config/appConfig";
import { AppToggleGroup } from "@/components/common/AppToggleGroup";
import {
  McpCenterCard,
  McpCenterCardActions,
  McpCenterCardBadge,
  McpCenterCardCommand,
  McpCenterCardDescription,
  McpCenterCardDocsLink,
  McpCenterCardHeader,
  McpCenterCardIconAction,
  McpCenterCardTitle,
  McpCenterCardToggles,
} from "./McpCenterCard";

function formatMcpCommand(spec: McpServerSpec): string {
  if (spec.command) {
    return [spec.command, ...(spec.args || [])].join(" ");
  }
  if (spec.url) return spec.url;
  if (spec.type) return spec.type;
  return "stdio";
}

export interface McpServerCardProps {
  id: string;
  server: McpServer;
  onToggleApp: (serverId: string, app: AppId, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function McpServerCard({
  id,
  server,
  onToggleApp,
  onEdit,
  onDelete,
}: McpServerCardProps) {
  const { t } = useTranslation();
  const name = server.name || id;
  const description = server.description || "";

  const meta = mcpPresets.find((p) => p.id === id);
  const docsUrl = server.docs || meta?.docs;
  const homepageUrl = server.homepage || meta?.homepage;
  const tags = server.tags || meta?.tags;

  const enabledAppCount = useMemo(
    () => MCP_APP_IDS.filter((app) => server.apps[app]).length,
    [server.apps],
  );

  const isSynced = enabledAppCount > 0;
  const commandLine = formatMcpCommand(server.server);

  const openDocs = async () => {
    const url = docsUrl || homepageUrl;
    if (!url) return;
    try {
      await settingsApi.openExternal(url);
    } catch {
      // ignore
    }
  };

  const descriptionText =
    description ||
    (tags && tags.length > 0
      ? tags.join(", ")
      : t("mcp.noDescription", { defaultValue: "暂无描述" }));

  const editLabel = t("common.edit");
  const deleteLabel = t("common.delete");
  const docsLabel = `${t("mcp.presets.docs")} ${name}`;

  return (
    <McpCenterCard data-apps={MCP_APP_IDS.filter((app) => server.apps[app]).join(" ")}>
      <McpCenterCardHeader>
        <McpCenterCardTitle>{name}</McpCenterCardTitle>
        {docsUrl || homepageUrl ? (
          <McpCenterCardDocsLink
            icon={ExternalLink}
            label={docsLabel}
            onClick={() => void openDocs()}
          />
        ) : null}
        <McpCenterCardBadge variant={isSynced ? "success" : "neutral"}>
          {isSynced
            ? t("mcp.synced", { defaultValue: "已同步" })
            : t("mcp.localOnly", { defaultValue: "仅本地" })}
        </McpCenterCardBadge>
      </McpCenterCardHeader>

      <McpCenterCardDescription>{descriptionText}</McpCenterCardDescription>

      <McpCenterCardCommand>{commandLine}</McpCenterCardCommand>

      <McpCenterCardToggles>
        <AppToggleGroup
          apps={server.apps}
          onToggle={(app, enabled) => onToggleApp(id, app, enabled)}
          appIds={MCP_APP_IDS}
          variant="chip"
        />
      </McpCenterCardToggles>

      <McpCenterCardActions>
        <McpCenterCardIconAction
          icon={Edit3}
          label={`${editLabel} ${name}`}
          onClick={() => onEdit(id)}
        />
        <McpCenterCardIconAction
          icon={Trash2}
          label={`${deleteLabel} ${name}`}
          onClick={() => onDelete(id)}
          destructive
        />
      </McpCenterCardActions>
    </McpCenterCard>
  );
}
