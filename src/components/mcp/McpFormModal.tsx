import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import JsonEditor from "@/components/JsonEditor";
import type { AppId } from "@/lib/api/types";
import { McpServer, McpServerSpec } from "@/types";
import { mcpPresets, getMcpPresetWithDescription } from "@/config/mcpPresets";
import McpWizardModal from "./McpWizardModal";
import {
  extractErrorMessage,
  translateMcpBackendError,
} from "@/utils/errorUtils";
import {
  tomlToMcpServer,
  extractIdFromToml,
  mcpServerToToml,
} from "@/utils/tomlUtils";
import { normalizeTomlText } from "@/utils/textNormalization";
import { parseSmartMcpJson } from "@/utils/formatters";
import { useMcpValidation } from "./useMcpValidation";
import { useUpsertMcpServer } from "@/hooks/useMcp";
import { useDarkMode } from "@/hooks/useDarkMode";

interface McpFormModalProps {
  editingId?: string;
  initialData?: McpServer;
  onSave: () => Promise<void>;
  onClose: () => void;
  existingIds?: string[];
  defaultFormat?: "json" | "toml";
  defaultEnabledApps?: AppId[];
}

const FORM_APP_IDS: AppId[] = [
  "claude",
  "codex",
 // "gemini",
 // "opencode",
 // "openclaw",
  "hermes",
];

function parseConfigPreview(
  formConfig: string,
  useToml: boolean,
): McpServerSpec | null {
  if (!formConfig.trim() || useToml) return null;
  try {
    const parsed = JSON.parse(formConfig);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as McpServerSpec;
    }
  } catch {
    return null;
  }
  return null;
}

