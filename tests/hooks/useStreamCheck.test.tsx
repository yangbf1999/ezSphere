import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useStreamCheck } from "@/hooks/useStreamCheck";
import type { StreamCheckResult } from "@/lib/api/model-test";

const streamCheckProviderMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastWarningMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    warning: (...args: unknown[]) => toastWarningMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, opts?: unknown) => k }),
}));

vi.mock("@/lib/api/model-test", () => ({
  streamCheckProvider: (...args: unknown[]) => streamCheckProviderMock(...args),
}));

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

function makeResult(
  overrides: Partial<StreamCheckResult> = {},
): StreamCheckResult {
  return {
    status: "operational",
    success: true,
    message: "ok",
    responseTimeMs: 100,
    testedAt: Date.now(),
    retryCount: 0,
    ...overrides,
  };
}

describe("useStreamCheck", () => {
  beforeEach(() => {
    streamCheckProviderMock.mockReset();
    toastSuccessMock.mockReset();
    toastWarningMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("shows success toast for operational status", async () => {
    streamCheckProviderMock.mockResolvedValue(makeResult({ status: "operational" }));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStreamCheck("claude"), { wrapper });

    let returnVal: StreamCheckResult | null = null;
    await act(async () => {
      returnVal = await result.current.checkProvider("p1", "Provider One");
    });

    expect(streamCheckProviderMock).toHaveBeenCalledWith("claude", "p1");
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastWarningMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(returnVal).not.toBeNull();
    expect(returnVal!.status).toBe("operational");
  });

  it("shows warning toast for degraded status", async () => {
    streamCheckProviderMock.mockResolvedValue(
      makeResult({ status: "degraded", responseTimeMs: 5000 }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStreamCheck("claude"), { wrapper });

    await act(async () => {
      await result.current.checkProvider("p1", "Provider One");
    });

    expect(toastWarningMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("shows error toast with description for failed status", async () => {
    streamCheckProviderMock.mockResolvedValue(
      makeResult({
        status: "failed",
        success: false,
        message: "connection refused",
      }),
    );
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStreamCheck("claude"), { wrapper });

    let returnVal: StreamCheckResult | null = null;
    await act(async () => {
      returnVal = await result.current.checkProvider("p1", "Provider One");
    });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(toastWarningMock).not.toHaveBeenCalled();
    // The error toast is called with a message string and an options object
    // containing a description and duration
    const callArgs = toastErrorMock.mock.calls[0];
    expect(typeof callArgs[0]).toBe("string");
    expect(callArgs[1]).toEqual(
      expect.objectContaining({
        duration: 8000,
        closeButton: true,
      }),
    );
    expect(returnVal).not.toBeNull();
    expect(returnVal!.status).toBe("failed");
  });

  it("shows error toast and returns null when streamCheckProvider throws", async () => {
    streamCheckProviderMock.mockRejectedValue(new Error("network error"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStreamCheck("claude"), { wrapper });

    let returnVal: StreamCheckResult | null = null;
    await act(async () => {
      returnVal = await result.current.checkProvider("p1", "Provider One");
    });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(returnVal).toBeNull();
  });

  it("isChecking returns true during check and false after", async () => {
    let resolveCheck!: (value: StreamCheckResult) => void;
    const pendingPromise = new Promise<StreamCheckResult>((resolve) => {
      resolveCheck = resolve;
    });
    streamCheckProviderMock.mockReturnValue(pendingPromise);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStreamCheck("claude"), { wrapper });

    expect(result.current.isChecking("p1")).toBe(false);

    let checkPromise: Promise<StreamCheckResult | null>;
    await act(async () => {
      checkPromise = result.current.checkProvider("p1", "Provider One");
    });

    // While the check is in flight, isChecking should be true
    expect(result.current.isChecking("p1")).toBe(true);
    expect(result.current.isChecking("other")).toBe(false);

    await act(async () => {
      resolveCheck(makeResult({ status: "operational" }));
      await checkPromise!;
    });

    // After the check completes, isChecking should be false
    expect(result.current.isChecking("p1")).toBe(false);
  });

  it("clears checking state even when the check throws", async () => {
    streamCheckProviderMock.mockRejectedValue(new Error("fail"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useStreamCheck("claude"), { wrapper });

    await act(async () => {
      await result.current.checkProvider("p1", "Provider One");
    });

    expect(result.current.isChecking("p1")).toBe(false);
  });
});
