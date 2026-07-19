import { describe, it, expect } from "vitest";
import { formatJSON, parseSmartMcpJson } from "@/utils/formatters";

describe("formatJSON", () => {
  it("returns empty string for empty input", () => {
    expect(formatJSON("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(formatJSON("   ")).toBe("");
    expect(formatJSON("\t\n  ")).toBe("");
  });

  it("formats valid JSON with 2-space indentation", () => {
    const result = formatJSON('{"a":1,"b":2}');
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("preserves arrays and nested objects", () => {
    const result = formatJSON('{"list":[1,2],"nested":{"key":"val"}}');
    expect(result).toBe('{\n  "list": [\n    1,\n    2\n  ],\n  "nested": {\n    "key": "val"\n  }\n}');
  });

  it("trims surrounding whitespace before parsing", () => {
    const result = formatJSON('  {"a":1}  ');
    expect(result).toBe('{\n  "a": 1\n}');
  });

  it("throws on invalid JSON", () => {
    expect(() => formatJSON("{invalid}")).toThrow(SyntaxError);
    expect(() => formatJSON('{"a":}')).toThrow(SyntaxError);
    expect(() => formatJSON("not json")).toThrow(SyntaxError);
  });
});

describe("parseSmartMcpJson", () => {
  it("returns empty config for empty input", () => {
    const result = parseSmartMcpJson("");
    expect(result).toEqual({ config: {}, formattedConfig: "" });
  });

  it("returns empty config for whitespace-only input", () => {
    const result = parseSmartMcpJson("   ");
    expect(result).toEqual({ config: {}, formattedConfig: "" });
  });

  it("parses a direct config object (no id)", () => {
    const json = '{"command":"npx","args":["-y","server"]}';
    const result = parseSmartMcpJson(json);
    expect(result.id).toBeUndefined();
    expect(result.config).toEqual({ command: "npx", args: ["-y", "server"] });
    expect(result.formattedConfig).toBe(
      '{\n  "command": "npx",\n  "args": [\n    "-y",\n    "server"\n  ]\n}',
    );
  });

  it("extracts id and config from a single-key wrapper object", () => {
    const json = '{"my-server":{"command":"npx","args":["-y"]}}';
    const result = parseSmartMcpJson(json);
    expect(result.id).toBe("my-server");
    expect(result.config).toEqual({ command: "npx", args: ["-y"] });
    expect(result.formattedConfig).toBe(
      '{\n  "command": "npx",\n  "args": [\n    "-y"\n  ]\n}',
    );
  });

  it("wraps and extracts a bare key-value fragment", () => {
    // "key": {...}  -> wrapped to {"key": {...}}
    const fragment = '"my-server": { "command": "uvx" }';
    const result = parseSmartMcpJson(fragment);
    expect(result.id).toBe("my-server");
    expect(result.config).toEqual({ command: "uvx" });
  });

  it("uses config as-is when single key has a non-object value", () => {
    const json = '{"a":1}';
    const result = parseSmartMcpJson(json);
    expect(result.id).toBeUndefined();
    expect(result.config).toEqual({ a: 1 });
  });

  it("uses config as-is when single key has an array value", () => {
    const json = '{"items":[1,2,3]}';
    const result = parseSmartMcpJson(json);
    expect(result.id).toBeUndefined();
    expect(result.config).toEqual({ items: [1, 2, 3] });
  });

  it("uses config as-is when object has multiple keys", () => {
    const json = '{"command":"npx","timeout":30}';
    const result = parseSmartMcpJson(json);
    expect(result.id).toBeUndefined();
    expect(result.config).toEqual({ command: "npx", timeout: 30 });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseSmartMcpJson("{invalid}")).toThrow(SyntaxError);
    expect(() => parseSmartMcpJson('{"a":}')).toThrow(SyntaxError);
  });
});
