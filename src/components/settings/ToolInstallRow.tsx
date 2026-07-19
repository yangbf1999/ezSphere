import { useTranslation } from "react-i18next";
import type { ToolInstallation } from "@/lib/api/settings";

/**
 * 单处工具安装的信息行：来源徽章 + 路径 + 版本（或「无法运行」）+「默认」标记。
 * 冲突诊断列表与升级确认对话框共用，确保两处的视觉与「默认」判定始终一致。
 */
export function ToolInstallRow({ inst }: { inst: ToolInstallation }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="shrink-0 rounded bg-background/80 px-1 py-0.5 font-mono text-muted-foreground">
        {inst.source}
      </span>
      <span
        className="min-w-0 flex-1 truncate font-mono text-muted-foreground"
        title={inst.path}
      >
        {inst.path}
      </span>
      <span
        className={
          inst.runnable
            ? "shrink-0 font-mono text-foreground"
            : "shrink-0 settings-token-warning"
        }
      >
        {inst.runnable ? inst.version : t("settings.toolConflictNotRunnable")}
      </span>
      {inst.is_path_default && (
        <span className="settings-token-badge shrink-0 rounded-full border px-1 py-0.5 text-[9px]">
          {t("settings.toolConflictDefault")}
        </span>
      )}
    </div>
  );
}
