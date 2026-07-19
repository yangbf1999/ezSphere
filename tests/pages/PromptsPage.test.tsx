import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PromptsPage,
  PROMPT_APP_IDS,
  isPromptApp,
} from "@/pages/PromptsPage";
import type { AppId } from "@/lib/api";

const pageHeaderRender = vi.fn();
const promptPanelRender = vi.fn();
const appSwitcherRender = vi.fn();

vi.mock("@/components/prompts/PromptsPageHeader", () => ({
  PromptsPageHeader: (props: any) => {
    pageHeaderRender(props);
    return (
      <div data-testid="prompts-header">
        <input
          data-testid="search-input"
          ref={props.searchInputRef}
          value={props.searchTerm}
          onChange={(e) => props.onSearchChange(e.target.value)}
        />
        <button data-testid="add-btn" onClick={props.onAdd}>
          add
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/prompts/PromptPanel", () => ({
  default: (() => {
    const Mock = (props: any) => {
      promptPanelRender(props);
      return <div data-testid="prompt-panel" />;
    };
    return Mock;
  })(),
}));

vi.mock("@/components/AppSwitcher", () => ({
  AppSwitcher: (props: any) => {
    appSwitcherRender(props);
    return (
      <div data-testid="app-switcher">
        <span data-testid="active-app">{props.activeApp}</span>
        <button
          data-testid="switch-claude"
          onClick={() => props.onSwitch("claude")}
        >
          claude
        </button>
      </div>
    );
  },
}));

beforeEach(() => {
  pageHeaderRender.mockClear();
  promptPanelRender.mockClear();
  appSwitcherRender.mockClear();
});

describe("PROMPT_APP_IDS and isPromptApp", () => {
  it("exports the expected list of prompt-capable app ids", () => {
    expect(PROMPT_APP_IDS).toEqual([
      "claude",
      "codex",
      "gemini",
      "opencode",
      "openclaw",
      "hermes",
    ]);
  });

  it("isPromptApp returns true for prompt apps and false otherwise", () => {
    expect(isPromptApp("claude")).toBe(true);
    expect(isPromptApp("codex")).toBe(true);
    expect(isPromptApp("hermes")).toBe(true);
    expect(isPromptApp("claude-desktop" as AppId)).toBe(false);
    expect(isPromptApp("unknown" as AppId)).toBe(false);
  });
});

describe("PromptsPage component", () => {
  it("maps claude-desktop appId to claude for PromptPanel and uses claude tab for AppSwitcher", () => {
    render(
      <PromptsPage
        appId="claude-desktop"
        onSwitchApp={vi.fn()}
        visibleApps={{ claude: true }}
      />,
    );

    // tabAppId: claude-desktop is not a prompt app -> falls back to "claude"
    expect(appSwitcherRender).toHaveBeenCalled();
    const switcherProps = appSwitcherRender.mock.calls[0][0];
    expect(switcherProps.activeApp).toBe("claude");

    // promptAppId: claude-desktop -> claude
    const panelProps = promptPanelRender.mock.calls[0][0];
    expect(panelProps.appId).toBe("claude");
    expect(panelProps.open).toBe(true);
    expect(panelProps.layout).toBe("shell");
  });

  it("passes through appId directly when it is a prompt app", () => {
    render(
      <PromptsPage
        appId="codex"
        onSwitchApp={vi.fn()}
        visibleApps={{ codex: true }}
      />,
    );

    expect(appSwitcherRender.mock.calls[0][0].activeApp).toBe("codex");
    expect(promptPanelRender.mock.calls[0][0].appId).toBe("codex");
  });

  it("calls onSwitchApp with first visible prompt app when appId is not a prompt app", () => {
    const onSwitchApp = vi.fn();
    render(
      <PromptsPage
        appId="claude-desktop"
        onSwitchApp={onSwitchApp}
        visibleApps={{
          claude: false,
          codex: true,
          gemini: true,
        }}
      />,
    );

    // claude is disabled, so it should pick codex (first visible)
    expect(onSwitchApp).toHaveBeenCalledWith("codex");
  });

  it("does not call onSwitchApp when appId is already a prompt app", () => {
    const onSwitchApp = vi.fn();
    render(
      <PromptsPage appId="gemini" onSwitchApp={onSwitchApp} visibleApps={{}} />,
    );

    expect(onSwitchApp).not.toHaveBeenCalled();
  });

  it("forwards search term changes and add button clicks", () => {
    render(
      <PromptsPage
        appId="claude"
        onSwitchApp={vi.fn()}
        visibleApps={{ claude: true }}
      />,
    );

    const input = screen.getByTestId("search-input");
    fireEvent.change(input, { target: { value: "hello" } });

    // The new searchTerm should be forwarded to PromptPanel
    const lastPanelProps = promptPanelRender.mock.calls.at(-1)![0];
    expect(lastPanelProps.searchTerm).toBe("hello");

    // Add button should increment addRequestKey
    const beforeClick = promptPanelRender.mock.calls[0][0].addRequestKey;
    fireEvent.click(screen.getByTestId("add-btn"));
    const afterClick = promptPanelRender.mock.calls.at(-1)![0].addRequestKey;
    expect(afterClick).toBe(beforeClick + 1);
  });

  it("forwards prompt count change callback", () => {
    render(
      <PromptsPage
        appId="claude"
        onSwitchApp={vi.fn()}
        visibleApps={{ claude: true }}
      />,
    );

    const panelProps = promptPanelRender.mock.calls[0][0];
    expect(typeof panelProps.onPromptCountChange).toBe("function");

    // Simulate the panel reporting a count
    act(() => {
      panelProps.onPromptCountChange(5);
    });
    // The count should be forwarded to AppSwitcher as activeCount
    const lastSwitcherProps = appSwitcherRender.mock.calls.at(-1)![0];
    expect(lastSwitcherProps.activeCount).toBe(5);
  });
});
