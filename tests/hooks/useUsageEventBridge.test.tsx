import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useUsageEventBridge } from "@/hooks/useUsageEventBridge";
import { createTestQueryClient } from "../utils/testQueryClient";
import { emitTauriEvent } from "../msw/tauriMocks";
import { usageKeys } from "@/lib/query/usage";

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
  return { wrapper, queryClient };
}

describe("useUsageEventBridge", () => {
  it("invalidates all usage queries when usage-log-recorded event fires", async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useUsageEventBridge(), { wrapper });

    // Wait for the Tauri event listener to register
    await waitFor(() => {});

    emitTauriEvent("usage-log-recorded", null);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: usageKeys.all,
    });
  });

  it("does not invalidate when an unrelated event fires", async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(() => useUsageEventBridge(), { wrapper });

    await waitFor(() => {});

    emitTauriEvent("some-unrelated-event", null);

    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: usageKeys.all,
    });
  });

  it("stops invalidating after unmount", async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { unmount } = renderHook(() => useUsageEventBridge(), { wrapper });

    await waitFor(() => {});

    unmount();

    emitTauriEvent("usage-log-recorded", null);

    expect(invalidateSpy).not.toHaveBeenCalledWith({
      queryKey: usageKeys.all,
    });
  });
});
