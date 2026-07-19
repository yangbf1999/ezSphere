import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mock the .svg?url imports so we don't depend on Vite asset resolution in jsdom.
vi.mock("@/icons/extracted/claude.svg?url", () => ({ default: "claude.svg" }));
vi.mock("@/icons/extracted/openai.svg?url", () => ({ default: "openai.svg" }));
vi.mock("@/icons/extracted/gemini.svg?url", () => ({ default: "gemini.svg" }));
vi.mock("@/icons/extracted/claw.svg?url", () => ({ default: "claw.svg" }));

import {
  ClaudeIcon,
  CodexIcon,
  GeminiIcon,
  OpenClawIcon,
  McpIcon,
} from "@/components/BrandIcons";

describe("BrandIcons", () => {
  it("ClaudeIcon renders an img with src, alt and default size", () => {
    const { container } = render(<ClaudeIcon />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "Claude");
    expect(img).toHaveAttribute("src", "claude.svg");
    expect(img).toHaveAttribute("width", "16");
    expect(img).toHaveAttribute("height", "16");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("ClaudeIcon forwards size and className", () => {
    const { container } = render(<ClaudeIcon size={32} className="brand" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("width", "32");
    expect(img).toHaveAttribute("height", "32");
    expect(img).toHaveClass("brand");
  });

  it("CodexIcon renders with dark-mode invert classes", () => {
    const { container } = render(<CodexIcon />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "Codex");
    expect(img).toHaveClass("dark:brightness-0", "dark:invert");
  });

  it("GeminiIcon and OpenClawIcon render imgs with correct alt", () => {
    const { container: geminiContainer } = render(<GeminiIcon size={20} />);
    expect(geminiContainer.querySelector("img")!).toHaveAttribute("alt", "Gemini");

    const { container: clawContainer } = render(<OpenClawIcon />);
    expect(clawContainer.querySelector("img")!).toHaveAttribute("alt", "OpenClaw");
  });

  it("McpIcon renders an inline svg with currentColor fill and viewBox", () => {
    const { container } = render(<McpIcon size={24} className="mcp" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("fill", "currentColor");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
    expect(svg).toHaveClass("mcp");
    // Should contain at least one path
    expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
