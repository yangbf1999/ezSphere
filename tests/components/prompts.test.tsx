import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PromptToggle from "@/components/prompts/PromptToggle";
import PromptListItem from "@/components/prompts/PromptListItem";
import { PromptsPageHeader } from "@/components/prompts/PromptsPageHeader";
import type { Prompt, AppId } from "@/lib/api";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// Keep Button a plain pass-through so we test PromptListItem logic, not Button internals.
vi.mock("@/components/ui/button", () => ({
  Button: (props: any) => (
    <button
      type="button"
      onClick={props.onClick}
      title={props.title}
      aria-label={props.ariaLabel}
      disabled={props.disabled}
      data-testid={props.id}
    >
      {props.children}
    </button>
  ),
}));

function makePrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: overrides.id ?? "p1",
    name: overrides.name ?? "My Prompt",
    content: overrides.content ?? "body content",
    description: overrides.description,
    enabled: overrides.enabled ?? false,
    createdAt: overrides.createdAt,
    updatedAt: overrides.updatedAt,
  };
}

describe("PromptToggle", () => {
  it("reflects enabled state via aria-checked and toggles on click", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <PromptToggle enabled={false} onChange={onChange} />,
    );

    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-checked", "false");
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<PromptToggle enabled={true} onChange={onChange} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("disables the switch and prevents toggling when disabled", () => {
    const onChange = vi.fn();
    render(<PromptToggle enabled={false} onChange={onChange} disabled />);
    const sw = screen.getByRole("switch");
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shell layout renders a button with the prompt name in aria-label", () => {
    const onChange = vi.fn();
    render(
      <PromptToggle
        enabled
        onChange={onChange}
        layout="shell"
        promptName="Coding Rules"
      />,
    );
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-label", "已启用 Coding Rules");
    expect(sw).toHaveClass("prompt-toggle on");
  });
});

describe("PromptListItem", () => {
  it("default layout renders name/description and wires toggle/edit/delete", () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <PromptListItem
        id="p1"
        prompt={makePrompt({ name: "Rules", description: "desc here" })}
        appId="claude"
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("desc here")).toBeInTheDocument();

    // Toggle
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledWith("p1", true);

    // Edit / delete via title attributes (mocked Button exposes title)
    fireEvent.click(screen.getByTitle("common.edit"));
    expect(onEdit).toHaveBeenCalledWith("p1");

    fireEvent.click(screen.getByTitle("common.delete"));
    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("shell layout shows prompt meta (filename + size) when no description", () => {
    render(
      <PromptListItem
        id="p2"
        prompt={makePrompt({ content: "x".repeat(2048), description: undefined })}
        appId="codex"
        layout="shell"
        onToggle={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // codex -> AGENTS.md filename; 2048 bytes -> 2.0 KB
    expect(screen.getByText(/AGENTS\.md/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
  });
});

describe("PromptsPageHeader", () => {
  it("renders title, search field and add button; wires search + add", () => {
    const onSearchChange = vi.fn();
    const onAdd = vi.fn();
    render(
      <PromptsPageHeader
        searchTerm="foo"
        onSearchChange={onSearchChange}
        searchInputRef={{ current: null } as any}
        onAdd={onAdd}
      />,
    );

    expect(screen.getByText("nav.prompts")).toBeInTheDocument();
    expect(screen.getByText("prompts.pageDescription")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("prompts.searchPlaceholder");
    expect(input).toHaveValue("foo");
    fireEvent.change(input, { target: { value: "bar" } });
    expect(onSearchChange).toHaveBeenCalledWith("bar");

    fireEvent.click(screen.getByText("prompts.addNew"));
    expect(onAdd).toHaveBeenCalled();
  });
});