const McpFormModal: React.FC<McpFormModalProps> = ({
  editingId,
  initialData,
  onSave,
  onClose,
  existingIds = [],
  defaultFormat = "json",
  defaultEnabledApps = ["claude", "codex", "hermes"],
}) => {
  const { t } = useTranslation();
  const isDarkMode = useDarkMode();
  const { formatTomlError, validateTomlConfig, validateJsonConfig } =
    useMcpValidation();

  const upsertMutation = useUpsertMcpServer();

  const [formId, setFormId] = useState(
    () => editingId || initialData?.id || "",
  );
  const [formName, setFormName] = useState(initialData?.name || "");
  const [formDescription, setFormDescription] = useState(
    initialData?.description || "",
  );
  const [formHomepage, setFormHomepage] = useState(initialData?.homepage || "");
  const [formDocs, setFormDocs] = useState(initialData?.docs || "");
  const [formTags, setFormTags] = useState(initialData?.tags?.join(", ") || "");

  const [enabledApps, setEnabledApps] = useState<{
    claude: boolean;
    codex: boolean;
    gemini: boolean;
    opencode: boolean;
    openclaw: boolean;
    hermes: boolean;
  }>(() => {
    if (initialData?.apps) {
      return { ...initialData.apps };
    }
    return {
      claude: defaultEnabledApps.includes("claude"),
      codex: defaultEnabledApps.includes("codex"),
      gemini: defaultEnabledApps.includes("gemini"),
      opencode: defaultEnabledApps.includes("opencode"),
      openclaw: defaultEnabledApps.includes("openclaw"),
      hermes: defaultEnabledApps.includes("hermes"),
    };
  });

  const isEditing = !!editingId;

  const hasAdditionalInfo = !!(
    initialData?.description ||
    initialData?.tags?.length ||
    initialData?.homepage ||
    initialData?.docs
  );

  const [showMetadata, setShowMetadata] = useState(
    isEditing ? hasAdditionalInfo : false,
  );

  const useTomlFormat = useMemo(() => {
    if (initialData?.server) {
      return defaultFormat === "toml";
    }
    return defaultFormat === "toml";
  }, [defaultFormat, initialData]);

  const [formConfig, setFormConfig] = useState(() => {
    const spec = initialData?.server;
    if (!spec) return "";
    if (useTomlFormat) {
      return mcpServerToToml(spec);
    }
    return JSON.stringify(spec, null, 2);
  });

  const [configError, setConfigError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [idError, setIdError] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    isEditing ? null : -1,
  );

  const useToml = useTomlFormat;

  const wizardInitialSpec = useMemo(() => {
    const fallback = initialData?.server;
    if (!formConfig.trim()) {
      return fallback;
    }

    if (useToml) {
      try {
        return tomlToMcpServer(formConfig);
      } catch {
        return fallback;
      }
    }

    try {
      const parsed = JSON.parse(formConfig);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as McpServerSpec;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }, [formConfig, initialData, useToml]);

  const configPreview = useMemo(
    () => parseConfigPreview(formConfig, useToml),
    [formConfig, useToml],
  );

  const handleIdChange = (value: string) => {
    setFormId(value);
    if (!isEditing) {
      const exists = existingIds.includes(value.trim());
      setIdError(exists ? t("mcp.error.idExists") : "");
    }
  };

  const ensureUniqueId = (base: string): string => {
    let candidate = base.trim();
    if (!candidate) candidate = "mcp-server";
    if (!existingIds.includes(candidate)) return candidate;
    let i = 1;
    while (existingIds.includes(`${candidate}-${i}`)) i++;
    return `${candidate}-${i}`;
  };

  const applyPreset = (index: number) => {
    if (index < 0 || index >= mcpPresets.length) return;
    const preset = mcpPresets[index];
    const presetWithDesc = getMcpPresetWithDescription(preset, t);

    const id = ensureUniqueId(presetWithDesc.id);
    setFormId(id);
    setFormName(presetWithDesc.name || presetWithDesc.id);
    setFormDescription(presetWithDesc.description || "");
    setFormHomepage(presetWithDesc.homepage || "");
    setFormDocs(presetWithDesc.docs || "");
    setFormTags(presetWithDesc.tags?.join(", ") || "");

    if (useToml) {
      const toml = mcpServerToToml(presetWithDesc.server);
      setFormConfig(toml);
      setConfigError(validateTomlConfig(toml));
    } else {
      const json = JSON.stringify(presetWithDesc.server, null, 2);
      setFormConfig(json);
      setConfigError(validateJsonConfig(json));
    }
    setSelectedPreset(index);
  };

  const applyCustom = () => {
    setSelectedPreset(-1);
    setFormId("");
    setFormName("");
    setFormDescription("");
    setFormHomepage("");
    setFormDocs("");
    setFormTags("");
    setFormConfig("");
    setConfigError("");
  };

  const handleConfigChange = (value: string) => {
    const nextValue = useToml ? normalizeTomlText(value) : value;
    setFormConfig(nextValue);

    if (useToml) {
      const err = validateTomlConfig(nextValue);
      if (err) {
        setConfigError(err);
        return;
      }

      if (nextValue.trim() && !formId.trim()) {
        const extractedId = extractIdFromToml(nextValue);
        if (extractedId) {
          setFormId(extractedId);
        }
      }
    } else {
      try {
        const result = parseSmartMcpJson(value);
        const configJson = JSON.stringify(result.config);
        const validationErr = validateJsonConfig(configJson);

        if (validationErr) {
          setConfigError(validationErr);
          return;
        }

        if (result.id && !formId.trim() && !isEditing) {
          const uniqueId = ensureUniqueId(result.id);
          setFormId(uniqueId);

          if (!formName.trim()) {
            setFormName(result.id);
          }
        }

        setConfigError("");
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : String(err);
        setConfigError(t("mcp.error.jsonInvalid") + ": " + errorMessage);
      }
    }
  };

  const handleWizardApply = (title: string, json: string) => {
    setFormId(title);
    if (!formName.trim()) {
      setFormName(title);
    }
    if (useToml) {
      try {
        const server = JSON.parse(json) as McpServerSpec;
        const toml = mcpServerToToml(server);
        setFormConfig(toml);
        setConfigError(validateTomlConfig(toml));
      } catch {
        setConfigError(t("mcp.error.jsonInvalid"));
      }
    } else {
      setFormConfig(json);
      setConfigError(validateJsonConfig(json));
    }
  };

  const handleSubmit = async () => {
    const trimmedId = formId.trim();
    if (!trimmedId) {
      toast.error(t("mcp.error.idRequired"), { duration: 3000 });
      return;
    }

    if (!isEditing && existingIds.includes(trimmedId)) {
      setIdError(t("mcp.error.idExists"));
      return;
    }

    let serverSpec: McpServerSpec;

    if (useToml) {
      const tomlError = validateTomlConfig(formConfig);
      setConfigError(tomlError);
      if (tomlError) {
        toast.error(t("mcp.error.tomlInvalid"), { duration: 3000 });
        return;
      }

      if (!formConfig.trim()) {
        serverSpec = {
          type: "stdio",
          command: "",
          args: [],
        };
      } else {
        try {
          serverSpec = tomlToMcpServer(formConfig);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          setConfigError(formatTomlError(msg));
          toast.error(t("mcp.error.tomlInvalid"), { duration: 4000 });
          return;
        }
      }
    } else {
      if (!formConfig.trim()) {
        serverSpec = {
          type: "stdio",
          command: "",
          args: [],
        };
      } else {
        try {
          const result = parseSmartMcpJson(formConfig);
          serverSpec = result.config as McpServerSpec;
        } catch (e: unknown) {
          const errorMessage =
            e instanceof Error ? e.message : String(e);
          setConfigError(t("mcp.error.jsonInvalid") + ": " + errorMessage);
          toast.error(t("mcp.error.jsonInvalid"), { duration: 4000 });
          return;
        }
      }
    }

    if (serverSpec?.type === "stdio" && !serverSpec?.command?.trim()) {
      toast.error(t("mcp.error.commandRequired"), { duration: 3000 });
      return;
    }
    if (
      (serverSpec?.type === "http" || serverSpec?.type === "sse") &&
      !serverSpec?.url?.trim()
    ) {
      toast.error(t("mcp.wizard.urlRequired"), { duration: 3000 });
      return;
    }

    setSaving(true);
    try {
      const nameTrimmed = (formName || trimmedId).trim();
      const finalName = nameTrimmed || trimmedId;

      const entry: McpServer = {
        ...(initialData ? { ...initialData } : {}),
        id: trimmedId,
        name: finalName,
        server: serverSpec,
        apps: enabledApps,
      };

      const descriptionTrimmed = formDescription.trim();
      if (descriptionTrimmed) {
        entry.description = descriptionTrimmed;
      } else {
        delete entry.description;
      }

      const homepageTrimmed = formHomepage.trim();
      if (homepageTrimmed) {
        entry.homepage = homepageTrimmed;
      } else {
        delete entry.homepage;
      }

      const docsTrimmed = formDocs.trim();
      if (docsTrimmed) {
        entry.docs = docsTrimmed;
      } else {
        delete entry.docs;
      }

      const parsedTags = formTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      if (parsedTags.length > 0) {
        entry.tags = parsedTags;
      } else {
        delete entry.tags;
      }

      await upsertMutation.mutateAsync(entry);
      toast.success(t("common.success"), { closeButton: true });
      await onSave();
    } catch (error: unknown) {
      const detail = extractErrorMessage(error);
      const mapped = translateMcpBackendError(detail, t);
      const msg = mapped || detail || t("mcp.error.saveFailed");
      toast.error(msg, { duration: mapped || detail ? 6000 : 4000 });
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = isEditing ? t("mcp.editServer") : t("mcp.addServer");
  const modalSubtitle = isEditing
    ? t("mcp.form.editServerSubtitle")
    : t("mcp.form.addServerSubtitle");

  const previewRows = useMemo(() => {
    if (!configPreview) return [];
    const rows: Array<{ key: string; value: string }> = [];
    if (configPreview.type) {
      rows.push({
        key: t("mcp.form.previewType"),
        value: configPreview.type,
      });
    }
    if (configPreview.command) {
      rows.push({
        key: t("mcp.form.previewCommand"),
        value: configPreview.command,
      });
    }
    if (configPreview.url) {
      rows.push({ key: t("mcp.form.previewUrl"), value: configPreview.url });
    }
    if (configPreview.args?.length) {
      rows.push({
        key: t("mcp.form.previewArgs"),
        value: configPreview.args.join("\n"),
      });
    }
    if (configPreview.env && typeof configPreview.env === "object") {
      const keys = Object.keys(configPreview.env);
      if (keys.length) {
        rows.push({
          key: t("mcp.form.previewEnv"),
          value: keys.join(", "),
        });
      }
    }
    if (configPreview.headers && typeof configPreview.headers === "object") {
      const keys = Object.keys(configPreview.headers);
      if (keys.length) {
        rows.push({
          key: t("mcp.form.previewHeaders"),
          value: keys.join(", "),
        });
      }
    }
    return rows;
  }, [configPreview, t]);

  return (
    <>
      <Dialog
        open
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
      >
        <DialogContent
          size="lg"
          className="mcp-form-dialog [&_.ez-modal-content__inner]:max-h-[88vh]"
        >
          <DialogHeader>
            <DialogHeaderText>
              <DialogTitle>{modalTitle}</DialogTitle>
              <DialogDescription>{modalSubtitle}</DialogDescription>
            </DialogHeaderText>
            <DialogCloseButton aria-label={t("common.close", "关闭")} />
          </DialogHeader>

          <DialogBody className="mcp-form-dialog__body">
            {!isEditing ? (
              <section className="ez-modal-section">
                <h3 className="ez-modal-section-title">
                  {t("mcp.form.presetSection")}
                </h3>
                <div className="ez-preset-row">
                  <button
                    type="button"
                    className={`btn btn-sm preset-btn${selectedPreset === -1 ? " active" : ""}`}
                    onClick={applyCustom}
                  >
                    {t("presetSelector.custom")}
                  </button>
                  {mcpPresets.map((preset, idx) => {
                    const descriptionKey = `mcp.presets.${preset.id}.description`;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`btn btn-sm preset-btn${selectedPreset === idx ? " active" : ""}`}
                        onClick={() => applyPreset(idx)}
                        title={t(descriptionKey)}
                      >
                        {preset.id}
                      </button>
                    );
                  })}
                </div>
                <span className="ez-form-help">{t("mcp.form.presetHelp")}</span>
              </section>
            ) : null}

            <section className="ez-modal-section">
              <h3 className="ez-modal-section-title">
                {t("mcp.form.basicSection")}
              </h3>
              <div className="ez-form-grid">
                <div className="ez-form-field">
                  <div className="mcp-form-dialog__field-head">
                    <Label htmlFor="mcp-form-id" variant="form">
                      {t("mcp.form.title")}{" "}
                      <span className="text-[var(--shell-error)]">*</span>
                    </Label>
                    {!isEditing && idError ? (
                      <span className="ez-form-error">{idError}</span>
                    ) : null}
                  </div>
                  <Input
                    id="mcp-form-id"
                    variant="modal-mono"
                    placeholder={t("mcp.form.titlePlaceholder")}
                    value={formId}
                    onChange={(e) => handleIdChange(e.target.value)}
                    disabled={isEditing}
                  />
                  {!isEditing ? (
                    <span className="ez-form-help">{t("mcp.form.idHelp")}</span>
                  ) : null}
                </div>

                <div className="ez-form-field">
                  <Label htmlFor="mcp-form-name" variant="form">
                    {t("mcp.form.name")}
                  </Label>
                  <Input
                    id="mcp-form-name"
                    variant="modal"
                    placeholder={t("mcp.form.namePlaceholder")}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="ez-modal-section">
              <div className="mcp-form-dialog__field-head mb-3">
                <h3 className="ez-modal-section-title mb-0 border-0 pb-0">
                  {t("mcp.form.serverSection")}
                </h3>
                {(isEditing || selectedPreset === -1) && (
                  <button
                    type="button"
                    className="mcp-form-dialog__wizard-link"
                    onClick={() => setIsWizardOpen(true)}
                  >
                    {t("mcp.form.useWizard")}
                  </button>
                )}
              </div>

              <div className="ez-form-field">
                <Label htmlFor="mcp-form-config" variant="form">
                  {useToml ? t("mcp.form.tomlConfig") : t("mcp.form.jsonConfig")}{" "}
                  <span className="text-[var(--shell-error)]">*</span>
                </Label>
                <div className="mcp-form-dialog__editor">
                  <JsonEditor
                    value={formConfig}
                    onChange={handleConfigChange}
                    placeholder={
                      useToml
                        ? t("mcp.form.tomlPlaceholder")
                        : t("mcp.form.jsonPlaceholder")
                    }
                    darkMode={isDarkMode}
                    rows={8}
                    showValidation={!useToml}
                    language={useToml ? "javascript" : "json"}
                    height="160px"
                  />
                </div>
                {configError ? (
                  <div className="mcp-form-dialog__config-error">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <span>{configError}</span>
                  </div>
                ) : null}
                <span className="ez-form-help">{t("mcp.form.configHelp")}</span>
              </div>

              {!useToml ? (
                <div className="mcp-config-preview mt-3">
                  <div className="mcp-config-preview__label">
                    {t("mcp.form.configPreviewLabel")}
                  </div>
                  {previewRows.length > 0 ? (
                    <div className="mcp-config-preview__grid">
                      {previewRows.map((row) => (
                        <React.Fragment key={row.key}>
                          <span className="mcp-config-preview__key">
                            {row.key}
                          </span>
                          <span className="mcp-config-preview__val whitespace-pre-wrap">
                            {row.value}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <span className="mcp-config-preview__empty">
                      {t("mcp.form.configPreviewEmpty")}
                    </span>
                  )}
                </div>
              ) : null}
            </section>

            <section className="ez-modal-section">
              <h3 className="ez-modal-section-title">
                {t("mcp.form.enabledApps")}
              </h3>
              <div className="ez-sync-targets">
                {FORM_APP_IDS.map((app) => {
                  const label = t(`mcp.unifiedPanel.apps.${app}`);
                  const inputId = `mcp-enable-${app}`;
                  return (
                    <label key={app} className="ez-sync-target" htmlFor={inputId}>
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={enabledApps[app] ?? false}
                        onChange={(e) =>
                          setEnabledApps({
                            ...enabledApps,
                            [app]: e.target.checked,
                          })
                        }
                      />
                      <span className="ez-sync-target__name">{label}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="ez-modal-section">
              <button
                type="button"
                aria-expanded={showMetadata}
                className={`ez-modal-section-title ez-modal-section-title--toggle${showMetadata ? " is-open" : ""}`}
                onClick={() => setShowMetadata(!showMetadata)}
              >
                <ChevronRight size={14} className="chevron" />
                {t("mcp.form.metaSection")}
              </button>
              {showMetadata ? (
                <div className="ez-form-grid mt-3">
                  <div className="ez-form-field col-span-full">
                    <Label htmlFor="mcp-form-desc" variant="form">
                      {t("mcp.form.description")}
                    </Label>
                    <Input
                      id="mcp-form-desc"
                      variant="modal"
                      placeholder={t("mcp.form.descriptionPlaceholder")}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                  <div className="ez-form-field">
                    <Label htmlFor="mcp-form-tags" variant="form">
                      {t("mcp.form.tags")}
                    </Label>
                    <Input
                      id="mcp-form-tags"
                      variant="modal"
                      placeholder={t("mcp.form.tagsPlaceholder")}
                      value={formTags}
                      onChange={(e) => setFormTags(e.target.value)}
                    />
                  </div>
                  <div className="ez-form-field">
                    <Label htmlFor="mcp-form-homepage" variant="form">
                      {t("mcp.form.homepage")}
                    </Label>
                    <Input
                      id="mcp-form-homepage"
                      variant="modal-mono"
                      placeholder={t("mcp.form.homepagePlaceholder")}
                      value={formHomepage}
                      onChange={(e) => setFormHomepage(e.target.value)}
                    />
                  </div>
                  <div className="ez-form-field col-span-full">
                    <Label htmlFor="mcp-form-docs" variant="form">
                      {t("mcp.form.docs")}
                    </Label>
                    <Input
                      id="mcp-form-docs"
                      variant="modal-mono"
                      placeholder={t("mcp.form.docsPlaceholder")}
                      value={formDocs}
                      onChange={(e) => setFormDocs(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </section>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={saving || (!isEditing && !!idError)}
            >
              {saving
                ? t("common.saving")
                : isEditing
                  ? t("common.save")
                  : t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <McpWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onApply={handleWizardApply}
        initialTitle={formId}
        initialServer={wizardInitialSpec}
      />
    </>
  );
};

export default McpFormModal;
