import { useEffect, useState, type CSSProperties } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useTranslation } from "react-i18next";
import {
  SIDEBAR_NAV_GROUPS,
  type SidebarNavId,
} from "@/config/navigation";
import { UpdateBadge } from "@/components/UpdateBadge";
import { useSidebarWidth } from "@/hooks/useSidebarWidth";
import { useAllMcpServers } from "@/hooks/useMcp";
import { useInstalledSkills } from "@/hooks/useSkills";
import { cn } from "@/lib/utils";
import ezsphereLogo from "@/assets/icons/ezsphere-logo.png";

export interface SidebarBadgeCounts {
  apps?: number;
  prompts?: number;
}

interface SidebarProps {
  activeNavId: SidebarNavId;
  onNavigate: (id: SidebarNavId) => void;
  onOpenAbout: () => void;
  badgeCounts?: SidebarBadgeCounts;
}

export function Sidebar({
  activeNavId,
  onNavigate,
  onOpenAbout,
  badgeCounts,
}: SidebarProps) {
  const { t } = useTranslation();
  const sidebarWidth = useSidebarWidth();
  const { data: installedSkills } = useInstalledSkills();
  const { data: mcpServers } = useAllMcpServers();
  const [appVersion, setAppVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getVersion()
      .then((version) => {
        if (!cancelled) {
          setAppVersion(version);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAppVersion(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedBadges: Partial<Record<SidebarNavId, number>> = {
    apps: badgeCounts?.apps,
    prompts: badgeCounts?.prompts,
    skills: installedSkills?.length,
    mcp: mcpServers ? Object.keys(mcpServers).length : undefined,
  };

  return (
    <aside
      className="app-sidebar flex h-full shrink-0 flex-col gap-1 overflow-y-auto overflow-x-hidden "
      style={{ width: sidebarWidth, minWidth: sidebarWidth }}
    >
      <div className="app-sidebar-logo mb-3 ml-2 shrink-0">
        <img
          src={ezsphereLogo}
          alt="ezSphere"
          className="h-7 w-auto max-w-full object-contain object-left"
          draggable={false}
        />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {SIDEBAR_NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.labelKey ?? `group-${groupIndex}`}>
            {group.labelKey ? (
              <div className="app-sidebar-section">{t(group.labelKey)}</div>
            ) : null}
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeNavId === item.id;
                const badge =
                  item.showBadge && resolvedBadges[item.id] != null
                    ? resolvedBadges[item.id]
                    : undefined;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className={cn(
                        "app-sidebar-item",
                        isActive && "active",
                      )}
                      style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
                    >
                      <Icon className="app-sidebar-icon" strokeWidth={2} />
                      <span className="min-w-0 flex-1 truncate text-left">
                        {t(item.labelKey)}
                      </span>
                      {/*badge != null && badge > 0 ? (
                        <span className="app-sidebar-badge">{badge}</span>
                      ) : null*/}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/*<div
        className="app-sidebar-foot flex items-center gap-2"
        style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
      >
        <span className="min-w-0 flex-1 truncate">
          {appVersion
            ? t("nav.sidebarFooter", { version: appVersion })
            : t("nav.sidebarFooterLoading")}
        </span>
        <UpdateBadge onClick={onOpenAbout} className="h-6 w-6 shrink-0" />
      </div>*/}
    </aside>
  );
}
