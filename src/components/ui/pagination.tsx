import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

function buildPageButtons(totalPages: number, page: number): (number | string)[] {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pageSet = new Set<number>();
  for (let i = 0; i < 3; i++) pageSet.add(i);
  for (let i = totalPages - 3; i < totalPages; i++) pageSet.add(i);
  for (let i = Math.max(0, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    pageSet.add(i);
  }

  const sorted = Array.from(pageSet).sort((a, b) => a - b);
  const buttons: (number | string)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      buttons.push(`ellipsis-${i}`);
    }
    buttons.push(sorted[i]);
  }
  return buttons;
}

export interface TablePaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSize?: boolean;
  showGoToPage?: boolean;
  meta?: React.ReactNode;
  className?: string;
}

export function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  showPageSize = false,
  showGoToPage = true,
  meta,
  className,
}: TablePaginationProps) {
  const { t } = useTranslation();
  const [pageInput, setPageInput] = useState("");

  useEffect(() => {
    setPageInput("");
  }, [page, totalPages]);

  const pageButtons = useMemo(
    () => buildPageButtons(totalPages, page),
    [totalPages, page],
  );

  const handleGoToPage = () => {
    const trimmed = pageInput.trim();
    if (!/^\d+$/.test(trimmed)) return;
    const parsed = Number(trimmed);
    if (parsed < 1 || parsed > totalPages) return;
    onPageChange(parsed - 1);
    setPageInput("");
  };

  return (
    <div className={cn("table-pagination", className)}>
      <div className="table-pagination__meta">
        {meta ??
          (total != null ? (
            <span>{t("usage.totalRecords", { total })}</span>
          ) : null)}
      </div>

      <div className="table-pagination__controls">
        {showPageSize && pageSize != null && onPageSizeChange ? (
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              const parsed = Number.parseInt(value, 10);
              if (
                !Number.isFinite(parsed) ||
                !(pageSizeOptions as readonly number[]).includes(parsed)
              ) {
                return;
              }
              onPageSizeChange(parsed);
            }}
          >
            <SelectTrigger
              className="usage-sel usage-sel-sm filter-select w-[98px] shadow-none focus:ring-0"
              aria-label={t("usage.pageSize", { defaultValue: "每页条数" })}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {t("usage.pageSizeOption", {
                    count: size,
                    defaultValue: "{{count}} 条/页",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <button
          type="button"
          className="pg-btn table-pagination__nav"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label={t("usage.previousPage", { defaultValue: "上一页" })}
        >
          ‹
        </button>

        {pageButtons.map((item) =>
          typeof item === "string" ? (
            <span key={item} className="pg-ellipsis table-pagination__ellipsis">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn(
                "pg-btn table-pagination__page",
                item === page && "active",
              )}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item + 1}
            </button>
          ),
        )}

        <button
          type="button"
          className="pg-btn table-pagination__nav"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          aria-label={t("usage.nextPage", { defaultValue: "下一页" })}
        >
          ›
        </button>

        {showGoToPage ? (
          <>
            <input
              type="text"
              className="pg-input table-pagination__input"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoToPage();
              }}
              placeholder={t("usage.pageInputPlaceholder")}
              aria-label={t("usage.pageInputPlaceholder")}
            />
            <button
              type="button"
              className="pg-btn pg-go btn btn-sm"
              onClick={handleGoToPage}
            >
              {t("usage.goToPage")}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
