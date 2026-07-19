import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppCountBar } from "@/components/common/AppCountBar";
import { AppToggleGroup } from "@/components/common/AppToggleGroup";
import { ListItemRow } from "@/components/common/ListItemRow";
import { PageSearchField } from "@/components/common/PageSearchField";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FullScreenPanel } from "@/components/common/FullScreenPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// Tooltip wraps Radix portals; render children directly to keep tests simple.
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <>{children}</>,
}));

describe("AppCountBar", () => {
  it("renders the total label and a stat per app with counts (defaulting missing to 0)", () => {
    render(
      <AppCountBar
        totalLabel="Total providers"
        counts={{ claude: 3, codex: 0 }}
      />,
    );

    expect(screen.getByLabelText("Total providers")).toBeInTheDocument();
    expect(screen.getByText("Total providers")).toBeInTheDocument();

    // APP_IDS default = claude, codex, hermes
    const claudeStat = screen.getByText("Claude").closest("[data-app]");
    expect(claudeStat).toHaveAttribute("data-app", "claude");
    expect(claudeStat).toHaveTextContent("3");

    const codexStat = screen.getByText("Codex").closest("[data-app]");
    expect(codexStat).toHaveAttribute("data-app", "codex");
    expect(codexStat).toHaveTextContent("0");

    // hermes not provided -> defaults to 0
    const hermesStat = screen.getByText("Hermes").closest("[data-app]");
    expect(hermesStat).toHaveAttribute("data-app", "hermes");
    expect(hermesStat).toHaveTextContent("0");
  });

  it("honors a custom appIds list", () => {
    render(
      <AppCountBar
        totalLabel="Skills"
        counts={{ claude: 5 }}
        appIds={["claude"]}
      />,
    );

    // Only Claude should appear (single stat element)
    expect(screen.getByText("Claude")).toBeInTheDocument();
    expect(screen.queryByText("Codex")).not.toBeInTheDocument();
    expect(screen.queryByText("Hermes")).not.toBeInTheDocument();
  });
});

describe("AppToggleGroup", () => {
  it("chip variant renders a toggle button per app and fires onToggle with flipped state", () => {
    const onToggle = vi.fn();
    render(
      <AppToggleGroup
        variant="chip"
        apps={{ claude: true, codex: false, hermes: false }}
        onToggle={onToggle}
      />,
    );

    const claudeBtn = screen.getByText("Claude Code");
    // enabled -> aria-pressed true
    expect(claudeBtn).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(claudeBtn);
    expect(onToggle).toHaveBeenCalledWith("claude", false);

    const codexBtn = screen.getByText("Codex");
    expect(codexBtn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(codexBtn);
    expect(onToggle).toHaveBeenCalledWith("codex", true);
  });

  it("icon variant renders icon buttons with aria-pressed reflecting enabled state", () => {
    const onToggle = vi.fn();
    render(
      <AppToggleGroup
        variant="icon"
        apps={{ claude: true, codex: false, hermes: true }}
        onToggle={onToggle}
        appIds={["claude", "codex"]}
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(buttons[1]);
    expect(onToggle).toHaveBeenCalledWith("codex", true);
  });
});

describe("ListItemRow", () => {
  it("renders children", () => {
    render(
      <ListItemRow>
        <span>row content</span>
      </ListItemRow>,
    );
    expect(screen.getByText("row content")).toBeInTheDocument();
  });
});

describe("PageSearchField", () => {
  it("forwards value and fires onChange with the input value", () => {
    const onChange = vi.fn();
    render(
      <PageSearchField
        value="abc"
        onChange={onChange}
        placeholder="Search..."
      />,
    );

    const input = screen.getByPlaceholderText("Search...");
    expect(input).toHaveValue("abc");

    fireEvent.change(input, { target: { value: "new term" } });
    expect(onChange).toHaveBeenCalledWith("new term");
  });

  it("uses placeholder as aria-label when no explicit aria-label given", () => {
    render(
      <PageSearchField value="" onChange={vi.fn()} placeholder="Find prompts" />,
    );
    expect(screen.getByLabelText("Find prompts")).toBeInTheDocument();
  });
});

describe("StatusBadge", () => {
  it("applies the variant class and renders children", () => {
    const { container } = render(
      <StatusBadge variant="success">Active</StatusBadge>,
    );
    const badge = container.querySelector(".ez-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("ez-badge--success");
    expect(badge).toHaveTextContent("Active");
  });

  it("merges a custom className", () => {
    const { container } = render(
      <StatusBadge variant="error" className="extra">
        Failed
      </StatusBadge>,
    );
    const badge = container.querySelector(".ez-badge");
    expect(badge).toHaveClass("ez-badge--error", "extra");
  });
});

describe("FullScreenPanel", () => {
  it("renders nothing when closed", () => {
    render(
      <FullScreenPanel isOpen={false} title="Hidden" onClose={vi.fn()}>
        <p>secret</p>
      </FullScreenPanel>,
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders title, children and footer when open; back button calls onClose", () => {
    const onClose = vi.fn();
    render(
      <FullScreenPanel
        isOpen
        title="My Panel"
        onClose={onClose}
        footer={<button data-testid="ft">Save</button>}
      >
        <p data-testid="body">content</p>
      </FullScreenPanel>,
    );

    expect(screen.getByText("My Panel")).toBeInTheDocument();
    expect(screen.getByTestId("body")).toBeInTheDocument();
    expect(screen.getByTestId("ft")).toBeInTheDocument();

    // Back button aria-label comes from t("common.back") -> "common.back"
    fireEvent.click(screen.getByLabelText("common.back"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
