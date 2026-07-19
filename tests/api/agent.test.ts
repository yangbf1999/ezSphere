import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// agent.ts: send/abort/reset 是 invoke 薄封装；listenAgentEvents 依据
// isTauriRuntime 决定走 listen 还是返回 noop。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn() }));
vi.mock("@/lib/tauri-runtime", () => ({ isTauriRuntime: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { isTauriRuntime } from "@/lib/tauri-runtime";
import {
  sendAgentMessage,
  abortAgent,
  resetAgent,
  listenAgentEvents,
} from "@/api/agent";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;
const mockListen = listen as unknown as ReturnType<typeof vi.fn>;
const mockIsTauri = isTauriRuntime as unknown as ReturnType<typeof vi.fn>;

describe("agent API", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockListen.mockReset();
    mockIsTauri.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  describe("sendAgentMessage", () => {
    it("调用 agent_send_message 并透传 request", async () => {
      const request = { serverKey: "s1", message: "hi" } as any;
      mockInvoke.mockResolvedValue("task-id");
      await expect(sendAgentMessage(request)).resolves.toBe("task-id");
      expect(mockInvoke).toHaveBeenCalledWith("agent_send_message", { request });
    });

    it("invoke 抛错时透传", async () => {
      mockInvoke.mockRejectedValue(new Error("agent down"));
      await expect(sendAgentMessage({} as any)).rejects.toThrow("agent down");
    });
  });

  describe("abortAgent", () => {
    it("调用 agent_abort 并传 serverKey", async () => {
      mockInvoke.mockResolvedValue(true);
      await expect(abortAgent("s1")).resolves.toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith("agent_abort", { serverKey: "s1" });
    });
  });

  describe("resetAgent", () => {
    it("调用 agent_reset 并传 serverKey", async () => {
      mockInvoke.mockResolvedValue("ok");
      await expect(resetAgent("s1")).resolves.toBe("ok");
      expect(mockInvoke).toHaveBeenCalledWith("agent_reset", { serverKey: "s1" });
    });
  });

  describe("listenAgentEvents", () => {
    it("非 Tauri 运行时：返回 noop，不调用 listen", async () => {
      mockIsTauri.mockReturnValue(false);
      const handler = vi.fn();
      const unlisten = await listenAgentEvents(handler);
      expect(mockListen).not.toHaveBeenCalled();
      expect(typeof unlisten).toBe("function");
      expect(unlisten()).toBeUndefined();
    });

    it("Tauri 运行时：调用 listen('agent_event')，handler 收到 payload", async () => {
      mockIsTauri.mockReturnValue(true);
      const unlisten = vi.fn();
      mockListen.mockResolvedValue(unlisten);
      let captured: ((e: { payload: unknown }) => void) | null = null;
      mockListen.mockImplementation((_evt: string, cb: (e: { payload: unknown }) => void) => {
        captured = cb;
        return Promise.resolve(unlisten);
      });

      const handler = vi.fn();
      const result = await listenAgentEvents(handler);
      expect(mockListen).toHaveBeenCalledWith("agent_event", expect.any(Function));
      expect(result).toBe(unlisten);

      const payload = { type: "delta", data: "x" };
      captured!({ payload });
      expect(handler).toHaveBeenCalledWith(payload);
    });
  });
});
