import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InstalledSkill } from "@/hooks/useSkills";
import type { AppId } from "@/lib/api/types";
import { settingsApi } from "@/lib/api";
import { SKILLS_APP_IDS } from "@/config/appConfig";
import { AppToggleGroup } from "@/components/common/AppToggleGroup";
import { getSkillInitials } from "@/components/skills/skillInitials";
import {
  SkillCenterCard,
  SkillCenterCardAppChips,
  SkillCenterCardDescription,
  SkillCenterCardFoot,
  SkillCenterCardFootActions,
  SkillCenterCardHead,
  SkillCenterCardIconAction,
  SkillCenterCardInstalledTag,
  SkillCenterCardLogo,
  SkillCenterCardSource,
  SkillCenterCardTitle,
  SkillCenterCardTitleRow,
  SkillCenterCardTop,
  SkillCenterCardTopActions,
  SkillCenterCardTopEnd,
  SkillCenterCardVersion,
} from "@/components/skills/SkillCenterCard";

export interface InstalledSkillCardProps {
  skill: InstalledSkill;
  hasUpdate?: boolean;
  isUpdating?: boolean;
  onToggleApp: (id: string, app: AppId, enabled: boolean) => void;
  onUninstall: () => void;
  onUpdate?: () => void;
}

export function InstalledSkillCard({
  skill,
  hasUpdate,
  isUpdating,
  onToggleApp,
  onUninstall,
  onUpdate,
}: InstalledSkillCardProps) {
  const { t } = useTranslation();

  const openDocs = async () => {
    if (!skill.readmeUrl) return;
    try {
      await settingsApi.openExternal(skill.readmeUrl);
    } catch {
      // ignore
    }
  };

  const footSource = useMemo(() => {
    if (skill.repoOwner && skill.repoName) {
      return `${skill.repoOwner}/${skill.repoName}`;
    }
    return null;
  }, [skill.repoOwner, skill.repoName]);

  const descriptionText =
    skill.description || t("skills.noDescription", { defaultValue: "暂无描述" });

  const uninstallLabel = `${t("skills.uninstall")} ${skill.name}`;
  const updateLabel = `${t("skills.update")} ${skill.name}`;
  const docsLabel = `${t("skills.view")} ${skill.name}`;

  return (
    <SkillCenterCard
      data-apps={SKILLS_APP_IDS.filter((app) => skill.apps[app]).join(" ")}
    >
      <SkillCenterCardTopEnd>
        <SkillCenterCardInstalledTag>
          {t("skills.local", { defaultValue: "本地" })}
        </SkillCenterCardInstalledTag>
        {hasUpdate && onUpdate ? (
          <SkillCenterCardTopActions>
            <SkillCenterCardIconAction
              icon={RefreshCw}
              loadingIcon={Loader2}
              label={updateLabel}
              onClick={onUpdate}
              disabled={isUpdating}
              loading={isUpdating}
            />
          </SkillCenterCardTopActions>
        ) : null}
      </SkillCenterCardTopEnd>

      <SkillCenterCardTop>
        <SkillCenterCardLogo>{getSkillInitials(skill.name)}</SkillCenterCardLogo>
        <SkillCenterCardHead>
          <SkillCenterCardTitleRow>
            <SkillCenterCardTitle>{skill.name}</SkillCenterCardTitle>
            {skill.readmeUrl ? (
              <Button
                type="button"
                variant="native"
                className="skill-docs-link"
                onClick={() => void openDocs()}
                title={docsLabel}
                aria-label={docsLabel}
              >
                <ExternalLink size={12} aria-hidden />
              </Button>
            ) : null}
          </SkillCenterCardTitleRow>
          {hasUpdate ? (
            <SkillCenterCardVersion update>
              {t("skills.updateAvailable")}
            </SkillCenterCardVersion>
          ) : null}
        </SkillCenterCardHead>
      </SkillCenterCardTop>

      <SkillCenterCardDescription title={skill.description}>
        {descriptionText}
      </SkillCenterCardDescription>

      <SkillCenterCardFoot>
        <SkillCenterCardAppChips>
          <AppToggleGroup
            apps={skill.apps}
            onToggle={(app, enabled) => onToggleApp(skill.id, app, enabled)}
            appIds={SKILLS_APP_IDS}
            variant="chip"
          />
        </SkillCenterCardAppChips>
        {footSource ? (
          <SkillCenterCardSource>{footSource}</SkillCenterCardSource>
        ) : null}
        <SkillCenterCardFootActions>
          <SkillCenterCardIconAction
            icon={Trash2}
            label={uninstallLabel}
            onClick={onUninstall}
            destructive
          />
        </SkillCenterCardFootActions>
      </SkillCenterCardFoot>
    </SkillCenterCard>
  );
}
