import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useUsageCacheBridge } from "@/hooks/useUsageCacheBridge";
import { createTestQueryClient } from "../utils/testQueryClient";
import { emitTauriEvent } from "../msw/tauriMocks";
import { usageKeys } from "@/lib/query/usage";
import { subscriptionKeys } from "@/lib/query/subscription";
import type { UsageResult } from "@/types";
import type { SubscriptionQuota } from "@/types/subscription";

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

describe("useUsageCacheBridge", () => {
  let setQueryDataSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Ensure a clean spy per test; createWrapper returns the client
  });

  it("sets script usage query data when a script payload is received", async () => {
    const { wrapper, queryClient } = createWrapper();
    setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

    renderHook(() => useUsageCacheBridge(), { wrapper });

    // Wait for the Tauri event listener to register
    await waitFor(() => {});

    const scriptData: UsageResult = {
      success: true,
      data: [],
    };

    emitTauriEvent("usage-cache-updated", {
      kind: "script",
      appType: "claude",
      providerId: "prov-1",
      data: scriptData,
    });

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      usageKeys.script("prov-1", "claude"),
      scriptData,
    );
  });

  it("sets subscription quota query data when a subscription payload is received", async () => {
    const { wrapper, queryClient } = createWrapper();
    setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

    renderHook(() => useUsageCacheBridge(), { wrapper });

    await waitFor(() => {});

    const quotaData: SubscriptionQuota = {
      tool: "claude",
      credentialStatus: "valid" as any,
      credentialMessage: null,
      success: true,
      tiers: [],
      extraUsage: null,
      error: null,
      queriedAt: Date.now(),
    };

    emitTauriEvent("usage-cache-updated", {
      kind: "subscription",
      appType: "claude",
      data: quotaData,
    });

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      subscriptionKeys.quota("claude"),
      quotaData,
    );
  });

  it("does not set query data for unrelated events", async () => {
    const { wrapper, queryClient } = createWrapper();
    setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

    renderHook(() => useUsageCacheBridge(), { wrapper });

    await waitFor(() => {});

    emitTauriEvent("some-other-event", { kind: "script" });

    expect(setQueryDataSpy).not.toHaveBeenCalled();
  });
});
