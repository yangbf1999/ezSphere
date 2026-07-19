import { describe, it, expect } from "vitest";
import { normalizeQuotes, normalizeTomlText } from "@/utils/textNormalization";

describe("normalizeQuotes", () => {
  it("returns falsy input as-is", () => {
    expect(normalizeQuotes("")).toBe("");
  });

  it("normalizes curly double quotes to ASCII double quote", () => {
    expect(normalizeQuotes("“hello”")).toBe('"hello"'); // U+201C / U+201D
    expect(normalizeQuotes("„quote‟")).toBe('"quote"'); // U+201E / U+201F
    expect(normalizeQuotes("＂test")).toBe('"test'); // U+FF02 fullwidth quotation mark
  });

  it("normalizes curly single quotes to ASCII single quote", () => {
    expect(normalizeQuotes("‘hello’")).toBe("'hello'"); // U+2018 / U+2019
    expect(normalizeQuotes("＇mark")).toBe("'mark"); // U+FF07 fullwidth apostrophe
  });

  it("handles mixed quote types in a single string", () => {
    const input = "“It’s a “test””";
    expect(normalizeQuotes(input)).toBe('"It\'s a "test""');
  });

  it("leaves ASCII quotes and other text untouched", () => {
    expect(normalizeQuotes('"already ascii"')).toBe('"already ascii"');
    expect(normalizeQuotes("'already ascii'")).toBe("'already ascii'");
    expect(normalizeQuotes("no quotes here")).toBe("no quotes here");
  });

  it("does not touch book-title / corner brackets", () => {
    // 《》「」『』 should be preserved
    const input = "《书名》「角引号」『二重角』";
    expect(normalizeQuotes(input)).toBe(input);
  });

  it("handles strings with multiple occurrences", () => {
    const input = "“word1” and “word2”";
    expect(normalizeQuotes(input)).toBe('"word1" and "word2"');
  });
});

describe("normalizeTomlText", () => {
  it("delegates to normalizeQuotes for quote normalization", () => {
    expect(normalizeTomlText("“hello”")).toBe('"hello"');
    expect(normalizeTomlText("‘it’s")).toBe("'it's");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeTomlText("")).toBe("");
  });

  it("passes through already-normalized text", () => {
    const toml = 'command = "npx"\nargs = ["-y"]';
    expect(normalizeTomlText(toml)).toBe(toml);
  });

  it("normalizes quotes inside a realistic TOML snippet", () => {
    // Curly quotes around the value would break TOML parsing
    const input = "command = “npx”";
    expect(normalizeTomlText(input)).toBe('command = "npx"');
  });
});
