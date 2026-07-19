import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderText,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModelPricing, useDeleteModelPricing } from "@/lib/query/usage";
import { PricingEditModal } from "./PricingEditModal";
import { isNonNegativeDecimalString, type ModelPricing } from "@/types/usage";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { proxyApi } from "@/lib/api/proxy";
import { TablePagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const PRICING_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

const PRICING_APPS = ["claude", "codex"] as const;//, "gemini"
type PricingApp = (typeof PRICING_APPS)[number];
type PricingModelSource = "request" | "response";

// 模型定价表"总览"页临时只展示国内系列模型；国外模型暂时隐藏。
// 临时改动：删除此过滤即可恢复完整列表。
const DOMESTIC_MODEL_ID_PREFIXES = [
  "deepseek",
  "doubao",
  "glm",
  "kimi",
  "mimo",
  "minimax",
  "qwen",
  "qwq",
  "step",
];
function isDomesticModelId(modelId: string): boolean {
  const id = modelId.toLowerCase();
  return DOMESTIC_MODEL_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}

const APP_DOT_COLOR: Record<PricingApp, string> = {
  claude: "var(--app-claude)",
  codex: "var(--app-codex)",
  gemini: "var(--app-gemini)",
};

interface AppConfig {
  multiplier: string;
  source: PricingModelSource;
}

type AppConfigState = Record<PricingApp, AppConfig>;

export interface PricingAddRequest {
  key: number;
  displayName?: string;
  modelId?: string;
}

export interface PricingConfigPanelProps {
  layout?: "default" | "shell";
  listLayout?: "table" | "grid";
  hideListAddButton?: boolean;
  modalsOnly?: boolean;
  addRequest?: PricingAddRequest;
  gridChildren?: ReactNode;
}

function getModelInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "M";
}

