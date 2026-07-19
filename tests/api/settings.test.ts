import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// settings.ts: 大量薄封装；重点测纯逻辑：
// - syncCurrentProvidersLive: 检查 result.success，否则抛错
// - openExternal: 仅允许 http/https 协议，否则抛 "Invalid URL"/"Unsupported URL scheme"
// - webdavTestConnection/s3TestConnection: preserveEmptyPassword 默认 true

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { settingsApi, backupsApi } from "@/lib/api/settings";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("settings API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  // 基础读写
  it("get 调用 get_settings", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await settingsApi.get();
    expect(mockInvoke).toHaveBeenCalledWith("get_settings");
  });
  it("save 调用 save_settings 传 settings", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.save({ theme: "dark" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("save_settings", { settings: { theme: "dark" } });
  });
  it("hasCodexUnifyHistoryBackup 调用 has_codex_unify_history_backup", async () => {
    mockInvoke.mockResolvedValue(false);
    await settingsApi.hasCodexUnifyHistoryBackup();
    expect(mockInvoke).toHaveBeenCalledWith("has_codex_unify_history_backup");
  });
  it("restoreCodexUnifiedHistory 调用 restore_codex_unified_history", async () => {
    mockInvoke.mockResolvedValue({ restoredJsonlFiles: 0, restoredStateRows: 0 } as any);
    await settingsApi.restoreCodexUnifiedHistory();
    expect(mockInvoke).toHaveBeenCalledWith("restore_codex_unified_history");
  });
  it("restart 调用 restart_app", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.restart();
    expect(mockInvoke).toHaveBeenCalledWith("restart_app");
  });
  it("installUpdateAndRestart 调用 install_update_and_restart", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.installUpdateAndRestart();
    expect(mockInvoke).toHaveBeenCalledWith("install_update_and_restart");
  });
  it("checkUpdates 调用 check_for_updates", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await settingsApi.checkUpdates();
    expect(mockInvoke).toHaveBeenCalledWith("check_for_updates");
  });
  it("isPortable 调用 is_portable_mode", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.isPortable();
    expect(mockInvoke).toHaveBeenCalledWith("is_portable_mode");
  });

  // 配置目录
  it("getConfigDir 调用 get_config_dir 传 app", async () => {
    mockInvoke.mockResolvedValue("/cfg");
    await settingsApi.getConfigDir("claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_config_dir", { app: "claude" });
  });
  it("openConfigFolder 调用 open_config_folder 传 app", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await settingsApi.openConfigFolder("codex");
    expect(mockInvoke).toHaveBeenCalledWith("open_config_folder", { app: "codex" });
  });
  it("pickDirectory 调用 pick_directory 传 defaultPath", async () => {
    mockInvoke.mockResolvedValue("/picked");
    await settingsApi.pickDirectory("/default");
    expect(mockInvoke).toHaveBeenCalledWith("pick_directory", { defaultPath: "/default" });
  });
  it("selectConfigDirectory 同样调用 pick_directory", async () => {
    mockInvoke.mockResolvedValue(null);
    await settingsApi.selectConfigDirectory();
    expect(mockInvoke).toHaveBeenCalledWith("pick_directory", { defaultPath: undefined });
  });
  it("getClaudeCodeConfigPath 调用 get_claude_code_config_path", async () => {
    mockInvoke.mockResolvedValue("/path");
    await settingsApi.getClaudeCodeConfigPath();
    expect(mockInvoke).toHaveBeenCalledWith("get_claude_code_config_path");
  });
  it("getAppConfigPath 调用 get_app_config_path", async () => {
    mockInvoke.mockResolvedValue("/path");
    await settingsApi.getAppConfigPath();
    expect(mockInvoke).toHaveBeenCalledWith("get_app_config_path");
  });
  it("openAppConfigFolder 调用 open_app_config_folder", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await settingsApi.openAppConfigFolder();
    expect(mockInvoke).toHaveBeenCalledWith("open_app_config_folder");
  });
  it("getAppConfigDirOverride 调用 get_app_config_dir_override", async () => {
    mockInvoke.mockResolvedValue(null);
    await settingsApi.getAppConfigDirOverride();
    expect(mockInvoke).toHaveBeenCalledWith("get_app_config_dir_override");
  });
  it("setAppConfigDirOverride 传 path", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.setAppConfigDirOverride("/new");
    expect(mockInvoke).toHaveBeenCalledWith("set_app_config_dir_override", { path: "/new" });
  });

  // Claude onboarding / plugin
  it("applyClaudePluginConfig 传 official", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.applyClaudePluginConfig({ official: true });
    expect(mockInvoke).toHaveBeenCalledWith("apply_claude_plugin_config", { official: true });
  });
  it("applyClaudeOnboardingSkip 调用 apply_claude_onboarding_skip", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.applyClaudeOnboardingSkip();
    expect(mockInvoke).toHaveBeenCalledWith("apply_claude_onboarding_skip");
  });
  it("clearClaudeOnboardingSkip 调用 clear_claude_onboarding_skip", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.clearClaudeOnboardingSkip();
    expect(mockInvoke).toHaveBeenCalledWith("clear_claude_onboarding_skip");
  });

  // 文件对话框 / 导入导出
  it("saveFileDialog 传 defaultName", async () => {
    mockInvoke.mockResolvedValue("/saved.json");
    await settingsApi.saveFileDialog("backup.json");
    expect(mockInvoke).toHaveBeenCalledWith("save_file_dialog", { defaultName: "backup.json" });
  });
  it("openFileDialog 无参", async () => {
    mockInvoke.mockResolvedValue(null);
    await settingsApi.openFileDialog();
    expect(mockInvoke).toHaveBeenCalledWith("open_file_dialog");
  });
  it("exportConfigToFile 传 filePath", async () => {
    mockInvoke.mockResolvedValue({ success: true, message: "ok" } as any);
    await settingsApi.exportConfigToFile("/f.json");
    expect(mockInvoke).toHaveBeenCalledWith("export_config_to_file", { filePath: "/f.json" });
  });
  it("importConfigFromFile 传 filePath", async () => {
    mockInvoke.mockResolvedValue({ success: true, message: "ok" } as any);
    await settingsApi.importConfigFromFile("/f.json");
    expect(mockInvoke).toHaveBeenCalledWith("import_config_from_file", { filePath: "/f.json" });
  });

  // WebDAV
  describe("webdavTestConnection", () => {
    it("默认 preserveEmptyPassword=true", async () => {
      mockInvoke.mockResolvedValue({ success: true });
      await settingsApi.webdavTestConnection({} as any);
      expect(mockInvoke).toHaveBeenCalledWith("webdav_test_connection", {
        settings: {},
        preserveEmptyPassword: true,
      });
    });
    it("显式 preserveEmptyPassword=false 透传", async () => {
      mockInvoke.mockResolvedValue({ success: true });
      await settingsApi.webdavTestConnection({} as any, false);
      expect(mockInvoke).toHaveBeenCalledWith("webdav_test_connection", {
        settings: {},
        preserveEmptyPassword: false,
      });
    });
  });
  it("webdavSyncUpload 调用 webdav_sync_upload", async () => {
    mockInvoke.mockResolvedValue({ status: "ok" });
    await settingsApi.webdavSyncUpload();
    expect(mockInvoke).toHaveBeenCalledWith("webdav_sync_upload");
  });
  it("webdavSyncDownload 调用 webdav_sync_download", async () => {
    mockInvoke.mockResolvedValue({ status: "ok" });
    await settingsApi.webdavSyncDownload();
    expect(mockInvoke).toHaveBeenCalledWith("webdav_sync_download");
  });
  it("webdavSyncSaveSettings 传 settings + passwordTouched", async () => {
    mockInvoke.mockResolvedValue({ success: true });
    await settingsApi.webdavSyncSaveSettings({ url: "x" } as any, true);
    expect(mockInvoke).toHaveBeenCalledWith("webdav_sync_save_settings", {
      settings: { url: "x" },
      passwordTouched: true,
    });
  });
  it("webdavSyncFetchRemoteInfo 调用 webdav_sync_fetch_remote_info", async () => {
    mockInvoke.mockResolvedValue({ empty: true });
    await settingsApi.webdavSyncFetchRemoteInfo();
    expect(mockInvoke).toHaveBeenCalledWith("webdav_sync_fetch_remote_info");
  });

  // S3
  it("s3TestConnection 默认 preserveEmptyPassword=true", async () => {
    mockInvoke.mockResolvedValue({ success: true });
    await settingsApi.s3TestConnection({} as any);
    expect(mockInvoke).toHaveBeenCalledWith("s3_test_connection", {
      settings: {},
      preserveEmptyPassword: true,
    });
  });
  it("s3SyncUpload 调用 s3_sync_upload", async () => {
    mockInvoke.mockResolvedValue({ status: "ok" });
    await settingsApi.s3SyncUpload();
    expect(mockInvoke).toHaveBeenCalledWith("s3_sync_upload");
  });
  it("s3SyncDownload 调用 s3_sync_download", async () => {
    mockInvoke.mockResolvedValue({ status: "ok" });
    await settingsApi.s3SyncDownload();
    expect(mockInvoke).toHaveBeenCalledWith("s3_sync_download");
  });
  it("s3SyncSaveSettings 传 settings + passwordTouched（无默认）", async () => {
    mockInvoke.mockResolvedValue({ success: true });
    await settingsApi.s3SyncSaveSettings({ bucket: "b" } as any, false);
    expect(mockInvoke).toHaveBeenCalledWith("s3_sync_save_settings", {
      settings: { bucket: "b" },
      passwordTouched: false,
    });
  });
  it("s3SyncFetchRemoteInfo 调用 s3_sync_fetch_remote_info", async () => {
    mockInvoke.mockResolvedValue({ empty: true });
    await settingsApi.s3SyncFetchRemoteInfo();
    expect(mockInvoke).toHaveBeenCalledWith("s3_sync_fetch_remote_info");
  });

  // 纯逻辑：syncCurrentProvidersLive
  describe("syncCurrentProvidersLive", () => {
    it("result.success=true：不抛错", async () => {
      mockInvoke.mockResolvedValue({ success: true, message: "ok" });
      await expect(settingsApi.syncCurrentProvidersLive()).resolves.toBeUndefined();
      expect(mockInvoke).toHaveBeenCalledWith("sync_current_providers_live");
    });
    it("result.success=false 有 message：抛该 message", async () => {
      mockInvoke.mockResolvedValue({ success: false, message: "providers out of sync" });
      await expect(settingsApi.syncCurrentProvidersLive()).rejects.toThrow(
        "providers out of sync",
      );
    });
    it("result.success=false 无 message：抛默认文案", async () => {
      mockInvoke.mockResolvedValue({ success: false });
      await expect(settingsApi.syncCurrentProvidersLive()).rejects.toThrow(
        "Sync current providers failed",
      );
    });
    it("result 为 null：抛默认文案", async () => {
      mockInvoke.mockResolvedValue(null);
      await expect(settingsApi.syncCurrentProvidersLive()).rejects.toThrow(
        "Sync current providers failed",
      );
    });
  });

  // 纯逻辑：openExternal URL 协议校验
  describe("openExternal", () => {
    it("https URL：校验通过后调用 invoke", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await settingsApi.openExternal("https://example.com");
      expect(mockInvoke).toHaveBeenCalledWith("open_external", { url: "https://example.com" });
    });
    it("http URL：通过", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await settingsApi.openExternal("http://example.com");
      expect(mockInvoke).toHaveBeenCalledWith("open_external", { url: "http://example.com" });
    });
    it("非 http/https 协议：抛 Invalid URL（catch 吞掉 scheme 错误），不调用 invoke", async () => {
      // 源码里 throw 'Unsupported URL scheme' 位于 try 块内，被 catch 捕获后统一抛 'Invalid URL'。
      await expect(settingsApi.openExternal("file:///etc/passwd")).rejects.toThrow("Invalid URL");
      expect(mockInvoke).not.toHaveBeenCalled();
    });
    it("非法 URL：抛 Invalid URL", async () => {
      await expect(settingsApi.openExternal("not a url")).rejects.toThrow("Invalid URL");
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  // 开机自启
  it("setAutoLaunch 传 enabled", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.setAutoLaunch(true);
    expect(mockInvoke).toHaveBeenCalledWith("set_auto_launch", { enabled: true });
  });
  it("getAutoLaunchStatus 调用 get_auto_launch_status", async () => {
    mockInvoke.mockResolvedValue(false);
    await settingsApi.getAutoLaunchStatus();
    expect(mockInvoke).toHaveBeenCalledWith("get_auto_launch_status");
  });

  // 工具版本
  it("getToolVersions 传 tools + wslShellByTool", async () => {
    mockInvoke.mockResolvedValue([]);
    await settingsApi.getToolVersions(["claude"], { claude: { wslShell: "bash" } });
    expect(mockInvoke).toHaveBeenCalledWith("get_tool_versions", {
      tools: ["claude"],
      wslShellByTool: { claude: { wslShell: "bash" } },
    });
  });
  it("runToolLifecycleAction 传 tools + action + wslShellByTool", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await settingsApi.runToolLifecycleAction(["codex"], "update");
    expect(mockInvoke).toHaveBeenCalledWith("run_tool_lifecycle_action", {
      tools: ["codex"],
      action: "update",
      wslShellByTool: undefined,
    });
  });
  it("probeToolInstallations 传 tools", async () => {
    mockInvoke.mockResolvedValue([]);
    await settingsApi.probeToolInstallations(["claude"]);
    expect(mockInvoke).toHaveBeenCalledWith("probe_tool_installations", { tools: ["claude"] });
  });

  // rectifier / optimizer / log 配置
  it("getRectifierConfig 调用 get_rectifier_config", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await settingsApi.getRectifierConfig();
    expect(mockInvoke).toHaveBeenCalledWith("get_rectifier_config");
  });
  it("setRectifierConfig 传 config", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.setRectifierConfig({ enabled: true } as any);
    expect(mockInvoke).toHaveBeenCalledWith("set_rectifier_config", { config: { enabled: true } });
  });
  it("getOptimizerConfig 调用 get_optimizer_config", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await settingsApi.getOptimizerConfig();
    expect(mockInvoke).toHaveBeenCalledWith("get_optimizer_config");
  });
  it("setOptimizerConfig 传 config", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.setOptimizerConfig({ enabled: true } as any);
    expect(mockInvoke).toHaveBeenCalledWith("set_optimizer_config", { config: { enabled: true } });
  });
  it("getLogConfig 调用 get_log_config", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await settingsApi.getLogConfig();
    expect(mockInvoke).toHaveBeenCalledWith("get_log_config");
  });
  it("setLogConfig 传 config", async () => {
    mockInvoke.mockResolvedValue(true);
    await settingsApi.setLogConfig({ enabled: true, level: "info" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("set_log_config", {
      config: { enabled: true, level: "info" },
    });
  });

  // backupsApi
  it("createDbBackup 调用 create_db_backup", async () => {
    mockInvoke.mockResolvedValue("backup.db");
    await expect(backupsApi.createDbBackup()).resolves.toBe("backup.db");
    expect(mockInvoke).toHaveBeenCalledWith("create_db_backup");
  });
  it("listDbBackups 调用 list_db_backups", async () => {
    mockInvoke.mockResolvedValue([]);
    await backupsApi.listDbBackups();
    expect(mockInvoke).toHaveBeenCalledWith("list_db_backups");
  });
  it("restoreDbBackup 传 filename", async () => {
    mockInvoke.mockResolvedValue("ok");
    await backupsApi.restoreDbBackup("b.db");
    expect(mockInvoke).toHaveBeenCalledWith("restore_db_backup", { filename: "b.db" });
  });
  it("renameDbBackup 传 oldFilename + newName", async () => {
    mockInvoke.mockResolvedValue("ok");
    await backupsApi.renameDbBackup("old.db", "new.db");
    expect(mockInvoke).toHaveBeenCalledWith("rename_db_backup", {
      oldFilename: "old.db",
      newName: "new.db",
    });
  });
  it("deleteDbBackup 传 filename", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await backupsApi.deleteDbBackup("b.db");
    expect(mockInvoke).toHaveBeenCalledWith("delete_db_backup", { filename: "b.db" });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("io error"));
    await expect(settingsApi.get()).rejects.toThrow("io error");
  });
});
