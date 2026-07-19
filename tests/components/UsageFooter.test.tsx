import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UsageFooter from "@/components/UsageFooter";
import type { Provider, UsageResult } from "@/types";

const useUsageQueryMock = vi.fn();
const tierBadgeRender = vi.fn();

vi.mock("@/lib/query/queries", () => ({
  useUsageQuery: (...args: unknown[]) => useUsageQueryMock(...args),
}));

vi.mock("@/components/SubscriptionQuotaFooter", () => ({
  TierBadge: (props: any) => {
    tierBadgeRender(props);
    return <span data-testid={`tier-badge-${props.tier?.utilization ?? 0}`} />;
  },
}));

function makeProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: "p1",
    name: "Test Provider",
    settingsConfig: {},
    ...overrides,
  };
}

function setUsageResult(
  result: Partial<UsageResult> = {},
  opts: { lastQueriedAt?: number; isFetching?: boolean } = {},
) {
  useUsageQueryMock.mockReturnValue({
    data: result.success !== undefined ? (result as UsageResult) : undefined,
    isFetching: opts.isFetching ?? false,
    lastQueriedAt: opts.lastQueriedAt,
    refetch: vi.fn(),
  });
}

beforeEach(() => {
  useUsageQueryMock.mockReset();
  tierBadgeRender.mockClear();
  useUsageQueryMock.mockReturnValue({
    data: undefined,
    isFetching: false,
    lastQueriedAt: undefined,
    refetch: vi.fn(),
  });
});

describe("UsageFooter", () => {
  it("renders nothing when usageEnabled is false", () => {
    setUsageResult({ success: true, data: [{ used: 10, remaining: 90 }] });
    const { container } = render(
      <UsageFooter
        provider={makeProvider()}
        providerId="p1"
        appId="claude"
        usageEnabled={false}
        isCurrent
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when usage data is undefined", () => {
    const { container } = render(
      <UsageFooter
        provider={makeProvider()}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when usage data list is empty", () => {
    setUsageResult({ success: true, data: [] });
    const { container } = render(
      <UsageFooter
        provider={makeProvider()}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders error state with refresh button when usage query failed", () => {
    const refetch = vi.fn();
    useUsageQueryMock.mockReturnValue({
      data: { success: false, error: "API timeout" },
      isFetching: false,
      lastQueriedAt: Date.now(),
      refetch,
    });

    render(
      <UsageFooter
        provider={makeProvider()}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
      />,
    );

    expect(screen.getByText("API timeout")).toBeInTheDocument();
    const refreshBtn = screen.getByTitle("usage.refreshUsage");
    fireEvent.click(refreshBtn);
    expect(refetch).toHaveBeenCalled();
  });

  it("renders inline usage with used and remaining values", () => {
    setUsageResult({
      success: true,
      data: [
        {
          planName: "Pro Plan",
          used: 42.5,
          remaining: 57.5,
          total: 100,
          unit: "USD",
        },
      ],
    });

    render(
      <UsageFooter
        provider={makeProvider()}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
        inline
      />,
    );

    expect(screen.getByText("42.50")).toBeInTheDocument();
    expect(screen.getByText("57.50")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("renders full card with plan items and total when not inline", () => {
    setUsageResult({
      success: true,
      data: [
        {
          planName: "Basic",
          total: 200,
          used: 50,
          remaining: 150,
          unit: "credits",
        },
      ],
    });

    render(
      <UsageFooter
        provider={makeProvider()}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
      />,
    );

    expect(screen.getByText(/Basic/)).toBeInTheDocument();
    expect(screen.getByText("200.00")).toBeInTheDocument();
    expect(screen.getByText("50.00")).toBeInTheDocument();
    expect(screen.getByText("150.00")).toBeInTheDocument();
    expect(screen.getByText("credits")).toBeInTheDocument();
  });

  it("renders infinity symbol when total is -1", () => {
    setUsageResult({
      success: true,
      data: [{ total: -1, used: 10, remaining: 90 }],
    });

    render(
      <UsageFooter
        provider={makeProvider()}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
      />,
    );

    expect(screen.getByText("∞")).toBeInTheDocument();
  });

  it("renders token plan inline mode with TierBadge when templateType is token_plan", () => {
    setUsageResult({
      success: true,
      data: [
        {
          planName: "Token Plan",
          used: 75,
          extra: JSON.stringify({ planLabel: "Pro", maxValueUsd: 100 }),
        },
      ],
    });

    render(
      <UsageFooter
        provider={makeProvider({
          meta: {
            usage_script: { templateType: "token_plan" },
          } as any,
        })}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
        inline
      />,
    );

    // planLabel should be displayed
    expect(screen.getByText(/Pro/)).toBeInTheDocument();
    // TierBadge should be rendered
    expect(tierBadgeRender).toHaveBeenCalled();
    expect(tierBadgeRender.mock.calls[0][0].tier.utilization).toBe(75);
  });

  it("shows expired styling when isValid is false", () => {
    setUsageResult({
      success: true,
      data: [
        {
          planName: "Expired Plan",
          isValid: false,
          invalidMessage: "expired",
          total: 100,
          used: 100,
          remaining: 0,
        },
      ],
    });

    render(
      <UsageFooter
        provider={makeProvider()}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
        inline
      />,
    );

    // The remaining value should still be shown
    expect(screen.getByText("0.00")).toBeInTheDocument();
  });

  it("passes autoQueryInterval based on provider meta and isCurrent state", () => {
    setUsageResult({ success: true, data: [{ used: 1 }] });

    render(
      <UsageFooter
        provider={makeProvider({
          meta: {
            usage_script: { autoQueryInterval: 5 },
          } as any,
        })}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent
      />,
    );

    const callArgs = useUsageQueryMock.mock.calls[0];
    expect(callArgs[0]).toBe("p1");
    expect(callArgs[1]).toBe("claude");
    // The third arg should have autoQueryInterval: 5 (since isCurrent=true)
    expect(callArgs[2]).toEqual(
      expect.objectContaining({ enabled: true, autoQueryInterval: 5 }),
    );
  });

  it("sets autoQueryInterval to 0 when not current provider", () => {
    setUsageResult({ success: true, data: [{ used: 1 }] });

    render(
      <UsageFooter
        provider={makeProvider({
          meta: { usage_script: { autoQueryInterval: 5 } } as any,
        })}
        providerId="p1"
        appId="claude"
        usageEnabled
        isCurrent={false}
      />,
    );

    const callArgs = useUsageQueryMock.mock.calls[0];
    expect(callArgs[2]).toEqual(
      expect.objectContaining({ autoQueryInterval: 0 }),
    );
  });
});
