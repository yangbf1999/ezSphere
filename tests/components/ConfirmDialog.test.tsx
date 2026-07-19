import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConfirmDialog } from "@/components/ConfirmDialog";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

beforeEach(() => {
  vi.useRealTimers();
});

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const props = {
    isOpen: true,
    title: "Delete provider?",
    message: "This action cannot be undone.",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<ConfirmDialog {...props} />) };
}

describe("ConfirmDialog", () => {
  it("renders title and message when open", () => {
    renderDialog();
    expect(screen.getByText("Delete provider?")).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone."),
    ).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByText("Delete provider?")).not.toBeInTheDocument();
  });

  it("uses default confirm/cancel text from i18n when not provided", () => {
    renderDialog();
    expect(screen.getByText("common.confirm")).toBeInTheDocument();
    expect(screen.getByText("common.cancel")).toBeInTheDocument();
  });

  it("uses custom confirm/cancel text when provided", () => {
    renderDialog({ confirmText: "Delete it", cancelText: "Keep it" });
    expect(screen.getByText("Delete it")).toBeInTheDocument();
    expect(screen.getByText("Keep it")).toBeInTheDocument();
  });

  it("cancel button calls onCancel", () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    fireEvent.click(screen.getByText("common.cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("confirm button calls onConfirm with false when no checkbox is shown", async () => {
    const onConfirm = vi.fn();
    renderDialog({ onConfirm });
    fireEvent.click(screen.getByText("common.confirm"));
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it("shows a checkbox when checkboxLabel is provided and passes checked state to onConfirm", () => {
    const onConfirm = vi.fn();
    renderDialog({
      checkboxLabel: "Also delete config files",
      onConfirm,
    });

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    // Check the checkbox
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByText("common.confirm"));
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it("does not render a checkbox when checkboxLabel is absent", () => {
    renderDialog();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("confirm button is disabled while confirming (prevents double-fire within debounce window)", async () => {
    const onConfirm = vi.fn(async () => {
      // simulate async work
    });
    renderDialog({ onConfirm, confirmDebounceMs: 1000 });

    const confirmBtn = screen.getByText("common.confirm").closest("button")!;
    fireEvent.click(confirmBtn);
    // While confirming, the button should be disabled
    expect(confirmBtn).toBeDisabled();

    // A second click should not fire onConfirm again
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders info variant with default (non-destructive) confirm button", () => {
    renderDialog({ variant: "info" });
    // The confirm button in info variant uses "default" variant class
    const confirmBtn = screen.getByText("common.confirm").closest("button")!;
    expect(confirmBtn).not.toHaveClass("ez-btn--danger-solid");
  });

  it("resets checkbox and confirming state when reopened", () => {
    const { rerender } = render(
      <ConfirmDialog
        isOpen
        title="T"
        message="M"
        checkboxLabel="ack"
        checkboxDefaultChecked
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox")).toBeChecked();

    // Close
    rerender(
      <ConfirmDialog
        isOpen={false}
        title="T"
        message="M"
        checkboxLabel="ack"
        checkboxDefaultChecked
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    // Reopen - checkbox should be checked again (reset on open)
    rerender(
      <ConfirmDialog
        isOpen
        title="T"
        message="M"
        checkboxLabel="ack"
        checkboxDefaultChecked
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