export function PricingConfigPanel({
  layout = "shell",
  listLayout = "table",
  hideListAddButton = false,
  modalsOnly = false,
  addRequest,
  gridChildren,
}: PricingConfigPanelProps = {}) {
  const { t } = useTranslation();
  const { data: pricing, isLoading, error } = useModelPricing();
  const deleteMutation = useDeleteModelPricing();
  const [editingModel, setEditingModel] = useState<ModelPricing | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [pricingPage, setPricingPage] = useState(0);
  const [pricingPageSize, setPricingPageSize] = useState(10);

  // 总览页模型定价表：临时仅展示国内系列模型
  const visiblePricing = useMemo(
    () => (pricing ?? []).filter((m) => isDomesticModelId(m.modelId)),
    [pricing],
  );

  const pricingTotal = visiblePricing.length;
  const pricingTotalPages = Math.max(1, Math.ceil(pricingTotal / pricingPageSize));

  const paginatedPricing = useMemo(() => {
    const start = pricingPage * pricingPageSize;
    return visiblePricing.slice(start, start + pricingPageSize);
  }, [visiblePricing, pricingPage, pricingPageSize]);

  useEffect(() => {
    setPricingPage(0);
  }, [pricingPageSize]);

  useEffect(() => {
    if (pricingPage > pricingTotalPages - 1) {
      setPricingPage(Math.max(0, pricingTotalPages - 1));
    }
  }, [pricingPage, pricingTotalPages]);

  // 三个应用的配置状态
  const [appConfigs, setAppConfigs] = useState<AppConfigState>({
    claude: { multiplier: "1", source: "response" },
    codex: { multiplier: "1", source: "response" },
    gemini: { multiplier: "1", source: "response" },
  });
  const [originalConfigs, setOriginalConfigs] = useState<AppConfigState | null>(
    null,
  );
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 检查是否有改动
  const isDirty =
    originalConfigs !== null &&
    PRICING_APPS.some(
      (app) =>
        appConfigs[app].multiplier !== originalConfigs[app].multiplier ||
        appConfigs[app].source !== originalConfigs[app].source,
    );

  // 加载所有应用的配置
  useEffect(() => {
    let isMounted = true;

    const loadAllConfigs = async () => {
      setIsConfigLoading(true);
      try {
        const results = await Promise.all(
          PRICING_APPS.map(async (app) => {
            const [multiplier, source] = await Promise.all([
              proxyApi.getDefaultCostMultiplier(app),
              proxyApi.getPricingModelSource(app),
            ]);
            return {
              app,
              multiplier,
              source: (source === "request"
                ? "request"
                : "response") as PricingModelSource,
            };
          }),
        );

        if (!isMounted) return;

        const newState: AppConfigState = {
          claude: { multiplier: "1", source: "response" },
          codex: { multiplier: "1", source: "response" },
          gemini: { multiplier: "1", source: "response" },
        };
        for (const result of results) {
          newState[result.app] = {
            multiplier: result.multiplier,
            source: result.source,
          };
        }
        setAppConfigs(newState);
        setOriginalConfigs(newState);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Unknown error";
        toast.error(
          t("settings.globalProxy.pricingLoadFailed", { error: message }),
        );
      } finally {
        if (isMounted) setIsConfigLoading(false);
      }
    };

    loadAllConfigs();
    return () => {
      isMounted = false;
    };
  }, [t]);

  // 保存所有配置
  const handleSaveAll = async () => {
    // 验证所有倍率
    for (const app of PRICING_APPS) {
      const trimmed = appConfigs[app].multiplier.trim();
      if (!trimmed) {
        toast.error(
          `${t(`apps.${app}`)}: ${t("settings.globalProxy.defaultCostMultiplierRequired")}`,
        );
        return;
      }
      if (!isNonNegativeDecimalString(trimmed)) {
        toast.error(
          `${t(`apps.${app}`)}: ${t("settings.globalProxy.defaultCostMultiplierInvalid")}`,
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      await Promise.all(
        PRICING_APPS.flatMap((app) => [
          proxyApi.setDefaultCostMultiplier(
            app,
            appConfigs[app].multiplier.trim(),
          ),
          proxyApi.setPricingModelSource(app, appConfigs[app].source),
        ]),
      );
      toast.success(t("settings.globalProxy.pricingSaved"));
      setOriginalConfigs({ ...appConfigs });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Unknown error";
      toast.error(
        t("settings.globalProxy.pricingSaveFailed", { error: message }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (modelId: string) => {
    deleteMutation.mutate(modelId, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const handleAddNew = (prefill?: { displayName?: string; modelId?: string }) => {
    setIsAddingNew(true);
    setEditingModel({
      modelId: prefill?.modelId ?? "",
      displayName: prefill?.displayName ?? "",
      inputCostPerMillion: "0",
      outputCostPerMillion: "0",
      cacheReadCostPerMillion: "0",
      cacheCreationCostPerMillion: "0",
    });
  };

  useEffect(() => {
    if (!addRequest || addRequest.key === 0) return;
    handleAddNew({
      displayName: addRequest.displayName,
      modelId: addRequest.modelId,
    });
  }, [addRequest?.key]);

  const modals = (
    <>
      {editingModel && (
        <PricingEditModal
          open={!!editingModel}
          model={editingModel}
          isNew={isAddingNew}
          onClose={() => {
            setEditingModel(null);
            setIsAddingNew(false);
          }}
        />
      )}

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <DialogContent size="sm" zIndex="nested">
          <DialogHeader>
            <DialogHeaderText>
              <DialogTitle>{t("usage.deleteConfirmTitle")}</DialogTitle>
              <DialogDescription>
                {t("usage.deleteConfirmDesc")}
              </DialogDescription>
            </DialogHeaderText>
            <DialogCloseButton aria-label={t("common.close", "关闭")} />
          </DialogHeader>
          {deleteConfirm ? (
            <DialogBody className="pt-0">
              <p className="font-mono text-xs text-[var(--shell-text-primary)]">
                {deleteConfirm}
              </p>
            </DialogBody>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t("common.deleting")
                : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (modalsOnly) {
    return modals;
  }

  if (isLoading) {
    return (
      <div className="pricing-panel pricing-loading">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricing-panel">
        <Alert variant="destructive">
          <AlertDescription>
            {t("usage.loadPricingError")}: {String(error)}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="pricing-panel">
        <div className="pricing-section">
          <h4>{t("settings.globalProxy.pricingDefaultsTitle")}</h4>
          <p className="pdesc">
            {t("settings.globalProxy.pricingDefaultsDescription")}
          </p>
          {isConfigLoading ? (
            <div className="pricing-loading">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {PRICING_APPS.map((app) => (
                <div key={app} className="app-cfg-row">
                  <div className="ac-label">
                    <span
                      className="ac-dot"
                      style={{ background: APP_DOT_COLOR[app] }}
                      aria-hidden
                    />
                    {t(`apps.${app}`)}
                  </div>
                  <div>
                    <div className="field-label">
                      {t("settings.globalProxy.defaultCostMultiplierLabel")}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      className="form-input input"
                      value={appConfigs[app].multiplier}
                      onChange={(e) =>
                        setAppConfigs((prev) => ({
                          ...prev,
                          [app]: { ...prev[app], multiplier: e.target.value },
                        }))
                      }
                      disabled={isSaving}
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <div className="field-label">
                      {t("settings.globalProxy.pricingModelSourceLabel")}
                    </div>
                    <Select
                      value={appConfigs[app].source}
                      onValueChange={(value) =>
                        setAppConfigs((prev) => ({
                          ...prev,
                          [app]: {
                            ...prev[app],
                            source: value as PricingModelSource,
                          },
                        }))
                      }
                      disabled={isSaving}
                    >
                      <SelectTrigger className="form-select select-mini" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent compact>
                        <SelectItem value="response">
                          {t("settings.globalProxy.pricingModelSourceResponse")}
                        </SelectItem>
                        <SelectItem value="request">
                          {t("settings.globalProxy.pricingModelSourceRequest")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <div className="pricing-save-row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveAll}
                  disabled={isConfigLoading || isSaving || !isDirty}
                >
                  {isSaving ? (
                    t("common.saving")
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      {t("settings.globalProxy.pricingSave")}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="pricing-section">
          <div className="pricing-section-head">
            <h4>{t("usage.modelPricingTableTitle", "模型定价表")}</h4>
            {!hideListAddButton && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddNew();
                }}
              >
                <Plus strokeWidth={2} />
                {t("common.add")}
              </button>
            )}
          </div>
          <p className="pdesc">
            {t("usage.modelPricingDesc")} {t("usage.perMillion")}
          </p>

          {listLayout === "table" ? (
            <>
              <div className="pricing-tbl-wrap">
                {visiblePricing.length === 0 ? (
                  <div className="pricing-empty">{t("usage.noPricingData")}</div>
                ) : (
                  <table className="pricing-tbl">
                    <thead>
                      <tr>
                        <th>{t("usage.model")}</th>
                        <th>{t("usage.displayName")}</th>
                        <th className="r">{t("usage.inputCost")}</th>
                        <th className="r">{t("usage.outputCost")}</th>
                        <th className="r">{t("usage.cacheReadCost")}</th>
                        <th className="r">{t("usage.cacheWriteCost")}</th>
                        <th className="r">{t("common.actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPricing.map((model) => {
                        const cacheReadNa =
                          !model.cacheReadCostPerMillion ||
                          model.cacheReadCostPerMillion === "0";
                        const cacheWriteNa =
                          !model.cacheCreationCostPerMillion ||
                          model.cacheCreationCostPerMillion === "0";
                        return (
                          <tr key={model.modelId}>
                            <td className="pm-name">{model.modelId}</td>
                            <td>{model.displayName}</td>
                            <td className="r">${model.inputCostPerMillion}</td>
                            <td className="r">${model.outputCostPerMillion}</td>
                            <td className={cn("r", cacheReadNa && "muted")}>
                              {cacheReadNa
                                ? "N/A"
                                : `$${model.cacheReadCostPerMillion}`}
                            </td>
                            <td className={cn("r", cacheWriteNa && "muted")}>
                              {cacheWriteNa
                                ? "N/A"
                                : `$${model.cacheCreationCostPerMillion}`}
                            </td>
                            <td className="r pm-actions">
                              <button
                                type="button"
                                className="icon-btn"
                                title={t("common.edit")}
                                aria-label={t("common.edit")}
                                onClick={() => {
                                  setIsAddingNew(false);
                                  setEditingModel(model);
                                }}
                              >
                                <Pencil strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                className="icon-btn del"
                                title={t("common.delete")}
                                aria-label={t("common.delete")}
                                onClick={() => setDeleteConfirm(model.modelId)}
                              >
                                <Trash2 strokeWidth={2} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              {visiblePricing.length > 0 ? (
                <TablePagination
                  page={pricingPage}
                  totalPages={pricingTotalPages}
                  total={pricingTotal}
                  pageSize={pricingPageSize}
                  pageSizeOptions={PRICING_PAGE_SIZE_OPTIONS}
                  onPageChange={setPricingPage}
                  onPageSizeChange={setPricingPageSize}
                  showPageSize
                />
              ) : null}
            </>
          ) : (
            <div className="model-grid">
              {visiblePricing.length === 0 && !gridChildren ? (
                <div className="models-empty">{t("usage.noPricingData")}</div>
              ) : (
                visiblePricing.map((model) => (
                  <div
                    key={model.modelId}
                    className="mcard shell-card"
                    data-model={model.modelId}
                  >
                    <div className="mcard-top">
                      <div className="micon">
                        {getModelInitial(model.displayName)}
                      </div>
                      <div className="minfo">
                        <div className="mname">{model.displayName}</div>
                        <div className="mid">{model.modelId}</div>
                      </div>
                      <span className="src-tag cloud">
                        {t("usage.pricingModelAdded", {
                          defaultValue: "已添加",
                        })}
                      </span>
                    </div>
                    <div className="mcard-body">
                      <div className="mrow">
                        <span className="lbl">{t("usage.inputCost")}</span>
                        <span className="val">${model.inputCostPerMillion}</span>
                      </div>
                      <div className="mrow">
                        <span className="lbl">{t("usage.outputCost")}</span>
                        <span className="val">
                          ${model.outputCostPerMillion}
                        </span>
                      </div>
                      <div className="mrow">
                        <span className="lbl">{t("usage.cacheReadCost")}</span>
                        <span className="val">
                          ${model.cacheReadCostPerMillion}
                        </span>
                      </div>
                      <div className="mrow">
                        <span className="lbl">{t("usage.cacheWriteCost")}</span>
                        <span className="val">
                          ${model.cacheCreationCostPerMillion}
                        </span>
                      </div>
                    </div>
                    <div className="mcard-foot">
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() => {
                          setIsAddingNew(false);
                          setEditingModel(model);
                        }}
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        className="mini-btn del"
                        onClick={() => setDeleteConfirm(model.modelId)}
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  </div>
                ))
              )}
              {gridChildren}
            </div>
          )}
        </div>

        {modals}
      </div>
    );
}
