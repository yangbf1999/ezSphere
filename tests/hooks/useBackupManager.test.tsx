import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useBackupManager } from "@/hooks/useBackupManager";
import { createTestQueryClient } from "../utils/testQueryClient";

const listDbBackupsMock = vi.fn();
const createDbBackupMock = vi.fn();
const restoreDbBackupMock = vi.fn();
const renameDbBackupMock = vi.fn();
const deleteDbBackupMock = vi.fn();

vi.mock("@/lib/api", () => ({
  backupsApi: {
    listDbBackups: (...args: unknown[]) => listDbBackupsMock(...args),
    createDbBackup: (...args: unknown[]) => createDbBackupMock(...args),
    restoreDbBackup: (...args: unknown[]) => restoreDbBackupMock(...args),
    renameDbBackup: (...args: unknown[]) => renameDbBackupMock(...args),
    deleteDbBackup: (...args: unknown[]) => deleteDbBackupMock(...args),
  },
}));

interface WrapperProps {
  children: ReactNode;
}

function createWrapper() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  return { wrapper, queryClient };
}

const mockBackups = [
  { filename: "backup-001.db", sizeBytes: 1024, createdAt: "2026-01-01T00:00:00Z" },
  { filename: "backup-002.db", sizeBytes: 2048, createdAt: "2026-01-02T00:00:00Z" },
];

describe("useBackupManager", () => {
  beforeEach(() => {
    listDbBackupsMock.mockReset();
    createDbBackupMock.mockReset();
    restoreDbBackupMock.mockReset();
    renameDbBackupMock.mockReset();
    deleteDbBackupMock.mockReset();

    listDbBackupsMock.mockResolvedValue(mockBackups);
    createDbBackupMock.mockResolvedValue("backup-003.db");
    restoreDbBackupMock.mockResolvedValue("restored");
    renameDbBackupMock.mockResolvedValue("renamed");
    deleteDbBackupMock.mockResolvedValue(undefined);
  });

  it("loads backup list on mount", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBackupManager(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(listDbBackupsMock).toHaveBeenCalledTimes(1);
    expect(result.current.backups).toEqual(mockBackups);
  });

  it("create mutation calls createDbBackup and refetches list", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBackupManager(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.create();
    });

    expect(createDbBackupMock).toHaveBeenCalledTimes(1);
    // refetch should call listDbBackups again
    expect(listDbBackupsMock).toHaveBeenCalledTimes(2);
  });

  it("restore mutation calls restoreDbBackup, invalidates all queries and refetches", async () => {
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useBackupManager(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.restore("backup-001.db");
    });

    expect(restoreDbBackupMock).toHaveBeenCalledWith("backup-001.db");
    // invalidateQueries() called with no args (invalidates all)
    expect(invalidateSpy).toHaveBeenCalledWith();
    // refetch list (invalidation + explicit refetch both trigger listDbBackups)
    expect(listDbBackupsMock).toHaveBeenCalledTimes(3);
  });

  it("rename mutation calls renameDbBackup and refetches list", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBackupManager(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.rename({
        oldFilename: "backup-001.db",
        newName: "renamed.db",
      });
    });

    expect(renameDbBackupMock).toHaveBeenCalledWith(
      "backup-001.db",
      "renamed.db",
    );
    expect(listDbBackupsMock).toHaveBeenCalledTimes(2);
  });

  it("delete mutation calls deleteDbBackup and refetches list", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBackupManager(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.remove("backup-001.db");
    });

    expect(deleteDbBackupMock).toHaveBeenCalledWith("backup-001.db");
    expect(listDbBackupsMock).toHaveBeenCalledTimes(2);
  });

  it("exposes isCreating/isRestoring/isRenaming/isDeleting flags", async () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useBackupManager(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isCreating).toBe(false);
    expect(result.current.isRestoring).toBe(false);
    expect(result.current.isRenaming).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });
});
