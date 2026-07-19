import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: ({
    icon,
    name,
    size,
  }: {
    icon?: string;
    name: string;
    size?: number;
  }) => (
    <span data-testid="provider-icon" data-icon={icon} data-name={name} data-size={size} />
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { AppSwitcher } from "@/components/AppSwitcher";

beforeEach(() => {
  localStorage.clear();
});

describe("AppSwitcher - segmented variant", () => {
  it("renders a tab per app with aria-selected reflecting active state", () => {
    render(<AppSwitcher activeApp="codex" onSwitch={vi.fn()} variant="segmented" />);

    const tablist = screen.getByRole("tablist", { name: "应用切换" });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3); // claude, codex, hermes

    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.getByText("Codex")).toBeInTheDocument();
    expect(screen.getByText("Hermes")).toBeInTheDocument();

    expect(screen.getByText("Codex").closest("button")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Claude Code").closest("button")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("calls onSwitch and persists selection to localStorage on click", () => {
    const onSwitch = vi.fn();
    render(<AppSwitcher activeApp="claude" onSwitch={onSwitch} variant="segmented" />);

    fireEvent.click(screen.getByText("Codex"));
    expect(onSwitch).toHaveBeenCalledWith("codex");
    expect(localStorage.getItem("ezsphere-last-app")).toBe("codex");
  });

  it("does not call onSwitch when clicking the already-active app", () => {
    const onSwitch = vi.fn();
    render(<AppSwitcher activeApp="claude" onSwitch={onSwitch} variant="segmented" />);

    fireEvent.click(screen.getByText("Claude Code"));
    expect(onSwitch).not.toHaveBeenCalled();
  });

  it("skips localStorage when persistSelection is false", () => {
    const onSwitch = vi.fn();
    render(
      <AppSwitcher
        activeApp="claude"
        onSwitch={onSwitch}
        variant="segmented"
        persistSelection={false}
      />,
    );

    fireEvent.click(screen.getByText("Codex"));
    expect(onSwitch).toHaveBeenCalledWith("codex");
    expect(localStorage.getItem("ezsphere-last-app")).toBeNull();
  });
});

describe("AppSwitcher - filtering", () => {
  it("filters apps via visibleApps", () => {
    render(
      <AppSwitcher
        activeApp="claude"
        onSwitch={vi.fn()}
        visibleApps={{ claude: true, codex: false, hermes: true }}
      />,
    );

    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.queryByText("Codex")).not.toBeInTheDocument();
    expect(screen.getByText("Hermes")).toBeInTheDocument();
  });

  it("filters apps via appFilter callback", () => {
    render(
      <AppSwitcher
        activeApp="claude"
        onSwitch={vi.fn()}
        appFilter={(app) => app !== "hermes"}
      />,
    );

    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.getByText("Codex")).toBeInTheDocument();
    expect(screen.queryByText("Hermes")).not.toBeInTheDocument();
  });
});

describe("AppSwitcher - tabs variant", () => {
  it("renders icons and activeCount badge for the active tab", () => {
    render(
      <AppSwitcher
        activeApp="claude"
        onSwitch={vi.fn()}
        variant="tabs"
        activeCount={5}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "模型应用切换" });
    expect(tablist).toBeInTheDocument();

    // activeCount only shows on active tab
    expect(screen.getByText("5")).toBeInTheDocument();

    // icons rendered
    const icons = screen.getAllByTestId("provider-icon");
    expect(icons).toHaveLength(3);
  });

  it("does not show activeCount when not provided", () => {
    render(
      <AppSwitcher activeApp="claude" onSwitch={vi.fn()} variant="tabs" />,
    );
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });
});

describe("AppSwitcher - prompt-tabs variant", () => {
  it("filters out hermes app", () => {
    render(
      <AppSwitcher
        activeApp="claude"
        onSwitch={vi.fn()}
        variant="prompt-tabs"
      />,
    );

    const tablist = screen.getByRole("tablist", { name: "提示词应用切换" });
    expect(tablist).toBeInTheDocument();

    expect(screen.getByText("Claude Code")).toBeInTheDocument();
    expect(screen.getByText("Codex")).toBeInTheDocument();
    // hermes is filtered out in prompt-tabs
    expect(screen.queryByText("Hermes")).not.toBeInTheDocument();
  });
});

describe("AppSwitcher - pill (default) variant", () => {
  it("renders buttons with icons and labels, marks active with bg-background", () => {
    render(<AppSwitcher activeApp="codex" onSwitch={vi.fn()} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);

    const codexBtn = screen.getByText("Codex").closest("button")!;
    expect(codexBtn).toHaveClass("bg-background");

    const claudeBtn = screen.getByText("Claude Code").closest("button")!;
    expect(claudeBtn).not.toHaveClass("bg-background");
  });

  it("compact mode hides labels (max-w-0 opacity-0)", () => {
    render(<AppSwitcher activeApp="claude" onSwitch={vi.fn()} compact />);

    const labelSpan = screen.getByText("Claude Code");
    expect(labelSpan).toHaveClass("max-w-0", "opacity-0");
  });
});
