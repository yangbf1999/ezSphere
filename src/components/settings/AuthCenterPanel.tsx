import { Github, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { CodexIcon } from "@/components/BrandIcons";
import { CopilotAuthSection } from "@/components/providers/forms/CopilotAuthSection";
import { CodexOAuthSection } from "@/components/providers/forms/CodexOAuthSection";

export function AuthCenterPanel() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border/60 bg-card/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 settings-token-accent" aria-hidden="true" />
              <h3 className="text-base font-semibold">
                {t("settings.authCenter.title", {
                  defaultValue: "OAuth 认证中心",
                })}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("settings.authCenter.description", {
                defaultValue:
                  "为 GitHub Copilot、ChatGPT (Codex OAuth) 等需要 OAuth 的模型集中授权",
              })}
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {t("settings.authCenter.beta", { defaultValue: "Beta" })}
          </Badge>
        </div>
        <div className="setting-row row settings-auth-row">
          <div className="setting-info row-text">
            <div className="setting-row-icon" aria-hidden>
              <Github className="h-4 w-4" />
            </div>
            <div>
              <h4 className="rt-title">GitHub Copilot</h4>
              <p className="rt-desc">
                {t("settings.authCenter.copilotDescription", {
                  defaultValue:
                    "通过 OAuth 授权 GitHub Copilot 模型，使用 Copilot 订阅额度",
                })}
              </p>
            </div>
          </div>
          <div className="setting-action row-ctrl settings-auth-action">
            <CopilotAuthSection />
          </div>
        </div>

        <div className="setting-row row settings-auth-row">
          <div className="setting-info row-text">
            <div className="setting-row-icon" aria-hidden>
              <CodexIcon size={16} />
            </div>
            <div>
              <h4 className="rt-title">ChatGPT (Codex OAuth)</h4>
              <p className="rt-desc">
                {t("settings.authCenter.codexOauthDescription", {
                  defaultValue:
                    "通过 ChatGPT Plus/Pro 订阅反代 Codex，需 OAuth 登录",
                })}
              </p>
            </div>
          </div>
          <div className="setting-action row-ctrl settings-auth-action">
            <CodexOAuthSection />
          </div>
        </div>
      </section>
    </div>
  );
}
