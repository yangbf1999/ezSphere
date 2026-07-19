import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { emitTauriEvent } from "../msw/tauriMocks";

const mergeMock = vi.fn();
const importMock = vi.fn();

vi.mock("@/lib/api/deeplink", () => ({
  deeplinkApi: {
    mergeDeeplinkConfig: (...args: unknown[]) => mergeMock(...args),
    importFromDeeplink: (...args: unknown[]) => importMock(...args),
  },
}));

vi.mock("@/components/deeplink/PromptConfirmation", () => ({
  PromptConfirmation: ({ request }: any) => (
    <div data-testid="prompt-confirmation" data-name={request.name} />
  ),
}));

vi.mock("@/components/deeplink/McpConfirmation", () => ({
  McpConfirmation: ({ request }: any) => (
    <div data-testid="mcp-confirmation" />
  ),
}));

vi.mock("@/components/deeplink/SkillConfirmation", () => ({
  SkillConfirmation: ({ request }: any) => (
    <div data-testid="skill-confirmation" />
  ),
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: ({ icon, name, size }: any) => (
    <span data-testid="provider-icon" data-icon={icon} data-name={name} data-size={size} />
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) => {
      if (opts && typeof opts === "object") {
        if ("defaultValue" in opts) return opts.defaultValue;
        // interpolate simple {version} / {name} patterns
        let s = k;
        for (const [key, val] of Object.entries(opts)) {
          s = s.replace(`{{${key}}}`, String(val));
        }
        return s;
      }
      return k;
    },
  }),
}));

import { DeepLinkImportDialog } from "@/components/DeepLinkImportDialog";

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

const providerRequest = {
  version: "1",
  resource: "provider" as const,
  app: "claude" as const,
  name: "Test Provider",
  endpoint: "https://api.test.com/v1,https://backup.test.com/v1",
  apiKey: "sk-test-key-12345678",
  homepage: "https://test.com",
  icon: "claude",
  model: "claude-sonnet-4",
};

beforeEach(() => {
  mergeMock.mockReset();
  importMock.mockReset();
});

describe("DeepLinkImportDialog", () => {
  it("renders nothing initially (dialog closed)", () => {
    renderWithQueryClient(<DeepLinkImportDialog />);
    expect(screen.queryByText("deeplink.confirmImport")).not.toBeInTheDocument();
  });

  it("opens the dialog when a deeplink-import event fires with a provider request", async () => {
    renderWithQueryClient(<DeepLinkImportDialog />);

    emitTauriEvent("deeplink-import", providerRequest);

    await waitFor(() => {
      expect(screen.getByText("deeplink.confirmImport")).toBeInTheDocument();
    });

    // Provider name displayed
    expect(screen.getByText("Test Provider")).toBeInTheDocument();
    // App type displayed (capitalize)
    expect(screen.getByText("claude")).toBeInTheDocument();
    // Homepage displayed
    expect(screen.getByText("https://test.com")).toBeInTheDocument();
    // API key is masked
    expect(screen.getByText(/sk-t\*+/)).toBeInTheDocument();
    // Provider icon rendered
    expect(screen.getByTestId("provider-icon")).toHaveAttribute(
      "data-icon",
      "claude",
    );
  });

  it("shows multiple endpoints with primary marker", async () => {
    renderWithQueryClient(<DeepLinkImportDialog />);

    emitTauriEvent("deeplink-import", providerRequest);

    await waitFor(() => {
      expect(screen.getByText(/api\.test\.com/)).toBeInTheDocument();
    });
    // primary endpoint badge (wrapped in parentheses in a span)
    expect(screen.getByText(/deeplink\.primaryEndpoint/)).toBeInTheDocument();
    // backup endpoint
    expect(screen.getByText(/backup\.test\.com/)).toBeInTheDocument();
  });

  it("cancel button closes the dialog", async () => {
    renderWithQueryClient(<DeepLinkImportDialog />);

    emitTauriEvent("deeplink-import", providerRequest);

    await waitFor(() => {
      expect(screen.getByText("deeplink.import")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("common.cancel"));

    await waitFor(() => {
      expect(screen.queryByText("Test Provider")).not.toBeInTheDocument();
    });
  });

  it("import button calls deeplinkApi.importFromDeeplink and closes the dialog", async () => {
    importMock.mockResolvedValue({ type: "provider", id: "new-id" });

    renderWithQueryClient(<DeepLinkImportDialog />);

    emitTauriEvent("deeplink-import", providerRequest);

    await waitFor(() => {
      expect(screen.getByText("deeplink.import")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("deeplink.import"));

    await waitFor(() => expect(importMock).toHaveBeenCalledTimes(1));
    expect(importMock.mock.calls[0][0]).toMatchObject({
      name: "Test Provider",
      app: "claude",
    });

    // Dialog closes after successful import
    await waitFor(() => {
      expect(screen.queryByText("Test Provider")).not.toBeInTheDocument();
    });
  });

  it("shows importing state on the import button while import is in progress", async () => {
    let resolveImport: (v: any) => void;
    importMock.mockReturnValue(
      new Promise((resolve) => {
        resolveImport = resolve;
      }),
    );

    renderWithQueryClient(<DeepLinkImportDialog />);

    emitTauriEvent("deeplink-import", providerRequest);

    await waitFor(() => {
      expect(screen.getByText("deeplink.import")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("deeplink.import"));

    await waitFor(() => {
      expect(screen.getByText("deeplink.importing")).toBeInTheDocument();
    });
    // cancel button should be disabled during import
    expect(screen.getByText("common.cancel").closest("button")).toBeDisabled();

    // Resolve to clean up
    resolveImport!({ type: "provider", id: "x" });
    await waitFor(() => {
      expect(screen.queryByText("deeplink.importing")).not.toBeInTheDocument();
    });
  });

  it("renders prompt confirmation when resource is prompt", async () => {
    renderWithQueryClient(<DeepLinkImportDialog />);

    emitTauriEvent("deeplink-import", {
      version: "1",
      resource: "prompt",
      app: "claude",
      name: "My Prompt",
      content: btoa("# Hello"),
    });

    await waitFor(() => {
      expect(screen.getByTestId("prompt-confirmation")).toBeInTheDocument();
    });
    // title should be the prompt import title
    expect(screen.getByText("deeplink.importPrompt")).toBeInTheDocument();
  });

  it("renders mcp confirmation when resource is mcp", async () => {
    renderWithQueryClient(<DeepLinkImportDialog />);

    emitTauriEvent("deeplink-import", {
      version: "1",
      resource: "mcp",
      apps: "claude",
    });

    await waitFor(() => {
      expect(screen.getByTestId("mcp-confirmation")).toBeInTheDocument();
    });
    expect(screen.getByText("deeplink.importMcp")).toBeInTheDocument();
  });

  it("renders skill confirmation when resource is skill", async () => {
    renderWithQueryClient(<DeepLinkImportDialog />);

    emitTauriEvent("deeplink-import", {
      version: "1",
      resource: "skill",
      repo: "owner/repo",
      directory: "skills/my-skill",
    });

    await waitFor(() => {
      expect(screen.getByTestId("skill-confirmation")).toBeInTheDocument();
    });
    expect(screen.getByText("deeplink.importSkill")).toBeInTheDocument();
  });
});
