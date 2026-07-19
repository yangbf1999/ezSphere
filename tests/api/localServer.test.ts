import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// localServer.ts: 多为 invoke 薄封装；可选参数默认 null。onDownloadProgress
// 走 listen('download-progress')。

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn() }));

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  startLlmServer,
  stopLlmServer,
  getLlmServerInfo,
  getLlmServerLogs,
  getModelsDirs,
  getDownloadDir,
  scanGgufFiles,
  scanHfModels,
  addModelsDir,
  removeModelsDir,
  detectGpu,
  getGpuInfo,
  getSystemInfo,
  setDownloadDir,
  getStoreModels,
  downloadModel,
  getLocalEngineStatus,
  installLocalEngine,
  pauseDownload,
  cancelDownload,
  onDownloadProgress,
} from "@/api/localServer";

const mockInvoke = invoke as unknown as ReturnType<typeof vi.fn>;
const mockListen = listen as unknown as ReturnType<typeof vi.fn>;

describe("localServer API", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockListen.mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  describe("startLlmServer", () => {
    it("仅必填参数：可选字段为 null", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await startLlmServer("/m/gguf", 8080);
      expect(mockInvoke).toHaveBeenCalledWith("start_llm_server", {
        modelPath: "/m/gguf",
        port: 8080,
        gpuLayers: null,
        contextSize: null,
        runtime: null,
      });
    });

    it("全参数：透传", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await startLlmServer("/m/gguf", 8080, 40, 2048, "llama");
      expect(mockInvoke).toHaveBeenCalledWith("start_llm_server", {
        modelPath: "/m/gguf",
        port: 8080,
        gpuLayers: 40,
        contextSize: 2048,
        runtime: "llama",
      });
    });
  });

  it("stopLlmServer 调用 stop_llm_server 无参", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await stopLlmServer();
    expect(mockInvoke).toHaveBeenCalledWith("stop_llm_server");
  });

  it("getLlmServerInfo 透传返回值", async () => {
    const info = { running: true, port: 8080 } as any;
    mockInvoke.mockResolvedValue(info);
    await expect(getLlmServerInfo()).resolves.toBe(info);
    expect(mockInvoke).toHaveBeenCalledWith("get_llm_server_info");
  });

  it("getLlmServerLogs 调用 get_llm_server_logs", async () => {
    mockInvoke.mockResolvedValue(["line1", "line2"]);
    await expect(getLlmServerLogs()).resolves.toEqual(["line1", "line2"]);
  });

  it("getModelsDirs / getDownloadDir 无参", async () => {
    mockInvoke.mockResolvedValue(["/a", "/b"]);
    await expect(getModelsDirs()).resolves.toEqual(["/a", "/b"]);
    expect(mockInvoke).toHaveBeenCalledWith("get_models_dirs");

    mockInvoke.mockResolvedValue("/dl");
    await expect(getDownloadDir()).resolves.toBe("/dl");
    expect(mockInvoke).toHaveBeenCalledWith("get_download_dir");
  });

  it("scanGgufFiles 传 dir", async () => {
    mockInvoke.mockResolvedValue([]);
    await scanGgufFiles("/models");
    expect(mockInvoke).toHaveBeenCalledWith("scan_gguf_files", { dir: "/models" });
  });

  it("scanHfModels 传 dir", async () => {
    mockInvoke.mockResolvedValue([]);
    await scanHfModels("/hf");
    expect(mockInvoke).toHaveBeenCalledWith("scan_hf_models", { dir: "/hf" });
  });

  it("addModelsDir 无参", async () => {
    mockInvoke.mockResolvedValue(["/new"]);
    await expect(addModelsDir()).resolves.toEqual(["/new"]);
    expect(mockInvoke).toHaveBeenCalledWith("add_models_dir");
  });

  it("removeModelsDir 传 dir", async () => {
    mockInvoke.mockResolvedValue(["/a"]);
    await removeModelsDir("/a");
    expect(mockInvoke).toHaveBeenCalledWith("remove_models_dir", { dir: "/a" });
  });

  it("detectGpu / getGpuInfo 透传", async () => {
    const gpu = { gpuName: "RTX", gpuVramGb: 8 };
    mockInvoke.mockResolvedValue(gpu);
    await expect(detectGpu()).resolves.toEqual(gpu);
    expect(mockInvoke).toHaveBeenCalledWith("detect_gpu");

    mockInvoke.mockResolvedValue(null);
    await expect(getGpuInfo()).resolves.toBeNull();
    expect(mockInvoke).toHaveBeenCalledWith("get_gpu_info");
  });

  it("getSystemInfo 透传", async () => {
    const sys = { os: "windows", arch: "x86_64", hasNvidiaGpu: true } as any;
    mockInvoke.mockResolvedValue(sys);
    await expect(getSystemInfo()).resolves.toBe(sys);
  });

  it("setDownloadDir 无参", async () => {
    mockInvoke.mockResolvedValue("/dl");
    await expect(setDownloadDir()).resolves.toBe("/dl");
    expect(mockInvoke).toHaveBeenCalledWith("set_download_dir");
  });

  it("getStoreModels 透传", async () => {
    mockInvoke.mockResolvedValue([{ id: "m1" }]);
    await expect(getStoreModels()).resolves.toEqual([{ id: "m1" }]);
  });

  it("downloadModel 传 repo + fileName", async () => {
    mockInvoke.mockResolvedValue("ok");
    await downloadModel("owner/repo", "model.gguf");
    expect(mockInvoke).toHaveBeenCalledWith("download_model", {
      repo: "owner/repo",
      fileName: "model.gguf",
    });
  });

  describe("getLocalEngineStatus", () => {
    it("无 runtime：传 null", async () => {
      mockInvoke.mockResolvedValue({ engines: [] });
      await getLocalEngineStatus();
      expect(mockInvoke).toHaveBeenCalledWith("get_local_engine_status", { runtime: null });
    });
    it("有 runtime：透传", async () => {
      mockInvoke.mockResolvedValue({ engines: [] });
      await getLocalEngineStatus("llama");
      expect(mockInvoke).toHaveBeenCalledWith("get_local_engine_status", { runtime: "llama" });
    });
  });

  it("installLocalEngine 传 runtime", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await installLocalEngine("llama");
    expect(mockInvoke).toHaveBeenCalledWith("install_local_engine", { runtime: "llama" });
  });

  it("pauseDownload 无参", async () => {
    mockInvoke.mockResolvedValue(undefined);
    await pauseDownload();
    expect(mockInvoke).toHaveBeenCalledWith("pause_download");
  });

  describe("cancelDownload", () => {
    it("传 fileName", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await cancelDownload("model.gguf");
      expect(mockInvoke).toHaveBeenCalledWith("cancel_download", { fileName: "model.gguf" });
    });
    it("空 fileName：传 null", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await cancelDownload();
      expect(mockInvoke).toHaveBeenCalledWith("cancel_download", { fileName: null });
    });
  });

  describe("onDownloadProgress", () => {
    it("注册 listen('download-progress')，callback 收到 payload", async () => {
      const unlisten = vi.fn();
      let captured: ((e: { payload: unknown }) => void) | null = null;
      mockListen.mockImplementation((_evt: string, cb: (e: { payload: unknown }) => void) => {
        captured = cb;
        return Promise.resolve(unlisten);
      });
      const cb = vi.fn();
      const result = await onDownloadProgress(cb);
      expect(mockListen).toHaveBeenCalledWith("download-progress", expect.any(Function));
      expect(result).toBe(unlisten);
      const payload = { fileName: "a.gguf", progress: 0.5, status: "downloading" };
      captured!({ payload });
      expect(cb).toHaveBeenCalledWith(payload);
    });
  });
});
