import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  useChatPersistence,
  type DiskMsg,
  type UseChatPersistenceOptions,
} from "@/hooks/useChatPersistence";

interface TestMsg {
  id: string;
  role: string;
  content: string;
}

interface WrapperProps {
  children: ReactNode;
}

function createWrapper() {
  const queryClient = new QueryClient();

  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

const STORAGE_PREFIX = "ezsphere:chat:";

const toDisk = (msg: TestMsg): DiskMsg | null => ({
  role: msg.role,
  content: msg.content,
});

const fromDisk = (msg: DiskMsg): TestMsg => ({
  id: `disk-${msg.content}`,
  role: msg.role,
  content: msg.content,
});

function createOptions(
  overrides: Partial<UseChatPersistenceOptions<TestMsg>> = {},
): UseChatPersistenceOptions<TestMsg> {
  return {
    diskKey: "test",
    messages: [],
    prependMessages: vi.fn(),
    setMessages: vi.fn(),
    toDisk,
    fromDisk,
    pageSize: 30,
    debounceMs: 800,
    ...overrides,
  };
}

describe("useChatPersistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  // ---- readStored (via loadInitial) ----

  it("returns initial state with zero diskTotal and pageSize displayCount", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useChatPersistence(createOptions()), {
      wrapper,
    });

    expect(result.current.diskTotal).toBe(0);
    expect(result.current.displayCount).toBe(30);
    expect(result.current.showSkeleton).toBe(false);
  });

  it("loadInitial reads from localStorage and populates messages", async () => {
    const storedMsgs: DiskMsg[] = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ];
    window.localStorage.setItem(
      STORAGE_PREFIX + "test",
      JSON.stringify(storedMsgs),
    );

    const setMessages = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useChatPersistence(createOptions({ setMessages })),
      { wrapper },
    );

    await act(async () => {
      await result.current.loadInitial();
    });

    expect(setMessages).toHaveBeenCalledTimes(1);
    const loaded = setMessages.mock.calls[0][0] as TestMsg[];
    expect(loaded).toHaveLength(2);
    expect(loaded[0]).toEqual({
      id: "disk-hello",
      role: "user",
      content: "hello",
    });
    expect(loaded[1]).toEqual({
      id: "disk-hi",
      role: "assistant",
      content: "hi",
    });
    expect(result.current.diskTotal).toBe(2);
  });

  it("loadInitial does nothing when localStorage is empty", async () => {
    const setMessages = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useChatPersistence(createOptions({ setMessages })),
      { wrapper },
    );

    await act(async () => {
      await result.current.loadInitial();
    });

    expect(setMessages).not.toHaveBeenCalled();
    expect(result.current.diskTotal).toBe(0);
  });

  it("loadInitial does nothing when diskKey is null", async () => {
    const setMessages = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useChatPersistence(createOptions({ diskKey: null, setMessages })),
      { wrapper },
    );

    window.localStorage.setItem(
      STORAGE_PREFIX + "test",
      JSON.stringify([{ role: "user", content: "hello" }]),
    );

    await act(async () => {
      await result.current.loadInitial();
    });

    expect(setMessages).not.toHaveBeenCalled();
  });

  it("loadInitial handles corrupted JSON gracefully", async () => {
    window.localStorage.setItem(STORAGE_PREFIX + "test", "not-json{");

    const setMessages = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useChatPersistence(createOptions({ setMessages })),
      { wrapper },
    );

    await act(async () => {
      await result.current.loadInitial();
    });

    expect(setMessages).not.toHaveBeenCalled();
    expect(result.current.diskTotal).toBe(0);
  });

  it("loadInitial handles non-array JSON gracefully", async () => {
    window.localStorage.setItem(
      STORAGE_PREFIX + "test",
      JSON.stringify({ not: "an array" }),
    );

    const setMessages = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useChatPersistence(createOptions({ setMessages })),
      { wrapper },
    );

    await act(async () => {
      await result.current.loadInitial();
    });

    expect(setMessages).not.toHaveBeenCalled();
    expect(result.current.diskTotal).toBe(0);
  });

  // ---- writeStored (via debounced save effect) ----

  it("writes messages to localStorage after debounce delay", () => {
    const messages: TestMsg[] = [
      { id: "1", role: "user", content: "hello" },
      { id: "2", role: "assistant", content: "world" },
    ];
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      (opts) => useChatPersistence(opts),
      {
        initialProps: createOptions({ messages: [], debounceMs: 500 }),
        wrapper,
      },
    );

    rerender(createOptions({ messages, debounceMs: 500 }));

    // Before debounce timer fires, nothing written
    expect(window.localStorage.getItem(STORAGE_PREFIX + "test")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const raw = window.localStorage.getItem(STORAGE_PREFIX + "test");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual([
      { role: "user", content: "hello" },
      { role: "assistant", content: "world" },
    ]);
    expect(result.current.diskTotal).toBe(2);
  });

  it("does not write to localStorage when diskKey is null", () => {
    const messages: TestMsg[] = [{ id: "1", role: "user", content: "hello" }];
    const { wrapper } = createWrapper();

    renderHook((opts) => useChatPersistence(opts), {
      initialProps: createOptions({
        diskKey: null,
        messages,
        debounceMs: 500,
      }),
      wrapper,
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(window.localStorage.getItem(STORAGE_PREFIX + "test")).toBeNull();
  });

  it("does not write to localStorage when messages is empty", () => {
    const { wrapper } = createWrapper();

    renderHook((opts) => useChatPersistence(opts), {
      initialProps: createOptions({ messages: [], debounceMs: 500 }),
      wrapper,
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(window.localStorage.getItem(STORAGE_PREFIX + "test")).toBeNull();
  });

  it("skips messages where toDisk returns null", () => {
    const skipToDisk = (msg: TestMsg): DiskMsg | null => {
      if (msg.role === "system") return null;
      return { role: msg.role, content: msg.content };
    };
    const messages: TestMsg[] = [
      { id: "1", role: "user", content: "hello" },
      { id: "2", role: "system", content: "skip me" },
      { id: "3", role: "assistant", content: "world" },
    ];
    const { wrapper } = createWrapper();

    renderHook((opts) => useChatPersistence(opts), {
      initialProps: createOptions({
        messages,
        toDisk: skipToDisk,
        debounceMs: 500,
      }),
      wrapper,
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    const raw = window.localStorage.getItem(STORAGE_PREFIX + "test");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toEqual([
      { role: "user", content: "hello" },
      { role: "assistant", content: "world" },
    ]);
  });

  it("resets the debounce timer when messages change rapidly", () => {
    const { wrapper } = createWrapper();

    const { rerender } = renderHook((opts) => useChatPersistence(opts), {
      initialProps: createOptions({ messages: [], debounceMs: 500 }),
      wrapper,
    });

    rerender(
      createOptions({
        messages: [{ id: "1", role: "user", content: "a" }],
        debounceMs: 500,
      }),
    );
    vi.advanceTimersByTime(300);

    rerender(
      createOptions({
        messages: [
          { id: "1", role: "user", content: "a" },
          { id: "2", role: "user", content: "b" },
        ],
        debounceMs: 500,
      }),
    );
    vi.advanceTimersByTime(300);
    // 300ms since last change - not enough
    expect(window.localStorage.getItem(STORAGE_PREFIX + "test")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    // Now 500ms since last change
    const raw = window.localStorage.getItem(STORAGE_PREFIX + "test");
    expect(raw).not.toBeNull();
  });

  // ---- clearHistory ----

  it("clearHistory removes localStorage and resets diskTotal", async () => {
    window.localStorage.setItem(
      STORAGE_PREFIX + "test",
      JSON.stringify([{ role: "user", content: "hello" }]),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useChatPersistence(createOptions()), {
      wrapper,
    });

    await act(async () => {
      await result.current.clearHistory();
    });

    expect(window.localStorage.getItem(STORAGE_PREFIX + "test")).toBeNull();
    expect(result.current.diskTotal).toBe(0);
  });

  it("clearHistory does nothing when diskKey is null", async () => {
    window.localStorage.setItem(
      STORAGE_PREFIX + "test",
      JSON.stringify([{ role: "user", content: "hello" }]),
    );

    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useChatPersistence(createOptions({ diskKey: null })),
      { wrapper },
    );

    await act(async () => {
      await result.current.clearHistory();
    });

    expect(window.localStorage.getItem(STORAGE_PREFIX + "test")).not.toBeNull();
  });

  // ---- loadOlderChat ----

  it("loadOlderChat always returns 0", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useChatPersistence(createOptions()), {
      wrapper,
    });

    let count = -1;
    await act(async () => {
      count = await result.current.loadOlderChat();
    });

    expect(count).toBe(0);
  });

  // ---- resetDisplayCount ----

  it("resetDisplayCount resets to pageSize", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useChatPersistence(createOptions({ pageSize: 10 })),
      { wrapper },
    );

    act(() => {
      result.current.resetDisplayCount();
    });

    expect(result.current.displayCount).toBe(10);
  });

  // ---- handleScrollPagination ----
  // Note: the hook's auto-increase effect always keeps displayCount >= messages.length,
  // so the positive case (loading more) is not reachable through normal hook usage.
  // We test the guard conditions instead.

  it("handleScrollPagination does nothing when scrollTop is not 0", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      () => useChatPersistence(createOptions({ pageSize: 2 })),
      { wrapper },
    );

    const container = {
      scrollTop: 100,
      scrollHeight: 1000,
    } as unknown as HTMLDivElement;

    act(() => {
      result.current.handleScrollPagination(container);
    });

    expect(result.current.showSkeleton).toBe(false);
  });

  it("handleScrollPagination does nothing when all messages are displayed", () => {
    const messages: TestMsg[] = [{ id: "1", role: "user", content: "a" }];
    const { wrapper } = createWrapper();

    const { result } = renderHook(
      (opts) => useChatPersistence(opts),
      {
        initialProps: createOptions({ messages, pageSize: 30 }),
        wrapper,
      },
    );

    const container = {
      scrollTop: 0,
      scrollHeight: 1000,
    } as unknown as HTMLDivElement;

    act(() => {
      result.current.handleScrollPagination(container);
    });

    expect(result.current.showSkeleton).toBe(false);
  });
});
