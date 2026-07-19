import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Trash2,
  ExternalLink,
  RefreshCw,
  Loader2,
  Download,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  type ImportSkillSelection,
  type SkillBackupEntry,
  useDeleteSkillBackup,
  useInstalledSkills,
  useSkillBackups,
  useRestoreSkillBackup,
  useToggleSkillApp,
  useUninstallSkill,
  useScanUnmanagedSkills,
  useImportSkillsFromApps,
  useInstallSkillsFromZip,
  useCheckSkillUpdates,
  useUpdateSkill,
  type InstalledSkill,
  type SkillUpdateInfo,
} from "@/hooks/useSkills";
import type { AppId } from "@/lib/api/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { settingsApi, skillsApi } from "@/lib/api";
import { formatSkillError } from "@/lib/errors/skillErrorParser";
import { toast } from "sonner";
import { SKILLS_APP_IDS, APP_ICON_MAP } from "@/config/appConfig";
import { AppToggleGroup } from "@/components/common/AppToggleGroup";
import { ListItemRow } from "@/components/common/ListItemRow";
import { InstalledSkillCard } from "@/components/skills/InstalledSkillCard";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface UnifiedSkillsPanelProps {
  onOpenDiscovery: () => void;
  currentApp: AppId;
  layout?: "default" | "shell";
  searchTerm?: string;
  onCountsChange?: (skillCount: number, enabledCounts: Record<AppId, number>) => void;
}

export interface UnifiedSkillsPanelHandle {
  openDiscovery: () => void;
  openImport: () => void;
  openInstallFromZip: () => void;
  openRestoreFromBackup: () => void;
  checkUpdates: () => void;
  getEnabledCounts: () => Record<AppId, number>;
  getSkillCount: () => number;
}

function formatSkillBackupDate(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  return Number.isNaN(date.getTime())
    ? String(unixSeconds)
    : date.toLocaleString();
}

const UnifiedSkillsPanel = React.forwardRef<
  UnifiedSkillsPanelHandle,
  UnifiedSkillsPanelProps
