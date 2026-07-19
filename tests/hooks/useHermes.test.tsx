import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  useHermesLiveProviderIds,
  useHermesModelConfig,
  useHermesMemory,
  useHermesMemoryLimits,
  useSaveHermesMemory,
  useToggleHermesMemoryEnabled,
  useOpenHermesWebUI,
  hermesKeys,
  HERMES_WEB_OFFLINE_ERROR,
} from "@/hooks/useHermes";
import { createTestQueryClient } from "../utils/testQueryClient";

const getHermesLiveProviderIdsMock = vi.fn();
const getModelConfigMock = vi.fn();
const getMemoryMock = vi.fn();
const setMemoryMock = vi.fn();
const getMemoryLimitsMock = vi.fn();
const setMemoryEnabledMock = vi.fn();
const openWebUIMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/api/hermes", () => ({
  hermesApi: {
    getModelConfig: (...args: unknown[]) => getModelConfigMock(...args),
    openWebUI: (...args: unknown[]) => openWebUIMock(...args),
    getMemory: (...args: unknown[]) => getMemoryMock(...args),
    setMemory: (...args: unknown[]) => setMemoryMock(...args),
    getMemoryLimits: (...args: unknown[]) => getMemoryLimitsMock(...args),
    setMemoryEnabled: (...args: unknown[]) => setMemoryEnabledMock(...args),
  },
}));

vi.mock("@/lib/api/providers", () => ({
  providersApi: {
    getHermesLiveProviderIds: (...args: unknown[]) =>
      getHermesLiveProviderIdsMock(...args),
    getOpenClawLiveProviderIds: vi.fn(),
  },
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

describe("useHermes hooks", () => {
  beforeEach(() => {
    getHermesLiveProviderIdsMock.mockReset();
    getModelConfigMock.mockReset();
    getMemoryMock.mockReset();
    setMemoryMock.mockReset();
    getMemoryLimitsMock.mockReset();
    setMemoryEnabledMock.mockReset();
    openWebUIMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  // ---- Query hooks ----

  describe("useHermesLiveProviderIds", () => {
    it("fetches live provider ids when enabled", async () => {
      getHermesLiveProviderIdsMock.mockResolvedValue(["prov-1", "prov-2"]);
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useHermesLiveProviderIds(true),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(["prov-1", "prov-2"]);
      });
      expect(getHermesLiveProviderIdsMock).toHaveBeenCalledTimes(1);
    });

    it("does not fetch when disabled", async () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useHermesLiveProviderIds(false),
        { wrapper },
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(getHermesLiveProviderIdsMock).not.toHaveBeenCalled();
    });
  });

  describe("useHermesModelConfig", () => {
    it("fetches model config when enabled", async () => {
      const config = { default: "gpt-4", provider: "openai" };
      getModelConfigMock.mockResolvedValue(config);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useHermesModelConfig(true), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(config);
      });
    });

    it("returns null when backend has no model config", async () => {
      getModelConfigMock.mockResolvedValue(null);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useHermesModelConfig(true), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toBeNull();
      });
    });
  });

  describe("useHermesMemory", () => {
    it("fetches memory content for a given kind", async () => {
      getMemoryMock.mockResolvedValue("# Memory content");
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useHermesMemory("memory", true),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.data).toBe("# Memory content");
      });
      expect(getMemoryMock).toHaveBeenCalledWith("memory");
    });

    it("fetches user memory content", async () => {
      getMemoryMock.mockResolvedValue("# User content");
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useHermesMemory("user", true),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.data).toBe("# User content");
      });
      expect(getMemoryMock).toHaveBeenCalledWith("user");
    });
  });

  describe("useHermesMemoryLimits", () => {
    it("fetches memory limits when enabled", async () => {
      const limits = {
        memory: 50000,
        user: 10000,
        memoryEnabled: true,
        userEnabled: false,
      };
      getMemoryLimitsMock.mockResolvedValue(limits);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useHermesMemoryLimits(true), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(limits);
      });
    });
  });

  // ---- Mutation hooks ----

  describe("useSaveHermesMemory", () => {
    it("calls setMemory and invalidates memory query on success", async () => {
      setMemoryMock.mockResolvedValue(undefined);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useSaveHermesMemory(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          kind: "memory",
          content: "updated content",
        });
      });

      expect(setMemoryMock).toHaveBeenCalledWith("memory", "updated content");
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hermesKeys.memory("memory"),
      });
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("shows error toast on failure", async () => {
      setMemoryMock.mockRejectedValue(new Error("write failed"));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useSaveHermesMemory(), { wrapper });

      await act(async () => {
        await expect(
          result.current.mutateAsync({ kind: "user", content: "x" }),
        ).rejects.toThrow("write failed");
      });

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("useToggleHermesMemoryEnabled", () => {
    it("calls setMemoryEnabled and invalidates memoryLimits query on success", async () => {
      setMemoryEnabledMock.mockResolvedValue(undefined);
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(
        () => useToggleHermesMemoryEnabled(),
        { wrapper },
      );

      await act(async () => {
        await result.current.mutateAsync({ kind: "user", enabled: true });
      });

      expect(setMemoryEnabledMock).toHaveBeenCalledWith("user", true);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: hermesKeys.memoryLimits,
      });
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("shows error toast on failure", async () => {
      setMemoryEnabledMock.mockRejectedValue(new Error("toggle failed"));
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useToggleHermesMemoryEnabled(),
        { wrapper },
      );

      await act(async () => {
        await expect(
          result.current.mutateAsync({ kind: "memory", enabled: false }),
        ).rejects.toThrow("toggle failed");
      });

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
    });
  });

  // ---- useOpenHermesWebUI ----

  describe("useOpenHermesWebUI", () => {
    it("calls hermesApi.openWebUI with path", async () => {
      openWebUIMock.mockResolvedValue(undefined);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenHermesWebUI(), { wrapper });

      await act(async () => {
        await result.current("/config");
      });

      expect(openWebUIMock).toHaveBeenCalledWith("/config");
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("calls onOffline callback when Hermes web is offline", async () => {
      openWebUIMock.mockRejectedValue(new Error(HERMES_WEB_OFFLINE_ERROR));
      const onOffline = vi.fn();
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useOpenHermesWebUI(onOffline),
        { wrapper },
      );

      await act(async () => {
        await result.current();
      });

      expect(onOffline).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).not.toHaveBeenCalled();
    });

    it("shows offline toast when no onOffline callback is provided", async () => {
      openWebUIMock.mockRejectedValue(new Error(HERMES_WEB_OFFLINE_ERROR));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenHermesWebUI(), { wrapper });

      await act(async () => {
        await result.current();
      });

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).toHaveBeenCalledWith("hermes.webui.offline");
    });

    it("shows openFailed toast for other errors", async () => {
      openWebUIMock.mockRejectedValue(new Error("browser not found"));
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenHermesWebUI(), { wrapper });

      await act(async () => {
        await result.current();
      });

      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      // Should be called with the openFailed key, not the offline key
      expect(toastErrorMock).toHaveBeenCalledWith(
        "hermes.webui.openFailed",
        expect.objectContaining({ description: "browser not found" }),
      );
    });

    it("passes undefined path when no path argument given", async () => {
      openWebUIMock.mockResolvedValue(undefined);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenHermesWebUI(), { wrapper });

      await act(async () => {
        await result.current();
      });

      // The hook calls hermesApi.openWebUI(path) where path is undefined
      // when not provided. The real openWebUI converts to null internally.
      expect(openWebUIMock).toHaveBeenCalledWith(undefined);
    });
  });
});
