import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCodexCommonConfig } from "@/components/providers/forms/hooks/useCodexCommonConfig";
import { useGeminiCommonConfig } from "@/components/providers/forms/hooks/useGeminiCommonConfig";

const getCommonConfigSnippetMock = vi.fn();
const setCommonConfigSnippetMock = vi.fn();
const extractCommonConfigSnippetMock = vi.fn();

vi.mock("@/lib/api", () => ({
  configApi: {
    getCommonConfigSnippet: (...args: unknown[]) =>
      getCommonConfigSnippetMock(...args),
    setCommonConfigSnippet: (...args: unknown[]) =>
      setCommonConfigSnippetMock(...args),
    extractCommonConfigSnippet: (...args: unknown[]) =>
      extractCommonConfigSnippetMock(...args),
  },
}));

describe("common config snippet saving", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getCommonConfigSnippetMock.mockResolvedValue("");
    setCommonConfigSnippetMock.mockResolvedValue(undefined);
    extractCommonConfigSnippetMock.mockResolvedValue("");
  });

  it("does not persist an invalid Codex common config snippet", async () => {
    const onConfigChange = vi.fn();
    const { result } = renderHook(() =>
      useCodexCommonConfig({
        codexConfig: "model = \"gpt-5\"",
        onConfigChange,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let saved = false;
    act(() => {
      saved = result.current.handleCommonConfigSnippetChange(
        "base_url = https://bad.example/v1",
      );
    });

    expect(saved).toBe(false);
    expect(setCommonConfigSnippetMock).not.toHaveBeenCalled();
    expect(onConfigChange).not.toHaveBeenCalled();
    expect(result.current.commonConfigError).toContain("invalid value");
  });

  it("does not persist an invalid Gemini common config snippet", async () => {
    const onEnvChange = vi.fn();
    const { result } = renderHook(() =>
      useGeminiCommonConfig({
        envValue: "",
        onEnvChange,
        envStringToObj: () => ({}),
        envObjToString: () => "",
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let saved = false;
    act(() => {
      saved = result.current.handleCommonConfigSnippetChange(
        JSON.stringify({ GEMINI_MODEL: 123 }),
      );
    });

    expect(saved).toBe(false);
    expect(setCommonConfigSnippetMock).not.toHaveBeenCalled();
    expect(onEnvChange).not.toHaveBeenCalled();
    expect(result.current.commonConfigError).toBe(
      "geminiConfig.commonConfigInvalidValues",
    );
  });

  it("applies, toggles, replaces and clears a valid Gemini snippet", async () => {
    getCommonConfigSnippetMock.mockResolvedValue(
      JSON.stringify({ SHARED: " yes ", EMPTY: " " }),
    );
    const onEnvChange = vi.fn();
    const envStringToObj = (value: string) => JSON.parse(value || "{}");
    const envObjToString = (value: Record<string, unknown>) => JSON.stringify(value);
    const { result } = renderHook(() =>
      useGeminiCommonConfig({
        envValue: JSON.stringify({ KEEP: "x", SHARED: "yes" }),
        onEnvChange,
        envStringToObj,
        envObjToString,
      }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.useCommonConfig).toBe(true));

    act(() => result.current.handleCommonConfigToggle(false));
    expect(onEnvChange).toHaveBeenLastCalledWith(JSON.stringify({ KEEP: "x" }));
    act(() => result.current.handleCommonConfigToggle(true));
    expect(onEnvChange).toHaveBeenLastCalledWith(
      JSON.stringify({ KEEP: "x", SHARED: "yes" }),
    );

    act(() => {
      expect(
        result.current.handleCommonConfigSnippetChange(
          JSON.stringify({ NEXT: " 2 " }),
        ),
      ).toBe(true);
    });
    expect(setCommonConfigSnippetMock).toHaveBeenCalledWith(
      "gemini",
      JSON.stringify({ NEXT: " 2 " }),
    );

    act(() => {
      expect(result.current.handleCommonConfigSnippetChange("  ")).toBe(true);
    });
    expect(setCommonConfigSnippetMock).toHaveBeenCalledWith("gemini", "");
    expect(result.current.useCommonConfig).toBe(false);
  });

  it("validates Gemini toggle inputs and covers extraction outcomes", async () => {
    getCommonConfigSnippetMock.mockResolvedValue("{}");
    const onEnvChange = vi.fn();
    const { result } = renderHook(() =>
      useGeminiCommonConfig({
        envValue: "{}",
        onEnvChange,
        envStringToObj: (value) => JSON.parse(value || "{}"),
        envObjToString: JSON.stringify,
      }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.handleCommonConfigToggle(true));
    expect(result.current.commonConfigError).toBe(
      "geminiConfig.noCommonConfigToApply",
    );
    act(() => result.current.clearCommonConfigError());
    expect(result.current.commonConfigError).toBe("");

    act(() => {
      expect(result.current.handleCommonConfigSnippetChange("[]")).toBe(false);
      expect(
        result.current.handleCommonConfigSnippetChange(
          JSON.stringify({ GEMINI_API_KEY: "secret" }),
        ),
      ).toBe(false);
    });
    expect(result.current.commonConfigError).toContain(
      "geminiConfig.commonConfigInvalidKeys",
    );

    extractCommonConfigSnippetMock.mockResolvedValueOnce("{}");
    await act(async () => result.current.handleExtract());
    expect(result.current.commonConfigError).toBe(
      "geminiConfig.extractNoCommonConfig",
    );

    extractCommonConfigSnippetMock.mockResolvedValueOnce("[]");
    await act(async () => result.current.handleExtract());
    expect(result.current.commonConfigError).toBe(
      "geminiConfig.extractedConfigInvalid",
    );

    extractCommonConfigSnippetMock.mockResolvedValueOnce(
      JSON.stringify({ EXTRACTED: "ok" }),
    );
    await act(async () => result.current.handleExtract());
    expect(setCommonConfigSnippetMock).toHaveBeenLastCalledWith(
      "gemini",
      JSON.stringify({ EXTRACTED: "ok" }),
    );

    extractCommonConfigSnippetMock.mockRejectedValueOnce(new Error("extract failed"));
    await act(async () => result.current.handleExtract());
    expect(result.current.commonConfigError).toBe("geminiConfig.extractFailed");
    expect(result.current.isExtracting).toBe(false);
  });

  it("migrates a valid legacy Gemini snippet and skips an invalid one", async () => {
    localStorage.setItem(
      "ezsphere:gemini-common-config-snippet",
      JSON.stringify({ LEGACY: "yes" }),
    );
    const first = renderHook(() =>
      useGeminiCommonConfig({
        envValue: "{}",
        onEnvChange: vi.fn(),
        envStringToObj: (value) => JSON.parse(value || "{}"),
        envObjToString: JSON.stringify,
      }),
    );
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    expect(setCommonConfigSnippetMock).toHaveBeenCalledWith(
      "gemini",
      JSON.stringify({ LEGACY: "yes" }),
    );
    expect(localStorage.getItem("ezsphere:gemini-common-config-snippet")).toBeNull();
    first.unmount();

    vi.clearAllMocks();
    getCommonConfigSnippetMock.mockResolvedValue("");
    localStorage.setItem("ezsphere:gemini-common-config-snippet", "not json");
    const second = renderHook(() =>
      useGeminiCommonConfig({
        envValue: "{}",
        onEnvChange: vi.fn(),
        envStringToObj: (value) => JSON.parse(value || "{}"),
        envObjToString: JSON.stringify,
      }),
    );
    await waitFor(() => expect(second.result.current.isLoading).toBe(false));
    expect(setCommonConfigSnippetMock).not.toHaveBeenCalled();
  });
});
