import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Save,
  FolderSearch,
  Database,
  Cloud,
  ScrollText,
  HardDriveDownload,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { settingsApi } from "@/lib/api";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { WindowSettings } from "@/components/settings/WindowSettings";
import { AppVisibilitySettings } from "@/components/settings/AppVisibilitySettings";
import { SkillStorageLocationSettings } from "@/components/settings/SkillStorageLocationSettings";
import { SkillSyncMethodSettings } from "@/components/settings/SkillSyncMethodSettings";
import { TerminalSettings } from "@/components/settings/TerminalSettings";
import { DirectorySettings } from "@/components/settings/DirectorySettings";
import { ImportExportSection } from "@/components/settings/ImportExportSection";
import { BackupListSection } from "@/components/settings/BackupListSection";
import { WebdavSyncSection } from "@/components/settings/WebdavSyncSection";
import { AboutSection } from "@/components/settings/AboutSection";
import { ProxyTabContent } from "@/components/settings/ProxyTabContent";
import { ModelTestConfigPanel } from "@/components/usage/ModelTestConfigPanel";
import { UsageDashboard } from "@/components/usage/UsageDashboard";
import { LogConfigPanel } from "@/components/settings/LogConfigPanel";
import { AuthCenterPanel } from "@/components/settings/AuthCenterPanel";
import { CodexAuthSettings } from "@/components/settings/CodexAuthSettings";
import {
  SettingsPaneHeader,
  SettingsTabBar,
  type SettingsTabId,
} from "@/components/settings/SettingsTabBar";
import { useInstalledSkills } from "@/hooks/useSkills";
import { useSettings } from "@/hooks/useSettings";
import { useImportExport } from "@/hooks/useImportExport";
import { useTranslation } from "react-i18next";
import type { SettingsFormState } from "@/hooks/useSettings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void | Promise<void>;
  defaultTab?: string;
  layout?: "default" | "shell";
}

