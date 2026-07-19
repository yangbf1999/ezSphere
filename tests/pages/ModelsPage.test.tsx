import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ModelsPage } from "@/pages/ModelsPage";
import type { Provider } from "@/types";

const gridRender = vi.fn();
const universalGridRender = vi.fn();
const vendorPanelRender = vi.fn();

const useModelsProvidersQueryMock = vi.fn();

vi.mock("@/lib/query", async () => {
  const actual = await vi.importActual<any>("@/lib/query");
  return {
    ...actual,
    useModelsProvidersQuery: (...args: unknown[]) =>
      useModelsProvidersQueryMock(...args),
  };
});

vi.mock("@/components/models/ModelsProviderGrid", () => ({
  ModelsProviderGrid: (props: any) => {
    gridRender(props);
    return <div data-testid="models-grid" />;
  },
}));

vi.mock("@/components/models/ModelsUniversalGrid", () => ({
  ModelsUniversalGrid: (props: any) => {
    universalGridRender(props);
    return <div data-testid="universal-grid" />;
  },
}));

vi.mock("@/components/models/ModelsVendorPanel", () => ({
  ModelsVendorPanel: (props: any) => {
    vendorPanelRender(props);
    return (
      <div data-testid="vendor-panel">
        <button
          data-testid="switch-codex"
          onClick={() => props.onSwitchApp("codex")}
        >
          switch-codex
        </button>
        <button
          data-testid="add-vendor"
          onClick={() => props.onAddVendorPreset("preset-1", "codex")}
        >
          add-vendor
        </button>
        <button
          data-testid="add-custom"
          onClick={() => props.onAddCustomProvider("hermes")}
        >
          add-custom
        </button>
        <button
          data-testid="add-universal"
          onClick={() => props.onAddUniversalPreset(null)}
        >
          add-universal
        </button>
      </div>
    );
  },
}));

function makeProvider(id: string): Provider {
  return {
    id,
    name: id,
    settingsConfig: {},
  };
}

beforeEach(() => {
  localStorage.clear();
  gridRender.mockClear();
  universalGridRender.mockClear();
  vendorPanelRender.mockClear();
  useModelsProvidersQueryMock.mockReturnValue({
    entries: [],
    isLoading: false,
  });
});

describe("ModelsPage", () => {
  it("renders the page skeleton with all child panels", () => {
    render(
      <ModelsPage
        onAddVendorPreset={vi.fn()}
        onAddCustomProvider={vi.fn()}
        onEditProvider={vi.fn()}
        onDeleteProvider={vi.fn()}
      />,
    );

    expect(screen.getByTestId("models-grid")).toBeInTheDocument();
    expect(screen.getByTestId("universal-grid")).toBeInTheDocument();
    expect(screen.getByTestId("vendor-panel")).toBeInTheDocument();
  });

  it("passes query entries and loading state to ModelsProviderGrid", () => {
    useModelsProvidersQueryMock.mockReturnValue({
      entries: [{ appId: "claude", provider: makeProvider("p1") } as any],
      isLoading: true,
    });

    render(
      <ModelsPage
        isProxyRunning
        onAddVendorPreset={vi.fn()}
        onAddCustomProvider={vi.fn()}
        onEditProvider={vi.fn()}
        onDeleteProvider={vi.fn()}
      />,
    );

    const gridProps = gridRender.mock.calls[0][0];
    expect(gridProps.isLoading).toBe(true);
    expect(gridProps.entries).toHaveLength(1);
  });

  it("persists modelsAppId to localStorage when switching apps", () => {
    render(
      <ModelsPage
        onAddVendorPreset={vi.fn()}
        onAddCustomProvider={vi.fn()}
        onEditProvider={vi.fn()}
        onDeleteProvider={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("switch-codex"));

    expect(localStorage.getItem("ezsphere-last-models-app")).toBe("codex");
    // Vendor panel should receive the updated app id
    const lastCall = vendorPanelRender.mock.calls.at(-1)![0];
    expect(lastCall.modelsAppId).toBe("codex");
  });

  it("restores modelsAppId from localStorage on mount when valid", () => {
    localStorage.setItem("ezsphere-last-models-app", "hermes");

    render(
      <ModelsPage
        onAddVendorPreset={vi.fn()}
        onAddCustomProvider={vi.fn()}
        onEditProvider={vi.fn()}
        onDeleteProvider={vi.fn()}
      />,
    );

    expect(vendorPanelRender.mock.calls[0][0].modelsAppId).toBe("hermes");
  });

  it("forwards onAddVendorPreset and onAddCustomProvider callbacks through vendor panel", () => {
    const onAddVendorPreset = vi.fn();
    const onAddCustomProvider = vi.fn();

    render(
      <ModelsPage
        onAddVendorPreset={onAddVendorPreset}
        onAddCustomProvider={onAddCustomProvider}
        onEditProvider={vi.fn()}
        onDeleteProvider={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("add-vendor"));
    expect(onAddVendorPreset).toHaveBeenCalledWith("preset-1", "codex");

    fireEvent.click(screen.getByTestId("add-custom"));
    expect(onAddCustomProvider).toHaveBeenCalledWith("hermes");
  });

  it("opens universal form when addUniversalPreset is triggered", () => {
    render(
      <ModelsPage
        onAddVendorPreset={vi.fn()}
        onAddCustomProvider={vi.fn()}
        onEditProvider={vi.fn()}
        onDeleteProvider={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("add-universal"));

    const lastCall = universalGridRender.mock.calls.at(-1)![0];
    expect(lastCall.formOpen).toBe(true);
    expect(lastCall.initialPreset).toBeNull();
  });

  it("forwards onEditProvider and onDeleteProvider to ModelsProviderGrid", () => {
    const onEditProvider = vi.fn();
    const onDeleteProvider = vi.fn();
    render(
      <ModelsPage
        onAddVendorPreset={vi.fn()}
        onAddCustomProvider={vi.fn()}
        onEditProvider={onEditProvider}
        onDeleteProvider={onDeleteProvider}
      />,
    );

    const gridProps = gridRender.mock.calls[0][0];
    expect(gridProps.onEdit).toBe(onEditProvider);
    expect(gridProps.onDelete).toBe(onDeleteProvider);
  });
});
