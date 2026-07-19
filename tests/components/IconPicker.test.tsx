import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const { mockIconList, searchIconsMock } = vi.hoisted(() => ({
  mockIconList: ["claude", "openai", "gemini", "deepseek"],
  searchIconsMock: vi.fn(),
}));

vi.mock("@/icons/extracted", () => ({
  iconList: mockIconList,
}));

vi.mock("@/icons/extracted/metadata", () => ({
  searchIcons: (...args: unknown[]) => searchIconsMock(...args),
  getIconMetadata: (name: string) => ({
    displayName: name.toUpperCase(),
    defaultColor: "#fff",
  }),
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: ({
    icon,
    name,
    size,
  }: {
    icon?: string;
    name: string;
    size?: number;
  }) => (
    <span data-testid="provider-icon" data-icon={icon} data-name={name} data-size={size} />
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) =>
      opts && typeof opts === "object" && "defaultValue" in opts
        ? opts.defaultValue
        : k,
  }),
}));

import { IconPicker } from "@/components/IconPicker";

describe("IconPicker", () => {
  it("renders all icons from iconList by default, each as a button with metadata displayName", () => {
    render(<IconPicker value="openai" onValueChange={vi.fn()} />);

    // Each icon renders a button titled with its display name (uppercased by mock)
    expect(screen.getByTitle("CLAUDE")).toBeInTheDocument();
    expect(screen.getByTitle("OPENAI")).toBeInTheDocument();
    expect(screen.getByTitle("GEMINI")).toBeInTheDocument();
    expect(screen.getByTitle("DEEPSEEK")).toBeInTheDocument();
  });

  it("marks the selected icon button with the selected border class", () => {
    const { container } = render(
      <IconPicker value="gemini" onValueChange={vi.fn()} />,
    );

    const buttons = container.querySelectorAll("button");
    const selectedBtn = screen.getByTitle("GEMINI");
    expect(selectedBtn).toHaveClass("border-primary", "bg-primary/10");

    const unselectedBtn = screen.getByTitle("CLAUDE");
    expect(unselectedBtn).not.toHaveClass("border-primary");
  });

  it("clicking an icon button calls onValueChange with the icon name", () => {
    const onValueChange = vi.fn();
    render(<IconPicker onValueChange={onValueChange} />);

    fireEvent.click(screen.getByTitle("DEEPSEEK"));
    expect(onValueChange).toHaveBeenCalledWith("deepseek");
  });

  it("filters icons via searchIcons when a search query is entered", () => {
    searchIconsMock.mockReturnValue(["claude"]);

    render(<IconPicker onValueChange={vi.fn()} />);

    const searchInput = screen.getByLabelText("搜索图标");
    fireEvent.change(searchInput, { target: { value: "claud" } });

    expect(searchIconsMock).toHaveBeenCalledWith("claud");
    // Only claude should remain
    expect(screen.getByTitle("CLAUDE")).toBeInTheDocument();
    expect(screen.queryByTitle("OPENAI")).not.toBeInTheDocument();
  });

  it("shows the no-results message when search returns empty", () => {
    searchIconsMock.mockReturnValue([]);

    render(<IconPicker onValueChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("搜索图标"), {
      target: { value: "zzz",
      },
    });

    expect(screen.getByText("未找到匹配的图标")).toBeInTheDocument();
  });

  it("does not show the no-results message when icons are present", () => {
    render(<IconPicker onValueChange={vi.fn()} />);
    expect(screen.queryByText("未找到匹配的图标")).not.toBeInTheDocument();
  });
});
