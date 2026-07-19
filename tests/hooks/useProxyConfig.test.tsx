import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useProxyConfig } from "@/hooks/useProxyConfig";
import { createTestQueryClient } from "../utils/testQueryClient";
import type { ProxyConfig } from "@/types/proxy";

const invokeMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
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

const mockConfig: ProxyConfig = {
  listen_address: "127.0.0.1",
  listen_port: 8080,
  max_retries: 3,
  request_timeout: 30,
  enable_logging: true,
  streaming_first_byte_timeout: 10,
  streaming_idle_timeout: 60,
  non_streaming_timeout: 30,
};

describe("useProxyConfig", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("loads proxy config via invoke", async () => {
    invokeMock.mockResolvedValue(mockConfig);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useProxyConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(invokeMock).toHaveBeenCalledWith("get_proxy_config");
    expect(result.current.config).toEqual(mockConfig);
  });

  it("calls update_proxy_config with new config and shows success toast on success", async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === "get_proxy_config") return Promise.resolve(mockConfig);
      if (command === "update_proxy_config") return Promise.resolve(true);
      return Promise.resolve(null);
    });
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useProxyConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newConfig = { ...mockConfig, listen_port: 9090 };
    await act(async () => {
      await result.current.updateConfig(newConfig);
    });

    expect(invokeMock).toHaveBeenCalledWith("update_proxy_config", {
      config: newConfig,
    });
    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).not.toHaveBeenCalled();
    // Should invalidate both proxyConfig and proxyStatus
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["proxyConfig"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["proxyStatus"],
    });
  });

  it("shows error toast when update fails", async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === "get_proxy_config") return Promise.resolve(mockConfig);
      if (command === "update_proxy_config")
        return Promise.reject(new Error("network error"));
      return Promise.resolve(null);
    });
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useProxyConfig(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await expect(
        result.current.updateConfig(mockConfig),
      ).rejects.toThrow("network error");
    });

    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });
});
