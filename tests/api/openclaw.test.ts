import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// openclaw.ts: agents/env/tools 配置读写薄封装。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { openclawApi } from "@/lib/api/openclaw";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("openclaw API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  // Agents
  it("getDefaultModel 调用 get_openclaw_default_model", async () => {
    mockInvoke.mockResolvedValue(null);
    await expect(openclawApi.getDefaultModel()).resolves.toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith("get_openclaw_default_model");
  });
  it("setDefaultModel 调用 set_openclaw_default_model 传 model", async () => {
    mockInvoke.mockResolvedValue({ ok: true } as any);
    await openclawApi.setDefaultModel({ provider: "p", model: "m" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("set_openclaw_default_model", {
      model: { provider: "p", model: "m" },
    });
  });
  it("getModelCatalog 调用 get_openclaw_model_catalog", async () => {
    mockInvoke.mockResolvedValue(null);
    await openclawApi.getModelCatalog();
    expect(mockInvoke).toHaveBeenCalledWith("get_openclaw_model_catalog");
  });
  it("setModelCatalog 调用 set_openclaw_model_catalog 传 catalog", async () => {
    mockInvoke.mockResolvedValue({ ok: true } as any);
    await openclawApi.setModelCatalog({ m1: {} } as any);
    expect(mockInvoke).toHaveBeenCalledWith("set_openclaw_model_catalog", { catalog: { m1: {} } });
  });
  it("getAgentsDefaults 调用 get_openclaw_agents_defaults", async () => {
    mockInvoke.mockResolvedValue(null);
    await openclawApi.getAgentsDefaults();
    expect(mockInvoke).toHaveBeenCalledWith("get_openclaw_agents_defaults");
  });
  it("setAgentsDefaults 调用 set_openclaw_agents_defaults 传 defaults", async () => {
    mockInvoke.mockResolvedValue({ ok: true } as any);
    await openclawApi.setAgentsDefaults({ model: {} } as any);
    expect(mockInvoke).toHaveBeenCalledWith("set_openclaw_agents_defaults", {
      defaults: { model: {} },
    });
  });

  // Env
  it("getEnv 调用 get_openclaw_env", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await openclawApi.getEnv();
    expect(mockInvoke).toHaveBeenCalledWith("get_openclaw_env");
  });
  it("setEnv 调用 set_openclaw_env 传 env", async () => {
    mockInvoke.mockResolvedValue({ ok: true } as any);
    await openclawApi.setEnv({ ANTHROPIC_BASE_URL: "x" } as any);
    expect(mockInvoke).toHaveBeenCalledWith("set_openclaw_env", { env: { ANTHROPIC_BASE_URL: "x" } });
  });

  // Tools
  it("getTools 调用 get_openclaw_tools", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await openclawApi.getTools();
    expect(mockInvoke).toHaveBeenCalledWith("get_openclaw_tools");
  });
  it("setTools 调用 set_openclaw_tools 传 tools", async () => {
    mockInvoke.mockResolvedValue({ ok: true } as any);
    await openclawApi.setTools({ bash: true } as any);
    expect(mockInvoke).toHaveBeenCalledWith("set_openclaw_tools", { tools: { bash: true } });
  });

  it("scanHealth 调用 scan_openclaw_config_health", async () => {
    mockInvoke.mockResolvedValue([]);
    await openclawApi.scanHealth();
    expect(mockInvoke).toHaveBeenCalledWith("scan_openclaw_config_health");
  });
  it("getLiveProvider 传 providerId", async () => {
    mockInvoke.mockResolvedValue(null);
    await openclawApi.getLiveProvider("p1");
    expect(mockInvoke).toHaveBeenCalledWith("get_openclaw_live_provider", { providerId: "p1" });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("config write failed"));
    await expect(openclawApi.setEnv({} as any)).rejects.toThrow("config write failed");
  });
});
