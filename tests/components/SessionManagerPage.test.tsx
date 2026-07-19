import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionManagerPage } from "@/components/sessions/SessionManagerPage";
import { sessionsApi } from "@/lib/api/sessions";
import type { SessionMessage, SessionMeta } from "@/types";
import { setSessionFixtures } from "../msw/state";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/components/sessions/SessionToc", () => ({
  SessionTocSidebar: () => null,
  SessionTocDialog: () => null,
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: ({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onCancel}>{cancelText}</button>
      </div>
    ) : null,
}));

const renderPage = (layout: "default" | "shell" = "shell") => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <SessionManagerPage appId="codex" layout={layout} />
      </QueryClientProvider>,
    ),
  };
};

const selectedSessionTitle = () => document.querySelector(".detail-title");

const searchSessions = (value: string) => {
  const searchInput = screen
    .getAllByPlaceholderText("sessionManager.searchPlaceholder")
    .find((input) => !input.hasAttribute("readonly"));
  if (!searchInput) throw new Error("Editable session search input not found");
  fireEvent.change(
    searchInput,
    { target: { value } },
  );
};

const firstButton = (name: string | RegExp) =>
  screen.getAllByRole("button", { name })[0];

const deleteSelectedSession = () => {
  const button = document.querySelector<HTMLButtonElement>(
    ".detail-head .btn-danger",
  );
  if (!button) throw new Error("Selected session delete button not found");
  fireEvent.click(button);
};

