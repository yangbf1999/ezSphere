import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogHeaderText,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProviderIcon } from "@/components/ProviderIcon";
import { IconPicker } from "@/components/IconPicker";
import { getIconMetadata } from "@/icons/extracted/metadata";
import type { UseFormReturn } from "react-hook-form";
import type { ProviderFormData } from "@/lib/schemas/provider";

interface BasicFormFieldsProps {
  form: UseFormReturn<ProviderFormData>;
  /** Slot to render content between icon and name fields */
  beforeNameSlot?: ReactNode;
  /** Use model-centric labels (e.g. in Model Center) */
  fromModelsCenter?: boolean;
}

export function BasicFormFields({
  form,
  beforeNameSlot,
  fromModelsCenter = false,
}: BasicFormFieldsProps) {
  const { t } = useTranslation();
  const [iconDialogOpen, setIconDialogOpen] = useState(false);

  const currentIcon = form.watch("icon");
  const currentIconColor = form.watch("iconColor");
  const providerName = form.watch("name") || "Provider";
  const effectiveIconColor =
    currentIconColor ||
    (currentIcon ? getIconMetadata(currentIcon)?.defaultColor : undefined);

  const handleIconSelect = (icon: string) => {
    const meta = getIconMetadata(icon);
    form.setValue("icon", icon);
    form.setValue("iconColor", meta?.defaultColor ?? "");
    setIconDialogOpen(false);
  };

  return (
    <>
      {/* 图标选择区域 - 顶部居中，可选 */}
      <div className="flex justify-center mb-6">
        <Dialog open={iconDialogOpen} onOpenChange={setIconDialogOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="w-20 h-20 p-3 rounded-xl border-2 border-muted hover:border-primary transition-colors cursor-pointer bg-muted/30 hover:bg-muted/50 flex items-center justify-center"
              title={
                currentIcon
                  ? t("providerIcon.clickToChange", {
                      defaultValue: "点击更换图标",
                    })
                  : t("providerIcon.clickToSelect", {
                      defaultValue: "点击选择图标",
                    })
              }
            >
              <ProviderIcon
                icon={currentIcon}
                name={providerName}
                color={effectiveIconColor}
                size={48}
              />
            </button>
          </DialogTrigger>
          <DialogContent zIndex="nested">
            <DialogHeader>
              <DialogHeaderText>
                <DialogTitle>
                  {t("providerIcon.selectIcon", {
                    defaultValue: "选择图标",
                  })}
                </DialogTitle>
              </DialogHeaderText>
              <DialogCloseButton aria-label={t("common.close", "关闭")} />
            </DialogHeader>
            <DialogBody className="py-4">
              <IconPicker
                value={currentIcon}
                onValueChange={handleIconSelect}
                color={effectiveIconColor}
              />
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t("common.cancel")}
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slot for additional fields between icon and name */}
      {beforeNameSlot}

      {/* 基础信息 - 网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {fromModelsCenter
                  ? t("models.name", { defaultValue: "显示名称" })
                  : t("provider.name")}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={
                    fromModelsCenter
                      ? t("models.namePlaceholder", {
                          defaultValue: "例如：Claude 官方",
                        })
                      : t("provider.namePlaceholder")
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("provider.notes")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("provider.notesPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="websiteUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("provider.websiteUrl")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={t("providerForm.websiteUrlPlaceholder")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
