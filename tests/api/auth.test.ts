import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// auth.ts: managed auth (github_copilot / codex_oauth)。githubDomain 默认 null。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import {
  authStartLogin,
  authPollForAccount,
  authListAccounts,
  authGetStatus,
  authRemoveAccount,
  authSetDefaultAccount,
  authLogout,
} from "@/lib/api/auth";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("auth API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  describe("authStartLogin", () => {
    it("有 githubDomain：透传", async () => {
      const resp = { provider: "github_copilot", device_code: "dc", user_code: "uc", verification_uri: "u", expires_in: 1, interval: 1 };
      mockInvoke.mockResolvedValue(resp);
      await expect(authStartLogin("github_copilot", "gh.example.com")).resolves.toBe(resp);
      expect(mockInvoke).toHaveBeenCalledWith("auth_start_login", {
        authProvider: "github_copilot",
        githubDomain: "gh.example.com",
      });
    });
    it("无 githubDomain：传 null", async () => {
      mockInvoke.mockResolvedValue({} as any);
      await authStartLogin("codex_oauth");
      expect(mockInvoke).toHaveBeenCalledWith("auth_start_login", {
        authProvider: "codex_oauth",
        githubDomain: null,
      });
    });
  });

  describe("authPollForAccount", () => {
    it("调用 auth_poll_for_account 传 deviceCode + provider + domain(null)", async () => {
      mockInvoke.mockResolvedValue(null);
      await expect(authPollForAccount("github_copilot", "dc")).resolves.toBeNull();
      expect(mockInvoke).toHaveBeenCalledWith("auth_poll_for_account", {
        authProvider: "github_copilot",
        deviceCode: "dc",
        githubDomain: null,
      });
    });
    it("返回 account 透传", async () => {
      const acc = { id: "1", provider: "github_copilot", login: "u" } as any;
      mockInvoke.mockResolvedValue(acc);
      await expect(authPollForAccount("github_copilot", "dc", "gh.com")).resolves.toBe(acc);
      expect(mockInvoke).toHaveBeenCalledWith("auth_poll_for_account", {
        authProvider: "github_copilot",
        deviceCode: "dc",
        githubDomain: "gh.com",
      });
    });
  });

  it("authListAccounts 传 authProvider", async () => {
    mockInvoke.mockResolvedValue([]);
    await authListAccounts("github_copilot");
    expect(mockInvoke).toHaveBeenCalledWith("auth_list_accounts", { authProvider: "github_copilot" });
  });

  it("authGetStatus 传 authProvider", async () => {
    mockInvoke.mockResolvedValue({ provider: "github_copilot", authenticated: false, default_account_id: null, accounts: [] } as any);
    await authGetStatus("github_copilot");
    expect(mockInvoke).toHaveBeenCalledWith("auth_get_status", { authProvider: "github_copilot" });
  });

  it("authRemoveAccount 传 authProvider + accountId", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await authRemoveAccount("github_copilot", "acc1");
    expect(mockInvoke).toHaveBeenCalledWith("auth_remove_account", {
      authProvider: "github_copilot",
      accountId: "acc1",
    });
  });

  it("authSetDefaultAccount 传 authProvider + accountId", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await authSetDefaultAccount("codex_oauth", "acc1");
    expect(mockInvoke).toHaveBeenCalledWith("auth_set_default_account", {
      authProvider: "codex_oauth",
      accountId: "acc1",
    });
  });

  it("authLogout 传 authProvider", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await authLogout("github_copilot");
    expect(mockInvoke).toHaveBeenCalledWith("auth_logout", { authProvider: "github_copilot" });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("oauth failed"));
    await expect(authLogout("github_copilot")).rejects.toThrow("oauth failed");
  });
});
