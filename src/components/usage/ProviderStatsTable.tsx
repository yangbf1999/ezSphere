import { useTranslation } from "react-i18next";
import { useProviderStats } from "@/lib/query/usage";
import { fmtUsd } from "./format";
import type { UsageRangeSelection } from "@/types/usage";
import { cn } from "@/lib/utils";

interface ProviderStatsTableProps {
  range: UsageRangeSelection;
  appType?: string;
  providerName?: string;
  model?: string;
  refreshIntervalMs: number;
}

export function ProviderStatsTable({
  range,
  appType,
  providerName,
  model,
  refreshIntervalMs,
}: ProviderStatsTableProps) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useProviderStats(
    range,
    { appType, providerName, model },
    {
      refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    },
  );

  if (isLoading) {
    return <div className="usage-skeleton usage-skeleton-lg" />;
  }

  return (
    <div className="table-wrap">
      <table className="apple-table log-tbl">
        <thead>
          <tr>
            <th>{t("usage.provider", "Provider")}</th>
            <th className="r">{t("usage.requests", "请求数")}</th>
            <th className="r">{t("usage.tokens", "Tokens")}</th>
            <th className="r">{t("usage.cost", "成本")}</th>
            <th className="r">{t("usage.successRate", "成功率")}</th>
            <th className="r">{t("usage.avgLatency", "平均延迟")}</th>
          </tr>
        </thead>
        <tbody>
          {stats?.length === 0 ? (
            <tr>
              <td colSpan={6} className="muted" style={{ padding: 24 }}>
                {t("usage.noData", "暂无数据")}
              </td>
            </tr>
          ) : (
            stats?.map((stat) => (
              <tr key={stat.providerId}>
                <td className="bold">{stat.providerName}</td>
                <td className="r">{stat.requestCount.toLocaleString()}</td>
                <td className="r">{stat.totalTokens.toLocaleString()}</td>
                <td className="r cost">{fmtUsd(stat.totalCost, 4)}</td>
                <td
                  className={cn(
                    "r",
                    stat.successRate >= 97 ? "ok" : "fail",
                  )}
                >
                  {stat.successRate.toFixed(1)}%
                </td>
                <td className="r">{stat.avgLatencyMs}ms</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
