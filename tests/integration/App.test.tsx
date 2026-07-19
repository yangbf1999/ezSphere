import { Suspense, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { providersApi } from "@/lib/api/providers";
import {
  resetProviderState,
  setCurrentProviderId,
  setLiveProviderIds,
  setProviders,
} from "../msw/state";
import { emitTauriEvent } from "../msw/tauriMocks";
import { ThemeProvider } from "@/components/theme-provider";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    isMaximized: vi.fn().mockResolvedValue(false),
    onResized: vi.fn().mockResolvedValue(vi.fn()),
    setDecorations: vi.fn().mockResolvedValue(undefined),
    minimize: vi.fn().mockResolvedValue(undefined),
    maximize: vi.fn().mockResolvedValue(undefined),
    unmaximize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/components/providers/ProviderList", () => ({
  ProviderList: ({
    providers,
    currentProviderId,
    onSwitch,
    onEdit,
    onDuplicate,
    onConfigureUsage,
    onOpenWebsite,
    onCreate,
    onDelete,
    onRemoveFromConfig,
    onDisableOmo,
    onDisableOmoSlim,
    onOpenTerminal,
    onSetAsDefault,
  }: any) => (
    <div>
      <div data-testid="provider-list">{JSON.stringify(providers)}</div>
      <div data-testid="current-provider">{currentProviderId}</div>
      <button onClick={() => onSwitch(providers[currentProviderId])}>
        switch
      </button>
      <button onClick={() => onEdit(providers[currentProviderId])}>edit</button>
      <button onClick={() => onDuplicate(providers[currentProviderId])}>
        duplicate
      </button>
      <button onClick={() => onConfigureUsage(providers[currentProviderId])}>
        usage
      </button>
      <button onClick={() => onOpenWebsite("https://example.com")}>
        open-website
      </button>
      <button onClick={() => onCreate?.()}>create</button>
      <button onClick={() => onDelete?.(providers[currentProviderId] ?? Object.values(providers)[0])}>delete</button>
      <button onClick={() => onRemoveFromConfig?.(providers[currentProviderId] ?? Object.values(providers)[0])}>remove-config</button>
      <button onClick={() => onDisableOmo?.()}>disable-omo</button>
      <button onClick={() => onDisableOmoSlim?.()}>disable-omo-slim</button>
      <button onClick={() => onOpenTerminal?.(providers[currentProviderId] ?? Object.values(providers)[0])}>open-terminal</button>
      <button onClick={() => onSetAsDefault?.(providers[currentProviderId] ?? Object.values(providers)[0])}>set-default</button>
    </div>
  ),
}));

vi.mock("@/components/providers/AddProviderDialog", () => ({
  AddProviderDialog: ({ open, onOpenChange, onSubmit, appId }: any) =>
    open ? (
      <div data-testid="add-provider-dialog">
        <button
          onClick={() =>
            onSubmit({
              name: `New ${appId} Provider`,
              settingsConfig: {},
              category: "custom",
              sortIndex: 99,
            })
          }
        >
          confirm-add
        </button>
        <button onClick={() => onOpenChange(false)}>close-add</button>
      </div>
    ) : null,
}));

vi.mock("@/components/providers/EditProviderDialog", () => ({
  EditProviderDialog: ({ open, provider, onSubmit, onOpenChange }: any) =>
    open ? (
      <div data-testid="edit-provider-dialog">
        <button
          onClick={() =>
            onSubmit({
              provider: {
                ...provider,
                name: `${provider.name}-edited`,
              },
              originalId: provider.id,
            })
          }
        >
          confirm-edit
        </button>
        <button onClick={() => onOpenChange(false)}>close-edit</button>
      </div>
    ) : null,
}));

vi.mock("@/components/UsageScriptModal", () => ({
  default: ({ isOpen, provider, onSave, onClose }: any) =>
    isOpen ? (
      <div data-testid="usage-modal">
        <span data-testid="usage-provider">{provider?.id}</span>
        <button onClick={() => onSave("script-code")}>save-script</button>
        <button onClick={() => onClose()}>close-usage</button>
      </div>
    ) : null,
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <button onClick={() => onConfirm()}>confirm-delete</button>
        <button onClick={() => onCancel()}>cancel-delete</button>
      </div>
    ) : null,
}));

vi.mock("@/components/AppSwitcher", () => ({
  AppSwitcher: ({ activeApp, onSwitch }: any) => (
    <div data-testid="app-switcher">
      <span>{activeApp}</span>
      <button onClick={() => onSwitch("claude")}>switch-claude</button>
      <button onClick={() => onSwitch("codex")}>switch-codex</button>
      <button onClick={() => onSwitch("openclaw")}>switch-openclaw</button>
      <button onClick={() => onSwitch("opencode")}>switch-opencode</button>
    </div>
  ),
}));

vi.mock("@/components/UpdateBadge", () => ({
  UpdateBadge: ({ onClick }: any) => (
    <button onClick={onClick}>update-badge</button>
  ),
}));

