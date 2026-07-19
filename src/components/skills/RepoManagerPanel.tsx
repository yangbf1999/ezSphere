import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, ExternalLink, Plus } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogHeaderText,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { settingsApi } from "@/lib/api";
import type { DiscoverableSkill, SkillRepo } from "@/lib/api/skills";

interface RepoManagerPanelProps {
  open: boolean;
  repos: SkillRepo[];
  skills: DiscoverableSkill[];
  onAdd: (repo: SkillRepo) => Promise<void>;
  onRemove: (owner: string, name: string) => Promise<void>;
  onClose: () => void;
}

export function RepoManagerPanel({
  open,
  repos,
  skills,
  onAdd,
  onRemove,
  onClose,
}: RepoManagerPanelProps) {
  const { t } = useTranslation();
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [error, setError] = useState("");

  const getSkillCount = (repo: SkillRepo) =>
    skills.filter(
      (skill) =>
        skill.repoOwner === repo.owner &&
        skill.repoName === repo.name &&
        (skill.repoBranch || "main") === (repo.branch || "main"),
    ).length;

  const parseRepoUrl = (
    url: string,
  ): { owner: string; name: string } | null => {
    let cleaned = url.trim();
    cleaned = cleaned.replace(/^https?:\/\/github\.com\//, "");
    cleaned = cleaned.replace(/\.git$/, "");

    const parts = cleaned.split("/");
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { owner: parts[0], name: parts[1] };
    }

    return null;
  };

  const handleAdd = async () => {
    setError("");

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setError(t("skills.repo.invalidUrl"));
      return;
    }

    try {
      await onAdd({
        owner: parsed.owner,
        name: parsed.name,
        branch: branch || "main",
        enabled: true,
      });

      setRepoUrl("");
      setBranch("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("skills.repo.addFailed"));
    }
  };

  const handleOpenRepo = async (owner: string, name: string) => {
    try {
      await settingsApi.openExternal(`https://github.com/${owner}/${name}`);
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent zIndex="nested" size="default">
        <DialogHeader>
          <DialogHeaderText>
            <DialogTitle>{t("skills.repo.title")}</DialogTitle>
          </DialogHeaderText>
          <DialogCloseButton aria-label={t("common.close", "关闭")} />
        </DialogHeader>

        <DialogBody className="py-4">
          <div className="skills-repo-add-card">
            <h3>{t("skills.addRepo")}</h3>
            <div className="ez-form-grid ez-form-grid--stacked">
              <div className="ez-form-field">
                <Label htmlFor="repo-url" variant="form">
                  {t("skills.repo.url")}
                </Label>
                <Input
                  id="repo-url"
                  variant="modal-mono"
                  placeholder={t("skills.repo.urlPlaceholder")}
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
              </div>
              <div className="ez-form-field">
                <Label htmlFor="branch" variant="form">
                  {t("skills.repo.branch")}
                </Label>
                <Input
                  id="branch"
                  variant="modal"
                  placeholder={t("skills.repo.branchPlaceholder")}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                />
              </div>
              {error ? (
                <p className="text-[12px] text-[var(--shell-error)]">{error}</p>
              ) : null}
              <div className="skills-repo-add-actions">
                <Button
                  type="button"
                  variant="btn-primary"
                  icon={Plus}
                  onClick={handleAdd}
                >
                  {t("skills.repo.add")}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[13px] font-semibold text-[var(--shell-text-primary)]">
              {t("skills.repo.list")}
            </h3>
            {repos.length === 0 ? (
              <div className="skills-repo-empty">
                <p>{t("skills.repo.empty")}</p>
              </div>
            ) : (
              <div className="skills-repo-list">
                {repos.map((repo) => (
                  <div
                    key={`${repo.owner}/${repo.name}`}
                    className="skills-repo-row"
                  >
                    <div className="skills-repo-row-info">
                      <div className="skills-repo-row-name">
                        {repo.owner}/{repo.name}
                      </div>
                      <div className="skills-repo-row-meta">
                        <span className="branch">{repo.branch || "main"}</span>
                        <span className="count">
                          {t("skills.repo.skillCount", {
                            count: getSkillCount(repo),
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="skills-repo-row-actions">
                      <Button
                        type="button"
                        variant="icon-shell"
                        icon={ExternalLink}
                        onClick={() => handleOpenRepo(repo.owner, repo.name)}
                        title={t("common.view", { defaultValue: "查看" })}
                        aria-label={`${t("common.view", { defaultValue: "查看" })} ${repo.owner}/${repo.name}`}
                      />
                      <Button
                        type="button"
                        variant="icon-shell"
                        className="del"
                        icon={Trash2}
                        onClick={() => onRemove(repo.owner, repo.name)}
                        title={t("common.delete")}
                        aria-label={`${t("common.delete")} ${repo.owner}/${repo.name}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="btn" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
