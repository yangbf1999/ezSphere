import type { ModelConfig } from '../../api/types';
import { providersApi, universalProvidersApi } from '../../lib/api';
import type { AppId } from '../../lib/api';
import type { Provider, UniversalProvider } from '../../types';
import {
  extractCodexBaseUrl,
  extractCodexExperimentalBearerToken,
  extractCodexModelName,
  getApiKeyFromConfig,
} from '../../utils/providerConfigUtils';

const AGENT_APP_IDS: AppId[] = ['claude', 'codex', 'gemini', 'opencode', 'openclaw', 'hermes'];
const ANTHROPIC_DEFAULT_BASE_URL = 'https://api.anthropic.com';
const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const GEMINI_DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const CLAUDE_DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const CODEX_DEFAULT_MODEL = 'gpt-4o';
const GEMINI_DEFAULT_MODEL = 'gemini-2.5-pro';

type ModelEntry = { id: string; label?: string };

const stringValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const usableValue = (value: unknown): string => {
  const text = stringValue(value);
  return text && !text.includes('${') ? text : '';
};

const recordValue = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};

const uniqueStrings = (values: unknown[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const text = stringValue(value);
    if (!text || seen.has(text)) return;
    seen.add(text);
    result.push(text);
  });
  return result;
};

const jsonOf = (value: unknown): string => {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return '{}';
  }
};

const modelDisplayName = (providerName: string, modelId: string, label?: string): string =>
  label && label !== modelId ? `${providerName} / ${label}` : `${providerName} / ${modelId}`;

const modelEntry = (id: string, label?: string): ModelEntry | null =>
  id ? { id, ...(label ? { label } : {}) } : null;

function addModel(
  models: ModelConfig[],
  seen: Set<string>,
  options: {
    appId: string;
    providerId: string;
    providerName: string;
    modelId: string;
    label?: string;
    baseUrl: string;
    apiKey: string;
    anthropicUrl?: string;
  }
) {
  const modelId = stringValue(options.modelId);
  const baseUrl = usableValue(options.baseUrl);
  const apiKey = usableValue(options.apiKey);
  if (!modelId || !baseUrl) return;

  const providerMode = options.anthropicUrl ? 'anthropic' : 'openai';
  const key = `${options.appId}:${options.providerId}:${providerMode}:${baseUrl}:${modelId}`;
  if (seen.has(key)) return;
  seen.add(key);

  models.push({
    internalId: `ezsphere:${key}`,
    name: modelDisplayName(options.providerName, modelId, options.label),
    modelId,
    baseUrl,
    apiKey,
    anthropicUrl: usableValue(options.anthropicUrl),
    modelType: 'CLOUD',
  });
}

function collectCodexCatalogModels(settings: Record<string, any>): ModelEntry[] {
  const rawModels = recordValue(settings.modelCatalog).models;
  if (!Array.isArray(rawModels)) return [];

  return rawModels
    .map((item) => {
      const entry = recordValue(item);
      const id = stringValue(entry.model ?? entry.id ?? entry.value);
      const label = stringValue(entry.displayName ?? entry.name ?? entry.label);
      return modelEntry(id, label);
    })
    .filter((item): item is ModelEntry => Boolean(item));
}

function collectOpenCodeModels(settings: Record<string, any>): ModelEntry[] {
  const models = recordValue(settings.models);
  return Object.entries(models)
    .map(([id, value]) => {
      const label = stringValue(recordValue(value).name);
      return modelEntry(stringValue(id), label);
    })
    .filter((item): item is ModelEntry => Boolean(item));
}

function collectArrayModels(settings: Record<string, any>): ModelEntry[] {
  const rawModels = settings.models;
  if (Array.isArray(rawModels)) {
    return rawModels
      .map((item) => {
        const entry = recordValue(item);
        const id = stringValue(entry.id ?? entry.model ?? entry.name);
        const label = stringValue(entry.name ?? entry.alias);
        return modelEntry(id, label);
      })
      .filter((item): item is ModelEntry => Boolean(item));
  }

  return Object.entries(recordValue(rawModels))
    .map(([id, value]) => {
      const label = stringValue(recordValue(value).alias ?? recordValue(value).name);
      return modelEntry(stringValue(id), label);
    })
    .filter((item): item is ModelEntry => Boolean(item));
}

function collectClaudeModelIds(env: Record<string, any>): string[] {
  const modelIds = uniqueStrings([
    env.ANTHROPIC_MODEL,
    env.ANTHROPIC_MODEL_NAME,
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME,
    env.ANTHROPIC_DEFAULT_SONNET_MODEL,
    env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME,
    env.ANTHROPIC_DEFAULT_OPUS_MODEL,
    env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME,
    env.ANTHROPIC_DEFAULT_FABLE_MODEL,
    env.ANTHROPIC_DEFAULT_FABLE_MODEL_NAME,
  ]);
  return modelIds.length > 0 ? modelIds : [CLAUDE_DEFAULT_MODEL];
}

