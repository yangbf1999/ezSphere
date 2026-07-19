import { useState, type ReactNode } from "react";
import {
  ChevronDown,
  Cpu,
  Download,
  LockKeyhole,
  Monitor,
  Network,
  Pencil,
  Plus,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useConfirm } from "../../components/ConfirmDialog";
import { useI18n } from "../../hooks/useI18n";
import * as api from "../../api/tauri";
import { useMotherAgent } from "./context";

type PanelTab = "commands" | "servers" | "guide";

interface CommandItem {
  labelKey: string;
  promptKey: string;
  accent?: boolean;
  icon: LucideIcon;
}

const commandGroups: Array<{ titleKey: string; items: CommandItem[] }> = [
  {
    titleKey: "installRepair.commands.installUninstall",
    items: [
      {
        labelKey: "installRepair.commands.installClaude",
        promptKey: "installRepair.prompts.installClaude",
        accent: true,
        icon: Download,
      },
      {
        labelKey: "installRepair.commands.installCodex",
        promptKey: "installRepair.prompts.installCodex",
        accent: true,
        icon: Download,
      },
      {
        labelKey: "installRepair.commands.installHermes",
        promptKey: "installRepair.prompts.installHermes", 
        accent: true,
        icon: Download,
      },
      {
        labelKey: "installRepair.commands.uninstallClaude",
        promptKey: "installRepair.prompts.uninstallClaude",
        icon: Trash2,
      },
      {
        labelKey: "installRepair.commands.uninstallCodex",
        promptKey: "installRepair.prompts.uninstallCodex",
        icon: Trash2,
      },
    ],
  },
  {
    titleKey: "installRepair.commands.repairTroubleshoot",
    items: [
      {
        labelKey: "installRepair.commands.repairCodex",
        promptKey: "installRepair.prompts.repairCodex",
        icon: Wrench,
      },
      {
        labelKey: "installRepair.commands.repairClaude",
        promptKey: "installRepair.prompts.repairClaude",
        icon: Wrench,
      },
      {
        labelKey: "installRepair.commands.securityAudit",
        promptKey: "installRepair.prompts.securityAudit",
        icon: ShieldCheck,
      },
      {
        labelKey: "installRepair.commands.networkInfo",
        promptKey: "installRepair.prompts.networkInfo",
        icon: Network,
      },
    ],
  },
  {
    titleKey: "installRepair.commands.environmentDeps",
    items: [
      {
        labelKey: "installRepair.commands.checkCuda",
        promptKey: "installRepair.prompts.checkCuda",
        icon: Cpu,
      },
      {
        labelKey: "installRepair.commands.installCuda",
        promptKey: "installRepair.prompts.installCuda",
        icon: Download,
      },
      {
        labelKey: "installRepair.commands.installGit",
        promptKey: "installRepair.prompts.installGit",
        icon: Download,
      },
      {
        labelKey: "installRepair.commands.localSpecs",
        promptKey: "installRepair.prompts.localSpecs",
        icon: Cpu,
      },
      {
        labelKey: "installRepair.commands.serverSpecs",
        promptKey: "installRepair.prompts.serverSpecs",
        icon: Server,
      },
    ],
  },
  {
    titleKey: "installRepair.commands.desktopCustomization",
    items: [
      {
        labelKey: "installRepair.commands.codexChinese",
        promptKey: "installRepair.prompts.codexChinese",
        icon: Sparkles,
      },
      {
        labelKey: "installRepair.commands.claudeChinese",
        promptKey: "installRepair.prompts.claudeChinese",
        icon: Sparkles,
      },
      {
        labelKey: "installRepair.commands.unlockCodexPlugins",
        promptKey: "installRepair.prompts.unlockCodexPlugins",
        icon: Terminal,
      },
    ],
  },
];

const panelTabs: Array<{ id: PanelTab; labelKey: string }> = [
  { id: "commands", labelKey: "installRepair.tabs.commands" },
  // { id: "servers", labelKey: "installRepair.tabs.servers" },
  { id: "guide", labelKey: "installRepair.tabs.guide" },
];

