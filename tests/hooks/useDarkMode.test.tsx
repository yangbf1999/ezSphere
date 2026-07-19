import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, afterEach } from "vitest";
import { useDarkMode } from "@/hooks/useDarkMode";
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

describe("useDarkMode", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("returns false when dark class is absent on initial render", () => {
    document.documentElement.classList.remove("dark");
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDarkMode(), { wrapper });

    expect(result.current).toBe(false);
  });

  it("returns true when dark class is present on initial render", () => {
    document.documentElement.classList.add("dark");
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDarkMode(), { wrapper });

    expect(result.current).toBe(true);
  });

  it("updates to true when dark class is added after mount", async () => {
    document.documentElement.classList.remove("dark");
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDarkMode(), { wrapper });

    expect(result.current).toBe(false);

    await act(async () => {
      document.documentElement.classList.add("dark");
    });

    // MutationObserver fires asynchronously; wait for state to update
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("updates to false when dark class is removed after mount", async () => {
    document.documentElement.classList.add("dark");
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useDarkMode(), { wrapper });

    expect(result.current).toBe(true);

    await act(async () => {
      document.documentElement.classList.remove("dark");
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