>(({ onOpenDiscovery, currentApp, layout = "default", searchTerm = "", onCountsChange }, ref) => {
  const isShellLayout = layout === "shell";
  const { t } = useTranslation();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: "destructive" | "info";
    onConfirm: () => void;
  } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const { data: skills, isLoading } = useInstalledSkills();
  const {
    data: skillBackups = [],
    refetch: refetchSkillBackups,
    isFetching: isFetchingSkillBackups,
  } = useSkillBackups();
  const deleteBackupMutation = useDeleteSkillBackup();
  const toggleAppMutation = useToggleSkillApp();
  const uninstallMutation = useUninstallSkill();
  const restoreBackupMutation = useRestoreSkillBackup();
  // enabled: true —— 进入 Skill 页面时自动静默扫描一次（绿点提示来源）
  const { data: unmanagedSkills, refetch: scanUnmanaged } =
    useScanUnmanagedSkills({ enabled: true });
  const importMutation = useImportSkillsFromApps();
  const installFromZipMutation = useInstallSkillsFromZip();
  const {
    data: skillUpdates,
    refetch: checkUpdates,
    isFetching: isCheckingUpdates,
  } = useCheckSkillUpdates();
  const updateSkillMutation = useUpdateSkill();
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  const updatesMap = useMemo(() => {
    const map: Record<string, SkillUpdateInfo> = {};
    if (skillUpdates) {
      for (const u of skillUpdates) {
        map[u.id] = u;
      }
    }
    return map;
  }, [skillUpdates]);

  const installedSkills = useMemo(() => skills ?? [], [skills]);

  const enabledCounts = useMemo(() => {
    const counts = {
      claude: 0,
      "claude-desktop": 0,
      codex: 0,
      gemini: 0,
      opencode: 0,
      openclaw: 0,
      hermes: 0,
    };
    installedSkills.forEach((skill) => {
      for (const app of SKILLS_APP_IDS) {
        if (skill.apps[app]) counts[app]++;
      }
    });
    return counts;
  }, [installedSkills]);

  useEffect(() => {
    onCountsChange?.(installedSkills.length, enabledCounts);
  }, [installedSkills, enabledCounts, onCountsChange]);

  const filteredSkills = useMemo(() => {
    let list = installedSkills;
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      list = list.filter((skill) => {
        const repo = `${skill.repoOwner ?? ""}/${skill.repoName ?? ""}`.toLowerCase();
        return (
          skill.name.toLowerCase().includes(query) ||
          skill.description?.toLowerCase().includes(query) ||
          repo.includes(query) ||
          skill.directory.toLowerCase().includes(query)
        );
      });
    }
    return list;
  }, [installedSkills, searchTerm]);

  const handleToggleApp = async (id: string, app: AppId, enabled: boolean) => {
    if (toggleAppMutation.isPending) return;
    try {
      await toggleAppMutation.mutateAsync({ id, app, enabled });
    } catch (error) {
      toast.error(t("common.error"), { description: String(error) });
    }
  };

  const handleUninstall = (skill: InstalledSkill) => {
    if (confirmDialog?.isOpen) return;

    setConfirmDialog({
      isOpen: true,
      title: t("skills.uninstall"),
      message: t("skills.uninstallConfirm", { name: skill.name }),
      onConfirm: async () => {
        try {
          // 构建 skillKey 用于更新 discoverable 缓存
          const installName =
            skill.directory.split(/[/\\]/).pop()?.toLowerCase() ||
            skill.directory.toLowerCase();
          const skillKey = `${installName}:${skill.repoOwner?.toLowerCase() || ""}:${skill.repoName?.toLowerCase() || ""}`;

          const result = await uninstallMutation.mutateAsync({
            id: skill.id,
            skillKey,
          });
          setConfirmDialog(null);
          toast.success(t("skills.uninstallSuccess", { name: skill.name }), {
            description: result.backupPath
              ? t("skills.backup.location", { path: result.backupPath })
              : undefined,
            closeButton: true,
          });
        } catch (error) {
          toast.error(t("common.error"), { description: String(error) });
        }
      },
    });
  };

  const handleOpenImport = async () => {
    try {
      const result = await scanUnmanaged();
      if (!result.data || result.data.length === 0) {
        toast.success(t("skills.noUnmanagedFound"), { closeButton: true });
        return;
      }
      setImportDialogOpen(true);
    } catch (error) {
      toast.error(t("common.error"), { description: String(error) });
    }
  };

  const handleImport = async (imports: ImportSkillSelection[]) => {
    try {
      const imported = await importMutation.mutateAsync(imports);
      setImportDialogOpen(false);
      toast.success(t("skills.importSuccess", { count: imported.length }), {
        closeButton: true,
      });
    } catch (error) {
      toast.error(t("common.error"), { description: String(error) });
    }
  };

  const handleInstallFromZip = async () => {
    try {
      const filePath = await skillsApi.openZipFileDialog();
      if (!filePath) return;

      const installed = await installFromZipMutation.mutateAsync({ filePath });

      if (installed.length === 0) {
        toast.info(t("skills.installFromZip.noSkillsFound"), {
          closeButton: true,
        });
      } else if (installed.length === 1) {
        toast.success(
          t("skills.installFromZip.successSingle", { name: installed[0].name }),
          { closeButton: true },
        );
      } else {
        toast.success(
          t("skills.installFromZip.successMultiple", {
            count: installed.length,
          }),
          { closeButton: true },
        );
      }
    } catch (error) {
      const { title, description } = formatSkillError(
        String(error),
        t,
        "skills.installFailed",
      );
      toast.error(title, { description, closeButton: true });
    }
  };

  const handleCheckUpdates = async () => {
    try {
      const result = await checkUpdates();
      const updates = result.data || [];
      if (updates.length === 0) {
        toast.success(t("skills.noUpdates"), { closeButton: true });
      } else {
        toast.info(t("skills.updatesFound", { count: updates.length }), {
          closeButton: true,
        });
      }
    } catch (error) {
      toast.error(t("common.error"), { description: String(error) });
    }
  };

  const handleUpdateSkill = async (skill: InstalledSkill) => {
    try {
      const updated = await updateSkillMutation.mutateAsync(skill.id);
      toast.success(t("skills.updateSuccess", { name: updated.name }), {
        closeButton: true,
      });
    } catch (error) {
      toast.error(t("skills.updateFailed"), { description: String(error) });
    }
  };

  const handleUpdateAll = async () => {
    if (!skillUpdates || skillUpdates.length === 0) return;
    setIsUpdatingAll(true);
    let successCount = 0;
    for (const update of skillUpdates) {
      try {
        await updateSkillMutation.mutateAsync(update.id);
        successCount++;
      } catch (error) {
        toast.error(t("skills.updateFailed"), {
          description: `${update.name}: ${String(error)}`,
        });
      }
    }
    setIsUpdatingAll(false);
    if (successCount > 0) {
      toast.success(t("skills.updateAllSuccess", { count: successCount }), {
        closeButton: true,
      });
    }
  };

  const handleOpenRestoreFromBackup = async () => {
    setRestoreDialogOpen(true);
    try {
      await refetchSkillBackups();
    } catch (error) {
      toast.error(t("common.error"), { description: String(error) });
    }
  };

  const handleRestoreFromBackup = async (backupId: string) => {
    try {
      const restored = await restoreBackupMutation.mutateAsync({ backupId });
      setRestoreDialogOpen(false);
      toast.success(
        t("skills.restoreFromBackup.success", { name: restored.name }),
        {
          closeButton: true,
        },
      );
    } catch (error) {
      toast.error(t("skills.restoreFromBackup.failed"), {
        description: String(error),
      });
    }
  };

  const handleDeleteBackup = (backup: SkillBackupEntry) => {
    setConfirmDialog({
      isOpen: true,
      title: t("skills.restoreFromBackup.deleteConfirmTitle"),
      message: t("skills.restoreFromBackup.deleteConfirmMessage", {
        name: backup.skill.name,
      }),
      confirmText: t("skills.restoreFromBackup.delete"),
      variant: "destructive",
      onConfirm: async () => {
        try {
          await deleteBackupMutation.mutateAsync(backup.backupId);
          await refetchSkillBackups();
          setConfirmDialog(null);
          toast.success(
            t("skills.restoreFromBackup.deleteSuccess", {
              name: backup.skill.name,
            }),
            {
              closeButton: true,
            },
          );
        } catch (error) {
          toast.error(t("skills.restoreFromBackup.deleteFailed"), {
            description: String(error),
          });
        }
      },
    });
  };

  React.useImperativeHandle(ref, () => ({
    openDiscovery: onOpenDiscovery,
    openImport: handleOpenImport,
    openInstallFromZip: handleInstallFromZip,
    openRestoreFromBackup: handleOpenRestoreFromBackup,
    checkUpdates: handleCheckUpdates,
    getEnabledCounts: () => enabledCounts,
    getSkillCount: () => installedSkills.length,
  }));

  const updateActions = (
    <div className="flex items-center gap-1.5">
      <div
        className="transition-all duration-300 ease-out overflow-hidden"
        style={{
          maxWidth:
            skillUpdates && skillUpdates.length > 0 ? "200px" : "0px",
          opacity: skillUpdates && skillUpdates.length > 0 ? 1 : 0,
        }}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 whitespace-nowrap"
          onClick={handleUpdateAll}
          disabled={isUpdatingAll || updateSkillMutation.isPending}
        >
          {isUpdatingAll ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RefreshCw size={12} />
          )}
          {isUpdatingAll
            ? t("skills.updatingAll")
            : t("skills.updateAll", { count: skillUpdates?.length ?? 0 })}
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={handleCheckUpdates}
        disabled={isCheckingUpdates || installedSkills.length === 0}
      >
        {isCheckingUpdates ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <RefreshCw size={12} />
        )}
        {isCheckingUpdates
          ? t("skills.checkingUpdates")
          : t("skills.checkUpdates")}
      </Button>
    </div>
  );

  const emptyState = (
    <div className={isShellLayout ? "skill-empty" : "text-center py-12"}>
      {!isShellLayout ? (
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Sparkles size={24} className="text-muted-foreground" />
        </div>
      ) : null}
      <h3
        className={
          isShellLayout
            ? undefined
            : "text-lg font-medium text-foreground mb-2"
        }
      >
        {searchTerm.trim() && installedSkills.length > 0
          ? t("skills.noResults")
          : t("skills.noInstalled")}
      </h3>
      <p className={isShellLayout ? undefined : "text-muted-foreground text-sm"}>
        {searchTerm.trim() && installedSkills.length > 0
          ? ''//t("skills.searchPlaceholder")
          : t("skills.noInstalledDescription")}
      </p>
    </div>
  );

  return (
    <div
      className={
        isShellLayout
          ? "flex flex-col flex-1 min-h-0 overflow-hidden"
          : "px-6 flex flex-col flex-1 min-h-0 overflow-hidden"
      }
    >
      {isShellLayout ? (
        <div className="skills-meta-bar">
          <span className="skills-count">
            {/**如果有搜索，应该显示搜索结果的总数，否则显示已安装的技能总数 */}
            {searchTerm.trim() && installedSkills.length > 0 ? t("skills.count", { count: filteredSkills.length }) : t("skills.count", { count: installedSkills.length })}
          </span>
          {updateActions}
        </div>
      ) : (
        <div className="flex items-center justify-end">
          {updateActions}
        </div>
      )}

      <div
        className={
          isShellLayout
            ? "shell-card-grid skill-grid flex-1 overflow-y-auto overflow-x-hidden pb-24"
            : "flex-1 overflow-y-auto overflow-x-hidden pb-24"
        }
      >
        {isLoading ? (
          <div
            className={
              isShellLayout
                ? "skill-loading"
                : "text-center py-12 text-muted-foreground"
            }
          >
            {t("skills.loading")}
          </div>
        ) : installedSkills.length === 0 ? (
          emptyState
        ) : filteredSkills.length === 0 ? (
          emptyState
        ) : isShellLayout ? (
          filteredSkills.map((skill) => (
            <InstalledSkillCard
              key={skill.id}
              skill={skill}
              hasUpdate={!!updatesMap[skill.id]}
              isUpdating={
                updateSkillMutation.isPending &&
                updateSkillMutation.variables === skill.id
              }
              onToggleApp={handleToggleApp}
              onUninstall={() => handleUninstall(skill)}
              onUpdate={() => handleUpdateSkill(skill)}
            />
          ))
        ) : (
          <TooltipProvider delayDuration={300}>
            <div className="rounded-xl border border-border-default overflow-hidden">
              {filteredSkills.map((skill, index) => (
                <InstalledSkillListItem
                  key={skill.id}
                  skill={skill}
                  hasUpdate={!!updatesMap[skill.id]}
                  isUpdating={
                    updateSkillMutation.isPending &&
                    updateSkillMutation.variables === skill.id
                  }
                  onToggleApp={handleToggleApp}
                  onUninstall={() => handleUninstall(skill)}
                  onUpdate={() => handleUpdateSkill(skill)}
                  isLast={index === filteredSkills.length - 1}
                />
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>

      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          variant={confirmDialog.variant}
          zIndex="top"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {importDialogOpen && unmanagedSkills && (
        <ImportSkillsDialog
          skills={unmanagedSkills}
          isImporting={importMutation.isPending}
          onImport={handleImport}
          onClose={() => setImportDialogOpen(false)}
        />
      )}

      <RestoreSkillsDialog
        backups={skillBackups}
        deletingBackupId={
          deleteBackupMutation.isPending
            ? (deleteBackupMutation.variables ?? null)
            : null
        }
        isLoading={isFetchingSkillBackups}
        onDelete={handleDeleteBackup}
        restoringBackupId={restoreBackupMutation.isPending ? (restoreBackupMutation.variables?.backupId ?? null) : null}
        onRestore={handleRestoreFromBackup}
        onClose={() => setRestoreDialogOpen(false)}
        open={restoreDialogOpen}
      />
    </div>
  );
});

UnifiedSkillsPanel.displayName = "UnifiedSkillsPanel";

interface InstalledSkillListItemProps {
  skill: InstalledSkill;
  hasUpdate?: boolean;
  isUpdating?: boolean;
  onToggleApp: (id: string, app: AppId, enabled: boolean) => void;
  onUninstall: () => void;
  onUpdate?: () => void;
  isLast?: boolean;
}

const InstalledSkillListItem: React.FC<InstalledSkillListItemProps> = ({
  skill,
  hasUpdate,
  isUpdating,
  onToggleApp,
  onUninstall,
  onUpdate,
  isLast,
}) => {
  const { t } = useTranslation();

  const openDocs = async () => {
    if (!skill.readmeUrl) return;
    try {
      await settingsApi.openExternal(skill.readmeUrl);
    } catch {
      // ignore
    }
  };

  const sourceLabel = useMemo(() => {
    if (skill.repoOwner && skill.repoName) {
      return `${skill.repoOwner}/${skill.repoName}`;
    }
    return t("skills.local");
  }, [skill.repoOwner, skill.repoName, t]);

  return (
    <ListItemRow isLast={isLast}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-sm text-foreground truncate">
            {skill.name}
          </span>
          {skill.readmeUrl && (
            <Button
              type="button"
              variant="native"
              onClick={openDocs}
              className="text-muted-foreground/60 hover:text-foreground flex-shrink-0"
              aria-label={`${t("skills.view")} ${skill.name}`}
            >
              <ExternalLink size={12} aria-hidden />
            </Button>
          )}
          <span className="text-xs text-muted-foreground/50 flex-shrink-0">
            {sourceLabel}
          </span>
          {hasUpdate && (
            <span className="skill-update-badge ez-badge shrink-0">
              {t("skills.updateAvailable")}
            </span>
          )}
        </div>
        {skill.description && (
          <p
            className="text-xs text-muted-foreground truncate"
            title={skill.description}
          >
            {skill.description}
          </p>
        )}
      </div>

      <AppToggleGroup
        apps={skill.apps}
        onToggle={(app, enabled) => onToggleApp(skill.id, app, enabled)}
        appIds={SKILLS_APP_IDS}
      />

      <div
        className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={hasUpdate ? { opacity: 1 } : undefined}
      >
        {hasUpdate && onUpdate && (
          <Button
            type="button"
            variant="icon-shell"
            className="h-7 w-7"
            onClick={onUpdate}
            disabled={isUpdating}
            title={t("skills.update")}
            aria-label={`${t("skills.update")} ${skill.name}`}
          >
            {isUpdating ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <RefreshCw size={14} aria-hidden />
            )}
          </Button>
        )}
        <Button
          type="button"
          variant="icon-shell"
          className="del h-7 w-7"
          onClick={onUninstall}
          title={t("skills.uninstall")}
          aria-label={`${t("skills.uninstall")} ${skill.name}`}
        >
          <Trash2 size={14} aria-hidden />
        </Button>
      </div>
    </ListItemRow>
  );
};

interface ImportSkillsDialogProps {
  skills: Array<{
    directory: string;
    name: string;
    description?: string;
    foundIn: string[];
    path: string;
  }>;
  isImporting: boolean;
  onImport: (imports: ImportSkillSelection[]) => void;
  onClose: () => void;
}

interface RestoreSkillsDialogProps {
  backups: SkillBackupEntry[];
  deletingBackupId: string | null;
  isLoading: boolean;
  restoringBackupId: string | null;
  onDelete: (backup: SkillBackupEntry) => void;
  onRestore: (backupId: string) => void;
  onClose: () => void;
  open: boolean;
}

const RestoreSkillsDialog: React.FC<RestoreSkillsDialogProps> = ({
  backups,
  deletingBackupId,
  isLoading,
  restoringBackupId,
  onDelete,
  onRestore,
  onClose,
  open,
}) => {
  const { t } = useTranslation();
  const isBusy = restoringBackupId !== null || deletingBackupId !== null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        size="lg"
        zIndex="top"
        className="[&_.ez-modal-content__inner]:max-h-[85vh]"
      >
        <DialogHeader>
          <FolderOpen
            className="ez-modal-icon"
            strokeWidth={2}
            aria-hidden
          />
          <DialogTitle>{t("skills.restoreFromBackup.title")}</DialogTitle>
          <span className="skills-modal-msub">
            {t("skills.restoreFromBackup.description")}
          </span>
          <DialogCloseButton aria-label={t("common.close", "关闭")} />
        </DialogHeader>

        <DialogBody>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-[var(--shell-text-muted)]">
              {t("common.loading")}
            </div>
          ) : backups.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--shell-text-muted)]">
              {t("skills.restoreFromBackup.empty")}
            </div>
          ) : (
            <div>
              {backups.map((backup) => (
                <div key={backup.backupId} className="skills-bkp-card">
                  <div className="skills-bkp-top">
                    <div className="min-w-0 flex-1">
                      <div>
                        <span className="skills-bkp-name">{backup.skill.name}</span>
                        <span className="skills-bkp-dir">
                          {backup.skill.directory}
                        </span>
                      </div>
                      {backup.skill.description && (
                        <div className="skills-bkp-desc">
                          {backup.skill.description}
                        </div>
                      )}
                      <div className="skills-bkp-meta">
                        <span>
                          {t("skills.restoreFromBackup.createdAt")}:{" "}
                          {formatSkillBackupDate(backup.createdAt)}
                        </span>
                        <span className="break-all" title={backup.backupPath}>
                          {t("skills.restoreFromBackup.path")}:{" "}
                          {backup.backupPath}
                        </span>
                      </div>
                    </div>
                    <div className="skills-bkp-actions">
                      <Button
                        type="button"
                        variant="btn"
                        size="sm"
                        onClick={() => onRestore(backup.backupId)}
                        disabled={isBusy}
                        aria-label={`${t("skills.restoreFromBackup.restore")} ${formatSkillBackupDate(backup.createdAt)}`}
                      >
                        {restoringBackupId === backup.backupId
                          ? t("skills.restoreFromBackup.restoring")
                          : t("skills.restoreFromBackup.restore")}
                      </Button>
                      <Button
                        type="button"
                        variant="btn-danger"
                        size="sm"
                        onClick={() => onDelete(backup)}
                        disabled={isBusy}
                        aria-label={`${t("skills.restoreFromBackup.delete")} ${formatSkillBackupDate(backup.createdAt)}`}
                      >
                        {deletingBackupId === backup.backupId
                          ? t("skills.restoreFromBackup.deleting")
                          : t("skills.restoreFromBackup.delete")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ImportSkillsDialog: React.FC<ImportSkillsDialogProps> = ({
  skills,
  isImporting,
  onImport,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(skills.map((s) => s.directory)),
  );
  const [selectedApps, setSelectedApps] = useState<
    Record<string, ImportSkillSelection["apps"]>
  >(() =>
    Object.fromEntries(
      skills.map((skill) => [
        skill.directory,
        {
          claude: skill.foundIn.includes("claude"),
          codex: skill.foundIn.includes("codex"),
          gemini: skill.foundIn.includes("gemini"),
          opencode: skill.foundIn.includes("opencode"),
          openclaw: false,
          hermes: skill.foundIn.includes("hermes"),
        },
      ]),
    ),
  );

  const toggleSelect = (directory: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(directory)) {
      newSelected.delete(directory);
    } else {
      newSelected.add(directory);
    }
    setSelected(newSelected);
  };

  const handleImport = () => {
    onImport(
      Array.from(selected).map((directory) => ({
        directory,
        apps: selectedApps[directory] ?? {
          claude: false,
          codex: false,
          gemini: false,
          opencode: false,
          openclaw: false,
          hermes: false,
        },
      })),
    );
  };

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        size="lg"
        zIndex="top"
        className="[&_.ez-modal-content__inner]:max-h-[85vh]"
      >
        <DialogHeader>
          <Download className="ez-modal-icon" strokeWidth={2} aria-hidden />
          <DialogTitle>{t("skills.import")}</DialogTitle>
          <span className="skills-modal-msub">
            {t("skills.importDescription")}
          </span>
          <DialogCloseButton aria-label={t("common.close", "关闭")} />
        </DialogHeader>

        <DialogBody>
          {skills.map((skill) => {
            const apps =
              selectedApps[skill.directory] ?? {
                claude: false,
                codex: false,
                gemini: false,
                opencode: false,
                openclaw: false,
                hermes: false,
              };
            return (
              <div key={skill.directory} className="skills-import-row">
                <input
                  type="checkbox"
                  className="ir-check"
                  checked={selected.has(skill.directory)}
                  onChange={() => toggleSelect(skill.directory)}
                  aria-label={skill.name}
                />
                <div className="ir-body">
                  <div className="ir-name">{skill.name}</div>
                  {skill.description && (
                    <div className="ir-desc">{skill.description}</div>
                  )}
                  <div className="skills-atg-group">
                    {SKILLS_APP_IDS.map((app) => (
                      <button
                        key={app}
                        type="button"
                        className={`skills-atg-btn${apps[app] ? " on" : ""}`}
                        onClick={() => {
                          setSelectedApps((prev) => ({
                            ...prev,
                            [skill.directory]: {
                              ...(prev[skill.directory] ?? apps),
                              [app]: !apps[app],
                            },
                          }));
                        }}
                      >
                        {APP_ICON_MAP[app].label}
                      </button>
                    ))}
                  </div>
                  <div className="ir-path" title={skill.path}>
                    {skill.path}
                  </div>
                </div>
              </div>
            );
          })}
        </DialogBody>

        <DialogFooter>
          <span className="mr-auto text-[11px] text-[var(--shell-text-muted)]">
            {t("skills.importSelected", { count: selected.size })}
          </span>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleImport}
            disabled={selected.size === 0 || isImporting}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {t("skills.importSelected", { count: selected.size })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedSkillsPanel;
