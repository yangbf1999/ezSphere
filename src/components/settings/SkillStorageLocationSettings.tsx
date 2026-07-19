import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Folder, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderText,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { skillsApi, type MigrationResult } from "@/lib/api/skills";
import type { SkillStorageLocation } from "@/types";

export interface SkillStorageLocationSettingsProps {
  value: SkillStorageLocation;
  installedCount: number;
  onMigrated: (target: SkillStorageLocation) => void;
}

export function SkillStorageLocationSettings({
  value,
  installedCount,
  onMigrated,
}: SkillStorageLocationSettingsProps) {
  const { t } = useTranslation();
  const [pendingTarget, setPendingTarget] =
    useState<SkillStorageLocation | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleSelect = (target: SkillStorageLocation) => {
    if (target === value) return;
    if (installedCount > 0) {
      setPendingTarget(target);
    } else {
      doMigrate(target);
    }
  };

  const doMigrate = async (target: SkillStorageLocation) => {
    setIsMigrating(true);
    setPendingTarget(null);
    try {
      const result: MigrationResult = await skillsApi.migrateStorage(target);
      if (result.errors.length > 0) {
        toast.warning(
          t("settings.skillStorage.migrationPartial", {
            migrated: result.migratedCount,
            errors: result.errors.length,
          }),
        );
      } else {
        toast.success(
          t("settings.skillStorage.migrationSuccess", {
            count: result.migratedCount,
          }),
        );
      }
      onMigrated(target);
    } catch (error) {
      toast.error(String(error));
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <section className="card section">
      <header className="card-header section-head">
        <Folder className="sec-ic" aria-hidden />
        <div>
          <h3>{t("settings.skillStorage.title")}</h3>
          <p className="sec-desc">
            {t("settings.skillStorage.description")}
          </p>
        </div>
      </header>
      <div className="setting-row row">
        <div className="setting-info row-text">
          <div>
            <h4 className="rt-title">{t("settings.skillStorage.rowTitle")}</h4>
            <p className="rt-desc">
              {value === "unified"
                ? t("settings.skillStorage.unifiedHint")
                : t("settings.skillStorage.ccSwitchHint")}
            </p>
          </div>
        </div>
        <div className="setting-action row-ctrl">
          {isMigrating ? (
            <Loader2
              size={14}
              className="animate-spin text-[var(--shell-accent)]"
            />
          ) : null}
          <Select
            value={value}
            onValueChange={(target) =>
              handleSelect(target as SkillStorageLocation)
            }
            disabled={isMigrating}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cc_switch">
                {t("settings.skillStorage.ccSwitch")}
              </SelectItem>
              <SelectItem value="unified">
                {t("settings.skillStorage.unified")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 迁移确认对话框 */}
      <Dialog
        open={pendingTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTarget(null);
        }}
      >
        <DialogContent size="sm" zIndex="alert">
          <DialogHeader className="ez-modal-head--compact">
            <DialogHeaderText>
              <DialogTitle>
                {t("settings.skillStorage.confirmTitle")}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {t("settings.skillStorage.confirmMessage", {
                  count: installedCount,
                })}
              </DialogDescription>
            </DialogHeaderText>
          </DialogHeader>
          <DialogFooter className="ez-modal-foot--compact">
            <Button variant="outline" onClick={() => setPendingTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => pendingTarget && doMigrate(pendingTarget)}>
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
