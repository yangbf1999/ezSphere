import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  useOpenClawLiveProviderIds,
  useOpenClawDefaultModel,
  useOpenClawEnv,
  useOpenClawTools,
  useOpenClawAgentsDefaults,
  useOpenClawHealth,
  useSaveOpenClawEnv,
  useSaveOpenClawTools,
  useSaveOpenClawAgentsDefaults,
  openclawKeys,
} from "@/hooks/useOpenClaw";
import { createTestQueryClient } from "../utils/testQueryClient";
import type {
  OpenClawEnvConfig,
  OpenClawToolsConfig,
  OpenClawAgentsDefaults,
} from "@/types";

const getOpenClawLiveProviderIdsMock = vi.fn();
const getDefaultModelMock = vi.fn();
const getEnvMock = vi.fn();
const getToolsMock = vi.fn();
const getAgentsDefaultsMock = vi.fn();
const scanHealthMock = vi.fn();
const setEnvMock = vi.fn();
const setToolsMock = vi.fn();
const setAgentsDefaultsMock = vi.fn();

vi.mock("@/lib/api/openclaw", () => ({
  openclawApi: {
    getDefaultModel: (...args: unknown[]) => getDefaultModelMock(...args),
    setDefaultModel: vi.fn(),
    getModelCatalog: vi.fn(),
    setModelCatalog: vi.fn(),
    getAgentsDefaults: (...args: unknown[]) =>
      getAgentsDefaultsMock(...args),
    setAgentsDefaults: (...args: unknown[]) =>
      setAgentsDefaultsMock(...args),
    getEnv: (...args: unknown[]) => getEnvMock(...args),
    setEnv: (...args: unknown[]) => setEnvMock(...args),
    getTools: (...args: unknown[]) => getToolsMock(...args),
    setTools: (...args: unknown[]) => setToolsMock(...args),
    scanHealth: (...args: unknown[]) => scanHealthMock(...args),
    getLiveProvider: vi.fn(),
  },
}));

vi.mock("@/lib/api/providers", () => ({
  providersApi: {
    getOpenClawLiveProviderIds: (...args: unknown[]) =>
      getOpenClawLiveProviderIdsMock(...args),
    getHermesLiveProviderIds: vi.fn(),
  },
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

describe("useOpenClaw hooks", () => {
  beforeEach(() => {
    getOpenClawLiveProviderIdsMock.mockReset();
    getDefaultModelMock.mockReset();
    getEnvMock.mockReset();
    getToolsMock.mockReset();
    getAgentsDefaultsMock.mockReset();
    scanHealthMock.mockReset();
    setEnvMock.mockReset();
    setToolsMock.mockReset();
    setAgentsDefaultsMock.mockReset();
  });

  // ---- Query hooks ----

  describe("useOpenClawLiveProviderIds", () => {
    it("fetches live provider ids when enabled", async () => {
      getOpenClawLiveProviderIdsMock.mockResolvedValue(["p1", "p2"]);
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useOpenClawLiveProviderIds(true),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(["p1", "p2"]);
      });
    });

    it("does not fetch when disabled", async () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useOpenClawLiveProviderIds(false),
        { wrapper },
      );

      expect(result.current.fetchStatus).toBe("idle");
      expect(getOpenClawLiveProviderIdsMock).not.toHaveBeenCalled();
    });
  });

  describe("useOpenClawDefaultModel", () => {
    it("fetches default model when enabled", async () => {
      const model = { primary: "claude-3", fallbacks: ["gpt-4"] };
      getDefaultModelMock.mockResolvedValue(model);
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useOpenClawDefaultModel(true),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(model);
      });
    });

    it("returns null when no default model is set", async () => {
      getDefaultModelMock.mockResolvedValue(null);
      const { wrapper } = createWrapper();

      const { result } = renderHook(
        () => useOpenClawDefaultModel(true),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.data).toBeNull();
      });
    });
  });

  describe("useOpenClawEnv", () => {
    it("fetches env config", async () => {
      const env: OpenClawEnvConfig = { API_KEY: "secret", MODEL: "gpt-4" };
      getEnvMock.mockResolvedValue(env);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenClawEnv(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(env);
      });
    });
  });

  describe("useOpenClawTools", () => {
    it("fetches tools config", async () => {
      const tools: OpenClawToolsConfig = {
        profile: "coding",
        allow: ["fs"],
        deny: [],
      };
      getToolsMock.mockResolvedValue(tools);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenClawTools(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(tools);
      });
    });
  });

  describe("useOpenClawAgentsDefaults", () => {
    it("fetches agents defaults config", async () => {
      const defaults: OpenClawAgentsDefaults = {
        model: { primary: "gpt-4" },
        timeoutSeconds: 120,
      };
      getAgentsDefaultsMock.mockResolvedValue(defaults);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenClawAgentsDefaults(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(defaults);
      });
    });
  });

  describe("useOpenClawHealth", () => {
    it("fetches health warnings when enabled", async () => {
      const warnings = [
        { code: "MISSING_API_KEY", message: "API key not set" },
      ];
      scanHealthMock.mockResolvedValue(warnings);
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenClawHealth(true), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(warnings);
      });
    });

    it("does not fetch when disabled", async () => {
      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useOpenClawHealth(false), {
        wrapper,
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(scanHealthMock).not.toHaveBeenCalled();
    });
  });

  // ---- Mutation hooks ----

  describe("useSaveOpenClawEnv", () => {
    it("calls setEnv and invalidates env + health queries on success", async () => {
      setEnvMock.mockResolvedValue({ warnings: [] });
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useSaveOpenClawEnv(), { wrapper });

      const env: OpenClawEnvConfig = { API_KEY: "new-key" };
      await act(async () => {
        await result.current.mutateAsync(env);
      });

      expect(setEnvMock).toHaveBeenCalledWith(env);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: openclawKeys.env,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: openclawKeys.health,
      });
    });
  });

  describe("useSaveOpenClawTools", () => {
    it("calls setTools and invalidates tools + health queries on success", async () => {
      setToolsMock.mockResolvedValue({ warnings: [] });
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useSaveOpenClawTools(), { wrapper });

      const tools: OpenClawToolsConfig = { profile: "full", allow: [] };
      await act(async () => {
        await result.current.mutateAsync(tools);
      });

      expect(setToolsMock).toHaveBeenCalledWith(tools);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: openclawKeys.tools,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: openclawKeys.health,
      });
    });
  });

  describe("useSaveOpenClawAgentsDefaults", () => {
    it("calls setAgentsDefaults and invalidates agentsDefaults + defaultModel + health on success", async () => {
      setAgentsDefaultsMock.mockResolvedValue({ warnings: [] });
      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(
        () => useSaveOpenClawAgentsDefaults(),
        { wrapper },
      );

      const defaults: OpenClawAgentsDefaults = {
        model: { primary: "claude-3-opus" },
      };
      await act(async () => {
        await result.current.mutateAsync(defaults);
      });

      expect(setAgentsDefaultsMock).toHaveBeenCalledWith(defaults);
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: openclawKeys.agentsDefaults,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: openclawKeys.defaultModel,
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: openclawKeys.health,
      });
    });
  });
});
