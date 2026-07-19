import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { usePromptActions } from "@/hooks/usePromptActions";
import type { Prompt } from "@/lib/api";

const getPromptsMock = vi.fn();
const getCurrentFileContentMock = vi.fn();
const upsertPromptMock = vi.fn();
const deletePromptMock = vi.fn();
const enablePromptMock = vi.fn();
const importFromFileMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/lib/api", () => ({
  promptsApi: {
    getPrompts: (...args: unknown[]) => getPromptsMock(...args),
    getCurrentFileContent: (...args: unknown[]) =>
      getCurrentFileContentMock(...args),
    upsertPrompt: (...args: unknown[]) => upsertPromptMock(...args),
    deletePrompt: (...args: unknown[]) => deletePromptMock(...args),
    enablePrompt: (...args: unknown[]) => enablePromptMock(...args),
    importFromFile: (...args: unknown[]) => importFromFileMock(...args),
  },
}));

interface WrapperProps {
  children: ReactNode;
}

function createWrapper() {
  const queryClient = new QueryClient();

  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
}

const mockPrompts: Record<string, Prompt> = {
  p1: {
    id: "p1",
    name: "Prompt 1",
    content: "content-1",
    enabled: false,
  },
  p2: {
    id: "p2",
    name: "Prompt 2",
    content: "content-2",
    enabled: true,
  },
};

