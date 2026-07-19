import { describe, it, expect } from "vitest";
import { parse as parseToml } from "smol-toml";
import {
  validateToml,
  mcpServerToToml,
  tomlToMcpServer,
  extractIdFromToml,
} from "@/utils/tomlUtils";

// ---------------------------------------------------------------------------
// validateToml
// ---------------------------------------------------------------------------

describe("validateToml", () => {
  it("returns empty string for empty / whitespace input", () => {
    expect(validateToml("")).toBe("");
    expect(validateToml("   ")).toBe("");
  });

  it("returns empty string for valid TOML", () => {
    expect(validateToml('command = "npx"')).toBe("");
    expect(
      validateToml("[mcp_servers.my-server]\ntype = \"stdio\"\ncommand = \"npx\""),
    ).toBe("");
  });

  it("returns an error message for invalid TOML", () => {
    const result = validateToml('type = "stdio');
    expect(result).not.toBe("");
    expect(typeof result).toBe("string");
  });

  it("normalizes curly quotes before parsing", () => {
    // Curly quotes would break TOML, but normalizeTomlText converts them
    expect(validateToml('command = “npx”')).toBe("");
  });
});

// ---------------------------------------------------------------------------
// mcpServerToToml
// ---------------------------------------------------------------------------

describe("mcpServerToToml", () => {
  it("serialises a stdio server and round-trips through smol-toml", () => {
    const server = {
      type: "stdio" as const,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
    };
    const toml = mcpServerToToml(server);
    const parsed = parseToml(toml) as any;
    expect(parsed.type).toBe("stdio");
    expect(parsed.command).toBe("npx");
    expect(parsed.args).toEqual(["-y", "@modelcontextprotocol/server-memory"]);
  });

  it("serialises an http server with headers", () => {
    const server = {
      type: "http" as const,
      url: "http://localhost:8080/sse",
      headers: { Authorization: "Bearer token" },
    };
    const toml = mcpServerToToml(server);
    const parsed = parseToml(toml) as any;
    expect(parsed.type).toBe("http");
    expect(parsed.url).toBe("http://localhost:8080/sse");
    expect(parsed.headers.Authorization).toBe("Bearer token");
  });

  it("removes undefined fields from output", () => {
    const server = {
      type: "stdio" as const,
      command: "npx",
      args: undefined,
      env: undefined,
    };
    const toml = mcpServerToToml(server);
    const parsed = parseToml(toml) as any;
    expect(parsed.type).toBe("stdio");
    expect(parsed.command).toBe("npx");
    expect(parsed.args).toBeUndefined();
    expect(parsed.env).toBeUndefined();
  });

  it("preserves extra / extension fields like timeout_ms", () => {
    const server = {
      type: "stdio" as const,
      command: "npx",
      timeout_ms: 5000,
    };
    const toml = mcpServerToToml(server);
    const parsed = parseToml(toml) as any;
    expect(parsed.timeout_ms).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// tomlToMcpServer
// ---------------------------------------------------------------------------

describe("tomlToMcpServer", () => {
  it("throws on empty input", () => {
    expect(() => tomlToMcpServer("")).toThrow("TOML 内容不能为空");
    expect(() => tomlToMcpServer("   ")).toThrow("TOML 内容不能为空");
  });

  it("parses a direct stdio config", () => {
    const toml = `
type = "stdio"
command = "npx"
args = ["-y", "server"]
`;
    const result = tomlToMcpServer(toml);
    expect(result.type).toBe("stdio");
    expect(result.command).toBe("npx");
    expect(result.args).toEqual(["-y", "server"]);
  });

  it("defaults type to stdio when omitted", () => {
    const toml = `command = "uvx"`;
    const result = tomlToMcpServer(toml);
    expect(result.type).toBe("stdio");
    expect(result.command).toBe("uvx");
  });

  it("parses a direct http config with headers", () => {
    const toml = `
type = "http"
url = "http://localhost:8080/sse"
headers = { Authorization = "Bearer token" }
`;
    const result = tomlToMcpServer(toml);
    expect(result.type).toBe("http");
    expect(result.url).toBe("http://localhost:8080/sse");
    expect(result.headers).toEqual({ Authorization: "Bearer token" });
  });

  it("parses an sse config", () => {
    const toml = `
type = "sse"
url = "http://localhost:9000/events"
`;
    const result = tomlToMcpServer(toml);
    expect(result.type).toBe("sse");
    expect(result.url).toBe("http://localhost:9000/events");
  });

  it("parses [mcp_servers.<id>] format and extracts the first server", () => {
    const toml = `
[mcp_servers.my-server]
type = "stdio"
command = "npx"
args = ["-y"]
`;
    const result = tomlToMcpServer(toml);
    expect(result.type).toBe("stdio");
    expect(result.command).toBe("npx");
    expect(result.args).toEqual(["-y"]);
  });

  it("parses [mcp.servers.<id>] error-tolerant format", () => {
    const toml = `
[mcp.servers.my-server]
type = "http"
url = "http://localhost:8080"
`;
    const result = tomlToMcpServer(toml);
    expect(result.type).toBe("http");
    expect(result.url).toBe("http://localhost:8080");
  });

  it("coerces numeric args to strings", () => {
    const toml = `
type = "stdio"
command = "npx"
args = [1, 2, 3]
`;
    const result = tomlToMcpServer(toml);
    expect(result.args).toEqual(["1", "2", "3"]);
  });

  it("coerces numeric env values to strings", () => {
    const toml = `
type = "stdio"
command = "npx"
env = { PORT = 8080, DEBUG = "true" }
`;
    const result = tomlToMcpServer(toml);
    expect(result.env).toEqual({ PORT: "8080", DEBUG: "true" });
  });

  it("preserves unknown extension fields", () => {
    const toml = `
type = "stdio"
command = "npx"
timeout_ms = 3000
`;
    const result = tomlToMcpServer(toml);
    expect((result as any).timeout_ms).toBe(3000);
  });

  it("throws for stdio config missing command", () => {
    const toml = `type = "stdio"`;
    expect(() => tomlToMcpServer(toml)).toThrow(
      "stdio 类型的 MCP 服务器必须包含 command 字段",
    );
  });

  it("throws for http config missing url", () => {
    const toml = `type = "http"`;
    expect(() => tomlToMcpServer(toml)).toThrow(
      "http 类型的 MCP 服务器必须包含 url 字段",
    );
  });

  it("throws for sse config missing url", () => {
    const toml = `type = "sse"`;
    expect(() => tomlToMcpServer(toml)).toThrow(
      "sse 类型的 MCP 服务器必须包含 url 字段",
    );
  });

  it("throws for unsupported server type", () => {
    const toml = `
type = "websocket"
command = "npx"
`;
    expect(() => tomlToMcpServer(toml)).toThrow(
      "不支持的 MCP 服务器类型: websocket",
    );
  });

  it("throws for unrecognized TOML structure", () => {
    const toml = `[unknown_section]\nfoo = "bar"`;
    expect(() => tomlToMcpServer(toml)).toThrow("无法识别的 TOML 格式");
  });

  it("throws on invalid TOML syntax", () => {
    expect(() => tomlToMcpServer('type = "stdio')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// extractIdFromToml
// ---------------------------------------------------------------------------

describe("extractIdFromToml", () => {
  it("extracts id from [mcp_servers.<id>] format", () => {
    const toml = `
[mcp_servers.my-server]
type = "stdio"
command = "npx"
`;
    expect(extractIdFromToml(toml)).toBe("my-server");
  });

  it("extracts id from [mcp.servers.<id>] format", () => {
    const toml = `
[mcp.servers.another-server]
type = "http"
url = "http://localhost"
`;
    expect(extractIdFromToml(toml)).toBe("another-server");
  });

  it("infers id from command basename (removes extension)", () => {
    const toml = `command = "/usr/bin/my-server.sh"`;
    expect(extractIdFromToml(toml)).toBe("my-server");
  });

  it("removes .exe extension on Windows-style paths", () => {
    const toml = `command = "C:\\\\tools\\\\mcp.exe"`;
    expect(extractIdFromToml(toml)).toBe("mcp");
  });

  it("returns empty string for unrecognized structure", () => {
    const toml = `[unknown]\nkey = "value"`;
    expect(extractIdFromToml(toml)).toBe("");
  });

  it("returns empty string for invalid TOML", () => {
    expect(extractIdFromToml('type = "invalid')).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(extractIdFromToml("")).toBe("");
  });
});
