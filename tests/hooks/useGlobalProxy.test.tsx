import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  useGlobalProxyUrl,
  useSetGlobalProxyUrl,
  useTestProxy,
  useUpstreamProxyStatus,
  useScanProxies,
} from "@/hooks/useGlobalProxy";
import { createTestQueryClient } from "../utils/testQueryClient";

const getGlobalProxyUrlMock = vi.fn();
const setGlobalProxyUrlMock = vi.fn();
const testProxyUrlMock = vi.fn();
const getUpstreamProxyStatusMock = vi.fn();
const scanLocalProxiesMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/api/globalProxy", () => ({
  getGlobalProxyUrl: (...args: unknown[]) => getGlobalProxyUrlMock(...args),
  setGlobalProxyUrl: (...args: unknown[]) => setGlobalProxyUrlMock(...args),
  testProxyUrl: (...args: unknown[]) => testProxyUrlMock(...args),
  getUpstreamProxyStatus: (...args: unknown[]) =>
    getUpstreamProxyStatusMock(...args),
  scanLocalProxies: (...args: unknown[]) => scanLocalProxiesMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options && typeof options === "object") {
        const parts: string[] = [key];
        for (const [k, v] of Object.entries(options)) {
          parts.push(`${k}=${v}`);
        }
        return parts.join(" ");
      }
      return key;
    },
  }),
}));

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

describe("useGlobalProxy hooks", () => {
  beforeEach(() => {
    getGlobalProxyUrlMock.mockReset();
    setGlobalProxyUrlMock.mockReset();
    testProxyUrlMock.mockReset();
    getUpstreamProxyStatusMock.mockReset();
    scanLocalProxiesMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  // ---- useGlobalProxyUrl ----
  describe("useGlobalProxyUrl", () => {
    it("fetches global proxy URL", async () => {
      getGlobalProxyUrlMock.mockResolvedValue("http://127.0.0.1:7890");
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useGlobalProxyUrl(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBe("http://127.0.0.1:7890");
      });
      expect(getGlobalProxyUrlMock).toHaveBeenCalledTimes(1);
    });

    it("returns null when no proxy is configured", async () => {
      getGlobalProxyUrlMock.mockResolvedValue(null);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useGlobalProxyUrl(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBeNull();
      });
    });
  });

  // ---- useSetGlobalProxyUrl ----
  describe("useSetGlobalProxyUrl", () => {
    it("calls setGlobalProxyUrl, shows success toast and invalidates on success", async () => {
      setGlobalProxyUrlMock.mockResolvedValue(undefined);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useSetGlobalProxyUrl(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("http://127.0.0.1:7890");
      });

      expect(setGlobalProxyUrlMock).toHaveBeenCalledWith(
        "http://127.0.0.1:7890",
        expect.anything(),
      );
      expect(toastSuccessMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).not.toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["globalProxyUrl"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["upstreamProxyStatus"],
      });
    });

    it("shows error toast with message on failure", async () => {
      setGlobalProxyUrlMock.mockRejectedValue(new Error("connection refused"));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useSetGlobalProxyUrl(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync("http://bad:9999"),
        ).rejects.toThrow("connection refused");
      });

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(toastSuccessMock).not.toHaveBeenCalled();
    });

    it("handles string errors thrown by invoke", async () => {
      setGlobalProxyUrlMock.mockRejectedValue("string error");
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useSetGlobalProxyUrl(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync("x")).rejects.toBe(
          "string error",
        );
      });

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
    });
  });

  // ---- useTestProxy ----
  describe("useTestProxy", () => {
    it("shows success toast with latency when test succeeds", async () => {
      testProxyUrlMock.mockResolvedValue({
        success: true,
        latencyMs: 42,
        error: null,
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTestProxy(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("http://127.0.0.1:7890");
      });

      expect(testProxyUrlMock).toHaveBeenCalledWith(
        "http://127.0.0.1:7890",
        expect.anything(),
      );
      expect(toastSuccessMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("shows error toast when test result has success=false", async () => {
      testProxyUrlMock.mockResolvedValue({
        success: false,
        latencyMs: 0,
        error: "timeout",
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTestProxy(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("http://bad:9999");
      });

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(toastSuccessMock).not.toHaveBeenCalled();
    });

    it("shows error toast when test throws", async () => {
      testProxyUrlMock.mockRejectedValue(new Error("network unreachable"));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useTestProxy(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync("http://bad:9999"),
        ).rejects.toThrow("network unreachable");
      });

      expect(toastErrorMock).toHaveBeenCalledWith("network unreachable");
    });
  });

  // ---- useUpstreamProxyStatus ----
  describe("useUpstreamProxyStatus", () => {
    it("fetches upstream proxy status", async () => {
      getUpstreamProxyStatusMock.mockResolvedValue({
        enabled: true,
        proxyUrl: "http://127.0.0.1:7890",
      });
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useUpstreamProxyStatus(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual({
          enabled: true,
          proxyUrl: "http://127.0.0.1:7890",
        });
      });
    });
  });

  // ---- useScanProxies ----
  describe("useScanProxies", () => {
    it("returns detected proxies on success without error toast", async () => {
      scanLocalProxiesMock.mockResolvedValue([
        { url: "http://127.0.0.1:7890", proxyType: "http", port: 7890 },
      ]);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useScanProxies(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(scanLocalProxiesMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("shows error toast on scan failure", async () => {
      scanLocalProxiesMock.mockRejectedValue(new Error("scan failed"));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useScanProxies(), { wrapper });

      await act(async () => {
        await expect(result.current.mutateAsync()).rejects.toThrow(
          "scan failed",
        );
      });

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
    });
  });
});
