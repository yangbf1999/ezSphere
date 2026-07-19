import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UniversalProviderCard } from "@/components/universal/UniversalProviderCard";
import type { UniversalProvider } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: ({ name, size }: { name: string; size: number }) => (
    <div data-testid={`icon-${name}`} data-size={size} />
  ),
}));

function makeProvider(
  overrides: Partial<UniversalProvider> = {},
): UniversalProvider {
  return {
    id: overrides.id ?? "up-1",
    name: overrides.name ?? "My Gateway",
    providerType: overrides.providerType ?? "newapi",
    baseUrl: overrides.baseUrl ?? "https://api.example.com",
    apiKey: overrides.apiKey ?? "sk-secret",
    apps: overrides.apps ?? { claude: true, codex: false, gemini: false },
    models: overrides.models ?? {},
    icon: overrides.icon ?? "openai",
    websiteUrl: overrides.websiteUrl,
    notes: overrides.notes,
    createdAt: overrides.createdAt ?? Date.now(),
  };
}

describe("UniversalProviderCard", () => {
  it("renders provider name, type and baseUrl", () => {
    render(
      <UniversalProviderCard
        provider={makeProvider({ name: "Acme API", providerType: "custom", baseUrl: "https://acme.io" })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSync={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );

    expect(screen.getByText("Acme API")).toBeInTheDocument();
    expect(screen.getByText("custom")).toBeInTheDocument();
    expect(screen.getByText("https://acme.io")).toBeInTheDocument();
  });

  it("shows enabled app chips and hides disabled ones", () => {
    render(
      <UniversalProviderCard
        provider={makeProvider({ apps: { claude: true, codex: true, gemini: false } })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSync={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );

    expect(screen.getByText("Claude")).toBeInTheDocument();
    expect(screen.getByText("Codex")).toBeInTheDocument();
    // Gemini is disabled, should not appear as a chip
    expect(screen.queryByText("Gemini")).not.toBeInTheDocument();
  });

  it("shows no-apps-enabled hint when no app is enabled", () => {
    render(
      <UniversalProviderCard
        provider={makeProvider({ apps: { claude: false, codex: false, gemini: false } })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSync={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );
    expect(screen.getByText("universalProvider.noAppsEnabled")).toBeInTheDocument();
  });

  it("renders notes when provided", () => {
    render(
      <UniversalProviderCard
        provider={makeProvider({ notes: "Test notes here" })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSync={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );
    expect(screen.getByText("Test notes here")).toBeInTheDocument();
  });

  it("fires sync, duplicate, edit and delete callbacks with correct args", () => {
    const onSync = vi.fn();
    const onDuplicate = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const provider = makeProvider({ id: "up-42", name: "GW" });

    render(
      <UniversalProviderCard
        provider={provider}
        onEdit={onEdit}
        onDelete={onDelete}
        onSync={onSync}
        onDuplicate={onDuplicate}
      />,
    );

    fireEvent.click(screen.getByLabelText("universalProvider.sync"));
    expect(onSync).toHaveBeenCalledWith("up-42");

    fireEvent.click(screen.getByLabelText("universalProvider.duplicate"));
    expect(onDuplicate).toHaveBeenCalledWith(provider);

    fireEvent.click(screen.getByLabelText("common.edit"));
    expect(onEdit).toHaveBeenCalledWith(provider);

    fireEvent.click(screen.getByLabelText("common.delete"));
    expect(onDelete).toHaveBeenCalledWith("up-42");
  });

  it("shows '-' when baseUrl is empty", () => {
    render(
      <UniversalProviderCard
        provider={makeProvider({ baseUrl: "" })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSync={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
