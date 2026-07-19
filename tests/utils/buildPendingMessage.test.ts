import { describe, expect, it } from "vitest";
import {
  buildPendingMessage,
  type PendingFile,
  type PendingModel,
} from "@/utils/buildPendingMessage";

describe("buildPendingMessage", () => {
  it("空输入、空文件、空模型时返回空结果", () => {
    const result = buildPendingMessage("", [], []);
    expect(result.messageText).toBe("");
    expect(result.chips).toEqual([]);
  });

  it("仅有用户输入时 messageText 为输入文本，无 chips", () => {
    const result = buildPendingMessage("你好", [], []);
    expect(result.messageText).toBe("你好");
    expect(result.chips).toEqual([]);
  });

  it("用户输入被 trim", () => {
    const result = buildPendingMessage("  hello world  ", [], []);
    expect(result.messageText).toBe("hello world");
  });

  it("纯空白用户输入被忽略", () => {
    const result = buildPendingMessage("   ", [], []);
    expect(result.messageText).toBe("");
  });

  it("文件类型附件生成 [File] 行和 file chip", () => {
    const files: PendingFile[] = [
      { id: "f1", name: "doc.pdf", type: "file" },
      { id: "f2", name: "data.csv", type: "file" },
    ];
    const result = buildPendingMessage("", files, []);
    expect(result.messageText).toBe(
      "[Attached files]\n- [File: doc.pdf]\n- [File: data.csv]",
    );
    expect(result.chips).toEqual([
      { type: "file", name: "doc.pdf", preview: undefined },
      { type: "file", name: "data.csv", preview: undefined },
    ]);
  });

  it("图片类型附件含 preview 时生成 [Image] 行和 image chip", () => {
    const files: PendingFile[] = [
      {
        id: "img1",
        name: "screenshot.png",
        type: "image",
        preview: "data:image/png;base64,abc123",
      },
    ];
    const result = buildPendingMessage("", files, []);
    expect(result.messageText).toBe(
      "[Attached files]\n- [Image: screenshot.png]\n  data: data:image/png;base64,abc123",
    );
    expect(result.chips).toEqual([
      {
        type: "image",
        name: "screenshot.png",
        preview: "data:image/png;base64,abc123",
      },
    ]);
  });

  it("图片类型无 preview 时退化为 [File] 行但 chip 类型为 image", () => {
    const files: PendingFile[] = [
      { id: "img2", name: "no-preview.jpg", type: "image" },
    ];
    const result = buildPendingMessage("", files, []);
    expect(result.messageText).toContain("[File: no-preview.jpg]");
    expect(result.chips).toEqual([
      { type: "image", name: "no-preview.jpg", preview: undefined },
    ]);
  });

  it("模型生成 [MODEL CONFIG] 块和 model chip", () => {
    const models: PendingModel[] = [
      {
        id: "m1",
        name: "My Model",
        modelId: "claude-sonnet-4",
        baseUrl: "https://api.x.com",
        anthropicUrl: "https://anthropic.x.com",
        apiKey: "sk-key",
      },
    ];
    const result = buildPendingMessage("", [], models);
    expect(result.messageText).toBe(
      [
        "[MODEL CONFIG]",
        "Name: My Model",
        "Model: claude-sonnet-4",
        "Base URL: https://api.x.com",
        "Anthropic URL: https://anthropic.x.com",
        "API Key: sk-key",
        "[/MODEL CONFIG]",
      ].join("\n"),
    );
    expect(result.chips).toEqual([
      { type: "model", name: "My Model", modelId: "claude-sonnet-4" },
    ]);
  });

  it("模型仅含 name 时只生成 Name 行", () => {
    const models: PendingModel[] = [{ id: "m1", name: "Bare Model" }];
    const result = buildPendingMessage("", [], models);
    expect(result.messageText).toBe(
      "[MODEL CONFIG]\nName: Bare Model\n[/MODEL CONFIG]",
    );
  });

  it("多个模型配置块之间用空行分隔", () => {
    const models: PendingModel[] = [
      { id: "m1", name: "Model A", modelId: "a-1" },
      { id: "m2", name: "Model B", modelId: "b-2" },
    ];
    const result = buildPendingMessage("", [], models);
    expect(result.messageText).toContain(
      "[/MODEL CONFIG]\n\n[MODEL CONFIG]",
    );
    expect(result.chips).toHaveLength(2);
    expect(result.chips[0]).toEqual({
      type: "model",
      name: "Model A",
      modelId: "a-1",
    });
    expect(result.chips[1]).toEqual({
      type: "model",
      name: "Model B",
      modelId: "b-2",
    });
  });

  it("用户输入、文件、模型同时存在时用双换行拼接", () => {
    const files: PendingFile[] = [
      { id: "f1", name: "note.txt", type: "file" },
    ];
    const models: PendingModel[] = [
      { id: "m1", name: "GPT", modelId: "gpt-4" },
    ];
    const result = buildPendingMessage("请分析", files, models);
    const parts = result.messageText.split("\n\n");
    expect(parts[0]).toBe("请分析");
    expect(parts[1]).toBe("[Attached files]\n- [File: note.txt]");
    expect(parts[2]).toContain("[MODEL CONFIG]");
    expect(result.chips).toEqual([
      { type: "file", name: "note.txt", preview: undefined },
      { type: "model", name: "GPT", modelId: "gpt-4" },
    ]);
  });

  it("_skills 参数被接受但不影响输出", () => {
    const result = buildPendingMessage("hi", [], [], [
      { id: "s1", name: "skill" } as any,
    ]);
    expect(result.messageText).toBe("hi");
    expect(result.chips).toEqual([]);
  });
});
