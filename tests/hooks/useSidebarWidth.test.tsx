import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, afterEach, vi } from "vitest";
import { useSidebarWidth } from "@/hooks/useSidebarWidth";
import { createTestQueryClient } from "../utils/testQueryClient";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COMPACT,
  SIDEBAR_COMPACT_BREAKPOINT,
} from "@/config/navigation";

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

describe("useSidebarWidth", () => {
  afterEach(() => {
    window.innerWidth = 1024;
    document.documentElement.style.removeProperty("--shell-sidebar-width");
  });

  it("returns compact width when viewport is below breakpoint", () => {
    window.innerWidth = SIDEBAR_COMPACT_BREAKPOINT;
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSidebarWidth(), { wrapper });

    expect(result.current).toBe(SIDEBAR_WIDTH_COMPACT);
  });

  it("returns normal width when viewport is above breakpoint", () => {
    window.innerWidth = SIDEBAR_COMPACT_BREAKPOINT + 1;
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSidebarWidth(), { wrapper });

    expect(result.current).toBe(SIDEBAR_WIDTH);
  });

  it("sets --shell-sidebar-width CSS variable on mount", () => {
    window.innerWidth = 1920;
    const { wrapper } = createWrapper();

    renderHook(() => useSidebarWidth(), { wrapper });

    expect(
      document.documentElement.style.getPropertyValue("--shell-sidebar-width"),
    ).toBe(`${SIDEBAR_WIDTH}px`);
  });

  it("updates width and CSS variable when window is resized across breakpoint", () => {
    // Start above breakpoint
    window.innerWidth = 1400;
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSidebarWidth(), { wrapper });

    expect(result.current).toBe(SIDEBAR_WIDTH);

    // Resize below breakpoint
    act(() => {
      window.innerWidth = 1000;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(SIDEBAR_WIDTH_COMPACT);
    expect(
      document.documentElement.style.getPropertyValue("--shell-sidebar-width"),
    ).toBe(`${SIDEBAR_WIDTH_COMPACT}px`);
  });

  it("updates from compact to normal when window grows past breakpoint", () => {
    window.innerWidth = 800;
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useSidebarWidth(), { wrapper });

    expect(result.current).toBe(SIDEBAR_WIDTH_COMPACT);

    act(() => {
      window.innerWidth = 1600;
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(SIDEBAR_WIDTH);
  });
});
