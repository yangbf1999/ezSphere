import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, fallbackOrOpts?: any) => {
      if (typeof fallbackOrOpts === "string") return fallbackOrOpts;
      if (fallbackOrOpts && "defaultValue" in fallbackOrOpts)
        return fallbackOrOpts.defaultValue;
      return k;
    },
  }),
}));

import { ColorPicker } from "@/components/ColorPicker";

describe("ColorPicker", () => {
  it("renders the default label when none provided", () => {
    render(<ColorPicker value="#4285F4" onValueChange={vi.fn()} />);
    expect(screen.getByText("图标颜色")).toBeInTheDocument();
  });

  it("renders a custom label when provided", () => {
    render(
      <ColorPicker value="#4285F4" onValueChange={vi.fn()} label="Brand color" />,
    );
    expect(screen.getByText("Brand color")).toBeInTheDocument();
  });

  it("renders one preset swatch button per preset and marks the selected one", () => {
    const presets = ["#00A67E", "#D4915D", "#4285F4"];
    render(
      <ColorPicker
        value="#4285F4"
        onValueChange={vi.fn()}
        presets={presets}
      />,
    );

    const swatches = screen.getAllByRole("button");
    // 3 preset swatches (color input is type=color, text input is type=text - both are <input>)
    const presetBtns = swatches.filter((b) => b.title);
    expect(presetBtns).toHaveLength(3);

    const selected = screen.getByLabelText("#4285F4");
    expect(selected).toHaveClass("border-primary");
  });

  it("clicking a preset swatch fires onValueChange with that color", () => {
    const onValueChange = vi.fn();
    render(
      <ColorPicker
        value="#4285F4"
        onValueChange={onValueChange}
        presets={["#00A67E", "#4285F4"]}
      />,
    );

    fireEvent.click(screen.getByLabelText("#00A67E"));
    expect(onValueChange).toHaveBeenCalledWith("#00A67E");
  });

  it("typing in the hex text input fires onValueChange with the typed value", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#4285F4" onValueChange={onValueChange} />);

    const hexInput = screen.getByLabelText("颜色十六进制值");
    fireEvent.change(hexInput, { target: { value: "#FF0000" } });
    expect(onValueChange).toHaveBeenCalledWith("#FF0000");
  });

  it("changing the native color input fires onValueChange", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#4285F4" onValueChange={onValueChange} />);

    const colorInput = screen.getByLabelText("自定义颜色");
    fireEvent.change(colorInput, { target: { value: "#00ff00" } });
    expect(onValueChange).toHaveBeenCalledWith("#00ff00");
  });
});
