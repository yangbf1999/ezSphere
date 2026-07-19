import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// secret.ts: decryptSecret / encryptSecret 纯 invoke 薄封装。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { decryptSecret, encryptSecret } from "@/api/secret";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;

describe("secret API", () => {
  beforeEach(() => mockInvoke.mockReset());
  afterEach(() => vi.restoreAllMocks());

  describe("decryptSecret", () => {
    it("调用 decrypt_secret 传 encrypted，透传返回", async () => {
      mockInvoke.mockResolvedValue("plain");
      await expect(decryptSecret("enc:v1:abc")).resolves.toBe("plain");
      expect(mockInvoke).toHaveBeenCalledWith("decrypt_secret", {
        encrypted: "enc:v1:abc",
      });
    });
    it("错误透传", async () => {
      mockInvoke.mockRejectedValue(new Error("bad envelope"));
      await expect(decryptSecret("x")).rejects.toThrow("bad envelope");
    });
  });

  describe("encryptSecret", () => {
    it("调用 encrypt_secret 传 plaintext，透传返回", async () => {
      mockInvoke.mockResolvedValue("enc:v1:zzz");
      await expect(encryptSecret("plain")).resolves.toBe("enc:v1:zzz");
      expect(mockInvoke).toHaveBeenCalledWith("encrypt_secret", {
        plaintext: "plain",
      });
    });
    it("空串透传", async () => {
      mockInvoke.mockResolvedValue("enc:v1:");
      await encryptSecret("");
      expect(mockInvoke).toHaveBeenCalledWith("encrypt_secret", { plaintext: "" });
    });
  });
});
