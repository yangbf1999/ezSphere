import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequestLogs } from "@/lib/query/usage";
import {
  getFreshInputTokens,
  isUnpricedUsage,
  type LogFilters,
  type UsageRangeSelection,
} from "@/types/usage";
import { UsageDateRangePicker } from "./UsageDateRangePicker";
import { TablePagination } from "@/components/ui/pagination";
import {
  fmtInt,
  fmtUsd,
  getLocaleFromLanguage,
  parseFiniteNumber,
} from "./format";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

interface RequestLogTableProps {
  range: UsageRangeSelection;
  rangeLabel: string;
  appType?: string;
  providerName?: string;
  model?: string;
  refreshIntervalMs: number;
  onRangeChange?: (range: UsageRangeSelection) => void;
}

export function RequestLogTable({
  range,
  rangeLabel,
  appType: dashboardAppType,
  providerName,
  model,
  refreshIntervalMs,
  onRangeChange,
}: RequestLogTableProps) {
  const { t, i18n } = useTranslation();

  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(20);

  const effectiveFilters: LogFilters = {
    appType:
      dashboardAppType && dashboardAppType !== "all"
        ? dashboardAppType
        : undefined,
    providerName,
    model,
    statusCode,
  };

  const { data: result, isLoading } = useRequestLogs({
    filters: effectiveFilters,
    range,
    page,
    pageSize,
    options: {
      refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    },
  });

  const logs = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset page to 0 only when filter values actually change (not on re-render with same values)
  const filterKey = `${dashboardAppType}|${providerName}|${model}|${pageSize}|${range.preset}|${range.customStartDate}|${range.customEndDate}`;
  const prevFilterKeyRef = useRef(filterKey);
  useEffect(() => {
    if (filterKey !== prevFilterKeyRef.current) {
      prevFilterKeyRef.current = filterKey;
      setPage(0);
    }
  }, [filterKey]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const language = i18n.resolvedLanguage || i18n.language || "en";
  const locale = getLocaleFromLanguage(language);

  return (
    <div>
      <div className="logs-toolbar">
        <Select
          value={statusCode?.toString() || "all"}
          onValueChange={(v) => {
            const parsed = Number.parseInt(v, 10);
            setStatusCode(
              v === "all" || !Number.isFinite(parsed) ? undefined : parsed,
            );
            setPage(0);
          }}
        >
          <SelectTrigger className="usage-sel usage-sel-sm filter-select w-[130px] shadow-none focus:ring-0">
            <SelectValue placeholder={t("usage.statusCode")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="200">200 OK</SelectItem>
            <SelectItem value="400">400</SelectItem>
            <SelectItem value="401">401</SelectItem>
            <SelectItem value="429">429</SelectItem>
            <SelectItem value="500">500</SelectItem>
          </SelectContent>
        </Select>

        {onRangeChange && (
          <UsageDateRangePicker
            selection={range}
            triggerLabel={rangeLabel}
            onApply={onRangeChange}
            triggerClassName="btn btn-sm h-[30px] w-[310px]"
          />
        )}

        <span className="spacer" aria-hidden />
      </div>

      {isLoading ? (
        <div className="usage-skeleton usage-skeleton-lg" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="apple-table log-tbl">
              <thead>
                <tr>
                  <th>{t("usage.time")}</th>
                  <th>{t("usage.provider")}</th>
                  <th>{t("usage.billingModel")}</th>
                  <th className="r">{t("usage.inputTokens")}</th>
                  <th className="r">{t("usage.outputTokens")}</th>
                  <th className="r">{t("usage.totalCost")}</th>
                  <th>{t("usage.timingInfo")}</th>
                  <th>{t("usage.status")}</th>
                  <th>{t("usage.source", { defaultValue: "Source" })}</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="muted" style={{ padding: 24 }}>
                      {t("usage.noData")}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const unpriced = isUnpricedUsage(log);
                    const freshInput = getFreshInputTokens(log);
                    const isCacheInclusive = log.inputTokens !== freshInput;
                    const isOk =
                      log.statusCode >= 200 && log.statusCode < 300;

                    return (
                      <tr key={log.requestId}>
                        <td className="whitespace-nowrap mono">
                          {new Date(log.createdAt * 1000).toLocaleString(
                            locale,
                            {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </td>
                        <td className="bold">
                          {log.providerName || t("usage.unknownProvider")}
                        </td>
                        <td
                          className="mono max-w-[200px]"
                          title={
                            log.requestModel && log.requestModel !== log.model
                              ? `${log.requestModel} → ${log.model}`
                              : log.model
                          }
                        >
                          {log.requestModel && log.requestModel !== log.model ? (
                            <span>
                              {log.requestModel}
                              <span className="muted"> → {log.model}</span>
                            </span>
                          ) : (
                            log.model
                          )}
                        </td>
                        <td
                          className="r mono"
                          title={
                            isCacheInclusive
                              ? `Raw: ${log.inputTokens.toLocaleString()}`
                              : undefined
                          }
                        >
                          {fmtInt(freshInput, locale)}
                          {(log.cacheReadTokens > 0 ||
                            log.cacheCreationTokens > 0) && (
                            <div className="cache-sub">
                              {[
                                log.cacheReadTokens > 0 &&
                                  `R${fmtInt(log.cacheReadTokens, locale)}`,
                                log.cacheCreationTokens > 0 &&
                                  `W${fmtInt(log.cacheCreationTokens, locale)}`,
                              ]
                                .filter(Boolean)
                                .join("·")}
                            </div>
                          )}
                        </td>
                        <td className="r mono">{fmtInt(log.outputTokens, locale)}</td>
                        <td className="r">
                          <span
                            className={cn(
                              "cost",
                              unpriced && "unpriced",
                            )}
                          >
                            {unpriced
                              ? t("usage.unpriced", "未定价")
                              : fmtUsd(log.totalCostUsd, 4)}
                          </span>
                          {parseFiniteNumber(log.costMultiplier) != null &&
                            parseFiniteNumber(log.costMultiplier) !== 1 && (
                              <div className="cache-sub">
                                ×
                                {parseFiniteNumber(log.costMultiplier)?.toFixed(
                                  2,
                                )}
                              </div>
                            )}
                        </td>
                        <td className="mono whitespace-nowrap">
                          {(log.latencyMs / 1000).toFixed(1)}s
                          {log.firstTokenMs != null && (
                            <span className="muted">
                              /{(log.firstTokenMs / 1000).toFixed(1)}s
                            </span>
                          )}
                        </td>
                        <td className={cn(isOk ? "ok" : "fail")}>
                          {log.statusCode}
                        </td>
                        <td className="muted">
                          {log.dataSource || "proxy"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            showPageSize
          />
        </>
      )}
    </div>
  );
}
