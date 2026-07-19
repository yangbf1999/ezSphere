import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

const getToolVersionsMock = vi.fn();

vi.mock("@/lib/api", () => ({
  settingsApi: {
    getToolVersions: (...args: unknown[]) => getToolVersionsMock(...args),
  },
}));

const INSTALL_PROMPTS: Record<string, string> = {
  "installRepair.prompts.installClaude": "使用国内源安装 Claude Code",
  "installRepair.prompts.installCodex": "使用国内源安装 Codex CLI",
  "installRepair.prompts.installHermes": "使用国内源，本地安装 Hermes",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) => {
      if (INSTALL_PROMPTS[k]) return INSTALL_PROMPTS[k];
      if (opts && typeof opts === "object" && "defaultValue" in opts)
        return opts.defaultValue;
      return k;
    },
  }),
}));

import { AppToolStatusPanel } from "@/components/providers/AppToolStatusPanel";

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

const INSTALLED_TOOL = {
  name: "claude",
  version: "1.0.0",
  latest_version: "1.0.0",
  error: null,
  installed_but_broken: false,
  env_type: "windows" as const,
  wsl_distro: null,
};

const OUTDATED_TOOL = {
  ...INSTALLED_TOOL,
  version: "1.0.0",
  latest_version: "2.0.0",
};

const MISSING_TOOL = {
  ...INSTALLED_TOOL,
  version: null,
  latest_version: "2.0.0",
};

const BROKEN_TOOL = {
  ...INSTALLED_TOOL,
  version: "1.0.0",
  installed_but_broken: true,
};

beforeEach(() => {
  getToolVersionsMock.mockReset();
});

describe("AppToolStatusPanel", () => {
  it("renders nothing when appId is not a CLI status app", () => {
    // gemini is not in CLI_STATUS_APP_IDS
    const { container } = renderWithQueryClient(
      <AppToolStatusPanel appId="gemini" onOpenInstall={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when visibleApps hides the active app", () => {
    const { container } = renderWithQueryClient(
      <AppToolStatusPanel
        appId="claude"
        visibleApps={{ claude: false, codex: true, hermes: true }}
        onOpenInstall={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the tool label and version when installed and up to date", async () => {
    getToolVersionsMock.mockResolvedValue([INSTALLED_TOOL]);

    renderWithQueryClient(
      <AppToolStatusPanel appId="claude" onOpenInstall={vi.fn()} />,
    );

    // Wait for the version to appear (only after loading completes)
    await waitFor(() => {
      expect(screen.getAllByText("1.0.0").length).toBeGreaterThan(0);
    });

    // tool label
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    // up-to-date badge
    expect(screen.getByText("已是最新")).toBeInTheDocument();
    // installed badge in actions
    expect(screen.getByText("已安装")).toBeInTheDocument();
  });

  it("shows install button when tool is not installed and fires onOpenInstall", async () => {
    getToolVersionsMock.mockResolvedValue([MISSING_TOOL]);
    const onOpenInstall = vi.fn();

    renderWithQueryClient(
      <AppToolStatusPanel appId="claude" onOpenInstall={onOpenInstall} />,
    );

    await waitFor(() => {
      expect(screen.getByText("AI 自动安装")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("AI 自动安装"));
    expect(onOpenInstall).toHaveBeenCalledWith({
      appId: "claude",
      action: "install",
      prompt: "使用国内源安装 Claude Code",
    });
  });

  it("shows update button when installed but outdated and fires onOpenInstall with update action", async () => {
    getToolVersionsMock.mockResolvedValue([OUTDATED_TOOL]);
    const onOpenInstall = vi.fn();

    renderWithQueryClient(
      <AppToolStatusPanel appId="claude" onOpenInstall={onOpenInstall} />,
    );

    await waitFor(() => {
      expect(screen.getByText("AI 自动更新")).toBeInTheDocument();
    });

    // update-available badge
    expect(screen.getByText("可更新")).toBeInTheDocument();

    fireEvent.click(screen.getByText("AI 自动更新"));
    expect(onOpenInstall).toHaveBeenCalledWith({
      appId: "claude",
      action: "update",
      prompt: "更新 Claude Code",
    });
  });

  it("treats broken tool as not installed (shows install button)", async () => {
    getToolVersionsMock.mockResolvedValue([BROKEN_TOOL]);

    renderWithQueryClient(
      <AppToolStatusPanel appId="codex" onOpenInstall={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText("AI 自动安装")).toBeInTheDocument();
    });
    expect(screen.getByText("未检测到本地安装")).toBeInTheDocument();
  });

  it("shows latest version in the latest column", async () => {
    getToolVersionsMock.mockResolvedValue([OUTDATED_TOOL]);

    renderWithQueryClient(
      <AppToolStatusPanel appId="claude" onOpenInstall={vi.fn()} />,
    );

    await waitFor(() => {
      expect(screen.getByText("2.0.0")).toBeInTheDocument();
    });
  });
});
