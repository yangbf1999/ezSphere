import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TerminalStatusBar } from "@/components/chat/TerminalStatusBar";
import { ToolCallCard } from "@/components/chat/ToolCallCard";

vi.mock("@/hooks/useI18n", () => ({
  useI18n: () => ({ t: (k: string) => k, locale: "zh" }),
}));

describe("TerminalStatusBar", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(
      <TerminalStatusBar
        toolName="shell_exec"
        isVisible={false}
        isProcessing={true}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when not processing", () => {
    const { container } = render(
      <TerminalStatusBar
        toolName="shell_exec"
        isVisible={true}
        isProcessing={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the tool name label when visible and processing", () => {
    render(
      <TerminalStatusBar
        toolName="shell_exec"
        isVisible={true}
        isProcessing={true}
      />,
    );
    // label appears twice inside the marquee span (duplicated for scroll)
    const span = screen.getByText(/\[shell_exec\]/);
    expect(span.textContent!.match(/\[shell_exec\]/g)).toHaveLength(2);
  });

  it("falls back to textContent and shows '思考中' dots when no content", () => {
    render(
      <TerminalStatusBar
        isVisible={true}
        isProcessing={true}
      />,
    );
    expect(screen.getByText("思考中")).toBeInTheDocument();
    // three pulsing dots
    const bar = screen.getByText("思考中").parentElement!;
    expect(bar.querySelectorAll("span[class*='rounded-full']")).toHaveLength(3);
  });

  it("uses textContent as the label when toolName is absent", () => {
    render(
      <TerminalStatusBar
        textContent="running task"
        isVisible={true}
        isProcessing={true}
      />,
    );
    const span = screen.getByText(/running task/);
    expect(span.textContent!.match(/running task/g)).toHaveLength(2);
  });
});

describe("ToolCallCard", () => {
  it("renders the tool label and a preview extracted from args JSON", () => {
    render(
      <ToolCallCard
        name="shell_exec"
        args={JSON.stringify({ command: "ls -la" })}
        status="done"
      />,
    );

    expect(screen.getByText("shell")).toBeInTheDocument();
    expect(screen.getByText("ls -la")).toBeInTheDocument();
    // status label exposed via aria-label on the status span
    expect(screen.getByLabelText("mother.toolStatus.done")).toBeInTheDocument();
  });

  it("toggles open to reveal arguments and output", () => {
    render(
      <ToolCallCard
        name="file_read"
        args={JSON.stringify({ path: "/tmp/x" })}
        status="running"
        output="file contents here"
      />,
    );

    // closed initially: output not visible
    expect(screen.queryByText("file contents here")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("read"));
    expect(screen.getByText("file contents here")).toBeInTheDocument();
    // arguments pre shows the raw args
    expect(screen.getByText(JSON.stringify({ path: "/tmp/x" }))).toBeInTheDocument();
  });

  it("shows '<streaming...>' for args when args string is empty", () => {
    render(
      <ToolCallCard name="file_read" args="" status="running" />,
    );
    fireEvent.click(screen.getByText("read"));
    expect(screen.getByText("<streaming...>")).toBeInTheDocument();
  });

  it("truncates output longer than 4000 characters", () => {
    const long = "B".repeat(5000);
    render(
      <ToolCallCard
        name="file_read"
        args={JSON.stringify({ path: "/a" })}
        status="done"
        output={long}
      />,
    );
    fireEvent.click(screen.getByText("read"));
    const pres = document.querySelectorAll("pre");
    const outputPre = Array.from(pres).find((p) =>
      p.textContent!.includes("[truncated]"),
    );
    expect(outputPre).toBeDefined();
    expect(outputPre!.textContent).toContain("...");
    expect(outputPre!.textContent).toContain("[truncated]");
  });

  it("falls back to the tool name as label for unknown tools", () => {
    render(
      <ToolCallCard
        name="custom_tool"
        args="{}"
        status="failed"
      />,
    );
    expect(screen.getByText("custom_tool")).toBeInTheDocument();
    expect(screen.getByLabelText("mother.toolStatus.failed")).toBeInTheDocument();
  });
});
