import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const updateState = {
  hasUpdate: false,
  updateInfo: null as { availableVersion: string } | null,
};

vi.mock("@/contexts/UpdateContext", () => ({
  useUpdate: () => ({
    get hasUpdate() {
      return updateState.hasUpdate;
    },
    get updateInfo() {
      return updateState.updateInfo;
    },
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, opts?: any) => {
    if (opts && typeof opts === "object" && "version" in opts) {
      return `${k}:${opts.version}`;
    }
    return k;
  }}),
}));

import { UpdateBadge } from "@/components/UpdateBadge";

describe("UpdateBadge", () => {
  beforeEach(() => {
    updateState.hasUpdate = false;
    updateState.updateInfo = null;
  });

  it("renders nothing when there is no update", () => {
    const { container } = render(<UpdateBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when hasUpdate is true but updateInfo is null", () => {
    updateState.hasUpdate = true;
    updateState.updateInfo = null;
    const { container } = render(<UpdateBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a button with versioned title/aria-label when an update is available", () => {
    updateState.hasUpdate = true;
    updateState.updateInfo = { availableVersion: "2.0.0" };
    render(<UpdateBadge />);

    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("title", "settings.updateAvailable:2.0.0");
    expect(btn).toHaveAttribute("aria-label", "settings.updateAvailable:2.0.0");
  });

  it("fires onClick when the badge button is clicked", () => {
    updateState.hasUpdate = true;
    updateState.updateInfo = { availableVersion: "2.0.0" };
    const onClick = vi.fn();
    render(<UpdateBadge onClick={onClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("merges a custom className onto the button", () => {
    updateState.hasUpdate = true;
    updateState.updateInfo = { availableVersion: "3.1.0" };
    render(<UpdateBadge className="my-custom" />);

    expect(screen.getByRole("button")).toHaveClass("my-custom");
  });
});
