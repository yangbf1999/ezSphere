import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sidebar } from "@/layouts/Sidebar";
import type { SidebarNavId } from "@/config/navigation";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn().mockResolvedValue("1.2.3"),
}));

vi.mock("@/hooks/useSidebarWidth", () => ({
  useSidebarWidth: () => 256,
}));

vi.mock("@/hooks/useMcp", () => ({
  useAllMcpServers: () => ({ data: undefined }),
}));

vi.mock("@/hooks/useSkills", () => ({
  useInstalledSkills: () => ({ data: [] }),
}));

vi.mock("@/components/UpdateBadge", () => ({
  UpdateBadge: () => <div data-testid="update-badge" />,
}));

describe("Sidebar", () => {
  it("renders all nav items from SIDEBAR_NAV_GROUPS", () => {
    render(
      <Sidebar
        activeNavId="overview"
        onNavigate={vi.fn()}
        onOpenAbout={vi.fn()}
      />,
    );

    // SIDEBAR_NAV_GROUPS has 9 items: overview, apps, models, prompts, skills, mcp, sessions, install, settings
    const expectedIds: SidebarNavId[] = [
      "overview",
      "apps",
      "models",
      "prompts",
      "skills",
      "mcp",
      "sessions",
      "install",
      "settings",
    ];

    for (const id of expectedIds) {
      // Each button text is t(`nav.${id}`) -> `nav.${id}` with our mock
      expect(screen.getByText(`nav.${id}`)).toBeInTheDocument();
    }
  });

  it("calls onNavigate with the item id when a nav button is clicked", () => {
    const onNavigate = vi.fn();
    render(
      <Sidebar
        activeNavId="overview"
        onNavigate={onNavigate}
        onOpenAbout={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("nav.prompts"));
    expect(onNavigate).toHaveBeenCalledWith("prompts");

    fireEvent.click(screen.getByText("nav.settings"));
    expect(onNavigate).toHaveBeenCalledWith("settings");
  });

  it("marks the active nav item with the 'active' class", () => {
    const { container } = render(
      <Sidebar
        activeNavId="models"
        onNavigate={vi.fn()}
        onOpenAbout={vi.fn()}
      />,
    );

    const activeBtn = screen.getByText("nav.models").closest("button");
    expect(activeBtn).toHaveClass("active");

    const inactiveBtn = screen.getByText("nav.overview").closest("button");
    expect(inactiveBtn).not.toHaveClass("active");
  });

  it("renders group section labels", () => {
    render(
      <Sidebar
        activeNavId="overview"
        onNavigate={vi.fn()}
        onOpenAbout={vi.fn()}
      />,
    );

    // Two groups have labelKey: "nav.group.config" and "nav.group.system"
    expect(screen.getByText("nav.group.config")).toBeInTheDocument();
    expect(screen.getByText("nav.group.system")).toBeInTheDocument();
  });
});
