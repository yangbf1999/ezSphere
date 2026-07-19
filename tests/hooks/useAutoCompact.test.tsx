import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useAutoCompact } from "@/hooks/useAutoCompact";
import { createTestQueryClient } from "../utils/testQueryClient";

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

// A controllable ResizeObserver that lets tests manually fire callbacks.
type ROCallback = (entries: { target: HTMLElement }) => void;

class MockResizeObserver {
  private cb: ROCallback;
  private targets: Set<HTMLElement> = new Set();
  static instances: MockResizeObserver[] = [];

  constructor(cb: ROCallback) {
    this.cb = cb;
    MockResizeObserver.instances.push(this);
  }

  observe(target: HTMLElement) {
    this.targets.add(target);
  }

  unobserve(target: HTMLElement) {
    this.targets.delete(target);
  }

  disconnect() {
    this.targets.clear();
  }

  fire(target: HTMLElement) {
    if (this.targets.has(target)) {
      this.cb({ target });
    }
  }
}

function setDims(el: HTMLElement, scrollW: number, clientW: number) {
  Object.defineProperty(el, "scrollWidth", {
    value: scrollW,
    configurable: true,
  });
  Object.defineProperty(el, "clientWidth", {
    value: clientW,
    configurable: true,
  });
}

describe("useAutoCompact", () => {
  let originalRO: typeof globalThis.ResizeObserver;

  beforeEach(() => {
    originalRO = globalThis.ResizeObserver;
    MockResizeObserver.instances = [];
    globalThis.ResizeObserver =
      MockResizeObserver as unknown as typeof globalThis.ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalRO;
  });

  it("returns false initially when content fits", () => {
    const el = document.createElement("div");
    setDims(el, 200, 300);
    document.body.appendChild(el);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAutoCompact({ current: el }), {
      wrapper,
    });

    act(() => {
      MockResizeObserver.instances[0]?.fire(el);
    });

    expect(result.current).toBe(false);
  });

  it("switches to compact when scrollWidth exceeds clientWidth", () => {
    const el = document.createElement("div");
    setDims(el, 400, 200);
    document.body.appendChild(el);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAutoCompact({ current: el }), {
      wrapper,
    });

    expect(result.current).toBe(false);

    act(() => {
      MockResizeObserver.instances[0]?.fire(el);
    });

    expect(result.current).toBe(true);
  });

  it("recovers from compact to normal when clientWidth >= normalWidth", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAutoCompact({ current: el }), {
      wrapper,
    });

    // Step 1: overflow -> compact = true, normalWidth cached at 400
    setDims(el, 400, 200);
    act(() => {
      MockResizeObserver.instances[0]?.fire(el);
    });
    expect(result.current).toBe(true);

    // After compact -> true, effect re-runs: old observer disconnected,
    // new observer created. Use the latest instance.
    // Step 2: enough space -> compact = false
    setDims(el, 300, 450);
    // Bypass the lock window (lockUntilRef = Date.now() + 250)
    vi.useFakeTimers();
    vi.advanceTimersByTime(300);
    act(() => {
      MockResizeObserver.instances.at(-1)?.fire(el);
    });
    vi.useRealTimers();

    expect(result.current).toBe(false);
  });

  it("does not recover when clientWidth is still below normalWidth", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAutoCompact({ current: el }), {
      wrapper,
    });

    // Overflow -> compact = true, normalWidth = 500
    setDims(el, 500, 200);
    act(() => {
      MockResizeObserver.instances[0]?.fire(el);
    });
    expect(result.current).toBe(true);

    // Still not enough space (300 < 500)
    setDims(el, 400, 300);
    vi.useFakeTimers();
    vi.advanceTimersByTime(300);
    act(() => {
      MockResizeObserver.instances.at(-1)?.fire(el);
    });
    vi.useRealTimers();

    expect(result.current).toBe(true);
  });

  it("returns false when containerRef is null", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useAutoCompact({ current: null }),
      { wrapper },
    );

    expect(result.current).toBe(false);
  });
});