vi.mock("@/components/mcp/McpPanel", () => ({
  default: ({ open, onOpenChange }: any) =>
    open ? (
      <div data-testid="mcp-panel">
        <button onClick={() => onOpenChange(false)}>close-mcp</button>
      </div>
    ) : (
      <button onClick={() => onOpenChange(true)}>open-mcp</button>
    ),
}));

vi.mock("@/pages/ModelsPage", () => ({
  ModelsPage: ({ onAddVendorPreset, onAddCustomProvider, onEditProvider, onDeleteProvider }: any) => (
    <div data-testid="models-page">
      <button onClick={() => onAddVendorPreset("preset-1", "claude")}>models-add-preset</button>
      <button onClick={() => onAddCustomProvider("codex")}>models-add-custom</button>
      <button onClick={() => onEditProvider({ id: "claude-1", name: "Claude" }, "claude")}>models-edit</button>
      <button onClick={() => onDeleteProvider({ id: "claude-1", name: "Claude" }, "claude")}>models-delete</button>
    </div>
  ),
}));

vi.mock("@/components/settings/SettingsPage", () => ({
  SettingsPage: ({ onOpenChange, onImportSuccess }: any) => (
    <div data-testid="settings-page">
      <button onClick={() => onImportSuccess()}>settings-import</button>
      <button onClick={() => onOpenChange(false)}>settings-close</button>
    </div>
  ),
}));

vi.mock("@/pages/SkillsManagementPage", () => ({
  SkillsManagementPage: ({ onOpenDiscovery }: any) => (
    <button onClick={onOpenDiscovery}>skills-discovery</button>
  ),
}));

vi.mock("@/components/skills/SkillsDiscoveryDialog", () => ({
  SkillsDiscoveryDialog: ({ open, onOpenChange }: any) => open ? (
    <button onClick={() => onOpenChange(false)}>skills-discovery-close</button>
  ) : null,
}));

vi.mock("@/pages/McpManagementPage", () => ({
  McpManagementPage: ({ onOpenChange }: any) => (
    <button onClick={() => onOpenChange(false)}>mcp-page-close</button>
  ),
}));

vi.mock("@/pages/PromptsPage", () => ({
  PromptsPage: ({ onSwitchApp }: any) => (
    <button onClick={() => onSwitchApp("gemini")}>prompts-switch-app</button>
  ),
}));

vi.mock("@/pages/OverviewPage", () => ({ OverviewPage: () => <div>overview-page</div> }));
vi.mock("@/pages/InstallPage", () => ({ InstallPage: () => <div>install-page</div> }));

