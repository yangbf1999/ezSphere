import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// deeplink.ts: deeplinkApi 对象，三个方法均 invoke 薄封装。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { deeplinkApi } from "@/lib/api/deeplink";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("deeplink API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  it("parseDeeplink 调用 parse_deeplink 传 url", async () => {
    mockInvoke.mockResolvedValue({ version: "1", resource: "provider" });
    await deeplinkApi.parseDeeplink("ccswitch://x");
    expect(mockInvoke).toHaveBeenCalledWith("parse_deeplink", { url: "ccswitch://x" });
  });

  it("mergeDeeplinkConfig 调用 merge_deeplink_config 传 request", async () => {
    const req = { version: "1", resource: "provider", name: "p" } as any;
    mockInvoke.mockResolvedValue(req);
    await deeplinkApi.mergeDeeplinkConfig(req);
    expect(mockInvoke).toHaveBeenCalledWith("merge_deeplink_config", { request: req });
  });

  it("importFromDeeplink 调用 import_from_deeplink_unified 传 request", async () => {
    const req = { version: "1", resource: "skill", repo: "r" } as any;
    mockInvoke.mockResolvedValue({ type: "skill", key: "k" });
    await deeplinkApi.importFromDeeplink(req);
    expect(mockInvoke).toHaveBeenCalledWith("import_from_deeplink_unified", { request: req });
  });

  it("错误透传", async () => {
    mockInvoke.mockRejectedValue(new Error("bad url"));
    await expect(deeplinkApi.parseDeeplink("not-a-url")).rejects.toThrow("bad url");
  });
});
