import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProviderCard } from "@/components/providers/ProviderCard";
import type { Provider } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/components/providers/ProviderActions", () => ({
  ProviderActions: () => null,
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => null,
}));

vi.mock("@/components/UsageFooter", () => ({ default: () => null }));
vi.mock("@/components/SubscriptionQuotaFooter", () => ({
  default: () => null,
}));
vi.mock("@/components/CopilotQuotaFooter", () => ({ default: () => null }));
vi.mock("@/components/CodexOauthQuotaFooter", () => ({
  default: () => null,
}));
vi.mock("@/components/providers/ProviderHealthBadge", () => ({
  ProviderHealthBadge: () => null,
}));
vi.mock("@/components/providers/FailoverPriorityBadge", () => ({
  FailoverPriorityBadge: () => null,
}));
vi.mock("@/lib/query/failover", () => ({
  useProviderHealth: () => ({ data: undefined }),
}));
vi.mock("@/lib/query/queries", () => ({
  useUsageQuery: () => ({ data: undefined }),
}));

describe("ProviderCard website layout", () => {
  it("keeps a long website URL accessible and clickable in the metadata row", () => {
    const onOpenWebsite = vi.fn();
    const websiteUrl =
      "https://api.example.com/organizations/team/providers/a-very-long-endpoint";
    const provider: Provider = {
      id: "provider-1",
      name: "Long URL Provider",
      websiteUrl,
      settingsConfig: {},
    };

    render(
      React.createElement(ProviderCard, {
        provider,
        isCurrent: false,
        appId: "claude",
        onSwitch: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onDuplicate: vi.fn(),
        onConfigureUsage: vi.fn(),
        onOpenWebsite,
      }),
    );

    const websiteButton = screen.getByRole("button", { name: websiteUrl });
    expect(websiteButton).toHaveAttribute("title", websiteUrl);
    expect(websiteButton.parentElement).toHaveClass("pmeta");

    fireEvent.click(websiteButton);
    expect(onOpenWebsite).toHaveBeenCalledWith(websiteUrl);
  });
});
