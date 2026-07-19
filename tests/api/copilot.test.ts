import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// copilot.ts: 设备码流程、多账号管理。多组薄封装。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import {
  copilotStartDeviceFlow,
  copilotPollForAuth,
  copilotGetAuthStatus,
  copilotLogout,
  copilotIsAuthenticated,
  copilotGetToken,
  copilotGetModels,
  copilotGetUsage,
  copilotListAccounts,
  copilotPollForAccount,
  copilotRemoveAccount,
  copilotSetDefaultAccount,
  copilotGetTokenForAccount,
  copilotGetModelsForAccount,
  copilotGetUsageForAccount,
} from "@/lib/api/copilot";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("copilot API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("copilotStartDeviceFlow 调用 copilot_start_device_flow 无参", async () => {
    const resp = { device_code: "dc", user_code: "uc", verification_uri: "u", expires_in: 1, interval: 1 };
    mockInvoke.mockResolvedValue(resp);
    await expect(copilotStartDeviceFlow()).resolves.toBe(resp);
    expect(mockInvoke).toHaveBeenCalledWith("copilot_start_device_flow");
  });

  it("copilotPollForAuth 传 deviceCode 返回 boolean", async () => {
    mockInvoke.mockResolvedValue(true);
    await expect(copilotPollForAuth("dc")).resolves.toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("copilot_poll_for_auth", { deviceCode: "dc" });
  });

  it("copilotGetAuthStatus 无参", async () => {
    mockInvoke.mockResolvedValue({ authenticated: false } as any);
    await copilotGetAuthStatus();
    expect(mockInvoke).toHaveBeenCalledWith("copilot_get_auth_status");
  });

  it("copilotLogout 无参", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await copilotLogout();
    expect(mockInvoke).toHaveBeenCalledWith("copilot_logout");
  });

  it("copilotIsAuthenticated 返回 boolean", async () => {
    mockInvoke.mockResolvedValue(false);
    await expect(copilotIsAuthenticated()).resolves.toBe(false);
    expect(mockInvoke).toHaveBeenCalledWith("copilot_is_authenticated");
  });

  it("copilotGetToken 返回 string", async () => {
    mockInvoke.mockResolvedValue("tok");
    await expect(copilotGetToken()).resolves.toBe("tok");
    expect(mockInvoke).toHaveBeenCalledWith("copilot_get_token");
  });

  it("copilotGetModels 返回列表", async () => {
    mockInvoke.mockResolvedValue([{ id: "gpt-4", name: "n", vendor: "v", model_picker_enabled: true }]);
    await copilotGetModels();
    expect(mockInvoke).toHaveBeenCalledWith("copilot_get_models");
  });

  it("copilotGetUsage 无参", async () => {
    mockInvoke.mockResolvedValue({ copilot_plan: "pro", quota_reset_date: "2026-08-01", quota_snapshots: {} } as any);
    await copilotGetUsage();
    expect(mockInvoke).toHaveBeenCalledWith("copilot_get_usage");
  });

  it("copilotListAccounts 无参", async () => {
    mockInvoke.mockResolvedValue([]);
    await copilotListAccounts();
    expect(mockInvoke).toHaveBeenCalledWith("copilot_list_accounts");
  });

  it("copilotPollForAccount 传 deviceCode 返回 account|null", async () => {
    mockInvoke.mockResolvedValue(null);
    await expect(copilotPollForAccount("dc")).resolves.toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith("copilot_poll_for_account", { deviceCode: "dc" });
  });

  it("copilotRemoveAccount 传 accountId", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await copilotRemoveAccount("acc1");
    expect(mockInvoke).toHaveBeenCalledWith("copilot_remove_account", { accountId: "acc1" });
  });

  it("copilotSetDefaultAccount 传 accountId", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await copilotSetDefaultAccount("acc1");
    expect(mockInvoke).toHaveBeenCalledWith("copilot_set_default_account", { accountId: "acc1" });
  });

  it("copilotGetTokenForAccount 传 accountId", async () => {
    mockInvoke.mockResolvedValue("tok");
    await copilotGetTokenForAccount("acc1");
    expect(mockInvoke).toHaveBeenCalledWith("copilot_get_token_for_account", { accountId: "acc1" });
  });

  it("copilotGetModelsForAccount 传 accountId", async () => {
    mockInvoke.mockResolvedValue([]);
    await copilotGetModelsForAccount("acc1");
    expect(mockInvoke).toHaveBeenCalledWith("copilot_get_models_for_account", { accountId: "acc1" });
  });

  it("copilotGetUsageForAccount 传 accountId", async () => {
    mockInvoke.mockResolvedValue({} as any);
    await copilotGetUsageForAccount("acc1");
    expect(mockInvoke).toHaveBeenCalledWith("copilot_get_usage_for_account", { accountId: "acc1" });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("rate limited"));
    await expect(copilotPollForAuth("dc")).rejects.toThrow("rate limited");
  });
});