describe("SessionManagerPage", () => {
  beforeEach(() => {
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    Element.prototype.scrollIntoView = vi.fn();

    const sessions: SessionMeta[] = [
      {
        providerId: "codex",
        sessionId: "codex-session-1",
        title: "Alpha Session",
        summary: "Alpha summary",
        projectDir: "/mock/codex",
        createdAt: 2,
        lastActiveAt: 20,
        sourcePath: "/mock/codex/session-1.jsonl",
        resumeCommand: "codex resume codex-session-1",
      },
      {
        providerId: "codex",
        sessionId: "codex-session-2",
        title: "Beta Session",
        summary: "Beta summary",
        projectDir: "/mock/codex",
        createdAt: 1,
        lastActiveAt: 10,
        sourcePath: "/mock/codex/session-2.jsonl",
        resumeCommand: "codex resume codex-session-2",
      },
    ];
    const messages: Record<string, SessionMessage[]> = {
      "codex:/mock/codex/session-1.jsonl": [
        { role: "user", content: "alpha", ts: 20 },
      ],
      "codex:/mock/codex/session-2.jsonl": [
        { role: "user", content: "beta", ts: 10 },
      ],
    };

    setSessionFixtures(sessions, messages);
  });

  it("deletes the selected session and selects the next visible session", async () => {
    renderPage();

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    deleteSelectedSession();

    const dialog = screen.getByTestId("confirm-dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Alpha Session/)).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: /删除会话/i }));

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Beta Session"),
    );

    expect(screen.queryByText("Alpha Session")).not.toBeInTheDocument();
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("removes a deleted session from filtered search results", async () => {
    renderPage();

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    searchSessions("Alpha");

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    deleteSelectedSession();

    const dialog = screen.getByTestId("confirm-dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /删除会话/i }));

    await waitFor(() =>
      expect(screen.queryByText("Alpha Session")).not.toBeInTheDocument(),
    );

    expect(
      screen.getByText("sessionManager.selectSession"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("sessionManager.emptySession"),
    ).not.toBeInTheDocument();
    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("restores batch delete controls when deleteMany rejects", async () => {
    const deleteManySpy = vi
      .spyOn(sessionsApi, "deleteMany")
      .mockRejectedValueOnce(new Error("network error"));

    renderPage();

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    fireEvent.click(firstButton(/批量管理/i));
    fireEvent.click(firstButton(/全选当前/i));
    fireEvent.click(firstButton(/批量删除/i));

    const dialog = screen.getByTestId("confirm-dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /删除所选会话/i }),
    );

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("network error"),
    );

    await waitFor(() =>
      expect(
        firstButton(/批量删除/i),
      ).not.toBeDisabled(),
    );

    deleteManySpy.mockRestore();
  });

  it("keeps the exit batch mode button visible when search hides all sessions", async () => {
    renderPage();

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    fireEvent.click(firstButton(/批量管理/i));
    searchSessions("NoSuchSession");

    await waitFor(() => expect(screen.queryByText("Alpha Session")).toBeNull());

    expect(firstButton(/退出批量管理/i)).toBeVisible();
  });

  it("drops hidden selections when search narrows the result set", async () => {
    renderPage();

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    fireEvent.click(firstButton(/批量管理/i));
    fireEvent.click(firstButton(/全选当前/i));

    expect(screen.getByText("已选 2 项")).toBeInTheDocument();

    searchSessions("Alpha");

    await waitFor(() =>
      expect(screen.queryByText("Beta Session")).not.toBeInTheDocument(),
    );

    searchSessions("");

    await waitFor(() =>
      expect(screen.getByText("已选 1 项")).toBeInTheDocument(),
    );
  });

  it("removes successfully deleted sessions from the UI before refetch completes", async () => {
    const view = renderPage();
    let resolveInvalidate!: () => void;
    const invalidateSpy = vi
      .spyOn(view.client, "invalidateQueries")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveInvalidate = () => resolve(undefined);
          }),
      );

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    fireEvent.click(firstButton(/批量管理/i));
    fireEvent.click(firstButton(/全选当前/i));
    fireEvent.click(firstButton(/批量删除/i));

    const dialog = screen.getByTestId("confirm-dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: /删除所选会话/i }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Alpha Session")).not.toBeInTheDocument();
      expect(screen.queryByText("Beta Session")).not.toBeInTheDocument();
    });

    await act(async () => {
      resolveInvalidate();
    });
    invalidateSpy.mockRestore();
  });

  it("switches provider filters with the keyboard and selects another session", async () => {
    renderPage();

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    const tabs = screen.getAllByRole("tab");
    const codexTab = tabs.find((tab) => tab.textContent?.includes("Codex"));
    if (!codexTab) throw new Error("Codex provider tab not found");
    fireEvent.keyDown(codexTab, { key: "Home" });
    expect(tabs[0]).toHaveFocus();
    fireEvent.keyDown(tabs[0], { key: "End" });
    expect(tabs[tabs.length - 1]).toHaveFocus();
    fireEvent.keyDown(tabs[tabs.length - 1], { key: "ArrowRight" });
    expect(tabs[0]).toHaveFocus();

    fireEvent.click(screen.getByText("Beta Session"));
    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Beta Session"),
    );

    fireEvent.click(firstButton("common.refresh"));
    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Beta Session"),
    );
  });

  it("copies and resumes the selected session command", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderPage();

    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    fireEvent.click(firstButton("sessionManager.copyCommand"));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("codex resume codex-session-1"),
    );

    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("toggles individual and all batch selections and exits cleanly", async () => {
    renderPage();
    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    fireEvent.click(firstButton("批量管理"));
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText(/已选\s*1\s*项/)).toBeInTheDocument();

    fireEvent.click(firstButton("全选当前"));
    expect(screen.getByText(/已选\s*2\s*项/)).toBeInTheDocument();
    fireEvent.click(firstButton("取消全选"));
    expect(screen.getByText(/已选\s*0\s*项/)).toBeInTheDocument();

    fireEvent.click(firstButton("退出批量管理"));
    expect(screen.queryByText(/已选\s*0\s*项/)).not.toBeInTheDocument();
  });

  it("opens search from the keyboard and cancels a delete confirmation", async () => {
    renderPage();
    await waitFor(() =>
      expect(selectedSessionTitle()).toHaveTextContent("Alpha Session"),
    );

    fireEvent.keyDown(window, { key: "f", ctrlKey: true });
    await waitFor(() =>
      expect(
        screen
          .getAllByPlaceholderText("sessionManager.searchPlaceholder")
          .some((input) => document.activeElement === input),
      ).toBe(true),
    );

    deleteSelectedSession();
    const dialog = screen.getByTestId("confirm-dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));
    expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    expect(screen.getAllByText("Alpha Session")).not.toHaveLength(0);
  });

  it("supports the default layout search, filters, message copy and wheel boundaries", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { container } = renderPage("default");
    await screen.findAllByText("Alpha Session");
    fireEvent.click(screen.getByRole("button", { name: "common.search" }));

    const editableSearches = screen
      .getAllByPlaceholderText("sessionManager.searchPlaceholder")
      .filter((input) => !input.hasAttribute("readonly"));
    for (const input of editableSearches) {
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: "Alpha" } });
      fireEvent.keyDown(input, { key: "Enter" });
      fireEvent.keyDown(input, { key: "Escape" });
      fireEvent.blur(input);
    }

    for (const tab of screen.queryAllByRole("tab")) {
      fireEvent.click(tab);
      fireEvent.keyDown(tab, { key: "ArrowLeft" });
    }
    fireEvent.click(screen.getAllByText("Alpha Session")[0]);

    for (const button of screen.queryAllByRole("button", {
      name: "sessionManager.copyCommand",
    })) {
      fireEvent.click(button);
    }
    for (const button of screen.queryAllByRole("button", {
      name: "common.copy",
    })) {
      fireEvent.click(button);
    }
    await waitFor(() => expect(writeText).toHaveBeenCalled());

    const root = container.firstElementChild?.firstElementChild;
    if (root) fireEvent.wheel(root);
    const sessionList = container.querySelector(".sess-list");
    if (sessionList) fireEvent.wheel(sessionList);

    for (const button of screen.queryAllByRole("button", {
      name: "common.refresh",
    })) {
      fireEvent.click(button);
    }

    fireEvent.click(firstButton(/批量管理/));
    for (const checkbox of screen.getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    fireEvent.click(firstButton(/取消全选/));
    fireEvent.click(firstButton(/全选当前/));
    fireEvent.click(firstButton(/取消全选/));
    fireEvent.click(firstButton(/退出批量管理/));
  });
});