const guideSections: Array<{
  id: string;
  labelKey: string;
  contentKey: string;
  icon: LucideIcon;
}> = [
  {
    id: "local",
    labelKey: "installRepair.guide.local.title",
    contentKey: "installRepair.guide.local.content",
    icon: Sparkles,
  },
  // {
  //   id: "remote",
  //   labelKey: "installRepair.guide.remote.title",
  //   contentKey: "installRepair.guide.remote.content",
  //   icon: Monitor,
  // },
  {
    id: "repair",
    labelKey: "installRepair.guide.repair.title",
    contentKey: "installRepair.guide.repair.content",
    icon: Wrench,
  },
  {
    id: "version",
    labelKey: "installRepair.guide.version.title",
    contentKey: "installRepair.guide.version.content",
    icon: Download,
  },
];

function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <p className="pane-title mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--shell-text-muted)]">
      {children}
    </p>
  );
}

export function MotherAgentPanel({
  defaultTab = "commands",
}: {
  defaultTab?: PanelTab;
}) {
  const {
    setChatInput,
    sshServers,
    addSSHServer,
    removeSSHServer,
    selectedServerId,
    selectServer,
    isProcessing,
  } = useMotherAgent();
  const confirm = useConfirm();
  const { t } = useI18n();

  const [panelTab, setPanelTab] = useState<PanelTab>(defaultTab);
  const [showSSHModal, setShowSSHModal] = useState(false);
  const [sshForm, setSSHForm] = useState({
    host: "",
    port: "22",
    username: "",
    password: "",
    alias: "",
  });
  const [sshTestResult, setSSHTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [sshTesting, setSSHTesting] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState<string | null>("local");

  const resetSSHForm = () => {
    setSSHForm({
      host: "",
      port: "22",
      username: "",
      password: "",
      alias: "",
    });
    setSSHTestResult(null);
  };

  const handleSSHTest = async () => {
    if (!sshForm.host.trim() || !sshForm.username.trim()) return;
    setSSHTesting(true);
    setSSHTestResult(null);
    try {
      const result = await api.sshTestConnection(
        sshForm.host.trim(),
        parseInt(sshForm.port) || 22,
        sshForm.username.trim(),
        sshForm.password,
      );
      setSSHTestResult(result);
    } catch (error) {
      setSSHTestResult({ success: false, message: String(error) });
    } finally {
      setSSHTesting(false);
    }
  };

  const handleSaveServer = async () => {
    if (!sshForm.host.trim()) return;
    const host = sshForm.host.trim();
    const username = sshForm.username.trim();
    const existing = sshServers.find(
      (server) => server.host === host && server.username === username,
    );
    if (existing) await removeSSHServer(existing.id);
    await addSSHServer({
      id: Date.now().toString(),
      host,
      port: sshForm.port || "22",
      username,
      password: sshForm.password,
      alias: sshForm.alias.trim() || undefined,
    });
    resetSSHForm();
    setShowSSHModal(false);
  };

  return (
    <>
      <div className="panel-tabs-head border-b border-[var(--shell-border)] bg-[var(--shell-bg-surface)] px-2.5 py-2">
        <div className="panel-tabs flex gap-1 overflow-x-auto" role="tablist">
          {panelTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={panelTab === tab.id}
              onClick={() => setPanelTab(tab.id)}
              className={`ptab h-7 rounded-[var(--control-radius-inner)] px-3 text-[13px] font-medium transition-colors ${
                panelTab === tab.id
                  ? "bg-[var(--shell-bg-elevated)] text-[var(--shell-accent)]"
                  : "text-[var(--shell-text-secondary)] hover:bg-[var(--shell-bg-elevated)] hover:text-[var(--shell-text-primary)]"
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {showSSHModal && (
        <div
          className="ez-modal-overlay fixed inset-0 z-[9998] flex items-center justify-center p-4"
          onClick={() => setShowSSHModal(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowSSHModal(false);
          }}
        >
          <div
            className="ez-modal-content__inner flex max-h-[calc(100vh-64px)] flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ez-modal-head">
              <div>
                <h2 className="m-0 text-base font-semibold">
                  {t("mother.addServer")}
                </h2>
                <p className="m-0 mt-1 text-[12px] text-[var(--shell-text-muted)]">
                  {t("installRepair.serverModal.description")}
                </p>
              </div>
              <button
                type="button"
                className="ez-modal-close"
                onClick={() => setShowSSHModal(false)}
                aria-label={t("btn.cancel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="ez-modal-body space-y-4">
              <div className="ez-form-grid">
                <label className="ez-form-field">
                  <span className="ez-form-label">{t("mother.hostIp")}</span>
                  <input
                    type="text"
                    placeholder={t("mother.hostPlaceholder")}
                    value={sshForm.host}
                    onChange={(event) =>
                      setSSHForm((form) => ({
                        ...form,
                        host: event.target.value,
                      }))
                    }
                    className="ez-input ez-input--modal ez-input--mono"
                    autoFocus
                  />
                </label>
                <label className="ez-form-field">
                  <span className="ez-form-label">{t("mother.port")}</span>
                  <input
                    type="number"
                    placeholder="22"
                    value={sshForm.port}
                    onChange={(event) =>
                      setSSHForm((form) => ({
                        ...form,
                        port: event.target.value,
                      }))
                    }
                    className="ez-input ez-input--modal ez-input--mono no-spinner"
                  />
                </label>
                <label className="ez-form-field">
                  <span className="ez-form-label">{t("mother.username")}</span>
                  <input
                    type="text"
                    placeholder={t("mother.userPlaceholder")}
                    value={sshForm.username}
                    onChange={(event) =>
                      setSSHForm((form) => ({
                        ...form,
                        username: event.target.value,
                      }))
                    }
                    className="ez-input ez-input--modal ez-input--mono"
                  />
                </label>
                <label className="ez-form-field">
                  <span className="ez-form-label">
                    {t("mother.displayName")}{" "}
                    <span className="text-[var(--shell-text-muted)]">
                      ({t("mother.optional")})
                    </span>
                  </span>
                  <input
                    type="text"
                    placeholder={t("mother.displayNamePlaceholder")}
                    value={sshForm.alias}
                    onChange={(event) =>
                      setSSHForm((form) => ({
                        ...form,
                        alias: event.target.value,
                      }))
                    }
                    className="ez-input ez-input--modal"
                  />
                </label>
              </div>

              <label className="ez-form-field">
                <span className="ez-form-label">{t("mother.passwordKey")}</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("mother.passwordPlaceholder")}
                    value={
                      sshForm.password.startsWith("enc:v1:")
                        ? "************"
                        : sshForm.password
                    }
                    onChange={(event) =>
                      setSSHForm((form) => ({
                        ...form,
                        password: event.target.value,
                      }))
                    }
                    className="ez-input ez-input--modal ez-input--mono pr-9"
                    readOnly={sshForm.password.startsWith("enc:v1:")}
                  />
                  <button
                    type="button"
                    disabled={!sshForm.password}
                    onClick={async () => {
                      if (!sshForm.password) return;
                      if (sshForm.password.startsWith("enc:v1:")) {
                        try {
                          const plain = await api.decryptSecret(
                            sshForm.password,
                          );
                          setSSHForm((form) => ({
                            ...form,
                            password: plain || "",
                          }));
                        } catch {
                          setSSHForm((form) => ({ ...form, password: "" }));
                        }
                      } else {
                        try {
                          const encrypted = await api.encryptSecret(
                            sshForm.password,
                          );
                          setSSHForm((form) => ({
                            ...form,
                            password: encrypted,
                          }));
                        } catch {
                          /* Keep plaintext if encryption is unavailable. */
                        }
                      }
                    }}
                    className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-[var(--control-radius-inner)] text-[var(--shell-text-muted)] transition-colors hover:bg-[var(--shell-bg-elevated)] hover:text-[var(--shell-text-primary)] disabled:opacity-30"
                    title={t("mother.encrypted")}
                  >
                    <LockKeyhole className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-[11px] leading-5 text-[var(--shell-text-muted)]">
                  {t("installRepair.serverModal.encryptionHint")}
                </span>
              </label>

              {sshTestResult && !sshTesting && (
                <div
                  className={`rounded-[var(--control-radius)] border px-3 py-2 font-mono text-[11px] ${
                    sshTestResult.success
                      ? "border-[color-mix(in_oklab,var(--shell-success),transparent_70%)] bg-[color-mix(in_oklab,var(--shell-success),transparent_92%)] text-[var(--shell-success)]"
                      : "border-[color-mix(in_oklab,var(--shell-error),transparent_70%)] bg-[color-mix(in_oklab,var(--shell-error),transparent_92%)] text-[var(--shell-error)]"
                  }`}
                >
                  {sshTestResult.message}
                </div>
              )}
            </div>

            <div className="ez-modal-foot">
              <button
                type="button"
                className="ez-btn ez-btn--outline"
                onClick={handleSSHTest}
                disabled={
                  sshTesting || !sshForm.host.trim() || !sshForm.username.trim()
                }
              >
                <Network className="h-3.5 w-3.5" />
                {sshTesting ? t("mother.testing") : t("mother.testConnection")}
              </button>
              <button
                type="button"
                className="ez-btn ez-btn--ghost"
                onClick={() => {
                  setShowSSHModal(false);
                  setSSHTestResult(null);
                }}
              >
                {t("mother.cancel")}
              </button>
              <button
                type="button"
                className="ez-btn ez-btn--primary"
                onClick={handleSaveServer}
                disabled={!sshForm.host.trim()}
              >
                {t("mother.addServerBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panel-body pane min-h-0 flex-1 overflow-y-auto p-4 slim-scroll">
        {panelTab === "commands" ? (
          <div className="space-y-5">
            {commandGroups.map((group) => (
              <section key={group.titleKey}>
                <PanelTitle>{t(group.titleKey)}</PanelTitle>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const label = t(item.labelKey);
                    const prompt = t(item.promptKey);
                    return (
                      <button
                        key={item.promptKey}
                        type="button"
                        onClick={() => setChatInput(prompt)}
                        className={`chip inline-flex h-8 max-w-full items-center gap-1.5 rounded-[var(--control-radius)] border px-3 text-[12px] font-medium transition-colors ${
                          item.accent
                            ? "border-[color-mix(in_oklab,var(--shell-accent),transparent_50%)] text-[var(--shell-accent)] hover:bg-[color-mix(in_oklab,var(--shell-accent),transparent_88%)]"
                            : "border-[var(--shell-border)] bg-[var(--shell-bg-surface)] text-[var(--shell-text-secondary)] hover:border-[var(--shell-text-muted)] hover:bg-[var(--shell-bg-elevated)] hover:text-[var(--shell-text-primary)]"
                        }`}
                        title={prompt}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : panelTab === "servers" ? (
          <div>
            <PanelTitle>{t("installRepair.sections.sshServers")}</PanelTitle>
            <div className="space-y-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => !isProcessing && selectServer("local")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (!isProcessing) selectServer("local");
                  }
                }}
                aria-label={t("installRepair.localServer.name")}
                className={`srv flex w-full items-center gap-3 rounded-[var(--shell-card-radius)] border bg-[var(--shell-bg-surface)] px-3 py-2.5 text-left transition-colors ${
                  isProcessing && selectedServerId !== "local"
                    ? "cursor-not-allowed opacity-45"
                    : "cursor-pointer hover:border-[var(--shell-text-muted)] hover:bg-[var(--shell-bg-elevated)]"
                } ${
                  selectedServerId === "local"
                    ? "border-[var(--shell-accent)] bg-[color-mix(in_oklab,var(--shell-accent),transparent_90%)]"
                    : "border-[var(--shell-border)]"
                }`}
              >
                <span className="sdot h-2 w-2 shrink-0 rounded-full bg-[var(--shell-success)]" />
                <span className="sd min-w-0 flex-1">
                  <span className="sn block text-[13px] font-medium text-[var(--shell-text-primary)]">
                    {t("installRepair.localServer.name")}
                  </span>
                  <span className="sm block truncate font-mono text-[11px] text-[var(--shell-text-muted)]">
                    {t("installRepair.localServer.meta")}
                  </span>
                </span>
              </div>

              {sshServers.map((server) => (
                <div
                  key={server.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => !isProcessing && selectServer(server.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      if (!isProcessing) selectServer(server.id);
                    }
                  }}
                  aria-label={server.alias || server.host}
                  className={`srv group flex w-full items-center gap-3 rounded-[var(--shell-card-radius)] border bg-[var(--shell-bg-surface)] px-3 py-2.5 text-left transition-colors ${
                    isProcessing && selectedServerId !== server.id
                      ? "cursor-not-allowed opacity-45"
                      : "cursor-pointer hover:border-[var(--shell-text-muted)] hover:bg-[var(--shell-bg-elevated)]"
                  } ${
                    selectedServerId === server.id
                      ? "border-[var(--shell-accent)] bg-[color-mix(in_oklab,var(--shell-accent),transparent_90%)]"
                      : "border-[var(--shell-border)]"
                  }`}
                >
                  <span className="sdot h-2 w-2 shrink-0 rounded-full bg-[var(--shell-success)]" />
                  <span className="min-w-0 flex-1">
                    <span className="sn block truncate text-[13px] font-medium text-[var(--shell-text-primary)]">
                      {server.alias || server.host}
                    </span>
                    <span className="sm block truncate font-mono text-[11px] text-[var(--shell-text-muted)]">
                      {server.username ? `${server.username}@` : ""}
                      {server.host}
                      {server.port !== "22" ? `:${server.port}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={async (event) => {
                        event.stopPropagation();
                        let savedPassword = "";
                        try {
                          const servers = await api.loadSSHServers();
                          const saved = servers.find((s) => s.id === server.id);
                          if (saved?.password) savedPassword = saved.password;
                        } catch {
                          /* Ignore stale saved password lookups. */
                        }
                        setSSHForm({
                          host: server.host,
                          port: server.port,
                          username: server.username,
                          password: savedPassword,
                          alias: server.alias || "",
                        });
                        setSSHTestResult(null);
                        setShowSSHModal(true);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-[var(--control-radius-inner)] text-[var(--shell-text-muted)] hover:bg-[var(--shell-bg-input)] hover:text-[var(--shell-text-primary)]"
                      title={t("btn.edit")}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async (event) => {
                        event.stopPropagation();
                        const ok = await confirm({
                          title: t("mother.deleteServerTitle"),
                          message: t("mother.deleteServerMsg"),
                          confirmText: t("btn.delete"),
                          cancelText: t("btn.cancel"),
                          type: "danger",
                        });
                        if (ok) removeSSHServer(server.id);
                      }}
                      className="grid h-7 w-7 place-items-center rounded-[var(--control-radius-inner)] text-[var(--shell-text-muted)] hover:bg-[color-mix(in_oklab,var(--shell-error),transparent_90%)] hover:text-[var(--shell-error)]"
                      title={t("btn.delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  resetSSHForm();
                  setShowSSHModal(true);
                }}
                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[var(--control-radius)] border border-dashed border-[var(--shell-border)] px-3 text-[12.5px] font-medium text-[var(--shell-text-muted)] transition-colors hover:border-[var(--shell-accent)] hover:text-[var(--shell-accent)]"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("mother.addServer")}
              </button>
            </div>

            <PanelTitle>
              <span className="mt-5 block">{t("installRepair.sections.encryption")}</span>
            </PanelTitle>
            <p className="font-mono text-[11.5px] leading-5 text-[var(--shell-text-muted)]">
              {t("installRepair.serverModal.encryptionHintShort")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <PanelTitle>{t("installRepair.sections.deploymentGuide")}</PanelTitle>
            {guideSections.map((section) => {
              const Icon = section.icon;
              const expanded = expandedGuide === section.id;
              return (
                <div
                  key={section.id}
                  className="guide-item overflow-hidden rounded-[var(--shell-card-radius)] border border-[var(--shell-border)] bg-[var(--shell-bg-surface)]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGuide((current) =>
                        current === section.id ? null : section.id,
                      )
                    }
                    className="guide-head flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium text-[var(--shell-text-primary)] transition-colors hover:bg-[var(--shell-bg-elevated)]"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--shell-text-muted)]" />
                    <span className="min-w-0 flex-1 truncate">
                      {t(section.labelKey)}
                    </span>
                    <ChevronDown
                      className={`chev h-3.5 w-3.5 shrink-0 text-[var(--shell-text-muted)] transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expanded && (
                    <div className="guide-body border-t border-[var(--shell-border)] px-3 pb-3 pt-2 text-[12px] leading-6 text-[var(--shell-text-secondary)]">
                      {t(section.contentKey)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