describe("usePromptActions", () => {
  beforeEach(() => {
    getPromptsMock.mockReset();
    getCurrentFileContentMock.mockReset();
    upsertPromptMock.mockReset();
    deletePromptMock.mockReset();
    enablePromptMock.mockReset();
    importFromFileMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();

    getPromptsMock.mockResolvedValue({ ...mockPrompts });
    getCurrentFileContentMock.mockResolvedValue("file content");
    upsertPromptMock.mockResolvedValue(undefined);
    deletePromptMock.mockResolvedValue(undefined);
    enablePromptMock.mockResolvedValue(undefined);
    importFromFileMock.mockResolvedValue("imported-id");
  });

  // ---- reload ----

  it("reload loads prompts and current file content", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(getPromptsMock).toHaveBeenCalledWith("claude");
    expect(getCurrentFileContentMock).toHaveBeenCalledWith("claude");
    expect(result.current.prompts).toEqual(mockPrompts);
    expect(result.current.currentFileContent).toBe("file content");
    expect(result.current.loading).toBe(false);
  });

  it("reload shows error toast when getPrompts fails", async () => {
    getPromptsMock.mockRejectedValue(new Error("network"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(toastErrorMock).toHaveBeenCalledWith("prompts.loadFailed");
    expect(result.current.loading).toBe(false);
  });

  it("reload sets currentFileContent to null when getCurrentFileContent fails", async () => {
    getCurrentFileContentMock.mockRejectedValue(new Error("no file"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.currentFileContent).toBeNull();
    expect(result.current.prompts).toEqual(mockPrompts);
  });

  // ---- savePrompt ----

  it("savePrompt calls upsertPrompt and shows success toast", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    const newPrompt: Prompt = {
      id: "p3",
      name: "Prompt 3",
      content: "new",
      enabled: false,
    };

    await act(async () => {
      await result.current.savePrompt("p3", newPrompt);
    });

    expect(upsertPromptMock).toHaveBeenCalledWith("claude", "p3", newPrompt);
    expect(toastSuccessMock).toHaveBeenCalledWith("prompts.saveSuccess", {
      closeButton: true,
    });
  });

  it("savePrompt shows error toast and throws on failure", async () => {
    upsertPromptMock.mockRejectedValue(new Error("save failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    const newPrompt: Prompt = {
      id: "p3",
      name: "Prompt 3",
      content: "new",
      enabled: false,
    };

    await expect(
      act(async () => {
        await result.current.savePrompt("p3", newPrompt);
      }),
    ).rejects.toThrow("save failed");

    expect(toastErrorMock).toHaveBeenCalledWith("prompts.saveFailed");
  });

  // ---- deletePrompt ----

  it("deletePrompt calls API and shows success toast", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await act(async () => {
      await result.current.deletePrompt("p1");
    });

    expect(deletePromptMock).toHaveBeenCalledWith("claude", "p1");
    expect(toastSuccessMock).toHaveBeenCalledWith("prompts.deleteSuccess", {
      closeButton: true,
    });
  });

  it("deletePrompt shows error toast and throws on failure", async () => {
    deletePromptMock.mockRejectedValue(new Error("delete failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await expect(
      act(async () => {
        await result.current.deletePrompt("p1");
      }),
    ).rejects.toThrow("delete failed");

    expect(toastErrorMock).toHaveBeenCalledWith("prompts.deleteFailed");
  });

  // ---- enablePrompt ----

  it("enablePrompt calls API and shows success toast", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await act(async () => {
      await result.current.enablePrompt("p1");
    });

    expect(enablePromptMock).toHaveBeenCalledWith("claude", "p1");
    expect(toastSuccessMock).toHaveBeenCalledWith("prompts.enableSuccess", {
      closeButton: true,
    });
  });

  it("enablePrompt shows error toast and throws on failure", async () => {
    enablePromptMock.mockRejectedValue(new Error("enable failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await expect(
      act(async () => {
        await result.current.enablePrompt("p1");
      }),
    ).rejects.toThrow("enable failed");

    expect(toastErrorMock).toHaveBeenCalledWith("prompts.enableFailed");
  });

  // ---- toggleEnabled (optimistic update + rollback) ----

  it("toggleEnabled(true) optimistically enables target and disables others", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    // Populate prompts via reload
    await act(async () => {
      await result.current.reload();
    });

    // Before toggle: p1 disabled, p2 enabled
    expect(result.current.prompts.p1.enabled).toBe(false);
    expect(result.current.prompts.p2.enabled).toBe(true);

    await act(async () => {
      await result.current.toggleEnabled("p1", true);
    });

    expect(enablePromptMock).toHaveBeenCalledWith("claude", "p1");
    expect(toastSuccessMock).toHaveBeenCalledWith("prompts.enableSuccess", {
      closeButton: true,
    });
  });

  it("toggleEnabled(true) rolls back on failure", async () => {
    enablePromptMock.mockRejectedValue(new Error("enable failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await act(async () => {
      await result.current.reload();
    });

    // Original state: p1 disabled, p2 enabled
    expect(result.current.prompts.p1.enabled).toBe(false);
    expect(result.current.prompts.p2.enabled).toBe(true);

    await expect(
      act(async () => {
        await result.current.toggleEnabled("p1", true);
      }),
    ).rejects.toThrow("enable failed");

    // Rolled back to original state
    expect(result.current.prompts.p1.enabled).toBe(false);
    expect(result.current.prompts.p2.enabled).toBe(true);
    expect(toastErrorMock).toHaveBeenCalledWith("prompts.enableFailed");
  });

  it("toggleEnabled(false) optimistically disables target and calls upsertPrompt", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await act(async () => {
      await result.current.reload();
    });

    // Before toggle: p2 enabled
    expect(result.current.prompts.p2.enabled).toBe(true);

    await act(async () => {
      await result.current.toggleEnabled("p2", false);
    });

    expect(upsertPromptMock).toHaveBeenCalledWith("claude", "p2", {
      ...mockPrompts.p2,
      enabled: false,
    });
    expect(toastSuccessMock).toHaveBeenCalledWith("prompts.disableSuccess", {
      closeButton: true,
    });
  });

  it("toggleEnabled(false) rolls back on failure", async () => {
    upsertPromptMock.mockRejectedValue(new Error("disable failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await act(async () => {
      await result.current.reload();
    });

    // Original state: p2 enabled
    expect(result.current.prompts.p2.enabled).toBe(true);

    await expect(
      act(async () => {
        await result.current.toggleEnabled("p2", false);
      }),
    ).rejects.toThrow("disable failed");

    // Rolled back to original state
    expect(result.current.prompts.p2.enabled).toBe(true);
    expect(toastErrorMock).toHaveBeenCalledWith("prompts.disableFailed");
  });

  // ---- importFromFile ----

  it("importFromFile calls API, reloads, and returns id", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    let returnedId: string | undefined;
    await act(async () => {
      returnedId = await result.current.importFromFile();
    });

    expect(importFromFileMock).toHaveBeenCalledWith("claude");
    expect(returnedId).toBe("imported-id");
    expect(toastSuccessMock).toHaveBeenCalledWith("prompts.importSuccess", {
      closeButton: true,
    });
  });

  it("importFromFile shows error toast and throws on failure", async () => {
    importFromFileMock.mockRejectedValue(new Error("import failed"));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => usePromptActions("claude"), {
      wrapper,
    });

    await expect(
      act(async () => {
        await result.current.importFromFile();
      }),
    ).rejects.toThrow("import failed");

    expect(toastErrorMock).toHaveBeenCalledWith("prompts.importFailed");
  });
});
