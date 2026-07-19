import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OverviewPage } from "@/pages/OverviewPage";

const dashboardRender = vi.fn();

vi.mock("@/components/usage/UsageDashboard", () => ({
  UsageDashboard: (props: any) => {
    dashboardRender(props);
    return <div data-testid="usage-dashboard" />;
  },
}));

beforeEach(() => {
  dashboardRender.mockClear();
});

describe("OverviewPage", () => {
  it("renders the UsageDashboard child inside a scrollable container", () => {
    const { container } = render(<OverviewPage />);

    expect(screen.getByTestId("usage-dashboard")).toBeInTheDocument();
    expect(dashboardRender).toHaveBeenCalledTimes(1);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("overflow-y-auto");
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("h-full");
  });
});
