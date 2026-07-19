import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeaderText,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppId } from "@/lib/api";
import {
  SkillsPage,
  getSkillsPageHeaderActions,
  type SkillsPageHandle,
  type SkillsPageSource,
} from "./SkillsPage";

interface SkillsDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialApp: AppId;
}

export function SkillsDiscoveryDialog({
  open,
  onOpenChange,
  initialApp,
}: SkillsDiscoveryDialogProps) {
  const { t } = useTranslation();
  const pageRef = useRef<SkillsPageHandle>(null);
  const [source, setSource] = useState<SkillsPageSource>("repos");
  const headerActions = getSkillsPageHeaderActions(source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="skills-discovery-dialog [&_.ez-modal-content__inner]:flex [&_.ez-modal-content__inner]:max-h-[92vh] [&_.ez-modal-content__inner]:flex-col"
      >
        <DialogHeader className="skills-discovery-dialog__head">
          <DialogHeaderText>
            <DialogTitle className="flex items-center gap-2.5">
              <Search
                className="h-[18px] w-[18px] shrink-0 text-[var(--shell-accent)]"
                strokeWidth={2}
                aria-hidden
              />
              {t("skills.discover")}
            </DialogTitle>
            <DialogDescription>
              {t("skills.discoverSubtitle", {
                defaultValue:
                  "浏览、搜索并安装来自社区和官方仓库的技能",
              })}
            </DialogDescription>
          </DialogHeaderText>

          <div className="flex shrink-0 items-center gap-2">
            {headerActions.map((action) => (
              <Button
                key={action.key}
                type="button"
                variant="btn"
                size="compact"
                icon={action.Icon}
                onClick={() => action.execute(pageRef.current)}
              >
                {t(action.labelKey)}
              </Button>
            ))}
            <DialogCloseButton aria-label={t("common.close", "关闭")} />
          </div>
        </DialogHeader>

        <DialogBody className="skills-discovery-dialog__body min-h-0 overflow-hidden p-0">
          {open ? (
            <SkillsPage
              ref={pageRef}
              initialApp={initialApp}
              layout="shell"
              onSourceChange={setSource}
            />
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
