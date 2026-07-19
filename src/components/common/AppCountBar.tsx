import React from "react";
import type { AppId } from "@/lib/api/types";
import { APP_IDS, APP_ICON_MAP } from "@/config/appConfig";

interface AppCountBarProps {
  totalLabel: string;
  counts: Partial<Record<AppId, number>>;
  appIds?: AppId[];
}

export const AppCountBar: React.FC<AppCountBarProps> = ({
  totalLabel,
  counts,
  appIds = APP_IDS,
}) => {
  return (
    <div className="app-stats" aria-label={totalLabel}>
      <span className="app-stats-label">{totalLabel}</span>
      {appIds.map((app) => (
        <span
          key={app}
          className="app-stat"
          data-app={app}
          style={{ border: "none", background: "transparent" }}
        >
          <span className="app-stat-dot" />
          <span className="app-stat-label">{APP_ICON_MAP[app].label}</span>
          <span className="app-stat-num">{counts[app] ?? 0}</span>
        </span>
      ))}
    </div>
  );
};
