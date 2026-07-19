import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  UpdateProvider,
  useUpdate,
} from "@/contexts/UpdateContext";

const checkForUpdateMock = vi.fn();
vi.mock("@/lib/updater", () => ({
  checkForUpdate: (...args: unknown[]) => checkForUpdateMock(...args),
}));

const isTauriRuntimeMock = vi.fn();
vi.mock("@/lib/tauri-runtime", () => ({
  isTauriRuntime: () => isTauriRuntimeMock(),
}));

// ---- Test consumer that exposes context values via DOM ----
let ctxRef: ReturnType<typeof useUpdate> | null = null;
function TestConsumer() {
  ctxRef = useUpdate();
  return (
    <div>
      <span data-testid="hasUpdate">{String(ctxRef.hasUpdate)}</span>
      <span data-testid="isDismissed">{String(ctxRef.isDismissed)}</span>
      <span data-testid="isChecking">{String(ctxRef.isChecking)}</span>
      <span data-testid="error">{ctxRef.error ?? ""}</span>
      <button
        data-testid="btn-check"
        onClick={() => {
          void ctxRef!.checkUpdate().catch(() => {});
        }}
      />
      <button
        data-testid="btn-dismiss"
        onClick={() => ctxRef!.dismissUpdate()}
      />
      <button
        data-testid="btn-reset"
        onClick={() => ctxRef!.resetDismiss()}
      />
    </div>
  );
}

function ThrowingConsumer() {
  useUpdate();
  return null;
}

function renderProvider() {
  return render(
    <UpdateProvider>
      <TestConsumer />
    </UpdateProvider>,
  );
}

describe("UpdateContext", () => {
  beforeEach(() => {
    checkForUpdateMock.mockReset();
    isTauriRuntimeMock.mockReset();
    isTauriRuntimeMock.mockReturnValue(true);
    localStorage.clear();
    ctxRef = null;
  });

  it("throws when useUpdate is called outside UpdateProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ThrowingConsumer />)).toThrow(
      "useUpdate must be used within UpdateProvider",
    );
    spy.mockRestore();
  });

  it("checkUpdate sets hasUpdate=true when an update is available", async () => {
    checkForUpdateMock.mockResolvedValue({
      status: "available",
      info: {
        currentVersion: "1.0.0",
        availableVersion: "1.1.0",
      },
    });

    renderProvider();
    expect(screen.getByTestId("hasUpdate").textContent).toBe("false");

    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-check"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("hasUpdate").textContent).toBe("true");
    });
  });

  it("checkUpdate sets hasUpdate=false when already up-to-date", async () => {
    checkForUpdateMock.mockResolvedValue({ status: "up-to-date" });

    renderProvider();

    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-check"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("hasUpdate").textContent).toBe("false");
    });
    expect(screen.getByTestId("isDismissed").textContent).toBe("false");
  });

  it("dismissUpdate persists the dismissed version to localStorage", async () => {
    checkForUpdateMock.mockResolvedValue({
      status: "available",
      info: {
        currentVersion: "1.0.0",
        availableVersion: "2.0.0",
      },
    });

    renderProvider();

    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-check"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("hasUpdate").textContent).toBe("true");
    });

    fireEvent.click(screen.getByTestId("btn-dismiss"));
    await waitFor(() => {
      expect(screen.getByTestId("isDismissed").textContent).toBe("true");
    });
    expect(localStorage.getItem("ezsphere:update:dismissedVersion")).toBe(
      "2.0.0",
    );
  });

  it("resetDismiss clears localStorage and resets isDismissed", async () => {
    checkForUpdateMock.mockResolvedValue({
      status: "available",
      info: {
        currentVersion: "1.0.0",
        availableVersion: "2.0.0",
      },
    });

    renderProvider();

    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-check"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("hasUpdate").textContent).toBe("true");
    });

    fireEvent.click(screen.getByTestId("btn-dismiss"));
    await waitFor(() => {
      expect(screen.getByTestId("isDismissed").textContent).toBe("true");
    });

    fireEvent.click(screen.getByTestId("btn-reset"));
    await waitFor(() => {
      expect(screen.getByTestId("isDismissed").textContent).toBe("false");
    });
    expect(localStorage.getItem("ezsphere:update:dismissedVersion")).toBeNull();
  });

  it("returns false without calling checkForUpdate when not in Tauri runtime", async () => {
    isTauriRuntimeMock.mockReturnValue(false);

    renderProvider();

    await act(async () => {
      fireEvent.click(screen.getByTestId("btn-check"));
    });

    expect(screen.getByTestId("hasUpdate").textContent).toBe("false");
    expect(checkForUpdateMock).not.toHaveBeenCalled();
  });
});
