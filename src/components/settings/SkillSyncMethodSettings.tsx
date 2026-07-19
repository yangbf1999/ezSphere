import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SkillSyncMethod } from "@/types";

export interface SkillSyncMethodSettingsProps {
  value: SkillSyncMethod;
  onChange: (value: SkillSyncMethod) => void;
}

export function SkillSyncMethodSettings({
  value,
  onChange,
}: SkillSyncMethodSettingsProps) {
  const { t } = useTranslation();

  const currentValue = value === "copy" ? "copy" : "symlink";
  const hintKey = currentValue === "copy" ? "copyHint" : "symlinkHint";

  return (
    <section className="card section">
      <header className="card-header section-head">
        <RefreshCw className="sec-ic" aria-hidden />
        <div>
          <h3>{t("settings.skillSync.title")}</h3>
          <p className="sec-desc">{t("settings.skillSync.description")}</p>
        </div>
      </header>
      <div className="setting-row row">
        <div className="setting-info row-text">
          <div>
            <h4 className="rt-title">{t("settings.skillSync.rowTitle")}</h4>
            <p className="rt-desc">{t(`settings.skillSync.${hintKey}`)}</p>
          </div>
        </div>
        <div className="setting-action row-ctrl">
          <Select
            value={currentValue}
            onValueChange={(method) => onChange(method as SkillSyncMethod)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="symlink">
                {t("settings.skillSync.symlink")}
              </SelectItem>
              <SelectItem value="copy">
                {t("settings.skillSync.copy")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
