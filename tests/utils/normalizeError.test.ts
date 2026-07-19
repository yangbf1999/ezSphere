import { describe, it, expect } from "vitest";
import { errorToKey, normalizeError } from "@/utils/normalizeError";

describe("errorToKey", () => {
  it("returns requestFailed for empty / whitespace-only messages", () => {
    expect(errorToKey("")).toBe("error.requestFailed");
    expect(errorToKey("   ")).toBe("error.requestFailed");
    expect(errorToKey("\t\n")).toBe("error.requestFailed");
  });

  it("detects user-initiated cancellation", () => {
    expect(errorToKey("aborted")).toBe("error.userCancelled");
    expect(errorToKey("user abort")).toBe("error.userCancelled");
    expect(errorToKey("cancelled")).toBe("error.userCancelled");
    expect(errorToKey("canceled")).toBe("error.userCancelled");
    expect(errorToKey("agent aborted")).toBe("error.userCancelled");
    expect(errorToKey("the request was abort by client")).toBe(
      "error.userCancelled",
    );
  });

  it("detects connection timeout (including Windows 10060 and Chinese OS text)", () => {
    expect(errorToKey("Error 10060: connection attempt failed")).toBe(
      "error.connectionTimeout",
    );
    expect(errorToKey("Request timed out")).toBe("error.connectionTimeout");
    expect(errorToKey("operation timeout")).toBe("error.connectionTimeout");
    expect(errorToKey("连接超时，没有回应")).toBe("error.connectionTimeout");
    expect(errorToKey("服务器没有正确答复")).toBe("error.connectionTimeout");
    expect(errorToKey("connection timed out")).toBe("error.connectionTimeout");
    expect(errorToKey("stream stalled")).toBe("error.connectionTimeout");
  });

  it("detects SSH / host unreachable / network errors", () => {
    expect(errorToKey("ssh: connect failed")).toBe("error.serverUnreachable");
    expect(errorToKey("connection refused")).toBe("error.serverUnreachable");
    expect(errorToKey("connection failed")).toBe("error.serverUnreachable");
    expect(errorToKey("host key verification failed")).toBe(
      "error.serverUnreachable",
    );
    expect(errorToKey("network is unreachable")).toBe(
      "error.serverUnreachable",
    );
    expect(errorToKey("no route to host")).toBe("error.serverUnreachable");
  });

  it("detects agent startup failure", () => {
    expect(errorToKey("agent start failed")).toBe("error.agentFailed");
    expect(errorToKey("agent failed to launch")).toBe("error.agentFailed");
  });

  it("detects missing server id", () => {
    expect(errorToKey("no server id configured")).toBe("error.noServerConfig");
    expect(errorToKey("missing server id")).toBe("error.noServerConfig");
  });

  it("detects missing model", () => {
    expect(errorToKey("no model selected")).toBe("error.noModelSelected");
    expect(errorToKey("model data unavailable")).toBe("error.noModelSelected");
    expect(errorToKey("model not found")).toBe("error.noModelSelected");
  });

  it("returns null for uncategorized informative messages", () => {
    expect(errorToKey("Invalid API Key")).toBeNull();
    expect(errorToKey("Rate limit exceeded")).toBeNull();
    expect(errorToKey("You exceeded your quota")).toBeNull();
    expect(errorToKey("一些未知错误")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(errorToKey("ABORTED")).toBe("error.userCancelled");
    expect(errorToKey("Connection REFUSED")).toBe("error.serverUnreachable");
    expect(errorToKey("TIMED OUT")).toBe("error.connectionTimeout");
  });

  it("prioritises cancellation over later categories", () => {
    // "agent aborted" contains both "abort" and "agent" - cancel check wins
    expect(errorToKey("agent aborted")).toBe("error.userCancelled");
    // "timeout" appears but so does "abort"
    expect(errorToKey("abort: timeout reached")).toBe("error.userCancelled");
  });

  it("prioritises timeout over ssh", () => {
    // "connection timed out" matches both timeout and "connection" patterns
    expect(errorToKey("connection timed out")).toBe("error.connectionTimeout");
  });
});

describe("normalizeError", () => {
  const t = (key: string) => `[${key}]`;

  it("translates categorized errors via t()", () => {
    expect(normalizeError("aborted", t)).toBe("[error.userCancelled]");
    expect(normalizeError("request timed out", t)).toBe(
      "[error.connectionTimeout]",
    );
  });

  it("returns requestFailed translation for empty input", () => {
    expect(normalizeError("", t)).toBe("[error.requestFailed]");
    expect(normalizeError("   ", t)).toBe("[error.requestFailed]");
  });

  it("returns raw message verbatim for uncategorized short messages", () => {
    expect(normalizeError("Invalid API Key", t)).toBe("Invalid API Key");
    expect(normalizeError("Rate limit exceeded", t)).toBe(
      "Rate limit exceeded",
    );
  });

  it("truncates uncategorized messages longer than 500 characters", () => {
    const long = "x".repeat(600);
    const result = normalizeError(long, t);
    expect(result).toHaveLength(501); // 500 chars + ellipsis
    expect(result).toBe("x".repeat(500) + "…");
    // ensure it wasn't categorized
    expect(result).not.toContain("[error");
  });

  it("does not truncate messages exactly 500 chars", () => {
    const exact = "y".repeat(500);
    expect(normalizeError(exact, t)).toBe(exact);
  });

  it("coerces non-string input to string", () => {
    expect(normalizeError(12345, t)).toBe("12345");
    // String(null) = "null", String(undefined) = "undefined" - neither matches
    // a known error category, so they fall through as uncategorized raw text
    expect(normalizeError(null, t)).toBe("null");
    expect(normalizeError(undefined, t)).toBe("undefined");
  });

  it("trims surrounding whitespace before matching", () => {
    expect(normalizeError("  aborted  ", t)).toBe("[error.userCancelled]");
  });
});
