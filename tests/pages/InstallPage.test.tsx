import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { InstallPage } from "@/pages/InstallPage";

const motherAgentMainRender = vi.fn();
const motherAgentPanelRender = vi.fn();
const motherAgentProviderRender = vi.fn();

vi.mock("@/pages/MotherAgent", () => ({
  MotherAgentMain: (props: any) => {
    motherAgentMainRender(props);
    return <div data-testid="mother-agent-main" />;
  },
  MotherAgentPanel: (props: any) => {
    motherAgentPanelRender(props);
    return <div data-testid="mother-agent-panel" />;
  },
  MotherAgentProvider: ({ children }: any) => {
    motherAgentProviderRender();
    return <div data-testid="mother-agent-provider">{children}</div>;
  },
}));

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh",
  }),
}));

beforeEach(() => {
  motherAgentMainRender.mockClear();
  motherAgentPanelRender.mockClear();
  motherAgentProviderRender.mockClear();
});

describe("InstallPage", () => {
  it("wraps the install shell in MotherAgentProvider", () => {
    render(<InstallPage />);

    expect(motherAgentProviderRender).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mother-agent-main")).toBeInTheDocument();
    expect(screen.getByTestId("mother-agent-panel")).toBeInTheDocument();
  });

  it("passes variant='install' to MotherAgentMain", () => {
    render(<InstallPage />);

    expect(motherAgentMainRender.mock.calls[0][0].variant).toBe("install");
  });

  it("passes defaultTab='commands' to MotherAgentPanel", () => {
    render(<InstallPage />);

    expect(motherAgentPanelRender.mock.calls[0][0].defaultTab).toBe("commands");
  });

  it("renders the install header with title and subtitle", () => {
    render(<InstallPage />);

    const header = screen.getByText("installRepair.title");
    const subtitle = screen.getByText("installRepair.subtitle");
    expect(header).toBeInTheDocument();
    expect(subtitle).toBeInTheDocument();
  });
});
