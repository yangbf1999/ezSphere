import {
  MotherAgentMain,
  MotherAgentPanel,
  MotherAgentProvider,
} from "@/pages/MotherAgent";
import { useI18n } from "@/hooks/useI18n";

function InstallHeader() {
  const { t } = useI18n();

  return (
    <header className="install-repair-header flex shrink-0 items-center gap-3 border-b border-[var(--shell-border)] bg-[var(--shell-bg-surface)] px-10 py-4">
      <div className="min-w-0">
        <h1 className="m-0 text-[20px] font-semibold text-[var(--shell-text-primary)]">
          {t("installRepair.title")}
        </h1>
        <p className="m-0 mt-1 truncate text-[13px] text-[var(--shell-text-muted)]">
          {t("installRepair.subtitle")}
        </p>
      </div>
    </header>
  );
}

function InstallShell() {
  return (
    <div className="install-repair-page mother-agent-page work grid h-full min-h-0 grid-cols-[minmax(0,1fr)_320px] overflow-hidden bg-[var(--bg-base)] text-[var(--shell-text-primary)]">
      <section className="chat-col flex min-w-0 flex-col overflow-hidden">
        <InstallHeader />
        <MotherAgentMain variant="install" />
      </section>

      <aside className="panel right-panel flex min-h-0 flex-col overflow-hidden border-l border-[var(--shell-border)] bg-[var(--shell-bg-surface)]">
        <MotherAgentPanel defaultTab="commands" />
      </aside>
    </div>
  );
}

export function InstallPage() {
  return (
    <MotherAgentProvider>
      <InstallShell />
    </MotherAgentProvider>
  );
}
