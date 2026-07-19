import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";

const themeState = { theme: "light" as string, setTheme: vi.fn() };

vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    get theme() {
      return themeState.theme;
    },
    setTheme: (t: string) => themeState.setTheme(t),
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { ThemeToggle } from "@/components/ThemeToggle";
import { ModeToggle } from "@/components/mode-toggle";

describe("ThemeToggle", () => {
  it("renders three theme buttons (light/dark/system) with aria-pressed reflecting active theme", () => {
    themeState.theme = "dark";
    render(<ThemeToggle />);

    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-label", "settings.theme");

    const lightBtn = screen.getByLabelText("settings.themeLight");
    const darkBtn = screen.getByLabelText("settings.themeDark");
    const systemBtn = screen.getByLabelText("settings.themeSystem");

    expect(lightBtn).toHaveAttribute("aria-pressed", "false");
    expect(darkBtn).toHaveAttribute("aria-pressed", "true");
    expect(systemBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking a button calls setTheme with that value", () => {
    themeState.theme = "light";
    themeState.setTheme = vi.fn();
    render(<ThemeToggle />);

    fireEvent.click(screen.getByLabelText("settings.themeSystem"));
    expect(themeState.setTheme).toHaveBeenCalledWith("system");
  });

  it("applies the active class only to the active button and forwards className", () => {
    themeState.theme = "light";
    const { container } = render(<ThemeToggle className="extra-cls" />);

    expect(container.querySelector(".theme-toggle")).toHaveClass("extra-cls");

    const lightBtn = screen.getByLabelText("settings.themeLight");
    const darkBtn = screen.getByLabelText("settings.themeDark");

    expect(lightBtn).toHaveClass("active");
    expect(darkBtn).not.toHaveClass("active");
  });
});

describe("ModeToggle", () => {
  it("toggles from dark to light when current theme is dark", () => {
    themeState.theme = "dark";
    themeState.setTheme = vi.fn();
    render(<ModeToggle />);

    fireEvent.click(screen.getByRole("button"));
    expect(themeState.setTheme).toHaveBeenCalledWith("light");
  });

  it("toggles to dark when current theme is not dark (light)", () => {
    themeState.theme = "light";
    themeState.setTheme = vi.fn();
    render(<ModeToggle />);

    fireEvent.click(screen.getByRole("button"));
    expect(themeState.setTheme).toHaveBeenCalledWith("dark");
  });

  it("renders the sr-only toggle label", () => {
    themeState.theme = "light";
    render(<ModeToggle />);
    expect(screen.getByText("common.toggleTheme")).toBeInTheDocument();
  });
});