function addProviderModels(
  appId: AppId,
  provider: Provider,
  models: ModelConfig[],
  seen: Set<string>
) {
  const settings = recordValue(provider.settingsConfig);
  const providerName = provider.name || provider.id;

  if (appId === 'claude') {
    const env = recordValue(settings.env);
    const baseUrl = usableValue(env.ANTHROPIC_BASE_URL) || ANTHROPIC_DEFAULT_BASE_URL;
    const apiKey =
      usableValue(getApiKeyFromConfig(jsonOf(settings), 'claude')) ||
      usableValue(env.OPENROUTER_API_KEY) ||
      usableValue(env.GOOGLE_API_KEY) ||
      usableValue(settings.apiKey);
    collectClaudeModelIds(env).forEach((modelId) => {
      addModel(models, seen, {
        appId,
        providerId: provider.id,
        providerName,
        modelId,
        baseUrl,
        apiKey,
        anthropicUrl: baseUrl,
      });
    });
    return;
  }

  if (appId === 'codex') {
    const configText = stringValue(settings.config);
    const auth = recordValue(settings.auth);
    const baseUrl =
      usableValue(extractCodexBaseUrl(configText)) ||
      usableValue(settings.baseUrl) ||
      usableValue(settings.base_url) ||
      OPENAI_DEFAULT_BASE_URL;
    const apiKey =
      usableValue(auth.OPENAI_API_KEY) ||
      usableValue(settings.apiKey) ||
      usableValue(extractCodexExperimentalBearerToken(configText)) ||
      usableValue(getApiKeyFromConfig(jsonOf(settings), 'codex'));
    const catalog = collectCodexCatalogModels(settings);
    const configuredModel = stringValue(extractCodexModelName(configText));
    const modelEntries =
      catalog.length > 0 ? catalog : [{ id: configuredModel || CODEX_DEFAULT_MODEL }];

    modelEntries.forEach(({ id, label }) => {
      addModel(models, seen, {
        appId,
        providerId: provider.id,
        providerName,
        modelId: id,
        label,
        baseUrl,
        apiKey,
      });
    });
    return;
  }

  if (appId === 'gemini') {
    const env = recordValue(settings.env);
    const baseUrl = usableValue(env.GOOGLE_GEMINI_BASE_URL) || GEMINI_DEFAULT_BASE_URL;
    const apiKey =
      usableValue(env.GEMINI_API_KEY) ||
      usableValue(env.GOOGLE_API_KEY) ||
      usableValue(getApiKeyFromConfig(jsonOf(settings), 'gemini'));
    const modelId = stringValue(env.GEMINI_MODEL) || GEMINI_DEFAULT_MODEL;
    addModel(models, seen, {
      appId,
      providerId: provider.id,
      providerName,
      modelId,
      baseUrl,
      apiKey,
    });
    return;
  }

  if (appId === 'opencode') {
    const options = recordValue(settings.options);
    const baseUrl = usableValue(options.baseURL ?? options.baseUrl ?? settings.baseURL ?? settings.baseUrl);
    const apiKey = usableValue(options.apiKey ?? settings.apiKey);
    collectOpenCodeModels(settings).forEach(({ id, label }) => {
      addModel(models, seen, {
        appId,
        providerId: provider.id,
        providerName,
        modelId: id,
        label,
        baseUrl,
        apiKey,
      });
    });
    return;
  }

  if (appId === 'openclaw' || appId === 'hermes') {
    const baseUrl = usableValue(settings.baseUrl ?? settings.base_url);
    const apiKey = usableValue(settings.apiKey ?? settings.api_key);
    const anthropicUrl = stringValue(settings.api).includes('anthropic') ? baseUrl : undefined;
    collectArrayModels(settings).forEach(({ id, label }) => {
      addModel(models, seen, {
        appId,
        providerId: provider.id,
        providerName,
        modelId: id,
        label,
        baseUrl,
        apiKey,
        anthropicUrl,
      });
    });
  }
}

function addUniversalProviderModels(
  provider: UniversalProvider,
  models: ModelConfig[],
  seen: Set<string>
) {
  const baseUrl = usableValue(provider.baseUrl);
  const apiKey = usableValue(provider.apiKey);
  if (!baseUrl) return;

  const providerName = provider.name || provider.id;
  if (provider.apps?.claude) {
    const claudeModels = uniqueStrings([
      provider.models?.claude?.model,
      provider.models?.claude?.haikuModel,
      provider.models?.claude?.sonnetModel,
      provider.models?.claude?.opusModel,
    ]);
    (claudeModels.length > 0 ? claudeModels : [CLAUDE_DEFAULT_MODEL]).forEach((modelId) => {
      addModel(models, seen, {
        appId: 'universal-claude',
        providerId: provider.id,
        providerName,
        modelId,
        baseUrl,
        apiKey,
        anthropicUrl: baseUrl,
      });
    });
  }

  if (provider.apps?.codex) {
    addModel(models, seen, {
      appId: 'universal-codex',
      providerId: provider.id,
      providerName,
      modelId: provider.models?.codex?.model || CODEX_DEFAULT_MODEL,
      baseUrl,
      apiKey,
    });
  }

  if (provider.apps?.gemini) {
    addModel(models, seen, {
      appId: 'universal-gemini',
      providerId: provider.id,
      providerName,
      modelId: provider.models?.gemini?.model || GEMINI_DEFAULT_MODEL,
      baseUrl,
      apiKey,
    });
  }
}

export async function loadEzSphereAgentModels(): Promise<ModelConfig[]> {
  const models: ModelConfig[] = [];
  const seen = new Set<string>();

  const providerResults = await Promise.allSettled(
    AGENT_APP_IDS.map(async (appId) => {
      const providers = await providersApi.getAll(appId);
      Object.values(providers ?? {}).forEach((provider) => {
        addProviderModels(appId, provider, models, seen);
      });
    })
  );

  providerResults.forEach((result) => {
    if (result.status === 'rejected') {
      console.warn('Load ezSphere providers failed:', result.reason);
    }
  });

  try {
    const universalProviders = await universalProvidersApi.getAll();
    Object.values(universalProviders ?? {}).forEach((provider) => {
      addUniversalProviderModels(provider, models, seen);
    });
  } catch (error) {
    console.warn('Load ezSphere universal providers failed:', error);
  }

  return models;
}
