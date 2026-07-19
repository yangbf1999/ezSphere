import { useTranslation } from "react-i18next";
import { useModelStats } from "@/lib/query/usage";
import { fmtUsd } from "./format";
import type { UsageRangeSelection } from "@/types/usage";

interface ModelStatsTableProps {
  range: UsageRangeSelection;
  appType?: string;
  providerName?: string;
  model?: string;
  refreshIntervalMs: number;
}

export function ModelStatsTable({
  range,
  appType,
  providerName,
  model,
  refreshIntervalMs,
}: ModelStatsTableProps) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useModelStats(
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
            <th>{t("usage.model", "模型")}</th>
            <th className="r">{t("usage.requests", "请求数")}</th>
            <th className="r">{t("usage.tokens", "Tokens")}</th>
            <th className="r">{t("usage.totalCost", "总成本")}</th>
            <th className="r">{t("usage.avgCost", "平均成本")}</th>
          </tr>
        </thead>
        <tbody>
          {stats?.length === 0 ? (
            <tr>
              <td colSpan={5} className="muted" style={{ padding: 24 }}>
                {t("usage.noData", "暂无数据")}
              </td>
            </tr>
          ) : (
            stats?.map((stat) => (
              <tr key={stat.model}>
                <td className="mono">{stat.model}</td>
                <td className="r">{stat.requestCount.toLocaleString()}</td>
                <td className="r">{stat.totalTokens.toLocaleString()}</td>
                <td className="r cost">{fmtUsd(stat.totalCost, 4)}</td>
                <td className="r">{fmtUsd(stat.avgCostPerRequest, 6)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
