import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnvWarningBanner } from "@/components/env/EnvWarningBanner";
import type { EnvConflict } from "@/types/env";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

const deleteEnvVarsMock = vi.fn();
vi.mock("@/lib/api/env", () => ({
  deleteEnvVars: (...args: unknown[]) => deleteEnvVarsMock(...args),
}));

// Radix Checkbox needs PointerEvent; stub as a native checkbox for jsdom.
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ id, checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={!!checked}
      onChange={() => onCheckedChange?.(!checked)}
      data-testid={`cb-${id}`}
    />
  ),
}));

function makeConflict(
  overrides: Partial<EnvConflict> = {},
): EnvConflict {
  return {
    varName: overrides.varName ?? "ANTHROPIC_API_KEY",
    varValue: overrides.varValue ?? "sk-test",
    sourceType: overrides.sourceType ?? "system",
    sourcePath: overrides.sourcePath ?? "HKEY_CURRENT_USER\\Environment",
  };
}

describe("EnvWarningBanner", () => {
  beforeEach(() => {
    deleteEnvVarsMock.mockReset();
  });

  it("renders nothing when there are no conflicts", () => {
    const { container } = render(
      <EnvWarningBanner conflicts={[]} onDismiss={vi.fn()} onDeleted={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the warning title and conflict count when conflicts exist", () => {
    render(
      <EnvWarningBanner
        conflicts={[makeConflict(), makeConflict({ varName: "OPENAI_API_KEY" })]}
        onDismiss={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    expect(screen.getByText("env.warning.title")).toBeInTheDocument();
    // description uses t("env.warning.description", { count: 2 }) -> key only
    expect(screen.getByText("env.warning.description")).toBeInTheDocument();
  });

  it("expands to show conflict details and calls onDismiss", () => {
    const onDismiss = vi.fn();
    render(
      <EnvWarningBanner
        conflicts={[makeConflict({ varName: "FOO" })]}
        onDismiss={onDismiss}
        onDeleted={vi.fn()}
      />,
    );

    // Expand
    fireEvent.click(screen.getByText("env.actions.expand"));
    expect(screen.getByText("FOO")).toBeInTheDocument();
    // varValue is rendered alongside the "env.field.value" label
    expect(screen.getByText(/sk-test/)).toBeInTheDocument();

    // Dismiss button (icon button with aria-label)
    fireEvent.click(screen.getByLabelText("env.actions.dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("selects conflicts and deletes them via the confirm dialog", async () => {
    const onDeleted = vi.fn();
    const conflicts = [
      makeConflict({ varName: "VAR_A", sourcePath: "pathA" }),
      makeConflict({ varName: "VAR_B", sourcePath: "pathB" }),
    ];

    deleteEnvVarsMock.mockResolvedValue({
      backupPath: "/tmp/backup.json",
      timestamp: "2026-01-01",
      conflicts: [],
    });

    render(
      <EnvWarningBanner
        conflicts={conflicts}
        onDismiss={vi.fn()}
        onDeleted={onDeleted}
      />,
    );

    // Expand
    fireEvent.click(screen.getByText("env.actions.expand"));

    // Select first conflict via its checkbox
    fireEvent.click(screen.getByTestId("cb-VAR_A:pathA"));

    // Click delete-selected button
    fireEvent.click(screen.getByText("env.actions.deleteSelected"));

    // Confirm dialog appears; click the confirm button
    const confirmBtn = await screen.findByText("env.confirm.confirm");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteEnvVarsMock).toHaveBeenCalledTimes(1);
      // deleteEnvVars receives the filtered conflicts array
      const passed = deleteEnvVarsMock.mock.calls[0][0] as EnvConflict[];
      expect(passed).toHaveLength(1);
      expect(passed[0].varName).toBe("VAR_A");
    });

    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it("describes system registry vs file sources differently", () => {
    const conflicts: EnvConflict[] = [
      {
        varName: "SYS1",
        varValue: "v",
        sourceType: "system",
        sourcePath: "HKEY_CURRENT_USER\\Environment",
      },
      {
        varName: "SYS2",
        varValue: "v",
        sourceType: "system",
        sourcePath: "HKEY_LOCAL_MACHINE\\SYSTEM",
      },
      {
        varName: "FILE1",
        varValue: "v",
        sourceType: "file",
        sourcePath: "/etc/profile:10",
      },
    ];

    render(
      <EnvWarningBanner
        conflicts={conflicts}
        onDismiss={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("env.actions.expand"));

    // Each conflict row prints "env.field.source: <desc>"
    const sourceLines = screen.getAllByText(/env\.field\.source/);
    expect(sourceLines).toHaveLength(3);
    expect(sourceLines[0]).toHaveTextContent("env.source.userRegistry");
    expect(sourceLines[1]).toHaveTextContent("env.source.systemRegistry");
    expect(sourceLines[2]).toHaveTextContent("/etc/profile:10");
  });

  it("select-all checkbox selects every conflict and enables delete", () => {
    const conflicts = [
      makeConflict({ varName: "FOO", sourcePath: "p1" }),
      makeConflict({ varName: "BAR", sourcePath: "p2" }),
    ];

    render(
      <EnvWarningBanner
        conflicts={conflicts}
        onDismiss={vi.fn()}
        onDeleted={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("env.actions.expand"));

    const deleteBtn = screen.getByText("env.actions.deleteSelected");
    expect(deleteBtn).toBeDisabled();

    // select all
    fireEvent.click(screen.getByTestId("cb-select-all"));

    // both individual checkboxes checked
    expect(screen.getByTestId("cb-FOO:p1")).toBeChecked();
    expect(screen.getByTestId("cb-BAR:p2")).toBeChecked();
    expect(deleteBtn).not.toBeDisabled();
  });
});
