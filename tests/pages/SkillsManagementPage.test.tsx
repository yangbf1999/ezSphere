import { render, screen, fireEvent, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SkillsManagementPage } from "@/pages/SkillsManagementPage";

const headerRender = vi.fn();
const panelRender = vi.fn();
const appCountBarRender = vi.fn();

vi.mock("@/components/skills/SkillsPageHeader", () => ({
  SkillsPageHeader: (props: any) => {
    headerRender(props);
    return (
      <div data-testid="skills-header">
        <input
          data-testid="search-input"
          ref={props.searchInputRef}
          value={props.searchTerm}
          onChange={(e) => props.onSearchChange(e.target.value)}
        />
        <button data-testid="discover-btn" onClick={props.onDiscover}>
          discover
        </button>
        <button data-testid="restore-btn" onClick={props.onRestore}>
          restore
        </button>
        <button data-testid="zip-btn" onClick={props.onZipInstall}>
          zip
        </button>
        <button data-testid="import-btn" onClick={props.onImport}>
          import
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/skills/UnifiedSkillsPanel", () => {
  const Mock = (props: any) => {
    panelRender(props);
    return <div data-testid="skills-panel" />;
  };
  return { default: Mock, __esModule: true };
});

vi.mock("@/components/common/AppCountBar", () => ({
  AppCountBar: (props: any) => {
    appCountBarRender(props);
    return <div data-testid="app-count-bar" />;
  },
}));

vi.mock("@/hooks/useSkills", () => ({
  useScanUnmanagedSkills: () => ({
    data: [],
  }),
}));

function renderPage(overrides: any = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SkillsManagementPage
        onOpenDiscovery={vi.fn()}
        currentApp="claude"
        {...overrides}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  headerRender.mockClear();
  panelRender.mockClear();
  appCountBarRender.mockClear();
});

describe("SkillsManagementPage", () => {
  it("renders the page skeleton with header, count bar and panel", () => {
    renderPage();

    expect(screen.getByTestId("skills-header")).toBeInTheDocument();
    expect(screen.getByTestId("app-count-bar")).toBeInTheDocument();
    expect(screen.getByTestId("skills-panel")).toBeInTheDocument();
  });

  it("forwards onOpenDiscovery to SkillsPageHeader onDiscover", () => {
    const onOpenDiscovery = vi.fn();
    renderPage({ onOpenDiscovery });

    fireEvent.click(screen.getByTestId("discover-btn"));
    expect(onOpenDiscovery).toHaveBeenCalled();
  });

  it("forwards onOpenDiscovery to UnifiedSkillsPanel as onOpenDiscovery prop", () => {
    const onOpenDiscovery = vi.fn();
    renderPage({ onOpenDiscovery });

    expect(panelRender.mock.calls[0][0].onOpenDiscovery).toBe(onOpenDiscovery);
  });

  it("forwards currentApp to UnifiedSkillsPanel", () => {
    renderPage({ currentApp: "codex" });

    expect(panelRender.mock.calls[0][0].currentApp).toBe("codex");
  });

  it("forwards search term changes to UnifiedSkillsPanel", () => {
    renderPage();

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "test query" },
    });

    const lastPanelProps = panelRender.mock.calls.at(-1)![0];
    expect(lastPanelProps.searchTerm).toBe("test query");
  });

  it("passes onCountsChange callback and forwards counts to AppCountBar", () => {
    renderPage();

    const panelProps = panelRender.mock.calls[0][0];
    expect(typeof panelProps.onCountsChange).toBe("function");

    act(() => {
      panelProps.onCountsChange(3, { claude: 3 });
    });

    const lastBarProps = appCountBarRender.mock.calls.at(-1)![0];
    expect(lastBarProps.counts).toEqual({ claude: 3 });
  });
});
