import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

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

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDebouncedValue("hello", 300), {
      wrapper,
    });

    expect(result.current).toBe("hello");
  });

  it("does not update before the delay elapses", () => {
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 }, wrapper },
    );

    rerender({ value: "b", delay: 300 });
    vi.advanceTimersByTime(299);

    expect(result.current).toBe("a");
  });

  it("updates the debounced value after the delay", () => {
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 }, wrapper },
    );

    rerender({ value: "b", delay: 300 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("b");
  });

  it("resets the timer when value changes rapidly (debounce)", () => {
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 }, wrapper },
    );

    rerender({ value: "b", delay: 300 });
    vi.advanceTimersByTime(200);

    rerender({ value: "c", delay: 300 });
    vi.advanceTimersByTime(200);
    // Only 200ms since "c" was set — not enough
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Now 300ms since "c" was set
    expect(result.current).toBe("c");
  });

  it("updates immediately when delay is zero", () => {
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 0 }, wrapper },
    );

    rerender({ value: "b", delay: 0 });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe("b");
  });

  it("keeps the latest value when multiple updates happen within the delay", () => {
    const { wrapper } = createWrapper();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 500 }, wrapper },
    );

    rerender({ value: "b", delay: 500 });
    vi.advanceTimersByTime(100);

    rerender({ value: "c", delay: 500 });
    vi.advanceTimersByTime(100);

    rerender({ value: "d", delay: 500 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("d");
  });
});
