import { useTranslation } from "react-i18next";
import { DeepLinkImportRequest } from "../../lib/api/deeplink";

export function SkillConfirmation({
  request,
}: {
  request: DeepLinkImportRequest;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("deeplink.skill.title")}</h3>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          {t("deeplink.skill.repo")}
        </label>
        <div className="mt-1 text-sm font-mono bg-muted/50 p-2 rounded border">
          {request.repo}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          {t("deeplink.skill.directory")}
        </label>
        <div className="mt-1 text-sm font-mono bg-muted/50 p-2 rounded border">
          {request.directory}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground">
          {t("deeplink.skill.branch")}
        </label>
        <div className="mt-1 text-sm">{request.branch || "main"}</div>
      </div>

      <div className="text-info text-sm bg-info/10 p-3 rounded border border-info/30">
        <p>ℹ️ {t("deeplink.skill.hint")}</p>
        <p className="mt-1">{t("deeplink.skill.hintDetail")}</p>
      </div>
    </div>
  );
}
