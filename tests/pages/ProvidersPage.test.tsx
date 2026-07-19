import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProvidersPage } from "@/pages/ProvidersPage";
import type { Provider } from "@/types";

const appSwitcherRender = vi.fn();
const appToolStatusRender = vi.fn();
const providerListRender = vi.fn();
const proxyToggleRender = vi.fn();
const failoverToggleRender = vi.fn();
const claudeDesktopToggleRender = vi.fn();

vi.mock("@/components/AppSwitcher", () => ({
  AppSwitcher: (props: any) => {
    appSwitcherRender(props);
    return (
      <div data-testid="app-switcher">
        <span data-testid="active-app">{props.activeApp}</span>
        <span data-testid="active-count">{props.activeCount}</span>
        <button
          data-testid="switch-app"
          onClick={() => props.onSwitch("codex")}
        >
          switch
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/providers/AppToolStatusPanel", () => ({
  AppToolStatusPanel: (props: any) => {
    appToolStatusRender(props);
    return <div data-testid="app-tool-status" />;
  },
}));

vi.mock("@/components/providers/ProviderList", () => ({
  ProviderList: (props: any) => {
    providerListRender(props);
    return <div data-testid="provider-list" />;
  },
}));

vi.mock("@/components/proxy/ProxyToggle", () => ({
  ProxyToggle: (props: any) => {
    proxyToggleRender(props);
    return <div data-testid="proxy-toggle" />;
  },
}));

vi.mock("@/components/proxy/FailoverToggle", () => ({
  FailoverToggle: (props: any) => {
    failoverToggleRender(props);
    return <div data-testid="failover-toggle" />;
  },
}));

vi.mock("@/components/proxy/ClaudeDesktopRouteToggle", () => ({
  ClaudeDesktopRouteToggle: (props: any) => {
    claudeDesktopToggleRender(props);
    return <div data-testid="claude-desktop-toggle" />;
  },
}));

function makeProviders(count: number): Record<string, Provider> {
  const result: Record<string, Provider> = {};
  for (let i = 0; i < count; i++) {
    result[`p${i}`] = {
      id: `p${i}`,
      name: `Provider ${i}`,
      settingsConfig: {},
    };
  }
  return result;
}

beforeEach(() => {
  appSwitcherRender.mockClear();
  appToolStatusRender.mockClear();
  providerListRender.mockClear();
  proxyToggleRender.mockClear();
  failoverToggleRender.mockClear();
  claudeDesktopToggleRender.mockClear();
});

describe("ProvidersPage", () => {
  function renderPage(overrides: any = {}) {
    const providers = overrides.providers ?? makeProviders(3);
    return render(
      <ProvidersPage
        onSwitchApp={vi.fn()}
        visibleApps={{}}
        onAddProvider={vi.fn()}
        onOpenInstall={vi.fn()}
        showProxyToggles={false}
        appId="claude"
        providers={providers}
        currentProviderId=""
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
        {...overrides}
      />,
    );
  }

  it("renders the page skeleton with AppSwitcher, AppToolStatusPanel and ProviderList", () => {
    renderPage();

    expect(screen.getByTestId("app-switcher")).toBeInTheDocument();
    expect(screen.getByTestId("app-tool-status")).toBeInTheDocument();
    expect(screen.getByTestId("provider-list")).toBeInTheDocument();
  });

  it("passes provider count to AppSwitcher as activeCount", () => {
    renderPage({ providers: makeProviders(5) });

    expect(screen.getByTestId("active-count").textContent).toBe("5");
  });

  it("forwards onSwitchApp callback through AppSwitcher", () => {
    const onSwitchApp = vi.fn();
    renderPage({ onSwitchApp });

    fireEvent.click(screen.getByTestId("switch-app"));
    expect(onSwitchApp).toHaveBeenCalledWith("codex");
  });

  it("renders ProxyToggle and FailoverToggle when showProxyToggles is true for non-claude-desktop", () => {
    renderPage({
      showProxyToggles: true,
      enableLocalProxy: true,
      enableFailoverToggle: true,
      appId: "claude",
    });

    expect(screen.getByTestId("proxy-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("failover-toggle")).toBeInTheDocument();
    expect(proxyToggleRender.mock.calls[0][0].activeApp).toBe("claude");
    expect(failoverToggleRender.mock.calls[0][0].activeApp).toBe("claude");
  });

  it("renders ClaudeDesktopRouteToggle instead of ProxyToggle for claude-desktop app", () => {
    renderPage({
      showProxyToggles: true,
      enableLocalProxy: true,
      appId: "claude-desktop",
    });

    expect(screen.getByTestId("claude-desktop-toggle")).toBeInTheDocument();
    expect(screen.queryByTestId("proxy-toggle")).not.toBeInTheDocument();
  });

  it("hides proxy toggles when showProxyToggles is false", () => {
    renderPage({ showProxyToggles: false });

    expect(screen.queryByTestId("proxy-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("failover-toggle")).not.toBeInTheDocument();
  });

  it("forwards onAddProvider as onCreate to ProviderList", () => {
    const onAddProvider = vi.fn();
    renderPage({ onAddProvider });

    const listProps = providerListRender.mock.calls[0][0];
    expect(listProps.onCreate).toBe(onAddProvider);
  });

  it("forwards appId and providers to ProviderList", () => {
    const providers = makeProviders(2);
    renderPage({ providers, appId: "codex" });

    const listProps = providerListRender.mock.calls[0][0];
    expect(listProps.appId).toBe("codex");
    expect(listProps.providers).toBe(providers);
  });
});
