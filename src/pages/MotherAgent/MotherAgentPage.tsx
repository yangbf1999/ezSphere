import { MotherAgentMain } from "./MotherAgentMain";
import { MotherAgentPanel } from "./MotherAgentPanel";
import { MotherAgentProvider } from "./MotherAgentProvider";

export function MotherAgentPage() {
  return (
    <MotherAgentProvider>
      <div className="mother-agent-page flex h-full min-h-0 overflow-hidden bg-[var(--shell-bg-terminal)] text-[var(--shell-text-primary)]">
        <section className="flex min-w-0 flex-1 flex-col px-4 pb-4 pt-3">
          <MotherAgentMain />
        </section>
        <aside className="hidden w-[320px] shrink-0 border-l border-[var(--shell-border)] bg-[var(--shell-bg-surface)] lg:flex lg:flex-col">
          <MotherAgentPanel />
        </aside>
      </div>
    </MotherAgentProvider>
  );
}
