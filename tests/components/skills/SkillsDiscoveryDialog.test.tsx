import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SkillsDiscoveryDialog } from "@/components/skills/SkillsDiscoveryDialog";

const skillsPageRender = vi.fn();

vi.mock("@/components/skills/SkillsPage", () => ({
  SkillsPage: (() => {
    const Mock = (props: any) => {
      skillsPageRender(props);
      return <div data-testid="skills-page" />;
    };
    return Mock;
  })(),
  getSkillsPageHeaderActions: (source: string) => {
    if (source === "repos") {
      return [
        {
          key: "refresh",
          labelKey: "skills.refresh",
          Icon: () => null,
          execute: vi.fn(),
        },
        {
          key: "manage",
          labelKey: "skills.repoManager",
          Icon: () => null,
          execute: vi.fn(),
        },
      ];
    }
    return [
      {
        key: "manage",
        labelKey: "skills.repoManager",
        Icon: () => null,
        execute: vi.fn(),
      },
    ];
  },
}));

beforeEach(() => {
  skillsPageRender.mockClear();
});

describe("SkillsDiscoveryDialog", () => {
  it("renders SkillsPage when open is true", () => {
    render(
      <SkillsDiscoveryDialog
        open
        onOpenChange={vi.fn()}
        initialApp="claude"
      />,
    );

    expect(screen.getByTestId("skills-page")).toBeInTheDocument();
    const pageProps = skillsPageRender.mock.calls[0][0];
    expect(pageProps.initialApp).toBe("claude");
    expect(pageProps.layout).toBe("shell");
  });

  it("does not render SkillsPage content when open is false", () => {
    render(
      <SkillsDiscoveryDialog
        open={false}
        onOpenChange={vi.fn()}
        initialApp="claude"
      />,
    );

    expect(screen.queryByTestId("skills-page")).not.toBeInTheDocument();
  });

  it("renders dialog title and description", () => {
    render(
      <SkillsDiscoveryDialog
        open
        onOpenChange={vi.fn()}
        initialApp="claude"
      />,
    );

    expect(screen.getByText("skills.discover")).toBeInTheDocument();
  });

  it("shows header action buttons for the default 'repos' source", () => {
    render(
      <SkillsDiscoveryDialog
        open
        onOpenChange={vi.fn()}
        initialApp="claude"
      />,
    );

    // repos source should have 2 actions: refresh + manage
    expect(screen.getByText("skills.refresh")).toBeInTheDocument();
    expect(screen.getByText("skills.repoManager")).toBeInTheDocument();
  });

  it("calls onSourceChange on SkillsPage when source changes, updating header actions", () => {
    const { rerender } = render(
      <SkillsDiscoveryDialog
        open
        onOpenChange={vi.fn()}
        initialApp="claude"
      />,
    );

    // Initially "repos" source -> 2 actions
    expect(screen.getByText("skills.refresh")).toBeInTheDocument();

    // Simulate SkillsPage calling onSourceChange with "skillssh"
    const pageProps = skillsPageRender.mock.calls[0][0];
    fireEvent.click(screen.getByTestId("skills-page")); // just ensure it's interactive

    // Directly invoke the callback to simulate source change
    act(() => pageProps.onSourceChange("skillssh"));

    // Now only "manage" should be visible (skillssh source has 1 action)
    expect(screen.queryByText("skills.refresh")).not.toBeInTheDocument();
    expect(screen.getByText("skills.repoManager")).toBeInTheDocument();
  });
});
