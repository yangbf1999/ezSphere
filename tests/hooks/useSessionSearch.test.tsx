import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { useSessionSearch } from "@/hooks/useSessionSearch";
import { createTestQueryClient } from "../utils/testQueryClient";
import type { SessionMeta } from "@/types";

interface WrapperProps {
  children: ReactNode;
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  return { wrapper };
}

const sessions: SessionMeta[] = [
  {
    providerId: "openai",
    sessionId: "sess-1",
    title: "React hooks discussion",
    summary: "Talking about useState and useEffect",
    projectDir: "/projects/react-app",
    sourcePath: "/path/to/source1",
    createdAt: 100,
    lastActiveAt: 500,
  },
  {
    providerId: "anthropic",
    sessionId: "sess-2",
    title: "Python scripting",
    summary: "Automation with Python",
    projectDir: "/projects/python-bot",
    sourcePath: "/path/to/source2",
    createdAt: 200,
    lastActiveAt: 300,
  },
  {
    providerId: "openai",
    sessionId: "sess-3",
    title: "TypeScript tips",
    summary: "Advanced TypeScript patterns",
    projectDir: "/projects/ts-tool",
    sourcePath: "/path/to/source3",
    createdAt: 50,
    lastActiveAt: 800,
  },
];

describe("useSessionSearch", () => {
  it("returns all sessions sorted by lastActiveAt when query is empty", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSessionSearch({ sessions, providerFilter: "all" }),
      { wrapper },
    );

    const results = result.current.search("");
    expect(results.map((s) => s.sessionId)).toEqual([
      "sess-3", // lastActiveAt 800
      "sess-1", // lastActiveAt 500
      "sess-2", // lastActiveAt 300
    ]);
  });

  it("falls back to createdAt when lastActiveAt is missing", () => {
    const noLastActive: SessionMeta[] = [
      {
        providerId: "a",
        sessionId: "s-a",
        createdAt: 100,
      },
      {
        providerId: "b",
        sessionId: "s-b",
        createdAt: 200,
      },
    ];
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSessionSearch({ sessions: noLastActive, providerFilter: "all" }),
      { wrapper },
    );

    const results = result.current.search("");
    expect(results.map((s) => s.sessionId)).toEqual(["s-b", "s-a"]);
  });

  it("filters sessions by provider when providerFilter is not 'all'", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSessionSearch({ sessions, providerFilter: "openai" }),
      { wrapper },
    );

    const results = result.current.search("");
    expect(results.map((s) => s.sessionId)).toEqual([
      "sess-3", // lastActiveAt 800
      "sess-1", // lastActiveAt 500
    ]);
    // sess-2 is anthropic, should be excluded
    expect(results.find((s) => s.sessionId === "sess-2")).toBeUndefined();
  });

  it("returns matching sessions for a search query", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSessionSearch({ sessions, providerFilter: "all" }),
      { wrapper },
    );

    const results = result.current.search("Python");
    expect(results.map((s) => s.sessionId)).toEqual(["sess-2"]);
  });

  it("matches on title content", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSessionSearch({ sessions, providerFilter: "all" }),
      { wrapper },
    );

    const results = result.current.search("TypeScript");
    expect(results.map((s) => s.sessionId)).toEqual(["sess-3"]);
  });

  it("returns empty array when no sessions match the query", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSessionSearch({ sessions, providerFilter: "all" }),
      { wrapper },
    );

    const results = result.current.search("nonexistent-topic-xyz");
    expect(results).toEqual([]);
  });

  it("combines provider filter with search query", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSessionSearch({ sessions, providerFilter: "openai" }),
      { wrapper },
    );

    // "React" should match sess-1 which is openai
    const results = result.current.search("React");
    expect(results.map((s) => s.sessionId)).toEqual(["sess-1"]);
  });
});
