import type { AppId } from "@/lib/api";
import { PROVIDER_TAB_APP_IDS } from "@/config/appConfig";
import { providerPresets } from "@/config/claudeProviderPresets";
import { codexProviderPresets } from "@/config/codexProviderPresets";
import { hermesProviderPresets } from "@/config/hermesProviderPresets";
import type { ProviderCategory } from "@/types";
import { extractApiBaseUrlFromConfig } from "@/utils/providerDisplay";
import { extractCodexBaseUrl } from "@/utils/providerConfigUtils";

export type ModelsAppId = (typeof PROVIDER_TAB_APP_IDS)[number];

/**
 * 模型中心目录厂商白名单 — 对齐 models.html 209-219。
 * 官方 / 自定义模板预设始终保留；其余仅展示此清单内厂商。
 */
export const MODELS_DIRECTORY_VENDOR_NAMES = new Set([
  "Kimi",
  "Kimi For Coding",
  "火山Agentplan",
  "DouBaoSeed",
  "DeepSeek",
  "Zhipu GLM",
  "Baidu Qianfan Coding Plan",
  "Bailian",
  "MiniMax",
  "Xiaomi MiMo",
  "SiliconFlow",
]);

export interface VendorPresetLike {
  name: string;
  nameKey?: string;
  hidden?: boolean;
  isOfficial?: boolean;
  isCustomTemplate?: boolean;
  category?: ProviderCategory;
  icon?: string;
  iconColor?: string;
  apiFormat?: string;
  websiteUrl: string;
  subtitleHint?: string;
}

export interface VendorPresetItem {
  presetId: string;
  name: string;
  nameKey?: string;
  icon?: string;
  iconColor?: string;
  apiFormat?: string;
  category?: ProviderCategory;
  /** API Base URL（优先展示） */
  baseUrl?: string;
  websiteUrl: string;
  subtitleHint?: string;
}

/** 是否在模型中心 / 添加供应商目录中展示该预设 */
export function isModelsDirectoryVendor(preset: VendorPresetLike): boolean {
  if (preset.hidden) return false;
  if (
    preset.isOfficial ||
    preset.category === "official" ||
    preset.isCustomTemplate
  ) {
    return true;
  }
  return MODELS_DIRECTORY_VENDOR_NAMES.has(preset.name);
}

export function filterPresetEntriesForModelsDirectory<T extends VendorPresetLike>(
  presets: T[],
  idPrefix: string,
): Array<{ id: string; preset: T }> {
  return presets
    .map((preset, index) => ({ preset, index }))
    .filter(({ preset }) => isModelsDirectoryVendor(preset))
    .map(({ preset, index }) => ({
      id: `${idPrefix}-${index}`,
      preset,
    }));
}

function toVendorPresetItem(
  preset: VendorPresetLike,
  index: number,
  idPrefix: string,
  extras?: Partial<VendorPresetItem>,
): VendorPresetItem {
  return {
    presetId: `${idPrefix}-${index}`,
    name: preset.name,
    nameKey: preset.nameKey,
    icon: preset.icon,
    iconColor: preset.iconColor,
    apiFormat: preset.apiFormat,
    category: preset.category,
    websiteUrl: preset.websiteUrl,
    subtitleHint: preset.subtitleHint,
    ...extras,
  };
}

export function isModelsAppId(app: AppId): app is ModelsAppId {
  return (PROVIDER_TAB_APP_IDS as readonly AppId[]).includes(app);
}

export function getVisibleModelsAppIds(
  visibleApps?: Partial<Record<AppId, boolean>>,
): ModelsAppId[] {
  return PROVIDER_TAB_APP_IDS.filter((app) => visibleApps?.[app] !== false);
}

export function getDefaultModelsAppId(
  activeApp: AppId,
  visibleApps?: Partial<Record<AppId, boolean>>,
): ModelsAppId {
  if (isModelsAppId(activeApp) && visibleApps?.[activeApp] !== false) {
    return activeApp;
  }
  const first = PROVIDER_TAB_APP_IDS.find((app) => visibleApps?.[app] !== false);
  return first ?? "claude";
}

/**
 * 各 app 厂商目录数据来源：
 * - claude → claudeProviderPresets.ts (providerPresets)
 * - codex  → codexProviderPresets.ts
 * - hermes → hermesProviderPresets.ts
 */
export function getVendorPresetsForApp(appId: ModelsAppId): VendorPresetItem[] {
  if (appId === "codex") {
    return codexProviderPresets
      .map((preset, index) => ({ preset, index }))
      .filter(({ preset }) => isModelsDirectoryVendor(preset))
      .map(({ preset, index }) =>
        toVendorPresetItem(preset, index, "codex", {
          apiFormat: preset.apiFormat,
          baseUrl: extractCodexBaseUrl(preset.config) ?? undefined,
        }),
      );
  }

  if (appId === "hermes") {
    return hermesProviderPresets
      .map((preset, index) => ({ preset, index }))
      .filter(({ preset }) => isModelsDirectoryVendor(preset))
      .map(({ preset, index }) =>
        toVendorPresetItem(preset, index, "hermes", {
          subtitleHint: preset.settingsConfig.models?.[0]?.id,
          baseUrl: extractApiBaseUrlFromConfig(preset.settingsConfig),
        }),
      );
  }

  return providerPresets
    .map((preset, index) => ({ preset, index }))
    .filter(({ preset }) => isModelsDirectoryVendor(preset))
    .map(({ preset, index }) =>
      toVendorPresetItem(preset, index, "claude", {
        baseUrl: extractApiBaseUrlFromConfig(preset.settingsConfig),
      }),
    );
}