const renderApp = (AppComponent: ComponentType) => {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <Suspense fallback={<div data-testid="loading">loading</div>}>
          <AppComponent />
        </Suspense>
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("App integration with MSW", () => {
  beforeEach(() => {
    resetProviderState();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("covers basic provider flows via real hooks", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-codex"));
    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "codex-1",
      ),
    );

    fireEvent.click(screen.getByText("usage"));
    expect(screen.getByTestId("usage-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("save-script"));
    fireEvent.click(screen.getByText("close-usage"));

    fireEvent.click(screen.getByText("create"));
    expect(screen.getByTestId("add-provider-dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("confirm-add"));
    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toMatch(
        /New codex Provider/,
      ),
    );

    fireEvent.click(screen.getByText("edit"));
    expect(screen.getByTestId("edit-provider-dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("confirm-edit"));
    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toMatch(
        /-edited/,
      ),
    );

    fireEvent.click(screen.getByText("switch"));
    fireEvent.click(screen.getByText("duplicate"));
    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toMatch(/copy/),
    );

    fireEvent.click(screen.getByText("open-website"));

    fireEvent.click(screen.getByText("delete"));
    fireEvent.click(screen.getByText("cancel-delete"));
    fireEvent.click(screen.getByText("delete"));
    fireEvent.click(screen.getByText("confirm-delete"));

    fireEvent.click(screen.getByText("switch-claude"));
    await waitFor(() => expect(screen.getByTestId("provider-list").textContent).toContain("claude-1"));
    fireEvent.click(screen.getByText("open-terminal"));

    fireEvent.click(screen.getByText("switch-opencode"));
    await waitFor(() =>
      expect(screen.getByTestId("app-switcher")).toHaveTextContent("opencode"),
    );
    fireEvent.click(screen.getByText("disable-omo"));
    fireEvent.click(screen.getByText("disable-omo-slim"));

    fireEvent.click(screen.getByText("switch-codex"));

    emitTauriEvent("provider-switched", {
      appType: "codex",
      providerId: "codex-2",
    });

    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalled();
  }, 30_000);

  it("navigates every sidebar view and invokes page callbacks", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);
    await waitFor(() => expect(screen.getByTestId("provider-list")).toBeInTheDocument());

    fireEvent.click(screen.getByText("nav.overview"));
    await waitFor(() => expect(screen.getByText("overview-page")).toBeInTheDocument());
    fireEvent.click(screen.getByText("nav.models"));
    await waitFor(() => expect(screen.getByTestId("models-page")).toBeInTheDocument());
    fireEvent.click(screen.getByText("models-add-preset"));
    fireEvent.click(screen.getByText("close-add"));
    fireEvent.click(screen.getByText("models-add-custom"));
    fireEvent.click(screen.getByText("close-add"));
    fireEvent.click(screen.getByText("models-edit"));
    fireEvent.click(screen.getByText("close-edit"));
    fireEvent.click(screen.getByText("models-delete"));
    fireEvent.click(screen.getByText("cancel-delete"));

    fireEvent.click(screen.getByText("nav.prompts"));
    await waitFor(() => expect(screen.getByText("prompts-switch-app")).toBeInTheDocument());
    fireEvent.click(screen.getByText("prompts-switch-app"));
    fireEvent.click(screen.getByText("nav.skills"));
    await waitFor(() => expect(screen.getByText("skills-discovery")).toBeInTheDocument());
    fireEvent.click(screen.getByText("skills-discovery"));
    fireEvent.click(screen.getByText("skills-discovery-close"));
    fireEvent.click(screen.getByText("nav.mcp"));
    await waitFor(() => expect(screen.getByText("mcp-page-close")).toBeInTheDocument());
    fireEvent.click(screen.getByText("mcp-page-close"));
    fireEvent.click(screen.getByText("nav.install"));
    await waitFor(() => expect(screen.getByText("install-page")).toBeInTheDocument());
    fireEvent.click(screen.getByText("nav.settings"));
    await waitFor(() => expect(screen.getByTestId("settings-page")).toBeInTheDocument());
    fireEvent.click(screen.getByText("settings-import"));
    await waitFor(() => expect(screen.getByTestId("settings-page")).toBeInTheDocument());
    fireEvent.click(screen.getByText("settings-close"));
    await waitFor(() => expect(screen.getByTestId("provider-list")).toBeInTheDocument());
  });

  it("shows toast when auto sync fails in background", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    expect(() => {
      emitTauriEvent("webdav-sync-status-updated", null);
    }).not.toThrow();
    expect(toastErrorMock).not.toHaveBeenCalled();

    emitTauriEvent("webdav-sync-status-updated", {
      source: "auto",
      status: "error",
      error: "network timeout",
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });

    toastErrorMock.mockReset();
    expect(() => {
      emitTauriEvent("s3-sync-status-updated", null);
    }).not.toThrow();
    expect(toastErrorMock).not.toHaveBeenCalled();

    emitTauriEvent("s3-sync-status-updated", {
      source: "auto",
      status: "error",
      error: "s3 timeout",
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });
  }, 30_000);

  it("duplicates openclaw providers with a generated key that avoids live-only ids", async () => {
    setProviders("openclaw", {
      deepseek: {
        id: "deepseek",
        name: "DeepSeek",
        settingsConfig: {
          baseUrl: "https://api.deepseek.com",
          apiKey: "test-key",
          api: "openai-completions",
          models: [],
        },
        category: "custom",
        sortIndex: 0,
        createdAt: Date.now(),
      },
    });
    setCurrentProviderId("openclaw", "deepseek");
    setLiveProviderIds("openclaw", ["deepseek-copy"]);

    const { default: App } = await import("@/App");
    renderApp(App);

    fireEvent.click(screen.getByText("switch-openclaw"));

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "deepseek",
      ),
    );

    fireEvent.click(screen.getByText("duplicate"));

    await waitFor(() => {
      const providerList = screen.getByTestId("provider-list").textContent;
      expect(providerList).toContain("deepseek-copy-2");
      expect(providerList).toContain("DeepSeek copy");
    });

    expect(toastErrorMock).not.toHaveBeenCalledWith(
      expect.stringContaining("Provider key is required for openclaw"),
    );
  });

  it("shows toast when duplicate cannot load live provider ids", async () => {
    setProviders("openclaw", {
      deepseek: {
        id: "deepseek",
        name: "DeepSeek",
        settingsConfig: {
          baseUrl: "https://api.deepseek.com",
          apiKey: "test-key",
          api: "openai-completions",
          models: [],
        },
        category: "custom",
        sortIndex: 0,
        createdAt: Date.now(),
      },
    });
    setCurrentProviderId("openclaw", "deepseek");

    const liveIdsSpy = vi
      .spyOn(providersApi, "getOpenClawLiveProviderIds")
      .mockRejectedValueOnce(new Error("broken config"));

    const { default: App } = await import("@/App");
    renderApp(App);

    fireEvent.click(screen.getByText("switch-openclaw"));

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "deepseek",
      ),
    );

    fireEvent.click(screen.getByText("duplicate"));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        expect.stringContaining("读取配置中的模型标识失败"),
      );
    });

    expect(screen.getByTestId("provider-list").textContent).not.toContain(
      "deepseek-copy",
    );

    liveIdsSpy.mockRestore();
  });
});
