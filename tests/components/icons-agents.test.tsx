import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AgentsPanel } from "@/components/agents/AgentsPanel";

// TerminalIcons are covered separately in icons.test.tsx.

describe("AgentsPanel", () => {
  it("renders the coming-soon placeholder", () => {
    const { container } = render(<AgentsPanel onOpenChange={() => {}} />);
    expect(container).toHaveTextContent("Coming Soon");
    expect(container).toHaveTextContent(/under development/i);
  });
});
