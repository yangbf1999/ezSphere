import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) => {
      if (opts && typeof opts === "object" && "defaultValue" in opts) {
        return opts.defaultValue;
      }
      return k;
    },
  }),
}));

import { ProviderHealthBadge } from "@/components/providers/ProviderHealthBadge";
import { FailoverPriorityBadge } from "@/components/providers/FailoverPriorityBadge";

describe("ProviderHealthBadge", () => {
  it("shows healthy state (green) when consecutiveFailures is 0", () => {
    const { container } = render(<ProviderHealthBadge consecutiveFailures={0} />);

    expect(screen.getByText("正常")).toBeInTheDocument();
    const dot = container.querySelector(".bg-green-500");
    expect(dot).toBeInTheDocument();
    // default variant uses rounded-full container
    expect(container.querySelector(".bg-green-500\\/10")).toBeInTheDocument();
  });

  it("shows degraded state (yellow) when failures > 0 but not circuit-open", () => {
    const { container } = render(<ProviderHealthBadge consecutiveFailures={3} />);

    expect(screen.getByText("降级")).toBeInTheDocument();
    expect(container.querySelector(".bg-yellow-500")).toBeInTheDocument();
  });

  it("shows circuit-open state (red) when isHealthy is false", () => {
    const { container } = render(
      <ProviderHealthBadge consecutiveFailures={5} isHealthy={false} />,
    );

    expect(screen.getByText("熔断")).toBeInTheDocument();
    expect(container.querySelector(".bg-red-500")).toBeInTheDocument();
  });

  it("shell variant renders with ez-badge classes", () => {
    render(
      <ProviderHealthBadge consecutiveFailures={0} variant="shell" />,
    );

    const badge = screen.getByText("正常");
    expect(badge.closest("span")).toHaveClass("ez-badge", "ez-badge--success");
  });

  it("shell variant degraded uses warning badge class", () => {
    render(
      <ProviderHealthBadge consecutiveFailures={2} variant="shell" />,
    );
    const badge = screen.getByText("降级");
    expect(badge.closest("span")).toHaveClass("ez-badge--warning");
  });

  it("shell variant failed uses error badge class", () => {
    render(
      <ProviderHealthBadge
        consecutiveFailures={9}
        isHealthy={false}
        variant="shell"
      />,
    );
    const badge = screen.getByText("熔断");
    expect(badge.closest("span")).toHaveClass("ez-badge--error");
  });

  it("title attribute includes the failure count", () => {
    render(<ProviderHealthBadge consecutiveFailures={7} />);
    const badge = screen.getByText("降级").closest("div")!;
    expect(badge.getAttribute("title")).toContain("7");
  });

  it("merges custom className", () => {
    const { container } = render(
      <ProviderHealthBadge consecutiveFailures={0} className="extra" />,
    );
    expect(container.firstChild).toHaveClass("extra");
  });
});

describe("FailoverPriorityBadge", () => {
  it("renders P{priority} text", () => {
    render(<FailoverPriorityBadge priority={1} />);
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("renders the priority number in the title tooltip", () => {
    render(<FailoverPriorityBadge priority={3} />);
    const badge = screen.getByText("P3").closest("div")!;
    expect(badge.getAttribute("title")).toContain("3");
  });

  it("applies emerald color classes by default", () => {
    const { container } = render(<FailoverPriorityBadge priority={2} />);
    expect(container.firstChild).toHaveClass(
      "bg-emerald-500/10",
      "text-emerald-600",
    );
  });

  it("merges custom className", () => {
    const { container } = render(
      <FailoverPriorityBadge priority={1} className="custom" />,
    );
    expect(container.firstChild).toHaveClass("custom");
  });
});
