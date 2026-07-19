import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// prompts.ts: promptsApi 薄封装，均带 app 参数。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { promptsApi } from "@/lib/api/prompts";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("prompts API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("getPrompts 调用 get_prompts 传 app", async () => {
    mockInvoke.mockResolvedValue({ p1: { id: "p1", name: "n", content: "c", enabled: true } });
    await promptsApi.getPrompts("claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_prompts", { app: "claude" });
  });

  it("upsertPrompt 调用 upsert_prompt 传 app + id + prompt", async () => {
    mockInvoke.mockResolvedValue(undefined);
    const prompt = { id: "p1", name: "n", content: "c", enabled: true };
    await promptsApi.upsertPrompt("codex", "p1", prompt as any);
    expect(mockInvoke).toHaveBeenCalledWith("upsert_prompt", {
      app: "codex",
      id: "p1",
      prompt,
    });
  });

  it("deletePrompt 调用 delete_prompt 传 app + id", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await promptsApi.deletePrompt("claude", "p1");
    expect(mockInvoke).toHaveBeenCalledWith("delete_prompt", { app: "claude", id: "p1" });
  });

  it("enablePrompt 调用 enable_prompt 传 app + id", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await promptsApi.enablePrompt("gemini", "p1");
    expect(mockInvoke).toHaveBeenCalledWith("enable_prompt", { app: "gemini", id: "p1" });
  });

  it("importFromFile 调用 import_prompt_from_file 传 app", async () => {
    mockInvoke.mockResolvedValue("imported-id");
    await expect(promptsApi.importFromFile("claude")).resolves.toBe("imported-id");
    expect(mockInvoke).toHaveBeenCalledWith("import_prompt_from_file", { app: "claude" });
  });

  it("getCurrentFileContent 调用 get_current_prompt_file_content 传 app", async () => {
    mockInvoke.mockResolvedValue(null);
    await promptsApi.getCurrentFileContent("claude");
    expect(mockInvoke).toHaveBeenCalledWith("get_current_prompt_file_content", { app: "claude" });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("permission denied"));
    await expect(promptsApi.upsertPrompt("claude", "p1", {} as any)).rejects.toThrow(
      "permission denied",
    );
  });
});
