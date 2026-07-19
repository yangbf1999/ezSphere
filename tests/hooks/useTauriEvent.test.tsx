import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useTauriEvent } from "@/hooks/useTauriEvent";
import { createTestQueryClient } from "../utils/testQueryClient";
import { emitTauriEvent } from "../msw/tauriMocks";

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

describe("useTauriEvent", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("calls handler when event is emitted", async () => {
    const handler = vi.fn();
    const { wrapper } = createWrapper();

    renderHook(() => useTauriEvent<string>("test-event-1", handler), {
      wrapper,
    });

    // Wait for the async listen registration to settle
    await waitFor(() => {
      emitTauriEvent("test-event-1", "hello");
      expect(handler).toHaveBeenCalledWith("hello");
    });
  });

  it("does not call handler for a different event", async () => {
    const handler = vi.fn();
    const { wrapper } = createWrapper();

    renderHook(() => useTauriEvent<string>("test-event-2", handler), {
      wrapper,
    });

    await waitFor(() => {});

    emitTauriEvent("other-event", "ignored");
    expect(handler).not.toHaveBeenCalled();
  });

  it("uses the latest handler after rerender (handlerRef pattern)", async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const { wrapper } = createWrapper();

    const { rerender } = renderHook(
      ({ handler }) => useTauriEvent<string>("test-event-3", handler),
      {
        wrapper,
        initialProps: { handler: handler1 },
      },
    );

    await waitFor(() => {});

    // Switch to handler2
    rerender({ handler: handler2 });

    emitTauriEvent("test-event-3", "payload");
    expect(handler2).toHaveBeenCalledWith("payload");
    expect(handler1).not.toHaveBeenCalled();
  });

  it("stops calling handler after unmount", async () => {
    const handler = vi.fn();
    const { wrapper } = createWrapper();

    const { unmount } = renderHook(
      () => useTauriEvent<string>("test-event-4", handler),
      { wrapper },
    );

    await waitFor(() => {});

    unmount();

    emitTauriEvent("test-event-4", "after-unmount");
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes complex payload objects to handler", async () => {
    const handler = vi.fn();
    const { wrapper } = createWrapper();

    renderHook(
      () =>
        useTauriEvent<{ kind: string; data: number }>("test-event-5", handler),
      { wrapper },
    );

    await waitFor(() => {});

    const payload = { kind: "test", data: 42 };
    emitTauriEvent("test-event-5", payload);

    expect(handler).toHaveBeenCalledWith(payload);
  });
});
