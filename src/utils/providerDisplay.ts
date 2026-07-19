import type { TFunction } from "i18next";
import type { AppId } from "@/lib/api";
import type { Provider, ProviderCategory } from "@/types";
import {
  extractCodexBaseUrl,
  extractCodexExperimentalBearerToken,
  extractCodexModelName,
  getApiKeyFromConfig,
} from "@/utils/providerConfigUtils";

export function formatHost(url?: string): string {
  if (!url?.trim()) return "-";
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/**
 * 从 settingsConfig / Codex TOML 提取真实 API Base URL（不含 websiteUrl / notes）。
 */
export function extractApiBaseUrlFromConfig(
  settingsConfig: unknown,
): string | undefined {
  if (!settingsConfig || typeof settingsConfig !== "object") return undefined;

  const record = settingsConfig as Record<string, unknown>;

  if (typeof record.base_url === "string" && record.base_url.trim()) {
    return record.base_url.trim();
  }

  const env = record.env as Record<string, unknown> | undefined;
  const envBase =
    env?.ANTHROPIC_BASE_URL ??
    env?.GOOGLE_GEMINI_BASE_URL ??
    env?.GEMINI_BASE_URL;
  if (typeof envBase === "string" && envBase.trim()) {
    return envBase.trim();
  }

  const codexConfig = record.config;
  if (typeof codexConfig === "string" && codexConfig.includes("base_url")) {
    const extracted = extractCodexBaseUrl(codexConfig);
    if (extracted) return extracted;
  }

  return undefined;
}

/** 优先 API baseUrl，没有则用 websiteUrl；展示前需再 formatHost */
export function resolveDisplayBaseUrl(
  baseUrl?: string | null,
  websiteUrl?: string | null,
): string | undefined {
  const base = baseUrl?.trim();
  if (base) return base;
  const website = websiteUrl?.trim();
  if (website) return website;
  return undefined;
}

export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, Math.min(7, trimmed.length))}••••••••`;
}

export function extractProviderApiUrl(
  provider: Provider,
  fallbackText: string,
): string {
  if (provider.notes?.trim()) {
    return provider.notes.trim();
  }

  if (provider.websiteUrl) {
    return provider.websiteUrl;
  }

  return (
    extractApiBaseUrlFromConfig(provider.settingsConfig) ?? fallbackText
  );
}

export function extractProviderApiKey(
  provider: Provider,
  appId: AppId,
): string {
  const config = provider.settingsConfig;
  if (!config || typeof config !== "object") return "";

  if (appId === "codex") {
    const auth = (config as Record<string, unknown>).auth as
      | Record<string, unknown>
      | undefined;
    const openaiKey = auth?.OPENAI_API_KEY;
    if (typeof openaiKey === "string" && openaiKey.trim()) {
      return openaiKey.trim();
    }
    const codexConfig = (config as Record<string, unknown>).config;
    if (typeof codexConfig === "string") {
      const bearer = extractCodexExperimentalBearerToken(codexConfig);
      if (bearer) return bearer;
    }
    return "";
  }

  if (appId === "hermes") {
    const apiKey = (config as Record<string, unknown>).api_key;
    return typeof apiKey === "string" ? apiKey.trim() : "";
  }

  try {
    const appType = appId === "gemini" ? "gemini" : undefined;
    return getApiKeyFromConfig(JSON.stringify(config), appType);
  } catch {
    return "";
  }
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstModelIdFromArray(models: unknown): string {
  if (!Array.isArray(models) || models.length === 0) return "";
  const first = recordValue(models[0]);
  return stringValue(first.id ?? first.model ?? first.name ?? first.value);
}

function firstModelIdFromRecord(models: unknown): string {
  if (!models || typeof models !== "object" || Array.isArray(models)) {
    return "";
  }
  const [firstId] = Object.keys(models as Record<string, unknown>);
  return firstId ? stringValue(firstId) : "";
}

export function extractProviderModelId(
  provider: Provider,
  appId: AppId,
): string {
  const config = provider.settingsConfig;
  if (!config || typeof config !== "object") return "";

  const settings = config as Record<string, unknown>;

  if (appId === "claude") {
    const env = recordValue(settings.env);
    const candidates = [
      env.ANTHROPIC_MODEL,
      env.ANTHROPIC_MODEL_NAME,
      env.ANTHROPIC_DEFAULT_SONNET_MODEL,
      env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME,
      env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
      env.ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME,
      env.ANTHROPIC_DEFAULT_OPUS_MODEL,
      env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME,
    ];
    for (const candidate of candidates) {
      const value = stringValue(candidate);
      if (value) return value;
    }
    return "";
  }

  if (appId === "codex") {
    const configText = stringValue(settings.config);
    const fromToml = extractCodexModelName(configText);
    if (fromToml) return fromToml;

    const catalog = recordValue(settings.modelCatalog).models;
    if (Array.isArray(catalog) && catalog.length > 0) {
      const first = recordValue(catalog[0]);
      const id = stringValue(first.model ?? first.id ?? first.value);
      if (id) return id;
    }
    return "";
  }

  if (appId === "gemini") {
    const env = recordValue(settings.env);
    return stringValue(env.GEMINI_MODEL);
  }

  if (appId === "opencode") {
    return (
      firstModelIdFromRecord(settings.models) ||
      firstModelIdFromArray(settings.models)
    );
  }

  if (appId === "openclaw" || appId === "hermes") {
    return (
      firstModelIdFromArray(settings.models) ||
      firstModelIdFromRecord(settings.models)
    );
  }

  return "";
}

export function getProviderModelSubtitle(
  provider: Provider,
  appId: AppId,
): string {
  const parts: string[] = [];

  const config = provider.settingsConfig;
  if (appId === "hermes" && config && typeof config === "object") {
    const models = (config as Record<string, unknown>).models;
    if (Array.isArray(models) && models.length > 0) {
      const first = models[0] as { id?: string };
      if (first?.id) parts.push(first.id);
    }
  }

  if (provider.meta?.apiFormat) {
    parts.push(provider.meta.apiFormat);
  } else if (parts.length === 0) {
    parts.push(provider.id);
  }

  return parts.join(" · ");
}

const CATEGORY_LABEL_KEYS: Record<ProviderCategory, string> = {
  official: "models.category.official",
  cn_official: "models.category.cnOfficial",
  cloud_provider: "models.category.cloudProvider",
  aggregator: "models.category.aggregator",
  third_party: "models.category.thirdParty",
  custom: "models.category.custom",
  omo: "models.category.omo",
  "omo-slim": "models.category.omoSlim",
};

const CATEGORY_FALLBACKS: Record<ProviderCategory, string> = {
  official: "官方",
  cn_official: "国内官方",
  cloud_provider: "云服务商",
  aggregator: "聚合",
  third_party: "第三方",
  custom: "自定义",
  omo: "OMO",
  "omo-slim": "OMO Slim",
};

export function getProviderCategoryLabel(
  category: ProviderCategory | undefined,
  t: TFunction,
): string {
  if (!category) return "-";
  const key = CATEGORY_LABEL_KEYS[category];
  return t(key, { defaultValue: CATEGORY_FALLBACKS[category] });
}

export function getPresetInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

/** 统一 API 网关可同步到的应用 */
export const UNIVERSAL_SYNC_APP_IDS = ["claude", "codex"] as const;
export type UniversalSyncAppId = (typeof UNIVERSAL_SYNC_APP_IDS)[number];

/** 统一 API 网关同步到各应用后生成的子模型 ID 前缀 */
const UNIVERSAL_SYNCED_PROVIDER_PREFIXES = [
  "universal-claude-",
  "universal-codex-",
  "universal-gemini-",
] as const;

/** 统一网关同步到指定应用后的子模型 ID：`universal-{app}-{id}` */
export function getUniversalSyncedProviderId(
  universalId: string,
  appId: UniversalSyncAppId,
): string {
  return `universal-${appId}-${universalId}`;
}

/** 是否为统一网关同步产物（模型中心主网格应去重，仅由 ModelsUniversalGrid 展示） */
export function isUniversalSyncedProviderId(id: string): boolean {
  return UNIVERSAL_SYNCED_PROVIDER_PREFIXES.some((prefix) =>
    id.startsWith(prefix),
  );
}
