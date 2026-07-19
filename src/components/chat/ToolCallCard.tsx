import { useState } from "react";
import {
  Terminal,
  Globe,
  FileText,
  FileEdit,
  Upload,
  Download,
  KeyRound,
  Wrench,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";

export interface ToolCallCardProps {
  name: string;
  args: string;
  status: "running" | "done" | "failed";
  output?: string;
}

const TOOL_META: Record<
  string,
  { icon: typeof Wrench; label: string; previewKey?: string }
> = {
  shell_exec: { icon: Terminal, label: "shell", previewKey: "command" },
  ssh_shell: { icon: Terminal, label: "ssh", previewKey: "command" },
  file_read: { icon: FileText, label: "read", previewKey: "path" },
  file_write: { icon: FileEdit, label: "write", previewKey: "path" },
  web_fetch: { icon: Globe, label: "fetch", previewKey: "url" },
  upload_file: { icon: Upload, label: "upload", previewKey: "remote_path" },
  download_file: {
    icon: Download,
    label: "download",
    previewKey: "remote_path",
  },
  get_sudo_password: {
    icon: KeyRound,
    label: "sudo",
    previewKey: "server_id",
  },
  deploy_plugin_source: {
    icon: Wrench,
    label: "deploy plugin",
    previewKey: "plugin_id",
  },
};

function previewFor(toolName: string, args: string): string {
  const meta = TOOL_META[toolName];
  if (!meta?.previewKey) return "";
  try {
    const obj = JSON.parse(args);
    const val = obj?.[meta.previewKey];
    if (typeof val === "string") return val;
  } catch {
    /* Args may still be streaming. */
  }
  return "";
}

const OUTPUT_PREVIEW_LIMIT = 4000;

export function ToolCallCard({ name, args, status, output }: ToolCallCardProps) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const meta = TOOL_META[name] || { icon: Wrench, label: name };
  const Icon = meta.icon;
  const preview = previewFor(name, args);

  const statusConfig = {
    running: {
      label: t("mother.toolStatus.running"),
      className: "tc-dot--running",
    },
    done: {
      label: t("mother.toolStatus.done"),
      className: "tc-dot--done",
    },
    failed: {
      label: t("mother.toolStatus.failed"),
      className: "tc-dot--failed",
    },
  }[status];

  const truncatedOutput =
    output && output.length > OUTPUT_PREVIEW_LIMIT
      ? `${output.slice(0, OUTPUT_PREVIEW_LIMIT)}\n...\n[truncated]`
      : output;

  return (
    <div className="tool-card mb-3 max-w-[560px] rounded-[var(--shell-card-radius)] border border-[var(--shell-border)] bg-[var(--shell-bg-surface)] font-mono text-[12px] text-[var(--shell-text-primary)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-[var(--control-radius)] px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--shell-bg-elevated)]"
      >
        <Icon
          size={12}
          className="flex-shrink-0 text-[var(--shell-text-muted)]"
        />
        <span className="flex-shrink-0 font-bold text-[var(--shell-text-primary)]">
          {meta.label}
        </span>
        {preview && (
          <span className="flex-1 truncate text-[var(--shell-text-muted)]">
            {preview}
          </span>
        )}
        <span
          className="tc-status flex-shrink-0"
          aria-label={statusConfig.label}
          title={statusConfig.label}
        >
          <span className={`tc-dot ${statusConfig.className}`} />
          <span>{statusConfig.label}</span>
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-[var(--shell-border)] px-2.5 pb-2 pt-1">
          <div>
            <div className="mb-0.5 text-[10px] text-[var(--shell-text-muted)]">
              arguments
            </div>
            <pre className="whitespace-pre-wrap break-all rounded-[var(--control-radius-inner)] bg-[var(--shell-bg-input)] px-2 py-1 text-[var(--shell-text-primary)]">
              {args || "<streaming...>"}
            </pre>
          </div>
          {truncatedOutput !== undefined && (
            <div>
              <div className="mb-0.5 text-[10px] text-[var(--shell-text-muted)]">
                output
              </div>
              <pre
                className={`max-h-72 overflow-y-auto whitespace-pre-wrap break-all rounded-[var(--control-radius-inner)] px-2 py-1 ${
                  status === "failed"
                    ? "bg-[color-mix(in_oklab,var(--shell-error),transparent_90%)] text-[var(--shell-error)]"
                    : "bg-[var(--shell-bg-input)] text-[var(--shell-text-primary)]"
                }`}
              >
                {truncatedOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
