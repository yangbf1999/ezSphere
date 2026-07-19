import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { useLastValidValue } from "@/hooks/useLastValidValue";
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

describe("useLastValidValue", () => {
  it("returns the value when it is valid", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLastValidValue("hello"), { wrapper });

    expect(result.current).toBe("hello");
  });

  it("returns null when value is null on first render", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useLastValidValue<string>(null), {
      wrapper,
    });

    expect(result.current).toBeNull();
  });

  it("returns null when value is undefined on first render", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useLastValidValue<string>(undefined),
      { wrapper },
    );

    expect(result.current).toBeNull();
  });

  it("retains last valid value when value becomes null", () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ value }) => useLastValidValue(value),
      {
        wrapper,
        initialProps: { value: "first" as string | null },
      },
    );

    expect(result.current).toBe("first");

    rerender({ value: null });
    expect(result.current).toBe("first");
  });

  it("retains last valid value when value becomes undefined", () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ value }) => useLastValidValue(value),
      {
        wrapper,
        initialProps: { value: 42 as number | undefined },
      },
    );

    expect(result.current).toBe(42);

    rerender({ value: undefined });
    expect(result.current).toBe(42);
  });

  it("updates to new valid value when value changes from null to valid", () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ value }) => useLastValidValue(value),
      {
        wrapper,
        initialProps: { value: null as string | null },
      },
    );

    expect(result.current).toBeNull();

    rerender({ value: "recovered" });
    expect(result.current).toBe("recovered");
  });

  it("updates correctly across multiple transitions", () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ value }) => useLastValidValue(value),
      {
        wrapper,
        initialProps: { value: "a" as string | null | undefined },
      },
    );

    expect(result.current).toBe("a");

    rerender({ value: "b" });
    expect(result.current).toBe("b");

    rerender({ value: null });
    expect(result.current).toBe("b");

    rerender({ value: undefined });
    expect(result.current).toBe("b");

    rerender({ value: "c" });
    expect(result.current).toBe("c");
  });
});
