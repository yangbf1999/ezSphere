import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { McpManagementPage } from "@/pages/McpManagementPage";

const headerRender = vi.fn();
const panelRender = vi.fn();

vi.mock("@/components/mcp/McpPageHeader", () => ({
  McpPageHeader: (props: any) => {
    headerRender(props);
    return (
      <div data-testid="mcp-header">
        <input
          data-testid="search-input"
          ref={props.searchInputRef}
          value={props.searchTerm}
          onChange={(e) => props.onSearchChange(e.target.value)}
        />
        <button data-testid="import-btn" onClick={props.onImport}>
          import
        </button>
        <button data-testid="add-btn" onClick={props.onAdd}>
          add
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/mcp/UnifiedMcpPanel", () => {
  const Mock = (props: any) => {
    panelRender(props);
    return <div data-testid="mcp-panel" />;
  };
  return { default: Mock, __esModule: true };
});

beforeEach(() => {
  headerRender.mockClear();
  panelRender.mockClear();
});

describe("McpManagementPage", () => {
  it("renders the page skeleton with header and panel", () => {
    render(<McpManagementPage />);

    expect(screen.getByTestId("mcp-header")).toBeInTheDocument();
    expect(screen.getByTestId("mcp-panel")).toBeInTheDocument();
  });

  it("forwards search term changes to UnifiedMcpPanel", () => {
    render(<McpManagementPage />);

    fireEvent.change(screen.getByTestId("search-input"), {
      target: { value: "filesystem" },
    });

    const lastPanelProps = panelRender.mock.calls.at(-1)![0];
    expect(lastPanelProps.searchTerm).toBe("filesystem");
  });

  it("passes layout='shell' to UnifiedMcpPanel", () => {
    render(<McpManagementPage />);

    expect(panelRender.mock.calls[0][0].layout).toBe("shell");
  });

  it("forwards onOpenChange callback when provided", () => {
    const onOpenChange = vi.fn();
    render(<McpManagementPage onOpenChange={onOpenChange} />);

    expect(panelRender.mock.calls[0][0].onOpenChange).toBe(onOpenChange);
  });

  it("uses a no-op onOpenChange when not provided", () => {
    render(<McpManagementPage />);

    const cb = panelRender.mock.calls[0][0].onOpenChange;
    expect(typeof cb).toBe("function");
    expect(() => cb(true)).not.toThrow();
  });
});
