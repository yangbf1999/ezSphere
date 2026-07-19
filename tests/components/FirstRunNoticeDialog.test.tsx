import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";

const settingsRef: { value: any } = { value: undefined };
const saveMock = vi.fn();

vi.mock("@/lib/query", () => ({
  useSettingsQuery: () => ({ data: settingsRef.value }),
}));

vi.mock("@/lib/api", () => ({
  settingsApi: {
    save: (...args: unknown[]) => saveMock(...args),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

import { FirstRunNoticeDialog } from "@/components/FirstRunNoticeDialog";

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  settingsRef.value = undefined;
  saveMock.mockReset();
});

describe("FirstRunNoticeDialog", () => {
  it("renders nothing when settings is null (not loaded yet)", () => {
    settingsRef.value = undefined;
    renderWithQueryClient(<FirstRunNoticeDialog />);
    expect(screen.queryByText("firstRunNotice.title")).not.toBeInTheDocument();
  });

  it("renders the dialog when firstRunNoticeConfirmed is not true", () => {
    settingsRef.value = {
      showInTray: true,
      minimizeToTrayOnClose: false,
      firstRunNoticeConfirmed: false,
    };
    renderWithQueryClient(<FirstRunNoticeDialog />);

    expect(screen.getByText("firstRunNotice.title")).toBeInTheDocument();
    expect(screen.getByText("firstRunNotice.bodyDefault")).toBeInTheDocument();
    expect(screen.getByText("firstRunNotice.bodyOfficial")).toBeInTheDocument();
    expect(screen.getByText("firstRunNotice.confirm")).toBeInTheDocument();
  });

  it("does not render when firstRunNoticeConfirmed is true", () => {
    settingsRef.value = {
      showInTray: true,
      minimizeToTrayOnClose: false,
      firstRunNoticeConfirmed: true,
    };
    renderWithQueryClient(<FirstRunNoticeDialog />);
    expect(screen.queryByText("firstRunNotice.title")).not.toBeInTheDocument();
  });

  it("confirm button calls settingsApi.save with firstRunNoticeConfirmed: true", async () => {
    settingsRef.value = {
      showInTray: true,
      minimizeToTrayOnClose: false,
      firstRunNoticeConfirmed: false,
      webdavSync: { enabled: false },
    };
    saveMock.mockResolvedValue(true);

    renderWithQueryClient(<FirstRunNoticeDialog />);

    fireEvent.click(screen.getByText("firstRunNotice.confirm"));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));

    const saved = saveMock.mock.calls[0][0];
    expect(saved.firstRunNoticeConfirmed).toBe(true);
    // webdavSync should be stripped out
    expect(saved.webdavSync).toBeUndefined();
  });
});
