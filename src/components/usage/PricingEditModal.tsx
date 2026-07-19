import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Save, Plus, Import } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateModelPricing } from "@/lib/query/usage";
import { isNonNegativeDecimalString, type ModelPricing } from "@/types/usage";
import { cn } from "@/lib/utils";
import { ModelsDevPickerDialog } from "./ModelsDevPickerDialog";

interface PricingEditModalProps {
  open: boolean;
  model: ModelPricing;
  isNew?: boolean;
  onClose: () => void;
}

const PRICE_INPUT_STEP = "0.0001";

export function PricingEditModal({
  open,
  model,
  isNew = false,
  onClose,
}: PricingEditModalProps) {
  const { t } = useTranslation();
  const updatePricing = useUpdateModelPricing();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [formData, setFormData] = useState({
    modelId: model.modelId,
    displayName: model.displayName,
    inputCost: model.inputCostPerMillion,
    outputCost: model.outputCostPerMillion,
    cacheReadCost: model.cacheReadCostPerMillion,
    cacheCreationCost: model.cacheCreationCostPerMillion,
  });

  useEffect(() => {
    if (!open) return;
    setFormData({
      modelId: model.modelId,
      displayName: model.displayName,
      inputCost: model.inputCostPerMillion,
      outputCost: model.outputCostPerMillion,
      cacheReadCost: model.cacheReadCostPerMillion,
      cacheCreationCost: model.cacheCreationCostPerMillion,
    });
    setIsPickerOpen(false);
  }, [open, model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证模型 ID
    if (isNew && !formData.modelId.trim()) {
      toast.error(t("usage.modelIdRequired", "模型 ID 不能为空"));
      return;
    }

    // 验证非负数
    const values = [
      formData.inputCost,
      formData.outputCost,
      formData.cacheReadCost,
      formData.cacheCreationCost,
    ];

    for (const value of values) {
      if (!isNonNegativeDecimalString(value)) {
        toast.error(t("usage.invalidPrice", "价格必须为非负数"));
        return;
      }
    }

    try {
      await updatePricing.mutateAsync({
        modelId: isNew ? formData.modelId : model.modelId,
        displayName: formData.displayName,
        inputCost: formData.inputCost,
        outputCost: formData.outputCost,
        cacheReadCost: formData.cacheReadCost,
        cacheCreationCost: formData.cacheCreationCost,
      });

      toast.success(
        isNew
          ? t("usage.pricingAdded", "定价已添加")
          : t("usage.pricingUpdated", "定价已更新"),
        { closeButton: true },
      );

      onClose();
    } catch (error) {
      toast.error(String(error));
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onClose();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isNew
                ? t("usage.addPricing", "添加模型定价")
                : `${t("usage.editPricing", "编辑模型定价")} - ${model.modelId}`}
            </DialogTitle>
            <DialogCloseButton aria-label={t("common.close", "关闭")} />
          </DialogHeader>

          <DialogBody>
            {isNew && (
              <>
                <p className="mb-3 text-[11px] text-[var(--shell-text-muted)]">
                  {t(
                    "usage.modelsDevHint",
                    "无需手动填写，可从 models.dev 选择模型定价",
                  )}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPickerOpen(true)}
                  className="mb-3"
                >
                  <Import className="mr-1.5 h-4 w-4" />
                  {t("usage.importFromModelsDev", "从 models.dev 导入")}
                </Button>
              </>
            )}

            <form id="pricing-form" onSubmit={handleSubmit}>
              <div className="ez-form-grid">
                {isNew && (
                  <div className="ez-form-field">
                    <Label htmlFor="modelId" variant="form">
                      {t("usage.modelId", "模型 ID")}
                    </Label>
                    <Input
                      id="modelId"
                      variant="modal-mono"
                      value={formData.modelId}
                      onChange={(e) =>
                        setFormData({ ...formData, modelId: e.target.value })
                      }
                      placeholder={t("usage.modelIdPlaceholder", {
                        defaultValue: "例如: claude-3-5-sonnet-20241022",
                      })}
                      required
                    />
                  </div>
                )}

                <div className={cn("ez-form-field", !isNew && "col-span-full")}>
                  <Label htmlFor="displayName" variant="form">
                    {t("usage.displayName", "显示名称")}
                  </Label>
                  <Input
                    id="displayName"
                    variant="modal"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder={t("usage.displayNamePlaceholder", {
                      defaultValue: "例如: Claude 3.5 Sonnet",
                    })}
                    required
                  />
                </div>

                <div className="ez-form-field">
                  <Label htmlFor="inputCost" variant="form">
                    {t(
                      "usage.inputCostPerMillion",
                      "输入成本 (每百万 tokens, USD)",
                    )}
                  </Label>
                  <Input
                    id="inputCost"
                    variant="modal"
                    type="number"
                    step={PRICE_INPUT_STEP}
                    min="0"
                    value={formData.inputCost}
                    onChange={(e) =>
                      setFormData({ ...formData, inputCost: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="ez-form-field">
                  <Label htmlFor="outputCost" variant="form">
                    {t(
                      "usage.outputCostPerMillion",
                      "输出成本 (每百万 tokens, USD)",
                    )}
                  </Label>
                  <Input
                    id="outputCost"
                    variant="modal"
                    type="number"
                    step={PRICE_INPUT_STEP}
                    min="0"
                    value={formData.outputCost}
                    onChange={(e) =>
                      setFormData({ ...formData, outputCost: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="ez-form-field">
                  <Label htmlFor="cacheReadCost" variant="form">
                    {t(
                      "usage.cacheReadCostPerMillion",
                      "缓存读取成本 (每百万 tokens, USD)",
                    )}
                  </Label>
                  <Input
                    id="cacheReadCost"
                    variant="modal"
                    type="number"
                    step={PRICE_INPUT_STEP}
                    min="0"
                    value={formData.cacheReadCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cacheReadCost: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="ez-form-field">
                  <Label htmlFor="cacheCreationCost" variant="form">
                    {t(
                      "usage.cacheCreationCostPerMillion",
                      "缓存写入成本 (每百万 tokens, USD)",
                    )}
                  </Label>
                  <Input
                    id="cacheCreationCost"
                    variant="modal"
                    type="number"
                    step={PRICE_INPUT_STEP}
                    min="0"
                    value={formData.cacheCreationCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cacheCreationCost: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </form>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel", "取消")}
            </Button>
            <Button
              type="submit"
              form="pricing-form"
              disabled={updatePricing.isPending}
            >
              {updatePricing.isPending
                ? t("common.saving", "保存中...")
                  : t("common.save", "保存")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isNew && isPickerOpen && (
        <ModelsDevPickerDialog
          open={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onImported={() => {
            setIsPickerOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
