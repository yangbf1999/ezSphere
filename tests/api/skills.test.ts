import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// skills.ts: 统一 API + 兼容旧 API。纯逻辑分支：
// - getAll/install/uninstall：app==='claude' 走旧命令，否则走 *_for_app
// - restoreBackup / installFromZip：忽略 currentApp，固定传 currentApp:''

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { skillsApi } from "@/lib/api/skills";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("skills API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  // 统一 API
  it("getInstalled 调用 get_installed_skills", async () => {
    mockInvoke.mockResolvedValue([]);
    await skillsApi.getInstalled();
    expect(mockInvoke).toHaveBeenCalledWith("get_installed_skills");
  });
  it("getBackups 调用 get_skill_backups", async () => {
    mockInvoke.mockResolvedValue([]);
    await skillsApi.getBackups();
    expect(mockInvoke).toHaveBeenCalledWith("get_skill_backups");
  });
  it("deleteBackup 传 backupId", async () => {
    mockInvoke.mockResolvedValue(true);
    await skillsApi.deleteBackup("b1");
    expect(mockInvoke).toHaveBeenCalledWith("delete_skill_backup", { backupId: "b1" });
  });
  it("installUnified 传 skill + currentApp", async () => {
    mockInvoke.mockResolvedValue({ id: "s" } as any);
    const skill = { key: "k", name: "n", directory: "d", repoOwner: "o", repoName: "r", repoBranch: "b" } as any;
    await skillsApi.installUnified(skill, "claude");
    expect(mockInvoke).toHaveBeenCalledWith("install_skill_unified", { skill, currentApp: "claude" });
  });
  it("uninstallUnified 传 id", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await skillsApi.uninstallUnified("s1");
    expect(mockInvoke).toHaveBeenCalledWith("uninstall_skill_unified", { id: "s1" });
  });
  it("toggleApp 传 id + app + enabled", async () => {
    mockInvoke.mockResolvedValue(true);
    await skillsApi.toggleApp("s1", "codex", true);
    expect(mockInvoke).toHaveBeenCalledWith("toggle_skill_app", { id: "s1", app: "codex", enabled: true });
  });
  it("scanUnmanaged 调用 scan_unmanaged_skills", async () => {
    mockInvoke.mockResolvedValue([]);
    await skillsApi.scanUnmanaged();
    expect(mockInvoke).toHaveBeenCalledWith("scan_unmanaged_skills");
  });
  it("importFromApps 传 imports 数组", async () => {
    mockInvoke.mockResolvedValue([]);
    await skillsApi.importFromApps([{ directory: "d", apps: {} } as any]);
    expect(mockInvoke).toHaveBeenCalledWith("import_skills_from_apps", {
      imports: [{ directory: "d", apps: {} }],
    });
  });
  it("discoverAvailable 调用 discover_available_skills", async () => {
    mockInvoke.mockResolvedValue([]);
    await skillsApi.discoverAvailable();
    expect(mockInvoke).toHaveBeenCalledWith("discover_available_skills");
  });
  it("checkUpdates 调用 check_skill_updates", async () => {
    mockInvoke.mockResolvedValue([]);
    await skillsApi.checkUpdates();
    expect(mockInvoke).toHaveBeenCalledWith("check_skill_updates");
  });
  it("updateSkill 传 id", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await skillsApi.updateSkill("s1");
    expect(mockInvoke).toHaveBeenCalledWith("update_skill", { id: "s1" });
  });
  it("migrateStorage 传 target", async () => {
    mockInvoke.mockResolvedValue({ migratedCount: 1, skippedCount: 0, errors: [] } as any);
    await skillsApi.migrateStorage("unified");
    expect(mockInvoke).toHaveBeenCalledWith("migrate_skill_storage", { target: "unified" });
  });
  it("searchSkillsSh 传 query + limit + offset", async () => {
    mockInvoke.mockResolvedValue({ skills: [], totalCount: 0, query: "q" } as any);
    await skillsApi.searchSkillsSh("q", 10, 0);
    expect(mockInvoke).toHaveBeenCalledWith("search_skills_sh", { query: "q", limit: 10, offset: 0 });
  });

  // restoreBackup：忽略 currentApp，固定传 currentApp:''
  describe("restoreBackup", () => {
    it("传 backupId，currentApp 固定为空串（即使传入 currentApp 也被忽略）", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await skillsApi.restoreBackup("b1", "codex");
      expect(mockInvoke).toHaveBeenCalledWith("restore_skill_backup", { backupId: "b1", currentApp: "" });
    });
    it("不传 currentApp：仍传 currentApp:''", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await skillsApi.restoreBackup("b1");
      expect(mockInvoke).toHaveBeenCalledWith("restore_skill_backup", { backupId: "b1", currentApp: "" });
    });
  });

  // 兼容旧 API 分支
  describe("getAll (app 分支)", () => {
    it("app=claude：调用 get_skills 无 app 参数", async () => {
      mockInvoke.mockResolvedValue([]);
      await skillsApi.getAll("claude");
      expect(mockInvoke).toHaveBeenCalledWith("get_skills");
    });
    it("app=codex：调用 get_skills_for_app 传 app", async () => {
      mockInvoke.mockResolvedValue([]);
      await skillsApi.getAll("codex");
      expect(mockInvoke).toHaveBeenCalledWith("get_skills_for_app", { app: "codex" });
    });
    it("默认 app=claude", async () => {
      mockInvoke.mockResolvedValue([]);
      await skillsApi.getAll();
      expect(mockInvoke).toHaveBeenCalledWith("get_skills");
    });
  });

  describe("install (app 分支)", () => {
    it("app=claude：调用 install_skill 传 directory", async () => {
      mockInvoke.mockResolvedValue(true);
      await skillsApi.install("/d", "claude");
      expect(mockInvoke).toHaveBeenCalledWith("install_skill", { directory: "/d" });
    });
    it("app=gemini：调用 install_skill_for_app 传 app + directory", async () => {
      mockInvoke.mockResolvedValue(true);
      await skillsApi.install("/d", "gemini");
      expect(mockInvoke).toHaveBeenCalledWith("install_skill_for_app", { app: "gemini", directory: "/d" });
    });
  });

  describe("uninstall (app 分支)", () => {
    it("app=claude：调用 uninstall_skill 传 directory", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await skillsApi.uninstall("/d", "claude");
      expect(mockInvoke).toHaveBeenCalledWith("uninstall_skill", { directory: "/d" });
    });
    it("app=codex：调用 uninstall_skill_for_app 传 app + directory", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await skillsApi.uninstall("/d", "codex");
      expect(mockInvoke).toHaveBeenCalledWith("uninstall_skill_for_app", { app: "codex", directory: "/d" });
    });
  });

  // 仓库管理
  it("getRepos 调用 get_skill_repos", async () => {
    mockInvoke.mockResolvedValue([]);
    await skillsApi.getRepos();
    expect(mockInvoke).toHaveBeenCalledWith("get_skill_repos");
  });
  it("addRepo 传 repo", async () => {
    mockInvoke.mockResolvedValue(true);
    const repo = { owner: "o", name: "r", branch: "b", enabled: true };
    await skillsApi.addRepo(repo as any);
    expect(mockInvoke).toHaveBeenCalledWith("add_skill_repo", { repo });
  });
  it("removeRepo 传 owner + name", async () => {
    mockInvoke.mockResolvedValue(true);
    await skillsApi.removeRepo("o", "r");
    expect(mockInvoke).toHaveBeenCalledWith("remove_skill_repo", { owner: "o", name: "r" });
  });

  // ZIP
  it("openZipFileDialog 调用 open_zip_file_dialog", async () => {
    mockInvoke.mockResolvedValue(null);
    await skillsApi.openZipFileDialog();
    expect(mockInvoke).toHaveBeenCalledWith("open_zip_file_dialog");
  });
  describe("installFromZip", () => {
    it("传 filePath，currentApp 固定为空串（即使传入 currentApp 也被忽略）", async () => {
      mockInvoke.mockResolvedValue([]);
      await skillsApi.installFromZip("/x.zip", "codex");
      expect(mockInvoke).toHaveBeenCalledWith("install_skills_from_zip", {
        filePath: "/x.zip",
        currentApp: "",
      });
    });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("repo unreachable"));
    await expect(skillsApi.discoverAvailable()).rejects.toThrow("repo unreachable");
  });
});
