import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HermesMemoryPanel from "@/components/hermes/HermesMemoryPanel";

const toastSuccessMock = vi.fn();
const useHermesMemoryMock = vi.fn();
const useHermesMemoryLimitsMock = vi.fn();
const useOpenHermesWebUIMock = vi.fn();
const useSaveHermesMemoryMock = vi.fn();
const useToggleHermesMemoryEnabledMock = vi.fn();
const markdownEditorRender = vi.fn();

vi.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccessMock(...a) },
}));

vi.mock("@/hooks/useHermes", () => ({
  useHermesMemory: (...a: unknown[]) => useHermesMemoryMock(...a),
  useHermesMemoryLimits: (...a: unknown[]) => useHermesMemoryLimitsMock(...a),
  useOpenHermesWebUI: (...a: unknown[]) => useOpenHermesWebUIMock(...a),
  useSaveHermesMemory: (...a: unknown[]) => useSaveHermesMemoryMock(...a),
  useToggleHermesMemoryEnabled: (...a: unknown[]) =>
    useToggleHermesMemoryEnabledMock(...a),
}));

vi.mock("@/components/ui/tabs", () => {
  const React = require("react");
  const TabsContext = React.createContext<{ value: string; onValueChange: (v: string) => void } | null>(null);
  return {
    Tabs: ({ value, onValueChange, children, ...rest }: any) => (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div {...rest}>{children}</div>
      </TabsContext.Provider>
    ),
    TabsList: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
    TabsTrigger: ({ value, children, ...rest }: any) => {
      const ctx = React.useContext(TabsContext);
      return (
        <button
          {...rest}
          data-state={ctx?.value === value ? "active" : "inactive"}
          onClick={() => ctx?.onValueChange(value)}
        >
          {children}
        </button>
      );
    },
    TabsContent: ({ value, children, ...rest }: any) => {
      const ctx = React.useContext(TabsContext);
      if (ctx?.value !== value) return null;
      return <div {...rest}>{children}</div>;
    },
  };
});

vi.mock("@/hooks/useDarkMode", () => ({
  useDarkMode: () => false,
}));

vi.mock("@/components/MarkdownEditor", () => ({
  default: (props: any) => {
    markdownEditorRender(props);
    return (
      <textarea
        data-testid="markdown-editor"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    );
  },
}));

function setupMocks(opts: {
  memoryContent?: string;
  userContent?: string;
  memoryEnabled?: boolean;
  userEnabled?: boolean;
  memoryLimit?: number;
  userLimit?: number;
  isLoadingMemory?: boolean;
  isLoadingUser?: boolean;
} = {}) {
  const saveMutateAsync = vi.fn().mockResolvedValue(undefined);
  const toggleMutate = vi.fn();

  useHermesMemoryMock.mockImplementation((kind: string) => ({
    data: kind === "memory" ? opts.memoryContent : opts.userContent,
    isLoading: kind === "memory" ? opts.isLoadingMemory : opts.isLoadingUser,
  }));
  useHermesMemoryLimitsMock.mockReturnValue({
    data: {
      memory: opts.memoryLimit ?? 2200,
      user: opts.userLimit ?? 1375,
      memoryEnabled: opts.memoryEnabled ?? true,
      userEnabled: opts.userEnabled ?? true,
    },
  });
  useOpenHermesWebUIMock.mockReturnValue(vi.fn());
  useSaveHermesMemoryMock.mockReturnValue({
    mutateAsync: saveMutateAsync,
    isPending: false,
  });
  useToggleHermesMemoryEnabledMock.mockReturnValue({
    mutate: toggleMutate,
    isPending: false,
  });

  return { saveMutateAsync, toggleMutate };
}

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <HermesMemoryPanel />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  toastSuccessMock.mockReset();
  useHermesMemoryMock.mockReset();
  useHermesMemoryLimitsMock.mockReset();
  useOpenHermesWebUIMock.mockReset();
  useSaveHermesMemoryMock.mockReset();
  useToggleHermesMemoryEnabledMock.mockReset();
  markdownEditorRender.mockClear();
});

describe("HermesMemoryPanel", () => {
  it("renders both memory and user tabs", () => {
    setupMocks({ memoryContent: "hello", userContent: "world" });
    renderPanel();

    expect(screen.getByText("hermes.memory.agentTab")).toBeInTheDocument();
    expect(screen.getByText("hermes.memory.userTab")).toBeInTheDocument();
  });

  it("shows memory content in the editor on the memory tab", () => {
    setupMocks({ memoryContent: "memory content here" });
    renderPanel();

    const editor = screen.getByTestId("markdown-editor");
    expect(editor).toHaveValue("memory content here");
  });

  it("switches to user tab and loads user content", async () => {
    setupMocks({ memoryContent: "mem", userContent: "user content" });
    renderPanel();

    // Initially memory tab is active
    expect(useHermesMemoryMock).toHaveBeenCalledWith("memory", true);

    fireEvent.click(screen.getByText("hermes.memory.userTab"));

    // After switching, the user MemoryTabPane should mount and query user data
    await waitFor(() => {
      expect(useHermesMemoryMock).toHaveBeenCalledWith("user", true);
    });
  });

  it("displays char count and usage info", () => {
    setupMocks({ memoryContent: "12345", memoryLimit: 2200 });
    renderPanel();

    // The usage span renders the i18n key (no translations loaded)
    expect(screen.getByText(/hermes\.memory\.usage/)).toBeInTheDocument();
  });

  it("shows over-limit indicator when content exceeds the limit", () => {
    setupMocks({
      memoryContent: "x".repeat(100),
      memoryLimit: 50,
    });
    renderPanel();

    // The usage span should have red styling when over limit
    const usageText = screen.getByText(/hermes\.memory\.usage/);
    expect(usageText.className).toContain("text-red-600");
    expect(screen.getByText(/hermes\.memory\.overLimit/)).toBeInTheDocument();
  });

  it("calls saveMutation when save button is clicked", async () => {
    const { saveMutateAsync } = setupMocks({ memoryContent: "save me" });
    renderPanel();

    const saveButton = screen.getByText("common.save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveMutateAsync).toHaveBeenCalledWith({
        kind: "memory",
        content: "save me",
      });
    });
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "hermes.memory.saveSuccess",
      );
    });
  });

  it("calls toggleMutation when switch is toggled", () => {
    const { toggleMutate } = setupMocks({ memoryEnabled: true });
    renderPanel();

    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);

    expect(toggleMutate).toHaveBeenCalledWith({
      kind: "memory",
      enabled: false,
    });
  });

  it("shows disabled hint when memory is not enabled", () => {
    setupMocks({ memoryEnabled: false });
    renderPanel();

    expect(screen.getByText("hermes.memory.disabledHint")).toBeInTheDocument();
    expect(screen.getByText("hermes.memory.enableOff")).toBeInTheDocument();
  });

  it("renders open config button", () => {
    setupMocks({});
    const openWebUI = vi.fn();
    useOpenHermesWebUIMock.mockReturnValue(openWebUI);
    renderPanel();

    const configBtn = screen.getByText("hermes.memory.openConfig");
    fireEvent.click(configBtn);
    expect(openWebUI).toHaveBeenCalledWith("/config");
  });
});
