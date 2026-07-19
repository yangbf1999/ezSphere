import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WebdavSyncSection } from "@/components/settings/WebdavSyncSection";
import type { S3SyncSettings, WebDavSyncSettings } from "@/types";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastWarningMock = vi.fn();
const toastInfoMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
    warning: (...args: unknown[]) => toastWarningMock(...args),
    info: (...args: unknown[]) => toastInfoMock(...args),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    />
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid="webdav-preset-select"
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogHeaderText: ({ children }: any) => <div>{children}</div>,
  DialogBody: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogClose: ({ children }: any) => <>{children}</>,
  DialogCloseButton: ({ children, ...props }: any) => (
    <button type="button" {...props}>{children}</button>
  ),
}));

const { settingsApiMock } = vi.hoisted(() => ({
  settingsApiMock: {
    webdavTestConnection: vi.fn(),
    webdavSyncSaveSettings: vi.fn(),
    webdavSyncFetchRemoteInfo: vi.fn(),
    webdavSyncUpload: vi.fn(),
    webdavSyncDownload: vi.fn(),
    s3TestConnection: vi.fn(),
    s3SyncSaveSettings: vi.fn(),
    s3SyncFetchRemoteInfo: vi.fn(),
    s3SyncUpload: vi.fn(),
    s3SyncDownload: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  settingsApi: settingsApiMock,
}));

const baseConfig: WebDavSyncSettings = {
  enabled: true,
  baseUrl: "https://dav.example.com/dav/",
  username: "alice",
  password: "secret",
  remoteRoot: "ezsphere-sync",
  profile: "default",
  autoSync: false,
  status: {},
};

const baseS3Config: S3SyncSettings = {
  enabled: true,
  region: "us-east-1",
  bucket: "backup-bucket",
  accessKeyId: "access-key",
  secretAccessKey: "secret-key",
  endpoint: "",
  remoteRoot: "ezsphere-sync",
  profile: "default",
  autoSync: false,
  status: {},
};

function renderSection(config?: WebDavSyncSettings, s3Config?: S3SyncSettings) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <WebdavSyncSection config={config} s3Config={s3Config} />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

describe("WebdavSyncSection", () => {
  beforeEach(() => {
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    toastWarningMock.mockReset();
    toastInfoMock.mockReset();
    settingsApiMock.webdavTestConnection.mockReset();
    settingsApiMock.webdavSyncSaveSettings.mockReset();
    settingsApiMock.webdavSyncFetchRemoteInfo.mockReset();
    settingsApiMock.webdavSyncUpload.mockReset();
    settingsApiMock.webdavSyncDownload.mockReset();
    settingsApiMock.s3TestConnection.mockReset().mockResolvedValue({ success: true });
    settingsApiMock.s3SyncSaveSettings.mockReset().mockResolvedValue({ success: true });
    settingsApiMock.s3SyncFetchRemoteInfo.mockReset().mockResolvedValue({ empty: true });
    settingsApiMock.s3SyncUpload.mockReset().mockResolvedValue({ status: "uploaded" });
    settingsApiMock.s3SyncDownload.mockReset().mockResolvedValue({ status: "downloaded" });

    settingsApiMock.webdavSyncSaveSettings.mockResolvedValue({ success: true });
    settingsApiMock.webdavTestConnection.mockResolvedValue({
      success: true,
      message: "ok",
    });
    settingsApiMock.webdavSyncFetchRemoteInfo.mockResolvedValue({
      deviceName: "My MacBook",
      createdAt: "2026-02-01T10:00:00Z",
      snapshotId: "snapshot-1",
      version: 2,
      compatible: true,
      artifacts: ["db.sql", "skills.zip"],
    });
    settingsApiMock.webdavSyncUpload.mockResolvedValue({ status: "uploaded" });
    settingsApiMock.webdavSyncDownload.mockResolvedValue({ status: "downloaded" });
  });

  it("shows auto sync error callout when last auto sync failed", () => {
    renderSection({
      ...baseConfig,
      status: {
        lastError: "network timeout",
        lastErrorSource: "auto",
      },
    });

    expect(
      screen.getByText("settings.webdavSync.autoSyncLastErrorTitle"),
    ).toBeInTheDocument();
    expect(screen.getByText("network timeout")).toBeInTheDocument();
  });

  it("does not show auto sync error callout for manual sync errors", () => {
    renderSection({
      ...baseConfig,
      status: {
        lastError: "manual upload failed",
        lastErrorSource: "manual",
      },
    });

    expect(
      screen.queryByText("settings.webdavSync.autoSyncLastErrorTitle"),
    ).not.toBeInTheDocument();
  });

  it("does not show auto sync error callout when source is missing", () => {
    renderSection({
      ...baseConfig,
      autoSync: true,
      status: {
        lastError: "legacy error without source",
      },
    });

    expect(
      screen.queryByText("settings.webdavSync.autoSyncLastErrorTitle"),
    ).not.toBeInTheDocument();
  });

  it("shows validation error when saving without base url", async () => {
    renderSection({ ...baseConfig, baseUrl: "" });

    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.save" }));

    expect(toastErrorMock).toHaveBeenCalledWith("settings.webdavSync.missingUrl");
    expect(settingsApiMock.webdavSyncSaveSettings).not.toHaveBeenCalled();
  });

  it("saves settings and auto tests connection", async () => {
    renderSection(baseConfig);

    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.save" }));

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncSaveSettings).toHaveBeenCalledTimes(1);
    });
    expect(settingsApiMock.webdavSyncSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: "https://dav.example.com/dav/",
        username: "alice",
        password: "",
        autoSync: false,
      }),
      false,
    );
    await waitFor(() => {
      expect(settingsApiMock.webdavTestConnection).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: "https://dav.example.com/dav/",
        }),
        true,
      );
    });
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "settings.webdavSync.saveAndTestSuccess",
    );
  });

  it("preserves password only for the single post-save refresh", async () => {
    const view = renderSection(baseConfig);

    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.save" }));

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncSaveSettings).toHaveBeenCalledTimes(1);
    });

    view.rerender(
      <QueryClientProvider client={view.client}>
        <WebdavSyncSection config={{ ...baseConfig, password: "" }} />
      </QueryClientProvider>,
    );

    expect(
      (
        screen.getByPlaceholderText(
          "settings.webdavSync.passwordPlaceholder",
        ) as HTMLInputElement
      ).value,
    ).toBe("secret");

    view.rerender(
      <QueryClientProvider client={view.client}>
        <WebdavSyncSection config={{ ...baseConfig, password: "" }} />
      </QueryClientProvider>,
    );

    expect(
      (
        screen.getByPlaceholderText(
          "settings.webdavSync.passwordPlaceholder",
        ) as HTMLInputElement
      ).value,
    ).toBe("");
  });

  it("does not preserve password after a later external config refresh", async () => {
    const view = renderSection(baseConfig);

    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.save" }));

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncSaveSettings).toHaveBeenCalledTimes(1);
    });

    view.rerender(
      <QueryClientProvider client={view.client}>
        <WebdavSyncSection config={{ ...baseConfig, password: "" }} />
      </QueryClientProvider>,
    );

    expect(
      (
        screen.getByPlaceholderText(
          "settings.webdavSync.passwordPlaceholder",
        ) as HTMLInputElement
      ).value,
    ).toBe("secret");

    view.rerender(
      <QueryClientProvider client={view.client}>
        <WebdavSyncSection
          config={{ ...baseConfig, username: "bob", password: "" }}
        />
      </QueryClientProvider>,
    );

    expect(
      (
        screen.getByPlaceholderText(
          "settings.webdavSync.passwordPlaceholder",
        ) as HTMLInputElement
      ).value,
    ).toBe("");
  });

  it("does not submit a preserved password again when testing without touching it", async () => {
    const view = renderSection(baseConfig);

    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.save" }));

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncSaveSettings).toHaveBeenCalledTimes(1);
    });

    view.rerender(
      <QueryClientProvider client={view.client}>
        <WebdavSyncSection config={{ ...baseConfig, password: "" }} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.test" }));

    await waitFor(() => {
      expect(settingsApiMock.webdavTestConnection).toHaveBeenLastCalledWith(
        expect.objectContaining({
          password: "",
        }),
        true,
      );
    });
  });

  it("saves auto sync as true after toggle", async () => {
    renderSection(baseConfig);

    fireEvent.click(
      screen.getByRole("switch", { name: "settings.webdavSync.autoSync" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "confirm.autoSync.confirm" }),
    );
    await waitFor(() => {
      expect(
        screen.getByRole("switch", { name: "settings.webdavSync.autoSync" }),
      ).toHaveAttribute("aria-checked", "true");
    });
    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.save" }));

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          autoSync: true,
        }),
        false,
      );
    });
  });

  it("blocks upload when there are unsaved changes", async () => {
    renderSection(baseConfig);

    fireEvent.change(
      screen.getByPlaceholderText("settings.webdavSync.usernamePlaceholder"),
      { target: { value: "bob" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "settings.webdavSync.upload" }),
    );

    expect(toastErrorMock).toHaveBeenCalledWith(
      "settings.webdavSync.unsavedChanges",
    );
    expect(settingsApiMock.webdavSyncFetchRemoteInfo).not.toHaveBeenCalled();
  });

  it("disables sync buttons until config is saved", () => {
    renderSection(undefined);

    const uploadButton = screen.getByRole("button", {
      name: "settings.webdavSync.upload",
    });
    const downloadButton = screen.getByRole("button", {
      name: "settings.webdavSync.download",
    });

    expect(uploadButton).toBeDisabled();
    expect(downloadButton).toBeDisabled();
    expect(settingsApiMock.webdavSyncFetchRemoteInfo).not.toHaveBeenCalled();
  });

  it("fetches remote info and uploads after confirmation", async () => {
    renderSection(baseConfig);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.webdavSync.upload" }),
    );

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncFetchRemoteInfo).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "settings.webdavSync.confirmUpload.confirm",
      }),
    );

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncUpload).toHaveBeenCalledTimes(1);
    });
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "settings.webdavSync.uploadSuccess",
    );
  });

  it("blocks upload confirmation if form changes after dialog opens", async () => {
    renderSection(baseConfig);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.webdavSync.upload" }),
    );
    await waitFor(() => {
      expect(settingsApiMock.webdavSyncFetchRemoteInfo).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByPlaceholderText("ezsphere-sync"), {
      target: { value: "new-root" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "settings.webdavSync.confirmUpload.confirm",
      }),
    );

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "settings.webdavSync.unsavedChanges",
      );
    });
    expect(settingsApiMock.webdavSyncUpload).not.toHaveBeenCalled();
  });

  it("fetches remote info and downloads after confirmation", async () => {
    renderSection(baseConfig);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.webdavSync.download" }),
    );

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncFetchRemoteInfo).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "settings.webdavSync.confirmDownload.confirm",
      }),
    );

    await waitFor(() => {
      expect(settingsApiMock.webdavSyncDownload).toHaveBeenCalledTimes(1);
    });
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "settings.webdavSync.downloadSuccess",
    );
  });

  it("blocks download confirmation if form changes after dialog opens", async () => {
    renderSection(baseConfig);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.webdavSync.download" }),
    );
    await waitFor(() => {
      expect(settingsApiMock.webdavSyncFetchRemoteInfo).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByPlaceholderText("default"), {
      target: { value: "new-profile" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "settings.webdavSync.confirmDownload.confirm",
      }),
    );

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "settings.webdavSync.unsavedChanges",
      );
    });
    expect(settingsApiMock.webdavSyncDownload).not.toHaveBeenCalled();
  });

  it("shows info when no remote snapshot is found for download", async () => {
    settingsApiMock.webdavSyncFetchRemoteInfo.mockResolvedValueOnce({ empty: true });
    renderSection(baseConfig);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.webdavSync.download" }),
    );

    await waitFor(() => {
      expect(toastInfoMock).toHaveBeenCalledWith("settings.webdavSync.noRemoteData");
    });
    expect(settingsApiMock.webdavSyncDownload).not.toHaveBeenCalled();
  });

  it("blocks download when remote snapshot is incompatible", async () => {
    settingsApiMock.webdavSyncFetchRemoteInfo.mockResolvedValueOnce({
      deviceName: "Legacy Machine",
      createdAt: "2025-01-01T00:00:00Z",
      snapshotId: "legacy-snapshot",
      version: 1,
      compatible: false,
      artifacts: ["db.sql"],
    });
    renderSection(baseConfig);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.webdavSync.download" }),
    );

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "settings.webdavSync.incompatibleVersion",
      );
    });
    expect(settingsApiMock.webdavSyncDownload).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", {
        name: "settings.webdavSync.confirmDownload.confirm",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows error when download fails after confirmation", async () => {
    settingsApiMock.webdavSyncDownload.mockRejectedValueOnce(new Error("boom"));
    renderSection(baseConfig);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.webdavSync.download" }),
    );
    await waitFor(() => {
      expect(settingsApiMock.webdavSyncFetchRemoteInfo).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "settings.webdavSync.confirmDownload.confirm",
      }),
    );

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        "settings.webdavSync.downloadFailed",
      );
    });
  });

  it("switches to S3 and edits, tests and saves every S3 setting", async () => {
    renderSection(baseConfig);
    fireEvent.change(screen.getAllByTestId("webdav-preset-select")[0], {
      target: { value: "s3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.confirm" }));

    fireEvent.change(await screen.findByPlaceholderText("us-east-1"), {
      target: { value: "eu-west-1" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("settings.s3Sync.bucketPlaceholder"),
      { target: { value: "backup-bucket" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText("settings.s3Sync.accessKeyIdPlaceholder"),
      { target: { value: "access-key" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText("settings.s3Sync.secretAccessKeyPlaceholder"),
      { target: { value: "secret-key" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText("settings.s3Sync.endpointPlaceholder"),
      { target: { value: "https://s3.example.test" } },
    );
    const roots = screen.getAllByPlaceholderText("ezsphere-sync");
    fireEvent.change(roots[0], { target: { value: "s3-root" } });
    const profiles = screen.getAllByPlaceholderText("default");
    fireEvent.change(profiles[0], { target: { value: "work" } });
    fireEvent.click(
      screen.getByRole("switch", { name: "settings.s3Sync.autoSync" }),
    );
    fireEvent.click(
      screen.getByRole("switch", { name: "settings.s3Sync.enabled" }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.test" }),
    );
    await waitFor(() => expect(settingsApiMock.s3TestConnection).toHaveBeenCalled());

    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.save" }),
    );
    await waitFor(() =>
      expect(settingsApiMock.s3SyncSaveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          region: "eu-west-1",
          bucket: "backup-bucket",
          accessKeyId: "access-key",
          enabled: true,
          autoSync: true,
        }),
        true,
      ),
    );
  });

  it("uploads and downloads a saved S3 snapshot after confirmation", async () => {
    settingsApiMock.s3SyncFetchRemoteInfo.mockResolvedValue({
      deviceName: "Linux Workstation",
      createdAt: "2026-01-01T00:00:00Z",
      snapshotId: "s3-snapshot",
      version: 2,
      compatible: true,
      artifacts: ["db.sql"],
    });
    renderSection({ ...baseConfig, enabled: false }, baseS3Config);

    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.upload" }),
    );
    await waitFor(() => expect(settingsApiMock.s3SyncFetchRemoteInfo).toHaveBeenCalled());
    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.confirmUpload.confirm" }),
    );
    await waitFor(() => expect(settingsApiMock.s3SyncUpload).toHaveBeenCalled());

    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.download" }),
    );
    await screen.findByRole("button", {
      name: "settings.s3Sync.confirmDownload.confirm",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.confirmDownload.confirm" }),
    );
    await waitFor(() => expect(settingsApiMock.s3SyncDownload).toHaveBeenCalled());
  });

  it("handles empty, incompatible and failed S3 remote snapshots", async () => {
    renderSection({ ...baseConfig, enabled: false }, baseS3Config);

    settingsApiMock.s3SyncFetchRemoteInfo.mockResolvedValueOnce({ empty: true });
    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.download" }),
    );
    await waitFor(() =>
      expect(toastInfoMock).toHaveBeenCalledWith("settings.s3Sync.noRemoteData"),
    );

    settingsApiMock.s3SyncFetchRemoteInfo.mockResolvedValueOnce({
      version: 1,
      compatible: false,
      artifacts: [],
    });
    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.download" }),
    );
    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "settings.s3Sync.incompatibleVersion",
      ),
    );

    settingsApiMock.s3SyncFetchRemoteInfo.mockRejectedValueOnce(
      new Error("remote failed"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "settings.s3Sync.upload" }),
    );
    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "settings.s3Sync.fetchRemoteFailed",
      ),
    );
  });

  it("reports WebDAV connection, save, post-save test, fetch and upload failures", async () => {
    settingsApiMock.webdavTestConnection.mockRejectedValueOnce(new Error("test failed"));
    renderSection(baseConfig);

    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.test" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.webdavSync.testFailed"));

    settingsApiMock.webdavSyncSaveSettings.mockRejectedValueOnce(new Error("save failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.save" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.webdavSync.saveFailed"));

    settingsApiMock.webdavSyncSaveSettings.mockResolvedValueOnce({ success: true });
    settingsApiMock.webdavTestConnection.mockRejectedValueOnce(new Error("post-save failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.save" }));
    await waitFor(() => expect(toastWarningMock).toHaveBeenCalledWith("settings.webdavSync.saveAndTestFailed"));

    settingsApiMock.webdavSyncFetchRemoteInfo.mockRejectedValueOnce(new Error("fetch failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.upload" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.webdavSync.fetchRemoteFailed"));

    settingsApiMock.webdavSyncFetchRemoteInfo.mockResolvedValueOnce({ empty: true });
    settingsApiMock.webdavSyncUpload.mockRejectedValueOnce(new Error("upload failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.upload" }));
    fireEvent.click(await screen.findByRole("button", {
      name: "settings.webdavSync.confirmUpload.confirm",
    }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.webdavSync.uploadFailed"));

    settingsApiMock.webdavSyncFetchRemoteInfo.mockRejectedValueOnce(new Error("download fetch failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.webdavSync.download" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.webdavSync.downloadFailed"));
  });

  it("validates S3 and reports test, save and post-save test failures", async () => {
    renderSection({ ...baseConfig, enabled: false }, { ...baseS3Config, bucket: "" });
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.test" }));
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.save" }));
    expect(toastErrorMock).toHaveBeenCalledWith("settings.s3Sync.missingBucket");

    fireEvent.change(screen.getByPlaceholderText("settings.s3Sync.bucketPlaceholder"), {
      target: { value: "valid-bucket" },
    });
    settingsApiMock.s3TestConnection.mockRejectedValueOnce(new Error("test failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.test" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.s3Sync.testFailed"));

    settingsApiMock.s3SyncSaveSettings.mockRejectedValueOnce(new Error("save failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.save" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.s3Sync.saveFailed"));

    settingsApiMock.s3SyncSaveSettings.mockResolvedValueOnce({ success: true });
    settingsApiMock.s3TestConnection.mockRejectedValueOnce(new Error("post-save failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.save" }));
    await waitFor(() => expect(toastWarningMock).toHaveBeenCalledWith("settings.s3Sync.saveAndTestFailed"));
  });

  it("blocks dirty S3 sync and reports confirmed upload and download failures", async () => {
    const view = renderSection({ ...baseConfig, enabled: false }, baseS3Config);
    fireEvent.change(screen.getByPlaceholderText("settings.s3Sync.bucketPlaceholder"), {
      target: { value: "dirty-bucket" },
    });
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.upload" }));
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.download" }));
    expect(toastErrorMock).toHaveBeenCalledWith("settings.s3Sync.unsavedChanges");

    view.unmount();
    renderSection({ ...baseConfig, enabled: false }, baseS3Config);
    settingsApiMock.s3SyncFetchRemoteInfo.mockResolvedValue({
      compatible: true,
      artifacts: [],
      version: 2,
    });
    settingsApiMock.s3SyncUpload.mockRejectedValueOnce(new Error("upload failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.upload" }));
    fireEvent.click(await screen.findByRole("button", { name: "settings.s3Sync.confirmUpload.confirm" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.s3Sync.uploadFailed"));

    settingsApiMock.s3SyncDownload.mockRejectedValueOnce(new Error("download failed"));
    fireEvent.click(screen.getByRole("button", { name: "settings.s3Sync.download" }));
    fireEvent.click(await screen.findByRole("button", { name: "settings.s3Sync.confirmDownload.confirm" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.s3Sync.downloadFailed"));
  });

  it("enforces mutual exclusion in both directions and reports disable failures", async () => {
    const first = renderSection(baseConfig);
    fireEvent.change(screen.getAllByTestId("webdav-preset-select")[0], {
      target: { value: "s3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.cancel" }));
    expect(screen.getByRole("button", { name: "settings.webdavSync.save" })).toBeInTheDocument();

    settingsApiMock.webdavSyncSaveSettings.mockRejectedValueOnce(new Error("disable failed"));
    fireEvent.change(screen.getAllByTestId("webdav-preset-select")[0], {
      target: { value: "s3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.confirm" }));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalledWith("settings.s3Sync.mutualExclusionFailed"));
    first.unmount();

    renderSection(baseConfig, baseS3Config);
    fireEvent.change(screen.getAllByTestId("webdav-preset-select")[0], {
      target: { value: "webdav" },
    });
    fireEvent.click(screen.getByRole("button", { name: "common.confirm" }));
    await waitFor(() => expect(settingsApiMock.s3SyncSaveSettings).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, autoSync: false }),
      false,
    ));
  });
});
