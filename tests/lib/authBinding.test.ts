import { describe, it, expect } from "vitest";
import { resolveManagedAccountId } from "@/lib/authBinding";
import type { ProviderMeta } from "@/types";

// resolveManagedAccountId 的分支：
//  1) authBinding.source === "managed_account" 且 authProvider 匹配 -> 返回 accountId
//  2) authProvider === "github_copilot" -> 返回 meta.githubAccountId
//  3) 其余 -> null

describe("resolveManagedAccountId", () => {
  it("managed_account 绑定且 authProvider 匹配：返回 accountId", () => {
    const meta: ProviderMeta = {
      authBinding: {
        source: "managed_account",
        authProvider: "codex_oauth",
        accountId: "acct-123",
      },
    };
    expect(resolveManagedAccountId(meta, "codex_oauth")).toBe("acct-123");
  });

  it("managed_account 绑定但 authProvider 不匹配：回落到 github_copilot 分支", () => {
    const meta: ProviderMeta = {
      authBinding: {
        source: "managed_account",
        authProvider: "codex_oauth",
        accountId: "acct-123",
      },
      githubAccountId: "gh-456",
    };
    // authProvider 不匹配，走 github_copilot 分支
    expect(resolveManagedAccountId(meta, "github_copilot")).toBe("gh-456");
  });

  it("managed_account 绑定但 accountId 缺失：返回 null（即使 authProvider 匹配）", () => {
    const meta: ProviderMeta = {
      authBinding: { source: "managed_account", authProvider: "codex_oauth" },
    };
    expect(resolveManagedAccountId(meta, "codex_oauth")).toBeNull();
  });

  it("authProvider === github_copilot 且有 githubAccountId：返回 githubAccountId", () => {
    const meta: ProviderMeta = { githubAccountId: "gh-789" };
    expect(resolveManagedAccountId(meta, "github_copilot")).toBe("gh-789");
  });

  it("authProvider === github_copilot 但无 githubAccountId：返回 null", () => {
    const meta: ProviderMeta = {};
    expect(resolveManagedAccountId(meta, "github_copilot")).toBeNull();
  });

  it("authProvider 为其他值且无匹配绑定：返回 null", () => {
    const meta: ProviderMeta = {
      authBinding: { source: "provider_config", authProvider: "codex_oauth" },
      githubAccountId: "gh-000",
    };
    // provider_config 来源不满足 managed_account；authProvider 也不是 github_copilot
    expect(resolveManagedAccountId(meta, "codex_oauth")).toBeNull();
  });

  it("meta 为 undefined：返回 null", () => {
    expect(resolveManagedAccountId(undefined, "github_copilot")).toBeNull();
    expect(resolveManagedAccountId(undefined, "codex_oauth")).toBeNull();
  });
});
