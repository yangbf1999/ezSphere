import { UsageDashboard } from "@/components/usage/UsageDashboard";

export function OverviewPage() {
  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-y-auto"
      style={{ padding: "var(--shell-main-padding)" }}
    >
      <UsageDashboard />
    </div>
  );
}
