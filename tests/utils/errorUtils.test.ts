import { describe, expect, it, vi } from "vitest";
import {
  extractErrorMessage,
  translateMcpBackendError,
} from "@/utils/errorUtils";

describe("extractErrorMessage", () => {
  it("falsy 值返回空字符串", () => {
    expect(extractErrorMessage(null)).toBe("");
    expect(extractErrorMessage(undefined)).toBe("");
    expect(extractErrorMessage(0)).toBe("");
    expect(extractErrorMessage(false)).toBe("");
    expect(extractErrorMessage("")).toBe("");
  });

  it("直接返回字符串", () => {
    expect(extractErrorMessage("something went wrong")).toBe(
      "something went wrong",
    );
  });

  it("从 Error 对象提取 message", () => {
    expect(extractErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("Error message 为空白时返回空字符串", () => {
    expect(extractErrorMessage(new Error("   "))).toBe("");
    expect(extractErrorMessage(new Error(""))).toBe("");
  });

  it("从普通对象的 message 字段提取", () => {
    expect(extractErrorMessage({ message: "obj error" })).toBe("obj error");
  });

  it("message 不存在时回退到 error 字段", () => {
    expect(extractErrorMessage({ error: "fallback error" })).toBe(
      "fallback error",
    );
  });

  it("message 和 error 都不存在时回退到 detail 字段", () => {
    expect(extractErrorMessage({ detail: "detail msg" })).toBe("detail msg");
  });

  it("message 优先于 error 和 detail", () => {
    expect(
      extractErrorMessage({ message: "m", error: "e", detail: "d" }),
    ).toBe("m");
  });

  it("error 优先于 detail", () => {
    expect(extractErrorMessage({ error: "e", detail: "d" })).toBe("e");
  });

  it("message 为空白字符串时不会回退到 error/detail（?? 不跳过空串）", () => {
    // ?? 只跳过 null/undefined，空白字符串会命中 candidate 但 trim 失败，最终返回 ""
    expect(extractErrorMessage({ message: "  ", error: "real" })).toBe("");
    expect(extractErrorMessage({ message: "  ", error: "  ", detail: "d" })).toBe("");
  });

  it("message 为 undefined 时回退到 error 字段", () => {
    expect(extractErrorMessage({ error: "real" })).toBe("real");
  });

  it("从 payload 字符串提取", () => {
    expect(extractErrorMessage({ payload: "payload str" })).toBe("payload str");
  });

  it("从 payload 对象的 message 提取", () => {
    expect(
      extractErrorMessage({ payload: { message: "payload msg" } }),
    ).toBe("payload msg");
  });

  it("从 payload 对象的 error 提取", () => {
    expect(
      extractErrorMessage({ payload: { error: "payload err" } }),
    ).toBe("payload err");
  });

  it("从 payload 对象的 detail 提取", () => {
    expect(
      extractErrorMessage({ payload: { detail: "payload detail" } }),
    ).toBe("payload detail");
  });

  it("payload 对象中 message 为空白时不回退到 error（?? 不跳过空串）", () => {
    expect(
      extractErrorMessage({ payload: { message: "  ", error: "pe" } }),
    ).toBe("");
  });

  it("payload 对象中 message 缺失时回退到 error", () => {
    expect(
      extractErrorMessage({ payload: { error: "pe" } }),
    ).toBe("pe");
  });

  it("对象所有字段均为空白或缺失时返回空字符串", () => {
    expect(extractErrorMessage({ message: "  ", error: "" })).toBe("");
    expect(extractErrorMessage({ payload: { message: "  " } })).toBe("");
    expect(extractErrorMessage({ foo: "bar" })).toBe("");
  });

  it("payload 为非对象非字符串时返回空字符串", () => {
    expect(extractErrorMessage({ payload: 42 })).toBe("");
    expect(extractErrorMessage({ payload: null })).toBe("");
  });

  it("未知类型（数字、数组）返回空字符串", () => {
    expect(extractErrorMessage(42)).toBe("");
    expect(extractErrorMessage([1, 2, 3])).toBe("");
    expect(extractErrorMessage(true)).toBe("");
  });
});

describe("translateMcpBackendError", () => {
  // mock t: 返回传入的 key，便于断言映射到了哪个 key
  const t = vi.fn((key: string) => key);

  it("空消息返回空字符串", () => {
    expect(translateMcpBackendError("", t)).toBe("");
    expect(translateMcpBackendError("   ", t)).toBe("");
  });

  it("MCP 服务器 ID 不能为空 -> idRequired", () => {
    expect(
      translateMcpBackendError("错误：MCP 服务器 ID 不能为空", t),
    ).toBe("mcp.error.idRequired");
  });

  it("JSON 对象/字段校验类错误 -> jsonInvalid", () => {
    const messages = [
      "MCP 服务器定义必须为 JSON 对象",
      "MCP 服务器条目必须为 JSON 对象",
      "MCP 服务器条目缺少 server 字段",
      "MCP 服务器 server 字段必须为 JSON 对象",
      "MCP 服务器连接定义必须为 JSON 对象",
      "这个不是对象",
      "服务器配置必须是对象",
      "MCP 服务器 name 必须为字符串",
      "MCP 服务器 description 必须为字符串",
      "MCP 服务器 homepage 必须为字符串",
      "MCP 服务器 docs 必须为字符串",
      "MCP 服务器 tags 必须为字符串数组",
      "MCP 服务器 enabled 必须为布尔值",
      "MCP 服务器 type 必须是 stdio",
    ];
    for (const msg of messages) {
      expect(translateMcpBackendError(msg, t)).toBe("mcp.error.jsonInvalid");
    }
  });

  it("stdio 缺少 command -> commandRequired", () => {
    expect(
      translateMcpBackendError(
        "stdio 类型的 MCP 服务器缺少 command 字段",
        t,
      ),
    ).toBe("mcp.error.commandRequired");
    expect(
      translateMcpBackendError("配置必须包含 command 字段", t),
    ).toBe("mcp.error.commandRequired");
  });

  it("http/sse 缺少 url -> urlRequired", () => {
    expect(
      translateMcpBackendError("http 类型的 MCP 服务器缺少 url 字段", t),
    ).toBe("mcp.wizard.urlRequired");
    expect(
      translateMcpBackendError("sse 类型的 MCP 服务器缺少 url 字段", t),
    ).toBe("mcp.wizard.urlRequired");
    expect(
      translateMcpBackendError("配置必须包含 url 字段", t),
    ).toBe("mcp.wizard.urlRequired");
    expect(translateMcpBackendError("URL 不能为空", t)).toBe(
      "mcp.wizard.urlRequired",
    );
  });

  it("TOML 解析/序列化错误 -> tomlInvalid", () => {
    expect(
      translateMcpBackendError("解析 ~/.claude.json 失败: 语法错误", t),
    ).toBe("mcp.error.tomlInvalid");
    expect(
      translateMcpBackendError("解析 config.toml 失败", t),
    ).toBe("mcp.error.tomlInvalid");
    expect(
      translateMcpBackendError("无法识别的 TOML 格式", t),
    ).toBe("mcp.error.tomlInvalid");
    expect(translateMcpBackendError("TOML 内容不能为空", t)).toBe(
      "mcp.error.tomlInvalid",
    );
    expect(
      translateMcpBackendError("序列化 config.toml 失败", t),
    ).toBe("mcp.error.tomlInvalid");
  });

  it("无法识别的消息返回空字符串", () => {
    expect(translateMcpBackendError("一些未知错误", t)).toBe("");
    expect(translateMcpBackendError("network timeout", t)).toBe("");
  });
});