export function SettingsPage({
  open,
  onOpenChange,
  onImportSuccess,
  defaultTab = "general",
  layout = "shell",
}: SettingsDialogProps) {
  const isShellLayout = layout === "shell";
  const { t } = useTranslation();
  const {
    settings,
    isLoading,
    isSaving,
    isPortable,
    appConfigDir,
    resolvedDirs,
    updateSettings,
    updateDirectory,
    updateAppConfigDir,
    browseDirectory,
    browseAppConfigDir,
    resetDirectory,
    resetAppConfigDir,
    saveSettings,
    autoSaveSettings,
    requiresRestart,
    acknowledgeRestart,
  } = useSettings();

  const {
    selectedFile,
    status: importStatus,
    errorMessage,
    backupId,
    isImporting,
    selectImportFile,
    importConfig,
    exportConfig,
    clearSelection,
    resetStatus,
  } = useImportExport({ onImportSuccess });

  const { data: installedSkills } = useInstalledSkills();

  const [activeTab, setActiveTab] = useState<SettingsTabId>("general");
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const tabScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab as SettingsTabId);
      resetStatus();
    }
  }, [open, resetStatus, defaultTab]);

  useEffect(() => {
    if (requiresRestart) {
      setShowRestartPrompt(true);
    }
  }, [requiresRestart]);

  useLayoutEffect(() => {
    if (tabScrollContainerRef.current) {
      tabScrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const closeAfterSave = useCallback(() => {
    // 保存成功后关闭：不再重置语言，避免需要“保存两次”才生效
    acknowledgeRestart();
    clearSelection();
    resetStatus();
    onOpenChange(false);
  }, [acknowledgeRestart, clearSelection, onOpenChange, resetStatus]);

  const handleSave = useCallback(async () => {
    try {
      const result = await saveSettings(undefined, { silent: false });
      if (!result) return;
      if (result.requiresRestart) {
        setShowRestartPrompt(true);
        return;
      }
      closeAfterSave();
    } catch (error) {
      console.error("[SettingsPage] Failed to save settings", error);
    }
  }, [closeAfterSave, saveSettings]);

  const handleRestartLater = useCallback(() => {
    setShowRestartPrompt(false);
    closeAfterSave();
  }, [closeAfterSave]);

  const handleRestartNow = useCallback(async () => {
    setShowRestartPrompt(false);
    if (import.meta.env.DEV) {
      toast.success(t("settings.devModeRestartHint"), { closeButton: true });
      closeAfterSave();
      return;
    }

    try {
      await settingsApi.restart();
    } catch (error) {
      console.error("[SettingsPage] Failed to restart app", error);
      toast.error(t("settings.restartFailed"));
    } finally {
      closeAfterSave();
    }
  }, [closeAfterSave, t]);

  // 通用设置即时保存（无需手动点击）
  // 使用 autoSaveSettings 避免误触发系统 API（开机自启、Claude 插件等）
  // 返回保存是否成功：需要在保存成功后追加动作的调用方（如统一会话历史
  // 关闭后的备份还原）据此短路，其余调用方可忽略返回值。
  const handleAutoSave = useCallback(
    async (updates: Partial<SettingsFormState>): Promise<boolean> => {
      if (!settings) return false;
      // 乐观更新前捕获旧值：autoSaveSettings 发送的是全量表单状态，后端按
      // diff 触发副作用（如统一会话开关的 live 重写与历史迁移）。保存失败
      // 不回滚的话，失败的变更会滞留在表单里，被之后任意一次无关保存原样
      // 重放，绕过确认弹窗。
      const previousValues = Object.fromEntries(
        Object.keys(updates).map((key) => [
          key,
          settings[key as keyof SettingsFormState],
        ]),
      ) as Partial<SettingsFormState>;
      updateSettings(updates);
      try {
        await autoSaveSettings(updates);
        return true;
      } catch (error) {
        console.error("[SettingsPage] Failed to autosave settings", error);
        updateSettings(previousValues);
        toast.error(
          t("settings.saveFailedGeneric", {
            defaultValue: "保存失败，请重试",
          }),
        );
        return false;
      }
    },
    [autoSaveSettings, settings, t, updateSettings],
  );

  const isBusy = useMemo(() => isLoading && !settings, [isLoading, settings]);
  const accordionItemClass = isShellLayout
    ? "accordion-item"
    : "rounded-xl glass-card overflow-hidden";
  const accordionTriggerClass = isShellLayout
    ? "acc-trigger"
    : "px-6 py-4 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50";
  const accordionContentClass = isShellLayout
    ? "acc-content"
    : "px-6 pb-6 pt-4 border-t border-border/50";

  return (
    <div
      className={
        isShellLayout
          ? "settings-page flex flex-col h-full overflow-hidden px-6"
          : "flex flex-col h-full overflow-hidden px-6 "
      }
    >
      {isBusy ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div
          className={
            isShellLayout
              ? "settings-wrapper flex flex-col flex-1 min-h-0"
              : "flex flex-col flex-1 min-h-0 !p-6"
          }
        >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as SettingsTabId)}
          className="flex flex-col h-full"
        >
          {isShellLayout ? (
            <SettingsTabBar
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          ) : (
            /* 原 default TabsList 保留 */
            <TabsList className="grid w-full grid-cols-6 mb-6 glass rounded-lg">
              <TabsTrigger value="general">
                {t("settings.tabGeneral")}
              </TabsTrigger>
              <TabsTrigger value="proxy">{t("settings.tabProxy")}</TabsTrigger>
              <TabsTrigger value="auth">
                {t("settings.tabAuth", { defaultValue: "认证" })}
              </TabsTrigger>
              <TabsTrigger value="advanced">
                {t("settings.tabAdvanced")}
              </TabsTrigger>
              <TabsTrigger value="usage">{t("usage.title")}</TabsTrigger>
              <TabsTrigger value="about">{t("common.about")}</TabsTrigger>
            </TabsList>
          )}

          <div
            className={
              isShellLayout
                ? "settings-content flex-1 min-h-0 flex flex-col"
                : "flex-1 min-h-0 flex flex-col"
            }
          >
            <div
              ref={tabScrollContainerRef}
              className={
                isShellLayout
                  ? "flex-1 overflow-y-auto overflow-x-hidden !pb-0"
                  : "flex-1 overflow-y-auto overflow-x-hidden pr-2"
              }
            >
              <TabsContent
                value="general"
                className={
                  isShellLayout ? "settings-pane space-y-0 mt-0" : "space-y-6 mt-0"
                }
              >
                {isShellLayout ? <SettingsPaneHeader tab="general" /> : null}
                {settings ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={isShellLayout ? "settings-sections space-y-0" : "space-y-6"}
                  >
                    <LanguageSettings
                      value={settings.language}
                      onChange={(lang) => handleAutoSave({ language: lang })}
                    />
                    <ThemeSettings />
                    {/* <AppVisibilitySettings
                      settings={settings}
                      onChange={handleAutoSave}
                    /> */}
                    <SkillStorageLocationSettings
                      value={settings.skillStorageLocation ?? "cc_switch"}
                      installedCount={installedSkills?.length ?? 0}
                      onMigrated={(location) =>
                        updateSettings({ skillStorageLocation: location })
                      }
                    />
                    <SkillSyncMethodSettings
                      value={settings.skillSyncMethod ?? "symlink"}
                      onChange={(method) =>
                        handleAutoSave({ skillSyncMethod: method })
                      }
                    />
                    <CodexAuthSettings
                      settings={settings}
                      onChange={handleAutoSave}
                    />
                    <WindowSettings
                      settings={settings}
                      onChange={handleAutoSave}
                    />
                    <TerminalSettings
                      value={settings.preferredTerminal}
                      onChange={(terminal) =>
                        handleAutoSave({ preferredTerminal: terminal })
                      }
                    />
                  </motion.div>
                ) : null}
              </TabsContent>

              <TabsContent
                value="proxy"
                className={
                  isShellLayout ? "settings-pane space-y-0 mt-0 pb-4" : "space-y-6 mt-0 pb-4"
                }
              >
                {isShellLayout ? <SettingsPaneHeader tab="proxy" /> : null}
                {settings ? (
                  <ProxyTabContent
                    settings={settings}
                    onAutoSave={handleAutoSave}
                  />
                ) : null}
              </TabsContent>

              <TabsContent
                value="auth"
                className={
                  isShellLayout ? "settings-pane space-y-0 mt-0 pb-4" : "space-y-6 mt-0 pb-4"
                }
              >
                {isShellLayout ? <SettingsPaneHeader tab="auth" /> : null}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <AuthCenterPanel />
                </motion.div>
              </TabsContent>

              <TabsContent
                value="advanced"
                className={
                  isShellLayout ? "settings-pane space-y-0 mt-0 pb-4" : "space-y-6 mt-0 pb-4"
                }
              >
                {isShellLayout ? <SettingsPaneHeader tab="advanced" /> : null}
                {settings ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <Accordion
                      type="multiple"
                      defaultValue={[]}
                      className={
                        isShellLayout
                          ? "settings-accordion w-full space-y-0"
                          : "w-full space-y-4"
                      }
                    >
                      <AccordionItem
                        value="directory"
                        className={accordionItemClass}
                      >
                        <AccordionTrigger
                          className={accordionTriggerClass}
                        >
                          <div className="acc-trigger-main">
                            <FolderSearch className="acc-ic" />
                            <div className="acc-info">
                              <h3>
                                {t("settings.advanced.configDir.title")}
                              </h3>
                              <p>
                                {t("settings.advanced.configDir.description")}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent
                          className={accordionContentClass}
                        >
                          <DirectorySettings
                            appConfigDir={appConfigDir}
                            resolvedDirs={resolvedDirs}
                            onAppConfigChange={updateAppConfigDir}
                            onBrowseAppConfig={browseAppConfigDir}
                            onResetAppConfig={resetAppConfigDir}
                            claudeDir={settings.claudeConfigDir}
                            codexDir={settings.codexConfigDir}
                            geminiDir={settings.geminiConfigDir}
                            opencodeDir={settings.opencodeConfigDir}
                            openclawDir={settings.openclawConfigDir}
                            hermesDir={settings.hermesConfigDir}
                            onDirectoryChange={updateDirectory}
                            onBrowseDirectory={browseDirectory}
                            onResetDirectory={resetDirectory}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="data"
                        className={accordionItemClass}
                      >
                        <AccordionTrigger className={accordionTriggerClass}>
                          <div className="acc-trigger-main">
                            <Database className="acc-ic" />
                            <div className="acc-info">
                              <h3>
                                {t("settings.advanced.data.title")}
                              </h3>
                              <p>
                                {t("settings.advanced.data.description")}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className={accordionContentClass}>
                          <ImportExportSection
                            status={importStatus}
                            selectedFile={selectedFile}
                            errorMessage={errorMessage}
                            backupId={backupId}
                            isImporting={isImporting}
                            onSelectFile={selectImportFile}
                            onImport={importConfig}
                            onExport={exportConfig}
                            onClear={clearSelection}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="backup"
                        className={accordionItemClass}
                      >
                        <AccordionTrigger className={accordionTriggerClass}>
                          <div className="acc-trigger-main">
                            <HardDriveDownload className="acc-ic" />
                            <div className="acc-info">
                              <h3>
                                {t("settings.advanced.backup.title", {
                                  defaultValue: "Backup & Restore",
                                })}
                              </h3>
                              <p>
                                {t("settings.advanced.backup.description", {
                                  defaultValue:
                                    "Manage automatic backups, view and restore database snapshots",
                                })}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className={accordionContentClass}>
                          <BackupListSection
                            backupIntervalHours={settings.backupIntervalHours}
                            backupRetainCount={settings.backupRetainCount}
                            onSettingsChange={(updates) =>
                              handleAutoSave(updates)
                            }
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="cloudSync"
                        className={accordionItemClass}
                      >
                        <AccordionTrigger className={accordionTriggerClass}>
                          <div className="acc-trigger-main">
                            <Cloud className="acc-ic" />
                            <div className="acc-info">
                              <h3>
                                {t("settings.advanced.cloudSync.title")}
                              </h3>
                              <p>
                                {t("settings.advanced.cloudSync.description")}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className={accordionContentClass}>
                          <WebdavSyncSection
                            config={settings?.webdavSync}
                            s3Config={settings?.s3Sync}
                            settings={settings}
                            onAutoSave={handleAutoSave}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="test"
                        className={accordionItemClass}
                      >
                        <AccordionTrigger className={accordionTriggerClass}>
                          <div className="acc-trigger-main">
                            <FlaskConical className="acc-ic" />
                            <div className="acc-info">
                              <h3>
                                {t("settings.advanced.modelTest.title")}
                              </h3>
                              <p>
                                {t("settings.advanced.modelTest.description")}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className={accordionContentClass}>
                          <ModelTestConfigPanel />
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="logConfig"
                        className={accordionItemClass}
                      >
                        <AccordionTrigger className={accordionTriggerClass}>
                          <div className="acc-trigger-main">
                            <ScrollText className="acc-ic" />
                            <div className="acc-info">
                              <h3>
                                {t("settings.advanced.logConfig.title")}
                              </h3>
                              <p>
                                {t("settings.advanced.logConfig.description")}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className={accordionContentClass}>
                          <LogConfigPanel />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </motion.div>
                ) : null}
              </TabsContent>

              <TabsContent
                value="about"
                className={isShellLayout ? "settings-pane mt-0" : "mt-0"}
              >
                {isShellLayout ? <SettingsPaneHeader tab="about" /> : null}
                <AboutSection isPortable={isPortable} />
              </TabsContent>

              <TabsContent
                value="usage"
                className={isShellLayout ? "settings-pane mt-0" : "mt-0"}
              >
                {isShellLayout ? <SettingsPaneHeader tab="usage" /> : null}
                <UsageDashboard />
              </TabsContent>
            </div>

            {activeTab === "advanced" && settings && (
              <div
                className={
                  isShellLayout
                    ? "settings-save-bar"
                    : "flex-shrink-0 pt-4 border-t border-border-default"
                }
                style={
                  isShellLayout
                    ? undefined
                    : { backgroundColor: "hsl(var(--background))" }
                }
              >
                <div
                  className={
                    isShellLayout
                      ? "flex items-center justify-end gap-3"
                      : "px-6 flex items-center justify-end gap-3"
                  }
                >
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={isShellLayout ? "btn btn-primary" : undefined}
                  >
                    {isSaving ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("settings.saving")}
                      </span>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("common.save")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Tabs>
        </div>
      )}

      <Dialog
        open={showRestartPrompt}
        onOpenChange={(open) => !open && handleRestartLater()}
      >
        <DialogContent zIndex="alert" className="max-w-md glass border-border">
          <DialogHeader>
            <DialogTitle>{t("settings.restartRequired")}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              {t("settings.restartRequiredMessage")}
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleRestartLater}
            >
              {t("settings.restartLater")}
            </Button>
            <Button onClick={handleRestartNow}>
              {t("settings.restartNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
