import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  ITermIcon,
  AlacrittyIcon,
  WezTermIcon,
  GhosttyIcon,
  KittyIcon,
} from "@/components/icons/TerminalIcons";

function renderSvg(Comp: React.FC<React.SVGProps<SVGSVGElement>>) {
  const { container } = render(<Comp data-testid="svg" />);
  return container.querySelector("svg")!;
}

describe("TerminalIcons", () => {
  it("ITermIcon renders an svg with iTerm2 title", () => {
    const svg = renderSvg(ITermIcon);
    expect(svg).toBeInTheDocument();
    expect(svg.querySelector("title")!.textContent).toBe("iTerm2");
  });

  it("AlacrittyIcon renders an svg with Alacritty title", () => {
    const svg = renderSvg(AlacrittyIcon);
    expect(svg.querySelector("title")!.textContent).toBe("Alacritty");
  });

  it("WezTermIcon renders an svg with WezTerm title", () => {
    const svg = renderSvg(WezTermIcon);
    expect(svg.querySelector("title")!.textContent).toBe("WezTerm");
  });

  it("GhosttyIcon renders an svg with Ghostty title", () => {
    const svg = renderSvg(GhosttyIcon);
    expect(svg.querySelector("title")!.textContent).toBe("Ghostty");
  });

  it("KittyIcon renders an svg element", () => {
    const svg = renderSvg(KittyIcon);
    expect(svg).toBeInTheDocument();
    // Kitty has a complex multi-path icon; just verify the svg rendered with a viewBox
    expect(svg.getAttribute("viewBox")).toBe("0 0 240 240");
  });

  it("forwards extra props like className onto the svg root", () => {
    const { container } = render(<ITermIcon className="w-5 h-5" />);
    expect(container.querySelector("svg")).toHaveClass("w-5", "h-5");
  });
});
