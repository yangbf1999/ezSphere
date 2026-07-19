import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// workspace.ts: 工作区文件 + 每日记忆 CRUD/搜索。薄封装。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { workspaceApi } from "@/lib/api/workspace";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("workspace API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("readFile 传 filename", async () => {
    mockInvoke.mockResolvedValue("content");
    await expect(workspaceApi.readFile("notes.md")).resolves.toBe("content");
    expect(mockInvoke).toHaveBeenCalledWith("read_workspace_file", { filename: "notes.md" });
  });

  it("writeFile 传 filename + content", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await workspaceApi.writeFile("notes.md", "hello");
    expect(mockInvoke).toHaveBeenCalledWith("write_workspace_file", {
      filename: "notes.md",
      content: "hello",
    });
  });

  it("listDailyMemoryFiles 无参", async () => {
    mockInvoke.mockResolvedValue([]);
    await workspaceApi.listDailyMemoryFiles();
    expect(mockInvoke).toHaveBeenCalledWith("list_daily_memory_files");
  });

  it("readDailyMemoryFile 传 filename", async () => {
    mockInvoke.mockResolvedValue(null);
    await workspaceApi.readDailyMemoryFile("2026-07-15.md");
    expect(mockInvoke).toHaveBeenCalledWith("read_daily_memory_file", {
      filename: "2026-07-15.md",
    });
  });

  it("writeDailyMemoryFile 传 filename + content", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await workspaceApi.writeDailyMemoryFile("2026-07-15.md", "day");
    expect(mockInvoke).toHaveBeenCalledWith("write_daily_memory_file", {
      filename: "2026-07-15.md",
      content: "day",
    });
  });

  it("deleteDailyMemoryFile 传 filename", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await workspaceApi.deleteDailyMemoryFile("2026-07-15.md");
    expect(mockInvoke).toHaveBeenCalledWith("delete_daily_memory_file", {
      filename: "2026-07-15.md",
    });
  });

  it("searchDailyMemoryFiles 传 query", async () => {
    mockInvoke.mockResolvedValue([]);
    await workspaceApi.searchDailyMemoryFiles("keyword");
    expect(mockInvoke).toHaveBeenCalledWith("search_daily_memory_files", { query: "keyword" });
  });

  describe("openDirectory", () => {
    it("传 subdir=workspace", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await workspaceApi.openDirectory("workspace");
      expect(mockInvoke).toHaveBeenCalledWith("open_workspace_directory", { subdir: "workspace" });
    });
    it("传 subdir=memory", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await workspaceApi.openDirectory("memory");
      expect(mockInvoke).toHaveBeenCalledWith("open_workspace_directory", { subdir: "memory" });
    });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("disk full"));
    await expect(workspaceApi.writeFile("x", "y")).rejects.toThrow("disk full");
  });
});
